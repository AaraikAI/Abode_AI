'use client'

/**
 * Quality Selector Component
 *
 * Quick quality presets for rendering (Draft, Medium, High, Ultra)
 */

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Zap,
  Gauge,
  Sparkles,
  Crown,
  Clock,
  DollarSign,
  Check
} from 'lucide-react'

export type QualityPreset = 'draft' | 'medium' | 'high' | 'ultra'

export interface QualityConfig {
  samples: number
  resolution: string
  denoise: boolean
  maxBounces: number
  estimatedTime: number // in seconds
  estimatedCredits: number
}

interface QualitySelectorProps {
  currentQuality?: QualityPreset
  onQualityChange?: (quality: QualityPreset, config: QualityConfig) => void
  resolution?: string
}

const QUALITY_PRESETS: Record<QualityPreset, QualityConfig> = {
  draft: {
    samples: 32,
    resolution: '1280x720',
    denoise: true,
    maxBounces: 4,
    estimatedTime: 60,
    estimatedCredits: 5,
  },
  medium: {
    samples: 128,
    resolution: '1920x1080',
    denoise: true,
    maxBounces: 8,
    estimatedTime: 180,
    estimatedCredits: 15,
  },
  high: {
    samples: 256,
    resolution: '3840x2160',
    denoise: true,
    maxBounces: 12,
    estimatedTime: 600,
    estimatedCredits: 40,
  },
  ultra: {
    samples: 512,
    resolution: '3840x2160',
    denoise: true,
    maxBounces: 24,
    estimatedTime: 1800,
    estimatedCredits: 100,
  },
}

const PRESET_INFO = {
  draft: {
    icon: Zap,
    label: 'Draft',
    description: 'Fast previews and quick iterations',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  medium: {
    icon: Gauge,
    label: 'Medium',
    description: 'Balanced quality and speed',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  high: {
    icon: Sparkles,
    label: 'High',
    description: 'Production-quality renders',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  ultra: {
    icon: Crown,
    label: 'Ultra',
    description: 'Maximum quality, photorealistic',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
  },
}

export function QualitySelector({
  currentQuality = 'medium',
  onQualityChange,
  resolution
}: QualitySelectorProps) {
  const [selectedQuality, setSelectedQuality] = useState<QualityPreset>(currentQuality)

  const handleQualitySelect = (quality: QualityPreset) => {
    setSelectedQuality(quality)
    const config = { ...QUALITY_PRESETS[quality] }

    // Override resolution if provided
    if (resolution) {
      config.resolution = resolution
    }

    onQualityChange?.(quality, config)
  }

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`
    if (seconds < 3600) return `${Math.round(seconds / 60)}min`
    return `${Math.round(seconds / 3600)}h`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quality Presets</CardTitle>
        <CardDescription>
          Choose a rendering quality preset or customize settings
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(PRESET_INFO).map(([key, info]) => {
            const quality = key as QualityPreset
            const config = QUALITY_PRESETS[quality]
            const Icon = info.icon
            const isSelected = selectedQuality === quality

            return (
              <button
                key={quality}
                onClick={() => handleQualitySelect(quality)}
                className={`
                  relative p-4 rounded-lg border-2 transition-all text-left
                  ${isSelected
                    ? 'border-primary bg-primary/5 shadow-md'
                    : 'border-border hover:border-primary/50 hover:bg-accent'
                  }
                `}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <div className="bg-primary text-primary-foreground rounded-full p-1">
                      <Check className="h-4 w-4" />
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${info.bgColor}`}>
                    <Icon className={`h-6 w-6 ${info.color}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{info.label}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {info.description}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Samples:</span>
                    <Badge variant="outline">{config.samples}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Resolution:</span>
                    <Badge variant="outline">{resolution || config.resolution}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      Est. Time:
                    </span>
                    <span className="font-medium">{formatTime(config.estimatedTime)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <DollarSign className="h-3 w-3" />
                      Credits:
                    </span>
                    <span className="font-medium">{config.estimatedCredits}</span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Selected Quality Summary */}
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="font-semibold mb-2">Selected Configuration</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Quality</div>
              <div className="font-semibold capitalize">{selectedQuality}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Samples</div>
              <div className="font-semibold">{QUALITY_PRESETS[selectedQuality].samples}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Max Bounces</div>
              <div className="font-semibold">{QUALITY_PRESETS[selectedQuality].maxBounces}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Denoising</div>
              <div className="font-semibold">
                {QUALITY_PRESETS[selectedQuality].denoise ? 'Enabled' : 'Disabled'}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
