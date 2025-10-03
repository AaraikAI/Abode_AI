import { NextRequest, NextResponse } from "next/server"

import { requirePermissionFromSession } from "@/lib/auth/session"
import {
  approveDagRunTaskAction,
  fetchDagRun,
  markDagRunTask,
  rejectDagRunTaskAction,
  retryDagRunTaskAction,
} from "@/lib/services/airflow"

export async function PATCH(request: NextRequest, { params }: { params: { runId: string; taskId: string } }) {
  const session = await requirePermissionFromSession("pipelines:approve", {
    request,
    enforceDevice: true,
    enforceGeo: true,
  })

  const orgId = session.user?.orgId ?? "demo-org"
  const existing = await fetchDagRun(params.runId)
  if (!existing || existing.orgId !== orgId) {
    return NextResponse.json({ error: "Run not found" }, { status: 404 })
  }

  const body = await request.json()
  const { action, status } = body as { action?: string; status?: string }

  const actorId = session.user?.id ?? "system"

  try {
    if (action === "approve") {
      const run = await approveDagRunTaskAction(params.runId, params.taskId, { actorId })
      return NextResponse.json({ run })
    }
    if (action === "retry") {
      const run = await retryDagRunTaskAction(params.runId, params.taskId, { actorId })
      return NextResponse.json({ run })
    }
    if (action === "reject") {
      const run = await rejectDagRunTaskAction(params.runId, params.taskId, { actorId })
      return NextResponse.json({ run })
    }
    if (status) {
      const allowed = new Set(["queued", "running", "awaiting_approval", "success", "failed"])
      if (!allowed.has(status)) {
        return NextResponse.json({ error: "Unsupported status" }, { status: 400 })
      }
      const run = await markDagRunTask(params.runId, params.taskId, status as any, { actorId })
      return NextResponse.json({ run })
    }
    return NextResponse.json({ error: "Action or status required" }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 })
  }
}
