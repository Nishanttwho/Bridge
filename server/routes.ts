import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { z } from "zod";
import { insertSignalSchema, insertSettingsSchema, insertSymbolMappingSchema, type WSMessage } from "@shared/schema";
import { mt5Service } from "./mt5-service";

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

// Calculate lot size based on 1% risk
function calculateLotSize(accountBalance: number, riskPercentage: number, slPips: number): string {
  // Risk amount in account currency
  const riskAmount = (accountBalance * riskPercentage) / 100;
  
  // For standard lot (100,000 units), 1 pip = $10 for most pairs
  // For 20 pips SL: risk per standard lot = 20 * $10 = $200
  const pipValue = 10; // Standard pip value for 1 standard lot
  const riskPerStandardLot = slPips * pipValue;
  
  // Calculate lot size: riskAmount / riskPerStandardLot
  const lotSize = riskAmount / riskPerStandardLot;
  
  // Return with 2 decimal places, minimum 0.01
  // Note: For very small balances (<$200), the minimum 0.01 lot will result in
  // slightly higher than configured risk percentage due to broker minimum lot sizes
  return Math.max(0.01, Number(lotSize.toFixed(2))).toString();
}

// Real MT5 trade execution using MetaApi
async function executeTrade(signalId: string, type: string, symbol: string, price?: string) {
  try {
    const settings = await storage.getSettings();
    
    if (!settings || settings.autoTrade !== 'true') {
      await storage.updateSignalStatus(signalId, 'failed', 'Auto-trade is disabled');
      return;
    }

    // Initialize MT5 connection if not already connected
    if (!mt5Service.getConnectionStatus()) {
      const connected = await mt5Service.initialize(settings);
      if (!connected) {
        await storage.updateSignalStatus(signalId, 'failed', 'MT5 connection failed');
        return;
      }
    }

    const entryPrice = parseFloat(price || '0');
    if (entryPrice === 0) {
      await storage.updateSignalStatus(signalId, 'failed', 'Invalid entry price');
      return;
    }

    // Calculate SL based on trade type (20 pips = 0.0020 for most pairs)
    const slPips = 20;
    const pipValue = 0.0001; // 1 pip for most forex pairs
    const slDistance = slPips * pipValue;
    
    let stopLoss: number;
    if (type === 'BUY') {
      stopLoss = parseFloat((entryPrice - slDistance).toFixed(5));
    } else {
      stopLoss = parseFloat((entryPrice + slDistance).toFixed(5));
    }

    // Calculate lot size based on 1% risk
    const accountBalance = parseFloat(settings.accountBalance || '10000');
    const riskPercentage = parseFloat(settings.riskPercentage || '1');
    const volume = parseFloat(calculateLotSize(accountBalance, riskPercentage, slPips));

    // Close opposite trades before opening new one
    const oppositeType = type === 'BUY' ? 'SELL' : 'BUY';
    const oppositeTrades = await storage.getOpenTradesByType(oppositeType);
    
    for (const oppositeTrade of oppositeTrades) {
      // Use position ID if available, otherwise fall back to order ID
      const positionId = oppositeTrade.mt5PositionId || oppositeTrade.mt5OrderId;
      if (positionId) {
        const closeResult = await mt5Service.closePosition(positionId);
        if (!closeResult.success) {
          console.error(`Failed to close position ${positionId}: ${closeResult.error}`);
        }
      }
      
      const closePrice = price || oppositeTrade.openPrice || '0';
      const profit = calculateProfit(oppositeTrade, closePrice);
      await storage.closeTrade(oppositeTrade.id, closePrice, profit);
      
      // Broadcast closed trade
      const closedTrade = await storage.getTradeById(oppositeTrade.id);
      if (closedTrade) {
        broadcast({
          type: 'trade',
          data: closedTrade,
        });
      }
    }

    // Execute trade in MT5
    const mt5Result = await mt5Service.executeTrade({
      symbol,
      type: type as 'BUY' | 'SELL',
      volume,
      stopLoss,
      takeProfit: undefined
    });

    if (!mt5Result.success) {
      await storage.updateSignalStatus(signalId, 'failed', mt5Result.error || 'Trade execution failed');
      
      // Broadcast failed signal
      const updatedSignal = await storage.getSignalById(signalId);
      if (updatedSignal) {
        broadcast({
          type: 'signal',
          data: updatedSignal,
        });
      }
      return;
    }

    // Create trade record - store both orderId and positionId
    const trade = await storage.createTrade({
      signalId,
      symbol,
      type,
      volume: volume.toString(),
      openPrice: price || '0',
      stopLoss: stopLoss.toString(),
      takeProfit: null,
      status: 'open',
      mt5OrderId: mt5Result.orderId || `MT5-${Date.now()}`,
      mt5PositionId: mt5Result.positionId || null,
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

// Calculate profit for a trade
function calculateProfit(trade: { type: string; volume: string; openPrice: string | null }, closePrice: string): string {
  const volume = parseFloat(trade.volume);
  const open = parseFloat(trade.openPrice || '0');
  const close = parseFloat(closePrice);
  
  if (open === 0 || close === 0) return '0';
  
  const pipValue = 10; // $10 per pip for standard lot
  const priceDiff = trade.type === 'BUY' ? (close - open) : (open - close);
  const pips = priceDiff / 0.0001; // Convert price difference to pips
  const profit = pips * pipValue * volume;
  
  return profit.toFixed(2);
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Get dashboard stats
  app.get("/api/stats", async (_req, res) => {
    try {
      const stats = await storage.getStats();
      // Use heartbeat-based connection status (HTTP polling system)
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
      const tradingViewSymbol = body.symbol || body.ticker || 'UNKNOWN';
      
      // Map TradingView symbol to MT5 symbol
      const mt5Symbol = await storage.mapSymbol(tradingViewSymbol);
      
      const signalData = {
        type: body.type || body.action || 'BUY',
        symbol: mt5Symbol,
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

      // Check if auto-trade is enabled
      const settings = await storage.getSettings();
      if (settings && settings.autoTrade === 'true') {
        // Calculate lot size and stop loss
        const entryPrice = parseFloat(signal.price || '0');
        const slPips = 20;
        const pipValue = 0.0001;
        const slDistance = slPips * pipValue;
        
        let stopLoss: number | null = null;
        if (entryPrice > 0) {
          if (signal.type === 'BUY') {
            stopLoss = parseFloat((entryPrice - slDistance).toFixed(5));
          } else {
            stopLoss = parseFloat((entryPrice + slDistance).toFixed(5));
          }
        }

        const accountBalance = parseFloat(settings.accountBalance || '10000');
        const riskPercentage = parseFloat(settings.riskPercentage || '1');
        const volume = parseFloat(calculateLotSize(accountBalance, riskPercentage, slPips));

        // Enqueue command for MT5 to execute (use mapped MT5 symbol)
        await storage.enqueueCommand({
          action: 'TRADE',
          symbol: signal.symbol,
          type: signal.type,
          volume: volume.toString(),
          stopLoss: stopLoss ? stopLoss.toString() : null,
          takeProfit: null,
          signalId: signal.id,
          status: 'pending',
        });

        // Update signal status to show it's queued
        await storage.updateSignalStatus(signal.id, 'pending');
      }

      res.json({ 
        success: true, 
        signalId: signal.id,
        message: 'Signal received and queued for execution' 
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
          mt5ApiSecret: null,
          accountBalance: '10000',
          riskPercentage: '1',
          autoTrade: 'true',
          lastMt5Heartbeat: null,
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

  // Get symbol mappings
  app.get("/api/symbol-mappings", async (_req, res) => {
    try {
      const mappings = await storage.getSymbolMappings();
      res.json(mappings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch symbol mappings" });
    }
  });

  // Create symbol mapping
  app.post("/api/symbol-mappings", async (req, res) => {
    try {
      const validatedMapping = insertSymbolMappingSchema.parse(req.body);
      const mapping = await storage.createSymbolMapping(validatedMapping);
      res.json(mapping);
    } catch (error) {
      console.error('Symbol mapping creation error:', error);
      res.status(400).json({ 
        error: "Failed to create symbol mapping",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Delete symbol mapping
  app.delete("/api/symbol-mappings/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteSymbolMapping(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Symbol mapping deletion error:', error);
      res.status(500).json({ error: "Failed to delete symbol mapping" });
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

  // MT5 Polling Endpoint - Get next pending command
  app.get("/api/mt5/next-command", async (req, res) => {
    try {
      // Verify API secret
      const settings = await storage.getSettings();
      const apiSecret = req.headers['x-mt5-api-secret'] as string;
      
      if (settings?.mt5ApiSecret && apiSecret !== settings.mt5ApiSecret) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Update heartbeat
      await storage.updateMt5Heartbeat();

      // Get next pending command
      const command = await storage.getNextPendingCommand();
      
      if (!command) {
        // No commands - return 204 No Content
        return res.status(204).send();
      }

      // Mark as sent
      await storage.markCommandAsSent(command.id);

      // Return command
      res.json({
        id: command.id,
        action: command.action,
        symbol: command.symbol,
        type: command.type,
        volume: command.volume ? parseFloat(command.volume) : undefined,
        stopLoss: command.stopLoss ? parseFloat(command.stopLoss) : undefined,
        takeProfit: command.takeProfit ? parseFloat(command.takeProfit) : undefined,
        positionId: command.positionId,
      });

      // Broadcast stats update (connection status)
      const stats = await storage.getStats();
      broadcast({
        type: 'stats',
        data: stats,
      });
    } catch (error) {
      console.error('MT5 polling error:', error);
      res.status(500).json({ error: "Failed to get next command" });
    }
  });

  // MT5 Report Endpoint - Receive execution results
  app.post("/api/mt5/report", async (req, res) => {
    try {
      // Verify API secret
      const settings = await storage.getSettings();
      const apiSecret = req.headers['x-mt5-api-secret'] as string;
      
      if (settings?.mt5ApiSecret && apiSecret !== settings.mt5ApiSecret) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { commandId, success, orderId, positionId, error: errorMessage } = req.body;

      if (!commandId) {
        return res.status(400).json({ error: "commandId is required" });
      }

      // Update heartbeat
      await storage.updateMt5Heartbeat();

      // Store execution result
      await storage.createExecutionResult({
        commandId,
        success: success ? 'true' : 'false',
        orderId: orderId || null,
        positionId: positionId || null,
        errorMessage: errorMessage || null,
        responseData: JSON.stringify(req.body),
      });

      // Mark command as acknowledged or failed
      if (success) {
        await storage.markCommandAsAcknowledged(commandId);
        
        // Get the specific command by ID to find associated signal
        const command = await storage.getCommandById(commandId);
        if (command?.signalId) {
          await storage.updateSignalStatus(command.signalId, 'executed');
          
          // Create trade record
          if (command.action === 'TRADE' && command.symbol && command.type) {
            await storage.createTrade({
              signalId: command.signalId,
              symbol: command.symbol,
              type: command.type,
              volume: command.volume || '0.01',
              openPrice: null,
              stopLoss: command.stopLoss || null,
              takeProfit: command.takeProfit || null,
              status: 'open',
              mt5OrderId: orderId || null,
              mt5PositionId: positionId || null,
            });
          }
        }
      } else {
        await storage.markCommandAsFailed(commandId, errorMessage || 'Unknown error');
      }

      // Broadcast stats update
      const stats = await storage.getStats();
      broadcast({
        type: 'stats',
        data: stats,
      });

      res.json({ success: true });
    } catch (error) {
      console.error('MT5 report error:', error);
      res.status(500).json({ error: "Failed to process report" });
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
