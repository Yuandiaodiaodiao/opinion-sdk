/**
 * Opinion Trade SDK Constants
 */

// Chain configuration
export const CHAIN_ID = 56; // BSC

// Contract addresses
export const EXCHANGE_ADDRESS = '0x5F45344126D6488025B0b84A3A8189F2487a7246';
export const COLLATERAL_TOKEN_ADDRESS = '0x55d398326f99059fF775485246999027B3197955'; // USDT

// Token configuration
export const COLLATERAL_TOKEN_DECIMAL = 18;

// API configuration
export const API_BASE_URL = 'https://proxy.opinion.trade:8443/api/bsc/api';
export const API_ENDPOINTS = {
  SUBMIT_ORDER: '/v2/order',
  QUERY_ORDERS: '/v2/order'
};

// EIP-712 Domain
export const EIP712_DOMAIN = {
  name: 'OPINION CTF Exchange',
  version: '1',
  chainId: CHAIN_ID.toString(),
  verifyingContract: EXCHANGE_ADDRESS.toLowerCase()
};

// EIP-712 Types
export const EIP712_TYPES = {
  Order: [
    { name: 'salt', type: 'uint256' },
    { name: 'maker', type: 'address' },
    { name: 'signer', type: 'address' },
    { name: 'taker', type: 'address' },
    { name: 'tokenId', type: 'uint256' },
    { name: 'makerAmount', type: 'uint256' },
    { name: 'takerAmount', type: 'uint256' },
    { name: 'expiration', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'feeRateBps', type: 'uint256' },
    { name: 'side', type: 'uint8' },
    { name: 'signatureType', type: 'uint8' }
  ]
};

// Order side
export const Side = {
  BUY: 0,
  SELL: 1
};

// Signature type
export const SignatureType = {
  POLY_GNOSIS_SAFE: 2
};

// Market type
export const MarketType = {
  MARKET: 'Market',
  LIMIT: 'Limit'
};

// Trading method for API
export const TradingMethod = {
  MARKET: 1,
  LIMIT: 2
};

// Volume type
export const VolumeType = {
  SHARES: 'Shares',
  AMOUNT: 'Amount'
};

// Yes/No position
export const YesOrNo = {
  YES: 1,
  NO: 2
};

// Zero address
export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

// Order query types
export const OrderQueryType = {
  OPEN: 1,      // 未完成订单
  CLOSED: 2     // 已完成/取消订单
};

// Order status
export const OrderStatus = {
  OPEN: 1,         // 未完成
  FILLED: 2,       // 已完成
  CANCELLED: 3     // 已取消
};
