import { createGatewayProvider } from '@ai-sdk/gateway'
import { createOpenAI } from '@ai-sdk/openai'
import { createGroq } from '@ai-sdk/groq'
import { Models } from './constants'
import type { JSONValue } from 'ai'
import type { OpenAIResponsesProviderOptions } from '@ai-sdk/openai'
import type { LanguageModelV2 } from '@ai-sdk/provider'

// Check if API keys are provided
const hasAIGateway = !!(process.env.AI_GATEWAY_BASE_URL && process.env.AI_GATEWAY_API_KEY)
const hasGroqKey = !!process.env.GROQ_API_KEY
const hasOpenAIKey = !!process.env.OPENAI_API_KEY

if (!hasAIGateway && !hasGroqKey && !hasOpenAIKey) {
  console.warn('⚠️  No AI provider configured. Please set AI_GATEWAY_BASE_URL + AI_GATEWAY_API_KEY, or GROQ_API_KEY, or OPENAI_API_KEY')
}

// Create AI Gateway provider (priority - according to requirements)
const gateway = hasAIGateway ? createGatewayProvider({
  baseURL: process.env.AI_GATEWAY_BASE_URL!,
  apiKey: process.env.AI_GATEWAY_API_KEY!,
}) : null

// Create Groq client (fallback - FREE tier available!)
const groq = hasGroqKey ? createGroq({
  apiKey: process.env.GROQ_API_KEY,
}) : null

// Create OpenAI client (fallback - paid)
const openai = hasOpenAIKey ? createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null

export async function getAvailableModels() {
  const models: Array<{ id: string; name: string }> = []
  
  // AI Gateway models (priority - according to requirements)
  if (hasAIGateway && gateway) {
    try {
      // Fetch available models from AI Gateway
      const gatewayModels = await gateway.models.list()
      if (gatewayModels && gatewayModels.length > 0) {
        gatewayModels.forEach((model: any) => {
          models.push({
            id: `gateway/${model.id}`,
            name: `${model.name || model.id} (AI Gateway)`,
          })
        })
      }
    } catch (error) {
      console.warn('Failed to fetch models from AI Gateway:', error)
    }
  }
  
  // Fallback: Groq models if AI Gateway not available
  if (!hasAIGateway && hasGroqKey) {
    models.push(
      { id: Models.GroqLlama31_70B, name: 'Llama 3.1 70B (Groq - FREE)' },
      { id: Models.GroqLlama31_8B, name: 'Llama 3.1 8B (Groq - FREE)' },
      { id: Models.GroqMixtral8x7B, name: 'Mixtral 8x7B (Groq - FREE)' },
    )
  }
  
  // Fallback: OpenAI models if AI Gateway not available
  if (!hasAIGateway && hasOpenAIKey) {
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
  
  // Priority 1: AI Gateway (according to requirements)
  if (modelId.startsWith('gateway/') && gateway) {
    const gatewayModelId = modelId.replace('gateway/', '')
    model = gateway(gatewayModelId)
    return { model, providerOptions }
  }
  
  // Priority 2: Direct providers (fallback)
  switch (modelId) {
    // Groq models (FREE - fallback)
    case Models.GroqLlama31_70B:
      if (!groq) throw new Error('Groq API key is not configured')
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
    
    // OpenAI models (paid - fallback)
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
      // Default: AI Gateway > Groq > OpenAI
      if (gateway && hasAIGateway) {
        // Try to use first available model from gateway
        model = gateway(modelId)
      } else if (groq) {
        model = groq('llama3-70b-8192')
      } else if (openai) {
        model = openai('gpt-3.5-turbo')
      } else {
        throw new Error('No AI provider configured. Please set AI_GATEWAY_BASE_URL + AI_GATEWAY_API_KEY, or GROQ_API_KEY, or OPENAI_API_KEY')
      }
  }

  return {
    model,
    providerOptions,
  }
}
