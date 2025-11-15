"use client"

import { useCallback, useMemo, useState } from "react"
import useSWR from "swr"
import {
  Plug,
  Check,
  X,
  Settings,
  ExternalLink,
  Cloud,
  MessageSquare,
  Database,
  FileText,
  Zap,
  Globe,
} from "lucide-react"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export interface Integration {
  id: string
  name: string
  slug: string
  description: string
  category: "storage" | "communication" | "analytics" | "automation" | "design" | "other"
  icon?: string
  logo?: string
  status: "available" | "beta" | "coming_soon"
  isConnected: boolean
  isEnabled: boolean
  connectedAt?: string
  scopes?: string[]
  webhookUrl?: string
  apiKey?: string
  features?: string[]
}

interface IntegrationConfig {
  apiKey?: string
  webhookUrl?: string
  scopes?: string[]
  settings?: Record<string, unknown>
}

const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.error || `Request failed with ${response.status}`)
  }
  return response.json()
}

const getCategoryIcon = (category: Integration["category"]) => {
  const iconClass = "h-5 w-5"
  switch (category) {
    case "storage":
      return <Cloud className={iconClass} />
    case "communication":
      return <MessageSquare className={iconClass} />
    case "analytics":
      return <Database className={iconClass} />
    case "automation":
      return <Zap className={iconClass} />
    case "design":
      return <FileText className={iconClass} />
    default:
      return <Globe className={iconClass} />
  }
}

const popularIntegrations = [
  {
    id: "google-drive",
    name: "Google Drive",
    slug: "google-drive",
    description: "Store and sync your project files with Google Drive",
    category: "storage" as const,
    status: "available" as const,
    features: ["File sync", "Auto-backup", "Share links"],
  },
  {
    id: "dropbox",
    name: "Dropbox",
    slug: "dropbox",
    description: "Access your Dropbox files directly from Abode AI",
    category: "storage" as const,
    status: "available" as const,
    features: ["File sync", "Version history", "Team folders"],
  },
  {
    id: "slack",
    name: "Slack",
    slug: "slack",
    description: "Get notifications and collaborate in Slack",
    category: "communication" as const,
    status: "available" as const,
    features: ["Notifications", "Bot commands", "File sharing"],
  },
  {
    id: "microsoft-teams",
    name: "Microsoft Teams",
    slug: "microsoft-teams",
    description: "Integrate with Microsoft Teams for seamless collaboration",
    category: "communication" as const,
    status: "beta" as const,
    features: ["Notifications", "Video calls", "Channel integration"],
  },
  {
    id: "zapier",
    name: "Zapier",
    slug: "zapier",
    description: "Automate workflows with 5000+ apps",
    category: "automation" as const,
    status: "available" as const,
    features: ["Webhooks", "Triggers", "Multi-step zaps"],
  },
  {
    id: "figma",
    name: "Figma",
    slug: "figma",
    description: "Import designs from Figma",
    category: "design" as const,
    status: "available" as const,
    features: ["Import designs", "Sync components", "Live preview"],
  },
]

