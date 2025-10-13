# TradingView Strategies & Indicators

This folder contains Pine Script indicators and strategies designed to work seamlessly with the MT5 Trading Bridge system via webhooks. Each indicator automatically generates trading signals and sends them to your server for execution in MetaTrader 5.

## 📊 Available Indicators

### 1. ICT OTE (Optimal Trade Entry) Indicator - 0.705 Level
**File**: `ote_indicator.pine`

**Concept**: Enter trades at the precise 0.705 Fibonacci retracement level with rejection confirmation in a trending market.

**Key Features**:
- ✅ **Advanced trend detection** via market structure (higher highs/lows) + multi-timeframe confirmation
- ✅ Swing point identification for dealing range
- ✅ **Single 0.705 level visualization** (precise entry level, not a zone)
- ✅ **Rejection-based entry logic** (candle must tap level and close opposite color)
- ✅ Automatic SL/TP calculation (SL at rejection candle, TP at dealing range)
- ✅ Real-time info table with HTF trend, current trend, and levels
- ✅ Webhook integration with MT5
- ✅ **Lines move with chart** for accurate real-time tracking

**Best For**:
- Precision entries at optimal retracement level
- Scalping, day trading, and swing trading
- High probability rejection setups with long-term trend confirmation

**Setup Guide**: See [OTE_STRATEGY_GUIDE.md](./OTE_STRATEGY_GUIDE.md)

---

### 2. Fibonacci 0.705 Zone Retracement Strategy
**File**: `fibonacci_0705_strategy.pine` *(Coming Soon)*

**Concept**: Trade retracements at the precise 0.705-0.69 Fibonacci zone after liquidation moves.

**Key Features**:
- Liquidation detection (sweep of lows/highs)
- Precise 70.5-69% retracement zone
- Structure-based entry confirmation
- Tight stop-loss placement

**Best For**:
- ICT trading methodology
- Smart money concepts
- Precision entries

**Setup Guide**: See `FIBONACCI_STRATEGY_GUIDE.md`

---

### 3. Target Trend Indicator
**File**: Custom implementation *(User-configured)*

**Concept**: Trend-following indicator with custom stop-loss and take-profit levels.

**Key Features**:
- Manual SL/TP configuration
- Flexible trend detection
- Compatible with any TradingView strategy

**Best For**:
- Custom trading systems
- Flexible strategy development

---

## 🚀 Quick Start

### Step 1: Choose Your Indicator

Pick an indicator based on your trading style:
- **OTE**: Best for retracement traders who want automatic zone detection
- **Fibonacci 0.705**: Best for ICT traders who understand liquidation and structure
- **Target Trend**: Best for custom strategies with manual SL/TP

### Step 2: Add to TradingView

1. Open TradingView → Pine Editor
2. Create new indicator
3. Copy the Pine Script code from the chosen `.pine` file
4. Save and add to chart

### Step 3: Configure Settings

Each indicator has configurable settings:

**OTE Indicator**:
- Webhook URL: Your server endpoint
- Fibonacci Level: 0.705 (default) - customizable for testing
- Higher Timeframe: Daily (default) - for long-term trend confirmation
- Swing Lookback: Bars for swing detection (default: 10)
- Market Structure Period: Bars for structure analysis (default: 20)
- Visual preferences (level line, swing points, dealing range)
- Enable/disable alerts

**Note**: Position sizing is configured in the backend server settings, not in the indicator.

### Step 4: Create Alert

1. Right-click chart → Add Alert
2. Condition: "Any alert() function call"
3. Webhook URL: `https://your-app.replit.app/api/webhook`
4. Enable "Webhook URL"
5. Set frequency: "Once Per Bar Close"
6. Create alert

---

## 📡 Webhook Integration

All indicators send standardized JSON format:

```json
{
  "symbol": "EURUSD",
  "type": "BUY",
  "indicator": "ote",
  "entry": "1.0910",
  "stopLoss": "1.0900",
  "takeProfit": "1.0950"
}
```

**Note**: Position sizing is handled automatically by the backend.

### Supported Fields

| Field | Description | Example |
|-------|-------------|---------|
| `symbol` | Trading pair | "EURUSD" |
| `type` | BUY or SELL | "BUY" |
| `indicator` | Indicator name | "ote" |
| `entry` | Entry price | "1.0910" |
| `stopLoss` | Stop-loss price | "1.0900" |
| `takeProfit` | Take-profit price | "1.0950" |

**Note**: Lot size is calculated server-side based on risk settings.

### How It Works

