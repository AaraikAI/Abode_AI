import { NextRequest, NextResponse } from "next/server"

import { requireSession } from "@/lib/auth/session"
import { createBranch, ensureDefaultBranch, listBranches, type VersionEntityType } from "@/lib/data/versioning"

export async function GET(request: NextRequest) {
  const session = await requireSession({ request, enforceDevice: true, enforceGeo: true })
  const orgId = session.user?.orgId ?? "demo-org"
  const entityType = (request.nextUrl.searchParams.get("entityType") as VersionEntityType | null) ?? "scene"
  const entityId = request.nextUrl.searchParams.get("entityId") ?? "current"

  await ensureDefaultBranch({ orgId, entityType, entityId, createdBy: session.user?.id ?? null })
  const branches = await listBranches(orgId, entityType, entityId)
  return NextResponse.json({ branches })
}

export async function POST(request: NextRequest) {
  const session = await requireSession({ request, enforceDevice: true, enforceGeo: true })
  const orgId = session.user?.orgId ?? "demo-org"
  const body = (await request.json()) as {
    entityType?: VersionEntityType
    entityId?: string
    name?: string
    description?: string
    parentBranchId?: string | null
  }

  if (!body.name) {
    return NextResponse.json({ error: "Branch name is required" }, { status: 400 })
  }

  const branch = await createBranch({
    orgId,
    entityType: body.entityType ?? "scene",
    entityId: body.entityId ?? "current",
    name: body.name,
    description: body.description,
    parentBranchId: body.parentBranchId ?? null,
    createdBy: session.user?.id ?? null,
  })

  return NextResponse.json({ branch }, { status: 201 })
}
