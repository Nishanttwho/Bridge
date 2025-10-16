# 3-Candle Strategy - Quick Start ⚡

## 📦 What You Got

✅ **TradingView Indicator** (`3_Candle_Strategy_Indicator.pine`)
- Detects 3 consecutive bullish/bearish candles
- Auto-calculates Entry, SL, TP (1:2 RR)
- Sends complete trade setup to your app

✅ **Your EA Already Supports This!**
- Just set the flags to use indicator's SL/TP

---

## 🚀 3-Minute Setup

### **1️⃣ Add Indicator to TradingView (1 min)**
1. Open Pine Editor in TradingView
2. Copy code from `3_Candle_Strategy_Indicator.pine`
3. Save → Add to Chart
4. Done! ✅

### **2️⃣ Configure MT5 EA (30 sec)**
```
EnableStopLoss = false      ← Use indicator's SL ✅
EnableTakeProfit = false    ← Use indicator's TP ✅
FixedLotSize = 0.01
Hedging = true
```
**That's it!** The EA will now use the indicator's calculated levels.

### **3️⃣ Create TradingView Alert (1 min)**
1. Click Alert (clock icon)
2. Condition: `3-Candle Momentum Strategy` → `Any alert() function call`
3. Webhook URL: `https://your-app.replit.dev/webhook/tradingview`
4. Message: `{{strategy.order.alert_message}}`
5. Create ✅

---

## 🎯 How It Works

### **BULLISH (BUY):**
```
3 Green Candles → BUY on close
SL = 3rd candle LOW
TP = Entry + (Risk × 2)
```

### **BEARISH (SELL):**
```
3 Red Candles → SELL on close
SL = 3rd candle HIGH  
TP = Entry - (Risk × 2)
```

---

## 🔧 EA Flag Behavior

| EA Settings | What Happens |
|-------------|--------------|
| `EnableStopLoss = false`<br>`EnableTakeProfit = false` | ✅ **Uses indicator's SL/TP**<br>(3-candle strategy levels) |
| `EnableStopLoss = true`<br>`EnableTakeProfit = true` | ❌ **Overrides with EA's pips**<br>(Ignores indicator) |
| `EnableStopLoss = true`<br>`EnableTakeProfit = false` | ⚠️ **Hybrid mode**<br>(EA SL + Indicator TP) |

**💡 Recommendation:** Set **BOTH to `false`** for this strategy!

---

## 📊 Example Trade

**Chart:** BTCUSD 5-min
**3 Green Candles Form:**

```
Entry:  $45,000.00  (3rd candle close)
SL:     $44,980.00  (3rd candle low)
Risk:   $20.00
TP:     $45,040.00  (Entry + $20 × 2)
RR:     1:2 ✅
```

**Webhook Sent:**
```json
{
  "type": "BUY",
  "symbol": "BTCUSD",
  "price": 45000.00,
  "stopLoss": 44980.00,
  "takeProfit": 45040.00
}
```

**EA Receives → Opens Trade with Indicator's SL/TP ✅**

---

## ✅ Verification Checklist

- [ ] Indicator shows BUY/SELL signals on chart
- [ ] SL and TP lines appear at correct levels
- [ ] Alert fires when signal appears
- [ ] MT5 EA settings: `EnableStopLoss = false`, `EnableTakeProfit = false`
- [ ] Trade opens in MT5 with correct SL/TP
- [ ] Dashboard shows signal and trade

---

## 🔍 Common Issues

### **Q: Trades open but SL/TP are wrong**
**A:** Check EA flags:
- `EnableStopLoss = false` ← Must be false!
- `EnableTakeProfit = false` ← Must be false!

### **Q: Want to use EA's fixed pips instead**
**A:** Set flags to `true`:
- `EnableStopLoss = true` + `StopLossPips = 20`
- `EnableTakeProfit = true` + `TakeProfitPips = 40`

### **Q: Can I mix EA and indicator levels?**
**A:** Yes! Hybrid modes:
- EA SL + Indicator TP
- Indicator SL + EA TP

---

## 📚 Full Documentation

For detailed setup, troubleshooting, and examples:
👉 **Read:** `3_CANDLE_STRATEGY_SETUP_GUIDE.md`

---

**🎉 You're Ready to Trade!**

The indicator calculates everything, the EA executes perfectly.
Just make sure those flags are set to `false`! 🚀
