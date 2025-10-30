import { NextRequest, NextResponse } from "next/server"

import { requireSession } from "@/lib/auth/session"
import { listTelemetryEvents, listSustainabilitySeries } from "@/lib/data/analytics"
import { detectAnomalies, mockTrendSeries } from "@/lib/services/telemetry"

export async function GET(request: NextRequest) {
  const session = await requireSession({ request, enforceDevice: true, enforceGeo: true })
  const orgId = session.user?.orgId ?? "demo-org"

  const [events, sustainability] = await Promise.all([
    listTelemetryEvents(orgId, 25),
    listSustainabilitySeries(orgId),
  ])

  const trendSeries = mockTrendSeries()
  const anomalies = detectAnomalies(trendSeries)

  return NextResponse.json({
    events,
    sustainability,
    trendSeries,
    anomalies,
  })
}
