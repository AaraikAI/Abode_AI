import { randomUUID } from "crypto"

import { supabase } from "@/lib/db/supabase"
import type { StudioObject } from "@/types/studio"

export interface BomItem {
  id: string
  bomId: string
  name: string
  sku: string
  quantity: number
  unit: string
  material?: string | null
  dimensions?: Record<string, unknown> | null
  cost?: number | null
}

export interface ManufacturingBom {
  id: string
  orgId: string
  status: string
  totalCost?: number | null
  sceneSnapshotId?: string | null
  createdAt: string
  metadata?: Record<string, unknown> | null
  items: BomItem[]
}

export interface ManufacturingSyncEvent {
  id: string
  bomId: string
  status: string
  message: string
  createdAt: string
  payload?: Record<string, unknown> | null
}

const BOM_TABLE = "manufacturing_boms"
const BOM_ITEMS_TABLE = "manufacturing_bom_items"
const SYNC_TABLE = "manufacturing_sync_events"

export async function listBoms(orgId: string, limit = 20): Promise<ManufacturingBom[]> {
  const { data, error } = await supabase
    .from(BOM_TABLE)
    .select("id, org_id, status, total_cost, scene_snapshot_id, metadata, created_at")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    throw new Error(`Failed to list BOMs: ${error.message}`)
  }

  const bomIds = (data ?? []).map((row) => row.id)
  const items = await fetchBomItems(bomIds)

  return (data ?? []).map((bom) => ({
    id: bom.id,
    orgId: bom.org_id,
    status: bom.status,
    totalCost: bom.total_cost,
    sceneSnapshotId: bom.scene_snapshot_id ?? null,
    createdAt: bom.created_at,
    metadata: bom.metadata ?? undefined,
    items: items[bom.id] ?? [],
  }))
}

