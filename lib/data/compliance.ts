import { randomUUID } from "crypto"

import { supabase } from "@/lib/db/supabase"

export interface ComplianceEvent {
  id: string
  orgId: string
  actor: string
  action: string
  resource?: string | null
  metadata?: Record<string, unknown> | null
  createdAt: string
}

export interface ConsentRecord {
  id: string
  userId: string
  orgId: string
  consentType: string
  granted: boolean
  updatedAt: string
}

export interface ForgetRequest {
  id: string
  userId: string
  orgId: string
  status: string
  reason?: string | null
  createdAt: string
}

const AUDIT_TABLE = "compliance_audit_events"
const CONSENT_TABLE = "consent_records"
const FORGET_TABLE = "forget_requests"

export async function recordComplianceEvent(event: {
  orgId: string
  actor: string
  action: string
  resource?: string | null
  metadata?: Record<string, unknown> | null
}): Promise<ComplianceEvent> {
  const { data, error } = await supabase
    .from(AUDIT_TABLE)
    .insert({
      id: randomUUID(),
      org_id: event.orgId,
      actor: event.actor,
      action: event.action,
      resource: event.resource ?? null,
      metadata: event.metadata ?? null,
    })
    .select()
    .single()

  if (error || !data) {
    throw new Error(`Failed to write audit event: ${error?.message ?? "unknown"}`)
  }

  return mapEvent(data)
}

export async function listComplianceEvents(orgId: string, limit = 50): Promise<ComplianceEvent[]> {
  const { data, error } = await supabase
    .from(AUDIT_TABLE)
    .select("id, org_id, actor, action, resource, metadata, created_at")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    throw new Error(`Failed to list compliance events: ${error.message}`)
  }

  return (data ?? []).map(mapEvent)
}

function mapEvent(row: any): ComplianceEvent {
  return {
    id: row.id,
    orgId: row.org_id,
    actor: row.actor,
    action: row.action,
    resource: row.resource ?? null,
    metadata: row.metadata ?? undefined,
    createdAt: row.created_at,
  }
}

export async function listConsentRecords(orgId: string): Promise<ConsentRecord[]> {
  const { data, error } = await supabase
    .from(CONSENT_TABLE)
    .select("id, user_id, org_id, consent_type, granted, updated_at")
    .eq("org_id", orgId)

  if (error) {
    throw new Error(`Failed to load consent records: ${error.message}`)
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    orgId: row.org_id,
    consentType: row.consent_type,
    granted: !!row.granted,
    updatedAt: row.updated_at,
  }))
}

export async function updateConsentRecord(params: {
  id: string
  granted: boolean
}): Promise<void> {
  const { error } = await supabase
    .from(CONSENT_TABLE)
    .update({ granted: params.granted })
    .eq("id", params.id)

  if (error) {
    throw new Error(`Failed to update consent: ${error.message}`)
  }
}

export async function createForgetRequest(params: {
  orgId: string
  userId: string
  reason?: string
}): Promise<ForgetRequest> {
  const { data, error } = await supabase
    .from(FORGET_TABLE)
    .insert({
      id: randomUUID(),
      org_id: params.orgId,
      user_id: params.userId,
      reason: params.reason ?? null,
      status: "received",
    })
    .select()
    .single()

  if (error || !data) {
    throw new Error(`Failed to create forget request: ${error?.message ?? "unknown"}`)
  }

  return mapForgetRequest(data)
}

export async function listForgetRequests(orgId: string, limit = 20): Promise<ForgetRequest[]> {
  const { data, error } = await supabase
    .from(FORGET_TABLE)
    .select("id, org_id, user_id, status, reason, created_at")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    throw new Error(`Failed to list forget requests: ${error.message}`)
  }

  return (data ?? []).map(mapForgetRequest)
}

export async function updateForgetRequestStatus(requestId: string, status: string) {
  const { error } = await supabase
    .from(FORGET_TABLE)
    .update({ status })
    .eq("id", requestId)

  if (error) {
    throw new Error(`Failed to update forget request: ${error.message}`)
  }
}

function mapForgetRequest(row: any): ForgetRequest {
  return {
    id: row.id,
    orgId: row.org_id,
    userId: row.user_id,
    status: row.status,
    reason: row.reason ?? undefined,
    createdAt: row.created_at,
  }
}
