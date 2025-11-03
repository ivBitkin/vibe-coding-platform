import { createGatewayProvider } from '@ai-sdk/gateway'
import { Models } from './constants'
import type { JSONValue } from 'ai'
import type { OpenAIResponsesProviderOptions } from '@ai-sdk/openai'
import type { LanguageModelV2 } from '@ai-sdk/provider'

export async function getAvailableModels() {
  const gateway = gatewayInstance()
  try {
    const response = await gateway.getAvailableModels()
    return response.models.map((model) => ({ id: model.id, name: model.name }))
  } catch (error) {
    console.error('Failed to fetch models from AI Gateway:', error)
    // Fallback to static list if API call fails
    return [
      { id: Models.GatewayGPT4o, name: 'GPT-4o' },
      { id: Models.GatewayGPT4Turbo, name: 'GPT-4 Turbo' },
      { id: Models.GatewayGPT35Turbo, name: 'GPT-3.5 Turbo' },
    ]
  }
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
  const gateway = gatewayInstance()
  
  if (modelId === Models.OpenAIGPT5) {
    return {
      model: gateway(modelId),
      providerOptions: {
        openai: {
          include: ['reasoning.encrypted_content'],
          reasoningEffort: options?.reasoningEffort ?? 'low',
          reasoningSummary: 'auto',
          serviceTier: 'priority',
        } satisfies Partial<OpenAIResponsesProviderOptions>,
      },
    }
  }

  // Handle gateway prefix if present (for backward compatibility)
  const cleanModelId = modelId.replace(/^gateway\//, '')
  
  return {
    model: gateway(cleanModelId),
  }
}

function gatewayInstance() {
  if (!process.env.AI_GATEWAY_BASE_URL) {
    throw new Error('AI_GATEWAY_BASE_URL is required. Please set it in your environment variables.')
  }
  
  return createGatewayProvider({
    baseURL: process.env.AI_GATEWAY_BASE_URL,
    // Optional: API key if your gateway requires it
    ...(process.env.AI_GATEWAY_API_KEY && {
      apiKey: process.env.AI_GATEWAY_API_KEY,
    }),
  })
}
