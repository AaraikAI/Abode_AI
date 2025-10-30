import { supabase } from "@/lib/db/supabase"

export interface TelemetryEvent {
  id: string
  eventType: string
  createdAt: string
  source?: string | null
  payload?: Record<string, unknown>
}

export interface SustainabilityPoint {
  id: string
  targetId?: string | null
  targetName?: string | null
  actualValue: number
  targetValue?: number | null
  unit: string
  collectedAt: string
}

export async function listTelemetryEvents(orgId: string, limit = 50): Promise<TelemetryEvent[]> {
  const { data, error } = await supabase
    .from("telemetry_events")
    .select("id, event_type, created_at, source, payload")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    throw new Error(`Failed to load telemetry events: ${error.message}`)
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    eventType: row.event_type,
    createdAt: row.created_at,
    source: row.source,
    payload: row.payload ?? undefined,
  }))
}

export async function listSustainabilitySeries(orgId: string): Promise<SustainabilityPoint[]> {
  const { data, error } = await supabase
    .from("sustainability_actuals")
    .select("id, actual_value, collected_at, metadata, sustainability_targets(id, target_name, target_value, unit)")
    .eq("org_id", orgId)
    .order("collected_at", { ascending: false })

  if (error) {
    throw new Error(`Failed to load sustainability actuals: ${error.message}`)
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    targetId: row.sustainability_targets?.id ?? null,
    targetName: row.sustainability_targets?.target_name ?? row.metadata?.target_name ?? null,
    targetValue: row.sustainability_targets?.target_value ?? null,
    unit: row.sustainability_targets?.unit ?? "kg",
    actualValue: Number(row.actual_value ?? 0),
    collectedAt: row.collected_at,
  }))
}

export async function recordTelemetryEvent(params: {
  orgId?: string
  eventType: string
  source?: string
  payload?: Record<string, unknown>
  traceId?: string
  spanId?: string
}): Promise<void> {
  const { error } = await supabase.from("telemetry_events").insert({
    org_id: params.orgId ?? null,
    event_type: params.eventType,
    source: params.source ?? null,
    payload: params.payload ?? null,
    trace_id: params.traceId ?? null,
    span_id: params.spanId ?? null,
  })

  if (error) {
    throw new Error(`Failed to write telemetry event: ${error.message}`)
  }
}
