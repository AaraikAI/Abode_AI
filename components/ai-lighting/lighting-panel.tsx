'use client'

/**
 * AI-Powered Lighting Optimization Panel
 *
 * Advanced lighting control and optimization using AI algorithms
 * for energy efficiency and occupant comfort
 */

import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import {
  Lightbulb,
  Sun,
  Moon,
  Zap,
  TrendingDown,
  Clock,
  Users,
  Settings,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Activity,
  Eye
} from 'lucide-react'
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

export interface LightingZone {
  id: string
  name: string
  brightness: number
  temperature: number // Kelvin
  occupancy: number
  energyUsage: number // Watts
  schedule: 'auto' | 'manual' | 'scheduled'
  status: 'on' | 'off' | 'dimmed'
  aiOptimized: boolean
}

export interface OptimizationSuggestion {
  id: string
  zoneId: string
  type: 'brightness' | 'schedule' | 'temperature' | 'occupancy'
  currentValue: number | string
  suggestedValue: number | string
  potentialSavings: number // percentage
  reason: string
  confidence: number // 0-100
}

export interface EnergyMetrics {
  timestamp: string
  consumption: number
  savings: number
  occupancy: number
}

interface LightingPanelProps {
  zones?: LightingZone[]
  historicalData?: EnergyMetrics[]
  onZoneUpdate?: (zoneId: string, updates: Partial<LightingZone>) => void
  onApplySuggestion?: (suggestion: OptimizationSuggestion) => void
  autoOptimize?: boolean
}

const defaultZones: LightingZone[] = [
  {
    id: 'z1',
    name: 'Main Office',
    brightness: 75,
    temperature: 4000,
    occupancy: 12,
    energyUsage: 450,
    schedule: 'auto',
    status: 'on',
    aiOptimized: true
  },
  {
    id: 'z2',
    name: 'Conference Room A',
    brightness: 60,
    temperature: 3500,
    occupancy: 4,
    energyUsage: 180,
    schedule: 'manual',
    status: 'dimmed',
    aiOptimized: false
  },
  {
    id: 'z3',
    name: 'Lobby',
    brightness: 85,
    temperature: 5000,
    occupancy: 8,
    energyUsage: 320,
    schedule: 'scheduled',
    status: 'on',
    aiOptimized: true
  }
]

const defaultMetrics: EnergyMetrics[] = Array.from({ length: 24 }, (_, i) => ({
  timestamp: `${i}:00`,
  consumption: Math.random() * 500 + 200,
  savings: Math.random() * 100,
  occupancy: Math.floor(Math.random() * 50)
}))

