# Fibonacci 0.705 Retracement Strategy Guide

## Strategy Overview

This strategy trades Fibonacci retracements in an uptrend:

1. **Trend Detection**: Identifies uptrends using swing high/low analysis
2. **Fibonacci Placement**: Places Fibonacci from swing low to swing high
3. **Entry Signal**: Waits for 0.705 Fibonacci level to be tapped
4. **Confirmation**: Entry candle must:
   - Touch the 0.705 level
   - Close bullish (green)
   - Body must close ABOVE 0.705 level
5. **Stop Loss**: Below the entry candle's low
6. **Take Profit**: At the previous swing high

## Installation

### Step 1: Add Strategy to TradingView

1. Open TradingView and go to your chart
2. Click **Pine Editor** at the bottom of the screen
3. Click **"New"** → **"Blank indicator"**
4. Copy the entire code from `fibonacci_0705_strategy.pine`
5. Paste it into the Pine Editor
6. Click **"Save"** and name it "Fibonacci 0.705 Strategy"
7. Click **"Add to Chart"**

### Step 2: Configure Strategy Settings

1. Click the strategy name on the chart
2. Click the ⚙️ settings icon
3. Configure the inputs:
   - **Swing Lookback Period**: `50` (default) - Period to detect swing highs/lows
   - **Fibonacci Level**: `0.705` (default) - The Fib level to trade
   - **Webhook URL**: Your Replit app URL (e.g., `https://your-app.replit.dev/api/webhook`)
   - **API Secret**: Your MT5 API secret

### Step 3: Create Alert

1. Click the **Alert** button (clock icon) in the top toolbar
2. **Condition**: Select your strategy → "Any alert() function call"
3. **Alert name**: "Fib 0.705 Long Signal"
4. **Webhook URL**: Paste your Replit webhook URL
5. **Message**: Leave as is (the strategy sends the JSON automatically)
6. **Options**:
   - ✅ **Webhook URL** (paste your webhook URL)
   - ✅ **Once Per Bar Close** (recommended)
7. Click **Create**

## Webhook Message Format

The strategy automatically sends this JSON format:

### BUY Signal Example:
```json
{
  "symbol": "EURUSD",
  "type": "BUY",
  "indicator": "fibonacci_705",
  "entry": "1.0850",
  "stopLoss": "1.0830",
  "takeProfit": "1.0920"
}
```

## How It Works

### Entry Logic

**LONG Entry Conditions:**
1. Market is in an uptrend (swing low formed before swing high)
2. Price retraces to 0.705 Fibonacci level
3. Candle touches 0.705 level (wicks can go through)
4. Candle closes BULLISH (close > open)
5. Candle body closes ABOVE 0.705 (no body close below the level)

### Risk Management

- **Stop Loss**: Placed below the low of the entry candle
- **Take Profit**: Placed at the previous swing high
- **Position Sizing**: Calculated by your app based on:
  - Account balance
  - Risk percentage
  - Distance to stop loss

### Visual Indicators on Chart

- 🟢 **Green Circle**: Swing High
- 🔴 **Red Circle**: Swing Low
- 🔵 **Blue Line**: Fibonacci 0.705 level
- 🟩 **Green Background**: Uptrend zone
- 📍 **Green Label**: Entry signal with prices

## Settings Customization

### Swing Lookback Period
- **Lower values (20-30)**: More sensitive, finds recent swings
- **Higher values (70-100)**: Less sensitive, finds major swings
- **Recommended**: 50 for most timeframes

### Fibonacci Level
- **Default**: 0.705 (sweet spot for retracements)
- **Alternative**: 0.618, 0.786 (other popular levels)
- **Range**: 0.5 - 0.9

## Best Practices

1. **Timeframe**: Works best on 15min, 1H, 4H charts
2. **Markets**: Forex, Crypto, Indices (trending markets)
3. **Session**: Best during active trading sessions
4. **Trend**: Only trades in clear uptrends
5. **Risk**: Set your app risk percentage to 1-2% per trade

## Troubleshooting

### Strategy Not Triggering
- Check if market is in uptrend (green background)
- Verify swing high/low are detected (circles on chart)
- Ensure 0.705 level is visible (blue line)
- Confirm candle actually touched the level

### Webhook Not Sending
- Verify webhook URL in strategy settings
- Check alert is created with "Webhook URL" enabled
- Ensure "Once Per Bar Close" is enabled
- Test webhook URL with cURL (see main webhook guide)

### Wrong Symbol in MT5
- Add symbol mapping in your app settings
- Map TradingView symbol to MT5 symbol
- Example: `EURUSD` → `EURUSDm` (if your broker uses suffix)

## Example Scenarios

### Valid Entry Example
```
Uptrend detected:
- Swing Low: 1.0800 (bar 100)
- Swing High: 1.0950 (bar 150)
- Fib 0.705: 1.0905

Entry Signal (bar 160):
- Low: 1.0900 (touched 0.705 ✓)
- Close: 1.0910 (above 0.705 ✓)
- Bullish: close > open ✓

Trade:
- Entry: 1.0910
- SL: 1.0900
- TP: 1.0950
```

### Invalid Entry Example
```
Candle touches 0.705 but:
- Body closes BELOW 0.705 ✗
- Result: No entry (waiting for better setup)
```

## Integration with Your MT5 System

The strategy works seamlessly with your existing webhook system:

1. **Strategy sends signal** → TradingView alert webhook
2. **Your app receives** → `/api/webhook` endpoint
3. **App processes**:
   - Validates symbol
   - Calculates lot size based on SL distance
   - Uses exact entry, SL, TP from strategy
4. **App sends to MT5** → Via WebSocket
5. **MT5 executes** → Real trade with exact levels

No additional configuration needed - just create the alert!
