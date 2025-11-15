'use client'

/**
 * HVAC Sizing Calculator Component
 *
 * Calculates heating and cooling loads for proper HVAC system sizing
 * using Manual J methodology
 */

import { useState, useEffect } from 'react'
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
  ThermometerSun,
  ThermometerSnowflake,
  Wind,
  Home,
  Calculator,
  CheckCircle2,
  AlertTriangle,
  Download,
  Info
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts'

interface BuildingParameters {
  area: number
  ceilingHeight: number
  floors: number
  orientation: string
  climate: string
  insulation: string
  windowArea: number
  infiltration: string
}

interface LoadCalculation {
  heating: number
  cooling: number
  sensibleCooling: number
  latentCooling: number
  ventilation: number
  breakdown: Array<{
    component: string
    heating: number
    cooling: number
  }>
}

interface EquipmentRecommendation {
  type: string
  capacity: number
  unit: string
  efficiency: string
  estimatedCost: number
  notes: string[]
}

interface HVACSizingProps {
  buildingName?: string
  defaultParameters?: Partial<BuildingParameters>
  onCalculate?: (results: LoadCalculation) => void
  onExport?: (results: LoadCalculation) => void
}

export function HVACSizing({
  buildingName = 'Building',
  defaultParameters,
  onCalculate,
  onExport
}: HVACSizingProps) {
  const [parameters, setParameters] = useState<BuildingParameters>({
    area: defaultParameters?.area || 2000,
    ceilingHeight: defaultParameters?.ceilingHeight || 8,
    floors: defaultParameters?.floors || 1,
    orientation: defaultParameters?.orientation || 'north',
    climate: defaultParameters?.climate || 'mixed-humid',
    insulation: defaultParameters?.insulation || 'standard',
    windowArea: defaultParameters?.windowArea || 300,
    infiltration: defaultParameters?.infiltration || 'average'
  })

  const [calculated, setCalculated] = useState(false)
  const [results, setResults] = useState<LoadCalculation | null>(null)
  const [recommendations, setRecommendations] = useState<EquipmentRecommendation[]>([])

  // Climate zone data
  const climateZones = [
    { value: 'hot-humid', label: 'Hot-Humid (Zone 1-2)' },
    { value: 'hot-dry', label: 'Hot-Dry (Zone 2-3)' },
    { value: 'mixed-humid', label: 'Mixed-Humid (Zone 4A)' },
    { value: 'mixed-dry', label: 'Mixed-Dry (Zone 4B)' },
    { value: 'cool', label: 'Cool (Zone 5)' },
    { value: 'cold', label: 'Cold (Zone 6-7)' },
    { value: 'very-cold', label: 'Very Cold (Zone 8)' }
  ]

  // Update parameter
  const updateParameter = (key: keyof BuildingParameters, value: string | number) => {
    setParameters(prev => ({
      ...prev,
      [key]: value
    }))
    setCalculated(false)
  }

  // Calculate loads (simplified Manual J methodology)
  const calculateLoads = () => {
    const { area, ceilingHeight, windowArea, climate, insulation, infiltration } = parameters

    // Climate factors
    const climateFactors: Record<string, { heating: number; cooling: number }> = {
      'hot-humid': { heating: 0.5, cooling: 1.5 },
      'hot-dry': { heating: 0.6, cooling: 1.4 },
      'mixed-humid': { heating: 1.0, cooling: 1.0 },
      'mixed-dry': { heating: 1.0, cooling: 0.9 },
      'cool': { heating: 1.3, cooling: 0.7 },
      'cold': { heating: 1.6, cooling: 0.5 },
      'very-cold': { heating: 2.0, cooling: 0.3 }
    }

    // Insulation factors
    const insulationFactors: Record<string, number> = {
      'poor': 1.5,
      'standard': 1.0,
      'good': 0.8,
      'excellent': 0.6
    }

    // Infiltration factors
    const infiltrationFactors: Record<string, number> = {
      'tight': 0.8,
      'average': 1.0,
      'loose': 1.3
    }

    const climateFactor = climateFactors[climate] || climateFactors['mixed-humid']
    const insulationFactor = insulationFactors[insulation] || 1.0
    const infiltrationFactor = infiltrationFactors[infiltration] || 1.0

    // Base load calculations (BTU/hr)
    const wallLoad = area * 3 * insulationFactor
    const ceilingLoad = area * 2 * insulationFactor
    const floorLoad = area * 1.5 * insulationFactor
    const windowLoad = windowArea * 12 * insulationFactor
    const infiltrationLoad = area * ceilingHeight * 0.018 * infiltrationFactor
    const ventilationLoad = area * 0.35

    // Heating load
    const heatingLoad = (
      wallLoad * climateFactor.heating +
      ceilingLoad * climateFactor.heating +
      floorLoad * climateFactor.heating +
      windowLoad * climateFactor.heating * 1.5 +
      infiltrationLoad * climateFactor.heating
    )

    // Cooling load (sensible + latent)
    const sensibleCooling = (
      wallLoad * climateFactor.cooling +
      ceilingLoad * climateFactor.cooling +
      floorLoad * climateFactor.cooling * 0.5 +
      windowLoad * climateFactor.cooling * 2.0 +
      infiltrationLoad * climateFactor.cooling * 0.8
    )

    const latentCooling = sensibleCooling * 0.3 // Latent is typically 30% of sensible
    const coolingLoad = sensibleCooling + latentCooling

    const breakdown = [
      {
        component: 'Walls',
        heating: wallLoad * climateFactor.heating,
        cooling: wallLoad * climateFactor.cooling
      },
      {
        component: 'Ceiling',
        heating: ceilingLoad * climateFactor.heating,
        cooling: ceilingLoad * climateFactor.cooling
      },
      {
        component: 'Floor',
        heating: floorLoad * climateFactor.heating,
        cooling: floorLoad * climateFactor.cooling * 0.5
      },
      {
        component: 'Windows',
        heating: windowLoad * climateFactor.heating * 1.5,
        cooling: windowLoad * climateFactor.cooling * 2.0
      },
      {
        component: 'Infiltration',
        heating: infiltrationLoad * climateFactor.heating,
        cooling: infiltrationLoad * climateFactor.cooling * 0.8
      }
    ]

    const loadResults: LoadCalculation = {
      heating: heatingLoad,
      cooling: coolingLoad,
      sensibleCooling,
      latentCooling,
      ventilation: ventilationLoad,
      breakdown
    }

    setResults(loadResults)
    setCalculated(true)

    // Generate equipment recommendations
    generateRecommendations(loadResults)

    onCalculate?.(loadResults)
  }

  // Generate equipment recommendations
  const generateRecommendations = (loads: LoadCalculation) => {
    const heatingTons = loads.heating / 12000 // Convert BTU to tons
    const coolingTons = loads.cooling / 12000

    const recs: EquipmentRecommendation[] = []

    // Heat pump recommendation
    recs.push({
      type: 'Air Source Heat Pump',
      capacity: Math.ceil(Math.max(heatingTons, coolingTons) * 2) / 2, // Round to nearest 0.5 ton
      unit: 'tons',
      efficiency: 'SEER 16 / HSPF 9.5',
      estimatedCost: Math.ceil(Math.max(heatingTons, coolingTons)) * 3500,
      notes: [
        'Energy efficient year-round',
        'Eligible for federal tax credits',
        'Lower operating costs'
      ]
    })

    // Traditional split system
    recs.push({
      type: 'Split System (AC + Furnace)',
      capacity: Math.ceil(coolingTons * 2) / 2,
      unit: 'tons cooling',
      efficiency: 'SEER 14 / AFUE 92%',
      estimatedCost: Math.ceil(coolingTons) * 3000,
      notes: [
        'Proven technology',
        'Lower upfront cost',
        'Separate heating and cooling'
      ]
    })

    // High-efficiency option
    if (loads.cooling > 36000 || loads.heating > 48000) {
      recs.push({
        type: 'Variable Refrigerant Flow (VRF)',
        capacity: Math.ceil(Math.max(heatingTons, coolingTons) * 2) / 2,
        unit: 'tons',
        efficiency: 'SEER 18+ / HSPF 11+',
        estimatedCost: Math.ceil(Math.max(heatingTons, coolingTons)) * 5000,
        notes: [
          'Highest efficiency available',
          'Zone control capability',
          'Quiet operation',
          'Longer lifespan'
        ]
      })
    }

    setRecommendations(recs)
  }

  // Format BTU
  const formatBTU = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value) + ' BTU/hr'
  }

  // Format tons
  const formatTons = (btu: number) => {
    return (btu / 12000).toFixed(1) + ' tons'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">HVAC Sizing Calculator</h2>
          <p className="text-muted-foreground">{buildingName} - Manual J Load Calculation</p>
        </div>
        {calculated && (
          <Button variant="outline" onClick={() => onExport?.(results!)}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Input Parameters */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Building Parameters</CardTitle>
            <CardDescription>Enter building details for load calculation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="area">Conditioned Area (sq ft)</Label>
              <Input
                id="area"
                type="number"
                value={parameters.area}
                onChange={(e) => updateParameter('area', Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ceilingHeight">Ceiling Height (ft)</Label>
              <Input
                id="ceilingHeight"
                type="number"
                value={parameters.ceilingHeight}
                onChange={(e) => updateParameter('ceilingHeight', Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="floors">Number of Floors</Label>
              <Input
                id="floors"
                type="number"
                value={parameters.floors}
                onChange={(e) => updateParameter('floors', Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="windowArea">Window Area (sq ft)</Label>
              <Input
                id="windowArea"
                type="number"
                value={parameters.windowArea}
                onChange={(e) => updateParameter('windowArea', Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="climate">Climate Zone</Label>
              <Select value={parameters.climate} onValueChange={(v) => updateParameter('climate', v)}>
                <SelectTrigger id="climate">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {climateZones.map((zone) => (
                    <SelectItem key={zone.value} value={zone.value}>
                      {zone.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="insulation">Insulation Level</Label>
              <Select value={parameters.insulation} onValueChange={(v) => updateParameter('insulation', v)}>
                <SelectTrigger id="insulation">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="poor">Poor (R-11 walls, R-19 ceiling)</SelectItem>
                  <SelectItem value="standard">Standard (R-13 walls, R-30 ceiling)</SelectItem>
                  <SelectItem value="good">Good (R-19 walls, R-38 ceiling)</SelectItem>
                  <SelectItem value="excellent">Excellent (R-21+ walls, R-49+ ceiling)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="infiltration">Air Tightness</Label>
              <Select value={parameters.infiltration} onValueChange={(v) => updateParameter('infiltration', v)}>
                <SelectTrigger id="infiltration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tight">Tight (&lt; 3 ACH50)</SelectItem>
                  <SelectItem value="average">Average (3-7 ACH50)</SelectItem>
                  <SelectItem value="loose">Loose (&gt; 7 ACH50)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button className="w-full" onClick={calculateLoads}>
              <Calculator className="h-4 w-4 mr-2" />
              Calculate Loads
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="lg:col-span-2 space-y-6">
          {!calculated ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calculator className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  Enter building parameters and click Calculate to see load calculations
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Load Summary Cards */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Heating Load</CardTitle>
                    <ThermometerSun className="h-4 w-4 text-red-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatBTU(results!.heating)}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatTons(results!.heating)}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Cooling Load</CardTitle>
                    <ThermometerSnowflake className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatBTU(results!.cooling)}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatTons(results!.cooling)}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ventilation</CardTitle>
                    <Wind className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatBTU(results!.ventilation)}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Fresh air requirement
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Load Breakdown Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Load Breakdown by Component</CardTitle>
                  <CardDescription>Heating and cooling loads by building component</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={results!.breakdown}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="component" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => formatBTU(value)} />
                      <Legend />
                      <Bar dataKey="heating" fill="#ef4444" name="Heating Load" />
                      <Bar dataKey="cooling" fill="#3b82f6" name="Cooling Load" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Equipment Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle>Equipment Recommendations</CardTitle>
                  <CardDescription>Suggested HVAC systems based on calculated loads</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recommendations.map((rec, index) => (
                    <div
                      key={index}
                      className="p-4 border rounded-lg space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold">{rec.type}</h4>
                          <p className="text-sm text-muted-foreground">
                            {rec.capacity} {rec.unit} • {rec.efficiency}
                          </p>
                        </div>
                        <Badge variant={index === 0 ? 'default' : 'secondary'}>
                          {index === 0 ? 'Recommended' : 'Alternative'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4">
                        <div>
                          <div className="text-xs text-muted-foreground">Estimated Cost</div>
                          <div className="text-lg font-bold">
                            ${rec.estimatedCost.toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <ul className="space-y-1">
                        {rec.notes.map((note, i) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                            <span>{note}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Important Notes */}
              <Card className="border-yellow-200 bg-yellow-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-yellow-900">
                    <Info className="h-5 w-5" />
                    Important Notes
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2 text-yellow-900">
                  <p>• This is a simplified load calculation. A detailed Manual J by a certified professional is recommended.</p>
                  <p>• Actual equipment sizing should account for local codes, ductwork design, and specific building conditions.</p>
                  <p>• Consider oversizing equipment by 15-25% for extreme weather conditions.</p>
                  <p>• Proper installation and ductwork are as important as equipment sizing.</p>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
