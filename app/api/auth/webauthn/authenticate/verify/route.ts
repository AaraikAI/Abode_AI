import { NextRequest, NextResponse } from "next/server"

import { requireSession } from "@/lib/auth/session"
import { verifyAuthenticationResponsePayload } from "@/lib/auth/webauthn"

export async function POST(request: NextRequest) {
  const session = await requireSession({ request, enforceDevice: true, enforceGeo: true })
  const userId = session.user?.id

  if (!userId) {
    return NextResponse.json({ error: "User session required" }, { status: 401 })
  }

  const body = (await request.json().catch(() => ({}))) as unknown

  try {
    const verification = await verifyAuthenticationResponsePayload(userId, body as any)
    return NextResponse.json({ verified: verification.verified })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 })
  }
}
