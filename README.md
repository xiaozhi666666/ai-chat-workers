# AI Chat API - Cloudflare Workers

基于 Cloudflare Workers 的 AI 聊天 API，通过 GraphQL 提供 OpenAI 和 DeepSeek 接口。

## 功能特性

- 🚀 **Cloudflare Workers** - 全球边缘计算，低延迟
- 🔗 **GraphQL API** - 类型安全的查询接口
- 🤖 **多 AI 提供商** - 支持 OpenAI 和 DeepSeek
- 🔒 **安全性** - API Key 通过环境变量管理
- 📊 **监控** - 内置健康检查和错误处理

## 快速开始

### 1. 安装依赖

```bash
cd workers/ai-chat-api
npm install
```

### 2. 本地开发

```bash
npm run dev
```

访问 http://localhost:8787/graphql 查看 GraphiQL 界面。

### 3. 环境变量设置

在 Cloudflare Dashboard 中设置以下环境变量：

```
OPENAI_API_KEY=your-openai-api-key
DEEPSEEK_API_KEY=your-deepseek-api-key
ENVIRONMENT=production
```

### 4. 部署到 Cloudflare

```bash
npm run deploy
```

## GraphQL Schema

### 查询 (Queries)

```graphql
# 健康检查
query Health {
  health
}

# 获取支持的模型
query SupportedModels($provider: AIProvider!) {
  supportedModels(provider: $provider)
}
```

### 变更 (Mutations)

```graphql
# 发送消息
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
```

### 订阅 (Subscriptions)

```graphql
# 消息流（暂未实现）
subscription MessageStream($input: ChatRequest!) {
  messageStream(input: $input) {
    id
    content
    provider
    model
    timestamp
    error
  }
}
```

## API 使用示例

### JavaScript/TypeScript

```javascript
const response = await fetch('https://ai-chat-api.your-subdomain.workers.dev/graphql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    query: `
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
    `,
    variables: {
      input: {
        message: "Hello, how are you?",
        provider: "OPENAI",
        model: "gpt-3.5-turbo",
        apiKey: "your-api-key",
        conversationHistory: []
      }
    }
  })
});

const data = await response.json();
console.log(data.data.sendMessage);
```

### cURL

```bash
curl -X POST https://ai-chat-api.your-subdomain.workers.dev/graphql \\
  -H "Content-Type: application/json" \\
  -d '{
    "query": "mutation SendMessage($input: ChatRequest!) { sendMessage(input: $input) { id content provider model timestamp error } }",
    "variables": {
      "input": {
        "message": "Hello, how are you?",
        "provider": "OPENAI",
        "model": "gpt-3.5-turbo",
        "apiKey": "your-api-key",
        "conversationHistory": []
      }
    }
  }'
```

## 端点说明

- `GET /health` - 健康检查
- `POST /graphql` - GraphQL API
- `GET /graphql` - GraphiQL 界面（开发环境）

## 错误处理

API 会返回结构化的错误信息：

```json
{
  "data": {
    "sendMessage": {
      "id": "error-1234567890",
      "content": "",
      "provider": "OPENAI",
      "model": "gpt-3.5-turbo",
      "timestamp": "2023-12-01T12:00:00.000Z",
      "error": "Invalid API key"
    }
  }
}
```

## 性能和限制

- **请求大小限制**: 100MB
- **响应时间**: 通常 < 30 秒
- **并发处理**: 支持高并发
- **全球部署**: 通过 Cloudflare 边缘网络

## 开发

### 项目结构

```
src/
├── index.js          # Worker 入口点
├── schema.js         # GraphQL Schema 定义
├── resolvers.js      # GraphQL Resolvers
└── ai-providers.js   # AI 提供商服务
```

### 添加新的 AI 提供商

1. 在 `ai-providers.js` 中添加提供商配置
2. 更新 `schema.js` 中的枚举类型
3. 实现相应的 API 调用逻辑

## 监控和调试

- 查看 Cloudflare Dashboard 的 Workers 日志
- 使用 `console.log` 进行调试
- GraphiQL 界面进行 API 测试