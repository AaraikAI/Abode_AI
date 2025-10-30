"use client"

import { useCallback, useEffect, useMemo, useState, useTransition } from "react"
import { Download, Factory, FileSpreadsheet, Leaf, RefreshCw, Share2, Repeat } from "lucide-react"
import useSWR from "swr"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"

interface BomItem {
  id: string
  name: string
  sku: string
  quantity: number
  unit: string
  material?: string | null
  cost?: number | null
  dimensions?: Record<string, unknown> | null
}

interface ManufacturingBom {
  id: string
  status: string
  sceneSnapshotId?: string | null
  createdAt: string
  totalCost?: number | null
  metadata?: Record<string, unknown> | null
  items: BomItem[]
}

interface SyncEvent {
  id: string
  status: string
  message: string
  createdAt: string
}

interface SustainabilityItem {
  itemId: string
  name: string
  co2Kg: number
  energyKwh: number
  share: number
}

interface SustainabilitySummary {
  bomId: string
  totalCo2Kg: number
  totalEnergyKwh: number
  methodology: string
  lastUpdated: string
  items: SustainabilityItem[]
}

type ErpProvider = "jega" | "zbom"

async function fetcher<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.error || "Request failed")
  }
  return response.json() as Promise<T>
}

export default function ManufacturingDashboard({ initialBoms = [] }: { initialBoms: ManufacturingBom[] }) {
  const { toast } = useToast()
  const [isGenerating, startGenerating] = useTransition()
  const [selectedBom, setSelectedBom] = useState<ManufacturingBom | null>(initialBoms.at(0) ?? null)
  const [syncs, setSyncs] = useState<SyncEvent[]>([])
  const [isSyncing, setIsSyncing] = useState(false)
  const [isDownloading, setIsDownloading] = useState<{ dxf: boolean; cut: boolean }>({ dxf: false, cut: false })
  const [sustainability, setSustainability] = useState<SustainabilitySummary | null>(null)
  const [isSustainabilityLoading, setIsSustainabilityLoading] = useState(false)

  const { data, mutate, isLoading } = useSWR<{ boms: ManufacturingBom[] }>("/api/manufacturing/boms", fetcher, {
    fallbackData: { boms: initialBoms },
  })

  const currentBoms = useMemo(() => data?.boms ?? initialBoms, [data?.boms, initialBoms])

  useEffect(() => {
    if (!currentBoms.length) {
      setSelectedBom(null)
      return
    }
    setSelectedBom((existing) => currentBoms.find((bom) => bom.id === existing?.id) ?? currentBoms[0])
  }, [currentBoms])

  useEffect(() => {
    if (!selectedBom?.id) {
      setSyncs([])
      setSustainability(null)
      setIsSustainabilityLoading(false)
      return
    }
    let cancelled = false
    setIsSustainabilityLoading(true)
    ;(async () => {
      try {
        const [detailsRes, sustainabilityRes] = await Promise.all([
          fetch(`/api/manufacturing/boms/${selectedBom.id}`),
          fetch(`/api/manufacturing/boms/${selectedBom.id}/sustainability`),
        ])

        if (detailsRes.ok) {
          const payload = (await detailsRes.json()) as { syncs: SyncEvent[]; bom: ManufacturingBom }
          if (!cancelled) {
            setSelectedBom(payload.bom)
            setSyncs(payload.syncs)
          }
        }

        if (sustainabilityRes.ok) {
          const payload = (await sustainabilityRes.json()) as { summary: SustainabilitySummary }
          if (!cancelled) {
            setSustainability(payload.summary)
          }
        }
      } catch (error) {
        console.warn("Failed to load BOM detail", error)
      } finally {
        if (!cancelled) {
          setIsSustainabilityLoading(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [selectedBom?.id])

  const handleGenerate = useCallback(() => {
    startGenerating(async () => {
      try {
        const response = await fetch("/api/manufacturing/boms", { method: "POST" })
        if (!response.ok) {
          const body = await response.json().catch(() => ({}))
          throw new Error(body.error || "Unable to generate BOM")
        }
        const payload = (await response.json()) as { bom: ManufacturingBom }
        await mutate()
        setSelectedBom(payload.bom)
        toast({ title: "BOM generated", description: "Cut list created from the latest scene." })
      } catch (error) {
        toast({ title: "BOM generation failed", description: (error as Error).message, variant: "destructive" })
      }
    })
  }, [mutate, toast])

  const handleSync = useCallback(
    (provider: ErpProvider) => {
      if (!selectedBom) return
      setIsSyncing(true)
      ;(async () => {
        try {
          const response = await fetch(`/api/manufacturing/boms/${selectedBom.id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "erp_sync", provider }),
          })
          if (!response.ok) {
            const body = await response.json().catch(() => ({}))
            throw new Error(body.error || "Sync failed")
          }
          const payload = (await response.json()) as { syncs: SyncEvent[] }
          setSyncs(payload.syncs)
          toast({ title: `${provider.toUpperCase()} sync`, description: "ERP integration request processed." })
        } catch (error) {
          toast({ title: "Sync failed", description: (error as Error).message, variant: "destructive" })
        } finally {
          setIsSyncing(false)
        }
      })()
    },
    [selectedBom, toast]
  )

  const handleRetry = useCallback(
    (provider: ErpProvider) => {
      if (!selectedBom) return
      setIsSyncing(true)
      ;(async () => {
        try {
          const response = await fetch(`/api/manufacturing/boms/${selectedBom.id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "retry", provider }),
          })
          if (!response.ok) {
            const body = await response.json().catch(() => ({}))
            throw new Error(body.error || "Retry failed")
          }
          const payload = (await response.json()) as { syncs: SyncEvent[] }
          setSyncs(payload.syncs)
          toast({ title: "Retry queued", description: `${provider.toUpperCase()} sync retried.` })
        } catch (error) {
          toast({ title: "Retry failed", description: (error as Error).message, variant: "destructive" })
        } finally {
          setIsSyncing(false)
        }
      })()
    },
    [selectedBom, toast]
  )

  const handleDownload = useCallback(
    async (type: "dxf" | "cut") => {
      if (!selectedBom) return
      setIsDownloading((prev) => ({ ...prev, [type]: true }))
      try {
        const response = await fetch(`/api/manufacturing/boms/${selectedBom.id}/exports/${type}`)
        if (!response.ok) {
          const body = await response.json().catch(() => ({}))
          throw new Error(body.error || "Download failed")
        }
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const element = document.createElement("a")
        element.href = url
        element.download = type === "dxf" ? `bom-${selectedBom.id}.dxf` : `bom-${selectedBom.id}-cutlist.csv`
        document.body.appendChild(element)
        element.click()
        document.body.removeChild(element)
        URL.revokeObjectURL(url)
        toast({ title: "Export ready", description: type === "dxf" ? "DXF file downloaded." : "Cut list downloaded." })
      } catch (error) {
        toast({ title: "Export failed", description: (error as Error).message, variant: "destructive" })
      } finally {
        setIsDownloading((prev) => ({ ...prev, [type]: false }))
      }
    },
    [selectedBom, toast]
  )

  const bomList = currentBoms

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card/80 p-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Manufacturing pipeline</h1>
          <p className="text-sm text-muted-foreground">Generate BOMs, check cutlists, and push to JEGA.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-1" onClick={() => mutate()} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <Button className="gap-1" onClick={handleGenerate} disabled={isGenerating}>
            <FileSpreadsheet className="h-4 w-4" /> {isGenerating ? "Generating…" : "Generate BOM"}
          </Button>
          <Button
            variant="secondary"
            className="gap-1"
            onClick={() => handleSync("jega")}
            disabled={!selectedBom || isSyncing}
          >
            <Factory className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} /> Sync JEGA
          </Button>
          <Button
            variant="outline"
            className="gap-1"
            onClick={() => handleSync("zbom")}
            disabled={!selectedBom || isSyncing}
          >
            <Share2 className="h-4 w-4" /> Sync ZBOM
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <Card className="border border-border/60 bg-card/70">
          <CardHeader>
            <CardTitle className="text-base">Recent BOMs</CardTitle>
            <CardDescription>Approved runs ready for fabrication.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[520px]">
              <div className="divide-y divide-border/50 text-sm">
                {bomList.map((bom) => (
                  <button
                    key={bom.id}
                    type="button"
                    onClick={() => setSelectedBom(bom)}
                    className={`w-full text-left px-4 py-3 transition hover:bg-card ${selectedBom?.id === bom.id ? "bg-card" : "bg-background/60"}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">{bom.id.slice(0, 8)}</span>
                      <span className="text-xs uppercase tracking-wide text-muted-foreground">{bom.status}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(bom.createdAt).toLocaleString()} • {bom.items.length} items • ${" "}
                      {bom.totalCost != null ? bom.totalCost.toFixed(2) : "--"}
                    </div>
                  </button>
                ))}
                {!bomList.length ? <p className="px-4 py-6 text-xs text-muted-foreground">Generate your first BOM to populate this list.</p> : null}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="border border-border/60 bg-card/70">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">BOM details</CardTitle>
                <CardDescription>Line items, cutlists, and materials.</CardDescription>
              </div>
              {selectedBom ? (
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs uppercase tracking-wide text-primary">{selectedBom.status}</span>
              ) : null}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {selectedBom ? (
              <Tabs defaultValue="items" className="w-full">
                <TabsList>
                  <TabsTrigger value="items">Items</TabsTrigger>
                  <TabsTrigger value="sync">ERP sync</TabsTrigger>
                  <TabsTrigger value="sustainability">Sustainability</TabsTrigger>
                </TabsList>
                <TabsContent value="items" className="space-y-3">
                  <div className="rounded-xl border border-border/50 bg-background/60">
                    <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-2 border-b border-border/40 px-4 py-2 text-xs uppercase tracking-wide text-muted-foreground">
                      <span>Item</span>
                      <span>SKU</span>
                      <span>Qty</span>
                      <span>Cost</span>
                    </div>
                    <div className="divide-y divide-border/40">
                      {selectedBom.items.map((item) => (
                        <div key={item.id} className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-2 px-4 py-2 text-sm">
                          <div>
                            <div className="font-medium text-foreground">{item.name}</div>
                            <div className="text-xs text-muted-foreground">{item.material ?? "Material TBD"}</div>
                          </div>
                          <span>{item.sku}</span>
                          <span>
                            {item.quantity} {item.unit}
                          </span>
                          <span>{item.cost != null ? `$${item.cost.toFixed(2)}` : "--"}</span>
                        </div>
                      ))}
                      {!selectedBom.items.length ? (
                        <div className="px-4 py-6 text-xs text-muted-foreground">No items generated for this BOM.</div>
                      ) : null}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="sync" className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button size="sm" onClick={() => handleRetry("jega")} disabled={!selectedBom || isSyncing}>
                      <Repeat className="h-4 w-4" /> Retry JEGA
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleRetry("zbom")} disabled={!selectedBom || isSyncing}>
                      <Repeat className="h-4 w-4" /> Retry ZBOM
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDownload("dxf")} disabled={isDownloading.dxf}>
                      <Download className={`h-4 w-4 ${isDownloading.dxf ? "animate-pulse" : ""}`} /> DXF
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDownload("cut")} disabled={isDownloading.cut}>
                      <Download className={`h-4 w-4 ${isDownloading.cut ? "animate-pulse" : ""}`} /> Cut list
                    </Button>
                  </div>
                  <Card className="border border-border/40 bg-background/60">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">ERP sync timeline</CardTitle>
                      <CardDescription>Status updates from JEGA/ZBOM integrations.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-xs">
                      {syncs.map((event) => (
                        <div key={event.id} className="rounded-lg border border-border/30 bg-card/70 px-3 py-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-foreground">{event.status}</span>
                            <span className="text-muted-foreground">{new Date(event.createdAt).toLocaleTimeString()}</span>
                          </div>
                          <p className="text-muted-foreground whitespace-pre-line">{event.message}</p>
                        </div>
                      ))}
                      {!syncs.length ? <p className="text-muted-foreground">No sync activity yet.</p> : null}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="sustainability" className="space-y-3">
                  <Card className="border border-border/40 bg-background/60">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <Leaf className="h-4 w-4" /> Emissions overview
                      </CardTitle>
                      <CardDescription>
                        {sustainability?.methodology ?? "Awaiting sustainability telemetry."}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-xs text-muted-foreground">
                      {sustainability ? (
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-4 text-sm text-foreground">
                            <span>Total CO₂: {sustainability.totalCo2Kg.toFixed(3)} kg</span>
                            <span>Total energy: {sustainability.totalEnergyKwh.toFixed(3)} kWh</span>
                          </div>
                          <div className="grid gap-2">
                            {sustainability.items.map((item) => (
                              <div key={item.itemId} className="rounded-lg border border-border/30 bg-card/70 px-3 py-2">
                                <div className="flex items-center justify-between text-sm text-foreground">
                                  <span>{item.name}</span>
                                  <span>{item.share}% share</span>
                                </div>
                                <div className="text-xs">
                                  CO₂ {item.co2Kg.toFixed(4)} kg • Energy {item.energyKwh.toFixed(4)} kWh
                                </div>
                              </div>
                            ))}
                          </div>
                          <p className="text-[11px] text-muted-foreground">Updated {sustainability.lastUpdated}</p>
                        </div>
                      ) : (
                        <div className="text-muted-foreground">
                          {isSustainabilityLoading ? "Loading sustainability metrics…" : "No sustainability data available."}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-sm text-muted-foreground">Select a BOM to view details and sync history.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
