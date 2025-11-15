'use client'

import { useState } from 'react'
import { Grid3x3, List, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

export interface Model {
  id: string
  name: string
  thumbnail: string
  category: string
  polygonCount: number
  fileSize: number
  downloads: number
  rating: number
  author: string
  tags: string[]
}

export interface ModelGridProps {
  models: Model[]
  onModelSelect?: (model: Model) => void
  loading?: boolean
  viewMode?: 'grid' | 'list'
  onViewModeChange?: (mode: 'grid' | 'list') => void
  selectedModelId?: string
}

export function ModelGrid({
  models,
  onModelSelect,
  loading = false,
  viewMode = 'grid',
  onViewModeChange,
  selectedModelId,
}: ModelGridProps) {
  const [localViewMode, setLocalViewMode] = useState<'grid' | 'list'>(viewMode)

  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setLocalViewMode(mode)
    onViewModeChange?.(mode)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (models.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-muted-foreground">
        <Grid3x3 className="h-16 w-16 mb-4 opacity-50" />
        <h3 className="text-lg font-semibold mb-2">No models found</h3>
        <p className="text-sm">Try adjusting your search or filters</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* View Mode Toggle */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {models.length} {models.length === 1 ? 'model' : 'models'}
        </p>
        <div className="flex gap-1">
          <Button
            variant={localViewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleViewModeChange('grid')}
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>
          <Button
            variant={localViewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleViewModeChange('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Models Grid/List */}
      <ScrollArea className="h-[600px]">
        {localViewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {models.map(model => (
              <div
                key={model.id}
                onClick={() => onModelSelect?.(model)}
                className={`
                  border rounded-lg overflow-hidden cursor-pointer transition-all
                  hover:shadow-lg hover:scale-105
                  ${selectedModelId === model.id
                    ? 'ring-2 ring-primary border-primary'
                    : 'hover:border-primary'
                  }
                `}
              >
                <div className="aspect-square bg-muted relative">
                  <img
                    src={model.thumbnail}
                    alt={model.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-sm truncate">{model.name}</h3>
                  <p className="text-xs text-muted-foreground truncate">{model.author}</p>
                  <div className="flex items-center justify-between mt-2 text-xs">
                    <span>{model.polygonCount.toLocaleString()} polys</span>
                    <span>⭐ {model.rating.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {models.map(model => (
              <div
                key={model.id}
                onClick={() => onModelSelect?.(model)}
                className={`
                  border rounded-lg p-4 cursor-pointer transition-all flex gap-4
                  hover:shadow-md
                  ${selectedModelId === model.id
                    ? 'ring-2 ring-primary border-primary bg-primary/5'
                    : 'hover:border-primary'
                  }
                `}
              >
                <div className="w-24 h-24 bg-muted rounded flex-shrink-0">
                  <img
                    src={model.thumbnail}
                    alt={model.name}
                    className="w-full h-full object-cover rounded"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm">{model.name}</h3>
                  <p className="text-xs text-muted-foreground">{model.author}</p>
                  <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                    <span>{model.category}</span>
                    <span>{model.polygonCount.toLocaleString()} polygons</span>
                    <span>{(model.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                    <span>⭐ {model.rating.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
