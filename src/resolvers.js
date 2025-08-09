import { aiProviderService } from './ai-providers.js';

export const resolvers = {
  Query: {
    health: () => {
      return 'AI Chat API is running!';
    },

    supportedModels: async (parent, { provider }) => {
      return aiProviderService.getSupportedModels(provider);
    }
  },

  Mutation: {
    sendMessage: async (parent, { input }) => {
      const {
        message,
        provider,
        model,
        apiKey,
        conversationHistory = []
      } = input;

      if (!message || !message.trim()) {
        throw new Error('Message cannot be empty');
      }

      if (!apiKey || !apiKey.trim()) {
        throw new Error('API Key is required');
      }

      try {
        const result = await aiProviderService.sendMessage(
          provider,
          message,
          apiKey,
          model,
          conversationHistory
        );

        return result;
      } catch (error) {
        console.error('Error in sendMessage resolver:', error);
        return {
          id: `error-${Date.now()}`,
          content: '',
          provider: provider,
          model: model || 'unknown',
          timestamp: new Date().toISOString(),
          error: error.message
        };
      }
    }
  },

  Subscription: {
    messageStream: {
      subscribe: async (parent, { input }) => {
        const {
          message,
          provider,
          model,
          apiKey,
          conversationHistory = []
        } = input;

        if (!message || !message.trim()) {
          throw new Error('Message cannot be empty');
        }

        if (!apiKey || !apiKey.trim()) {
          throw new Error('API Key is required');
        }

        try {
          const stream = await aiProviderService.streamMessage(
            provider,
            message,
            apiKey,
            model,
            conversationHistory
          );

          return {
            [Symbol.asyncIterator]: async function* () {
              const reader = stream.getReader();
              const decoder = new TextDecoder();
              let buffer = '';

              try {
                while (true) {
                  const { done, value } = await reader.read();
                  if (done) break;

                  buffer += decoder.decode(value, { stream: true });
                  const lines = buffer.split('\n');
                  buffer = lines.pop() || '';

                  for (const line of lines) {
                    if (line.startsWith('data: ')) {
                      const data = line.slice(6);
                      if (data === '[DONE]') return;

                      try {
                        const parsed = JSON.parse(data);
                        const content = parsed.choices?.[0]?.delta?.content || '';
                        
                        if (content) {
                          yield {
                            id: parsed.id || `stream-${Date.now()}`,
                            content: content,
                            provider: provider,
                            model: model || 'unknown',
                            timestamp: new Date().toISOString(),
                            error: null
                          };
                        }
                      } catch (parseError) {
                        console.error('Error parsing stream data:', parseError);
                      }
                    }
                  }
                }
              } finally {
                reader.releaseLock();
              }
            }
          };
        } catch (error) {
          console.error('Error in messageStream resolver:', error);
          throw error;
        }
      }
    }
  }
};