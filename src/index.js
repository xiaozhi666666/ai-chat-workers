import { createYoga } from 'graphql-yoga';
import { schema } from './schema.js';
import { resolvers } from './resolvers.js';

// 创建 GraphQL Yoga 实例
const yoga = createYoga({
  schema,
  resolvers,
  cors: {
    origin: ['http://localhost:3001', 'https://*.pages.dev', 'https://*.cloudflare.com'],
    credentials: true
  },
  graphiql: {
    title: 'AI Chat API',
    defaultQuery: `
      query Health {
        health
      }
      
      query SupportedModels {
        openaiModels: supportedModels(provider: OPENAI)
        deepseekModels: supportedModels(provider: DEEPSEEK)
      }
      
      mutation SendMessage($input: ChatRequest!) {
        sendMessage(input: $input) {
          id
          content
          provider
          model
          timestamp
          error
        }
      }
    `
  }
});

export default {
  async fetch(request, env, ctx) {
    // 添加环境变量到上下文
    const contextValue = {
      env,
      ctx,
      request
    };

    // 处理 OPTIONS 请求（CORS 预检）
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        }
      });
    }

    // 健康检查端点
    if (request.method === 'GET' && new URL(request.url).pathname === '/health') {
      return new Response(JSON.stringify({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        environment: env.ENVIRONMENT || 'unknown'
      }), {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // 处理 GraphQL 请求
    try {
      const response = await yoga(request, contextValue);
      
      // 添加 CORS 头
      const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      };

      // 创建新的响应，添加 CORS 头
      const newResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: {
          ...Object.fromEntries(response.headers.entries()),
          ...corsHeaders
        }
      });

      return newResponse;
    } catch (error) {
      console.error('Worker error:', error);
      
      return new Response(JSON.stringify({
        errors: [{
          message: error.message,
          timestamp: new Date().toISOString()
        }]
      }), {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }
};