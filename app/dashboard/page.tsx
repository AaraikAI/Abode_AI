import { redirect } from "next/navigation"

import { PipelineBuilder } from "@/components/orchestration/pipeline-builder"
import { PipelineTable } from "@/components/orchestration/pipeline-table"
import { AuditFeed } from "@/components/orchestration/audit-feed"
import { UserMenu } from "@/components/auth/user-menu"
import { requireSession } from "@/lib/auth/session"
import { listPipelines } from "@/lib/data/pipelines"

export default async function DashboardPage() {
  try {
    const session = await requireSession({ enforceDevice: true, enforceGeo: true })
    const orgId = session.user?.orgId ?? "demo-org"
    const pipelines = listPipelines(orgId)

    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-10">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h1 className="text-3xl font-semibold text-foreground">Pipeline orchestration</h1>
              <p className="text-sm text-muted-foreground">
                Manage DAG executions, approvals, and agent assignments for org {orgId}.
              </p>
            </div>
            <UserMenu />
          </div>

          <PipelineBuilder onCreated={() => {}} />
          <PipelineTable pipelines={pipelines} />
          <AuditFeed orgId={orgId} />
        </div>
      </main>
    )
  } catch {
    redirect("/auth/sign-in")
  }
}
