'use client'

/**
 * Render Settings Panel
 *
 * Advanced rendering controls for Blender and post-processing
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import {
  Camera,
  Sparkles,
  Palette,
  Sun,
  Loader2,
  Play,
  Zap,
  Wand2,
  Film
} from 'lucide-react'

interface RenderSettings {
  // Basic settings
  renderType: 'still' | 'walkthrough' | 'panorama'
  quality: '1080p' | '4k' | '8k'
  engine: 'CYCLES' | 'EEVEE'
  samples: number
  denoise: boolean

  // Post-processing
  postFx: {
    tonemapping: {
      enabled: boolean
      operator: 'FILMIC' | 'ACES' | 'REINHARD' | 'UNCHARTED2'
      whitePoint: number
    }
    colorGrading: {
      enabled: boolean
      temperature: number
      tint: number
      saturation: number
      contrast: number
      brightness: number
      lut?: string
    }
    bloom: {
      enabled: boolean
      threshold: number
      intensity: number
      radius: number
    }
    vignette: {
      enabled: boolean
      intensity: number
      roundness: number
    }
    chromaticAberration: {
      enabled: boolean
      intensity: number
    }
    filmGrain: {
      enabled: boolean
      intensity: number
      size: number
    }
    sharpen: {
      enabled: boolean
      intensity: number
    }
  }

  // Walkthrough settings
  fps?: number
  duration?: number
}

interface RenderSettingsPanelProps {
  projectId: string
  sceneData?: any
  onRenderStart?: (settings: RenderSettings) => void
}

export function RenderSettingsPanel({
  projectId,
  sceneData,
  onRenderStart
}: RenderSettingsPanelProps) {
  const { toast } = useToast()
  const [isRendering, setIsRendering] = useState(false)

  // Basic settings
  const [renderType, setRenderType] = useState<'still' | 'walkthrough' | 'panorama'>('still')
  const [quality, setQuality] = useState<'1080p' | '4k' | '8k'>('4k')
  const [engine, setEngine] = useState<'CYCLES' | 'EEVEE'>('CYCLES')
  const [samples, setSamples] = useState(256)
  const [denoise, setDenoise] = useState(true)

  // Post-processing
  const [tonemappingEnabled, setTonemappingEnabled] = useState(true)
  const [tonemappingOperator, setTonemappingOperator] = useState<'FILMIC' | 'ACES' | 'REINHARD' | 'UNCHARTED2'>('FILMIC')
  const [whitePoint, setWhitePoint] = useState(1.0)

  const [colorGradingEnabled, setColorGradingEnabled] = useState(false)
  const [temperature, setTemperature] = useState(0)
  const [tint, setTint] = useState(0)
  const [saturation, setSaturation] = useState(1.0)
  const [contrast, setContrast] = useState(1.0)
  const [brightness, setBrightness] = useState(0)

  const [bloomEnabled, setBloomEnabled] = useState(false)
  const [bloomThreshold, setBloomThreshold] = useState(0.8)
  const [bloomIntensity, setBloomIntensity] = useState(0.3)
  const [bloomRadius, setBloomRadius] = useState(5)

  const [vignetteEnabled, setVignetteEnabled] = useState(false)
  const [vignetteIntensity, setVignetteIntensity] = useState(0.5)
  const [vignetteRoundness, setVignetteRoundness] = useState(0.5)

  const [chromaticAberrationEnabled, setChromaticAberrationEnabled] = useState(false)
  const [chromaticAberrationIntensity, setChromaticAberrationIntensity] = useState(0.5)

  const [filmGrainEnabled, setFilmGrainEnabled] = useState(false)
  const [filmGrainIntensity, setFilmGrainIntensity] = useState(0.1)
  const [filmGrainSize, setFilmGrainSize] = useState(1.0)

  const [sharpenEnabled, setSharpenEnabled] = useState(false)
  const [sharpenIntensity, setSharpenIntensity] = useState(0.5)

  // Walkthrough settings
  const [fps, setFps] = useState(30)
  const [duration, setDuration] = useState(10)

  /**
   * Calculate estimated credits
   */
  const calculateCredits = (): number => {
    const baseCredits = {
      still: { '1080p': 10, '4k': 25, '8k': 50 },
      walkthrough: { '1080p': 50, '4k': 100, '8k': 200 },
      panorama: { '1080p': 30, '4k': 75, '8k': 150 }
    }

    const engineMultiplier = engine === 'CYCLES' ? 1.5 : 1.0
    let credits = baseCredits[renderType][quality]
    credits *= engineMultiplier

    if (renderType === 'walkthrough') {
      credits *= Math.ceil(duration / 10)
    }

    return Math.ceil(credits)
  }

  /**
   * Calculate estimated render time
   */
  const calculateRenderTime = (): number => {
    const baseTimes = {
      still: { '1080p': 120, '4k': 300, '8k': 600 },
      walkthrough: { '1080p': 600, '4k': 1200, '8k': 2400 },
      panorama: { '1080p': 240, '4k': 600, '8k': 1200 }
    }

    const engineMultiplier = engine === 'CYCLES' ? 1.5 : 1.0
    const sampleMultiplier = samples / 128
    let time = baseTimes[renderType][quality]
    time *= engineMultiplier * sampleMultiplier

    if (renderType === 'walkthrough') {
      time *= Math.ceil(duration / 10)
    }

    return Math.ceil(time)
  }

  /**
   * Start render
   */
  const handleRender = async () => {
    if (!sceneData) {
      toast({
        title: 'Error',
        description: 'No scene data available',
        variant: 'destructive'
      })
      return
    }

    const settings: RenderSettings = {
      renderType,
      quality,
      engine,
      samples,
      denoise,
      postFx: {
        tonemapping: {
          enabled: tonemappingEnabled,
          operator: tonemappingOperator,
          whitePoint
        },
        colorGrading: {
          enabled: colorGradingEnabled,
          temperature,
          tint,
          saturation,
          contrast,
          brightness
        },
        bloom: {
          enabled: bloomEnabled,
          threshold: bloomThreshold,
          intensity: bloomIntensity,
          radius: bloomRadius
        },
        vignette: {
          enabled: vignetteEnabled,
          intensity: vignetteIntensity,
          roundness: vignetteRoundness
        },
        chromaticAberration: {
          enabled: chromaticAberrationEnabled,
          intensity: chromaticAberrationIntensity
        },
        filmGrain: {
          enabled: filmGrainEnabled,
          intensity: filmGrainIntensity,
          size: filmGrainSize
        },
        sharpen: {
          enabled: sharpenEnabled,
          intensity: sharpenIntensity
        }
      },
      ...(renderType === 'walkthrough' && { fps, duration })
    }

    setIsRendering(true)

    try {
      const response = await fetch('/api/render/blender', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projectId,
          sceneData,
          ...settings
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Render submission failed')
      }

      onRenderStart?.(settings)

      toast({
        title: 'Render Started',
        description: `Job ID: ${data.jobId}. Estimated time: ${Math.ceil(data.estimatedTime / 60)} minutes`
      })
    } catch (error: any) {
      console.error('Render error:', error)
      toast({
        title: 'Render Failed',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setIsRendering(false)
    }
  }

  const estimatedCredits = calculateCredits()
  const estimatedTime = calculateRenderTime()

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Render Settings
          </CardTitle>
          <CardDescription>
            Configure advanced rendering and post-processing options
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="text-sm font-medium">Estimated Credits</div>
              <div className="text-2xl font-bold">{estimatedCredits}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium">Estimated Time</div>
              <div className="text-2xl font-bold">{Math.ceil(estimatedTime / 60)} min</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">
            <Zap className="h-4 w-4 mr-2" />
            Basic
          </TabsTrigger>
          <TabsTrigger value="postfx">
            <Wand2 className="h-4 w-4 mr-2" />
            Post-FX
          </TabsTrigger>
          <TabsTrigger value="advanced">
            <Sparkles className="h-4 w-4 mr-2" />
            Advanced
          </TabsTrigger>
        </TabsList>

        {/* Basic Settings */}
        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Render Type</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Output Type</Label>
                <Select value={renderType} onValueChange={(value: any) => setRenderType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="still">Still Image</SelectItem>
                    <SelectItem value="walkthrough">Walkthrough Video</SelectItem>
                    <SelectItem value="panorama">360° Panorama</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Quality</Label>
                <Select value={quality} onValueChange={(value: any) => setQuality(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1080p">1080p (1920x1080)</SelectItem>
                    <SelectItem value="4k">4K (3840x2160)</SelectItem>
                    <SelectItem value="8k">8K (7680x4320)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Render Engine</Label>
                <Select value={engine} onValueChange={(value: any) => setEngine(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CYCLES">
                      <div className="flex items-center justify-between w-full">
                        <span>Cycles</span>
                        <Badge variant="secondary">Photorealistic</Badge>
                      </div>
                    </SelectItem>
                    <SelectItem value="EEVEE">
                      <div className="flex items-center justify-between w-full">
                        <span>Eevee</span>
                        <Badge variant="secondary">Fast</Badge>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Samples: {samples}</Label>
                <Slider
                  min={32}
                  max={2048}
                  step={32}
                  value={[samples]}
                  onValueChange={([value]) => setSamples(value)}
                />
                <p className="text-xs text-muted-foreground">
                  Higher samples = better quality but longer render time
                </p>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="denoise">AI Denoising</Label>
                <Switch
                  id="denoise"
                  checked={denoise}
                  onCheckedChange={setDenoise}
                />
              </div>

              {renderType === 'walkthrough' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="fps">Frame Rate (FPS)</Label>
                    <Input
                      id="fps"
                      type="number"
                      value={fps}
                      onChange={(e) => setFps(parseInt(e.target.value) || 30)}
                      min={24}
                      max={60}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration (seconds)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={duration}
                      onChange={(e) => setDuration(parseInt(e.target.value) || 10)}
                      min={1}
                      max={300}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Post-FX Settings */}
        <TabsContent value="postfx" className="space-y-4">
          <Accordion type="multiple" className="w-full">
            {/* Tonemapping */}
            <AccordionItem value="tonemapping">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <Sun className="h-4 w-4" />
                  Tonemapping
                  {tonemappingEnabled && <Badge variant="secondary">Enabled</Badge>}
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                  <Label>Enable Tonemapping</Label>
                  <Switch
                    checked={tonemappingEnabled}
                    onCheckedChange={setTonemappingEnabled}
                  />
                </div>

                {tonemappingEnabled && (
                  <>
                    <div className="space-y-2">
                      <Label>Operator</Label>
                      <Select value={tonemappingOperator} onValueChange={(value: any) => setTonemappingOperator(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="FILMIC">Filmic (Recommended)</SelectItem>
                          <SelectItem value="ACES">ACES</SelectItem>
                          <SelectItem value="REINHARD">Reinhard</SelectItem>
                          <SelectItem value="UNCHARTED2">Uncharted 2</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>White Point: {whitePoint.toFixed(2)}</Label>
                      <Slider
                        min={0.5}
                        max={2.0}
                        step={0.05}
                        value={[whitePoint]}
                        onValueChange={([value]) => setWhitePoint(value)}
                      />
                    </div>
                  </>
                )}
              </AccordionContent>
            </AccordionItem>

            {/* Color Grading */}
            <AccordionItem value="colorgrading">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Color Grading
                  {colorGradingEnabled && <Badge variant="secondary">Enabled</Badge>}
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                  <Label>Enable Color Grading</Label>
                  <Switch
                    checked={colorGradingEnabled}
                    onCheckedChange={setColorGradingEnabled}
                  />
                </div>

                {colorGradingEnabled && (
                  <>
                    <div className="space-y-2">
                      <Label>Temperature: {temperature}</Label>
                      <Slider
                        min={-100}
                        max={100}
                        step={1}
                        value={[temperature]}
                        onValueChange={([value]) => setTemperature(value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Tint: {tint}</Label>
                      <Slider
                        min={-100}
                        max={100}
                        step={1}
                        value={[tint]}
                        onValueChange={([value]) => setTint(value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Saturation: {saturation.toFixed(2)}</Label>
                      <Slider
                        min={0}
                        max={2}
                        step={0.05}
                        value={[saturation]}
                        onValueChange={([value]) => setSaturation(value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Contrast: {contrast.toFixed(2)}</Label>
                      <Slider
                        min={0}
                        max={2}
                        step={0.05}
                        value={[contrast]}
                        onValueChange={([value]) => setContrast(value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Brightness: {brightness}</Label>
                      <Slider
                        min={-100}
                        max={100}
                        step={1}
                        value={[brightness]}
                        onValueChange={([value]) => setBrightness(value)}
                      />
                    </div>
                  </>
                )}
              </AccordionContent>
            </AccordionItem>

            {/* Bloom */}
            <AccordionItem value="bloom">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Bloom
                  {bloomEnabled && <Badge variant="secondary">Enabled</Badge>}
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                  <Label>Enable Bloom</Label>
                  <Switch
                    checked={bloomEnabled}
                    onCheckedChange={setBloomEnabled}
                  />
                </div>

                {bloomEnabled && (
                  <>
                    <div className="space-y-2">
                      <Label>Threshold: {bloomThreshold.toFixed(2)}</Label>
                      <Slider
                        min={0}
                        max={1}
                        step={0.05}
                        value={[bloomThreshold]}
                        onValueChange={([value]) => setBloomThreshold(value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Intensity: {bloomIntensity.toFixed(2)}</Label>
                      <Slider
                        min={0}
                        max={1}
                        step={0.05}
                        value={[bloomIntensity]}
                        onValueChange={([value]) => setBloomIntensity(value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Radius: {bloomRadius}</Label>
                      <Slider
                        min={1}
                        max={20}
                        step={1}
                        value={[bloomRadius]}
                        onValueChange={([value]) => setBloomRadius(value)}
                      />
                    </div>
                  </>
                )}
              </AccordionContent>
            </AccordionItem>

            {/* Other effects... */}
            <AccordionItem value="other">
              <AccordionTrigger>Other Effects</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                  <Label>Vignette</Label>
                  <Switch
                    checked={vignetteEnabled}
                    onCheckedChange={setVignetteEnabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Chromatic Aberration</Label>
                  <Switch
                    checked={chromaticAberrationEnabled}
                    onCheckedChange={setChromaticAberrationEnabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Film Grain</Label>
                  <Switch
                    checked={filmGrainEnabled}
                    onCheckedChange={setFilmGrainEnabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Sharpen</Label>
                  <Switch
                    checked={sharpenEnabled}
                    onCheckedChange={setSharpenEnabled}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </TabsContent>

        {/* Advanced Settings */}
        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Options</CardTitle>
              <CardDescription>
                Fine-tune rendering parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Advanced settings will be available in a future update
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Render Button */}
      <Button
        onClick={handleRender}
        disabled={isRendering || !sceneData}
        size="lg"
        className="w-full"
      >
        {isRendering ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Rendering...
          </>
        ) : (
          <>
            <Play className="h-5 w-5 mr-2" />
            Start Render ({estimatedCredits} credits)
          </>
        )}
      </Button>
    </div>
  )
}
