'use client'

/**
 * Estimate Summary Component
 *
 * Summary card showing total costs, subtotals, taxes, and profit margin
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/use-toast'
import {
  DollarSign,
  TrendingUp,
  FileText,
  AlertCircle,
  CheckCircle2,
  Settings
} from 'lucide-react'

export interface CostBreakdown {
  materials: number
  labor: number
  equipment: number
  subcontractors: number
  permits: number
  overhead: number
  contingency: number
}

export interface EstimateSummaryData {
  projectId: string
  projectName: string
  costs: CostBreakdown
  taxRate?: number
  profitMargin?: number
  bondRate?: number
  insuranceRate?: number
  includeTax?: boolean
  includeProfit?: boolean
  includeBond?: boolean
  includeInsurance?: boolean
}

interface EstimateSummaryProps {
  data: EstimateSummaryData
  onDataChange?: (data: EstimateSummaryData) => void
  editable?: boolean
  variant?: 'detailed' | 'compact'
}

export function EstimateSummary({
  data,
  onDataChange,
  editable = false,
  variant = 'detailed'
}: EstimateSummaryProps) {
  const { toast } = useToast()
  const [localData, setLocalData] = useState(data)
  const [showSettings, setShowSettings] = useState(false)

  /**
   * Update estimate data
   */
  const updateData = (updates: Partial<EstimateSummaryData>) => {
    const updated = { ...localData, ...updates }
    setLocalData(updated)
    onDataChange?.(updated)
  }

  /**
   * Calculate subtotal
   */
  const calculateSubtotal = (): number => {
    const { costs } = localData
    return (
      costs.materials +
      costs.labor +
      costs.equipment +
      costs.subcontractors +
      costs.permits +
      costs.overhead +
      costs.contingency
    )
  }

  /**
   * Calculate taxes
   */
  const calculateTax = (subtotal: number): number => {
    if (!localData.includeTax || !localData.taxRate) return 0
    return subtotal * (localData.taxRate / 100)
  }

  /**
   * Calculate bond cost
   */
  const calculateBond = (subtotal: number): number => {
    if (!localData.includeBond || !localData.bondRate) return 0
    return subtotal * (localData.bondRate / 100)
  }

  /**
   * Calculate insurance cost
   */
  const calculateInsurance = (subtotal: number): number => {
    if (!localData.includeInsurance || !localData.insuranceRate) return 0
    return subtotal * (localData.insuranceRate / 100)
  }

  /**
   * Calculate profit
   */
  const calculateProfit = (subtotal: number): number => {
    if (!localData.includeProfit || !localData.profitMargin) return 0
    return subtotal * (localData.profitMargin / 100)
  }

  /**
   * Calculate grand total
   */
  const calculateGrandTotal = (): number => {
    const subtotal = calculateSubtotal()
    const tax = calculateTax(subtotal)
    const bond = calculateBond(subtotal)
    const insurance = calculateInsurance(subtotal)
    const profit = calculateProfit(subtotal)

    return subtotal + tax + bond + insurance + profit
  }

  /**
   * Save estimate
   */
  const handleSave = async () => {
    try {
      const response = await fetch(`/api/cost/estimates/${data.projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(localData)
      })

      if (!response.ok) {
        throw new Error('Failed to save estimate')
      }

      toast({
        title: 'Estimate Saved',
        description: 'Cost estimate has been updated successfully'
      })
    } catch (error: any) {
      toast({
        title: 'Save Failed',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  const subtotal = calculateSubtotal()
  const tax = calculateTax(subtotal)
  const bond = calculateBond(subtotal)
  const insurance = calculateInsurance(subtotal)
  const profit = calculateProfit(subtotal)
  const grandTotal = calculateGrandTotal()

  if (variant === 'compact') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Estimate Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Subtotal</span>
              <span className="font-medium">
                ${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            {localData.includeTax && tax > 0 && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Tax ({localData.taxRate}%)</span>
                <span className="font-medium">
                  ${tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}
            {localData.includeProfit && profit > 0 && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Profit ({localData.profitMargin}%)</span>
                <span className="font-medium">
                  ${profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between">
              <span className="font-bold">Grand Total</span>
              <span className="text-xl font-bold">
                ${grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Estimate Summary
              </CardTitle>
              <CardDescription>{localData.projectName}</CardDescription>
            </div>
            <div className="flex gap-2">
              {editable && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setShowSettings(!showSettings)}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                  <Button onClick={handleSave}>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Save Estimate
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Settings Panel */}
      {editable && showSettings && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Estimate Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tax Settings */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="include-tax">Include Tax</Label>
                  <Switch
                    id="include-tax"
                    checked={localData.includeTax}
                    onCheckedChange={(checked) => updateData({ includeTax: checked })}
                  />
                </div>
                {localData.includeTax && (
                  <div className="space-y-2">
                    <Label>Tax Rate (%)</Label>
                    <Input
                      type="number"
                      value={localData.taxRate || 0}
                      onChange={(e) => updateData({ taxRate: parseFloat(e.target.value) || 0 })}
                      step={0.1}
                    />
                  </div>
                )}
              </div>

              {/* Profit Settings */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="include-profit">Include Profit</Label>
                  <Switch
                    id="include-profit"
                    checked={localData.includeProfit}
                    onCheckedChange={(checked) => updateData({ includeProfit: checked })}
                  />
                </div>
                {localData.includeProfit && (
                  <div className="space-y-2">
                    <Label>Profit Margin: {localData.profitMargin || 0}%</Label>
                    <Slider
                      min={0}
                      max={50}
                      step={0.5}
                      value={[localData.profitMargin || 0]}
                      onValueChange={([value]) => updateData({ profitMargin: value })}
                    />
                  </div>
                )}
              </div>

              {/* Bond Settings */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="include-bond">Include Bond</Label>
                  <Switch
                    id="include-bond"
                    checked={localData.includeBond}
                    onCheckedChange={(checked) => updateData({ includeBond: checked })}
                  />
                </div>
                {localData.includeBond && (
                  <div className="space-y-2">
                    <Label>Bond Rate (%)</Label>
                    <Input
                      type="number"
                      value={localData.bondRate || 0}
                      onChange={(e) => updateData({ bondRate: parseFloat(e.target.value) || 0 })}
                      step={0.1}
                    />
                  </div>
                )}
              </div>

              {/* Insurance Settings */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="include-insurance">Include Insurance</Label>
                  <Switch
                    id="include-insurance"
                    checked={localData.includeInsurance}
                    onCheckedChange={(checked) => updateData({ includeInsurance: checked })}
                  />
                </div>
                {localData.includeInsurance && (
                  <div className="space-y-2">
                    <Label>Insurance Rate (%)</Label>
                    <Input
                      type="number"
                      value={localData.insuranceRate || 0}
                      onChange={(e) => updateData({ insuranceRate: parseFloat(e.target.value) || 0 })}
                      step={0.1}
                    />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cost Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Cost Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Direct Costs */}
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-2">Direct Costs</div>
              <div className="space-y-2 ml-4">
                <div className="flex justify-between">
                  <span className="text-sm">Materials</span>
                  <span className="font-medium">
                    ${localData.costs.materials.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Labor</span>
                  <span className="font-medium">
                    ${localData.costs.labor.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Equipment</span>
                  <span className="font-medium">
                    ${localData.costs.equipment.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Subcontractors</span>
                  <span className="font-medium">
                    ${localData.costs.subcontractors.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Indirect Costs */}
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-2">Indirect Costs</div>
              <div className="space-y-2 ml-4">
                <div className="flex justify-between">
                  <span className="text-sm">Permits & Fees</span>
                  <span className="font-medium">
                    ${localData.costs.permits.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Overhead</span>
                  <span className="font-medium">
                    ${localData.costs.overhead.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Contingency</span>
                  <span className="font-medium">
                    ${localData.costs.contingency.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Subtotal */}
            <div className="flex justify-between items-center">
              <span className="font-medium">Subtotal</span>
              <span className="text-lg font-bold">
                ${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* Additional Charges */}
            {(tax > 0 || bond > 0 || insurance > 0 || profit > 0) && (
              <>
                <Separator />
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-2">Additional Charges</div>
                  <div className="space-y-2 ml-4">
                    {tax > 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm">Tax ({localData.taxRate}%)</span>
                        <span className="font-medium">
                          ${tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                    {bond > 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm">Bond ({localData.bondRate}%)</span>
                        <span className="font-medium">
                          ${bond.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                    {insurance > 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm">Insurance ({localData.insuranceRate}%)</span>
                        <span className="font-medium">
                          ${insurance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                    {profit > 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm">Profit ({localData.profitMargin}%)</span>
                        <span className="font-medium text-green-600">
                          ${profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            <Separator className="my-4" />

            {/* Grand Total */}
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold">Grand Total</span>
              <span className="text-3xl font-bold">
                ${grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                Profit Margin
              </div>
              <div className="text-2xl font-bold">
                {localData.profitMargin || 0}%
              </div>
              {profit > 0 && (
                <div className="text-sm text-muted-foreground">
                  ${profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                Cost per SF
              </div>
              <div className="text-2xl font-bold">
                $--
              </div>
              <div className="text-sm text-muted-foreground">
                Add square footage
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                Contingency
              </div>
              <div className="text-2xl font-bold">
                {subtotal > 0 ? ((localData.costs.contingency / subtotal) * 100).toFixed(1) : 0}%
              </div>
              <div className="text-sm text-muted-foreground">
                ${localData.costs.contingency.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
