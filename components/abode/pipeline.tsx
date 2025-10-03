import { SectionHeader } from "./section-header"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import type { AutomationStep } from "@/lib/platform-types"

interface AutomationPipelineProps {
  steps: AutomationStep[]
}

export function AutomationPipeline({ steps }: AutomationPipelineProps) {
  return (
    <section id="automation" className="space-y-8">
      <SectionHeader
        eyebrow="End-to-end automation"
        heading="A governed pipeline from intake to telemetry"
        description="Each phase runs on Airflow DAGs, Redis approvals, and Kubernetes GPU pools with compliance guardrails baked in."
      />

      <div className="grid gap-6 lg:grid-cols-[1.1fr_minmax(0,1fr)]">
        <Card className="border-border bg-card/60 p-6 shadow-sm">
          <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">
            <Badge variant="outline" className="border border-primary/30 bg-primary/10 text-primary">
              DAG orchestrated
            </Badge>
            <Badge variant="outline" className="border border-primary/30 bg-primary/5 text-primary">
              Hybrid approvals
            </Badge>
            <Badge variant="outline" className="border border-primary/30 bg-primary/5 text-primary">
              Observability native
            </Badge>
          </div>
          <p className="mt-6 text-base text-muted-foreground">
            Trigger pipelines from API calls, SDK scripts, or UI actions. Each step auto-registers metrics with Prometheus and sends structured logs to ELK with trace context for OpenTelemetry.
          </p>
        </Card>

        <div className="relative overflow-hidden">
          <div className="flex flex-col gap-4 md:flex-row md:items-stretch md:overflow-x-auto">
            {steps.map((step, index) => (
              <Card
                key={step.name}
                className="min-w-[220px] flex-1 border-border bg-card/70 p-5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Step {index + 1}
                  </h3>
                  <Badge className="border border-border/50 bg-muted text-xs text-foreground">
                    {step.dependencies}
                  </Badge>
                </div>
                <p className="mt-4 text-lg font-semibold text-foreground">
                  {step.name}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
