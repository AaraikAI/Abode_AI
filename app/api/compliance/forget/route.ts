import { NextRequest, NextResponse } from "next/server"

import { requireSession } from "@/lib/auth/session"
import { createForgetRequest, listForgetRequests, updateForgetRequestStatus } from "@/lib/data/compliance"

export async function GET(request: NextRequest) {
  const session = await requireSession({ request, enforceDevice: true, enforceGeo: true })
  const orgId = session.user?.orgId ?? "demo-org"
  const requests = await listForgetRequests(orgId)
  return NextResponse.json({ requests })
}

export async function POST(request: NextRequest) {
  const session = await requireSession({ request, enforceDevice: true, enforceGeo: true })
  const orgId = session.user?.orgId ?? "demo-org"
  const userId = session.user?.id
  if (!userId) {
    return NextResponse.json({ error: "Missing user context" }, { status: 400 })
  }
  const body = (await request.json().catch(() => ({}))) as { reason?: string }
  const record = await createForgetRequest({ orgId, userId, reason: body.reason })
  return NextResponse.json({ request: record }, { status: 201 })
}

export async function PATCH(request: NextRequest) {
  await requireSession({ request, enforceDevice: true, enforceGeo: true })
  const body = await request.json()
  if (!body?.id || !body.status) {
    return NextResponse.json({ error: "id and status required" }, { status: 400 })
  }
  await updateForgetRequestStatus(body.id, body.status)
  return NextResponse.json({ ok: true })
}
