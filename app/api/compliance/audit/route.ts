import { NextRequest, NextResponse } from "next/server"

import { requireSession } from "@/lib/auth/session"
import { listComplianceEvents, recordComplianceEvent } from "@/lib/data/compliance"
import { forwardToSiem } from "@/lib/services/siem"

export async function GET(request: NextRequest) {
  const session = await requireSession({ request, enforceDevice: true, enforceGeo: true })
  const orgId = session.user?.orgId ?? "demo-org"
  const limitParam = request.nextUrl.searchParams.get("limit")
  const limit = limitParam ? Math.min(parseInt(limitParam, 10) || 50, 200) : 50
  const events = await listComplianceEvents(orgId, limit)
  return NextResponse.json({ events })
}

export async function POST(request: NextRequest) {
  const session = await requireSession({ request, enforceDevice: true, enforceGeo: true })
  const orgId = session.user?.orgId ?? "demo-org"
  const actor = session.user?.email ?? "unknown"
  const body = await request.json()

  const event = await recordComplianceEvent({
    orgId,
    actor,
    action: body.action ?? "unknown",
    resource: body.resource ?? null,
    metadata: body.metadata ?? null,
  })

  await forwardToSiem(event)

  return NextResponse.json({ event }, { status: 201 })
}
