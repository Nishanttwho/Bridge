// Test BTC calculations

// Current getPipValue for BTC
function getPipValue(symbol) {
  const upperSymbol = symbol.toUpperCase();
  if (upperSymbol.includes('BTC')) {
    return 1.0;
  }
  return 0.0001;
}

// Current calculateLotSize
function calculateLotSize(accountBalance, riskPercentage, slPips) {
  const riskAmount = (accountBalance * riskPercentage) / 100;
  const pipValue = 10; // Standard pip value for 1 standard lot
  const riskPerStandardLot = slPips * pipValue;
  const lotSize = riskAmount / riskPerStandardLot;
  return Math.max(0.01, Number(lotSize.toFixed(2)));
}

// Test BTC BUY signal
const symbol = 'BTCUSD';
const signalPrice = 65000;
const slPips = 20;
const tpPips = 30;
const pipValue = getPipValue(symbol);

console.log('=== BTC BUY Signal Test ===');
console.log('Symbol:', symbol);
console.log('Entry Price:', signalPrice);
console.log('Pip Value:', pipValue);
console.log('SL Pips:', slPips);
console.log('TP Pips:', tpPips);

// Calculate SL/TP for BUY
const slPrice = signalPrice - (slPips * pipValue);
const tpPrice = signalPrice + (tpPips * pipValue);

console.log('\nCalculated Prices:');
console.log('SL Price:', slPrice);
console.log('TP Price:', tpPrice);

// Calculate lot size
const lotSize = calculateLotSize(10000, 1, slPips);
console.log('\nLot Size:', lotSize);

// Check if SL makes sense
if (slPrice < 0) {
  console.log('\n❌ ERROR: SL price is negative!');
}
if (slPrice >= signalPrice) {
  console.log('\n❌ ERROR: SL price should be below entry for BUY!');
}
