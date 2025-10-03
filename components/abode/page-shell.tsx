"use client"

import Link from "next/link"
import { useMemo } from "react"
import { useSession } from "next-auth/react"
import { Hero } from "@/components/abode/hero"
import { WorkspaceShowcase } from "@/components/abode/workspaces"
import { CapabilityMatrix } from "@/components/abode/capability-matrix"
import { AutomationPipeline } from "@/components/abode/pipeline"
import { Observability } from "@/components/abode/observability"
import { ComplianceControls } from "@/components/abode/compliance"
import { Integrations } from "@/components/abode/integrations"
import { Pricing } from "@/components/abode/pricing"
import { Architecture } from "@/components/abode/architecture"
import { Roadmap } from "@/components/abode/roadmap"
import { CallToAction } from "@/components/abode/cta"
import { BillingOverview } from "@/components/abode/billing-overview"
import { usePlatformSnapshot } from "@/hooks/use-platform-snapshot"
import { useSustainabilitySummary } from "@/hooks/use-sustainability-summary"
import { useBillingSummary } from "@/hooks/use-billing-summary"
import { useRealtimeTelemetry } from "@/hooks/use-realtime-telemetry"
import { UserMenu } from "@/components/auth/user-menu"
import { SignInButton } from "@/components/auth/sign-in-button"

export function AbodeLandingShell() {
  const { data: session } = useSession()
  const { data: snapshot } = usePlatformSnapshot()
  const { data: sustainability } = useSustainabilitySummary()
  const { data: billing } = useBillingSummary()
  const { events } = useRealtimeTelemetry(Boolean(snapshot))

  const navItems = [
    { href: "#workspaces", label: "Workspaces" },
    { href: "#capabilities", label: "Capabilities" },
    { href: "#automation", label: "Automation" },
    { href: "#observability", label: "Observability" },
    { href: "#pricing", label: "Pricing" },
    { href: "#roadmap", label: "Roadmap" },
  ] as Array<{ href: string; label: string }>

  const enhancedNavItems = session?.user
    ? [{ href: "/dashboard", label: "Dashboard" }, ...navItems]
    : navItems

  const observabilityMetrics = useMemo(() => {
    if (!snapshot?.observabilityMetrics) {
      return []
    }

    return snapshot.observabilityMetrics.map((metric) => {
      if (sustainability && metric.name.toLowerCase().includes("co₂")) {
        return {
          ...metric,
          value: `${sustainability.summary.rollingAverageKg} kg`,
          change: `${sustainability.summary.variance >= 0 ? "+" : ""}${sustainability.summary.variance.toFixed(2)} vs target`,
          positive: sustainability.summary.variance <= 0,
        }
      }
      return metric
    })
  }, [snapshot?.observabilityMetrics, sustainability])

  const sustainabilitySeries = snapshot?.sustainabilitySeries ?? []

  return (
    <div className="bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 sm:px-10 lg:px-12">
          <Link
            href="/"
            className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.35em]"
          >
            <span>AbodeAI</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            {enhancedNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="transition hover:text-primary"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="hidden md:inline-flex">
            {session?.user ? <UserMenu /> : <SignInButton />}
          </div>
        </div>
      </header>

      <main>
        <div className="mx-auto flex max-w-7xl flex-col gap-16 px-6 py-16 sm:px-10 lg:px-12">
          <Hero stats={snapshot?.heroStats ?? []} />
          <WorkspaceShowcase workspaces={snapshot?.workspaces ?? []} />
          <CapabilityMatrix sections={snapshot?.capabilitySections ?? []} />
          <AutomationPipeline steps={snapshot?.automationFlow ?? []} />
          <Observability metrics={observabilityMetrics} series={sustainabilitySeries} telemetry={events} />
          <ComplianceControls disciplines={snapshot?.complianceMatrix ?? []} />
          <Integrations catalog={snapshot?.integrationCatalog ?? []} />
          {billing ? <BillingOverview summary={billing} /> : null}
          <Pricing tiers={snapshot?.pricingTiers ?? []} />
          <Architecture />
          <Roadmap roadmap={snapshot?.roadmap ?? []} />
          <CallToAction />
        </div>
      </main>
    </div>
  )
}
