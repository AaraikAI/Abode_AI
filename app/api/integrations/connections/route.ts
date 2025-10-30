import { NextRequest, NextResponse } from "next/server"

import { requireSession } from "@/lib/auth/session"
import { listIntegrationProviders, listOrganizationIntegrations, upsertOrganizationIntegration } from "@/lib/data/integrations"

export async function GET(request: NextRequest) {
  const session = await requireSession({ request, enforceDevice: true, enforceGeo: true })
  const orgId = session.user?.orgId ?? "demo-org"

  const [providers, integrations] = await Promise.all([
    listIntegrationProviders(),
    listOrganizationIntegrations(orgId),
  ])

  return NextResponse.json({ providers, integrations })
}

export async function POST(request: NextRequest) {
  const session = await requireSession({ request, enforceDevice: true, enforceGeo: true })
  const orgId = session.user?.orgId ?? "demo-org"

  const body = (await request.json().catch(() => ({}))) as {
    providerId?: string
    accessToken?: string
  }

  if (!body.providerId) {
    return NextResponse.json({ error: "providerId is required" }, { status: 400 })
  }

  const tokenPreview = body.accessToken ? `${body.accessToken.slice(0, 4)}…${body.accessToken.slice(-4)}` : null

  await upsertOrganizationIntegration({
    orgId,
    providerId: body.providerId,
    accessToken: body.accessToken ?? null,
    metadata: tokenPreview ? { tokenPreview } : undefined,
  })

  const integrations = await listOrganizationIntegrations(orgId)
  return NextResponse.json({ integrations }, { status: 201 })
}
