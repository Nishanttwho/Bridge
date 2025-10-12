import type { Settings } from '@shared/schema';

interface TradeRequest {
  symbol: string;
  type: 'BUY' | 'SELL';
  volume: number;
  stopLoss?: number;
  takeProfit?: number;
}

interface TradeResult {
  success: boolean;
  orderId?: string;
  positionId?: string;
  error?: string;
}

export class MT5Service {
  private api: any | null = null;
  private account: any = null;
  private connection: any = null;
  private isConnected: boolean = false;

  async initialize(settings: Settings): Promise<boolean> {
    try {
      if (!settings.metaApiToken) {
        console.error('MetaApi token not provided');
        return false;
      }

      // Dynamic import of MetaApi to handle ESM/CJS compatibility
      const { default: MetaApi } = await import('metaapi.cloud-sdk');
      this.api = new MetaApi(settings.metaApiToken);

      if (settings.metaApiAccountId) {
        this.account = await this.api.metatraderAccountApi.getAccount(settings.metaApiAccountId);
      } else {
        console.error('MetaApi account ID not provided');
        return false;
      }

      if (!this.account) {
        return false;
      }

      await this.account.deploy();
      await this.account.waitConnected();

      this.connection = this.account.getRPCConnection();
      await this.connection.connect();
      await this.connection.waitSynchronized();

      this.isConnected = true;
      console.log('MT5 connection established successfully');
      return true;
    } catch (error) {
      console.error('MT5 initialization error:', error);
      this.isConnected = false;
      return false;
    }
  }

  async executeTrade(request: TradeRequest): Promise<TradeResult> {
    try {
      if (!this.connection || !this.isConnected) {
        return {
          success: false,
          error: 'MT5 connection not established'
        };
      }

      let result: any;

      if (request.type === 'BUY') {
        result = await this.connection.createMarketBuyOrder(
          request.symbol,
          request.volume,
          request.stopLoss,
          request.takeProfit
        );
      } else {
        // FIX: Sell orders must also use (symbol, volume, stopLoss, takeProfit)
        result = await this.connection.createMarketSellOrder(
          request.symbol,
          request.volume,
          request.stopLoss,
          request.takeProfit
        );
      }

      return {
        success: true,
        orderId: result.orderId,
        positionId: result.positionId
      };
    } catch (error) {
      console.error('Trade execution error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async closePosition(positionId: string): Promise<TradeResult> {
    try {
      if (!this.connection || !this.isConnected) {
        return {
          success: false,
          error: 'MT5 connection not established'
        };
      }

      await this.connection.closePosition(positionId);

      return {
        success: true
      };
    } catch (error) {
      console.error('Close position error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getAccountInfo(): Promise<any> {
    try {
      if (!this.connection || !this.isConnected) {
        return null;
      }

      return await this.connection.getAccountInformation();
    } catch (error) {
      console.error('Get account info error:', error);
      return null;
    }
  }

  async getPositions(): Promise<any[]> {
    try {
      if (!this.connection || !this.isConnected) {
        return [];
      }

      return await this.connection.getPositions();
    } catch (error) {
      console.error('Get positions error:', error);
      return [];
    }
  }

  async getSymbolPrice(symbol: string): Promise<{ bid: number; ask: number } | null> {
    try {
      if (!this.connection || !this.isConnected) {
        return null;
      }

      await this.connection.subscribeToMarketData(symbol);
      const price = await this.connection.getSymbolPrice(symbol);
      
      return {
        bid: price.bid,
        ask: price.ask
      };
    } catch (error) {
      console.error('Get symbol price error:', error);
      return null;
    }
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  async disconnect(): Promise<void> {
    try {
      if (this.connection) {
        this.connection.close();
      }
      if (this.account) {
        await this.account.undeploy();
      }
      this.isConnected = false;
      console.log('MT5 disconnected');
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  }
}

export const mt5Service = new MT5Service();
