import { randomUUID } from "crypto"

import { supabase } from "@/lib/db/supabase"

export type VersionEntityType = "scene" | "pipeline"

export interface VersionBranch {
  id: string
  orgId: string
  entityType: VersionEntityType
  entityId: string
  name: string
  description?: string | null
  parentBranchId?: string | null
  createdBy?: string | null
  createdAt: string
  updatedAt: string
}

export interface VersionCommit {
  id: string
  branchId: string
  parentCommitId?: string | null
  message: string
  snapshot: Record<string, unknown>
  createdBy?: string | null
  createdAt: string
}

export interface VersionPullRequest {
  id: string
  sourceBranchId: string
  targetBranchId: string
  status: "open" | "merged" | "closed"
  title: string
  description?: string | null
  createdBy?: string | null
  createdAt: string
  updatedAt: string
  diff?: Record<string, unknown>
}

const branchTable = "version_branches"
const commitTable = "version_commits"
const prTable = "version_pull_requests"
const diffTable = "version_diffs"

export async function ensureDefaultBranch(params: {
  orgId: string
  entityType: VersionEntityType
  entityId: string
  createdBy?: string | null
}): Promise<VersionBranch> {
  const { data, error } = await supabase
    .from(branchTable)
    .select("id, org_id, entity_type, entity_id, name, description, parent_branch_id, created_by, created_at, updated_at")
    .eq("org_id", params.orgId)
    .eq("entity_type", params.entityType)
    .eq("entity_id", params.entityId)
    .eq("name", "main")
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to load branch: ${error.message}`)
  }

  if (data) {
    return mapBranch(data)
  }

  const insert = await supabase
    .from(branchTable)
    .insert({
      id: randomUUID(),
      org_id: params.orgId,
      entity_type: params.entityType,
      entity_id: params.entityId,
      name: "main",
      description: "Default branch",
      created_by: params.createdBy ?? null,
    })
    .select()
    .single()

  if (insert.error || !insert.data) {
    throw new Error(`Failed to create default branch: ${insert.error?.message ?? "unknown"}`)
  }

  return mapBranch(insert.data)
}

export async function listBranches(orgId: string, entityType: VersionEntityType, entityId: string): Promise<VersionBranch[]> {
  const { data, error } = await supabase
    .from(branchTable)
    .select("id, org_id, entity_type, entity_id, name, description, parent_branch_id, created_by, created_at, updated_at")
    .eq("org_id", orgId)
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("updated_at", { ascending: false })

  if (error) {
    throw new Error(`Failed to list branches: ${error.message}`)
  }

  return (data ?? []).map(mapBranch)
}

export async function createBranch(params: {
  orgId: string
  entityType: VersionEntityType
  entityId: string
  name: string
  description?: string
  parentBranchId?: string | null
  createdBy?: string | null
}): Promise<VersionBranch> {
  const { data, error } = await supabase
    .from(branchTable)
    .insert({
      id: randomUUID(),
      org_id: params.orgId,
      entity_type: params.entityType,
      entity_id: params.entityId,
      name: params.name,
      description: params.description ?? null,
      parent_branch_id: params.parentBranchId ?? null,
      created_by: params.createdBy ?? null,
    })
    .select()
    .single()

  if (error || !data) {
    throw new Error(`Failed to create branch: ${error?.message ?? "unknown"}`)
  }

  return mapBranch(data)
}

export async function createCommit(params: {
  branchId: string
  orgId: string
  snapshot: Record<string, unknown>
  message: string
  createdBy?: string | null
}): Promise<VersionCommit> {
  const { data, error } = await supabase
    .from(commitTable)
    .insert({
      id: randomUUID(),
      branch_id: params.branchId,
      org_id: params.orgId,
      entity_snapshot: params.snapshot,
      message: params.message,
      created_by: params.createdBy ?? null,
    })
    .select(
      "id, branch_id, parent_commit_id, entity_snapshot, message, created_by, created_at"
    )
    .single()

  if (error || !data) {
    throw new Error(`Failed to create commit: ${error?.message ?? "unknown"}`)
  }

  return mapCommit(data)
}

export async function listCommits(branchId: string, limit = 20): Promise<VersionCommit[]> {
  const { data, error } = await supabase
    .from(commitTable)
    .select("id, branch_id, parent_commit_id, entity_snapshot, message, created_by, created_at")
    .eq("branch_id", branchId)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    throw new Error(`Failed to list commits: ${error.message}`)
  }

  return (data ?? []).map(mapCommit)
}

export async function openPullRequest(params: {
  orgId: string
  entityType: VersionEntityType
  entityId: string
  sourceBranchId: string
  targetBranchId: string
  title: string
  description?: string
  createdBy?: string | null
  diff?: Record<string, unknown>
}): Promise<VersionPullRequest> {
  const prInsert = await supabase
    .from(prTable)
    .insert({
      id: randomUUID(),
      org_id: params.orgId,
      entity_type: params.entityType,
      entity_id: params.entityId,
      source_branch_id: params.sourceBranchId,
      target_branch_id: params.targetBranchId,
      title: params.title,
      description: params.description ?? null,
      created_by: params.createdBy ?? null,
    })
    .select("id, source_branch_id, target_branch_id, status, title, description, created_by, created_at, updated_at")
    .single()

  if (prInsert.error || !prInsert.data) {
    throw new Error(`Failed to open pull request: ${prInsert.error?.message ?? "unknown"}`)
  }

  const pr = mapPullRequest(prInsert.data)

  if (params.diff) {
    await supabase.from(diffTable).insert({
      id: randomUUID(),
      pull_request_id: pr.id,
      diff: params.diff,
    })
  }

  return pr
}

export async function listPullRequests(orgId: string, entityType: VersionEntityType, entityId: string): Promise<VersionPullRequest[]> {
  const { data, error } = await supabase
    .from(prTable)
    .select("id, source_branch_id, target_branch_id, status, title, description, created_by, created_at, updated_at")
    .eq("org_id", orgId)
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(`Failed to list pull requests: ${error.message}`)
  }

  const prs = data?.map(mapPullRequest) ?? []
  if (!prs.length) return prs

  const diffIds = prs.map((pr) => pr.id)
  const diffQuery = await supabase
    .from(diffTable)
    .select("pull_request_id, diff")
    .in("pull_request_id", diffIds)

  if (!diffQuery.error) {
    const diffMap = new Map<string, Record<string, unknown>>()
    diffQuery.data?.forEach((row) => {
      diffMap.set(row.pull_request_id, row.diff ?? {})
    })
    return prs.map((pr) => ({ ...pr, diff: diffMap.get(pr.id) }))
  }

  return prs
}

export async function updatePullRequestStatus(prId: string, status: VersionPullRequest["status"]): Promise<void> {
  const { error } = await supabase
    .from(prTable)
    .update({ status })
    .eq("id", prId)

  if (error) {
    throw new Error(`Failed to update pull request: ${error.message}`)
  }
}

function mapBranch(row: any): VersionBranch {
  return {
    id: row.id,
    orgId: row.org_id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    name: row.name,
    description: row.description ?? undefined,
    parentBranchId: row.parent_branch_id ?? undefined,
    createdBy: row.created_by ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapCommit(row: any): VersionCommit {
  return {
    id: row.id,
    branchId: row.branch_id,
    parentCommitId: row.parent_commit_id ?? undefined,
    message: row.message,
    snapshot: (row.entity_snapshot ?? {}) as Record<string, unknown>,
    createdBy: row.created_by ?? undefined,
    createdAt: row.created_at,
  }
}

function mapPullRequest(row: any): VersionPullRequest {
  return {
    id: row.id,
    sourceBranchId: row.source_branch_id,
    targetBranchId: row.target_branch_id,
    status: row.status,
    title: row.title,
    description: row.description ?? undefined,
    createdBy: row.created_by ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
