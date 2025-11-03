export enum Models {
  // Groq models (FREE tier available!)
  GroqLlama31_70B = 'groq/llama3-70b-8192',
  GroqLlama31_8B = 'groq/llama3-8b-8192',
  GroqMixtral8x7B = 'groq/mixtral-8x7b-32768',
  
  // OpenAI models (paid)
  OpenAIGPT4o = 'openai/gpt-4o',
  OpenAIGPT4Turbo = 'openai/gpt-4-turbo',
  OpenAIGPT35Turbo = 'openai/gpt-3.5-turbo',
  OpenAIGPT5 = 'openai/gpt-5',
}

// Use Groq by default (FREE tier available!)
// Falls back to OpenAI if Groq API key is not set
export const DEFAULT_MODEL = Models.GroqLlama31_70B

export const SUPPORTED_MODELS: string[] = [
  // Groq models (free)
  Models.GroqLlama31_70B,
  Models.GroqLlama31_8B,
  Models.GroqMixtral8x7B,
  // OpenAI models (paid)
  Models.OpenAIGPT4o,
  Models.OpenAIGPT4Turbo,
  Models.OpenAIGPT35Turbo,
  Models.OpenAIGPT5,
]

export const TEST_PROMPTS = [
  'Generate a Next.js app that allows to list and search Pokemons',
  'Create a `golang` server that responds with "Hello World" to any request',
]
