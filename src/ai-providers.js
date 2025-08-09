// AI Provider 服务类
class AIProviderService {
  constructor() {
    this.providers = {
      OPENAI: {
        url: 'https://api.openai.com/v1/chat/completions',
        defaultModel: 'gpt-3.5-turbo',
        supportedModels: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo-preview']
      },
      DEEPSEEK: {
        url: 'https://api.deepseek.com/v1/chat/completions',
        defaultModel: 'deepseek-chat',
        supportedModels: ['deepseek-chat', 'deepseek-coder']
      }
    };
  }

  async sendMessage(provider, message, apiKey, model = null, conversationHistory = []) {
    const providerConfig = this.providers[provider];
    if (!providerConfig) {
      throw new Error(`Unsupported provider: ${provider}`);
    }

    const selectedModel = model || providerConfig.defaultModel;
    
    // 构建消息历史
    const messages = [
      ...conversationHistory,
      { role: 'user', content: message }
    ];

    const requestBody = {
      model: selectedModel,
      messages: messages,
      max_tokens: 2000,
      temperature: 0.7,
      stream: false
    };

    try {
      const response = await fetch(providerConfig.url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response from AI provider');
      }

      return {
        id: data.id || `msg-${Date.now()}`,
        content: data.choices[0].message.content,
        provider: provider,
        model: selectedModel,
        timestamp: new Date().toISOString(),
        error: null
      };

    } catch (error) {
      console.error(`Error calling ${provider} API:`, error);
      return {
        id: `error-${Date.now()}`,
        content: '',
        provider: provider,
        model: selectedModel,
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }

  getSupportedModels(provider) {
    const providerConfig = this.providers[provider];
    return providerConfig ? providerConfig.supportedModels : [];
  }

  async streamMessage(provider, message, apiKey, model = null, conversationHistory = []) {
    const providerConfig = this.providers[provider];
    if (!providerConfig) {
      throw new Error(`Unsupported provider: ${provider}`);
    }

    const selectedModel = model || providerConfig.defaultModel;
    
    const messages = [
      ...conversationHistory,
      { role: 'user', content: message }
    ];

    const requestBody = {
      model: selectedModel,
      messages: messages,
      max_tokens: 2000,
      temperature: 0.7,
      stream: true
    };

    const response = await fetch(providerConfig.url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`API Error (${response.status}): ${await response.text()}`);
    }

    return response.body;
  }
}

export const aiProviderService = new AIProviderService();