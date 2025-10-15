# Trading Bridge - TradingView to MetaTrader 5

## Overview
This project is an automated trading bridge designed to receive trading signals from TradingView indicators and execute them directly in MetaTrader 5 (MT5). Its primary purpose is to automate trading strategies, providing real-time monitoring, trade execution tracking, and extensive configuration options. The system aims to offer a reliable and low-latency solution for traders looking to automate their TradingView-based strategies within the MT5 environment.

## User Preferences
- Dark mode by default (trading environment standard)
- Monospaced fonts for numerical data (prices, timestamps, IDs)
- Color-coded signals (green for BUY, red for SELL)
- Real-time WebSocket updates (instant, no polling needed)
- Professional fintech dashboard design

## System Architecture

### UI/UX Decisions
The user interface features a professional fintech dashboard with a default dark mode, optimized for a trading environment. It utilizes monospaced fonts for critical numerical data and color-coding (green for BUY, red for SELL) for clear signal visualization. Real-time updates are driven by WebSockets.

### Technical Implementations
The application consists of a React and TypeScript frontend and an Express and TypeScript backend.
-   **Frontend**: Provides a real-time dashboard, a signals table for live monitoring, and a minimal settings panel for MT5 API secret and auto-trade toggle. All trading parameters (SL/TP/Lot Size) are configured directly in the EA. It integrates with WebSockets for real-time data updates.
-   **Backend**: Features a webhook endpoint for receiving TradingView alerts, a WebSocket server for broadcasting updates, and a direct WebSocket-based communication with MT5 for instant trade execution. In-memory storage is used for fast signal and trade tracking. Server forwards minimal volume (0.01) and indicator-provided SL/TP to EA, letting EA make final decisions.
-   **Data Models**: Includes `Signal` (TradingView alert with type, symbol, price, status, and optional indicator fields), `Trade` (MT5 execution record with P/L), and `Settings` (MT5 API secret, account balance for monitoring, and auto-trade flag).

### Feature Specifications
-   **Real-time Signal Reception**: Processes TradingView webhooks for immediate signal intake.
-   **Automated Trade Execution**: Automatically executes trades in MT5 based on received signals.
-   **Live Dashboard**: Displays connection status, real-time statistics, and success rates.
-   **Minimal Dashboard Settings**: Dashboard only configures MT5 API secret and auto-trade toggle. All trading parameters managed via EA inputs.
-   **EA-Controlled Trading Parameters** (January 2025):
    -   **Stop Loss**: `EnableStopLoss` (bool) and `StopLossPips` (double) - When enabled, EA calculates and overrides SL; when disabled, uses indicator-provided SL if available
    -   **Take Profit**: `EnableTakeProfit` (bool) and `TakeProfitPips` (double) - When enabled, EA calculates and overrides TP; when disabled, uses indicator-provided TP if available
    -   **Lot Size**: `FixedLotSize` (double, default: 0.01) - EA always uses this value, ignoring server volume
    -   **Hedging**: Automatically closes opposite positions before opening new trades (configurable via `EnableHedging`)
    -   **Pyramiding Control**: `MaxPositionsPerSymbol` limits concurrent positions per symbol
-   **Flexible Exit Strategies**:
    -   **Exit on Opposite Signal**: When both `EnableStopLoss=false` and `EnableTakeProfit=false`, trades close automatically via hedging mechanism
    -   **TP/SL Mode**: When EA flags enabled, uses EA-calculated TP/SL in pips
    -   **Indicator Mode**: When EA flags disabled, preserves and uses indicator-provided SL/TP levels
    -   **Hybrid Mode**: Mix of EA and indicator levels (e.g., EA SL + Indicator TP)
-   **Target Trend Indicator Support**: Server forwards indicator-provided entry, SL, and TP levels to EA; EA decides whether to use or override based on enable flags
-   **WebSocket-Only Communication**: Ensures zero-latency, real-time bidirectional communication between the application and MT5, eliminating HTTP polling.

### System Design Choices
The system prioritizes real-time performance and reliability through a pure WebSocket-based communication model for all MT5 interactions. It employs an in-memory storage for high-speed data access and a clear separation of concerns between frontend and backend. Trade execution order is carefully managed to open new positions before closing opposite ones, preventing execution gaps. Robust error handling and reconnection logic are implemented to prevent partial executions during MT5 disconnections.

## External Dependencies
-   **TradingView**: Source of trading signals via webhooks.
-   **MetaTrader 5 (MT5)**: Trading platform for executing trades, integrated via a custom WebSocket Expert Advisor (`TradingViewWebSocket_EA.mq5`).
-   **React**: Frontend library.
-   **TypeScript**: Programming language for both frontend and backend.
-   **Express.js**: Backend web framework.
-   **WebSocket (ws)**: Library for WebSocket communication.
-   **Tailwind CSS**: Utility-first CSS framework for styling.
-   **shadcn/ui**: UI component library.
-   **TanStack Query**: For state management in the frontend.
-   **React Hook Form + Zod**: For form handling and validation.