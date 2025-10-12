import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { z } from "zod";
import { insertSignalSchema, insertSettingsSchema, type WSMessage } from "@shared/schema";

// WebSocket clients tracking
const wsClients = new Set<WebSocket>();

// Broadcast to all connected WebSocket clients
function broadcast(message: WSMessage) {
  wsClients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

// Simulated MT5 trade execution
async function executeTrade(signalId: string, type: string, symbol: string, price?: string) {
  try {
    const settings = await storage.getSettings();
    
    if (!settings || settings.autoTrade !== 'true') {
      await storage.updateSignalStatus(signalId, 'failed', 'Auto-trade is disabled');
      return;
    }

    // Create trade record
    const trade = await storage.createTrade({
      signalId,
      symbol,
      type,
      volume: settings.defaultLotSize || '0.01',
      openPrice: price || '0',
      status: 'open',
      mt5OrderId: `MT5-${Date.now()}`, // Simulated MT5 order ID
    });

    // Update signal status
    await storage.updateSignalStatus(signalId, 'executed');

    // Get updated signal and broadcast
    const updatedSignal = await storage.getSignalById(signalId);
    if (updatedSignal) {
      broadcast({
        type: 'signal',
        data: updatedSignal,
      });
    }

    // Broadcast trade update
    broadcast({
      type: 'trade',
      data: trade,
    });

    // Broadcast stats update
    const stats = await storage.getStats();
    broadcast({
      type: 'stats',
      data: stats,
    });

  } catch (error) {
    console.error('Trade execution error:', error);
    await storage.updateSignalStatus(
      signalId, 
      'failed', 
      error instanceof Error ? error.message : 'Unknown error'
    );

    // Broadcast failed signal update
    const updatedSignal = await storage.getSignalById(signalId);
    if (updatedSignal) {
      broadcast({
        type: 'signal',
        data: updatedSignal,
      });
    }

    // Broadcast updated stats
    const stats = await storage.getStats();
    broadcast({
      type: 'stats',
      data: stats,
    });
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Get dashboard stats
  app.get("/api/stats", async (_req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // Get signals
  app.get("/api/signals", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const signals = await storage.getSignals(limit);
      res.json(signals);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch signals" });
    }
  });

  // TradingView webhook endpoint
  app.post("/api/webhook", async (req, res) => {
    try {
      // Parse TradingView alert payload
      const body = req.body;
      
      // Extract signal data (TradingView sends different formats)
      const signalData = {
        type: body.type || body.action || 'BUY',
        symbol: body.symbol || body.ticker || 'UNKNOWN',
        price: body.price?.toString() || body.close?.toString(),
        source: 'tradingview',
        status: 'pending',
      };

      // Validate signal
      const validatedSignal = insertSignalSchema.parse(signalData);
      
      // Create signal
      const signal = await storage.createSignal(validatedSignal);

      // Broadcast signal to WebSocket clients
      broadcast({
        type: 'signal',
        data: signal,
      });

      // Execute trade asynchronously
      executeTrade(signal.id, signal.type, signal.symbol, signal.price || undefined);

      res.json({ 
        success: true, 
        signalId: signal.id,
        message: 'Signal received and processing' 
      });
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(400).json({ 
        error: "Invalid signal data",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get settings
  app.get("/api/settings", async (_req, res) => {
    try {
      const settings = await storage.getSettings();
      
      // Return default settings if none exist
      if (!settings) {
        res.json({
          id: 'default',
          mt5Server: '',
          mt5Login: '',
          mt5Password: '',
          defaultLotSize: '0.01',
          maxSpread: 3,
          slippage: 3,
          autoTrade: 'true',
          webhookUrl: '',
        });
        return;
      }

      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  // Update settings
  app.post("/api/settings", async (req, res) => {
    try {
      const validatedSettings = insertSettingsSchema.parse(req.body);
      const settings = await storage.upsertSettings(validatedSettings);
      
      // Broadcast connection status update
      const stats = await storage.getStats();
      broadcast({
        type: 'stats',
        data: stats,
      });

      res.json(settings);
    } catch (error) {
      console.error('Settings update error:', error);
      res.status(400).json({ 
        error: "Invalid settings data",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get trades
  app.get("/api/trades", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const trades = await storage.getTrades(limit);
      res.json(trades);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch trades" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket server setup
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    console.log('WebSocket client connected');
    wsClients.add(ws);

    // Send initial stats
    storage.getStats().then(stats => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'stats',
          data: stats,
        }));
      }
    });

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      wsClients.delete(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      wsClients.delete(ws);
    });
  });

  return httpServer;
}
