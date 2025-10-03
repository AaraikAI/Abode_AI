import { requireSession } from "@/lib/auth/session"
import { listPipelines } from "@/lib/data/pipelines"
import { fetchDagRuns } from "@/lib/services/airflow"
import { ProjectsDashboard } from "@/components/orchestration/projects-dashboard"

export default async function ProjectsPage() {
  const session = await requireSession({ enforceDevice: true, enforceGeo: true })
  const orgId = session.user?.orgId ?? "demo-org"
  const pipelineRecords = listPipelines(orgId)
  const runs = await fetchDagRuns(orgId, 50)

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-10">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold text-foreground">Projects & DAG runs</h1>
          <p className="text-sm text-muted-foreground">
            Monitor orchestration progress, approve gated steps, and coordinate retries across AI-driven pipelines.
          </p>
        </div>
        <ProjectsDashboard initialRuns={runs} pipelines={pipelineRecords} />
      </div>
    </main>
  )
}
