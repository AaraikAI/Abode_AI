'use client'

import { useState } from 'react'
import {
  Download,
  Heart,
  Share2,
  Star,
  User,
  Calendar,
  Box,
  File,
  Tag,
  Info,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'

export interface ModelDetailsProps {
  id: string
  name: string
  description: string
  author: {
    name: string
    avatar?: string
    bio?: string
    website?: string
    modelsCount?: number
  }
  category: string
  tags: string[]
  polygons: number
  vertices?: number
  fileSize?: number
  fileFormats: Array<{
    format: string
    size: number
    url?: string
  }>
  downloads: number
  views?: number
  favorites?: number
  rating: number
  ratingCount: number
  ratingDistribution?: {
    5: number
    4: number
    3: number
    2: number
    1: number
  }
  license?: string
  createdAt: Date
  updatedAt?: Date
  isFavorite?: boolean
  images?: string[]
  technicalSpecs?: Record<string, string | number>
  onDownload?: (format: string) => void
  onFavorite?: () => void
  onShare?: () => void
  className?: string
}

export function ModelDetails({
  id,
  name,
  description,
  author,
  category,
  tags,
  polygons,
  vertices,
  fileSize,
  fileFormats,
  downloads,
  views = 0,
  favorites = 0,
  rating,
  ratingCount,
  ratingDistribution,
  license = 'Creative Commons',
  createdAt,
  updatedAt,
  isFavorite = false,
  images = [],
  technicalSpecs = {},
  onDownload,
  onFavorite,
  onShare,
  className = '',
}: ModelDetailsProps) {
  const [localFavorite, setLocalFavorite] = useState(isFavorite)
  const [copied, setCopied] = useState(false)
  const [selectedFormat, setSelectedFormat] = useState(fileFormats[0]?.format || 'GLB')

  const handleFavorite = () => {
    setLocalFavorite(!localFavorite)
    onFavorite?.()
  }

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      onShare?.()
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleDownload = () => {
    onDownload?.(selectedFormat)
  }

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date)
  }

  const getRatingPercentage = (stars: number): number => {
    if (!ratingDistribution || ratingCount === 0) return 0
    return (ratingDistribution[stars as keyof typeof ratingDistribution] / ratingCount) * 100
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">{name}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="outline">{category}</Badge>
              <Separator orientation="vertical" className="h-4" />
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium text-foreground">
                  {rating.toFixed(1)}
                </span>
                <span>({ratingCount.toLocaleString()} ratings)</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
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

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={handleShare}>
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Share2 className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {copied ? 'Link copied!' : 'Share model'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-6 text-sm">
          <div className="flex items-center gap-2">
            <Download className="h-4 w-4 text-muted-foreground" />
            <span>{downloads.toLocaleString()} downloads</span>
          </div>
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-muted-foreground" />
            <span>{favorites.toLocaleString()} favorites</span>
          </div>
          {views > 0 && (
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-muted-foreground" />
              <span>{views.toLocaleString()} views</span>
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="description" className="w-full">
            <TabsList>
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="specs">Technical Specs</TabsTrigger>
              <TabsTrigger value="ratings">Ratings</TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">About this model</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {description}
                  </p>
                </CardContent>
              </Card>

              {/* Tags */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Tags
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="specs" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Technical Specifications</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-3">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Polygons</dt>
                      <dd className="font-medium">{polygons.toLocaleString()}</dd>
                    </div>
                    {vertices && (
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Vertices</dt>
                        <dd className="font-medium">{vertices.toLocaleString()}</dd>
                      </div>
                    )}
                    {fileSize && (
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">File Size</dt>
                        <dd className="font-medium">{formatBytes(fileSize)}</dd>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">License</dt>
                      <dd className="font-medium">{license}</dd>
                    </div>
                    {Object.entries(technicalSpecs).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <dt className="text-muted-foreground">{key}</dt>
                        <dd className="font-medium">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ratings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Rating Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {ratingDistribution &&
                      [5, 4, 3, 2, 1].map((stars) => (
                        <div key={stars} className="flex items-center gap-3">
                          <div className="flex items-center gap-1 w-12">
                            <span className="text-sm font-medium">{stars}</span>
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          </div>
                          <Progress
                            value={getRatingPercentage(stars)}
                            className="flex-1"
                          />
                          <span className="text-sm text-muted-foreground w-12 text-right">
                            {getRatingPercentage(stars).toFixed(0)}%
                          </span>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-4">
          {/* Download Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Download</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Format</label>
                <div className="grid grid-cols-2 gap-2">
                  {fileFormats.map((format) => (
                    <Button
                      key={format.format}
                      variant={selectedFormat === format.format ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedFormat(format.format)}
                      className="justify-start"
                    >
                      <File className="h-4 w-4 mr-2" />
                      {format.format}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                {fileFormats.find((f) => f.format === selectedFormat) && (
                  <span>
                    Size:{' '}
                    {formatBytes(
                      fileFormats.find((f) => f.format === selectedFormat)!.size
                    )}
                  </span>
                )}
              </div>

              <Button className="w-full" size="lg" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download {selectedFormat}
              </Button>
            </CardContent>
          </Card>

          {/* Author Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Author</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={author.avatar} alt={author.name} />
                  <AvatarFallback>
                    {author.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{author.name}</p>
                  {author.modelsCount && (
                    <p className="text-sm text-muted-foreground">
                      {author.modelsCount} models
                    </p>
                  )}
                </div>
              </div>

              {author.bio && (
                <p className="text-sm text-muted-foreground">{author.bio}</p>
              )}

              {author.website && (
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <a
                    href={author.website}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Visit Website
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Metadata Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <div>
                  <p className="text-xs">Published</p>
                  <p className="text-foreground font-medium">
                    {formatDate(createdAt)}
                  </p>
                </div>
              </div>

              {updatedAt && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <div>
                    <p className="text-xs">Last Updated</p>
                    <p className="text-foreground font-medium">
                      {formatDate(updatedAt)}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 text-muted-foreground">
                <Box className="h-4 w-4" />
                <div>
                  <p className="text-xs">Model ID</p>
                  <p className="text-foreground font-medium font-mono text-xs">
                    {id}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
