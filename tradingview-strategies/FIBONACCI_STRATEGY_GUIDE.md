# Fibonacci 0.705 Retracement Strategy Guide

## Strategy Overview

This strategy trades Fibonacci retracements **ONLY AFTER LIQUIDITY GRABS** in uptrends:

### The Core Logic (Simple):
**"Only trade the retracement after a swing that breaks previous highs (takes liquidity). Then use the 0.705 tap entry."**

### Step-by-Step:
1. **Liquidity Grab Detection**: Wait for price to BREAK the previous swing high (liquidity grab ⚡)
2. **Swing Formation**: After liquidity grab, wait for swing low to form
3. **Fibonacci Placement**: Place Fib from swing low to the NEW high (liquidity grab high)
4. **Retracement Wait**: Wait for price to pull back and tap 0.705 level
5. **Entry Confirmation**: Candle that taps 0.705 must:
   - Touch the 0.705 level
   - Close BULLISH (green candle)
   - Body must close ABOVE 0.705 level
6. **Stop Loss**: Below the entry candle's low
7. **Take Profit**: At the liquidity grab high (the high that broke previous high)

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

### Liquidity Grab Logic Explained

**What is a Liquidity Grab?**
A liquidity grab occurs when price breaks above a previous swing high, taking out stop losses and liquidity at that level. This is a key institutional behavior - they grab liquidity before reversing.

**Why Only Trade After Liquidity Grabs?**
- Higher probability setups
- Confirms market structure shift
- Liquidity has been taken, now ready for reversal/continuation
- Filters out weak setups

### Entry Logic

**LONG Entry Conditions (All Must Be Met):**
1. **Liquidity Grab**: New swing high BREAKS previous swing high ⚡
2. **Swing Low Forms**: After liquidity grab, a swing low must form
3. **Valid Setup**: Swing low must come BEFORE the liquidity grab high
4. **Price Retraces**: Price pulls back to 0.705 Fibonacci level
5. **Candle Touches 0.705**: Entry candle low/wick touches the level
6. **Bullish Close**: Candle closes BULLISH (close > open)
7. **Body Above 0.705**: Candle body closes ABOVE 0.705 level

### Risk Management

- **Stop Loss**: Placed below the low of the entry candle
- **Take Profit**: Placed at the previous swing high
- **Position Sizing**: Calculated by your app based on:
  - Account balance
  - Risk percentage
  - Distance to stop loss

### Visual Indicators on Chart

- ⚡ **Yellow Triangle Up**: Liquidity Grab detected (break of previous high)
- 🟢 **Green Circle**: Current Swing High (Liquidity Grab High)
- 🟠 **Orange Circle**: Previous Swing High
- 🔴 **Red Circle**: Swing Low (after liquidity grab)
- 🔵 **Blue Line**: Fibonacci 0.705 level
- 🟩 **Green Background**: Valid setup zone (after liquidity grab)
- 📍 **Green Label**: Entry signal with "LIQ GRAB" confirmation
- ⚡ **Yellow Dashed Line**: Marks the liquidity grab level

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

### Valid Entry Example (WITH Liquidity Grab)
```
Previous swing high: 1.0900 (bar 50)

LIQUIDITY GRAB ⚡ (bar 100):
- Price breaks previous high
- New swing high: 1.0950 (BREAKS 1.0900 ✓)
- Liquidity grab confirmed!

Swing Low forms (bar 120):
- Swing Low: 1.0850
- Forms AFTER liquidity grab ✓

Fibonacci setup:
- From: 1.0850 (swing low)
- To: 1.0950 (liquidity grab high)
- Fib 0.705: 1.0920

Entry Signal (bar 140):
- Low: 1.0918 (touched 0.705 ✓)
- Close: 1.0925 (above 0.705 ✓)
- Bullish: close > open ✓
- Liquidity grab occurred ✓

Trade:
- Entry: 1.0925
- SL: 1.0918
- TP: 1.0950 (liquidity grab high)
```

### Invalid Entry Example (NO Liquidity Grab)
```
Scenario: New high does NOT break previous high
- Previous swing high: 1.0950
- New swing high: 1.0930 (LOWER than previous ✗)
- Result: No liquidity grab, no setup
- Strategy waits for valid liquidity grab

Even if price taps 0.705:
- No entry because liquidity grab requirement not met ✗
```

### Invalid Entry Example (Wrong Candle)
```
Valid liquidity grab exists BUT:
- Candle touches 0.705
- Body closes BELOW 0.705 ✗
- Result: No entry (waiting for bullish close above 0.705)
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
