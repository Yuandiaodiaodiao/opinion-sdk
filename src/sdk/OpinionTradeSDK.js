import { ethers } from 'ethers';
import { exec } from 'child_process';
import { promisify } from 'util';
import {
  CHAIN_ID,
  COLLATERAL_TOKEN_ADDRESS,
  API_BASE_URL,
  API_ENDPOINTS,
  Side,
  VolumeType,
  YesOrNo,
  OrderQueryType,
  OrderStatus
} from './constants.js';
import { buildSignedOrder } from './signer.js';
import { buildOrderParams, buildApiPayload } from './orderBuilder.js';
import { TopicAPI } from './TopicAPI.js';

const execPromise = promisify(exec);

/**
 * Opinion Trade SDK
 * SDK for interacting with Opinion Trade prediction market
 */
export class OpinionTradeSDK {
  /**
   * Create an instance of OpinionTradeSDK
   *
   * @param {object} config
   * @param {string} config.privateKey - Private key of the signer (owner of Gnosis Safe)
   * @param {string} config.makerAddress - Maker address (Gnosis Safe address)
   * @param {string} [config.collateralTokenAddr] - Collateral token address (default: USDT)
   * @param {number} [config.chainId] - Chain ID (default: 56 for BSC)
   * @param {string} [config.apiBaseUrl] - API base URL (default: opinion.trade API)
   */
  constructor(config) {
    const {
      privateKey,
      makerAddress,
      authorizationToken,
      collateralTokenAddr = COLLATERAL_TOKEN_ADDRESS,
      chainId = CHAIN_ID,
      apiBaseUrl = API_BASE_URL
    } = config;

    if (!privateKey) {
      throw new Error('Private key is required');
    }

    if (!makerAddress) {
      throw new Error('Maker address (Gnosis Safe) is required');
    }

    // Create wallet from private key
    this.wallet = new ethers.Wallet(privateKey);
    this.signerAddress = this.wallet.address;

    // Store configuration
    this.makerAddress = makerAddress.toLowerCase();
    this.collateralTokenAddr = collateralTokenAddr.toLowerCase();
    this.chainId = chainId;
    this.apiBaseUrl = apiBaseUrl;
    this.authorizationToken = authorizationToken; // 可选的authorization token

    // Initialize TopicAPI for auto-fetching topic information
    this.topicAPI = new TopicAPI();
  }

  /**
   * Create and submit a limit order
   *
   * @param {object} params
   * @param {string} params.topicId - Topic ID of the prediction market
   * @param {string} params.tokenId - Token ID (YES or NO position)
   * @param {string} params.limitPrice - Limit price (0-100, max 1 decimal place)
   * @param {string} params.shares - Number of shares
   * @param {number} params.side - Order side (0: BUY, 1: SELL)
   * @param {string} [params.volumeType='Shares'] - Volume type ('Shares' or 'Amount')
   * @param {string} [params.buyInputVal='0'] - Buy input value (required if volumeType is 'Amount')
   * @param {boolean} [params.isStableCoin=true] - Whether collateral is stablecoin
   * @param {string} [params.safeRate='0'] - Safe rate
   * @returns {Promise<object>} API response
   */
  async createLimitOrder(params) {
    const {
      topicId,
      tokenId,
      limitPrice,
      shares,
      side,
      volumeType = VolumeType.SHARES,
      buyInputVal = '0',
      isStableCoin = true,
      safeRate = '0'
    } = params;

    try {
      console.log('Creating limit order...');
      console.log('Parameters:', {
        topicId,
        tokenId,
        limitPrice,
        shares,
        side: side === Side.BUY ? 'BUY' : 'SELL',
        volumeType
      });

      // Step 1: Build order parameters
      const orderParams = buildOrderParams({
        maker: this.makerAddress,
        signer: this.signerAddress,
        tokenId,
        limitPrice,
        shares,
        side,
        volumeType,
        buyInputVal,
        isStableCoin
      });

      console.log('Order parameters built');

      // Step 2: Sign the order
      const signedOrder = await buildSignedOrder(this.wallet, orderParams);

      console.log('Order signed successfully');
      console.log('Signature:', signedOrder.signature);

      // Step 3: Build API payload
      const apiPayload = buildApiPayload({
        signedOrder,
        topicId,
        limitPrice,
        collateralTokenAddr: this.collateralTokenAddr,
        chainId: this.chainId,
        isStableCoin,
        safeRate
      });

      console.log('API payload built');
      console.log('API payload preview:', JSON.stringify({
        topicId: apiPayload.topicId,
        price: apiPayload.price,
        side: apiPayload.side,
        makerAmount: apiPayload.makerAmount,
        takerAmount: apiPayload.takerAmount
      }, null, 2));
      console.log();
      // Step 4: Submit order to API
      const response = await this.submitOrder(apiPayload);

      console.log('Order submitted successfully');

      return response;
    } catch (error) {
      console.error('Failed to create limit order:', error.message);
      throw error;
    }
  }

