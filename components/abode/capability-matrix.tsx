import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SectionHeader } from "./section-header"
import type { CapabilitySection } from "@/lib/platform-types"

interface CapabilityMatrixProps {
  sections: CapabilitySection[]
}

export function CapabilityMatrix({ sections }: CapabilityMatrixProps) {
  return (
    <section id="capabilities" className="space-y-8">
      <SectionHeader
        eyebrow="AI capabilities"
        heading="Design-to-manufacturing depth out of the box"
        description="Generative tools, rendering pipelines, collaboration patterns, and trust controls inherit the same governance fabric."
      />

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {sections.map((section) => (
          <Card key={section.title} className="h-full border-border bg-card/60 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-foreground">{section.title}</h3>
            <ul className="mt-4 space-y-4 text-sm text-muted-foreground">
              {section.items.map((item) => (
                <li key={item.name}>
                  <p className="font-medium text-foreground">{item.name}</p>
                  <p>{item.description}</p>
                  {item.badge ? (
                    <Badge className="mt-2 border border-primary/20 bg-primary/10 text-xs text-primary">
                      {item.badge}
                    </Badge>
                  ) : null}
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </section>
  )
}
