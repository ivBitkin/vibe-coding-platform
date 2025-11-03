import { NextRequest, NextResponse } from 'next/server';
import type { RunCodeRequest, RunCodeResponse } from '@/lib/types';

/**
 * Start code execution via Trigger.dev workflow
 * POST /api/run/start
 * 
 * Creates a new run in Trigger.dev and returns runId for streaming
 * Uses HTTP API to trigger the workflow
 */
export async function POST(req: NextRequest) {
  try {
    // Validate API key
    const apiKey = process.env.TRIGGER_DEV_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'TRIGGER_DEV_API_KEY is not configured' },
        { status: 500 }
      );
    }

    // Get task ID from env or use default
    const taskId = process.env.TRIGGER_DEV_TASK_ID || 'run-code';

    // Parse request body
    const body: RunCodeRequest = await req.json();
    
    if (!body.sandboxId || !body.command) {
      return NextResponse.json(
        { error: 'Missing required fields: sandboxId, command' },
        { status: 400 }
      );
    }

    // Get API base URL
    const apiBase = process.env.TRIGGER_DEV_API_BASE || 'https://api.trigger.dev';
    
    // Trigger the workflow via HTTP API
    const triggerResponse = await fetch(`${apiBase}/api/v1/tasks/${taskId}/trigger`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sandboxId: body.sandboxId,
        command: body.command,
        args: body.args || [],
        sudo: body.sudo || false,
        wait: body.wait ?? true,
      }),
    });

    if (!triggerResponse.ok) {
      const errorText = await triggerResponse.text();
      console.error('Trigger.dev API error:', errorText);
      return NextResponse.json(
        {
          error: 'Failed to trigger workflow',
          message: `Trigger.dev API returned ${triggerResponse.status}: ${errorText}`,
        },
        { status: triggerResponse.status }
      );
    }

    const triggerData = await triggerResponse.json();
    const runId = triggerData.id || triggerData.runId || `run_${Date.now()}`;

    const response: RunCodeResponse = {
      runId,
      commandId: `cmd_${Date.now()}`,
      status: 'executing',
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error starting run:', error);
    return NextResponse.json(
      {
        error: 'Failed to start code execution',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

