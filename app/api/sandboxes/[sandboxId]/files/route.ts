import { NextResponse, type NextRequest } from 'next/server'
import { Sandbox } from 'e2b'
import z from 'zod/v3'

const FileParamsSchema = z.object({
  sandboxId: z.string(),
  path: z.string(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sandboxId: string }> }
) {
  const { sandboxId } = await params
  const fileParams = FileParamsSchema.safeParse({
    path: request.nextUrl.searchParams.get('path'),
    sandboxId,
  })

  if (fileParams.success === false) {
    return NextResponse.json(
      { error: 'Invalid parameters. You must pass a `path` as query' },
      { status: 400 }
    )
  }

  const sandbox = await Sandbox.connect(fileParams.data.sandboxId, {
    apiKey: process.env.E2B_API_KEY,
  })
  
  try {
    const content = await sandbox.files.read(fileParams.data.path)
    if (!content) {
      return NextResponse.json(
        { error: 'File not found in the Sandbox' },
        { status: 404 }
      )
    }

    return new NextResponse(content)
  } catch (error) {
    return NextResponse.json(
      { error: 'File not found in the Sandbox' },
      { status: 404 }
    )
  }
}
