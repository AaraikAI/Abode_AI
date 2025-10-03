import { NextRequest, NextResponse } from "next/server"

import { requireSession } from "@/lib/auth/session"
import { getLatestSceneSnapshot, listSceneSnapshots, saveSceneSnapshot } from "@/lib/data/studio"

export async function GET(request: NextRequest) {
  const session = await requireSession({ request, enforceDevice: true, enforceGeo: true })
  const orgId = session.user?.orgId ?? "demo-org"
  const limitParam = request.nextUrl.searchParams.get("limit")

  if (limitParam) {
    const limit = Math.min(parseInt(limitParam, 10) || 10, 50)
    const snapshots = await listSceneSnapshots(orgId, limit)
    return NextResponse.json({ snapshots })
  }

  const snapshot = await getLatestSceneSnapshot(orgId)
  return NextResponse.json({ snapshot })
}

export async function POST(request: NextRequest) {
  const session = await requireSession({ request, enforceDevice: true, enforceGeo: true })
  const orgId = session.user?.orgId ?? "demo-org"
  const userId = session.user?.id ?? null
  const body = (await request.json()) as { scene: unknown; label?: string | null }

  if (!body || body.scene === undefined) {
    return NextResponse.json({ error: "Scene payload is required" }, { status: 400 })
  }

  const snapshot = await saveSceneSnapshot({
    orgId,
    userId,
    scene: body.scene,
    label: body.label ?? null,
  })

  return NextResponse.json({ snapshot })
}
