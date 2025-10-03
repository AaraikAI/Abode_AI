import { NextRequest, NextResponse } from "next/server"

import { requireSession } from "@/lib/auth/session"
import { verifyRegistrationResponsePayload } from "@/lib/auth/webauthn"

export async function POST(request: NextRequest) {
  const session = await requireSession({ enforceDevice: false, enforceGeo: false })
  const body = (await request.json()) as unknown

  try {
    const verification = await verifyRegistrationResponsePayload(session.user?.id as string, body as any)
    return NextResponse.json({ verified: verification.verified })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 })
  }
}
