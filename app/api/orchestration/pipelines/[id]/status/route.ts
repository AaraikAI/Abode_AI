import { NextRequest, NextResponse } from "next/server"
import { randomUUID } from "crypto"

import { requirePermissionFromSession } from "@/lib/auth/session"
import { updatePipelineStatus, type TaskStatus } from "@/lib/data/pipelines"
import { recordAudit } from "@/lib/audit-log"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await requirePermissionFromSession("pipelines:approve", {
    request,
    enforceDevice: true,
    enforceGeo: true,
  })
  const body = (await request.json()) as { status?: string }
  const status = body.status?.toLowerCase()
  const allowed: TaskStatus[] = ["pending", "queued", "running", "awaiting_approval", "approved", "success", "failed"]
  if (!status || !allowed.includes(status as TaskStatus)) {
    return NextResponse.json({ error: "Status is required" }, { status: 400 })
  }
  try {
    const pipeline = updatePipelineStatus(params.id, status as TaskStatus)
    recordAudit({
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      actor: session.user?.email ?? "unknown",
      orgId: session.user?.orgId ?? "demo-org",
      action: "pipeline.status.updated",
      target: pipeline.id,
      metadata: { status },
    })
    return NextResponse.json({ pipeline })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 404 })
  }
}
