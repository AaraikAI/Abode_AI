'use client'

/**
 * Energy Dashboard Component
 *
 * Comprehensive overview dashboard showing energy consumption metrics,
 * charts, comparisons, and performance indicators
 */

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Zap,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  Home,
  AlertCircle,
  Download,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight
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

interface EnergyMetrics {
  current: number
  previous: number
  percentChange: number
  trend: 'up' | 'down' | 'stable'
}

interface MonthlyData {
  month: string
  consumption: number
  cost: number
  baseline: number
  target: number
}

interface CategoryBreakdown {
  category: string
  value: number
  percentage: number
  color: string
}

interface ComparisonData {
  building: string
  eui: number
  cost: number
  rating: string
}

interface EnergyDashboardProps {
  buildingName: string
  buildingArea: number
  currentConsumption: EnergyMetrics
  currentCost: EnergyMetrics
  monthlyData: MonthlyData[]
  categoryBreakdown: CategoryBreakdown[]
  comparisons: ComparisonData[]
  lastUpdated?: string
  onRefresh?: () => void
  onExport?: () => void
}

export function EnergyDashboard({
  buildingName,
  buildingArea,
  currentConsumption,
  currentCost,
  monthlyData,
  categoryBreakdown,
  comparisons,
  lastUpdated,
  onRefresh,
  onExport
}: EnergyDashboardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month')
  const [selectedTab, setSelectedTab] = useState('overview')

  // Calculate EUI (Energy Use Intensity)
  const calculateEUI = (consumption: number) => {
    return (consumption / buildingArea).toFixed(1)
  }

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  // Format energy value
  const formatEnergy = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value) + ' kWh'
  }

  // Get trend icon and color
  const getTrendIndicator = (trend: 'up' | 'down' | 'stable', percentChange: number) => {
    if (trend === 'up') {
      return {
        icon: ArrowUpRight,
        color: 'text-red-500',
        bgColor: 'bg-red-50'
      }
    } else if (trend === 'down') {
      return {
        icon: ArrowDownRight,
        color: 'text-green-500',
        bgColor: 'bg-green-50'
      }
    }
    return {
      icon: TrendingDown,
      color: 'text-gray-500',
      bgColor: 'bg-gray-50'
    }
  }

  const consumptionTrend = getTrendIndicator(currentConsumption.trend, currentConsumption.percentChange)
  const costTrend = getTrendIndicator(currentCost.trend, currentCost.percentChange)
  const ConsumptionTrendIcon = consumptionTrend.icon
  const CostTrendIcon = costTrend.icon

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{buildingName}</h2>
          <p className="text-muted-foreground">
            {buildingArea.toLocaleString()} sq ft
            {lastUpdated && ` • Last updated ${lastUpdated}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Consumption</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatEnergy(currentConsumption.current)}</div>
            <div className="flex items-center gap-2 mt-2">
              <div className={`flex items-center gap-1 ${consumptionTrend.color}`}>
                <ConsumptionTrendIcon className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {Math.abs(currentConsumption.percentChange).toFixed(1)}%
                </span>
              </div>
              <span className="text-xs text-muted-foreground">vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Energy Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(currentCost.current)}</div>
            <div className="flex items-center gap-2 mt-2">
              <div className={`flex items-center gap-1 ${costTrend.color}`}>
                <CostTrendIcon className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {Math.abs(currentCost.percentChange).toFixed(1)}%
                </span>
              </div>
              <span className="text-xs text-muted-foreground">vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Energy Use Intensity</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {calculateEUI(currentConsumption.current)} <span className="text-sm font-normal">kWh/sf</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Industry avg: 12.5 kWh/sf
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Badge className="bg-green-500">Good</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              15% below baseline
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Monthly Consumption Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Energy Consumption</CardTitle>
                <CardDescription>Actual vs baseline and target</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => formatEnergy(value)} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="consumption"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      name="Actual"
                    />
                    <Line
                      type="monotone"
                      dataKey="baseline"
                      stroke="#94a3b8"
                      strokeDasharray="5 5"
                      name="Baseline"
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

            {/* Category Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Energy by Category</CardTitle>
                <CardDescription>Consumption breakdown by end use</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ category, percentage }) => `${category}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatEnergy(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Breakdown Tab */}
        <TabsContent value="breakdown" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Energy Breakdown</CardTitle>
              <CardDescription>Energy consumption by category</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {categoryBreakdown.map((category) => (
                <div key={category.category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="font-medium">{category.category}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{formatEnergy(category.value)}</div>
                      <div className="text-xs text-muted-foreground">{category.percentage}%</div>
                    </div>
                  </div>
                  <Progress value={category.percentage} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cost Trends</CardTitle>
              <CardDescription>Monthly energy costs over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => formatCurrency(value as number)} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="cost"
                    stroke="#8b5cf6"
                    fill="#8b5cf6"
                    fillOpacity={0.3}
                    name="Monthly Cost"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Comparison Tab */}
        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Building Comparisons</CardTitle>
              <CardDescription>Compare performance with similar buildings</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={comparisons}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="building" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="eui" fill="#8b5cf6" name="EUI (kWh/sf)" />
                  <Bar dataKey="cost" fill="#10b981" name="Cost ($/sf)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Alerts/Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Alerts & Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="font-medium text-sm">High consumption detected</p>
              <p className="text-sm text-muted-foreground">
                HVAC usage is 20% above normal for this time of year
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-sm">Optimization opportunity</p>
              <p className="text-sm text-muted-foreground">
                Adjusting operating hours could save $500/month
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
