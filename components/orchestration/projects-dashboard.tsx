"use client"

import { useCallback, useEffect, useMemo, useState, useTransition } from "react"
import { AlertTriangle, Ban, CheckCircle2, Play, RefreshCw, RotateCw } from "lucide-react"
import { useSession } from "next-auth/react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { VersionControlPanel } from "@/components/versioning/version-control-panel"
import type { DagRun } from "@/lib/data/dag-runs"
import type { Pipeline } from "@/lib/data/pipelines"
import { useCollaboration } from "@/hooks/use-collaboration"

interface ProjectsDashboardProps {
  initialRuns: DagRun[]
  pipelines: Pipeline[]
}

type DagStatus = DagRun["status"]

const STATUS_COLORS: Record<string, string> = {
  queued: "bg-muted text-muted-foreground",
  running: "bg-blue-100 text-blue-700",
  awaiting_approval: "bg-amber-100 text-amber-700",
  success: "bg-emerald-100 text-emerald-700",
  approved: "bg-emerald-100 text-emerald-700",
  failed: "bg-rose-100 text-rose-700",
  in_review: "bg-amber-200 text-amber-800",
  rejected: "bg-rose-100 text-rose-700",
}

function StatusBadge({ status }: { status: string }) {
  const key = status.toLowerCase()
  return <Badge className={STATUS_COLORS[key] ?? "bg-muted text-muted-foreground"}>{status.replace(/_/g, " ")}</Badge>
}

function RunMetrics({ runs }: { runs: DagRun[] }) {
  const metrics = useMemo(() => {
    const running = runs.filter((run) => run.status === "running").length
    const awaiting = runs.filter((run) => run.status === "awaiting_approval").length
    const success = runs.filter((run) => run.status === "success").length
    const failed = runs.filter((run) => run.status === "failed").length
    return { total: runs.length, running, awaiting, success, failed }
  }, [runs])

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card className="border border-border/50 bg-card/70">
        <CardHeader className="pb-2">
          <CardDescription>Total runs</CardDescription>
          <CardTitle className="text-2xl">{metrics.total}</CardTitle>
        </CardHeader>
      </Card>
      <Card className="border border-border/50 bg-card/70">
        <CardHeader className="pb-2">
          <CardDescription>Running</CardDescription>
          <CardTitle className="text-2xl text-blue-600">{metrics.running}</CardTitle>
        </CardHeader>
      </Card>
      <Card className="border border-border/50 bg-card/70">
        <CardHeader className="pb-2">
          <CardDescription>Awaiting approval</CardDescription>
          <CardTitle className="text-2xl text-amber-600">{metrics.awaiting}</CardTitle>
        </CardHeader>
      </Card>
      <Card className="border border-border/50 bg-card/70">
        <CardHeader className="pb-2">
          <CardDescription>Successful</CardDescription>
          <CardTitle className="text-2xl text-emerald-600">{metrics.success}</CardTitle>
        </CardHeader>
      </Card>
    </div>
  )
}

