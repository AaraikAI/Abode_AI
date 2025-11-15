'use client'

/**
 * AR Viewer Component
 *
 * AR viewer with model placement, scaling, rotation controls
 */

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import {
  Camera,
  RotateCw,
  Maximize2,
  Minimize2,
  Grid3x3,
  Sun,
  Lightbulb,
  Move,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RefreshCw,
  Download,
  Share2,
  Settings
} from 'lucide-react'

export interface ARModel {
  id: string
  name: string
  url: string
  type: '3d' | 'gltf' | 'obj' | 'fbx'
  thumbnail?: string
  metadata?: Record<string, any>
}

export interface ARPlacement {
  position: { x: number; y: number; z: number }
  rotation: { x: number; y: number; z: number }
  scale: { x: number; y: number; z: number }
}

export interface ARViewerSettings {
  showGrid: boolean
  showShadows: boolean
  showLighting: boolean
  autoRotate: boolean
  backgroundOpacity: number
  lightIntensity: number
}

interface ARViewerProps {
  model?: ARModel
  initialPlacement?: ARPlacement
  settings?: Partial<ARViewerSettings>
  onPlacementChange?: (placement: ARPlacement) => void
  onCapture?: (image: Blob) => void
  onShare?: (data: { model: ARModel; placement: ARPlacement }) => void
}

const DEFAULT_SETTINGS: ARViewerSettings = {
  showGrid: true,
  showShadows: true,
  showLighting: true,
  autoRotate: false,
  backgroundOpacity: 0.5,
  lightIntensity: 1.0
}

const DEFAULT_PLACEMENT: ARPlacement = {
  position: { x: 0, y: 0, z: -5 },
  rotation: { x: 0, y: 0, z: 0 },
  scale: { x: 1, y: 1, z: 1 }
}

