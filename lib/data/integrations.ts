import { supabase } from "@/lib/db/supabase"

export type IntegrationProvider = "slack" | "figma" | "adobe" | "zapier"

export interface ProviderRecord {
  id: string
  provider: IntegrationProvider
  displayName: string
  description?: string | null
  authType: string
  scopes?: string[] | null
}

export interface OrganizationIntegration {
  id: string
  orgId: string
  providerId: string
  provider: IntegrationProvider
  displayName: string
  accessTokenMasked?: string | null
  expiresAt?: string | null
  metadata?: Record<string, unknown>
}

export async function listIntegrationProviders(): Promise<ProviderRecord[]> {
  const { data, error } = await supabase
    .from("integration_providers")
    .select("id, provider, display_name, description, auth_type, scopes")
    .order("display_name", { ascending: true })

  if (error) {
    throw new Error(`Failed to load integration providers: ${error.message}`)
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    provider: row.provider,
    displayName: row.display_name,
    description: row.description,
    authType: row.auth_type,
    scopes: row.scopes ?? null,
  })) as ProviderRecord[]
}

export async function listOrganizationIntegrations(orgId: string): Promise<OrganizationIntegration[]> {
  const { data, error } = await supabase
    .from("organization_integrations")
    .select("id, org_id, provider_id, expires_at, metadata, integration_providers(provider, display_name)")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(`Failed to load organization integrations: ${error.message}`)
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    orgId: row.org_id,
    providerId: row.provider_id,
    provider: row.integration_providers?.provider,
    displayName: row.integration_providers?.display_name ?? row.provider_id,
    expiresAt: row.expires_at ?? null,
    accessTokenMasked: row.metadata?.tokenPreview ?? null,
    metadata: row.metadata ?? undefined,
  })) as OrganizationIntegration[]
}

export async function upsertOrganizationIntegration(params: {
  orgId: string
  providerId: string
  accessToken?: string | null
  refreshToken?: string | null
  expiresAt?: string | null
  metadata?: Record<string, unknown>
}): Promise<void> {
  const { error } = await supabase.from("organization_integrations").upsert(
    {
      org_id: params.orgId,
      provider_id: params.providerId,
      access_token: params.accessToken ?? null,
      refresh_token: params.refreshToken ?? null,
      expires_at: params.expiresAt ?? null,
      metadata: params.metadata ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "org_id,provider_id" }
  )

  if (error) {
    throw new Error(`Failed to store integration: ${error.message}`)
  }
}

export async function recordAirflowEvent(params: {
  orgId?: string
  dagId: string
  runId: string
  eventType: string
  payload?: Record<string, unknown>
}): Promise<void> {
  const { error } = await supabase.from("airflow_webhook_events").insert({
    org_id: params.orgId ?? null,
    dag_id: params.dagId,
    run_id: params.runId,
    event_type: params.eventType,
    payload: params.payload ?? null,
  })

  if (error) {
    throw new Error(`Failed to record Airflow event: ${error.message}`)
  }
}
