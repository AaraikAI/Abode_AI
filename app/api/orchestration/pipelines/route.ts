import { NextRequest, NextResponse } from "next/server"
import { randomUUID } from "crypto"

import { requireSession, requirePermissionFromSession } from "@/lib/auth/session"
import { createPipeline, listPipelines, type PipelineTaskInput } from "@/lib/data/pipelines"
import { recordAudit } from "@/lib/audit-log"

export async function GET(request: NextRequest) {
  const session = await requireSession({ request, enforceDevice: true, enforceGeo: true })
  const orgId = session.user?.orgId ?? "demo-org"
  const pipelines = listPipelines(orgId)
  return NextResponse.json({ pipelines })
}

interface PipelineTaskRequest extends PipelineTaskInput {
  id?: string
}

export async function POST(request: Request) {
  const requestMeta = {
    ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? null,
    userAgent: request.headers.get("user-agent") ?? null,
    geoCountry: request.headers.get("cf-ipcountry") ?? request.headers.get("x-geo-country") ?? null,
  }
  const session = await requirePermissionFromSession("pipelines:write", {
    request: requestMeta,
    enforceDevice: true,
    enforceGeo: true,
  })
  const orgId = session.user?.orgId ?? "demo-org"
  const body = await request.json()
  const { name, description, tasks } = body as {
    name?: string
    description?: string
    tasks?: PipelineTaskRequest[]
  }

  if (!name) {
    return NextResponse.json({ error: "Pipeline name is required" }, { status: 400 })
  }

  const parsedTasks: PipelineTaskInput[] | undefined = tasks?.map((task) => ({
    name: task.name?.trim() ?? "",
    resourceTier: task.resourceTier ?? "cpu",
    requiresApproval: task.requiresApproval ?? false,
    agentId: task.agentId ?? null,
  }))

  if (parsedTasks && parsedTasks.some((task) => !task.name)) {
    return NextResponse.json({ error: "Each task requires a name" }, { status: 400 })
  }

  const pipeline = createPipeline(orgId, {
    name,
    description,
    owner: session.user?.name ?? session.user?.email ?? "Unknown",
    tasks: parsedTasks,
  })

  recordAudit({
    id: randomUUID(),
    timestamp: new Date().toISOString(),
    actor: session.user?.email ?? "unknown",
    orgId,
    action: "pipeline.created",
    target: pipeline.id,
    metadata: { name: pipeline.name },
  })

  return NextResponse.json({ pipeline }, { status: 201 })
}
