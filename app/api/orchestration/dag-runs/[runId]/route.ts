import { NextRequest, NextResponse } from "next/server"

import { requirePermissionFromSession } from "@/lib/auth/session"
import { fetchDagRun, markDagRunStatus } from "@/lib/services/airflow"

export async function GET(request: NextRequest, { params }: { params: { runId: string } }) {
  const session = await requirePermissionFromSession("pipelines:read", {
    request,
    enforceDevice: true,
    enforceGeo: true,
  })
  const run = await fetchDagRun(params.runId)
  if (!run || run.orgId !== (session.user?.orgId ?? "demo-org")) {
    return NextResponse.json({ error: "Run not found" }, { status: 404 })
  }
  return NextResponse.json({ run })
}

export async function PATCH(request: NextRequest, { params }: { params: { runId: string } }) {
  const session = await requirePermissionFromSession("pipelines:approve", {
    request,
    enforceDevice: true,
    enforceGeo: true,
  })
  const body = await request.json()
  const { status, nextStep } = body as { status?: string; nextStep?: string | null }
  if (!status) {
    return NextResponse.json({ error: "status is required" }, { status: 400 })
  }
  const allowed = new Set(["queued", "running", "awaiting_approval", "success", "failed"])
  if (!allowed.has(status)) {
    return NextResponse.json({ error: "Unsupported status" }, { status: 400 })
  }
  try {
    const existing = await fetchDagRun(params.runId)
    if (!existing || existing.orgId !== (session.user?.orgId ?? "demo-org")) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 })
    }
    const run = await markDagRunStatus(params.runId, status as any, nextStep ?? null)
    return NextResponse.json({ run })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 })
  }
}
