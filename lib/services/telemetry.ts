import type { TelemetryEvent } from "@/lib/data/analytics"
import { recordTelemetryEvent } from "@/lib/data/analytics"

type TelemetryDestination = "prometheus" | "grafana" | "elk" | "mixpanel" | "segment"

const MIXPANEL_TOKEN = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN
const SEGMENT_WRITE_KEY = process.env.SEGMENT_WRITE_KEY

export async function emitTelemetry(params: {
  orgId?: string
  eventType: string
  source?: TelemetryDestination
  payload?: Record<string, unknown>
  traceId?: string
  spanId?: string
}) {
  await recordTelemetryEvent({
    orgId: params.orgId,
    eventType: params.eventType,
    source: params.source,
    payload: params.payload,
    traceId: params.traceId,
    spanId: params.spanId,
  })

  if (typeof window !== "undefined") {
    if (MIXPANEL_TOKEN && (window as any).mixpanel) {
      ;(window as any).mixpanel.track(params.eventType, params.payload)
    }
    if (SEGMENT_WRITE_KEY && (window as any).analytics?.track) {
      ;(window as any).analytics.track(params.eventType, params.payload)
    }
  }
}

export function mockTrendSeries(): Array<{ timestamp: string; value: number; label: string }> {
  const now = Date.now()
  return Array.from({ length: 12 }).map((_, index) => {
    const timestamp = new Date(now - index * 3600 * 1000).toISOString()
    const value = Number((Math.random() * 0.4 + 0.8).toFixed(2))
    return { timestamp, value, label: "render_latency_p95" }
  })
}

export function detectAnomalies(series: Array<{ timestamp: string; value: number }>): TelemetryEvent[] {
  const mean = series.reduce((sum, point) => sum + point.value, 0) / Math.max(series.length, 1)
  const anomalies = series.filter((point) => point.value > mean * 1.25)
  return anomalies.map((point) => ({
    id: `${point.timestamp}`,
    eventType: "anomaly",
    createdAt: point.timestamp,
    source: "analytics-detect",
    payload: { metric: "render_latency_p95", value: point.value, mean },
  }))
}
