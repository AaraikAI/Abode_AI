'use client'

/**
 * Output Preview Component
 *
 * Preview rendered images with zoom, pan, and comparison slider
 */

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Image as ImageIcon,
  ZoomIn,
  ZoomOut,
  Maximize,
  Download,
  Share2,
  SplitSquareVertical,
  Layers,
  Eye,
  EyeOff,
  RotateCw,
  Grid3x3,
} from 'lucide-react'

interface OutputPreviewProps {
  imageUrl: string
  compareImageUrl?: string
  title?: string
  resolution?: string
  fileSize?: string
  onDownload?: () => void
  onShare?: () => void
}

export function OutputPreview({
  imageUrl,
  compareImageUrl,
  title = 'Rendered Output',
  resolution,
  fileSize,
  onDownload,
  onShare,
}: OutputPreviewProps) {
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [compareMode, setCompareMode] = useState(false)
  const [comparePosition, setComparePosition] = useState(50)
  const [showGrid, setShowGrid] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const [imageLoaded, setImageLoaded] = useState(false)

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev * 1.25, 10))
  }

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev / 1.25, 0.1))
  }

  const handleResetView = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  const handleFitToScreen = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (compareMode && e.target === e.currentTarget) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
    } else if (!compareMode) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && !compareMode) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setZoom((prev) => Math.max(0.1, Math.min(10, prev * delta)))
  }

  const handleCompareSliderMove = (e: React.MouseEvent) => {
    if (!containerRef.current || !compareMode) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = (x / rect.width) * 100
    setComparePosition(Math.max(0, Math.min(100, percentage)))
  }

  const handleCompareSliderDrag = (e: React.MouseEvent) => {
    e.preventDefault()
    const handleMove = (moveEvent: MouseEvent) => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const x = moveEvent.clientX - rect.left
      const percentage = (x / rect.width) * 100
      setComparePosition(Math.max(0, Math.min(100, percentage)))
    }

    const handleUp = () => {
      document.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mouseup', handleUp)
    }

    document.addEventListener('mousemove', handleMove)
    document.addEventListener('mouseup', handleUp)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              {title}
            </CardTitle>
            <CardDescription className="flex gap-4 mt-1">
              {resolution && <span>{resolution}</span>}
              {fileSize && <span>{fileSize}</span>}
              {imageLoaded && <Badge variant="success">Loaded</Badge>}
            </CardDescription>
          </div>

          <div className="flex gap-2">
            {/* Zoom Controls */}
            <div className="flex items-center gap-1 border rounded-lg p-1">
              <Button variant="ghost" size="sm" onClick={handleZoomOut}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[4rem] text-center">
                {(zoom * 100).toFixed(0)}%
              </span>
              <Button variant="ghost" size="sm" onClick={handleZoomIn}>
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>

            {/* View Options */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleFitToScreen}>
                  <Maximize className="h-4 w-4 mr-2" />
                  Fit to Screen
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleResetView}>
                  <RotateCw className="h-4 w-4 mr-2" />
                  Reset View
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowGrid(!showGrid)}>
                  <Grid3x3 className="h-4 w-4 mr-2" />
                  {showGrid ? 'Hide' : 'Show'} Grid
                </DropdownMenuItem>
                {compareImageUrl && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setCompareMode(!compareMode)}>
                      <SplitSquareVertical className="h-4 w-4 mr-2" />
                      {compareMode ? 'Disable' : 'Enable'} Compare
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Action Buttons */}
            <Button variant="outline" size="sm" onClick={onDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button variant="outline" size="sm" onClick={onShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div
          ref={containerRef}
          className="relative bg-muted rounded-lg overflow-hidden"
          style={{ height: '600px' }}
          onMouseDown={handleMouseDown}
          onMouseMove={compareMode ? handleCompareSliderMove : handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          {/* Grid Overlay */}
          {showGrid && (
            <div
              className="absolute inset-0 pointer-events-none z-10"
              style={{
                backgroundImage: `
                  linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)
                `,
                backgroundSize: '50px 50px',
              }}
            />
          )}

          {/* Compare Mode */}
          {compareMode && compareImageUrl ? (
            <div className="relative w-full h-full">
              {/* Base Image */}
              <div className="absolute inset-0">
                <img
                  src={compareImageUrl}
                  alt="Comparison base"
                  className="w-full h-full object-contain"
                  style={{
                    transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                  }}
                  onLoad={() => setImageLoaded(true)}
                />
              </div>

              {/* Overlay Image */}
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ clipPath: `inset(0 ${100 - comparePosition}% 0 0)` }}
              >
                <img
                  src={imageUrl}
                  alt="Comparison overlay"
                  className="w-full h-full object-contain"
                  style={{
                    transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                  }}
                />
              </div>

              {/* Slider Handle */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-ew-resize z-20"
                style={{ left: `${comparePosition}%` }}
                onMouseDown={handleCompareSliderDrag}
              >
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-lg">
                  <SplitSquareVertical className="h-4 w-4" />
                </div>
              </div>

              {/* Compare Labels */}
              <div className="absolute top-4 left-4 z-20">
                <Badge>Before</Badge>
              </div>
              <div className="absolute top-4 right-4 z-20">
                <Badge>After</Badge>
              </div>
            </div>
          ) : (
            /* Single Image View */
            <div className="relative w-full h-full flex items-center justify-center">
              <img
                src={imageUrl}
                alt="Rendered output"
                className="max-w-full max-h-full object-contain"
                style={{
                  transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                  cursor: isDragging ? 'grabbing' : 'grab',
                }}
                onLoad={() => setImageLoaded(true)}
              />
            </div>
          )}

          {/* Loading Indicator */}
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Loading image...</p>
              </div>
            </div>
          )}
        </div>

        {/* Compare Slider (when in compare mode) */}
        {compareMode && compareImageUrl && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Comparison Position</span>
              <span className="font-medium">{comparePosition.toFixed(0)}%</span>
            </div>
            <Slider
              value={[comparePosition]}
              onValueChange={([value]) => setComparePosition(value)}
              min={0}
              max={100}
              step={1}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
