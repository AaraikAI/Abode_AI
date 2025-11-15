'use client'

/**
 * Render History Component
 *
 * Previous renders with thumbnails, settings, and re-render option
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
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
import {
  History,
  Download,
  Share2,
  RotateCcw,
  Trash2,
  Eye,
  MoreVertical,
  Search,
  Filter,
  Calendar,
  Clock,
  Image as ImageIcon,
} from 'lucide-react'

export interface RenderHistoryItem {
  id: string
  name: string
  thumbnailUrl: string
  outputUrl: string
  createdAt: Date
  renderTime: number // in seconds
  quality: string
  resolution: string
  samples: number
  engine: 'CYCLES' | 'EEVEE'
  settings: any
  fileSize: number // in bytes
  tags?: string[]
}

interface RenderHistoryProps {
  projectId: string
  items?: RenderHistoryItem[]
  onView?: (item: RenderHistoryItem) => void
  onReRender?: (item: RenderHistoryItem) => void
  onDownload?: (item: RenderHistoryItem) => void
  onShare?: (item: RenderHistoryItem) => void
  onDelete?: (itemId: string) => void
}

type SortBy = 'date-desc' | 'date-asc' | 'name-asc' | 'name-desc' | 'size-desc' | 'size-asc'
type FilterBy = 'all' | 'draft' | 'medium' | 'high' | 'ultra'

export function RenderHistory({
  projectId,
  items: initialItems = [],
  onView,
  onReRender,
  onDownload,
  onShare,
  onDelete,
}: RenderHistoryProps) {
  const [items, setItems] = useState<RenderHistoryItem[]>(initialItems)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortBy>('date-desc')
  const [filterBy, setFilterBy] = useState<FilterBy>('all')
  const [selectedItem, setSelectedItem] = useState<RenderHistoryItem | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Fetch history from API
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch(`/api/render/history?projectId=${projectId}`)
        if (response.ok) {
          const data = await response.json()
          setItems(data.items)
        }
      } catch (error) {
        console.error('Failed to fetch render history:', error)
      }
    }

    fetchHistory()
  }, [projectId])

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
  }

  const formatRenderTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)

    if (hours > 0) return `${hours}h ${minutes}m`
    if (minutes > 0) return `${minutes}m ${secs}s`
    return `${secs}s`
  }

  const formatDate = (date: Date): string => {
    const now = new Date()
    const diff = now.getTime() - new Date(date).getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days} days ago`

    return new Date(date).toLocaleDateString()
  }

  const handleDeleteClick = (item: RenderHistoryItem) => {
    setSelectedItem(item)
    setShowDeleteDialog(true)
  }

  const handleConfirmDelete = () => {
    if (selectedItem) {
      onDelete?.(selectedItem.id)
      setItems(items.filter((item) => item.id !== selectedItem.id))
      setShowDeleteDialog(false)
      setSelectedItem(null)
    }
  }

  // Filter and sort items
  const filteredAndSortedItems = items
    .filter((item) => {
      // Search filter
      if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }

      // Quality filter
      if (filterBy !== 'all' && item.quality.toLowerCase() !== filterBy) {
        return false
      }

      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'date-asc':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case 'name-asc':
          return a.name.localeCompare(b.name)
        case 'name-desc':
          return b.name.localeCompare(a.name)
        case 'size-desc':
          return b.fileSize - a.fileSize
        case 'size-asc':
          return a.fileSize - b.fileSize
        default:
          return 0
      }
    })

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Render History
              </CardTitle>
              <CardDescription>
                {items.length} render{items.length !== 1 ? 's' : ''} in history
              </CardDescription>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex gap-2 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search renders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={filterBy} onValueChange={(value: FilterBy) => setFilterBy(value)}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Quality</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="ultra">Ultra</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value: SortBy) => setSortBy(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Newest First</SelectItem>
                <SelectItem value="date-asc">Oldest First</SelectItem>
                <SelectItem value="name-asc">Name A-Z</SelectItem>
                <SelectItem value="name-desc">Name Z-A</SelectItem>
                <SelectItem value="size-desc">Largest First</SelectItem>
                <SelectItem value="size-asc">Smallest First</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          {filteredAndSortedItems.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>
                {items.length === 0
                  ? 'No renders in history yet'
                  : 'No renders match your search'}
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[600px] pr-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAndSortedItems.map((item) => (
                  <div
                    key={item.id}
                    className="group border rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => onView?.(item)}
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-video bg-muted">
                      <img
                        src={item.thumbnailUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation()
                            onView?.(item)
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </div>

                      {/* Quality Badge */}
                      <div className="absolute top-2 right-2">
                        <Badge variant="secondary" className="capitalize">
                          {item.quality}
                        </Badge>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold line-clamp-1">{item.name}</h4>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                onView?.(item)
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Full Size
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                onReRender?.(item)
                              }}
                            >
                              <RotateCcw className="h-4 w-4 mr-2" />
                              Re-render
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                onDownload?.(item)
                              }}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                onShare?.(item)
                              }}
                            >
                              <Share2 className="h-4 w-4 mr-2" />
                              Share
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteClick(item)
                              }}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(item.createdAt)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatRenderTime(item.renderTime)}
                        </div>
                      </div>

                      <div className="flex gap-2 text-xs">
                        <Badge variant="outline">{item.resolution}</Badge>
                        <Badge variant="outline">{item.samples} samples</Badge>
                        <Badge variant="outline">{item.engine}</Badge>
                      </div>

                      <div className="text-xs text-muted-foreground">
                        {formatFileSize(item.fileSize)}
                      </div>

                      {/* Tags */}
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {item.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Render?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedItem?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
