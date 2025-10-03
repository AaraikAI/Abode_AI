import { supabase } from "@/lib/db/supabase"

export interface SceneSnapshot {
  id: string
  orgId: string
  userId: string | null
  scene: unknown
  createdAt: string
}

const SNAPSHOT_TABLE = "studio_scene_snapshots"

export async function saveSceneSnapshot(params: {
  orgId: string
  userId?: string | null
  scene: unknown
  label?: string | null
}): Promise<SceneSnapshot> {
  const { data, error } = await supabase
    .from(SNAPSHOT_TABLE)
    .insert({
      org_id: params.orgId,
      user_id: params.userId ?? null,
      scene_json: params.scene,
      label: params.label ?? null,
    })
    .select()
    .single()

  if (error || !data) {
    throw new Error(`Failed to save scene snapshot: ${error?.message ?? "unknown error"}`)
  }

  return mapSnapshot(data)
}

export async function getLatestSceneSnapshot(orgId: string): Promise<SceneSnapshot | null> {
  const { data, error } = await supabase
    .from(SNAPSHOT_TABLE)
    .select("id, org_id, user_id, scene_json, created_at")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to load scene snapshot: ${error.message}`)
  }

  return data ? mapSnapshot(data) : null
}

export async function listSceneSnapshots(orgId: string, limit = 20): Promise<SceneSnapshot[]> {
  const { data, error } = await supabase
    .from(SNAPSHOT_TABLE)
    .select("id, org_id, user_id, scene_json, created_at")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    throw new Error(`Failed to list scene snapshots: ${error.message}`)
  }

  return (data ?? []).map(mapSnapshot)
}

function mapSnapshot(row: any): SceneSnapshot {
  return {
    id: row.id,
    orgId: row.org_id,
    userId: row.user_id ?? null,
    scene: row.scene_json ?? {},
    createdAt: row.created_at,
  }
}
