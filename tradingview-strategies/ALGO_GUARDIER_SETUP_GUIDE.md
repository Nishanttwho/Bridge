# Algo + Guardier 15M Filter - Setup Guide

## Overview

This indicator combines:
- **Algo Trading Indicator**: Generates buy/sell signals based on T3 and ATR
- **Guardier 15M Trend Filter**: Filters signals to only trade in the direction of the 15-minute trend

## How It Works

### Signal Logic
1. **BUY Signals**: Only triggered when:
   - Algo indicator generates a buy signal AND
   - 15-minute trend is BULLISH

2. **SELL Signals**: Only triggered when:
   - Algo indicator generates a sell signal AND
   - 15-minute trend is BEARISH

### Features
- 15-minute trend display table (BULLISH/BEARISH/NEUTRAL)
- Filtered buy/sell labels on chart
- Automatic entry, stop loss, and take profit calculation
- Webhook alerts for dashboard integration

## Installation Steps

### 1. Add Indicator to TradingView

1. Open TradingView
2. Go to Pine Editor (bottom panel)
3. Click "Create" → "New blank indicator"
4. Copy the entire content from `algo_guardier_combined.pine`
5. Paste it into the Pine Editor
6. Click "Save" and give it a name (e.g., "Algo Guardier 15M")
7. Click "Add to Chart"

### 2. Configure Settings

In the indicator settings:
- **Show 15m Trend Table**: Enable to see the 15-minute trend in top-right corner
- **Show Buy/Sell Labels**: Enable to see BUY/SELL signals on the chart

### 3. Setup Webhook Alert

1. Right-click on chart → "Add Alert"
2. **Condition**: Select your indicator → "Any alert() function call"
3. **Alert name**: "Algo Guardier Signal - {{ticker}}"
4. **Message**: Leave as default (the indicator sends JSON automatically)
5. **Webhook URL**: Enter your dashboard webhook URL:
   ```
   https://your-replit-app.replit.dev/api/webhook
   ```
6. **Options**:
   - ✅ Once Per Bar Close (recommended)
   - Set expiration time as needed
7. Click "Create"

## Webhook Message Format

The indicator sends alerts in this format:

```json
{
  "symbol": "BTCUSDT",
  "type": "BUY",
  "indicator": "algo_guardier",
  "entry": "50000.00",
  "stopLoss": "49500.00",
  "takeProfit": "51000.00"
}
```

### Fields Explained
- **symbol**: Trading pair ticker
- **type**: BUY or SELL
- **indicator**: Always "algo_guardier"
- **entry**: Entry price (close price when signal triggered)
- **stopLoss**: Stop loss level (low for BUY, high for SELL)
- **takeProfit**: Take profit level (2:1 risk/reward ratio)

## Risk Management

### Default Settings
- **Stop Loss**: Entry candle's low (for BUY) or high (for SELL)
- **Take Profit**: 2:1 risk/reward ratio
- Position size calculated by your dashboard based on risk percentage

### Symbol-Specific Optimization

The indicator has pre-configured settings for:
- FROTO, TUPRS, KCHOL (Turkish stocks)
- ADAUSDT, XRPUSDT (Crypto)
- YKBNK (Banking)
- Default settings for all other symbols

## Visual Guide

### Chart Elements
1. **Green Line**: Uptrend support (buy zone)
2. **Red Line**: Downtrend resistance (sell zone)
3. **Green Label "BUY"**: Filtered buy signal
4. **Red Label "SELL"**: Filtered sell signal
5. **Top-Right Table**: Shows 15-minute trend direction

### Trend Table Colors
- **Green**: BULLISH trend → Only BUY signals allowed
- **Red**: BEARISH trend → Only SELL signals allowed
- **Gray**: NEUTRAL → No signals

## Troubleshooting

### No Signals Appearing
- Check if 15-minute trend matches signal direction
- Verify indicator is added to correct timeframe
- Ensure "Show Buy/Sell Labels" is enabled

### Webhook Not Triggering
- Verify webhook URL is correct
- Check alert is set to "Any alert() function call"
- Ensure "Once Per Bar Close" is selected
- Check TradingView alert is active (not expired)

### Testing Alerts
- Use the built-in alert conditions:
  - "Filtered Buy Signal"
  - "Filtered Sell Signal"
- Check browser console for webhook responses
- View signals in dashboard under "Signals" tab

## Best Practices

1. **Timeframe**: Works on any timeframe, but 15-minute or higher recommended
2. **Trend Alignment**: Only trade when 15m trend is clear (not neutral)
3. **Multiple Symbols**: Set up separate alerts for each trading pair
4. **Alert Management**: Regularly check alert status in TradingView
5. **Dashboard Monitoring**: Keep dashboard open to monitor signals in real-time

## Support

If you encounter issues:
1. Check TradingView console for Pine Script errors
2. Verify webhook URL in dashboard settings
3. Test with manual alerts first before automation
4. Check dashboard logs for received webhooks

## Notes

- The 15-minute trend updates every 15 minutes
- Signals only trigger on bar close (prevents false signals)
- Duplicate signals are filtered by dashboard (60-second window)
- Auto-trading must be enabled in dashboard settings
