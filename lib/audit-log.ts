import { randomUUID } from "crypto"

import { db } from "@/lib/db/sqlite"

export interface AuditEvent {
  id: string
  timestamp: string
  actor: string
  orgId: string
  action: string
  target?: string
  metadata?: Record<string, unknown>
}

const insertStmt = db.prepare(
  "INSERT INTO audit_events (id, timestamp, actor, org_id, action, target, metadata) VALUES (?, datetime('now'), ?, ?, ?, ?, ?)"
)

const listStmt = db.prepare(
  "SELECT id, timestamp, actor, org_id as orgId, action, target, metadata FROM audit_events WHERE org_id = ? ORDER BY datetime(timestamp) DESC LIMIT ?"
)

export function recordAudit(event: Omit<AuditEvent, "timestamp"> & { timestamp?: string }) {
  insertStmt.run(
    event.id ?? randomUUID(),
    event.actor,
    event.orgId,
    event.action,
    event.target ?? null,
    event.metadata ? JSON.stringify(event.metadata) : null
  )
}

export function listAuditEvents(orgId: string, limit = 50): AuditEvent[] {
  return listStmt.all(orgId, limit).map((raw: any) => ({
    id: raw.id,
    timestamp: raw.timestamp,
    actor: raw.actor,
    orgId: raw.orgId,
    action: raw.action,
    target: raw.target ?? undefined,
    metadata: raw.metadata ? JSON.parse(raw.metadata) : undefined,
  }))
}
