'use client'

/**
 * Camera Controls Component
 *
 * FOV, focus, exposure, clipping planes, camera presets
 */

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
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
  Camera,
  Save,
  Trash2,
  MoreVertical,
  Eye,
  Maximize2,
  Minimize2,
  Focus,
  SunMedium,
  RotateCw,
} from 'lucide-react'

export interface CameraSettings {
  name?: string
  fov: number
  focalLength: number
  sensorSize: number
  position: { x: number; y: number; z: number }
  rotation: { x: number; y: number; z: number }
  target?: { x: number; y: number; z: number }
  focusDistance: number
  aperture: number
  exposure: number
  iso: number
  shutterSpeed: number
  clippingNear: number
  clippingFar: number
  lensShift: { x: number; y: number }
}

interface CameraControlsProps {
  settings?: Partial<CameraSettings>
  savedPresets?: CameraPreset[]
  onChange?: (settings: CameraSettings) => void
  onSavePreset?: (preset: CameraPreset) => void
  onDeletePreset?: (id: string) => void
  onLoadPreset?: (preset: CameraPreset) => void
}

export interface CameraPreset {
  id: string
  name: string
  settings: CameraSettings
  thumbnail?: string
}

const DEFAULT_SETTINGS: CameraSettings = {
  fov: 50,
  focalLength: 50,
  sensorSize: 35,
  position: { x: 0, y: 0, z: 10 },
  rotation: { x: 0, y: 0, z: 0 },
  focusDistance: 10,
  aperture: 2.8,
  exposure: 0,
  iso: 100,
  shutterSpeed: 125,
  clippingNear: 0.1,
  clippingFar: 1000,
  lensShift: { x: 0, y: 0 },
}

const CAMERA_PRESETS: Partial<CameraSettings>[] = [
  { name: 'Wide Angle', fov: 24, focalLength: 24 },
  { name: 'Standard', fov: 50, focalLength: 50 },
  { name: 'Portrait', fov: 85, focalLength: 85 },
  { name: 'Telephoto', fov: 135, focalLength: 135 },
]

