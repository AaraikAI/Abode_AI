import { Suspense } from "react"

import { requireSession } from "@/lib/auth/session"
import { loadAnalyticsOverview } from "@/lib/data/analytics"
import { AnalyticsDashboard, AnalyticsSkeleton } from "@/components/analytics/analytics-dashboard"

export default async function AnalyticsPage() {
  const session = await requireSession({ enforceDevice: true, enforceGeo: true })
  const orgId = session.user?.orgId ?? "demo-org"
  const initial = await loadAnalyticsOverview(orgId)

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10">
        <Suspense fallback={<AnalyticsSkeleton />}>
          <AnalyticsDashboard initial={initial} />
        </Suspense>
      </div>
    </main>
  )
}
