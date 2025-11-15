'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Maximize2,
  Minimize2,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Layers,
  Eye,
  EyeOff,
  Grid3x3,
  Box,
  Activity,
  Thermometer,
  Droplets,
  Wind
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'

export interface SensorOverlay {
  id: string
  sensorId: string
  name: string
  type: 'temperature' | 'humidity' | 'air_quality' | 'energy' | 'occupancy' | 'pressure'
  position: { x: number; y: number; z: number }
  value: number
  unit: string
  status: 'normal' | 'warning' | 'critical'
  visible: boolean
}

export interface TwinLayer {
  id: string
  name: string
  type: 'structure' | 'hvac' | 'electrical' | 'plumbing' | 'sensors' | 'zones'
  visible: boolean
  opacity: number
  color?: string
}

export interface TwinViewSettings {
  showGrid: boolean
  showAxes: boolean
  showSensors: boolean
  wireframe: boolean
  autoRotate: boolean
  backgroundColor: string
}

interface TwinViewerProps {
  modelId: string
  sensors?: SensorOverlay[]
  layers?: TwinLayer[]
  initialSettings?: Partial<TwinViewSettings>
  onSensorClick?: (sensor: SensorOverlay) => void
  onLayerToggle?: (layerId: string, visible: boolean) => void
}

