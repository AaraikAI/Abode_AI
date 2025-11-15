'use client'

import { useState } from 'react'
import {
  Key,
  Plus,
  Copy,
  Eye,
  EyeOff,
  Trash2,
  Check,
  AlertCircle,
  Shield,
  Webhook,
  Activity,
  MoreVertical,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'

export interface APIKey {
  id: string
  name: string
  key: string
  prefix: string
  createdAt: string
  lastUsed?: string
  expiresAt?: string
  rateLimit: number
  requestCount: number
  status: 'active' | 'expired' | 'revoked'
}

export interface Webhook {
  id: string
  url: string
  events: string[]
  secret: string
  status: 'active' | 'inactive'
  createdAt: string
  lastTriggered?: string
  deliveryCount: number
}

export interface APIKeyManagerProps {
  tenantId: string
  apiKeys: APIKey[]
  webhooks: Webhook[]
  onGenerateKey?: (name: string, rateLimit: number) => Promise<APIKey>
  onRevokeKey?: (keyId: string) => Promise<void>
  onRegenerateKey?: (keyId: string) => Promise<APIKey>
  onCreateWebhook?: (url: string, events: string[]) => Promise<Webhook>
  onDeleteWebhook?: (webhookId: string) => Promise<void>
  onTestWebhook?: (webhookId: string) => Promise<void>
  readOnly?: boolean
}

const availableEvents = [
  'user.created',
  'user.updated',
  'user.deleted',
  'project.created',
  'project.updated',
  'project.deleted',
  'payment.succeeded',
  'payment.failed',
]

export default function APIKeyManager({
  tenantId,
  apiKeys: initialKeys,
  webhooks: initialWebhooks,
  onGenerateKey,
  onRevokeKey,
  onRegenerateKey,
  onCreateWebhook,
  onDeleteWebhook,
  onTestWebhook,
  readOnly = false,
}: APIKeyManagerProps) {
  const [apiKeys, setApiKeys] = useState<APIKey[]>(initialKeys)
  const [webhooks, setWebhooks] = useState<Webhook[]>(initialWebhooks)
  const [keyDialogOpen, setKeyDialogOpen] = useState(false)
  const [webhookDialogOpen, setWebhookDialogOpen] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [newKeyRateLimit, setNewKeyRateLimit] = useState(1000)
  const [newWebhookUrl, setNewWebhookUrl] = useState('')
  const [selectedEvents, setSelectedEvents] = useState<string[]>([])
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set())
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<APIKey | null>(null)

  const handleGenerateKey = async () => {
    if (!newKeyName.trim()) return

    const newKey = await onGenerateKey?.(newKeyName, newKeyRateLimit)
    if (newKey) {
      setApiKeys(prev => [...prev, newKey])
      setNewlyCreatedKey(newKey)
      setNewKeyName('')
      setNewKeyRateLimit(1000)
      setKeyDialogOpen(false)
    }
  }

  const handleRevokeKey = async (keyId: string) => {
    await onRevokeKey?.(keyId)
    setApiKeys(prev =>
      prev.map(k => (k.id === keyId ? { ...k, status: 'revoked' as const } : k))
    )
  }

  const handleCopyKey = async (key: string, keyId: string) => {
    await navigator.clipboard.writeText(key)
    setCopiedKey(keyId)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const toggleKeyVisibility = (keyId: string) => {
    setRevealedKeys(prev => {
      const newSet = new Set(prev)
      if (newSet.has(keyId)) {
        newSet.delete(keyId)
      } else {
        newSet.add(keyId)
      }
      return newSet
    })
  }

  const handleCreateWebhook = async () => {
    if (!newWebhookUrl.trim() || selectedEvents.length === 0) return

    const webhook = await onCreateWebhook?.(newWebhookUrl, selectedEvents)
    if (webhook) {
      setWebhooks(prev => [...prev, webhook])
      setNewWebhookUrl('')
      setSelectedEvents([])
      setWebhookDialogOpen(false)
    }
  }

  const handleDeleteWebhook = async (webhookId: string) => {
    await onDeleteWebhook?.(webhookId)
    setWebhooks(prev => prev.filter(w => w.id !== webhookId))
  }

  const toggleEvent = (event: string) => {
    setSelectedEvents(prev =>
      prev.includes(event) ? prev.filter(e => e !== event) : [...prev, event]
    )
  }

  const getStatusBadge = (status: APIKey['status']) => {
    switch (status) {
      case 'active':
        return <Badge variant="default">Active</Badge>
      case 'expired':
        return <Badge variant="secondary">Expired</Badge>
      case 'revoked':
        return <Badge variant="destructive">Revoked</Badge>
    }
  }

  const maskKey = (key: string) => {
    return `${key.substring(0, 7)}${'•'.repeat(32)}${key.substring(key.length - 4)}`
  }

  const activeKeys = apiKeys.filter(k => k.status === 'active').length
  const totalRequests = apiKeys.reduce((sum, k) => sum + k.requestCount, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Key className="h-6 w-6" />
            API Key Manager
          </h2>
          <p className="text-sm text-muted-foreground">
            Generate and manage API keys, rate limits, and webhooks
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Active Keys</div>
            <div className="text-2xl font-bold">{activeKeys}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Total Requests</div>
            <div className="text-2xl font-bold">{totalRequests.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Newly Created Key Alert */}
      {newlyCreatedKey && (
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-semibold">API Key Created Successfully!</p>
              <p className="text-sm">
                Make sure to copy your API key now. You won't be able to see it again!
              </p>
              <div className="flex gap-2 mt-2">
                <Input
                  value={newlyCreatedKey.key}
                  readOnly
                  className="font-mono text-xs"
                />
                <Button
                  size="sm"
                  onClick={() => handleCopyKey(newlyCreatedKey.key, newlyCreatedKey.id)}
                >
                  {copiedKey === newlyCreatedKey.id ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setNewlyCreatedKey(null)}
              >
                Dismiss
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* API Keys Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                API Keys
              </CardTitle>
              <CardDescription>Manage your API keys and rate limits</CardDescription>
            </div>
            <Dialog open={keyDialogOpen} onOpenChange={setKeyDialogOpen}>
              <DialogTrigger asChild>
                <Button disabled={readOnly}>
                  <Plus className="h-4 w-4 mr-2" />
                  Generate Key
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Generate New API Key</DialogTitle>
                  <DialogDescription>
                    Create a new API key for programmatic access
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="key-name">Key Name</Label>
                    <Input
                      id="key-name"
                      placeholder="Production API Key"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rate-limit">Rate Limit (requests/minute)</Label>
                    <Input
                      id="rate-limit"
                      type="number"
                      value={newKeyRateLimit}
                      onChange={(e) => setNewKeyRateLimit(parseInt(e.target.value) || 0)}
                      min={1}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setKeyDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleGenerateKey} disabled={!newKeyName.trim()}>
                    Generate Key
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {apiKeys.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No API keys created yet
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Rate Limit</TableHead>
                  <TableHead>Requests</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiKeys.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell className="font-medium">{key.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-mono">
                          {revealedKeys.has(key.id) ? key.key : maskKey(key.key)}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleKeyVisibility(key.id)}
                        >
                          {revealedKeys.has(key.id) ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyKey(key.key, key.id)}
                        >
                          {copiedKey === key.id ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>{key.rateLimit.toLocaleString()}/min</TableCell>
                    <TableCell>{key.requestCount.toLocaleString()}</TableCell>
                    <TableCell>{getStatusBadge(key.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {key.lastUsed
                        ? new Date(key.lastUsed).toLocaleDateString()
                        : 'Never'}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" disabled={readOnly}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onRegenerateKey?.(key.id)}>
                            Regenerate Key
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleRevokeKey(key.id)}
                            className="text-destructive"
                            disabled={key.status === 'revoked'}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Revoke Key
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Webhooks Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="h-5 w-5" />
                Webhooks
              </CardTitle>
              <CardDescription>Configure webhook endpoints for events</CardDescription>
            </div>
            <Dialog open={webhookDialogOpen} onOpenChange={setWebhookDialogOpen}>
              <DialogTrigger asChild>
                <Button disabled={readOnly}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Webhook
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Webhook</DialogTitle>
                  <DialogDescription>
                    Configure a webhook endpoint to receive event notifications
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="webhook-url">Webhook URL</Label>
                    <Input
                      id="webhook-url"
                      placeholder="https://api.example.com/webhooks"
                      value={newWebhookUrl}
                      onChange={(e) => setNewWebhookUrl(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Events to Subscribe</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {availableEvents.map((event) => (
                        <div
                          key={event}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedEvents.includes(event)
                              ? 'border-primary bg-primary/10'
                              : 'hover:bg-muted/50'
                          }`}
                          onClick={() => toggleEvent(event)}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-4 h-4 rounded border flex items-center justify-center ${
                                selectedEvents.includes(event)
                                  ? 'bg-primary border-primary'
                                  : 'border-muted-foreground'
                              }`}
                            >
                              {selectedEvents.includes(event) && (
                                <Check className="h-3 w-3 text-primary-foreground" />
                              )}
                            </div>
                            <span className="text-sm font-mono">{event}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setWebhookDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateWebhook}
                    disabled={!newWebhookUrl.trim() || selectedEvents.length === 0}
                  >
                    Create Webhook
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {webhooks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No webhooks configured
            </div>
          ) : (
            <div className="space-y-4">
              {webhooks.map((webhook) => (
                <Card key={webhook.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-mono">{webhook.url}</code>
                          <Badge variant={webhook.status === 'active' ? 'default' : 'secondary'}>
                            {webhook.status}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {webhook.events.map((event) => (
                            <Badge key={event} variant="outline" className="text-xs">
                              {event}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>
                            <Activity className="h-3 w-3 inline mr-1" />
                            {webhook.deliveryCount} deliveries
                          </span>
                          {webhook.lastTriggered && (
                            <span>
                              Last triggered {new Date(webhook.lastTriggered).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onTestWebhook?.(webhook.id)}
                          disabled={readOnly}
                        >
                          Test
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteWebhook(webhook.id)}
                          disabled={readOnly}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
