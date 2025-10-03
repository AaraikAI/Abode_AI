import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { SectionHeader } from "./section-header"

export function CallToAction() {
  return (
    <section
      id="contact"
      className="rounded-3xl border border-border bg-gradient-to-r from-primary/10 via-background to-primary/10 p-10 shadow-lg"
    >
      <SectionHeader
        eyebrow="Ready for launch"
        heading="Stand up AbodeAI and unlock hybrid AI-human design ops"
        description="Spin up the reference stack, plug in your datasets for Hugging Face fine-tuning, and invite teams with credit-based billing."
        action={
          <Button size="lg" asChild>
            <Link href="mailto:hello@aaraik.ai">
              Request enterprise briefing
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        }
      />
    </section>
  )
}
