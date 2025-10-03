import { NextRequest, NextResponse } from "next/server"

import { requireSession } from "@/lib/auth/session"
import { listGovernanceTasks, scheduleGovernanceTask } from "@/lib/data/governance"

export async function GET(request: NextRequest) {
  const session = await requireSession({ request, enforceDevice: true, enforceGeo: true })
  const orgId = session.user?.orgId ?? "demo-org"
  const tasks = await listGovernanceTasks(orgId, 50)
  return NextResponse.json({ tasks })
}

export async function POST(request: NextRequest) {
  const session = await requireSession({ request, enforceDevice: true, enforceGeo: true })
  const orgId = session.user?.orgId ?? "demo-org"
  const body = (await request.json()) as { type?: string; scheduledFor?: string; metadata?: Record<string, unknown> }

  if (!body?.type) {
    return NextResponse.json({ error: "type is required" }, { status: 400 })
  }

  const scheduledFor = body.scheduledFor ?? new Date().toISOString()
  const task = await scheduleGovernanceTask({
    orgId,
    type: body.type,
    scheduledFor,
    metadata: body.metadata ?? {},
  })

  return NextResponse.json({ task }, { status: 201 })
}
