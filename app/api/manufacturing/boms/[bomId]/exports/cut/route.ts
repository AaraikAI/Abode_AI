import { NextRequest, NextResponse } from "next/server"

import { requireSession } from "@/lib/auth/session"
import { getBom } from "@/lib/data/manufacturing"
import { generateCutListCsv } from "@/lib/services/cad"

export async function GET(request: NextRequest, { params }: { params: { bomId: string } }) {
  const session = await requireSession({ request, enforceDevice: true, enforceGeo: true })
  const orgId = session.user?.orgId ?? "demo-org"
  const bom = await getBom(orgId, params.bomId)
  if (!bom) {
    return NextResponse.json({ error: "BOM not found" }, { status: 404 })
  }

  const csv = generateCutListCsv(bom)
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="bom-${params.bomId}-cutlist.csv"`,
    },
  })
}
