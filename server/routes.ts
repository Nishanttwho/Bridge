import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { z } from "zod";
import { insertSignalSchema, insertSettingsSchema, insertSymbolMappingSchema, type WSMessage } from "@shared/schema";
import { mt5Service } from "./mt5-service";

// WebSocket clients tracking
const wsClients = new Set<WebSocket>();
const mt5WsClients = new Set<WebSocket>();

// Broadcast to all connected WebSocket clients
function broadcast(message: WSMessage) {
  wsClients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

// Send command to MT5 via WebSocket
function sendCommandToMT5(command: any) {
  const message = JSON.stringify(command);
  mt5WsClients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      console.log(`[MT5-WS] Sending command ${command.id} to MT5: ${command.action}`);
      client.send(message);
    }
  });
}

// Get pip value based on symbol (handles JPY, crypto, indices, metals)
function getPipValue(symbol: string): number {
  const upperSymbol = symbol.toUpperCase();
  
  // JPY pairs: pip = 0.01 (2-3 digits)
  if (upperSymbol.includes('JPY')) {
    return 0.01;
  }
  
  // Metals (XAUUSD, XAGUSD): pip = 0.01
  if (upperSymbol.includes('XAU') || upperSymbol.includes('XAG') || upperSymbol.includes('GOLD') || upperSymbol.includes('SILVER')) {
    return 0.01;
  }
  
  // Crypto pairs: use larger pip value
  if (upperSymbol.includes('BTC') || upperSymbol.includes('ETH') || upperSymbol.includes('XRP') || 
      upperSymbol.includes('LTC') || upperSymbol.includes('DOGE') || upperSymbol.includes('ADA')) {
    return 1.0;
  }
  
  // Indices: use point value
  if (upperSymbol.includes('US30') || upperSymbol.includes('NAS') || upperSymbol.includes('SPX') || 
      upperSymbol.includes('GER') || upperSymbol.includes('DAX') || upperSymbol.includes('FTSE')) {
    return 1.0;
  }
  
  // Standard forex pairs: pip = 0.0001 (4-5 digits)
  return 0.0001;
}

