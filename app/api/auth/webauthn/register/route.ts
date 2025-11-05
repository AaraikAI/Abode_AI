import { NextRequest, NextResponse } from "next/server"

import { requireSession } from "@/lib/auth/session"
import { createRegistrationOptions } from "@/lib/auth/webauthn"

export async function POST(request: NextRequest) {
  const session = await requireSession({ request, enforceDevice: true, enforceGeo: true })
  const userId = session.user?.id

  if (!userId || !session.user?.email) {
    return NextResponse.json({ error: "User session required" }, { status: 401 })
  }

  const options = await createRegistrationOptions({
    id: userId,
    email: session.user.email,
    name: session.user.name ?? session.user.email,
  })

  return NextResponse.json({ options })
}