export function CameraControls({
  settings,
  savedPresets = [],
  onChange,
  onSavePreset,
  onDeletePreset,
  onLoadPreset,
}: CameraControlsProps) {
  const [config, setConfig] = useState<CameraSettings>({
    ...DEFAULT_SETTINGS,
    ...settings,
  })
  const [presetName, setPresetName] = useState('')
  const [showSaveDialog, setShowSaveDialog] = useState(false)

  const updateSetting = <K extends keyof CameraSettings>(
    key: K,
    value: CameraSettings[K]
  ) => {
    const newConfig = { ...config, [key]: value }
    setConfig(newConfig)
    onChange?.(newConfig)
  }

  const handleSavePreset = () => {
    if (!presetName.trim()) return

    const preset: CameraPreset = {
      id: `preset-${Date.now()}`,
      name: presetName,
      settings: config,
    }

    onSavePreset?.(preset)
    setPresetName('')
    setShowSaveDialog(false)
  }

  const handleLoadPreset = (preset: CameraPreset) => {
    setConfig(preset.settings)
    onChange?.(preset.settings)
    onLoadPreset?.(preset)
  }

  const handleQuickPreset = (preset: Partial<CameraSettings>) => {
    const newConfig = { ...config, ...preset }
    setConfig(newConfig)
    onChange?.(newConfig)
  }

  const calculateFOVFromFocal = (focal: number, sensor: number = 35): number => {
    return 2 * Math.atan(sensor / (2 * focal)) * (180 / Math.PI)
  }

  const calculateFocalFromFOV = (fov: number, sensor: number = 35): number => {
    return sensor / (2 * Math.tan((fov * Math.PI) / 360))
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Camera Controls
              </CardTitle>
              <CardDescription>
                Configure camera settings and save presets
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSaveDialog(!showSaveDialog)}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Preset
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Save Preset Dialog */}
          {showSaveDialog && (
            <div className="p-4 border rounded-lg space-y-3 bg-muted/50">
              <Label>Preset Name</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter preset name"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                />
                <Button onClick={handleSavePreset}>Save</Button>
                <Button variant="ghost" onClick={() => setShowSaveDialog(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Quick Presets */}
          <div className="space-y-2">
            <Label>Quick Presets</Label>
            <div className="grid grid-cols-2 gap-2">
              {CAMERA_PRESETS.map((preset, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickPreset(preset)}
                >
                  {preset.name}
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Lens Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Lens Settings
            </h3>

            <div className="space-y-2">
              <Label>Field of View: {config.fov.toFixed(1)}°</Label>
              <Slider
                value={[config.fov]}
                onValueChange={([fov]) => {
                  updateSetting('fov', fov)
                  updateSetting('focalLength', calculateFocalFromFOV(fov, config.sensorSize))
                }}
                min={10}
                max={120}
                step={1}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="focal-length">Focal Length (mm)</Label>
                <Input
                  id="focal-length"
                  type="number"
                  value={config.focalLength.toFixed(1)}
                  onChange={(e) => {
                    const focal = parseFloat(e.target.value) || 50
                    updateSetting('focalLength', focal)
                    updateSetting('fov', calculateFOVFromFocal(focal, config.sensorSize))
                  }}
                  min={14}
                  max={200}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sensor-size">Sensor Size (mm)</Label>
                <Input
                  id="sensor-size"
                  type="number"
                  value={config.sensorSize}
                  onChange={(e) => {
                    const sensor = parseFloat(e.target.value) || 35
                    updateSetting('sensorSize', sensor)
                    updateSetting('fov', calculateFOVFromFocal(config.focalLength, sensor))
                  }}
                  min={18}
                  max={64}
                  step={1}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Position & Rotation */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Position</h3>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label htmlFor="pos-x" className="text-xs">X</Label>
                <Input
                  id="pos-x"
                  type="number"
                  value={config.position.x}
                  onChange={(e) =>
                    updateSetting('position', {
                      ...config.position,
                      x: parseFloat(e.target.value) || 0,
                    })
                  }
                  step={0.1}
                />
              </div>
              <div>
                <Label htmlFor="pos-y" className="text-xs">Y</Label>
                <Input
                  id="pos-y"
                  type="number"
                  value={config.position.y}
                  onChange={(e) =>
                    updateSetting('position', {
                      ...config.position,
                      y: parseFloat(e.target.value) || 0,
                    })
                  }
                  step={0.1}
                />
              </div>
              <div>
                <Label htmlFor="pos-z" className="text-xs">Z</Label>
                <Input
                  id="pos-z"
                  type="number"
                  value={config.position.z}
                  onChange={(e) =>
                    updateSetting('position', {
                      ...config.position,
                      z: parseFloat(e.target.value) || 0,
                    })
                  }
                  step={0.1}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium">Rotation (degrees)</h3>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label htmlFor="rot-x" className="text-xs">X</Label>
                <Input
                  id="rot-x"
                  type="number"
                  value={config.rotation.x}
                  onChange={(e) =>
                    updateSetting('rotation', {
                      ...config.rotation,
                      x: parseFloat(e.target.value) || 0,
                    })
                  }
                  step={1}
                />
              </div>
              <div>
                <Label htmlFor="rot-y" className="text-xs">Y</Label>
                <Input
                  id="rot-y"
                  type="number"
                  value={config.rotation.y}
                  onChange={(e) =>
                    updateSetting('rotation', {
                      ...config.rotation,
                      y: parseFloat(e.target.value) || 0,
                    })
                  }
                  step={1}
                />
              </div>
              <div>
                <Label htmlFor="rot-z" className="text-xs">Z</Label>
                <Input
                  id="rot-z"
                  type="number"
                  value={config.rotation.z}
                  onChange={(e) =>
                    updateSetting('rotation', {
                      ...config.rotation,
                      z: parseFloat(e.target.value) || 0,
                    })
                  }
                  step={1}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Focus & Aperture */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Focus className="h-4 w-4" />
              Focus & Depth of Field
            </h3>

            <div className="space-y-2">
              <Label>Focus Distance: {config.focusDistance.toFixed(2)}m</Label>
              <Slider
                value={[config.focusDistance]}
                onValueChange={([focusDistance]) => updateSetting('focusDistance', focusDistance)}
                min={0.1}
                max={100}
                step={0.1}
              />
            </div>

            <div className="space-y-2">
              <Label>Aperture: f/{config.aperture.toFixed(1)}</Label>
              <Slider
                value={[config.aperture]}
                onValueChange={([aperture]) => updateSetting('aperture', aperture)}
                min={1.2}
                max={22}
                step={0.1}
              />
              <p className="text-xs text-muted-foreground">
                Lower f-stop = shallower depth of field
              </p>
            </div>
          </div>

          <Separator />

          {/* Exposure Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <SunMedium className="h-4 w-4" />
              Exposure
            </h3>

            <div className="space-y-2">
              <Label>Exposure: {config.exposure > 0 ? '+' : ''}{config.exposure.toFixed(2)} EV</Label>
              <Slider
                value={[config.exposure]}
                onValueChange={([exposure]) => updateSetting('exposure', exposure)}
                min={-3}
                max={3}
                step={0.1}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="iso">ISO</Label>
                <Select
                  value={config.iso.toString()}
                  onValueChange={(value) => updateSetting('iso', parseInt(value))}
                >
                  <SelectTrigger id="iso">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="100">100</SelectItem>
                    <SelectItem value="200">200</SelectItem>
                    <SelectItem value="400">400</SelectItem>
                    <SelectItem value="800">800</SelectItem>
                    <SelectItem value="1600">1600</SelectItem>
                    <SelectItem value="3200">3200</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="shutter">Shutter Speed</Label>
                <Select
                  value={config.shutterSpeed.toString()}
                  onValueChange={(value) => updateSetting('shutterSpeed', parseInt(value))}
                >
                  <SelectTrigger id="shutter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">1/30s</SelectItem>
                    <SelectItem value="60">1/60s</SelectItem>
                    <SelectItem value="125">1/125s</SelectItem>
                    <SelectItem value="250">1/250s</SelectItem>
                    <SelectItem value="500">1/500s</SelectItem>
                    <SelectItem value="1000">1/1000s</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Clipping Planes */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Maximize2 className="h-4 w-4" />
              Clipping Planes
            </h3>

            <div className="space-y-2">
              <Label>Near Clip: {config.clippingNear.toFixed(3)}m</Label>
              <Slider
                value={[config.clippingNear]}
                onValueChange={([clippingNear]) => updateSetting('clippingNear', clippingNear)}
                min={0.001}
                max={10}
                step={0.001}
              />
            </div>

            <div className="space-y-2">
              <Label>Far Clip: {config.clippingFar}m</Label>
              <Slider
                value={[config.clippingFar]}
                onValueChange={([clippingFar]) => updateSetting('clippingFar', clippingFar)}
                min={10}
                max={10000}
                step={10}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Saved Presets */}
      {savedPresets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Saved Presets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {savedPresets.map((preset) => (
                <div
                  key={preset.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer"
                  onClick={() => handleLoadPreset(preset)}
                >
                  <div className="flex items-center gap-3">
                    {preset.thumbnail && (
                      <div className="w-16 h-16 rounded overflow-hidden bg-muted">
                        <img
                          src={preset.thumbnail}
                          alt={preset.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div>
                      <h4 className="font-medium">{preset.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        {preset.settings.focalLength}mm • f/{preset.settings.aperture} • ISO {preset.settings.iso}
                      </p>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleLoadPreset(preset)}>
                        <Camera className="h-4 w-4 mr-2" />
                        Load Preset
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onDeletePreset?.(preset.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
