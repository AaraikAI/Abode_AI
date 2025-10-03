import { SectionHeader } from "./section-header"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Cpu, Network, Cloud, Database } from "lucide-react"

const architectureStack = [
  {
    title: "Frontend",
    icon: Cpu,
    items: [
      "Next.js 14 App Router, React 18, Tailwind",
      "Three.js + WebGPU viewport, WebXR handoff",
      "Service worker PWA, Firebase push notifications",
      "Accessibility with WCAG 2.2 AA + voice commands"
    ],
    badge: "PWA"
  },
  {
    title: "Backend & APIs",
    icon: Network,
    items: [
      "FastAPI microservices exposed via REST & gRPC",
      "Redis for sessions, queues, and collaborative state",
      "Airflow for DAG orchestration with Celery workers",
      "Socket.io for real-time cursors and approvals"
    ],
    badge: "Hybrid AI-human"
  },
  {
    title: "Data & ML",
    icon: Database,
    items: [
      "Postgres + PostGIS core, MongoDB logs, S3 assets",
      "Hugging Face Transformers with low-code fine-tuning",
      "Stable Diffusion + ESRGAN render pipelines",
      "CodeCarbon + Evidently for bias and sustainability"
    ],
    badge: "GPU optimized"
  },
  {
    title: "Platform & DevOps",
    icon: Cloud,
    items: [
      "Terraform + ArgoCD IaC, GitHub Actions blue/green",
      "Kubernetes GPU autoscaling with spot instances",
      "Cloudflare CDN, multi-region failover, AWS PITR",
      "Gremlin chaos, k6 load, OWASP ZAP security tests"
    ],
    badge: "SRE ready"
  }
]

export function Architecture() {
  return (
    <section id="architecture" className="space-y-8">
      <SectionHeader
        eyebrow="Reference architecture"
        heading="DevOps ready from day one"
        description="Modular services, GPU acceleration, and compliance guardrails ship as defaults so teams can launch confidently."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {architectureStack.map((layer) => (
          <Card key={layer.title} className="border-border bg-card/60 p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <layer.icon className="size-5 text-primary" aria-hidden />
              <h3 className="text-lg font-semibold text-foreground">{layer.title}</h3>
              <Badge className="border border-primary/30 bg-primary/10 text-xs text-primary">
                {layer.badge}
              </Badge>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {layer.items.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="flex size-1.5 rounded-full bg-primary" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </section>
  )
}
