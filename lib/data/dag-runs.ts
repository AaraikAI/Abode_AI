import { randomUUID } from "crypto"

import { db } from "@/lib/db/sqlite"
import { getPipelineById, type Pipeline, type PipelineTask, type TaskStatus } from "@/lib/data/pipelines"

export type DagRunStatus = "queued" | "running" | "awaiting_approval" | "success" | "failed"

export interface DagRunTask {
  id: string
  runId: string
  pipelineTaskId?: string | null
  name: string
  resourceTier: PipelineTask["resourceTier"]
  requiresApproval: boolean
  status: DagRunStatus | TaskStatus
  attempts: number
  lastUpdated: string
  agentId?: string | null
  agentName?: string | null
}

export interface DagRun {
  id: string
  pipelineId: string
  pipelineName: string
  orgId: string
  status: DagRunStatus
  nextStep?: string | null
  startedAt: string
  endedAt?: string | null
  metadata?: Record<string, unknown>
  triggeredBy?: string | null
  tasks: DagRunTask[]
}

const selectRunsStmt = db.prepare<unknown[], any>(
  `SELECT r.id,
          r.pipeline_id as pipelineId,
          p.name as pipelineName,
          r.org_id as orgId,
          r.status,
          r.next_step as nextStep,
          r.started_at as startedAt,
          r.ended_at as endedAt,
          r.metadata,
          r.triggered_by as triggeredBy
   FROM dag_runs r
   LEFT JOIN pipelines p ON p.id = r.pipeline_id
   WHERE r.org_id = ?
   ORDER BY datetime(r.started_at) DESC
   LIMIT ?`
)

const selectRunByIdStmt = db.prepare<unknown[], any>(
  `SELECT r.id,
          r.pipeline_id as pipelineId,
          p.name as pipelineName,
          r.org_id as orgId,
          r.status,
          r.next_step as nextStep,
          r.started_at as startedAt,
          r.ended_at as endedAt,
          r.metadata,
          r.triggered_by as triggeredBy
   FROM dag_runs r
   LEFT JOIN pipelines p ON p.id = r.pipeline_id
   WHERE r.id = ?`
)

const selectRunTasksStmt = db.prepare<unknown[], any>(
  `SELECT t.id,
          t.run_id as runId,
          t.pipeline_task_id as pipelineTaskId,
          t.name,
          t.resource_tier as resourceTier,
          t.requires_approval as requiresApproval,
          t.status,
          t.attempts,
          t.last_updated as lastUpdated,
          t.agent_id as agentId,
          a.name as agentName,
          pt.step_order as stepOrder
   FROM dag_run_tasks t
   LEFT JOIN pipeline_tasks pt ON pt.id = t.pipeline_task_id
   LEFT JOIN agents a ON a.id = t.agent_id
   WHERE t.run_id = ?
   ORDER BY COALESCE(pt.step_order, 9999), datetime(t.last_updated) DESC`
)

const selectActiveRunsStmt = db.prepare<unknown[], any>(
  `SELECT r.id,
          r.pipeline_id as pipelineId,
          p.name as pipelineName,
          r.org_id as orgId,
          r.status,
          r.next_step as nextStep,
          r.started_at as startedAt,
          r.ended_at as endedAt,
          r.metadata,
          r.triggered_by as triggeredBy
   FROM dag_runs r
   LEFT JOIN pipelines p ON p.id = r.pipeline_id
   WHERE r.org_id = ? AND r.status NOT IN ('success', 'failed')
   ORDER BY datetime(r.started_at) DESC`
)

function mapRun(row: any): DagRun {
  return {
    id: row.id,
    pipelineId: row.pipelineId,
    pipelineName: row.pipelineName ?? "Unknown pipeline",
    orgId: row.orgId,
    status: (row.status as DagRunStatus) ?? "queued",
    nextStep: row.nextStep ?? null,
    startedAt: row.startedAt,
    endedAt: row.endedAt ?? null,
    metadata: row.metadata ? (JSON.parse(row.metadata) as Record<string, unknown>) : undefined,
    triggeredBy: row.triggeredBy ?? null,
    tasks: selectRunTasksStmt.all(row.id).map((task: any) => ({
      id: task.id,
      runId: task.runId,
      pipelineTaskId: task.pipelineTaskId ?? undefined,
      name: task.name,
      resourceTier: task.resourceTier ?? "cpu",
      requiresApproval: !!task.requiresApproval,
      status: task.status,
      attempts: task.attempts,
      lastUpdated: task.lastUpdated,
      agentId: task.agentId ?? undefined,
      agentName: task.agentName ?? undefined,
    })),
  }
}

export function listDagRuns(orgId: string, limit = 25): DagRun[] {
  return selectRunsStmt.all(orgId, limit).map((row: any) => mapRun(row))
}

export function getDagRun(runId: string): DagRun | null {
  const row = selectRunByIdStmt.get(runId)
  if (!row) return null
  return mapRun(row)
}

export function listActiveDagRuns(orgId: string): DagRun[] {
  return selectActiveRunsStmt.all(orgId).map((row: any) => mapRun(row))
}

