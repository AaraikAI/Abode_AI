'use client'

/**
 * Optimization Suggestions Component
 *
 * AI-powered recommendations for energy efficiency improvements
 * with cost-benefit analysis and implementation guidance
 */

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Lightbulb,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle2,
  Star,
  Zap,
  ThermometerSun,
  Wind,
  Droplets,
  Sun,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Download,
  RefreshCw
} from 'lucide-react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts'

interface OptimizationSuggestion {
  id: string
  category: 'hvac' | 'lighting' | 'envelope' | 'renewables' | 'controls' | 'water'
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  difficulty: 'easy' | 'moderate' | 'complex'
  energySavings: number // kWh/year
  costSavings: number // $/year
  implementationCost: number
  paybackPeriod: number // years
  carbonReduction: number // kg CO2/year
  roi: number // % over 10 years
  impact: number // 0-100 score
  steps: string[]
  resources: Array<{
    type: 'guide' | 'video' | 'calculator' | 'vendor'
    title: string
    url: string
  }>
  aiConfidence: number // 0-100
}

interface BuildingData {
  type: string
  area: number
  age: number
  currentEUI: number
  targetEUI: number
}

interface OptimizationSuggestionsProps {
  buildingData: BuildingData
  onImplement?: (suggestionId: string) => void
  onDismiss?: (suggestionId: string) => void
  onRefresh?: () => void
  onExport?: () => void
}

