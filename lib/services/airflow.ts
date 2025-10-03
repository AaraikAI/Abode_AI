import { randomUUID } from "crypto"

import type { DagRun, DagRunStatus } from "@/lib/data/dag-runs"
import {
  approveDagRunTask,
  applyRemoteDagRunSnapshot,
  createDagRun,
  getDagRun,
  listActiveDagRuns,
  listDagRuns,
  retryDagRunTask,
  updateDagRunStatus,
  updateDagRunTaskStatus,
} from "@/lib/data/dag-runs"
import { broadcastApprovalUpdate, broadcastOrchestrationRun } from "@/lib/collaboration/hub"
import { recordAudit } from "@/lib/audit-log"
import { upsertApprovalItem, type ApprovalItemRecord } from "@/lib/data/collaboration"

const airflowApiUrl = process.env.AIRFLOW_API_URL
const airflowToken = process.env.AIRFLOW_TOKEN

async function maybeCallAirflow(endpoint: string, init?: RequestInit) {
  if (!airflowApiUrl) return null
  const url = `${airflowApiUrl.replace(/\/$/, "")}${endpoint}`
  const headers = new Headers(init?.headers)
  headers.set("Content-Type", "application/json")
  if (airflowToken) {
    headers.set("Authorization", `Bearer ${airflowToken}`)
  }
  try {
    const response = await fetch(url, {
      ...init,
      headers,
    })
    if (!response.ok) {
      throw new Error(`Airflow responded with ${response.status}`)
    }
    return await response.json().catch(() => null)
  } catch (error) {
    console.warn("Airflow API call failed, continuing with local state", error)
    return null
  }
}

export async function triggerPipelineDag(params: {
  pipelineId: string
  orgId: string
  triggeredBy: string
  metadata?: Record<string, unknown>
}): Promise<DagRun> {
  if (airflowApiUrl) {
    await maybeCallAirflow(`/api/v1/dags/${params.pipelineId}/dagRuns`, {
      method: "POST",
      body: JSON.stringify({ conf: params.metadata ?? {}, note: "Triggered from Abode AI" }),
    })
  }

  const run = createDagRun(params)
  await primeApprovalQueueForRun(run)
  broadcastOrchestrationRun(run)
  return run
}

export async function markDagRunStatus(runId: string, status: DagRunStatus, nextStep?: string | null) {
  return updateDagRunStatus(runId, status, nextStep)
}

interface TaskTransitionContext {
  actorId?: string
  metadata?: Record<string, unknown>
}

async function syncApprovalState(
  run: DagRun,
  taskId: string,
  taskStatus: DagRunStatus,
  context: TaskTransitionContext,
  auditAction: string
) {
  const task = run.tasks.find((item) => item.id === taskId)
  if (!task || !task.requiresApproval) {
    return
  }

  const queueKey = `orchestration:${run.id}`
  const payload = {
    runId: run.id,
    taskName: task.name,
    pipelineId: run.pipelineId,
    pipelineName: run.pipelineName,
    status: taskStatus,
    ...context.metadata,
  }

  let status: ApprovalItemRecord["status"] | null = null
  let resolvedBy: string | null = null
  let resolvedAt: string | null = null
  let requestedBy: string | undefined

  switch (taskStatus) {
    case "awaiting_approval":
      status = "in_review"
      requestedBy = context.actorId ?? undefined
      break
    case "success":
      status = "approved"
      resolvedBy = context.actorId ?? null
      resolvedAt = new Date().toISOString()
      break
    case "failed":
      status = "rejected"
      resolvedBy = context.actorId ?? null
      resolvedAt = new Date().toISOString()
      break
    case "queued":
    case "running":
      status = "queued"
      break
    default:
      status = null
  }

  if (!status) return

  const record = await upsertApprovalItem({
    orgId: run.orgId,
    queueKey,
    itemId: taskId,
    status,
    payload,
    requestedBy: requestedBy ?? null,
    resolvedBy,
    resolvedAt,
  })

  broadcastApprovalUpdate(run.orgId, "orchestration", run.id, record)

  try {
    recordAudit({
      id: randomUUID(),
      actor: context.actorId ?? "system",
      orgId: run.orgId,
      action: auditAction,
      target: `dag_run:${run.id}:task:${taskId}`,
      metadata: {
        pipelineId: run.pipelineId,
        pipelineName: run.pipelineName,
        taskName: task.name,
        taskStatus,
        approvalStatus: status,
      },
    })
  } catch (error) {
    console.warn("Failed to record orchestration audit", error)
  }
}

