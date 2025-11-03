import { NextResponse, type NextRequest } from 'next/server'
import { Sandbox } from 'e2b'

interface Params {
  sandboxId: string
  cmdId: string
}

// Store process handles (in production, use Redis or similar)
const processHandles = new Map<string, any>()

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  const logParams = await params
  const encoder = new TextEncoder()
  
  try {
    const sandbox = await Sandbox.connect(logParams.sandboxId, {
      apiKey: process.env.E2B_API_KEY,
    })

    const processHandle = processHandles.get(logParams.cmdId)

    return new NextResponse(
      new ReadableStream({
        async pull(controller) {
          if (processHandle) {
            try {
              // Get the output from the process
              const result = await processHandle.wait()
              
              // Send stdout
              if (result.stdout) {
                controller.enqueue(
                  encoder.encode(
                    JSON.stringify({
                      data: result.stdout,
                      stream: 'stdout',
                      timestamp: Date.now(),
                    }) + '\n'
                  )
                )
              }
              
              // Send stderr
              if (result.stderr) {
                controller.enqueue(
                  encoder.encode(
                    JSON.stringify({
                      data: result.stderr,
                      stream: 'stderr',
                      timestamp: Date.now(),
                    }) + '\n'
                  )
                )
              }
            } catch (error) {
              controller.enqueue(
                encoder.encode(
                  JSON.stringify({
                    data: 'Error retrieving logs',
                    stream: 'stderr',
                    timestamp: Date.now(),
                  }) + '\n'
                )
              )
            }
          }
          controller.close()
        },
      }),
      { headers: { 'Content-Type': 'application/x-ndjson' } }
    )
  } catch (error) {
    return new NextResponse(
      new ReadableStream({
        async pull(controller) {
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                data: 'Could not connect to sandbox',
                stream: 'stderr',
                timestamp: Date.now(),
              }) + '\n'
            )
          )
          controller.close()
        },
      }),
      { headers: { 'Content-Type': 'application/x-ndjson' } }
    )
  }
}
