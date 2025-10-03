"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { CSS } from "@dnd-kit/utilities"
import { DndContext, type DragEndEvent } from "@dnd-kit/core"
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable"
import { GripVertical, Plus, Workflow, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import type { ResourceTier } from "@/lib/data/pipelines"

interface AgentSummary {
  id: string
  name: string
  description: string
  version: string
  tags: string[]
  status: string
  author: string
  rating?: number
}

interface BuilderTask {
  id: string
  name: string
  resourceTier: ResourceTier
  requiresApproval: boolean
  agentId?: string | null
  agentName?: string | null
}

const RESOURCE_OPTIONS: Array<{ value: ResourceTier; label: string; hint: string }> = [
  { value: "cpu", label: "CPU", hint: "Visualisation, compliance, orchestration" },
  { value: "gpu", label: "GPU", hint: "Rendering, diffusion, heavy compute" },
]

function createEmptyTask(): BuilderTask {
  return {
    id: crypto.randomUUID(),
    name: "New step",
    resourceTier: "cpu",
    requiresApproval: false,
  }
}

function createDefaultTasks(): BuilderTask[] {
  return [
    {
      id: crypto.randomUUID(),
      name: "Parse site plan",
      resourceTier: "cpu",
      requiresApproval: false,
    },
    {
      id: crypto.randomUUID(),
      name: "Generate renders",
      resourceTier: "gpu",
      requiresApproval: true,
    },
    {
      id: crypto.randomUUID(),
      name: "Prepare manufacturing packet",
      resourceTier: "cpu",
      requiresApproval: true,
    },
  ]
}

interface SortableTaskProps {
  task: BuilderTask
  agents: AgentSummary[]
  onUpdate: (taskId: string, patch: Partial<BuilderTask>) => void
  onRemove: (taskId: string) => void
}

function SortableTaskCard({ task, agents, onUpdate, onRemove }: SortableTaskProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  }

  const selectedAgent = useMemo(() => agents.find((agent) => agent.id === task.agentId), [agents, task.agentId])

  return (
    <div ref={setNodeRef} style={style} className="space-y-4 rounded-2xl border border-border/40 bg-background/60 p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="cursor-grab rounded-md border border-border/50 bg-card/80 p-2 text-muted-foreground hover:bg-card"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <div className="flex flex-col gap-1">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Step name</Label>
            <Input value={task.name} onChange={(event) => onUpdate(task.id, { name: event.target.value })} />
          </div>
        </div>
        <Button type="button" variant="ghost" size="icon" onClick={() => onRemove(task.id)}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Compute tier</Label>
          <Select value={task.resourceTier} onValueChange={(value) => onUpdate(task.id, { resourceTier: value as ResourceTier })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RESOURCE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">{option.label}</span>
                    <span className="text-xs text-muted-foreground">{option.hint}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Agent</Label>
          <Select
            value={task.agentId ?? ""}
            onValueChange={(value) =>
              onUpdate(task.id, {
                agentId: value || null,
                agentName: value ? agents.find((agent) => agent.id === value)?.name ?? null : null,
                name: value ? agents.find((agent) => agent.id === value)?.name ?? task.name : task.name,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Attach agent" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">No agent</SelectItem>
              {agents.map((agent) => (
                <SelectItem key={agent.id} value={agent.id}>
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">{agent.name}</span>
                    <span className="text-xs text-muted-foreground">v{agent.version} • {agent.author}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedAgent ? (
            <p className="text-xs text-muted-foreground">{selectedAgent.description}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Approval gate</Label>
          <div className="flex items-center justify-between rounded-lg border border-border/40 bg-card/60 px-3 py-2">
            <span className="text-sm">Requires manual approval</span>
            <Switch checked={task.requiresApproval} onCheckedChange={(checked) => onUpdate(task.id, { requiresApproval: checked })} />
          </div>
        </div>
      </div>
    </div>
  )
}

export function PipelineBuilder({ onCreated }: { onCreated: () => void }) {
  const { toast } = useToast()
  const router = useRouter()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [tasks, setTasks] = useState<BuilderTask[]>(() => createDefaultTasks())
  const [agents, setAgents] = useState<AgentSummary[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function loadAgents() {
      try {
        const response = await fetch("/api/agents")
        if (!response.ok) return
        const data = (await response.json()) as { agents: AgentSummary[] }
        if (!cancelled) {
          setAgents(data.agents)
        }
      } catch (error) {
        console.error("Failed to load agents", error)
      }
    }
    loadAgents()
    return () => {
      cancelled = true
    }
  }, [])

  function handleTaskUpdate(taskId: string, patch: Partial<BuilderTask>) {
    setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, ...patch } : task)))
  }

  function handleTaskRemove(taskId: string) {
    setTasks((prev) => (prev.length > 1 ? prev.filter((task) => task.id !== taskId) : prev))
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setTasks((prev) => {
      const oldIndex = prev.findIndex((task) => task.id === active.id)
      const newIndex = prev.findIndex((task) => task.id === over.id)
      if (oldIndex === -1 || newIndex === -1) return prev
      return arrayMove(prev, oldIndex, newIndex)
    })
  }

  function addTaskFromAgent(agent: AgentSummary) {
    setTasks((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: agent.name,
        resourceTier: agent.tags.includes("gpu") ? "gpu" : "cpu",
        requiresApproval: agent.tags.includes("compliance"),
        agentId: agent.id,
        agentName: agent.name,
      },
    ])
  }

  function addCustomTask() {
    setTasks((prev) => [...prev, createEmptyTask()])
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!tasks.length) {
      toast({ title: "Add at least one task", variant: "destructive" })
      return
    }
    if (tasks.some((task) => !task.name.trim())) {
      toast({ title: "Task name required", description: "Every step must have a label", variant: "destructive" })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/orchestration/pipelines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          tasks: tasks.map((task) => ({
            name: task.name.trim(),
            resourceTier: task.resourceTier,
            requiresApproval: task.requiresApproval,
            agentId: task.agentId ?? null,
          })),
        }),
      })
      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.error || "Unable to create pipeline")
      }
      setName("")
      setDescription("")
      setTasks(createDefaultTasks())
      toast({
        title: "Pipeline created",
        description: "Draft orchestration saved. Configure approval policies next.",
      })
      onCreated()
      router.refresh()
    } catch (error) {
      toast({ title: "Creation failed", description: (error as Error).message, variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="space-y-6 border border-border/60 bg-card/80 p-6">
      <div className="flex items-center gap-2">
        <Workflow className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Draft a new pipeline</h2>
      </div>
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Pipeline name</Label>
            <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Manufacturing-ready workflow" required />
          </div>
          <div className="space-y-2">
            <Label>Summary</Label>
            <Textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Explain what this orchestration covers" rows={3} />
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Stages & approvals</Label>
            <Button type="button" variant="outline" size="sm" className="gap-1" onClick={addCustomTask}>
              <Plus className="h-4 w-4" /> Add step
            </Button>
          </div>
          <DndContext onDragEnd={handleDragEnd}>
            <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {tasks.map((task) => (
                  <SortableTaskCard key={task.id} task={task} agents={agents} onUpdate={handleTaskUpdate} onRemove={handleTaskRemove} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create pipeline"}
        </Button>
      </form>

      <Card className="border border-border/40 bg-background/60">
        <CardHeader>
          <CardTitle className="text-base">Agent marketplace</CardTitle>
          <CardDescription>Select agents to add their skills to this orchestration.</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-48 pr-3">
            <div className="space-y-3">
              {agents.map((agent) => {
                const alreadyAdded = tasks.some((task) => task.agentId === agent.id)
                return (
                  <div key={agent.id} className="flex items-start justify-between gap-3 rounded-xl border border-border/60 bg-card/60 p-3">
                    <div>
                      <div className="font-medium text-foreground">{agent.name}</div>
                      <div className="text-xs text-muted-foreground">v{agent.version} • {agent.author}</div>
                      <p className="mt-2 text-sm text-muted-foreground">{agent.description}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {agent.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-[10px] uppercase tracking-wide">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button variant="outline" size="sm" disabled={alreadyAdded} onClick={() => addTaskFromAgent(agent)}>
                      {alreadyAdded ? "Added" : "Add"}
                    </Button>
                  </div>
                )
              })}
              {!agents.length ? <p className="text-sm text-muted-foreground">Loading agents…</p> : null}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </Card>
  )
}