function TaskRow({
  runId,
  task,
  onApprove,
  onReject,
  onRetry,
  onAdvance,
}: {
  runId: string
  task: DagRun["tasks"][number]
  onApprove: (runId: string, taskId: string) => Promise<void>
  onReject: (runId: string, taskId: string) => Promise<void>
  onRetry: (runId: string, taskId: string) => Promise<void>
  onAdvance: (runId: string, taskId: string, status: DagStatus) => Promise<void>
}) {
  const awaitingApproval = task.requiresApproval && task.status === "awaiting_approval"
  const failed = task.status === "failed"
  const canMarkRunning = task.status === "queued"
  const canMarkAwaiting = task.status !== "awaiting_approval"
  const canMarkFailed = task.status !== "failed"

  return (
    <div className="space-y-2 rounded-xl border border-border/30 bg-background/50 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-sm font-medium text-foreground">{task.name}</div>
          <div className="text-xs text-muted-foreground">
            {task.resourceTier.toUpperCase()} • {task.requiresApproval ? "Approval gate" : "Auto"}
            {task.agentName ? ` • Agent: ${task.agentName}` : ""}
            {task.attempts > 0 ? ` • Retries: ${task.attempts}` : ""}
          </div>
        </div>
        <StatusBadge status={task.status} />
      </div>
      <div className="flex flex-wrap gap-2">
        {awaitingApproval ? (
          <Button size="sm" onClick={() => onApprove(runId, task.id)} className="gap-1">
            <CheckCircle2 className="h-4 w-4" /> Approve
          </Button>
        ) : null}
        {awaitingApproval ? (
          <Button variant="destructive" size="sm" onClick={() => onReject(runId, task.id)} className="gap-1">
            <Ban className="h-4 w-4" /> Reject
          </Button>
        ) : null}
        {failed ? (
          <Button variant="secondary" size="sm" onClick={() => onRetry(runId, task.id)} className="gap-1">
            <RotateCw className="h-4 w-4" /> Retry
          </Button>
        ) : null}
        {canMarkRunning ? (
          <Button variant="outline" size="sm" onClick={() => onAdvance(runId, task.id, "running")}>Mark running</Button>
        ) : null}
        {canMarkAwaiting ? (
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => onAdvance(runId, task.id, "awaiting_approval")}
          >
            <AlertTriangle className="h-4 w-4" /> Await approval
          </Button>
        ) : null}
        {canMarkFailed ? (
          <Button
            variant="destructive"
            size="sm"
            className="gap-1"
            onClick={() => onAdvance(runId, task.id, "failed")}
          >
            <Ban className="h-4 w-4" /> Mark failed
          </Button>
        ) : null}
      </div>
    </div>
  )
}

