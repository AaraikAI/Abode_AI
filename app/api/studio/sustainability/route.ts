import { NextRequest, NextResponse } from "next/server"

import { requireSession } from "@/lib/auth/session"
import { listSustainabilityLogs, recordSustainabilityLog } from "@/lib/data/sustainability"

export async function GET(request: NextRequest) {
  const session = await requireSession({ request, enforceDevice: true, enforceGeo: true })
  const orgId = session.user?.orgId ?? "demo-org"
  const limitParam = request.nextUrl.searchParams.get("limit")
  const limit = limitParam ? Math.min(parseInt(limitParam, 10) || 20, 100) : 20
  const logs = await listSustainabilityLogs(orgId, limit)
  return NextResponse.json({ logs })
}

export async function POST(request: NextRequest) {
  const session = await requireSession({ request, enforceDevice: true, enforceGeo: true })
  const orgId = session.user?.orgId ?? "demo-org"
  const userId = session.user?.id ?? null

  const body = (await request.json().catch(() => ({}))) as {
    renderId?: string
    co2Kg?: number
    energyKwh?: number
    durationSeconds?: number
  }

  if (!body.renderId) {
    return NextResponse.json({ error: "renderId is required" }, { status: 400 })
  }
  if (typeof body.co2Kg !== "number") {
    return NextResponse.json({ error: "co2Kg metric required" }, { status: 400 })
  }

  const log = await recordSustainabilityLog({
    orgId,
    userId,
    renderId: body.renderId,
    co2Kg: body.co2Kg,
    energyKwh: body.energyKwh ?? null,
    durationSeconds: body.durationSeconds ?? null,
  })

  return NextResponse.json({ log })
}
