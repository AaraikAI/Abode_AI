"use client"

import { useCallback, useState, useTransition } from "react"
import useSWR from "swr"
import { ExternalLink, Plug, Shield } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"

interface ProviderRecord {
  id: string
  provider: string
  displayName: string
  description?: string | null
  authType: string
  scopes?: string[] | null
}

interface OrganizationIntegration {
  id: string
  providerId: string
  provider: string
  displayName: string
  accessTokenMasked?: string | null
  expiresAt?: string | null
}

interface IntegrationsResponse {
  providers: ProviderRecord[]
  integrations: OrganizationIntegration[]
}

async function fetcher<T>(url: string) {
  const response = await fetch(url)
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.error || "Request failed")
  }
  return response.json() as Promise<T>
}

export function IntegrationsHub() {
  const { toast } = useToast()
  const [activeProvider, setActiveProvider] = useState<string | null>(null)
  const [tokenInput, setTokenInput] = useState("")
  const [isConnecting, startTransition] = useTransition()

  const { data, mutate } = useSWR<IntegrationsResponse>("/api/integrations/connections", fetcher)

  const handleConnect = useCallback(() => {
    if (!activeProvider) {
      toast({ title: "Select a provider first", variant: "destructive" })
      return
    }
    startTransition(async () => {
      try {
        const response = await fetch("/api/integrations/connections", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ providerId: activeProvider, accessToken: tokenInput || undefined }),
        })
        if (!response.ok) {
          const body = await response.json().catch(() => ({}))
          throw new Error(body.error || "Connection failed")
        }
        await mutate()
        setTokenInput("")
        toast({ title: "Integration saved" })
      } catch (error) {
        toast({ title: "Connection failed", description: (error as Error).message, variant: "destructive" })
      }
    })
  }, [activeProvider, tokenInput, mutate, toast])

  return (
    <div className="space-y-6">
      <Card className="border border-border/60 bg-card/80">
        <CardHeader>
          <CardTitle className="text-base">Integrations hub</CardTitle>
          <CardDescription>Connect Slack, Figma, Adobe, and Zapier to AbodeAI.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="providers" className="w-full">
            <TabsList>
              <TabsTrigger value="providers">Providers</TabsTrigger>
              <TabsTrigger value="connections">My connections</TabsTrigger>
              <TabsTrigger value="webhooks">Airflow webhooks</TabsTrigger>
            </TabsList>
            <TabsContent value="providers" className="space-y-4">
              <ScrollArea className="h-64">
                <div className="grid gap-3">
                  {data?.providers.map((provider) => (
                    <button
                      key={provider.id}
                      type="button"
                      onClick={() => setActiveProvider(provider.id)}
                      className={`flex w-full items-start justify-between rounded-xl border border-border/40 bg-background/60 p-3 text-left transition hover:border-primary/60 ${
                        activeProvider === provider.id ? "border-primary" : ""
                      }`}
                    >
                      <div>
                        <p className="text-sm font-semibold text-foreground">{provider.displayName}</p>
                        <p className="text-xs text-muted-foreground">{provider.description ?? "OAuth 2.0 workflow"}</p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </button>
                  ))}
                  {!data?.providers?.length ? <p className="text-sm text-muted-foreground">No providers configured.</p> : null}
                </div>
              </ScrollArea>
              <div className="rounded-lg border border-border/40 bg-background/60 p-3 text-xs text-muted-foreground">
                <p>Selected provider: {activeProvider ?? "None"}</p>
                <p>OAuth tokens are stored securely in Supabase and masked in this UI.</p>
              </div>
              <div className="space-y-2">
                <Input
                  type="password"
                  value={tokenInput}
                  onChange={(event) => setTokenInput(event.target.value)}
                  placeholder="Paste mock access token (not required for scaffolding)"
                />
                <Button onClick={handleConnect} disabled={!activeProvider || isConnecting} className="gap-1">
                  <Plug className="h-4 w-4" /> {isConnecting ? "Connecting…" : "Save connection"}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="connections" className="space-y-4">
              <ScrollArea className="h-64">
                <div className="space-y-2 text-sm">
                  {data?.integrations.map((integration) => (
                    <div key={integration.id} className="rounded-lg border border-border/40 bg-background/60 p-3">
                      <p className="font-semibold text-foreground">{integration.displayName}</p>
                      <p className="text-xs text-muted-foreground">
                        Token: {integration.accessTokenMasked ?? "Encrypted in vault"} • Expires: {integration.expiresAt ?? "n/a"}
                      </p>
                    </div>
                  ))}
                  {!data?.integrations?.length ? <p className="text-muted-foreground">No active integrations yet.</p> : null}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="webhooks" className="space-y-4 text-sm text-muted-foreground">
              <div className="rounded-lg border border-border/40 bg-background/60 p-3">
                <p className="font-semibold text-foreground">Airflow webhook listener</p>
                <p className="text-xs">
                  POST events to <code>/api/airflow/webhook</code> with <code>dag_id</code>, <code>run_id</code>, and <code>event</code> fields. Events are stored in Supabase for future DAG UI tooling.
                </p>
              </div>
              <div className="rounded-lg border border-border/40 bg-background/60 p-3">
                <p className="font-semibold text-foreground">Security note</p>
                <p className="text-xs">
                  Replace this copy with signature validation once the real webhook secret exchange with Airflow is ready.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card className="border border-border/60 bg-card/80">
        <CardHeader>
          <CardTitle className="text-base">Token handling policy</CardTitle>
          <CardDescription>Ensure all connectors abide by least-privilege scopes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4" /> Store encrypted tokens in server-side vaults; never expose full tokens client-side.
          </div>
          <div className="rounded-lg border border-border/40 bg-background/60 p-3">
            <p>
              Update <code>lib/data/integrations.ts</code> to call your secret management service when real Slack/Figma/Adobe/Zapier flows are implemented. This UI serves as scaffolding for those forthcoming workflows.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
