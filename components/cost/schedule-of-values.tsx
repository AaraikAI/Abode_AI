'use client'

/**
 * Schedule of Values Component
 *
 * Payment schedule breakdown, milestones, and completion percentages
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import {
  Calendar,
  DollarSign,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  TrendingUp,
  Download
} from 'lucide-react'

export interface ScheduleItem {
  id: string
  description: string
  scheduledValue: number
  percentComplete: number
  completedValue: number
  previouslyBilled: number
  currentBilling: number
  retainage: number
  retainagePercent: number
  startDate?: string
  endDate?: string
  status: 'pending' | 'in-progress' | 'completed' | 'billed'
}

interface ScheduleOfValuesProps {
  projectId: string
  items?: ScheduleItem[]
  totalContractValue?: number
  onItemsChange?: (items: ScheduleItem[]) => void
  editable?: boolean
}

export function ScheduleOfValues({
  projectId,
  items: initialItems = [],
  totalContractValue = 0,
  onItemsChange,
  editable = true
}: ScheduleOfValuesProps) {
  const { toast } = useToast()
  const [items, setItems] = useState<ScheduleItem[]>(initialItems)
  const [retainageRate, setRetainageRate] = useState(10)

  /**
   * Add new schedule item
   */
  const addItem = () => {
    const newItem: ScheduleItem = {
      id: `sov-${Date.now()}`,
      description: '',
      scheduledValue: 0,
      percentComplete: 0,
      completedValue: 0,
      previouslyBilled: 0,
      currentBilling: 0,
      retainage: 0,
      retainagePercent: retainageRate,
      status: 'pending'
    }

    const updated = [...items, newItem]
    setItems(updated)
    onItemsChange?.(updated)
  }

  /**
   * Update schedule item
   */
  const updateItem = (id: string, updates: Partial<ScheduleItem>) => {
    const updated = items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, ...updates }

        // Recalculate values
        if ('scheduledValue' in updates || 'percentComplete' in updates) {
          updatedItem.completedValue = updatedItem.scheduledValue * (updatedItem.percentComplete / 100)
          updatedItem.currentBilling = updatedItem.completedValue - updatedItem.previouslyBilled
          updatedItem.retainage = updatedItem.currentBilling * (updatedItem.retainagePercent / 100)
        }

        // Update status based on completion
        if ('percentComplete' in updates) {
          if (updatedItem.percentComplete === 0) {
            updatedItem.status = 'pending'
          } else if (updatedItem.percentComplete < 100) {
            updatedItem.status = 'in-progress'
          } else {
            updatedItem.status = 'completed'
          }
        }

        return updatedItem
      }
      return item
    })

    setItems(updated)
    onItemsChange?.(updated)
  }

  /**
   * Delete schedule item
   */
  const deleteItem = (id: string) => {
    const updated = items.filter(item => item.id !== id)
    setItems(updated)
    onItemsChange?.(updated)
  }

  /**
   * Calculate totals
   */
  const calculateTotals = () => {
    return items.reduce(
      (acc, item) => {
        acc.scheduledValue += item.scheduledValue
        acc.completedValue += item.completedValue
        acc.previouslyBilled += item.previouslyBilled
        acc.currentBilling += item.currentBilling
        acc.retainage += item.retainage
        return acc
      },
      {
        scheduledValue: 0,
        completedValue: 0,
        previouslyBilled: 0,
        currentBilling: 0,
        retainage: 0
      }
    )
  }

  /**
   * Mark item as billed
   */
  const markAsBilled = (id: string) => {
    const updated = items.map(item => {
      if (item.id === id) {
        return {
          ...item,
          status: 'billed' as const,
          previouslyBilled: item.previouslyBilled + item.currentBilling,
          currentBilling: 0
        }
      }
      return item
    })

    setItems(updated)
    onItemsChange?.(updated)

    toast({
      title: 'Item Marked as Billed',
      description: 'Payment has been recorded'
    })
  }

  /**
   * Export schedule
   */
  const handleExport = () => {
    const headers = [
      'Description',
      'Scheduled Value',
      'Percent Complete',
      'Completed Value',
      'Previously Billed',
      'Current Billing',
      'Retainage',
      'Status'
    ]

    const rows = items.map(item => [
      item.description,
      item.scheduledValue.toFixed(2),
      item.percentComplete,
      item.completedValue.toFixed(2),
      item.previouslyBilled.toFixed(2),
      item.currentBilling.toFixed(2),
      item.retainage.toFixed(2),
      item.status
    ])

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `schedule-of-values-${projectId}.csv`
    a.click()
    URL.revokeObjectURL(url)

    toast({
      title: 'Export Successful',
      description: 'Schedule exported to CSV'
    })
  }

  const totals = calculateTotals()
  const overallProgress = totals.scheduledValue > 0
    ? (totals.completedValue / totals.scheduledValue) * 100
    : 0

  const statusColors = {
    pending: 'bg-gray-500',
    'in-progress': 'bg-blue-500',
    completed: 'bg-green-500',
    billed: 'bg-purple-500'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Schedule of Values
              </CardTitle>
              <CardDescription>
                Payment schedule and milestone tracking
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleExport} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
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
                Contract Value
              </div>
              <div className="text-2xl font-bold">
                ${totals.scheduledValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                Completed Value
              </div>
              <div className="text-2xl font-bold">
                ${totals.completedValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <Progress value={overallProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4" />
                Current Billing
              </div>
              <div className="text-2xl font-bold text-green-600">
                ${totals.currentBilling.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Total Retainage
              </div>
              <div className="text-2xl font-bold">
                ${totals.retainage.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Project Completion</span>
              <span className="font-medium">{overallProgress.toFixed(1)}%</span>
            </div>
            <Progress value={overallProgress} className="h-4" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>${totals.completedValue.toLocaleString(undefined, { minimumFractionDigits: 2 })} completed</span>
              <span>${totals.scheduledValue.toLocaleString(undefined, { minimumFractionDigits: 2 })} total</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schedule Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Line Items</CardTitle>
            {editable && (
              <div className="space-y-2">
                <Label>Retainage Rate (%)</Label>
                <Input
                  type="number"
                  value={retainageRate}
                  onChange={(e) => setRetainageRate(parseFloat(e.target.value) || 0)}
                  className="w-24"
                  min={0}
                  max={100}
                />
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Scheduled Value</TableHead>
                  <TableHead className="text-right">% Complete</TableHead>
                  <TableHead className="text-right">Completed Value</TableHead>
                  <TableHead className="text-right">Previously Billed</TableHead>
                  <TableHead className="text-right">Current Billing</TableHead>
                  <TableHead className="text-right">Retainage</TableHead>
                  <TableHead>Status</TableHead>
                  {editable && <TableHead className="w-[100px]"></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={editable ? 9 : 8} className="text-center text-muted-foreground">
                      No schedule items added yet
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {editable ? (
                          <Input
                            value={item.description}
                            onChange={(e) => updateItem(item.id, { description: e.target.value })}
                            className="w-[250px]"
                          />
                        ) : (
                          item.description
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {editable ? (
                          <Input
                            type="number"
                            value={item.scheduledValue}
                            onChange={(e) => updateItem(item.id, { scheduledValue: parseFloat(e.target.value) || 0 })}
                            className="w-[120px] text-right"
                          />
                        ) : (
                          `$${item.scheduledValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {editable ? (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={item.percentComplete}
                              onChange={(e) => updateItem(item.id, { percentComplete: parseFloat(e.target.value) || 0 })}
                              className="w-[80px] text-right"
                              min={0}
                              max={100}
                            />
                            <span className="text-sm">%</span>
                          </div>
                        ) : (
                          `${item.percentComplete}%`
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${item.completedValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right">
                        ${item.previouslyBilled.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        ${item.currentBilling.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right text-orange-600">
                        ${item.retainage.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`${statusColors[item.status]} text-white border-0`}>
                          {item.status}
                        </Badge>
                      </TableCell>
                      {editable && (
                        <TableCell>
                          <div className="flex gap-1">
                            {item.currentBilling > 0 && item.status !== 'billed' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => markAsBilled(item.id)}
                                title="Mark as billed"
                              >
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteItem(item.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
                {items.length > 0 && (
                  <TableRow className="bg-muted/50 font-bold">
                    <TableCell>TOTAL</TableCell>
                    <TableCell className="text-right">
                      ${totals.scheduledValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right">
                      {overallProgress.toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-right">
                      ${totals.completedValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right">
                      ${totals.previouslyBilled.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right text-green-600">
                      ${totals.currentBilling.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right text-orange-600">
                      ${totals.retainage.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell colSpan={editable ? 2 : 1}></TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {editable && (
            <div className="mt-4">
              <Button onClick={addItem} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Line Item
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Work Completed This Period</span>
              <span className="font-medium">
                ${totals.completedValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Less Previous Payments</span>
              <span className="font-medium">
                -${totals.previouslyBilled.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Current Payment Due</span>
              <span className="font-medium">
                ${totals.currentBilling.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Less Retainage ({retainageRate}%)</span>
              <span className="font-medium text-orange-600">
                -${totals.retainage.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="border-t pt-3">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold">Net Payment Due</span>
                <span className="text-2xl font-bold text-green-600">
                  ${(totals.currentBilling - totals.retainage).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
