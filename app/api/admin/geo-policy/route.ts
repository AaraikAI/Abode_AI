import { NextRequest, NextResponse } from "next/server"

import { requirePermissionFromSession } from "@/lib/auth/session"
import { getOrgGeoPolicy, upsertOrgGeoPolicy } from "@/lib/auth/store"

export async function GET(request: NextRequest) {
  const session = await requirePermissionFromSession("org:manage", { request })
  const orgId = session.user?.orgId ?? "demo-org"
  const policy = await getOrgGeoPolicy(orgId)
  return NextResponse.json({ policy })
}

export async function POST(request: NextRequest) {
  const session = await requirePermissionFromSession("org:manage", { request })
  const orgId = session.user?.orgId ?? "demo-org"
  const body = (await request.json().catch(() => ({}))) as {
    allowedCountries?: string[]
    blockedCountries?: string[]
    enforced?: boolean
  }

  const policy = await upsertOrgGeoPolicy({
    orgId,
    allowedCountries: body.allowedCountries ?? [],
    blockedCountries: body.blockedCountries ?? [],
    enforced: body.enforced ?? false,
  })

  return NextResponse.json({ policy })
}
