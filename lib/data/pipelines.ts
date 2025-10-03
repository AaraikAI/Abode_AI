import { randomUUID } from "crypto"

import { db } from "@/lib/db/sqlite"

export type TaskStatus = "pending" | "queued" | "running" | "awaiting_approval" | "approved" | "success" | "failed"
export type PipelineStatus = TaskStatus

export type ResourceTier = "cpu" | "gpu"

export interface PipelineTask {
  id: string
  pipelineId: string
  name: string
  owner: string
  status: TaskStatus
  startedAt?: string
  completedAt?: string
  stepOrder: number
  resourceTier: ResourceTier
  requiresApproval: boolean
  agentId?: string | null
  agentName?: string | null
}

export interface Pipeline {
  id: string
  orgId: string
  name: string
  description?: string | null
  owner: string
  status: PipelineStatus
  createdAt: string
  updatedAt: string
  tasks: PipelineTask[]
}

export interface PipelineTaskInput {
  name: string
  resourceTier?: ResourceTier
  requiresApproval?: boolean
  agentId?: string | null
}

const selectPipelineStmt = db.prepare<unknown[], Pipeline>(
  "SELECT id, org_id as orgId, name, description, owner, status, created_at as createdAt, updated_at as updatedAt FROM pipelines WHERE id = ?"
)

const selectPipelinesStmt = db.prepare<unknown[], Pipeline>(
  "SELECT id, org_id as orgId, name, description, owner, status, created_at as createdAt, updated_at as updatedAt FROM pipelines WHERE org_id = ? ORDER BY datetime(updated_at) DESC"
)

const selectTasksStmt = db.prepare<unknown[], any>(
  `SELECT t.id,
          t.pipeline_id as pipelineId,
          t.name,
          t.owner,
          t.status,
          t.started_at as startedAt,
          t.completed_at as completedAt,
          t.step_order as stepOrder,
          t.resource_tier as resourceTier,
          t.requires_approval as requiresApproval,
          t.agent_id as agentId,
          a.name as agentName
   FROM pipeline_tasks t
   LEFT JOIN agents a ON a.id = t.agent_id
   WHERE t.pipeline_id = ?
   ORDER BY t.step_order`
)

function mapTasks(pipelineId: string) {
  return selectTasksStmt.all(pipelineId).map((task: any) => ({
    id: task.id,
    pipelineId: task.pipelineId,
    name: task.name,
    owner: task.owner,
    status: task.status as TaskStatus,
    startedAt: task.startedAt ?? undefined,
    completedAt: task.completedAt ?? undefined,
    stepOrder: task.stepOrder,
    resourceTier: (task.resourceTier as ResourceTier) ?? "cpu",
    requiresApproval: !!task.requiresApproval,
    agentId: task.agentId ?? undefined,
    agentName: task.agentName ?? undefined,
  })) as PipelineTask[]
}

export const DEFAULT_PIPELINE_TASKS: PipelineTaskInput[] = [
  { name: "Parse site plan", resourceTier: "cpu", requiresApproval: false },
  { name: "Generate renders", resourceTier: "gpu", requiresApproval: true },
  { name: "Prepare manufacturing packet", resourceTier: "cpu", requiresApproval: true },
]

function ensureSeedPipeline() {
  const countRow = db.prepare("SELECT COUNT(1) as count FROM pipelines").get() as { count: number }
  if ((countRow?.count ?? 0) > 0) {
    return
  }

  createPipeline("aurora-collective", {
    name: "Site parse → Render → Manufacturing",
    description: "Baseline workflow seeded for demos",
    owner: "Lina Cho",
    tasks: DEFAULT_PIPELINE_TASKS,
  })
}

ensureSeedPipeline()

export function listPipelines(orgId: string) {
  return selectPipelinesStmt.all(orgId).map((pipeline: any) => ({
    ...pipeline,
    status: pipeline.status as PipelineStatus,
    tasks: mapTasks(pipeline.id),
  }))
}

type CreatePipelineInput = {
  name: string
  description?: string
  owner: string
  tasks?: Array<PipelineTaskInput | string>
}

