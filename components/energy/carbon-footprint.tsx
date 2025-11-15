'use client'

/**
 * Carbon Footprint Component
 *
 * Tracks carbon emissions from energy use and provides
 * reduction targets and progress monitoring
 */

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Leaf,
  TrendingDown,
  TrendingUp,
  Target,
  Calendar,
  Award,
  Zap,
  Fuel,
  Car,
  TreePine,
  AlertCircle,
  CheckCircle2,
  Download,
  Share2
} from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

interface EmissionsData {
  electricity: number
  naturalGas: number
  fuel: number
  total: number
}

interface MonthlyEmissions {
  month: string
  electricity: number
  gas: number
  fuel: number
  total: number
  target: number
}

interface ReductionTarget {
  year: number
  targetReduction: number // %
  actualReduction: number // %
  status: 'on-track' | 'behind' | 'ahead'
}

interface CarbonOffset {
  type: string
  amount: number
  unit: string
  equivalence: string
}

interface CarbonFootprintProps {
  buildingName?: string
  currentEmissions: EmissionsData
  monthlyData: MonthlyEmissions[]
  targets: ReductionTarget[]
  baselineYear?: number
  targetYear?: number
  onSetTarget?: (target: number, year: number) => void
  onExport?: () => void
}

export function CarbonFootprint({
  buildingName = 'Building',
  currentEmissions,
  monthlyData,
  targets,
  baselineYear = 2020,
  targetYear = 2030,
  onSetTarget,
  onExport
}: CarbonFootprintProps) {
  const [selectedTarget, setSelectedTarget] = useState<number>(50) // % reduction
  const [selectedYear, setSelectedYear] = useState<number>(targetYear)

  // Calculate yearly totals
  const annualEmissions = currentEmissions.total * 12 / 1000 // Convert to metric tons

  // Calculate emissions breakdown
  const breakdownData = [
    {
      name: 'Electricity',
      value: currentEmissions.electricity,
      percentage: (currentEmissions.electricity / currentEmissions.total) * 100,
      color: '#8b5cf6'
    },
    {
      name: 'Natural Gas',
      value: currentEmissions.naturalGas,
      percentage: (currentEmissions.naturalGas / currentEmissions.total) * 100,
      color: '#f59e0b'
    },
    {
      name: 'Other Fuels',
      value: currentEmissions.fuel,
      percentage: (currentEmissions.fuel / currentEmissions.total) * 100,
      color: '#10b981'
    }
  ]

  // Calculate equivalences
  const equivalences: CarbonOffset[] = [
    {
      type: 'Trees Needed',
      amount: Math.ceil(annualEmissions * 16.5), // ~16.5 trees per ton CO2/year
      unit: 'trees',
      equivalence: 'to offset annual emissions'
    },
    {
      type: 'Cars Off Road',
      amount: Math.floor(annualEmissions / 4.6), // Average car emits 4.6 tons/year
      unit: 'vehicles',
      equivalence: 'for one year equivalent'
    },
    {
      type: 'Solar Panels',
      amount: Math.ceil(annualEmissions / 1.2), // ~1.2 tons offset per kW solar/year
      unit: 'kW solar',
      equivalence: 'to become carbon neutral'
    },
    {
      type: 'LED Bulb Years',
      amount: Math.ceil((annualEmissions * 1000) / 0.065), // 65g CO2 saved per LED bulb year
      unit: 'bulb-years',
      equivalence: 'of LED replacements'
    }
  ]

  // Calculate progress to target
  const currentTarget = targets.find(t => t.year === selectedYear)
  const progressToTarget = currentTarget
    ? (currentTarget.actualReduction / currentTarget.targetReduction) * 100
    : 0

  // Historical trend data
  const trendData = Array.from({ length: new Date().getFullYear() - baselineYear + 1 }, (_, i) => {
    const year = baselineYear + i
    const targetReduction = ((year - baselineYear) / (targetYear - baselineYear)) * selectedTarget
    const baselineEmissions = annualEmissions / (1 - (currentTarget?.actualReduction || 0) / 100)

    return {
      year: year.toString(),
      actual: baselineEmissions * (1 - ((year - baselineYear) * 5) / 100), // Simulated reduction
      target: baselineEmissions * (1 - targetReduction / 100),
      baseline: baselineEmissions
    }
  })

  // Format emissions
  const formatEmissions = (value: number, unit: 'kg' | 'tons' = 'tons') => {
    if (unit === 'kg') {
      return `${value.toLocaleString()} kg CO₂`
    }
    return `${value.toLocaleString()} tons CO₂`
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on-track':
        return 'bg-green-500'
      case 'ahead':
        return 'bg-blue-500'
      case 'behind':
        return 'bg-orange-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Carbon Footprint</h2>
          <p className="text-muted-foreground">{buildingName} - Emissions Tracking</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Annual Emissions</CardTitle>
            <Leaf className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatEmissions(annualEmissions)}</div>
            <div className="flex items-center gap-1 mt-2 text-green-600">
              <TrendingDown className="h-4 w-4" />
              <span className="text-sm font-medium">12% vs last year</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Target Progress</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progressToTarget.toFixed(0)}%</div>
            <Progress value={progressToTarget} className="h-2 mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {selectedTarget}% by {selectedYear}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Per Sq Ft</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(currentEmissions.total / 1000).toFixed(1)} <span className="text-sm">kg/sf</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Industry avg: 15.2 kg/sf
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reduction Status</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge className={currentTarget ? getStatusColor(currentTarget.status) : 'bg-gray-500'}>
              {currentTarget?.status || 'No Target'}
            </Badge>
            <p className="text-xs text-muted-foreground mt-2">
              {currentTarget?.actualReduction.toFixed(0)}% reduction achieved
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
          <TabsTrigger value="targets">Targets</TabsTrigger>
          <TabsTrigger value="equivalents">Equivalents</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Emissions Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Historical Emissions</CardTitle>
                <CardDescription>Annual CO₂ emissions trend</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => formatEmissions(value)} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="baseline"
                      stroke="#94a3b8"
                      strokeDasharray="5 5"
                      name="Baseline"
                    />
                    <Line
                      type="monotone"
                      dataKey="actual"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      name="Actual"
                    />
                    <Line
                      type="monotone"
                      dataKey="target"
                      stroke="#10b981"
                      strokeDasharray="5 5"
                      name="Target"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Monthly Emissions */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Emissions</CardTitle>
                <CardDescription>Last 12 months breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="electricity"
                      stackId="1"
                      stroke="#8b5cf6"
                      fill="#8b5cf6"
                      name="Electricity"
                    />
                    <Area
                      type="monotone"
                      dataKey="gas"
                      stackId="1"
                      stroke="#f59e0b"
                      fill="#f59e0b"
                      name="Natural Gas"
                    />
                    <Area
                      type="monotone"
                      dataKey="fuel"
                      stackId="1"
                      stroke="#10b981"
                      fill="#10b981"
                      name="Other Fuels"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Breakdown Tab */}
        <TabsContent value="breakdown" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Emissions by Source</CardTitle>
                <CardDescription>Current month breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={breakdownData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name}: ${percentage.toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {breakdownData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatEmissions(value / 1000)} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Detailed Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Emissions Sources</CardTitle>
                <CardDescription>Detailed monthly breakdown</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {breakdownData.map((source) => (
                  <div key={source.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: source.color }}
                        />
                        <span className="font-medium">{source.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">
                          {formatEmissions(source.value / 1000)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {source.percentage.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    <Progress value={source.percentage} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Targets Tab */}
        <TabsContent value="targets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Set Reduction Target</CardTitle>
              <CardDescription>Define your carbon reduction goals</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="target">Target Reduction (%)</Label>
                  <Select
                    value={selectedTarget.toString()}
                    onValueChange={(v) => setSelectedTarget(Number(v))}
                  >
                    <SelectTrigger id="target">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="25">25% - Moderate</SelectItem>
                      <SelectItem value="50">50% - Aggressive</SelectItem>
                      <SelectItem value="75">75% - Very Aggressive</SelectItem>
                      <SelectItem value="100">100% - Net Zero</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="year">Target Year</Label>
                  <Select
                    value={selectedYear.toString()}
                    onValueChange={(v) => setSelectedYear(Number(v))}
                  >
                    <SelectTrigger id="year">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2025">2025</SelectItem>
                      <SelectItem value="2030">2030</SelectItem>
                      <SelectItem value="2035">2035</SelectItem>
                      <SelectItem value="2040">2040</SelectItem>
                      <SelectItem value="2050">2050</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={() => onSetTarget?.(selectedTarget, selectedYear)}>
                <Target className="h-4 w-4 mr-2" />
                Set Target
              </Button>
            </CardContent>
          </Card>

          {/* Target Milestones */}
          <Card>
            <CardHeader>
              <CardTitle>Reduction Milestones</CardTitle>
              <CardDescription>Progress towards carbon reduction goals</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {targets.map((target) => (
                <div key={target.year} className="flex items-center gap-4 p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="font-medium">{target.year}</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          Target: {target.targetReduction}% reduction
                        </span>
                      </div>
                      <Badge className={getStatusColor(target.status)}>
                        {target.status}
                      </Badge>
                    </div>
                    <Progress
                      value={(target.actualReduction / target.targetReduction) * 100}
                      className="h-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Current: {target.actualReduction.toFixed(0)}% reduction achieved
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Equivalents Tab */}
        <TabsContent value="equivalents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Carbon Equivalents</CardTitle>
              <CardDescription>
                Your {formatEmissions(annualEmissions)} annual emissions equals:
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {equivalences.map((equiv) => {
                  const Icon =
                    equiv.type.includes('Trees')
                      ? TreePine
                      : equiv.type.includes('Cars')
                      ? Car
                      : equiv.type.includes('Solar')
                      ? Zap
                      : Leaf

                  return (
                    <div
                      key={equiv.type}
                      className="p-4 border rounded-lg flex items-start gap-4"
                    >
                      <div className="p-3 bg-muted rounded-lg">
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium mb-1">{equiv.type}</h4>
                        <div className="text-3xl font-bold mb-1">
                          {equiv.amount.toLocaleString()}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {equiv.unit} {equiv.equivalence}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Action Items */}
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-900">
                <CheckCircle2 className="h-5 w-5" />
                Quick Wins to Reduce Emissions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-green-900">
              <p>• Switch to renewable energy sources (solar, wind)</p>
              <p>• Upgrade to high-efficiency HVAC systems</p>
              <p>• Improve building insulation and air sealing</p>
              <p>• Install LED lighting throughout the building</p>
              <p>• Implement smart building controls and automation</p>
              <p>• Consider carbon offset programs for remaining emissions</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
