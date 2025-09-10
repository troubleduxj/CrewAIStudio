#!/usr/bin/env node

const { spawn } = require('child_process');
const net = require('net');

// 检查端口是否可用
function checkPort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.listen(port, () => {
      server.once('close', () => {
        resolve(true); // 端口可用
      });
      server.close();
    });
    
    server.on('error', () => {
      resolve(false); // 端口不可用
    });
  });
}

// 尝试启动开发服务器
async function startDev() {
  const ports = [3001, 3002, 3003, 3004, 3005];
  
  console.log('🔍 正在查找可用端口...');
  
  for (const port of ports) {
    const isAvailable = await checkPort(port);
    
    if (isAvailable) {
      console.log(`✅ 找到可用端口: ${port}`);
      console.log(`🚀 启动开发服务器在端口 ${port}...`);
      
      const child = spawn('npx', ['next', 'dev', '-p', port.toString()], {
        stdio: 'inherit',
        shell: true
      });
      
      child.on('error', (error) => {
        console.error('❌ 启动失败:', error.message);
      });
      
      // 处理进程退出
      process.on('SIGINT', () => {
        console.log('\n👋 正在关闭开发服务器...');
        child.kill('SIGINT');
        process.exit(0);
      });
      
      return;
    } else {
      console.log(`⚠️  端口 ${port} 已被占用`);
    }
  }
  
  console.error('❌ 没有找到可用端口，请手动指定端口或释放占用的端口');
  process.exit(1);
}

startDev().catch(console.error);