function normaliseTasks(tasks: Array<PipelineTaskInput | string> | undefined): PipelineTaskInput[] {
  if (!tasks || tasks.length === 0) {
    return DEFAULT_PIPELINE_TASKS
  }
  return tasks.map((task) => {
    if (typeof task === "string") {
      return { name: task, resourceTier: "cpu", requiresApproval: false }
    }
    return {
      name: task.name,
      resourceTier: task.resourceTier ?? "cpu",
      requiresApproval: task.requiresApproval ?? false,
      agentId: task.agentId ?? null,
    }
  })
}

export function createPipeline(orgId: string, input: CreatePipelineInput) {
  const pipelineId = randomUUID()
  const now = new Date().toISOString()
  const tasks = normaliseTasks(input.tasks)

  const insertPipeline = db.prepare(
    "INSERT INTO pipelines (id, org_id, name, description, owner, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  )
  const insertTask = db.prepare(
    "INSERT INTO pipeline_tasks (id, pipeline_id, name, owner, status, resource_tier, requires_approval, agent_id, step_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
  )

  const transaction = db.transaction(() => {
    insertPipeline.run(pipelineId, orgId, input.name, input.description ?? null, input.owner, "pending", now, now)
    tasks.forEach((task, index) => {
      insertTask.run(
        randomUUID(),
        pipelineId,
        task.name,
        input.owner,
        "pending",
        task.resourceTier ?? "cpu",
        task.requiresApproval ? 1 : 0,
        task.agentId ?? null,
        index
      )
    })
  })

  transaction()

  const pipeline = selectPipelineStmt.get(pipelineId)
  if (!pipeline) {
    throw new Error("Pipeline creation failed")
  }
  return {
    ...pipeline,
    status: pipeline.status as PipelineStatus,
    tasks: mapTasks(pipeline.id),
  }
}

export function getPipelineById(pipelineId: string): Pipeline | null {
  const pipeline = selectPipelineStmt.get(pipelineId)
  if (!pipeline) {
    return null
  }

  return {
    ...pipeline,
    status: pipeline.status as PipelineStatus,
    tasks: mapTasks(pipeline.id),
  }
}

export function updatePipelineStatus(pipelineId: string, status: TaskStatus) {
  const updateStmt = db.prepare("UPDATE pipelines SET status = ?, updated_at = datetime('now') WHERE id = ?")
  const result = updateStmt.run(status, pipelineId)
  if (result.changes === 0) {
    throw new Error("Pipeline not found")
  }

  const pipeline = selectPipelineStmt.get(pipelineId)
  if (!pipeline) {
    throw new Error("Pipeline not found")
  }

  return {
    ...pipeline,
    status: pipeline.status as PipelineStatus,
    tasks: mapTasks(pipeline.id),
  }
}

export function updateTaskStatus(pipelineId: string, taskId: string, status: TaskStatus) {
  const timestamps: Record<TaskStatus, { startedAt?: string; completedAt?: string }> = {
    pending: {},
    queued: {},
    running: { startedAt: new Date().toISOString() },
    awaiting_approval: {},
    approved: { completedAt: new Date().toISOString() },
    success: { completedAt: new Date().toISOString() },
    failed: { completedAt: new Date().toISOString() },
  }

  const { startedAt, completedAt } = timestamps[status]

  const updateStmt = db.prepare(
    "UPDATE pipeline_tasks SET status = ?, started_at = COALESCE(?, started_at), completed_at = COALESCE(?, completed_at) WHERE id = ? AND pipeline_id = ?"
  )

  const result = updateStmt.run(status, startedAt ?? null, completedAt ?? null, taskId, pipelineId)
  if (result.changes === 0) {
    throw new Error("Task not found")
  }

  const task = db
    .prepare<unknown[], PipelineTask>(
      "SELECT id, pipeline_id as pipelineId, name, owner, status, started_at as startedAt, completed_at as completedAt, step_order as stepOrder FROM pipeline_tasks WHERE id = ?"
    )
    .get(taskId)

  if (!task) {
    throw new Error("Task not found")
  }

  return { ...task, status: task.status as TaskStatus }
}
