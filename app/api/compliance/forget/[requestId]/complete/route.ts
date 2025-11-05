import { NextRequest, NextResponse } from "next/server"

import { requireSession } from "@/lib/auth/session"
import { recordComplianceEvent, updateForgetRequestStatus } from "@/lib/data/compliance"
import { forwardPrivacyEvent } from "@/lib/services/siem"

export async function POST(request: NextRequest, { params }: { params: { requestId: string } }) {
  const session = await requireSession({ request, enforceDevice: true, enforceGeo: true })
  const orgId = session.user?.orgId ?? "demo-org"

  await updateForgetRequestStatus(params.requestId, "completed")
  await recordComplianceEvent({
    orgId,
    actor: session.user?.email ?? session.user?.id ?? "system",
    action: "forget_request.completed",
    resource: params.requestId,
  })

  await forwardPrivacyEvent({
    orgId,
    requestId: params.requestId,
    action: "forget",
  })

  return NextResponse.json({ status: "completed" })
}
