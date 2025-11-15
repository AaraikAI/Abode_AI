'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignVerticalJustifyCenter,
  AlignHorizontalJustifyCenter,
  Move,
  RotateCw,
  Maximize,
  Grid3x3,
  Crosshair
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export interface AlignmentSettings {
  snapToGrid: boolean
  gridSize: number
  snapToObjects: boolean
  snapDistance: number
  showGrid: boolean
  showRulers: boolean
  showCrosshair: boolean
  rotation: number
  scale: number
  offsetX: number
  offsetY: number
}

export interface AlignmentControlsProps {
  settings: AlignmentSettings
  onSettingsChange: (settings: AlignmentSettings) => void
  onAlign?: (type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void
  onDistribute?: (type: 'horizontal' | 'vertical') => void
  onRotate?: (angle: number) => void
  onScale?: (scale: number) => void
  selectedCount?: number
}

export function AlignmentControls({
  settings,
  onSettingsChange,
  onAlign,
  onDistribute,
  onRotate,
  onScale,
  selectedCount = 0,
}: AlignmentControlsProps) {
  const updateSetting = <K extends keyof AlignmentSettings>(
    key: K,
    value: AlignmentSettings[K]
  ) => {
    onSettingsChange({
      ...settings,
      [key]: value,
    })
  }

  return (
    <Card className="p-4">
      <Tabs defaultValue="snap" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="snap">Snap</TabsTrigger>
          <TabsTrigger value="align">Align</TabsTrigger>
          <TabsTrigger value="transform">Transform</TabsTrigger>
        </TabsList>

        {/* Snap Settings */}
        <TabsContent value="snap" className="space-y-4">
          <div className="space-y-4">
            {/* Grid Snap */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Grid3x3 className="h-4 w-4" />
                  <Label className="text-sm">Snap to Grid</Label>
                </div>
                <Switch
                  checked={settings.snapToGrid}
                  onCheckedChange={(checked) => updateSetting('snapToGrid', checked)}
                />
              </div>

              {settings.snapToGrid && (
                <div className="space-y-2 pl-6">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs">Grid Size</Label>
                    <span className="text-xs text-muted-foreground">
                      {settings.gridSize}px
                    </span>
                  </div>
                  <Slider
                    value={[settings.gridSize]}
                    onValueChange={([value]) => updateSetting('gridSize', value)}
                    min={5}
                    max={100}
                    step={5}
                  />
                </div>
              )}
            </div>

            <Separator />

            {/* Object Snap */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Crosshair className="h-4 w-4" />
                  <Label className="text-sm">Snap to Objects</Label>
                </div>
                <Switch
                  checked={settings.snapToObjects}
                  onCheckedChange={(checked) => updateSetting('snapToObjects', checked)}
                />
              </div>

              {settings.snapToObjects && (
                <div className="space-y-2 pl-6">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs">Snap Distance</Label>
                    <span className="text-xs text-muted-foreground">
                      {settings.snapDistance}px
                    </span>
                  </div>
                  <Slider
                    value={[settings.snapDistance]}
                    onValueChange={([value]) => updateSetting('snapDistance', value)}
                    min={5}
                    max={50}
                    step={5}
                  />
                </div>
              )}
            </div>

            <Separator />

            {/* Display Options */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Display</Label>

              <div className="flex items-center justify-between">
                <Label className="text-sm">Show Grid</Label>
                <Switch
                  checked={settings.showGrid}
                  onCheckedChange={(checked) => updateSetting('showGrid', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm">Show Rulers</Label>
                <Switch
                  checked={settings.showRulers}
                  onCheckedChange={(checked) => updateSetting('showRulers', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm">Show Crosshair</Label>
                <Switch
                  checked={settings.showCrosshair}
                  onCheckedChange={(checked) => updateSetting('showCrosshair', checked)}
                />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Alignment Controls */}
        <TabsContent value="align" className="space-y-4">
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-semibold mb-2 block">
                Align Objects
              </Label>
              {selectedCount < 2 && (
                <p className="text-xs text-muted-foreground mb-3">
                  Select 2 or more objects to align
                </p>
              )}

              <div className="space-y-3">
                <div>
                  <Label className="text-xs mb-2 block">Horizontal</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onAlign?.('left')}
                      disabled={selectedCount < 2}
                    >
                      <AlignLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onAlign?.('center')}
                      disabled={selectedCount < 2}
                    >
                      <AlignCenter className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onAlign?.('right')}
                      disabled={selectedCount < 2}
                    >
                      <AlignRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-xs mb-2 block">Vertical</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onAlign?.('top')}
                      disabled={selectedCount < 2}
                    >
                      <AlignLeft className="h-4 w-4 rotate-90" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onAlign?.('middle')}
                      disabled={selectedCount < 2}
                    >
                      <AlignCenter className="h-4 w-4 rotate-90" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onAlign?.('bottom')}
                      disabled={selectedCount < 2}
                    >
                      <AlignRight className="h-4 w-4 rotate-90" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <Label className="text-sm font-semibold mb-2 block">
                Distribute
              </Label>
              {selectedCount < 3 && (
                <p className="text-xs text-muted-foreground mb-3">
                  Select 3 or more objects to distribute
                </p>
              )}

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDistribute?.('horizontal')}
                  disabled={selectedCount < 3}
                >
                  <AlignHorizontalJustifyCenter className="h-4 w-4 mr-1" />
                  Horizontal
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDistribute?.('vertical')}
                  disabled={selectedCount < 3}
                >
                  <AlignVerticalJustifyCenter className="h-4 w-4 mr-1" />
                  Vertical
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Transform Controls */}
        <TabsContent value="transform" className="space-y-4">
          <div className="space-y-4">
            {/* Rotation */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <RotateCw className="h-4 w-4" />
                <Label className="text-sm">Rotation</Label>
              </div>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={settings.rotation}
                  onChange={(e) => {
                    const value = Number(e.target.value)
                    updateSetting('rotation', value)
                    onRotate?.(value)
                  }}
                  className="text-xs"
                />
                <span className="text-xs self-center">°</span>
              </div>
              <Slider
                value={[settings.rotation]}
                onValueChange={([value]) => {
                  updateSetting('rotation', value)
                  onRotate?.(value)
                }}
                min={0}
                max={360}
                step={1}
              />
            </div>

            <Separator />

            {/* Scale */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Maximize className="h-4 w-4" />
                <Label className="text-sm">Scale</Label>
              </div>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={settings.scale}
                  onChange={(e) => {
                    const value = Number(e.target.value)
                    updateSetting('scale', value)
                    onScale?.(value)
                  }}
                  step={0.1}
                  className="text-xs"
                />
                <span className="text-xs self-center">×</span>
              </div>
              <Slider
                value={[settings.scale * 100]}
                onValueChange={([value]) => {
                  const scale = value / 100
                  updateSetting('scale', scale)
                  onScale?.(scale)
                }}
                min={10}
                max={500}
                step={10}
              />
            </div>

            <Separator />

            {/* Offset */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Move className="h-4 w-4" />
                <Label className="text-sm">Offset</Label>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">X</Label>
                  <Input
                    type="number"
                    value={settings.offsetX}
                    onChange={(e) => updateSetting('offsetX', Number(e.target.value))}
                    className="text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">Y</Label>
                  <Input
                    type="number"
                    value={settings.offsetY}
                    onChange={(e) => updateSetting('offsetY', Number(e.target.value))}
                    className="text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  )
}
