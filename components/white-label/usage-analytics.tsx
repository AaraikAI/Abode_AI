'use client'

import { useState } from 'react'
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  Users,
  Activity,
  Database,
  Clock,
  Filter,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'

export interface UsageMetric {
  date: string
  activeUsers: number
  apiRequests: number
  storageUsed: number
  features: Record<string, number>
}

export interface ActivityEvent {
  id: string
  userId: string
  userName: string
  action: string
  resource: string
  timestamp: string
  metadata?: Record<string, unknown>
}

export interface UsageStats {
  totalUsers: number
  activeUsers: number
  totalRequests: number
  avgResponseTime: number
  storageUsed: number
  storageLimit: number
  bandwidthUsed: number
}

export type ExportFormat = 'csv' | 'json' | 'pdf'
export type TimePeriod = '7d' | '30d' | '90d' | 'all'

export interface UsageAnalyticsProps {
  tenantId: string
  metrics: UsageMetric[]
  activities: ActivityEvent[]
  stats: UsageStats
  onExport?: (format: ExportFormat, period: TimePeriod) => Promise<void>
  onRefresh?: () => Promise<void>
}

export default function UsageAnalytics({
  tenantId,
  metrics,
  activities,
  stats,
  onExport,
  onRefresh,
}: UsageAnalyticsProps) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('30d')
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv')
  const [isExporting, setIsExporting] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    try {
      await onExport?.(exportFormat, timePeriod)
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await onRefresh?.()
    } catch (error) {
      console.error('Refresh failed:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const getTimePeriodLabel = (period: TimePeriod) => {
    switch (period) {
      case '7d':
        return 'Last 7 days'
      case '30d':
        return 'Last 30 days'
      case '90d':
        return 'Last 90 days'
      case 'all':
        return 'All time'
    }
  }

  const filteredMetrics = metrics.slice(-(timePeriod === '7d' ? 7 : timePeriod === '30d' ? 30 : timePeriod === '90d' ? 90 : metrics.length))

  const totalApiRequests = filteredMetrics.reduce((sum, m) => sum + m.apiRequests, 0)
  const avgActiveUsers = Math.round(
    filteredMetrics.reduce((sum, m) => sum + m.activeUsers, 0) / filteredMetrics.length
  )

  const storagePercentage = (stats.storageUsed / stats.storageLimit) * 100

  const topFeatures = Object.entries(
    filteredMetrics.reduce((acc, metric) => {
      Object.entries(metric.features).forEach(([feature, count]) => {
        acc[feature] = (acc[feature] || 0) + count
      })
      return acc
    }, {} as Record<string, number>)
  )
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Usage Analytics
          </h2>
          <p className="text-sm text-muted-foreground">
            Monitor tenant usage analytics, activity tracking, and export data
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timePeriod} onValueChange={(v) => setTimePeriod(v as TimePeriod)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            <Activity className="h-4 w-4 mr-2" />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Key Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeUsers} active in {getTimePeriodLabel(timePeriod).toLowerCase()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Requests</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalApiRequests.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Avg response: {stats.avgResponseTime}ms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats.storageUsed / 1024).toFixed(1)} GB
            </div>
            <Progress value={storagePercentage} className="mt-2 h-1" />
            <p className="text-xs text-muted-foreground mt-1">
              {storagePercentage.toFixed(1)}% of {(stats.storageLimit / 1024).toFixed(0)} GB
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bandwidth</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats.bandwidthUsed / 1024 / 1024).toFixed(1)} GB
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Usage Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Usage Trend
            </CardTitle>
            <CardDescription>
              {getTimePeriodLabel(timePeriod)} overview
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Active Users</span>
                  <span className="text-sm text-muted-foreground">{avgActiveUsers}</span>
                </div>
                <div className="h-32 flex items-end gap-1">
                  {filteredMetrics.slice(-14).map((metric, i) => {
                    const maxUsers = Math.max(...filteredMetrics.map(m => m.activeUsers))
                    const height = (metric.activeUsers / maxUsers) * 100
                    return (
                      <div
                        key={i}
                        className="flex-1 bg-primary rounded-t transition-all hover:opacity-80"
                        style={{ height: `${height}%` }}
                        title={`${new Date(metric.date).toLocaleDateString()}: ${metric.activeUsers} users`}
                      />
                    )
                  })}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">API Requests</span>
                  <span className="text-sm text-muted-foreground">
                    {totalApiRequests.toLocaleString()}
                  </span>
                </div>
                <div className="h-32 flex items-end gap-1">
                  {filteredMetrics.slice(-14).map((metric, i) => {
                    const maxRequests = Math.max(...filteredMetrics.map(m => m.apiRequests))
                    const height = (metric.apiRequests / maxRequests) * 100
                    return (
                      <div
                        key={i}
                        className="flex-1 bg-blue-500 rounded-t transition-all hover:opacity-80"
                        style={{ height: `${height}%` }}
                        title={`${new Date(metric.date).toLocaleDateString()}: ${metric.apiRequests.toLocaleString()} requests`}
                      />
                    )
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Features */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Top Features
            </CardTitle>
            <CardDescription>Most used features</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topFeatures.map(([feature, count], index) => {
                const maxCount = topFeatures[0]?.[1] || 1
                const percentage = (count / maxCount) * 100
                return (
                  <div key={feature} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="w-6 h-6 flex items-center justify-center p-0">
                          {index + 1}
                        </Badge>
                        <span className="text-sm font-medium">{feature}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {count.toLocaleString()}
                      </span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                )
              })}
              {topFeatures.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No feature usage data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Feed */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>Latest user actions and events</CardDescription>
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="user">User Actions</SelectItem>
                <SelectItem value="project">Project Actions</SelectItem>
                <SelectItem value="api">API Calls</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No recent activity
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.slice(0, 10).map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell>
                      <div className="font-medium">{activity.userName}</div>
                      <div className="text-xs text-muted-foreground">
                        {activity.userId}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{activity.action}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {activity.resource}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(activity.timestamp).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Export Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Export Data
          </CardTitle>
          <CardDescription>
            Download usage analytics and activity data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Select value={exportFormat} onValueChange={(v) => setExportFormat(v as ExportFormat)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV Format</SelectItem>
                <SelectItem value="json">JSON Format</SelectItem>
                <SelectItem value="pdf">PDF Report</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={handleExport} disabled={isExporting}>
              {isExporting ? (
                'Exporting...'
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export {exportFormat.toUpperCase()}
                </>
              )}
            </Button>

            <div className="text-sm text-muted-foreground">
              Exporting data for {getTimePeriodLabel(timePeriod).toLowerCase()}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
