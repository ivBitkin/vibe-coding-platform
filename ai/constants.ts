export enum Models {
  OpenAIGPT4o = 'openai/gpt-4o',
  OpenAIGPT4Turbo = 'openai/gpt-4-turbo',
  OpenAIGPT35Turbo = 'openai/gpt-3.5-turbo',
  OpenAIGPT5 = 'openai/gpt-5',
}

export const DEFAULT_MODEL = Models.OpenAIGPT4o

export const SUPPORTED_MODELS: string[] = [
  Models.OpenAIGPT4o,
  Models.OpenAIGPT4Turbo,
  Models.OpenAIGPT35Turbo,
  Models.OpenAIGPT5,
]

export const TEST_PROMPTS = [
  'Generate a Next.js app that allows to list and search Pokemons',
  'Create a `golang` server that responds with "Hello World" to any request',
]
