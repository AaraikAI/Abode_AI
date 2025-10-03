import { NextRequest, NextResponse } from "next/server"

import { requireSession } from "@/lib/auth/session"
import {
  listPullRequests,
  openPullRequest,
  updatePullRequestStatus,
  type VersionEntityType,
} from "@/lib/data/versioning"

export async function GET(request: NextRequest) {
  const session = await requireSession({ request, enforceDevice: true, enforceGeo: true })
  const orgId = session.user?.orgId ?? "demo-org"
  const entityType = (request.nextUrl.searchParams.get("entityType") as VersionEntityType | null) ?? "scene"
  const entityId = request.nextUrl.searchParams.get("entityId") ?? "current"
  const pullRequests = await listPullRequests(orgId, entityType, entityId)
  return NextResponse.json({ pullRequests })
}

export async function POST(request: NextRequest) {
  const session = await requireSession({ request, enforceDevice: true, enforceGeo: true })
  const orgId = session.user?.orgId ?? "demo-org"
  const body = (await request.json()) as {
    entityType?: VersionEntityType
    entityId?: string
    sourceBranchId?: string
    targetBranchId?: string
    title?: string
    description?: string
    diff?: Record<string, unknown>
  }

  if (!body.sourceBranchId || !body.targetBranchId || !body.title) {
    return NextResponse.json({ error: "sourceBranchId, targetBranchId, and title are required" }, { status: 400 })
  }

  const pr = await openPullRequest({
    orgId,
    entityType: body.entityType ?? "scene",
    entityId: body.entityId ?? "current",
    sourceBranchId: body.sourceBranchId,
    targetBranchId: body.targetBranchId,
    title: body.title,
    description: body.description,
    createdBy: session.user?.id ?? null,
    diff: body.diff,
  })

  return NextResponse.json({ pullRequest: pr }, { status: 201 })
}

export async function PATCH(request: NextRequest) {
  await requireSession({ request, enforceDevice: true, enforceGeo: true })
  const body = (await request.json()) as { id?: string; status?: "open" | "merged" | "closed" }
  if (!body.id || !body.status) {
    return NextResponse.json({ error: "id and status are required" }, { status: 400 })
  }
  await updatePullRequestStatus(body.id, body.status)
  return NextResponse.json({ ok: true })
}
