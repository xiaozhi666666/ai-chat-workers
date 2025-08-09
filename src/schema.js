import { buildSchema } from 'graphql';

export const typeDefs = `
  enum AIProvider {
    OPENAI
    DEEPSEEK
  }

  type Message {
    id: ID!
    role: String!
    content: String!
    timestamp: String!
  }

  input MessageInput {
    role: String!
    content: String!
  }

  type ChatResponse {
    id: ID!
    content: String!
    provider: AIProvider!
    model: String!
    timestamp: String!
    error: String
  }

  input ChatRequest {
    message: String!
    provider: AIProvider!
    model: String
    apiKey: String!
    conversationHistory: [MessageInput!]
  }

  type Query {
    health: String!
    supportedModels(provider: AIProvider!): [String!]!
  }

  type Mutation {
    sendMessage(input: ChatRequest!): ChatResponse!
  }

  type Subscription {
    messageStream(input: ChatRequest!): ChatResponse!
  }
`;

export const schema = buildSchema(typeDefs);