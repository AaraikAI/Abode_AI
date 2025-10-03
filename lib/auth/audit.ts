import { supabase } from "@/lib/db/supabase"

export interface AuthAuditEvent {
  userId: string
  orgId?: string | null
  eventType: string
  ipAddress?: string | null
  geoCountry?: string | null
  userAgent?: string | null
  metadata?: Record<string, unknown>
}

export async function recordAuthEvent(event: AuthAuditEvent) {
  const { error } = await supabase.from("auth_audits").insert({
    user_id: event.userId,
    organization_id: event.orgId ?? null,
    event_type: event.eventType,
    ip_address: event.ipAddress ?? null,
    geo_country: event.geoCountry ?? null,
    user_agent: event.userAgent ?? null,
    metadata: event.metadata ?? null,
  })

  if (error) {
    throw new Error(`Failed to record auth audit event: ${error.message}`)
  }
}
