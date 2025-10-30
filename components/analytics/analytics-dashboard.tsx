"use client"

import { useMemo } from "react"
import useSWR from "swr"
import { Download, LineChart, Radar, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface TelemetryEvent {
  id: string
  eventType: string
  createdAt: string
  source?: string | null
  payload?: Record<string, unknown>
}

interface SustainabilityPoint {
  id: string
  targetName?: string | null
  targetValue?: number | null
  actualValue: number
  unit: string
  collectedAt: string
}

interface TrendPoint {
  timestamp: string
  value: number
  label: string
}

interface AnalyticsResponse {
  events: TelemetryEvent[]
  sustainability: SustainabilityPoint[]
  trendSeries: TrendPoint[]
  anomalies: TelemetryEvent[]
}

async function fetcher<T>(url: string) {
  const response = await fetch(url)
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.error || "Request failed")
  }
  return response.json() as Promise<T>
}

export function AnalyticsDashboard() {
  const { data, mutate, isLoading } = useSWR<AnalyticsResponse>("/api/analytics/overview", fetcher, {
    refreshInterval: 60_000,
  })

  const sustainabilityTrend = useMemo(() => {
    const buckets: Record<string, { actual: number; target: number; unit: string }> = {}
    data?.sustainability.forEach((point) => {
      const key = new Date(point.collectedAt).toISOString().slice(0, 10)
      const bucket = buckets[key] ?? { actual: 0, target: 0, unit: point.unit }
      bucket.actual += point.actualValue
      bucket.target += point.targetValue ?? 0
      buckets[key] = bucket
    })
    return Object.entries(buckets).map(([date, bucket]) => ({ date, ...bucket }))
  }, [data?.sustainability])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Analytics & observability</h1>
          <p className="text-sm text-muted-foreground">
            Mixpanel/Segment events, sustainability tracking, and OpenTelemetry traces scaffolded for production.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => mutate()} className="gap-1" disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <Button variant="secondary" size="sm" className="gap-1">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="telemetry">Telemetry feed</TabsTrigger>
          <TabsTrigger value="sustainability">Sustainability</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="border border-border/60 bg-card/80">
              <CardHeader>
                <CardTitle className="text-base">Trend preview</CardTitle>
                <CardDescription>Latency sample from mock Prometheus metrics.</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <LineChart className="h-8 w-8 text-primary" />
                <p className="mt-2">Series points: {data?.trendSeries.length ?? 0}</p>
                <p className="text-xs">Replace with real Prometheus query once connected.</p>
              </CardContent>
            </Card>

            <Card className="border border-border/60 bg-card/80">
              <CardHeader>
                <CardTitle className="text-base">Detected anomalies</CardTitle>
                <CardDescription>Threshold: 25% above moving mean.</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <Radar className="h-8 w-8 text-destructive" />
                <p className="mt-2">Anomalies: {data?.anomalies.length ?? 0}</p>
                <p className="text-xs">Hook into ELK/OpenTelemetry alerts to populate automatically.</p>
              </CardContent>
            </Card>

            <Card className="border border-border/60 bg-card/80">
              <CardHeader>
                <CardTitle className="text-base">Checkly SLOs</CardTitle>
                <CardDescription>Integrate API checks for render latency & auth flows.</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>Environment variable <code>CHECKLY_API_KEY</code> pending.</p>
                <p className="text-xs">Use Checkly CLI to sync checks and surface status here.</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="telemetry" className="space-y-3">
          <Card className="border border-border/60 bg-card/80">
            <CardHeader>
              <CardTitle className="text-base">Event stream</CardTitle>
              <CardDescription>Latest Mixpanel/Segment/OpenTelemetry events captured via Supabase.</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64 pr-4">
                <div className="space-y-2 text-xs text-muted-foreground">
                  {data?.events.map((event) => (
                    <div key={event.id} className="rounded-lg border border-border/40 bg-background/60 p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground">{event.eventType}</span>
                        <span>{new Date(event.createdAt).toLocaleTimeString()}</span>
                      </div>
                      {event.source ? <p className="text-[11px]">Source: {event.source}</p> : null}
                      {event.payload ? <pre className="mt-2 overflow-x-auto text-[11px]">{JSON.stringify(event.payload, null, 2)}</pre> : null}
                    </div>
                  ))}
                  {!data?.events?.length ? <p>No telemetry captured yet.</p> : null}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sustainability" className="space-y-4">
          <Card className="border border-border/60 bg-card/80">
            <CardHeader>
              <CardTitle className="text-base">Targets vs actuals</CardTitle>
              <CardDescription>Aggregate CodeCarbon data compared to configured targets.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-muted-foreground">
              {sustainabilityTrend.map((row) => (
                <div key={row.date} className="rounded-lg border border-border/40 bg-background/60 p-3">
                  <div className="flex items-center justify-between text-sm text-foreground">
                    <span>{row.date}</span>
                    <span>
                      Actual: {row.actual.toFixed(2)} {row.unit} • Target: {row.target.toFixed(2)} {row.unit}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded bg-muted">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${Math.min(100, (row.actual / Math.max(row.target, 1)) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
              {!sustainabilityTrend.length ? <p>No sustainability metrics recorded yet.</p> : null}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
