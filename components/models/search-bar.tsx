'use client'

import { useState } from 'react'
import { Search, X, Filter, SlidersHorizontal } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'

export interface SearchFilters {
  categories?: string[]
  styles?: string[]
  tags?: string[]
  minPolygons?: number
  maxPolygons?: number
  fileFormats?: string[]
}

export interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  onSearch?: (query: string, filters?: SearchFilters) => void
  placeholder?: string
  filters?: SearchFilters
  onFiltersChange?: (filters: SearchFilters) => void
  showAdvancedFilters?: boolean
}

const categories = ['Furniture', 'Lighting', 'Fixtures', 'Appliances', 'Decor']
const fileFormats = ['GLB', 'FBX', 'OBJ', 'USD', 'GLTF']

export function SearchBar({
  value,
  onChange,
  onSearch,
  placeholder = 'Search models...',
  filters = {},
  onFiltersChange,
  showAdvancedFilters = true,
}: SearchBarProps) {
  const [localFilters, setLocalFilters] = useState<SearchFilters>(filters)

  const handleSearch = () => {
    onSearch?.(value, localFilters)
  }

  const handleClear = () => {
    onChange('')
    setLocalFilters({})
    onFiltersChange?.({})
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const toggleFilter = <K extends keyof SearchFilters>(
    key: K,
    value: string
  ) => {
    const currentValues = (localFilters[key] as string[]) || []
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value]

    const updated = { ...localFilters, [key]: newValues }
    setLocalFilters(updated)
    onFiltersChange?.(updated)
  }

  const activeFilterCount = Object.values(localFilters).filter(
    v => Array.isArray(v) && v.length > 0
  ).length

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            className="pl-10 pr-10"
          />
          {value && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <Button onClick={handleSearch}>
          Search
        </Button>

        {showAdvancedFilters && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="relative">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center rounded-full">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm mb-3">Advanced Filters</h4>
                </div>

                {/* Categories */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Categories</Label>
                  <div className="space-y-2">
                    {categories.map(category => (
                      <div key={category} className="flex items-center space-x-2">
                        <Checkbox
                          id={`category-${category}`}
                          checked={localFilters.categories?.includes(category)}
                          onCheckedChange={() => toggleFilter('categories', category)}
                        />
                        <label
                          htmlFor={`category-${category}`}
                          className="text-sm cursor-pointer"
                        >
                          {category}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* File Formats */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">File Formats</Label>
                  <div className="space-y-2">
                    {fileFormats.map(format => (
                      <div key={format} className="flex items-center space-x-2">
                        <Checkbox
                          id={`format-${format}`}
                          checked={localFilters.fileFormats?.includes(format)}
                          onCheckedChange={() => toggleFilter('fileFormats', format)}
                        />
                        <label
                          htmlFor={`format-${format}`}
                          className="text-sm cursor-pointer"
                        >
                          {format}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* Active Filters */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {localFilters.categories?.map(cat => (
            <Badge key={cat} variant="secondary">
              {cat}
              <X
                className="h-3 w-3 ml-1 cursor-pointer"
                onClick={() => toggleFilter('categories', cat)}
              />
            </Badge>
          ))}
          {localFilters.fileFormats?.map(format => (
            <Badge key={format} variant="secondary">
              {format}
              <X
                className="h-3 w-3 ml-1 cursor-pointer"
                onClick={() => toggleFilter('fileFormats', format)}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