// Validate symbol format (allows broker suffixes like .e, .cash, _m, etc.)
function isValidSymbol(symbol: string): boolean {
  // Must be 3-30 characters, alphanumeric plus common broker suffixes
  return /^[A-Za-z0-9._-]{3,30}$/.test(symbol);
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

    // Calculate SL and TP based on settings with dynamic pip value
    const slPips = parseFloat(settings.defaultSlPips || '20');
    const tpPips = parseFloat(settings.defaultTpPips || '30');
    const pipValue = getPipValue(symbol); // Dynamic based on symbol type
    const slDistance = slPips * pipValue;
    const tpDistance = tpPips * pipValue;
    
    // Determine decimal places based on pip value
    let decimalPlaces = 5; // Default for standard forex
    if (pipValue >= 1.0) decimalPlaces = 2; // Crypto/indices
    else if (pipValue === 0.01) decimalPlaces = 3; // JPY/metals
    
    let stopLoss: number;
    let takeProfit: number;
    if (type === 'BUY') {
      stopLoss = parseFloat((entryPrice - slDistance).toFixed(decimalPlaces));
      takeProfit = parseFloat((entryPrice + tpDistance).toFixed(decimalPlaces));
    } else {
      stopLoss = parseFloat((entryPrice + slDistance).toFixed(decimalPlaces));
      takeProfit = parseFloat((entryPrice - tpDistance).toFixed(decimalPlaces));
    }

    // Calculate lot size based on risk settings
    const accountBalance = parseFloat(settings.accountBalance || '10000');
    const riskPercentage = parseFloat(settings.riskPercentage || '1');
    const volume = parseFloat(calculateLotSize(accountBalance, riskPercentage, slPips));

    // Close opposite trades before opening new one (if enabled)
    const autoCloseOnOppositeSignal = settings.autoCloseOnOppositeSignal === 'true';
    if (autoCloseOnOppositeSignal) {
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
    }

    // Execute trade in MT5
    const mt5Result = await mt5Service.executeTrade({
      symbol,
      type: type as 'BUY' | 'SELL',
      volume,
      stopLoss,
      takeProfit
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
      takeProfit: takeProfit.toString(),
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
      
      console.log(`[WEBHOOK] Raw payload:`, JSON.stringify(body));
      
      // Extract signal data (TradingView sends many different formats)
      // Support: {symbol, type, price}, {ticker, action, close}, {symbol, side, last}, etc.
      const tradingViewSymbol = body.symbol || body.ticker || body.pair || body.instrument || 'UNKNOWN';
      const signalType = body.type || body.action || body.side || body.signal || 'BUY';
      const signalPrice = body.price || body.close || body.last || body.entry || null;
      
      // Validate extracted data
      if (tradingViewSymbol === 'UNKNOWN') {
        console.log(`[WEBHOOK] No symbol found in payload`);
        return res.status(400).json({ 
          error: "Missing symbol in webhook payload",
          hint: "Include 'symbol', 'ticker', 'pair', or 'instrument' in your TradingView alert"
        });
      }
      
      // Normalize signal type (support: BUY/SELL, buy/sell, long/short, LONG/SHORT)
      let normalizedType = signalType.toString().toUpperCase();
      if (normalizedType === 'LONG') normalizedType = 'BUY';
      if (normalizedType === 'SHORT') normalizedType = 'SELL';
      
      if (normalizedType !== 'BUY' && normalizedType !== 'SELL') {
        console.log(`[WEBHOOK] Invalid signal type: ${signalType}`);
        return res.status(400).json({ 
          error: "Invalid signal type",
          received: signalType,
          expected: "BUY, SELL, LONG, or SHORT"
        });
      }
      
      // Map TradingView symbol to MT5 symbol
      const mt5Symbol = await storage.mapSymbol(tradingViewSymbol);
      
      const signalData = {
        type: normalizedType,
        symbol: mt5Symbol,
        price: signalPrice?.toString() || null,
        source: 'tradingview',
        status: 'pending',
      };

      // Validate signal
      const validatedSignal = insertSignalSchema.parse(signalData);
      
      console.log(`[WEBHOOK] Received signal: ${validatedSignal.type} ${validatedSignal.symbol} @ ${validatedSignal.price}`);
      
      // CRITICAL FIX 1: Extend duplicate check to 60 seconds (for 1-minute candles)
      // CRITICAL FIX 2: Check for signals that are 'pending' or 'executed' to prevent duplicates
      const recentSignals = await storage.getSignals(100);
      const now = Date.now();
      const sixtySecondsAgo = now - 60000; // Changed from 5 seconds to 60 seconds
      
      const isDuplicate = recentSignals.some(s => {
        const signalTime = new Date(s.timestamp).getTime();
        return (
          s.symbol === validatedSignal.symbol &&
          s.type === validatedSignal.type &&
          signalTime >= sixtySecondsAgo &&
          s.status !== 'failed' // Allow retrying failed signals
        );
      });
      
      if (isDuplicate) {
        console.log(`[WEBHOOK] Duplicate signal detected: ${validatedSignal.type} ${validatedSignal.symbol}, skipping`);
        return res.json({ 
          success: true, 
          message: 'Duplicate signal ignored',
          note: 'Signal received but already processed recently (within 60 seconds)'
        });
      }
      
      // Create signal
      const signal = await storage.createSignal(validatedSignal);
      console.log(`[WEBHOOK] Created signal ID: ${signal.id}`);

      // Broadcast signal to WebSocket clients
      broadcast({
        type: 'signal',
        data: signal,
      });

      // Check if auto-trade is enabled
      const settings = await storage.getSettings();
      if (settings && settings.autoTrade === 'true') {
        // Validate symbol
        if (!isValidSymbol(signal.symbol)) {
          console.log(`[WEBHOOK] Invalid symbol format: ${signal.symbol}`);
          await storage.updateSignalStatus(signal.id, 'failed', 'Invalid symbol format');
          return res.json({ 
            success: false, 
            error: 'Invalid symbol format',
            signalId: signal.id
          });
        }
        
        // Get configured TP/SL settings
        const slPips = parseFloat(settings.defaultSlPips || '20');
        const tpPips = parseFloat(settings.defaultTpPips || '30');
        const accountBalance = parseFloat(settings.accountBalance || '10000');
        const riskPercentage = parseFloat(settings.riskPercentage || '1');
        
        console.log(`[WEBHOOK] Settings - SL: ${slPips} pips, TP: ${tpPips} pips`);
        
        // Calculate SL and TP prices using dynamic pip value
        const entryPrice = parseFloat(signal.price || '0');
        if (entryPrice <= 0) {
          console.log(`[WEBHOOK] Invalid entry price: ${signal.price}`);
          await storage.updateSignalStatus(signal.id, 'failed', 'Invalid entry price');
          return res.json({ 
            success: false, 
            error: 'Invalid entry price',
            signalId: signal.id
          });
        }
        
        const pipValue = getPipValue(signal.symbol); // Dynamic based on symbol type
        const slDistance = slPips * pipValue;
        const tpDistance = tpPips * pipValue;
        
        let stopLoss: number | null = null;
        let takeProfit: number | null = null;
        
        if (entryPrice > 0) {
          // Determine decimal places based on pip value
          let decimalPlaces = 5; // Default for standard forex
          if (pipValue >= 1.0) decimalPlaces = 2; // Crypto/indices
          else if (pipValue === 0.01) decimalPlaces = 3; // JPY/metals
          
          if (signal.type === 'BUY') {
            stopLoss = parseFloat((entryPrice - slDistance).toFixed(decimalPlaces));
            takeProfit = parseFloat((entryPrice + tpDistance).toFixed(decimalPlaces));
          } else { // SELL
            stopLoss = parseFloat((entryPrice + slDistance).toFixed(decimalPlaces));
            takeProfit = parseFloat((entryPrice - tpDistance).toFixed(decimalPlaces));
          }
          
          console.log(`[WEBHOOK] Calculated - Entry: ${entryPrice}, SL: ${stopLoss} (${slPips} pips), TP: ${takeProfit} (${tpPips} pips), PipValue: ${pipValue}, Decimals: ${decimalPlaces}`);
        }

        // Calculate lot size based on configured risk
        const volume = parseFloat(calculateLotSize(accountBalance, riskPercentage, slPips));
        console.log(`[WEBHOOK] Calculated volume: ${volume}`);

        // CRITICAL FIX 3: Update signal status to 'pending' BEFORE enqueueing command
        await storage.updateSignalStatus(signal.id, 'pending');

        // CRITICAL FIX 4: Check if there's already a pending command for this signal
        const pendingCommands = await storage.getPendingCommands();
        const existingCommand = pendingCommands.find(cmd => cmd.signalId === signal.id);
        
        if (existingCommand) {
          console.log(`[WEBHOOK] Command already exists for signal ${signal.id}, skipping duplicate command creation`);
          return res.json({ 
            success: true, 
            signalId: signal.id,
            message: 'Signal already has pending command, prevented duplicate' 
          });
        }

        // Auto-close opposite positions if enabled (same symbol only)
        const autoCloseOnOppositeSignal = settings.autoCloseOnOppositeSignal === 'true';
        if (autoCloseOnOppositeSignal) {
          const oppositeType = signal.type === 'BUY' ? 'SELL' : 'BUY';
          const oppositeTrades = await storage.getOpenTradesByType(oppositeType);
          
          // Filter to only close trades for the SAME symbol
          const oppositeTradesForSymbol = oppositeTrades.filter(t => t.symbol === signal.symbol);
          
          console.log(`[WEBHOOK] Found ${oppositeTradesForSymbol.length} opposite trades to close for ${signal.symbol}`);
          
          for (const oppositeTrade of oppositeTradesForSymbol) {
            const positionId = oppositeTrade.mt5PositionId || oppositeTrade.mt5OrderId;
            if (positionId) {
              // Queue close command
              const closeCommand = await storage.enqueueCommand({
                action: 'CLOSE',
                positionId: positionId,
                status: 'pending',
              });
              console.log(`[WEBHOOK] Queued close command for position ${positionId}`);
              
              // Send close command to MT5 via WebSocket (if connected)
              sendCommandToMT5({
                id: closeCommand.id,
                action: 'CLOSE',
                positionId: positionId,
              });
            }
            
            // Mark trade as closing
            const closePrice = signal.price || oppositeTrade.openPrice || '0';
            const profit = calculateProfit(oppositeTrade, closePrice);
            await storage.closeTrade(oppositeTrade.id, closePrice, profit);
          }
        }

        // Enqueue TRADE command for MT5 to execute
        const tradeCommand = await storage.enqueueCommand({
          action: 'TRADE',
          symbol: signal.symbol,
          type: signal.type,
          volume: volume.toString(),
          stopLoss: stopLoss ? stopLoss.toString() : null,
          takeProfit: takeProfit ? takeProfit.toString() : null,
          signalId: signal.id,
          status: 'pending',
        });

        console.log(`[WEBHOOK] Enqueued trade command ${tradeCommand.id} for signal ${signal.id}`);
        
        // Send command to MT5 via WebSocket (if connected)
        sendCommandToMT5({
          id: tradeCommand.id,
          action: tradeCommand.action,
          symbol: tradeCommand.symbol,
          type: tradeCommand.type,
          volume: tradeCommand.volume ? parseFloat(tradeCommand.volume) : undefined,
          stopLoss: tradeCommand.stopLoss ? parseFloat(tradeCommand.stopLoss) : undefined,
          takeProfit: tradeCommand.takeProfit ? parseFloat(tradeCommand.takeProfit) : undefined,
        });
      }

      res.json({ 
        success: true, 
        signalId: signal.id,
        message: 'Signal received and queued for execution' 
      });
    } catch (error) {
      console.error('[WEBHOOK] Error:', error);
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
        console.log('[MT5-POLL] Unauthorized access attempt');
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Update heartbeat
      await storage.updateMt5Heartbeat();

      // Get next pending command
      const command = await storage.getNextPendingCommand();
      
      if (!command) {
        // No commands - return 204 No Content (this is normal, happens every second)
        return res.status(204).send();
      }

      // Mark as sent
      await storage.markCommandAsSent(command.id);

      console.log(`[MT5-POLL] Sending command ${command.id} to MT5: ${command.action} ${command.symbol || ''} ${command.type || ''}`);
      if (command.stopLoss || command.takeProfit) {
        console.log(`[MT5-POLL] SL: ${command.stopLoss}, TP: ${command.takeProfit}`);
      }

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
      console.error('[MT5-POLL] Error:', error);
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
        console.log('[MT5-REPORT] Unauthorized access attempt');
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { commandId, success, orderId, positionId, error: errorMessage } = req.body;

      if (!commandId) {
        console.log('[MT5-REPORT] Missing commandId in report');
        return res.status(400).json({ error: "commandId is required" });
      }

      // Log the report for debugging
      console.log(`[MT5-REPORT] Received - commandId: ${commandId}, success: ${success}, orderId: ${orderId || 'none'}, positionId: ${positionId || 'none'}, error: ${errorMessage || 'none'}`);

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

      // Get the command to find associated signal
      const command = await storage.getCommandById(commandId);
      
      if (!command) {
        console.log(`[MT5-REPORT] WARNING: Command ${commandId} not found in storage`);
        return res.json({ success: true, warning: 'Command not found' });
      }

      console.log(`[MT5-REPORT] Command ${commandId} is for signal ${command.signalId || 'none'}, action: ${command.action}`);

      // Mark command as acknowledged or failed
      if (success) {
        await storage.markCommandAsAcknowledged(commandId);
        console.log(`[MT5-REPORT] Command ${commandId} marked as acknowledged`);
        
        if (command?.signalId) {
          await storage.updateSignalStatus(command.signalId, 'executed');
          console.log(`[MT5-REPORT] Signal ${command.signalId} marked as executed`);
          
          // Create trade record
          if (command.action === 'TRADE' && command.symbol && command.type) {
            const trade = await storage.createTrade({
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
            console.log(`[MT5-REPORT] Created trade record ${trade.id} for signal ${command.signalId}`);
          }

          // Broadcast updated signal
          const updatedSignal = await storage.getSignalById(command.signalId);
          if (updatedSignal) {
            broadcast({
              type: 'signal',
              data: updatedSignal,
            });
          }
        }
      } else {
        // Trade execution failed
        await storage.markCommandAsFailed(commandId, errorMessage || 'Unknown error');
        console.log(`[MT5-REPORT] Command ${commandId} marked as failed: ${errorMessage || 'Unknown error'}`);
        
        // Update signal status to failed
        if (command?.signalId) {
          await storage.updateSignalStatus(command.signalId, 'failed', errorMessage || 'Trade execution failed in MT5');
          console.log(`[MT5-REPORT] Signal ${command.signalId} marked as failed`);
          
          // Broadcast updated signal with error
          const updatedSignal = await storage.getSignalById(command.signalId);
          if (updatedSignal) {
            broadcast({
              type: 'signal',
              data: updatedSignal,
            });
          }
        }
      }

      // Broadcast stats update
      const stats = await storage.getStats();
      broadcast({
        type: 'stats',
        data: stats,
      });

      res.json({ success: true });
    } catch (error) {
      console.error('[MT5-REPORT] Error:', error);
      res.status(500).json({ error: "Failed to process report" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket server setup for frontend clients (noServer: true to handle upgrade manually)
  const wss = new WebSocketServer({ noServer: true });

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

  // MT5 WebSocket server setup (separate endpoint with noServer option)
  const mt5Wss = new WebSocketServer({ noServer: true });

  mt5Wss.on('connection', async (ws: WebSocket, req) => {
    console.log('[MT5-WS] MT5 client connected successfully');
    mt5WsClients.add(ws);
    
    // Update heartbeat
    await storage.updateMt5Heartbeat();

    // Send any pending commands immediately
    const pendingCommands = await storage.getPendingCommands();
    for (const command of pendingCommands) {
      sendCommandToMT5({
        id: command.id,
        action: command.action,
        symbol: command.symbol,
        type: command.type,
        volume: command.volume ? parseFloat(command.volume) : undefined,
        stopLoss: command.stopLoss ? parseFloat(command.stopLoss) : undefined,
        takeProfit: command.takeProfit ? parseFloat(command.takeProfit) : undefined,
        positionId: command.positionId,
      });
      // Mark as sent
      await storage.markCommandAsSent(command.id);
    }

    // Broadcast stats update (connection status)
    const stats = await storage.getStats();
    broadcast({
      type: 'stats',
      data: stats,
    });

    // Handle messages from MT5 (execution reports)
    ws.on('message', async (data: Buffer) => {
      try {
        const report = JSON.parse(data.toString());
        console.log(`[MT5-WS] Received report:`, report);

        const { commandId, success, orderId, positionId, error: errorMessage } = report;

        if (!commandId) {
          console.log('[MT5-WS] Missing commandId in report');
          return;
        }

        const command = await storage.getCommandById(commandId);
        if (!command) {
          console.log(`[MT5-WS] Command ${commandId} not found`);
          ws.send(JSON.stringify({ success: true, warning: 'Command not found' }));
          return;
        }

        // Store execution result
        await storage.createExecutionResult({
          success: success ? 'true' : 'false',
          commandId,
          orderId: orderId || null,
          positionId: positionId || null,
          errorMessage: errorMessage || null,
        });

        // Mark command as acknowledged
        await storage.markCommandAsAcknowledged(commandId);
        console.log(`[MT5-WS] Command ${commandId} acknowledged`);

        // Update associated signal and trade
        if (command.signalId) {
          if (success && orderId) {
            await storage.updateSignalStatus(command.signalId, 'executed');
            
            const signal = await storage.getSignalById(command.signalId);
            if (signal && command.action === 'TRADE') {
              await storage.createTrade({
                signalId: command.signalId,
                symbol: signal.symbol,
                type: signal.type,
                openPrice: signal.price || '0',
                volume: command.volume || '0',
                mt5OrderId: orderId,
                mt5PositionId: positionId || orderId,
                stopLoss: command.stopLoss,
                takeProfit: command.takeProfit,
                status: 'open',
              });
              console.log(`[MT5-WS] Trade created for signal ${command.signalId}`);
            }

            const updatedSignal = await storage.getSignalById(command.signalId);
            if (updatedSignal) {
              broadcast({
                type: 'signal',
                data: updatedSignal,
              });
            }
          } else {
            await storage.updateSignalStatus(command.signalId, 'failed', errorMessage || 'Trade execution failed in MT5');
            console.log(`[MT5-WS] Signal ${command.signalId} marked as failed`);
            
            const updatedSignal = await storage.getSignalById(command.signalId);
            if (updatedSignal) {
              broadcast({
                type: 'signal',
                data: updatedSignal,
              });
            }
          }
        }

        // Broadcast stats update
        const updatedStats = await storage.getStats();
        broadcast({
          type: 'stats',
          data: updatedStats,
        });

        // Send acknowledgment to MT5
        ws.send(JSON.stringify({ success: true }));
      } catch (error) {
        console.error('[MT5-WS] Error processing report:', error);
        ws.send(JSON.stringify({ success: false, error: 'Failed to process report' }));
      }
    });

    ws.on('close', () => {
      console.log('[MT5-WS] MT5 client disconnected');
      mt5WsClients.delete(ws);
      
      // Broadcast stats update (connection status)
      storage.getStats().then(stats => {
        broadcast({
          type: 'stats',
          data: stats,
        });
      });
    });

    ws.on('error', (error) => {
      console.error('[MT5-WS] WebSocket error:', error);
      mt5WsClients.delete(ws);
    });
  });

  // Manual upgrade handler for all WebSocket connections
  httpServer.on('upgrade', async (request, socket, head) => {
    const pathname = new URL(request.url || '', `http://${request.headers.host}`).pathname;
    
    console.log('[WS] Upgrade request for:', pathname);
    
    if (pathname === '/ws') {
      // Handle frontend WebSocket upgrades
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } else if (pathname === '/mt5-ws') {
      // Handle MT5 WebSocket upgrades
      console.log('[MT5-WS] Handling upgrade request from:', request.headers.host);
      
      // Extract API secret from query params or headers
      const url = new URL(request.url || '', `http://${request.headers.host}`);
      const apiSecret = url.searchParams.get('secret') || request.headers['x-mt5-api-secret'] as string;
      
      // Verify API secret before upgrading
      const settings = await storage.getSettings();
      if (settings?.mt5ApiSecret && apiSecret !== settings.mt5ApiSecret) {
        console.log('[MT5-WS] Unauthorized upgrade attempt - invalid secret');
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }
      
      console.log('[MT5-WS] API secret verified, upgrading connection');
      
      // Handle the upgrade
      mt5Wss.handleUpgrade(request, socket, head, (ws) => {
        mt5Wss.emit('connection', ws, request);
      });
    } else {
      // Reject unknown WebSocket paths
      console.log('[WS] Unknown WebSocket path:', pathname);
      socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
      socket.destroy();
    }
  });

  return httpServer;
}
