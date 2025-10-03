import { NextResponse } from "next/server"

import { requireSession } from "@/lib/auth/session"
import { createAuthenticationOptions } from "@/lib/auth/webauthn"

export async function POST() {
  const session = await requireSession({ enforceDevice: false, enforceGeo: false })
  const options = await createAuthenticationOptions({ id: session.user?.id as string })
  return NextResponse.json(options)
}
