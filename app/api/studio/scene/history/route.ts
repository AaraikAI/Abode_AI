import { NextRequest, NextResponse } from "next/server"

import { requireSession } from "@/lib/auth/session"
import { saveSceneSnapshot } from "@/lib/data/studio"
import {
  createBranch,
  createCommit,
  ensureDefaultBranch,
  listBranches,
  listCommits,
  type VersionBranch,
} from "@/lib/data/versioning"

const ENTITY_TYPE = "scene"

export async function GET(request: NextRequest) {
  const session = await requireSession({ request, enforceDevice: true, enforceGeo: true })
  const orgId = session.user?.orgId ?? "demo-org"
  const branchName = request.nextUrl.searchParams.get("branch") ?? "main"
  const limitParam = request.nextUrl.searchParams.get("limit")
  const limit = limitParam ? Math.min(parseInt(limitParam, 10) || 20, 100) : 20

  const defaultBranch = await ensureDefaultBranch({ orgId, entityType: ENTITY_TYPE, entityId: orgId, createdBy: session.user?.id })
  const branches = await listBranches(orgId, ENTITY_TYPE, orgId)

  const activeBranch = branches.find((branch) => branch.name === branchName) ?? defaultBranch
  const commits = await listCommits(activeBranch.id, limit)

  return NextResponse.json({
    branches: branches.length ? branches : [defaultBranch],
    activeBranch,
    commits,
  })
}

export async function POST(request: NextRequest) {
  const session = await requireSession({ request, enforceDevice: true, enforceGeo: true })
  const orgId = session.user?.orgId ?? "demo-org"
  const userId = session.user?.id ?? null

  const body = (await request.json().catch(() => ({}))) as {
    scene: Record<string, unknown>
    message?: string
    branchName?: string
    baseBranchName?: string
    label?: string | null
  }

  if (!body.scene) {
    return NextResponse.json({ error: "Scene payload is required" }, { status: 400 })
  }

  const branches = await listBranches(orgId, ENTITY_TYPE, orgId)
  const baseBranch = branches.find((branch) => branch.name === (body.baseBranchName ?? "main"))
  const defaultBranch = await ensureDefaultBranch({ orgId, entityType: ENTITY_TYPE, entityId: orgId, createdBy: userId ?? undefined })

  let targetBranch: VersionBranch | undefined = branches.find((branch) => branch.name === (body.branchName ?? baseBranch?.name ?? "main"))

  if (!targetBranch && body.branchName) {
    targetBranch = await createBranch({
      orgId,
      entityType: ENTITY_TYPE,
      entityId: orgId,
      name: body.branchName,
      parentBranchId: baseBranch?.id ?? defaultBranch.id,
      createdBy: userId ?? undefined,
    })
  }

  targetBranch = targetBranch ?? baseBranch ?? defaultBranch

  const commit = await createCommit({
    orgId,
    branchId: targetBranch.id,
    snapshot: { scene: body.scene },
    message: body.message ?? `Snapshot ${new Date().toISOString()}`,
    createdBy: userId ?? undefined,
  })

  await saveSceneSnapshot({
    orgId,
    userId,
    scene: body.scene,
    label: body.label ?? null,
  })

  return NextResponse.json({ commit, branch: targetBranch })
}
