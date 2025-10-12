# TradingView to MT5 Bridge - FIXED VERSION Installation Guide

## 🚀 Production-Safe Expert Advisor

This guide covers installing the **FIXED version** (`TradingViewHTTP_EA_FIXED.mq5`) which resolves ALL critical issues.

---

## ✅ What's Fixed in Version 3.0

### Critical Bug Fixes:
1. **✅ Order Filling Mode** - Auto-detects broker's supported mode (FOK/IOC/Return)
2. **✅ Pip Value Calculation** - Dynamic calculation for JPY pairs, crypto, indices
3. **✅ Symbol Validation** - Checks if symbol exists and loads it automatically
4. **✅ Price/Volume Normalization** - Matches broker's tick size and lot step
5. **✅ Error Reporting** - Detailed failure reasons with retcode descriptions
6. **✅ Network Retry Logic** - Retries failed report sending (up to 3 attempts)
7. **✅ SL/TP Validation** - Prevents invalid stop loss and take profit placement

---

## 📋 Prerequisites

- MetaTrader 5 installed on your computer
- Your Replit app running (get the URL from Replit)
- Admin access to MT5 settings

---

## 🔧 Step-by-Step Installation

### Step 1: Download the Fixed EA

1. In your Replit project, navigate to `mt5-files/`
2. Download `TradingViewHTTP_EA_FIXED.mq5` to your computer

### Step 2: Install in MT5

1. Open MetaTrader 5
2. Click **File → Open Data Folder**
3. Navigate to `MQL5/Experts/`
4. Copy `TradingViewHTTP_EA_FIXED.mq5` into this folder
5. Go back to MT5
6. In the Navigator panel, right-click **"Expert Advisors"** → **Refresh**

### Step 3: Compile the EA

1. In MT5, press **F4** or click **Tools → MetaQuotes Language Editor**
2. In MetaEditor, click **File → Open** → Select `TradingViewHTTP_EA_FIXED.mq5`
3. Click **Compile** button (or press F7)
4. Verify: **"0 errors, 0 warnings"** appears at the bottom
5. Close MetaEditor

### Step 4: Enable WebRequest

**CRITICAL**: MT5 must allow HTTP requests to your server.

1. In MT5, go to **Tools → Options → Expert Advisors**
2. Check ✅ **"Allow WebRequest for listed URL:"**
3. Click **Add** and enter your Replit app URL:
   ```
   https://your-replit-app-url.replit.dev
   ```
   Example: `https://tradingbridge-abc123.replit.dev`
4. Click **OK**

### Step 5: Enable Auto-Trading

1. In MT5, click **Tools → Options → Expert Advisors**
2. Check ✅ **"Allow automated trading"**
3. Check ✅ **"Allow DLL imports"** (if available)
4. Click **OK**
5. In the main toolbar, ensure the **"AutoTrading"** button is GREEN

### Step 6: Configure the EA

