import { supabase } from "@/lib/db/supabase"

export type GenerationStatus =
  | "queued"
  | "processing"
  | "generating"
  | "upscaling"
  | "success"
  | "failed"

export interface GenerationJobRecord {
  id: string
  orgId: string
  userId: string | null
  prompt: string
  style?: string | null
  status: GenerationStatus
  previewUrl?: string | null
  outputUrl?: string | null
  upscaledUrl?: string | null
  error?: string | null
  metadata?: Record<string, unknown> | null
  co2Kg?: number | null
  energyKwh?: number | null
  durationSeconds?: number | null
  createdAt: string
  updatedAt: string
}

const TABLE = "studio_generation_jobs"

function mapRow(row: any): GenerationJobRecord {
  return {
    id: row.id,
    orgId: row.org_id,
    userId: row.user_id ?? null,
    prompt: row.prompt,
    style: row.style ?? null,
    status: row.status,
    previewUrl: row.preview_url ?? null,
    outputUrl: row.output_url ?? null,
    upscaledUrl: row.upscaled_url ?? null,
    error: row.error ?? null,
    metadata: (row.metadata ?? undefined) as Record<string, unknown> | undefined,
    co2Kg: row.co2_kg != null ? Number(row.co2_kg) : null,
    energyKwh: row.energy_kwh != null ? Number(row.energy_kwh) : null,
    durationSeconds: row.duration_seconds != null ? Number(row.duration_seconds) : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function createGenerationJob(params: {
  id: string
  orgId: string
  userId?: string | null
  prompt: string
  style?: string | null
  status: GenerationStatus
  previewUrl?: string | null
  metadata?: Record<string, unknown>
}): Promise<GenerationJobRecord> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      id: params.id,
      org_id: params.orgId,
      user_id: params.userId ?? null,
      prompt: params.prompt,
      style: params.style ?? null,
      status: params.status,
      preview_url: params.previewUrl ?? null,
      metadata: params.metadata ?? null,
    })
    .select()
    .single()

  if (error || !data) {
    throw new Error(`Failed to create generation job: ${error?.message ?? "unknown"}`)
  }

  return mapRow(data)
}

export async function updateGenerationJob(params: {
  id: string
  status?: GenerationStatus
  previewUrl?: string | null
  outputUrl?: string | null
  upscaledUrl?: string | null
  error?: string | null
  metadata?: Record<string, unknown>
  co2Kg?: number | null
  energyKwh?: number | null
  durationSeconds?: number | null
}): Promise<GenerationJobRecord> {
  const updates: Record<string, unknown> = {}
  if (params.status) updates.status = params.status
  if (params.previewUrl !== undefined) updates.preview_url = params.previewUrl
  if (params.outputUrl !== undefined) updates.output_url = params.outputUrl
  if (params.upscaledUrl !== undefined) updates.upscaled_url = params.upscaledUrl
  if (params.error !== undefined) updates.error = params.error
  if (params.metadata !== undefined) updates.metadata = params.metadata ?? null
  if (params.co2Kg !== undefined) updates.co2_kg = params.co2Kg
  if (params.energyKwh !== undefined) updates.energy_kwh = params.energyKwh
  if (params.durationSeconds !== undefined) updates.duration_seconds = params.durationSeconds
  updates.updated_at = new Date().toISOString()

  const { data, error } = await supabase
    .from(TABLE)
    .update(updates)
    .eq("id", params.id)
    .select()
    .single()

  if (error || !data) {
    throw new Error(`Failed to update generation job: ${error?.message ?? "unknown"}`)
  }

  return mapRow(data)
}

export async function getGenerationJob(id: string, orgId?: string): Promise<GenerationJobRecord | null> {
  let query = supabase.from(TABLE).select("*").eq("id", id)
  if (orgId) {
    query = query.eq("org_id", orgId)
  }

  const { data, error } = await query.maybeSingle()
  if (error) {
    throw new Error(`Failed to load generation job: ${error.message}`)
  }

  return data ? mapRow(data) : null
}