export async function getBom(orgId: string, bomId: string): Promise<ManufacturingBom | null> {
  const { data, error } = await supabase
    .from(BOM_TABLE)
    .select("id, org_id, status, total_cost, scene_snapshot_id, metadata, created_at")
    .eq("org_id", orgId)
    .eq("id", bomId)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to load BOM: ${error.message}`)
  }

  if (!data) return null

  const items = await fetchBomItems([data.id])

  return {
    id: data.id,
    orgId: data.org_id,
    status: data.status,
    totalCost: data.total_cost,
    sceneSnapshotId: data.scene_snapshot_id ?? null,
    createdAt: data.created_at,
    metadata: data.metadata ?? undefined,
    items: items[data.id] ?? [],
  }
}

async function fetchBomItems(bomIds: string[]): Promise<Record<string, BomItem[]>> {
  if (!bomIds.length) return {}

  const { data, error } = await supabase
    .from(BOM_ITEMS_TABLE)
    .select("id, bom_id, name, sku, quantity, unit, material, dimensions, cost")
    .in("bom_id", bomIds)

  if (error) {
    throw new Error(`Failed to fetch BOM items: ${error.message}`)
  }

  return (data ?? []).reduce<Record<string, BomItem[]>>((acc, item) => {
    const list = acc[item.bom_id] ?? []
    list.push({
      id: item.id,
      bomId: item.bom_id,
      name: item.name,
      sku: item.sku,
      quantity: Number(item.quantity ?? 0),
      unit: item.unit,
      material: item.material,
      dimensions: item.dimensions ?? undefined,
      cost: item.cost != null ? Number(item.cost) : null,
    })
    acc[item.bom_id] = list
    return acc
  }, {})
}

export async function recordManufacturingSync(params: {
  bomId: string
  status: string
  message: string
  payload?: Record<string, unknown>
}): Promise<ManufacturingSyncEvent> {
  const { data, error } = await supabase
    .from(SYNC_TABLE)
    .insert({
      bom_id: params.bomId,
      status: params.status,
      message: params.message,
      payload: params.payload ?? null,
    })
    .select()
    .single()

  if (error || !data) {
    throw new Error(`Failed to record sync event: ${error?.message ?? "unknown error"}`)
  }

  return {
    id: data.id,
    bomId: data.bom_id,
    status: data.status,
    message: data.message,
    createdAt: data.created_at,
    payload: data.payload ?? undefined,
  }
}

export async function listManufacturingSyncs(bomId: string): Promise<ManufacturingSyncEvent[]> {
  const { data, error } = await supabase
    .from(SYNC_TABLE)
    .select("id, bom_id, status, message, payload, created_at")
    .eq("bom_id", bomId)
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(`Failed to load sync events: ${error.message}`)
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    bomId: row.bom_id,
    status: row.status,
    message: row.message,
    createdAt: row.created_at,
    payload: row.payload ?? undefined,
  }))
}

export async function generateBomFromScene(params: {
  orgId: string
  scene: StudioObject[]
  sceneSnapshotId?: string
}): Promise<ManufacturingBom> {
  const items = deriveBomItems(params.scene)
  const totalCost = items.reduce((sum, item) => sum + (item.cost ?? 0) * item.quantity, 0)

  const { data, error } = await supabase
    .from(BOM_TABLE)
    .insert({
      org_id: params.orgId,
      status: "generated",
      total_cost: totalCost,
      metadata: { source: "studio", itemCount: items.length },
      scene_snapshot_id: params.sceneSnapshotId ?? null,
    })
    .select()
    .single()

  if (error || !data) {
    throw new Error(`Failed to create BOM: ${error?.message ?? "unknown error"}`)
  }

  const bomId = data.id as string
  const itemRecords = items.map((item) => ({
    id: randomUUID(),
    bom_id: bomId,
    name: item.name,
    sku: item.sku,
    quantity: item.quantity,
    unit: item.unit,
    material: item.material ?? null,
    dimensions: item.dimensions ?? null,
    cost: item.cost ?? null,
  }))

  const { error: itemsError } = await supabase.from(BOM_ITEMS_TABLE).insert(itemRecords)
  if (itemsError) {
    throw new Error(`Failed to persist BOM items: ${itemsError.message}`)
  }

  return {
    id: bomId,
    orgId: params.orgId,
    status: data.status,
    totalCost: data.total_cost,
    createdAt: data.created_at,
    sceneSnapshotId: data.scene_snapshot_id ?? null,
    metadata: data.metadata ?? undefined,
    items: itemRecords.map((item) => ({
      id: item.id,
      bomId,
      name: item.name,
      sku: item.sku,
      quantity: item.quantity,
      unit: item.unit,
      material: item.material ?? undefined,
      dimensions: item.dimensions ?? undefined,
      cost: item.cost ?? undefined,
    })),
  }
}

function deriveBomItems(objects: StudioObject[]): Array<{
  name: string
  sku: string
  quantity: number
  unit: string
  material?: string
  dimensions?: Record<string, unknown>
  cost?: number
}> {
  const catalogue: Record<string, { name: string; sku: string; unit: string; material?: string; cost?: number }> = {
    "asset-desk": { name: "Desk frame", sku: "DSK-482", unit: "unit", material: "oak", cost: 320 },
    "asset-chair": { name: "Task chair", sku: "CHR-214", unit: "unit", material: "fabric", cost: 180 },
    "asset-wall": { name: "Gypsum partition", sku: "WALL-PLT", unit: "linear_m", material: "gypsum", cost: 45 },
    "asset-window": { name: "Window frame", sku: "WND-TRM", unit: "unit", material: "aluminium", cost: 250 },
    "asset-tree": { name: "Indoor planter", sku: "PLN-013", unit: "unit", material: "composite", cost: 95 },
  }

  const grouped = objects.reduce<Record<string, { quantity: number; object: StudioObject }>>((acc, object) => {
    const entry = catalogue[object.assetId]
    if (!entry) return acc
    const key = object.assetId
    const current = acc[key]
    if (current) {
      current.quantity += 1
    } else {
      acc[key] = { quantity: 1, object }
    }
    return acc
  }, {})

  return Object.entries(grouped).map(([assetId, data]) => {
    const entry = catalogue[assetId]
    return {
      name: entry.name,
      sku: entry.sku,
      quantity: data.quantity,
      unit: entry.unit,
      material: entry.material,
      cost: entry.cost,
      dimensions: {
        scale: data.object.scale,
      },
    }
  })
}
