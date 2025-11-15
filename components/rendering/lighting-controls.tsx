'use client'

/**
 * Lighting Controls Component
 *
 * HDRI selection, sun position, intensity, ambient settings
 */

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Sun,
  Moon,
  Lightbulb,
  Sunrise,
  Sunset,
  CloudSun,
  Image as ImageIcon,
  Upload,
  RotateCw,
} from 'lucide-react'

export interface LightingSettings {
  hdri: {
    enabled: boolean
    preset: string
    customUrl?: string
    rotation: number
    intensity: number
    contrast: number
    saturation: number
  }
  sun: {
    enabled: boolean
    elevation: number
    azimuth: number
    intensity: number
    color: string
    softness: number
    castShadows: boolean
  }
  ambient: {
    enabled: boolean
    color: string
    intensity: number
  }
  skybox: {
    enabled: boolean
    type: 'procedural' | 'hdri'
    turbidity: number
    groundAlbedo: number
  }
}

interface LightingControlsProps {
  settings?: Partial<LightingSettings>
  onChange?: (settings: LightingSettings) => void
  onReset?: () => void
}

const HDRI_PRESETS = [
  { value: 'studio-soft', label: 'Studio Soft', icon: Lightbulb },
  { value: 'studio-hard', label: 'Studio Hard', icon: Lightbulb },
  { value: 'outdoor-day', label: 'Outdoor Day', icon: Sun },
  { value: 'outdoor-sunset', label: 'Outdoor Sunset', icon: Sunset },
  { value: 'outdoor-sunrise', label: 'Outdoor Sunrise', icon: Sunrise },
  { value: 'outdoor-overcast', label: 'Outdoor Overcast', icon: CloudSun },
  { value: 'outdoor-night', label: 'Outdoor Night', icon: Moon },
  { value: 'interior-soft', label: 'Interior Soft', icon: Lightbulb },
  { value: 'custom', label: 'Custom HDRI', icon: Upload },
]

const DEFAULT_SETTINGS: LightingSettings = {
  hdri: {
    enabled: true,
    preset: 'outdoor-day',
    rotation: 0,
    intensity: 1,
    contrast: 1,
    saturation: 1,
  },
  sun: {
    enabled: true,
    elevation: 45,
    azimuth: 135,
    intensity: 1,
    color: '#ffffff',
    softness: 0.5,
    castShadows: true,
  },
  ambient: {
    enabled: true,
    color: '#ffffff',
    intensity: 0.3,
  },
  skybox: {
    enabled: true,
    type: 'hdri',
    turbidity: 2,
    groundAlbedo: 0.3,
  },
}

