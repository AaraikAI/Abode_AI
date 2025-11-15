'use client'

/**
 * Building Envelope Component
 *
 * Analyzes wall assemblies, R-values, insulation types,
 * and thermal bridging for energy efficiency
 */

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Home,
  Layers,
  ThermometerSun,
  Shield,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Calculator,
  Download,
  Droplets,
  Wind
} from 'lucide-react'
import {
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts'

interface AssemblyLayer {
  id: string
  material: string
  thickness: number
  rValue: number
  position: number
}

interface EnvelopeComponent {
  name: string
  area: number
  assemblyType: string
  rValue: number
  uValue: number
  layers: AssemblyLayer[]
  thermalBridging: number
  airLeakage: number
}

interface ThermalAnalysis {
  effectiveRValue: number
  heatLoss: number
  heatGain: number
  annualCost: number
  carbonEmissions: number
  improvements: Array<{
    description: string
    rValueIncrease: number
    costSavings: number
    implementationCost: number
    priority: 'high' | 'medium' | 'low'
  }>
}

interface BuildingEnvelopeProps {
  buildingName?: string
  climateZone?: string
  onAnalyze?: (analysis: ThermalAnalysis) => void
  onExport?: () => void
}

export function BuildingEnvelope({
  buildingName = 'Building',
  climateZone = 'mixed-humid',
  onAnalyze,
  onExport
}: BuildingEnvelopeProps) {
  const [components, setComponents] = useState<EnvelopeComponent[]>([
    {
      name: 'Exterior Walls',
      area: 2000,
      assemblyType: 'wood-frame-standard',
      rValue: 13,
      uValue: 0.077,
      layers: [],
      thermalBridging: 15,
      airLeakage: 0.3
    },
    {
      name: 'Roof/Ceiling',
      area: 1500,
      assemblyType: 'attic-standard',
      rValue: 30,
      uValue: 0.033,
      layers: [],
      thermalBridging: 5,
      airLeakage: 0.2
    },
    {
      name: 'Foundation/Floor',
      area: 1500,
      assemblyType: 'slab-uninsulated',
      rValue: 5,
      uValue: 0.2,
      layers: [],
      thermalBridging: 10,
      airLeakage: 0.1
    },
    {
      name: 'Windows',
      area: 300,
      assemblyType: 'double-pane',
      rValue: 3,
      uValue: 0.33,
      layers: [],
      thermalBridging: 0,
      airLeakage: 0.4
    }
  ])

  const [selectedComponent, setSelectedComponent] = useState<string>('Exterior Walls')
  const [analyzed, setAnalyzed] = useState(false)
  const [analysis, setAnalysis] = useState<ThermalAnalysis | null>(null)

  // Assembly type options
  const assemblyTypes: Record<string, Array<{ value: string; label: string; rValue: number }>> = {
    'Exterior Walls': [
      { value: 'wood-frame-standard', label: 'Wood Frame - Standard (R-13)', rValue: 13 },
      { value: 'wood-frame-advanced', label: 'Wood Frame - Advanced (R-21)', rValue: 21 },
      { value: 'masonry-standard', label: 'Masonry - Standard (R-11)', rValue: 11 },
      { value: 'masonry-insulated', label: 'Masonry - Insulated (R-19)', rValue: 19 },
      { value: 'sip', label: 'Structural Insulated Panel (R-28)', rValue: 28 },
      { value: 'icf', label: 'Insulated Concrete Form (R-25)', rValue: 25 }
    ],
    'Roof/Ceiling': [
      { value: 'attic-standard', label: 'Attic - Standard (R-30)', rValue: 30 },
      { value: 'attic-high', label: 'Attic - High Performance (R-49)', rValue: 49 },
      { value: 'cathedral-standard', label: 'Cathedral - Standard (R-19)', rValue: 19 },
      { value: 'cathedral-advanced', label: 'Cathedral - Advanced (R-38)', rValue: 38 },
      { value: 'flat-standard', label: 'Flat Roof - Standard (R-20)', rValue: 20 },
      { value: 'flat-high', label: 'Flat Roof - High Performance (R-30)', rValue: 30 }
    ],
    'Foundation/Floor': [
      { value: 'slab-uninsulated', label: 'Slab - Uninsulated (R-5)', rValue: 5 },
      { value: 'slab-insulated', label: 'Slab - Insulated (R-10)', rValue: 10 },
      { value: 'crawl-uninsulated', label: 'Crawlspace - Uninsulated (R-0)', rValue: 0 },
      { value: 'crawl-insulated', label: 'Crawlspace - Insulated (R-19)', rValue: 19 },
      { value: 'basement-uninsulated', label: 'Basement - Uninsulated (R-0)', rValue: 0 },
      { value: 'basement-insulated', label: 'Basement - Insulated (R-15)', rValue: 15 }
    ],
    'Windows': [
      { value: 'single-pane', label: 'Single Pane (R-1)', rValue: 1 },
      { value: 'double-pane', label: 'Double Pane (R-3)', rValue: 3 },
      { value: 'double-pane-lowE', label: 'Double Pane Low-E (R-4)', rValue: 4 },
      { value: 'triple-pane', label: 'Triple Pane (R-5)', rValue: 5 },
      { value: 'triple-pane-lowE', label: 'Triple Pane Low-E (R-7)', rValue: 7 }
    ]
  }

  // Climate zone requirements
  const climateRequirements: Record<string, { wall: number; ceiling: number; floor: number; window: number }> = {
    'hot-humid': { wall: 13, ceiling: 30, floor: 0, window: 3 },
    'mixed-humid': { wall: 13, ceiling: 38, floor: 13, window: 3 },
    'cold': { wall: 20, ceiling: 49, floor: 19, window: 4 },
    'very-cold': { wall: 21, ceiling: 49, floor: 30, window: 5 }
  }

  // Update component
  const updateComponent = (name: string, field: keyof EnvelopeComponent, value: any) => {
    setComponents(prev =>
      prev.map(comp => {
        if (comp.name === name) {
          const updated = { ...comp, [field]: value }
          // Update U-value when R-value changes
          if (field === 'rValue') {
            updated.uValue = value > 0 ? 1 / value : 0
          }
          return updated
        }
        return comp
      })
    )
    setAnalyzed(false)
  }

  // Analyze envelope performance
  const analyzeEnvelope = () => {
    const heatingDD = 5000 // Heating degree days (varies by climate)
    const coolingDD = 1000 // Cooling degree days

    let totalHeatLoss = 0
    let totalHeatGain = 0

    components.forEach(comp => {
      // Account for thermal bridging
      const effectiveUValue = comp.uValue * (1 + comp.thermalBridging / 100)
      const effectiveRValue = 1 / effectiveUValue

      // Heat loss (winter)
      const componentHeatLoss = comp.area * effectiveUValue * heatingDD * 24

      // Heat gain (summer)
      const componentHeatGain = comp.area * effectiveUValue * coolingDD * 24

      totalHeatLoss += componentHeatLoss
      totalHeatGain += componentHeatGain
    })

    // Convert BTU to kWh and calculate costs
    const heatingKWh = totalHeatLoss / 3412
    const coolingKWh = totalHeatGain / 3412
    const totalKWh = heatingKWh + coolingKWh
    const annualCost = totalKWh * 0.13 // $0.13/kWh average

    // Carbon emissions (kg CO2)
    const carbonEmissions = totalKWh * 0.92 / 2.2 // lbs to kg

    // Calculate weighted average R-value
    const totalArea = components.reduce((sum, comp) => sum + comp.area, 0)
    const weightedRValue =
      components.reduce((sum, comp) => sum + comp.rValue * comp.area, 0) / totalArea

    // Generate improvement recommendations
    const improvements = []
    const requirements = climateRequirements[climateZone] || climateRequirements['mixed-humid']

    // Check walls
    const wallComp = components.find(c => c.name === 'Exterior Walls')
    if (wallComp && wallComp.rValue < requirements.wall) {
      improvements.push({
        description: `Upgrade wall insulation from R-${wallComp.rValue} to R-${requirements.wall}`,
        rValueIncrease: requirements.wall - wallComp.rValue,
        costSavings: (wallComp.area * (1 / wallComp.rValue - 1 / requirements.wall) * heatingDD * 24 / 3412 * 0.13),
        implementationCost: wallComp.area * 2.5,
        priority: 'high' as const
      })
    }

    // Check ceiling
    const ceilingComp = components.find(c => c.name === 'Roof/Ceiling')
    if (ceilingComp && ceilingComp.rValue < requirements.ceiling) {
      improvements.push({
        description: `Upgrade ceiling insulation from R-${ceilingComp.rValue} to R-${requirements.ceiling}`,
        rValueIncrease: requirements.ceiling - ceilingComp.rValue,
        costSavings: (ceilingComp.area * (1 / ceilingComp.rValue - 1 / requirements.ceiling) * heatingDD * 24 / 3412 * 0.13),
        implementationCost: ceilingComp.area * 1.5,
        priority: 'high' as const
      })
    }

    // Check windows
    const windowComp = components.find(c => c.name === 'Windows')
    if (windowComp && windowComp.rValue < requirements.window) {
      improvements.push({
        description: `Upgrade windows from R-${windowComp.rValue} to R-${requirements.window}`,
        rValueIncrease: requirements.window - windowComp.rValue,
        costSavings: (windowComp.area * (1 / windowComp.rValue - 1 / requirements.window) * heatingDD * 24 / 3412 * 0.13),
        implementationCost: windowComp.area * 25,
        priority: 'medium' as const
      })
    }

    // Check air sealing
    const avgAirLeakage = components.reduce((sum, c) => sum + c.airLeakage, 0) / components.length
    if (avgAirLeakage > 0.25) {
      improvements.push({
        description: 'Improve air sealing to reduce infiltration',
        rValueIncrease: 0,
        costSavings: annualCost * 0.15, // Air sealing can save 15% on energy
        implementationCost: 2000,
        priority: 'high' as const
      })
    }

    const thermalAnalysis: ThermalAnalysis = {
      effectiveRValue: weightedRValue,
      heatLoss: totalHeatLoss,
      heatGain: totalHeatGain,
      annualCost,
      carbonEmissions,
      improvements
    }

    setAnalysis(thermalAnalysis)
    setAnalyzed(true)
    onAnalyze?.(thermalAnalysis)
  }

  // Get current component
  const currentComponent = components.find(c => c.name === selectedComponent)!

  // Get compliance status
  const getComplianceStatus = (component: EnvelopeComponent) => {
    const requirements = climateRequirements[climateZone] || climateRequirements['mixed-humid']
    let required = 0

    switch (component.name) {
      case 'Exterior Walls':
        required = requirements.wall
        break
      case 'Roof/Ceiling':
        required = requirements.ceiling
        break
      case 'Foundation/Floor':
        required = requirements.floor
        break
      case 'Windows':
        required = requirements.window
        break
    }

    const meetsCode = component.rValue >= required
    const percentage = (component.rValue / required) * 100

    return { meetsCode, required, percentage }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Building Envelope Analysis</h2>
          <p className="text-muted-foreground">{buildingName} - Thermal Performance</p>
        </div>
        {analyzed && (
          <Button variant="outline" onClick={onExport}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        )}
      </div>

      {/* Component Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Envelope Components</CardTitle>
          <CardDescription>Select a component to configure</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {components.map(comp => {
              const compliance = getComplianceStatus(comp)
              return (
                <button
                  key={comp.name}
                  onClick={() => setSelectedComponent(comp.name)}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    selectedComponent === comp.name
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <Home className="h-5 w-5 text-muted-foreground" />
                    {compliance.meetsCode ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-orange-500" />
                    )}
                  </div>
                  <div className="font-medium mb-1">{comp.name}</div>
                  <div className="text-2xl font-bold">R-{comp.rValue}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {comp.area.toLocaleString()} sq ft
                  </div>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Component Details */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>{currentComponent.name}</CardTitle>
            <CardDescription>Configuration and properties</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="area">Area (sq ft)</Label>
              <Input
                id="area"
                type="number"
                value={currentComponent.area}
                onChange={(e) =>
                  updateComponent(currentComponent.name, 'area', Number(e.target.value))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="assembly">Assembly Type</Label>
              <Select
                value={currentComponent.assemblyType}
                onValueChange={(value) => {
                  const option = assemblyTypes[currentComponent.name]?.find(
                    opt => opt.value === value
                  )
                  updateComponent(currentComponent.name, 'assemblyType', value)
                  if (option) {
                    updateComponent(currentComponent.name, 'rValue', option.rValue)
                  }
                }}
              >
                <SelectTrigger id="assembly">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {assemblyTypes[currentComponent.name]?.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rValue">R-Value</Label>
              <Input
                id="rValue"
                type="number"
                value={currentComponent.rValue}
                onChange={(e) =>
                  updateComponent(currentComponent.name, 'rValue', Number(e.target.value))
                }
              />
              <p className="text-xs text-muted-foreground">
                U-Value: {currentComponent.uValue.toFixed(3)}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bridging">Thermal Bridging (%)</Label>
              <Input
                id="bridging"
                type="number"
                value={currentComponent.thermalBridging}
                onChange={(e) =>
                  updateComponent(currentComponent.name, 'thermalBridging', Number(e.target.value))
                }
              />
              <p className="text-xs text-muted-foreground">
                Reduction in effective R-value due to framing
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="leakage">Air Leakage (CFM/sf)</Label>
              <Input
                id="leakage"
                type="number"
                step="0.1"
                value={currentComponent.airLeakage}
                onChange={(e) =>
                  updateComponent(currentComponent.name, 'airLeakage', Number(e.target.value))
                }
              />
            </div>

            <Button className="w-full" onClick={analyzeEnvelope}>
              <Calculator className="h-4 w-4 mr-2" />
              Analyze Performance
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="lg:col-span-2 space-y-6">
          {!analyzed ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Layers className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  Configure envelope components and click Analyze to see thermal performance
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Performance Metrics */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg R-Value</CardTitle>
                    <Shield className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">R-{analysis!.effectiveRValue.toFixed(1)}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Weighted average
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Annual Cost</CardTitle>
                    <TrendingUp className="h-4 w-4 text-orange-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ${analysis!.annualCost.toFixed(0)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Heat loss/gain
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Carbon Impact</CardTitle>
                    <Wind className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {(analysis!.carbonEmissions / 1000).toFixed(1)} tons
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      CO₂ per year
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Component Comparison */}
              <Card>
                <CardHeader>
                  <CardTitle>Component Performance</CardTitle>
                  <CardDescription>R-values and code compliance</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={components.map(c => ({
                      name: c.name.replace('/', '/\n'),
                      rValue: c.rValue,
                      required: getComplianceStatus(c).required
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis label={{ value: 'R-Value', angle: -90, position: 'insideLeft' }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="rValue" fill="#8b5cf6" name="Current R-Value">
                        {components.map((comp, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={getComplianceStatus(comp).meetsCode ? '#10b981' : '#f59e0b'}
                          />
                        ))}
                      </Bar>
                      <Bar dataKey="required" fill="#94a3b8" name="Required R-Value" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Improvement Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle>Improvement Recommendations</CardTitle>
                  <CardDescription>Suggested upgrades to meet code and reduce energy use</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {analysis!.improvements.length === 0 ? (
                    <div className="flex items-center gap-2 p-4 bg-green-50 rounded-lg border border-green-200">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <p className="text-sm text-green-900">
                        All components meet or exceed code requirements for your climate zone
                      </p>
                    </div>
                  ) : (
                    analysis!.improvements.map((improvement, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-medium">{improvement.description}</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              Annual savings: ${improvement.costSavings.toFixed(0)} •
                              Cost: ${improvement.implementationCost.toFixed(0)} •
                              Payback: {(improvement.implementationCost / improvement.costSavings).toFixed(1)} years
                            </p>
                          </div>
                          <Badge
                            variant={
                              improvement.priority === 'high'
                                ? 'destructive'
                                : improvement.priority === 'medium'
                                ? 'default'
                                : 'secondary'
                            }
                          >
                            {improvement.priority}
                          </Badge>
                        </div>
                        <Progress
                          value={Math.min((improvement.costSavings / 500) * 100, 100)}
                          className="h-2"
                        />
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
