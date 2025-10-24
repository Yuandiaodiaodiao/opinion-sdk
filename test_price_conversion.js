/**
 * Test script for BigInt-based price conversion
 * Tests the formatPriceWithBigInt function
 */

function formatPriceWithBigInt(limitPrice) {
  const parts = limitPrice.toString().split('.');
  const integerPart = parts[0] || '0';
  const decimalPart = (parts[1] || '0').padEnd(2, '0');

  const fullInteger = integerPart + decimalPart;
  const bigIntValue = BigInt(fullInteger);

  const resultTimes1000 = bigIntValue * 1000n / 10000n;

  const resultStr = resultTimes1000.toString().padStart(4, '0');
  const resultInt = resultStr.slice(0, -3) || '0';
  const resultDec = resultStr.slice(-3);

  return resultInt + '.' + resultDec;
}

// Test cases
const testCases = [
  { input: '99.11', expected: '0.991' },
  { input: '99.1', expected: '0.991' },
  { input: '50.0', expected: '0.500' },
  { input: '50', expected: '0.500' },
  { input: '100', expected: '1.000' },
  { input: '0', expected: '0.000' },
  { input: '1', expected: '0.010' },
  { input: '10.5', expected: '0.105' },
  { input: '99.99', expected: '0.999' },
  { input: '0.5', expected: '0.005' },
];

console.log('Testing BigInt-based price conversion:\n');

let allPassed = true;
for (const { input, expected } of testCases) {
  const result = formatPriceWithBigInt(input);
  const passed = result === expected;
  allPassed = allPassed && passed;

  const status = passed ? '✓' : '✗';
  console.log(`${status} Input: ${input.padEnd(8)} => Output: ${result.padEnd(8)} (Expected: ${expected})`);
}

console.log('\n' + (allPassed ? 'All tests passed!' : 'Some tests failed!'));