export function LightingPanel({
  zones = defaultZones,
  historicalData = defaultMetrics,
  onZoneUpdate,
  onApplySuggestion,
  autoOptimize = false
}: LightingPanelProps) {
  const { toast } = useToast()
  const [selectedZone, setSelectedZone] = useState<string>(zones[0]?.id || '')
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [optimizationEnabled, setOptimizationEnabled] = useState(autoOptimize)
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([])
  const [activeTab, setActiveTab] = useState('zones')

  // Calculate total metrics
  const totalEnergy = zones.reduce((sum, zone) => sum + zone.energyUsage, 0)
  const totalOccupancy = zones.reduce((sum, zone) => sum + zone.occupancy, 0)
  const optimizedZones = zones.filter(z => z.aiOptimized).length
  const potentialSavings = suggestions.reduce((sum, s) => sum + s.potentialSavings, 0)

  /**
   * Generate AI optimization suggestions
   */
  const generateSuggestions = () => {
    const newSuggestions: OptimizationSuggestion[] = []

    zones.forEach(zone => {
      // Brightness optimization based on occupancy
      if (zone.occupancy === 0 && zone.status === 'on') {
        newSuggestions.push({
          id: `s-${zone.id}-brightness`,
          zoneId: zone.id,
          type: 'brightness',
          currentValue: zone.brightness,
          suggestedValue: 30,
          potentialSavings: 45,
          reason: 'No occupancy detected. Reduce brightness to minimum.',
          confidence: 95
        })
      } else if (zone.occupancy < 5 && zone.brightness > 70) {
        newSuggestions.push({
          id: `s-${zone.id}-brightness`,
          zoneId: zone.id,
          type: 'brightness',
          currentValue: zone.brightness,
          suggestedValue: 60,
          potentialSavings: 20,
          reason: 'Low occupancy. Reduce brightness for energy savings.',
          confidence: 85
        })
      }

      // Schedule optimization
      if (zone.schedule === 'manual' && !zone.aiOptimized) {
        newSuggestions.push({
          id: `s-${zone.id}-schedule`,
          zoneId: zone.id,
          type: 'schedule',
          currentValue: zone.schedule,
          suggestedValue: 'auto',
          potentialSavings: 30,
          reason: 'Enable automatic scheduling for better energy management.',
          confidence: 90
        })
      }
    })

    setSuggestions(newSuggestions)
  }

  useEffect(() => {
    if (optimizationEnabled) {
      generateSuggestions()
      const interval = setInterval(generateSuggestions, 30000) // Every 30 seconds
      return () => clearInterval(interval)
    }
  }, [optimizationEnabled, zones])

  /**
   * Apply optimization to a zone
   */
  const handleOptimize = async (zoneId: string) => {
    setIsOptimizing(true)

    try {
      // Simulate AI optimization
      await new Promise(resolve => setTimeout(resolve, 1500))

      const zone = zones.find(z => z.id === zoneId)
      if (zone) {
        const optimizedBrightness = zone.occupancy > 10 ? 80 : zone.occupancy > 5 ? 60 : 40

        onZoneUpdate?.(zoneId, {
          brightness: optimizedBrightness,
          schedule: 'auto',
          aiOptimized: true
        })

        toast({
          title: 'Zone Optimized',
          description: `${zone.name} has been optimized for energy efficiency`
        })
      }
    } catch (error) {
      toast({
        title: 'Optimization Failed',
        description: 'Failed to optimize lighting zone',
        variant: 'destructive'
      })
    } finally {
      setIsOptimizing(false)
    }
  }

  /**
   * Apply a specific suggestion
   */
  const handleApplySuggestion = (suggestion: OptimizationSuggestion) => {
    onApplySuggestion?.(suggestion)
    setSuggestions(prev => prev.filter(s => s.id !== suggestion.id))

    toast({
      title: 'Suggestion Applied',
      description: `Potential savings: ${suggestion.potentialSavings}%`
    })
  }

  /**
   * Update zone brightness
   */
  const handleBrightnessChange = (zoneId: string, brightness: number) => {
    onZoneUpdate?.(zoneId, { brightness })
  }

  /**
   * Update zone temperature
   */
  const handleTemperatureChange = (zoneId: string, temperature: number) => {
    onZoneUpdate?.(zoneId, { temperature })
  }

  const selectedZoneData = zones.find(z => z.id === selectedZone)

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Energy</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEnergy.toFixed(0)}W</div>
            <p className="text-xs text-muted-foreground">
              <TrendingDown className="inline h-3 w-3 mr-1" />
              12% reduction this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Optimized</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{optimizedZones}/{zones.length}</div>
            <p className="text-xs text-muted-foreground">
              {((optimizedZones / zones.length) * 100).toFixed(0)}% coverage
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Occupancy</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOccupancy}</div>
            <p className="text-xs text-muted-foreground">
              Across {zones.length} zones
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Potential Savings</CardTitle>
            <TrendingDown className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {potentialSavings.toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {suggestions.length} suggestions available
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Auto-Optimization Toggle */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>AI Optimization</CardTitle>
              <CardDescription>
                Automatically optimize lighting based on occupancy and usage patterns
              </CardDescription>
            </div>
            <Switch
              checked={optimizationEnabled}
              onCheckedChange={setOptimizationEnabled}
            />
          </div>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="zones">
            <Lightbulb className="h-4 w-4 mr-2" />
            Zones
          </TabsTrigger>
          <TabsTrigger value="suggestions">
            <Sparkles className="h-4 w-4 mr-2" />
            Suggestions ({suggestions.length})
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <Activity className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Zones Tab */}
        <TabsContent value="zones" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Zone List */}
            <Card>
              <CardHeader>
                <CardTitle>Lighting Zones</CardTitle>
                <CardDescription>Control individual zones</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {zones.map(zone => (
                  <div
                    key={zone.id}
                    onClick={() => setSelectedZone(zone.id)}
                    className={`p-4 border rounded-lg cursor-pointer transition-all hover:bg-accent/50 ${
                      selectedZone === zone.id ? 'border-primary bg-accent/30' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Lightbulb
                          className={`h-5 w-5 ${
                            zone.status === 'on'
                              ? 'text-yellow-500'
                              : zone.status === 'dimmed'
                              ? 'text-yellow-500/50'
                              : 'text-muted-foreground'
                          }`}
                        />
                        <span className="font-medium">{zone.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {zone.aiOptimized && (
                          <Badge variant="secondary" className="text-xs">
                            <Sparkles className="h-3 w-3 mr-1" />
                            AI
                          </Badge>
                        )}
                        <Badge variant={zone.status === 'on' ? 'default' : 'outline'}>
                          {zone.status}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Brightness</div>
                        <div className="font-medium">{zone.brightness}%</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Occupancy</div>
                        <div className="font-medium">{zone.occupancy}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Energy</div>
                        <div className="font-medium">{zone.energyUsage}W</div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Zone Controls */}
            {selectedZoneData && (
              <Card>
                <CardHeader>
                  <CardTitle>{selectedZoneData.name} Controls</CardTitle>
                  <CardDescription>Adjust lighting parameters</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Brightness Control */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Brightness</Label>
                      <span className="text-sm font-medium">{selectedZoneData.brightness}%</span>
                    </div>
                    <Slider
                      value={[selectedZoneData.brightness]}
                      onValueChange={([value]) => handleBrightnessChange(selectedZone, value)}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  {/* Color Temperature */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Color Temperature</Label>
                      <span className="text-sm font-medium">{selectedZoneData.temperature}K</span>
                    </div>
                    <Slider
                      value={[selectedZoneData.temperature]}
                      onValueChange={([value]) => handleTemperatureChange(selectedZone, value)}
                      min={2700}
                      max={6500}
                      step={100}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Sun className="h-3 w-3" /> Warm
                      </span>
                      <span className="flex items-center gap-1">
                        Cool <Moon className="h-3 w-3" />
                      </span>
                    </div>
                  </div>

                  {/* Schedule Mode */}
                  <div className="space-y-2">
                    <Label>Schedule Mode</Label>
                    <Select
                      value={selectedZoneData.schedule}
                      onValueChange={(value: any) =>
                        onZoneUpdate?.(selectedZone, { schedule: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4" />
                            Automatic (AI)
                          </div>
                        </SelectItem>
                        <SelectItem value="scheduled">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Scheduled
                          </div>
                        </SelectItem>
                        <SelectItem value="manual">
                          <div className="flex items-center gap-2">
                            <Settings className="h-4 w-4" />
                            Manual
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Occupancy Info */}
                  <div className="rounded-lg bg-muted p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Current Occupancy</span>
                      </div>
                      <span className="text-2xl font-bold">{selectedZoneData.occupancy}</span>
                    </div>
                  </div>

                  {/* Optimize Button */}
                  <Button
                    onClick={() => handleOptimize(selectedZone)}
                    disabled={isOptimizing || selectedZoneData.aiOptimized}
                    className="w-full"
                  >
                    {isOptimizing ? (
                      <>
                        <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
                        Optimizing...
                      </>
                    ) : selectedZoneData.aiOptimized ? (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Already Optimized
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Optimize Zone
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Suggestions Tab */}
        <TabsContent value="suggestions" className="space-y-4">
          {suggestions.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Suggestions</h3>
                <p className="text-muted-foreground">
                  All zones are optimized. Enable AI optimization to get suggestions.
                </p>
              </CardContent>
            </Card>
          ) : (
            suggestions.map(suggestion => (
              <Card key={suggestion.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">
                        {zones.find(z => z.id === suggestion.zoneId)?.name}
                      </CardTitle>
                      <CardDescription className="capitalize">
                        {suggestion.type} optimization
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">
                      {suggestion.confidence}% confidence
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm">{suggestion.reason}</p>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="rounded-lg bg-muted p-3">
                      <div className="text-muted-foreground">Current</div>
                      <div className="font-medium text-lg">{suggestion.currentValue}</div>
                    </div>
                    <div className="rounded-lg bg-primary/10 p-3">
                      <div className="text-muted-foreground">Suggested</div>
                      <div className="font-medium text-lg text-primary">
                        {suggestion.suggestedValue}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-green-500" />
                      <span className="text-sm">
                        Potential savings:{' '}
                        <span className="font-bold text-green-500">
                          {suggestion.potentialSavings}%
                        </span>
                      </span>
                    </div>
                    <Button onClick={() => handleApplySuggestion(suggestion)} size="sm">
                      Apply
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Energy Consumption</CardTitle>
              <CardDescription>24-hour energy usage and savings</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={historicalData}>
                  <defs>
                    <linearGradient id="colorConsumption" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="consumption"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorConsumption)"
                    name="Consumption (W)"
                  />
                  <Area
                    type="monotone"
                    dataKey="savings"
                    stroke="#22c55e"
                    fillOpacity={1}
                    fill="url(#colorSavings)"
                    name="Savings (W)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Occupancy Trends</CardTitle>
              <CardDescription>Space utilization over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={historicalData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="occupancy"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    name="Occupancy"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
