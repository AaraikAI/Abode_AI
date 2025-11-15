'use client'

/**
 * Material Takeoff Component
 *
 * Quantity takeoff table with materials, quantities, units, and pricing
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import {
  Plus,
  Trash2,
  Calculator,
  Download,
  Upload,
  Filter,
  Search
} from 'lucide-react'

export interface MaterialItem {
  id: string
  category: string
  name: string
  description?: string
  quantity: number
  unit: string
  unitPrice: number
  totalPrice: number
  vendor?: string
  specification?: string
}

interface MaterialTakeoffProps {
  projectId: string
  materials?: MaterialItem[]
  onMaterialsChange?: (materials: MaterialItem[]) => void
  editable?: boolean
}

const UNITS = [
  'SF', 'SY', 'LF', 'CY', 'EA', 'LS', 'TON', 'GAL', 'LB', 'HR', 'DAY'
]

const CATEGORIES = [
  'Concrete',
  'Masonry',
  'Metals',
  'Wood & Plastics',
  'Thermal & Moisture',
  'Doors & Windows',
  'Finishes',
  'Specialties',
  'Equipment',
  'Furnishings',
  'Plumbing',
  'HVAC',
  'Electrical',
  'Site Work'
]

export function MaterialTakeoff({
  projectId,
  materials: initialMaterials = [],
  onMaterialsChange,
  editable = true
}: MaterialTakeoffProps) {
  const { toast } = useToast()
  const [materials, setMaterials] = useState<MaterialItem[]>(initialMaterials)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [isCalculating, setIsCalculating] = useState(false)

  /**
   * Add new material item
   */
  const addMaterial = () => {
    const newMaterial: MaterialItem = {
      id: `mat-${Date.now()}`,
      category: 'Concrete',
      name: '',
      quantity: 0,
      unit: 'SF',
      unitPrice: 0,
      totalPrice: 0
    }

    const updated = [...materials, newMaterial]
    setMaterials(updated)
    onMaterialsChange?.(updated)
  }

  /**
   * Update material item
   */
  const updateMaterial = (id: string, updates: Partial<MaterialItem>) => {
    const updated = materials.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, ...updates }
        // Recalculate total price if quantity or unit price changed
        if ('quantity' in updates || 'unitPrice' in updates) {
          updatedItem.totalPrice = updatedItem.quantity * updatedItem.unitPrice
        }
        return updatedItem
      }
      return item
    })

    setMaterials(updated)
    onMaterialsChange?.(updated)
  }

  /**
   * Delete material item
   */
  const deleteMaterial = (id: string) => {
    const updated = materials.filter(item => item.id !== id)
    setMaterials(updated)
    onMaterialsChange?.(updated)
  }

  /**
   * Calculate totals by category
   */
  const calculateTotals = () => {
    const totals = materials.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = 0
      }
      acc[item.category] += item.totalPrice
      return acc
    }, {} as Record<string, number>)

    return totals
  }

  /**
   * Calculate grand total
   */
  const calculateGrandTotal = () => {
    return materials.reduce((sum, item) => sum + item.totalPrice, 0)
  }

  /**
   * Import materials from CSV
   */
  const handleImport = async (file: File) => {
    try {
      const text = await file.text()
      const lines = text.split('\n')
      const imported: MaterialItem[] = []

      // Skip header row
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue

        const [category, name, description, quantity, unit, unitPrice, vendor] = line.split(',')

        imported.push({
          id: `mat-${Date.now()}-${i}`,
          category: category || 'Concrete',
          name: name || '',
          description: description || undefined,
          quantity: parseFloat(quantity) || 0,
          unit: unit || 'SF',
          unitPrice: parseFloat(unitPrice) || 0,
          totalPrice: (parseFloat(quantity) || 0) * (parseFloat(unitPrice) || 0),
          vendor: vendor || undefined
        })
      }

      const updated = [...materials, ...imported]
      setMaterials(updated)
      onMaterialsChange?.(updated)

      toast({
        title: 'Import Successful',
        description: `Imported ${imported.length} materials`
      })
    } catch (error: any) {
      toast({
        title: 'Import Failed',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  /**
   * Export materials to CSV
   */
  const handleExport = () => {
    const headers = ['Category', 'Name', 'Description', 'Quantity', 'Unit', 'Unit Price', 'Total Price', 'Vendor']
    const rows = materials.map(item => [
      item.category,
      item.name,
      item.description || '',
      item.quantity,
      item.unit,
      item.unitPrice,
      item.totalPrice,
      item.vendor || ''
    ])

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `material-takeoff-${projectId}.csv`
    a.click()
    URL.revokeObjectURL(url)

    toast({
      title: 'Export Successful',
      description: 'Material takeoff exported to CSV'
    })
  }

  /**
   * Run AI-assisted quantity takeoff
   */
  const runAutoTakeoff = async () => {
    setIsCalculating(true)

    try {
      const response = await fetch('/api/cost/auto-takeoff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Auto takeoff failed')
      }

      setMaterials(data.materials)
      onMaterialsChange?.(data.materials)

      toast({
        title: 'Auto Takeoff Complete',
        description: `Calculated ${data.materials.length} material quantities`
      })
    } catch (error: any) {
      toast({
        title: 'Auto Takeoff Failed',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setIsCalculating(false)
    }
  }

  // Filter materials
  const filteredMaterials = materials.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter

    return matchesSearch && matchesCategory
  })

  const grandTotal = calculateGrandTotal()
  const categoryTotals = calculateTotals()

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Material Takeoff
              </CardTitle>
              <CardDescription>
                Quantity takeoff and material pricing
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={runAutoTakeoff} disabled={isCalculating} variant="outline">
                <Calculator className="h-4 w-4 mr-2" />
                {isCalculating ? 'Calculating...' : 'Auto Takeoff'}
              </Button>
              <Button onClick={handleExport} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <label htmlFor="import-csv">
                <Button variant="outline" asChild>
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    Import
                  </span>
                </Button>
                <input
                  id="import-csv"
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleImport(e.target.files[0])}
                />
              </label>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Search Materials</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Filter by Category</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Materials Table */}
      <Card>
        <CardContent className="pt-6">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Total Price</TableHead>
                  {editable && <TableHead className="w-[50px]"></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMaterials.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={editable ? 8 : 7} className="text-center text-muted-foreground">
                      No materials added yet
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMaterials.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {editable ? (
                          <Select
                            value={item.category}
                            onValueChange={(value) => updateMaterial(item.id, { category: value })}
                          >
                            <SelectTrigger className="w-[150px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {CATEGORIES.map(cat => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant="outline">{item.category}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {editable ? (
                          <Input
                            value={item.name}
                            onChange={(e) => updateMaterial(item.id, { name: e.target.value })}
                            className="w-[200px]"
                          />
                        ) : (
                          item.name
                        )}
                      </TableCell>
                      <TableCell>
                        {editable ? (
                          <Input
                            value={item.description || ''}
                            onChange={(e) => updateMaterial(item.id, { description: e.target.value })}
                            className="w-[200px]"
                          />
                        ) : (
                          <span className="text-sm text-muted-foreground">{item.description}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {editable ? (
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateMaterial(item.id, { quantity: parseFloat(e.target.value) || 0 })}
                            className="w-[100px] text-right"
                          />
                        ) : (
                          item.quantity.toLocaleString()
                        )}
                      </TableCell>
                      <TableCell>
                        {editable ? (
                          <Select
                            value={item.unit}
                            onValueChange={(value) => updateMaterial(item.id, { unit: value })}
                          >
                            <SelectTrigger className="w-[80px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {UNITS.map(unit => (
                                <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          item.unit
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {editable ? (
                          <Input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => updateMaterial(item.id, { unitPrice: parseFloat(e.target.value) || 0 })}
                            className="w-[100px] text-right"
                          />
                        ) : (
                          `$${item.unitPrice.toFixed(2)}`
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${item.totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      {editable && (
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteMaterial(item.id)}
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
              <Button onClick={addMaterial} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Material
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Summary by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(categoryTotals).map(([category, total]) => (
              <div key={category} className="flex justify-between items-center">
                <span className="text-sm">{category}</span>
                <span className="font-medium">
                  ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            ))}
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between items-center">
                <span className="font-bold">Grand Total</span>
                <span className="text-2xl font-bold">
                  ${grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
