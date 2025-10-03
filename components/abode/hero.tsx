import Link from "next/link"
import { ArrowRight, PlayCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { HeroStat } from "@/lib/platform-types"

interface HeroProps {
  stats: HeroStat[]
}

export function Hero({ stats }: HeroProps) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-6 py-16 text-white shadow-xl sm:px-12">
      <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent)] sm:block" />
      <div className="relative flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl space-y-6">
          <Badge
            variant="outline"
            className="border-white/20 bg-white/5 text-xs uppercase tracking-[0.35em] text-white"
          >
            AbodeAI by Aaraik
          </Badge>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Enterprise AI for architecture, from site plan to factory floor.
          </h1>
          <p className="max-w-xl text-lg text-white/70">
            AbodeAI fuses task orchestration, generative design, and manufacturing handoff into a compliant, observability-first platform that scales to thousands of hybrid AI-human teams.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button size="lg" className="bg-white text-slate-900 hover:bg-white/90" asChild>
              <Link href="#workspaces">
                Explore workspaces
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/30 bg-white/0 text-white hover:bg-white/10"
              asChild
            >
              <Link href="#architecture">
                <PlayCircle className="mr-2 size-4" />
                Review architecture
              </Link>
            </Button>
          </div>
        </div>
        <div className="grid w-full gap-4 sm:grid-cols-3 lg:w-auto">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur"
            >
              <p className="text-sm uppercase tracking-[0.2em] text-white/60">
                {stat.label}
              </p>
              <p className="mt-3 text-2xl font-semibold text-white sm:text-3xl">
                {stat.value}
              </p>
              {stat.helper ? (
                <p className="mt-1 text-sm text-white/60">{stat.helper}</p>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
