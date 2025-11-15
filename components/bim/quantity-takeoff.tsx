'use client'

import { useState } from 'react'
import {
  Calculator,
  Download,
  RefreshCw,
  Filter,
  TrendingUp,
  Package,
  Ruler,
  DollarSign,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export interface QuantityItem {
  id: string
  category: string
  element: string
  count: number
  length?: number
  area?: number
  volume?: number
  unit: string
  unitCost?: number
  totalCost?: number
  material?: string
}

export interface QuantitySummary {
  totalElements: number
  totalVolume: number
  totalArea: number
  totalLength: number
  totalCost: number
  categories: {
    name: string
    count: number
    percentage: number
  }[]
}

export interface ExtractionProgress {
  stage: 'idle' | 'extracting' | 'calculating' | 'complete'
  progress: number
  message: string
  processedElements: number
  totalElements: number
}

interface QuantityTakeoffProps {
  quantities?: QuantityItem[]
  summary?: QuantitySummary
  onExtract?: () => void
  onExport?: (format: 'excel' | 'csv' | 'pdf') => void
  onUpdateCost?: (itemId: string, cost: number) => void
}

export function QuantityTakeoff({
  quantities = [],
  summary,
  onExtract,
  onExport,
  onUpdateCost,
}: QuantityTakeoffProps) {
  const [progress, setProgress] = useState<ExtractionProgress>({
    stage: 'idle',
    progress: 0,
    message: 'Ready to extract quantities',
    processedElements: 0,
    totalElements: 0,
  })
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [materialFilter, setMaterialFilter] = useState<string>('all')
  const [editingCost, setEditingCost] = useState<string | null>(null)
  const [costValue, setCostValue] = useState<string>('')

  const handleExtract = async () => {
    setProgress({
      stage: 'extracting',
      progress: 10,
      message: 'Extracting quantities from model...',
      processedElements: 0,
      totalElements: 100,
    })

    await new Promise(resolve => setTimeout(resolve, 1000))
    setProgress({
      stage: 'calculating',
      progress: 60,
      message: 'Calculating totals...',
      processedElements: 60,
      totalElements: 100,
    })

    await new Promise(resolve => setTimeout(resolve, 1000))
    setProgress({
      stage: 'complete',
      progress: 100,
      message: 'Extraction complete',
      processedElements: 100,
      totalElements: 100,
    })

    onExtract?.()
  }

  const handleStartEditCost = (item: QuantityItem) => {
    setEditingCost(item.id)
    setCostValue(item.unitCost?.toString() || '')
  }

  const handleSaveCost = (itemId: string) => {
    const cost = parseFloat(costValue)
    if (!isNaN(cost)) {
      onUpdateCost?.(itemId, cost)
    }
    setEditingCost(null)
  }

  const filteredQuantities = quantities.filter((item) => {
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter
    const matchesMaterial = materialFilter === 'all' || item.material === materialFilter
    return matchesCategory && matchesMaterial
  })

  const categories = Array.from(new Set(quantities.map((q) => q.category)))
  const materials = Array.from(new Set(quantities.map((q) => q.material).filter(Boolean)))

  const formatNumber = (num: number | undefined, decimals: number = 2) => {
    return num?.toFixed(decimals) || '0.00'
  }

  const formatCurrency = (num: number | undefined) => {
    return num ? `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'
  }

  return (
    <Card className="p-6 h-full flex flex-col">
      <div className="space-y-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            <h3 className="font-semibold text-lg">Quantity Takeoff</h3>
          </div>
          <div className="flex items-center gap-2">
            <Select onValueChange={(format) => onExport?.(format as any)}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Export" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="excel">Excel</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
              </SelectContent>
            </Select>
            <Button
              size="sm"
              onClick={handleExtract}
              disabled={progress.stage !== 'idle' && progress.stage !== 'complete'}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Extract
            </Button>
          </div>
        </div>

        {progress.stage !== 'idle' && progress.stage !== 'complete' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{progress.message}</span>
              <span className="font-medium">
                {progress.processedElements} / {progress.totalElements}
              </span>
            </div>
            <Progress value={progress.progress} />
          </div>
        )}

        {summary && (
          <div className="grid grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Elements</p>
              </div>
              <p className="text-2xl font-bold">{summary.totalElements}</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Ruler className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Total Volume</p>
              </div>
              <p className="text-2xl font-bold">{formatNumber(summary.totalVolume)} m³</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Total Area</p>
              </div>
              <p className="text-2xl font-bold">{formatNumber(summary.totalArea)} m²</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Total Cost</p>
              </div>
              <p className="text-2xl font-bold">{formatCurrency(summary.totalCost)}</p>
            </Card>
          </div>
        )}

        <div className="flex gap-2">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={materialFilter} onValueChange={setMaterialFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by material" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Materials</SelectItem>
              {materials.map((mat) => (
                <SelectItem key={mat} value={mat!}>
                  {mat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(categoryFilter !== 'all' || materialFilter !== 'all') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setCategoryFilter('all')
                setMaterialFilter('all')
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      <Separator className="my-4" />

      <Tabs defaultValue="quantities" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="quantities">Quantities</TabsTrigger>
          <TabsTrigger value="breakdown">Category Breakdown</TabsTrigger>
        </TabsList>

        <TabsContent value="quantities" className="flex-1 mt-4">
          <ScrollArea className="h-full">
            {filteredQuantities.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Calculator className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">No quantities extracted</p>
                <p className="text-sm mt-1">Click Extract to analyze the model</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Element</TableHead>
                    <TableHead className="text-right">Count</TableHead>
                    <TableHead className="text-right">Length</TableHead>
                    <TableHead className="text-right">Area</TableHead>
                    <TableHead className="text-right">Volume</TableHead>
                    <TableHead>Material</TableHead>
                    <TableHead className="text-right">Unit Cost</TableHead>
                    <TableHead className="text-right">Total Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuantities.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Badge variant="outline">{item.category}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{item.element}</TableCell>
                      <TableCell className="text-right">{item.count}</TableCell>
                      <TableCell className="text-right">
                        {item.length ? `${formatNumber(item.length)} m` : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.area ? `${formatNumber(item.area)} m²` : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.volume ? `${formatNumber(item.volume)} m³` : '-'}
                      </TableCell>
                      <TableCell>{item.material || '-'}</TableCell>
                      <TableCell className="text-right">
                        {editingCost === item.id ? (
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              value={costValue}
                              onChange={(e) => setCostValue(e.target.value)}
                              className="h-7 w-24"
                              autoFocus
                            />
                            <Button
                              size="sm"
                              className="h-7"
                              onClick={() => handleSaveCost(item.id)}
                            >
                              Save
                            </Button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStartEditCost(item)}
                            className="hover:underline"
                          >
                            {formatCurrency(item.unitCost)}
                          </button>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.totalCost)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="breakdown" className="flex-1 mt-4">
          <ScrollArea className="h-full">
            {summary?.categories && summary.categories.length > 0 ? (
              <div className="space-y-4">
                {summary.categories.map((cat) => (
                  <Card key={cat.name} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{cat.name}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {cat.count} items
                        </span>
                      </div>
                      <span className="font-medium">{cat.percentage}%</span>
                    </div>
                    <Progress value={cat.percentage} />
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No data available</p>
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </Card>
  )
}
