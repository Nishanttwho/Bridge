# Design Guidelines: TradingView to MT5 Trading Bridge

## Design Approach
**System**: Modern fintech dashboard inspired by TradingView, Robinhood, and professional trading platforms
**Rationale**: Utility-focused trading application requiring data clarity, real-time updates, and professional credibility. Dark theme standard for trading environments to reduce eye strain during extended monitoring.

## Core Design Principles
1. **Data Clarity First**: Information hierarchy optimized for quick decision-making
2. **Professional Trust**: Clean, stable interface that conveys reliability
3. **Real-time Focus**: Visual indicators for live connection status and signal flow
4. **Minimal Distraction**: No unnecessary animations; focus on actionable data

---

## Color Palette

### Dark Mode (Primary)
- **Background**: 15 8% 12% (deep charcoal, main surface)
- **Surface**: 15 8% 16% (cards, elevated elements)
- **Border**: 15 8% 24% (subtle dividers)
- **Text Primary**: 0 0% 98% (high contrast)
- **Text Secondary**: 0 0% 70% (labels, metadata)

### Accent Colors
- **Success/Buy**: 142 76% 36% (green for buy signals, active connections)
- **Error/Sell**: 0 84% 60% (red for sell signals, disconnections)
- **Warning**: 38 92% 50% (yellow for pending states)
- **Info/Link**: 221 83% 53% (blue for actions, settings)
- **Neutral**: 0 0% 45% (inactive states)

---

## Typography
- **Primary Font**: 'Inter' or 'Roboto' via Google Fonts CDN
- **Mono Font**: 'Roboto Mono' for numerical data, timestamps, trade IDs
- **Sizes**:
  - Display: text-3xl (30px) - Dashboard title
  - Headings: text-xl (20px) - Section headers
  - Body: text-sm (14px) - Primary content
  - Small: text-xs (12px) - Metadata, timestamps
  - Mono: Use for prices, quantities, IDs

---

## Layout System
**Spacing Scale**: Use Tailwind units of 2, 4, 6, 8, 12, 16
- Component padding: p-4 to p-6
- Section gaps: gap-4 to gap-6
- Container max-width: max-w-7xl
- Grid gaps: gap-4 for cards

**Grid Structure**:
- Main dashboard: 12-column grid
- Stats cards: 3-column on desktop (grid-cols-1 md:grid-cols-3)
- Trade log: Full-width table with fixed header

---

## Component Library

### Status Indicators
- **Connection Badge**: Pill-shaped with pulsing dot animation for "Connected" state
- **Signal Counter**: Large numerical display with trend indicator
- **Success Rate**: Percentage with color-coded background (green >80%, yellow 50-80%, red <50%)

### Cards & Surfaces
- **Dashboard Cards**: Rounded-lg borders with subtle shadow, p-6 padding
- **Signal Log Card**: Table with alternating row backgrounds (hover states)
- **Settings Panel**: Form sections with grouped inputs, bg-surface elevated

### Data Display
- **Trade Table**: Fixed header, striped rows, monospaced numbers aligned right
- **Status Pills**: Small rounded badges for trade status (Executed, Pending, Failed)
- **Timestamp Format**: Monospaced, text-xs, secondary color

### Interactive Elements
- **Primary Actions**: Solid green/red buttons for Connect/Disconnect
- **Secondary Actions**: Outline buttons with hover states
- **Form Inputs**: Dark backgrounds with light borders, focus ring in info color
- **Toggle Switches**: For auto-trade enable/disable with clear on/off states

### Navigation
- **Top Bar**: Fixed header with logo, connection status, settings icon
- **Tabs**: Underlined active state for Dashboard/History/Settings sections

---

## Dashboard Layout

### Header Section
- Logo/Title (left), Connection status badge (center), Settings button (right)
- Full-width, sticky top, subtle bottom border

### Stats Overview (3-column grid)
1. **Connection Status Card**: Large icon, status text, connect/disconnect button
2. **Signals Processed Card**: Large counter, trend arrow, time period filter
3. **Success Rate Card**: Percentage display, visual bar indicator, trade count

### Main Content Area (2-column on desktop)
- **Left Column (60%)**: Real-time signal log table
  - Columns: Time, Signal Type (Buy/Sell), Symbol, Status, Action
  - Color-coded rows based on signal type
  - Auto-scroll to latest
  
- **Right Column (40%)**: 
  - MT5 Account Info panel (balance, equity, margin)
  - Recent trades summary
  - Quick settings (lot size, SL/TP)

### Settings Panel (Slide-in or Modal)
- MT5 credentials form (server, login, password)
- Trading parameters (default lot size, max spread, slippage)
- Alert preferences (sound, notifications)
- Webhook URL display (copy button)

---

## Responsive Behavior
- **Desktop (lg:)**: Full 2-column layout with stats row
- **Tablet (md:)**: Stack main content, keep stats row
- **Mobile**: Single column, collapsible sections, bottom navigation for tabs

---

## Images
No hero images required for this utility application. Focus on:
- **Logo/Icon**: Simple trading icon or bridge metaphor (TradingView → MT5)
- **Empty States**: Simple SVG illustrations for "No signals yet" or "Not connected"

---

## Special Considerations
- **Live Updates**: Use subtle flash effect when new signal arrives (brief background highlight)
- **Connection States**: Clear visual distinction between Connected (green pulsing), Disconnected (red), Connecting (yellow animated)
- **Error Handling**: Inline error messages in error color, not intrusive modals
- **Data Precision**: All prices/values use monospaced fonts, right-aligned, consistent decimal places