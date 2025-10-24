/**
 * 挂单脚本
 * Topic 789 - 限价 99 - YES SELL - 10 shares
 */

import 'dotenv/config';
import { OpinionTradeSDK } from './src/sdk/OpinionTradeSDK.js';

async function placeOrder() {
  console.log('🚀 开始挂单...\n');

  // 检查环境变量
  if (!process.env.PRIVATE_KEY) {
    console.error('❌ 错误: 请在 .env 文件中配置 PRIVATE_KEY');
    process.exit(1);
  }

  if (!process.env.MAKER_ADDRESS) {
    console.error('❌ 错误: 请在 .env 文件中配置 MAKER_ADDRESS');
    process.exit(1);
  }

  if (!process.env.AUTHORIZATION_TOKEN) {
    console.warn('⚠️  警告: 未配置 AUTHORIZATION_TOKEN，API可能会返回错误');
    console.warn('    请从浏览器网络请求中获取authorization token并添加到.env文件');
  }

  try {
    // 初始化 SDK
    const sdk = new OpinionTradeSDK({
      privateKey: process.env.PRIVATE_KEY,
      makerAddress: process.env.MAKER_ADDRESS,
      authorizationToken: process.env.AUTHORIZATION_TOKEN
    });

    console.log('✓ SDK 初始化成功');
    console.log(`  签名者: ${sdk.getSignerAddress()}`);
    console.log(`  Maker: ${sdk.getMakerAddress()}\n`);

    // 订单参数
    const orderParams = {
      topicId: '814',
      position: 'NO',
      limitPrice: '99',    // 限价 0.99 (99%)
      shares: '10.00'      // 10 shares
    };

    console.log('📋 订单信息:');
    console.log(`  Topic ID: ${orderParams.topicId}`);
    console.log(`  操作: SELL`);
    console.log(`  Position: ${orderParams.position}`);
    console.log(`  限价: ${orderParams.limitPrice}% (0.${orderParams.limitPrice})`);
    console.log(`  数量: ${orderParams.shares} shares`);
    console.log('');

    // 获取 topic 信息
    console.log('→ 获取 Topic 信息...');
    const topicInfo = await sdk.getTopicInfo(orderParams.topicId);
    console.log(`✓ Topic: ${topicInfo.title}`);
    console.log(`  YES Token ID: ${topicInfo.yesToken}`);
    console.log(`  当前 YES 价格: ${topicInfo.yesPrice}`);
    console.log('');

    // 确认挂单
    console.log('📤 提交卖单...');
    const result = await sdk.sellByTopic(orderParams);

    console.log('');
    console.log('✅ 订单挂单成功！');
    console.log('');
    console.log('订单详情:');
    console.log(JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('');
    console.error('❌ 挂单失败:', error.message);

    if (error.response) {
      console.error('API 响应状态:', error.response.status);
      console.error('API 响应数据:', JSON.stringify(error.response.data, null, 2));
    }

    if (error.stack) {
      console.error('');
      console.error('详细错误信息:');
      console.error(error.stack);
    }

    process.exit(1);
  }
}

// 运行挂单脚本
placeOrder();
