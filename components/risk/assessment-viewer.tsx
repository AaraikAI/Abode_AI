'use client'

/**
 * Risk Assessment Viewer
 *
 * Comprehensive risk assessment with heat maps, mitigation strategies,
 * and real-time risk monitoring for construction and architectural projects
 */

import { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/components/ui/use-toast'
import {
  AlertTriangle,
  Shield,
  TrendingDown,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  Users,
  Building,
  FileText,
  Download,
  Filter,
  AlertCircle,
  Activity,
  Target,
  Zap
} from 'lucide-react'

export interface Risk {
  id: string
  category: 'safety' | 'financial' | 'schedule' | 'quality' | 'environmental' | 'legal'
  title: string
  description: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  probability: number // 0-100
  impact: number // 0-100
  riskScore: number // probability * impact
  status: 'active' | 'mitigated' | 'accepted' | 'transferred'
  owner: string
  detectedDate: Date
  deadline?: Date
  mitigation?: MitigationStrategy[]
}

export interface MitigationStrategy {
  id: string
  strategy: string
  cost: number
  timeline: string
  effectiveness: number // 0-100
  status: 'proposed' | 'in-progress' | 'completed'
  assignedTo: string
}

export interface RiskHeatMapCell {
  probability: number
  impact: number
  count: number
  risks: Risk[]
}

interface AssessmentViewerProps {
  projectId?: string
  risks?: Risk[]
  onUpdateRisk?: (riskId: string, updates: Partial<Risk>) => void
  onApplyMitigation?: (riskId: string, mitigationId: string) => void
  onExportReport?: () => void
}

const defaultRisks: Risk[] = [
  {
    id: 'r1',
    category: 'safety',
    title: 'Fall Protection Inadequate',
    description: 'Current scaffolding setup lacks proper fall protection in Zone B',
    severity: 'critical',
    probability: 80,
    impact: 95,
    riskScore: 76,
    status: 'active',
    owner: 'Safety Manager',
    detectedDate: new Date('2024-01-15'),
    deadline: new Date('2024-02-01'),
    mitigation: [
      {
        id: 'm1',
        strategy: 'Install additional guardrails and safety nets',
        cost: 15000,
        timeline: '3 days',
        effectiveness: 95,
        status: 'proposed',
        assignedTo: 'Site Supervisor'
      }
    ]
  },
  {
    id: 'r2',
    category: 'financial',
    title: 'Budget Overrun Risk',
    description: 'Material costs exceeded projections by 18%',
    severity: 'high',
    probability: 70,
    impact: 75,
    riskScore: 52.5,
    status: 'active',
    owner: 'Project Manager',
    detectedDate: new Date('2024-01-20'),
    mitigation: [
      {
        id: 'm2',
        strategy: 'Renegotiate supplier contracts',
        cost: 5000,
        timeline: '2 weeks',
        effectiveness: 70,
        status: 'in-progress',
        assignedTo: 'Procurement Lead'
      }
    ]
  },
  {
    id: 'r3',
    category: 'schedule',
    title: 'Weather Delays Expected',
    description: 'Heavy rain forecasted for next 2 weeks may delay exterior work',
    severity: 'medium',
    probability: 85,
    impact: 50,
    riskScore: 42.5,
    status: 'active',
    owner: 'Site Manager',
    detectedDate: new Date('2024-01-22')
  },
  {
    id: 'r4',
    category: 'quality',
    title: 'Concrete Quality Concerns',
    description: 'Recent batch tests show inconsistent strength',
    severity: 'high',
    probability: 60,
    impact: 80,
    riskScore: 48,
    status: 'active',
    owner: 'Quality Engineer',
    detectedDate: new Date('2024-01-18')
  }
]

export function AssessmentViewer({
  projectId,
  risks = defaultRisks,
  onUpdateRisk,
  onApplyMitigation,
  onExportReport
}: AssessmentViewerProps) {
  const { toast } = useToast()
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all')
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'heatmap'>('list')

  // Filter risks
  const filteredRisks = risks.filter(risk => {
    if (selectedCategory !== 'all' && risk.category !== selectedCategory) return false
    if (selectedSeverity !== 'all' && risk.severity !== selectedSeverity) return false
    return true
  })

  // Calculate metrics
  const criticalRisks = risks.filter(r => r.severity === 'critical').length
  const highRisks = risks.filter(r => r.severity === 'high').length
  const activeRisks = risks.filter(r => r.status === 'active').length
  const mitigatedRisks = risks.filter(r => r.status === 'mitigated').length
  const avgRiskScore = risks.reduce((sum, r) => sum + r.riskScore, 0) / risks.length

  /**
   * Get severity color
   */
  const getSeverityColor = (severity: Risk['severity']) => {
    switch (severity) {
      case 'critical':
        return 'text-red-500 bg-red-500/10 border-red-500'
      case 'high':
        return 'text-orange-500 bg-orange-500/10 border-orange-500'
      case 'medium':
        return 'text-yellow-500 bg-yellow-500/10 border-yellow-500'
      case 'low':
        return 'text-green-500 bg-green-500/10 border-green-500'
    }
  }

  /**
   * Get category icon
   */
  const getCategoryIcon = (category: Risk['category']) => {
    switch (category) {
      case 'safety':
        return Shield
      case 'financial':
        return DollarSign
      case 'schedule':
        return Clock
      case 'quality':
        return Target
      case 'environmental':
        return Activity
      case 'legal':
        return FileText
    }
  }

  /**
   * Generate heat map data
   */
  const generateHeatMap = (): RiskHeatMapCell[][] => {
    const grid: RiskHeatMapCell[][] = []
    const cellSize = 25 // 25% increments

    for (let impact = 100; impact >= 0; impact -= cellSize) {
      const row: RiskHeatMapCell[] = []
      for (let prob = 0; prob <= 100; prob += cellSize) {
        const cellRisks = risks.filter(
          r =>
            r.probability >= prob &&
            r.probability < prob + cellSize &&
            r.impact >= impact &&
            r.impact < impact + cellSize
        )

        row.push({
          probability: prob,
          impact,
          count: cellRisks.length,
          risks: cellRisks
        })
      }
      grid.push(row)
    }

    return grid
  }

  /**
   * Get heat map cell color
   */
  const getHeatMapColor = (cell: RiskHeatMapCell) => {
    const avgScore = cell.risks.reduce((sum, r) => sum + r.riskScore, 0) / (cell.count || 1)

    if (avgScore >= 70) return 'bg-red-500'
    if (avgScore >= 50) return 'bg-orange-500'
    if (avgScore >= 30) return 'bg-yellow-500'
    if (avgScore >= 10) return 'bg-blue-500'
    return 'bg-gray-300'
  }

  /**
   * Apply mitigation
   */
  const handleApplyMitigation = (risk: Risk, mitigation: MitigationStrategy) => {
    onApplyMitigation?.(risk.id, mitigation.id)
    toast({
      title: 'Mitigation Applied',
      description: `${mitigation.strategy} is now in progress`
    })
  }

  const heatMapData = generateHeatMap()

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Risks</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{risks.length}</div>
            <p className="text-xs text-muted-foreground">{activeRisks} active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{criticalRisks}</div>
            <p className="text-xs text-muted-foreground">Immediate attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{highRisks}</div>
            <p className="text-xs text-muted-foreground">Needs mitigation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mitigated</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{mitigatedRisks}</div>
            <p className="text-xs text-muted-foreground">
              {((mitigatedRisks / risks.length) * 100).toFixed(0)}% resolved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Risk Score</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgRiskScore.toFixed(1)}</div>
            <Progress value={avgRiskScore} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Risk Assessment</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="safety">Safety</SelectItem>
                  <SelectItem value="financial">Financial</SelectItem>
                  <SelectItem value="schedule">Schedule</SelectItem>
                  <SelectItem value="quality">Quality</SelectItem>
                  <SelectItem value="environmental">Environmental</SelectItem>
                  <SelectItem value="legal">Legal</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex border rounded-lg">
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  List
                </Button>
                <Button
                  variant={viewMode === 'heatmap' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('heatmap')}
                >
                  Heat Map
                </Button>
              </div>

              <Button variant="outline" size="sm" onClick={onExportReport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Content */}
      {viewMode === 'list' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Risk List */}
          <div className="space-y-3">
            {filteredRisks.map(risk => {
              const Icon = getCategoryIcon(risk.category)
              return (
                <Card
                  key={risk.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedRisk?.id === risk.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedRisk(risk)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`p-2 rounded-lg ${getSeverityColor(risk.severity)}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-base">{risk.title}</CardTitle>
                          <CardDescription className="mt-1">{risk.description}</CardDescription>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={getSeverityColor(risk.severity)}
                      >
                        {risk.severity}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Probability</div>
                        <div className="font-medium">{risk.probability}%</div>
                        <Progress value={risk.probability} className="mt-1 h-1" />
                      </div>
                      <div>
                        <div className="text-muted-foreground">Impact</div>
                        <div className="font-medium">{risk.impact}%</div>
                        <Progress value={risk.impact} className="mt-1 h-1" />
                      </div>
                      <div>
                        <div className="text-muted-foreground">Risk Score</div>
                        <div className="font-bold text-lg">{risk.riskScore.toFixed(1)}</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        {risk.owner}
                      </div>
                      <Badge variant={risk.status === 'active' ? 'destructive' : 'secondary'}>
                        {risk.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Risk Details */}
          {selectedRisk ? (
            <Card className="h-fit sticky top-4">
              <CardHeader>
                <CardTitle>Risk Details</CardTitle>
                <CardDescription>{selectedRisk.title}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground">{selectedRisk.description}</p>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Category</div>
                    <div className="font-medium capitalize">{selectedRisk.category}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Owner</div>
                    <div className="font-medium">{selectedRisk.owner}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Detected</div>
                    <div className="font-medium">
                      {selectedRisk.detectedDate.toLocaleDateString()}
                    </div>
                  </div>
                  {selectedRisk.deadline && (
                    <div>
                      <div className="text-sm text-muted-foreground">Deadline</div>
                      <div className="font-medium">
                        {selectedRisk.deadline.toLocaleDateString()}
                      </div>
                    </div>
                  )}
                </div>

                {selectedRisk.mitigation && selectedRisk.mitigation.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-3">Mitigation Strategies</h4>
                      <div className="space-y-3">
                        {selectedRisk.mitigation.map(mitigation => (
                          <div
                            key={mitigation.id}
                            className="p-3 border rounded-lg space-y-2"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="font-medium text-sm">{mitigation.strategy}</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  Assigned to: {mitigation.assignedTo}
                                </div>
                              </div>
                              <Badge
                                variant={
                                  mitigation.status === 'completed'
                                    ? 'default'
                                    : mitigation.status === 'in-progress'
                                    ? 'secondary'
                                    : 'outline'
                                }
                              >
                                {mitigation.status}
                              </Badge>
                            </div>

                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <div>
                                <div className="text-muted-foreground">Cost</div>
                                <div className="font-medium">${mitigation.cost.toLocaleString()}</div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">Timeline</div>
                                <div className="font-medium">{mitigation.timeline}</div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">Effectiveness</div>
                                <div className="font-medium">{mitigation.effectiveness}%</div>
                              </div>
                            </div>

                            {mitigation.status === 'proposed' && (
                              <Button
                                onClick={() => handleApplyMitigation(selectedRisk, mitigation)}
                                size="sm"
                                className="w-full mt-2"
                              >
                                Apply Strategy
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="h-fit">
              <CardContent className="p-12 text-center">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Risk Selected</h3>
                <p className="text-muted-foreground">Select a risk to view details</p>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Risk Heat Map</CardTitle>
            <CardDescription>Risk distribution by probability and impact</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-24 text-sm font-medium text-right">High Impact</div>
                {heatMapData[0].map((cell, colIndex) => (
                  <div
                    key={colIndex}
                    className="flex-1 h-20 border rounded flex items-center justify-center text-xs font-bold cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                    style={{
                      backgroundColor:
                        cell.count > 0 ? undefined : 'transparent',
                      borderColor: cell.count > 0 ? undefined : '#e5e7eb'
                    }}
                    className={cell.count > 0 ? `${getHeatMapColor(cell)} text-white` : ''}
                    title={`${cell.count} risks`}
                  >
                    {cell.count > 0 && cell.count}
                  </div>
                ))}
              </div>

              {heatMapData.slice(1).map((row, rowIndex) => (
                <div key={rowIndex} className="flex items-center gap-2">
                  <div className="w-24 text-sm text-right text-muted-foreground">
                    {rowIndex === Math.floor(heatMapData.length / 2) - 1 && ''}
                  </div>
                  {row.map((cell, colIndex) => (
                    <div
                      key={colIndex}
                      className={`flex-1 h-20 border rounded flex items-center justify-center text-xs font-bold cursor-pointer hover:ring-2 hover:ring-primary transition-all ${
                        cell.count > 0 ? `${getHeatMapColor(cell)} text-white` : ''
                      }`}
                      title={`${cell.count} risks`}
                    >
                      {cell.count > 0 && cell.count}
                    </div>
                  ))}
                </div>
              ))}

              <div className="flex items-center gap-2">
                <div className="w-24 text-sm font-medium text-right">Low Impact</div>
                <div className="flex-1 text-center text-sm text-muted-foreground">
                  Low Probability → High Probability
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 mt-6 pt-6 border-t">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span className="text-sm">Critical (70+)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-orange-500 rounded"></div>
                <span className="text-sm">High (50-69)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                <span className="text-sm">Medium (30-49)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span className="text-sm">Low (10-29)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
