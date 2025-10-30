import { IntegrationsHub } from "@/components/integrations/integrations-hub"

export default function IntegrationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Integrations</h1>
        <p className="text-sm text-muted-foreground">Wire AbodeAI into your team’s collaboration and automation stack.</p>
      </div>
      <IntegrationsHub />
    </div>
  )
}
