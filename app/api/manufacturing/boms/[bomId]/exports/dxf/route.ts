import { NextRequest, NextResponse } from "next/server"

import { requireSession } from "@/lib/auth/session"
import { getBom } from "@/lib/data/manufacturing"
import { generateDxfForBom } from "@/lib/services/cad"

export async function GET(request: NextRequest, { params }: { params: { bomId: string } }) {
  const session = await requireSession({ request, enforceDevice: true, enforceGeo: true })
  const orgId = session.user?.orgId ?? "demo-org"
  const bom = await getBom(orgId, params.bomId)
  if (!bom) {
    return NextResponse.json({ error: "BOM not found" }, { status: 404 })
  }

  const dxf = generateDxfForBom(bom)
  return new Response(dxf, {
    headers: {
      "Content-Type": "application/dxf",
      "Content-Disposition": `attachment; filename="bom-${params.bomId}.dxf"`,
    },
  })
}
