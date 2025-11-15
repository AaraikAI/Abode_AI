'use client'

import { useState } from 'react'
import { Activity, Thermometer, Droplets, Wind, Zap, Gauge } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'

export interface SensorReading {
  id: string
  type: 'temperature' | 'humidity' | 'air_quality' | 'energy' | 'occupancy' | 'pressure'
  name: string
  value: number
  unit: string
  status: 'normal' | 'warning' | 'critical'
  location: string
  lastUpdated: string
  trend: 'up' | 'down' | 'stable'
  min: number
  max: number
  average: number
}

export interface HistoricalData {
  timestamp: string
  temperature?: number
  humidity?: number
  airQuality?: number
  energy?: number
  occupancy?: number
  pressure?: number
}

interface SensorDashboardProps {
  sensors: SensorReading[]
  historicalData?: HistoricalData[]
  refreshInterval?: number
  onRefresh?: () => void
}

export function SensorDashboard({
  sensors,
  historicalData = [],
  refreshInterval = 5000,
  onRefresh
}: SensorDashboardProps) {
  const [selectedTab, setSelectedTab] = useState('overview')
  const [autoRefresh, setAutoRefresh] = useState(true)

  const getSensorIcon = (type: SensorReading['type']) => {
    switch (type) {
      case 'temperature':
        return Thermometer
      case 'humidity':
        return Droplets
      case 'air_quality':
        return Wind
      case 'energy':
        return Zap
      case 'occupancy':
        return Activity
      case 'pressure':
        return Gauge
      default:
        return Activity
    }
  }

  const getStatusColor = (status: SensorReading['status']) => {
    switch (status) {
      case 'normal':
        return 'bg-green-500'
      case 'warning':
        return 'bg-yellow-500'
      case 'critical':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusBadgeVariant = (status: SensorReading['status']) => {
    switch (status) {
      case 'normal':
        return 'default'
      case 'warning':
        return 'secondary'
      case 'critical':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const getTrendIcon = (trend: SensorReading['trend']) => {
    switch (trend) {
      case 'up':
        return '↑'
      case 'down':
        return '↓'
      case 'stable':
        return '→'
      default:
        return '→'
    }
  }

  const groupedSensors = sensors.reduce((acc, sensor) => {
    if (!acc[sensor.type]) {
      acc[sensor.type] = []
    }
    acc[sensor.type].push(sensor)
    return acc
  }, {} as Record<string, SensorReading[]>)

  const criticalSensors = sensors.filter(s => s.status === 'critical')
  const warningSensors = sensors.filter(s => s.status === 'warning')

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sensors</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sensors.length}</div>
            <p className="text-xs text-muted-foreground">
              {sensors.filter(s => s.status === 'normal').length} operational
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
            <Activity className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{criticalSensors.length}</div>
            <p className="text-xs text-muted-foreground">
              Requires immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warnings</CardTitle>
            <Activity className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{warningSensors.length}</div>
            <p className="text-xs text-muted-foreground">
              Monitor closely
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Points</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{historicalData.length}</div>
            <p className="text-xs text-muted-foreground">
              Last 24 hours
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sensors">Sensors</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {Object.entries(groupedSensors).map(([type, typeSensors]) => {
              const Icon = getSensorIcon(type as SensorReading['type'])
              const avgValue = typeSensors.reduce((sum, s) => sum + s.value, 0) / typeSensors.length

              return (
                <Card key={type}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-5 w-5" />
                        <CardTitle className="text-base capitalize">
                          {type.replace('_', ' ')}
                        </CardTitle>
                      </div>
                      <Badge variant={getStatusBadgeVariant(typeSensors[0].status)}>
                        {typeSensors.filter(s => s.status === 'normal').length}/{typeSensors.length} OK
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-end gap-2">
                      <span className="text-3xl font-bold">{avgValue.toFixed(1)}</span>
                      <span className="text-sm text-muted-foreground pb-1">
                        {typeSensors[0].unit}
                      </span>
                      <span className="text-sm text-muted-foreground pb-1 ml-auto">
                        {getTrendIcon(typeSensors[0].trend)}
                      </span>
                    </div>

                    {typeSensors.map(sensor => (
                      <div key={sensor.id} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">{sensor.location}</span>
                          <span className="font-medium">{sensor.value.toFixed(1)} {sensor.unit}</span>
                        </div>
                        <Progress
                          value={((sensor.value - sensor.min) / (sensor.max - sensor.min)) * 100}
                          className="h-1"
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="sensors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Sensors</CardTitle>
              <CardDescription>Real-time sensor readings and status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sensors.map(sensor => {
                  const Icon = getSensorIcon(sensor.type)

                  return (
                    <div
                      key={sensor.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-2 w-2 rounded-full ${getStatusColor(sensor.status)}`} />
                        <Icon className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{sensor.name}</div>
                          <div className="text-xs text-muted-foreground">{sensor.location}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-bold text-lg">
                            {sensor.value.toFixed(1)} {sensor.unit}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Avg: {sensor.average.toFixed(1)} {sensor.unit}
                          </div>
                        </div>
                        <Badge variant={getStatusBadgeVariant(sensor.status)}>
                          {sensor.status}
                        </Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historical Trends</CardTitle>
              <CardDescription>Sensor data over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={historicalData}>
                  <defs>
                    <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorHumidity" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorAQ" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(value) => new Date(value).toLocaleString()}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="temperature"
                    stroke="#ef4444"
                    fillOpacity={1}
                    fill="url(#colorTemp)"
                    name="Temperature (°C)"
                  />
                  <Area
                    type="monotone"
                    dataKey="humidity"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorHumidity)"
                    name="Humidity (%)"
                  />
                  <Area
                    type="monotone"
                    dataKey="airQuality"
                    stroke="#22c55e"
                    fillOpacity={1}
                    fill="url(#colorAQ)"
                    name="Air Quality"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
