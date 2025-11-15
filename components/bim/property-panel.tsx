'use client'

import { useState } from 'react'
import {
  Settings,
  Info,
  Edit2,
  Save,
  X,
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

export interface IFCProperty {
  name: string
  value: string | number | boolean
  type: 'string' | 'number' | 'boolean' | 'enum'
  unit?: string
  editable: boolean
  options?: string[]
}

export interface IFCPropertySet {
  id: string
  name: string
  description?: string
  properties: IFCProperty[]
  expanded: boolean
}

export interface BIMElementProperties {
  elementId: string
  elementName: string
  elementType: string
  globalId: string
  propertySets: IFCPropertySet[]
}

interface PropertyPanelProps {
  element: BIMElementProperties | null
  onSave?: (elementId: string, updates: Record<string, any>) => void
  onCopyGlobalId?: (globalId: string) => void
  onExport?: (elementId: string) => void
  readOnly?: boolean
}

function PropertySetSection({
  propertySet,
  onToggle,
  onEdit,
  readOnly,
}: {
  propertySet: IFCPropertySet
  onToggle: () => void
  onEdit: (name: string, value: any) => void
  readOnly?: boolean
}) {
  const [editingProperty, setEditingProperty] = useState<string | null>(null)
  const [editValue, setEditValue] = useState<string>('')

  const handleStartEdit = (property: IFCProperty) => {
    setEditingProperty(property.name)
    setEditValue(String(property.value))
  }

  const handleSaveEdit = (propertyName: string) => {
    onEdit(propertyName, editValue)
    setEditingProperty(null)
  }

  const handleCancelEdit = () => {
    setEditingProperty(null)
    setEditValue('')
  }

  return (
    <div className="border rounded-lg">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {propertySet.expanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          <span className="font-medium">{propertySet.name}</span>
          <Badge variant="secondary">{propertySet.properties.length}</Badge>
        </div>
      </button>

      {propertySet.expanded && (
        <div className="p-3 pt-0 space-y-3">
          {propertySet.description && (
            <p className="text-sm text-muted-foreground">{propertySet.description}</p>
          )}
          <div className="space-y-2">
            {propertySet.properties.map((property) => (
              <div key={property.name} className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-normal text-muted-foreground">
                    {property.name}
                  </Label>
                  {property.editable && !readOnly && editingProperty !== property.name && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => handleStartEdit(property)}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                {editingProperty === property.name ? (
                  <div className="flex gap-2">
                    {property.type === 'enum' && property.options ? (
                      <Select value={editValue} onValueChange={setEditValue}>
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {property.options.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        type={property.type === 'number' ? 'number' : 'text'}
                        className="h-8"
                      />
                    )}
                    <Button
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleSaveEdit(property.name)}
                    >
                      <Save className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 w-8 p-0"
                      onClick={handleCancelEdit}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="font-medium text-sm">
                    {String(property.value)}
                    {property.unit && (
                      <span className="text-muted-foreground ml-1">{property.unit}</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function PropertyPanel({
  element,
  onSave,
  onCopyGlobalId,
  onExport,
  readOnly = false,
}: PropertyPanelProps) {
  const [propertySets, setPropertySets] = useState<IFCPropertySet[]>(
    element?.propertySets || []
  )
  const [hasChanges, setHasChanges] = useState(false)
  const [activeTab, setActiveTab] = useState('properties')

  const handleTogglePropertySet = (setId: string) => {
    setPropertySets((sets) =>
      sets.map((set) =>
        set.id === setId ? { ...set, expanded: !set.expanded } : set
      )
    )
  }

  const handleEditProperty = (setId: string, propertyName: string, value: any) => {
    setPropertySets((sets) =>
      sets.map((set) =>
        set.id === setId
          ? {
              ...set,
              properties: set.properties.map((prop) =>
                prop.name === propertyName ? { ...prop, value } : prop
              ),
            }
          : set
      )
    )
    setHasChanges(true)
  }

  const handleSave = () => {
    if (element && hasChanges) {
      const updates: Record<string, any> = {}
      propertySets.forEach((set) => {
        set.properties.forEach((prop) => {
          updates[`${set.name}.${prop.name}`] = prop.value
        })
      })
      onSave?.(element.elementId, updates)
      setHasChanges(false)
    }
  }

  const handleReset = () => {
    if (element) {
      setPropertySets(element.propertySets)
      setHasChanges(false)
    }
  }

  if (!element) {
    return (
      <Card className="p-6 h-full flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <Info className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Select an element to view properties</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-4 h-full flex flex-col">
      <div className="space-y-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            <h3 className="font-semibold text-lg">Properties</h3>
          </div>
          <div className="flex items-center gap-2">
            {hasChanges && !readOnly && (
              <>
                <Button variant="outline" size="sm" onClick={handleReset}>
                  <X className="h-4 w-4 mr-1" />
                  Reset
                </Button>
                <Button size="sm" onClick={handleSave}>
                  <Save className="h-4 w-4 mr-1" />
                  Save
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div>
            <p className="text-sm text-muted-foreground">Element Name</p>
            <p className="font-medium">{element.elementName}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Element Type</p>
            <Badge variant="outline">{element.elementType}</Badge>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Global ID</p>
            <div className="flex items-center gap-2">
              <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate">
                {element.globalId}
              </code>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => onCopyGlobalId?.(element.globalId)}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>

        {readOnly && (
          <div className="bg-amber-500/10 text-amber-900 dark:text-amber-100 px-3 py-2 rounded-md text-sm">
            Read-only mode: Properties cannot be edited
          </div>
        )}
      </div>

      <Separator className="my-4" />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="properties">IFC Properties</TabsTrigger>
          <TabsTrigger value="metadata">Metadata</TabsTrigger>
        </TabsList>

        <TabsContent value="properties" className="flex-1 mt-4">
          <ScrollArea className="h-full -mx-4 px-4">
            <div className="space-y-3">
              {propertySets.map((set) => (
                <PropertySetSection
                  key={set.id}
                  propertySet={set}
                  onToggle={() => handleTogglePropertySet(set.id)}
                  onEdit={(name, value) => handleEditProperty(set.id, name, value)}
                  readOnly={readOnly}
                />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="metadata" className="flex-1 mt-4">
          <ScrollArea className="h-full -mx-4 px-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Add element description..."
                  className="mt-2"
                  readOnly={readOnly}
                />
              </div>
              <div>
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  placeholder="Add tags..."
                  className="mt-2"
                  readOnly={readOnly}
                />
              </div>
              <Button variant="outline" className="w-full" onClick={() => onExport?.(element.elementId)}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Export Properties
              </Button>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </Card>
  )
}
