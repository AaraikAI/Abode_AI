"use client"

import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Card } from "@/components/ui/card"
import { SectionHeader } from "./section-header"
import { Badge } from "@/components/ui/badge"
import type {
  ObservabilityMetric,
  SustainabilityPoint,
  TelemetryEvent,
} from "@/lib/platform-types"

const chartConfig = {
  co2: {
    label: "CO₂ per render",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

interface ObservabilityProps {
  metrics: ObservabilityMetric[]
  series: SustainabilityPoint[]
  telemetry?: TelemetryEvent[]
}

export function Observability({ metrics, series, telemetry = [] }: ObservabilityProps) {
  return (
    <section id="observability" className="space-y-8">
      <SectionHeader
        eyebrow="Telemetry & sustainability"
        heading="Built-in observability across infrastructure, AI, and sustainability"
        description="Every render, agent, and export emits metrics, logs, and traces with sustainability deltas surfaced alongside SLA posture."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <Card className="border-border bg-card/60 p-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <Badge className="border border-primary/30 bg-primary/10 text-xs text-primary">
              CodeCarbon integrated
            </Badge>
            <Badge variant="outline" className="border-border/60 text-xs">
              Evidently + Fairlearn
            </Badge>
            <Badge variant="outline" className="border-border/60 text-xs">
              OpenTelemetry
            </Badge>
          </div>
          <div className="mt-6">
            <ChartContainer config={chartConfig} className="h-64 w-full">
              <AreaChart data={series}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={12}
                  stroke="hsl(var(--muted-foreground))"
                />
                <ChartTooltip
                  cursor={{ stroke: "hsl(var(--primary))", strokeWidth: 1 }}
                  content={<ChartTooltipContent indicator="line" />}
                />
                <Area
                  dataKey="co2"
                  type="monotone"
                  stroke="var(--color-co2)"
                  fill="var(--color-co2)"
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ChartContainer>
          </div>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          {metrics.map((metric) => (
            <Card
              key={metric.name}
              className="border-border bg-card/60 p-5 shadow-sm"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                {metric.name}
              </p>
              <p className="mt-3 text-2xl font-semibold text-foreground">
                {metric.value}
              </p>
              <p className="mt-2 text-sm" aria-label={metric.change}>
                <span className={metric.positive ? "text-emerald-500" : "text-rose-500"}>
                  {metric.change}
                </span>
              </p>
            </Card>
          ))}
        </div>
      </div>

      {telemetry.length > 0 && (
        <Card className="border-border bg-card/60 p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Live telemetry
          </p>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            {telemetry.slice(0, 5).map((event) => (
              <li key={`${event.type}-${event.timestamp}`} className="space-y-1">
                <div className="flex items-center justify-between gap-4">
                  <span className="font-medium text-foreground capitalize">{event.type}</span>
                  <span>{new Date(event.timestamp).toLocaleString()}</span>
                </div>
                {event.payload ? (
                  <pre className="overflow-x-auto rounded-md bg-muted p-2 text-xs">
                    {JSON.stringify(event.payload, null, 2)}
                  </pre>
                ) : null}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </section>
  )
}
