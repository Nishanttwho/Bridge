# Docker Setup Guide - TradingView to MT5 Bridge

## ✅ What You Get
- **One-command installation** - Everything auto-installs
- **Isolated environment** - No conflicts with your system
- **Easy to deploy** - Run on any computer/VPS with Docker

---

## 📋 Prerequisites

### Install Docker (One-time Setup)

**Windows/Mac:**
1. Download Docker Desktop: https://www.docker.com/products/docker-desktop
2. Install and start Docker Desktop
3. That's it!

**Linux (Ubuntu/Debian):**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```
Log out and log back in after installation.

---

## 🚀 Installation & Running

### Step 1: Get the Files
Download all project files to a folder on your computer.

### Step 2: Run the Application

**Open terminal/command prompt in the project folder and run:**

```bash
docker-compose up -d
```

**That's it!** The application will:
- ✅ Auto-install Node.js
- ✅ Auto-install all dependencies
- ✅ Build the application
- ✅ Start running on `http://localhost:5000`

---

## 🌐 Access Your Application

### On Local Computer:
- **Dashboard:** http://localhost:5000
- **Webhook URL:** http://localhost:5000/webhook/tradingview

⚠️ **For TradingView webhooks, you need a public URL**

### Option A: Use ngrok (Temporary URL)
```bash
# Install ngrok: https://ngrok.com/download
ngrok http 5000
```
You'll get a URL like: `https://abc123.ngrok.io`
- Use this in TradingView webhook: `https://abc123.ngrok.io/webhook/tradingview`
- ⚠️ **This URL changes every restart**

### Option B: Deploy on VPS (Permanent URL)
1. Get a VPS (DigitalOcean, AWS, etc.)
2. Install Docker on VPS
3. Copy files to VPS
4. Run `docker-compose up -d`
5. Your permanent URL: `http://your-vps-ip:5000/webhook/tradingview`

---

## 📱 Useful Commands

### View running containers:
```bash
docker ps
```

### Stop the application:
```bash
docker-compose down
```

### Restart the application:
```bash
docker-compose restart
```

### View logs:
```bash
docker-compose logs -f
```

### Update and restart:
```bash
docker-compose down
docker-compose up -d --build
```

---

## 🔧 Configuration

### MT5 Setup:
1. Install the EA file from `mt5-files/TradingViewWebSocket_EA.mq5` in MT5
2. Configure MT5 API Secret in the dashboard settings
3. Enable auto-trading in the dashboard

### TradingView Webhook Setup:
1. Create alert in TradingView
2. Set webhook URL to your public URL + `/webhook/tradingview`
3. Use JSON format from `TRADINGVIEW_WEBHOOK_GUIDE.md`

---

## ❓ Troubleshooting

### Container won't start:
```bash
# Check logs
docker-compose logs

# Rebuild
docker-compose up -d --build
```

### Port 5000 already in use:
Edit `docker-compose.yml` and change:
```yaml
ports:
  - "8080:5000"  # Use port 8080 instead
```

### Can't access from outside:
- Make sure firewall allows port 5000
- On VPS, check security group settings

---

## 📦 What's Included

All files are ready:
- ✅ Frontend dashboard
- ✅ Backend server
- ✅ WebSocket connection
- ✅ MT5 Expert Advisor
- ✅ Complete documentation

---

## 🎯 Quick Start Checklist

- [ ] Install Docker
- [ ] Run `docker-compose up -d`
- [ ] Access http://localhost:5000
- [ ] Install MT5 EA
- [ ] Configure settings
- [ ] Set up TradingView webhook
- [ ] Start trading!

---

**Need Help?** Check the other guides:
- `TRADINGVIEW_WEBHOOK_GUIDE.md` - Webhook setup
- `mt5-files/INSTALLATION_GUIDE_WEBSOCKET.md` - MT5 EA setup
- `mt5-files/WEBSOCKET_QUICK_START.md` - Quick start guide
