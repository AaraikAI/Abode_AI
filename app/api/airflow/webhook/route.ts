import { NextRequest, NextResponse } from "next/server"

import { recordAirflowEvent } from "@/lib/data/integrations"

export async function POST(request: NextRequest) {
  const payload = (await request.json().catch(() => ({}))) as {
    dag_id?: string
    run_id?: string
    event?: string
    org_id?: string
    details?: Record<string, unknown>
  }

  if (!payload.dag_id || !payload.run_id) {
    return NextResponse.json({ error: "Missing dag_id or run_id" }, { status: 400 })
  }

  await recordAirflowEvent({
    orgId: payload.org_id,
    dagId: payload.dag_id,
    runId: payload.run_id,
    eventType: payload.event ?? "unknown",
    payload: payload.details ?? payload,
  })

  return NextResponse.json({ received: true })
}
