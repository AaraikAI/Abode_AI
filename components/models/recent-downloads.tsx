'use client'

import { useState } from 'react'
import { Download, Eye, Trash2, FolderOpen, RotateCcw, Clock, FileIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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

export interface DownloadedModel {
  id: string
  name: string
  category: string
  thumbnailUrl?: string
  fileFormat: string
  fileSize: number
  downloadDate: Date
  localPath?: string
  version?: string
}

export interface RecentDownloadsProps {
  models: DownloadedModel[]
  onView?: (modelId: string) => void
  onRedownload?: (modelId: string) => void
  onOpenFolder?: (modelId: string) => void
  onRemoveFromHistory?: (modelId: string) => void
  onClearHistory?: () => void
  loading?: boolean
  maxItems?: number
}

export function RecentDownloads({
  models,
  onView,
  onRedownload,
  onOpenFolder,
  onRemoveFromHistory,
  onClearHistory,
  loading = false,
  maxItems = 10,
}: RecentDownloadsProps) {
  const [modelToRemove, setModelToRemove] = useState<string | null>(null)
  const [showClearDialog, setShowClearDialog] = useState(false)

  const displayModels = models.slice(0, maxItems)

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (date: Date): string => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`

    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    }).format(date)
  }

  const handleRemove = (modelId: string) => {
    onRemoveFromHistory?.(modelId)
    setModelToRemove(null)
  }

  const handleClearHistory = () => {
    onClearHistory?.()
    setShowClearDialog(false)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Downloads</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="w-16 h-16 bg-muted rounded" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/2" />
                  <div className="h-3 bg-muted rounded w-1/3" />
                </div>
              </div>
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
          <CardTitle>Recent Downloads</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Download className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="font-medium text-muted-foreground">No downloads yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Download models from the library to see them here
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Downloads</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {models.length} {models.length === 1 ? 'download' : 'downloads'}
              </p>
            </div>
            {models.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowClearDialog(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear History
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {displayModels.map((model, index) => (
              <div
                key={model.id}
                className={`
                  flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors
                  ${index !== displayModels.length - 1 ? 'border-b' : ''}
                `}
              >
                {/* Thumbnail */}
                <div className="w-16 h-16 bg-muted rounded flex-shrink-0 overflow-hidden">
                  {model.thumbnailUrl ? (
                    <img
                      src={model.thumbnailUrl}
                      alt={model.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <FileIcon className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Model Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold line-clamp-1">{model.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {model.category}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {model.fileFormat}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatFileSize(model.fileSize)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{formatDate(model.downloadDate)}</span>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onView?.(model.id)}
                    title="View model"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRedownload?.(model.id)}
                    title="Redownload"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>

                  {model.localPath && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onOpenFolder?.(model.id)}
                      title="Open folder"
                    >
                      <FolderOpen className="h-4 w-4" />
                    </Button>
                  )}

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onView?.(model.id)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onRedownload?.(model.id)}>
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Redownload
                      </DropdownMenuItem>
                      {model.localPath && (
                        <DropdownMenuItem onClick={() => onOpenFolder?.(model.id)}>
                          <FolderOpen className="h-4 w-4 mr-2" />
                          Open Folder
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setModelToRemove(model.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove from History
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>

          {models.length > maxItems && (
            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">
                Showing {maxItems} of {models.length} downloads
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Remove Single Item Dialog */}
      <AlertDialog open={!!modelToRemove} onOpenChange={() => setModelToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from history?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove this download from your history. The file on your computer will not be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => modelToRemove && handleRemove(modelToRemove)}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear All Dialog */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear download history?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all downloads from your history. Files on your computer will not be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearHistory} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Clear History
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
