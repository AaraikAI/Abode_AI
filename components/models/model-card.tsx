'use client'

import { useState } from 'react'
import { Download, Heart, Eye, Star, MoreVertical, Info } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export interface ModelCardProps {
  id: string
  name: string
  author: string
  authorAvatar?: string
  thumbnail: string
  category?: string
  polygons: number
  downloads: number
  rating: number
  ratingCount?: number
  tags?: string[]
  fileFormats?: string[]
  isFavorite?: boolean
  onDownload?: (id: string) => void
  onFavorite?: (id: string) => void
  onView?: (id: string) => void
  onDetails?: (id: string) => void
  className?: string
}

export function ModelCard({
  id,
  name,
  author,
  authorAvatar,
  thumbnail,
  category,
  polygons,
  downloads,
  rating,
  ratingCount = 0,
  tags = [],
  fileFormats = [],
  isFavorite = false,
  onDownload,
  onFavorite,
  onView,
  onDetails,
  className = '',
}: ModelCardProps) {
  const [isImageLoaded, setIsImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [localFavorite, setLocalFavorite] = useState(isFavorite)

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDownload?.(id)
  }

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation()
    setLocalFavorite(!localFavorite)
    onFavorite?.(id)
  }

  const handleView = () => {
    onView?.(id)
  }

  const handleDetails = () => {
    onDetails?.(id)
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num.toString()
  }

  return (
    <Card
      className={`group cursor-pointer hover:shadow-lg transition-shadow ${className}`}
      onClick={handleView}
    >
      <CardHeader className="p-0">
        <div className="relative aspect-square overflow-hidden rounded-t-lg bg-muted">
          {!imageError ? (
            <>
              <img
                src={thumbnail}
                alt={name}
                className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-105 ${
                  isImageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={() => setIsImageLoaded(true)}
                onError={() => setImageError(true)}
              />
              {!isImageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              <Info className="h-12 w-12" />
            </div>
          )}

          {/* Overlay Actions */}
          <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-8 w-8 p-0 bg-background/80 backdrop-blur-sm"
                    onClick={handleFavorite}
                  >
                    <Heart
                      className={`h-4 w-4 ${
                        localFavorite ? 'fill-red-500 text-red-500' : ''
                      }`}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {localFavorite ? 'Remove from favorites' : 'Add to favorites'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-8 w-8 p-0 bg-background/80 backdrop-blur-sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleDetails}>
                  <Info className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Category Badge */}
          {category && (
            <div className="absolute top-2 left-2">
              <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
                {category}
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4">
        <div className="space-y-2">
          {/* Model Name */}
          <h3 className="font-semibold text-lg line-clamp-1" title={name}>
            {name}
          </h3>

          {/* Author */}
          <div className="flex items-center gap-2">
            {authorAvatar ? (
              <img
                src={authorAvatar}
                alt={author}
                className="h-5 w-5 rounded-full object-cover"
              />
            ) : (
              <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-medium text-primary">
                  {author.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <span className="text-sm text-muted-foreground line-clamp-1">
              {author}
            </span>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span>{rating.toFixed(1)}</span>
                    {ratingCount > 0 && (
                      <span className="text-xs">({formatNumber(ratingCount)})</span>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  {ratingCount > 0 ? `${ratingCount} ratings` : 'No ratings yet'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1">
                    <Download className="h-4 w-4" />
                    <span>{formatNumber(downloads)}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  {downloads.toLocaleString()} downloads
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    <span>{formatNumber(polygons)}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  {polygons.toLocaleString()} polygons
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs px-2 py-0">
                  {tag}
                </Badge>
              ))}
              {tags.length > 3 && (
                <Badge variant="outline" className="text-xs px-2 py-0">
                  +{tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <div className="flex gap-2 w-full">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleDetails}
          >
            <Info className="h-4 w-4 mr-2" />
            Details
          </Button>
          <Button
            className="flex-1"
            onClick={handleDownload}
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
