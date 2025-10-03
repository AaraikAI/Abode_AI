import { NextRequest, NextResponse } from "next/server"

import { requireSession } from "@/lib/auth/session"
import { getBom, listManufacturingSyncs, recordManufacturingSync } from "@/lib/data/manufacturing"

export async function GET(request: NextRequest, { params }: { params: { bomId: string } }) {
  const session = await requireSession({ request, enforceDevice: true, enforceGeo: true })
  const orgId = session.user?.orgId ?? "demo-org"
  const bom = await getBom(orgId, params.bomId)
  if (!bom) {
    return NextResponse.json({ error: "BOM not found" }, { status: 404 })
  }
  const syncs = await listManufacturingSyncs(params.bomId)
  return NextResponse.json({ bom, syncs })
}

export async function POST(request: NextRequest, { params }: { params: { bomId: string } }) {
  const session = await requireSession({ request, enforceDevice: true, enforceGeo: true })
  const orgId = session.user?.orgId ?? "demo-org"
  const bom = await getBom(orgId, params.bomId)
  if (!bom) {
    return NextResponse.json({ error: "BOM not found" }, { status: 404 })
  }

  const body = (await request.json().catch(() => ({}))) as {
    action?: string
    message?: string
  }

  const action = body.action ?? "erp_sync"
  const message = body.message ?? "Mock ERP sync enqueued."

  const syncEvent = await recordManufacturingSync({
    bomId: params.bomId,
    status: "queued",
    message,
    payload: { action, triggeredBy: session.user?.email ?? "unknown" },
  })

  return NextResponse.json({ sync: syncEvent }, { status: 202 })
}
