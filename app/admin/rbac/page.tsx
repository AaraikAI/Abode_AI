import { requirePermissionFromSession } from "@/lib/auth/session"
import { listOrgMembers } from "@/lib/data/policies"
import { RbacDashboard } from "@/components/admin/rbac-dashboard"

export default async function AdminRbacPage() {
  const session = await requirePermissionFromSession("org:manage", { enforceDevice: true, enforceGeo: true })
  const orgId = session.user?.orgId ?? "demo-org"
  const members = await listOrgMembers(orgId)

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold text-foreground">Role-based access</h1>
          <p className="text-sm text-muted-foreground">Assign roles, review permissions, and manage organisation policies.</p>
        </div>
        <RbacDashboard initialMembers={members} />
      </div>
    </main>
  )
}
