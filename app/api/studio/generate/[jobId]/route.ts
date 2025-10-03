import { NextRequest, NextResponse } from "next/server"

import { requireSession } from "@/lib/auth/session"
import { fetchStableDiffusionJob, triggerUpscaleJob } from "@/lib/services/stable-diffusion"

export async function GET(_: NextRequest, { params }: { params: { jobId: string } }) {
  const session = await requireSession({ enforceDevice: true, enforceGeo: true })
  const orgId = session.user?.orgId ?? "demo-org"
  const userId = session.user?.id ?? null

  const job = await fetchStableDiffusionJob({ jobId: params.jobId, orgId, userId })
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 })
  }

  return NextResponse.json({ job })
}

export async function POST(request: NextRequest, { params }: { params: { jobId: string } }) {
  const session = await requireSession({ request, enforceDevice: true, enforceGeo: true })
  const orgId = session.user?.orgId ?? "demo-org"
  const userId = session.user?.id ?? null

  const body = (await request.json().catch(() => ({}))) as { action?: string; scale?: number }

  if (body.action === "upscale") {
    const job = await triggerUpscaleJob({ jobId: params.jobId, orgId, userId, scale: body.scale })
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }
    return NextResponse.json({ job })
  }

  return NextResponse.json({ error: "Unsupported action" }, { status: 400 })
}
