import { NextResponse, type NextRequest } from 'next/server'
import { Sandbox } from 'e2b'

interface Params {
  sandboxId: string
  cmdId: string
}

// Store command metadata in memory (in production, use Redis or similar)
const commandMetadata = new Map<string, { sandboxId: string; startedAt: string }>()

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  const cmdParams = await params
  
  try {
    const sandbox = await Sandbox.connect(cmdParams.sandboxId, {
      apiKey: process.env.E2B_API_KEY,
    })

    const metadata = commandMetadata.get(cmdParams.cmdId) || {
      sandboxId: cmdParams.sandboxId,
      startedAt: new Date().toISOString(),
    }

    // E2B doesn't have direct command retrieval by ID like Vercel
    // Return basic metadata
    return NextResponse.json({
      sandboxId: sandbox.sandboxId,
      cmdId: cmdParams.cmdId,
      startedAt: metadata.startedAt,
      exitCode: null, // Will be populated when command completes
    })
  } catch (error) {
    return NextResponse.json({
      sandboxId: cmdParams.sandboxId,
      cmdId: cmdParams.cmdId,
      startedAt: null,
      exitCode: null,
    })
  }
}
