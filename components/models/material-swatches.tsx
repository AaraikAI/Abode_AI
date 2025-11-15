'use client'

import { useState } from 'react'
import { Check, Info, Palette } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export interface MaterialProperties {
  color: string
  texture?: string
  roughness: number
  metallic: number
  opacity?: number
  normalMap?: string
}

export interface MaterialSwatch {
  id: string
  name: string
  category: 'wood' | 'metal' | 'fabric' | 'stone' | 'glass' | 'plastic' | 'concrete'
  properties: MaterialProperties
  thumbnail?: string
}

export interface MaterialSwatchesProps {
  swatches?: MaterialSwatch[]
  selectedSwatch?: MaterialSwatch | null
  onSwatchSelect?: (swatch: MaterialSwatch) => void
  onPropertiesChange?: (properties: MaterialProperties) => void
  showPropertyEditor?: boolean
  allowCustomProperties?: boolean
  columns?: number
  className?: string
}

const defaultSwatches: MaterialSwatch[] = [
  {
    id: 'oak-wood',
    name: 'Oak Wood',
    category: 'wood',
    properties: { color: '#C19A6B', roughness: 0.8, metallic: 0.0 },
  },
  {
    id: 'walnut-wood',
    name: 'Walnut',
    category: 'wood',
    properties: { color: '#5C4033', roughness: 0.7, metallic: 0.0 },
  },
  {
    id: 'brushed-steel',
    name: 'Brushed Steel',
    category: 'metal',
    properties: { color: '#B8B8B8', roughness: 0.3, metallic: 0.9 },
  },
  {
    id: 'copper',
    name: 'Copper',
    category: 'metal',
    properties: { color: '#B87333', roughness: 0.4, metallic: 0.95 },
  },
  {
    id: 'gold',
    name: 'Gold',
    category: 'metal',
    properties: { color: '#FFD700', roughness: 0.2, metallic: 1.0 },
  },
  {
    id: 'linen-fabric',
    name: 'Linen',
    category: 'fabric',
    properties: { color: '#E8E4D0', roughness: 0.9, metallic: 0.0 },
  },
  {
    id: 'velvet-fabric',
    name: 'Velvet',
    category: 'fabric',
    properties: { color: '#2E1A47', roughness: 0.85, metallic: 0.0 },
  },
  {
    id: 'marble',
    name: 'Marble',
    category: 'stone',
    properties: { color: '#F5F5F5', roughness: 0.1, metallic: 0.0 },
  },
  {
    id: 'granite',
    name: 'Granite',
    category: 'stone',
    properties: { color: '#4A4A4A', roughness: 0.5, metallic: 0.0 },
  },
  {
    id: 'clear-glass',
    name: 'Clear Glass',
    category: 'glass',
    properties: { color: '#FFFFFF', roughness: 0.0, metallic: 0.0, opacity: 0.2 },
  },
  {
    id: 'frosted-glass',
    name: 'Frosted Glass',
    category: 'glass',
    properties: { color: '#E8F4F8', roughness: 0.6, metallic: 0.0, opacity: 0.5 },
  },
  {
    id: 'white-plastic',
    name: 'White Plastic',
    category: 'plastic',
    properties: { color: '#FFFFFF', roughness: 0.4, metallic: 0.0 },
  },
  {
    id: 'black-plastic',
    name: 'Black Plastic',
    category: 'plastic',
    properties: { color: '#1A1A1A', roughness: 0.35, metallic: 0.0 },
  },
  {
    id: 'polished-concrete',
    name: 'Polished Concrete',
    category: 'concrete',
    properties: { color: '#808080', roughness: 0.3, metallic: 0.0 },
  },
  {
    id: 'rough-concrete',
    name: 'Rough Concrete',
    category: 'concrete',
    properties: { color: '#6B6B6B', roughness: 0.95, metallic: 0.0 },
  },
]

