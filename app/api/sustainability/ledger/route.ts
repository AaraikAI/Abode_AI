import { NextRequest, NextResponse } from "next/server"

import { requireSession } from "@/lib/auth/session"
import { listSustainabilityLogs } from "@/lib/data/sustainability"

export async function GET(request: NextRequest) {
  const session = await requireSession({ request, enforceDevice: true, enforceGeo: true })
  const orgId = session.user?.orgId ?? "demo-org"
  const limitParam = request.nextUrl.searchParams.get("limit")
  const limit = limitParam ? Math.min(parseInt(limitParam, 10) || 50, 200) : 50

  const logs = await listSustainabilityLogs(orgId, limit)

  const totalCo2 = logs.reduce((sum, log) => sum + log.co2Kg, 0)
  const totalEnergy = logs.reduce((sum, log) => sum + (log.energyKwh ?? 0), 0)
  const totalDuration = logs.reduce((sum, log) => sum + (log.durationSeconds ?? 0), 0)

  const trend = logs.slice(0, 10).map((log) => ({
    timestamp: log.createdAt,
    co2Kg: log.co2Kg,
  }))

  return NextResponse.json({
    logs,
    summary: {
      totalRuns: logs.length,
      totalCo2,
      totalEnergy,
      totalDuration,
      avgCo2: logs.length ? totalCo2 / logs.length : 0,
      trend,
    },
  })
}
