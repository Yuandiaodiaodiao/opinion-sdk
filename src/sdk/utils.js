import { ethers } from 'ethers';
import { COLLATERAL_TOKEN_DECIMAL } from './constants.js';

/**
 * Convert human-readable amount to wei format
 * @param {string|number} amount - The amount to convert
 * @param {number} decimals - Token decimals (default: 18)
 * @returns {string} Amount in wei
 */
export function toWei(amount, decimals = COLLATERAL_TOKEN_DECIMAL) {
  try {
    return ethers.parseUnits(amount.toString(), decimals).toString();
  } catch (error) {
    throw new Error(`Failed to convert amount to wei: ${error.message}`);
  }
}

/**
 * Convert wei format to human-readable amount
 * @param {string|bigint} wei - The wei amount
 * @param {number} decimals - Token decimals (default: 18)
 * @returns {string} Human-readable amount
 */
export function fromWei(wei, decimals = COLLATERAL_TOKEN_DECIMAL) {
  try {
    return ethers.formatUnits(wei.toString(), decimals);
  } catch (error) {
    throw new Error(`Failed to convert wei to amount: ${error.message}`);
  }
}

/**
 * Generate order salt (timestamp in milliseconds)
 * @returns {string} Salt value
 */
export function generateSalt() {
  return Date.now().toString();
}

/**
 * Calculate makerAmount and takerAmount based on order parameters
 * According to the code in readme.md (lines 76-90)
 *
 * @param {object} params
 * @param {number} params.side - Order side (0: BUY, 1: SELL)
 * @param {string} params.shares - Number of shares
 * @param {string} params.limitPrice - Limit price (0-100)
 * @param {string} params.volumeType - Volume type ('Shares' or 'Amount')
 * @param {string} params.buyInputVal - Buy input value (amount in currency)
 * @param {boolean} params.isStableCoin - Whether the collateral is stablecoin
 * @returns {object} { makerAmount, takerAmount }
 */
export function calculateOrderAmounts(params) {
  const { side, shares, limitPrice, volumeType, buyInputVal, isStableCoin } = params;

  // Convert price: if not stablecoin, multiply by 100 (as per line 82 in readme)
  const price = isStableCoin ? limitPrice : String(100 * Number(limitPrice));

  let amount;

  // Calculate amount based on volume type (lines 78-83 in readme)
  if (volumeType === 'Shares') {
    // Calculate amount from shares and price
    // amount = shares * price / 100
    amount = (Number(shares) * Number(price) / 100).toFixed(2);
  } else {
    // Use the buyInputVal directly
    amount = buyInputVal;
  }

  let makerAmount, takerAmount;

  // Side 0 = BUY, Side 1 = SELL (lines 84-90 in readme)
  if (side === 0) { // BUY
    // BUY: maker provides amount, taker provides shares
    makerAmount = toWei(amount);
    takerAmount = toWei(shares);
  } else { // SELL
    // SELL: maker provides shares, taker provides amount
    makerAmount = toWei(shares);
    takerAmount = toWei(amount);
  }

  return {
    makerAmount,
    takerAmount
  };
}

/**
 * Encode Gnosis Safe signature
 * According to line 197 in readme: encodePacked([{ signer, data }])
 *
 * @param {string} signer - Signer address
 * @param {string} signature - Raw signature
 * @returns {string} Encoded signature
 */
export function encodeGnosisSafeSignature(signer, signature) {
  // Remove '0x' prefix if present
  const cleanSignature = signature.startsWith('0x') ? signature.slice(2) : signature;
  const cleanSigner = signer.toLowerCase().startsWith('0x') ? signer.slice(2) : signer;

  // Gnosis Safe signature format: signer + signature
  // According to the code, it uses encodePacked format
  return '0x' + cleanSigner.toLowerCase() + cleanSignature;
}

/**
 * Validate Ethereum address
 * @param {string} address - Address to validate
 * @returns {boolean} Whether the address is valid
 */
export function isValidAddress(address) {
  return ethers.isAddress(address);
}

/**
 * Normalize address to lowercase with 0x prefix
 * @param {string} address - Address to normalize
 * @returns {string} Normalized address
 */
export function normalizeAddress(address) {
  if (!isValidAddress(address)) {
    throw new Error(`Invalid address: ${address}`);
  }
  return address.toLowerCase();
}

/**
 * Get current timestamp in seconds
 * @returns {number} Current Unix timestamp
 */
export function getCurrentTimestamp() {
  return Math.round(Date.now() / 1000);
}
