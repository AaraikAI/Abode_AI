import { randomUUID } from "crypto"

import {
  createGenerationJob,
  getGenerationJob,
  updateGenerationJob,
  type GenerationJobRecord,
  type GenerationStatus,
} from "@/lib/data/studio-jobs"
import { recordSustainabilityLog } from "@/lib/data/sustainability"

interface StableDiffusionJobResponse {
  id: string
  status: GenerationStatus
  previewUrl?: string | null
  outputUrl?: string | null
  upscaledUrl?: string | null
  etaSeconds?: number | null
  metrics?: {
    co2_kg?: number
    energy_kwh?: number
    duration_seconds?: number
  }
  error?: string | null
  metadata?: Record<string, unknown>
}

const SD_API_URL =
  process.env.STUDIO_SD_API_URL ?? (process.env.NODE_ENV === "development" ? "http://localhost:5050/sd" : undefined)
const SD_API_KEY = process.env.STUDIO_SD_API_KEY

function buildHeaders() {
  return {
    "Content-Type": "application/json",
    ...(SD_API_KEY ? { Authorization: `Bearer ${SD_API_KEY}` } : {}),
  }
}

async function callStableDiffusion(endpoint: string, init?: RequestInit) {
  if (!SD_API_URL) {
    throw new Error("Stable Diffusion API is not configured")
  }
  const url = `${SD_API_URL.replace(/\/$/, "")}${endpoint}`
  const response = await fetch(url, {
    ...init,
    headers: {
      ...buildHeaders(),
      ...(init?.headers ?? {}),
    },
  })
  if (!response.ok) {
    const body = await response.text().catch(() => "")
    throw new Error(`Stable Diffusion API error ${response.status}: ${body}`)
  }
  return (await response.json().catch(() => ({}))) as StableDiffusionJobResponse
}

export async function triggerStableDiffusionJob(params: {
  prompt: string
  style?: string
  orgId: string
  userId?: string | null
  aspectRatio?: string
  strength?: number
}): Promise<GenerationJobRecord> {
  const jobId = randomUUID()

  try {
    const payload = await callStableDiffusion("/jobs", {
      method: "POST",
      body: JSON.stringify({
        id: jobId,
        prompt: params.prompt,
        style: params.style,
        aspect_ratio: params.aspectRatio ?? "16:9",
        strength: params.strength ?? 0.75,
      }),
    })

    const job = await createGenerationJob({
      id: jobId,
      orgId: params.orgId,
      userId: params.userId ?? null,
      prompt: params.prompt,
      style: params.style,
      status: payload.status ?? "queued",
      previewUrl: payload.previewUrl ?? null,
      metadata: payload.metadata ?? undefined,
    })

    if (payload.metrics) {
      await recordSustainabilityLog({
        orgId: params.orgId,
        userId: params.userId ?? null,
        renderId: jobId,
        co2Kg: payload.metrics.co2_kg ?? 0,
        energyKwh: payload.metrics.energy_kwh,
        durationSeconds: payload.metrics.duration_seconds,
      })
    }

    return job
  } catch (error) {
    console.error("Stable Diffusion trigger failed", error)
    const job = await createGenerationJob({
      id: jobId,
      orgId: params.orgId,
      userId: params.userId ?? null,
      prompt: params.prompt,
      style: params.style,
      status: "failed",
      metadata: { error: (error as Error).message },
    })
    return job
  }
}

export async function fetchStableDiffusionJob(params: {
  jobId: string
  orgId: string
  userId?: string | null
}): Promise<GenerationJobRecord | null> {
  const existing = await getGenerationJob(params.jobId, params.orgId)
  if (!existing) {
    return null
  }

  try {
    const payload = await callStableDiffusion(`/jobs/${params.jobId}`, {
      method: "GET",
    })

    const job = await updateGenerationJob({
      id: params.jobId,
      status: payload.status ?? existing.status,
      previewUrl: payload.previewUrl ?? existing.previewUrl ?? undefined,
      outputUrl: payload.outputUrl ?? existing.outputUrl ?? undefined,
      upscaledUrl: payload.upscaledUrl ?? existing.upscaledUrl ?? undefined,
      metadata: payload.metadata ?? existing.metadata ?? undefined,
      error: payload.error ?? undefined,
      co2Kg: payload.metrics?.co2_kg ?? existing.co2Kg ?? undefined,
      energyKwh: payload.metrics?.energy_kwh ?? existing.energyKwh ?? undefined,
      durationSeconds: payload.metrics?.duration_seconds ?? existing.durationSeconds ?? undefined,
    })

    if (payload.metrics) {
      await recordSustainabilityLog({
        orgId: params.orgId,
        userId: params.userId ?? null,
        renderId: params.jobId,
        co2Kg: payload.metrics.co2_kg ?? 0,
        energyKwh: payload.metrics.energy_kwh,
        durationSeconds: payload.metrics.duration_seconds,
      })
    }

    return job
  } catch (error) {
    console.warn("Stable Diffusion status fallback", error)
    return existing
  }
}

export async function triggerUpscaleJob(params: {
  jobId: string
  orgId: string
  userId?: string | null
  scale?: number
}): Promise<GenerationJobRecord | null> {
  const existing = await getGenerationJob(params.jobId, params.orgId)
  if (!existing) return null

  try {
    const payload = await callStableDiffusion(`/jobs/${params.jobId}/upscale`, {
      method: "POST",
      body: JSON.stringify({ scale: params.scale ?? 4 }),
    })

    const job = await updateGenerationJob({
      id: params.jobId,
      status: payload.status ?? "upscaling",
      upscaledUrl: payload.upscaledUrl ?? undefined,
      metadata: payload.metadata ?? undefined,
    })

    return job
  } catch (error) {
    console.error("Upscale failed", error)
    const job = await updateGenerationJob({
      id: params.jobId,
      status: "failed",
      error: (error as Error).message,
    })
    return job
  }
}
