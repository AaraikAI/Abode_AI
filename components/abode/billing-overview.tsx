import Link from "next/link"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { BillingSummary } from "@/lib/platform-types"
import { config } from "@/lib/config"

interface BillingOverviewProps {
  summary: BillingSummary
}

export function BillingOverview({ summary }: BillingOverviewProps) {
  const utilization = Math.round(
    ((summary.includedCredits - summary.creditsRemaining) / summary.includedCredits) * 100
  )

  return (
    <section className="space-y-6" aria-label="Billing overview">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xl font-semibold">Credit usage & alerts</h3>
          <p className="text-sm text-muted-foreground">
            Remaining credits are synced directly from Stripe Usage billing.
          </p>
        </div>
        {config.stripePortalUrl ? (
          <Button asChild size="sm">
            <Link href={config.stripePortalUrl} target="_blank" rel="noreferrer">
              Manage billing
            </Link>
          </Button>
        ) : null}
      </div>

      <Card className="border-border bg-card/60 p-6 shadow-sm">
        <div className="grid gap-6 md:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Credits remaining</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">{summary.creditsRemaining}</p>
            <p className="text-xs text-muted-foreground">
              {summary.rolloverCredits} rollover credits included
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Utilization</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">{utilization}%</p>
            <p className="text-xs text-muted-foreground">
              Cycle resets {new Date(summary.billingCycleEndsAt).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Current tier</p>
            <p className="mt-2 text-2xl font-semibold text-foreground capitalize">{summary.tier}</p>
            <p className="text-xs text-muted-foreground">
              {summary.includedCredits} credits included per cycle
            </p>
          </div>
        </div>

        {summary.alerts.length > 0 ? (
          <div className="mt-6 space-y-3">
            {summary.alerts.map((alert, index) => (
              <div
                key={`${alert.type}-${index}`}
                className="flex flex-col gap-2 rounded-lg border border-border/60 bg-muted/40 p-3 text-sm text-muted-foreground"
              >
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-border/60 uppercase tracking-[0.2em]">
                    {alert.type}
                  </Badge>
                  <span className="text-foreground">{alert.message}</span>
                </div>
                {alert.link ? (
                  <Link
                    href={alert.link}
                    className="text-xs font-semibold text-primary hover:underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    View details
                  </Link>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
      </Card>
    </section>
  )
}
