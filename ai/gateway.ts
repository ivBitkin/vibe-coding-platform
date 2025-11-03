import { createOpenAI } from '@ai-sdk/openai'
import { Models } from './constants'
import type { JSONValue } from 'ai'
import type { OpenAIResponsesProviderOptions } from '@ai-sdk/openai'
import type { LanguageModelV2 } from '@ai-sdk/provider'

// Check if API key is provided
if (!process.env.OPENAI_API_KEY) {
  console.warn('⚠️  OPENAI_API_KEY is not set. AI features will not work.')
}

// Create OpenAI client with API key from environment
const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function getAvailableModels() {
  // Return available OpenAI models
  return [
    { id: Models.OpenAIGPT4o, name: 'GPT-4o' },
    { id: Models.OpenAIGPT4Turbo, name: 'GPT-4 Turbo' },
    { id: Models.OpenAIGPT35Turbo, name: 'GPT-3.5 Turbo' },
  ]
}

export interface ModelOptions {
  model: LanguageModelV2
  providerOptions?: Record<string, Record<string, JSONValue>>
  headers?: Record<string, string>
}

export function getModelOptions(
  modelId: string,
  options?: { reasoningEffort?: 'minimal' | 'low' | 'medium' }
): ModelOptions {
  // Map model IDs to OpenAI models
  let model: LanguageModelV2
  
  switch (modelId) {
    case Models.OpenAIGPT4o:
      model = openai('gpt-4o')
      break
    case Models.OpenAIGPT4Turbo:
      model = openai('gpt-4-turbo')
      break
    case Models.OpenAIGPT35Turbo:
      model = openai('gpt-3.5-turbo')
      break
    case Models.OpenAIGPT5:
      // Fallback to GPT-4o if GPT-5 not available
      model = openai('gpt-4o')
      break
    default:
      // Default to GPT-4o
      model = openai('gpt-4o')
  }

  return {
    model,
    providerOptions: {
      openai: {
        ...(options?.reasoningEffort && {
          reasoningEffort: options.reasoningEffort,
        }),
      } satisfies Partial<OpenAIResponsesProviderOptions>,
    },
  }
}
