'use client'

import { useState } from 'react'
import { MousePointer, Square, Circle, Minus, Type, Move, ZoomIn, ZoomOut, Trash2, Undo, Redo } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export type DrawingTool = 'select' | 'rectangle' | 'circle' | 'line' | 'text' | 'pan'

export interface DrawingToolsProps {
  activeTool: DrawingTool
  onToolChange: (tool: DrawingTool) => void
  onZoomIn?: () => void
  onZoomOut?: () => void
  onUndo?: () => void
  onRedo?: () => void
  onDelete?: () => void
  canUndo?: boolean
  canRedo?: boolean
  strokeColor?: string
  fillColor?: string
  strokeWidth?: number
  onStrokeColorChange?: (color: string) => void
  onFillColorChange?: (color: string) => void
  onStrokeWidthChange?: (width: number) => void
}

const tools: Array<{ id: DrawingTool; icon: any; label: string }> = [
  { id: 'select', icon: MousePointer, label: 'Select' },
  { id: 'pan', icon: Move, label: 'Pan' },
  { id: 'rectangle', icon: Square, label: 'Rectangle' },
  { id: 'circle', icon: Circle, label: 'Circle' },
  { id: 'line', icon: Minus, label: 'Line' },
  { id: 'text', icon: Type, label: 'Text' },
]

const colorPresets = [
  '#000000', '#FF0000', '#00FF00', '#0000FF',
  '#FFFF00', '#FF00FF', '#00FFFF', '#FFFFFF',
  '#FFA500', '#800080', '#008000', '#000080'
]

export function DrawingTools({
  activeTool,
  onToolChange,
  onZoomIn,
  onZoomOut,
  onUndo,
  onRedo,
  onDelete,
  canUndo = false,
  canRedo = false,
  strokeColor = '#000000',
  fillColor = 'transparent',
  strokeWidth = 2,
  onStrokeColorChange,
  onFillColorChange,
  onStrokeWidthChange,
}: DrawingToolsProps) {
  return (
    <Card className="p-4">
      <div className="space-y-4">
        {/* Drawing Tools */}
        <div>
          <Label className="text-xs font-semibold mb-2 block">Drawing Tools</Label>
          <div className="grid grid-cols-3 gap-2">
            {tools.map(({ id, icon: Icon, label }) => (
              <Button
                key={id}
                variant={activeTool === id ? 'default' : 'outline'}
                size="sm"
                onClick={() => onToolChange(id)}
                className="flex flex-col gap-1 h-auto py-2"
                title={label}
              >
                <Icon className="h-4 w-4" />
                <span className="text-xs">{label}</span>
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* View Controls */}
        <div>
          <Label className="text-xs font-semibold mb-2 block">View Controls</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onZoomIn}
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4 mr-1" />
              Zoom In
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onZoomOut}
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4 mr-1" />
              Zoom Out
            </Button>
          </div>
        </div>

        <Separator />

        {/* Edit Controls */}
        <div>
          <Label className="text-xs font-semibold mb-2 block">Edit Controls</Label>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onUndo}
              disabled={!canUndo}
              title="Undo"
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onRedo}
              disabled={!canRedo}
              title="Redo"
            >
              <Redo className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onDelete}
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Separator />

        {/* Style Controls */}
        <div className="space-y-3">
          <Label className="text-xs font-semibold">Style Controls</Label>

          {/* Stroke Color */}
          <div className="space-y-2">
            <Label className="text-xs">Stroke Color</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  size="sm"
                >
                  <div
                    className="w-4 h-4 rounded border mr-2"
                    style={{ backgroundColor: strokeColor }}
                  />
                  {strokeColor}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64">
                <div className="grid grid-cols-4 gap-2">
                  {colorPresets.map(color => (
                    <button
                      key={color}
                      className="w-12 h-12 rounded border-2 hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                      onClick={() => onStrokeColorChange?.(color)}
                    />
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Fill Color */}
          <div className="space-y-2">
            <Label className="text-xs">Fill Color</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  size="sm"
                >
                  <div
                    className="w-4 h-4 rounded border mr-2"
                    style={{ backgroundColor: fillColor }}
                  />
                  {fillColor}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64">
                <div className="grid grid-cols-4 gap-2">
                  <button
                    className="w-12 h-12 rounded border-2 hover:scale-110 transition-transform bg-transparent"
                    onClick={() => onFillColorChange?.('transparent')}
                  >
                    <span className="text-xs">None</span>
                  </button>
                  {colorPresets.map(color => (
                    <button
                      key={color}
                      className="w-12 h-12 rounded border-2 hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                      onClick={() => onFillColorChange?.(color)}
                    />
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Stroke Width */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className="text-xs">Stroke Width</Label>
              <span className="text-xs text-muted-foreground">{strokeWidth}px</span>
            </div>
            <Slider
              value={[strokeWidth]}
              onValueChange={([value]) => onStrokeWidthChange?.(value)}
              min={1}
              max={20}
              step={1}
            />
          </div>
        </div>
      </div>
    </Card>
  )
}
