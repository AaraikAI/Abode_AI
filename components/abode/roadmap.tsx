import { SectionHeader } from "./section-header"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { RoadmapItem } from "@/lib/platform-types"

interface RoadmapProps {
  roadmap: RoadmapItem[]
}

export function Roadmap({ roadmap }: RoadmapProps) {
  return (
    <section id="roadmap" className="space-y-8">
      <SectionHeader
        eyebrow="Roadmap"
        heading="Phased delivery to enterprise launch"
        description="Each phase ships measurable outcomes across retention, manufacturing throughput, and platform scale."
      />

      <div className="grid gap-6 md:grid-cols-2">
        {roadmap.map((item) => (
          <Card key={item.phase} className="border-border bg-card/60 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
                  {item.quarter}
                </p>
                <h3 className="mt-2 text-xl font-semibold text-foreground">
                  {item.phase}
                </h3>
              </div>
              <Badge className="border border-primary/30 bg-primary/10 text-xs text-primary">
                On track
              </Badge>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">{item.focus}</p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {item.metrics.map((metric) => (
                <li key={metric} className="flex items-center gap-2">
                  <span className="flex size-1.5 rounded-full bg-primary" aria-hidden />
                  <span>{metric}</span>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </section>
  )
}
