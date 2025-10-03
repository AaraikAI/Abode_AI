"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { PipelineStatusBadge } from "@/components/orchestration/pipeline-status-badge"
import type { Pipeline, TaskStatus } from "@/lib/data/pipelines"

interface PipelineTableProps {
  pipelines: Pipeline[]
}

const pipelineActions: Array<{ label: string; status: TaskStatus; variant?: "default" | "destructive" | "outline" }> = [
  { label: "Queue", status: "queued", variant: "outline" },
  { label: "Mark running", status: "running", variant: "outline" },
  { label: "Await approval", status: "awaiting_approval", variant: "outline" },
  { label: "Complete", status: "success" },
  { label: "Fail", status: "failed", variant: "destructive" },
]

const taskActions: Array<{ label: string; status: TaskStatus }> = [
  { label: "Queue", status: "queued" },
  { label: "Start", status: "running" },
  { label: "Await approval", status: "awaiting_approval" },
  { label: "Complete", status: "success" },
  { label: "Fail", status: "failed" },
]

export function PipelineTable({ pipelines }: PipelineTableProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [pendingPipeline, setPendingPipeline] = useState<string>("")
  const [pendingTask, setPendingTask] = useState<string>("")

  async function updatePipeline(pipelineId: string, status: TaskStatus) {
    setPendingPipeline(`${pipelineId}-${status}`)
    try {
      const response = await fetch(`/api/orchestration/pipelines/${pipelineId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.error || "Unable to update pipeline")
      }
      toast({ title: "Pipeline updated", description: `Status set to ${status}` })
      router.refresh()
    } catch (error) {
      toast({ title: "Update failed", description: (error as Error).message, variant: "destructive" })
    } finally {
      setPendingPipeline("")
    }
  }

  async function updateTask(pipelineId: string, taskId: string, status: TaskStatus) {
    setPendingTask(`${taskId}-${status}`)
    try {
      const response = await fetch(`/api/orchestration/pipelines/${pipelineId}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.error || "Unable to update task")
      }
      toast({ title: "Task updated", description: `Status set to ${status}` })
      router.refresh()
    } catch (error) {
      toast({ title: "Update failed", description: (error as Error).message, variant: "destructive" })
    } finally {
      setPendingTask("")
    }
  }

  if (!pipelines.length) {
    return (
      <Card className="p-6 text-sm text-muted-foreground">
        No pipelines yet. Use the builder to create your first orchestration workflow.
      </Card>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/80">
      <table className="min-w-full divide-y divide-border/60 text-sm">
        <thead className="bg-muted/40 text-left text-xs uppercase tracking-[0.2em] text-muted-foreground">
          <tr>
            <th className="px-6 py-3">Pipeline</th>
            <th className="px-6 py-3">Owner</th>
            <th className="px-6 py-3">Status</th>
            <th className="px-6 py-3">Steps</th>
            <th className="px-6 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60 bg-card/50">
          {pipelines.map((pipeline) => (
            <tr key={pipeline.id}>
              <td className="px-6 py-4">
                <div className="font-semibold text-foreground">{pipeline.name}</div>
                <div className="text-xs text-muted-foreground">Updated {new Date(pipeline.updatedAt).toLocaleString()}</div>
              </td>
              <td className="px-6 py-4 text-muted-foreground">{pipeline.owner}</td>
              <td className="px-6 py-4">
                <PipelineStatusBadge status={pipeline.status} />
              </td>
              <td className="px-6 py-4">
                <ul className="space-y-2 text-xs text-muted-foreground">
                  {pipeline.tasks.map((task) => (
                    <li key={task.id} className="space-y-2 rounded-xl border border-border/40 bg-background/60 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="space-y-1">
                          <span className="font-medium text-foreground">{task.name}</span>
                          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                            {task.resourceTier.toUpperCase()} • {task.requiresApproval ? "Approval gate" : "Auto"}
                            {task.agentName ? ` • Agent: ${task.agentName}` : ""}
                          </div>
                        </div>
                        <PipelineStatusBadge status={task.status} />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {taskActions.map((action) => (
                          <Button
                            key={action.status}
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            disabled={pendingTask === `${task.id}-${action.status}`}
                            onClick={() => updateTask(pipeline.id, task.id, action.status)}
                          >
                            {pendingTask === `${task.id}-${action.status}` ? "Updating..." : action.label}
                          </Button>
                        ))}
                      </div>
                    </li>
                  ))}
                </ul>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex flex-wrap justify-end gap-2">
                  {pipelineActions.map((action) => (
                    <Button
                      key={action.status}
                      variant={action.variant ?? "outline"}
                      size="sm"
                      disabled={pendingPipeline === `${pipeline.id}-${action.status}`}
                      onClick={() => updatePipeline(pipeline.id, action.status)}
                    >
                      {pendingPipeline === `${pipeline.id}-${action.status}` ? "Updating..." : action.label}
                    </Button>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
