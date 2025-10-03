import { NextRequest, NextResponse } from "next/server"
import { randomUUID } from "crypto"

import { requirePermissionFromSession } from "@/lib/auth/session"
import { updateTaskStatus, type TaskStatus } from "@/lib/data/pipelines"
import { recordAudit } from "@/lib/audit-log"

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; taskId: string } }
) {
  const session = await requirePermissionFromSession("pipelines:approve", {
    request,
    enforceDevice: true,
    enforceGeo: true,
  })
  const body = (await request.json()) as { status?: string }
  const status = body.status?.toLowerCase()
  const allowed: TaskStatus[] = ["pending", "queued", "running", "awaiting_approval", "approved", "success", "failed"]
  if (!status || !allowed.includes(status as TaskStatus)) {
    return NextResponse.json({ error: "Valid status is required" }, { status: 400 })
  }

  try {
    const task = updateTaskStatus(params.id, params.taskId, status as TaskStatus)
    recordAudit({
      id: randomUUID(),
      actor: session.user?.email ?? "unknown",
      orgId: session.user?.orgId ?? "demo-org",
      action: "pipeline.task.updated",
      target: `${params.id}:${params.taskId}`,
      metadata: { status },
    })
    return NextResponse.json({ task })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 404 })
  }
}
