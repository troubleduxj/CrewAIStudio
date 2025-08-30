/**
 * CrewAI Studio 前后端集成测试脚本
 * 测试前端API客户端与后端服务的连接
 */

const axios = require('axios');

// 配置
const BACKEND_URL = 'http://localhost:8000';
const FRONTEND_URL = 'http://localhost:9002';

/**
 * 测试后端API端点
 */
async function testBackendAPI() {
  console.log('\n=== 测试后端API ===');
  
  const tests = [
    {
      name: '健康检查',
      url: `${BACKEND_URL}/api/v1/health`,
      method: 'GET'
    },
    {
      name: 'CrewAI健康检查',
      url: `${BACKEND_URL}/api/v1/crewai/health`,
      method: 'GET'
    },
    {
      name: 'CrewAI工具列表',
      url: `${BACKEND_URL}/api/v1/crewai/tools`,
      method: 'GET'
    },
    {
      name: '代理列表',
      url: `${BACKEND_URL}/api/v1/agents`,
      method: 'GET'
    },
    {
      name: '任务列表',
      url: `${BACKEND_URL}/api/v1/tasks`,
      method: 'GET'
    },
    {
      name: '工作流列表',
      url: `${BACKEND_URL}/api/v1/workflows`,
      method: 'GET'
    }
  ];

  for (const test of tests) {
    try {
      console.log(`\n测试: ${test.name}`);
      console.log(`请求: ${test.method} ${test.url}`);
      
      const response = await axios({
        method: test.method,
        url: test.url,
        timeout: 5000
      });
      
      console.log(`✅ 成功 - 状态码: ${response.status}`);
      console.log(`响应数据:`, JSON.stringify(response.data, null, 2));
      
    } catch (error) {
      console.log(`❌ 失败 - ${error.message}`);
      if (error.response) {
        console.log(`状态码: ${error.response.status}`);
        console.log(`错误详情:`, error.response.data);
      }
    }
  }
}

/**
 * 测试前端服务
 */
async function testFrontendService() {
  console.log('\n=== 测试前端服务 ===');
  
  try {
    console.log(`\n测试: 前端首页`);
    console.log(`请求: GET ${FRONTEND_URL}`);
    
    const response = await axios({
      method: 'GET',
      url: FRONTEND_URL,
      timeout: 10000
    });
    
    console.log(`✅ 前端服务正常 - 状态码: ${response.status}`);
    console.log(`内容长度: ${response.data.length} 字符`);
    
    // 检查是否包含React应用的标识
    if (response.data.includes('__NEXT_DATA__') || response.data.includes('_next')) {
      console.log(`✅ Next.js应用检测成功`);
    } else {
      console.log(`⚠️  未检测到Next.js应用标识`);
    }
    
  } catch (error) {
    console.log(`❌ 前端服务测试失败 - ${error.message}`);
    if (error.response) {
      console.log(`状态码: ${error.response.status}`);
    }
  }
}

/**
 * 测试CORS配置
 */
async function testCORS() {
  console.log('\n=== 测试CORS配置 ===');
  
  try {
    console.log(`\n测试: 跨域请求`);
    
    const response = await axios({
      method: 'GET',
      url: `${BACKEND_URL}/api/v1/health`,
      headers: {
        'Origin': FRONTEND_URL,
        'Access-Control-Request-Method': 'GET'
      },
      timeout: 5000
    });
    
    console.log(`✅ CORS配置正常 - 状态码: ${response.status}`);
    
    // 检查CORS头
    const corsHeaders = {
      'Access-Control-Allow-Origin': response.headers['access-control-allow-origin'],
      'Access-Control-Allow-Methods': response.headers['access-control-allow-methods'],
      'Access-Control-Allow-Headers': response.headers['access-control-allow-headers']
    };
    
    console.log(`CORS头信息:`, corsHeaders);
    
  } catch (error) {
    console.log(`❌ CORS测试失败 - ${error.message}`);
  }
}

/**
 * 主测试函数
 */
async function runIntegrationTests() {
  console.log('🚀 CrewAI Studio 前后端集成测试开始');
  console.log('='.repeat(50));
  
  try {
    // 测试后端API
    await testBackendAPI();
    
    // 测试前端服务
    await testFrontendService();
    
    // 测试CORS
    await testCORS();
    
    console.log('\n' + '='.repeat(50));
    console.log('🎉 集成测试完成!');
    
  } catch (error) {
    console.error('\n❌ 测试过程中发生错误:', error.message);
    process.exit(1);
  }
}

// 运行测试
if (require.main === module) {
  runIntegrationTests();
}

module.exports = {
  testBackendAPI,
  testFrontendService,
  testCORS,
  runIntegrationTests
};