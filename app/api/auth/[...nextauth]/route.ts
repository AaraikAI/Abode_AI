import NextAuth from "next-auth"
import { randomUUID } from "crypto"
import { NextRequest } from "next/server"
import requestIp from "request-ip"
import { cookies } from "next/headers"

import { authOptions } from "@/lib/auth/options"
import { deriveGeoCountry, normalizeIp } from "@/lib/auth/geo"
import { runWithAuthRequestContext } from "@/lib/auth/request-context"

const handler = NextAuth(authOptions)

const DEFAULT_GEO_COUNTRY = process.env.DEFAULT_GEO_COUNTRY ?? null

function resolveRequestDetails(req: NextRequest) {
  const rawIp = (requestIp.getClientIp(req as any) as string | undefined) ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ?? undefined

  const ipAddress = normalizeIp(rawIp)
  const headerCountry =
    req.headers.get("cf-ipcountry") ?? req.headers.get("x-geo-country") ?? null
  const geoCountry = deriveGeoCountry({
    ipAddress,
    headerCountry,
    defaultCountry: DEFAULT_GEO_COUNTRY,
  })

  const userAgent = req.headers.get("user-agent") ?? undefined
  const cookieStore = cookies()
  let deviceId = cookieStore.get("abode-device")?.value
  if (!deviceId) {
    deviceId = randomUUID()
  }

  cookieStore.set("abode-device", deviceId, {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  })

  return { ipAddress: ipAddress ?? undefined, geoCountry: geoCountry ?? undefined, userAgent, deviceId }
}

export function GET(req: NextRequest) {
  const { ipAddress, geoCountry, userAgent, deviceId } = resolveRequestDetails(req)
  return runWithAuthRequestContext({ request: req, ipAddress, geoCountry, userAgent, metadata: { deviceId } }, () => handler(req))
}

export function POST(req: NextRequest) {
  const { ipAddress, geoCountry, userAgent, deviceId } = resolveRequestDetails(req)
  return runWithAuthRequestContext({ request: req, ipAddress, geoCountry, userAgent, metadata: { deviceId } }, () => handler(req))
}
