'use client'

import { useState } from 'react'
import { Heart, Download, Eye, Grid3x3, List, Trash2, MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export interface Model {
  id: string
  name: string
  category: string
  thumbnailUrl?: string
  fileFormat: string
  fileSize: number
  downloads: number
  favoriteDate?: Date
  tags?: string[]
}

export interface FavoritesProps {
  models: Model[]
  onUnfavorite?: (modelId: string) => void
  onDownload?: (modelId: string) => void
  onView?: (modelId: string) => void
  loading?: boolean
  emptyMessage?: string
}

type ViewMode = 'grid' | 'list'

export function Favorites({
  models,
  onUnfavorite,
  onDownload,
  onView,
  loading = false,
  emptyMessage = 'No favorite models yet',
}: FavoritesProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [modelToRemove, setModelToRemove] = useState<string | null>(null)

  const handleUnfavorite = (modelId: string) => {
    onUnfavorite?.(modelId)
    setModelToRemove(null)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (date?: Date): string => {
    if (!date) return ''
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Favorite Models</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" disabled>
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="bg-muted h-48 rounded-md mb-4" />
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (models.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Favorite Models</h2>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Heart className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">{emptyMessage}</p>
            <p className="text-sm text-muted-foreground mt-2">
              Browse the model library and save your favorites
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Favorite Models</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {models.length} {models.length === 1 ? 'model' : 'models'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {models.map(model => (
              <Card key={model.id} className="group hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
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
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setModelToRemove(model.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Heart className="h-4 w-4 fill-current" />
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

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{formatFileSize(model.fileSize)}</span>
                      <span>{model.downloads} downloads</span>
                    </div>

                    {model.favoriteDate && (
                      <p className="text-xs text-muted-foreground">
                        Favorited {formatDate(model.favoriteDate)}
                      </p>
                    )}

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
        ) : (
          <div className="space-y-2">
            {models.map(model => (
              <Card key={model.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Thumbnail */}
                    <div className="w-24 h-24 bg-muted rounded-md flex-shrink-0 overflow-hidden">
                      {model.thumbnailUrl ? (
                        <img
                          src={model.thumbnailUrl}
                          alt={model.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
                          No preview
                        </div>
                      )}
                    </div>

                    {/* Model Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg mb-2">{model.name}</h3>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <Badge variant="secondary">{model.category}</Badge>
                        <Badge variant="outline">{model.fileFormat}</Badge>
                        {model.tags?.slice(0, 3).map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{formatFileSize(model.fileSize)}</span>
                        <span>{model.downloads} downloads</span>
                        {model.favoriteDate && (
                          <span>Favorited {formatDate(model.favoriteDate)}</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onView?.(model.id)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => onDownload?.(model.id)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setModelToRemove(model.id)}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove from favorites
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!modelToRemove} onOpenChange={() => setModelToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from favorites?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the model from your favorites list. You can always add it back later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => modelToRemove && handleUnfavorite(modelToRemove)}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
