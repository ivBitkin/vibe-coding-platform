import { NextRequest, NextResponse } from 'next/server'
import { Sandbox } from 'e2b'

/**
 * Check the status of the E2B Sandbox.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sandboxId: string }> }
) {
  const { sandboxId } = await params
  try {
    const sandbox = await Sandbox.connect(sandboxId, {
      apiKey: process.env.E2B_API_KEY,
    })
    
    // Try to execute a simple command to check if sandbox is alive
    await sandbox.commands.run('echo "Sandbox status check"')
    return NextResponse.json({ status: 'running' })
  } catch (error) {
    // If we can't connect or execute, assume sandbox is stopped
    return NextResponse.json({ status: 'stopped' })
  }
}
