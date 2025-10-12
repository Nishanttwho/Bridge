import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, decimal, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Signal types from TradingView
export const signals = pgTable("signals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(), // 'BUY' | 'SELL'
  symbol: text("symbol").notNull(), // e.g., 'EURUSD'
  price: decimal("price", { precision: 10, scale: 5 }),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  source: text("source").notNull().default('tradingview'), // Signal source
  status: text("status").notNull().default('pending'), // 'pending' | 'executed' | 'failed'
  errorMessage: text("error_message"),
});

// Trade execution records
export const trades = pgTable("trades", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  signalId: varchar("signal_id").references(() => signals.id),
  symbol: text("symbol").notNull(),
  type: text("type").notNull(), // 'BUY' | 'SELL'
  volume: decimal("volume", { precision: 10, scale: 2 }).notNull(), // Lot size
  openPrice: decimal("open_price", { precision: 10, scale: 5 }),
  closePrice: decimal("close_price", { precision: 10, scale: 5 }),
  stopLoss: decimal("stop_loss", { precision: 10, scale: 5 }), // Stop Loss price
  takeProfit: decimal("take_profit", { precision: 10, scale: 5 }), // Take Profit price
  profit: decimal("profit", { precision: 10, scale: 2 }),
  status: text("status").notNull().default('open'), // 'open' | 'closed' | 'failed'
  mt5OrderId: text("mt5_order_id"),
  mt5PositionId: text("mt5_position_id"), // MetaApi position ID for closing
  openTime: timestamp("open_time").notNull().defaultNow(),
  closeTime: timestamp("close_time"),
  errorMessage: text("error_message"),
});

// MT5 Settings
export const settings = pgTable("settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  zmqHost: text("zmq_host").default('localhost'), // ZeroMQ host (localhost or VPS IP)
  zmqPushPort: integer("zmq_push_port").default(5555), // Port for sending commands
  zmqPullPort: integer("zmq_pull_port").default(5556), // Port for receiving responses
  accountBalance: decimal("account_balance", { precision: 15, scale: 2 }).notNull().default('10000'), // Account balance for risk calculation
  riskPercentage: decimal("risk_percentage", { precision: 5, scale: 2 }).notNull().default('1'), // Risk per trade (1%)
  defaultLotSize: decimal("default_lot_size", { precision: 10, scale: 2 }).notNull().default('0.01'),
  maxSpread: integer("max_spread").default(3),
  slippage: integer("slippage").default(3),
  autoTrade: text("auto_trade").notNull().default('true'), // 'true' | 'false'
  webhookUrl: text("webhook_url"),
});

// Schemas for inserts
export const insertSignalSchema = createInsertSchema(signals).omit({ 
  id: true, 
  timestamp: true 
});

export const insertTradeSchema = createInsertSchema(trades).omit({ 
  id: true, 
  openTime: true 
});

export const insertSettingsSchema = createInsertSchema(settings).omit({ 
  id: true 
}).extend({
  accountBalance: z.coerce.number().positive("Account balance must be positive"),
  riskPercentage: z.coerce.number().positive("Risk percentage must be positive").max(100, "Risk percentage cannot exceed 100%"),
});

// Types
export type Signal = typeof signals.$inferSelect;
export type InsertSignal = z.infer<typeof insertSignalSchema>;

export type Trade = typeof trades.$inferSelect;
export type InsertTrade = z.infer<typeof insertTradeSchema>;

export type Settings = typeof settings.$inferSelect;
export type InsertSettings = z.infer<typeof insertSettingsSchema>;

// Dashboard stats type
export type DashboardStats = {
  totalSignals: number;
  pendingSignals: number;
  executedTrades: number;
  successRate: number;
  isConnected: boolean;
};

// WebSocket message types
export type WSMessage = 
  | { type: 'signal'; data: Signal }
  | { type: 'trade'; data: Trade }
  | { type: 'stats'; data: DashboardStats }
  | { type: 'connection'; data: { status: 'connected' | 'disconnected' } };
