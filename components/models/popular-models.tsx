'use client'

import { useState } from 'react'
import { TrendingUp, Download, Eye, Heart, Star, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export interface PopularModel {
  id: string
  name: string
  category: string
  thumbnailUrl?: string
  fileFormat: string
  fileSize: number
  downloads: number
  rating?: number
  reviewCount?: number
  isFavorited?: boolean
  uploadDate?: Date
  trendingScore?: number
}

export interface PopularModelsProps {
  models: PopularModel[]
  onView?: (modelId: string) => void
  onDownload?: (modelId: string) => void
  onToggleFavorite?: (modelId: string) => void
  loading?: boolean
  initialSortBy?: SortOption
  timeRange?: 'day' | 'week' | 'month' | 'all'
  onTimeRangeChange?: (range: 'day' | 'week' | 'month' | 'all') => void
}

type SortOption = 'downloads' | 'rating' | 'trending' | 'recent'

export function PopularModels({
  models,
  onView,
  onDownload,
  onToggleFavorite,
  loading = false,
  initialSortBy = 'downloads',
  timeRange = 'week',
  onTimeRangeChange,
}: PopularModelsProps) {
  const [sortBy, setSortBy] = useState<SortOption>(initialSortBy)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const sortedModels = [...models].sort((a, b) => {
    let comparison = 0

    switch (sortBy) {
      case 'downloads':
        comparison = a.downloads - b.downloads
        break
      case 'rating':
        comparison = (a.rating || 0) - (b.rating || 0)
        break
      case 'trending':
        comparison = (a.trendingScore || 0) - (b.trendingScore || 0)
        break
      case 'recent':
        comparison = (a.uploadDate?.getTime() || 0) - (b.uploadDate?.getTime() || 0)
        break
    }

    return sortOrder === 'desc' ? -comparison : comparison
  })

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
  }

  const getSortLabel = (option: SortOption): string => {
    const labels = {
      downloads: 'Most Downloaded',
      rating: 'Highest Rated',
      trending: 'Trending',
      recent: 'Recently Added',
    }
    return labels[option]
  }

  const getTimeRangeLabel = (range: string): string => {
    const labels = {
      day: 'Today',
      week: 'This Week',
      month: 'This Month',
      all: 'All Time',
    }
    return labels[range as keyof typeof labels] || range
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Popular Models</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="bg-muted h-40 rounded-md mb-4" />
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (models.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Popular Models</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-16">
            <TrendingUp className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">No popular models yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Check back later for trending content
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Popular Models
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {models.length} {models.length === 1 ? 'model' : 'models'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Time Range Selector */}
            <Select value={timeRange} onValueChange={onTimeRangeChange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  {getSortLabel(sortBy)}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSortBy('downloads')}>
                  <Download className="h-4 w-4 mr-2" />
                  Most Downloaded
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('rating')}>
                  <Star className="h-4 w-4 mr-2" />
                  Highest Rated
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('trending')}>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Trending
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('recent')}>
                  Recent
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Sort Order Toggle */}
            <Button variant="outline" size="sm" onClick={toggleSortOrder}>
              {sortOrder === 'desc' ? (
                <ArrowDown className="h-4 w-4" />
              ) : (
                <ArrowUp className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedModels.map((model, index) => (
            <Card key={model.id} className="group hover:shadow-lg transition-shadow relative">
              <CardContent className="p-4">
                {/* Rank Badge */}
                {index < 3 && (
                  <Badge
                    variant="default"
                    className="absolute top-2 left-2 z-10 bg-gradient-to-r from-amber-500 to-amber-600"
                  >
                    #{index + 1}
                  </Badge>
                )}

                {/* Thumbnail */}
                <div className="relative aspect-video bg-muted rounded-md mb-4 overflow-hidden">
                  {model.thumbnailUrl ? (
                    <img
                      src={model.thumbnailUrl}
                      alt={model.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      No preview
                    </div>
                  )}

                  {/* Favorite Button Overlay */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onToggleFavorite?.(model.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Heart
                        className={`h-4 w-4 ${model.isFavorited ? 'fill-current text-red-500' : ''}`}
                      />
                    </Button>
                  </div>
                </div>

                {/* Model Info */}
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-lg line-clamp-1">{model.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary">{model.category}</Badge>
                      <Badge variant="outline">{model.fileFormat}</Badge>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Download className="h-3 w-3" />
                        {model.downloads.toLocaleString()}
                      </span>
                      {model.rating !== undefined && (
                        <span className="flex items-center gap-1 text-amber-500">
                          <Star className="h-3 w-3 fill-current" />
                          {model.rating.toFixed(1)}
                          {model.reviewCount && (
                            <span className="text-muted-foreground text-xs">
                              ({model.reviewCount})
                            </span>
                          )}
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-muted-foreground">
                      {formatFileSize(model.fileSize)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => onView?.(model.id)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1"
                      onClick={() => onDownload?.(model.id)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
