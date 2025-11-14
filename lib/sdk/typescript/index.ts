/**
 * Abode AI TypeScript/JavaScript SDK
 *
 * Official SDK for Abode AI API integration
 */

export interface AbodeAIConfig {
  apiKey: string
  baseUrl?: string
  timeout?: number
  retryAttempts?: number
}

export interface Project {
  id: string
  name: string
  description?: string
  status: 'draft' | 'active' | 'archived'
  createdAt: string
  updatedAt: string
}

export interface DesignModel {
  id: string
  projectId: string
  name: string
  type: 'building' | 'component' | 'material'
  data: any
  createdAt: string
}

export interface RenderJob {
  id: string
  projectId: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  progress: number
  outputUrl?: string
  createdAt: string
  completedAt?: string
}

export interface EnergySimulation {
  id: string
  projectId: string
  climate: string
  results: {
    annualHeating: number
    annualCooling: number
    totalEnergy: number
    costEstimate: number
  }
  recommendations: Array<{
    category: string
    recommendation: string
    estimatedSavings: number
  }>
}

export interface BionicOptimization {
  id: string
  projectId: string
  pattern: string
  results: {
    structuralScore: number
    thermalScore: number
    materialEfficiency: number
  }
  optimizedDesign: any
}

export interface MaterialProvenance {
  materialId: string
  materialName: string
  origin: {
    supplier: string
    location: string
    certifications: string[]
  }
  blockchain: {
    network: string
    transactionHash: string
    blockNumber: number
  }
  verified: boolean
}

export class AbodeAIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string
  ) {
    super(message)
    this.name = 'AbodeAIError'
  }
}

export class AbodeAI {
  private config: Required<AbodeAIConfig>

  constructor(config: AbodeAIConfig) {
    this.config = {
      apiKey: config.apiKey,
      baseUrl: config.baseUrl || 'https://api.abodeai.com/v1',
      timeout: config.timeout || 30000,
      retryAttempts: config.retryAttempts || 3
    }

    if (!this.config.apiKey) {
      throw new AbodeAIError('API key is required')
    }
  }

  // ============== Projects ==============

  async createProject(data: {
    name: string
    description?: string
  }): Promise<Project> {
    return this.request('POST', '/projects', data)
  }

  async getProject(projectId: string): Promise<Project> {
    return this.request('GET', `/projects/${projectId}`)
  }

  async listProjects(params?: {
    page?: number
    limit?: number
    status?: string
  }): Promise<{ projects: Project[]; total: number }> {
    return this.request('GET', '/projects', params)
  }

  async updateProject(
    projectId: string,
    data: Partial<Project>
  ): Promise<Project> {
    return this.request('PATCH', `/projects/${projectId}`, data)
  }

  async deleteProject(projectId: string): Promise<void> {
    return this.request('DELETE', `/projects/${projectId}`)
  }

  // ============== Design Models ==============

  async createModel(data: {
    projectId: string
    name: string
    type: 'building' | 'component' | 'material'
    data: any
  }): Promise<DesignModel> {
    return this.request('POST', '/models', data)
  }

  async getModel(modelId: string): Promise<DesignModel> {
    return this.request('GET', `/models/${modelId}`)
  }

  async listModels(projectId: string): Promise<DesignModel[]> {
    return this.request('GET', `/projects/${projectId}/models`)
  }

  // ============== Rendering ==============

  async createRender(data: {
    projectId: string
    modelId: string
    resolution: [number, number]
    samples?: number
    engine?: 'cycles' | 'eevee'
  }): Promise<RenderJob> {
    return this.request('POST', '/render', data)
  }

  async getRenderStatus(jobId: string): Promise<RenderJob> {
    return this.request('GET', `/render/${jobId}`)
  }

