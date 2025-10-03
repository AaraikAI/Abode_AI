import { SectionHeader } from "./section-header"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Link2 } from "lucide-react"
import type { IntegrationCategory } from "@/lib/platform-types"

interface IntegrationsProps {
  catalog: IntegrationCategory[]
}

export function Integrations({ catalog }: IntegrationsProps) {
  return (
    <section id="integrations" className="space-y-8">
      <SectionHeader
        eyebrow="Ecosystem"
        heading="APIs, SDKs, and partner integrations ready for automation"
        description="Use OAuth to connect Slack, Figma, Adobe, and ERPs while rate-limiting through Redis and Zapier-compatible webhooks."
      />

      <div className="grid gap-6 md:grid-cols-2">
        {catalog.map((category) => (
          <Card key={category.title} className="border-border bg-card/60 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">
                {category.title}
              </h3>
              <Badge variant="outline" className="border-border/60 text-xs">
                <Link2 className="mr-1 size-3" aria-hidden />
                Connected
              </Badge>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {category.items.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-border/60 bg-muted px-3 py-1 text-sm text-muted-foreground"
                >
                  {item}
                </span>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </section>
  )
}