1. In Navigator, expand **Expert Advisors**
2. Drag `TradingViewHTTP_EA_FIXED` onto any chart
3. In the inputs tab, configure:
   - **ServerURL**: Your Replit app URL (e.g., `https://your-app.replit.dev`)
   - **ApiSecret**: Your API secret (must match what's in the app settings)
   - **PollInterval**: `1000` (poll every 1 second)
   - **MaxReportRetries**: `3` (retry failed reports 3 times)
   - **MaxSlippagePercent**: `0.5` (0.5% max slippage)
4. In the **Common** tab:
   - Check ✅ **"Allow live trading"**
   - Check ✅ **"Allow DLL imports"**
5. Click **OK**

---

## ✅ Verify Installation

### Check 1: EA is Running
- Look at the **Experts** tab (View → Toolbox → Experts)
- You should see:
  ```
  === Initializing FIXED TradingView HTTP Polling EA ===
  Detected broker filling mode: ORDER_FILLING_FOK
  === EA initialized successfully! ===
  Polling: https://your-app.replit.dev/api/mt5/next-command
  Poll interval: 1000ms
  ```

### Check 2: Connection Status
- In your Replit app dashboard, the connection status should show **"Connected"** (green)
- This confirms MT5 is successfully polling for commands

### Check 3: Test Trade
1. Go to your app's dashboard
2. Enable **Auto-Trade**
3. Send a test signal from TradingView
4. Watch the Experts tab for:
   ```
   [COMMAND] ID: xyz123, Action: TRADE
   [TRADE] Symbol: EURUSD, Type: BUY, Volume: 0.01
   [TRADE] SL: 1.08500, TP: 1.08800
   Symbol EURUSD loaded successfully
   [TRADE SUCCESS] Order: 123456, Deal: 123456
   [REPORT] Sent successfully
   ```

---

## 🔍 Troubleshooting

### Issue: "URL not whitelisted" error
**Solution**: 
- Go to Tools → Options → Expert Advisors
- Make sure your Replit URL is in the WebRequest whitelist
- Include `https://` in the URL

### Issue: "Symbol not available" error
**Solution**: The EA now auto-loads symbols. If it still fails:
- Open Market Watch (Ctrl+M)
- Right-click → Symbols
- Find the symbol and click "Show"

### Issue: "Invalid stops" error
**Solution**: The Fixed EA validates SL/TP automatically. This means:
- Your TP/SL settings are outside broker's allowed range
- Reduce the pip distance in your app settings

### Issue: "Trade failed: retcode=10006"
**Solution**: Insufficient margin
- Check your account balance
- Reduce risk percentage in app settings

### Issue: EA not polling
**Solution**:
- Check AutoTrading is enabled (green button)
- Verify ApiSecret matches in both EA and app settings
- Restart the EA: Remove from chart and re-attach

---

## 🎯 Configuration Tips

### For Different Instruments:

**JPY Pairs (USDJPY, EURJPY)**:
- EA automatically uses 0.01 pip value
- Set TP/SL in pips normally (e.g., 20 pips = 20 points)

**Crypto (BTCUSD, ETHUSD)**:
- EA uses 1.0 pip value
- Set lower pip values (e.g., 100 pips = $100 movement)

**Indices (US30, NAS100)**:
- EA uses 1.0 point value
- Set appropriate point distances

### Optimal Settings:
- **PollInterval**: Keep at 1000ms (1 second)
- **MaxReportRetries**: 3 is good for most networks
- **MaxSlippagePercent**: 0.5% works for most brokers
- **Risk Settings**: Start with 1% risk, 20 SL, 30 TP pips

---

## ✨ Production Features

The Fixed EA includes:
- ✅ Automatic broker filling mode detection
- ✅ Dynamic pip value based on instrument type
- ✅ Symbol auto-loading and validation
- ✅ Price/volume normalization
- ✅ SL/TP direction validation
- ✅ Network retry logic (3 attempts)
- ✅ Detailed error messages
- ✅ JSON escaping for error strings

---

## 🔐 Security Notes

- Keep your `ApiSecret` secure (treat it like a password)
- Use a strong, random API secret (min 16 characters)
- Don't share your Replit URL publicly
- Monitor the Experts tab for unauthorized access attempts

---

## 📞 Support

If you encounter issues:
1. Check the Experts tab for detailed error messages
2. Check your Replit app logs (shows [WEBHOOK], [MT5-POLL], [MT5-REPORT] messages)
3. Verify all URLs and API secrets match exactly
4. Ensure AutoTrading is enabled (green button)

---

## 🚀 Next Steps

Once installed and verified:
1. Configure your TradingView alerts with the webhook URL
2. Set your desired TP/SL and risk settings in the app
3. Enable Auto-Trade
4. Monitor the first few signals to confirm everything works

**🎉 You're now ready for automated trading with a production-safe system!**
