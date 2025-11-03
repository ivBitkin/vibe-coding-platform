export enum Models {
  // AI Gateway models (as per original Vercel Vibe Code)
  GatewayGPT4o = 'gpt-4o',
  GatewayGPT4Turbo = 'gpt-4-turbo',
  GatewayGPT35Turbo = 'gpt-3.5-turbo',
  OpenAIGPT5 = 'gpt-5', // Special handling for GPT-5 with reasoning
}

// Use GPT-4o by default (original configuration)
export const DEFAULT_MODEL = Models.GatewayGPT4o

export const SUPPORTED_MODELS: string[] = [
  Models.GatewayGPT4o,
  Models.GatewayGPT4Turbo,
  Models.GatewayGPT35Turbo,
  Models.OpenAIGPT5,
]

export const TEST_PROMPTS = [
  'Generate a Next.js app that allows to list and search Pokemons',
  'Create a `golang` server that responds with "Hello World" to any request',
]
