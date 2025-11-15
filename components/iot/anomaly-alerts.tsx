'use client'

import { useState } from 'react'
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  Bell,
  BellOff,
  Filter,
  X,
  ExternalLink,
  Clock
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

export interface AnomalyAlert {
  id: string
  type: 'critical' | 'warning' | 'info'
  title: string
  description: string
  sensorId: string
  sensorName: string
  location: string
  detectedAt: string
  acknowledgedAt?: string
  resolvedAt?: string
  acknowledgedBy?: string
  value?: number
  expectedValue?: number
  threshold?: number
  unit?: string
  confidence: number
  severity: 1 | 2 | 3 | 4 | 5
  category: 'temperature' | 'humidity' | 'energy' | 'occupancy' | 'pressure' | 'other'
  actions?: Array<{
    label: string
    type: 'link' | 'button'
    url?: string
  }>
}

interface AnomalyAlertsProps {
  alerts: AnomalyAlert[]
  onAcknowledge?: (alertId: string) => void
  onResolve?: (alertId: string) => void
  onDismiss?: (alertId: string) => void
  notificationsEnabled?: boolean
  onToggleNotifications?: (enabled: boolean) => void
}

export function AnomalyAlerts({
  alerts,
  onAcknowledge,
  onResolve,
  onDismiss,
  notificationsEnabled = true,
  onToggleNotifications
}: AnomalyAlertsProps) {
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'acknowledged' | 'resolved'>('active')
  const [selectedTab, setSelectedTab] = useState('alerts')

  const getAlertIcon = (type: AnomalyAlert['type']) => {
    switch (type) {
      case 'critical':
        return AlertTriangle
      case 'warning':
        return AlertCircle
      case 'info':
        return Info
      default:
        return AlertCircle
    }
  }

  const getAlertColor = (type: AnomalyAlert['type']) => {
    switch (type) {
      case 'critical':
        return 'text-red-500'
      case 'warning':
        return 'text-yellow-500'
      case 'info':
        return 'text-blue-500'
      default:
        return 'text-gray-500'
    }
  }

  const getAlertBgColor = (type: AnomalyAlert['type']) => {
    switch (type) {
      case 'critical':
        return 'bg-red-500/10 border-red-500/20'
      case 'warning':
        return 'bg-yellow-500/10 border-yellow-500/20'
      case 'info':
        return 'bg-blue-500/10 border-blue-500/20'
      default:
        return 'bg-gray-500/10 border-gray-500/20'
    }
  }

  const getBadgeVariant = (type: AnomalyAlert['type']) => {
    switch (type) {
      case 'critical':
        return 'destructive'
      case 'warning':
        return 'secondary'
      case 'info':
        return 'default'
      default:
        return 'outline'
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleString()
  }

  const getAlertStatus = (alert: AnomalyAlert) => {
    if (alert.resolvedAt) return 'resolved'
    if (alert.acknowledgedAt) return 'acknowledged'
    return 'active'
  }

  const filteredAlerts = alerts.filter(alert => {
    const matchesType = filter === 'all' || alert.type === filter
    const status = getAlertStatus(alert)
    const matchesStatus = statusFilter === 'all' || status === statusFilter
    return matchesType && matchesStatus
  })

  const stats = {
    total: alerts.length,
    critical: alerts.filter(a => a.type === 'critical' && !a.resolvedAt).length,
    warning: alerts.filter(a => a.type === 'warning' && !a.resolvedAt).length,
    info: alerts.filter(a => a.type === 'info' && !a.resolvedAt).length,
    unacknowledged: alerts.filter(a => !a.acknowledgedAt && !a.resolvedAt).length,
  }

  const groupedByCategory = alerts.reduce((acc, alert) => {
    if (!acc[alert.category]) {
      acc[alert.category] = []
    }
    acc[alert.category].push(alert)
    return acc
  }, {} as Record<string, AnomalyAlert[]>)

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.unacknowledged}</div>
            <p className="text-xs text-muted-foreground">
              Require attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.critical}</div>
            <p className="text-xs text-muted-foreground">
              High priority
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warnings</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{stats.warning}</div>
            <p className="text-xs text-muted-foreground">
              Monitor closely
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notifications</CardTitle>
            {notificationsEnabled ? (
              <Bell className="h-4 w-4 text-green-500" />
            ) : (
              <BellOff className="h-4 w-4 text-muted-foreground" />
            )}
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Switch
                checked={notificationsEnabled}
                onCheckedChange={onToggleNotifications}
                id="notifications"
              />
              <Label htmlFor="notifications" className="text-xs">
                {notificationsEnabled ? 'Enabled' : 'Disabled'}
              </Label>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle>Anomaly Detection Alerts</CardTitle>
                  <CardDescription>Real-time alerts and notifications</CardDescription>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="acknowledged">Acknowledged</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-3">
                  {filteredAlerts.map(alert => {
                    const Icon = getAlertIcon(alert.type)
                    const status = getAlertStatus(alert)

                    return (
                      <div
                        key={alert.id}
                        className={`p-4 border rounded-lg ${getAlertBgColor(alert.type)}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1">
                            <Icon className={`h-5 w-5 mt-0.5 ${getAlertColor(alert.type)}`} />

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h4 className="font-semibold">{alert.title}</h4>
                                <Badge variant={getBadgeVariant(alert.type)}>
                                  {alert.type}
                                </Badge>
                                {status === 'acknowledged' && (
                                  <Badge variant="outline">Acknowledged</Badge>
                                )}
                                {status === 'resolved' && (
                                  <Badge variant="outline" className="bg-green-500/10 border-green-500">
                                    Resolved
                                  </Badge>
                                )}
                              </div>

                              <p className="text-sm text-muted-foreground mb-2">
                                {alert.description}
                              </p>

                              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-3">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatTimestamp(alert.detectedAt)}
                                </span>
                                <span>•</span>
                                <span>{alert.sensorName}</span>
                                <span>•</span>
                                <span>{alert.location}</span>
                                {alert.value && (
                                  <>
                                    <span>•</span>
                                    <span className="font-medium">
                                      {alert.value.toFixed(2)} {alert.unit}
                                    </span>
                                  </>
                                )}
                                {alert.confidence && (
                                  <>
                                    <span>•</span>
                                    <span>
                                      Confidence: {(alert.confidence * 100).toFixed(0)}%
                                    </span>
                                  </>
                                )}
                              </div>

                              {alert.expectedValue && alert.value && (
                                <div className="text-xs mb-3">
                                  <span className="text-muted-foreground">Expected: </span>
                                  <span className="font-medium">
                                    {alert.expectedValue.toFixed(2)} {alert.unit}
                                  </span>
                                  <span className="text-muted-foreground"> • Deviation: </span>
                                  <span className={`font-medium ${getAlertColor(alert.type)}`}>
                                    {Math.abs(alert.value - alert.expectedValue).toFixed(2)} {alert.unit}
                                  </span>
                                </div>
                              )}

                              <div className="flex flex-wrap gap-2">
                                {!alert.acknowledgedAt && !alert.resolvedAt && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => onAcknowledge?.(alert.id)}
                                  >
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Acknowledge
                                  </Button>
                                )}
                                {alert.acknowledgedAt && !alert.resolvedAt && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => onResolve?.(alert.id)}
                                  >
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Mark Resolved
                                  </Button>
                                )}
                                {alert.actions?.map((action, idx) => (
                                  <Button
                                    key={idx}
                                    size="sm"
                                    variant="outline"
                                    onClick={() => action.url && window.open(action.url, '_blank')}
                                  >
                                    {action.label}
                                    {action.type === 'link' && <ExternalLink className="h-3 w-3 ml-1" />}
                                  </Button>
                                ))}
                              </div>

                              {alert.acknowledgedBy && (
                                <p className="text-xs text-muted-foreground mt-2">
                                  Acknowledged by {alert.acknowledgedBy} {formatTimestamp(alert.acknowledgedAt!)}
                                </p>
                              )}
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => onDismiss?.(alert.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}

                  {filteredAlerts.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No alerts matching your filters</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {Object.entries(groupedByCategory).map(([category, categoryAlerts]) => {
              const active = categoryAlerts.filter(a => !a.resolvedAt).length
              const resolved = categoryAlerts.filter(a => a.resolvedAt).length

              return (
                <Card key={category}>
                  <CardHeader>
                    <CardTitle className="text-base capitalize">
                      {category.replace('_', ' ')}
                    </CardTitle>
                    <CardDescription>
                      {categoryAlerts.length} total alerts
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Active</span>
                      <span className="font-bold text-red-500">{active}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Resolved</span>
                      <span className="font-bold text-green-500">{resolved}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Resolution Rate</span>
                      <span className="font-bold">
                        {categoryAlerts.length > 0
                          ? ((resolved / categoryAlerts.length) * 100).toFixed(1)
                          : 0}%
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
