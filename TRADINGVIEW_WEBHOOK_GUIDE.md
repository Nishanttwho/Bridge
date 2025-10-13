# TradingView Webhook Configuration Guide

## Supported Trading Strategies

This guide covers webhook integration for multiple trading strategies:
1. **ICT OTE (Optimal Trade Entry)** - 62-79% retracement zone with trend confirmation
2. **Fibonacci 0.705 Retracement** - Retracement trading with precise entry signals
3. **Target Trend Indicator** - Trend-following with custom SL/TP

---

## ICT OTE (Optimal Trade Entry) Indicator

### Strategy Overview
**"Buy the best part of a retracement inside a trend - the Optimal Trade Entry zone."**

The OTE indicator implements ICT's concept of entering trades at optimal retracement zones within a trending market. It automatically identifies trends, swing points, and generates high-probability entry signals when price retraces into the OTE zone (62%-79% Fibonacci retracement) and shows confirmation.

**Works for BOTH BUY and SELL**

**For BUY (Uptrend):**
- **Trend**: Price above EMA or higher highs/higher lows
- **Swing**: Identifies LOW → HIGH move
- **OTE Zone**: 62-79% retracement (or narrow 70.5-69%)
- **Entry**: Candle touches zone, closes bullish (not below zone)
- **Risk**: SL below entry candle, TP at swing high

**For SELL (Downtrend):**
- **Trend**: Price below EMA or lower highs/lower lows
- **Swing**: Identifies HIGH → LOW move
- **OTE Zone**: 62-79% retracement (or narrow 70.5-69%)
- **Entry**: Candle touches zone, closes bearish (not above zone)
- **Risk**: SL above entry candle, TP at swing low

### Webhook Format
The OTE indicator automatically sends this JSON:

```json
{
  "symbol": "{{ticker}}",
  "type": "BUY",
  "indicator": "ote",
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
  "indicator": "ote",
  "entry": "1.0910",
  "stopLoss": "1.0900",
  "takeProfit": "1.0950"
}
```

### Example SELL Signal
```json
{
  "symbol": "GBPUSD",
  "type": "SELL",
  "indicator": "ote",
  "entry": "1.2650",
  "stopLoss": "1.2665",
  "takeProfit": "1.2600"
}
```

**Note**: Lot size is calculated automatically by the backend based on your risk settings.

### Setup Instructions
1. Copy the Pine Script from `tradingview-strategies/ote_indicator.pine`
2. Add it to TradingView Pine Editor
3. Configure settings:
   - Webhook URL
   - OTE zone (standard 62-79% or narrow 70.5-69%)
   - EMA length and swing lookback
   - Visual preferences
4. Create alert with "Any alert() function call" condition
5. Enable "Webhook URL" and "Once Per Bar Close"

📖 **Full Guide**: See `tradingview-strategies/OTE_STRATEGY_GUIDE.md` for complete setup instructions

### Key Features
- ✅ Automatic trend detection via EMA
- ✅ Swing point identification
- ✅ OTE zone visualization (62-79% or 70.5-69%)
- ✅ Entry confirmation logic
- ✅ Visual signals and info table
- ✅ Automatic zone cleanup when setups invalidate
- ✅ Webhook integration with MT5 (position sizing handled server-side)

---

## Fibonacci 0.705 Zone Retracement Strategy

### Strategy Overview
**"In an uptrend, after price takes out a small low and goes up again, wait for it to retrace to the 0.705–0.69 zone, reject it bullishly, and buy with target at the last high."**

**Works for BOTH BUY and SELL** (SELL is vice versa in downtrend)

**For BUY (Uptrend):**
- **Liquidation**: Price takes out small low (goes below it)
- **Structure**: Creates new swing low, then swing high
- **Fibonacci**: Drawn from swing low to swing high
- **Entry Zone**: 0.705-0.69 retracement zone (not single level)
- **Confirmation**: Candle taps zone, closes bullish (not below zone)
- **Risk Levels**: SL below entry candle, TP at swing high

**For SELL (Downtrend):**
- Liquidates small high → Retraces to 0.705-0.69 zone → Bearish close → SELL

**Key Rule**: "Don't care if highs break - just need liquidation of low (uptrend) or high (downtrend), then retracement to zone"

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
