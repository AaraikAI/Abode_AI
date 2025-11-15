'use client'

import { useState, useEffect } from 'react'
import { Wind, Upload, Play, Pause, Download, AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { windFlowCFD, type CFDSimulation, type MeshGenerationJob } from '@/lib/services/wind-flow-cfd'
import { useToast } from '@/hooks/use-toast'

export function WindFlowAnalyzer() {
  const [geometryFile, setGeometryFile] = useState<File | null>(null)
  const [meshJob, setMeshJob] = useState<MeshGenerationJob | null>(null)
  const [simulation, setSimulation] = useState<CFDSimulation | null>(null)
  const [windSpeed, setWindSpeed] = useState(10)
  const [refinementLevel, setRefinementLevel] = useState(3)
  const [turbulenceModel, setTurbulenceModel] = useState<'kEpsilon' | 'kOmega' | 'LES'>('kEpsilon')
  const [isGeneratingMesh, setIsGeneratingMesh] = useState(false)
  const [isSimulating, setIsSimulating] = useState(false)
  const [results, setResults] = useState<any>(null)
  const { toast } = useToast()

  // Poll mesh generation status
  useEffect(() => {
    if (!meshJob || meshJob.status === 'completed' || meshJob.status === 'failed') {
      return
    }

    const interval = setInterval(async () => {
      try {
        const status = await windFlowCFD.getMeshStatus(meshJob.jobId)
        setMeshJob(status)

        if (status.status === 'completed') {
          toast({
            title: 'Mesh generated',
            description: `${status.meshStats?.cells.toLocaleString()} cells created`
          })
          setIsGeneratingMesh(false)
        } else if (status.status === 'failed') {
          toast({
            title: 'Mesh generation failed',
            description: status.error,
            variant: 'destructive'
          })
          setIsGeneratingMesh(false)
        }
      } catch (error) {
        console.error('Failed to get mesh status:', error)
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [meshJob, toast])

  // Poll simulation status
  useEffect(() => {
    if (!simulation || simulation.status === 'completed' || simulation.status === 'failed') {
      return
    }

    const interval = setInterval(async () => {
      try {
        const status = await windFlowCFD.getSimulationStatus(simulation.simulationId)
        setSimulation(status)

        if (status.status === 'completed') {
          toast({
            title: 'Simulation completed',
            description: 'Wind flow analysis ready'
          })
          setIsSimulating(false)

          // Load results
          const res = await windFlowCFD.getResults(simulation.simulationId)
          setResults(res)
        } else if (status.status === 'failed') {
          toast({
            title: 'Simulation failed',
            description: status.error,
            variant: 'destructive'
          })
          setIsSimulating(false)
        }
      } catch (error) {
        console.error('Failed to get simulation status:', error)
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [simulation, toast])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setGeometryFile(file)
    }
  }

  const handleGenerateMesh = async () => {
    if (!geometryFile) {
      toast({
        title: 'No file selected',
        description: 'Please select a 3D model file',
        variant: 'destructive'
      })
      return
    }

    setIsGeneratingMesh(true)

    try {
      // In production, upload file first
      const job = await windFlowCFD.generateMesh({
        geometryFile: geometryFile.name,
        config: {
          refinementLevel,
          cellSize: 1.0,
          domainFactor: 5
        }
      })

      setMeshJob(job)

      toast({
        title: 'Mesh generation started',
        description: 'This may take several minutes...'
      })
    } catch (error) {
      toast({
        title: 'Failed to generate mesh',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      })
      setIsGeneratingMesh(false)
    }
  }

  const handleStartSimulation = async () => {
    if (!meshJob || meshJob.status !== 'completed') {
      toast({
        title: 'Mesh not ready',
        description: 'Please generate mesh first',
        variant: 'destructive'
      })
      return
    }

    setIsSimulating(true)

    try {
      const sim = await windFlowCFD.startSimulation({
        meshId: meshJob.jobId,
        windSpeed,
        turbulenceModel,
        simulationTime: 1000
      })

      setSimulation(sim)

      toast({
        title: 'Simulation started',
        description: `Analyzing wind flow at ${windSpeed} m/s`
      })
    } catch (error) {
      toast({
        title: 'Failed to start simulation',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      })
      setIsSimulating(false)
    }
  }

  const handleCancelSimulation = async () => {
    if (simulation) {
      await windFlowCFD.cancelSimulation(simulation.simulationId)
      setIsSimulating(false)
      setSimulation(null)
    }
  }

  const handleDownloadResults = async () => {
    if (!simulation) return

    try {
      const blob = await windFlowCFD.exportParaView(simulation.simulationId)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `wind_flow_${simulation.simulationId}.foam`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      toast({
        title: 'Download failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wind className="h-5 w-5" />
            Wind Flow CFD Analysis
          </CardTitle>
          <CardDescription>
            Computational Fluid Dynamics simulation using OpenFOAM
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="geometry">3D Model File</Label>
            <div className="flex gap-2">
              <Input
                id="geometry"
                type="file"
                accept=".stl,.obj,.glb,.gltf,.ply"
                onChange={handleFileSelect}
                disabled={isGeneratingMesh || isSimulating}
              />
              {geometryFile && (
                <Badge variant="outline">{geometryFile.name}</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Supported formats: STL, OBJ, GLB, GLTF, PLY
            </p>
          </div>

          {/* Mesh Settings */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Mesh Refinement Level: {refinementLevel}</Label>
              <Slider
                value={[refinementLevel]}
                onValueChange={([value]) => setRefinementLevel(value)}
                min={1}
                max={5}
                step={1}
                disabled={isGeneratingMesh || isSimulating}
              />
              <p className="text-xs text-muted-foreground">
                Higher values create more detailed meshes (slower)
              </p>
            </div>

            <Button
              onClick={handleGenerateMesh}
              disabled={!geometryFile || isGeneratingMesh || isSimulating}
              className="w-full"
            >
              {isGeneratingMesh ? (
                <>
                  <Upload className="mr-2 h-4 w-4 animate-pulse" />
                  Generating Mesh...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Generate Computational Mesh
                </>
              )}
            </Button>
          </div>

          {/* Wind Settings */}
          {meshJob && (
            <div className="space-y-4 pt-4 border-t">
              <div className="space-y-2">
                <Label>Wind Speed: {windSpeed} m/s</Label>
                <Slider
                  value={[windSpeed]}
                  onValueChange={([value]) => setWindSpeed(value)}
                  min={1}
                  max={50}
                  step={1}
                  disabled={isSimulating}
                />
              </div>

              <div className="space-y-2">
                <Label>Turbulence Model</Label>
                <Select
                  value={turbulenceModel}
                  onValueChange={(value: any) => setTurbulenceModel(value)}
                  disabled={isSimulating}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kEpsilon">k-ε (Standard)</SelectItem>
                    <SelectItem value="kOmega">k-ω SST</SelectItem>
                    <SelectItem value="LES">LES (Advanced)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleStartSimulation}
                  disabled={meshJob.status !== 'completed' || isSimulating}
                  className="flex-1"
                >
                  {isSimulating ? (
                    <>
                      <Pause className="mr-2 h-4 w-4" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Start Simulation
                    </>
                  )}
                </Button>

                {isSimulating && (
                  <Button
                    onClick={handleCancelSimulation}
                    variant="destructive"
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mesh Generation Status */}
      {meshJob && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>Mesh Generation</span>
              <Badge variant={
                meshJob.status === 'completed' ? 'default' :
                meshJob.status === 'failed' ? 'destructive' :
                'secondary'
              }>
                {meshJob.status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {meshJob.status !== 'completed' && meshJob.status !== 'failed' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Progress</span>
                  <span>{meshJob.progress}%</span>
                </div>
                <Progress value={meshJob.progress} />
              </div>
            )}

            {meshJob.status === 'failed' && (
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{meshJob.error}</span>
              </div>
            )}

            {meshJob.status === 'completed' && meshJob.meshStats && (
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Cells:</span>
                  <p className="font-medium">{meshJob.meshStats.cells.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Points:</span>
                  <p className="font-medium">{meshJob.meshStats.points.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Faces:</span>
                  <p className="font-medium">{meshJob.meshStats.faces.toLocaleString()}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Simulation Status */}
      {simulation && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>CFD Simulation</span>
              <Badge variant={
                simulation.status === 'completed' ? 'default' :
                simulation.status === 'failed' ? 'destructive' :
                'secondary'
              }>
                {simulation.status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {simulation.status !== 'completed' && simulation.status !== 'failed' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Progress</span>
                  <span>{simulation.progress}%</span>
                </div>
                <Progress value={simulation.progress} />
                <p className="text-xs text-muted-foreground">
                  This may take 10-30 minutes depending on mesh size...
                </p>
              </div>
            )}

            {simulation.status === 'completed' && results && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Simulation completed successfully</span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Drag Coefficient:</span>
                    <p className="font-medium text-lg">{results.dragCoefficient.toFixed(3)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Lift Coefficient:</span>
                    <p className="font-medium text-lg">{results.liftCoefficient.toFixed(3)}</p>
                  </div>
                </div>

                <Button onClick={handleDownloadResults} className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Download Results (ParaView Format)
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