export function TwinViewer({
  modelId,
  sensors = [],
  layers = [],
  initialSettings = {},
  onSensorClick,
  onLayerToggle
}: TwinViewerProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [selectedSensor, setSelectedSensor] = useState<SensorOverlay | null>(null)
  const [settings, setSettings] = useState<TwinViewSettings>({
    showGrid: true,
    showAxes: true,
    showSensors: true,
    wireframe: false,
    autoRotate: false,
    backgroundColor: '#1a1a1a',
    ...initialSettings
  })
  const [zoom, setZoom] = useState(100)
  const [rotation, setRotation] = useState({ x: 0, y: 0, z: 0 })
  const [localLayers, setLocalLayers] = useState(layers)
  const [localSensors, setLocalSensors] = useState(sensors)

  useEffect(() => {
    setLocalLayers(layers)
  }, [layers])

  useEffect(() => {
    setLocalSensors(sensors)
  }, [sensors])

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      canvasRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const handleReset = () => {
    setZoom(100)
    setRotation({ x: 0, y: 0, z: 0 })
  }

  const handleLayerToggle = (layerId: string) => {
    setLocalLayers(prev =>
      prev.map(layer =>
        layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
      )
    )
    const layer = localLayers.find(l => l.id === layerId)
    if (layer) {
      onLayerToggle?.(layerId, !layer.visible)
    }
  }

  const handleSensorToggle = (sensorId: string) => {
    setLocalSensors(prev =>
      prev.map(sensor =>
        sensor.id === sensorId ? { ...sensor, visible: !sensor.visible } : sensor
      )
    )
  }

  const handleSensorSelect = (sensor: SensorOverlay) => {
    setSelectedSensor(sensor)
    onSensorClick?.(sensor)
  }

  const getSensorIcon = (type: SensorOverlay['type']) => {
    switch (type) {
      case 'temperature':
        return Thermometer
      case 'humidity':
        return Droplets
      case 'air_quality':
        return Wind
      default:
        return Activity
    }
  }

  const getStatusColor = (status: SensorOverlay['status']) => {
    switch (status) {
      case 'normal':
        return 'text-green-500'
      case 'warning':
        return 'text-yellow-500'
      case 'critical':
        return 'text-red-500'
      default:
        return 'text-gray-500'
    }
  }

  const getStatusBgColor = (status: SensorOverlay['status']) => {
    switch (status) {
      case 'normal':
        return 'bg-green-500'
      case 'warning':
        return 'bg-yellow-500'
      case 'critical':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const visibleSensors = localSensors.filter(s => s.visible)
  const activeLayers = localLayers.filter(l => l.visible)

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Digital Twin Viewer</CardTitle>
              <CardDescription>3D building model with live sensor overlays</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset View
              </Button>
              <Button variant="outline" size="sm" onClick={handleFullscreen}>
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">View Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="grid" className="text-sm">Show Grid</Label>
                  <Switch
                    id="grid"
                    checked={settings.showGrid}
                    onCheckedChange={(checked) =>
                      setSettings(prev => ({ ...prev, showGrid: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="axes" className="text-sm">Show Axes</Label>
                  <Switch
                    id="axes"
                    checked={settings.showAxes}
                    onCheckedChange={(checked) =>
                      setSettings(prev => ({ ...prev, showAxes: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="sensors" className="text-sm">Show Sensors</Label>
                  <Switch
                    id="sensors"
                    checked={settings.showSensors}
                    onCheckedChange={(checked) =>
                      setSettings(prev => ({ ...prev, showSensors: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="wireframe" className="text-sm">Wireframe</Label>
                  <Switch
                    id="wireframe"
                    checked={settings.wireframe}
                    onCheckedChange={(checked) =>
                      setSettings(prev => ({ ...prev, wireframe: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="rotate" className="text-sm">Auto Rotate</Label>
                  <Switch
                    id="rotate"
                    checked={settings.autoRotate}
                    onCheckedChange={(checked) =>
                      setSettings(prev => ({ ...prev, autoRotate: checked }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Zoom</Label>
                  <span className="text-xs text-muted-foreground">{zoom}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setZoom(Math.max(10, zoom - 10))}
                  >
                    <ZoomOut className="h-3 w-3" />
                  </Button>
                  <Slider
                    value={[zoom]}
                    onValueChange={(value) => setZoom(value[0])}
                    min={10}
                    max={200}
                    step={10}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setZoom(Math.min(200, zoom + 10))}
                  >
                    <ZoomIn className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  Layers
                </CardTitle>
                <Badge variant="outline">{activeLayers.length}/{localLayers.length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {localLayers.map(layer => (
                    <div
                      key={layer.id}
                      className="flex items-center justify-between p-2 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {layer.visible ? (
                          <Eye className="h-4 w-4 text-green-500" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="text-sm font-medium">{layer.name}</span>
                      </div>
                      <Switch
                        checked={layer.visible}
                        onCheckedChange={() => handleLayerToggle(layer.id)}
                      />
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Sensors
                </CardTitle>
                <Badge variant="outline">{visibleSensors.length}/{localSensors.length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {localSensors.map(sensor => {
                    const Icon = getSensorIcon(sensor.type)

                    return (
                      <div
                        key={sensor.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedSensor?.id === sensor.id
                            ? 'bg-accent border-primary'
                            : 'hover:bg-accent/50'
                        }`}
                        onClick={() => handleSensorSelect(sensor)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Icon className={`h-4 w-4 ${getStatusColor(sensor.status)}`} />
                            <span className="text-sm font-medium">{sensor.name}</span>
                          </div>
                          <Switch
                            checked={sensor.visible}
                            onCheckedChange={() => handleSensorToggle(sensor.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">{sensor.type}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-bold">
                              {sensor.value.toFixed(1)} {sensor.unit}
                            </span>
                            <div className={`h-2 w-2 rounded-full ${getStatusBgColor(sensor.status)}`} />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* 3D Viewer */}
        <div className="lg:col-span-3">
          <Card className="h-full">
            <CardContent className="p-0">
              <div
                ref={canvasRef}
                className="relative w-full h-[800px] bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg overflow-hidden"
                style={{ backgroundColor: settings.backgroundColor }}
              >
                {/* Placeholder for 3D viewer - In production, integrate Three.js or similar */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <Box className="h-24 w-24 mx-auto text-muted-foreground opacity-50" />
                    <div className="space-y-2">
                      <p className="text-lg font-medium text-white">3D Digital Twin Viewer</p>
                      <p className="text-sm text-muted-foreground">
                        Model ID: {modelId}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Integrate Three.js, Babylon.js, or similar for 3D rendering
                      </p>
                    </div>
                  </div>
                </div>

                {/* Overlay Info */}
                {settings.showSensors && (
                  <div className="absolute top-4 left-4 space-y-2">
                    {visibleSensors.slice(0, 5).map(sensor => {
                      const Icon = getSensorIcon(sensor.type)
                      return (
                        <div
                          key={sensor.id}
                          className={`px-3 py-2 rounded-lg backdrop-blur-sm border ${
                            selectedSensor?.id === sensor.id
                              ? 'bg-primary/90 border-primary'
                              : 'bg-black/60 border-white/20'
                          } cursor-pointer`}
                          onClick={() => handleSensorSelect(sensor)}
                        >
                          <div className="flex items-center gap-2">
                            <Icon className={`h-4 w-4 ${getStatusColor(sensor.status)}`} />
                            <span className="text-sm font-medium text-white">{sensor.name}</span>
                          </div>
                          <div className="text-xs text-white/80 mt-1">
                            {sensor.value.toFixed(1)} {sensor.unit}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Stats Overlay */}
                <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm border border-white/20 rounded-lg p-3">
                  <div className="space-y-1 text-white text-xs">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-muted-foreground">Active Layers:</span>
                      <span className="font-medium">{activeLayers.length}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-muted-foreground">Visible Sensors:</span>
                      <span className="font-medium">{visibleSensors.length}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-muted-foreground">Zoom:</span>
                      <span className="font-medium">{zoom}%</span>
                    </div>
                  </div>
                </div>

                {/* Grid indicator */}
                {settings.showGrid && (
                  <div className="absolute bottom-4 left-4">
                    <Grid3x3 className="h-6 w-6 text-white/40" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Selected Sensor Details */}
      {selectedSensor && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Selected Sensor Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Name</p>
                <p className="font-medium">{selectedSensor.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Type</p>
                <p className="font-medium capitalize">{selectedSensor.type.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Value</p>
                <p className="font-medium">
                  {selectedSensor.value.toFixed(2)} {selectedSensor.unit}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Status</p>
                <Badge variant={selectedSensor.status === 'normal' ? 'default' : 'destructive'}>
                  {selectedSensor.status}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Position X</p>
                <p className="font-medium">{selectedSensor.position.x.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Position Y</p>
                <p className="font-medium">{selectedSensor.position.y.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Position Z</p>
                <p className="font-medium">{selectedSensor.position.z.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
