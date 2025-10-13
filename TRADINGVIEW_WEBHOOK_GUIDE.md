# TradingView Webhook Configuration Guide

## Supported Trading Strategies

This guide covers webhook integration for multiple trading strategies:
1. **Target Trend Indicator** - Trend-following with custom SL/TP
2. **Fibonacci 0.705 Retracement** - Retracement trading with precise entry signals

---

## Fibonacci 0.705 Retracement Strategy

### Strategy Overview
Trades Fibonacci retracements in uptrends:
- Detects swing highs and lows
- Waits for 0.705 Fib level retracement
- Enters when price bounces (bullish candle at level)
- SL below entry candle, TP at swing high

### Webhook Format
The Fibonacci strategy automatically sends this JSON:

```json
{
  "symbol": "{{ticker}}",
  "type": "BUY",
  "indicator": "fibonacci_705",
  "entry": "{{close}}",
  "stopLoss": "{{low}}",
  "takeProfit": "{{high}}"
}
```

### Example BUY Signal
```json
{
  "symbol": "EURUSD",
  "type": "BUY",
  "indicator": "fibonacci_705",
  "entry": "1.0910",
  "stopLoss": "1.0900",
  "takeProfit": "1.0950"
}
```

### Setup Instructions
1. Copy the Pine Script from `tradingview-strategies/fibonacci_0705_strategy.pine`
2. Add it to TradingView Pine Editor
3. Configure webhook URL and API secret in strategy settings
4. Create alert with "Any alert() function call" condition
5. Enable "Webhook URL" and "Once Per Bar Close"

📖 **Full Guide**: See `tradingview-strategies/FIBONACCI_STRATEGY_GUIDE.md` for complete setup instructions

---

## Target Trend Indicator Webhook Format

### Required Alert Message Format

In your TradingView alert, use this JSON format in the "Message" field:

```json
{
  "symbol": "{{ticker}}",
  "type": "{{strategy.order.action}}",
  "indicator": "target_trend",
  "entry": "{{close}}",
  "stopLoss": "STOP_LOSS_VALUE",
  "takeProfit": "TAKE_PROFIT_VALUE"
}
```

### Example for BUY Signal
```json
{
  "symbol": "BTCUSD",
  "type": "BUY",
  "indicator": "target_trend",
  "entry": "115010",
  "stopLoss": "114800",
  "takeProfit": "115500"
}
```

### Example for SELL Signal
```json
{
  "symbol": "BTCUSD",
  "type": "SELL",
  "indicator": "target_trend",
  "entry": "115010",
  "stopLoss": "115220",
  "takeProfit": "114500"
}
```

## Important Notes

### For BUY Signals:
- Entry: Current market price
- Stop Loss: BELOW entry price
- Take Profit: ABOVE entry price

### For SELL Signals:
- Entry: Current market price
- Stop Loss: ABOVE entry price  
- Take Profit: BELOW entry price

### Field Mappings

The system accepts multiple field names for flexibility:

| Field | Accepted Names |
|-------|---------------|
| Symbol | `symbol`, `ticker`, `pair`, `instrument` |
| Type | `type`, `action`, `side`, `signal` |
| Indicator | `indicator`, `indicatorType` |
| Entry | `entry`, `entryPrice` |
| Stop Loss | `stopLoss`, `sl`, `stop_loss` |
| Take Profit | `takeProfit`, `tp`, `takeProfit1`, `tp1` |

### Webhook URL

```
https://your-replit-url.repl.co/api/webhook
```

### Alert Settings

1. **Condition**: Set your Target Trend indicator conditions
2. **Alert actions**: 
   - ✅ Webhook URL (paste your webhook URL)
3. **Alert name**: Optional
4. **Message**: Use the JSON format above
5. **Options**: 
   - ✅ Once Per Bar Close (recommended to avoid duplicates)

## How It Works

1. **Signal Reception**: TradingView sends the webhook when conditions are met
2. **Validation**: System validates symbol, type, and price levels
3. **Risk Calculation**: System calculates lot size based on:
   - Account balance
   - Risk percentage (from settings)
   - Distance to stop loss (in pips)
4. **Trade Execution**: MT5 executes the trade with exact SL/TP levels from indicator
5. **Auto-Close**: If enabled, opposite positions are closed automatically

## Testing Your Webhook

### Test with cURL:

```bash
curl -X POST https://your-replit-url.repl.co/api/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "BTCUSD",
    "type": "BUY",
    "indicator": "target_trend",
    "entry": "115010",
    "stopLoss": "114800",
    "takeProfit": "115500"
  }'
```

Expected response:
```json
{
  "success": true,
  "signalId": "uuid-here",
  "message": "Signal received and queued for execution"
}
```

## Common Issues

### Issue: Sell Positions Not Opening
- **Cause**: Stop loss is below entry (should be above for SELL)
- **Fix**: Ensure SL > Entry and TP < Entry for SELL signals

### Issue: SL/TP Not Set Correctly  
- **Cause**: Missing indicator fields in webhook
- **Fix**: Ensure `entry`, `stopLoss`, and `takeProfit` are included in alert message

### Issue: Duplicate Signals
- **Cause**: Alert firing multiple times per bar
- **Fix**: Enable "Once Per Bar Close" in alert settings
