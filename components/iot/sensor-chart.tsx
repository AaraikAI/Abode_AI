'use client'

import { useState } from 'react'
import { Calendar, Download, ZoomIn, ZoomOut } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  AreaChart,
  Area,
  BarChart,
  Bar,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Brush
} from 'recharts'

export interface SensorDataPoint {
  timestamp: string
  value: number
  min?: number
  max?: number
  average?: number
  predicted?: number
}

export interface SensorMetadata {
  sensorId: string
  sensorName: string
  type: string
  unit: string
  location: string
  thresholds?: {
    min?: number
    max?: number
    warning?: number
    critical?: number
  }
}

interface SensorChartProps {
  data: SensorDataPoint[]
  metadata: SensorMetadata
  chartType?: 'line' | 'area' | 'bar' | 'composed'
  showPredictions?: boolean
  showThresholds?: boolean
  showBrush?: boolean
  onExport?: () => void
  onTimeRangeChange?: (range: string) => void
}

export function SensorChart({
  data,
  metadata,
  chartType = 'line',
  showPredictions = false,
  showThresholds = true,
  showBrush = true,
  onExport,
  onTimeRangeChange
}: SensorChartProps) {
  const [selectedRange, setSelectedRange] = useState('24h')
  const [selectedChartType, setSelectedChartType] = useState(chartType)
  const [zoom, setZoom] = useState(1)

  const handleRangeChange = (range: string) => {
    setSelectedRange(range)
    onTimeRangeChange?.(range)
  }

  const getStats = () => {
    if (data.length === 0) {
      return { min: 0, max: 0, avg: 0, current: 0 }
    }

    const values = data.map(d => d.value)
    const min = Math.min(...values)
    const max = Math.max(...values)
    const avg = values.reduce((a, b) => a + b, 0) / values.length
    const current = values[values.length - 1]

    return { min, max, avg, current }
  }

  const stats = getStats()

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)

    switch (selectedRange) {
      case '1h':
      case '6h':
      case '24h':
        return date.toLocaleTimeString()
      case '7d':
      case '30d':
        return date.toLocaleDateString()
      default:
        return date.toLocaleString()
    }
  }

  const formatValue = (value: number) => {
    return `${value.toFixed(2)} ${metadata.unit}`
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3 space-y-1">
          <p className="text-sm font-medium">{new Date(label).toLocaleString()}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-xs" style={{ color: entry.color }}>
              {entry.name}: {formatValue(entry.value)}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    }

    const xAxisProps = {
      dataKey: "timestamp",
      tickFormatter: formatTimestamp,
      angle: -45,
      textAnchor: "end",
      height: 80
    }

    const yAxisProps = {
      label: { value: metadata.unit, angle: -90, position: 'insideLeft' }
    }

    switch (selectedChartType) {
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {showThresholds && metadata.thresholds?.max && (
              <ReferenceLine
                y={metadata.thresholds.max}
                stroke="#ef4444"
                strokeDasharray="3 3"
                label="Max"
              />
            )}
            {showThresholds && metadata.thresholds?.min && (
              <ReferenceLine
                y={metadata.thresholds.min}
                stroke="#3b82f6"
                strokeDasharray="3 3"
                label="Min"
              />
            )}
            <Area
              type="monotone"
              dataKey="value"
              stroke="#3b82f6"
              fillOpacity={1}
              fill="url(#colorValue)"
              name="Value"
            />
            {showPredictions && (
              <Area
                type="monotone"
                dataKey="predicted"
                stroke="#a855f7"
                strokeDasharray="5 5"
                fillOpacity={0.3}
                fill="#a855f7"
                name="Predicted"
              />
            )}
            {showBrush && <Brush dataKey="timestamp" height={30} stroke="#3b82f6" />}
          </AreaChart>
        )

      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {showThresholds && metadata.thresholds?.max && (
              <ReferenceLine y={metadata.thresholds.max} stroke="#ef4444" strokeDasharray="3 3" />
            )}
            <Bar dataKey="value" fill="#3b82f6" name="Value" />
            {showBrush && <Brush dataKey="timestamp" height={30} stroke="#3b82f6" />}
          </BarChart>
        )

      case 'composed':
        return (
          <ComposedChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {showThresholds && metadata.thresholds?.max && (
              <ReferenceLine y={metadata.thresholds.max} stroke="#ef4444" strokeDasharray="3 3" label="Max" />
            )}
            {showThresholds && metadata.thresholds?.min && (
              <ReferenceLine y={metadata.thresholds.min} stroke="#3b82f6" strokeDasharray="3 3" label="Min" />
            )}
            <Area
              type="monotone"
              dataKey="max"
              fill="#22c55e"
              fillOpacity={0.2}
              stroke="none"
              name="Range Max"
            />
            <Area
              type="monotone"
              dataKey="min"
              fill="#ef4444"
              fillOpacity={0.2}
              stroke="none"
              name="Range Min"
            />
            <Line
              type="monotone"
              dataKey="average"
              stroke="#eab308"
              strokeWidth={2}
              dot={false}
              name="Average"
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#3b82f6"
              strokeWidth={2}
              name="Value"
            />
            {showBrush && <Brush dataKey="timestamp" height={30} stroke="#3b82f6" />}
          </ComposedChart>
        )

      default: // line
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {showThresholds && metadata.thresholds?.max && (
              <ReferenceLine
                y={metadata.thresholds.max}
                stroke="#ef4444"
                strokeDasharray="3 3"
                label="Max Threshold"
              />
            )}
            {showThresholds && metadata.thresholds?.critical && (
              <ReferenceLine
                y={metadata.thresholds.critical}
                stroke="#f97316"
                strokeDasharray="3 3"
                label="Critical"
              />
            )}
            {showThresholds && metadata.thresholds?.warning && (
              <ReferenceLine
                y={metadata.thresholds.warning}
                stroke="#eab308"
                strokeDasharray="3 3"
                label="Warning"
              />
            )}
            {showThresholds && metadata.thresholds?.min && (
              <ReferenceLine
                y={metadata.thresholds.min}
                stroke="#3b82f6"
                strokeDasharray="3 3"
                label="Min Threshold"
              />
            )}
            <Line
              type="monotone"
              dataKey="value"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
              name="Value"
            />
            {showPredictions && (
              <Line
                type="monotone"
                dataKey="predicted"
                stroke="#a855f7"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name="Predicted"
              />
            )}
            {showBrush && <Brush dataKey="timestamp" height={30} stroke="#3b82f6" />}
          </LineChart>
        )
    }
  }

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Current</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.current.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{metadata.unit}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Average</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avg.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{metadata.unit}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Minimum</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{stats.min.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{metadata.unit}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Maximum</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.max.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{metadata.unit}</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Chart */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>{metadata.sensorName}</CardTitle>
              <CardDescription>
                {metadata.location} • {metadata.type}
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select value={selectedRange} onValueChange={handleRangeChange}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">Last Hour</SelectItem>
                  <SelectItem value="6h">Last 6 Hours</SelectItem>
                  <SelectItem value="24h">Last 24 Hours</SelectItem>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedChartType} onValueChange={(v: any) => setSelectedChartType(v)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="line">Line Chart</SelectItem>
                  <SelectItem value="area">Area Chart</SelectItem>
                  <SelectItem value="bar">Bar Chart</SelectItem>
                  <SelectItem value="composed">Composed</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="sm" onClick={onExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            {renderChart()}
          </ResponsiveContainer>

          {data.length === 0 && (
            <div className="flex items-center justify-center h-[400px] text-muted-foreground">
              <div className="text-center">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No data available for the selected time range</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Thresholds Info */}
      {showThresholds && metadata.thresholds && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Threshold Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {metadata.thresholds.critical && (
                <Badge variant="destructive">
                  Critical: {metadata.thresholds.critical} {metadata.unit}
                </Badge>
              )}
              {metadata.thresholds.warning && (
                <Badge variant="secondary" className="bg-yellow-500 text-white">
                  Warning: {metadata.thresholds.warning} {metadata.unit}
                </Badge>
              )}
              {metadata.thresholds.max && (
                <Badge variant="outline" className="border-red-500 text-red-500">
                  Max: {metadata.thresholds.max} {metadata.unit}
                </Badge>
              )}
              {metadata.thresholds.min && (
                <Badge variant="outline" className="border-blue-500 text-blue-500">
                  Min: {metadata.thresholds.min} {metadata.unit}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
