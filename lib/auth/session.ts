import { getServerSession } from "next-auth"
import type { NextRequest } from "next/server"

import { authOptions } from "@/lib/auth/options"
import { getMembership, getOrgGeoPolicy } from "@/lib/auth/store"
import { supabase } from "@/lib/db/supabase"
import { collectUserPermissions, hasPermission } from "@/lib/rbac"

type RequestMeta = {
  ipAddress?: string | null
  userAgent?: string | null
  geoCountry?: string | null
}

export interface RequireSessionOptions {
  request?: NextRequest | RequestMeta
  enforceDevice?: boolean
  enforceGeo?: boolean
}

const GEO_ALLOWLIST = process.env.GEO_ALLOWED_COUNTRIES
  ? process.env.GEO_ALLOWED_COUNTRIES.split(",").map((country) => country.trim()).filter(Boolean)
  : undefined
const DEFAULT_ENFORCE_DEVICE = process.env.AUTH_ENFORCE_DEVICE === "true"
const DEFAULT_ENFORCE_GEO = process.env.AUTH_ENFORCE_GEO === "true"
const DEFAULT_GEO_COUNTRY = process.env.DEFAULT_GEO_COUNTRY ?? null

type SessionRecordSnapshot = {
  geo_country: string | null
}

export async function requireSession(options?: RequireSessionOptions) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  await refreshSessionMembership(session)

  if (session.user?.orgId) {
    await syncGeoPolicyToSession(session)
  }

  const sessionMeta = session as unknown as Record<string, unknown>
  const sessionId = sessionMeta.sessionId as string | undefined
  const requestMeta = extractRequestMeta(options?.request)

  const enforceDevice = options?.enforceDevice ?? DEFAULT_ENFORCE_DEVICE
  const enforceGeo = options?.enforceGeo ?? (session.user?.geoPolicyEnforced ?? DEFAULT_ENFORCE_GEO)

  let sessionRecord: SessionRecordSnapshot | undefined

  if (enforceDevice && sessionId) {
    sessionRecord = await assertDeviceTrusted({ sessionId, userId: session.user.id })
  }

  if (enforceGeo) {
    await assertGeoAllowed({
      userId: session.user.id,
      sessionId,
      requestedCountry: requestMeta.geoCountry,
      sessionRecord,
      orgPolicy: session.user?.orgGeoPolicy,
    })
  }

  return session
}

export async function requirePermissionFromSession(permission: string, options?: RequireSessionOptions) {
  const session = await requireSession(options)
  const roles = session.user?.roles ?? []
  if (!hasPermission(roles, permission)) {
    throw new Error("Forbidden")
  }
  return session
}

async function refreshSessionMembership(session: Record<string, any>) {
  const userId = session.user?.id
  const orgId = session.user?.orgId
  if (!userId || !orgId) return

  try {
    const membership = await getMembership(userId, orgId)
    if (membership?.roles?.length) {
      session.user.roles = membership.roles
      session.user.permissions = [...collectUserPermissions(membership.roles)]
    }
  } catch (error) {
    console.error("Failed to refresh membership for session", error)
  }
}

export async function assertDeviceTrusted(params: { sessionId: string; userId: string }): Promise<SessionRecordSnapshot> {
  const { data, error } = await supabase
    .from("user_sessions")
    .select("id, user_id, ended_at, geo_country")
    .eq("id", params.sessionId)
    .eq("user_id", params.userId)
    .maybeSingle()

  if (error) {
    throw new Error(`Unable to verify device trust: ${error.message}`)
  }

  if (!data) {
    throw new Error("Unrecognised session")
  }

  if ((data as { ended_at?: string | null }).ended_at) {
    throw new Error("Session revoked")
  }

  return { geo_country: (data as { geo_country?: string | null }).geo_country ?? null }
}

export async function assertGeoAllowed(params: {
  userId: string
  sessionId?: string
  requestedCountry?: string | null
  sessionRecord?: SessionRecordSnapshot
  orgPolicy?: { allowed: string[]; blocked: string[]; enforced: boolean }
}) {
  const orgPolicy = params.orgPolicy

  let country = params.requestedCountry ?? params.sessionRecord?.geo_country ?? DEFAULT_GEO_COUNTRY

  if (!country && params.sessionId) {
    const { data, error } = await supabase
      .from("user_sessions")
      .select("geo_country")
      .eq("id", params.sessionId)
      .maybeSingle()

    if (error) {
      throw new Error(`Unable to determine session geography: ${error.message}`)
    }

    country = data?.geo_country ?? null
  }

  if (!country) {
    throw new Error("Unable to determine request country; access denied")
  }

  const upperCountry = country.toUpperCase()
  const globalAllow = GEO_ALLOWLIST && GEO_ALLOWLIST.length > 0 ? GEO_ALLOWLIST : undefined

  if (orgPolicy?.blocked?.includes(upperCountry)) {
    throw new Error("Access from restricted geography")
  }

  if (globalAllow && !globalAllow.includes(upperCountry)) {
    throw new Error("Access from restricted geography")
  }

  if (orgPolicy && orgPolicy.enforced) {
    if (orgPolicy.allowed.length && !orgPolicy.allowed.includes(upperCountry)) {
      throw new Error("Access from restricted geography")
    }
  }

  if (!globalAllow && (!orgPolicy || !orgPolicy.enforced)) {
    return
  }
}

function extractRequestMeta(request?: NextRequest | RequestMeta): RequestMeta {
  if (!request) {
    return { ipAddress: null, userAgent: null, geoCountry: DEFAULT_GEO_COUNTRY }
  }

  if ("headers" in request) {
    const headers = (request as NextRequest).headers
    return {
      ipAddress: headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? headers.get("x-real-ip") ?? null,
      userAgent: headers.get("user-agent") ?? null,
      geoCountry: headers.get("x-geo-country") ?? headers.get("cf-ipcountry") ?? DEFAULT_GEO_COUNTRY,
    }
  }

  return {
    ipAddress: request.ipAddress ?? null,
    userAgent: request.userAgent ?? null,
    geoCountry: request.geoCountry ?? DEFAULT_GEO_COUNTRY,
  }
}

async function syncGeoPolicyToSession(session: Record<string, any>) {
  try {
    if (!session.user?.orgId) return
    const policy = await getOrgGeoPolicy(session.user.orgId)
    if (policy) {
      session.user.orgGeoPolicy = {
        allowed: policy.allowed_countries ?? [],
        blocked: policy.blocked_countries ?? [],
        enforced: policy.enforced,
      }
      session.user.geoPolicyEnforced = policy.enforced
    }
  } catch (error) {
    console.error("Failed to load geo policy", error)
  }
}
