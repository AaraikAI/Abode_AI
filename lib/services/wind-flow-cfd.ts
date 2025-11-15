/**
 * Wind Flow CFD Service
 *
 * Computational Fluid Dynamics integration using OpenFOAM
 * for wind flow analysis around buildings
 */

export interface CFDConfig {
  meshServerUrl?: string
  cfdServerUrl?: string
  postProcessorUrl?: string
}

export interface MeshGenerationRequest {
  geometryFile: string
  config: {
    cellSize?: number
    refinementLevel?: number
    domainFactor?: number
  }
}

export interface MeshGenerationJob {
  jobId: string
  status: 'queued' | 'setting_up' | 'generating' | 'completed' | 'failed'
  progress: number
  duration?: number
  error?: string
  meshStats?: {
    cells: number
    points: number
    faces: number
  }
}

export interface CFDSimulationRequest {
  meshId: string
  windSpeed: number
  windDirection?: number
  turbulenceModel?: 'kEpsilon' | 'kOmega' | 'LES'
  simulationTime?: number
}

export interface CFDSimulation {
  simulationId: string
  status: 'queued' | 'setting_up' | 'running' | 'post_processing' | 'completed' | 'failed' | 'cancelled'
  progress: number
  duration?: number
  error?: string
  startTime?: number
  endTime?: number
}

export interface CFDResults {
  simulationId: string
  velocity: VelocityField
  pressure: PressureField
  forces: ForceData
  dragCoefficient: number
  liftCoefficient: number
}

export interface VelocityField {
  points: Array<{ x: number; y: number; z: number }>
  velocities: Array<{ u: number; v: number; w: number; magnitude: number }>
}

export interface PressureField {
  points: Array<{ x: number; y: number; z: number }>
  pressures: number[]
  minPressure: number
  maxPressure: number
}

export interface ForceData {
  drag: number
  lift: number
  side: number
  dragCoefficient: number
  liftCoefficient: number
  sideCoefficient: number
}

export class WindFlowCFDService {
  private config: Required<CFDConfig>

  constructor(config: CFDConfig = {}) {
    this.config = {
      meshServerUrl: config.meshServerUrl || process.env.NEXT_PUBLIC_CFD_MESH_SERVER || 'http://localhost:8001',
      cfdServerUrl: config.cfdServerUrl || process.env.NEXT_PUBLIC_CFD_SERVER || 'http://localhost:8000',
      postProcessorUrl: config.postProcessorUrl || process.env.NEXT_PUBLIC_CFD_POST_PROCESSOR || 'http://localhost:8002'
    }
  }

