'use client'

/**
 * Labor Breakdown Component
 *
 * Labor costs breakdown by trade, hours, rates, and total
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'
import {
  Plus,
  Trash2,
  Users,
  Clock,
  DollarSign,
  TrendingUp,
  Download
} from 'lucide-react'

export interface LaborItem {
  id: string
  trade: string
  description: string
  workers: number
  hours: number
  ratePerHour: number
  overtimeHours?: number
  overtimeRate?: number
  totalCost: number
  productivity?: number
  crew?: string
}

interface LaborBreakdownProps {
  projectId: string
  laborItems?: LaborItem[]
  onLaborChange?: (items: LaborItem[]) => void
  editable?: boolean
}

const TRADES = [
  'General Labor',
  'Carpenter',
  'Electrician',
  'Plumber',
  'HVAC Technician',
  'Mason',
  'Concrete Finisher',
  'Welder',
  'Painter',
  'Roofer',
  'Drywall Installer',
  'Tile Setter',
  'Glazier',
  'Insulation Installer',
  'Project Manager',
  'Supervisor',
  'Equipment Operator'
]

const STANDARD_RATES: Record<string, number> = {
  'General Labor': 25,
  'Carpenter': 35,
  'Electrician': 45,
  'Plumber': 42,
  'HVAC Technician': 40,
  'Mason': 38,
  'Concrete Finisher': 32,
  'Welder': 40,
  'Painter': 28,
  'Roofer': 35,
  'Drywall Installer': 30,
  'Tile Setter': 33,
  'Glazier': 36,
  'Insulation Installer': 28,
  'Project Manager': 75,
  'Supervisor': 55,
  'Equipment Operator': 38
}

export function LaborBreakdown({
  projectId,
  laborItems: initialItems = [],
  onLaborChange,
  editable = true
}: LaborBreakdownProps) {
  const { toast } = useToast()
  const [laborItems, setLaborItems] = useState<LaborItem[]>(initialItems)
  const [selectedTrade, setSelectedTrade] = useState<string>('all')

  /**
   * Add new labor item
   */
  const addLaborItem = () => {
    const trade = 'General Labor'
    const newItem: LaborItem = {
      id: `labor-${Date.now()}`,
      trade,
      description: '',
      workers: 1,
      hours: 8,
      ratePerHour: STANDARD_RATES[trade] || 25,
      totalCost: 0
    }

    newItem.totalCost = calculateTotalCost(newItem)

    const updated = [...laborItems, newItem]
    setLaborItems(updated)
    onLaborChange?.(updated)
  }

  /**
   * Calculate total cost for labor item
   */
  const calculateTotalCost = (item: LaborItem): number => {
    const regularCost = item.workers * item.hours * item.ratePerHour
    const overtimeCost = item.overtimeHours && item.overtimeRate
      ? item.workers * item.overtimeHours * item.overtimeRate
      : 0
    return regularCost + overtimeCost
  }

  /**
   * Update labor item
   */
  const updateLaborItem = (id: string, updates: Partial<LaborItem>) => {
    const updated = laborItems.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, ...updates }

        // Update rate when trade changes
        if ('trade' in updates && updates.trade) {
          updatedItem.ratePerHour = STANDARD_RATES[updates.trade] || updatedItem.ratePerHour
          if (updatedItem.overtimeRate) {
            updatedItem.overtimeRate = updatedItem.ratePerHour * 1.5
          }
        }

        // Recalculate total cost
        updatedItem.totalCost = calculateTotalCost(updatedItem)

        return updatedItem
      }
      return item
    })

    setLaborItems(updated)
    onLaborChange?.(updated)
  }

  /**
   * Delete labor item
   */
  const deleteLaborItem = (id: string) => {
    const updated = laborItems.filter(item => item.id !== id)
    setLaborItems(updated)
    onLaborChange?.(updated)
  }

  /**
   * Calculate totals by trade
   */
  const calculateTotalsByTrade = () => {
    const totals = laborItems.reduce((acc, item) => {
      if (!acc[item.trade]) {
        acc[item.trade] = { cost: 0, hours: 0, workers: 0 }
      }
      acc[item.trade].cost += item.totalCost
      acc[item.trade].hours += item.hours * item.workers
      acc[item.trade].workers += item.workers
      return acc
    }, {} as Record<string, { cost: number; hours: number; workers: number }>)

    return totals
  }

  /**
   * Calculate grand totals
   */
  const calculateGrandTotals = () => {
    return laborItems.reduce(
      (acc, item) => {
        acc.cost += item.totalCost
        acc.hours += (item.hours + (item.overtimeHours || 0)) * item.workers
        acc.regularHours += item.hours * item.workers
        acc.overtimeHours += (item.overtimeHours || 0) * item.workers
        return acc
      },
      { cost: 0, hours: 0, regularHours: 0, overtimeHours: 0 }
    )
  }

  /**
   * Export labor breakdown
   */
  const handleExport = () => {
    const headers = ['Trade', 'Description', 'Workers', 'Hours', 'Rate/Hour', 'Overtime Hours', 'Overtime Rate', 'Total Cost']
    const rows = laborItems.map(item => [
      item.trade,
      item.description,
      item.workers,
      item.hours,
      item.ratePerHour,
      item.overtimeHours || 0,
      item.overtimeRate || 0,
      item.totalCost
    ])

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `labor-breakdown-${projectId}.csv`
    a.click()
    URL.revokeObjectURL(url)

    toast({
      title: 'Export Successful',
      description: 'Labor breakdown exported to CSV'
    })
  }

  // Filter labor items
  const filteredItems = selectedTrade === 'all'
    ? laborItems
    : laborItems.filter(item => item.trade === selectedTrade)

  const tradeTotals = calculateTotalsByTrade()
  const grandTotals = calculateGrandTotals()

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Labor Breakdown
              </CardTitle>
              <CardDescription>
                Labor costs by trade, hours, and rates
              </CardDescription>
            </div>
            <Button onClick={handleExport} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                Total Labor Cost
              </div>
              <div className="text-2xl font-bold">
                ${grandTotals.cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Total Hours
              </div>
              <div className="text-2xl font-bold">
                {grandTotals.hours.toLocaleString()}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Regular Hours
              </div>
              <div className="text-2xl font-bold">
                {grandTotals.regularHours.toLocaleString()}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                Overtime Hours
              </div>
              <div className="text-2xl font-bold">
                {grandTotals.overtimeHours.toLocaleString()}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="summary">Summary by Trade</TabsTrigger>
        </TabsList>

        {/* Detailed View */}
        <TabsContent value="details" className="space-y-4">
          {/* Filter */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <Label>Filter by Trade</Label>
                <Select value={selectedTrade} onValueChange={setSelectedTrade}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Trades</SelectItem>
                    {TRADES.map(trade => (
                      <SelectItem key={trade} value={trade}>{trade}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Labor Table */}
          <Card>
            <CardContent className="pt-6">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Trade</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Workers</TableHead>
                      <TableHead className="text-right">Hours</TableHead>
                      <TableHead className="text-right">Rate/Hour</TableHead>
                      <TableHead className="text-right">OT Hours</TableHead>
                      <TableHead className="text-right">OT Rate</TableHead>
                      <TableHead className="text-right">Total Cost</TableHead>
                      {editable && <TableHead className="w-[50px]"></TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={editable ? 9 : 8} className="text-center text-muted-foreground">
                          No labor items added yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            {editable ? (
                              <Select
                                value={item.trade}
                                onValueChange={(value) => updateLaborItem(item.id, { trade: value })}
                              >
                                <SelectTrigger className="w-[180px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {TRADES.map(trade => (
                                    <SelectItem key={trade} value={trade}>{trade}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Badge variant="outline">{item.trade}</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {editable ? (
                              <Input
                                value={item.description}
                                onChange={(e) => updateLaborItem(item.id, { description: e.target.value })}
                                className="w-[200px]"
                              />
                            ) : (
                              <span className="text-sm">{item.description}</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {editable ? (
                              <Input
                                type="number"
                                value={item.workers}
                                onChange={(e) => updateLaborItem(item.id, { workers: parseInt(e.target.value) || 1 })}
                                className="w-[80px] text-right"
                                min={1}
                              />
                            ) : (
                              item.workers
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {editable ? (
                              <Input
                                type="number"
                                value={item.hours}
                                onChange={(e) => updateLaborItem(item.id, { hours: parseFloat(e.target.value) || 0 })}
                                className="w-[80px] text-right"
                              />
                            ) : (
                              item.hours
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {editable ? (
                              <Input
                                type="number"
                                value={item.ratePerHour}
                                onChange={(e) => updateLaborItem(item.id, { ratePerHour: parseFloat(e.target.value) || 0 })}
                                className="w-[90px] text-right"
                              />
                            ) : (
                              `$${item.ratePerHour.toFixed(2)}`
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {editable ? (
                              <Input
                                type="number"
                                value={item.overtimeHours || 0}
                                onChange={(e) => updateLaborItem(item.id, { overtimeHours: parseFloat(e.target.value) || undefined })}
                                className="w-[80px] text-right"
                              />
                            ) : (
                              item.overtimeHours || '-'
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {editable ? (
                              <Input
                                type="number"
                                value={item.overtimeRate || 0}
                                onChange={(e) => updateLaborItem(item.id, { overtimeRate: parseFloat(e.target.value) || undefined })}
                                className="w-[90px] text-right"
                              />
                            ) : (
                              item.overtimeRate ? `$${item.overtimeRate.toFixed(2)}` : '-'
                            )}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ${item.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </TableCell>
                          {editable && (
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteLaborItem(item.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {editable && (
                <div className="mt-4">
                  <Button onClick={addLaborItem} variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Labor Item
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Summary by Trade */}
        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {Object.entries(tradeTotals).map(([trade, totals]) => (
                  <div key={trade} className="flex items-center justify-between border-b pb-4">
                    <div>
                      <div className="font-medium">{trade}</div>
                      <div className="text-sm text-muted-foreground">
                        {totals.workers} workers · {totals.hours.toLocaleString()} hours
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold">
                        ${totals.cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        ${(totals.cost / totals.hours).toFixed(2)}/hr avg
                      </div>
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between border-t pt-4">
                  <div className="font-bold text-lg">Grand Total</div>
                  <div className="text-2xl font-bold">
                    ${grandTotals.cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
