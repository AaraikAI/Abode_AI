import { NextRequest, NextResponse } from "next/server"

import { requireSession } from "@/lib/auth/session"
import { getLatestSceneSnapshot } from "@/lib/data/studio"
import { generateBomFromScene, listBoms } from "@/lib/data/manufacturing"

export async function GET(request: NextRequest) {
  const session = await requireSession({ request, enforceDevice: true, enforceGeo: true })
  const orgId = session.user?.orgId ?? "demo-org"
  const limitParam = request.nextUrl.searchParams.get("limit")
  const limit = limitParam ? Math.min(parseInt(limitParam, 10) || 20, 50) : 20
  const boms = await listBoms(orgId, limit)
  return NextResponse.json({ boms })
}

export async function POST(request: NextRequest) {
  const session = await requireSession({ request, enforceDevice: true, enforceGeo: true })
  const orgId = session.user?.orgId ?? "demo-org"
  const body = (await request.json().catch(() => ({}))) as { scene?: unknown; sceneSnapshotId?: string }

  let scene = body.scene
  let sceneSnapshotId = body.sceneSnapshotId

  if (!scene) {
    const latest = await getLatestSceneSnapshot(orgId)
    if (!latest) {
      return NextResponse.json({ error: "No scene snapshots available. Capture a scene before generating a BOM." }, { status: 400 })
    }
    scene = latest.scene
    sceneSnapshotId = latest.id
  }

  if (!Array.isArray(scene)) {
    return NextResponse.json({ error: "Scene payload must be an array of objects" }, { status: 400 })
  }

  const bom = await generateBomFromScene({
    orgId,
    scene: scene as any,
    sceneSnapshotId,
  })

  return NextResponse.json({ bom }, { status: 201 })
}
