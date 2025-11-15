'use client'

/**
 * CFD Visualization Component
 *
 * Computational Fluid Dynamics visualization for airflow analysis,
 * thermal comfort, and building performance simulation
 */

import { useState, useRef, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/components/ui/use-toast'
import {
  Wind,
  Thermometer,
  Droplets,
  Eye,
  EyeOff,
  Play,
  Pause,
  RotateCcw,
  Download,
  Settings,
  Maximize2,
  Minimize2,
  Activity,
  TrendingUp,
  Gauge,
  Layers,
  Grid3x3,
  Zap
} from 'lucide-react'

export interface SimulationData {
  id: string
  name: string
  status: 'idle' | 'running' | 'completed' | 'error'
  progress: number
  dataType: 'velocity' | 'temperature' | 'pressure' | 'humidity'
  timestamp: Date
}

export interface FluidParticle {
  x: number
  y: number
  vx: number
  vy: number
  temperature: number
  pressure: number
}

export interface VectorField {
  x: number
  y: number
  dx: number
  dy: number
  magnitude: number
}

export interface SimulationConfig {
  resolution: number
  timestep: number
  viscosity: number
  density: number
  temperature: number
  windSpeed: number
  windDirection: number
}

interface VisualizationProps {
  projectId?: string
  initialConfig?: Partial<SimulationConfig>
  onSimulationStart?: (config: SimulationConfig) => void
  onSimulationStop?: () => void
  onExportData?: () => void
}

const defaultConfig: SimulationConfig = {
  resolution: 64,
  timestep: 0.016,
  viscosity: 0.0001,
  density: 1.225,
  temperature: 20,
  windSpeed: 2.5,
  windDirection: 0
}

export function Visualization({
  projectId,
  initialConfig = {},
  onSimulationStart,
  onSimulationStop,
  onExportData
}: VisualizationProps) {
  const { toast } = useToast()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()

  const [config, setConfig] = useState<SimulationConfig>({
    ...defaultConfig,
    ...initialConfig
  })

  const [isSimulating, setIsSimulating] = useState(false)
  const [simulationProgress, setSimulationProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [fps, setFps] = useState(60)

  const [visualizationType, setVisualizationType] = useState<'velocity' | 'temperature' | 'pressure' | 'streamlines'>('velocity')
  const [showVectors, setShowVectors] = useState(true)
  const [showGrid, setShowGrid] = useState(false)
  const [showParticles, setShowParticles] = useState(true)
  const [colorScheme, setColorScheme] = useState<'rainbow' | 'thermal' | 'grayscale'>('rainbow')
  const [vectorScale, setVectorScale] = useState(1.0)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const [particles, setParticles] = useState<FluidParticle[]>([])
  const [vectorField, setVectorField] = useState<VectorField[]>([])

  const [stats, setStats] = useState({
    maxVelocity: 0,
    avgVelocity: 0,
    maxTemperature: 0,
    avgTemperature: 0,
    turbulenceLevel: 0
  })

  /**
   * Initialize simulation
   */
  useEffect(() => {
    initializeSimulation()
  }, [config.resolution])

  const initializeSimulation = () => {
    // Initialize particles
    const newParticles: FluidParticle[] = []
    for (let i = 0; i < 200; i++) {
      newParticles.push({
        x: Math.random() * 800,
        y: Math.random() * 600,
        vx: (Math.random() - 0.5) * config.windSpeed,
        vy: (Math.random() - 0.5) * config.windSpeed,
        temperature: config.temperature + (Math.random() - 0.5) * 10,
        pressure: 101325 + (Math.random() - 0.5) * 100
      })
    }
    setParticles(newParticles)

    // Initialize vector field
    const newVectorField: VectorField[] = []
    const gridSize = 40
    for (let x = 0; x < 800; x += gridSize) {
      for (let y = 0; y < 600; y += gridSize) {
        const angle = config.windDirection * (Math.PI / 180)
        const speed = config.windSpeed * (0.5 + Math.random() * 0.5)
        newVectorField.push({
          x,
          y,
          dx: Math.cos(angle) * speed,
          dy: Math.sin(angle) * speed,
          magnitude: speed
        })
      }
    }
    setVectorField(newVectorField)
  }

  /**
   * Start simulation
   */
  const startSimulation = () => {
    setIsSimulating(true)
    setSimulationProgress(0)
    setCurrentTime(0)
    onSimulationStart?.(config)

    toast({
      title: 'Simulation Started',
      description: 'CFD simulation is now running'
    })

    // Simulate progress
    const progressInterval = setInterval(() => {
      setSimulationProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          return 100
        }
        return prev + 1
      })
    }, 100)
  }

  /**
   * Stop simulation
   */
  const stopSimulation = () => {
    setIsSimulating(false)
    onSimulationStop?.()

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }

    toast({
      title: 'Simulation Stopped',
      description: 'CFD simulation has been paused'
    })
  }

  /**
   * Reset simulation
   */
  const resetSimulation = () => {
    stopSimulation()
    setSimulationProgress(0)
    setCurrentTime(0)
    initializeSimulation()

    toast({
      title: 'Simulation Reset',
      description: 'All parameters reset to initial state'
    })
  }

  /**
   * Update simulation
   */
  useEffect(() => {
    if (!isSimulating) return

    const animate = () => {
      // Update particles
      setParticles(prev =>
        prev.map(p => {
          let newX = p.x + p.vx
          let newY = p.y + p.vy

          // Boundary conditions
          if (newX < 0 || newX > 800) {
            p.vx *= -0.8
            newX = Math.max(0, Math.min(800, newX))
          }
          if (newY < 0 || newY > 600) {
            p.vy *= -0.8
            newY = Math.max(0, Math.min(600, newY))
          }

          return {
            ...p,
            x: newX,
            y: newY,
            vx: p.vx * 0.99, // damping
            vy: p.vy * 0.99
          }
        })
      )

      setCurrentTime(prev => prev + config.timestep)

      // Calculate stats
      const velocities = particles.map(p => Math.sqrt(p.vx ** 2 + p.vy ** 2))
      const temperatures = particles.map(p => p.temperature)

      setStats({
        maxVelocity: Math.max(...velocities),
        avgVelocity: velocities.reduce((a, b) => a + b, 0) / velocities.length,
        maxTemperature: Math.max(...temperatures),
        avgTemperature: temperatures.reduce((a, b) => a + b, 0) / temperatures.length,
        turbulenceLevel: Math.random() * 0.3 // simplified
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isSimulating, config])

  /**
   * Render visualization
   */
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.fillStyle = '#0a0a0a'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw grid
    if (showGrid) {
      ctx.strokeStyle = '#333333'
      ctx.lineWidth = 0.5
      for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvas.height)
        ctx.stroke()
      }
      for (let y = 0; y < canvas.height; y += 40) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(canvas.width, y)
        ctx.stroke()
      }
    }

    // Draw vector field
    if (showVectors) {
      vectorField.forEach(vector => {
        const magnitude = vector.magnitude
        const hue = magnitude / config.windSpeed * 120
        ctx.strokeStyle = `hsl(${120 - hue}, 100%, 50%)`
        ctx.lineWidth = 2

        ctx.beginPath()
        ctx.moveTo(vector.x, vector.y)
        ctx.lineTo(
          vector.x + vector.dx * 10 * vectorScale,
          vector.y + vector.dy * 10 * vectorScale
        )
        ctx.stroke()

        // Arrow head
        const angle = Math.atan2(vector.dy, vector.dx)
        ctx.beginPath()
        ctx.moveTo(
          vector.x + vector.dx * 10 * vectorScale,
          vector.y + vector.dy * 10 * vectorScale
        )
        ctx.lineTo(
          vector.x + vector.dx * 10 * vectorScale - 5 * Math.cos(angle - Math.PI / 6),
          vector.y + vector.dy * 10 * vectorScale - 5 * Math.sin(angle - Math.PI / 6)
        )
        ctx.moveTo(
          vector.x + vector.dx * 10 * vectorScale,
          vector.y + vector.dy * 10 * vectorScale
        )
        ctx.lineTo(
          vector.x + vector.dx * 10 * vectorScale - 5 * Math.cos(angle + Math.PI / 6),
          vector.y + vector.dy * 10 * vectorScale - 5 * Math.sin(angle + Math.PI / 6)
        )
        ctx.stroke()
      })
    }

    // Draw particles
    if (showParticles) {
      particles.forEach(particle => {
        const velocity = Math.sqrt(particle.vx ** 2 + particle.vy ** 2)

        let color
        if (visualizationType === 'velocity') {
          const hue = (velocity / config.windSpeed) * 120
          color = `hsl(${120 - hue}, 100%, 60%)`
        } else if (visualizationType === 'temperature') {
          const temp = ((particle.temperature - 10) / 20) * 240
          color = `hsl(${240 - temp}, 100%, 60%)`
        } else {
          color = '#ffffff'
        }

        ctx.fillStyle = color
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2)
        ctx.fill()
      })
    }
  }, [particles, vectorField, showVectors, showGrid, showParticles, visualizationType, vectorScale])

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Max Velocity</CardTitle>
            <Wind className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.maxVelocity.toFixed(2)} m/s</div>
            <p className="text-xs text-muted-foreground">
              Avg: {stats.avgVelocity.toFixed(2)} m/s
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Temperature</CardTitle>
            <Thermometer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.maxTemperature.toFixed(1)}°C</div>
            <p className="text-xs text-muted-foreground">
              Avg: {stats.avgTemperature.toFixed(1)}°C
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Turbulence</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats.turbulenceLevel * 100).toFixed(0)}%
            </div>
            <Progress value={stats.turbulenceLevel * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Simulation Time</CardTitle>
            <Gauge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentTime.toFixed(2)}s</div>
            <p className="text-xs text-muted-foreground">{fps} FPS</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge variant={isSimulating ? 'default' : 'secondary'} className="text-base">
              {isSimulating ? 'Running' : 'Idle'}
            </Badge>
            {isSimulating && (
              <Progress value={simulationProgress} className="mt-2" />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visualization */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>CFD Visualization</CardTitle>
                <CardDescription>Real-time fluid dynamics simulation</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                >
                  {isFullscreen ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </Button>
                <Button variant="outline" size="icon" onClick={resetSimulation}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={onExportData}>
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative rounded-lg overflow-hidden border bg-black">
              <canvas
                ref={canvasRef}
                width={800}
                height={600}
                className="w-full h-auto"
              />
            </div>

            {/* Playback Controls */}
            <div className="flex items-center justify-center gap-2 mt-4">
              {isSimulating ? (
                <Button onClick={stopSimulation} size="lg">
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </Button>
              ) : (
                <Button onClick={startSimulation} size="lg">
                  <Play className="h-4 w-4 mr-2" />
                  Start Simulation
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Simulation Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Tabs defaultValue="display">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="display">Display</TabsTrigger>
                <TabsTrigger value="physics">Physics</TabsTrigger>
              </TabsList>

              <TabsContent value="display" className="space-y-4">
                <div className="space-y-2">
                  <Label>Visualization Type</Label>
                  <Select
                    value={visualizationType}
                    onValueChange={(value: any) => setVisualizationType(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="velocity">Velocity Field</SelectItem>
                      <SelectItem value="temperature">Temperature</SelectItem>
                      <SelectItem value="pressure">Pressure</SelectItem>
                      <SelectItem value="streamlines">Streamlines</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Color Scheme</Label>
                  <Select
                    value={colorScheme}
                    onValueChange={(value: any) => setColorScheme(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rainbow">Rainbow</SelectItem>
                      <SelectItem value="thermal">Thermal</SelectItem>
                      <SelectItem value="grayscale">Grayscale</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Show Vectors</Label>
                    <Switch checked={showVectors} onCheckedChange={setShowVectors} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Show Particles</Label>
                    <Switch checked={showParticles} onCheckedChange={setShowParticles} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Show Grid</Label>
                    <Switch checked={showGrid} onCheckedChange={setShowGrid} />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Vector Scale</Label>
                    <span className="text-sm font-medium">{vectorScale.toFixed(1)}x</span>
                  </div>
                  <Slider
                    value={[vectorScale]}
                    onValueChange={([value]) => setVectorScale(value)}
                    min={0.1}
                    max={3}
                    step={0.1}
                  />
                </div>
              </TabsContent>

              <TabsContent value="physics" className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Wind Speed</Label>
                    <span className="text-sm font-medium">{config.windSpeed.toFixed(1)} m/s</span>
                  </div>
                  <Slider
                    value={[config.windSpeed]}
                    onValueChange={([value]) => setConfig({ ...config, windSpeed: value })}
                    min={0}
                    max={10}
                    step={0.1}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Wind Direction</Label>
                    <span className="text-sm font-medium">{config.windDirection}°</span>
                  </div>
                  <Slider
                    value={[config.windDirection]}
                    onValueChange={([value]) => setConfig({ ...config, windDirection: value })}
                    min={0}
                    max={360}
                    step={1}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Temperature</Label>
                    <span className="text-sm font-medium">{config.temperature}°C</span>
                  </div>
                  <Slider
                    value={[config.temperature]}
                    onValueChange={([value]) => setConfig({ ...config, temperature: value })}
                    min={-20}
                    max={50}
                    step={1}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Viscosity</Label>
                    <span className="text-sm font-medium">
                      {(config.viscosity * 10000).toFixed(2)}
                    </span>
                  </div>
                  <Slider
                    value={[config.viscosity * 10000]}
                    onValueChange={([value]) =>
                      setConfig({ ...config, viscosity: value / 10000 })
                    }
                    min={0.1}
                    max={10}
                    step={0.1}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Resolution</Label>
                  <Select
                    value={config.resolution.toString()}
                    onValueChange={(value) =>
                      setConfig({ ...config, resolution: parseInt(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="32">Low (32x32)</SelectItem>
                      <SelectItem value="64">Medium (64x64)</SelectItem>
                      <SelectItem value="128">High (128x128)</SelectItem>
                      <SelectItem value="256">Ultra (256x256)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
