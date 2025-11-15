'use client'

import { Suspense, useState, useRef, useEffect } from 'react'
import { Canvas, useLoader, useFrame } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Environment, Grid } from '@react-three/drei'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import * as THREE from 'three'
import { AlertCircle, Loader2, RotateCcw, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export interface ModelViewerProps {
  modelUrl: string
  modelFormat?: 'glb' | 'gltf' | 'obj' | 'fbx'
  autoRotate?: boolean
  showGrid?: boolean
  backgroundColor?: string
  cameraPosition?: [number, number, number]
  className?: string
  onLoad?: () => void
  onError?: (error: Error) => void
}

interface ModelProps {
  url: string
  format: string
  onLoad?: () => void
  onError?: (error: Error) => void
  autoRotate: boolean
}

function Model({ url, format, onLoad, onError, autoRotate }: ModelProps) {
  const meshRef = useRef<THREE.Group>(null)
  const [model, setModel] = useState<THREE.Object3D | null>(null)

  useEffect(() => {
    let loader: GLTFLoader | OBJLoader | FBXLoader

    switch (format.toLowerCase()) {
      case 'glb':
      case 'gltf':
        loader = new GLTFLoader()
        break
      case 'obj':
        loader = new OBJLoader()
        break
      case 'fbx':
        loader = new FBXLoader()
        break
      default:
        loader = new GLTFLoader()
    }

    loader.load(
      url,
      (result: any) => {
        try {
          const loadedModel = result.scene || result

          // Center the model
          const box = new THREE.Box3().setFromObject(loadedModel)
          const center = box.getCenter(new THREE.Vector3())
          loadedModel.position.sub(center)

          // Scale to fit
          const size = box.getSize(new THREE.Vector3())
          const maxDim = Math.max(size.x, size.y, size.z)
          const scale = 2 / maxDim
          loadedModel.scale.multiplyScalar(scale)

          setModel(loadedModel)
          onLoad?.()
        } catch (err) {
          onError?.(err as Error)
        }
      },
      undefined,
      (err) => {
        onError?.(err as Error)
      }
    )
  }, [url, format, onLoad, onError])

  useFrame((state, delta) => {
    if (meshRef.current && autoRotate) {
      meshRef.current.rotation.y += delta * 0.5
    }
  })

  if (!model) return null

  return <primitive ref={meshRef} object={model} />
}

function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#888888" wireframe />
    </mesh>
  )
}

export function ModelViewer({
  modelUrl,
  modelFormat = 'glb',
  autoRotate: initialAutoRotate = false,
  showGrid: initialShowGrid = true,
  backgroundColor = '#1a1a1a',
  cameraPosition = [3, 3, 3],
  className = '',
  onLoad,
  onError,
}: ModelViewerProps) {
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [autoRotate, setAutoRotate] = useState(initialAutoRotate)
  const [showGrid, setShowGrid] = useState(initialShowGrid)
  const controlsRef = useRef<any>(null)

  const handleLoad = () => {
    setIsLoading(false)
    onLoad?.()
  }

  const handleError = (err: Error) => {
    setError(err)
    setIsLoading(false)
    onError?.(err)
  }

  const handleReset = () => {
    if (controlsRef.current) {
      controlsRef.current.reset()
    }
  }

  const handleZoomIn = () => {
    if (controlsRef.current) {
      const camera = controlsRef.current.object
      camera.position.multiplyScalar(0.8)
      controlsRef.current.update()
    }
  }

  const handleZoomOut = () => {
    if (controlsRef.current) {
      const camera = controlsRef.current.object
      camera.position.multiplyScalar(1.2)
      controlsRef.current.update()
    }
  }

  const handleFullscreen = () => {
    const element = document.getElementById('model-viewer-canvas')
    if (element) {
      if (document.fullscreenElement) {
        document.exitFullscreen()
      } else {
        element.requestFullscreen()
      }
    }
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center h-full min-h-[400px] text-muted-foreground">
          <AlertCircle className="h-12 w-12 mb-4 text-destructive" />
          <h3 className="text-lg font-semibold mb-2">Failed to Load Model</h3>
          <p className="text-sm text-center max-w-md">
            {error.message || 'An error occurred while loading the 3D model.'}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`relative ${className}`}>
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading 3D model...</p>
          </div>
        </div>
      )}

      {/* Controls Panel */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <Card className="bg-background/80 backdrop-blur-sm">
          <CardContent className="p-2 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="auto-rotate" className="text-xs">
                Auto-rotate
              </Label>
              <Switch
                id="auto-rotate"
                checked={autoRotate}
                onCheckedChange={setAutoRotate}
              />
            </div>
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="show-grid" className="text-xs">
                Show grid
              </Label>
              <Switch
                id="show-grid"
                checked={showGrid}
                onCheckedChange={setShowGrid}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleZoomIn}
                  className="h-8 w-8 p-0 bg-background/80 backdrop-blur-sm"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Zoom In</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleZoomOut}
                  className="h-8 w-8 p-0 bg-background/80 backdrop-blur-sm"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Zoom Out</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleReset}
                  className="h-8 w-8 p-0 bg-background/80 backdrop-blur-sm"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Reset View</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleFullscreen}
                  className="h-8 w-8 p-0 bg-background/80 backdrop-blur-sm"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Fullscreen</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Canvas */}
      <div
        id="model-viewer-canvas"
        className="w-full h-full min-h-[400px] rounded-lg overflow-hidden"
        style={{ backgroundColor }}
      >
        <Canvas shadows>
          <PerspectiveCamera makeDefault position={cameraPosition} />

          {/* Lighting */}
          <ambientLight intensity={0.5} />
          <directionalLight
            position={[10, 10, 5]}
            intensity={1}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
          />
          <pointLight position={[-10, -10, -5]} intensity={0.5} />

          {/* Environment */}
          <Environment preset="studio" />

          {/* Grid */}
          {showGrid && (
            <Grid
              args={[10, 10]}
              cellSize={0.5}
              cellThickness={0.5}
              cellColor="#6e6e6e"
              sectionSize={2}
              sectionThickness={1}
              sectionColor="#9d4b4b"
              fadeDistance={25}
              fadeStrength={1}
              followCamera={false}
            />
          )}

          {/* Model */}
          <Suspense fallback={<LoadingFallback />}>
            <Model
              url={modelUrl}
              format={modelFormat}
              onLoad={handleLoad}
              onError={handleError}
              autoRotate={autoRotate}
            />
          </Suspense>

          {/* Controls */}
          <OrbitControls
            ref={controlsRef}
            enableDamping
            dampingFactor={0.05}
            minDistance={1}
            maxDistance={10}
            autoRotate={autoRotate}
            autoRotateSpeed={2}
          />
        </Canvas>
      </div>
    </div>
  )
}
