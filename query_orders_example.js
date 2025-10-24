import 'dotenv/config';
import OpinionTradeSDK from './src/sdk/OpinionTradeSDK.js';

/**
 * Example: Query orders using OpinionTradeSDK
 */
async function main() {
  // Initialize SDK
  const sdk = new OpinionTradeSDK({
    privateKey: process.env.PRIVATE_KEY,
    makerAddress: process.env.MAKER_ADDRESS,
    authorizationToken: process.env.AUTHORIZATION_TOKEN
  });

  console.log('='.repeat(60));
  console.log('Opinion Trade SDK - Order Query Example');
  console.log('='.repeat(60));
  console.log(`Maker Address: ${sdk.getMakerAddress()}`);
  console.log();

  try {
    // Example 1: Get all open orders for the maker
    console.log('📋 Example 1: Get All Open Orders');
    console.log('-'.repeat(60));
    const openOrders = await sdk.getOpenOrders({
      limit: 5
    });
    console.log(`Total open orders: ${openOrders.total}`);
    if (openOrders.list.length > 0) {
      console.log('Recent open orders:');
      openOrders.list.forEach((order, index) => {
        console.log(`  ${index + 1}. [${order.orderId}] ${order.topicTitle}`);
        console.log(`     Outcome: ${order.outcome}, Price: ${order.price}, Amount: ${order.amount}`);
        console.log(`     Filled: ${order.filled}`);
      });
    }
    console.log();

    // Example 2: Get open orders for a specific topic
    console.log('📋 Example 2: Get Open Orders for Topic 789');
    console.log('-'.repeat(60));
    const topicOpenOrders = await sdk.getOpenOrders({
      topicId: 789,
      limit: 5
    });
    console.log(`Open orders for topic 789: ${topicOpenOrders.total}`);
    if (topicOpenOrders.list.length > 0) {
      topicOpenOrders.list.forEach((order, index) => {
        console.log(`  ${index + 1}. [${order.orderId}] ${order.topicTitle}`);
        console.log(`     Outcome: ${order.outcome}, Price: ${order.price}, Amount: ${order.amount}`);
      });
    }
    console.log();

    // Example 3: Get closed orders
    console.log('📋 Example 3: Get Closed Orders');
    console.log('-'.repeat(60));
    const closedOrders = await sdk.getClosedOrders({
      limit: 5
    });
    console.log(`Total closed orders: ${closedOrders.total}`);
    if (closedOrders.list.length > 0) {
      console.log('Recent closed orders:');
      closedOrders.list.forEach((order, index) => {
        const statusText = order.status === 2 ? 'FILLED' : order.status === 3 ? 'CANCELLED' : 'UNKNOWN';
        console.log(`  ${index + 1}. [${order.orderId}] ${order.topicTitle}`);
        console.log(`     Status: ${statusText}, Outcome: ${order.outcome}, Price: ${order.price}`);
        console.log(`     Filled: ${order.filled}, Total Price: ${order.totalPrice}`);
      });
    }
    console.log();

    // Example 4: Get closed orders for a specific topic with pagination
    console.log('📋 Example 4: Get Closed Orders for Topic 789 (Page 1)');
    console.log('-'.repeat(60));
    const topicClosedOrders = await sdk.getClosedOrders({
      topicId: 789,
      page: 1,
      limit: 3
    });
    console.log(`Closed orders for topic 789: ${topicClosedOrders.total} total, showing ${topicClosedOrders.list.length}`);
    if (topicClosedOrders.list.length > 0) {
      topicClosedOrders.list.forEach((order, index) => {
        const statusText = order.status === 2 ? 'FILLED' : order.status === 3 ? 'CANCELLED' : 'UNKNOWN';
        console.log(`  ${index + 1}. [${order.orderId}] ${statusText} - ${order.outcome} @ ${order.price}`);
        console.log(`     Filled: ${order.filled}`);
      });
    }
    console.log();

    console.log('✓ All examples completed successfully!');

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
