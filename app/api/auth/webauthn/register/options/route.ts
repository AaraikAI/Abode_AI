import { NextResponse } from "next/server"

import { requireSession } from "@/lib/auth/session"
import { createRegistrationOptions } from "@/lib/auth/webauthn"

export async function POST() {
  const session = await requireSession({ enforceDevice: false, enforceGeo: false })
  const options = await createRegistrationOptions({
    id: session.user?.id as string,
    email: session.user?.email ?? undefined,
    name: session.user?.name ?? undefined,
  })
  return NextResponse.json(options)
}