1. **Signal Generation**: Indicator detects setup and triggers alert
2. **Webhook Sent**: TradingView sends JSON to your webhook URL
3. **Signal Created**: Server validates and creates signal
4. **Trade Execution**: If auto-trading enabled, MT5 executes trade
5. **Real-time Updates**: WebSocket broadcasts to dashboard

---

## 🎯 Indicator Comparison

| Feature | OTE 0.705 | Fibonacci 0.705 | Target Trend |
|---------|-----------|-----------------|--------------|
| **Automatic Trend** | ✅ Market Structure + HTF | ✅ Structure-based | ⚙️ Custom |
| **Level Detection** | ✅ 0.705 precise | ✅ 70.5-69% | ❌ Manual |
| **Entry Logic** | ✅ Tap + Rejection | ✅ Rejection | ⚙️ Custom |
| **SL/TP Calculation** | ✅ Auto (candle/range) | ✅ Auto | ⚙️ Manual |
| **Visual Display** | ✅ Level + Range | ✅ Yes | ⚙️ Optional |
| **HTF Confirmation** | ✅ Yes | ❌ No | ⚙️ Optional |
| **Best For** | All traders | ICT traders | Custom systems |
| **Complexity** | Medium | High | Low |

---

## 📚 Documentation

### General Guides
- **[Webhook Configuration](../TRADINGVIEW_WEBHOOK_GUIDE.md)**: Complete webhook setup guide
- **[MT5 Installation](../mt5-files/INSTALLATION_GUIDE_WEBSOCKET.md)**: Install Expert Advisor
- **[Quick Start](../mt5-files/WEBSOCKET_QUICK_START.md)**: Get started in 5 minutes

### Strategy-Specific Guides
- **[OTE Strategy Guide](./OTE_STRATEGY_GUIDE.md)**: Complete OTE setup and usage
- **Fibonacci Guide**: `FIBONACCI_STRATEGY_GUIDE.md` *(Coming Soon)*

---

## ⚙️ Advanced Configuration

### Multiple Timeframe Analysis
Run the same indicator on multiple timeframes:
1. Add indicator to 15m chart → Create alert "OTE 15m"
2. Add indicator to 1H chart → Create alert "OTE 1H"
3. Add indicator to 4H chart → Create alert "OTE 4H"

Each alert sends to the same webhook but you can filter by timeframe.

### Symbol-Specific Settings
Create different configurations per symbol:
1. EURUSD: EMA 50, Standard zone (62-79%)
2. GBPUSD: EMA 100, Narrow zone (70.5-69%)
3. XAUUSD: EMA 200, Standard zone

### Risk Management Integration
Position sizing is handled server-side based on:
- Account balance
- Risk percentage settings
- Stop-loss distance in pips

Indicators send entry, SL, and TP prices; the backend calculates optimal lot size.

---

## 🔧 Troubleshooting

### No Signals Appearing

**Problem**: Indicator not showing any signals

**Solutions**:
- Check if market is trending (OTE needs clear trend)
- Verify swing lookback isn't too restrictive
- Ensure OTE zone settings match timeframe
- Check if price has actually entered the zone

### Webhook Not Sending

**Problem**: Alerts not triggering webhook

**Solutions**:
- Verify "Enable Alerts" is ON in indicator
- Check webhook URL is correct (both indicator and alert)
- Ensure alert condition is "Any alert() function call"
- Confirm "Once Per Bar Close" is selected

### Wrong Trade Direction

**Problem**: BUY signals when should be SELL (or vice versa)

**Solutions**:
- Check trend direction (OTE follows EMA trend)
- Verify you're looking at the right timeframe
- Ensure swing points are detected correctly
- Review entry confirmation logic

### Zone Not Visible

**Problem**: OTE zones not showing on chart

**Solutions**:
- Enable "Show OTE Zones" in settings
- Increase zone transparency (decrease value)
- Verify swing points exist (green/red triangles)
- Check if max boxes limit reached (500)

---

## 🎓 Best Practices

### ✅ Do's

1. **Start with Standard Settings**: Use default parameters first
2. **Test on Demo**: Always test new indicators on demo account
3. **One Timeframe First**: Master one timeframe before adding others
4. **Monitor Initial Trades**: Watch first 10-20 signals manually
5. **Use Stop-Loss**: Always trade with protective stops
6. **Check Confluence**: Combine with other analysis (order blocks, FVGs)
7. **Backtest**: Review historical signals before live trading

### ❌ Don'ts

