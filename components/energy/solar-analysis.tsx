'use client'

/**
 * Solar Analysis Component
 *
 * Analyzes solar potential including panel placement, orientation,
 * shading analysis, and ROI calculations
 */

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sun,
  Zap,
  DollarSign,
  TrendingUp,
  CloudSun,
  Compass,
  Calculator,
  Download,
  AlertCircle,
  CheckCircle2,
  Leaf
} from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
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
  ResponsiveContainer
} from 'recharts'

interface SolarParameters {
  roofArea: number
  roofPitch: number
  azimuth: number
  latitude: number
  longitude: number
  shadingFactor: number
  annualConsumption: number
  electricityRate: number
  panelEfficiency: number
  systemSize: number
}

interface SolarProduction {
  monthly: Array<{
    month: string
    production: number
    consumption: number
    netEnergy: number
    savings: number
  }>
  annual: {
    production: number
    consumption: number
    offset: number
    savings: number
    carbonOffset: number
  }
}

interface FinancialAnalysis {
  systemCost: number
  incentives: number
  netCost: number
  annualSavings: number
  paybackPeriod: number
  roi25Year: number
  yearlyBreakdown: Array<{
    year: number
    savings: number
    cumulative: number
  }>
}

interface SolarAnalysisProps {
  buildingName?: string
  location?: { lat: number; lng: number }
  defaultParameters?: Partial<SolarParameters>
  onAnalyze?: (production: SolarProduction, financial: FinancialAnalysis) => void
  onExport?: () => void
}

