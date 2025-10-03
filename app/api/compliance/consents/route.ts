import { NextRequest, NextResponse } from "next/server"

import { requireSession } from "@/lib/auth/session"
import { listConsentRecords, updateConsentRecord } from "@/lib/data/compliance"

export async function GET(request: NextRequest) {
  const session = await requireSession({ request, enforceDevice: true, enforceGeo: true })
  const orgId = session.user?.orgId ?? "demo-org"
  const consents = await listConsentRecords(orgId)
  return NextResponse.json({ consents })
}

export async function PATCH(request: NextRequest) {
  await requireSession({ request, enforceDevice: true, enforceGeo: true })
  const body = await request.json()

  if (!body?.id || typeof body.granted !== "boolean") {
    return NextResponse.json({ error: "id and granted are required" }, { status: 400 })
  }

  await updateConsentRecord({ id: body.id, granted: body.granted })
  return NextResponse.json({ ok: true })
}
