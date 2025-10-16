# 3-Candle Momentum Strategy - Complete Setup Guide

## 📊 Strategy Overview

**BULLISH SIGNAL:**
- ✅ 3 consecutive green (bullish) candles form
- 📈 Enter **BUY** on 3rd candle close
- 🛑 Stop Loss = 3rd candle's **low**
- 🎯 Take Profit = **1:2 Risk/Reward** ratio

**BEARISH SIGNAL:**
- ✅ 3 consecutive red (bearish) candles form
- 📉 Enter **SELL** on 3rd candle close
- 🛑 Stop Loss = 3rd candle's **high**
- 🎯 Take Profit = **1:2 Risk/Reward** ratio

---

## 🔧 Step 1: Add Indicator to TradingView

1. **Open TradingView** and go to your chart
2. Click **Pine Editor** (bottom of screen)
3. **Copy the entire code** from `3_Candle_Strategy_Indicator.pine`
4. **Paste** into Pine Editor
5. Click **"Save"** then **"Add to Chart"**
6. ✅ You'll see BUY/SELL signals with SL/TP levels!

---

## 🔔 Step 2: Create Alert in TradingView

### **Important: Configure MT5 EA First!**

Before setting up alerts, configure your EA settings:

#### **For Indicator-Provided SL/TP (Recommended):**
```
EnableStopLoss = false     ← Uses indicator's calculated SL
EnableTakeProfit = false   ← Uses indicator's calculated TP
```

#### **For EA Fixed SL/TP:**
```
EnableStopLoss = true      ← Overrides with EA's StopLossPips
EnableTakeProfit = true    ← Overrides with EA's TakeProfitPips
```

### **Now Create the Alert:**

1. **Click Alert button** (clock icon in top toolbar)
2. **Set Condition:**
   - Indicator: `3-Candle Momentum Strategy`
   - Trigger: `Any alert() function call`

3. **Alert Actions:**
   - ✅ Check **"Webhook URL"**
   - URL: `https://your-replit-app.replit.dev/webhook/tradingview`
   - Replace `your-replit-app` with your actual Replit URL

4. **Message - DO NOT MODIFY, use EXACTLY this:**
   ```
   {{strategy.order.alert_message}}
   ```
   ⚠️ **IMPORTANT:** Don't add any custom text! The indicator already formats the JSON.

5. **Alert Settings:**
   - Name: `3-Candle Strategy Alerts`
   - Options: `Once Per Bar Close`
   - Expiration: `Open-ended`

6. **Click "Create"** ✅

---

## 📋 Step 3: Verify EA Settings

Open your **MT5 Expert Advisor** settings:

### **Option A: Use Indicator SL/TP (3-Candle Strategy)**
```
EnableStopLoss = false      ← EA will use indicator's SL
EnableTakeProfit = false    ← EA will use indicator's TP
FixedLotSize = 0.01         ← Your preferred lot size
Hedging = true              ← Close opposite trades
```

### **Option B: Use EA Fixed SL/TP (Override Indicator)**
```
EnableStopLoss = true       ← EA calculates own SL
StopLossPips = 20           ← Fixed SL in pips
EnableTakeProfit = true     ← EA calculates own TP
TakeProfitPips = 40         ← Fixed TP in pips
FixedLotSize = 0.01         ← Your preferred lot size
```

**💡 Recommendation:** Use **Option A** to get the strategy's precise SL/TP based on candle structure!

---

## 🧪 Step 4: Test the Setup

1. **Wait for 3 consecutive green or red candles** on your chart (5-minute timeframe recommended)

2. **When signal appears:**
   - 📊 Check TradingView alert fires
   - 📱 Check MT5 receives the trade
   - ✅ Verify SL and TP are set correctly

3. **Verify in Dashboard:**
   - Signal appears in "Signals" table
   - Trade shows in MT5 positions
   - SL/TP match the indicator's levels

---

## 🎯 How It Works

### **Calculation Example (BUY):**

**3 Green Candles:**
- Candle 1: Close > Open ✅
- Candle 2: Close > Open ✅  
- Candle 3: Close > Open ✅

**Entry Price:** Close of 3rd candle = **$2000.00**
**Stop Loss:** Low of 3rd candle = **$1990.00**
**Risk:** $2000 - $1990 = **$10.00**
**Take Profit:** $2000 + ($10 × 2) = **$2020.00** (1:2 RR)

---

## 🔍 Troubleshooting

### ❌ **Alert Not Firing:**
- Check alert is active (not expired)
- Verify condition is set correctly
- Ensure chart timeframe matches (5-min recommended)

### ❌ **Trade Not Executing:**
- Check MT5 EA is running
- Verify WebSocket connection (green status in dashboard)
- Check Auto-Trade is enabled in settings
- Review Error Logs in dashboard

### ❌ **Wrong SL/TP Levels:**
- **If EA flags are `true`:** EA overrides with its own calculations
- **If EA flags are `false`:** Check indicator calculated levels correctly
- Verify symbol mapping (GOLD → XAUUSD, etc.)

### ❌ **Symbol Mismatch:**
- TradingView uses: `BTCUSD`, `GOLD`, `EURUSD`
- MT5 might use: `BTCUSDm`, `XAUUSD`, `EURUSD.e`
- Add symbol mapping in dashboard settings

---

## 📊 Webhook JSON Format

The indicator sends this JSON automatically:

**BUY Signal:**
```json
{
  "type": "BUY",
  "symbol": "BTCUSD",
  "price": 45000.50,
  "stopLoss": 44980.30,
  "takeProfit": 45040.90,
  "source": "3-candle-strategy"
}
```

**SELL Signal:**
```json
{
  "type": "SELL",
  "symbol": "BTCUSD",
  "price": 45000.50,
  "stopLoss": 45020.70,
  "takeProfit": 44960.10,
  "source": "3-candle-strategy"
}
```

---

## ⚙️ Customization

### **Change Risk/Reward Ratio:**
In indicator settings, adjust:
- `Risk:Reward Ratio = 2.0` → Change to 3.0 for 1:3 RR

### **Different Timeframes:**
The strategy works on any timeframe:
- **5-min:** Fast signals, more trades
- **15-min:** Medium frequency
- **1-hour:** Slower, higher quality signals

---

## ✅ Quick Checklist

- [ ] Indicator added to TradingView chart
- [ ] Alert created with webhook URL
- [ ] Message set to `{{strategy.order.alert_message}}`
- [ ] MT5 EA running with correct settings
- [ ] `EnableStopLoss = false` for indicator SL
- [ ] `EnableTakeProfit = false` for indicator TP
- [ ] WebSocket connected (green in dashboard)
- [ ] Auto-Trade enabled in settings
- [ ] Test signal verified successfully

---

## 📝 Summary

This strategy automatically:
1. ✅ Detects 3 consecutive candles (bullish/bearish)
2. ✅ Calculates entry at 3rd candle close
3. ✅ Sets SL at 3rd candle's low/high
4. ✅ Calculates TP at 1:2 risk/reward ratio
5. ✅ Sends complete trade setup to MT5
6. ✅ EA executes with indicator's exact levels

**🎯 Result:** Fully automated trading with precise SL/TP from candle structure!
