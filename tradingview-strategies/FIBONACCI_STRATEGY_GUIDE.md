# Fibonacci 0.705 Zone Retracement Strategy Guide

## Strategy Overview

**"In an uptrend, after price takes out a small low and goes up again, wait for it to retrace to the 0.705–0.69 zone, reject it bullishly, and buy with target at the last high."**

This is a **trend-following retracement strategy** that works for **BOTH BUY and SELL** setups.

### Core Logic (Simple):

**For BUY (Uptrend):**
1. Market is in an uptrend (higher highs, higher lows)
2. Price makes a small low
3. Price **LIQUIDATES that small low** (goes below it, takes liquidity)
4. Price moves up, creating new swing low (at the liquidation point)
5. Price continues up to make swing high
6. Draw Fibonacci from swing low to swing high
7. Wait for retracement to **0.705-0.69 ZONE**
8. Candle taps zone and closes **BULLISH** (not below zone)
9. **Entry: BUY** | **SL:** Below candle | **TP:** Swing high

**For SELL (Downtrend):** VICE VERSA
- Price liquidates small high (breaks above it)
- Retraces to 0.705-0.69 zone (drawn from high to low)
- Closes bearish (not above zone)
- Entry: SELL | SL: Above candle | TP: Swing low

### Key Points

✅ **Zone, not level**: 0.705 to 0.69 (not just 0.705)  
✅ **Liquidation of LOW** (in uptrend) or HIGH (in downtrend)  
✅ **Don't care if highs break**: Just need structure (higher lows in uptrend)  
✅ **Works both directions**: BUY and SELL using same logic  

## Installation

### Step 1: Add Strategy to TradingView

1. Open TradingView and go to your chart
2. Click **Pine Editor** at the bottom of the screen
3. Click **"New"** → **"Blank indicator"**
4. Copy the entire code from `fibonacci_0705_strategy.pine`
5. Paste it into the Pine Editor
6. Click **"Save"** and name it "Fibonacci 0.705 Zone Strategy"
7. Click **"Add to Chart"**

### Step 2: Configure Strategy Settings

1. Click the strategy name on the chart
2. Click the ⚙️ settings icon
3. Configure the inputs:
   - **Swing Lookback Period**: `20` (default) - Period to detect swing highs/lows
   - **Fib Zone High**: `0.705` (default) - Top of retracement zone
   - **Fib Zone Low**: `0.69` (default) - Bottom of retracement zone
   - **Webhook URL**: Your Replit app URL (e.g., `https://your-app.replit.dev/api/webhook`)
   - **API Secret**: Your MT5 API secret

### Step 3: Create Alert

1. Click the **Alert** button (clock icon) in the top toolbar
2. **Condition**: Select your strategy → "Any alert() function call"
3. **Alert name**: "Fib 0.705 Zone Signal"
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

### SELL Signal Example:
```json
{
  "symbol": "EURUSD",
  "type": "SELL",
  "indicator": "fibonacci_705",
  "entry": "1.0920",
  "stopLoss": "1.0940",
  "takeProfit": "1.0850"
}
```

## How It Works

### What is Liquidation?

**Liquidation** = Price takes out a previous swing level (low or high) to grab liquidity (stop losses).

**For BUY:** Price goes **below** a small low, then reverses up  
**For SELL:** Price goes **above** a small high, then reverses down

This is normal market behavior - it cleans out stops before continuing the trend.

### Entry Logic Explained

**BUY Entry Conditions (All Must Be Met):**
1. ✅ Market in uptrend (higher lows structure)
2. ✅ Small low was liquidated (price went below it)
3. ✅ New swing low formed (at liquidation point)
4. ✅ Swing high formed after swing low
5. ✅ Price retraces to 0.705-0.69 zone
6. ✅ Candle taps the zone (touches it)
7. ✅ Candle closes BULLISH (green)
8. ✅ Body does NOT close below 0.69 level

**SELL Entry Conditions:** OPPOSITE
- Downtrend, high liquidated, retraces to zone, bearish close, body not above zone

### Risk Management

- **Stop Loss (BUY)**: Below the entry candle that tapped the zone
- **Stop Loss (SELL)**: Above the entry candle that tapped the zone
- **Take Profit (BUY)**: At the swing high
- **Take Profit (SELL)**: At the swing low
- **Position Sizing**: Calculated by your app based on:
  - Account balance
  - Risk percentage
  - Distance to stop loss

### Visual Indicators on Chart

**BUY Setup (Uptrend):**
- 🔵 **Blue Zone (shaded)**: Fibonacci 0.705-0.69 buy zone
- 🟢 **Green Circle**: Swing High (take profit target)
- 🔴 **Red Circle**: Swing Low (after liquidation)
- ⚡ **Yellow Triangle Down "LIQ"**: Liquidation of small low
- 🟩 **Light Green Background**: Uptrend detected
- 📍 **Green Label "LONG"**: Entry signal with prices

**SELL Setup (Downtrend):**
- 🟠 **Orange Zone (shaded)**: Fibonacci 0.705-0.69 sell zone
- 🔴 **Red Circle**: Swing Low (take profit target)
- 🟢 **Green Circle**: Swing High (after liquidation)
- ⚡ **Yellow Triangle Up "LIQ"**: Liquidation of small high
- 🟥 **Light Red Background**: Downtrend detected
- 📍 **Red Label "SHORT"**: Entry signal with prices

