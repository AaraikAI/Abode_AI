"use client"

import useSWR from "swr"
import { BarChart3, Database, Gauge, Leaf } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import type { AnalyticsOverview } from "@/lib/data/analytics"

async function fetcher<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.error || "Analytics request failed")
  }
  return response.json() as Promise<T>
}

export function AnalyticsDashboard({ initial }: { initial: AnalyticsOverview }) {
  const { data, isLoading, mutate } = useSWR<{ overview: AnalyticsOverview }>(
    "/api/analytics/overview",
    fetcher,
    {
      fallbackData: { overview: initial },
    }
  )

  const overview = data?.overview ?? initial

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card/80 p-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Operations analytics</h1>
          <p className="text-sm text-muted-foreground">Render throughput, agent latency, and credit trends.</p>
        </div>
        <Button variant="outline" onClick={() => mutate()} disabled={isLoading}>
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Lifetime renders"
          icon={<Leaf className="h-5 w-5" />}
          value={overview.totals.renders.toLocaleString()}
          subtitle={`${overview.totals.co2Kg.toFixed(2)} kg CO₂`}
        />
        <MetricCard
          title="Active agent load"
          icon={<Gauge className="h-5 w-5" />}
          value={overview.agentLatency.reduce((sum, item) => sum + item.runningTasks, 0).toString()}
          subtitle={`${overview.agentLatency.length} pipelines reporting`}
        />
        <MetricCard
          title="Credits consumed"
          icon={<Database className="h-5 w-5" />}
          value={overview.totals.totalCredits.toLocaleString()}
          subtitle={`${(overview.totals.spendCents / 100).toLocaleString(undefined, {
            style: "currency",
            currency: "USD",
          })} spend`}
        />
        <MetricCard
          title="Approval backlog"
          icon={<BarChart3 className="h-5 w-5" />}
          value={overview.agentLatency.reduce((sum, item) => sum + item.awaitingApproval, 0).toString()}
          subtitle="Tasks awaiting manual review"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <Card className="border border-border/60 bg-card/80">
          <CardHeader>
            <CardTitle className="text-base">Render throughput</CardTitle>
            <CardDescription>Daily render counts and associated emissions.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-72">
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 bg-card text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left">Day</th>
                    <th className="px-3 py-2 text-right">Renders</th>
                    <th className="px-3 py-2 text-right">CO₂ (kg)</th>
                    <th className="px-3 py-2 text-right">Energy (kWh)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {overview.renderThroughput.map((metric) => (
                    <tr key={metric.day}>
                      <td className="px-3 py-2 text-left text-foreground">{metric.day}</td>
                      <td className="px-3 py-2 text-right">{metric.renders}</td>
                      <td className="px-3 py-2 text-right">{metric.totalCo2.toFixed(3)}</td>
                      <td className="px-3 py-2 text-right">{metric.totalEnergy.toFixed(3)}</td>
                    </tr>
                  ))}
                  {!overview.renderThroughput.length ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-4 text-center text-muted-foreground">
                        No render activity recorded yet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="border border-border/60 bg-card/80">
          <CardHeader>
            <CardTitle className="text-base">Agent latency hotspots</CardTitle>
            <CardDescription>Identify pipelines with high retry or approval wait time.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-72">
              <div className="space-y-3 text-sm">
                {overview.agentLatency.map((metric) => (
                  <div key={metric.pipelineId} className="rounded-xl border border-border/40 bg-background/60 p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">{metric.pipelineName}</span>
                      <span className="text-xs text-muted-foreground">avg attempts {metric.avgAttempts.toFixed(2)}</span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Running tasks: {metric.runningTasks} • Awaiting approval: {metric.awaitingApproval}
                    </div>
                  </div>
                ))}
                {!overview.agentLatency.length ? (
                  <p className="text-xs text-muted-foreground">No DAG activity yet.</p>
                ) : null}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-border/60 bg-card/80">
        <CardHeader>
          <CardTitle className="text-base">Credit consumption</CardTitle>
          <CardDescription>Monthly usage blended with Stripe Usage API transactions.</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-56">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 bg-card text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left">Month</th>
                  <th className="px-3 py-2 text-right">Credits</th>
                  <th className="px-3 py-2 text-right">Spend (USD)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {overview.creditConsumption.map((metric) => (
                  <tr key={metric.month}>
                    <td className="px-3 py-2 text-left text-foreground">{metric.month}</td>
                    <td className="px-3 py-2 text-right">{metric.credits.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right">
                      {(metric.spendCents / 100).toLocaleString(undefined, {
                        style: "currency",
                        currency: "USD",
                      })}
                    </td>
                  </tr>
                ))}
                {!overview.creditConsumption.length ? (
                  <tr>
                    <td colSpan={3} className="px-3 py-4 text-center text-muted-foreground">
                      No credit transactions available.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}

function MetricCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string
  value: string
  subtitle?: string
  icon: React.ReactNode
}) {
  return (
    <Card className="border border-border/60 bg-card/80">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold text-foreground">{value}</div>
        {subtitle ? <p className="text-xs text-muted-foreground">{subtitle}</p> : null}
      </CardContent>
    </Card>
  )
}

export function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-16 rounded-2xl" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[...Array(4)].map((_, index) => (
          <Skeleton key={index} className="h-24 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-80 rounded-2xl" />
      <Skeleton className="h-56 rounded-2xl" />
    </div>
  )
}
