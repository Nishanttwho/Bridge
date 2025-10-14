// Test new BTC calculations

function getPipValue(symbol) {
  const upperSymbol = symbol.toUpperCase();
  if (upperSymbol.includes('BTC') || upperSymbol.includes('ETH')) {
    return 10.0;
  }
  return 0.0001;
}

const symbol = 'BTCUSD';
const signalPrice = 65000;
const slPips = 20;
const tpPips = 30;
const pipValue = getPipValue(symbol);

console.log('=== NEW BTC Calculation ===');
console.log('Entry Price:', signalPrice);
console.log('Pip Value: $' + pipValue);
console.log('');

// BUY signal
const buySlPrice = signalPrice - (slPips * pipValue);
const buyTpPrice = signalPrice + (tpPips * pipValue);

console.log('BUY Signal:');
console.log('  SL Price:', buySlPrice, '(', (signalPrice - buySlPrice), 'away)');
console.log('  TP Price:', buyTpPrice, '(', (buyTpPrice - signalPrice), 'away)');
console.log('');

// SELL signal
const sellSlPrice = signalPrice + (slPips * pipValue);
const sellTpPrice = signalPrice - (tpPips * pipValue);

console.log('SELL Signal:');
console.log('  SL Price:', sellSlPrice, '(', (sellSlPrice - signalPrice), 'away)');
console.log('  TP Price:', sellTpPrice, '(', (signalPrice - sellTpPrice), 'away)');
