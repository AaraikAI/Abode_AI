'use client'

/**
 * Render Settings Component
 *
 * Configure render quality, resolution, samples, and denoising settings
 */

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Settings, Cpu, Zap, Camera } from 'lucide-react'

export interface RenderSettingsConfig {
  resolution: string
  samples: number
  maxBounces: number
  denoise: boolean
  denoiseMethod: 'OPTIX' | 'OPENIMAGEDENOISE' | 'NONE'
  tileSize: number
  device: 'CPU' | 'GPU' | 'OPTIX'
  adaptiveSampling: boolean
  adaptiveThreshold: number
  lightPathsTotal: number
  caustics: boolean
  motionBlur: boolean
  depthOfField: boolean
}

interface RenderSettingsProps {
  projectId: string
  settings?: Partial<RenderSettingsConfig>
  onChange?: (settings: RenderSettingsConfig) => void
}

const RESOLUTION_PRESETS = [
  { label: '720p (1280x720)', value: '1280x720' },
  { label: '1080p (1920x1080)', value: '1920x1080' },
  { label: '2K (2560x1440)', value: '2560x1440' },
  { label: '4K (3840x2160)', value: '3840x2160' },
  { label: '8K (7680x4320)', value: '7680x4320' },
]

export function RenderSettings({ projectId, settings, onChange }: RenderSettingsProps) {
  const [config, setConfig] = useState<RenderSettingsConfig>({
    resolution: settings?.resolution || '1920x1080',
    samples: settings?.samples || 128,
    maxBounces: settings?.maxBounces || 12,
    denoise: settings?.denoise !== undefined ? settings.denoise : true,
    denoiseMethod: settings?.denoiseMethod || 'OPTIX',
    tileSize: settings?.tileSize || 256,
    device: settings?.device || 'GPU',
    adaptiveSampling: settings?.adaptiveSampling !== undefined ? settings.adaptiveSampling : true,
    adaptiveThreshold: settings?.adaptiveThreshold || 0.01,
    lightPathsTotal: settings?.lightPathsTotal || 12,
    caustics: settings?.caustics !== undefined ? settings.caustics : false,
    motionBlur: settings?.motionBlur !== undefined ? settings.motionBlur : false,
    depthOfField: settings?.depthOfField !== undefined ? settings.depthOfField : true,
  })

  const updateSetting = <K extends keyof RenderSettingsConfig>(
    key: K,
    value: RenderSettingsConfig[K]
  ) => {
    const newConfig = { ...config, [key]: value }
    setConfig(newConfig)
    onChange?.(newConfig)
  }

  const getQualityLevel = (): string => {
    if (config.samples >= 512) return 'Ultra'
    if (config.samples >= 256) return 'High'
    if (config.samples >= 128) return 'Medium'
    return 'Draft'
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Render Settings
          </CardTitle>
          <CardDescription>
            Configure rendering quality and performance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Resolution */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="resolution">Resolution</Label>
              <Badge variant="outline">{config.resolution}</Badge>
            </div>
            <Select
              value={config.resolution}
              onValueChange={(value) => updateSetting('resolution', value)}
            >
              <SelectTrigger id="resolution">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RESOLUTION_PRESETS.map((preset) => (
                  <SelectItem key={preset.value} value={preset.value}>
                    {preset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Samples */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Render Samples: {config.samples}</Label>
              <Badge>{getQualityLevel()}</Badge>
            </div>
            <Slider
              min={32}
              max={2048}
              step={32}
              value={[config.samples]}
              onValueChange={([value]) => updateSetting('samples', value)}
            />
            <p className="text-xs text-muted-foreground">
              Higher samples produce better quality but take longer to render
            </p>
          </div>

          {/* Max Bounces */}
          <div className="space-y-2">
            <Label>Max Light Bounces: {config.maxBounces}</Label>
            <Slider
              min={1}
              max={24}
              step={1}
              value={[config.maxBounces]}
              onValueChange={([value]) => updateSetting('maxBounces', value)}
            />
            <p className="text-xs text-muted-foreground">
              More bounces improve indirect lighting accuracy
            </p>
          </div>

          <Separator />

          {/* Denoising */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="denoise">AI Denoising</Label>
                <p className="text-xs text-muted-foreground">
                  Reduce noise without increasing samples
                </p>
              </div>
              <Switch
                id="denoise"
                checked={config.denoise}
                onCheckedChange={(checked) => updateSetting('denoise', checked)}
              />
            </div>

            {config.denoise && (
              <div className="space-y-2 ml-4">
                <Label>Denoising Method</Label>
                <Select
                  value={config.denoiseMethod}
                  onValueChange={(value: any) => updateSetting('denoiseMethod', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPTIX">OptiX (NVIDIA GPU)</SelectItem>
                    <SelectItem value="OPENIMAGEDENOISE">OpenImageDenoise (CPU/GPU)</SelectItem>
                    <SelectItem value="NONE">None</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <Separator />

          {/* Device */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Cpu className="h-4 w-4" />
              Render Device
            </Label>
            <Select
              value={config.device}
              onValueChange={(value: any) => updateSetting('device', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CPU">CPU</SelectItem>
                <SelectItem value="GPU">GPU (CUDA/HIP)</SelectItem>
                <SelectItem value="OPTIX">GPU (OptiX - NVIDIA only)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tile Size */}
          <div className="space-y-2">
            <Label>Tile Size: {config.tileSize}px</Label>
            <Slider
              min={64}
              max={1024}
              step={64}
              value={[config.tileSize]}
              onValueChange={([value]) => updateSetting('tileSize', value)}
            />
            <p className="text-xs text-muted-foreground">
              Smaller tiles use less memory but may be slower
            </p>
          </div>

          <Separator />

          {/* Advanced Options */}
          <div className="space-y-4">
            <Label className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Advanced Options
            </Label>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="adaptive-sampling">Adaptive Sampling</Label>
                <p className="text-xs text-muted-foreground">
                  Dynamically adjust samples per pixel
                </p>
              </div>
              <Switch
                id="adaptive-sampling"
                checked={config.adaptiveSampling}
                onCheckedChange={(checked) => updateSetting('adaptiveSampling', checked)}
              />
            </div>

            {config.adaptiveSampling && (
              <div className="space-y-2 ml-4">
                <Label>Adaptive Threshold: {config.adaptiveThreshold}</Label>
                <Slider
                  min={0.001}
                  max={0.1}
                  step={0.001}
                  value={[config.adaptiveThreshold]}
                  onValueChange={([value]) => updateSetting('adaptiveThreshold', value)}
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <Label htmlFor="caustics">Caustics</Label>
              <Switch
                id="caustics"
                checked={config.caustics}
                onCheckedChange={(checked) => updateSetting('caustics', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="motion-blur">Motion Blur</Label>
              <Switch
                id="motion-blur"
                checked={config.motionBlur}
                onCheckedChange={(checked) => updateSetting('motionBlur', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="dof" className="flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  Depth of Field
                </Label>
              </div>
              <Switch
                id="dof"
                checked={config.depthOfField}
                onCheckedChange={(checked) => updateSetting('depthOfField', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
