import { env } from "process"

import {
  updateBomStatus,
  recordManufacturingSync,
  type ManufacturingBom,
  type ManufacturingSyncEvent,
} from "@/lib/data/manufacturing"

export type ErpProvider = "jega" | "zbom"

interface SyncResult {
  timeline: ManufacturingSyncEvent[]
  response?: Record<string, unknown>
}

const JEGA_API_URL = env.JEGA_API_URL
const JEGA_API_KEY = env.JEGA_API_KEY
const ZBOM_API_URL = env.ZBOM_API_URL
const ZBOM_API_KEY = env.ZBOM_API_KEY

function resolveProviderConfig(provider: ErpProvider) {
  if (provider === "jega") {
    return { url: JEGA_API_URL, token: JEGA_API_KEY, label: "JEGA" }
  }
  return { url: ZBOM_API_URL, token: ZBOM_API_KEY, label: "ZBOM" }
}

function buildErpPayload(bom: ManufacturingBom) {
  return {
    bomId: bom.id,
    status: bom.status,
    totalCost: bom.totalCost,
    createdAt: bom.createdAt,
    metadata: bom.metadata ?? {},
    items: bom.items.map((item) => ({
      id: item.id,
      name: item.name,
      sku: item.sku,
      quantity: item.quantity,
      unit: item.unit,
      material: item.material,
      cost: item.cost,
      dimensions: item.dimensions,
    })),
  }
}

async function postToErp(endpoint: string, token: string | undefined, payload: unknown) {
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    const errorBody = await response.text().catch(() => "")
    throw new Error(`ERP responded with ${response.status}: ${errorBody}`)
  }
  return (await response.json().catch(() => ({}))) as Record<string, unknown>
}

export async function syncBomWithErp(params: {
  bom: ManufacturingBom
  provider: ErpProvider
  actor?: string
}): Promise<SyncResult> {
  const config = resolveProviderConfig(params.provider)
  const timeline: ManufacturingSyncEvent[] = []

  timeline.push(
    await recordManufacturingSync({
      bomId: params.bom.id,
      status: "queued",
      message: `Sync queued for ${config.label}`,
      payload: { provider: params.provider, actor: params.actor ?? "system" },
    })
  )

  if (!config.url) {
    timeline.push(
      await recordManufacturingSync({
        bomId: params.bom.id,
        status: "skipped",
        message: `${config.label} endpoint not configured; skipping integration`,
      })
    )
    await updateBomStatus({ bomId: params.bom.id, status: "pending" })
    return { timeline }
  }

  try {
    timeline.push(
      await recordManufacturingSync({
        bomId: params.bom.id,
        status: "in_progress",
        message: `Transmitting ${params.provider.toUpperCase()} payload`,
      })
    )

    const response = await postToErp(config.url, config.token, buildErpPayload(params.bom))

    timeline.push(
      await recordManufacturingSync({
        bomId: params.bom.id,
        status: "succeeded",
        message: `${config.label} acknowledged payload`,
        payload: response,
      })
    )

    await updateBomStatus({
      bomId: params.bom.id,
      status: "synced",
      metadata: {
        ...(params.bom.metadata ?? {}),
        lastSyncedProvider: params.provider,
        lastSyncedAt: new Date().toISOString(),
      },
    })

    return { timeline, response }
  } catch (error) {
    timeline.push(
      await recordManufacturingSync({
        bomId: params.bom.id,
        status: "failed",
        message: (error as Error).message,
      })
    )

    await updateBomStatus({ bomId: params.bom.id, status: "sync_failed" })
    return { timeline }
  }
}