  async waitForRender(
    jobId: string,
    pollInterval: number = 5000
  ): Promise<RenderJob> {
    while (true) {
      const job = await this.getRenderStatus(jobId)

      if (job.status === 'completed') {
        return job
      } else if (job.status === 'failed') {
        throw new AbodeAIError('Render job failed', 500, 'RENDER_FAILED')
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval))
    }
  }

  // ============== Energy Simulation ==============

  async runEnergySimulation(data: {
    projectId: string
    climate: string
    buildingData: any
  }): Promise<EnergySimulation> {
    return this.request('POST', '/energy/simulate', data)
  }

  async getEnergyReport(simulationId: string): Promise<EnergySimulation> {
    return this.request('GET', `/energy/simulations/${simulationId}`)
  }

  // ============== Bionic Design ==============

  async optimizeDesign(data: {
    projectId: string
    pattern: 'honeycomb' | 'spider-web' | 'bone' | 'tree'
    constraints: any
    objectives: any
  }): Promise<BionicOptimization> {
    return this.request('POST', '/bionic/optimize', data)
  }

  async getBionicResults(optimizationId: string): Promise<BionicOptimization> {
    return this.request('GET', `/bionic/optimizations/${optimizationId}`)
  }

  // ============== Blockchain ==============

  async registerMaterial(data: {
    materialName: string
    materialType: string
    origin: any
    sustainability: any
  }): Promise<MaterialProvenance> {
    return this.request('POST', '/blockchain/materials', data)
  }

  async getMaterialProvenance(materialId: string): Promise<MaterialProvenance> {
    return this.request('GET', `/blockchain/materials/${materialId}`)
  }

  async verifySupplyChain(materialId: string): Promise<{
    valid: boolean
    events: any[]
    issues: string[]
  }> {
    return this.request('GET', `/blockchain/materials/${materialId}/verify`)
  }

  // ============== AR/VR Export ==============

  async exportToAR(data: {
    projectId: string
    format: 'gltf' | 'glb'
    options?: any
  }): Promise<{ url: string; fileSize: number }> {
    return this.request('POST', '/arvr/export', data)
  }

  // ============== Digital Twin ==============

  async createDigitalTwin(data: {
    projectId: string
    buildingId: string
    sensors: any[]
  }): Promise<{ success: boolean }> {
    return this.request('POST', `/digital-twin/${data.buildingId}`, {
      action: 'create',
      data
    })
  }

  async sendSensorReading(buildingId: string, reading: {
    sensorId: string
    value: number
    timestamp?: Date
    quality?: 'good' | 'uncertain' | 'bad'
  }): Promise<{ success: boolean }> {
    return this.request('POST', `/digital-twin/${buildingId}`, {
      action: 'sensor-reading',
      data: reading
    })
  }

  async getDigitalTwinState(buildingId: string): Promise<any> {
    return this.request('GET', `/digital-twin/${buildingId}?action=state`)
  }

  // ============== Marketplace ==============

  async searchAssets(params: {
    query?: string
    type?: string
    category?: string
    page?: number
    limit?: number
  }): Promise<{ assets: any[]; total: number }> {
    return this.request('GET', '/marketplace/assets', params)
  }

  async purchaseAsset(assetId: string, paymentMethodId: string): Promise<any> {
    return this.request('POST', '/marketplace/assets', {
      action: 'purchase',
      assetId,
      paymentMethodId
    })
  }

  // ============== Referrals ==============

  async getReferralCode(): Promise<{ code: string; url: string }> {
    return this.request('GET', '/referrals/code')
  }

  async getReferralStats(): Promise<any> {
    return this.request('GET', '/referrals/stats')
  }

  async getLeaderboard(period: 'all-time' | 'monthly' | 'weekly' = 'all-time'): Promise<any[]> {
    return this.request('GET', '/referrals/leaderboard', { period })
  }

  // ============== AI Training ==============

  async createDataset(data: {
    name: string
    type: 'style-transfer' | 'object-detection' | 'material-recognition'
  }): Promise<any> {
    return this.request('POST', '/ai/training', {
      action: 'create-dataset',
      ...data
    })
  }

  async startTraining(data: {
    datasetId: string
    modelConfig: any
  }): Promise<any> {
    return this.request('POST', '/ai/training', {
      action: 'start-training',
      ...data
    })
  }

  async runInference(data: {
    deploymentId: string
    input: any
  }): Promise<any> {
    return this.request('POST', '/ai/training', {
      action: 'inference',
      request: data
    })
  }

  // ============== Collaboration ==============

  async joinSession(sessionId: string, userName: string): Promise<any> {
    return this.request('POST', `/collaboration/${sessionId}/join`, { userName })
  }

  async addComment(sessionId: string, comment: {
    position: { x: number; y: number; z?: number }
    text: string
  }): Promise<any> {
    return this.request('POST', `/collaboration/${sessionId}/comments`, comment)
  }

  // ============== Core Request Method ==============

  private async request(
    method: string,
    path: string,
    data?: any
  ): Promise<any> {
    const url = new URL(path, this.config.baseUrl)

    // Add query params for GET requests
    if (method === 'GET' && data) {
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value))
        }
      })
    }

    let lastError: Error | null = null

    for (let attempt = 0; attempt < this.config.retryAttempts; attempt++) {
      try {
        const response = await fetch(url.toString(), {
          method,
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
            'User-Agent': 'AbodeAI-SDK-TS/1.0.0'
          },
          body: method !== 'GET' && data ? JSON.stringify(data) : undefined,
          signal: AbortSignal.timeout(this.config.timeout)
        })

        const responseData = await response.json()

        if (!response.ok) {
          throw new AbodeAIError(
            responseData.error || 'Request failed',
            response.status,
            responseData.code
          )
        }

        return responseData.data || responseData
      } catch (error: any) {
        lastError = error

        // Don't retry on client errors (4xx)
        if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
          throw error
        }

        // Wait before retrying
        if (attempt < this.config.retryAttempts - 1) {
          await new Promise(resolve =>
            setTimeout(resolve, Math.pow(2, attempt) * 1000)
          )
        }
      }
    }

    throw lastError || new AbodeAIError('Request failed after retries')
  }
}

// Export types
export type {
  AbodeAIConfig,
  Project,
  DesignModel,
  RenderJob,
  EnergySimulation,
  BionicOptimization,
  MaterialProvenance
}

// Default export
export default AbodeAI
