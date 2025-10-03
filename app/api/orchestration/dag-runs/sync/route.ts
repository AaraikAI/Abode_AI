import { NextRequest, NextResponse } from "next/server"

import { requirePermissionFromSession } from "@/lib/auth/session"
import { syncAirflowDagRuns } from "@/lib/services/airflow"

export async function POST(request: NextRequest) {
  const session = await requirePermissionFromSession("pipelines:read", {
    request,
    enforceDevice: true,
    enforceGeo: true,
  })

  const body = await request.json().catch(() => ({})) as { runId?: string }
  const orgId = session.user?.orgId ?? "demo-org"

  try {
    const runs = await syncAirflowDagRuns({ orgId, runId: body.runId })
    return NextResponse.json({ runs })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
