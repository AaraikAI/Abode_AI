import { requireSession } from "@/lib/auth/session"
import { listSustainabilityLogs } from "@/lib/data/sustainability"
import SustainabilityDashboard from "@/components/sustainability/sustainability-dashboard"

export default async function SustainabilityPage() {
  const session = await requireSession({ enforceDevice: true, enforceGeo: true })
  const orgId = session.user?.orgId ?? "demo-org"
  const logs = await listSustainabilityLogs(orgId, 50)

  const totalCo2 = logs.reduce((sum, log) => sum + log.co2Kg, 0)
  const totalEnergy = logs.reduce((sum, log) => sum + (log.energyKwh ?? 0), 0)
  const totalDuration = logs.reduce((sum, log) => sum + (log.durationSeconds ?? 0), 0)

  const initial = {
    logs,
    summary: {
      totalRuns: logs.length,
      totalCo2,
      totalEnergy,
      totalDuration,
      avgCo2: logs.length ? totalCo2 / logs.length : 0,
      trend: logs.slice(0, 10).map((log) => ({ timestamp: log.createdAt, co2Kg: log.co2Kg })),
    },
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10">
        <SustainabilityDashboard initial={initial} />
      </div>
    </main>
  )
}
