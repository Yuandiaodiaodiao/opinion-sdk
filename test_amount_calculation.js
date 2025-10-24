/**
 * Test script for BigInt-based amount calculation
 * Tests shares * price / 100 with high precision
 */

function calculateAmountWithBigInt(shares, price) {
  const sharesParts = shares.toString().split('.');
  const sharesInt = sharesParts[0] || '0';
  const sharesDec = sharesParts[1] || '';

  const priceParts = price.toString().split('.');
  const priceInt = priceParts[0] || '0';
  const priceDec = priceParts[1] || '';

  const sharesDecPlaces = sharesDec.length;
  const priceDecPlaces = priceDec.length;
  const totalDecPlaces = sharesDecPlaces + priceDecPlaces;

  const sharesBigInt = BigInt(sharesInt + sharesDec.padEnd(sharesDecPlaces, '0'));
  const priceBigInt = BigInt(priceInt + priceDec.padEnd(priceDecPlaces, '0'));

  const product = sharesBigInt * priceBigInt;
  const divisor = BigInt(100) * (10n ** BigInt(totalDecPlaces));
  const resultScaled = (product * (10n ** 18n)) / divisor;

  const resultStr = resultScaled.toString().padStart(19, '0');
  const resultInt = resultStr.slice(0, -18) || '0';
  const resultDec = resultStr.slice(-18);

  const trimmedDec = resultDec.replace(/0+$/, '');

  if (trimmedDec === '') {
    return resultInt;
  }
  return resultInt + '.' + trimmedDec;
}

// Old method with floating point
function calculateAmountOld(shares, price) {
  return (Number(shares) * Number(price) / 100).toFixed(2);
}

// Test cases
const testCases = [
  { shares: '1.5', price: '99.11' },
  { shares: '2.5', price: '50.5' },
  { shares: '0.5', price: '99.99' },
  { shares: '10', price: '99.11' },
  { shares: '100', price: '50' },
  { shares: '1.23', price: '45.67' },
];

console.log('Comparing old vs new amount calculation:\n');

for (const { shares, price } of testCases) {
  const oldResult = calculateAmountOld(shares, price);
  const newResult = calculateAmountWithBigInt(shares, price);

  // Calculate expected ratio for verification
  const expectedRatio = (Number(price) / 100).toFixed(6);
  const actualRatio = (Number(newResult) / Number(shares)).toFixed(6);
  const ratioMatch = Math.abs(Number(expectedRatio) - Number(actualRatio)) < 0.000001;

  const status = ratioMatch ? '✓' : '✗';

  console.log(`${status} shares: ${shares.padEnd(6)} price: ${price.padEnd(6)}`);
  console.log(`  Old: ${oldResult.padEnd(20)} New: ${newResult}`);
  console.log(`  Ratio check: ${newResult}/${shares} = ${actualRatio} (expected: ${expectedRatio})`);
  console.log('');
}

console.log('Key insight: The new method maintains exact precision,');
console.log('ensuring that amount/shares = price/100 without floating point errors.');
