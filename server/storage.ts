import { 
  type Signal, 
  type InsertSignal,
  type Trade,
  type InsertTrade,
  type Settings,
  type InsertSettings,
  type DashboardStats,
  type Mt5Command,
  type InsertMt5Command,
  type Mt5ExecutionResult,
  type InsertMt5ExecutionResult
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Signals
  createSignal(signal: InsertSignal): Promise<Signal>;
  getSignals(limit?: number): Promise<Signal[]>;
  getSignalById(id: string): Promise<Signal | undefined>;
  updateSignalStatus(id: string, status: string, errorMessage?: string): Promise<void>;
  
  // Trades
  createTrade(trade: InsertTrade): Promise<Trade>;
  getTrades(limit?: number): Promise<Trade[]>;
  getTradeById(id: string): Promise<Trade | undefined>;
  updateTradeStatus(id: string, status: string): Promise<void>;
  getOpenTradesByType(type: string): Promise<Trade[]>;
  closeTrade(id: string, closePrice: string, profit: string): Promise<void>;
  
  // Settings
  getSettings(): Promise<Settings | undefined>;
  upsertSettings(settings: InsertSettings): Promise<Settings>;
  updateMt5Heartbeat(): Promise<void>;
  
  // MT5 Command Queue
  enqueueCommand(command: InsertMt5Command): Promise<Mt5Command>;
  getNextPendingCommand(): Promise<Mt5Command | undefined>;
  markCommandAsSent(commandId: string): Promise<void>;
  markCommandAsAcknowledged(commandId: string): Promise<void>;
  markCommandAsFailed(commandId: string, errorMessage: string): Promise<void>;
  getPendingCommands(): Promise<Mt5Command[]>;
  
  // MT5 Execution Results
  createExecutionResult(result: InsertMt5ExecutionResult): Promise<Mt5ExecutionResult>;
  
  // Stats
  getStats(): Promise<DashboardStats>;
}

export class MemStorage implements IStorage {
  private signals: Map<string, Signal>;
  private trades: Map<string, Trade>;
  private settings: Settings | undefined;
  private mt5Commands: Map<string, Mt5Command>;
  private mt5ExecutionResults: Map<string, Mt5ExecutionResult>;

  constructor() {
    this.signals = new Map();
    this.trades = new Map();
    this.settings = undefined;
    this.mt5Commands = new Map();
    this.mt5ExecutionResults = new Map();
  }

  // Signals
  async createSignal(insertSignal: InsertSignal): Promise<Signal> {
    const id = randomUUID();
    const signal: Signal = {
      ...insertSignal,
      id,
      timestamp: new Date(),
      status: insertSignal.status || 'pending',
      source: insertSignal.source || 'tradingview',
      price: insertSignal.price ?? null,
      errorMessage: insertSignal.errorMessage ?? null,
    };
    this.signals.set(id, signal);
    return signal;
  }

