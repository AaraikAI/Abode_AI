import { NextRequest, NextResponse } from "next/server"

import { requirePermissionFromSession } from "@/lib/auth/session"
import { listAuditEvents } from "@/lib/audit-log"

export async function GET(request: NextRequest) {
  const session = await requirePermissionFromSession("audit:read", {
    request,
    enforceDevice: true,
    enforceGeo: true,
  })

  const orgId = session.user?.orgId ?? "demo-org"
  const events = listAuditEvents(orgId)
  return NextResponse.json({ events })
}
