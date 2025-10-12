# MT5 ZeroMQ Bridge Installation Guide

This guide will help you install and configure the ZeroMQ bridge to connect your MT5 terminal with the TradingView signal executor.

## Prerequisites
- MetaTrader 5 terminal installed
- Windows OS (or Linux with Wine)
- VPS or local machine running 24/7

## Step 1: Download ZeroMQ Library for MQL5

1. Download the MQL5 ZeroMQ library from GitHub:
   - Repository: https://github.com/dingmaotu/mql-zmq
   - Download the latest release or clone the repository

2. Download the required DLL files:
   - `libzmq.dll` (64-bit for MT5)
   - `libsodium.dll` (dependency)
   
   You can get these from:
   - ZeroMQ official site: https://zeromq.org/download/
   - Or from the mql-zmq releases page

## Step 2: Install ZeroMQ in MT5

### Install DLL Files

1. Locate your MT5 installation directory (usually `C:\Program Files\MetaTrader 5`)

2. Copy the DLL files to:
   ```
   C:\Program Files\MetaTrader 5\MQL5\Libraries\
   ```

3. **Important**: For 64-bit MT5, make sure you use 64-bit DLLs

### Install MQL5 ZeroMQ Library

1. From the mql-zmq repository, copy the `Zmq` folder to:
   ```
   C:\Users\[YourUsername]\AppData\Roaming\MetaQuotes\Terminal\[TerminalID]\MQL5\Include\
   ```

2. The folder should contain files like:
   - `Zmq.mqh`
   - `Context.mqh`
   - `Socket.mqh`
   - etc.

## Step 3: Install the Expert Advisor

1. Copy `TradingViewZMQ_EA.mq5` to:
   ```
   C:\Users\[YourUsername]\AppData\Roaming\MetaQuotes\Terminal\[TerminalID]\MQL5\Experts\
   ```

2. Open MetaEditor (F4 in MT5)

3. Compile the EA:
   - Open `TradingViewZMQ_EA.mq5` in MetaEditor
   - Click "Compile" button or press F7
   - Check for any errors in the "Errors" tab

## Step 4: Configure MT5 Settings

1. In MT5, go to: **Tools → Options → Expert Advisors**

2. Enable the following:
   - ☑ Allow automated trading
   - ☑ Allow DLL imports
   - ☑ Allow WebRequest for listed URL (add your Replit URL)

3. Click OK

## Step 5: Attach EA to Chart

1. Open a chart (any symbol, any timeframe)

2. Drag and drop `TradingViewZMQ_EA` from Navigator → Expert Advisors onto the chart

3. In the EA settings window:
   - Check "Allow DLL imports"
   - Check "Allow live trading"
   - Click OK

4. You should see a smiley face icon in the top-right corner (EA is active)

5. Check the "Experts" tab in the Terminal window - you should see:
   ```
   Initializing TradingView ZeroMQ Bridge EA...
   PUSH socket bound on port 5556
   PULL socket bound on port 5555
   TradingView ZeroMQ Bridge EA initialized successfully!
   ```

## Step 6: Configure Firewall (If using VPS)

If MT5 is running on a VPS and your Node.js app is on Replit:

1. Note your VPS IP address

2. Open firewall ports 5555 and 5556 (inbound):
   ```bash
   # Windows Firewall
   netsh advfirewall firewall add rule name="ZMQ Port 5555" dir=in action=allow protocol=TCP localport=5555
   netsh advfirewall firewall add rule name="ZMQ Port 5556" dir=in action=allow protocol=TCP localport=5556
   ```

## Step 7: Update Application Settings

1. Go to your TradingView Signal Executor app

2. Navigate to Settings

3. Configure ZeroMQ connection:
   - **ZMQ Host**: 
     - `localhost` (if running on same machine)
     - `your.vps.ip.address` (if running on VPS)
   - **Push Port**: `5555` (default)
   - **Pull Port**: `5556` (default)

4. Save settings

## Step 8: Test Connection

1. In the app, check if "MT5 Connected" shows green status

2. Send a test signal from TradingView webhook or manually

3. Check MT5 Experts tab for logs showing:
   ```
   Received command: {"action":"PING"}
   Sent response: {"success":true,"data":"PONG"}
   ```

## Troubleshooting

### EA Not Compiling
- Make sure ZeroMQ library files are in the correct Include folder
- Make sure DLL files are in the Libraries folder
- Check for typos in file paths

### Connection Failed
- Verify MT5 is running with EA attached
- Check "Allow DLL imports" is enabled
- Verify firewall ports are open (if using VPS)
- Check that ports 5555 and 5556 are not used by other applications

### Trades Not Executing
- Ensure "Allow live trading" is checked in EA settings
- Check account has sufficient margin
- Verify symbol exists and market is open
- Check MT5 Experts tab for error messages

### VPS Connection Issues
- Verify VPS IP address is correct in app settings
- Ensure VPS firewall allows incoming connections on ports 5555/5556
- Test connection with telnet: `telnet your.vps.ip 5555`

## Architecture

```
TradingView Webhook
        ↓
  Replit Node.js App
        ↓
   ZeroMQ (TCP)
        ↓
   MT5 Expert Advisor
        ↓
    Broker Server
        ↓
     Market
```

## Port Configuration

- **Port 5555**: Node.js → MT5 (commands)
- **Port 5556**: MT5 → Node.js (responses)

## Support

If you encounter issues:

1. Check MT5 Experts tab for error messages
2. Check Node.js app logs for connection errors
3. Verify all installation steps were completed
4. Make sure MT5 terminal is running when testing

## Security Notes

- Only open ports 5555/5556 to trusted IP addresses
- Use VPN or SSH tunnel for additional security
- Never share your MT5 login credentials
- Keep ZeroMQ DLLs updated for security patches
