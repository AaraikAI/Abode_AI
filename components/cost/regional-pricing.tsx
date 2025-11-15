'use client'

/**
 * Regional Pricing Component
 *
 * Location-based pricing adjustments and regional cost factors
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Slider } from '@/components/ui/slider'
import { useToast } from '@/components/ui/use-toast'
import {
  MapPin,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calculator,
  RefreshCw,
  CheckCircle2
} from 'lucide-react'

export interface RegionalFactors {
  location: {
    city: string
    state: string
    zipCode?: string
    country: string
  }
  costIndex: number
  factors: {
    labor: number
    materials: number
    equipment: number
    overhead: number
  }
  adjustments: {
    category: string
    multiplier: number
    reason: string
  }[]
  marketConditions: {
    demand: 'low' | 'medium' | 'high'
    competition: 'low' | 'medium' | 'high'
    seasonality: number
  }
}

interface RegionalPricingProps {
  projectId: string
  baseCost?: number
  currentLocation?: RegionalFactors['location']
  onLocationChange?: (factors: RegionalFactors) => void
}

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
]

const MAJOR_CITIES: Record<string, { state: string; index: number }> = {
  'New York': { state: 'NY', index: 1.35 },
  'San Francisco': { state: 'CA', index: 1.42 },
  'Los Angeles': { state: 'CA', index: 1.28 },
  'Boston': { state: 'MA', index: 1.31 },
  'Seattle': { state: 'WA', index: 1.25 },
  'Chicago': { state: 'IL', index: 1.18 },
  'Miami': { state: 'FL', index: 1.12 },
  'Houston': { state: 'TX', index: 0.98 },
  'Dallas': { state: 'TX', index: 0.95 },
  'Phoenix': { state: 'AZ', index: 0.92 },
  'Atlanta': { state: 'GA', index: 0.94 },
  'Denver': { state: 'CO', index: 1.08 }
}

export function RegionalPricing({
  projectId,
  baseCost = 0,
  currentLocation,
  onLocationChange
}: RegionalPricingProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const [location, setLocation] = useState({
    city: currentLocation?.city || '',
    state: currentLocation?.state || '',
    zipCode: currentLocation?.zipCode || '',
    country: currentLocation?.country || 'United States'
  })

  const [costIndex, setCostIndex] = useState(1.0)
  const [factors, setFactors] = useState({
    labor: 1.0,
    materials: 1.0,
    equipment: 1.0,
    overhead: 1.0
  })

  const [customAdjustments, setCustomAdjustments] = useState<RegionalFactors['adjustments']>([])

  /**
   * Fetch regional data
   */
  const fetchRegionalData = async () => {
    if (!location.city || !location.state) {
      toast({
        title: 'Missing Information',
        description: 'Please enter city and state',
        variant: 'destructive'
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/cost/regional-factors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch regional data')
      }

      setCostIndex(data.costIndex)
      setFactors(data.factors)
      setCustomAdjustments(data.adjustments || [])

      const regionalFactors: RegionalFactors = {
        location,
        costIndex: data.costIndex,
        factors: data.factors,
        adjustments: data.adjustments || [],
        marketConditions: data.marketConditions
      }

      onLocationChange?.(regionalFactors)

      toast({
        title: 'Regional Data Loaded',
        description: `Cost index: ${(data.costIndex * 100).toFixed(0)}% of national average`
      })
    } catch (error: any) {
      // Use local estimation if API fails
      const cityData = MAJOR_CITIES[location.city]
      if (cityData) {
        const estimatedIndex = cityData.index
        setCostIndex(estimatedIndex)
        setFactors({
          labor: estimatedIndex,
          materials: estimatedIndex * 0.95,
          equipment: estimatedIndex * 0.98,
          overhead: estimatedIndex
        })

        toast({
          title: 'Using Estimated Data',
          description: `Estimated cost index: ${(estimatedIndex * 100).toFixed(0)}%`
        })
      } else {
        toast({
          title: 'Data Fetch Failed',
          description: error.message,
          variant: 'destructive'
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Quick select major city
   */
  const selectCity = (cityName: string) => {
    const cityData = MAJOR_CITIES[cityName]
    if (cityData) {
      setLocation({
        ...location,
        city: cityName,
        state: cityData.state
      })
      setCostIndex(cityData.index)
      setFactors({
        labor: cityData.index,
        materials: cityData.index * 0.95,
        equipment: cityData.index * 0.98,
        overhead: cityData.index
      })
    }
  }

  /**
   * Calculate adjusted costs
   */
  const calculateAdjustedCost = (category: keyof typeof factors): number => {
    const categoryMultiplier = factors[category]
    const baseAmount = baseCost * 0.25 // Assume even split for demo

    // Apply custom adjustments
    let adjustment = 1.0
    customAdjustments.forEach(adj => {
      if (adj.category === category) {
        adjustment *= adj.multiplier
      }
    })

    return baseAmount * categoryMultiplier * adjustment
  }

  /**
   * Calculate total adjusted cost
   */
  const calculateTotalAdjusted = (): number => {
    return Object.keys(factors).reduce((sum, cat) => {
      return sum + calculateAdjustedCost(cat as keyof typeof factors)
    }, 0)
  }

  /**
   * Add custom adjustment
   */
  const addCustomAdjustment = () => {
    setCustomAdjustments([
      ...customAdjustments,
      {
        category: 'labor',
        multiplier: 1.0,
        reason: ''
      }
    ])
  }

  /**
   * Update custom adjustment
   */
  const updateAdjustment = (index: number, updates: Partial<RegionalFactors['adjustments'][0]>) => {
    const updated = [...customAdjustments]
    updated[index] = { ...updated[index], ...updates }
    setCustomAdjustments(updated)
  }

  /**
   * Remove custom adjustment
   */
  const removeAdjustment = (index: number) => {
    setCustomAdjustments(customAdjustments.filter((_, i) => i !== index))
  }

  const totalAdjusted = calculateTotalAdjusted()
  const difference = totalAdjusted - baseCost
  const percentDifference = baseCost > 0 ? (difference / baseCost) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Regional Pricing
          </CardTitle>
          <CardDescription>
            Location-based cost adjustments and regional factors
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Location Input */}
      <Card>
        <CardHeader>
          <CardTitle>Project Location</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                value={location.city}
                onChange={(e) => setLocation({ ...location, city: e.target.value })}
                placeholder="Enter city"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State *</Label>
              <Select value={location.state} onValueChange={(value) => setLocation({ ...location, state: value })}>
                <SelectTrigger id="state">
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {US_STATES.map(state => (
                    <SelectItem key={state} value={state}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="zip">ZIP Code</Label>
              <Input
                id="zip"
                value={location.zipCode}
                onChange={(e) => setLocation({ ...location, zipCode: e.target.value })}
                placeholder="12345"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={fetchRegionalData} disabled={isLoading}>
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Calculator className="h-4 w-4 mr-2" />
                  Get Regional Factors
                </>
              )}
            </Button>
          </div>

          {/* Quick Select Cities */}
          <div>
            <Label className="mb-2 block">Quick Select Major City</Label>
            <div className="flex flex-wrap gap-2">
              {Object.keys(MAJOR_CITIES).map(city => (
                <Button
                  key={city}
                  variant="outline"
                  size="sm"
                  onClick={() => selectCity(city)}
                >
                  {city}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cost Index */}
      <Card>
        <CardHeader>
          <CardTitle>Regional Cost Index</CardTitle>
          <CardDescription>
            Compared to national average (1.00)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-4xl font-bold">
                {(costIndex * 100).toFixed(0)}%
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {costIndex > 1.0 ? (
                  <span className="flex items-center gap-1 text-orange-600">
                    <TrendingUp className="h-4 w-4" />
                    {((costIndex - 1) * 100).toFixed(1)}% above average
                  </span>
                ) : costIndex < 1.0 ? (
                  <span className="flex items-center gap-1 text-green-600">
                    <TrendingDown className="h-4 w-4" />
                    {((1 - costIndex) * 100).toFixed(1)}% below average
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" />
                    At national average
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <MapPin className="h-12 w-12 text-muted-foreground" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Factors */}
      <Card>
        <CardHeader>
          <CardTitle>Cost Factors by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {Object.entries(factors).map(([category, multiplier]) => (
              <div key={category} className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="capitalize">{category}</Label>
                  <Badge variant={multiplier > 1.1 ? 'destructive' : multiplier < 0.9 ? 'default' : 'secondary'}>
                    {(multiplier * 100).toFixed(0)}%
                  </Badge>
                </div>
                <Slider
                  min={0.5}
                  max={1.5}
                  step={0.05}
                  value={[multiplier]}
                  onValueChange={([value]) => setFactors({ ...factors, [category]: value })}
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Base: ${(baseCost * 0.25).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  <span>Adjusted: ${calculateAdjustedCost(category as keyof typeof factors).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Custom Adjustments */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Custom Adjustments</CardTitle>
              <CardDescription>
                Add manual adjustments for specific conditions
              </CardDescription>
            </div>
            <Button onClick={addCustomAdjustment} variant="outline">
              Add Adjustment
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {customAdjustments.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-8">
              No custom adjustments added
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Multiplier</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customAdjustments.map((adj, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Select
                          value={adj.category}
                          onValueChange={(value) => updateAdjustment(index, { category: value })}
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="labor">Labor</SelectItem>
                            <SelectItem value="materials">Materials</SelectItem>
                            <SelectItem value="equipment">Equipment</SelectItem>
                            <SelectItem value="overhead">Overhead</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={adj.multiplier}
                          onChange={(e) => updateAdjustment(index, { multiplier: parseFloat(e.target.value) || 1.0 })}
                          className="w-[100px]"
                          step={0.05}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={adj.reason}
                          onChange={(e) => updateAdjustment(index, { reason: e.target.value })}
                          placeholder="Reason for adjustment"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAdjustment(index)}
                        >
                          ×
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Cost Impact Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Base Cost</span>
              <span className="text-xl font-bold">
                ${baseCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Regional Adjustment</span>
              <span className={`text-xl font-bold ${difference >= 0 ? 'text-orange-600' : 'text-green-600'}`}>
                {difference >= 0 ? '+' : ''}${difference.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="font-bold">Adjusted Total</span>
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    ${totalAdjusted.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <Badge variant={percentDifference > 10 ? 'destructive' : percentDifference < -10 ? 'default' : 'secondary'}>
                    {percentDifference >= 0 ? '+' : ''}{percentDifference.toFixed(1)}%
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
