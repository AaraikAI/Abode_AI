"use client"

import { useEffect, useState, useTransition } from "react"
import useSWR from "swr"
import { ArrowUpRight, RefreshCw, ShieldCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"

interface BillingPlan {
  id: string
  slug: string
  name: string
  description?: string | null
  monthlyPriceCents: number
  annualPriceCents?: number | null
  includedCredits: number
  features: Record<string, unknown>
}

interface CreditTransaction {
  id: string
  delta: number
  balance: number
  reason?: string | null
  metadata?: Record<string, unknown> | null
  created_at: string
}

interface AdminBillingProps {
  orgId: string
}

async function fetcher<T>(url: string) {
  const response = await fetch(url)
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.error || "Request failed")
  }
  return response.json() as Promise<T>
}

export function BillingAdmin({ orgId }: AdminBillingProps) {
  const { toast } = useToast()
  const [enableAutoUpgrade, setEnableAutoUpgrade] = useState(false)
  const [isUpdating, startTransition] = useTransition()

  const { data: planData, isLoading: plansLoading } = useSWR<{ plans: BillingPlan[] }>("/api/billing/plans", fetcher)
  const { data: creditData, mutate: refreshCredits } = useSWR<{ transactions: CreditTransaction[] }>(
    `/api/internal/billing/${orgId}/credits`,
    fetcher
  )

  useEffect(() => {
    const stored = localStorage.getItem("billing.autoUpgrade")
    if (stored) {
      setEnableAutoUpgrade(stored === "true")
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("billing.autoUpgrade", String(enableAutoUpgrade))
  }, [enableAutoUpgrade])

  const handleMockCheckout = (planSlug: string) => {
    startTransition(async () => {
      try {
        const response = await fetch("/api/billing/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planSlug }),
        })
        if (!response.ok) {
          const body = await response.json().catch(() => ({}))
          throw new Error(body.error || "Checkout failed")
        }
        const payload = (await response.json()) as { session: { url: string } }
        toast({ title: "Checkout initiated", description: "Opening Stripe checkout session (mock/test mode)." })
        if (payload.session?.url) {
          window.open(payload.session.url, "_blank")
        }
      } catch (error) {
        toast({ title: "Checkout failed", description: (error as Error).message, variant: "destructive" })
      }
    })
  }

  const handleRefreshCredits = () => {
    void refreshCredits()
    toast({ title: "Usage refreshed" })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <Card className="border border-border/60 bg-card/80">
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Plans & add-ons</CardTitle>
            <CardDescription>Select a plan to simulate upgrade or downgrade flows.</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefreshCredits} className="gap-1">
            <RefreshCw className="h-4 w-4" /> Refresh usage
          </Button>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[360px] pr-4">
            <div className="grid gap-4">
              {plansLoading ? <p className="text-sm text-muted-foreground">Loading plans…</p> : null}
              {planData?.plans.map((plan) => (
                <div key={plan.id} className="rounded-xl border border-border/50 bg-background/60 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{plan.name}</p>
                      <p className="text-xs text-muted-foreground">{plan.description}</p>
                    </div>
                    <Button size="sm" className="gap-1" disabled={isUpdating} onClick={() => handleMockCheckout(plan.slug)}>
                      <ArrowUpRight className="h-4 w-4" /> Change to {plan.slug}
                    </Button>
                  </div>
                  <div className="mt-3 grid gap-2 text-xs">
                    <span>
                      ${plan.monthlyPriceCents / 100}/month • {plan.includedCredits.toLocaleString()} credits included
                    </span>
                    <span className="text-muted-foreground">Features: {Object.keys(plan.features).join(", ") || "-"}</span>
                  </div>
                </div>
              ))}
              {!plansLoading && !planData?.plans?.length ? (
                <p className="text-sm text-muted-foreground">No active billing plans found. Seed plans to continue.</p>
              ) : null}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card className="border border-border/60 bg-card/80">
          <CardHeader>
            <CardTitle className="text-base">Subscription guardrails</CardTitle>
            <CardDescription>Auto-upgrade behaviour for credit exhaustion.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between gap-2 text-sm">
              <div>
                <p className="font-medium text-foreground">Auto-upgrade to next tier</p>
                <p className="text-xs text-muted-foreground">
                  When credit balance reaches zero, move organisation to the next available plan automatically.
                </p>
              </div>
              <Switch checked={enableAutoUpgrade} onCheckedChange={setEnableAutoUpgrade} />
            </div>
            <div className="rounded-lg border border-border/40 bg-background/60 p-3 text-xs text-muted-foreground">
              <p>
                This toggle currently stores state locally. Wire it to `/api/internal/billing/{orgId}/plan` to enable enforcement once backend limits are ready.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/60 bg-card/80">
          <CardHeader>
            <CardTitle className="text-base">Recent usage</CardTitle>
            <CardDescription>Credit debits captured from mock renderer/GPU tasks.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ScrollArea className="h-48">
              <div className="space-y-2 text-xs">
                {creditData?.transactions?.map((tx) => (
                  <div key={tx.id} className="rounded-lg border border-border/40 bg-background px-3 py-2">
                    <div className="flex items-center justify-between">
                      <span className={`font-semibold ${tx.delta < 0 ? "text-destructive" : "text-foreground"}`}>
                        {tx.delta > 0 ? "+" : ""}
                        {tx.delta}
                      </span>
                      <span className="text-muted-foreground">{new Date(tx.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-muted-foreground">{tx.reason ?? "Usage event"}</p>
                  </div>
                ))}
                {!creditData?.transactions?.length ? (
                  <p className="text-muted-foreground">No transactions recorded yet.</p>
                ) : null}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="border border-border/60 bg-card/80">
          <CardHeader>
            <CardTitle className="text-base">Compliance summary</CardTitle>
            <CardDescription>Ensure billing and credit policies stay audit-ready.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" /> Export Stripe invoices to your compliance archive at the end of every month.
            </div>
            <div className="rounded-lg border border-border/40 bg-background/60 p-3">
              <p>
                Hook this card into your SIEM/log pipeline by calling `/api/internal/billing/{orgId}/export` to retrieve signed invoice URLs once the backend is wired to Stripe webhooks.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
