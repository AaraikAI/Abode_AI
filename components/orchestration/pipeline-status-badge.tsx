"use client"

import { Badge } from "@/components/ui/badge"
import type { TaskStatus } from "@/lib/data/pipelines"

const STATUS_COLOR: Record<TaskStatus, string> = {
  pending: "bg-muted text-muted-foreground",
  queued: "bg-muted text-muted-foreground",
  running: "bg-blue-100 text-blue-700",
  awaiting_approval: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  success: "bg-emerald-100 text-emerald-700",
  failed: "bg-rose-100 text-rose-700",
}

export function PipelineStatusBadge({ status }: { status: TaskStatus }) {
  return <Badge className={STATUS_COLOR[status]}>{status.replace("_", " ")}</Badge>
}
