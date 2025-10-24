# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an SDK for Opinion Trade prediction market on BSC (Binance Smart Chain). The SDK enables limit order creation, submission, and querying for YES/NO prediction markets using Gnosis Safe multi-sig wallets with EIP-712 signature verification.

## Commands

### Development
- `npm start` - Run quickstart example
- `npm run example` - Run example script
- `npm run test` - Test EIP-712 signature generation
- `npm run test:topic` - Test topic fetching
- `npm run order` - Execute order placement (place_order.js)
- `npm run query` - Query orders example (query_orders_example.js)

### Configuration
Environment variables required in `.env`:
- `PRIVATE_KEY` - Private key of Gnosis Safe owner/signer
- `MAKER_ADDRESS` - Gnosis Safe address (the actual maker)
- `AUTHORIZATION_TOKEN` - JWT Bearer token from browser network tab (required for order queries)

## Architecture

### Core Components

**OpinionTradeSDK** (`src/sdk/OpinionTradeSDK.js`)
- Main SDK class for interacting with Opinion Trade API
- Order creation methods: `createLimitOrder()`, `buy()`, `sell()`, `buyByTopic()`, `sellByTopic()`
- Order query methods: `queryOrders()`, `getOpenOrders()`, `getClosedOrders()`
- Topic info methods: `getTopicInfo()`, `clearTopicCache()`, `listCachedTopics()`
- Uses curl via child_process for API requests (not axios despite dependency)
- All methods require authorization token in constructor for authenticated endpoints

**TopicAPI** (`src/sdk/TopicAPI.js`)
- Manages topic information with local file-based caching (`.cache/topics/`)
- Cache expires after 24 hours
- Fetches YES/NO token IDs for topics
- Enables simplified order creation by position name instead of token ID
- Methods: `getTopicInfo()`, `clearCache()`, `clearAllCache()`, `listCachedTopics()`

**Order Builder** (`src/sdk/orderBuilder.js`)
- `buildOrderParams()` - Constructs order parameters from user inputs
- `buildApiPayload()` - Formats signed order for API submission
- `formatPriceWithBigInt()` - Converts user price (0-100) to API format using BigInt for precision
- Handles amount calculations for BUY/SELL sides

**Signer** (`src/sdk/signer.js`)
- `buildSignedOrder()` - Creates and signs orders using EIP-712
- `createOrder()` - Builds order structure with salt, maker, signer, amounts
- `signOrder()` - Signs order with wallet using ethers.signTypedData
- Uses Gnosis Safe signature type (signatureType: 2)
- Generates salt from timestamp

**Utils** (`src/sdk/utils.js`)
- Amount conversions: `toWei()`, `fromWei()` using ethers.parseUnits/formatUnits
- `calculateOrderAmounts()` - Calculates makerAmount/takerAmount based on side, shares, price
- `calculateAmountWithBigInt()` - High-precision arithmetic using BigInt to avoid floating point errors
- `encodeGnosisSafeSignature()` - Encodes signature for Gnosis Safe (signer + signature)
- BUY: makerAmount = currency, takerAmount = shares
- SELL: makerAmount = shares, takerAmount = currency

**Constants** (`src/sdk/constants.js`)
- Chain: BSC (chainId: 56)
- Exchange: 0x5F45344126D6488025B0b84A3A8189F2487a7246
- Collateral: USDT (0x55d398326f99059fF775485246999027B3197955)
- EIP-712 domain and types for signature verification
- Order query types: OrderQueryType.OPEN (1), OrderQueryType.CLOSED (2)
- Order status: OrderStatus.OPEN (1), OrderStatus.FILLED (2), OrderStatus.CANCELLED (3)
- Side enum: Side.BUY (0), Side.SELL (1)

### Key Patterns

1. **Gnosis Safe Integration**: SDK designed for multi-sig wallets where signer (owner) signs on behalf of maker (Safe address). The maker is the Gnosis Safe, signer is an owner of that Safe.

2. **EIP-712 Signing**: All orders use typed data signatures with domain separator for BSC chain. The signature format is standard ECDSA (65 bytes), not Gnosis Safe encoded format with address prefix.

3. **Topic-based Trading**: Two approaches:
   - Direct: Specify tokenId explicitly via `createLimitOrder()`
   - By Topic: Specify topicId + position ("YES"/"NO") via `createOrderByTopic()`, SDK auto-fetches tokenId

4. **Price Conventions**:
   - User inputs: 0-100 (representing percentages, max 1 decimal place)
   - Stablecoin API: price/100 rounded to 3 decimals (0.000-1.000)
   - Order amounts: Wei format (18 decimals)
   - Example: User inputs "99.1" → API receives "0.991"

5. **High-Precision Arithmetic**: All amount and price calculations use BigInt to avoid JavaScript floating point errors. This is critical for financial calculations.

6. **Caching Strategy**: Topic info cached locally in `.cache/topics/` to reduce API calls. Cache expires after 24 hours. Use `forceRefresh` parameter to bypass cache.

7. **Authorization**: Most API endpoints require Bearer token in Authorization header. Token must be extracted from browser network tab when logged into Opinion Trade.

## API Endpoints

- Base URL: `https://proxy.opinion.trade:8443/api/bsc/api`
- Submit Order: `POST /v2/order` (requires authorization)
- Query Orders: `GET /v2/order?page={page}&limit={limit}&walletAddress={address}&queryType={type}&topicId={topicId}`
  - queryType: 1 (open orders), 2 (closed orders)
  - topicId: optional filter by topic
  - Requires authorization token
- Topic Info: `GET /v2/topic/{topicId}` (public, no auth required)

## Order Lifecycle

1. **Building**: User provides topicId, position (YES/NO), price (0-100), shares
2. **Token Resolution**: If using `*ByTopic()` methods, SDK fetches tokenId from cached topic info
3. **Amount Calculation**: SDK calculates makerAmount/takerAmount based on side using BigInt arithmetic
4. **Order Creation**: Creates order structure with salt (timestamp), maker, signer, amounts
5. **Signing**: Signs order using EIP-712 with wallet private key
6. **Payload Building**: Formats signed order into API payload with price conversion
7. **Submission**: POSTs to API using curl with authorization token
8. **Response**: API returns order details including orderId

## Order Query Response Structure

```javascript
{
  result: {
    list: [
      {
        orderId: number,
        topicId: number,
        topicTitle: string,
        outcome: "YES" | "NO",
        outcomeSide: 1 | 2,  // 1=YES, 2=NO
        price: string,       // decimal format (e.g., "0.928000000000000000")
        amount: string,      // in wei format
        filled: string,      // "filled/total" format
        status: 1 | 2 | 3,   // 1=OPEN, 2=FILLED, 3=CANCELLED
        side: 1 | 2,         // 1=BUY, 2=SELL
        totalPrice: string,  // total filled value
        createdAt: number,   // unix timestamp
        chainId: string,
        currencyAddress: string,
        transNo: string
      }
    ],
    total: number
  }
}
```

## Scripts Usage

The repository uses JavaScript for scripting. When creating automation scripts:
- Use ES6 modules (`import`/`export`)
- Load environment variables with `dotenv/config`
- Follow the pattern in `place_order.js` for order execution
- Follow the pattern in `query_orders_example.js` for order queries

## Important Notes

- Never commit `.env` file (contains private keys)
- Always validate environment variables before SDK initialization
- Authorization token expires and must be refreshed from browser periodically
- Price inputs must be between 0-100 with max 1 decimal place
- All amount calculations use BigInt internally for precision
- Order amounts are always in 18-decimal wei format
- Cache directory `.cache/topics/` is git-ignored and created automatically