  /**
   * Submit order to API
   * Corresponds to SubmitOrderV2 in readme.md (lines 395-396)
   *
   * @param {object} payload - Order payload
   * @returns {Promise<object>} API response
   */
  async submitOrder(payload) {
    try {
      const url = `${this.apiBaseUrl}${API_ENDPOINTS.SUBMIT_ORDER}`;
      console.log('Submitting order to API...');
      console.log('API URL:', url);
      console.log('Full payload:', JSON.stringify(payload, null, 2));

      // 将payload转义为JSON字符串用于curl
      const payloadJson = JSON.stringify(payload).replace(/"/g, '\\"');

      // 构建curl命令，添加authorization header（如果提供）
      let curlCommand = `curl -k -s -X POST "${url}" -H "Content-Type: application/json"`;

      if (this.authorizationToken) {
        // 确保token包含"Bearer "前缀
        const token = this.authorizationToken.startsWith('Bearer ')
          ? this.authorizationToken
          : `Bearer ${this.authorizationToken}`;
        curlCommand += ` -H "Authorization: ${token}"`;
        console.log('Using authorization token');
      } else {
        console.warn('⚠️  WARNING: No authorization token provided. API call may fail.');
      }

      curlCommand += ` -d "${payloadJson}"`;

      const { stdout, stderr } = await execPromise(curlCommand, {
        timeout: 30000,
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      });

      if (stderr) {
        console.error(`curl stderr: ${stderr}`);
      }

      const responseData = JSON.parse(stdout);
      console.log('API response data:', JSON.stringify(responseData, null, 2));

      if (responseData.errno !== 0) {
        throw new Error(`API error: ${responseData.errmsg || 'Unknown error'}`);
      }

      return responseData;
    } catch (error) {
      console.error('Submit order error:', error.message);
      throw error;
    }
  }

  /**
   * Helper: Create a BUY limit order
   */
  async buy(params) {
    return this.createLimitOrder({
      ...params,
      side: Side.BUY
    });
  }

  /**
   * Helper: Create a SELL limit order
   */
  async sell(params) {
    return this.createLimitOrder({
      ...params,
      side: Side.SELL
    });
  }

  /**
   * Get signer address
   */
  getSignerAddress() {
    return this.signerAddress;
  }

  /**
   * Get maker address
   */
  getMakerAddress() {
    return this.makerAddress;
  }

  /**
   * Get topic information (with caching)
   *
   * @param {string|number} topicId - Topic ID
   * @param {boolean} forceRefresh - Force refresh from API
   * @returns {Promise<object>} Topic information
   */
  async getTopicInfo(topicId, forceRefresh = false) {
    return await this.topicAPI.getTopicInfo(topicId, forceRefresh);
  }

  /**
   * Create limit order by topic (auto-fetch token IDs)
   * Only need topicId and position (YES/NO), other info will be fetched automatically
   *
   * @param {object} params
   * @param {string} params.topicId - Topic ID
   * @param {string} params.position - Position: 'YES' or 'NO'
   * @param {string} params.limitPrice - Limit price (0-100)
   * @param {string} params.shares - Number of shares
   * @param {number} params.side - Order side (0: BUY, 1: SELL)
   * @param {string} [params.volumeType='Shares'] - Volume type
   * @param {string} [params.buyInputVal='0'] - Buy input value
   * @param {boolean} [params.isStableCoin=true] - Whether collateral is stablecoin
   * @param {string} [params.safeRate='0'] - Safe rate
   * @returns {Promise<object>} API response
   */
  async createOrderByTopic(params) {
    const {
      topicId,
      position,
      limitPrice,
      shares,
      side,
      volumeType = VolumeType.SHARES,
      buyInputVal = '0',
      isStableCoin = true,
      safeRate = '0'
    } = params;

    // Validate position
    const positionUpper = position.toUpperCase();
    if (positionUpper !== 'YES' && positionUpper !== 'NO') {
      throw new Error('Position must be "YES" or "NO"');
    }

    console.log(`→ Fetching topic info for Topic ${topicId}...`);

    // Fetch topic info to get token IDs
    const topicInfo = await this.getTopicInfo(topicId);

    // Select token ID based on position
    const tokenId = positionUpper === 'YES' ? topicInfo.yesToken : topicInfo.noToken;

    if (!tokenId) {
      throw new Error(`${positionUpper} token ID not found for topic ${topicId}`);
    }

    console.log(`✓ Topic: ${topicInfo.title}`);
    console.log(`✓ Token ID (${positionUpper}): ${tokenId}`);

    // Create order with the fetched token ID
    return await this.createLimitOrder({
      topicId,
      tokenId,
      limitPrice,
      shares,
      side,
      volumeType,
      buyInputVal,
      isStableCoin,
      safeRate
    });
  }

  /**
   * Buy by topic (auto-fetch token IDs)
   *
   * @param {object} params
   * @param {string} params.topicId - Topic ID
   * @param {string} params.position - Position: 'YES' or 'NO'
   * @param {string} params.limitPrice - Limit price (0-100)
   * @param {string} params.shares - Number of shares
   * @returns {Promise<object>} API response
   */
  async buyByTopic(params) {
    return this.createOrderByTopic({
      ...params,
      side: Side.BUY
    });
  }

  /**
   * Sell by topic (auto-fetch token IDs)
   *
   * @param {object} params
   * @param {string} params.topicId - Topic ID
   * @param {string} params.position - Position: 'YES' or 'NO'
   * @param {string} params.limitPrice - Limit price (0-100)
   * @param {string} params.shares - Number of shares
   * @returns {Promise<object>} API response
   */
  async sellByTopic(params) {
    return this.createOrderByTopic({
      ...params,
      side: Side.SELL
    });
  }

  /**
   * Clear topic cache
   *
   * @param {string|number} topicId - Topic ID (optional, if not provided, clear all)
   */
  async clearTopicCache(topicId = null) {
    if (topicId) {
      await this.topicAPI.clearCache(topicId);
    } else {
      await this.topicAPI.clearAllCache();
    }
  }

  /**
   * List all cached topics
   *
   * @returns {Promise<Array>} List of cached topics
   */
  async listCachedTopics() {
    return await this.topicAPI.listCachedTopics();
  }

  /**
   * Query orders
   *
   * @param {object} params
   * @param {string} params.walletAddress - Wallet address to query
   * @param {number} params.queryType - Query type (1: open orders, 2: closed orders)
   * @param {string|number} [params.topicId] - Topic ID (optional, if not provided, query all topics)
   * @param {number} [params.page=1] - Page number
   * @param {number} [params.limit=10] - Items per page
   * @returns {Promise<object>} Orders response with list and total
   */
  async queryOrders(params) {
    const {
      walletAddress,
      queryType,
      topicId,
      page = 1,
      limit = 10
    } = params;

    if (!walletAddress) {
      throw new Error('walletAddress is required');
    }

    if (!queryType || (queryType !== OrderQueryType.OPEN && queryType !== OrderQueryType.CLOSED)) {
      throw new Error('queryType must be 1 (OPEN) or 2 (CLOSED)');
    }

    try {
      // Build URL with query parameters
      let url = `${this.apiBaseUrl}${API_ENDPOINTS.QUERY_ORDERS}?page=${page}&limit=${limit}&walletAddress=${walletAddress}&queryType=${queryType}`;

      if (topicId) {
        url += `&topicId=${topicId}`;
      }

      console.log('Querying orders...');
      console.log('URL:', url);

      // Build curl command with authorization
      let curlCommand = `curl -k -s -X GET "${url}" -H "Content-Type: application/json"`;

      if (this.authorizationToken) {
        const token = this.authorizationToken.startsWith('Bearer ')
          ? this.authorizationToken
          : `Bearer ${this.authorizationToken}`;
        curlCommand += ` -H "Authorization: ${token}"`;
      } else {
        console.warn('⚠️  WARNING: No authorization token provided. API call may fail.');
      }

      const { stdout, stderr } = await execPromise(curlCommand, {
        timeout: 30000,
        maxBuffer: 1024 * 1024 * 10
      });

      if (stderr) {
        console.error('curl stderr:', stderr);
      }

      const responseData = JSON.parse(stdout);

      if (responseData.errno !== undefined && responseData.errno !== 0) {
        throw new Error(`API error (errno: ${responseData.errno}): ${responseData.errmsg || 'Unknown error'}`);
      }

      console.log(`✓ Found ${responseData.result.total} order(s), showing ${responseData.result.list.length}`);

      return responseData.result;
    } catch (error) {
      console.error('Query orders error:', error.message);
      throw error;
    }
  }

  /**
   * Get open orders (未完成订单)
   *
   * @param {object} params
   * @param {string} [params.walletAddress] - Wallet address (default: maker address)
   * @param {string|number} [params.topicId] - Topic ID (optional)
   * @param {number} [params.page=1] - Page number
   * @param {number} [params.limit=10] - Items per page
   * @returns {Promise<object>} Orders response with list and total
   */
  async getOpenOrders(params = {}) {
    const walletAddress = params.walletAddress || this.makerAddress;
    return this.queryOrders({
      ...params,
      walletAddress,
      queryType: OrderQueryType.OPEN
    });
  }

  /**
   * Get closed orders (已完成/取消订单)
   *
   * @param {object} params
   * @param {string} [params.walletAddress] - Wallet address (default: maker address)
   * @param {string|number} [params.topicId] - Topic ID (optional)
   * @param {number} [params.page=1] - Page number
   * @param {number} [params.limit=10] - Items per page
   * @returns {Promise<object>} Orders response with list and total
   */
  async getClosedOrders(params = {}) {
    const walletAddress = params.walletAddress || this.makerAddress;
    return this.queryOrders({
      ...params,
      walletAddress,
      queryType: OrderQueryType.CLOSED
    });
  }
}

export default OpinionTradeSDK;
