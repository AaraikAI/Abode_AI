'use client'

import { useState } from 'react'
import {
  Zap,
  TrendingDown,
  TrendingUp,
  DollarSign,
  Lightbulb,
  ThermometerSun,
  Wind,
  Battery,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Play,
  Pause
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
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

export interface EnergyMetrics {
  currentUsage: number
  peakUsage: number
  averageUsage: number
  totalCost: number
  projectedCost: number
  potentialSavings: number
  efficiencyScore: number
  carbonFootprint: number
}

export interface OptimizationSuggestion {
  id: string
  category: 'hvac' | 'lighting' | 'equipment' | 'renewable' | 'scheduling' | 'other'
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  estimatedSavings: number
  savingsPercentage: number
  implementationCost: number
  paybackPeriod: number
  implemented: boolean
  autoImplementable: boolean
  priority: number
}

export interface EnergyUsageData {
  timestamp: string
  usage: number
  optimized?: number
  baseline?: number
  cost?: number
}

interface EnergyOptimizationProps {
  metrics: EnergyMetrics
  suggestions: OptimizationSuggestion[]
  usageData: EnergyUsageData[]
  autoOptimizationEnabled?: boolean
  onToggleAutoOptimization?: (enabled: boolean) => void
  onImplementSuggestion?: (suggestionId: string) => void
  onDismissSuggestion?: (suggestionId: string) => void
}

export function EnergyOptimization({
  metrics,
  suggestions,
  usageData,
  autoOptimizationEnabled = false,
  onToggleAutoOptimization,
  onImplementSuggestion,
  onDismissSuggestion
}: EnergyOptimizationProps) {
  const [selectedTab, setSelectedTab] = useState('overview')
  const [filterCategory, setFilterCategory] = useState<string>('all')

  const getCategoryIcon = (category: OptimizationSuggestion['category']) => {
    switch (category) {
      case 'hvac':
        return ThermometerSun
      case 'lighting':
        return Lightbulb
      case 'equipment':
        return Zap
      case 'renewable':
        return Wind
      case 'scheduling':
        return Battery
      default:
        return Lightbulb
    }
  }

  const getImpactColor = (impact: OptimizationSuggestion['impact']) => {
    switch (impact) {
      case 'high':
        return 'text-green-500'
      case 'medium':
        return 'text-yellow-500'
      case 'low':
        return 'text-blue-500'
      default:
        return 'text-gray-500'
    }
  }

  const getImpactBadgeVariant = (impact: OptimizationSuggestion['impact']) => {
    switch (impact) {
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const formatEnergy = (value: number) => {
    return `${value.toFixed(1)} kWh`
  }

  const filteredSuggestions = suggestions
    .filter(s => filterCategory === 'all' || s.category === filterCategory)
    .sort((a, b) => b.priority - a.priority)

  const implementedSuggestions = suggestions.filter(s => s.implemented)
  const pendingSuggestions = suggestions.filter(s => !s.implemented)

  const categorySavings = suggestions.reduce((acc, suggestion) => {
    if (!acc[suggestion.category]) {
      acc[suggestion.category] = 0
    }
    acc[suggestion.category] += suggestion.estimatedSavings
    return acc
  }, {} as Record<string, number>)

  const categoryData = Object.entries(categorySavings).map(([category, savings]) => ({
    name: category.toUpperCase(),
    value: savings
  }))

  const COLORS = {
    hvac: '#ef4444',
    lighting: '#eab308',
    equipment: '#3b82f6',
    renewable: '#22c55e',
    scheduling: '#a855f7',
    other: '#6b7280'
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Usage</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatEnergy(metrics.currentUsage)}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <TrendingDown className="h-3 w-3 text-green-500" />
              <span>12% below average</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Potential Savings</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {formatCurrency(metrics.potentialSavings)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Per month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Efficiency Score</CardTitle>
            <Lightbulb className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.efficiencyScore}%</div>
            <Progress value={metrics.efficiencyScore} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Carbon Footprint</CardTitle>
            <Wind className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(metrics.carbonFootprint / 1000).toFixed(1)} tons
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              CO₂ per month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Auto-Optimization Toggle */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Auto-Optimization</CardTitle>
              <CardDescription>
                Automatically implement energy-saving measures
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {autoOptimizationEnabled ? (
                  <Play className="h-4 w-4 text-green-500" />
                ) : (
                  <Pause className="h-4 w-4 text-muted-foreground" />
                )}
                <Label htmlFor="auto-opt" className="text-sm">
                  {autoOptimizationEnabled ? 'Active' : 'Inactive'}
                </Label>
              </div>
              <Switch
                id="auto-opt"
                checked={autoOptimizationEnabled}
                onCheckedChange={onToggleAutoOptimization}
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Usage Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Energy Usage Trends</CardTitle>
                <CardDescription>Actual vs optimized consumption</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={usageData}>
                    <defs>
                      <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorOptimized" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="timestamp"
                      tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                    />
                    <YAxis label={{ value: 'kWh', angle: -90, position: 'insideLeft' }} />
                    <Tooltip
                      labelFormatter={(value) => new Date(value).toLocaleString()}
                      formatter={(value: number) => formatEnergy(value)}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="usage"
                      stroke="#ef4444"
                      fillOpacity={1}
                      fill="url(#colorActual)"
                      name="Actual Usage"
                    />
                    <Area
                      type="monotone"
                      dataKey="optimized"
                      stroke="#22c55e"
                      fillOpacity={1}
                      fill="url(#colorOptimized)"
                      name="Optimized"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Savings by Category */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Potential Savings by Category</CardTitle>
                <CardDescription>Distribution of optimization opportunities</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[entry.name.toLowerCase() as keyof typeof COLORS] || COLORS.other}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Total Suggestions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Pending</span>
                    <span className="font-bold text-yellow-500">{pendingSuggestions.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Implemented</span>
                    <span className="font-bold text-green-500">{implementedSuggestions.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Monthly Projection</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Current</span>
                    <span className="font-bold">{formatCurrency(metrics.totalCost)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Optimized</span>
                    <span className="font-bold text-green-500">
                      {formatCurrency(metrics.totalCost - metrics.potentialSavings)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Implementation ROI</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Avg Payback</span>
                    <span className="font-bold">
                      {(suggestions.reduce((sum, s) => sum + s.paybackPeriod, 0) / suggestions.length).toFixed(1)} months
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Investment</span>
                    <span className="font-bold">
                      {formatCurrency(suggestions.reduce((sum, s) => sum + s.implementationCost, 0))}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="suggestions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Optimization Suggestions</CardTitle>
                  <CardDescription>
                    AI-powered recommendations to reduce energy consumption
                  </CardDescription>
                </div>
                <Badge variant="outline">
                  {pendingSuggestions.length} pending
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredSuggestions.map(suggestion => {
                  const Icon = getCategoryIcon(suggestion.category)

                  return (
                    <div
                      key={suggestion.id}
                      className={`p-4 border rounded-lg ${
                        suggestion.implemented ? 'bg-green-500/5 border-green-500/20' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          <Icon className={`h-5 w-5 mt-0.5 ${getImpactColor(suggestion.impact)}`} />

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h4 className="font-semibold">{suggestion.title}</h4>
                              <Badge variant={getImpactBadgeVariant(suggestion.impact)}>
                                {suggestion.impact} impact
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {suggestion.category}
                              </Badge>
                              {suggestion.autoImplementable && (
                                <Badge variant="secondary" className="text-xs">
                                  Auto
                                </Badge>
                              )}
                              {suggestion.implemented && (
                                <Badge variant="outline" className="bg-green-500/10 border-green-500">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Implemented
                                </Badge>
                              )}
                            </div>

                            <p className="text-sm text-muted-foreground mb-3">
                              {suggestion.description}
                            </p>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                              <div>
                                <div className="text-muted-foreground">Estimated Savings</div>
                                <div className="font-bold text-green-600">
                                  {formatCurrency(suggestion.estimatedSavings)}/mo
                                </div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">Reduction</div>
                                <div className="font-bold">
                                  {suggestion.savingsPercentage.toFixed(1)}%
                                </div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">Implementation Cost</div>
                                <div className="font-bold">
                                  {formatCurrency(suggestion.implementationCost)}
                                </div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">Payback Period</div>
                                <div className="font-bold">
                                  {suggestion.paybackPeriod.toFixed(1)} months
                                </div>
                              </div>
                            </div>

                            {!suggestion.implemented && (
                              <div className="flex gap-2 mt-3">
                                <Button
                                  size="sm"
                                  onClick={() => onImplementSuggestion?.(suggestion.id)}
                                >
                                  Implement
                                  <ArrowRight className="h-3 w-3 ml-1" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => onDismissSuggestion?.(suggestion.id)}
                                >
                                  Dismiss
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}

                {filteredSuggestions.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No suggestions available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cost Analysis</CardTitle>
              <CardDescription>Projected costs with and without optimization</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={usageData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <YAxis label={{ value: 'Cost ($)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip
                    labelFormatter={(value) => new Date(value).toLocaleString()}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend />
                  <Bar dataKey="cost" fill="#ef4444" name="Actual Cost" />
                  <Bar dataKey="optimized" fill="#22c55e" name="Optimized Cost" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