function TriggerRunDialog({ pipelines, onTriggered }: { pipelines: Pipeline[]; onTriggered: (run: DagRun) => void }) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [pipelineId, setPipelineId] = useState(pipelines[0]?.id ?? "")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const hasPipelines = pipelines.length > 0
  const disableSubmit = !pipelineId || isSubmitting || !hasPipelines

  async function handleSubmit() {
    if (!pipelineId) {
      toast({ title: "Select a pipeline", variant: "destructive" })
      return
    }
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/orchestration/dag-runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pipelineId, metadata: notes ? { notes } : undefined }),
      })
      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.error || "Unable to trigger DAG run")
      }
      const data = (await response.json()) as { run: DagRun }
      onTriggered(data.run)
      toast({ title: "Run triggered", description: "Airflow execution has been queued." })
      setOpen(false)
      setNotes("")
    } catch (error) {
      toast({ title: "Trigger failed", description: (error as Error).message, variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Play className="h-4 w-4" /> Trigger new run
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Trigger orchestration run</DialogTitle>
          <DialogDescription>Select the pipeline and optional launch notes.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Pipeline</Label>
            <Select value={pipelineId} onValueChange={setPipelineId} disabled={!hasPipelines}>
              <SelectTrigger>
                <SelectValue placeholder={hasPipelines ? "Select pipeline" : "No pipelines available"} />
              </SelectTrigger>
              <SelectContent>
                {pipelines.map((pipeline) => (
                  <SelectItem key={pipeline.id} value={pipeline.id}>
                    {pipeline.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!hasPipelines ? <p className="text-xs text-muted-foreground">Create a pipeline before triggering a run.</p> : null}
          </div>
          <div className="space-y-2">
            <Label>Launch notes</Label>
            <Input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Optional run context" />
          </div>
          <Button onClick={handleSubmit} disabled={disableSubmit} className="w-full">
            {isSubmitting ? "Triggering…" : "Launch run"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function ProjectsDashboard({ initialRuns, pipelines }: ProjectsDashboardProps) {
  const { toast } = useToast()
  const { data: session } = useSession()
  const [runs, setRuns] = useState(initialRuns)
  const [isRefreshing, startRefresh] = useTransition()
  const [isSyncing, startSync] = useTransition()
  const [selectedPipelineId, setSelectedPipelineId] = useState(pipelines[0]?.id ?? "")

  const collaboration = useCollaboration({
    orgId: session?.user?.orgId ?? initialRuns[0]?.orgId ?? "demo-org",
    workspace: "orchestration",
    userId: session?.user?.id ?? undefined,
    userName: session?.user?.name ?? undefined,
  })

  const approvalQueue = useMemo(() => collaboration.approvals, [collaboration.approvals])
  const pendingApprovals = useMemo(
    () => approvalQueue.filter((item) => item.status === "in_review" || item.status === "queued"),
    [approvalQueue]
  )

  const selectedPipeline = useMemo(() => {
    if (!pipelines.length) return undefined
    return pipelines.find((pipeline) => pipeline.id === selectedPipelineId) ?? pipelines[0]
  }, [pipelines, selectedPipelineId])

  const upsertRun = useCallback((updated: DagRun) => {
    setRuns((prev) => {
      const existingIndex = prev.findIndex((run) => run.id === updated.id)
      if (existingIndex === -1) {
        return [updated, ...prev]
      }
      const clone = [...prev]
      clone[existingIndex] = updated
      return clone
    })
  }, [])

  useEffect(() => {
    if (collaboration.run) {
      upsertRun(collaboration.run)
    }
  }, [collaboration.run, upsertRun])

  const handleRefresh = useCallback(() => {
    startRefresh(async () => {
      try {
        const response = await fetch("/api/orchestration/dag-runs")
        if (!response.ok) {
          throw new Error("Unable to refresh runs")
        }
        const data = (await response.json()) as { runs: DagRun[] }
        setRuns(data.runs)
      } catch (error) {
        toast({ title: "Refresh failed", description: (error as Error).message, variant: "destructive" })
      }
    })
  }, [toast])

  const handleSync = useCallback(
    (runId?: string) => {
      startSync(async () => {
        try {
          const response = await fetch("/api/orchestration/dag-runs/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ runId }),
          })
          if (!response.ok) {
            throw new Error("Unable to sync with Airflow")
          }
          const data = (await response.json()) as { runs: DagRun[] }
          data.runs.forEach(upsertRun)
        } catch (error) {
          console.warn("Sync failed", error)
        }
      })
    },
    [upsertRun]
  )

  async function handleApprove(runId: string, taskId: string) {
    try {
      const response = await fetch(`/api/orchestration/dag-runs/${runId}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      })
      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.error || "Unable to approve task")
      }
      const data = (await response.json()) as { run: DagRun }
      upsertRun(data.run)
      toast({ title: "Task approved" })
    } catch (error) {
      toast({ title: "Approval failed", description: (error as Error).message, variant: "destructive" })
    }
  }

  async function handleRetry(runId: string, taskId: string) {
    try {
      const response = await fetch(`/api/orchestration/dag-runs/${runId}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "retry" }),
      })
      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.error || "Unable to retry task")
      }
      const data = (await response.json()) as { run: DagRun }
      upsertRun(data.run)
      toast({ title: "Retry queued" })
    } catch (error) {
      toast({ title: "Retry failed", description: (error as Error).message, variant: "destructive" })
    }
  }

  async function handleReject(runId: string, taskId: string) {
    try {
      const response = await fetch(`/api/orchestration/dag-runs/${runId}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject" }),
      })
      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.error || "Unable to reject task")
      }
      const data = (await response.json()) as { run: DagRun }
      upsertRun(data.run)
      toast({ title: "Task rejected", variant: "destructive" })
    } catch (error) {
      toast({ title: "Rejection failed", description: (error as Error).message, variant: "destructive" })
    }
  }

  async function handleAdvance(runId: string, taskId: string, status: DagStatus) {
    try {
      const response = await fetch(`/api/orchestration/dag-runs/${runId}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.error || "Unable to update task")
      }
      const data = (await response.json()) as { run: DagRun }
      upsertRun(data.run)
      toast({ title: "Task updated" })
    } catch (error) {
      toast({ title: "Update failed", description: (error as Error).message, variant: "destructive" })
    }
  }

  useEffect(() => {
    if (!pipelines.length) {
      return
    }

    const interval = window.setInterval(() => {
      handleSync()
    }, 15000)

    return () => {
      window.clearInterval(interval)
    }
  }, [pipelines.length, handleSync])

  useEffect(() => {
    if (pipelines.length && !selectedPipelineId) {
      setSelectedPipelineId(pipelines[0].id)
    }
  }, [pipelines, selectedPipelineId])

  return (
    <div className="space-y-6">
      {collaboration.error ? (
        <Card className="border border-destructive/50 bg-destructive/10 text-destructive">
          <CardContent className="py-3 text-sm">Collaboration error: {collaboration.error}</CardContent>
        </Card>
      ) : null}
      <RunMetrics runs={runs} />
      <Card className="border border-border/60 bg-card/70">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg">Approval queue</CardTitle>
            <CardDescription>Real-time orchestration approvals from collaboration hub.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {pendingApprovals.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tasks waiting for approval right now.</p>
          ) : (
            pendingApprovals.map((item) => {
              const payload = (item.payload ?? {}) as Record<string, unknown>
              const runId = typeof payload.runId === "string" ? payload.runId : undefined
              const taskName = typeof payload.taskName === "string" ? payload.taskName : item.itemId
              const pipelineName = typeof payload.pipelineName === "string" ? payload.pipelineName : "Pipeline"
              const shortRunId = runId ? runId.slice(0, 8) : "—"

              return (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/40 bg-background/50 p-4"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{taskName}</p>
                    <p className="text-xs text-muted-foreground">Run {shortRunId} • {pipelineName}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={item.status} />
                    <Button
                      size="sm"
                      onClick={() => {
                        if (runId) {
                          void handleApprove(runId, item.itemId)
                        }
                      }}
                      disabled={!runId}
                      className="gap-1"
                    >
                      <CheckCircle2 className="h-4 w-4" /> Approve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (runId) {
                          void handleReject(runId, item.itemId)
                        }
                      }}
                      disabled={!runId}
                      className="gap-1"
                    >
                      <Ban className="h-4 w-4" /> Reject
                    </Button>
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>
      <Card className="border border-border/60 bg-card/70">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg">Orchestration runs</CardTitle>
            <CardDescription>Real-time feed of DAG runs across pipelines in this org.</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" className="gap-2" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => handleSync()}
              disabled={isSyncing}
            >
              <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
              Sync Airflow
            </Button>
            <TriggerRunDialog pipelines={pipelines} onTriggered={upsertRun} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {runs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No DAG runs recorded yet. Trigger your first orchestration.</p>
          ) : (
            runs.map((run) => {
              const awaitingDecision = run.tasks.filter((task) => task.status === "awaiting_approval").length
              const nextStep = run.nextStep ?? "Complete"
              return (
                <div key={run.id} className="space-y-4 rounded-2xl border border-border/50 bg-background/40 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-base font-semibold text-foreground">{run.pipelineName}</div>
                      <div className="text-xs text-muted-foreground">
                        Run ID: {run.id.slice(0, 8)} • Started {new Date(run.startedAt).toLocaleString()}
                        {run.triggeredBy ? ` • Triggered by ${run.triggeredBy}` : ""}
                      </div>
                    </div>
                    <StatusBadge status={run.status} />
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <div>
                      Next step: <span className="font-medium text-foreground">{nextStep}</span>
                    </div>
                    <div>Awaiting approvals: {awaitingDecision}</div>
                    {run.endedAt ? <div>Completed {new Date(run.endedAt).toLocaleString()}</div> : null}
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {run.tasks.map((task) => (
                      <TaskRow
                        key={task.id}
                        runId={run.id}
                        task={task}
                        onApprove={handleApprove}
                        onReject={handleReject}
                        onRetry={handleRetry}
                        onAdvance={handleAdvance}
                      />
                    ))}
                  </div>
                </div>
              )
            })
          )}
      </CardContent>
    </Card>

    {selectedPipeline ? (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Pipeline versioning</h2>
            <p className="text-xs text-muted-foreground">
              Branch, commit, and propose merges for orchestration templates.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="pipeline-version-target" className="text-xs text-muted-foreground">
              Target pipeline
            </Label>
            <Select
              value={selectedPipeline.id}
              onValueChange={(value) => setSelectedPipelineId(value)}
            >
              <SelectTrigger id="pipeline-version-target" className="w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pipelines.map((pipeline) => (
                  <SelectItem key={pipeline.id} value={pipeline.id}>
                    {pipeline.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <VersionControlPanel
          entityType="pipeline"
          entityId={selectedPipeline.id}
          snapshot={{ pipeline: { id: selectedPipeline.id, name: selectedPipeline.name, tasks: selectedPipeline.tasks } }}
        />
      </div>
    ) : null}
  </div>
)
}
