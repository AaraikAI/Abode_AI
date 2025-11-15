'use client'

import { useState } from 'react'
import {
  Wrench,
  AlertTriangle,
  Clock,
  TrendingUp,
  CheckCircle,
  XCircle,
  Calendar,
  DollarSign,
  Activity,
  Settings,
  Filter,
  Download
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts'

export interface MaintenancePrediction {
  id: string
  equipmentId: string
  equipmentName: string
  equipmentType: 'hvac' | 'electrical' | 'plumbing' | 'elevator' | 'generator' | 'other'
  location: string
  issueType: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  probability: number
  predictedFailureDate: string
  daysUntilFailure: number
  recommendedAction: string
  estimatedCost: number
  estimatedDowntime: number
  confidence: number
  detectedAt: string
  status: 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'dismissed'
  assignedTo?: string
  scheduledDate?: string
  rootCause?: string
}

export interface EquipmentHealth {
  equipmentId: string
  equipmentName: string
  healthScore: number
  lastMaintenance: string
  nextScheduledMaintenance: string
  operatingHours: number
  failureRisk: number
  trend: 'improving' | 'stable' | 'degrading'
}

export interface MaintenanceHistory {
  date: string
  predictions: number
  completed: number
  prevented: number
  cost: number
}

interface PredictiveMaintenanceProps {
  predictions: MaintenancePrediction[]
  equipmentHealth: EquipmentHealth[]
  history: MaintenanceHistory[]
  onScheduleMaintenance?: (predictionId: string) => void
  onDismissPrediction?: (predictionId: string) => void
  onExportReport?: () => void
}

export function PredictiveMaintenance({
  predictions,
  equipmentHealth,
  history,
  onScheduleMaintenance,
  onDismissPrediction,
  onExportReport
}: PredictiveMaintenanceProps) {
  const [selectedTab, setSelectedTab] = useState('predictions')
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('pending')

  const getSeverityColor = (severity: MaintenancePrediction['severity']) => {
    switch (severity) {
      case 'critical':
        return 'text-red-500'
      case 'high':
        return 'text-orange-500'
      case 'medium':
        return 'text-yellow-500'
      case 'low':
        return 'text-blue-500'
      default:
        return 'text-gray-500'
    }
  }

  const getSeverityBgColor = (severity: MaintenancePrediction['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500/10 border-red-500/20'
      case 'high':
        return 'bg-orange-500/10 border-orange-500/20'
      case 'medium':
        return 'bg-yellow-500/10 border-yellow-500/20'
      case 'low':
        return 'bg-blue-500/10 border-blue-500/20'
      default:
        return 'bg-gray-500/10 border-gray-500/20'
    }
  }

  const getSeverityBadgeVariant = (severity: MaintenancePrediction['severity']) => {
    switch (severity) {
      case 'critical':
        return 'destructive'
      case 'high':
        return 'default'
      case 'medium':
        return 'secondary'
      case 'low':
        return 'outline'
      default:
        return 'outline'
    }
  }

  const getStatusBadgeVariant = (status: MaintenancePrediction['status']) => {
    switch (status) {
      case 'pending':
        return 'default'
      case 'scheduled':
        return 'secondary'
      case 'in_progress':
        return 'outline'
      case 'completed':
        return 'outline'
      case 'dismissed':
        return 'outline'
      default:
        return 'outline'
    }
  }

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-500'
    if (score >= 60) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getTrendIcon = (trend: EquipmentHealth['trend']) => {
    switch (trend) {
      case 'improving':
        return '↑'
      case 'degrading':
        return '↓'
      case 'stable':
        return '→'
      default:
        return '→'
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const filteredPredictions = predictions.filter(pred => {
    const matchesSeverity = severityFilter === 'all' || pred.severity === severityFilter
    const matchesStatus = statusFilter === 'all' || pred.status === statusFilter
    return matchesSeverity && matchesStatus
  })

  const stats = {
    total: predictions.length,
    critical: predictions.filter(p => p.severity === 'critical' && p.status === 'pending').length,
    scheduled: predictions.filter(p => p.status === 'scheduled').length,
    avgCost: predictions.reduce((sum, p) => sum + p.estimatedCost, 0) / predictions.length || 0,
    totalSavings: history.reduce((sum, h) => sum + h.prevented * 5000, 0), // Estimate
  }

  const upcomingMaintenance = predictions
    .filter(p => p.status === 'scheduled')
    .sort((a, b) => new Date(a.scheduledDate!).getTime() - new Date(b.scheduledDate!).getTime())
    .slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Predictions</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.critical} critical
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{stats.scheduled}</div>
            <p className="text-xs text-muted-foreground">
              Maintenance tasks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Cost per Issue</CardTitle>
            <DollarSign className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.avgCost)}</div>
            <p className="text-xs text-muted-foreground">
              Estimated repair cost
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Savings</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {formatCurrency(stats.totalSavings)}
            </div>
            <p className="text-xs text-muted-foreground">
              Prevented failures
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="health">Equipment Health</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="predictions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle>Maintenance Predictions</CardTitle>
                  <CardDescription>
                    AI-powered predictions based on sensor data and historical patterns
                  </CardDescription>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Select value={severityFilter} onValueChange={setSeverityFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Severity</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button variant="outline" size="sm" onClick={onExportReport}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-3">
                  {filteredPredictions.map(prediction => (
                    <div
                      key={prediction.id}
                      className={`p-4 border rounded-lg ${getSeverityBgColor(prediction.severity)}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          <Wrench className={`h-5 w-5 mt-0.5 ${getSeverityColor(prediction.severity)}`} />

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h4 className="font-semibold">{prediction.equipmentName}</h4>
                              <Badge variant={getSeverityBadgeVariant(prediction.severity)}>
                                {prediction.severity}
                              </Badge>
                              <Badge variant={getStatusBadgeVariant(prediction.status)}>
                                {prediction.status}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {prediction.equipmentType}
                              </Badge>
                            </div>

                            <p className="text-sm font-medium mb-1">{prediction.issueType}</p>
                            <p className="text-sm text-muted-foreground mb-2">
                              {prediction.recommendedAction}
                            </p>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 text-xs">
                              <div>
                                <div className="text-muted-foreground">Location</div>
                                <div className="font-medium">{prediction.location}</div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">Failure in</div>
                                <div className={`font-medium ${getSeverityColor(prediction.severity)}`}>
                                  {prediction.daysUntilFailure} days
                                </div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">Probability</div>
                                <div className="font-medium">
                                  {(prediction.probability * 100).toFixed(0)}%
                                </div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">Confidence</div>
                                <div className="font-medium">
                                  {(prediction.confidence * 100).toFixed(0)}%
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
                              <div>
                                <div className="text-muted-foreground">Estimated Cost</div>
                                <div className="font-bold text-yellow-500">
                                  {formatCurrency(prediction.estimatedCost)}
                                </div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">Estimated Downtime</div>
                                <div className="font-bold">
                                  {prediction.estimatedDowntime}h
                                </div>
                              </div>
                            </div>

                            {prediction.rootCause && (
                              <div className="text-xs mb-3">
                                <span className="text-muted-foreground">Root Cause: </span>
                                <span className="font-medium">{prediction.rootCause}</span>
                              </div>
                            )}

                            {prediction.status === 'pending' && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => onScheduleMaintenance?.(prediction.id)}
                                >
                                  <Calendar className="h-3 w-3 mr-1" />
                                  Schedule Maintenance
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => onDismissPrediction?.(prediction.id)}
                                >
                                  Dismiss
                                </Button>
                              </div>
                            )}

                            {prediction.scheduledDate && (
                              <div className="text-xs text-muted-foreground mt-2">
                                Scheduled for {formatDate(prediction.scheduledDate)}
                                {prediction.assignedTo && ` • Assigned to ${prediction.assignedTo}`}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {filteredPredictions.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No predictions matching your filters</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Equipment Health Monitoring</CardTitle>
              <CardDescription>Real-time health scores and risk assessment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {equipmentHealth.map(equipment => (
                  <div
                    key={equipment.equipmentId}
                    className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{equipment.equipmentName}</h4>
                          <span className="text-sm text-muted-foreground">
                            {getTrendIcon(equipment.trend)}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Last maintenance: {formatDate(equipment.lastMaintenance)}</span>
                          <span>•</span>
                          <span>Next: {formatDate(equipment.nextScheduledMaintenance)}</span>
                          <span>•</span>
                          <span>{equipment.operatingHours}h runtime</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className={`text-3xl font-bold ${getHealthColor(equipment.healthScore)}`}>
                          {equipment.healthScore}%
                        </div>
                        <div className="text-xs text-muted-foreground">Health Score</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Health</span>
                        <span className="font-medium">{equipment.healthScore}%</span>
                      </div>
                      <Progress
                        value={equipment.healthScore}
                        className="h-2"
                      />

                      <div className="flex items-center justify-between text-xs mt-2">
                        <span className="text-muted-foreground">Failure Risk</span>
                        <span className="font-medium text-red-500">
                          {(equipment.failureRisk * 100).toFixed(0)}%
                        </span>
                      </div>
                      <Progress
                        value={equipment.failureRisk * 100}
                        className="h-2"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Prediction Accuracy</CardTitle>
                <CardDescription>Predictions vs actual maintenance</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={history}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="predictions"
                      stackId="1"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.6}
                      name="Predictions"
                    />
                    <Area
                      type="monotone"
                      dataKey="completed"
                      stackId="2"
                      stroke="#22c55e"
                      fill="#22c55e"
                      fillOpacity={0.6}
                      name="Completed"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Cost Savings</CardTitle>
                <CardDescription>Preventive maintenance savings over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={history}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Legend />
                    <Bar dataKey="cost" fill="#22c55e" name="Savings" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Upcoming Scheduled Maintenance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {upcomingMaintenance.map(prediction => (
                  <div
                    key={prediction.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-blue-500" />
                      <div>
                        <div className="font-medium">{prediction.equipmentName}</div>
                        <div className="text-xs text-muted-foreground">
                          {prediction.issueType}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {prediction.scheduledDate && formatDate(prediction.scheduledDate)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatCurrency(prediction.estimatedCost)}
                      </div>
                    </div>
                  </div>
                ))}

                {upcomingMaintenance.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No scheduled maintenance</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
