# TradingView Trading Strategies

This folder contains Pine Script strategies that integrate with your MT5 Trading Bridge via webhooks.

## Available Strategies

### 1. Fibonacci 0.705 Zone Retracement Strategy
**File**: `fibonacci_0705_strategy.pine`  
**Guide**: `FIBONACCI_STRATEGY_GUIDE.md`

**Strategy Logic**:
- **Trend-Following**: Works for BOTH BUY (uptrend) and SELL (downtrend)
- **Liquidation Detection**: Waits for small low (uptrend) or high (downtrend) to be taken out
- **Fibonacci Placement**: From swing low to swing high (BUY) or high to low (SELL)
- **Entry Zone**: 0.705-0.69 retracement zone (not single level)
- **Entry Confirmation**: Candle taps zone + Bullish/Bearish close + Body in/past zone
- **SL**: Below/Above entry candle | **TP**: Swing high/low

**Best For**: Trending markets (Forex, Crypto, Indices)  
**Timeframes**: 5min, 15min, 1H, 4H  
**Win Rate**: ~65-75% in trending conditions

## How It Works

### Integration Flow
```
TradingView Strategy
        ↓
    Alert Fires
        ↓
    Webhook Sent
        ↓
  Your Replit App (/api/webhook)
        ↓
   Validates & Processes
        ↓
   Calculates Lot Size
        ↓
    Sends to MT5 (WebSocket)
        ↓
   Trade Executed
```

### Webhook Format
All strategies send this JSON format:
```json
{
  "symbol": "EURUSD",
  "type": "BUY",
  "indicator": "strategy_name",
  "entry": "1.0910",
  "stopLoss": "1.0900",
  "takeProfit": "1.0950"
}
```

## Setup Instructions

### Step 1: Add Strategy to TradingView
1. Open TradingView Pine Editor
2. Copy strategy code from `.pine` file
3. Paste into Pine Editor
4. Save and add to chart

### Step 2: Configure Settings
1. Click strategy settings (⚙️)
2. Set **Webhook URL**: `https://your-app.replit.dev/api/webhook`
3. Set **API Secret**: Your MT5 API secret
4. Adjust strategy parameters as needed

### Step 3: Create Alert
1. Click Alert button (🔔)
2. **Condition**: Strategy → "Any alert() function call"
3. **Webhook URL**: Your Replit app URL
4. **Message**: Leave as is (auto-populated)
5. Enable: ✅ Webhook URL, ✅ Once Per Bar Close
6. Click Create

### Step 4: Verify Integration
1. Check your Replit app dashboard
2. Wait for strategy signal
3. Verify signal appears in dashboard
4. Confirm trade executes in MT5

## Risk Management

All strategies use your app's risk settings:

- **Account Balance**: Set in app settings
- **Risk %**: Set in app settings (default 1%)
- **Lot Calculation**: Automatic based on SL distance
- **Position Sizing**: Risk-based (not fixed lots)

### Example Calculation
```
Account: $10,000
Risk: 1% = $100
SL Distance: 20 pips
Lot Size: Calculated to risk $100 over 20 pips
```

## Creating Custom Strategies

### Required Elements

1. **Entry Logic**: Your strategy conditions
2. **Alert Message**: Send JSON with required fields
3. **Risk Levels**: Calculate entry, SL, TP

### Template
```pine
//@version=5
strategy("Your Strategy", overlay=true)

// Your strategy logic here

if longCondition
    alert('{"symbol":"' + syminfo.ticker + '","type":"BUY","indicator":"your_strategy","entry":"' + str.tostring(close) + '","stopLoss":"' + str.tostring(sl) + '","takeProfit":"' + str.tostring(tp) + '"}', alert.freq_once_per_bar)
```

### Required Fields
- `symbol`: Trading symbol
- `type`: "BUY" or "SELL"
- `indicator`: Your strategy name
- `entry`: Entry price
- `stopLoss`: Stop loss price
- `takeProfit`: Take profit price

## Supported Indicators

Current strategies:
- ✅ `fibonacci_705` - Fibonacci 0.705 Retracement
- ✅ `target_trend` - Target Trend Indicator

Your app automatically handles:
- Symbol mapping (TradingView → MT5)
- Lot size calculation
- Price validation
- Duplicate signal prevention
- Auto-close opposite positions

## Best Practices

### Strategy Development
1. **Backtest First**: Test on TradingView paper trading
2. **Start Small**: Use low risk % initially
3. **One Strategy**: Start with one before adding more
4. **Monitor Results**: Track performance in dashboard

### Alert Configuration
1. **Once Per Bar Close**: Prevent duplicate signals
2. **Webhook URL**: Always enable webhook
3. **Alert Frequency**: Use "Once Per Bar Close"
4. **Test First**: Use cURL to test webhook before going live

### Risk Control
1. **Max 2% Risk**: Don't exceed 2% per trade
2. **Position Limits**: Set max open positions
3. **Symbol Mapping**: Verify TradingView → MT5 symbols
4. **Stop Loss**: Always include SL in strategy

## Troubleshooting

### Strategy Not Sending Signals
- ✅ Check strategy is active (green text on chart)
- ✅ Verify conditions are met (check chart indicators)
- ✅ Confirm alert is created and active
- ✅ Check webhook URL is correct

### Signals Not Executing
- ✅ Check auto-trade is enabled in app settings
- ✅ Verify MT5 WebSocket is connected
- ✅ Check symbol mapping (TradingView → MT5)
- ✅ Review app logs for errors

### Wrong Position Size
- ✅ Update account balance in app settings
- ✅ Check risk percentage setting
- ✅ Verify SL distance is calculated correctly
- ✅ Review lot size calculation in webhook logs

## Resources

- 📖 **Main Webhook Guide**: `/TRADINGVIEW_WEBHOOK_GUIDE.md`
- 📖 **MT5 WebSocket Setup**: `/mt5-files/INSTALLATION_GUIDE_WEBSOCKET.md`
- 📊 **Dashboard**: Monitor signals and trades in real-time
- 🔧 **Settings**: Configure risk, auto-trade, symbol mapping

## Support

Need help? Check:
1. Strategy-specific guide (e.g., `FIBONACCI_STRATEGY_GUIDE.md`)
2. Main webhook configuration guide
3. MT5 WebSocket setup guide
4. App settings and logs
