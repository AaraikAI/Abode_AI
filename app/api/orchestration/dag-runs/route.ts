import { NextRequest, NextResponse } from "next/server"

import { requirePermissionFromSession } from "@/lib/auth/session"
import { fetchDagRuns, triggerPipelineDag } from "@/lib/services/airflow"

export async function GET(request: NextRequest) {
  const session = await requirePermissionFromSession("pipelines:read", {
    request,
    enforceDevice: true,
    enforceGeo: true,
  })
  const orgId = session.user?.orgId ?? "demo-org"
  const limitParam = request.nextUrl.searchParams.get("limit")
  const limit = limitParam ? Math.min(parseInt(limitParam, 10) || 25, 100) : 25
  const runs = await fetchDagRuns(orgId, limit)
  return NextResponse.json({ runs })
}

export async function POST(request: NextRequest) {
  const session = await requirePermissionFromSession("pipelines:write", {
    request,
    enforceDevice: true,
    enforceGeo: true,
  })
  const orgId = session.user?.orgId ?? "demo-org"
  const body = await request.json()
  const { pipelineId, metadata } = body as { pipelineId?: string; metadata?: Record<string, unknown> }
  if (!pipelineId) {
    return NextResponse.json({ error: "pipelineId is required" }, { status: 400 })
  }

  try {
    const run = await triggerPipelineDag({
      pipelineId,
      orgId,
      triggeredBy: session.user?.email ?? "unknown",
      metadata,
    })
    return NextResponse.json({ run }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 })
  }
}
