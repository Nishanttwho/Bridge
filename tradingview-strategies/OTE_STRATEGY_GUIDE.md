# ICT OTE (Optimal Trade Entry) Strategy Guide

## Overview

The **OTE (Optimal Trade Entry)** indicator implements ICT's (Inner Circle Trader) concept of entering trades at optimal retracement zones within a trending market. This indicator automatically identifies trends, swing points, and generates high-probability entry signals when price retraces into the OTE zone (62%-79% Fibonacci retracement) and shows confirmation.

## Core Concept

**Think of OTE as "buying the best part of a retracement inside a trend."**

### How It Works

1. **Trend Identification**: Uses EMA or market structure (higher highs/higher lows)
2. **Swing Range**: Identifies the dealing range (LOW → HIGH in uptrend, HIGH → LOW in downtrend)
3. **OTE Zone**: The sweet spot between 62%-79% Fibonacci retracement (or narrow 70.5%-69% zone)
4. **Entry Confirmation**: Price taps the zone and closes in the direction of the trend
5. **Risk Management**: Tight stop-loss below entry candle, target at swing extreme

---

## Strategy Logic

### For BUY Signals (Uptrend)

1. ✅ **Trend confirmed** - Price above EMA or showing higher highs & higher lows
2. ✅ **Swing identified** - Recent LOW → HIGH move detected
3. ✅ **Fibonacci drawn** - Automatically from swing low to swing high
4. ✅ **Price retraces** - Into the OTE zone (62%-79% or 70.5%-69%)
5. ✅ **Candle confirmation** - Touches zone (wick OK) and closes bullish
6. ✅ **Entry condition** - Close does not fall below zone bottom
7. 🎯 **Entry**: Close price | **SL**: Entry candle low | **TP**: Swing high

### For SELL Signals (Downtrend)

1. ✅ **Trend confirmed** - Price below EMA or showing lower highs & lower lows
2. ✅ **Swing identified** - Recent HIGH → LOW move detected
3. ✅ **Fibonacci drawn** - Automatically from swing high to swing low
4. ✅ **Price retraces** - Into the OTE zone (62%-79% or 70.5%-69%)
5. ✅ **Candle confirmation** - Touches zone (wick OK) and closes bearish
6. ✅ **Entry condition** - Close does not rise above zone top
7. 🎯 **Entry**: Close price | **SL**: Entry candle high | **TP**: Swing low

---

## TradingView Setup Instructions

### Step 1: Add Indicator to TradingView

1. Open TradingView and go to your chart
2. Click **Pine Editor** at the bottom of the screen
3. Create a new indicator
4. Copy the entire code from `tradingview-strategies/ote_indicator.pine`
5. Paste it into the Pine Editor
6. Click **Save** and give it a name (e.g., "ICT OTE Indicator")
7. Click **Add to Chart**

### Step 2: Configure Indicator Settings

Click the ⚙️ **Settings** icon on the indicator and configure:

#### Webhook Settings
- **Webhook URL**: Your server's webhook endpoint (e.g., `https://your-app.replit.app/api/webhook`)

#### OTE Settings
- **Use Narrow Zone**: Toggle between 62-79% (default) or 70.5-69% (more precise)
- Default: OFF (uses 62-79% zone)

#### Trend Settings
- **EMA Length**: Period for trend detection (default: 50)
- **Swing Lookback**: Bars to look back for swing detection (default: 10)

#### Note on Position Sizing
Position sizing (lot size) is calculated automatically by the backend server based on:
- Account balance
- Risk percentage settings
- Stop-loss distance in pips

The indicator only sends entry, stop-loss, and take-profit prices to the server.

#### Visual Settings
- **Show OTE Zones**: Display colored zones on chart
- **Show Swing Points**: Show swing high/low markers
- **Zone Transparency**: Adjust zone visibility (0-95%)

#### Alert Settings
- **Enable Alerts**: Turn on/off webhook alerts

### Step 3: Create TradingView Alert

1. **Right-click** on the chart → **Add Alert** (or click the alarm clock icon)
2. **Condition**: Select "ICT OTE Indicator" and "Any alert() function call"
3. **Alert name**: "OTE Signal - {{ticker}}"
4. **Message**: Leave empty (the indicator sends formatted JSON automatically)
5. **Webhook URL**: Paste your webhook endpoint
   ```
   https://your-app.replit.app/api/webhook
   ```
6. **Options**:
   - ✅ Enable **Webhook URL**
   - Set frequency to **Once Per Bar Close**
   - Enable **"Send SMS"** or **"Show Popup"** if desired
7. Click **Create**

---

## Webhook Alert Format

When a signal is generated, the indicator automatically sends this JSON format:

### BUY Signal Example
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

### SELL Signal Example
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

**Note**: Lot size is calculated automatically by the backend based on your risk management settings.

---

## Visual Indicators on Chart

### What You'll See

1. **EMA Line**: Green (uptrend) or Red (downtrend)
2. **Swing Points**: 
   - 🔺 Green triangles below bars (swing lows)
   - 🔻 Red triangles above bars (swing highs)
3. **OTE Zones**: 
   - Green semi-transparent box (buy zone in uptrend)
   - Red semi-transparent box (sell zone in downtrend)
4. **Entry Signals**:
   - **BUY OTE** label (green) below entry candle
   - **SELL OTE** label (red) above entry candle
5. **Risk Levels**:
   - Blue solid line: Entry price
   - Red dashed line: Stop Loss
   - Green dashed line: Take Profit
6. **Info Table** (top-right):
   - Current trend
   - OTE zone percentage
   - Swing levels
   - Alert status

