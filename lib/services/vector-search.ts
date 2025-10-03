import { cache } from "react"

export interface StudioAssetSearchParams {
  query?: string
  limit?: number
  orgId?: string
  embedding?: number[]
}

export interface StudioAssetRecord {
  id: string
  name: string
  category: string
  description?: string | null
  tags?: string[]
  gltfUrl?: string | null
  thumbnailUrl?: string | null
  color?: string | null
  geometry?: string | null
  scale?: { x: number; y: number; z: number } | null
  environment?: string | null
  metadata?: Record<string, unknown> | null
}

const FALLBACK_ASSETS: StudioAssetRecord[] = [
  {
    id: "asset-floor",
    name: "Studio Floor",
    category: "Surfaces",
    description: "Base plane representing the floor slab.",
    geometry: "plane",
    color: "#d9d9d9",
    scale: { x: 20, y: 1, z: 20 },
    environment: "/studio/studio_hdri.hdr",
  },
  {
    id: "asset-wall",
    name: "Partition Wall",
    category: "Architecture",
    description: "Simple wall element for quick layouts.",
    geometry: "box",
    color: "#f5f5f5",
    scale: { x: 4, y: 2.8, z: 0.2 },
  },
  {
    id: "asset-window",
    name: "Window Frame",
    category: "Architecture",
    description: "Aluminium window frame placeholder with mullions.",
    gltfUrl: "/models/window-frame.gltf",
    thumbnailUrl: "/studio/window-frame.jpg",
    scale: { x: 1, y: 1, z: 1 },
  },
  {
    id: "asset-desk",
    name: "Work Desk",
    category: "Furniture",
    description: "Rectangular workstation desk.",
    gltfUrl: "/models/work-desk.gltf",
    color: "#d6a372",
    scale: { x: 1, y: 1, z: 1 },
  },
  {
    id: "asset-chair",
    name: "Ergo Chair",
    category: "Furniture",
    description: "Task chair with fabric seat and polished base.",
    gltfUrl: "/models/chair.gltf",
    thumbnailUrl: "/studio/chair.jpg",
    scale: { x: 1, y: 1, z: 1 },
  },
  {
    id: "asset-pendant",
    name: "Pendant Light",
    category: "Lighting",
    description: "Industrial pendant for high ceilings.",
    gltfUrl: "/models/pendant.gltf",
    metadata: { emissive: "#fef3c7" },
  },
]

const VECTOR_API_URL =
  process.env.STUDIO_VECTOR_API_URL ??
  (process.env.NODE_ENV === "development" ? "http://localhost:5050/vector-search" : undefined)
const VECTOR_API_KEY = process.env.STUDIO_VECTOR_API_KEY

async function callVectorApi(params: StudioAssetSearchParams): Promise<StudioAssetRecord[] | null> {
  if (!VECTOR_API_URL) return null
  try {
    const response = await fetch(VECTOR_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(VECTOR_API_KEY ? { Authorization: `Bearer ${VECTOR_API_KEY}` } : {}),
      },
      body: JSON.stringify({
        query: params.query ?? "",
        limit: params.limit ?? 24,
        orgId: params.orgId,
        embedding: params.embedding,
      }),
    })

    if (!response.ok) {
      const text = await response.text().catch(() => "")
      throw new Error(`Vector API responded with ${response.status} ${text}`)
    }

    const payload = (await response.json()) as { assets?: StudioAssetRecord[] }
    if (!payload?.assets?.length) return []
    return payload.assets
  } catch (error) {
    console.warn("Vector search fallback", error)
    return null
  }
}

export const searchStudioAssets = cache(async function searchStudioAssets(
  params: StudioAssetSearchParams
): Promise<{ assets: StudioAssetRecord[]; categories: string[] }> {
  const results = await callVectorApi(params)
  const assets = results?.length ? results : FALLBACK_ASSETS
  const categories = Array.from(new Set(assets.map((asset) => asset.category).filter(Boolean)))
  return { assets, categories }
})

export function getFallbackAssets() {
  return FALLBACK_ASSETS
}
