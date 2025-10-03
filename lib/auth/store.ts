import { recordAuthEvent } from "@/lib/auth/audit"
import { supabase } from "@/lib/db/supabase"

export interface SupabaseUser {
  id: string
  auth0_user_id: string
  email: string
  display_name: string | null
  created_at?: string
  updated_at?: string
}

export interface SupabaseOrganization {
  id: string
  external_ref: string | null
  name: string
  slug?: string | null
  created_at?: string
  updated_at?: string
}

export interface SupabaseMembership {
  id: string
  user_id: string
  organization_id: string
  roles: string[]
  created_at?: string
  updated_at?: string
}

export interface SupabaseSessionRecord {
  id: string
  user_id: string
  organization_id: string | null
  ip_address: string | null
  geo_country: string | null
  user_agent: string | null
  metadata: Record<string, unknown> | null
  expires_at: string | null
  last_seen_at: string | null
  created_at?: string
  updated_at?: string
}

export interface SupabaseDeviceRecord {
  id: string
  user_id: string
  device_id: string
  user_agent?: string | null
  ip_address?: string | null
  geo_country?: string | null
  trusted: boolean
  last_seen_at?: string | null
  created_at?: string
}

export interface SupabaseMfaMethod {
  id: string
  user_id: string
  method_type: string
  label?: string | null
  public_key?: string | null
  credential_id?: string | null
  sign_count?: number | null
  last_used_at?: string | null
  created_at?: string
}

export interface OrgGeoPolicy {
  id: string
  org_id: string
  allowed_countries: string[]
  blocked_countries: string[]
  enforced: boolean
  updated_at: string
}

export async function ensureOrganization(externalId: string, name?: string): Promise<SupabaseOrganization> {
  if (!externalId) {
    throw new Error("Missing external organization identifier")
  }

  const { data: existing, error: selectError } = await supabase
    .from("organizations")
    .select()
    .eq("external_ref", externalId)
    .maybeSingle()

  if (selectError) {
    throw new Error(`Failed to fetch organization: ${selectError.message}`)
  }

  if (existing) {
    if (name && existing.name !== name) {
      const { data: updated, error: updateError } = await supabase
        .from("organizations")
        .update({ name })
        .eq("id", existing.id)
        .select()
        .single()

      if (updateError || !updated) {
        throw new Error(`Failed to update organization: ${updateError?.message ?? "no data"}`)
      }

      return updated as SupabaseOrganization
    }

    return existing as SupabaseOrganization
  }

  const { data: inserted, error: insertError } = await supabase
    .from("organizations")
    .insert({
      external_ref: externalId,
      name: name ?? externalId,
    })
    .select()
    .single()

  if (insertError || !inserted) {
    throw new Error(`Failed to insert organization: ${insertError?.message ?? "no data"}`)
  }

  return inserted as SupabaseOrganization
}

export async function ensureUser(params: {
  auth0UserId: string
  email?: string | null
  displayName?: string | null
}): Promise<SupabaseUser> {
  const { auth0UserId, email, displayName } = params
  const { data, error } = await supabase
    .from("users")
    .upsert(
      {
        auth0_user_id: auth0UserId,
        email: email ?? null,
        display_name: displayName ?? null,
      },
      { onConflict: "auth0_user_id" }
    )
    .select()
    .single()

  if (error || !data) {
    throw new Error(`Failed to upsert user: ${error?.message ?? "no data"}`)
  }

  return data as SupabaseUser
}

