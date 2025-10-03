import { requireSession } from "@/lib/auth/session"
import { listBoms } from "@/lib/data/manufacturing"
import ManufacturingDashboard from "@/components/manufacturing/manufacturing-dashboard"

export default async function ManufacturingPage() {
  const session = await requireSession({ enforceDevice: true, enforceGeo: true })
  const orgId = session.user?.orgId ?? "demo-org"
  const boms = await listBoms(orgId, 20)

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10">
        <ManufacturingDashboard initialBoms={boms} />
      </div>
    </main>
  )
}
