# Trading Bridge - TradingView to MetaTrader 5

## Project Overview
An automated trading bridge that receives trading signals from TradingView indicators and executes them in MetaTrader 5. The application provides real-time monitoring, trade execution tracking, and comprehensive settings management.

## Architecture

### Frontend (React + TypeScript)
- **Dashboard**: Real-time stats display with connection status
- **Signals Table**: Live signal monitoring with status tracking
- **Settings Panel**: MT5 configuration and trading parameters
- **WebSocket Integration**: Real-time updates for signals and stats

### Backend (Express + TypeScript)
- **Webhook Endpoint**: Receives TradingView alerts via POST /api/webhook
- **WebSocket Server**: Broadcasts real-time updates to connected clients
- **MT5 Integration**: Executes trades based on received signals
- **In-Memory Storage**: Fast signal and trade tracking

### Data Models
- **Signal**: TradingView alert with type (BUY/SELL), symbol, price, status
- **Trade**: MT5 trade execution record with profit/loss tracking
- **Settings**: MT5 credentials and trading parameters

## Key Features
✅ Real-time signal reception from TradingView webhooks
✅ Automatic trade execution in MT5
✅ Live dashboard with connection status
✅ Success rate and execution tracking
✅ Configurable lot size, spread, and slippage limits
✅ Auto-trade toggle for manual control

## Setup Instructions

### TradingView Configuration
1. Go to Settings in the dashboard
2. Copy the webhook URL displayed
3. In TradingView, create an alert on your indicator
4. Set the webhook URL in alert settings
5. Configure alert message to include signal type and symbol

### MT5 Configuration
1. Open Settings dialog
2. Enter your MT5 server address
3. Provide login credentials
4. Configure default lot size and risk parameters
5. Toggle auto-trade on/off as needed

## Technology Stack
- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Express.js, WebSocket (ws)
- **State Management**: TanStack Query
- **Forms**: React Hook Form + Zod validation
- **Styling**: Dark theme optimized for trading

## Recent Changes
- ✅ Complete schema definitions for signals, trades, and settings
- ✅ Built comprehensive dashboard with real-time stats cards
- ✅ Created signals table with live WebSocket updates
- ✅ Implemented settings dialog with MT5 configuration
- ✅ Added connection status monitoring
- ✅ Fixed WebSocket real-time updates for signal status changes
- ✅ Completed end-to-end testing: webhook → signal → trade execution → UI updates
- ✅ Verified auto-trade toggle functionality
- ✅ All features tested and working correctly

## Testing Summary
**Test Results: ✅ ALL PASSED**
- Dashboard loads with correct stats and empty states
- Settings save and persist MT5 credentials
- Webhook endpoint receives TradingView signals
- Auto-trade ON: Signals execute successfully
- Auto-trade OFF: Signals fail with proper error message
- Real-time WebSocket updates work instantly
- Success rate calculates correctly (67% = 2/3 executed)
- Connection status updates based on MT5 configuration

## User Preferences
- Dark mode by default (trading environment standard)
- Monospaced fonts for numerical data (prices, timestamps, IDs)
- Color-coded signals (green for BUY, red for SELL)
- Real-time WebSocket updates (instant, no polling needed)
- Professional fintech dashboard design