function insertRunTasks(runId: string, pipeline: Pipeline) {
  const insertStmt = db.prepare(
    `INSERT INTO dag_run_tasks (id, run_id, pipeline_task_id, name, resource_tier, requires_approval, status, attempts, agent_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)`
  )

  const transaction = db.transaction(() => {
    pipeline.tasks.forEach((task: PipelineTask) => {
      insertStmt.run(
        randomUUID(),
        runId,
        task.id,
        task.name,
        task.resourceTier ?? "cpu",
        task.requiresApproval ? 1 : 0,
        "queued",
        task.agentId ?? null
      )
    })
  })

  transaction()
}

export function createDagRun(params: {
  pipelineId: string
  orgId: string
  triggeredBy: string
  metadata?: Record<string, unknown>
}): DagRun {
  const pipeline = getPipelineById(params.pipelineId)
  if (!pipeline) {
    throw new Error("Pipeline not found")
  }
  if (pipeline.orgId !== params.orgId) {
    throw new Error("Pipeline does not belong to organisation")
  }

  const runId = randomUUID()
  const nextStep = pipeline.tasks[0]?.name ?? null

  const insertRun = db.prepare(
    `INSERT INTO dag_runs (id, pipeline_id, org_id, status, next_step, started_at, metadata, triggered_by)
     VALUES (?, ?, ?, ?, ?, datetime('now'), ?, ?)`
  )

  insertRun.run(
    runId,
    pipeline.id,
    params.orgId,
    "queued",
    nextStep,
    params.metadata ? JSON.stringify(params.metadata) : null,
    params.triggeredBy
  )

  insertRunTasks(runId, pipeline)

  const row = selectRunByIdStmt.get(runId)
  if (!row) {
    throw new Error("Failed to persist DAG run")
  }

  return mapRun(row)
}

export function updateDagRunStatus(runId: string, status: DagRunStatus, nextStep?: string | null) {
  const update = db.prepare(
    `UPDATE dag_runs
     SET status = ?,
         next_step = COALESCE(?, next_step),
         ended_at = CASE WHEN ? IN ('success', 'failed') THEN datetime('now') ELSE ended_at END
     WHERE id = ?`
  )
  const result = update.run(status, nextStep ?? null, status, runId)
  if (result.changes === 0) {
    throw new Error("Run not found")
  }
  const row = selectRunByIdStmt.get(runId)
  if (!row) {
    throw new Error("Run not found")
  }
  return mapRun(row)
}

export function updateDagRunTaskStatus(runId: string, taskId: string, status: DagRunStatus | TaskStatus) {
  const update = db.prepare(
    `UPDATE dag_run_tasks
     SET status = ?,
         last_updated = datetime('now')
     WHERE id = ? AND run_id = ?`
  )
  const result = update.run(status, taskId, runId)
  if (result.changes === 0) {
    throw new Error("Run task not found")
  }
  return getDagRun(runId)
}

export function approveDagRunTask(runId: string, taskId: string) {
  const getTaskStmt = db.prepare(`SELECT status FROM dag_run_tasks WHERE id = ? AND run_id = ?`)
  const taskRow = getTaskStmt.get(taskId, runId) as { status: string } | undefined
  if (!taskRow) {
    throw new Error("Run task not found")
  }

  if (taskRow.status !== "awaiting_approval") {
    throw new Error("Task is not awaiting approval")
  }

  updateDagRunTaskStatus(runId, taskId, "success")
  return getDagRun(runId)
}

export function retryDagRunTask(runId: string, taskId: string) {
  const update = db.prepare(
    `UPDATE dag_run_tasks
     SET status = 'queued',
         attempts = attempts + 1,
         last_updated = datetime('now')
     WHERE id = ? AND run_id = ?`
  )
  const result = update.run(taskId, runId)
  if (result.changes === 0) {
    throw new Error("Run task not found")
  }
  return getDagRun(runId)
}

export function applyRemoteDagRunSnapshot(params: {
  runId: string
  status: DagRunStatus
  nextStep?: string | null
  endedAt?: string | null
  tasks: Array<{ name: string; status: DagRunStatus | TaskStatus; attempts?: number; agentId?: string | null }>
}): DagRun | null {
  const transaction = db.transaction(() => {
    const ended = params.status === "success" || params.status === "failed"
    if (ended) {
      const updateStmt = db.prepare(
        `UPDATE dag_runs SET status = ?, next_step = ?, ended_at = ? WHERE id = ?`
      )
      updateStmt.run(
        params.status,
        params.nextStep ?? null,
        params.endedAt ?? new Date().toISOString(),
        params.runId
      )
    } else {
      const updateStmt = db.prepare(`UPDATE dag_runs SET status = ?, next_step = ? WHERE id = ?`)
      updateStmt.run(params.status, params.nextStep ?? null, params.runId)
    }

    const updateTaskStmt = db.prepare(
      `UPDATE dag_run_tasks
       SET status = ?,
           attempts = COALESCE(?, attempts),
           agent_id = COALESCE(?, agent_id),
           last_updated = datetime('now')
       WHERE run_id = ? AND name = ?`
    )

    params.tasks.forEach((task) => {
      updateTaskStmt.run(
        task.status,
        task.attempts ?? null,
        task.agentId ?? null,
        params.runId,
        task.name
      )
    })
  })

  transaction()

  return getDagRun(params.runId)
}
