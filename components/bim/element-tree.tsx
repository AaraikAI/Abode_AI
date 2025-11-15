'use client'

import { useState } from 'react'
import {
  ChevronRight,
  ChevronDown,
  Building2,
  Layers,
  Box,
  Eye,
  EyeOff,
  Search,
  Filter,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'

export interface BIMElement {
  id: string
  name: string
  type: 'project' | 'site' | 'building' | 'story' | 'space' | 'element'
  category?: string
  children?: BIMElement[]
  visible: boolean
  selected: boolean
  metadata?: {
    elementCount?: number
    area?: number
    volume?: number
  }
}

interface ElementTreeProps {
  elements: BIMElement[]
  selectedIds?: string[]
  onSelect?: (elementIds: string[]) => void
  onVisibilityToggle?: (elementId: string, visible: boolean) => void
  onFocus?: (elementId: string) => void
  showMetadata?: boolean
}

function TreeNode({
  element,
  level = 0,
  isSelected,
  onSelect,
  onVisibilityToggle,
  onFocus,
  showMetadata,
}: {
  element: BIMElement
  level?: number
  isSelected: boolean
  onSelect: (id: string, checked: boolean) => void
  onVisibilityToggle: (id: string, visible: boolean) => void
  onFocus: (id: string) => void
  showMetadata?: boolean
}) {
  const [isExpanded, setIsExpanded] = useState(level < 2)
  const hasChildren = element.children && element.children.length > 0

  const getIcon = () => {
    switch (element.type) {
      case 'project':
      case 'building':
        return <Building2 className="h-4 w-4" />
      case 'story':
        return <Layers className="h-4 w-4" />
      default:
        return <Box className="h-4 w-4" />
    }
  }

  const getCategoryColor = (category?: string) => {
    const colors: Record<string, string> = {
      'Walls': 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
      'Floors': 'bg-green-500/10 text-green-700 dark:text-green-300',
      'Roofs': 'bg-red-500/10 text-red-700 dark:text-red-300',
      'Columns': 'bg-purple-500/10 text-purple-700 dark:text-purple-300',
      'Doors': 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-300',
      'Windows': 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300',
    }
    return category ? colors[category] || 'bg-gray-500/10 text-gray-700 dark:text-gray-300' : ''
  }

  return (
    <div>
      <div
        className={`flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-muted/50 group ${
          isSelected ? 'bg-primary/10' : ''
        }`}
        style={{ paddingLeft: `${level * 20 + 8}px` }}
      >
        {hasChildren ? (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-0.5 hover:bg-muted rounded"
          >
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </button>
        ) : (
          <div className="w-4" />
        )}

        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => onSelect(element.id, checked as boolean)}
          className="h-4 w-4"
        />

        <div className="flex items-center gap-2 flex-1 min-w-0">
          {getIcon()}
          <span className="text-sm font-medium truncate">{element.name}</span>
          {element.category && (
            <Badge variant="outline" className={`text-xs ${getCategoryColor(element.category)}`}>
              {element.category}
            </Badge>
          )}
          {showMetadata && element.metadata?.elementCount && (
            <span className="text-xs text-muted-foreground">
              ({element.metadata.elementCount})
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => onVisibilityToggle(element.id, !element.visible)}
          >
            {element.visible ? (
              <Eye className="h-3.5 w-3.5" />
            ) : (
              <EyeOff className="h-3.5 w-3.5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => onFocus(element.id)}
          >
            <Search className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div>
          {element.children!.map((child) => (
            <TreeNode
              key={child.id}
              element={child}
              level={level + 1}
              isSelected={isSelected}
              onSelect={onSelect}
              onVisibilityToggle={onVisibilityToggle}
              onFocus={onFocus}
              showMetadata={showMetadata}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function ElementTree({
  elements,
  selectedIds = [],
  onSelect,
  onVisibilityToggle,
  onFocus,
  showMetadata = true,
}: ElementTreeProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('all')

  const handleSelect = (id: string, checked: boolean) => {
    const newSelection = checked
      ? [...selectedIds, id]
      : selectedIds.filter((selectedId) => selectedId !== id)
    onSelect?.(newSelection)
  }

  const handleVisibilityToggle = (id: string, visible: boolean) => {
    onVisibilityToggle?.(id, visible)
  }

  const handleFocus = (id: string) => {
    onFocus?.(id)
  }

  const filterElements = (elements: BIMElement[]): BIMElement[] => {
    return elements
      .filter((element) => {
        const matchesSearch = element.name.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesType = filterType === 'all' || element.type === filterType
        return matchesSearch && matchesType
      })
      .map((element) => ({
        ...element,
        children: element.children ? filterElements(element.children) : undefined,
      }))
  }

  const filteredElements = searchQuery || filterType !== 'all'
    ? filterElements(elements)
    : elements

  const totalElements = elements.reduce((count, element) => {
    const countChildren = (el: BIMElement): number => {
      return 1 + (el.children?.reduce((sum, child) => sum + countChildren(child), 0) || 0)
    }
    return count + countChildren(element)
  }, 0)

  return (
    <Card className="p-4 h-full flex flex-col">
      <div className="space-y-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            <h3 className="font-semibold text-lg">Building Elements</h3>
          </div>
          <Badge variant="secondary">{totalElements} items</Badge>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search elements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter by Type</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setFilterType('all')}>
                All Types
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType('building')}>
                Buildings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType('story')}>
                Stories
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType('space')}>
                Spaces
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType('element')}>
                Elements
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {selectedIds.length} selected
          </span>
          {selectedIds.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSelect?.([])}
              className="h-7 text-xs"
            >
              Clear Selection
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1 -mx-4 px-4 mt-4">
        {filteredElements.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Layers className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No elements found</p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {filteredElements.map((element) => (
              <TreeNode
                key={element.id}
                element={element}
                isSelected={selectedIds.includes(element.id)}
                onSelect={handleSelect}
                onVisibilityToggle={handleVisibilityToggle}
                onFocus={handleFocus}
                showMetadata={showMetadata}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </Card>
  )
}
