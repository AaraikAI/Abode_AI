import { NextRequest, NextResponse } from "next/server"

import { requireSession } from "@/lib/auth/session"
import { createCommit, listCommits } from "@/lib/data/versioning"

export async function GET(request: NextRequest, { params }: { params: { branchId: string } }) {
  await requireSession({ request, enforceDevice: true, enforceGeo: true })
  const limitParam = request.nextUrl.searchParams.get("limit")
  const commits = await listCommits(params.branchId, limitParam ? Number(limitParam) : 20)
  return NextResponse.json({ commits })
}

export async function POST(request: NextRequest, { params }: { params: { branchId: string } }) {
  const session = await requireSession({ request, enforceDevice: true, enforceGeo: true })
  const body = (await request.json()) as { snapshot?: Record<string, unknown>; message?: string }

  if (!body.snapshot || !body.message) {
    return NextResponse.json({ error: "snapshot and message are required" }, { status: 400 })
  }

  const commit = await createCommit({
    branchId: params.branchId,
    orgId: session.user?.orgId ?? "demo-org",
    snapshot: body.snapshot,
    message: body.message,
    createdBy: session.user?.id ?? null,
  })

  return NextResponse.json({ commit }, { status: 201 })
}
