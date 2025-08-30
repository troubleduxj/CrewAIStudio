const { i18n } = require('./next-i18next.config');
const webpack = require('webpack');
const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: [
    '@google/generative-ai',
    'genkit',
    '@genkit-ai/googleai',
    '@grpc/grpc-js',
    'express',
    'get-port',
    'net',
    'tls',
    'fs',
    'crypto',
    'stream',
    'url',
    'zlib',
    'http',
    'https',
    'http2',
    'assert',
    'os',
    'path',
    'util',
    'events',
    'buffer',
    'querystring',
    'child_process',
    'dns',
    'dgram',
    'cluster',
    'module',
    'perf_hooks',
    'worker_threads',
    'inspector',
    'async_hooks'
  ],

  webpack: (config, { isServer }) => {
    if (!isServer) {
      // 排除 server 目录不被客户端打包
      config.resolve.alias = {
        ...config.resolve.alias,
        '@/server': false,
      };
      
      // 为客户端构建添加 Node.js 模块的 fallback
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        fs: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        http2: false,
        assert: false,
        os: false,
        path: false,
        util: false,
        events: false,
        buffer: false,
        querystring: false,
        child_process: false,
        dns: false,
        dgram: false,
        cluster: false,
        module: false,
        perf_hooks: false,
        worker_threads: false,
        inspector: false,
        async_hooks: false,
        // Genkit 相关模块
        'genkit': false,
        '@genkit-ai/googleai': false,
        '@genkit-ai/next': false,
        '@google/generative-ai': false,
        'express': false,
        'get-port': false,
      };
      
      // 使用 NormalModuleReplacementPlugin 处理 node: 协议模块
      config.plugins = config.plugins || [];
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /^node:(.*)$/,
          (resource) => {
            // 将 node: 协议模块替换为空模块
            resource.request = path.resolve(__dirname, 'lib/empty-module.js');
          }
        ),
        // 处理 genkit 相关模块
        new webpack.NormalModuleReplacementPlugin(
          /^genkit$/,
          (resource) => {
            resource.request = path.resolve(__dirname, 'lib/empty-module.js');
          }
        ),
        new webpack.NormalModuleReplacementPlugin(
          /^@genkit-ai\/.*$/,
          (resource) => {
            resource.request = path.resolve(__dirname, 'lib/empty-module.js');
          }
        ),
        new webpack.NormalModuleReplacementPlugin(
          /^@google\/generative-ai$/,
          (resource) => {
            resource.request = path.resolve(__dirname, 'lib/empty-module.js');
          }
        ),
        // 处理服务器端路径
        new webpack.NormalModuleReplacementPlugin(
          /^@\/server\/.*$/,
          (resource) => {
            resource.request = path.resolve(__dirname, 'lib/empty-module.js');
          }
        )
      );
      
      // 添加 node: 协议模块到 fallback
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'perf_hooks': false,
        'process': false,
        'stream/web': false,
        'node:perf_hooks': false,
        'node:process': false,
        'node:stream/web': false,
        'node:async_hooks': false,
        'node:fs': false,
        'node:path': false,
        'node:url': false,
        'node:util': false,
        'node:crypto': false,
        'node:stream': false,
        'node:buffer': false,
        'node:events': false,
        'node:http': false,
        'node:https': false,
        'node:net': false,
        'node:tls': false,
        'node:os': false,
        'node:zlib': false,
      };
    }
    return config;
  }
};

module.exports = nextConfig;