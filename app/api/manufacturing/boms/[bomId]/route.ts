import { NextRequest, NextResponse } from "next/server"

import { requireSession } from "@/lib/auth/session"
import { getBom, listManufacturingSyncs } from "@/lib/data/manufacturing"
import { syncBomWithErp, type ErpProvider } from "@/lib/services/erp"

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
    provider?: ErpProvider
  }

  const action = body.action ?? "erp_sync"
  const provider = body.provider ?? "jega"

  switch (action) {
    case "erp_sync":
    case "retry": {
      const result = await syncBomWithErp({
        bom,
        provider,
        actor: session.user?.email ?? session.user?.name ?? "unknown",
      })
      const syncs = await listManufacturingSyncs(params.bomId)
      return NextResponse.json({ timeline: result.timeline, syncs })
    }
    default:
      return NextResponse.json({ error: `Unsupported action: ${action}` }, { status: 400 })
  }
}
