import { NextRequest, NextResponse } from "next/server"

import { requireSession } from "@/lib/auth/session"
import { listPromptPolicies, updatePromptPolicy } from "@/lib/data/governance"

export async function GET(request: NextRequest) {
  const session = await requireSession({ request, enforceDevice: true, enforceGeo: true })
  const orgId = session.user?.orgId ?? "demo-org"
  const policies = await listPromptPolicies(orgId)
  return NextResponse.json({ policies })
}

export async function PATCH(request: NextRequest) {
  await requireSession({ request, enforceDevice: true, enforceGeo: true })
  const body = await request.json()
  if (!body?.id || !body.enforcementLevel) {
    return NextResponse.json({ error: "id and enforcementLevel required" }, { status: 400 })
  }
  await updatePromptPolicy({ id: body.id, enforcementLevel: body.enforcementLevel, description: body.description })
  return NextResponse.json({ ok: true })
}
