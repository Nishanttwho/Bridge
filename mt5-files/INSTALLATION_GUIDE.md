# MT5 HTTP Bridge Installation Guide

This guide will help you connect your MT5 terminal with the TradingView signal executor using a simple HTTP polling method.

## ✨ What's New - HTTP Method

This version uses **MT5's built-in WebRequest()** function instead of ZeroMQ:
- ✅ **No external libraries** needed
- ✅ **No DLL files** to install
- ✅ **5-minute setup** - just whitelist one URL
- ✅ **More reliable** - HTTP is battle-tested
- ✅ **Free** - no additional software needed

## Prerequisites
- MetaTrader 5 terminal installed
- Windows, Mac, or Linux OS
- Internet connection

## Step 1: Get Your Server URL

1. Go to your TradingView Signal Executor app on Replit
2. Copy the app URL (e.g., `https://your-app-name.replit.app`)
3. Keep this URL handy - you'll need it in Step 3

## Step 2: Install the Expert Advisor

1. Download `TradingViewHTTP_EA.mq5` from the `mt5-files` folder

2. Copy it to your MT5 data folder:
   - In MT5, go to **File → Open Data Folder**
   - Navigate to `MQL5/Experts/`
   - Paste the `TradingViewHTTP_EA.mq5` file here

3. Compile the EA:
   - Open MetaEditor (press F4 in MT5)
   - In MetaEditor, find `TradingViewHTTP_EA.mq5` in the Navigator
   - Double-click to open it
   - Click the **Compile** button (or press F7)
   - You should see "0 errors" in the output

## Step 3: Configure MT5 Settings

### Enable WebRequest

1. In MT5, go to: **Tools → Options → Expert Advisors**

2. Enable the following:
   - ☑ **Allow automated trading**
   - ☑ **Allow WebRequest for listed URLs**

3. In the "Add the address that the expert is allowed to refer to" field, add:
   ```
   https://your-app-name.replit.app
   ```
   (Replace with your actual Replit app URL - include `https://`)

4. Click **Add** then **OK**

## Step 4: Attach EA to Chart

1. Open any chart in MT5 (any symbol, any timeframe)

2. In the **Navigator** panel (Ctrl+N if not visible):
   - Expand **Expert Advisors**
   - Find `TradingViewHTTP_EA`

3. Drag and drop the EA onto your chart

