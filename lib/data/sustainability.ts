import { supabase } from "@/lib/db/supabase"

export interface SustainabilityLog {
  id: string
  orgId: string
  userId: string | null
  renderId: string
  co2Kg: number
  energyKwh?: number | null
  durationSeconds?: number | null
  createdAt: string
}

const TABLE = "sustainability_logs"

export async function recordSustainabilityLog(params: {
  orgId: string
  userId?: string | null
  renderId: string
  co2Kg: number
  energyKwh?: number | null
  durationSeconds?: number | null
}): Promise<SustainabilityLog> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      org_id: params.orgId,
      user_id: params.userId ?? null,
      render_id: params.renderId,
      co2_kg: params.co2Kg,
      energy_kwh: params.energyKwh ?? null,
      duration_seconds: params.durationSeconds ?? null,
    })
    .select()
    .single()

  if (error || !data) {
    throw new Error(`Failed to log sustainability metric: ${error?.message ?? "unknown error"}`)
  }

  return mapLog(data)
}

export async function listSustainabilityLogs(orgId: string, limit = 20): Promise<SustainabilityLog[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("id, org_id, user_id, render_id, co2_kg, energy_kwh, duration_seconds, created_at")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    throw new Error(`Failed to fetch sustainability logs: ${error.message}`)
  }

  return (data ?? []).map(mapLog)
}

function mapLog(row: any): SustainabilityLog {
  return {
    id: row.id,
    orgId: row.org_id,
    userId: row.user_id ?? null,
    renderId: row.render_id,
    co2Kg: Number(row.co2_kg ?? 0),
    energyKwh: row.energy_kwh != null ? Number(row.energy_kwh) : null,
    durationSeconds: row.duration_seconds != null ? Number(row.duration_seconds) : null,
    createdAt: row.created_at,
  }
}
