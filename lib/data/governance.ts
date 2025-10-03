import { randomUUID } from "crypto"

import { supabase } from "@/lib/db/supabase"

export interface GovernanceTask {
  id: string
  orgId: string
  type: string
  status: string
  scheduledFor: string
  metadata?: Record<string, unknown> | null
  createdAt: string
}

export interface PromptPolicy {
  id: string
  orgId: string
  name: string
  description?: string | null
  enforcementLevel: string
  updatedAt: string
}

const TASK_TABLE = "governance_tasks"
const POLICY_TABLE = "prompt_policies"

export async function listGovernanceTasks(orgId: string, limit = 25): Promise<GovernanceTask[]> {
  const { data, error } = await supabase
    .from(TASK_TABLE)
    .select("id, org_id, type, status, scheduled_for, metadata, created_at")
    .eq("org_id", orgId)
    .order("scheduled_for", { ascending: false })
    .limit(limit)

  if (error) {
    throw new Error(`Failed to list governance tasks: ${error.message}`)
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    orgId: row.org_id,
    type: row.type,
    status: row.status,
    scheduledFor: row.scheduled_for,
    metadata: row.metadata ?? undefined,
    createdAt: row.created_at,
  }))
}

export async function scheduleGovernanceTask(params: {
  orgId: string
  type: string
  scheduledFor: string
  metadata?: Record<string, unknown>
}): Promise<GovernanceTask> {
  const { data, error } = await supabase
    .from(TASK_TABLE)
    .insert({
      id: randomUUID(),
      org_id: params.orgId,
      type: params.type,
      status: "queued",
      scheduled_for: params.scheduledFor,
      metadata: params.metadata ?? null,
    })
    .select()
    .single()

  if (error || !data) {
    throw new Error(`Failed to schedule governance task: ${error?.message ?? "unknown"}`)
  }

  return {
    id: data.id,
    orgId: data.org_id,
    type: data.type,
    status: data.status,
    scheduledFor: data.scheduled_for,
    metadata: data.metadata ?? undefined,
    createdAt: data.created_at,
  }
}

export async function listPromptPolicies(orgId: string): Promise<PromptPolicy[]> {
  const { data, error } = await supabase
    .from(POLICY_TABLE)
    .select("id, org_id, name, description, enforcement_level, updated_at")
    .eq("org_id", orgId)

  if (error) {
    throw new Error(`Failed to list prompt policies: ${error.message}`)
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    orgId: row.org_id,
    name: row.name,
    description: row.description ?? undefined,
    enforcementLevel: row.enforcement_level,
    updatedAt: row.updated_at,
  }))
}

export async function updatePromptPolicy(params: {
  id: string
  enforcementLevel: string
  description?: string
}) {
  const { error } = await supabase
    .from(POLICY_TABLE)
    .update({
      enforcement_level: params.enforcementLevel,
      description: params.description ?? null,
    })
    .eq("id", params.id)

  if (error) {
    throw new Error(`Failed to update prompt policy: ${error.message}`)
  }
}
