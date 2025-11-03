export enum Models {
  // AI Gateway models (primary - according to requirements)
  GatewayGPT4o = 'gateway/gpt-4o',
  GatewayGPT4Turbo = 'gateway/gpt-4-turbo',
  GatewayGPT35Turbo = 'gateway/gpt-3.5-turbo',
  
  // OpenAI models (fallback - paid)
  OpenAIGPT4o = 'openai/gpt-4o',
  OpenAIGPT4Turbo = 'openai/gpt-4-turbo',
  OpenAIGPT35Turbo = 'openai/gpt-3.5-turbo',
  OpenAIGPT5 = 'openai/gpt-5',
}

// Use AI Gateway by default (per requirements)
// Falls back to OpenAI if AI Gateway is not configured
export const DEFAULT_MODEL = Models.GatewayGPT4o

export const SUPPORTED_MODELS: string[] = [
  // AI Gateway models (primary)
  Models.GatewayGPT4o,
  Models.GatewayGPT4Turbo,
  Models.GatewayGPT35Turbo,
  // OpenAI models (fallback - paid)
  Models.OpenAIGPT4o,
  Models.OpenAIGPT4Turbo,
  Models.OpenAIGPT35Turbo,
  Models.OpenAIGPT5,
]

export const TEST_PROMPTS = [
  'Generate a Next.js app that allows to list and search Pokemons',
  'Create a `golang` server that responds with "Hello World" to any request',
]