export async function ensureMembership(params: {
  userId: string
  organizationId: string
  roles: string[]
  actorUserId?: string
}): Promise<SupabaseMembership> {
  const { data: existing, error: selectError } = await supabase
    .from("user_organization_memberships")
    .select()
    .match({ user_id: params.userId, organization_id: params.organizationId })
    .maybeSingle()

  if (selectError) {
    throw new Error(`Failed to fetch membership: ${selectError.message}`)
  }

  if (existing) {
    if (Array.isArray(existing.roles) && arraysEqual(existing.roles, params.roles)) {
      return existing as SupabaseMembership
    }

    const { data: updated, error: updateError } = await supabase
      .from("user_organization_memberships")
      .update({ roles: params.roles })
      .match({ user_id: params.userId, organization_id: params.organizationId })
      .select()
      .single()

    if (updateError || !updated) {
      throw new Error(`Failed to update membership: ${updateError?.message ?? "no data"}`)
    }

    await recordAuthEvent({
      userId: params.actorUserId ?? params.userId,
      orgId: params.organizationId,
      eventType: "rbac.roles.updated",
      metadata: {
        targetUserId: params.userId,
        previousRoles: existing.roles ?? [],
        nextRoles: params.roles,
      },
    })

    return updated as SupabaseMembership
  }

  const { data: inserted, error: insertError } = await supabase
    .from("user_organization_memberships")
    .insert({
      user_id: params.userId,
      organization_id: params.organizationId,
      roles: params.roles,
    })
    .select()
    .single()

  if (insertError || !inserted) {
    throw new Error(`Failed to insert membership: ${insertError?.message ?? "no data"}`)
  }

  await recordAuthEvent({
    userId: params.actorUserId ?? params.userId,
    orgId: params.organizationId,
    eventType: "rbac.roles.created",
    metadata: {
      targetUserId: params.userId,
      nextRoles: params.roles,
    },
  })

  return inserted as SupabaseMembership
}

export async function getMembership(userId: string, organizationId: string): Promise<SupabaseMembership | null> {
  const { data, error } = await supabase
    .from("user_organization_memberships")
    .select()
    .match({ user_id: userId, organization_id: organizationId })
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to fetch membership: ${error.message}`)
  }

  return (data as SupabaseMembership | null) ?? null
}

export async function getUserByAuthProvider(auth0UserId: string): Promise<SupabaseUser | null> {
  const { data, error } = await supabase
    .from("users")
    .select()
    .eq("auth0_user_id", auth0UserId)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to fetch user: ${error.message}`)
  }

  return (data as SupabaseUser | null) ?? null
}