---

## Integration with MT5 Trading Bridge

This indicator is designed to work seamlessly with your MT5 Trading Bridge system:

1. **Automatic Signal Creation**: When alert triggers, webhook creates a signal in your system
2. **Auto-Trading**: If auto-trading is enabled, trades are executed automatically in MT5
3. **Real-time Updates**: WebSocket broadcasts signal and trade updates to dashboard
4. **Position Tracking**: Monitor open positions in real-time
5. **Stats & Analytics**: Track performance metrics automatically

### Required System Configuration

1. Ensure your MT5 Expert Advisor (EA) is running
2. WebSocket connection between EA and server is active
3. Symbol mapping is configured (TradingView symbol → MT5 symbol)
4. Auto-trading is enabled (if you want automatic execution)

---

## Best Practices

### ✅ DO:
- **Use on trending markets**: OTE works best in clear uptrends/downtrends
- **Wait for confirmation**: Only enter when candle closes in direction
- **Respect the zone**: Don't chase price beyond the OTE zone
- **Use proper risk management**: 1-2% risk per trade
- **Combine with higher timeframe analysis**: Check HTF trend alignment
- **Monitor swing points**: Ensure structure supports the trade

### ❌ DON'T:
- **Trade in ranging/choppy markets**: OTE needs clear trends
- **Enter on wick touches alone**: Wait for candle close confirmation
- **Ignore stop-loss**: Always use protective stops
- **Overtrade**: Be patient for quality setups
- **Use in low-liquidity periods**: Avoid major news events initially
- **Ignore higher timeframe context**: Check if HTF supports the move

---

## Troubleshooting

### No Signals Appearing
- Check if trend is clear (price should be strongly above/below EMA)
- Verify swing lookback period isn't too small/large
- Ensure OTE zone settings are appropriate for the timeframe
- Check if price has actually retraced into the zone

### Alerts Not Sending
- Verify "Enable Alerts" is ON in indicator settings
- Check webhook URL is correct in both indicator and TradingView alert
- Ensure alert is set to "Once Per Bar Close"
- Confirm alert condition is "Any alert() function call"

### Zones Not Displaying
- Enable "Show OTE Zones" in settings
- Adjust zone transparency for better visibility
- Verify swing points are being detected (green/red triangles)

### Too Many/Few Signals
- **Too many**: Use narrow zone (70.5-69%), increase swing lookback
- **Too few**: Use wider zone (62-79%), decrease swing lookback
- Adjust EMA length to match your trading timeframe

---

## Recommended Timeframes

- **Scalping**: 5m, 15m charts (use narrow zone)
- **Day Trading**: 15m, 1H charts (standard zone)
- **Swing Trading**: 4H, Daily charts (standard zone)
- **Position Trading**: Daily, Weekly charts (wider zone acceptable)

---

## Example Trading Scenario

### Uptrend BUY Setup

1. **Market Context**: EURUSD on 1H chart, price above 50 EMA
2. **Swing Formation**: Price drops to 1.0850 (swing low), rallies to 1.0950 (swing high)
3. **OTE Zone**: Automatically calculated at 1.0888-1.0912 (62-79% retracement)
4. **Price Action**: Price retraces to 1.0905, forms bullish candle
5. **Entry Signal**: Candle closes at 1.0910 (inside zone, bullish close)
6. **Trade Setup**:
   - **Entry**: 1.0910
   - **Stop Loss**: 1.0900 (below entry candle low)
   - **Take Profit**: 1.0950 (swing high)
   - **Risk**: 10 pips | **Reward**: 40 pips | **RR**: 1:4

---

## Advanced Tips

### Confluence Factors
Combine OTE with:
- **Order blocks**: Look for OTE zones near institutional order blocks
- **Fair value gaps**: OTE retracement into unfilled gaps increases probability
- **Liquidity zones**: Price often sweeps liquidity before entering OTE
- **Session times**: London/NY open often provide best setups

### Zone Refinement
- **Standard 62-79%**: Good for all timeframes, more signals
- **Narrow 70.5-69%**: Higher precision, fewer but higher quality signals
- **Sweet spot 70.5%**: ICT's preferred optimal entry level

### Risk Management
- **Conservative**: Risk 1% per trade, target 1:2 RR minimum
- **Moderate**: Risk 1-2% per trade, target 1:2-1:3 RR
- **Aggressive**: Risk 2% per trade, scale out at 1:1, let runner go to 1:3+

---

## Quick Reference

| Setting | Conservative | Moderate | Aggressive |
|---------|-------------|----------|------------|
| OTE Zone | Narrow (70.5-69%) | Standard (62-79%) | Standard (62-79%) |
| EMA Period | 100-200 | 50-100 | 20-50 |
| Swing Lookback | 15-20 | 10-15 | 5-10 |
| Timeframe | 4H-Daily | 1H-4H | 15m-1H |
| Risk per Trade | 0.5-1% | 1-2% | 2-3% |

---

## Support & Resources

- **Documentation**: See `TRADINGVIEW_WEBHOOK_GUIDE.md` for webhook setup
- **MT5 Setup**: See `mt5-files/INSTALLATION_GUIDE_WEBSOCKET.md`
- **ICT Concepts**: Study original ICT materials for deeper understanding
- **Attached Materials**: Review the OTE explanation document in `attached_assets/`

---

## Changelog

### Version 1.0.0
- Initial release
- Automatic trend detection via EMA
- Swing point identification
- OTE zone calculation (62-79% and 70.5-69%)
- Visual zone and signal display
- Webhook alert integration
- Customizable settings for all parameters
- Real-time info table display
