import { supabase } from "@/lib/db/supabase"

export type CollaborationWorkspace = "design-studio" | "orchestration" | string

export interface AnnotationRecord {
  id: string
  orgId: string
  workspace: CollaborationWorkspace
  targetId?: string | null
  authorId?: string | null
  authorName?: string | null
  body: string
  position?: Record<string, unknown>
  metadata?: Record<string, unknown>
  createdAt: string
}

export interface ApprovalItemRecord {
  id: string
  orgId: string
  queueKey: string
  itemId: string
  status: "queued" | "in_review" | "approved" | "rejected"
  payload?: Record<string, unknown>
  requestedBy?: string | null
  resolvedBy?: string | null
  resolvedAt?: string | null
  createdAt: string
}

const annotationTable = "collaboration_annotations"
const approvalTable = "collaboration_approval_items"

export async function listAnnotations(params: {
  orgId: string
  workspace: CollaborationWorkspace
  targetId?: string
  limit?: number
}): Promise<AnnotationRecord[]> {
  const { data, error } = await supabase
    .from(annotationTable)
    .select("id, org_id, workspace, target_id, author_id, author_name, body, position, metadata, created_at")
    .eq("org_id", params.orgId)
    .eq("workspace", params.workspace)
    .order("created_at", { ascending: false })
    .limit(params.limit ?? 100)

  if (error) {
    throw new Error(`Failed to load annotations: ${error.message}`)
  }

  const filtered = params.targetId ? data?.filter((row) => row.target_id === params.targetId) ?? [] : data ?? []
  return filtered.map((row) => ({
    id: row.id,
    orgId: row.org_id,
    workspace: row.workspace,
    targetId: row.target_id ?? undefined,
    authorId: row.author_id ?? undefined,
    authorName: row.author_name ?? undefined,
    body: row.body,
    position: (row.position ?? undefined) as Record<string, unknown> | undefined,
    metadata: (row.metadata ?? undefined) as Record<string, unknown> | undefined,
    createdAt: row.created_at,
  }))
}

export async function addAnnotation(params: {
  orgId: string
  workspace: CollaborationWorkspace
  targetId?: string
  authorId?: string | null
  authorName?: string | null
  body: string
  position?: Record<string, unknown>
  metadata?: Record<string, unknown>
}): Promise<AnnotationRecord> {
  const { data, error } = await supabase
    .from(annotationTable)
    .insert({
      org_id: params.orgId,
      workspace: params.workspace,
      target_id: params.targetId ?? null,
      author_id: params.authorId ?? null,
      author_name: params.authorName ?? null,
      body: params.body,
      position: params.position ?? null,
      metadata: params.metadata ?? null,
    })
    .select()
    .single()

  if (error || !data) {
    throw new Error(`Failed to insert annotation: ${error?.message ?? "unknown error"}`)
  }

  return {
    id: data.id,
    orgId: data.org_id,
    workspace: data.workspace,
    targetId: data.target_id ?? undefined,
    authorId: data.author_id ?? undefined,
    authorName: data.author_name ?? undefined,
    body: data.body,
    position: (data.position ?? undefined) as Record<string, unknown> | undefined,
    metadata: (data.metadata ?? undefined) as Record<string, unknown> | undefined,
    createdAt: data.created_at,
  }
}

export async function listApprovalQueue(params: {
  orgId: string
  queueKey: string
  limit?: number
}): Promise<ApprovalItemRecord[]> {
  const { data, error } = await supabase
    .from(approvalTable)
    .select("id, org_id, queue_key, item_id, status, payload, requested_by, resolved_by, resolved_at, created_at")
    .eq("org_id", params.orgId)
    .eq("queue_key", params.queueKey)
    .order("created_at", { ascending: true })
    .limit(params.limit ?? 200)

  if (error) {
    throw new Error(`Failed to load approval queue: ${error.message}`)
  }

  return (data ?? []).map(mapApprovalRow)
}

export async function upsertApprovalItem(params: {
  orgId: string
  queueKey: string
  itemId: string
  status: ApprovalItemRecord["status"]
  payload?: Record<string, unknown>
  requestedBy?: string | null
  resolvedBy?: string | null
  resolvedAt?: Date | string | null
}): Promise<ApprovalItemRecord> {
  const { data, error } = await supabase
    .from(approvalTable)
    .upsert(
      {
        org_id: params.orgId,
        queue_key: params.queueKey,
        item_id: params.itemId,
        status: params.status,
        payload: params.payload ?? null,
        requested_by: params.requestedBy ?? null,
        resolved_by: params.resolvedBy ?? null,
        resolved_at: params.resolvedAt ? new Date(params.resolvedAt).toISOString() : null,
      },
      { onConflict: "org_id,queue_key,item_id" }
    )
    .select()
    .single()

  if (error || !data) {
    throw new Error(`Failed to upsert approval item: ${error?.message ?? "unknown"}`)
  }

  return mapApprovalRow(data)
}

function mapApprovalRow(row: any): ApprovalItemRecord {
  return {
    id: row.id,
    orgId: row.org_id,
    queueKey: row.queue_key,
    itemId: row.item_id,
    status: row.status,
    payload: (row.payload ?? undefined) as Record<string, unknown> | undefined,
    requestedBy: row.requested_by ?? undefined,
    resolvedBy: row.resolved_by ?? undefined,
    resolvedAt: row.resolved_at ?? undefined,
    createdAt: row.created_at,
  }
}
