'use client'

import { useState } from 'react'
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

export interface CategoryFilterProps {
  selectedCategories?: string[]
  onCategoriesChange?: (categories: string[]) => void
  availableCategories?: string[]
  showCount?: boolean
  categoryCounts?: Record<string, number>
  className?: string
  collapsible?: boolean
  defaultOpen?: boolean
}

const defaultCategories = [
  'Furniture',
  'Lighting',
  'Fixtures',
  'Appliances',
  'Decor',
  'Outdoor',
  'Kitchen',
  'Bathroom',
  'Electronics',
  'Textiles',
  'Plants',
  'Art',
]

export function CategoryFilter({
  selectedCategories = [],
  onCategoriesChange,
  availableCategories = defaultCategories,
  showCount = false,
  categoryCounts = {},
  className = '',
  collapsible = false,
  defaultOpen = true,
}: CategoryFilterProps) {
  const [localSelected, setLocalSelected] = useState<string[]>(selectedCategories)
  const [isOpen, setIsOpen] = useState(defaultOpen)

  const handleToggle = (category: string) => {
    const newSelected = localSelected.includes(category)
      ? localSelected.filter((c) => c !== category)
      : [...localSelected, category]

    setLocalSelected(newSelected)
    onCategoriesChange?.(newSelected)
  }

  const handleSelectAll = () => {
    const allCategories = availableCategories
    setLocalSelected(allCategories)
    onCategoriesChange?.(allCategories)
  }

  const handleClearAll = () => {
    setLocalSelected([])
    onCategoriesChange?.([])
  }

  const FilterContent = () => (
    <div className="space-y-4">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            Categories
            {localSelected.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {localSelected.length}
              </Badge>
            )}
          </span>
        </div>
        <div className="flex gap-1">
          {localSelected.length > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="h-7 text-xs"
            >
              Clear
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSelectAll}
              className="h-7 text-xs"
            >
              Select All
            </Button>
          )}
        </div>
      </div>

      {/* Category Checkboxes */}
      <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
        {availableCategories.map((category) => {
          const count = categoryCounts[category] || 0
          const isDisabled = showCount && count === 0

          return (
            <div
              key={category}
              className={`flex items-center justify-between space-x-2 p-2 rounded-md hover:bg-accent/50 transition-colors ${
                isDisabled ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <div className="flex items-center space-x-2 flex-1">
                <Checkbox
                  id={`category-filter-${category}`}
                  checked={localSelected.includes(category)}
                  onCheckedChange={() => !isDisabled && handleToggle(category)}
                  disabled={isDisabled}
                />
                <label
                  htmlFor={`category-filter-${category}`}
                  className={`text-sm cursor-pointer flex-1 ${
                    isDisabled ? 'cursor-not-allowed' : ''
                  }`}
                >
                  {category}
                </label>
              </div>
              {showCount && (
                <span className="text-xs text-muted-foreground tabular-nums">
                  {count.toLocaleString()}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* Selected Categories Pills */}
      {localSelected.length > 0 && (
        <div className="pt-2 border-t">
          <Label className="text-xs text-muted-foreground mb-2 block">
            Selected ({localSelected.length})
          </Label>
          <div className="flex flex-wrap gap-1">
            {localSelected.map((category) => (
              <Badge
                key={category}
                variant="secondary"
                className="cursor-pointer hover:bg-secondary/80 transition-colors"
                onClick={() => handleToggle(category)}
              >
                {category}
                <X className="h-3 w-3 ml-1" />
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  if (collapsible) {
    return (
      <Card className={className}>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CardHeader className="pb-3">
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between cursor-pointer">
                <div>
                  <CardTitle className="text-base">Category Filter</CardTitle>
                  <CardDescription className="text-xs">
                    Filter models by category
                  </CardDescription>
                </div>
                {isOpen ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent>
              <FilterContent />
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">Category Filter</CardTitle>
        <CardDescription className="text-xs">
          Filter models by category
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FilterContent />
      </CardContent>
    </Card>
  )
}
