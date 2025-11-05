import { NextRequest, NextResponse } from "next/server"

import { requireSession } from "@/lib/auth/session"
import { listMfaMethods } from "@/lib/auth/store"

export async function GET(request: NextRequest) {
  const session = await requireSession({ request, enforceDevice: true, enforceGeo: true })
  const userId = session.user?.id
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const methods = await listMfaMethods(userId)
  const keys = methods
    .filter((method) => method.method_type === "webauthn")
    .map((method) => ({ id: method.id, createdAt: method.created_at ?? new Date().toISOString(), label: method.label ?? "Security key" }))
  return NextResponse.json({ keys })
}
