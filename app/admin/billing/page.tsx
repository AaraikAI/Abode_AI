import { BillingAdmin } from "@/components/admin/billing-admin"

export default function BillingAdminPage() {
  // In a real implementation, derive orgId from session or params.
  const orgId = "demo-org"
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Billing controls</h1>
        <p className="text-sm text-muted-foreground">Manage plans, credits, and upcoming Stripe integrations.</p>
      </div>
      <BillingAdmin orgId={orgId} />
    </div>
  )
}