export function MaterialSwatches({
  swatches = defaultSwatches,
  selectedSwatch = null,
  onSwatchSelect,
  onPropertiesChange,
  showPropertyEditor = true,
  allowCustomProperties = true,
  columns = 5,
  className = '',
}: MaterialSwatchesProps) {
  const [localSwatch, setLocalSwatch] = useState<MaterialSwatch | null>(selectedSwatch)
  const [customProperties, setCustomProperties] = useState<MaterialProperties | null>(null)

  const handleSwatchClick = (swatch: MaterialSwatch) => {
    setLocalSwatch(swatch)
    setCustomProperties(null)
    onSwatchSelect?.(swatch)
    onPropertiesChange?.(swatch.properties)
  }

  const handlePropertyChange = (
    property: keyof MaterialProperties,
    value: number | string
  ) => {
    if (!localSwatch) return

    const updated: MaterialProperties = {
      ...(customProperties || localSwatch.properties),
      [property]: value,
    }

    setCustomProperties(updated)
    onPropertiesChange?.(updated)
  }

  const currentProperties = customProperties || localSwatch?.properties

  const getCategoryLabel = (category: MaterialSwatch['category']) => {
    return category.charAt(0).toUpperCase() + category.slice(1)
  }

  const groupedSwatches = swatches.reduce((acc, swatch) => {
    if (!acc[swatch.category]) {
      acc[swatch.category] = []
    }
    acc[swatch.category].push(swatch)
    return acc
  }, {} as Record<string, MaterialSwatch[]>)

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Material Swatches</h3>
        </div>
        {localSwatch && (
          <Badge variant="secondary">
            {localSwatch.name}
          </Badge>
        )}
      </div>

      <div className="space-y-6">
        {Object.entries(groupedSwatches).map(([category, categorySwatches]) => (
          <div key={category}>
            <Label className="text-sm font-medium mb-3 block">
              {getCategoryLabel(category as MaterialSwatch['category'])}
            </Label>
            <div
              className="grid gap-3"
              style={{
                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
              }}
            >
              {categorySwatches.map((swatch) => (
                <TooltipProvider key={swatch.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => handleSwatchClick(swatch)}
                        className={`relative aspect-square rounded-lg border-2 transition-all hover:scale-105 ${
                          localSwatch?.id === swatch.id
                            ? 'border-primary ring-2 ring-primary ring-offset-2'
                            : 'border-border hover:border-primary/50'
                        }`}
                        style={{
                          backgroundColor: swatch.properties.color,
                        }}
                        aria-label={`Select ${swatch.name} material`}
                      >
                        {localSwatch?.id === swatch.id && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="rounded-full bg-primary p-1">
                              <Check className="h-4 w-4 text-primary-foreground" />
                            </div>
                          </div>
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-xs space-y-1">
                        <p className="font-semibold">{swatch.name}</p>
                        <p>Roughness: {swatch.properties.roughness.toFixed(2)}</p>
                        <p>Metallic: {swatch.properties.metallic.toFixed(2)}</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </div>
        ))}
      </div>

      {showPropertyEditor && localSwatch && allowCustomProperties && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              Material Properties
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="start">
                  <div className="space-y-2 text-sm">
                    <p><strong>Roughness:</strong> Controls surface smoothness. 0 = mirror-like, 1 = very rough</p>
                    <p><strong>Metallic:</strong> Defines metallic appearance. 0 = non-metal, 1 = pure metal</p>
                    <p><strong>Opacity:</strong> Controls transparency. 0 = invisible, 1 = fully opaque</p>
                  </div>
                </PopoverContent>
              </Popover>
            </CardTitle>
            <CardDescription>
              Adjust material properties for {localSwatch.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Color */}
            <div className="space-y-2">
              <Label className="text-sm flex items-center justify-between">
                <span>Color</span>
                <span className="text-xs text-muted-foreground font-mono">
                  {currentProperties?.color}
                </span>
              </Label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={currentProperties?.color || '#FFFFFF'}
                  onChange={(e) => handlePropertyChange('color', e.target.value)}
                  className="h-10 w-20 rounded cursor-pointer border border-input"
                />
                <div
                  className="flex-1 h-10 rounded border border-input"
                  style={{ backgroundColor: currentProperties?.color }}
                />
              </div>
            </div>

            {/* Roughness */}
            <div className="space-y-2">
              <Label className="text-sm flex items-center justify-between">
                <span>Roughness</span>
                <span className="text-xs text-muted-foreground">
                  {currentProperties?.roughness.toFixed(2)}
                </span>
              </Label>
              <Slider
                value={[currentProperties?.roughness || 0]}
                onValueChange={([value]) => handlePropertyChange('roughness', value)}
                min={0}
                max={1}
                step={0.01}
                className="w-full"
              />
            </div>

            {/* Metallic */}
            <div className="space-y-2">
              <Label className="text-sm flex items-center justify-between">
                <span>Metallic</span>
                <span className="text-xs text-muted-foreground">
                  {currentProperties?.metallic.toFixed(2)}
                </span>
              </Label>
              <Slider
                value={[currentProperties?.metallic || 0]}
                onValueChange={([value]) => handlePropertyChange('metallic', value)}
                min={0}
                max={1}
                step={0.01}
                className="w-full"
              />
            </div>

            {/* Opacity (if applicable) */}
            {(currentProperties?.opacity !== undefined || localSwatch.category === 'glass') && (
              <div className="space-y-2">
                <Label className="text-sm flex items-center justify-between">
                  <span>Opacity</span>
                  <span className="text-xs text-muted-foreground">
                    {(currentProperties?.opacity !== undefined
                      ? currentProperties.opacity
                      : 1.0
                    ).toFixed(2)}
                  </span>
                </Label>
                <Slider
                  value={[currentProperties?.opacity !== undefined ? currentProperties.opacity : 1.0]}
                  onValueChange={([value]) => handlePropertyChange('opacity', value)}
                  min={0}
                  max={1}
                  step={0.01}
                  className="w-full"
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
