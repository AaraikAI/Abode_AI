import { NextRequest, NextResponse } from "next/server"

import { requireSession } from "@/lib/auth/session"
import { triggerStableDiffusionJob } from "@/lib/services/stable-diffusion"

export async function POST(request: NextRequest) {
  const session = await requireSession({ request, enforceDevice: true, enforceGeo: true })
  const orgId = session.user?.orgId ?? "demo-org"
  const userId = session.user?.id ?? null

  const body = (await request.json().catch(() => ({}))) as {
    prompt?: string
    style?: string
    aspectRatio?: string
    strength?: number
  }

  if (!body?.prompt) {
    return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
  }

  const job = await triggerStableDiffusionJob({
    prompt: body.prompt,
    style: body.style,
    orgId,
    userId,
    aspectRatio: body.aspectRatio,
    strength: body.strength,
  })

  return NextResponse.json({ job })
}
