'use client'

import { useState } from 'react'
import {
  Globe,
  Shield,
  Check,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Copy,
  Settings,
  Lock,
  Unlock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export type DomainStatus = 'pending' | 'verifying' | 'active' | 'failed'
export type SSLStatus = 'pending' | 'active' | 'expired' | 'error'

export interface DomainConfig {
  subdomain?: string
  customDomain?: string
  status: DomainStatus
  verificationMethod?: 'dns' | 'http'
  dnsRecords?: DNSRecord[]
  sslStatus: SSLStatus
  sslExpiresAt?: string
  autoRenewSSL: boolean
}

export interface DNSRecord {
  type: 'A' | 'CNAME' | 'TXT'
  name: string
  value: string
  ttl: number
  verified: boolean
}

export interface SubdomainConfigProps {
  tenantId: string
  tenantSlug: string
  domainConfig: DomainConfig
  baseDomain?: string
  onSave?: (config: DomainConfig) => Promise<void>
  onVerifyDomain?: () => Promise<void>
  onProvisionSSL?: () => Promise<void>
  onRenewSSL?: () => Promise<void>
  readOnly?: boolean
}

export default function SubdomainConfig({
  tenantId,
  tenantSlug,
  domainConfig: initialConfig,
  baseDomain = 'abode-ai.com',
  onSave,
  onVerifyDomain,
  onProvisionSSL,
  onRenewSSL,
  readOnly = false,
}: SubdomainConfigProps) {
  const [config, setConfig] = useState<DomainConfig>(initialConfig)
  const [isSaving, setIsSaving] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isProvisioningSSL, setIsProvisioningSSL] = useState(false)
  const [saved, setSaved] = useState(false)
  const [copiedRecord, setCopiedRecord] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const updateConfig = (updates: Partial<DomainConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }))
    setSaved(false)
  }

  const handleSave = async () => {
    const newErrors: Record<string, string> = {}

    if (config.subdomain && !/^[a-z0-9-]+$/.test(config.subdomain)) {
      newErrors.subdomain = 'Subdomain must contain only lowercase letters, numbers, and hyphens'
    }

    if (config.customDomain && !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(config.customDomain)) {
      newErrors.customDomain = 'Invalid domain format'
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
      setErrors({ general: 'Failed to save domain configuration' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleVerifyDomain = async () => {
    setIsVerifying(true)
    try {
      await onVerifyDomain?.()
      updateConfig({ status: 'active' })
    } catch (error) {
      setErrors({ verify: 'Domain verification failed' })
    } finally {
      setIsVerifying(false)
    }
  }

  const handleProvisionSSL = async () => {
    setIsProvisioningSSL(true)
    try {
      await onProvisionSSL?.()
      updateConfig({ sslStatus: 'active' })
    } catch (error) {
      setErrors({ ssl: 'SSL provisioning failed' })
    } finally {
      setIsProvisioningSSL(false)
    }
  }

  const handleCopyRecord = async (value: string, recordType: string) => {
    await navigator.clipboard.writeText(value)
    setCopiedRecord(recordType)
    setTimeout(() => setCopiedRecord(null), 2000)
  }

  const getStatusBadge = (status: DomainStatus) => {
    switch (status) {
      case 'active':
        return (
          <Badge variant="default" className="gap-1">
            <Check className="h-3 w-3" />
            Active
          </Badge>
        )
      case 'pending':
        return (
          <Badge variant="secondary" className="gap-1">
            <RefreshCw className="h-3 w-3" />
            Pending
          </Badge>
        )
      case 'verifying':
        return (
          <Badge variant="secondary" className="gap-1">
            <RefreshCw className="h-3 w-3 animate-spin" />
            Verifying
          </Badge>
        )
      case 'failed':
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            Failed
          </Badge>
        )
    }
  }

  const getSSLBadge = (status: SSLStatus) => {
    switch (status) {
      case 'active':
        return (
          <Badge variant="default" className="gap-1">
            <Lock className="h-3 w-3" />
            Active
          </Badge>
        )
      case 'pending':
        return (
          <Badge variant="secondary" className="gap-1">
            <RefreshCw className="h-3 w-3" />
            Pending
          </Badge>
        )
      case 'expired':
        return (
          <Badge variant="destructive" className="gap-1">
            <Unlock className="h-3 w-3" />
            Expired
          </Badge>
        )
      case 'error':
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            Error
          </Badge>
        )
    }
  }

  const subdomainUrl = config.subdomain ? `https://${config.subdomain}.${baseDomain}` : null
  const customDomainUrl = config.customDomain ? `https://${config.customDomain}` : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Globe className="h-6 w-6" />
            Domain Configuration
          </h2>
          <p className="text-sm text-muted-foreground">
            Configure custom subdomain or domain with SSL certificates
          </p>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(config.status)}
          {getSSLBadge(config.sslStatus)}
        </div>
      </div>

      {errors.general && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errors.general}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="subdomain" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="subdomain">
            <Globe className="h-4 w-4 mr-2" />
            Subdomain
          </TabsTrigger>
          <TabsTrigger value="custom">
            <Settings className="h-4 w-4 mr-2" />
            Custom Domain
          </TabsTrigger>
          <TabsTrigger value="ssl">
            <Shield className="h-4 w-4 mr-2" />
            SSL Certificate
          </TabsTrigger>
        </TabsList>

        {/* Subdomain Tab */}
        <TabsContent value="subdomain" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Subdomain Configuration</CardTitle>
              <CardDescription>
                Configure your tenant subdomain on {baseDomain}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subdomain">Subdomain</Label>
                <div className="flex gap-2">
                  <Input
                    id="subdomain"
                    value={config.subdomain || ''}
                    onChange={(e) => updateConfig({ subdomain: e.target.value.toLowerCase() })}
                    placeholder={tenantSlug}
                    disabled={readOnly}
                  />
                  <div className="flex items-center text-muted-foreground whitespace-nowrap px-3 border rounded-md bg-muted">
                    .{baseDomain}
                  </div>
                </div>
                {errors.subdomain && (
                  <p className="text-sm text-destructive">{errors.subdomain}</p>
                )}
              </div>

              {subdomainUrl && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label>Your Subdomain URL</Label>
                    <div className="flex gap-2">
                      <Input value={subdomainUrl} readOnly className="font-mono" />
                      <Button
                        variant="outline"
                        onClick={() => handleCopyRecord(subdomainUrl, 'subdomain-url')}
                      >
                        {copiedRecord === 'subdomain-url' ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      <Button variant="outline" asChild>
                        <a href={subdomainUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Custom Domain Tab */}
        <TabsContent value="custom" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Custom Domain</CardTitle>
              <CardDescription>
                Use your own domain name for your tenant
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="custom-domain">Domain Name</Label>
                <Input
                  id="custom-domain"
                  value={config.customDomain || ''}
                  onChange={(e) => updateConfig({ customDomain: e.target.value.toLowerCase() })}
                  placeholder="app.yourdomain.com"
                  disabled={readOnly}
                />
                {errors.customDomain && (
                  <p className="text-sm text-destructive">{errors.customDomain}</p>
                )}
              </div>

              {config.customDomain && (
                <>
                  <Separator />

                  <div className="space-y-2">
                    <Label>Verification Method</Label>
                    <Select
                      value={config.verificationMethod || 'dns'}
                      onValueChange={(v) =>
                        updateConfig({ verificationMethod: v as 'dns' | 'http' })
                      }
                      disabled={readOnly}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dns">DNS Verification</SelectItem>
                        <SelectItem value="http">HTTP Verification</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {config.dnsRecords && config.dnsRecords.length > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        <Label>Required DNS Records</Label>
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Add these DNS records to your domain's DNS settings
                          </AlertDescription>
                        </Alert>

                        {config.dnsRecords.map((record, index) => (
                          <Card key={index}>
                            <CardContent className="p-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <Badge variant="outline">{record.type} Record</Badge>
                                {record.verified ? (
                                  <Badge variant="default" className="gap-1">
                                    <Check className="h-3 w-3" />
                                    Verified
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary">Not Verified</Badge>
                                )}
                              </div>

                              <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                  <Label className="text-xs text-muted-foreground">Name</Label>
                                  <div className="font-mono mt-1">{record.name}</div>
                                </div>
                                <div>
                                  <Label className="text-xs text-muted-foreground">TTL</Label>
                                  <div className="font-mono mt-1">{record.ttl}</div>
                                </div>
                              </div>

                              <div>
                                <Label className="text-xs text-muted-foreground">Value</Label>
                                <div className="flex gap-2 mt-1">
                                  <Input
                                    value={record.value}
                                    readOnly
                                    className="font-mono text-xs"
                                  />
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      handleCopyRecord(record.value, `${record.type}-${index}`)
                                    }
                                  >
                                    {copiedRecord === `${record.type}-${index}` ? (
                                      <Check className="h-4 w-4" />
                                    ) : (
                                      <Copy className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      <Button
                        onClick={handleVerifyDomain}
                        disabled={isVerifying || readOnly}
                        className="w-full"
                      >
                        {isVerifying ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Verify Domain
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SSL Certificate Tab */}
        <TabsContent value="ssl" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SSL Certificate</CardTitle>
              <CardDescription>
                Manage SSL/TLS certificates for secure HTTPS connections
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    <span className="font-semibold">SSL Status</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {config.sslStatus === 'active'
                      ? 'Your SSL certificate is active and valid'
                      : 'SSL certificate needs to be provisioned'}
                  </p>
                </div>
                {getSSLBadge(config.sslStatus)}
              </div>

              {config.sslStatus === 'active' && config.sslExpiresAt && (
                <div className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Expiration Date</span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(config.sslExpiresAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Days Remaining</span>
                    <span className="text-sm text-muted-foreground">
                      {Math.ceil(
                        (new Date(config.sslExpiresAt).getTime() - Date.now()) /
                          (1000 * 60 * 60 * 24)
                      )}{' '}
                      days
                    </span>
                  </div>
                </div>
              )}

              <Separator />

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-0.5">
                  <Label>Auto-Renew SSL</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically renew SSL certificate before expiration
                  </p>
                </div>
                <Switch
                  checked={config.autoRenewSSL}
                  onCheckedChange={(checked) => updateConfig({ autoRenewSSL: checked })}
                  disabled={readOnly}
                />
              </div>

              <div className="flex gap-2">
                {config.sslStatus === 'pending' || config.sslStatus === 'error' ? (
                  <Button
                    onClick={handleProvisionSSL}
                    disabled={isProvisioningSSL || readOnly}
                    className="flex-1"
                  >
                    {isProvisioningSSL ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Provisioning...
                      </>
                    ) : (
                      <>
                        <Shield className="h-4 w-4 mr-2" />
                        Provision SSL
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={onRenewSSL}
                    disabled={readOnly}
                    className="flex-1"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Renew Certificate
                  </Button>
                )}
              </div>

              {errors.ssl && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errors.ssl}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t">
        <Button onClick={handleSave} disabled={readOnly || isSaving} size="lg">
          {isSaving ? (
            'Saving...'
          ) : saved ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Saved
            </>
          ) : (
            'Save Configuration'
          )}
        </Button>
      </div>
    </div>
  )
}
