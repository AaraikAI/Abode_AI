'use client'

/**
 * Cost Chart Component
 *
 * Pie/bar charts for cost distribution by category
 */

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUp,
  Download
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface CostCategory {
  name: string
  amount: number
  percentage?: number
  color?: string
  subcategories?: CostCategory[]
}

interface CostChartProps {
  categories: CostCategory[]
  title?: string
  description?: string
  showLegend?: boolean
  showPercentages?: boolean
  variant?: 'pie' | 'bar' | 'both'
}

const DEFAULT_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#84cc16', // lime
  '#6366f1', // indigo
]

export function CostChart({
  categories,
  title = 'Cost Distribution',
  description = 'Visual breakdown of project costs',
  showLegend = true,
  showPercentages = true,
  variant = 'both'
}: CostChartProps) {
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie')
  const [sortBy, setSortBy] = useState<'name' | 'amount'>('amount')

  /**
   * Calculate total
   */
  const calculateTotal = (): number => {
    return categories.reduce((sum, cat) => sum + cat.amount, 0)
  }

  /**
   * Prepare chart data with percentages and colors
   */
  const prepareChartData = (): CostCategory[] => {
    const total = calculateTotal()

    let data = categories.map((cat, index) => ({
      ...cat,
      percentage: total > 0 ? (cat.amount / total) * 100 : 0,
      color: cat.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]
    }))

    // Sort data
    if (sortBy === 'amount') {
      data = data.sort((a, b) => b.amount - a.amount)
    } else {
      data = data.sort((a, b) => a.name.localeCompare(b.name))
    }

    return data
  }

  /**
   * Export chart data
   */
  const handleExport = () => {
    const data = prepareChartData()
    const csv = [
      ['Category', 'Amount', 'Percentage'],
      ...data.map(cat => [
        cat.name,
        cat.amount.toFixed(2),
        `${cat.percentage?.toFixed(2)}%`
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'cost-distribution.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  /**
   * Render Pie Chart
   */
  const renderPieChart = (data: CostCategory[]) => {
    const total = calculateTotal()
    let currentAngle = -90 // Start from top

    return (
      <div className="flex flex-col items-center">
        <svg viewBox="0 0 400 400" className="w-full max-w-md">
          {/* Pie slices */}
          {data.map((cat, index) => {
            const percentage = cat.percentage || 0
            const angle = (percentage / 100) * 360
            const startAngle = currentAngle
            const endAngle = currentAngle + angle

            // Calculate path
            const startRad = (startAngle * Math.PI) / 180
            const endRad = (endAngle * Math.PI) / 180
            const x1 = 200 + 150 * Math.cos(startRad)
            const y1 = 200 + 150 * Math.sin(startRad)
            const x2 = 200 + 150 * Math.cos(endRad)
            const y2 = 200 + 150 * Math.sin(endRad)
            const largeArc = angle > 180 ? 1 : 0

            const path = [
              `M 200 200`,
              `L ${x1} ${y1}`,
              `A 150 150 0 ${largeArc} 1 ${x2} ${y2}`,
              `Z`
            ].join(' ')

            currentAngle = endAngle

            return (
              <g key={cat.name}>
                <path
                  d={path}
                  fill={cat.color}
                  stroke="white"
                  strokeWidth="2"
                  className="transition-opacity hover:opacity-80 cursor-pointer"
                />
                {percentage > 5 && (
                  <text
                    x={200 + 100 * Math.cos(((startAngle + endAngle) / 2) * Math.PI / 180)}
                    y={200 + 100 * Math.sin(((startAngle + endAngle) / 2) * Math.PI / 180)}
                    textAnchor="middle"
                    fill="white"
                    fontSize="14"
                    fontWeight="bold"
                  >
                    {showPercentages && `${percentage.toFixed(1)}%`}
                  </text>
                )}
              </g>
            )
          })}

          {/* Center circle for donut effect */}
          <circle cx="200" cy="200" r="80" fill="white" />
          <text x="200" y="190" textAnchor="middle" fontSize="16" fontWeight="bold">
            Total
          </text>
          <text x="200" y="215" textAnchor="middle" fontSize="20" fontWeight="bold">
            ${(total / 1000).toFixed(0)}K
          </text>
        </svg>
      </div>
    )
  }

  /**
   * Render Bar Chart
   */
  const renderBarChart = (data: CostCategory[]) => {
    const total = calculateTotal()
    const maxAmount = Math.max(...data.map(cat => cat.amount))

    return (
      <div className="space-y-4">
        {data.map((cat) => {
          const percentage = cat.percentage || 0
          const barWidth = maxAmount > 0 ? (cat.amount / maxAmount) * 100 : 0

          return (
            <div key={cat.name} className="space-y-1">
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-sm"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="font-medium">{cat.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  {showPercentages && (
                    <Badge variant="secondary">{percentage.toFixed(1)}%</Badge>
                  )}
                  <span className="font-bold">
                    ${cat.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
              <div className="w-full bg-muted rounded-full h-8 overflow-hidden">
                <div
                  className="h-full flex items-center justify-end pr-2 text-white text-sm font-medium transition-all"
                  style={{
                    width: `${barWidth}%`,
                    backgroundColor: cat.color
                  }}
                >
                  {barWidth > 15 && `$${(cat.amount / 1000).toFixed(1)}K`}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  /**
   * Render Legend
   */
  const renderLegend = (data: CostCategory[]) => {
    const total = calculateTotal()

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {data.map((cat) => (
          <div
            key={cat.name}
            className="flex items-center justify-between p-3 rounded-lg border bg-card"
          >
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-sm flex-shrink-0"
                style={{ backgroundColor: cat.color }}
              />
              <span className="text-sm font-medium">{cat.name}</span>
            </div>
            <div className="text-right">
              <div className="font-bold">
                ${cat.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              {showPercentages && (
                <div className="text-xs text-muted-foreground">
                  {cat.percentage?.toFixed(1)}%
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    )
  }

  const chartData = prepareChartData()
  const total = calculateTotal()

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {chartType === 'pie' ? (
                  <PieChartIcon className="h-5 w-5" />
                ) : (
                  <BarChart3 className="h-5 w-5" />
                )}
                {title}
              </CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {variant === 'both' && (
              <div className="space-y-2">
                <Label>Chart Type</Label>
                <Select value={chartType} onValueChange={(value: any) => setChartType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pie">Pie Chart</SelectItem>
                    <SelectItem value="bar">Bar Chart</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Sort By</Label>
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="amount">Amount (High to Low)</SelectItem>
                  <SelectItem value="name">Name (A-Z)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {chartType === 'pie' ? 'Distribution' : 'Comparison'}
            </CardTitle>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Total: ${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No data available
            </div>
          ) : chartType === 'pie' ? (
            renderPieChart(chartData)
          ) : (
            renderBarChart(chartData)
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      {showLegend && (
        <Card>
          <CardHeader>
            <CardTitle>Category Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {renderLegend(chartData)}
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Largest Category</div>
              <div className="font-bold">{chartData[0]?.name || 'N/A'}</div>
              <div className="text-sm">
                ${chartData[0]?.amount.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Number of Categories</div>
              <div className="text-2xl font-bold">{chartData.length}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Average per Category</div>
              <div className="text-2xl font-bold">
                ${chartData.length > 0
                  ? (total / chartData.length).toLocaleString(undefined, { minimumFractionDigits: 2 })
                  : '0.00'}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
