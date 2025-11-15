'use client'

import { useState } from 'react'
import {
  Zap,
  Search,
  Save,
  Check,
  AlertCircle,
  TrendingUp,
  Shield,
  Database,
  Users,
  Gauge,
  Lock,
  Unlock,
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

export interface FeatureLimit {
  enabled: boolean
  maxRequests?: number
  maxStorage?: number
  maxUsers?: number
  rateLimit?: number
}

export interface Feature {
  id: string
  name: string
  description: string
  category: 'core' | 'advanced' | 'enterprise' | 'beta'
  enabled: boolean
  limits?: FeatureLimit
  requiredPlan: 'free' | 'starter' | 'pro' | 'enterprise'
  usageCount?: number
}

export interface FeatureTogglesProps {
  tenantId: string
  tenantPlan: 'free' | 'starter' | 'pro' | 'enterprise'
  features: Feature[]
  onSave?: (features: Feature[]) => Promise<void>
  onFeatureToggle?: (featureId: string, enabled: boolean) => void
  readOnly?: boolean
}

const featureCategories = [
  { value: 'all', label: 'All Features' },
  { value: 'core', label: 'Core Features' },
  { value: 'advanced', label: 'Advanced Features' },
  { value: 'enterprise', label: 'Enterprise Features' },
  { value: 'beta', label: 'Beta Features' },
]

const getCategoryIcon = (category: Feature['category']) => {
  switch (category) {
    case 'core':
      return <Zap className="h-4 w-4" />
    case 'advanced':
      return <TrendingUp className="h-4 w-4" />
    case 'enterprise':
      return <Shield className="h-4 w-4" />
    case 'beta':
      return <Database className="h-4 w-4" />
  }
}

const getCategoryColor = (category: Feature['category']) => {
  switch (category) {
    case 'core':
      return 'bg-blue-500/10 text-blue-500'
    case 'advanced':
      return 'bg-purple-500/10 text-purple-500'
    case 'enterprise':
      return 'bg-amber-500/10 text-amber-500'
    case 'beta':
      return 'bg-green-500/10 text-green-500'
  }
}

export default function FeatureToggles({
  tenantId,
  tenantPlan,
  features: initialFeatures,
  onSave,
  onFeatureToggle,
  readOnly = false,
}: FeatureTogglesProps) {
  const [features, setFeatures] = useState<Feature[]>(initialFeatures)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const filteredFeatures = features.filter((feature) => {
    const matchesSearch = feature.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feature.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || feature.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const handleToggle = (featureId: string, enabled: boolean) => {
    setFeatures(prev =>
      prev.map(f => f.id === featureId ? { ...f, enabled } : f)
    )
    onFeatureToggle?.(featureId, enabled)
    setSaved(false)
  }

  const updateFeatureLimit = (
    featureId: string,
    limitKey: keyof FeatureLimit,
    value: boolean | number
  ) => {
    setFeatures(prev =>
      prev.map(f =>
        f.id === featureId
          ? {
              ...f,
              limits: {
                ...f.limits,
                [limitKey]: value,
              } as FeatureLimit,
            }
          : f
      )
    )
    setSaved(false)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave?.(features)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Failed to save feature toggles:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const isFeatureAvailable = (feature: Feature) => {
    const planHierarchy = ['free', 'starter', 'pro', 'enterprise']
    const currentPlanIndex = planHierarchy.indexOf(tenantPlan)
    const requiredPlanIndex = planHierarchy.indexOf(feature.requiredPlan)
    return currentPlanIndex >= requiredPlanIndex
  }

  const enabledCount = features.filter(f => f.enabled).length
  const availableCount = features.filter(f => isFeatureAvailable(f)).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="h-6 w-6" />
            Feature Toggles
          </h2>
          <p className="text-sm text-muted-foreground">
            Enable or disable features per tenant with usage limits
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Active Features</div>
            <div className="text-2xl font-bold">
              {enabledCount} / {availableCount}
            </div>
          </div>
          <Badge variant="outline" className="text-sm">
            {tenantPlan.toUpperCase()} Plan
          </Badge>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search features..."
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {featureCategories.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Features List */}
      <div className="space-y-3">
        {filteredFeatures.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No features found</p>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search or filter criteria
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredFeatures.map((feature) => {
            const available = isFeatureAvailable(feature)
            return (
              <Card key={feature.id} className={!available ? 'opacity-60' : ''}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      {/* Feature Header */}
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg">{feature.name}</h3>
                            <Badge
                              variant="secondary"
                              className={getCategoryColor(feature.category)}
                            >
                              {getCategoryIcon(feature.category)}
                              <span className="ml-1">{feature.category}</span>
                            </Badge>
                            {!available && (
                              <Badge variant="outline" className="gap-1">
                                <Lock className="h-3 w-3" />
                                {feature.requiredPlan}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {feature.description}
                          </p>
                        </div>
                        <Switch
                          checked={feature.enabled}
                          onCheckedChange={(checked) => handleToggle(feature.id, checked)}
                          disabled={!available || readOnly}
                        />
                      </div>

                      {/* Usage Stats */}
                      {feature.usageCount !== undefined && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Gauge className="h-3 w-3" />
                          <span>Used {feature.usageCount} times</span>
                        </div>
                      )}

                      {/* Feature Limits */}
                      {feature.enabled && feature.limits && (
                        <>
                          <Separator />
                          <div className="space-y-3 pt-2">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase">
                              Usage Limits
                            </Label>
                            <div className="grid grid-cols-2 gap-4">
                              {feature.limits.maxRequests !== undefined && (
                                <div className="space-y-2">
                                  <Label className="text-sm">Max Requests</Label>
                                  <Input
                                    type="number"
                                    value={feature.limits.maxRequests}
                                    onChange={(e) =>
                                      updateFeatureLimit(
                                        feature.id,
                                        'maxRequests',
                                        parseInt(e.target.value) || 0
                                      )
                                    }
                                    disabled={readOnly}
                                    min={0}
                                  />
                                </div>
                              )}
                              {feature.limits.maxStorage !== undefined && (
                                <div className="space-y-2">
                                  <Label className="text-sm">Max Storage (GB)</Label>
                                  <Input
                                    type="number"
                                    value={feature.limits.maxStorage}
                                    onChange={(e) =>
                                      updateFeatureLimit(
                                        feature.id,
                                        'maxStorage',
                                        parseInt(e.target.value) || 0
                                      )
                                    }
                                    disabled={readOnly}
                                    min={0}
                                  />
                                </div>
                              )}
                              {feature.limits.maxUsers !== undefined && (
                                <div className="space-y-2">
                                  <Label className="text-sm">Max Users</Label>
                                  <Input
                                    type="number"
                                    value={feature.limits.maxUsers}
                                    onChange={(e) =>
                                      updateFeatureLimit(
                                        feature.id,
                                        'maxUsers',
                                        parseInt(e.target.value) || 0
                                      )
                                    }
                                    disabled={readOnly}
                                    min={0}
                                  />
                                </div>
                              )}
                              {feature.limits.rateLimit !== undefined && (
                                <div className="space-y-2">
                                  <Label className="text-sm">Rate Limit (req/min)</Label>
                                  <Input
                                    type="number"
                                    value={feature.limits.rateLimit}
                                    onChange={(e) =>
                                      updateFeatureLimit(
                                        feature.id,
                                        'rateLimit',
                                        parseInt(e.target.value) || 0
                                      )
                                    }
                                    disabled={readOnly}
                                    min={0}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

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
