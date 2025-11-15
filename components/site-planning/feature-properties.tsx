'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Trash2, Plus } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'

export interface Feature {
  id: string
  type: 'Point' | 'LineString' | 'Polygon' | 'MultiPoint' | 'MultiLineString' | 'MultiPolygon'
  properties: Record<string, any>
  geometry: any
}

export interface FeaturePropertiesProps {
  feature: Feature | null
  onUpdateFeature?: (feature: Feature) => void
  onDeleteFeature?: (featureId: string) => void
  readOnly?: boolean
}

export function FeatureProperties({
  feature,
  onUpdateFeature,
  onDeleteFeature,
  readOnly = false,
}: FeaturePropertiesProps) {
  const [editedProperties, setEditedProperties] = useState<Record<string, any>>(
    feature?.properties || {}
  )
  const [newPropertyKey, setNewPropertyKey] = useState('')
  const [newPropertyValue, setNewPropertyValue] = useState('')

  if (!feature) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          <p className="text-sm">No feature selected</p>
          <p className="text-xs mt-1">Select a feature to view and edit its properties</p>
        </div>
      </Card>
    )
  }

  const handlePropertyChange = (key: string, value: any) => {
    const updated = { ...editedProperties, [key]: value }
    setEditedProperties(updated)

    if (onUpdateFeature) {
      onUpdateFeature({
        ...feature,
        properties: updated,
      })
    }
  }

  const handleAddProperty = () => {
    if (!newPropertyKey || !newPropertyValue) return

    handlePropertyChange(newPropertyKey, newPropertyValue)
    setNewPropertyKey('')
    setNewPropertyValue('')
  }

  const handleDeleteProperty = (key: string) => {
    const { [key]: _, ...rest } = editedProperties
    setEditedProperties(rest)

    if (onUpdateFeature) {
      onUpdateFeature({
        ...feature,
        properties: rest,
      })
    }
  }

  const getGeometryInfo = () => {
    const { type, geometry } = feature

    if (type === 'Point') {
      return `Point (${geometry.coordinates[0].toFixed(6)}, ${geometry.coordinates[1].toFixed(6)})`
    } else if (type === 'LineString') {
      return `Line with ${geometry.coordinates.length} points`
    } else if (type === 'Polygon') {
      return `Polygon with ${geometry.coordinates[0].length} vertices`
    }

    return type
  }

  return (
    <Card className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm">Feature Properties</h3>
            <p className="text-xs text-muted-foreground mt-1">
              ID: {feature.id}
            </p>
          </div>
          {!readOnly && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDeleteFeature?.(feature.id)}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Geometry Info */}
          <div>
            <Label className="text-xs font-semibold">Geometry</Label>
            <div className="mt-2">
              <Badge variant="secondary">{getGeometryInfo()}</Badge>
            </div>
          </div>

          <Separator />

          {/* Properties */}
          <div>
            <Label className="text-xs font-semibold">Properties</Label>
            <div className="mt-2 space-y-3">
              {Object.entries(editedProperties).map(([key, value]) => (
                <div key={key} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">{key}</Label>
                    {!readOnly && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteProperty(key)}
                        className="h-6 w-6 p-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  {typeof value === 'string' && value.length > 50 ? (
                    <Textarea
                      value={value}
                      onChange={(e) => handlePropertyChange(key, e.target.value)}
                      disabled={readOnly}
                      className="text-xs"
                      rows={3}
                    />
                  ) : (
                    <Input
                      value={String(value)}
                      onChange={(e) => {
                        const newValue = e.target.value
                        // Try to parse as number if it looks like one
                        const parsedValue = !isNaN(Number(newValue)) && newValue !== ''
                          ? Number(newValue)
                          : newValue
                        handlePropertyChange(key, parsedValue)
                      }}
                      disabled={readOnly}
                      className="text-xs"
                    />
                  )}
                </div>
              ))}

              {Object.keys(editedProperties).length === 0 && (
                <p className="text-xs text-muted-foreground italic">
                  No properties defined
                </p>
              )}
            </div>
          </div>

          {/* Add New Property */}
          {!readOnly && (
            <>
              <Separator />
              <div>
                <Label className="text-xs font-semibold mb-2 block">Add Property</Label>
                <div className="space-y-2">
                  <Input
                    placeholder="Property name"
                    value={newPropertyKey}
                    onChange={(e) => setNewPropertyKey(e.target.value)}
                    className="text-xs"
                  />
                  <Input
                    placeholder="Property value"
                    value={newPropertyValue}
                    onChange={(e) => setNewPropertyValue(e.target.value)}
                    className="text-xs"
                  />
                  <Button
                    onClick={handleAddProperty}
                    disabled={!newPropertyKey || !newPropertyValue}
                    size="sm"
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Property
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
