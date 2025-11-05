import { NextRequest, NextResponse } from "next/server"

import { requireSession } from "@/lib/auth/session"
import { createAuthenticationOptions } from "@/lib/auth/webauthn"

export async function POST(request: NextRequest) {
  const session = await requireSession({ request, enforceDevice: true, enforceGeo: true })
  const userId = session.user?.id

  if (!userId) {
    return NextResponse.json({ error: "User session required" }, { status: 401 })
  }

  try {
    const options = await createAuthenticationOptions({ id: userId })
    return NextResponse.json({ options })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 })
  }
}