async function primeApprovalQueueForRun(run: DagRun) {
  const tasksNeedingApproval = run.tasks.filter((task) => task.requiresApproval)
  if (!tasksNeedingApproval.length) {
    return
  }

  for (const task of tasksNeedingApproval) {
    const record = await upsertApprovalItem({
      orgId: run.orgId,
      queueKey: `orchestration:${run.id}`,
      itemId: task.id,
      status: "queued",
      payload: {
        runId: run.id,
        taskName: task.name,
        pipelineId: run.pipelineId,
        pipelineName: run.pipelineName,
        status: task.status,
      },
      requestedBy: run.triggeredBy ?? null,
    })

    broadcastApprovalUpdate(run.orgId, "orchestration", run.id, record)

    try {
      recordAudit({
        id: randomUUID(),
        actor: run.triggeredBy ?? "system",
        orgId: run.orgId,
        action: "orchestration.task.queue_initialised",
        target: `dag_run:${run.id}:task:${task.id}`,
        metadata: {
          pipelineId: run.pipelineId,
          pipelineName: run.pipelineName,
          taskName: task.name,
        },
      })
    } catch (error) {
      console.warn("Failed to record initial approval audit", error)
    }
  }
}

export async function markDagRunTask(
  runId: string,
  taskId: string,
  status: DagRunStatus,
  context: TaskTransitionContext = {}
) {
  const updated = updateDagRunTaskStatus(runId, taskId, status)
  if (!updated) {
    throw new Error("Run not found")
  }

  const nextTask = updated.tasks.find((task) => task.status === "queued" || task.status === "running" || task.status === "awaiting_approval")

  let runStatus: DagRunStatus = updated.status

  switch (status) {
    case "failed":
      runStatus = "failed"
      break
    case "awaiting_approval":
      runStatus = "awaiting_approval"
      break
    case "success":
      if (updated.tasks.every((task) => task.status === "success")) {
        runStatus = "success"
      } else {
        runStatus = "running"
      }
      break
    default:
      runStatus = "running"
      break
  }

  if (runStatus === "running" && updated.tasks.every((task) => task.status === "queued")) {
    runStatus = "queued"
  }

  const run = await markDagRunStatus(runId, runStatus, nextTask?.name ?? null)
  await syncApprovalState(run, taskId, status, context, "orchestration.task.status_change")
  broadcastOrchestrationRun(run)
  return run
}

export async function approveDagRunTaskAction(
  runId: string,
  taskId: string,
  context: TaskTransitionContext = {}
) {
  const run = approveDagRunTask(runId, taskId)
  if (!run) {
    throw new Error("Run not found")
  }
  const nextTask = run.tasks.find((task) => task.status === "queued" || task.status === "running" || task.status === "awaiting_approval")
  const status: DagRunStatus = run.tasks.every((task) => task.status === "success") ? "success" : "running"
  const finalRun = await markDagRunStatus(run.id, status, nextTask?.name ?? null)
  await syncApprovalState(finalRun, taskId, "success", context, "orchestration.task.approved")
  broadcastOrchestrationRun(finalRun)
  return finalRun
}

export async function retryDagRunTaskAction(
  runId: string,
  taskId: string,
  context: TaskTransitionContext = {}
) {
  const run = retryDagRunTask(runId, taskId)
  if (!run) {
    throw new Error("Run not found")
  }
  const finalRun = await markDagRunStatus(run.id, "running", run.nextStep)
  await syncApprovalState(finalRun, taskId, "queued", context, "orchestration.task.retry")
  broadcastOrchestrationRun(finalRun)
  return finalRun
}