export function ARViewer({
  model,
  initialPlacement = DEFAULT_PLACEMENT,
  settings: initialSettings,
  onPlacementChange,
  onCapture,
  onShare
}: ARViewerProps) {
  const { toast } = useToast()
  const canvasRef = useRef<HTMLDivElement>(null)
  const [placement, setPlacement] = useState<ARPlacement>(initialPlacement)
  const [settings, setSettings] = useState<ARViewerSettings>({
    ...DEFAULT_SETTINGS,
    ...initialSettings
  })
  const [isARSupported, setIsARSupported] = useState(false)
  const [isARActive, setIsARActive] = useState(false)
  const [controlMode, setControlMode] = useState<'position' | 'rotation' | 'scale'>('position')
  const [selectedTab, setSelectedTab] = useState('controls')

  useEffect(() => {
    // Check if AR is supported
    const checkARSupport = async () => {
      if ('xr' in navigator) {
        try {
          const supported = await (navigator as any).xr?.isSessionSupported('immersive-ar')
          setIsARSupported(!!supported)
        } catch (error) {
          setIsARSupported(false)
        }
      }
    }

    checkARSupport()
  }, [])

  /**
   * Update placement and notify parent
   */
  const updatePlacement = (updates: Partial<ARPlacement>) => {
    const newPlacement = { ...placement, ...updates }
    setPlacement(newPlacement)
    onPlacementChange?.(newPlacement)
  }

  /**
   * Start AR session
   */
  const startAR = async () => {
    if (!isARSupported) {
      toast({
        title: 'AR Not Supported',
        description: 'This device does not support AR features',
        variant: 'destructive'
      })
      return
    }

    try {
      setIsARActive(true)
      toast({
        title: 'AR Session Started',
        description: 'Point your camera at a surface to place the model'
      })
    } catch (error: any) {
      toast({
        title: 'AR Failed',
        description: error.message,
        variant: 'destructive'
      })
      setIsARActive(false)
    }
  }

  /**
   * Stop AR session
   */
  const stopAR = () => {
    setIsARActive(false)
    toast({
      title: 'AR Session Ended',
      description: 'Returned to preview mode'
    })
  }

  /**
   * Reset placement to defaults
   */
  const resetPlacement = () => {
    setPlacement(DEFAULT_PLACEMENT)
    onPlacementChange?.(DEFAULT_PLACEMENT)
    toast({
      title: 'Placement Reset',
      description: 'Model returned to default position'
    })
  }

  /**
   * Capture screenshot
   */
  const captureScreen = async () => {
    if (!canvasRef.current) return

    try {
      // Simulate screenshot capture
      const canvas = document.createElement('canvas')
      canvas.width = 1920
      canvas.height = 1080
      const ctx = canvas.getContext('2d')

      if (ctx) {
        ctx.fillStyle = '#000'
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        canvas.toBlob((blob) => {
          if (blob) {
            onCapture?.(blob)
            toast({
              title: 'Screenshot Captured',
              description: 'AR view saved to gallery'
            })
          }
        })
      }
    } catch (error: any) {
      toast({
        title: 'Capture Failed',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  /**
   * Share AR view
   */
  const shareARView = () => {
    if (!model) return

    onShare?.({ model, placement })
    toast({
      title: 'Sharing AR View',
      description: 'Preparing share link...'
    })
  }

  /**
   * Update setting
   */
  const updateSetting = <K extends keyof ARViewerSettings>(
    key: K,
    value: ARViewerSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="space-y-4">
      {/* AR Viewport */}
      <Card>
        <CardContent className="p-0">
          <div
            ref={canvasRef}
            className="relative w-full aspect-video bg-gradient-to-br from-slate-900 to-slate-800 rounded-t-lg overflow-hidden"
          >
            {/* AR View Placeholder */}
            <div className="absolute inset-0 flex items-center justify-center">
              {model ? (
                <div className="text-center space-y-4">
                  <div className="text-white text-lg font-medium">{model.name}</div>
                  <Badge variant={isARActive ? 'default' : 'secondary'}>
                    {isARActive ? 'AR Active' : 'Preview Mode'}
                  </Badge>
                </div>
              ) : (
                <div className="text-muted-foreground text-center space-y-2">
                  <Camera className="h-12 w-12 mx-auto opacity-50" />
                  <div>No model loaded</div>
                </div>
              )}
            </div>

            {/* AR Controls Overlay */}
            {model && (
              <div className="absolute bottom-4 left-0 right-0 px-4 flex justify-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={isARActive ? stopAR : startAR}
                  disabled={!isARSupported}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  {isARActive ? 'Exit AR' : 'Start AR'}
                </Button>
                <Button size="sm" variant="secondary" onClick={captureScreen}>
                  <Download className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="secondary" onClick={shareARView}>
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Control Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="controls">Controls</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="info">Info</TabsTrigger>
        </TabsList>

        {/* Controls Tab */}
        <TabsContent value="controls" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Transform Controls</CardTitle>
                <Button size="sm" variant="outline" onClick={resetPlacement}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Control Mode Selector */}
              <div className="flex gap-2">
                <Button
                  variant={controlMode === 'position' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setControlMode('position')}
                >
                  <Move className="h-4 w-4 mr-2" />
                  Position
                </Button>
                <Button
                  variant={controlMode === 'rotation' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setControlMode('rotation')}
                >
                  <RotateCw className="h-4 w-4 mr-2" />
                  Rotation
                </Button>
                <Button
                  variant={controlMode === 'scale' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setControlMode('scale')}
                >
                  <Maximize2 className="h-4 w-4 mr-2" />
                  Scale
                </Button>
              </div>

              {/* Position Controls */}
              {controlMode === 'position' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>X Position: {placement.position.x.toFixed(2)}</Label>
                    <Slider
                      value={[placement.position.x]}
                      onValueChange={([x]) => updatePlacement({
                        position: { ...placement.position, x }
                      })}
                      min={-10}
                      max={10}
                      step={0.1}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Y Position: {placement.position.y.toFixed(2)}</Label>
                    <Slider
                      value={[placement.position.y]}
                      onValueChange={([y]) => updatePlacement({
                        position: { ...placement.position, y }
                      })}
                      min={-10}
                      max={10}
                      step={0.1}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Z Position: {placement.position.z.toFixed(2)}</Label>
                    <Slider
                      value={[placement.position.z]}
                      onValueChange={([z]) => updatePlacement({
                        position: { ...placement.position, z }
                      })}
                      min={-20}
                      max={0}
                      step={0.1}
                    />
                  </div>
                </div>
              )}

              {/* Rotation Controls */}
              {controlMode === 'rotation' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>X Rotation: {placement.rotation.x.toFixed(0)}°</Label>
                    <Slider
                      value={[placement.rotation.x]}
                      onValueChange={([x]) => updatePlacement({
                        rotation: { ...placement.rotation, x }
                      })}
                      min={0}
                      max={360}
                      step={1}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Y Rotation: {placement.rotation.y.toFixed(0)}°</Label>
                    <Slider
                      value={[placement.rotation.y]}
                      onValueChange={([y]) => updatePlacement({
                        rotation: { ...placement.rotation, y }
                      })}
                      min={0}
                      max={360}
                      step={1}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Z Rotation: {placement.rotation.z.toFixed(0)}°</Label>
                    <Slider
                      value={[placement.rotation.z]}
                      onValueChange={([z]) => updatePlacement({
                        rotation: { ...placement.rotation, z }
                      })}
                      min={0}
                      max={360}
                      step={1}
                    />
                  </div>
                </div>
              )}

              {/* Scale Controls */}
              {controlMode === 'scale' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Uniform Scale: {placement.scale.x.toFixed(2)}x</Label>
                    <Slider
                      value={[placement.scale.x]}
                      onValueChange={([scale]) => updatePlacement({
                        scale: { x: scale, y: scale, z: scale }
                      })}
                      min={0.1}
                      max={5}
                      step={0.1}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updatePlacement({
                        scale: { x: 0.5, y: 0.5, z: 0.5 }
                      })}
                    >
                      <ZoomOut className="h-4 w-4 mr-2" />
                      0.5x
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updatePlacement({
                        scale: { x: 1, y: 1, z: 1 }
                      })}
                    >
                      1x
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updatePlacement({
                        scale: { x: 2, y: 2, z: 2 }
                      })}
                    >
                      <ZoomIn className="h-4 w-4 mr-2" />
                      2x
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Viewer Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="show-grid" className="flex items-center gap-2">
                  <Grid3x3 className="h-4 w-4" />
                  Show Grid
                </Label>
                <Switch
                  id="show-grid"
                  checked={settings.showGrid}
                  onCheckedChange={(checked) => updateSetting('showGrid', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="show-shadows">Show Shadows</Label>
                <Switch
                  id="show-shadows"
                  checked={settings.showShadows}
                  onCheckedChange={(checked) => updateSetting('showShadows', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="show-lighting" className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Show Lighting
                </Label>
                <Switch
                  id="show-lighting"
                  checked={settings.showLighting}
                  onCheckedChange={(checked) => updateSetting('showLighting', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="auto-rotate" className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Auto Rotate
                </Label>
                <Switch
                  id="auto-rotate"
                  checked={settings.autoRotate}
                  onCheckedChange={(checked) => updateSetting('autoRotate', checked)}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Sun className="h-4 w-4" />
                  Light Intensity: {(settings.lightIntensity * 100).toFixed(0)}%
                </Label>
                <Slider
                  value={[settings.lightIntensity]}
                  onValueChange={([value]) => updateSetting('lightIntensity', value)}
                  min={0}
                  max={2}
                  step={0.1}
                />
              </div>

              <div className="space-y-2">
                <Label>Background Opacity: {(settings.backgroundOpacity * 100).toFixed(0)}%</Label>
                <Slider
                  value={[settings.backgroundOpacity]}
                  onValueChange={([value]) => updateSetting('backgroundOpacity', value)}
                  min={0}
                  max={1}
                  step={0.05}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Info Tab */}
        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Model Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {model ? (
                <>
                  <div className="space-y-1">
                    <div className="text-sm font-medium">Name</div>
                    <div className="text-sm text-muted-foreground">{model.name}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-medium">Type</div>
                    <Badge variant="outline">{model.type.toUpperCase()}</Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-medium">AR Support</div>
                    <Badge variant={isARSupported ? 'default' : 'secondary'}>
                      {isARSupported ? 'Available' : 'Not Available'}
                    </Badge>
                  </div>
                  {model.metadata && (
                    <div className="space-y-1">
                      <div className="text-sm font-medium">Metadata</div>
                      <div className="text-xs font-mono bg-muted p-2 rounded">
                        {JSON.stringify(model.metadata, null, 2)}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-sm text-muted-foreground">No model loaded</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