export async function recordUserSession(params: {
  sessionId: string
  userId: string
  organizationId?: string | null
  ipAddress?: string | null
  geoCountry?: string | null
  userAgent?: string | null
  metadata?: Record<string, unknown>
  expiresAt?: Date | string | null
  deviceId?: string | null
  trustDevice?: boolean
}): Promise<SupabaseSessionRecord> {
  const { data, error } = await supabase
    .from("user_sessions")
    .upsert(
      {
        id: params.sessionId,
        user_id: params.userId,
        organization_id: params.organizationId ?? null,
        ip_address: params.ipAddress ?? null,
        geo_country: params.geoCountry ?? null,
        user_agent: params.userAgent ?? null,
        metadata: params.metadata ?? null,
        expires_at: params.expiresAt ? new Date(params.expiresAt).toISOString() : null,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    )
    .select()
    .single()

  if (error || !data) {
    throw new Error(`Failed to upsert user session: ${error?.message ?? "no data"}`)
  }

  if (params.deviceId) {
    await upsertUserDevice({
      userId: params.userId,
      deviceId: params.deviceId,
      userAgent: params.userAgent ?? null,
      ipAddress: params.ipAddress ?? null,
      geoCountry: params.geoCountry ?? null,
      trusted: params.trustDevice ?? false,
    })
  }

  return data as SupabaseSessionRecord
}

export async function touchUserSession(sessionId: string) {
  const { error } = await supabase
    .from("user_sessions")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("id", sessionId)

  if (error) {
    throw new Error(`Failed to update user session heartbeat: ${error.message}`)
  }
}

export async function endUserSession(sessionId: string) {
  const { error } = await supabase
    .from("user_sessions")
    .update({ ended_at: new Date().toISOString() })
    .eq("id", sessionId)

  if (error) {
    throw new Error(`Failed to end user session: ${error.message}`)
  }
}

function arraysEqual(a?: string[], b?: string[]) {
  if (!a && !b) return true
  if (!a || !b) return false
  if (a.length !== b.length) return false
  const sortedA = [...a].sort()
  const sortedB = [...b].sort()
  return sortedA.every((value, index) => value === sortedB[index])
}

export async function upsertUserDevice(params: {
  userId: string
  deviceId: string
  userAgent?: string | null
  ipAddress?: string | null
  geoCountry?: string | null
  trusted?: boolean
}): Promise<SupabaseDeviceRecord> {
  const { data, error } = await supabase
    .from("user_devices")
    .upsert(
      {
        user_id: params.userId,
        device_id: params.deviceId,
        user_agent: params.userAgent ?? null,
        ip_address: params.ipAddress ?? null,
        geo_country: params.geoCountry ?? null,
        trusted: params.trusted ?? false,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: "user_id,device_id" }
    )
    .select()
    .single()

  if (error || !data) {
    throw new Error(`Failed to upsert user device: ${error?.message ?? "unknown"}`)
  }

  return {
    id: data.id,
    user_id: data.user_id,
    device_id: data.device_id,
    user_agent: data.user_agent,
    ip_address: data.ip_address,
    geo_country: data.geo_country,
    trusted: data.trusted,
    last_seen_at: data.last_seen_at,
    created_at: data.created_at,
  }
}

export async function listUserDevices(userId: string): Promise<SupabaseDeviceRecord[]> {
  const { data, error } = await supabase
    .from("user_devices")
    .select("id, user_id, device_id, user_agent, ip_address, geo_country, trusted, last_seen_at, created_at")
    .eq("user_id", userId)
    .order("last_seen_at", { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch devices: ${error.message}`)
  }

  return (data ?? []) as SupabaseDeviceRecord[]
}

export async function updateDeviceTrust(deviceId: string, userId: string, trusted: boolean) {
  const { error } = await supabase
    .from("user_devices")
    .update({ trusted })
    .match({ id: deviceId, user_id: userId })
  if (error) {
    throw new Error(`Failed to update device: ${error.message}`)
  }
}

export async function listMfaMethods(userId: string): Promise<SupabaseMfaMethod[]> {
  const { data, error } = await supabase
    .from("user_mfa_methods")
    .select("id, user_id, method_type, label, public_key, credential_id, sign_count, last_used_at, created_at")
    .eq("user_id", userId)

  if (error) {
    throw new Error(`Failed to fetch MFA methods: ${error.message}`)
  }

  return (data ?? []) as SupabaseMfaMethod[]
}

export async function registerMfaMethod(params: {
  userId: string
  methodType: string
  label?: string
  publicKey?: string
  credentialId?: string
  signCount?: number
}): Promise<SupabaseMfaMethod> {
  const { data, error } = await supabase
    .from("user_mfa_methods")
    .insert({
      user_id: params.userId,
      method_type: params.methodType,
      label: params.label ?? null,
      public_key: params.publicKey ?? null,
      credential_id: params.credentialId ?? null,
      sign_count: params.signCount ?? 0,
    })
    .select()
    .single()

  if (error || !data) {
    throw new Error(`Failed to register MFA method: ${error?.message ?? "unknown"}`)
  }

  return data as SupabaseMfaMethod
}

export async function recordMfaUsage(methodId: string) {
  const { error } = await supabase
    .from("user_mfa_methods")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", methodId)

  if (error) {
    throw new Error(`Failed to update MFA usage: ${error.message}`)
  }
}

export async function updateMfaSignCount(methodId: string, signCount: number) {
  const { error } = await supabase
    .from("user_mfa_methods")
    .update({ sign_count: signCount, last_used_at: new Date().toISOString() })
    .eq("id", methodId)

  if (error) {
    throw new Error(`Failed to update MFA counter: ${error.message}`)
  }
}

export async function getOrgGeoPolicy(orgId: string): Promise<OrgGeoPolicy | null> {
  const { data, error } = await supabase
    .from("org_geo_policies")
    .select("id, org_id, allowed_countries, blocked_countries, enforced, updated_at")
    .eq("org_id", orgId)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to load geo policy: ${error.message}`)
  }

  return (data as OrgGeoPolicy | null) ?? null
}

export async function upsertOrgGeoPolicy(params: {
  orgId: string
  allowedCountries: string[]
  blockedCountries: string[]
  enforced: boolean
}): Promise<OrgGeoPolicy> {
  const { data, error } = await supabase
    .from("org_geo_policies")
    .upsert(
      {
        org_id: params.orgId,
        allowed_countries: params.allowedCountries,
        blocked_countries: params.blockedCountries,
        enforced: params.enforced,
      },
      { onConflict: "org_id" }
    )
    .select("id, org_id, allowed_countries, blocked_countries, enforced, updated_at")
    .single()

  if (error || !data) {
    throw new Error(`Failed to update geo policy: ${error?.message ?? "unknown"}`)
  }

  return data as OrgGeoPolicy
}
