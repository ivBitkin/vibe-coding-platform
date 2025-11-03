import { NextRequest, NextResponse } from 'next/server';
import type { StreamLogEvent } from '@/lib/types';

/**
 * Stream execution logs from Trigger.dev run
 * GET /api/run/stream?runId=...
 * 
 * Returns Server-Sent Events (SSE) stream of logs
 * Uses HTTP API to poll for run status
 */
export async function GET(req: NextRequest) {
  try {
    const apiKey = process.env.TRIGGER_DEV_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'TRIGGER_DEV_API_KEY is not configured' },
        { status: 500 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const runId = searchParams.get('runId');

    if (!runId) {
      return NextResponse.json(
        { error: 'Missing runId parameter' },
        { status: 400 }
      );
    }

    const apiBase = process.env.TRIGGER_DEV_API_BASE || 'https://api.trigger.dev';

    // Create SSE stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Poll for run status
          let completed = false;
          const maxAttempts = 300; // 5 minutes max (1 second intervals)
          let attempts = 0;

          while (!completed && attempts < maxAttempts) {
            try {
              // Fetch run status via HTTP API
              const runResponse = await fetch(`${apiBase}/api/v1/runs/${runId}`, {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${apiKey}`,
                  'Content-Type': 'application/json',
                },
              });

              if (!runResponse.ok) {
                throw new Error(`Failed to fetch run: ${runResponse.status}`);
              }

              const run = await runResponse.json();
              
              if (run.status === 'COMPLETED' || run.status === 'COMPLETE') {
                // Send completion event
                const output = run.output || run.result;
                if (output) {
                  // Send stdout
                  if (output.stdout) {
                    const logEvent: StreamLogEvent = {
                      type: 'log',
                      data: output.stdout,
                      stream: 'stdout',
                      timestamp: Date.now(),
                    };
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify(logEvent)}\n\n`)
                    );
                  }

                  // Send stderr
                  if (output.stderr) {
                    const logEvent: StreamLogEvent = {
                      type: 'log',
                      data: output.stderr,
                      stream: 'stderr',
                      timestamp: Date.now(),
                    };
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify(logEvent)}\n\n`)
                    );
                  }

                  // Send done event
                  const doneEvent: StreamLogEvent = {
                    type: 'done',
                    exitCode: output.exitCode,
                    timestamp: Date.now(),
                  };
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify(doneEvent)}\n\n`)
                  );
                }
                completed = true;
              } else if (run.status === 'FAILED' || run.status === 'CANCELED' || run.status === 'ERROR') {
                // Send error event
                const errorEvent: StreamLogEvent = {
                  type: 'error',
                  error: {
                    message: run.error?.message || run.error || 'Execution failed',
                  },
                  timestamp: Date.now(),
                };
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify(errorEvent)}\n\n`)
                );
                completed = true;
              } else {
                // Still running, wait and poll again
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
            } catch (pollError) {
              console.error('Error polling run status:', pollError);
              // Continue polling
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            attempts++;
          }

          if (!completed) {
            // Timeout
            const timeoutEvent: StreamLogEvent = {
              type: 'error',
              error: {
                message: 'Execution timeout',
              },
              timestamp: Date.now(),
            };
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(timeoutEvent)}\n\n`)
            );
          }
        } catch (error) {
          console.error('Stream error:', error);
          const errorEvent: StreamLogEvent = {
            type: 'error',
            error: {
              message: error instanceof Error ? error.message : 'Unknown stream error',
            },
            timestamp: Date.now(),
          };
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(errorEvent)}\n\n`)
          );
        } finally {
          controller.close();
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error creating stream:', error);
    return NextResponse.json(
      {
        error: 'Failed to create stream',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

