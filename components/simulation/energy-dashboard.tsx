'use client'

/**
 * Energy Simulation Dashboard
 *
 * Displays energy modeling results and recommendations
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Zap,
  TrendingUp,
  TrendingDown,
  Leaf,
  DollarSign,
  ThermometerSun,
  ThermometerSnowflake,
  Lightbulb,
  AlertCircle,
  CheckCircle2,
  ArrowRight
} from 'lucide-react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
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

interface EnergyResults {
  annual: {
    heating: number
    cooling: number
    lighting: number
    equipment: number
    waterHeating: number
    total: number
  }
  monthly: Array<{
    month: string
    heating: number
    cooling: number
    lighting: number
    equipment: number
    total: number
  }>
  peak: {
    heating: number
    cooling: number
    total: number
  }
  costs: {
    annual: number
    monthly: number
    perSqFt: number
  }
  carbon: {
    annual: number
    perSqFt: number
  }
  efficiency: {
    eui: number
    euiNormalized: number
    rating: string
  }
  recommendations: Array<{
    category: string
    title: string
    description: string
    savings: number
    cost: number
    paybackYears: number
    priority: 'high' | 'medium' | 'low'
  }>
}

interface EnergyDashboardProps {
  results: EnergyResults
  buildingArea: number
}

export function EnergyDashboard({ results, buildingArea }: EnergyDashboardProps) {
  const [selectedTab, setSelectedTab] = useState('overview')

  // Colors for charts
  const COLORS = {
    heating: '#ef4444',
    cooling: '#3b82f6',
    lighting: '#eab308',
    equipment: '#8b5cf6',
    waterHeating: '#f97316'
  }

  // Prepare data for energy breakdown pie chart
  const energyBreakdownData = [
    { name: 'Heating', value: results.annual.heating, color: COLORS.heating },
    { name: 'Cooling', value: results.annual.cooling, color: COLORS.cooling },
    { name: 'Lighting', value: results.annual.lighting, color: COLORS.lighting },
    { name: 'Equipment', value: results.annual.equipment, color: COLORS.equipment },
    { name: 'Water Heating', value: results.annual.waterHeating, color: COLORS.waterHeating }
  ]

  // Get efficiency rating badge color
  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'A+':
      case 'A':
        return 'bg-green-500'
      case 'B':
        return 'bg-lime-500'
      case 'C':
        return 'bg-yellow-500'
      case 'D':
        return 'bg-orange-500'
      default:
        return 'bg-red-500'
    }
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

  // Format energy (kWh)
  const formatEnergy = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value) + ' kWh'
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Annual Energy</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatEnergy(results.annual.total)}</div>
            <p className="text-xs text-muted-foreground">
              {results.efficiency.eui.toFixed(1)} kBtu/sf·yr
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Annual Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(results.costs.annual)}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(results.costs.perSqFt)}/sf·yr
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Carbon Footprint</CardTitle>
            <Leaf className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(results.carbon.annual / 1000).toFixed(1)} tons
            </div>
            <p className="text-xs text-muted-foreground">
              {results.carbon.perSqFt.toFixed(1)} kg CO₂/sf·yr
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Efficiency Rating</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge className={getRatingColor(results.efficiency.rating)}>
                {results.efficiency.rating}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {results.efficiency.euiNormalized.toFixed(0)}% of baseline
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Energy Breakdown Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Energy Consumption Breakdown</CardTitle>
                <CardDescription>Annual energy use by category</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={energyBreakdownData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {energyBreakdownData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatEnergy(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Peak Loads */}
            <Card>
              <CardHeader>
                <CardTitle>Peak Loads</CardTitle>
                <CardDescription>Maximum demand by category</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ThermometerSun className="h-4 w-4 text-red-500" />
                      <span className="text-sm font-medium">Peak Heating</span>
                    </div>
                    <span className="text-sm font-bold">
                      {(results.peak.heating / 1000).toFixed(1)} kW
                    </span>
                  </div>
                  <Progress value={(results.peak.heating / results.peak.total) * 100} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ThermometerSnowflake className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium">Peak Cooling</span>
                    </div>
                    <span className="text-sm font-bold">
                      {(results.peak.cooling / 1000).toFixed(1)} kW
                    </span>
                  </div>
                  <Progress value={(results.peak.cooling / results.peak.total) * 100} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-purple-500" />
                      <span className="text-sm font-medium">Total Peak</span>
                    </div>
                    <span className="text-sm font-bold">
                      {(results.peak.total / 1000).toFixed(1)} kW
                    </span>
                  </div>
                  <Progress value={100} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Breakdown Tab */}
        <TabsContent value="breakdown" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Energy Breakdown</CardTitle>
              <CardDescription>Annual consumption by end use</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(results.annual).filter(([key]) => key !== 'total').map(([category, value]) => {
                  const percentage = (value / results.annual.total) * 100
                  const Icon = category === 'heating' ? ThermometerSun :
                              category === 'cooling' ? ThermometerSnowflake :
                              category === 'lighting' ? Lightbulb :
                              Zap

                  return (
                    <div key={category} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <span className="text-sm font-medium capitalize">
                            {category.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold">{formatEnergy(value)}</div>
                          <div className="text-xs text-muted-foreground">
                            {percentage.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monthly Tab */}
        <TabsContent value="monthly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Energy Consumption</CardTitle>
              <CardDescription>Breakdown by category and month</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={results.monthly}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis label={{ value: 'Energy (kWh)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip formatter={(value: number) => formatEnergy(value)} />
                  <Legend />
                  <Bar dataKey="heating" stackId="a" fill={COLORS.heating} name="Heating" />
                  <Bar dataKey="cooling" stackId="a" fill={COLORS.cooling} name="Cooling" />
                  <Bar dataKey="lighting" stackId="a" fill={COLORS.lighting} name="Lighting" />
                  <Bar dataKey="equipment" stackId="a" fill={COLORS.equipment} name="Equipment" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-4">
          {results.recommendations.map((rec, index) => {
            const priorityColor = rec.priority === 'high' ? 'destructive' :
                                rec.priority === 'medium' ? 'default' : 'secondary'

            const priorityIcon = rec.priority === 'high' ? TrendingUp :
                                rec.priority === 'medium' ? ArrowRight : TrendingDown

            const PriorityIcon = priorityIcon

            return (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{rec.title}</CardTitle>
                      <CardDescription>{rec.category}</CardDescription>
                    </div>
                    <Badge variant={priorityColor}>
                      <PriorityIcon className="h-3 w-3 mr-1" />
                      {rec.priority} priority
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{rec.description}</p>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">Annual Savings</div>
                      <div className="text-lg font-bold text-green-600">
                        {formatCurrency(rec.savings)}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">Implementation Cost</div>
                      <div className="text-lg font-bold">
                        {formatCurrency(rec.cost)}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">Payback Period</div>
                      <div className="text-lg font-bold">
                        {rec.paybackYears.toFixed(1)} years
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </TabsContent>
      </Tabs>
    </div>
  )
}