export function OptimizationSuggestions({
  buildingData,
  onImplement,
  onDismiss,
  onRefresh,
  onExport
}: OptimizationSuggestionsProps) {
  const [suggestions] = useState<OptimizationSuggestion[]>([
    {
      id: '1',
      category: 'hvac',
      title: 'Upgrade to High-Efficiency Heat Pump',
      description: 'Replace aging HVAC system with modern air-source heat pump rated SEER 18/HSPF 10. AI analysis shows current system is 15+ years old and operating at 60% efficiency.',
      priority: 'high',
      difficulty: 'complex',
      energySavings: 8500,
      costSavings: 1105,
      implementationCost: 12000,
      paybackPeriod: 10.9,
      carbonReduction: 7820,
      roi: 92,
      impact: 92,
      steps: [
        'Get 3 quotes from certified HVAC contractors',
        'Apply for federal tax credit (30% of cost)',
        'Check utility rebate programs',
        'Schedule installation during shoulder season',
        'Ensure proper ductwork sealing before installation'
      ],
      resources: [
        { type: 'guide', title: 'Heat Pump Buyer\'s Guide', url: '#' },
        { type: 'calculator', title: 'Heat Pump Sizing Calculator', url: '#' },
        { type: 'vendor', title: 'Find Certified Installers', url: '#' }
      ],
      aiConfidence: 95
    },
    {
      id: '2',
      category: 'lighting',
      title: 'Complete LED Retrofit with Smart Controls',
      description: 'Replace all fluorescent and incandescent fixtures with LED lighting. Add occupancy sensors in low-traffic areas and daylight harvesting in perimeter zones.',
      priority: 'high',
      difficulty: 'easy',
      energySavings: 4200,
      costSavings: 546,
      implementationCost: 3500,
      paybackPeriod: 6.4,
      carbonReduction: 3864,
      roi: 156,
      impact: 78,
      steps: [
        'Audit current lighting inventory',
        'Purchase LED replacements (bulk discount available)',
        'Install occupancy sensors in restrooms, storage, conference rooms',
        'Program dimming schedules',
        'Train staff on new controls'
      ],
      resources: [
        { type: 'guide', title: 'LED Retrofit Planning Guide', url: '#' },
        { type: 'calculator', title: 'Lighting ROI Calculator', url: '#' },
        { type: 'vendor', title: 'LED Suppliers', url: '#' }
      ],
      aiConfidence: 98
    },
    {
      id: '3',
      category: 'envelope',
      title: 'Air Sealing and Attic Insulation Upgrade',
      description: 'Comprehensive air sealing followed by attic insulation upgrade from R-30 to R-49. Thermal imaging shows significant heat loss through ceiling plane.',
      priority: 'high',
      difficulty: 'moderate',
      energySavings: 3800,
      costSavings: 494,
      implementationCost: 4200,
      paybackPeriod: 8.5,
      carbonReduction: 3496,
      roi: 118,
      impact: 85,
      steps: [
        'Schedule blower door test to identify air leaks',
        'Seal attic bypasses and penetrations',
        'Add baffles to maintain ventilation',
        'Blow in cellulose or fiberglass to R-49',
        'Verify with post-retrofit blower door test'
      ],
      resources: [
        { type: 'guide', title: 'Air Sealing Best Practices', url: '#' },
        { type: 'video', title: 'DIY Attic Insulation', url: '#' },
        { type: 'vendor', title: 'Find Insulation Contractors', url: '#' }
      ],
      aiConfidence: 92
    },
    {
      id: '4',
      category: 'renewables',
      title: 'Rooftop Solar PV System (8.5 kW)',
      description: 'Install 8.5 kW solar array on south-facing roof. System will offset 65% of annual electricity consumption. Excellent solar access with minimal shading.',
      priority: 'medium',
      difficulty: 'complex',
      energySavings: 10200,
      costSavings: 1326,
      implementationCost: 17850,
      paybackPeriod: 13.5,
      carbonReduction: 9384,
      roi: 148,
      impact: 95,
      steps: [
        'Get solar site assessment',
        'Obtain 3 quotes from certified installers',
        'Apply for 30% federal tax credit',
        'Check net metering policy',
        'Coordinate HOA approval if applicable',
        'Schedule installation and inspection'
      ],
      resources: [
        { type: 'guide', title: 'Solar Installation Guide', url: '#' },
        { type: 'calculator', title: 'Solar ROI Calculator', url: '#' },
        { type: 'vendor', title: 'Find Solar Installers', url: '#' }
      ],
      aiConfidence: 88
    },
    {
      id: '5',
      category: 'controls',
      title: 'Install Smart Thermostat with Scheduling',
      description: 'Replace manual thermostat with Wi-Fi enabled smart thermostat. Enable setback schedules, geofencing, and remote access for optimal comfort and efficiency.',
      priority: 'high',
      difficulty: 'easy',
      energySavings: 1800,
      costSavings: 234,
      implementationCost: 250,
      paybackPeriod: 1.1,
      carbonReduction: 1656,
      roi: 936,
      impact: 65,
      steps: [
        'Purchase compatible smart thermostat',
        'Turn off power at breaker',
        'Label and photograph existing wiring',
        'Install new thermostat following instructions',
        'Configure schedules and preferences in app'
      ],
      resources: [
        { type: 'guide', title: 'Smart Thermostat Setup', url: '#' },
        { type: 'video', title: 'Installation Tutorial', url: '#' },
        { type: 'calculator', title: 'Thermostat Savings Calculator', url: '#' }
      ],
      aiConfidence: 96
    },
    {
      id: '6',
      category: 'water',
      title: 'Heat Pump Water Heater Upgrade',
      description: 'Replace electric resistance water heater with heat pump water heater (HPWH). 3x more efficient than conventional electric water heaters.',
      priority: 'medium',
      difficulty: 'moderate',
      energySavings: 2400,
      costSavings: 312,
      implementationCost: 2200,
      paybackPeriod: 7.1,
      carbonReduction: 2208,
      roi: 142,
      impact: 72,
      steps: [
        'Verify adequate space (1000 cu ft air volume)',
        'Check local rebates (often $500-$1000)',
        'Purchase ENERGY STAR certified HPWH',
        'Hire licensed plumber for installation',
        'Set to "efficiency" or "heat pump" mode'
      ],
      resources: [
        { type: 'guide', title: 'HPWH Buyer\'s Guide', url: '#' },
        { type: 'calculator', title: 'Water Heater Comparison Tool', url: '#' },
        { type: 'vendor', title: 'Find HPWH Models', url: '#' }
      ],
      aiConfidence: 90
    }
  ])

  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'impact' | 'payback' | 'savings'>('impact')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  // Category icons
  const categoryIcons = {
    hvac: ThermometerSun,
    lighting: Lightbulb,
    envelope: Wind,
    renewables: Sun,
    controls: Zap,
    water: Droplets
  }

  // Filter and sort suggestions
  const filteredSuggestions = suggestions
    .filter(s => selectedCategory === 'all' || s.category === selectedCategory)
    .sort((a, b) => {
      if (sortBy === 'impact') return b.impact - a.impact
      if (sortBy === 'payback') return a.paybackPeriod - b.paybackPeriod
      if (sortBy === 'savings') return b.costSavings - a.costSavings
      return 0
    })

  // Calculate totals
  const totals = suggestions.reduce(
    (acc, s) => ({
      energySavings: acc.energySavings + s.energySavings,
      costSavings: acc.costSavings + s.costSavings,
      implementationCost: acc.implementationCost + s.implementationCost,
      carbonReduction: acc.carbonReduction + s.carbonReduction
    }),
    { energySavings: 0, costSavings: 0, implementationCost: 0, carbonReduction: 0 }
  )

  // Toggle expanded
  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedIds)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedIds(newExpanded)
  }

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive'
      case 'medium':
        return 'default'
      case 'low':
        return 'secondary'
      default:
        return 'default'
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Energy Optimization</h2>
          <p className="text-muted-foreground">AI-powered recommendations for your building</p>
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

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Potential Savings</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totals.costSavings)}</div>
            <p className="text-xs text-muted-foreground">Per year</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Energy Reduction</CardTitle>
            <Zap className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.energySavings.toLocaleString()} kWh</div>
            <p className="text-xs text-muted-foreground">
              {((totals.energySavings / (buildingData.currentEUI * buildingData.area)) * 100).toFixed(0)}% reduction
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Implementation Cost</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totals.implementationCost)}</div>
            <p className="text-xs text-muted-foreground">
              Avg payback: {(totals.implementationCost / totals.costSavings).toFixed(1)} years
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Carbon Reduction</CardTitle>
            <Wind className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(totals.carbonReduction / 1000).toFixed(1)} tons</div>
            <p className="text-xs text-muted-foreground">CO₂ per year</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Sorting */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recommendations</CardTitle>
              <CardDescription>{filteredSuggestions.length} optimization opportunities identified</CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="hvac">HVAC</SelectItem>
                  <SelectItem value="lighting">Lighting</SelectItem>
                  <SelectItem value="envelope">Envelope</SelectItem>
                  <SelectItem value="renewables">Renewables</SelectItem>
                  <SelectItem value="controls">Controls</SelectItem>
                  <SelectItem value="water">Water</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="impact">Impact Score</SelectItem>
                  <SelectItem value="payback">Payback Period</SelectItem>
                  <SelectItem value="savings">Cost Savings</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {filteredSuggestions.map((suggestion) => {
            const Icon = categoryIcons[suggestion.category]
            const isExpanded = expandedIds.has(suggestion.id)

            return (
              <div key={suggestion.id} className="border rounded-lg overflow-hidden">
                {/* Header */}
                <div className="p-4 bg-muted/50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="p-2 bg-background rounded-lg">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{suggestion.title}</h3>
                          <Badge variant={getPriorityColor(suggestion.priority)}>
                            {suggestion.priority}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {suggestion.difficulty}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <div className="text-right mr-4">
                        <div className="text-sm font-medium text-green-600">
                          {formatCurrency(suggestion.costSavings)}/yr
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {suggestion.paybackPeriod.toFixed(1)} yr payback
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpanded(suggestion.id)}
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Metrics Bar */}
                  <div className="grid grid-cols-4 gap-4 mt-4">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Impact Score</div>
                      <div className="flex items-center gap-2">
                        <Progress value={suggestion.impact} className="h-2 flex-1" />
                        <span className="text-sm font-medium">{suggestion.impact}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Energy Savings</div>
                      <div className="text-sm font-medium">
                        {suggestion.energySavings.toLocaleString()} kWh
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Carbon Reduction</div>
                      <div className="text-sm font-medium">
                        {(suggestion.carbonReduction / 1000).toFixed(1)} tons CO₂
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">10-Year ROI</div>
                      <div className="text-sm font-medium text-green-600">
                        {suggestion.roi}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-4 border-t space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      {/* Implementation Steps */}
                      <div>
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4" />
                          Implementation Steps
                        </h4>
                        <ol className="space-y-2">
                          {suggestion.steps.map((step, i) => (
                            <li key={i} className="text-sm flex gap-2">
                              <span className="font-medium text-muted-foreground">{i + 1}.</span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>

                      {/* Resources */}
                      <div>
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <Star className="h-4 w-4" />
                          Helpful Resources
                        </h4>
                        <div className="space-y-2">
                          {suggestion.resources.map((resource, i) => (
                            <a
                              key={i}
                              href={resource.url}
                              className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                            >
                              <span className="text-xs px-2 py-1 bg-blue-50 rounded">
                                {resource.type}
                              </span>
                              {resource.title}
                            </a>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Cost Breakdown */}
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Implementation:</span>
                          <span className="font-medium ml-2">
                            {formatCurrency(suggestion.implementationCost)}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Annual Savings:</span>
                          <span className="font-medium ml-2 text-green-600">
                            {formatCurrency(suggestion.costSavings)}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">AI Confidence:</span>
                          <span className="font-medium ml-2">
                            {suggestion.aiConfidence}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2">
                      <Button onClick={() => onImplement?.(suggestion.id)}>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Mark as Planned
                      </Button>
                      <Button variant="outline" onClick={() => onDismiss?.(suggestion.id)}>
                        Dismiss
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Implementation Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Recommended Implementation Timeline</CardTitle>
          <CardDescription>Prioritized based on ROI and impact</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {suggestions
              .filter(s => s.priority === 'high' && s.paybackPeriod < 5)
              .map((suggestion, index) => (
                <div key={suggestion.id} className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{suggestion.title}</div>
                    <div className="text-sm text-muted-foreground">
                      Quick win: {suggestion.paybackPeriod.toFixed(1)} year payback
                    </div>
                  </div>
                  <Badge className="bg-green-500">
                    <Clock className="h-3 w-3 mr-1" />
                    Start Now
                  </Badge>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
