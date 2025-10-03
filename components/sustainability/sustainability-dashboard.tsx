"use client"

import { useMemo } from "react"
import useSWR from "swr"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

interface SustainabilityLog {
  id: string
  renderId: string
  co2Kg: number
  energyKwh?: number | null
  durationSeconds?: number | null
  createdAt: string
}

interface LedgerResponse {
  logs: SustainabilityLog[]
  summary: {
    totalRuns: number
    totalCo2: number
    totalEnergy: number
    totalDuration: number
    avgCo2: number
    trend: Array<{ timestamp: string; co2Kg: number }>
  }
}

async function fetcher<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.error || "Request failed")
  }
  return response.json() as Promise<T>
}

export default function SustainabilityDashboard({ initial }: { initial: LedgerResponse }) {
  const { data, isLoading, mutate } = useSWR<LedgerResponse>("/api/sustainability/ledger", fetcher, {
    fallbackData: initial,
  })

  const summary = data?.summary
  const logs = data?.logs ?? []

  const intensity = useMemo(() => {
    if (!summary || !summary.totalRuns) return 0
    return summary.totalCo2 / summary.totalRuns
  }, [summary])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card/80 p-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Sustaindash</h1>
          <p className="text-sm text-muted-foreground">Track render emissions, variance, and trends vs target.</p>
        </div>
        <Button variant="outline" className="gap-1" onClick={() => mutate()} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Total renders" value={summary?.totalRuns ?? 0} suffix="runs" />
        <MetricCard title="CO₂ emitted" value={(summary?.totalCo2 ?? 0).toFixed(3)} suffix="kg" />
        <MetricCard title="Energy used" value={(summary?.totalEnergy ?? 0).toFixed(3)} suffix="kWh" />
        <MetricCard title="Avg CO₂ per render" value={intensity.toFixed(3)} suffix="kg" trendNote="Target < 0.18 kg" />
      </div>

      <Card className="border border-border/60 bg-card/70">
        <CardHeader>
          <CardTitle className="text-base">Recent renders</CardTitle>
          <CardDescription>Chronological ledger for CodeCarbon entries.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[360px]">
            <div className="divide-y divide-border/40 text-sm">
              {logs.map((log) => (
                <div key={log.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <div className="font-medium text-foreground">{new Date(log.createdAt).toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">
                      Render {log.renderId.slice(0, 6)} • {log.durationSeconds ?? "--"}s • {log.energyKwh?.toFixed(3) ?? "--"} kWh
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-green-600">{log.co2Kg.toFixed(3)} kg</span>
                </div>
              ))}
              {!logs.length ? <p className="px-4 py-6 text-xs text-muted-foreground">No sustainability records yet.</p> : null}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}

function MetricCard({ title, value, suffix, trendNote }: { title: string; value: number | string; suffix?: string; trendNote?: string }) {
  return (
    <Card className="border border-border/60 bg-card/70">
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl text-foreground">
          {value}
          {suffix ? <span className="text-lg text-muted-foreground"> {suffix}</span> : null}
        </CardTitle>
      </CardHeader>
      {trendNote ? <CardContent className="text-xs text-muted-foreground">{trendNote}</CardContent> : null}
    </Card>
  )
}
