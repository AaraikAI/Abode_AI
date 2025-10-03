export interface StudioObject {
  id: string
  assetId: string
  name: string
  position: [number, number, number]
  rotation: [number, number, number]
  scale: [number, number, number]
  color?: string
  gltfUrl?: string
  environment?: string | null
  metadata?: Record<string, unknown>
  material?: {
    color?: string
    metalness?: number
    roughness?: number
    emissive?: string
  }
}

export interface StudioAssetDefinition {
  id: string
  name: string
  category: string
  description?: string | null
  tags?: string[]
  gltfUrl?: string | null
  thumbnailUrl?: string | null
  geometry?: string | null
  color?: string | null
  scale?: { x: number; y: number; z: number } | null
  environment?: string | null
  metadata?: Record<string, unknown> | null
}

export interface StableDiffusionJobPayload {
  id: string
  prompt: string
  style?: string | null
  status: string
  previewUrl?: string | null
  outputUrl?: string | null
  upscaledUrl?: string | null
  etaSeconds?: number | null
  co2Kg?: number | null
  energyKwh?: number | null
  durationSeconds?: number | null
  createdAt?: string
}
