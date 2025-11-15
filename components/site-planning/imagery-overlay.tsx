'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Image, Layers, Eye, EyeOff, RotateCw, Move, ZoomIn } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'

export interface ImageryLayer {
  id: string
  name: string
  url: string
  type: 'satellite' | 'aerial' | 'map' | 'custom'
  visible: boolean
  opacity: number
  bounds?: {
    north: number
    south: number
    east: number
    west: number
  }
}

export interface ImageryOverlayProps {
  layers: ImageryLayer[]
  onLayerUpdate?: (layer: ImageryLayer) => void
  onLayerToggle?: (layerId: string, visible: boolean) => void
  onLayerOpacityChange?: (layerId: string, opacity: number) => void
  onAddLayer?: () => void
  onRemoveLayer?: (layerId: string) => void
  baseMapType?: 'roadmap' | 'satellite' | 'hybrid' | 'terrain'
  onBaseMapChange?: (type: 'roadmap' | 'satellite' | 'hybrid' | 'terrain') => void
}

export function ImageryOverlay({
  layers,
  onLayerUpdate,
  onLayerToggle,
  onLayerOpacityChange,
  onAddLayer,
  onRemoveLayer,
  baseMapType = 'satellite',
  onBaseMapChange,
}: ImageryOverlayProps) {
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(
    layers[0]?.id || null
  )

  const selectedLayer = layers.find(l => l.id === selectedLayerId)

  return (
    <Card className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            <h3 className="font-semibold text-sm">Imagery Overlay</h3>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onAddLayer}
          >
            <Image className="h-4 w-4 mr-1" />
            Add Layer
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Base Map Selection */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Base Map</Label>
            <Select value={baseMapType} onValueChange={onBaseMapChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="roadmap">Roadmap</SelectItem>
                <SelectItem value="satellite">Satellite</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
                <SelectItem value="terrain">Terrain</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Overlay Layers */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Overlay Layers</Label>
            <div className="space-y-2">
              {layers.map(layer => (
                <Card
                  key={layer.id}
                  className={`p-3 cursor-pointer transition-colors ${
                    selectedLayerId === layer.id
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedLayerId(layer.id)}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={layer.visible}
                          onCheckedChange={(checked) =>
                            onLayerToggle?.(layer.id, checked)
                          }
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div>
                          <p className="text-sm font-medium">{layer.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {layer.type}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          onLayerToggle?.(layer.id, !layer.visible)
                        }}
                      >
                        {layer.visible ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeOff className="h-4 w-4" />
                        )}
                      </Button>
                    </div>

                    {/* Opacity Slider */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <Label className="text-xs">Opacity</Label>
                        <span className="text-xs text-muted-foreground">
                          {Math.round(layer.opacity * 100)}%
                        </span>
                      </div>
                      <Slider
                        value={[layer.opacity * 100]}
                        onValueChange={([value]) =>
                          onLayerOpacityChange?.(layer.id, value / 100)
                        }
                        min={0}
                        max={100}
                        step={1}
                        disabled={!layer.visible}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                </Card>
              ))}

              {layers.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Image className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No overlay layers</p>
                  <p className="text-xs mt-1">Add a layer to get started</p>
                </div>
              )}
            </div>
          </div>

          {/* Selected Layer Details */}
          {selectedLayer && (
            <>
              <Separator />
              <div className="space-y-3">
                <Label className="text-xs font-semibold">Layer Details</Label>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="font-medium">Name:</span>
                    <p className="text-muted-foreground mt-1">{selectedLayer.name}</p>
                  </div>
                  <div>
                    <span className="font-medium">Type:</span>
                    <p className="text-muted-foreground mt-1 capitalize">
                      {selectedLayer.type}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">URL:</span>
                    <p className="text-muted-foreground mt-1 break-all">
                      {selectedLayer.url}
                    </p>
                  </div>

                  {selectedLayer.bounds && (
                    <div>
                      <span className="font-medium">Bounds:</span>
                      <div className="text-muted-foreground mt-1 space-y-1">
                        <p>North: {selectedLayer.bounds.north.toFixed(6)}</p>
                        <p>South: {selectedLayer.bounds.south.toFixed(6)}</p>
                        <p>East: {selectedLayer.bounds.east.toFixed(6)}</p>
                        <p>West: {selectedLayer.bounds.west.toFixed(6)}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Fit bounds logic would go here
                    }}
                  >
                    <ZoomIn className="h-4 w-4 mr-1" />
                    Fit Bounds
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRemoveLayer?.(selectedLayer.id)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </Card>
  )
}