export async function rejectDagRunTaskAction(
  runId: string,
  taskId: string,
  context: TaskTransitionContext = {}
) {
  const run = updateDagRunTaskStatus(runId, taskId, "failed")
  if (!run) {
    throw new Error("Run not found")
  }

  const nextTask = run.tasks.find((task) => ["queued", "running", "awaiting_approval"].includes(task.status))
  const finalRun = await markDagRunStatus(run.id, "failed", nextTask?.name ?? null)
  await syncApprovalState(finalRun, taskId, "failed", context, "orchestration.task.rejected")
  broadcastOrchestrationRun(finalRun)
  return finalRun
}

export async function fetchDagRuns(orgId: string, limit = 25) {
  return listDagRuns(orgId, limit)
}

export async function fetchDagRun(runId: string) {
  return getDagRun(runId)
}

const AIRFLOW_TO_LOCAL_STATUS: Record<string, DagRunStatus> = {
  queued: "queued",
  scheduled: "queued",
  running: "running",
  success: "success",
  failed: "failed",
  "upstream_failed": "failed",
  "up_for_retry": "queued",
  "up_for_reschedule": "awaiting_approval",
  skipped: "success",
  deferred: "awaiting_approval",
}

function mapAirflowState(state: string | undefined): DagRunStatus {
  if (!state) return "running"
  const key = state.toLowerCase() as keyof typeof AIRFLOW_TO_LOCAL_STATUS
  return AIRFLOW_TO_LOCAL_STATUS[key] ?? "running"
}

type AirflowDagRun = {
  state?: string
  end_date?: string | null
}

type AirflowTaskInstance = {
  task_id: string
  state?: string
  try_number?: number
  attempt_number?: number
}

async function pullAirflowDagRun(pipelineId: string, runId: string): Promise<AirflowDagRun | null> {
  return maybeCallAirflow(`/api/v1/dags/${encodeURIComponent(pipelineId)}/dagRuns/${encodeURIComponent(runId)}`)
}

async function pullAirflowTaskInstances(pipelineId: string, runId: string): Promise<AirflowTaskInstance[]> {
  const response = await maybeCallAirflow(
    `/api/v1/dags/${encodeURIComponent(pipelineId)}/dagRuns/${encodeURIComponent(runId)}/taskInstances`
  )
  if (!response) return []
  if (Array.isArray(response)) return response
  if (response?.task_instances && Array.isArray(response.task_instances)) {
    return response.task_instances
  }
  return []
}

export async function syncAirflowDagRuns(params: { orgId: string; runId?: string }) {
  if (!airflowApiUrl) {
    return [] as DagRun[]
  }

  const runs: DagRun[] = []

  if (params.runId) {
    const run = await fetchDagRun(params.runId)
    if (run) runs.push(run)
  } else {
    runs.push(...listActiveDagRuns(params.orgId))
  }

  const updates: DagRun[] = []

  for (const run of runs) {
    try {
      const dagRun = await pullAirflowDagRun(run.pipelineId, run.id)
      if (!dagRun) continue

      const remoteTasks = await pullAirflowTaskInstances(run.pipelineId, run.id)
      const mappedTasks = remoteTasks
        .map((task) => {
          const state = mapAirflowState(task?.state)
          const existing = run.tasks.find((item) => item.name === task.task_id)
          return {
            name: task.task_id ?? existing?.name ?? "",
            status: state,
            attempts:
              typeof task.try_number === "number"
                ? task.try_number
                : typeof task.attempt_number === "number"
                ? task.attempt_number
                : existing?.attempts,
            agentId: existing?.agentId ?? null,
          }
        })
        .filter((task) => task.name)

      const nextStep = mappedTasks.find((task) => ["queued", "running", "awaiting_approval"].includes(task.status))?.name ?? null
      const status = mapAirflowState(dagRun?.state)
      const endedAt = dagRun?.end_date ? new Date(dagRun.end_date).toISOString() : undefined

      const updated = applyRemoteDagRunSnapshot({
        runId: run.id,
        status,
        nextStep,
        endedAt,
        tasks: mappedTasks,
      })

      if (updated) {
        updates.push(updated)
        broadcastOrchestrationRun(updated)
      }
    } catch (error) {
      console.warn("Failed to sync run with Airflow", error)
      continue
    }
  }

  return updates
}