export function LightingControls({ settings, onChange, onReset }: LightingControlsProps) {
  const [config, setConfig] = useState<LightingSettings>({
    ...DEFAULT_SETTINGS,
    ...settings,
  })

  const updateSetting = <K extends keyof LightingSettings>(
    category: K,
    updates: Partial<LightingSettings[K]>
  ) => {
    const newConfig = {
      ...config,
      [category]: { ...config[category], ...updates },
    }
    setConfig(newConfig)
    onChange?.(newConfig)
  }

  const handleReset = () => {
    setConfig(DEFAULT_SETTINGS)
    onChange?.(DEFAULT_SETTINGS)
    onReset?.()
  }

  const formatAngle = (angle: number): string => {
    return `${angle}°`
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sun className="h-5 w-5" />
              Lighting Controls
            </CardTitle>
            <CardDescription>
              Configure environment lighting and sun settings
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <RotateCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="hdri" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="hdri">
              <ImageIcon className="h-4 w-4 mr-1" />
              HDRI
            </TabsTrigger>
            <TabsTrigger value="sun">
              <Sun className="h-4 w-4 mr-1" />
              Sun
            </TabsTrigger>
            <TabsTrigger value="ambient">
              <CloudSun className="h-4 w-4 mr-1" />
              Ambient
            </TabsTrigger>
          </TabsList>

          {/* HDRI Settings */}
          <TabsContent value="hdri" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="hdri-enabled">Enable HDRI Lighting</Label>
              <Switch
                id="hdri-enabled"
                checked={config.hdri.enabled}
                onCheckedChange={(enabled) => updateSetting('hdri', { enabled })}
              />
            </div>

            {config.hdri.enabled && (
              <>
                <Separator />

                {/* HDRI Preset Selection */}
                <div className="space-y-2">
                  <Label>HDRI Preset</Label>
                  <Select
                    value={config.hdri.preset}
                    onValueChange={(preset) => updateSetting('hdri', { preset })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {HDRI_PRESETS.map((preset) => {
                        const Icon = preset.icon
                        return (
                          <SelectItem key={preset.value} value={preset.value}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              {preset.label}
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* Custom HDRI Upload */}
                {config.hdri.preset === 'custom' && (
                  <div className="space-y-2">
                    <Label>Custom HDRI URL</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="https://example.com/hdri.exr"
                        value={config.hdri.customUrl || ''}
                        onChange={(e) => updateSetting('hdri', { customUrl: e.target.value })}
                      />
                      <Button variant="outline" size="sm">
                        <Upload className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                <Separator />

                {/* HDRI Adjustments */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Rotation: {formatAngle(config.hdri.rotation)}</Label>
                    <Slider
                      value={[config.hdri.rotation]}
                      onValueChange={([rotation]) => updateSetting('hdri', { rotation })}
                      min={0}
                      max={360}
                      step={1}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Intensity: {config.hdri.intensity.toFixed(2)}</Label>
                    <Slider
                      value={[config.hdri.intensity]}
                      onValueChange={([intensity]) => updateSetting('hdri', { intensity })}
                      min={0}
                      max={5}
                      step={0.1}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Contrast: {config.hdri.contrast.toFixed(2)}</Label>
                    <Slider
                      value={[config.hdri.contrast]}
                      onValueChange={([contrast]) => updateSetting('hdri', { contrast })}
                      min={0}
                      max={2}
                      step={0.05}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Saturation: {config.hdri.saturation.toFixed(2)}</Label>
                    <Slider
                      value={[config.hdri.saturation]}
                      onValueChange={([saturation]) => updateSetting('hdri', { saturation })}
                      min={0}
                      max={2}
                      step={0.05}
                    />
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          {/* Sun Settings */}
          <TabsContent value="sun" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="sun-enabled">Enable Sun Light</Label>
              <Switch
                id="sun-enabled"
                checked={config.sun.enabled}
                onCheckedChange={(enabled) => updateSetting('sun', { enabled })}
              />
            </div>

            {config.sun.enabled && (
              <>
                <Separator />

                {/* Sun Position */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Sun Position</h4>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Elevation (Altitude)</Label>
                          <span className="text-sm font-medium">
                            {formatAngle(config.sun.elevation)}
                          </span>
                        </div>
                        <Slider
                          value={[config.sun.elevation]}
                          onValueChange={([elevation]) => updateSetting('sun', { elevation })}
                          min={0}
                          max={90}
                          step={1}
                        />
                        <p className="text-xs text-muted-foreground">
                          0° = horizon, 90° = zenith
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Azimuth (Direction)</Label>
                          <span className="text-sm font-medium">
                            {formatAngle(config.sun.azimuth)}
                          </span>
                        </div>
                        <Slider
                          value={[config.sun.azimuth]}
                          onValueChange={([azimuth]) => updateSetting('sun', { azimuth })}
                          min={0}
                          max={360}
                          step={1}
                        />
                        <p className="text-xs text-muted-foreground">
                          0° = north, 90° = east, 180° = south, 270° = west
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Sun Quick Presets */}
                  <div>
                    <Label className="mb-2 block">Quick Presets</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateSetting('sun', { elevation: 15, azimuth: 90 })}
                      >
                        <Sunrise className="h-4 w-4 mr-2" />
                        Sunrise
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateSetting('sun', { elevation: 60, azimuth: 180 })}
                      >
                        <Sun className="h-4 w-4 mr-2" />
                        Noon
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateSetting('sun', { elevation: 15, azimuth: 270 })}
                      >
                        <Sunset className="h-4 w-4 mr-2" />
                        Sunset
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateSetting('sun', { elevation: 45, azimuth: 135 })}
                      >
                        Default
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  {/* Sun Properties */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Intensity: {config.sun.intensity.toFixed(2)}</Label>
                      <Slider
                        value={[config.sun.intensity]}
                        onValueChange={([intensity]) => updateSetting('sun', { intensity })}
                        min={0}
                        max={10}
                        step={0.1}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Softness: {config.sun.softness.toFixed(2)}</Label>
                      <Slider
                        value={[config.sun.softness]}
                        onValueChange={([softness]) => updateSetting('sun', { softness })}
                        min={0}
                        max={1}
                        step={0.05}
                      />
                      <p className="text-xs text-muted-foreground">
                        Higher values create softer shadows
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Sun Color</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={config.sun.color}
                          onChange={(e) => updateSetting('sun', { color: e.target.value })}
                          className="w-20 h-10"
                        />
                        <Input
                          type="text"
                          value={config.sun.color}
                          onChange={(e) => updateSetting('sun', { color: e.target.value })}
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="cast-shadows">Cast Shadows</Label>
                      <Switch
                        id="cast-shadows"
                        checked={config.sun.castShadows}
                        onCheckedChange={(castShadows) =>
                          updateSetting('sun', { castShadows })
                        }
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          {/* Ambient Settings */}
          <TabsContent value="ambient" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="ambient-enabled">Enable Ambient Light</Label>
              <Switch
                id="ambient-enabled"
                checked={config.ambient.enabled}
                onCheckedChange={(enabled) => updateSetting('ambient', { enabled })}
              />
            </div>

            {config.ambient.enabled && (
              <>
                <Separator />

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Intensity: {config.ambient.intensity.toFixed(2)}</Label>
                    <Slider
                      value={[config.ambient.intensity]}
                      onValueChange={([intensity]) => updateSetting('ambient', { intensity })}
                      min={0}
                      max={2}
                      step={0.05}
                    />
                    <p className="text-xs text-muted-foreground">
                      Ambient light fills in shadows and provides base illumination
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Ambient Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={config.ambient.color}
                        onChange={(e) => updateSetting('ambient', { color: e.target.value })}
                        className="w-20 h-10"
                      />
                      <Input
                        type="text"
                        value={config.ambient.color}
                        onChange={(e) => updateSetting('ambient', { color: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Skybox Settings */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Enable Skybox</Label>
                    <Switch
                      checked={config.skybox.enabled}
                      onCheckedChange={(enabled) => updateSetting('skybox', { enabled })}
                    />
                  </div>

                  {config.skybox.enabled && (
                    <>
                      <div className="space-y-2">
                        <Label>Skybox Type</Label>
                        <Select
                          value={config.skybox.type}
                          onValueChange={(type: 'procedural' | 'hdri') =>
                            updateSetting('skybox', { type })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="procedural">Procedural Sky</SelectItem>
                            <SelectItem value="hdri">HDRI Environment</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {config.skybox.type === 'procedural' && (
                        <>
                          <div className="space-y-2">
                            <Label>Turbidity: {config.skybox.turbidity.toFixed(1)}</Label>
                            <Slider
                              value={[config.skybox.turbidity]}
                              onValueChange={([turbidity]) =>
                                updateSetting('skybox', { turbidity })
                              }
                              min={1}
                              max={10}
                              step={0.1}
                            />
                            <p className="text-xs text-muted-foreground">
                              Controls atmospheric haze and sky color
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label>Ground Albedo: {config.skybox.groundAlbedo.toFixed(2)}</Label>
                            <Slider
                              value={[config.skybox.groundAlbedo]}
                              onValueChange={([groundAlbedo]) =>
                                updateSetting('skybox', { groundAlbedo })
                              }
                              min={0}
                              max={1}
                              step={0.05}
                            />
                            <p className="text-xs text-muted-foreground">
                              Ground reflectivity affects overall scene lighting
                            </p>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
