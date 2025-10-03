import { NextRequest, NextResponse } from "next/server"

import { requireSession } from "@/lib/auth/session"
import { listUserDevices, updateDeviceTrust } from "@/lib/auth/store"

export async function GET() {
  const { user } = await requireSession({ enforceDevice: true })
  const devices = await listUserDevices(user?.id as string)
  return NextResponse.json({ devices })
}

export async function PATCH(request: NextRequest) {
  const { user } = await requireSession({ enforceDevice: true })
  const body = (await request.json()) as { deviceId?: string; trusted?: boolean }

  if (!body.deviceId || typeof body.trusted !== "boolean") {
    return NextResponse.json({ error: "deviceId and trusted flag required" }, { status: 400 })
  }

  if (!user?.id) {
    return NextResponse.json({ error: "Unable to resolve user" }, { status: 401 })
  }

  await updateDeviceTrust(body.deviceId, user.id, body.trusted)
  return NextResponse.json({ ok: true })
}
