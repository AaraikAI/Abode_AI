'use client'

/**
 * Post-FX Controls Component
 *
 * Post-processing effects: bloom, DOF, color grading, vignette, etc.
 */

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Wand2,
  Sparkles,
  Palette,
  Focus,
  Contrast,
  Droplets,
  Film,
  CircleDot,
  RotateCcw,
} from 'lucide-react'

export interface PostFXSettings {
  bloom: {
    enabled: boolean
    threshold: number
    intensity: number
    radius: number
  }
  depthOfField: {
    enabled: boolean
    focusDistance: number
    focalLength: number
    fStop: number
    bokehShape: 'circular' | 'hexagonal' | 'octagonal'
  }
  colorGrading: {
    enabled: boolean
    temperature: number
    tint: number
    exposure: number
    contrast: number
    saturation: number
    vibrance: number
    highlights: number
    shadows: number
    whites: number
    blacks: number
  }
  vignette: {
    enabled: boolean
    intensity: number
    roundness: number
    smoothness: number
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
  glare: {
    enabled: boolean
    threshold: number
    intensity: number
    streaks: number
  }
}

interface PostFXControlsProps {
  settings?: Partial<PostFXSettings>
  onChange?: (settings: PostFXSettings) => void
  onReset?: () => void
}

const DEFAULT_SETTINGS: PostFXSettings = {
  bloom: { enabled: false, threshold: 0.8, intensity: 0.3, radius: 5 },
  depthOfField: {
    enabled: false,
    focusDistance: 10,
    focalLength: 50,
    fStop: 2.8,
    bokehShape: 'hexagonal',
  },
  colorGrading: {
    enabled: false,
    temperature: 0,
    tint: 0,
    exposure: 0,
    contrast: 0,
    saturation: 0,
    vibrance: 0,
    highlights: 0,
    shadows: 0,
    whites: 0,
    blacks: 0,
  },
  vignette: { enabled: false, intensity: 0.5, roundness: 0.5, smoothness: 0.5 },
  chromaticAberration: { enabled: false, intensity: 0.5 },
  filmGrain: { enabled: false, intensity: 0.1, size: 1.0 },
  sharpen: { enabled: false, intensity: 0.5 },
  glare: { enabled: false, threshold: 0.9, intensity: 0.3, streaks: 4 },
}

export function PostFXControls({ settings, onChange, onReset }: PostFXControlsProps) {
  const [config, setConfig] = useState<PostFXSettings>({
    ...DEFAULT_SETTINGS,
    ...settings,
  })

  const updateEffect = <K extends keyof PostFXSettings>(
    effect: K,
    updates: Partial<PostFXSettings[K]>
  ) => {
    const newConfig = {
      ...config,
      [effect]: { ...config[effect], ...updates },
    }
    setConfig(newConfig)
    onChange?.(newConfig)
  }

  const handleReset = () => {
    setConfig(DEFAULT_SETTINGS)
    onChange?.(DEFAULT_SETTINGS)
    onReset?.()
  }

  const activeEffectsCount = Object.values(config).filter(
    (effect: any) => effect.enabled
  ).length

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5" />
              Post-Processing Effects
            </CardTitle>
            <CardDescription>
              Add cinematic effects to your renders
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline">{activeEffectsCount} active</Badge>
            <Button variant="ghost" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset All
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="bloom" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="bloom">
              <Sparkles className="h-4 w-4 mr-1" />
              Bloom
            </TabsTrigger>
            <TabsTrigger value="dof">
              <Focus className="h-4 w-4 mr-1" />
              DOF
            </TabsTrigger>
            <TabsTrigger value="color">
              <Palette className="h-4 w-4 mr-1" />
              Color
            </TabsTrigger>
            <TabsTrigger value="effects">
              <Film className="h-4 w-4 mr-1" />
              Effects
            </TabsTrigger>
          </TabsList>

          {/* Bloom */}
          <TabsContent value="bloom" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="bloom-enabled" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Enable Bloom
              </Label>
              <Switch
                id="bloom-enabled"
                checked={config.bloom.enabled}
                onCheckedChange={(enabled) => updateEffect('bloom', { enabled })}
              />
            </div>

            {config.bloom.enabled && (
              <>
                <Separator />
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Threshold: {config.bloom.threshold.toFixed(2)}</Label>
                    <Slider
                      value={[config.bloom.threshold]}
                      onValueChange={([threshold]) => updateEffect('bloom', { threshold })}
                      min={0}
                      max={1}
                      step={0.05}
                    />
                    <p className="text-xs text-muted-foreground">
                      Only pixels brighter than this will bloom
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Intensity: {config.bloom.intensity.toFixed(2)}</Label>
                    <Slider
                      value={[config.bloom.intensity]}
                      onValueChange={([intensity]) => updateEffect('bloom', { intensity })}
                      min={0}
                      max={2}
                      step={0.05}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Radius: {config.bloom.radius}</Label>
                    <Slider
                      value={[config.bloom.radius]}
                      onValueChange={([radius]) => updateEffect('bloom', { radius })}
                      min={1}
                      max={20}
                      step={1}
                    />
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          {/* Depth of Field */}
          <TabsContent value="dof" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="dof-enabled" className="flex items-center gap-2">
                <Focus className="h-4 w-4" />
                Enable Depth of Field
              </Label>
              <Switch
                id="dof-enabled"
                checked={config.depthOfField.enabled}
                onCheckedChange={(enabled) => updateEffect('depthOfField', { enabled })}
              />
            </div>

            {config.depthOfField.enabled && (
              <>
                <Separator />
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Focus Distance: {config.depthOfField.focusDistance.toFixed(1)}m</Label>
                    <Slider
                      value={[config.depthOfField.focusDistance]}
                      onValueChange={([focusDistance]) =>
                        updateEffect('depthOfField', { focusDistance })
                      }
                      min={0.1}
                      max={100}
                      step={0.1}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Focal Length: {config.depthOfField.focalLength}mm</Label>
                    <Slider
                      value={[config.depthOfField.focalLength]}
                      onValueChange={([focalLength]) =>
                        updateEffect('depthOfField', { focalLength })
                      }
                      min={14}
                      max={200}
                      step={1}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>F-Stop: f/{config.depthOfField.fStop.toFixed(1)}</Label>
                    <Slider
                      value={[config.depthOfField.fStop]}
                      onValueChange={([fStop]) => updateEffect('depthOfField', { fStop })}
                      min={1.2}
                      max={22}
                      step={0.1}
                    />
                    <p className="text-xs text-muted-foreground">
                      Lower f-stop = more blur
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Bokeh Shape</Label>
                    <Select
                      value={config.depthOfField.bokehShape}
                      onValueChange={(bokehShape: any) =>
                        updateEffect('depthOfField', { bokehShape })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="circular">Circular</SelectItem>
                        <SelectItem value="hexagonal">Hexagonal</SelectItem>
                        <SelectItem value="octagonal">Octagonal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          {/* Color Grading */}
          <TabsContent value="color" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="color-enabled" className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Enable Color Grading
              </Label>
              <Switch
                id="color-enabled"
                checked={config.colorGrading.enabled}
                onCheckedChange={(enabled) => updateEffect('colorGrading', { enabled })}
              />
            </div>

            {config.colorGrading.enabled && (
              <>
                <Separator />
                <Accordion type="multiple" className="w-full">
                  <AccordionItem value="basic">
                    <AccordionTrigger>Basic Adjustments</AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label>Temperature: {config.colorGrading.temperature}</Label>
                        <Slider
                          value={[config.colorGrading.temperature]}
                          onValueChange={([temperature]) =>
                            updateEffect('colorGrading', { temperature })
                          }
                          min={-100}
                          max={100}
                          step={1}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Tint: {config.colorGrading.tint}</Label>
                        <Slider
                          value={[config.colorGrading.tint]}
                          onValueChange={([tint]) => updateEffect('colorGrading', { tint })}
                          min={-100}
                          max={100}
                          step={1}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Exposure: {config.colorGrading.exposure.toFixed(2)}</Label>
                        <Slider
                          value={[config.colorGrading.exposure]}
                          onValueChange={([exposure]) => updateEffect('colorGrading', { exposure })}
                          min={-2}
                          max={2}
                          step={0.1}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Contrast: {config.colorGrading.contrast.toFixed(2)}</Label>
                        <Slider
                          value={[config.colorGrading.contrast]}
                          onValueChange={([contrast]) => updateEffect('colorGrading', { contrast })}
                          min={-1}
                          max={1}
                          step={0.05}
                        />
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="saturation">
                    <AccordionTrigger>Saturation & Vibrance</AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label>Saturation: {config.colorGrading.saturation.toFixed(2)}</Label>
                        <Slider
                          value={[config.colorGrading.saturation]}
                          onValueChange={([saturation]) =>
                            updateEffect('colorGrading', { saturation })
                          }
                          min={-1}
                          max={1}
                          step={0.05}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Vibrance: {config.colorGrading.vibrance.toFixed(2)}</Label>
                        <Slider
                          value={[config.colorGrading.vibrance]}
                          onValueChange={([vibrance]) => updateEffect('colorGrading', { vibrance })}
                          min={-1}
                          max={1}
                          step={0.05}
                        />
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="tonal">
                    <AccordionTrigger>Tonal Range</AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label>Highlights: {config.colorGrading.highlights}</Label>
                        <Slider
                          value={[config.colorGrading.highlights]}
                          onValueChange={([highlights]) =>
                            updateEffect('colorGrading', { highlights })
                          }
                          min={-100}
                          max={100}
                          step={1}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Shadows: {config.colorGrading.shadows}</Label>
                        <Slider
                          value={[config.colorGrading.shadows]}
                          onValueChange={([shadows]) => updateEffect('colorGrading', { shadows })}
                          min={-100}
                          max={100}
                          step={1}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Whites: {config.colorGrading.whites}</Label>
                        <Slider
                          value={[config.colorGrading.whites]}
                          onValueChange={([whites]) => updateEffect('colorGrading', { whites })}
                          min={-100}
                          max={100}
                          step={1}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Blacks: {config.colorGrading.blacks}</Label>
                        <Slider
                          value={[config.colorGrading.blacks]}
                          onValueChange={([blacks]) => updateEffect('colorGrading', { blacks })}
                          min={-100}
                          max={100}
                          step={1}
                        />
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </>
            )}
          </TabsContent>

          {/* Other Effects */}
          <TabsContent value="effects" className="space-y-4 mt-4">
            <Accordion type="multiple" className="w-full">
              {/* Vignette */}
              <AccordionItem value="vignette">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <CircleDot className="h-4 w-4" />
                    Vignette
                    {config.vignette.enabled && <Badge variant="secondary">On</Badge>}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div className="flex items-center justify-between">
                    <Label>Enable</Label>
                    <Switch
                      checked={config.vignette.enabled}
                      onCheckedChange={(enabled) => updateEffect('vignette', { enabled })}
                    />
                  </div>
                  {config.vignette.enabled && (
                    <>
                      <div className="space-y-2">
                        <Label>Intensity: {config.vignette.intensity.toFixed(2)}</Label>
                        <Slider
                          value={[config.vignette.intensity]}
                          onValueChange={([intensity]) => updateEffect('vignette', { intensity })}
                          min={0}
                          max={1}
                          step={0.05}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Roundness: {config.vignette.roundness.toFixed(2)}</Label>
                        <Slider
                          value={[config.vignette.roundness]}
                          onValueChange={([roundness]) => updateEffect('vignette', { roundness })}
                          min={0}
                          max={1}
                          step={0.05}
                        />
                      </div>
                    </>
                  )}
                </AccordionContent>
              </AccordionItem>

              {/* Chromatic Aberration */}
              <AccordionItem value="chromatic">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Droplets className="h-4 w-4" />
                    Chromatic Aberration
                    {config.chromaticAberration.enabled && <Badge variant="secondary">On</Badge>}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div className="flex items-center justify-between">
                    <Label>Enable</Label>
                    <Switch
                      checked={config.chromaticAberration.enabled}
                      onCheckedChange={(enabled) =>
                        updateEffect('chromaticAberration', { enabled })
                      }
                    />
                  </div>
                  {config.chromaticAberration.enabled && (
                    <div className="space-y-2">
                      <Label>Intensity: {config.chromaticAberration.intensity.toFixed(2)}</Label>
                      <Slider
                        value={[config.chromaticAberration.intensity]}
                        onValueChange={([intensity]) =>
                          updateEffect('chromaticAberration', { intensity })
                        }
                        min={0}
                        max={1}
                        step={0.05}
                      />
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>

              {/* Film Grain */}
              <AccordionItem value="grain">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Film className="h-4 w-4" />
                    Film Grain
                    {config.filmGrain.enabled && <Badge variant="secondary">On</Badge>}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div className="flex items-center justify-between">
                    <Label>Enable</Label>
                    <Switch
                      checked={config.filmGrain.enabled}
                      onCheckedChange={(enabled) => updateEffect('filmGrain', { enabled })}
                    />
                  </div>
                  {config.filmGrain.enabled && (
                    <>
                      <div className="space-y-2">
                        <Label>Intensity: {config.filmGrain.intensity.toFixed(2)}</Label>
                        <Slider
                          value={[config.filmGrain.intensity]}
                          onValueChange={([intensity]) => updateEffect('filmGrain', { intensity })}
                          min={0}
                          max={1}
                          step={0.05}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Size: {config.filmGrain.size.toFixed(2)}</Label>
                        <Slider
                          value={[config.filmGrain.size]}
                          onValueChange={([size]) => updateEffect('filmGrain', { size })}
                          min={0.5}
                          max={2}
                          step={0.1}
                        />
                      </div>
                    </>
                  )}
                </AccordionContent>
              </AccordionItem>

              {/* Sharpen */}
              <AccordionItem value="sharpen">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Contrast className="h-4 w-4" />
                    Sharpen
                    {config.sharpen.enabled && <Badge variant="secondary">On</Badge>}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div className="flex items-center justify-between">
                    <Label>Enable</Label>
                    <Switch
                      checked={config.sharpen.enabled}
                      onCheckedChange={(enabled) => updateEffect('sharpen', { enabled })}
                    />
                  </div>
                  {config.sharpen.enabled && (
                    <div className="space-y-2">
                      <Label>Intensity: {config.sharpen.intensity.toFixed(2)}</Label>
                      <Slider
                        value={[config.sharpen.intensity]}
                        onValueChange={([intensity]) => updateEffect('sharpen', { intensity })}
                        min={0}
                        max={2}
                        step={0.1}
                      />
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
