import { supabase } from "@/lib/db/supabase"
import { db } from "@/lib/db/sqlite"

export interface RenderMetric {
  day: string
  renders: number
  totalCo2: number
  totalEnergy: number
}

export interface AgentLatencyMetric {
  pipelineId: string
  pipelineName: string
  avgAttempts: number
  runningTasks: number
  awaitingApproval: number
}

export interface CreditConsumptionMetric {
  month: string
  credits: number
  spendCents: number
}

export interface AnalyticsOverview {
  renderThroughput: RenderMetric[]
  agentLatency: AgentLatencyMetric[]
  creditConsumption: CreditConsumptionMetric[]
  totals: {
    renders: number
    co2Kg: number
    totalCredits: number
    spendCents: number
  }
}

export async function loadAnalyticsOverview(orgId: string): Promise<AnalyticsOverview> {
  const [renderThroughput, creditConsumption] = await Promise.all([
    loadRenderMetrics(orgId),
    loadCreditMetrics(orgId),
  ])

  const agentLatency = loadAgentMetrics(orgId)

  const totals = {
    renders: renderThroughput.reduce((sum, metric) => sum + metric.renders, 0),
    co2Kg: renderThroughput.reduce((sum, metric) => sum + metric.totalCo2, 0),
    totalCredits: creditConsumption.reduce((sum, metric) => sum + metric.credits, 0),
    spendCents: creditConsumption.reduce((sum, metric) => sum + metric.spendCents, 0),
  }

  return {
    renderThroughput,
    agentLatency,
    creditConsumption,
    totals,
  }
}

async function loadRenderMetrics(orgId: string): Promise<RenderMetric[]> {
  const { data, error } = await supabase
    .from("sustainability_logs")
    .select("created_at, co2_kg, energy_kwh")
    .eq("org_id", orgId)

  if (error) {
    throw new Error(`Failed to load render metrics: ${error.message}`)
  }

  const byDay = new Map<string, RenderMetric>()
  for (const row of data ?? []) {
    const dayKey = row.created_at ? row.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10)
    const entry = byDay.get(dayKey) ?? { day: dayKey, renders: 0, totalCo2: 0, totalEnergy: 0 }
    entry.renders += 1
    entry.totalCo2 += Number(row.co2_kg ?? 0)
    entry.totalEnergy += Number(row.energy_kwh ?? 0)
    byDay.set(dayKey, entry)
  }

  return Array.from(byDay.values()).sort((a, b) => a.day.localeCompare(b.day))
}

function loadAgentMetrics(orgId: string): AgentLatencyMetric[] {
  const stmt = db.prepare(
    `SELECT r.pipeline_id as pipelineId,
            p.name as pipelineName,
            AVG(t.attempts) as avgAttempts,
            SUM(CASE WHEN t.status = 'running' THEN 1 ELSE 0 END) as runningTasks,
            SUM(CASE WHEN t.status = 'awaiting_approval' THEN 1 ELSE 0 END) as awaitingApproval
     FROM dag_runs r
     JOIN pipelines p ON p.id = r.pipeline_id
     JOIN dag_run_tasks t ON t.run_id = r.id
     WHERE r.org_id = ?
     GROUP BY r.pipeline_id, pipelineName
     ORDER BY runningTasks DESC
     LIMIT 10`
  )

  const rows = stmt.all(orgId) as Array<{
    pipelineId: string
    pipelineName: string
    avgAttempts: number
    runningTasks: number
    awaitingApproval: number
  }>

  return rows.map((row) => ({
    pipelineId: row.pipelineId,
    pipelineName: row.pipelineName ?? "Unknown",
    avgAttempts: Number(row.avgAttempts ?? 0),
    runningTasks: Number(row.runningTasks ?? 0),
    awaitingApproval: Number(row.awaitingApproval ?? 0),
  }))
}

async function loadCreditMetrics(orgId: string): Promise<CreditConsumptionMetric[]> {
  const { data, error } = await supabase
    .from("credit_transactions")
    .select("created_at, credits, amount_cents")
    .eq("org_id", orgId)

  if (error) {
    throw new Error(`Failed to load credit metrics: ${error.message}`)
  }

  const byMonth = new Map<string, CreditConsumptionMetric>()
  for (const row of data ?? []) {
    const date = row.created_at ? new Date(row.created_at) : new Date()
    const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`
    const entry = byMonth.get(key) ?? { month: key, credits: 0, spendCents: 0 }
    entry.credits += Number(row.credits ?? 0)
    entry.spendCents += Number(row.amount_cents ?? 0)
    byMonth.set(key, entry)
  }

  return Array.from(byMonth.values()).sort((a, b) => a.month.localeCompare(b.month))
}
