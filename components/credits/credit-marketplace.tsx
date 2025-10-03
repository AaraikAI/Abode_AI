"use client"

import { useCallback, useState, useTransition } from "react"
import useSWR from "swr"
import { BadgeCheck, CreditCard, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"

interface CreditPack {
  id: string
  name: string
  description: string
  credits: number
  priceCents: number
  featured: boolean
}

interface CreditTransaction {
  id: string
  status: string
  credits: number
  amountCents: number
  createdAt: string
}

async function fetcher<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.error || "Request failed")
  }
  return response.json() as Promise<T>
}

export default function CreditMarketplace({ initialPacks }: { initialPacks: CreditPack[] }) {
  const { toast } = useToast()
  const [transactions, setTransactions] = useState<CreditTransaction[]>([])
  const [isPurchasing, startPurchase] = useTransition()

  const { data, mutate, isLoading } = useSWR<{ packs: CreditPack[] }>("/api/credits/packs", fetcher, {
    fallbackData: { packs: initialPacks },
  })

  const handlePurchase = useCallback(
    (pack: CreditPack) => {
      startPurchase(async () => {
        try {
          const response = await fetch("/api/credits/purchase", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ packId: pack.id }),
          })
          if (!response.ok) {
            const body = await response.json().catch(() => ({}))
            throw new Error(body.error || "Unable to initiate purchase")
          }
          const payload = (await response.json()) as { transaction: CreditTransaction }
          setTransactions((prev) => [payload.transaction, ...prev].slice(0, 5))
          toast({
            title: "Credits purchased",
            description: `Pack ${pack.name} (${pack.credits} credits) ready to use.`,
          })
        } catch (error) {
          toast({ title: "Purchase failed", description: (error as Error).message, variant: "destructive" })
        }
      })
    },
    [toast]
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card/80 p-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Credit marketplace</h1>
          <p className="text-sm text-muted-foreground">Purchase render and orchestration credits with Stripe.</p>
        </div>
        <Button variant="outline" className="gap-1" onClick={() => mutate()} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} /> Refresh packs
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data?.packs.map((pack) => (
          <Card key={pack.id} className={`border ${pack.featured ? "border-primary/70 shadow-lg" : "border-border/60"}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                {pack.name}
                {pack.featured ? <BadgeCheck className="h-4 w-4 text-primary" /> : null}
              </CardTitle>
              <CardDescription>{pack.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="text-3xl font-semibold text-foreground">${(pack.priceCents / 100).toFixed(2)}</div>
              <div className="text-muted-foreground">{pack.credits} credits available immediately.</div>
              <div className="rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                Includes priority rendering, bionic design sims, and JEGA ERP export capacity.
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full gap-2" onClick={() => handlePurchase(pack)} disabled={isPurchasing}>
                <CreditCard className="h-4 w-4" /> {isPurchasing ? "Processing…" : "Purchase via Stripe"}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Card className="border border-border/60 bg-card/70">
        <CardHeader>
          <CardTitle className="text-base">Recent transactions</CardTitle>
          <CardDescription>Mock Stripe Usage API receipts.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {transactions.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between rounded-xl border border-border/40 bg-background/60 px-4 py-2">
              <div>
                <div className="font-medium text-foreground">{new Date(tx.createdAt).toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Credits: {tx.credits}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-foreground">${(tx.amountCents / 100).toFixed(2)}</div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">{tx.status}</div>
              </div>
            </div>
          ))}
          {!transactions.length ? <p className="text-xs text-muted-foreground">Transactions appear after purchase.</p> : null}
        </CardContent>
      </Card>
    </div>
  )
}