export function IntegrationsPanel() {
  const { toast } = useToast()
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null)
  const [showConfigDialog, setShowConfigDialog] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [configData, setConfigData] = useState<IntegrationConfig>({})

  const { data, mutate } = useSWR<{ integrations: Integration[] }>("/api/integrations", fetcher)

  const integrations = useMemo(() => {
    const serverIntegrations = data?.integrations ?? []
    // Merge with popular integrations
    return popularIntegrations.map((popular) => {
      const existing = serverIntegrations.find((i) => i.slug === popular.slug)
      return existing ?? { ...popular, isConnected: false, isEnabled: false }
    })
  }, [data])

  const categorizedIntegrations = useMemo(() => {
    const categories: Record<Integration["category"], Integration[]> = {
      storage: [],
      communication: [],
      analytics: [],
      automation: [],
      design: [],
      other: [],
    }

    integrations.forEach((integration) => {
      categories[integration.category].push(integration)
    })

    return categories
  }, [integrations])

  const handleConnect = useCallback(
    async (integration: Integration) => {
      if (integration.status === "coming_soon") {
        toast({ title: "Coming soon", description: `${integration.name} integration is not available yet` })
        return
      }

      setSelectedIntegration(integration)
      setShowConfigDialog(true)
    },
    [toast]
  )

  const handleDisconnect = useCallback(
    async (integrationId: string) => {
      try {
        const response = await fetch(`/api/integrations/${integrationId}/disconnect`, {
          method: "POST",
        })

        if (!response.ok) {
          const body = await response.json().catch(() => ({}))
          throw new Error(body.error || "Failed to disconnect integration")
        }

        await mutate()
        toast({ title: "Integration disconnected" })
      } catch (error) {
        toast({
          title: "Failed to disconnect",
          description: (error as Error).message,
          variant: "destructive",
        })
      }
    },
    [mutate, toast]
  )

  const handleToggleEnabled = useCallback(
    async (integrationId: string, enabled: boolean) => {
      try {
        const response = await fetch(`/api/integrations/${integrationId}/toggle`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enabled }),
        })

        if (!response.ok) {
          const body = await response.json().catch(() => ({}))
          throw new Error(body.error || "Failed to toggle integration")
        }

        await mutate()
        toast({ title: enabled ? "Integration enabled" : "Integration disabled" })
      } catch (error) {
        toast({
          title: "Failed to toggle integration",
          description: (error as Error).message,
          variant: "destructive",
        })
      }
    },
    [mutate, toast]
  )

  const handleSaveConfig = useCallback(async () => {
    if (!selectedIntegration) return

    setIsConnecting(true)
    try {
      const response = await fetch(`/api/integrations/${selectedIntegration.id}/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(configData),
      })

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.error || "Failed to connect integration")
      }

      await mutate()
      setShowConfigDialog(false)
      setSelectedIntegration(null)
      setConfigData({})
      toast({ title: "Integration connected successfully" })
    } catch (error) {
      toast({
        title: "Failed to connect integration",
        description: (error as Error).message,
        variant: "destructive",
      })
    } finally {
      setIsConnecting(false)
    }
  }, [selectedIntegration, configData, mutate, toast])

  return (
    <>
      <Card className="border border-border/60 bg-card/80">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Plug className="h-5 w-5" />
            Integrations
          </CardTitle>
          <CardDescription>Connect third-party services to enhance your workflow</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="connected">Connected</TabsTrigger>
              <TabsTrigger value="storage">Storage</TabsTrigger>
              <TabsTrigger value="communication">Communication</TabsTrigger>
              <TabsTrigger value="automation">Automation</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {Object.entries(categorizedIntegrations).map(([category, items]) => {
                if (items.length === 0) return null
                return (
                  <div key={category} className="space-y-3">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(category as Integration["category"])}
                      <h3 className="text-sm font-semibold capitalize">{category}</h3>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {items.map((integration) => (
                        <IntegrationCard
                          key={integration.id}
                          integration={integration}
                          onConnect={handleConnect}
                          onDisconnect={handleDisconnect}
                          onToggleEnabled={handleToggleEnabled}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}
            </TabsContent>

            <TabsContent value="connected" className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {integrations
                  .filter((i) => i.isConnected)
                  .map((integration) => (
                    <IntegrationCard
                      key={integration.id}
                      integration={integration}
                      onConnect={handleConnect}
                      onDisconnect={handleDisconnect}
                      onToggleEnabled={handleToggleEnabled}
                    />
                  ))}
              </div>
              {integrations.filter((i) => i.isConnected).length === 0 && (
                <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-dashed border-border/60">
                  <div className="text-center">
                    <Plug className="mx-auto h-8 w-8 text-muted-foreground" />
                    <p className="mt-2 text-sm font-medium">No integrations connected</p>
                    <p className="text-xs text-muted-foreground">Connect services to get started</p>
                  </div>
                </div>
              )}
            </TabsContent>

            {(["storage", "communication", "automation"] as const).map((category) => (
              <TabsContent key={category} value={category} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {categorizedIntegrations[category].map((integration) => (
                    <IntegrationCard
                      key={integration.id}
                      integration={integration}
                      onConnect={handleConnect}
                      onDisconnect={handleDisconnect}
                      onToggleEnabled={handleToggleEnabled}
                    />
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect {selectedIntegration?.name}</DialogTitle>
            <DialogDescription>{selectedIntegration?.description}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api-key">API Key</Label>
              <Input
                id="api-key"
                type="password"
                placeholder="Enter your API key"
                value={configData.apiKey ?? ""}
                onChange={(e) => setConfigData((prev) => ({ ...prev, apiKey: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="webhook-url">Webhook URL (optional)</Label>
              <Input
                id="webhook-url"
                type="url"
                placeholder="https://your-app.com/webhook"
                value={configData.webhookUrl ?? ""}
                onChange={(e) => setConfigData((prev) => ({ ...prev, webhookUrl: e.target.value }))}
              />
            </div>
            {selectedIntegration?.features && (
              <div className="space-y-2">
                <Label>Features</Label>
                <div className="flex flex-wrap gap-2">
                  {selectedIntegration.features.map((feature) => (
                    <Badge key={feature} variant="secondary">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfigDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveConfig} disabled={isConnecting || !configData.apiKey}>
              {isConnecting ? "Connecting..." : "Connect"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

interface IntegrationCardProps {
  integration: Integration
  onConnect: (integration: Integration) => void
  onDisconnect: (integrationId: string) => void
  onToggleEnabled: (integrationId: string, enabled: boolean) => void
}

function IntegrationCard({ integration, onConnect, onDisconnect, onToggleEnabled }: IntegrationCardProps) {
  return (
    <Card className="border border-border/60 bg-card/80 transition-all hover:border-primary/40 hover:shadow-md">
      <CardHeader className="space-y-3 pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
              {getCategoryIcon(integration.category)}
            </div>
            <div>
              <h4 className="text-sm font-semibold">{integration.name}</h4>
              {integration.status !== "available" && (
                <Badge variant="outline" className="mt-1 text-[10px]">
                  {integration.status.replace("_", " ")}
                </Badge>
              )}
            </div>
          </div>
          {integration.isConnected && (
            <Badge variant="default" className="gap-1">
              <Check className="h-3 w-3" />
              Connected
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{integration.description}</p>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {integration.features && integration.features.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {integration.features.slice(0, 2).map((feature) => (
              <Badge key={feature} variant="secondary" className="text-[10px]">
                {feature}
              </Badge>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2">
          {integration.isConnected ? (
            <>
              <Switch
                checked={integration.isEnabled}
                onCheckedChange={(checked) => onToggleEnabled(integration.id, checked)}
              />
              <Button variant="outline" size="sm" onClick={() => onDisconnect(integration.id)} className="flex-1">
                Disconnect
              </Button>
            </>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={() => onConnect(integration)}
              disabled={integration.status === "coming_soon"}
              className="w-full"
            >
              {integration.status === "coming_soon" ? "Coming Soon" : "Connect"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