4. In the EA settings window:
   - **Inputs** tab:
     - **ServerURL**: Enter your Replit app URL (e.g., `https://your-app-name.replit.app`)
     - **ApiSecret**: Enter a secret key (you'll set this in the app settings too)
     - **PollInterval**: Leave as `1000` (1 second)
   - **Common** tab:
     - ☑ Allow live trading
     - ☑ Allow DLL imports (not required but keep checked)
   - Click **OK**

5. You should see:
   - A smiley face icon 😊 in the top-right corner of the chart
   - Check the **Experts** tab in the Terminal window for:
     ```
     Initializing TradingView HTTP Polling EA...
     TradingView HTTP Polling EA initialized successfully!
     Polling server: https://your-app-name.replit.app/api/mt5/next-command
     ```

## Step 5: Configure App Settings

1. Go to your TradingView Signal Executor app

2. Navigate to **Settings**

3. Configure:
   - **MT5 API Secret**: Enter the same secret key you used in Step 4
   - **Account Balance**: Your trading account balance
   - **Risk Percentage**: Risk per trade (default: 1%)
   - **Auto Trade**: Enable

4. Save settings

## Step 6: Test Connection

1. In the app dashboard, check the connection status indicator:
   - **Green "Connected"** = MT5 is polling successfully
   - **Red "Disconnected"** = Check troubleshooting below

2. The connection indicator updates every second when MT5 polls the server

3. Send a test webhook from TradingView or create a test signal

4. Check MT5 **Experts** tab for execution logs

## How It Works

### Architecture

```
TradingView Webhook
        ↓
  Replit Node.js App
  (Queues Commands)
        ↓
   HTTP Polling ← MT5 Expert Advisor (every 1 second)
        ↓
    Executes Trade
        ↓
   Reports Back → Node.js App
        ↓
     Dashboard Updates
```

### Polling Process

1. **MT5 polls** the server every second: "Any trades for me?"
2. **Server responds**:
   - `204 No Content` = No trades (normal)
   - `200 OK` + command = Execute this trade!
3. **MT5 executes** the trade
4. **MT5 reports back** success/failure
5. **Dashboard updates** in real-time

## Troubleshooting

### ❌ "WebRequest error: 4060"

**Problem**: URL not whitelisted

**Solution**:
1. Go to **Tools → Options → Expert Advisors**
2. Make sure your app URL is in the allowed list
3. Include `https://` at the beginning
4. Click **Add** and **OK**
5. Restart MT5

### ❌ "Connection shows Disconnected"

**Problem**: MT5 not polling or wrong settings

**Check**:
1. EA is attached to chart (smiley face visible)
2. ServerURL in EA inputs matches your app URL exactly
3. MT5 Experts tab shows "Polling server..." message
4. API Secret in EA matches API Secret in app settings

### ❌ "Unauthorized" error in MT5 logs

**Problem**: API secret mismatch

**Solution**:
1. Check EA inputs - note the ApiSecret value
2. Go to app Settings
3. Set MT5 API Secret to the exact same value
4. Save settings

### ❌ Trades not executing

**Check**:
1. **Auto Trade** is enabled in app settings
2. EA has "Allow live trading" checked
3. Account has sufficient margin
4. Symbol exists and market is open
5. Check MT5 Experts tab for specific error messages

### ❌ EA says "URL not allowed"

**Solution**:
1. The EA will show a warning if URL isn't whitelisted
2. Follow the message instructions to add URL in Tools → Options
3. You MUST do this manually - MT5 doesn't allow programmatic whitelisting

## Security Best Practices

### API Secret
- Use a strong, random secret key
- Never share your API secret
- Change it regularly

### Network Security
- Always use HTTPS URLs (Replit provides this automatically)
- The API secret is sent in headers for authentication
- Only your MT5 with the correct secret can execute trades

## Advantages Over ZeroMQ

| Feature | HTTP Method | ZeroMQ Method |
|---------|-------------|---------------|
| Setup Time | 5 minutes | 30+ minutes |
| External Libraries | None ❌ | Yes ✅ |
| DLL Files | None ❌ | Yes ✅ |
| Compilation Errors | None ❌ | Common ✅ |
| Firewall Setup | None ❌ | Required ✅ |
| Reliability | High ✅ | Medium |
| Learning Curve | Easy ✅ | Complex |

## FAQ

### Q: How often does MT5 poll the server?
A: Every 1 second (1000ms). You can change this in the EA inputs.

### Q: Will this work on VPS?
A: Yes! Just make sure the VPS has internet access.

### Q: Can I run multiple MT5 terminals?
A: Yes, but each needs its own API secret configured in the app.

### Q: What if Replit goes down?
A: MT5 will keep polling. When Replit comes back online, it will resume working automatically.

### Q: Does this use a lot of bandwidth?
A: No. Each poll is a tiny HTTP request. Even at 1-second intervals, it uses negligible bandwidth.

## Support

If you encounter issues:

1. ✅ Check MT5 Experts tab for specific error messages
2. ✅ Verify URL is whitelisted in MT5 settings
3. ✅ Confirm API secrets match in both EA and app
4. ✅ Make sure MT5 terminal is running when testing
5. ✅ Check app is running on Replit (not sleeping)

## Next Steps

1. ✅ Test with a demo account first
2. ✅ Configure TradingView webhooks
3. ✅ Start receiving automated trading signals
4. ✅ Monitor your dashboard for real-time updates

Happy Trading! 📈
