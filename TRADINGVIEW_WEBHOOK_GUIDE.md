# TradingView Webhook Configuration Guide

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