export function SolarAnalysis({
  buildingName = 'Building',
  location,
  defaultParameters,
  onAnalyze,
  onExport
}: SolarAnalysisProps) {
  const [parameters, setParameters] = useState<SolarParameters>({
    roofArea: defaultParameters?.roofArea || 1500,
    roofPitch: defaultParameters?.roofPitch || 30,
    azimuth: defaultParameters?.azimuth || 180, // South-facing
    latitude: location?.lat || defaultParameters?.latitude || 40,
    longitude: location?.lng || defaultParameters?.longitude || -75,
    shadingFactor: defaultParameters?.shadingFactor || 85,
    annualConsumption: defaultParameters?.annualConsumption || 12000,
    electricityRate: defaultParameters?.electricityRate || 0.13,
    panelEfficiency: defaultParameters?.panelEfficiency || 20,
    systemSize: defaultParameters?.systemSize || 8
  })

  const [analyzed, setAnalyzed] = useState(false)
  const [production, setProduction] = useState<SolarProduction | null>(null)
  const [financial, setFinancial] = useState<FinancialAnalysis | null>(null)

  // Update parameter
  const updateParameter = (key: keyof SolarParameters, value: number) => {
    setParameters(prev => ({
      ...prev,
      [key]: value
    }))
    setAnalyzed(false)
  }

  // Calculate solar production
  const analyzeSolar = () => {
    const {
      systemSize,
      latitude,
      azimuth,
      roofPitch,
      shadingFactor,
      annualConsumption,
      electricityRate
    } = parameters

    // Monthly solar radiation multipliers (simplified for demo)
    const monthlyRadiation = [0.6, 0.7, 0.85, 0.95, 1.0, 1.0, 0.98, 0.92, 0.85, 0.75, 0.6, 0.55]
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

    // Calculate optimal orientation factor
    const optimalAzimuth = 180 // South-facing is optimal in Northern Hemisphere
    const azimuthDeviation = Math.abs(azimuth - optimalAzimuth)
    const orientationFactor = Math.cos((azimuthDeviation * Math.PI) / 180)

    // Calculate optimal pitch factor
    const optimalPitch = latitude // Rule of thumb: pitch ≈ latitude
    const pitchDeviation = Math.abs(roofPitch - optimalPitch)
    const pitchFactor = 1 - (pitchDeviation / 100)

    // Base annual production (kWh per kW of system)
    const baseProduction = 1200 // Average for US
    const annualProduction =
      systemSize *
      baseProduction *
      orientationFactor *
      pitchFactor *
      (shadingFactor / 100)

    // Calculate monthly production
    const monthlyProduction = monthlyRadiation.map((radiation, index) => {
      const monthProduction = (annualProduction / 12) * radiation
      const monthConsumption = annualConsumption / 12
      const netEnergy = monthProduction - monthConsumption
      const savings = monthProduction * electricityRate

      return {
        month: months[index],
        production: Math.round(monthProduction),
        consumption: Math.round(monthConsumption),
        netEnergy: Math.round(netEnergy),
        savings: Math.round(savings)
      }
    })

    const totalProduction = monthlyProduction.reduce((sum, m) => sum + m.production, 0)
    const totalSavings = monthlyProduction.reduce((sum, m) => sum + m.savings, 0)
    const offsetPercentage = (totalProduction / annualConsumption) * 100
    const carbonOffset = (totalProduction * 0.92) / 2000 // lbs CO2 to tons

    const productionResults: SolarProduction = {
      monthly: monthlyProduction,
      annual: {
        production: totalProduction,
        consumption: annualConsumption,
        offset: offsetPercentage,
        savings: totalSavings,
        carbonOffset
      }
    }

    // Calculate financial analysis
    const systemCostPerWatt = 3.0
    const systemCost = systemSize * 1000 * systemCostPerWatt
    const federalTaxCredit = systemCost * 0.30 // 30% ITC
    const stateIncentives = systemSize * 500 // $500/kW state incentive (varies)
    const totalIncentives = federalTaxCredit + stateIncentives
    const netCost = systemCost - totalIncentives
    const annualSavings = totalSavings
    const paybackPeriod = netCost / annualSavings

    // 25-year projection
    const yearlyBreakdown = Array.from({ length: 25 }, (_, i) => {
      const year = i + 1
      const degradationFactor = Math.pow(0.995, year) // 0.5% annual degradation
      const yearSavings = annualSavings * degradationFactor
      const cumulative = yearlyBreakdown[i - 1]
        ? yearlyBreakdown[i - 1].cumulative + yearSavings
        : yearSavings

      return {
        year,
        savings: Math.round(yearSavings),
        cumulative: Math.round(cumulative)
      }
    })

    const roi25Year = ((yearlyBreakdown[24].cumulative - netCost) / netCost) * 100

    const financialResults: FinancialAnalysis = {
      systemCost,
      incentives: totalIncentives,
      netCost,
      annualSavings,
      paybackPeriod,
      roi25Year,
      yearlyBreakdown: yearlyBreakdown.slice(0, 10) // First 10 years for chart
    }

    setProduction(productionResults)
    setFinancial(financialResults)
    setAnalyzed(true)

    onAnalyze?.(productionResults, financialResults)
  }

  // Get orientation label
  const getOrientationLabel = (azimuth: number) => {
    if (azimuth >= 0 && azimuth < 45) return 'North'
    if (azimuth >= 45 && azimuth < 135) return 'East'
    if (azimuth >= 135 && azimuth < 225) return 'South'
    if (azimuth >= 225 && azimuth < 315) return 'West'
    return 'North'
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

  // Format energy
  const formatEnergy = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value) + ' kWh'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Solar Analysis</h2>
          <p className="text-muted-foreground">{buildingName} - Solar Panel Assessment</p>
        </div>
        {analyzed && (
          <Button variant="outline" onClick={onExport}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Input Parameters */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>System Parameters</CardTitle>
            <CardDescription>Configure solar installation details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>System Size: {parameters.systemSize} kW</Label>
              <Slider
                value={[parameters.systemSize]}
                onValueChange={([v]) => updateParameter('systemSize', v)}
                min={2}
                max={20}
                step={0.5}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="roofArea">Usable Roof Area (sq ft)</Label>
              <Input
                id="roofArea"
                type="number"
                value={parameters.roofArea}
                onChange={(e) => updateParameter('roofArea', Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label>Roof Pitch: {parameters.roofPitch}°</Label>
              <Slider
                value={[parameters.roofPitch]}
                onValueChange={([v]) => updateParameter('roofPitch', v)}
                min={0}
                max={60}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <Label>
                Azimuth: {parameters.azimuth}° ({getOrientationLabel(parameters.azimuth)})
              </Label>
              <Slider
                value={[parameters.azimuth]}
                onValueChange={([v]) => updateParameter('azimuth', v)}
                min={0}
                max={360}
                step={1}
              />
              <p className="text-xs text-muted-foreground">0° = North, 180° = South (optimal)</p>
            </div>

            <div className="space-y-2">
              <Label>Shading Factor: {parameters.shadingFactor}%</Label>
              <Slider
                value={[parameters.shadingFactor]}
                onValueChange={([v]) => updateParameter('shadingFactor', v)}
                min={0}
                max={100}
                step={5}
              />
              <p className="text-xs text-muted-foreground">
                100% = no shading, 0% = fully shaded
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="consumption">Annual Consumption (kWh)</Label>
              <Input
                id="consumption"
                type="number"
                value={parameters.annualConsumption}
                onChange={(e) => updateParameter('annualConsumption', Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rate">Electricity Rate ($/kWh)</Label>
              <Input
                id="rate"
                type="number"
                step="0.01"
                value={parameters.electricityRate}
                onChange={(e) => updateParameter('electricityRate', Number(e.target.value))}
              />
            </div>

            <Button className="w-full" onClick={analyzeSolar}>
              <Calculator className="h-4 w-4 mr-2" />
              Analyze Solar Potential
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="lg:col-span-2 space-y-6">
          {!analyzed ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Sun className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  Configure system parameters and click Analyze to see solar potential
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Key Metrics */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Annual Production</CardTitle>
                    <Sun className="h-4 w-4 text-yellow-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatEnergy(production!.annual.production)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {production!.annual.offset.toFixed(0)}% of consumption
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Annual Savings</CardTitle>
                    <DollarSign className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(production!.annual.savings)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      First year estimate
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Payback Period</CardTitle>
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {financial!.paybackPeriod.toFixed(1)} years
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      After incentives
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Carbon Offset</CardTitle>
                    <Leaf className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {production!.annual.carbonOffset.toFixed(1)} tons
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      CO₂ per year
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Tabs defaultValue="production">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="production">Production</TabsTrigger>
                  <TabsTrigger value="financial">Financial</TabsTrigger>
                  <TabsTrigger value="orientation">Orientation</TabsTrigger>
                </TabsList>

                {/* Production Tab */}
                <TabsContent value="production" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Monthly Energy Production</CardTitle>
                      <CardDescription>Solar generation vs consumption</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={production!.monthly}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="production" fill="#f59e0b" name="Solar Production" />
                          <Bar dataKey="consumption" fill="#6366f1" name="Consumption" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Net Energy & Savings</CardTitle>
                      <CardDescription>Monthly surplus/deficit and savings</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={production!.monthly}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis yAxisId="left" />
                          <YAxis yAxisId="right" orientation="right" />
                          <Tooltip />
                          <Legend />
                          <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="netEnergy"
                            stroke="#10b981"
                            strokeWidth={2}
                            name="Net Energy (kWh)"
                          />
                          <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="savings"
                            stroke="#8b5cf6"
                            strokeWidth={2}
                            name="Savings ($)"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Financial Tab */}
                <TabsContent value="financial" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">System Cost</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {formatCurrency(financial!.systemCost)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Before incentives
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Incentives</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                          -{formatCurrency(financial!.incentives)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Federal + State
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Net Cost</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {formatCurrency(financial!.netCost)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          After incentives
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>25-Year Financial Projection</CardTitle>
                      <CardDescription>Cumulative savings over system lifetime</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={financial!.yearlyBreakdown}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="year" />
                          <YAxis />
                          <Tooltip formatter={(value: number) => formatCurrency(value)} />
                          <Legend />
                          <Area
                            type="monotone"
                            dataKey="cumulative"
                            stroke="#10b981"
                            fill="#10b981"
                            fillOpacity={0.3}
                            name="Cumulative Savings"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                      <div className="mt-4 p-4 bg-green-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">25-Year ROI</span>
                          <span className="text-2xl font-bold text-green-600">
                            {financial!.roi25Year.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Orientation Tab */}
                <TabsContent value="orientation" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>System Orientation</CardTitle>
                      <CardDescription>Current configuration and optimization</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="p-4 border rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Compass className="h-5 w-5 text-blue-500" />
                            <span className="font-medium">Azimuth</span>
                          </div>
                          <div className="text-3xl font-bold">{parameters.azimuth}°</div>
                          <p className="text-sm text-muted-foreground">
                            {getOrientationLabel(parameters.azimuth)}-facing
                          </p>
                          {parameters.azimuth === 180 ? (
                            <Badge className="mt-2 bg-green-500">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Optimal
                            </Badge>
                          ) : (
                            <Badge className="mt-2" variant="secondary">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              {Math.abs(parameters.azimuth - 180).toFixed(0)}° from optimal
                            </Badge>
                          )}
                        </div>

                        <div className="p-4 border rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <CloudSun className="h-5 w-5 text-orange-500" />
                            <span className="font-medium">Tilt Angle</span>
                          </div>
                          <div className="text-3xl font-bold">{parameters.roofPitch}°</div>
                          <p className="text-sm text-muted-foreground">
                            Optimal: ~{parameters.latitude.toFixed(0)}°
                          </p>
                          {Math.abs(parameters.roofPitch - parameters.latitude) < 5 ? (
                            <Badge className="mt-2 bg-green-500">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Optimal
                            </Badge>
                          ) : (
                            <Badge className="mt-2" variant="secondary">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              {Math.abs(parameters.roofPitch - parameters.latitude).toFixed(0)}° from optimal
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-blue-600" />
                          Optimization Tips
                        </h4>
                        <ul className="space-y-1 text-sm">
                          <li>• South-facing (180°) orientation provides maximum annual production</li>
                          <li>• Tilt angle equal to latitude optimizes year-round performance</li>
                          <li>• Minimize shading from trees, buildings, and obstructions</li>
                          <li>• East-west orientations can work with tracking systems</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
