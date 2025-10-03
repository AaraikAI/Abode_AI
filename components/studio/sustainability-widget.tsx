"use client"

import { useEffect, useState, useTransition } from "react"
import { Wind } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/components/ui/use-toast"

interface SustainabilityLog {
  id: string
  renderId: string
  co2Kg: number
  energyKwh?: number | null
  durationSeconds?: number | null
  createdAt: string
}

export default function SustainabilityWidget() {
  const { toast } = useToast()
  const [logs, setLogs] = useState<SustainabilityLog[]>([])
  const [isLoading, startTransition] = useTransition()

  useEffect(() => {
    startTransition(async () => {
      try {
        const response = await fetch("/api/studio/sustainability")
        if (!response.ok) return
        const data = (await response.json()) as { logs: SustainabilityLog[] }
        setLogs(data.logs)
      } catch (error) {
        console.error(error)
      }
    })
  }, [])

  const handleRender = () => {
    startTransition(async () => {
      try {
        const renderId = crypto.randomUUID()
        const co2Kg = Number((Math.random() * 0.15 + 0.05).toFixed(4))
        const energyKwh = Number((co2Kg * 0.9).toFixed(4))
        const durationSeconds = Math.floor(Math.random() * 35) + 10
        const response = await fetch("/api/studio/sustainability", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ renderId, co2Kg, energyKwh, durationSeconds }),
        })
        if (!response.ok) {
          const body = await response.json().catch(() => ({}))
          throw new Error(body.error || "Unable to log sustainability metrics")
        }
        const data = (await response.json()) as { log: SustainabilityLog }
        setLogs((prev) => [data.log, ...prev].slice(0, 20))
        toast({
          title: "Render logged",
          description: `Estimated CO₂: ${data.log.co2Kg.toFixed(3)} kg`,
        })
      } catch (error) {
        toast({ title: "Logging failed", description: (error as Error).message, variant: "destructive" })
      }
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">Sustainability log</h3>
        <Button size="sm" className="gap-1" onClick={handleRender} disabled={isLoading}>
          <Wind className="h-4 w-4" /> {isLoading ? "Estimating…" : "Render preview"}
        </Button>
      </div>
      <Card className="border border-border/50 bg-background/60">
        <CardContent className="p-0">
          <ScrollArea className="h-40">
            <div className="divide-y divide-border/40 text-xs">
              {logs.map((log) => (
                <div key={log.id} className="px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">{new Date(log.createdAt).toLocaleTimeString()}</span>
                    <span className="text-muted-foreground">{log.co2Kg.toFixed(3)} kg CO₂</span>
                  </div>
                  <div className="text-muted-foreground">
                    Render {log.renderId.slice(0, 6)} • {log.durationSeconds ?? "–"}s • {log.energyKwh?.toFixed(3) ?? "–"} kWh
                  </div>
                </div>
              ))}
              {!logs.length ? <p className="px-3 py-4 text-muted-foreground">Run a render to start tracking emissions.</p> : null}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
