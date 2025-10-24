# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an SDK for Opinion Trade prediction market on BSC (Binance Smart Chain). The SDK enables limit order creation and submission for YES/NO prediction markets using Gnosis Safe multi-sig wallets with EIP-712 signature verification.

## Commands

### Development
- `npm start` - Run quickstart example
- `npm run example` - Run example script
- `npm run test` - Test EIP-712 signature generation
- `npm run test:topic` - Test topic fetching
- `npm run order` - Execute order placement (place_order.js)

### Configuration
Environment variables required in `.env`:
- `PRIVATE_KEY` - Private key of Gnosis Safe owner/signer
- `MAKER_ADDRESS` - Gnosis Safe address (the actual maker)
- `AUTHORIZATION_TOKEN` - JWT Bearer token from browser network tab (optional but recommended)

## Architecture

### Core Components

**OpinionTradeSDK** (`src/sdk/OpinionTradeSDK.js`)
- Main SDK class for interacting with Opinion Trade API
- Handles order creation, signing, and submission
- Methods: `createLimitOrder()`, `buy()`, `sell()`, `buyByTopic()`, `sellByTopic()`
- Uses curl via child_process for API requests (not axios despite dependency)

**TopicAPI** (`src/sdk/TopicAPI.js`)
- Manages topic information with local file-based caching (`.cache/topics/`)
- Cache expires after 24 hours
- Fetches YES/NO token IDs for topics
- Enables simplified order creation by position name instead of token ID

**Order Builder** (`src/sdk/orderBuilder.js`)
- `buildOrderParams()` - Constructs order parameters from user inputs
- `buildApiPayload()` - Formats signed order for API submission
- Handles amount calculations for BUY/SELL sides

**Signer** (`src/sdk/signer.js`)
- `buildSignedOrder()` - Creates and signs orders using EIP-712
- Uses Gnosis Safe signature type (signatureType: 2)
- Generates salt from timestamp

**Utils** (`src/sdk/utils.js`)
- Amount conversions (wei/human-readable)
- Order amount calculations based on side, shares, price
- BUY: makerAmount = currency, takerAmount = shares
- SELL: makerAmount = shares, takerAmount = currency

**Constants** (`src/sdk/constants.js`)
- Chain: BSC (chainId: 56)
- Exchange: 0x5F45344126D6488025B0b84A3A8189F2487a7246
- Collateral: USDT (0x55d398326f99059fF775485246999027B3197955)
- EIP-712 domain and types for signature verification

### Key Patterns

1. **Gnosis Safe Integration**: SDK designed for multi-sig wallets where signer (owner) signs on behalf of maker (Safe address)

2. **EIP-712 Signing**: All orders use typed data signatures with domain separator for BSC chain

3. **Topic-based Trading**: Two approaches:
   - Direct: Specify tokenId explicitly
   - By Topic: Specify topicId + position ("YES"/"NO"), SDK fetches tokenId

4. **Price Conventions**:
   - User inputs: 0-100 (representing percentages)
   - Stablecoin API: price/100 (0.00-1.00)
   - Order amounts: Wei format (18 decimals)

5. **Caching Strategy**: Topic info cached locally to reduce API calls and improve performance

## API Endpoints

- Base URL: `https://proxy.opinion.trade:8443/api/bsc/api`
- Submit Order: `POST /v2/order`
- Topic Info: `GET /v2/topic/{topicId}`

## Scripts Usage

The repository uses JavaScript for scripting. When creating automation scripts:
- Use ES6 modules (`import`/`export`)
- Load environment variables with `dotenv/config`
- Follow the pattern in `place_order.js` for order execution
