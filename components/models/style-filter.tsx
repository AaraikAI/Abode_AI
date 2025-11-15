'use client'

import { useState } from 'react'
import { Check, Filter, X, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'

export type ArchitecturalStyle =
  | 'modern'
  | 'contemporary'
  | 'traditional'
  | 'industrial'
  | 'minimalist'
  | 'scandinavian'
  | 'mid-century'
  | 'bohemian'
  | 'rustic'
  | 'coastal'
  | 'farmhouse'
  | 'art-deco'
  | 'victorian'
  | 'craftsman'
  | 'mediterranean'

export interface StyleFilterConfig {
  id: ArchitecturalStyle
  name: string
  description: string
  tags?: string[]
  popular?: boolean
}

export interface StyleFilterProps {
  selectedStyles?: ArchitecturalStyle[]
  onStylesChange?: (styles: ArchitecturalStyle[]) => void
  onApply?: (styles: ArchitecturalStyle[]) => void
  maxSelections?: number
  showPopularOnly?: boolean
  variant?: 'popover' | 'inline'
  className?: string
}

const styleConfigs: StyleFilterConfig[] = [
  {
    id: 'modern',
    name: 'Modern',
    description: 'Clean lines, neutral colors, minimal ornamentation',
    tags: ['sleek', 'contemporary', 'simple'],
    popular: true,
  },
  {
    id: 'contemporary',
    name: 'Contemporary',
    description: 'Current trends, mixed materials, open spaces',
    tags: ['current', 'fresh', 'eclectic'],
    popular: true,
  },
  {
    id: 'traditional',
    name: 'Traditional',
    description: 'Classic details, rich colors, elegant furnishings',
    tags: ['classic', 'timeless', 'elegant'],
    popular: true,
  },
  {
    id: 'industrial',
    name: 'Industrial',
    description: 'Raw materials, exposed elements, utilitarian aesthetics',
    tags: ['urban', 'raw', 'edgy'],
    popular: true,
  },
  {
    id: 'minimalist',
    name: 'Minimalist',
    description: 'Essential elements only, maximum simplicity',
    tags: ['simple', 'clean', 'uncluttered'],
    popular: true,
  },
  {
    id: 'scandinavian',
    name: 'Scandinavian',
    description: 'Light colors, natural materials, functional design',
    tags: ['nordic', 'cozy', 'hygge'],
    popular: true,
  },
  {
    id: 'mid-century',
    name: 'Mid-Century Modern',
    description: '1950s-60s inspired, organic forms, bold colors',
    tags: ['retro', 'vintage', 'iconic'],
    popular: true,
  },
  {
    id: 'bohemian',
    name: 'Bohemian',
    description: 'Eclectic mix, vibrant colors, relaxed vibe',
    tags: ['artistic', 'free-spirited', 'colorful'],
    popular: false,
  },
  {
    id: 'rustic',
    name: 'Rustic',
    description: 'Natural materials, warm tones, handcrafted elements',
    tags: ['natural', 'warm', 'organic'],
    popular: false,
  },
  {
    id: 'coastal',
    name: 'Coastal',
    description: 'Light and airy, nautical touches, beach-inspired',
    tags: ['beachy', 'relaxed', 'breezy'],
    popular: false,
  },
  {
    id: 'farmhouse',
    name: 'Farmhouse',
    description: 'Rustic charm, vintage pieces, cozy atmosphere',
    tags: ['country', 'homey', 'comfortable'],
    popular: false,
  },
  {
    id: 'art-deco',
    name: 'Art Deco',
    description: 'Geometric patterns, luxurious materials, bold glamour',
    tags: ['glamorous', 'luxe', 'ornate'],
    popular: false,
  },
  {
    id: 'victorian',
    name: 'Victorian',
    description: 'Ornate details, rich fabrics, vintage elegance',
    tags: ['ornate', 'historic', 'detailed'],
    popular: false,
  },
  {
    id: 'craftsman',
    name: 'Craftsman',
    description: 'Handcrafted details, natural wood, built-in features',
    tags: ['artisan', 'quality', 'detailed'],
    popular: false,
  },
  {
    id: 'mediterranean',
    name: 'Mediterranean',
    description: 'Warm colors, arched doorways, tile accents',
    tags: ['warm', 'sunny', 'elegant'],
    popular: false,
  },
]

export function StyleFilter({
  selectedStyles = [],
  onStylesChange,
  onApply,
  maxSelections,
  showPopularOnly = false,
  variant = 'popover',
  className = '',
}: StyleFilterProps) {
  const [localStyles, setLocalStyles] = useState<ArchitecturalStyle[]>(selectedStyles)
  const [filterView, setFilterView] = useState<'all' | 'popular'>('all')

  const displayedStyles = showPopularOnly || filterView === 'popular'
    ? styleConfigs.filter(s => s.popular)
    : styleConfigs

  const toggleStyle = (styleId: ArchitecturalStyle) => {
    const isSelected = localStyles.includes(styleId)
    let updated: ArchitecturalStyle[]

    if (isSelected) {
      updated = localStyles.filter(s => s !== styleId)
    } else {
      if (maxSelections && localStyles.length >= maxSelections) {
        return
      }
      updated = [...localStyles, styleId]
    }

    setLocalStyles(updated)
    onStylesChange?.(updated)
  }

  const handleClear = () => {
    setLocalStyles([])
    onStylesChange?.([])
  }

  const handleApply = () => {
    onApply?.(localStyles)
  }

  const getStyleConfig = (id: ArchitecturalStyle) => {
    return styleConfigs.find(s => s.id === id)
  }

  const FilterContent = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm">Architectural Styles</h4>
        {localStyles.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-7 text-xs"
          >
            Clear all
          </Button>
        )}
      </div>

      {!showPopularOnly && (
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground">Show:</Label>
          <Select
            value={filterView}
            onValueChange={(value) => setFilterView(value as 'all' | 'popular')}
          >
            <SelectTrigger className="h-8 text-xs w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Styles</SelectItem>
              <SelectItem value="popular">Popular Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {maxSelections && (
        <p className="text-xs text-muted-foreground">
          Selected {localStyles.length} of {maxSelections} maximum
        </p>
      )}

      <Separator />

      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
        {displayedStyles.map((style) => {
          const isSelected = localStyles.includes(style.id)
          const isDisabled = !isSelected && maxSelections
            ? localStyles.length >= maxSelections
            : false

          return (
            <div
              key={style.id}
              className={`group relative p-3 rounded-lg border transition-all cursor-pointer ${
                isSelected
                  ? 'border-primary bg-primary/5'
                  : isDisabled
                  ? 'border-border opacity-50 cursor-not-allowed'
                  : 'border-border hover:border-primary/50 hover:bg-accent'
              }`}
              onClick={() => !isDisabled && toggleStyle(style.id)}
            >
              <div className="flex items-start gap-3">
                <Checkbox
                  id={`style-${style.id}`}
                  checked={isSelected}
                  onCheckedChange={() => !isDisabled && toggleStyle(style.id)}
                  disabled={isDisabled}
                  className="mt-0.5"
                />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor={`style-${style.id}`}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {style.name}
                    </label>
                    {style.popular && (
                      <Badge variant="secondary" className="h-5 text-xs px-1.5">
                        Popular
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {style.description}
                  </p>
                  {style.tags && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {style.tags.map(tag => (
                        <span
                          key={tag}
                          className="text-xs px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {isSelected && (
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                )}
              </div>
            </div>
          )
        })}
      </div>

      {onApply && variant === 'popover' && (
        <>
          <Separator />
          <Button onClick={handleApply} className="w-full">
            Apply Filters
          </Button>
        </>
      )}
    </div>
  )

  if (variant === 'inline') {
    return (
      <div className={className}>
        <FilterContent />
      </div>
    )
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="relative">
            <Filter className="h-4 w-4 mr-2" />
            Style Filter
            {localStyles.length > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center rounded-full">
                {localStyles.length}
              </Badge>
            )}
            <ChevronDown className="h-3 w-3 ml-2 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96" align="start">
          <FilterContent />
        </PopoverContent>
      </Popover>

      {localStyles.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {localStyles.map(styleId => {
            const config = getStyleConfig(styleId)
            return config ? (
              <Badge key={styleId} variant="secondary" className="gap-1">
                {config.name}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => toggleStyle(styleId)}
                />
              </Badge>
            ) : null
          })}
        </div>
      )}
    </div>
  )
}
