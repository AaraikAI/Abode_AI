import { SectionHeader } from "./section-header"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { PricingTier } from "@/lib/platform-types"

interface PricingProps {
  tiers: PricingTier[]
}

export function Pricing({ tiers }: PricingProps) {
  return (
    <section id="pricing" className="space-y-8">
      <SectionHeader
        eyebrow="Billing"
        heading="Credit-based plans that scale from freelancers to enterprises"
        description="Stripe Usage API powers credits, rollover logic, and add-ons. Choose a tier or integrate your own billing via API."
      />

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {tiers.map((tier) => (
          <Card
            key={tier.name}
            className={`flex h-full flex-col justify-between gap-6 border-border p-6 shadow-sm ${tier.mostPopular ? "border-primary/60 shadow-lg" : ""}`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-foreground">{tier.name}</h3>
                {tier.mostPopular ? (
                  <Badge className="border border-primary/30 bg-primary/10 text-xs text-primary">
                    Most popular
                  </Badge>
                ) : null}
              </div>
              <p className="text-3xl font-semibold text-foreground">{tier.price}</p>
              <p className="text-sm text-muted-foreground">{tier.credits}</p>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <span className="flex size-2 rounded-full bg-primary/60" aria-hidden />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Button className="w-full" variant={tier.mostPopular ? "default" : "outline"}>
              {tier.cta}
            </Button>
          </Card>
        ))}
      </div>
    </section>
  )
}
