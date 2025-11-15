'use client'

import { useState } from 'react'
import {
  Building2,
  Globe,
  Shield,
  Database,
  Save,
  AlertCircle,
  Check,
  Settings,
  Users,
  Lock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'

export interface TenantConfig {
  id: string
  name: string
  slug: string
  domain?: string
  subdomain?: string
  status: 'active' | 'suspended' | 'trial'
  plan: 'free' | 'starter' | 'pro' | 'enterprise'
  maxUsers: number
  maxStorage: number
  dataRegion: string
  isolationLevel: 'shared' | 'dedicated'
  ssoEnabled: boolean
  customDomainEnabled: boolean
  apiAccessEnabled: boolean
}

export interface TenantSettingsProps {
  tenant: TenantConfig
  onSave?: (config: TenantConfig) => Promise<void>
  onDelete?: () => Promise<void>
  onSuspend?: () => Promise<void>
  readOnly?: boolean
}

const dataRegions = [
  { value: 'us-east-1', label: 'US East (N. Virginia)' },
  { value: 'us-west-2', label: 'US West (Oregon)' },
  { value: 'eu-west-1', label: 'EU (Ireland)' },
  { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
]

export default function TenantSettings({
  tenant,
  onSave,
  onDelete,
  onSuspend,
  readOnly = false,
}: TenantSettingsProps) {
  const [config, setConfig] = useState<TenantConfig>(tenant)
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSave = async () => {
    const newErrors: Record<string, string> = {}

    if (!config.name.trim()) {
      newErrors.name = 'Tenant name is required'
    }

    if (!config.slug.trim()) {
      newErrors.slug = 'Tenant slug is required'
    } else if (!/^[a-z0-9-]+$/.test(config.slug)) {
      newErrors.slug = 'Slug must contain only lowercase letters, numbers, and hyphens'
    }

    if (config.customDomainEnabled && config.domain && !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(config.domain)) {
      newErrors.domain = 'Invalid domain format'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsSaving(true)
    setErrors({})

    try {
      await onSave?.(config)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      setErrors({ general: 'Failed to save tenant settings' })
    } finally {
      setIsSaving(false)
    }
  }

  const updateConfig = (updates: Partial<TenantConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }))
    setSaved(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            Tenant Configuration
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage multi-tenant settings, domain mapping, and tenant isolation
          </p>
        </div>
        <Badge
          variant={
            config.status === 'active' ? 'default' :
            config.status === 'trial' ? 'secondary' : 'destructive'
          }
        >
          {config.status.toUpperCase()}
        </Badge>
      </div>

      {errors.general && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errors.general}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">
            <Settings className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="domains">
            <Globe className="h-4 w-4 mr-2" />
            Domains
          </TabsTrigger>
          <TabsTrigger value="isolation">
            <Shield className="h-4 w-4 mr-2" />
            Isolation
          </TabsTrigger>
          <TabsTrigger value="limits">
            <Database className="h-4 w-4 mr-2" />
            Limits
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Configure tenant identity and metadata</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tenant-id">Tenant ID</Label>
                <Input id="tenant-id" value={config.id} disabled />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tenant-name">Tenant Name *</Label>
                <Input
                  id="tenant-name"
                  value={config.name}
                  onChange={(e) => updateConfig({ name: e.target.value })}
                  disabled={readOnly}
                  placeholder="Acme Corporation"
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tenant-slug">Tenant Slug *</Label>
                <Input
                  id="tenant-slug"
                  value={config.slug}
                  onChange={(e) => updateConfig({ slug: e.target.value.toLowerCase() })}
                  disabled={readOnly}
                  placeholder="acme-corp"
                />
                {errors.slug && (
                  <p className="text-sm text-destructive">{errors.slug}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="plan">Subscription Plan</Label>
                <Select
                  value={config.plan}
                  onValueChange={(v) => updateConfig({ plan: v as TenantConfig['plan'] })}
                  disabled={readOnly}
                >
                  <SelectTrigger id="plan">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="starter">Starter</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Domain Settings */}
        <TabsContent value="domains" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Domain Mapping</CardTitle>
              <CardDescription>Configure custom domains and subdomains</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subdomain">Subdomain</Label>
                <div className="flex gap-2">
                  <Input
                    id="subdomain"
                    value={config.subdomain || ''}
                    onChange={(e) => updateConfig({ subdomain: e.target.value })}
                    disabled={readOnly}
                    placeholder="acme"
                  />
                  <div className="flex items-center text-muted-foreground whitespace-nowrap">
                    .abode-ai.com
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-0.5">
                  <Label>Custom Domain</Label>
                  <p className="text-xs text-muted-foreground">
                    Enable custom domain mapping
                  </p>
                </div>
                <Switch
                  checked={config.customDomainEnabled}
                  onCheckedChange={(checked) => updateConfig({ customDomainEnabled: checked })}
                  disabled={readOnly}
                />
              </div>

              {config.customDomainEnabled && (
                <div className="space-y-2">
                  <Label htmlFor="custom-domain">Custom Domain</Label>
                  <Input
                    id="custom-domain"
                    value={config.domain || ''}
                    onChange={(e) => updateConfig({ domain: e.target.value })}
                    disabled={readOnly}
                    placeholder="app.acmecorp.com"
                  />
                  {errors.domain && (
                    <p className="text-sm text-destructive">{errors.domain}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Isolation Settings */}
        <TabsContent value="isolation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Isolation</CardTitle>
              <CardDescription>Configure tenant isolation and security</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="isolation-level">Isolation Level</Label>
                <Select
                  value={config.isolationLevel}
                  onValueChange={(v) => updateConfig({ isolationLevel: v as TenantConfig['isolationLevel'] })}
                  disabled={readOnly}
                >
                  <SelectTrigger id="isolation-level">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shared">
                      <div>
                        <p className="font-medium">Shared</p>
                        <p className="text-xs text-muted-foreground">Shared database, logical isolation</p>
                      </div>
                    </SelectItem>
                    <SelectItem value="dedicated">
                      <div>
                        <p className="font-medium">Dedicated</p>
                        <p className="text-xs text-muted-foreground">Dedicated database instance</p>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="data-region">Data Region</Label>
                <Select
                  value={config.dataRegion}
                  onValueChange={(v) => updateConfig({ dataRegion: v })}
                  disabled={readOnly}
                >
                  <SelectTrigger id="data-region">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {dataRegions.map((region) => (
                      <SelectItem key={region.value} value={region.value}>
                        {region.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-0.5">
                  <Label>SSO Enabled</Label>
                  <p className="text-xs text-muted-foreground">
                    Enable single sign-on authentication
                  </p>
                </div>
                <Switch
                  checked={config.ssoEnabled}
                  onCheckedChange={(checked) => updateConfig({ ssoEnabled: checked })}
                  disabled={readOnly}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-0.5">
                  <Label>API Access</Label>
                  <p className="text-xs text-muted-foreground">
                    Enable API access for this tenant
                  </p>
                </div>
                <Switch
                  checked={config.apiAccessEnabled}
                  onCheckedChange={(checked) => updateConfig({ apiAccessEnabled: checked })}
                  disabled={readOnly}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Resource Limits */}
        <TabsContent value="limits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resource Limits</CardTitle>
              <CardDescription>Configure usage limits for this tenant</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="max-users">Maximum Users</Label>
                <Input
                  id="max-users"
                  type="number"
                  value={config.maxUsers}
                  onChange={(e) => updateConfig({ maxUsers: parseInt(e.target.value) || 0 })}
                  disabled={readOnly}
                  min={1}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max-storage">Maximum Storage (GB)</Label>
                <Input
                  id="max-storage"
                  type="number"
                  value={config.maxStorage}
                  onChange={(e) => updateConfig({ maxStorage: parseInt(e.target.value) || 0 })}
                  disabled={readOnly}
                  min={1}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <div className="flex justify-between items-center pt-4 border-t">
        <div className="flex gap-2">
          {onSuspend && (
            <Button variant="outline" onClick={onSuspend} disabled={readOnly}>
              <Lock className="h-4 w-4 mr-2" />
              Suspend Tenant
            </Button>
          )}
          {onDelete && (
            <Button variant="destructive" onClick={onDelete} disabled={readOnly}>
              Delete Tenant
            </Button>
          )}
        </div>
        <Button onClick={handleSave} disabled={readOnly || isSaving}>
          {isSaving ? (
            'Saving...'
          ) : saved ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Saved
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
