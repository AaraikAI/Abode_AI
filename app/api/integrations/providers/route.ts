import { NextResponse } from "next/server"

import { listIntegrationProviders } from "@/lib/data/integrations"

export async function GET() {
  const providers = await listIntegrationProviders()
  return NextResponse.json({ providers })
}
