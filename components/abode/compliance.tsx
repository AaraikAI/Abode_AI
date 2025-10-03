"use client"

import { ShieldCheck, FileCheck2 } from "lucide-react"

import { SectionHeader } from "./section-header"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { ComplianceDiscipline } from "@/lib/platform-types"

interface ComplianceControlsProps {
  disciplines: ComplianceDiscipline[]
}

export function ComplianceControls({ disciplines }: ComplianceControlsProps) {
  return (
    <section id="compliance" className="space-y-8">
      <SectionHeader
        eyebrow="Trust & compliance"
        heading="Security, privacy, and AI governance from sprint zero"
        description="AbodeAI ships with SOC2 baselines, GDPR automation, HIPAA ready controls, and AI ethics reviews baked into deployment checklists."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <Card className="border-border bg-card/60 p-6 shadow-sm">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <ShieldCheck className="size-5 text-primary" />
            <span>Zero-trust mesh with Istio + RASP</span>
          </div>
          <p className="mt-4 text-base text-muted-foreground">
            MFA, SSO (SAML/OIDC), passwordless magic links, and device management run through Auth0 with Redis-backed sessions. Geo-fencing leverages MaxMind; secrets live in AWS KMS with automated rotation.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Badge variant="outline" className="border-border/60 uppercase tracking-[0.2em]">
              GDPR
            </Badge>
            <Badge variant="outline" className="border-border/60 uppercase tracking-[0.2em]">
              SOC2 Type II
            </Badge>
            <Badge variant="outline" className="border-border/60 uppercase tracking-[0.2em]">
              HIPAA-ready
            </Badge>
          </div>
        </Card>

        <Accordion type="multiple" className="grid gap-4">
          {disciplines.map((discipline) => (
            <AccordionItem
              key={discipline.name}
              value={discipline.name}
              className="overflow-hidden rounded-2xl border border-border/80 bg-card/60 shadow-sm"
            >
              <AccordionTrigger className="px-6 py-4 text-left text-lg font-semibold text-foreground">
                {discipline.name}
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                <ul className="space-y-3 text-sm text-muted-foreground">
                  {discipline.controls.map((control) => (
                    <li key={control} className="flex items-start gap-3">
                      <FileCheck2 className="mt-0.5 size-4 text-primary" aria-hidden />
                      <span>{control}</span>
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