  async getSignals(limit: number = 50): Promise<Signal[]> {
    const allSignals = Array.from(this.signals.values());
    return allSignals
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  async getSignalById(id: string): Promise<Signal | undefined> {
    return this.signals.get(id);
  }

  async updateSignalStatus(id: string, status: string, errorMessage?: string): Promise<void> {
    const signal = this.signals.get(id);
    if (signal) {
      signal.status = status;
      if (errorMessage) {
        signal.errorMessage = errorMessage;
      }
      this.signals.set(id, signal);
    }
  }

  // Trades
  async createTrade(insertTrade: InsertTrade): Promise<Trade> {
    const id = randomUUID();
    const trade: Trade = {
      ...insertTrade,
      id,
      openTime: new Date(),
      status: insertTrade.status || 'open',
      signalId: insertTrade.signalId ?? null,
      openPrice: insertTrade.openPrice ?? null,
      closePrice: insertTrade.closePrice ?? null,
      stopLoss: insertTrade.stopLoss ?? null,
      takeProfit: insertTrade.takeProfit ?? null,
      profit: insertTrade.profit ?? null,
      mt5OrderId: insertTrade.mt5OrderId ?? null,
      mt5PositionId: insertTrade.mt5PositionId ?? null,
      closeTime: insertTrade.closeTime ?? null,
      errorMessage: insertTrade.errorMessage ?? null,
    };
    this.trades.set(id, trade);
    return trade;
  }

  async getTrades(limit: number = 50): Promise<Trade[]> {
    const allTrades = Array.from(this.trades.values());
    return allTrades
      .sort((a, b) => new Date(b.openTime).getTime() - new Date(a.openTime).getTime())
      .slice(0, limit);
  }

  async getTradeById(id: string): Promise<Trade | undefined> {
    return this.trades.get(id);
  }

  async updateTradeStatus(id: string, status: string): Promise<void> {
    const trade = this.trades.get(id);
    if (trade) {
      trade.status = status;
      if (status === 'closed') {
        trade.closeTime = new Date();
      }
      this.trades.set(id, trade);
    }
  }

  async getOpenTradesByType(type: string): Promise<Trade[]> {
    const allTrades = Array.from(this.trades.values());
    return allTrades.filter(t => t.status === 'open' && t.type === type);
  }

  async closeTrade(id: string, closePrice: string, profit: string): Promise<void> {
    const trade = this.trades.get(id);
    if (trade) {
      trade.status = 'closed';
      trade.closePrice = closePrice;
      trade.profit = profit;
      trade.closeTime = new Date();
      this.trades.set(id, trade);
    }
  }

  // Settings
  async getSettings(): Promise<Settings | undefined> {
    return this.settings;
  }

  async upsertSettings(insertSettings: InsertSettings): Promise<Settings> {
    const id = this.settings?.id || randomUUID();
    const settings: Settings = {
      ...insertSettings,
      id,
      mt5ApiSecret: insertSettings.mt5ApiSecret ?? null,
      webhookUrl: insertSettings.webhookUrl ?? null,
      accountBalance: typeof insertSettings.accountBalance === 'number' 
        ? insertSettings.accountBalance.toString() 
        : insertSettings.accountBalance || '10000',
      riskPercentage: typeof insertSettings.riskPercentage === 'number'
        ? insertSettings.riskPercentage.toString()
        : insertSettings.riskPercentage || '1',
      defaultLotSize: insertSettings.defaultLotSize || '0.01',
      autoTrade: insertSettings.autoTrade || 'true',
      maxSpread: insertSettings.maxSpread ?? null,
      slippage: insertSettings.slippage ?? null,
      lastMt5Heartbeat: this.settings?.lastMt5Heartbeat ?? null,
    };
    this.settings = settings;
    return settings;
  }

  async updateMt5Heartbeat(): Promise<void> {
    if (this.settings) {
      this.settings.lastMt5Heartbeat = new Date();
    }
  }

  // MT5 Command Queue
  async enqueueCommand(insertCommand: InsertMt5Command): Promise<Mt5Command> {
    const id = randomUUID();
    const command: Mt5Command = {
      ...insertCommand,
      id,
      symbol: insertCommand.symbol ?? null,
      type: insertCommand.type ?? null,
      volume: insertCommand.volume ?? null,
      stopLoss: insertCommand.stopLoss ?? null,
      takeProfit: insertCommand.takeProfit ?? null,
      positionId: insertCommand.positionId ?? null,
      signalId: insertCommand.signalId ?? null,
      status: 'pending',
      createdAt: new Date(),
      sentAt: null,
      acknowledgedAt: null,
      errorMessage: insertCommand.errorMessage ?? null,
    };
    this.mt5Commands.set(id, command);
    return command;
  }

  async getNextPendingCommand(): Promise<Mt5Command | undefined> {
    const allCommands = Array.from(this.mt5Commands.values());
    const pendingCommands = allCommands
      .filter(c => c.status === 'pending')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    
    return pendingCommands[0];
  }

  async markCommandAsSent(commandId: string): Promise<void> {
    const command = this.mt5Commands.get(commandId);
    if (command) {
      command.status = 'sent';
      command.sentAt = new Date();
      this.mt5Commands.set(commandId, command);
    }
  }

  async markCommandAsAcknowledged(commandId: string): Promise<void> {
    const command = this.mt5Commands.get(commandId);
    if (command) {
      command.status = 'acknowledged';
      command.acknowledgedAt = new Date();
      this.mt5Commands.set(commandId, command);
    }
  }

  async markCommandAsFailed(commandId: string, errorMessage: string): Promise<void> {
    const command = this.mt5Commands.get(commandId);
    if (command) {
      command.status = 'failed';
      command.errorMessage = errorMessage;
      this.mt5Commands.set(commandId, command);
    }
  }

  async getPendingCommands(): Promise<Mt5Command[]> {
    const allCommands = Array.from(this.mt5Commands.values());
    return allCommands.filter(c => c.status === 'pending');
  }

  // MT5 Execution Results
  async createExecutionResult(insertResult: InsertMt5ExecutionResult): Promise<Mt5ExecutionResult> {
    const id = randomUUID();
    const result: Mt5ExecutionResult = {
      ...insertResult,
      id,
      commandId: insertResult.commandId ?? null,
      orderId: insertResult.orderId ?? null,
      positionId: insertResult.positionId ?? null,
      executedAt: new Date(),
      errorMessage: insertResult.errorMessage ?? null,
      responseData: insertResult.responseData ?? null,
    };
    this.mt5ExecutionResults.set(id, result);
    return result;
  }

  // Stats
  async getStats(): Promise<DashboardStats> {
    const allSignals = Array.from(this.signals.values());
    const allTrades = Array.from(this.trades.values());

    const totalSignals = allSignals.length;
    const pendingSignals = allSignals.filter(s => s.status === 'pending').length;
    const executedTrades = allTrades.filter(t => t.status === 'open' || t.status === 'closed').length;
    const executedSignals = allSignals.filter(s => s.status === 'executed').length;
    
    const successRate = totalSignals > 0 
      ? (executedSignals / totalSignals) * 100 
      : 0;

    // Check if MT5 is connected (heartbeat within last 10 seconds)
    const now = new Date();
    const lastHeartbeat = this.settings?.lastMt5Heartbeat;
    const isConnected = lastHeartbeat 
      ? (now.getTime() - new Date(lastHeartbeat).getTime()) < 10000 
      : false;

    return {
      totalSignals,
      pendingSignals,
      executedTrades,
      successRate: Math.round(successRate),
      isConnected,
    };
  }
}

export const storage = new MemStorage();
