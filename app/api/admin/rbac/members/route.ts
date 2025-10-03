import { NextRequest, NextResponse } from "next/server"

import { requirePermissionFromSession } from "@/lib/auth/session"
import { listOrgMembers, updateMemberRoles } from "@/lib/data/policies"
import { recordAuthEvent } from "@/lib/auth/audit"

export async function GET(request: NextRequest) {
  const session = await requirePermissionFromSession("org:manage", { request })
  const orgId = session.user?.orgId ?? "demo-org"
  const members = await listOrgMembers(orgId)
  return NextResponse.json({ members })
}

export async function POST(request: NextRequest) {
  const session = await requirePermissionFromSession("org:manage", { request })
  const orgId = session.user?.orgId ?? "demo-org"
  const body = (await request.json()) as { membershipId?: string; roles?: string[] }

  if (!body.membershipId || !Array.isArray(body.roles)) {
    return NextResponse.json({ error: "membershipId and roles are required" }, { status: 400 })
  }

  await updateMemberRoles({ membershipId: body.membershipId, roles: body.roles })
  await recordAuthEvent({
    userId: session.user?.id as string,
    orgId,
    eventType: "rbac.roles.updated",
    metadata: {
      membershipId: body.membershipId,
      roles: body.roles,
    },
  })

  return NextResponse.json({ ok: true })
}
