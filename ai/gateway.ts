import { createOpenAI } from '@ai-sdk/openai'
import { createGroq } from '@ai-sdk/groq'
import { Models } from './constants'
import type { JSONValue } from 'ai'
import type { OpenAIResponsesProviderOptions } from '@ai-sdk/openai'
import type { LanguageModelV2 } from '@ai-sdk/provider'

// Check if API keys are provided
const hasGroqKey = !!process.env.GROQ_API_KEY
const hasOpenAIKey = !!process.env.OPENAI_API_KEY

if (!hasGroqKey && !hasOpenAIKey) {
  console.warn('⚠️  Neither GROQ_API_KEY nor OPENAI_API_KEY is set. AI features will not work.')
  console.warn('💡 Tip: Get a free Groq API key at https://console.groq.com/')
}

// Create Groq client (FREE tier available!)
const groq = hasGroqKey ? createGroq({
  apiKey: process.env.GROQ_API_KEY,
}) : null

// Create OpenAI client (paid)
const openai = hasOpenAIKey ? createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null

export async function getAvailableModels() {
  const models: Array<{ id: string; name: string }> = []
  
  // Add Groq models if API key is available
  if (hasGroqKey) {
    models.push(
      { id: Models.GroqLlama31_70B, name: 'Llama 3.1 70B (Groq - FREE)' },
      { id: Models.GroqLlama31_8B, name: 'Llama 3.1 8B (Groq - FREE)' },
      { id: Models.GroqMixtral8x7B, name: 'Mixtral 8x7B (Groq - FREE)' },
    )
  }
  
  // Add OpenAI models if API key is available
  if (hasOpenAIKey) {
    models.push(
      { id: Models.OpenAIGPT4o, name: 'GPT-4o (OpenAI - Paid)' },
      { id: Models.OpenAIGPT4Turbo, name: 'GPT-4 Turbo (OpenAI - Paid)' },
      { id: Models.OpenAIGPT35Turbo, name: 'GPT-3.5 Turbo (OpenAI - Paid)' },
    )
  }
  
  return models
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
  // Map model IDs to providers
  let model: LanguageModelV2
  let providerOptions: Record<string, Record<string, JSONValue>> | undefined = undefined
  
  switch (modelId) {
    // Groq models (FREE)
    case Models.GroqLlama31_70B:
      if (!groq) throw new Error('Groq API key is not configured')
      // Try llama3-70b-8192 or llama-3.1-70b-versatile
      model = groq('llama3-70b-8192')
      break
    case Models.GroqLlama31_8B:
      if (!groq) throw new Error('Groq API key is not configured')
      model = groq('llama3-8b-8192')
      break
    case Models.GroqMixtral8x7B:
      if (!groq) throw new Error('Groq API key is not configured')
      model = groq('mixtral-8x7b-32768')
      break
    
    // OpenAI models (paid)
    case Models.OpenAIGPT4o:
      if (!openai) throw new Error('OpenAI API key is not configured')
      model = openai('gpt-4o')
      providerOptions = {
        openai: {
          ...(options?.reasoningEffort && {
            reasoningEffort: options.reasoningEffort,
          }),
        } satisfies Partial<OpenAIResponsesProviderOptions>,
      }
      break
    case Models.OpenAIGPT4Turbo:
      if (!openai) throw new Error('OpenAI API key is not configured')
      model = openai('gpt-4-turbo')
      break
    case Models.OpenAIGPT35Turbo:
      if (!openai) throw new Error('OpenAI API key is not configured')
      model = openai('gpt-3.5-turbo')
      break
    case Models.OpenAIGPT5:
      if (!openai) throw new Error('OpenAI API key is not configured')
      // Fallback to GPT-4o if GPT-5 not available
      model = openai('gpt-4o')
      providerOptions = {
        openai: {
          ...(options?.reasoningEffort && {
            reasoningEffort: options.reasoningEffort,
          }),
        } satisfies Partial<OpenAIResponsesProviderOptions>,
      }
      break
    default:
      // Default to Groq if available, otherwise OpenAI
      if (groq) {
        model = groq('llama3-70b-8192')
      } else if (openai) {
        model = openai('gpt-3.5-turbo')
      } else {
        throw new Error('No API keys configured. Please set GROQ_API_KEY or OPENAI_API_KEY')
      }
  }

  return {
    model,
    providerOptions,
  }
}
