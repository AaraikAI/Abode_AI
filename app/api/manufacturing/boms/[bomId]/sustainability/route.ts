import { NextRequest, NextResponse } from "next/server"

import { requireSession } from "@/lib/auth/session"
import { calculateBomSustainability, getBom } from "@/lib/data/manufacturing"

export async function GET(request: NextRequest, { params }: { params: { bomId: string } }) {
  const session = await requireSession({ request, enforceDevice: true, enforceGeo: true })
  const orgId = session.user?.orgId ?? "demo-org"
  const bom = await getBom(orgId, params.bomId)
  if (!bom) {
    return NextResponse.json({ error: "BOM not found" }, { status: 404 })
  }

  const summary = await calculateBomSustainability(orgId, bom)
  return NextResponse.json({ summary })
}
