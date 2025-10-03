"use client"

import { Fragment } from "react"
import {
  Bot,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Factory,
  GitBranch,
  LayoutDashboard,
  Leaf,
  Layers3,
  ShieldCheck,
  Sparkles,
} from "lucide-react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SectionHeader } from "./section-header"
import type { WorkspaceDefinition, WorkspaceHighlight } from "@/lib/platform-types"

const iconMap = {
  CalendarClock,
  Bot,
  ShieldCheck,
  Layers3,
  Sparkles,
  LayoutDashboard,
  Factory,
  GitBranch,
  Leaf,
} as const

function renderIcon(icon: WorkspaceHighlight["icon"]) {
  if (typeof icon === "string") {
    const IconComponent = iconMap[icon as keyof typeof iconMap]
    if (!IconComponent) {
      return <CheckCircle2 className="size-5 text-primary" aria-hidden />
    }
    return <IconComponent className="size-5 text-primary" aria-hidden />
  }
  const IconComponent = icon
  return <IconComponent className="size-5 text-primary" aria-hidden />
}

interface WorkspaceShowcaseProps {
  workspaces: WorkspaceDefinition[]
}

export function WorkspaceShowcase({ workspaces }: WorkspaceShowcaseProps) {
  return (
    <section id="workspaces" className="space-y-8">
      <SectionHeader
        eyebrow="Modular platform"
        heading="Purpose-built workspaces for every stakeholder"
        description="Task orchestration, design studio, and manufacturing bridge share a common governance and billing core."
      />

      <Tabs defaultValue={workspaces[0]?.id} className="w-full">
        <TabsList className="flex w-full flex-wrap justify-start gap-2 overflow-x-auto bg-transparent p-0">
          {workspaces.map((workspace) => (
            <TabsTrigger
              key={workspace.id}
              value={workspace.id}
              className="rounded-full border border-border bg-background px-5 py-2 text-sm font-medium shadow-sm data-[state=active]:border-primary data-[state=active]:bg-primary/10"
            >
              {workspace.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {workspaces.map((workspace) => (
          <TabsContent key={workspace.id} value={workspace.id} className="mt-8 space-y-8">
            <div className="grid gap-6 lg:grid-cols-[1.2fr_minmax(0,1fr)]">
              <Card className="h-full border-border bg-card/60 p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-foreground">
                  {workspace.description}
                </h3>
                <div className="mt-6 grid gap-4">
                  {workspace.highlights.map((highlight) => (
                    <div key={highlight.title} className="flex items-start gap-4">
                      <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                        {renderIcon(highlight.icon)}
                      </div>
                      <div>
                        <p className="text-base font-medium text-foreground">{highlight.title}</p>
                        <p className="text-sm text-muted-foreground">{highlight.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <div className="grid gap-4">
                <Card className="border-border bg-card/60 p-6 shadow-sm">
                  <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Journey
                  </p>
                  <div className="mt-4 space-y-4">
                    {workspace.journey.map((phase, index) => (
                      <Fragment key={phase.title}>
                        <div className="flex items-start gap-3">
                          <Badge className="mt-1 border border-primary/20 bg-primary/10 text-primary">
                            {index + 1}
                          </Badge>
                          <div>
                            <p className="text-sm font-medium text-foreground">{phase.title}</p>
                            <p className="text-sm text-muted-foreground">{phase.description}</p>
                          </div>
                        </div>
                        {index < workspace.journey.length - 1 ? (
                          <ChevronRight className="mx-2 h-4 w-4 text-muted-foreground/60" />
                        ) : null}
                      </Fragment>
                    ))}
                  </div>
                </Card>

                <Card className="border-border bg-card/60 p-6 shadow-sm">
                  <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Operational metrics
                  </p>
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    {workspace.metrics.map((metric) => (
                      <div key={metric.label} className="rounded-xl border border-border/60 bg-background px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                          {metric.label}
                        </p>
                        <p className="mt-2 text-xl font-semibold text-foreground">{metric.value}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <CheckCircle2 className="size-4 text-primary" />
              <span>Redis approvals</span>
              <span className="text-muted-foreground/40">•</span>
              <span>CodeCarbon telemetry</span>
              <span className="text-muted-foreground/40">•</span>
              <span>Auth0 + WebAuthn</span>
              <span className="text-muted-foreground/40">•</span>
              <span>Stripe Usage API credits</span>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </section>
  )
}
