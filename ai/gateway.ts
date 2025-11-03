import { createGatewayProvider } from '@ai-sdk/gateway'
import { createOpenAI } from '@ai-sdk/openai'
import { Models } from './constants'
import type { JSONValue } from 'ai'
import type { OpenAIResponsesProviderOptions } from '@ai-sdk/openai'
import type { LanguageModelV2 } from '@ai-sdk/provider'

// Check if API keys are provided
const hasAIGateway = !!(process.env.AI_GATEWAY_BASE_URL && process.env.AI_GATEWAY_API_KEY)
const hasOpenAIKey = !!process.env.OPENAI_API_KEY

if (!hasAIGateway && !hasOpenAIKey) {
  console.warn('⚠️  No AI provider configured. Please set AI_GATEWAY_BASE_URL + AI_GATEWAY_API_KEY, or OPENAI_API_KEY')
}

// Create AI Gateway provider (priority - according to requirements)
const gateway = hasAIGateway ? createGatewayProvider({
  baseURL: process.env.AI_GATEWAY_BASE_URL!,
  apiKey: process.env.AI_GATEWAY_API_KEY!,
}) : null

// Create OpenAI client (fallback - paid)
const openai = hasOpenAIKey ? createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null

export async function getAvailableModels() {
  const models: Array<{ id: string; name: string }> = []
  
  // AI Gateway models (priority - according to requirements)
  // Note: AI Gateway models are typically accessed by model ID directly
  // Common models: gpt-4o, gpt-4-turbo, gpt-3.5-turbo, etc.
  if (hasAIGateway && gateway) {
    // Add common AI Gateway models (can be customized based on your gateway)
    models.push(
      { id: 'gateway/gpt-4o', name: 'GPT-4o (AI Gateway)' },
      { id: 'gateway/gpt-4-turbo', name: 'GPT-4 Turbo (AI Gateway)' },
      { id: 'gateway/gpt-3.5-turbo', name: 'GPT-3.5 Turbo (AI Gateway)' },
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
      // Use gpt-4-turbo (correct model name as of 2024)
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
      // Default: AI Gateway > OpenAI
      if (gateway && hasAIGateway) {
        // Try to use model from gateway (remove prefix if present)
        const cleanModelId = modelId.replace(/^(gateway\/|openai\/)/, '')
        model = gateway(cleanModelId)
      } else if (openai) {
        // Try to use model directly, or fallback to gpt-3.5-turbo
        const cleanModelId = modelId.replace(/^(gateway\/|openai\/)/, '')
        
        // Map common model names to OpenAI API names
        let openaiModelName = cleanModelId
        if (cleanModelId === 'gpt-4-turbo') {
          // Try different GPT-4 Turbo variants
          openaiModelName = 'gpt-4-turbo-preview' // Fallback to preview version
        }
        
        // Try to create model (will fail at runtime if model doesn't exist)
        model = openai(openaiModelName)
      } else {
        throw new Error('No AI provider configured. Please set AI_GATEWAY_BASE_URL + AI_GATEWAY_API_KEY, or OPENAI_API_KEY')
      }
  }

  return {
    model,
    providerOptions,
  }
}
