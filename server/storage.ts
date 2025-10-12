import { 
  type Signal, 
  type InsertSignal,
  type Trade,
  type InsertTrade,
  type Settings,
  type InsertSettings,
  type DashboardStats 
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
  
  // Stats
  getStats(): Promise<DashboardStats>;
}

export class MemStorage implements IStorage {
  private signals: Map<string, Signal>;
  private trades: Map<string, Trade>;
  private settings: Settings | undefined;

  constructor() {
    this.signals = new Map();
    this.trades = new Map();
    this.settings = undefined;
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
      mt5Server: insertSettings.mt5Server ?? null,
      mt5Login: insertSettings.mt5Login ?? null,
      mt5Password: insertSettings.mt5Password ?? null,
      webhookUrl: insertSettings.webhookUrl ?? null,
      accountBalance: insertSettings.accountBalance || '10000',
      riskPercentage: insertSettings.riskPercentage || '1',
      defaultLotSize: insertSettings.defaultLotSize || '0.01',
      autoTrade: insertSettings.autoTrade || 'true',
      maxSpread: insertSettings.maxSpread ?? null,
      slippage: insertSettings.slippage ?? null,
    };
    this.settings = settings;
    return settings;
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

    return {
      totalSignals,
      pendingSignals,
      executedTrades,
      successRate: Math.round(successRate),
      isConnected: this.settings?.mt5Login ? true : false,
    };
  }
}

export const storage = new MemStorage();