1. **Don't Overtrade**: Be patient for quality setups
2. **Don't Ignore Trend**: OTE works best in strong trends
3. **Don't Chase**: Wait for price to come to the zone
4. **Don't Over-Optimize**: Too much tweaking reduces edge
5. **Don't Mix Contradicting Signals**: Use one strategy at a time per symbol
6. **Don't Skip Education**: Learn the concepts behind the indicators

---

## 📈 Performance Tips

### For Scalping (5m-15m)
- Use 0.705 level with 15m HTF confirmation
- Increase swing lookback to 15-20
- Target 1:1 or 1:2 risk:reward
- Trade during active sessions only

### For Day Trading (15m-1H)
- Use 0.705 level with 1H or 4H HTF confirmation
- Default swing lookback (10)
- Target 1:2 or 1:3 risk:reward
- Focus on major pairs

### For Swing Trading (4H-Daily)
- Use 0.705 level with Daily or Weekly HTF confirmation
- Decrease swing lookback to 5-7
- Target 1:3+ risk:reward
- Trade all pairs

---

## 🔄 Updates & Changelog

### Latest Version: 2.0.0

**OTE Indicator v2.0.0** *(Latest - January 2025)*
- ✅ **Fixed indicator lines to move with chart** (uses extend=extend.right)
- ✅ **Upgraded to 0.705 precise level** (no longer a zone)
- ✅ **Advanced multi-timeframe trend detection** (market structure + HTF confirmation)
- ✅ **Rejection-based entry** (price must tap 0.705 and close opposite color)
- ✅ **Improved SL/TP placement** (SL at rejection candle, TP at dealing range)
- ✅ Displays dealing range high/low for context
- ✅ Real-time HTF trend confirmation in info table
- ✅ Webhook indicator name updated to "ote_0705"

**OTE Indicator v1.0.0**
- Initial release with zone-based entries
- EMA trend detection
- Basic swing point identification
- OTE zone (62-79% or 70.5-69%) visualization

**Fibonacci 0.705 Strategy**
- Coming soon

---

## 💡 Tips & Tricks

### Improve Signal Quality
1. **Add higher timeframe filter**: Only take 15m signals if 1H trend aligns
2. **Wait for confluence**: Better entries when OTE aligns with order blocks
3. **Check session times**: Best signals during London/NY overlap
4. **Avoid news**: Skip major news events initially

### Optimize Webhook Alerts
1. **Use descriptive names**: "OTE BUY EURUSD 1H" helps track signals
2. **Enable notifications**: Get mobile alerts for time-sensitive trades
3. **Log all signals**: Review what works and what doesn't
4. **Adjust frequency**: "Once Per Bar Close" prevents spam

### Risk Management
1. **Never risk >2% per trade**: Preserve capital for long-term success
2. **Use correlation**: Don't trade correlated pairs simultaneously
3. **Scale position size**: Reduce size during volatile periods
4. **Set daily limits**: Max 3-5 trades per day to avoid overtrading

---

## 🆘 Support

### Need Help?

1. **Check Documentation**: Read the strategy-specific guides
2. **Review Examples**: See example signals in the guides
3. **Test Settings**: Try different parameters for your style
4. **Community**: Share experiences with other traders

### Common Questions

**Q: Which indicator should I start with?**
A: Start with OTE indicator - it's automated and works on all timeframes.

**Q: Can I use multiple indicators together?**
A: Yes, but ensure they complement each other (e.g., OTE for entries, different timeframe for trend filter).

**Q: How many signals per day should I expect?**
A: Varies by timeframe and market conditions. 15m: 5-15 signals/day, 1H: 2-5 signals/day, 4H: 0-2 signals/day.

**Q: Do I need to understand ICT concepts?**
A: For OTE, basic understanding helps but isn't required. For Fibonacci 0.705, ICT knowledge is recommended.

---

## 📝 Notes

- All indicators are designed for forex trading but work on any liquid market
- Webhook URL format: `https://your-app.replit.app/api/webhook`
- TradingView Premium recommended for multiple alerts
- Always test on demo account first
- Past performance doesn't guarantee future results

---

## 🔗 Related Resources

- **[TradingView Webhook Guide](../TRADINGVIEW_WEBHOOK_GUIDE.md)**
- **[MT5 WebSocket Implementation](../mt5-files/WEBSOCKET_IMPLEMENTATION.md)**
- **[Project Documentation](../replit.md)**
- **[Design Guidelines](../design_guidelines.md)**

---

**Last Updated**: January 2025
**Version**: 1.0.0