## Settings Customization

### Swing Lookback Period
- **Lower values (10-15)**: More sensitive, finds recent swings
- **Higher values (30-50)**: Less sensitive, finds major swings
- **Recommended**: 20 for most timeframes

### Fibonacci Zone
- **Default**: 0.705 to 0.69 (proven sweet spot)
- **Alternative**: Adjust if needed (0.7 to 0.68, etc.)
- **Important**: Zone low must be lower than zone high

## Best Practices

1. **Timeframe**: Works best on 5min, 15min, 1H, 4H charts
2. **Markets**: Forex, Crypto, Indices (trending markets)
3. **Session**: Best during active trading sessions (London, NY)
4. **Trend Confirmation**: Look for clear higher highs/lows (uptrend) or lower highs/lows (downtrend)
5. **Risk**: Set your app risk percentage to 1-2% per trade

## Important Notes

❗ **We don't care if previous highs break** - This doesn't matter in this system

❗ **What matters:**
- Structure of higher lows (uptrend) or lower highs (downtrend)
- Liquidation of the small low (uptrend) or high (downtrend)
- Retracement to 0.705-0.69 zone with proper close

## Example Scenarios

### Valid BUY Entry (Uptrend)
```
Market: Uptrend (higher lows)

Price action:
- Makes high at 1.0950
- Makes small low at 1.0880
- LIQUIDATES small low → goes to 1.0870 ⚡
- Reverses up, creating swing low at 1.0870
- Continues up to 1.0950 (swing high)

Fibonacci setup:
- From: 1.0870 (swing low after liquidation)
- To: 1.0950 (swing high)
- Zone: 0.705 = 1.0926 | 0.69 = 1.0925

Entry Signal:
- Candle taps 1.0925 ✓
- Closes at 1.0928 (bullish, above zone) ✓
- ENTRY: 1.0928

Trade:
- Entry: 1.0928
- SL: 1.0920 (below entry candle)
- TP: 1.0950 (swing high)
```

### Valid SELL Entry (Downtrend)
```
Market: Downtrend (lower highs)

Price action:
- Makes low at 1.0800
- Makes small high at 1.0870
- LIQUIDATES small high → goes to 1.0880 ⚡
- Reverses down, creating swing high at 1.0880
- Continues down to 1.0800 (swing low)

Fibonacci setup:
- From: 1.0880 (swing high after liquidation)
- To: 1.0800 (swing low)
- Zone: 0.705 = 1.0824 | 0.69 = 1.0825

Entry Signal:
- Candle taps 1.0825 ✓
- Closes at 1.0822 (bearish, below zone) ✓
- ENTRY: 1.0822

Trade:
- Entry: 1.0822
- SL: 1.0830 (above entry candle)
- TP: 1.0800 (swing low)
```

### Invalid Entry Example
```
Scenario: Candle taps zone but closes WRONG

BUY Setup:
- Zone: 0.705-0.69
- Candle taps zone at 1.0925 ✓
- But closes BELOW 0.69 at 1.0924 ✗
- Result: NO ENTRY (body must stay in/above zone)

SELL Setup:
- Zone: 0.705-0.69  
- Candle taps zone at 1.0825 ✓
- But closes ABOVE zone at 1.0826 ✗
- Result: NO ENTRY (body must stay in/below zone)
```

## Troubleshooting

### Strategy Not Triggering
- ✅ Check trend direction (green background = uptrend, red = downtrend)
- ✅ Verify liquidation occurred (yellow "LIQ" marker)
- ✅ Ensure zone is visible (blue for BUY, orange for SELL)
- ✅ Confirm candle actually tapped the zone

### Webhook Not Sending
- ✅ Verify webhook URL in strategy settings
- ✅ Check alert is created with "Webhook URL" enabled
- ✅ Ensure "Once Per Bar Close" is enabled
- ✅ Test webhook URL with cURL (see main webhook guide)

### Wrong Entries
- ✅ Verify candle closed in correct direction (bullish for BUY, bearish for SELL)
- ✅ Check body didn't close outside zone (below for BUY, above for SELL)
- ✅ Confirm liquidation happened before setup

### Multiple Signals
- ✅ Ensure "Once Per Bar Close" is enabled in alert
- ✅ Check your app has duplicate prevention (60-second window)

## Integration with Your MT5 System

The strategy works seamlessly with your existing webhook system:

1. **Strategy detects setup** → BUY or SELL conditions met
2. **Alert fires** → Sends webhook to your app
3. **App receives** → `/api/webhook` endpoint processes signal
4. **App validates**:
   - Checks symbol
   - Calculates lot size based on SL distance
   - Uses exact entry, SL, TP from strategy
5. **App sends to MT5** → Via WebSocket (instant execution)
6. **MT5 executes** → Real trade with exact levels

**No additional configuration needed** - just create the alert and the system handles the rest!

---

## Quick Reference

**BUY Setup:** Uptrend → Low liquidated → Retrace to zone → Bullish close → BUY  
**SELL Setup:** Downtrend → High liquidated → Retrace to zone → Bearish close → SELL  

**Zone:** 0.705 to 0.69 (adjustable)  
**SL:** Below/above entry candle  
**TP:** Swing high/low  
**Works:** Both directions, all timeframes, trending markets
