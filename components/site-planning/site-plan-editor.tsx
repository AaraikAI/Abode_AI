'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Pencil,
  Square,
  Circle,
  Move,
  Trash2,
  Save,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Maximize,
} from 'lucide-react'
import type { Feature, Position } from 'geojson'
import type { SitePlanFeature } from '@/lib/geojson/types'

interface SitePlanEditorProps {
  projectId: string
  parsedFeatures?: SitePlanFeature[]
  imageUrl?: string
  onSave?: (features: SitePlanFeature[]) => void
}

type Tool = 'select' | 'pan' | 'line' | 'polygon' | 'point' | 'delete'
type FeatureType = 'property_line' | 'existing_structure' | 'tree' | 'driveway' | 'annotation'

interface DrawingState {
  isDrawing: boolean
  currentPoints: Position[]
  tempFeature: Feature | null
}

export function SitePlanEditor({
  projectId,
  parsedFeatures = [],
  imageUrl,
  onSave
}: SitePlanEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [features, setFeatures] = useState<SitePlanFeature[]>(parsedFeatures)
  const [selectedFeatureIndex, setSelectedFeatureIndex] = useState<number | null>(null)
  const [tool, setTool] = useState<Tool>('select')
  const [featureType, setFeatureType] = useState<FeatureType>('property_line')
  const [drawing, setDrawing] = useState<DrawingState>({
    isDrawing: false,
    currentPoints: [],
    tempFeature: null
  })
  const [viewport, setViewport] = useState({
    scale: 1,
    offsetX: 0,
    offsetY: 0
  })
  const [history, setHistory] = useState<SitePlanFeature[][]>([parsedFeatures])
  const [historyIndex, setHistoryIndex] = useState(0)
  const [backgroundImage, setBackgroundImage] = useState<HTMLImageElement | null>(null)

  // Load background image
  useEffect(() => {
    if (imageUrl) {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        setBackgroundImage(img)
        redraw()
      }
      img.src = imageUrl
    }
  }, [imageUrl])

  // Redraw canvas
  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Apply viewport transform
    ctx.save()
    ctx.translate(viewport.offsetX, viewport.offsetY)
    ctx.scale(viewport.scale, viewport.scale)

    // Draw background image
    if (backgroundImage) {
      ctx.drawImage(backgroundImage, 0, 0, backgroundImage.width, backgroundImage.height)
    }

    // Draw grid
    drawGrid(ctx, canvas.width, canvas.height)

    // Draw all features
    features.forEach((feature, index) => {
      const isSelected = index === selectedFeatureIndex
      drawFeature(ctx, feature, isSelected)
    })

    // Draw temporary feature while drawing
    if (drawing.tempFeature) {
      drawFeature(ctx, drawing.tempFeature as SitePlanFeature, false, true)
    }

    ctx.restore()
  }, [features, selectedFeatureIndex, drawing.tempFeature, viewport, backgroundImage])

  // Redraw on changes
  useEffect(() => {
    redraw()
  }, [redraw])

  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const gridSize = 20
    ctx.strokeStyle = '#e0e0e0'
    ctx.lineWidth = 0.5

    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }

    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }
  }

  const drawFeature = (
    ctx: CanvasRenderingContext2D,
    feature: SitePlanFeature,
    isSelected: boolean,
    isTemp: boolean = false
  ) => {
    const geometry = feature.geometry
    const props = feature.properties

    // Set styles based on feature type
    const getStyle = () => {
      switch (props.type) {
        case 'property_line':
          return { stroke: '#ff0000', lineWidth: 2, fill: false }
        case 'existing_structure':
          return { stroke: '#0000ff', lineWidth: 2, fill: 'rgba(0,0,255,0.1)' }
        case 'tree':
          return { stroke: '#00ff00', lineWidth: 1, fill: 'rgba(0,255,0,0.2)' }
        case 'driveway':
          return { stroke: '#666666', lineWidth: 1, fill: 'rgba(100,100,100,0.2)' }
        default:
          return { stroke: '#000000', lineWidth: 1, fill: false }
      }
    }

    const style = getStyle()

    if (isSelected) {
      style.stroke = '#ffaa00'
      style.lineWidth = 3
    }

    if (isTemp) {
      ctx.globalAlpha = 0.6
    }

    ctx.strokeStyle = style.stroke
    ctx.lineWidth = style.lineWidth

    if (geometry.type === 'LineString') {
      ctx.beginPath()
      geometry.coordinates.forEach((coord, i) => {
        const [x, y] = coord
        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      })
      ctx.stroke()

      // Draw points
      geometry.coordinates.forEach(coord => {
        const [x, y] = coord
        ctx.beginPath()
        ctx.arc(x, y, 3, 0, Math.PI * 2)
        ctx.fillStyle = style.stroke
        ctx.fill()
      })
    } else if (geometry.type === 'Polygon') {
      ctx.beginPath()
      geometry.coordinates[0].forEach((coord, i) => {
        const [x, y] = coord
        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      })
      ctx.closePath()

      if (style.fill) {
        ctx.fillStyle = style.fill
        ctx.fill()
      }
      ctx.stroke()

      // Draw points
      geometry.coordinates[0].forEach(coord => {
        const [x, y] = coord
        ctx.beginPath()
        ctx.arc(x, y, 3, 0, Math.PI * 2)
        ctx.fillStyle = style.stroke
        ctx.fill()
      })
    } else if (geometry.type === 'Point') {
      const [x, y] = geometry.coordinates
      ctx.beginPath()
      ctx.arc(x, y, 10, 0, Math.PI * 2)
      if (style.fill) {
        ctx.fillStyle = style.fill
        ctx.fill()
      }
      ctx.stroke()
    }

    ctx.globalAlpha = 1
  }

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>): Position => {
    const canvas = canvasRef.current
    if (!canvas) return [0, 0]

    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left - viewport.offsetX) / viewport.scale
    const y = (e.clientY - rect.top - viewport.offsetY) / viewport.scale

    return [x, y]
  }

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoordinates(e)

    if (tool === 'select') {
      // Find clicked feature
      const clickedIndex = features.findIndex(f => isPointInFeature(coords, f))
      setSelectedFeatureIndex(clickedIndex >= 0 ? clickedIndex : null)
    } else if (tool === 'line' || tool === 'polygon') {
      // Add point to current drawing
      setDrawing(prev => {
        const newPoints = [...prev.currentPoints, coords]
        return {
          ...prev,
          isDrawing: true,
          currentPoints: newPoints
        }
      })
    } else if (tool === 'point') {
      // Create point feature
      const newFeature: SitePlanFeature = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: coords
        },
        properties: {
          type: featureType,
          confidence: 1.0
        } as any
      }
      addFeature(newFeature)
    } else if (tool === 'delete') {
      // Delete clicked feature
      const clickedIndex = features.findIndex(f => isPointInFeature(coords, f))
      if (clickedIndex >= 0) {
        deleteFeature(clickedIndex)
      }
    }
  }

  const handleCanvasDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool === 'line' && drawing.currentPoints.length >= 2) {
      // Finish line
      const newFeature: SitePlanFeature = {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: drawing.currentPoints
        },
        properties: {
          type: featureType,
          confidence: 1.0
        } as any
      }
      addFeature(newFeature)
      setDrawing({ isDrawing: false, currentPoints: [], tempFeature: null })
    } else if (tool === 'polygon' && drawing.currentPoints.length >= 3) {
      // Finish polygon
      const closedPoints = [...drawing.currentPoints, drawing.currentPoints[0]]
      const newFeature: SitePlanFeature = {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [closedPoints]
        },
        properties: {
          type: featureType,
          confidence: 1.0
        } as any
      }
      addFeature(newFeature)
      setDrawing({ isDrawing: false, currentPoints: [], tempFeature: null })
    }
  }

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (drawing.isDrawing && drawing.currentPoints.length > 0) {
      const coords = getCanvasCoordinates(e)
      const tempPoints = [...drawing.currentPoints, coords]

      let tempFeature: Feature
      if (tool === 'line') {
        tempFeature = {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: tempPoints
          },
          properties: { type: featureType }
        }
      } else if (tool === 'polygon') {
        const closedPoints = [...tempPoints, tempPoints[0]]
        tempFeature = {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [closedPoints]
          },
          properties: { type: featureType }
        }
      } else {
        return
      }

      setDrawing(prev => ({ ...prev, tempFeature }))
    }
  }

  const isPointInFeature = (point: Position, feature: SitePlanFeature): boolean => {
    const [px, py] = point
    const geometry = feature.geometry

    if (geometry.type === 'Point') {
      const [x, y] = geometry.coordinates
      const distance = Math.sqrt(Math.pow(px - x, 2) + Math.pow(py - y, 2))
      return distance < 15
    } else if (geometry.type === 'LineString') {
      // Check if point is near any line segment
      for (let i = 0; i < geometry.coordinates.length - 1; i++) {
        const [x1, y1] = geometry.coordinates[i]
        const [x2, y2] = geometry.coordinates[i + 1]

        const distance = pointToLineDistance(px, py, x1, y1, x2, y2)
        if (distance < 10) return true
      }
    } else if (geometry.type === 'Polygon') {
      // Simple point-in-polygon test
      const coords = geometry.coordinates[0]
      let inside = false

      for (let i = 0, j = coords.length - 1; i < coords.length; j = i++) {
        const [xi, yi] = coords[i]
        const [xj, yj] = coords[j]

        const intersect = ((yi > py) !== (yj > py)) &&
          (px < (xj - xi) * (py - yi) / (yj - yi) + xi)

        if (intersect) inside = !inside
      }

      return inside
    }

    return false
  }

  const pointToLineDistance = (
    px: number,
    py: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): number => {
    const A = px - x1
    const B = py - y1
    const C = x2 - x1
    const D = y2 - y1

    const dot = A * C + B * D
    const lenSq = C * C + D * D
    let param = -1

    if (lenSq !== 0) param = dot / lenSq

    let xx, yy

    if (param < 0) {
      xx = x1
      yy = y1
    } else if (param > 1) {
      xx = x2
      yy = y2
    } else {
      xx = x1 + param * C
      yy = y1 + param * D
    }

    const dx = px - xx
    const dy = py - yy

    return Math.sqrt(dx * dx + dy * dy)
  }

  const addFeature = (feature: SitePlanFeature) => {
    const newFeatures = [...features, feature]
    setFeatures(newFeatures)
    addToHistory(newFeatures)
  }

  const deleteFeature = (index: number) => {
    const newFeatures = features.filter((_, i) => i !== index)
    setFeatures(newFeatures)
    setSelectedFeatureIndex(null)
    addToHistory(newFeatures)
  }

  const addToHistory = (newFeatures: SitePlanFeature[]) => {
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(newFeatures)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      setFeatures(history[newIndex])
      setHistoryIndex(newIndex)
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      setFeatures(history[newIndex])
      setHistoryIndex(newIndex)
    }
  }

  const zoomIn = () => {
    setViewport(prev => ({ ...prev, scale: prev.scale * 1.2 }))
  }

  const zoomOut = () => {
    setViewport(prev => ({ ...prev, scale: prev.scale / 1.2 }))
  }

  const resetView = () => {
    setViewport({ scale: 1, offsetX: 0, offsetY: 0 })
  }

  const handleSave = async () => {
    if (onSave) {
      onSave(features)
    }

    // Also save to backend
    try {
      const response = await fetch(`/api/projects/${projectId}/features`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ features })
      })

      if (response.ok) {
        alert('Features saved successfully')
      }
    } catch (error) {
      console.error('Save error:', error)
      alert('Failed to save features')
    }
  }

  return (
    <div className="flex gap-4 h-[800px]">
      {/* Toolbar */}
      <Card className="p-4 w-64 space-y-4">
        <div>
          <h3 className="font-semibold mb-2">Tools</h3>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={tool === 'select' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTool('select')}
            >
              <Move className="h-4 w-4 mr-1" />
              Select
            </Button>
            <Button
              variant={tool === 'pan' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTool('pan')}
            >
              Pan
            </Button>
            <Button
              variant={tool === 'line' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTool('line')}
            >
              <Pencil className="h-4 w-4 mr-1" />
              Line
            </Button>
            <Button
              variant={tool === 'polygon' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTool('polygon')}
            >
              <Square className="h-4 w-4 mr-1" />
              Polygon
            </Button>
            <Button
              variant={tool === 'point' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTool('point')}
            >
              <Circle className="h-4 w-4 mr-1" />
              Point
            </Button>
            <Button
              variant={tool === 'delete' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTool('delete')}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>

        <div>
          <Label>Feature Type</Label>
          <Select value={featureType} onValueChange={(v) => setFeatureType(v as FeatureType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="property_line">Property Line</SelectItem>
              <SelectItem value="existing_structure">Structure</SelectItem>
              <SelectItem value="tree">Tree</SelectItem>
              <SelectItem value="driveway">Driveway</SelectItem>
              <SelectItem value="annotation">Annotation</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold">View</h3>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={zoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={zoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={resetView}>
              <Maximize className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold">Actions</h3>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={undo}
              disabled={historyIndex <= 0}
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
            >
              <Redo className="h-4 w-4" />
            </Button>
          </div>
          <Button className="w-full" onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Features ({features.length})</h3>
          <div className="space-y-1 max-h-48 overflow-y-auto text-sm">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`p-2 rounded cursor-pointer ${
                  selectedFeatureIndex === index ? 'bg-primary text-white' : 'hover:bg-gray-100'
                }`}
                onClick={() => setSelectedFeatureIndex(index)}
              >
                {feature.properties.type}
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Canvas */}
      <Card className="flex-1 p-0 overflow-hidden">
        <canvas
          ref={canvasRef}
          width={1200}
          height={800}
          className="cursor-crosshair"
          onClick={handleCanvasClick}
          onDoubleClick={handleCanvasDoubleClick}
          onMouseMove={handleCanvasMouseMove}
        />
      </Card>
    </div>
  )
}
