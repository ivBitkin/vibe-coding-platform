import { type ChatUIMessage } from '@/components/chat/types'
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
} from 'ai'
import { DEFAULT_MODEL } from '@/ai/constants'
import { NextResponse } from 'next/server'
import { getAvailableModels, getModelOptions } from '@/ai/gateway'
import { checkBotId } from 'botid/server'
import { tools } from '@/ai/tools'
import prompt from './prompt.md'

interface BodyData {
  messages: ChatUIMessage[]
  modelId?: string
  reasoningEffort?: 'low' | 'medium'
}

export async function POST(req: Request) {
  const checkResult = await checkBotId()
  if (checkResult.isBot) {
    return NextResponse.json({ error: `Bot detected` }, { status: 403 })
  }

  // Check if any API key is configured
  if (!process.env.GROQ_API_KEY && !process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      {
        error: 'No API key configured. Please add GROQ_API_KEY (free) or OPENAI_API_KEY to your environment variables. Get a free Groq key at https://console.groq.com/',
      },
      { status: 500 }
    )
  }

  const [models, { messages, modelId = DEFAULT_MODEL, reasoningEffort }] =
    await Promise.all([getAvailableModels(), req.json() as Promise<BodyData>])

  const model = models.find((model) => model.id === modelId)
  if (!model) {
    return NextResponse.json(
      { error: `Model ${modelId} not found.` },
      { status: 400 }
    )
  }

  return createUIMessageStreamResponse({
    stream: createUIMessageStream({
      originalMessages: messages,
      execute: ({ writer }) => {
        const result = streamText({
          ...getModelOptions(modelId, { reasoningEffort }),
          system: prompt,
          messages: convertToModelMessages(
            messages.map((message) => {
              message.parts = message.parts.map((part) => {
                if (part.type === 'data-report-errors') {
                  return {
                    type: 'text',
                    text:
                      `There are errors in the generated code. This is the summary of the errors we have:\n` +
                      `\`\`\`${part.data.summary}\`\`\`\n` +
                      (part.data.paths?.length
                        ? `The following files may contain errors:\n` +
                          `\`\`\`${part.data.paths?.join('\n')}\`\`\`\n`
                        : '') +
                      `Fix the errors reported.`,
                  }
                }
                return part
              })
              return message
            })
          ),
          stopWhen: stepCountIs(20),
          tools: tools({ modelId, writer }),
          onError: (error: any) => {
            console.error('Error communicating with AI')
            console.error(JSON.stringify(error, null, 2))
            
            // Handle specific OpenAI errors
            if (error?.error?.code === 'insufficient_quota') {
              writer.writeMessage({
                type: 'error',
                error: {
                  type: 'insufficient_quota',
                  message: 'OpenAI API quota exceeded. Please check your billing and plan details at https://platform.openai.com/account/billing',
                },
              })
            } else if (error?.error?.code === 'invalid_api_key') {
              writer.writeMessage({
                type: 'error',
                error: {
                  type: 'invalid_api_key',
                  message: 'Invalid OpenAI API key. Please check your OPENAI_API_KEY environment variable.',
                },
              })
            } else {
              writer.writeMessage({
                type: 'error',
                error: {
                  type: 'unknown',
                  message: error?.error?.message || 'An error occurred while communicating with the AI.',
                },
              })
            }
          },
        })
        result.consumeStream()
        writer.merge(
          result.toUIMessageStream({
            sendReasoning: true,
            sendStart: false,
            messageMetadata: () => ({
              model: model.name,
            }),
          })
        )
      },
    }),
  })
}
