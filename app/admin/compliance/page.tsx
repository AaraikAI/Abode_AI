import { requirePermissionFromSession } from "@/lib/auth/session"
import { listComplianceEvents, listConsentRecords, listForgetRequests } from "@/lib/data/compliance"
import { getOrgGeoPolicy } from "@/lib/auth/store"
import { ComplianceDashboard } from "@/components/admin/compliance-dashboard"

export default async function AdminCompliancePage() {
  const session = await requirePermissionFromSession("org:manage", { enforceDevice: true, enforceGeo: true })
  const orgId = session.user?.orgId ?? "demo-org"

  const [events, consents, forgetRequests, geoPolicy] = await Promise.all([
    listComplianceEvents(orgId, 100),
    listConsentRecords(orgId),
    listForgetRequests(orgId, 50),
    getOrgGeoPolicy(orgId),
  ])

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold text-foreground">Compliance & Privacy</h1>
          <p className="text-sm text-muted-foreground">
            Monitor audit activity, manage consent, and enforce geo policies for your organisation.
          </p>
        </div>
        <ComplianceDashboard
          initialEvents={events}
          initialConsents={consents}
          initialForgetRequests={forgetRequests}
          initialGeoPolicy={geoPolicy}
        />
      </div>
    </main>
  )
}