  /**
   * Generate computational mesh from 3D geometry
   */
  async generateMesh(request: MeshGenerationRequest): Promise<MeshGenerationJob> {
    console.log(`🔷 Generating CFD mesh for: ${request.geometryFile}`)

    try {
      const response = await fetch(`${this.config.meshServerUrl}/api/mesh/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        throw new Error(`Mesh generation failed: ${response.statusText}`)
      }

      const data = await response.json()

      return {
        jobId: data.job_id,
        status: data.status,
        progress: 0
      }
    } catch (error) {
      console.error('Failed to generate mesh:', error)
      throw error
    }
  }

  /**
   * Get mesh generation status
   */
  async getMeshStatus(jobId: string): Promise<MeshGenerationJob> {
    const response = await fetch(`${this.config.meshServerUrl}/api/mesh/${jobId}`)

    if (!response.ok) {
      throw new Error(`Failed to get mesh status: ${response.statusText}`)
    }

    const data = await response.json()

    return {
      jobId: data.id,
      status: data.status,
      progress: data.progress,
      duration: data.duration,
      error: data.error,
      meshStats: data.mesh_stats
    }
  }

  /**
   * Download generated mesh
   */
  async downloadMesh(jobId: string): Promise<Blob> {
    const response = await fetch(`${this.config.meshServerUrl}/api/mesh/${jobId}/download`)

    if (!response.ok) {
      throw new Error('Mesh not ready or not found')
    }

    return response.blob()
  }

  /**
   * Start CFD simulation
   */
  async startSimulation(request: CFDSimulationRequest): Promise<CFDSimulation> {
    console.log(`💨 Starting wind flow simulation (${request.windSpeed} m/s)`)

    try {
      const response = await fetch(`${this.config.cfdServerUrl}/api/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mesh_id: request.meshId,
          wind_speed: request.windSpeed,
          wind_direction: request.windDirection || 0,
          turbulence_model: request.turbulenceModel || 'kEpsilon',
          simulation_time: request.simulationTime || 1000
        })
      })

      if (!response.ok) {
        throw new Error(`Simulation failed: ${response.statusText}`)
      }

      const data = await response.json()

      return {
        simulationId: data.simulation_id,
        status: data.status,
        progress: 0
      }
    } catch (error) {
      console.error('Failed to start simulation:', error)
      throw error
    }
  }

  /**
   * Get simulation status
   */
  async getSimulationStatus(simulationId: string): Promise<CFDSimulation> {
    const response = await fetch(
      `${this.config.cfdServerUrl}/api/simulate/${simulationId}`
    )

    if (!response.ok) {
      throw new Error(`Failed to get simulation status: ${response.statusText}`)
    }

    const data = await response.json()

    return {
      simulationId: data.id,
      status: data.status,
      progress: data.progress,
      duration: data.duration,
      error: data.error,
      startTime: data.start_time,
      endTime: data.end_time
    }
  }

  /**
   * Cancel running simulation
   */
  async cancelSimulation(simulationId: string): Promise<void> {
    const response = await fetch(
      `${this.config.cfdServerUrl}/api/simulate/${simulationId}/cancel`,
      { method: 'POST' }
    )

    if (!response.ok) {
      throw new Error('Failed to cancel simulation')
    }
  }

  /**
   * Get simulation results
   */
  async getResults(simulationId: string): Promise<CFDResults> {
    const response = await fetch(
      `${this.config.postProcessorUrl}/api/results/${simulationId}`
    )

    if (!response.ok) {
      throw new Error('Results not available')
    }

    const data = await response.json()

    return {
      simulationId,
      velocity: data.velocity_field,
      pressure: data.pressure_field,
      forces: data.forces,
      dragCoefficient: data.drag_coefficient,
      liftCoefficient: data.lift_coefficient
    }
  }

  /**
   * Get pressure contour visualization
   */
  async getPressureContour(
    simulationId: string,
    plane: 'xy' | 'xz' | 'yz' = 'xz',
    height: number = 5
  ): Promise<Blob> {
    const response = await fetch(
      `${this.config.postProcessorUrl}/api/visualize/${simulationId}/pressure?plane=${plane}&height=${height}`
    )

    if (!response.ok) {
      throw new Error('Failed to get pressure contour')
    }

    return response.blob()
  }

  /**
   * Get velocity streamlines visualization
   */
  async getVelocityStreamlines(simulationId: string): Promise<Blob> {
    const response = await fetch(
      `${this.config.postProcessorUrl}/api/visualize/${simulationId}/streamlines`
    )

    if (!response.ok) {
      throw new Error('Failed to get streamlines')
    }

    return response.blob()
  }

  /**
   * Export results for ParaView
   */
  async exportParaView(simulationId: string): Promise<Blob> {
    const response = await fetch(
      `${this.config.postProcessorUrl}/api/export/${simulationId}/paraview`
    )

    if (!response.ok) {
      throw new Error('Failed to export for ParaView')
    }

    return response.blob()
  }

  /**
   * List all simulations
   */
  async listSimulations(): Promise<CFDSimulation[]> {
    const response = await fetch(`${this.config.cfdServerUrl}/api/simulate`)

    if (!response.ok) {
      throw new Error('Failed to list simulations')
    }

    const data = await response.json()

    return data.simulations.map((sim: any) => ({
      simulationId: sim.id,
      status: sim.status,
      progress: sim.progress,
      duration: sim.duration,
      error: sim.error
    }))
  }

  /**
   * Analyze wind comfort around building
   */
  async analyzeWindComfort(
    simulationId: string,
    pedestrianHeight: number = 1.5
  ): Promise<{
    comfortZones: Array<{
      zone: string
      velocityRange: [number, number]
      comfortLevel: 'comfortable' | 'acceptable' | 'uncomfortable' | 'dangerous'
      area: number
    }>
    recommendations: string[]
  }> {
    const results = await this.getResults(simulationId)

    // Analyze velocities at pedestrian height
    const pedestrianVelocities = results.velocity.velocities
      .filter((_, i) => Math.abs(results.velocity.points[i].z - pedestrianHeight) < 0.5)

    const comfortZones = this._calculateComfortZones(pedestrianVelocities)
    const recommendations = this._generateRecommendations(comfortZones)

    return {
      comfortZones,
      recommendations
    }
  }

  /**
   * Calculate wind comfort zones based on Lawson criteria
   */
  private _calculateComfortZones(velocities: Array<{ magnitude: number }>): Array<any> {
    const zones: Record<string, { velocities: number[]; comfortLevel: string }> = {
      'sitting': { velocities: [], comfortLevel: 'comfortable' },
      'standing': { velocities: [], comfortLevel: 'acceptable' },
      'walking': { velocities: [], comfortLevel: 'uncomfortable' },
      'unsafe': { velocities: [], comfortLevel: 'dangerous' }
    }

    velocities.forEach(v => {
      if (v.magnitude < 2.5) {
        zones['sitting'].velocities.push(v.magnitude)
      } else if (v.magnitude < 4.0) {
        zones['standing'].velocities.push(v.magnitude)
      } else if (v.magnitude < 6.0) {
        zones['walking'].velocities.push(v.magnitude)
      } else {
        zones['unsafe'].velocities.push(v.magnitude)
      }
    })

    return Object.entries(zones).map(([zone, data]) => ({
      zone,
      velocityRange: [
        Math.min(...data.velocities, 0),
        Math.max(...data.velocities, 0)
      ] as [number, number],
      comfortLevel: data.comfortLevel as any,
      area: data.velocities.length * 1.0 // Approximate area in m²
    }))
  }

  /**
   * Generate design recommendations
   */
  private _generateRecommendations(zones: Array<any>): string[] {
    const recommendations: string[] = []

    const unsafeZone = zones.find(z => z.zone === 'unsafe')
    if (unsafeZone && unsafeZone.area > 10) {
      recommendations.push('High wind speeds detected. Consider adding wind screens or barriers.')
      recommendations.push('Redesign building corners to reduce wind acceleration.')
    }

    const uncomfortableZone = zones.find(z => z.zone === 'walking')
    if (uncomfortableZone && uncomfortableZone.area > 50) {
      recommendations.push('Uncomfortable wind conditions for pedestrians. Add landscaping or canopies.')
    }

    const comfortableZone = zones.find(z => z.zone === 'sitting')
    if (comfortableZone && comfortableZone.area < 20) {
      recommendations.push('Limited comfortable outdoor seating areas. Consider sheltered spaces.')
    }

    if (recommendations.length === 0) {
      recommendations.push('Wind comfort analysis looks good. No major concerns identified.')
    }

    return recommendations
  }

  /**
   * Check if CFD services are available
   */
  async checkHealth(): Promise<{
    meshServer: boolean
    cfdServer: boolean
    postProcessor: boolean
  }> {
    const health = {
      meshServer: false,
      cfdServer: false,
      postProcessor: false
    }

    try {
      const meshResponse = await fetch(`${this.config.meshServerUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      })
      health.meshServer = meshResponse.ok
    } catch {
      health.meshServer = false
    }

    try {
      const cfdResponse = await fetch(`${this.config.cfdServerUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      })
      health.cfdServer = cfdResponse.ok
    } catch {
      health.cfdServer = false
    }

    try {
      const postResponse = await fetch(`${this.config.postProcessorUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      })
      health.postProcessor = postResponse.ok
    } catch {
      health.postProcessor = false
    }

    return health
  }
}

// Export singleton instance
export const windFlowCFD = new WindFlowCFDService()
