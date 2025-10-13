# 🚀 Algo Trading Indicator - Complete Setup Guide

## 📋 Quick Setup (3 Steps)

### **Step 1: Add Indicator to TradingView**
1. Open TradingView → Pine Editor
2. Copy **ALL** code from `algo_trading.pine`
3. Click "Save" → Click "Add to Chart"

---

### **Step 2: Configure Indicator Settings**

Click the ⚙️ gear icon on the indicator to open settings:

#### **Display Settings**
- ✅ **Show Buy/Sell Labels**: ON (shows BUY/SELL arrows on chart)

#### **Alert Settings**
- ✅ **Enable Alerts**: ON (must be checked to send webhooks)
- 📍 **Webhook URL**: `https://your-app-name.replit.app/api/webhook`
  - Replace `your-app-name` with your actual Replit app name
- ✅ **Alert on Bar Close Only**: ON (prevents spam, waits for candle close)
- ✅ **Include Price in Alert**: ON (sends current price in webhook)

---

### **Step 3: Create TradingView Alert**

1. **Right-click on chart** → "Add Alert"
2. **Fill in these exact values:**

| Field | Value |
|-------|-------|
| **Condition** | `ALGO TRADING SIGNALS: any alert() function call` |
| **Alert name** | `ALGO - {{ticker}}` |
| **Message** | **(Leave EMPTY)** |
| **Webhook URL** | Same as in indicator settings |
| ✅ **Webhook URL checkbox** | **MUST BE CHECKED** |
| **Frequency** | `Once Per Bar Close` |
| **Expiration** | `Open-ended` |

3. Click **"Create"**

---

## ✅ What You'll Get

### **When BUY Signal Triggers:**
```json
{
  "symbol": "EURUSD",
  "type": "BUY",
  "indicator": "algo",
  "price": "1.0910"
}
```

### **When SELL Signal Triggers:**
```json
{
  "symbol": "EURUSD",
  "type": "SELL",
  "indicator": "algo",
  "price": "1.0850"
}
```

---

## ⚙️ Indicator Settings Explained

### **Display Settings**

| Setting | Description | Default |
|---------|-------------|---------|
| Show Buy/Sell Labels | Display BUY/SELL arrows on chart | ✅ ON |

### **Alert Settings**

| Setting | Description | Default | Notes |
|---------|-------------|---------|-------|
| **Enable Alerts** | Master switch for all alerts | ✅ ON | Must be ON to send webhooks |
| **Webhook URL** | Your Replit app endpoint | `https://your-app.replit.app/api/webhook` | Change to your actual URL |
| **Alert on Bar Close Only** | Wait for candle to close before alerting | ✅ ON | Prevents false signals |
| **Include Price in Alert** | Add current price to JSON payload | ✅ ON | Useful for logging |

---

## 🎯 Symbol-Specific Settings

The indicator automatically adjusts parameters for these symbols:

| Symbol | Source | ATR Period | ATR Multiplier | T3 Length |
|--------|--------|------------|----------------|-----------|
| **FROTO** | High | 34 | 4.0 | 36 |
| **TUPRS** | Close | 15 | 3.4 | 25 |
| **KCHOL** | Open | 12 | 3.2 | 11 |
| **ADAUSDT** | HL2 | 3 | 0.1 | 9 |
| **XRPUSDT** | Low | 3 | 0.1 | 11 |
| **YKBNK** | HLC3 | 15 | 5.5 | 13 |
| **All Others** | Close | 10 | 3.0 | 10 |

---

## 🔧 Troubleshooting

### ❌ No Alerts Sending

**Problem**: Configured everything but no webhooks arriving

**Solutions**:
1. ✅ Check **"Enable Alerts"** is ON in indicator settings
2. ✅ Verify webhook URL is correct (no typos)
3. ✅ Confirm **"Webhook URL"** checkbox is CHECKED in alert dialog
4. ✅ Make sure alert condition is "any alert() function call"
5. ✅ Test your webhook endpoint (send test POST request)

---

### ❌ Too Many Alerts

**Problem**: Getting alerts on every candle tick

**Solutions**:
1. ✅ Set **"Alert on Bar Close Only"** to ON
2. ✅ In alert dialog, select frequency: "Once Per Bar Close"

---

### ❌ Wrong Symbol Name

**Problem**: Webhook shows wrong symbol ticker

**Solutions**:
- TradingView sends the exact ticker symbol from the chart
- Check your chart ticker matches your trading account
- Example: TradingView "EURUSD" vs MT5 "EURUSDm"

---

## 📊 Testing Your Setup

### **Step 1: Test Signal Generation**
1. Add indicator to any chart
2. Look for green/red trend lines
3. Wait for a BUY or SELL arrow to appear

### **Step 2: Test Webhook Delivery**
1. Open your Replit app dashboard
2. Wait for a signal on TradingView
3. Check if signal appears in your dashboard

### **Step 3: Verify JSON Format**
Check browser console or backend logs:
```json
{
  "symbol": "BTCUSDT",
  "type": "BUY",
  "indicator": "algo",
  "price": "43250.50"
}
```

---

## 💡 Pro Tips

### 🎯 **Multiple Timeframes**
- Create separate alerts for each timeframe
- Name them: "ALGO 5M", "ALGO 15M", "ALGO 1H"
- All send to same webhook endpoint

### 🎯 **Multiple Symbols**
- Add indicator to multiple charts
- Each chart sends its own symbol name
- Backend automatically handles different symbols

### 🎯 **Disable Alerts Temporarily**
- Toggle "Enable Alerts" to OFF in indicator settings
- No need to delete the alert
- Easy to re-enable later

### 🎯 **Test Without Webhook**
- Set "Enable Alerts" to OFF
- Visual signals still appear on chart
- Perfect for backtesting strategy

---

## 🚨 Important Notes

1. **Webhook URL Must Match**: The URL in indicator settings is for reference. The actual webhook is configured in the TradingView alert dialog.

2. **Message Field Must Be Empty**: TradingView alerts - leave the "Message" field EMPTY. The indicator handles the JSON formatting.

3. **Bar Close is Critical**: Always use "Once Per Bar Close" to avoid false signals from intra-candle price action.

4. **Price Inclusion**: The "Include Price in Alert" setting is optional. Your dashboard can calculate entry price from TP/SL if needed.

---

## 📱 Alert Notification Options

In TradingView alert dialog, you can also enable:
- ✅ **Show popup**: Desktop notification
- ✅ **Send email**: Email notification (TradingView Pro required)
- ✅ **Play sound**: Audio alert
- ✅ **Send to mobile**: Mobile app notification (TradingView Pro required)

---

## ✅ Final Checklist

Before going live:
- [ ] Indicator added to chart (green/red lines visible)
- [ ] "Enable Alerts" is ON in indicator settings
- [ ] Webhook URL configured in indicator settings
- [ ] TradingView alert created with correct condition
- [ ] Webhook URL checkbox CHECKED in alert
- [ ] Message field is EMPTY
- [ ] Frequency set to "Once Per Bar Close"
- [ ] Test signal received in dashboard
- [ ] JSON format verified

---

## 🎉 You're All Set!

Your Algo Trading indicator is now:
- ✅ Detecting BUY/SELL signals automatically
- ✅ Sending clean JSON webhooks to your dashboard
- ✅ Adjusting parameters per symbol
- ✅ Fully configurable from indicator settings

**Happy Trading! 🚀**

---

**Last Updated**: January 2025  
**Indicator Version**: 1.0.0  
**Pine Script Version**: v5
