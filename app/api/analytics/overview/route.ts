import { NextRequest, NextResponse } from "next/server"

import { requireSession } from "@/lib/auth/session"
import { loadAnalyticsOverview } from "@/lib/data/analytics"

export async function GET(request: NextRequest) {
  const session = await requireSession({ request, enforceDevice: true, enforceGeo: true })
  const orgId = session.user?.orgId ?? "demo-org"

  try {
    const overview = await loadAnalyticsOverview(orgId)
    return NextResponse.json({ overview })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
