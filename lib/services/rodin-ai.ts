/**
 * Rodin AI Integration Service
 *
 * Provides AI-powered 3D content generation capabilities:
 * - Text-to-3D: Generate 3D models from text descriptions
 * - Image-to-3D: Convert 2D images to 3D models
 * - Texture Synthesis: Generate realistic textures
 * - Generative Editing: AI-assisted model modifications
 *
 * API Documentation: https://hyperhuman.deemos.com/rodin
 */

export interface RodinAIConfig {
  apiKey: string
  apiEndpoint?: string
  timeout?: number
}

export interface TextTo3DRequest {
  prompt: string
  negativePrompt?: string
  style?: 'realistic' | 'stylized' | 'minimalist' | 'concept-art'
  quality?: 'draft' | 'standard' | 'high' | 'ultra'
  resolution?: number
  seed?: number
  guidanceScale?: number
}

export interface ImageTo3DRequest {
  image: File | string // File object or base64/URL
  prompt?: string
  preprocessBackground?: boolean
  resolution?: number
  multiView?: boolean
  generateTexture?: boolean
}

export interface TextureSynthesisRequest {
  modelId: string
  texturePrompt: string
  resolution?: number
  seamless?: boolean
  pbr?: boolean // Physically-based rendering materials
  style?: string
}

export interface GenerativeEditRequest {
  modelId: string
  editPrompt: string
  maskRegion?: {
    type: 'box' | 'sphere' | 'custom'
    coordinates: number[]
  }
  strength?: number
}

export interface RodinJob {
  jobId: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  type: 'text-to-3d' | 'image-to-3d' | 'texture' | 'edit'
  progress: number
  createdAt: Date
  updatedAt: Date
  result?: RodinResult
  error?: string
}

export interface RodinResult {
  modelUrl: string
  format: 'glb' | 'fbx' | 'obj' | 'usdz'
  thumbnailUrl?: string
  metadata: {
    vertices: number
    triangles: number
    materials: number
    textureResolution?: number
    fileSize: number
  }
}

export class RodinAIService {
  private config: Required<RodinAIConfig>
  private jobs: Map<string, RodinJob> = new Map()

  constructor(config: RodinAIConfig) {
    this.config = {
      apiKey: config.apiKey,
      apiEndpoint: config.apiEndpoint || 'https://api.hyperhuman.deemos.com/v1',
      timeout: config.timeout || 300000 // 5 minutes default
    }

    if (!this.config.apiKey) {
      console.warn('⚠️ Rodin AI API key not provided. Service will use mock mode.')
    }
  }

  /**
   * Generate a 3D model from text description
   */
  async textTo3D(request: TextTo3DRequest): Promise<RodinJob> {
    console.log(`🎨 Generating 3D model from prompt: "${request.prompt}"`)

    const jobId = this.generateJobId()
    const job: RodinJob = {
      jobId,
      status: 'queued',
      type: 'text-to-3d',
      progress: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    this.jobs.set(jobId, job)

    try {
      if (!this.config.apiKey) {
        // Mock mode for testing
        return this.mockTextTo3D(job, request)
      }

      const response = await fetch(`${this.config.apiEndpoint}/text-to-3d`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: request.prompt,
          negative_prompt: request.negativePrompt,
          style: request.style || 'realistic',
          quality: request.quality || 'standard',
          resolution: request.resolution || 512,
          seed: request.seed,
          guidance_scale: request.guidanceScale || 7.5
        }),
        signal: AbortSignal.timeout(this.config.timeout)
      })

      if (!response.ok) {
        throw new Error(`Rodin AI API error: ${response.statusText}`)
      }

      const data = await response.json()

      // Update job with API response
      job.jobId = data.job_id || jobId
      job.status = 'processing'
      job.updatedAt = new Date()

      this.jobs.set(job.jobId, job)

      // Poll for completion
      this.pollJobStatus(job.jobId)

      return job
    } catch (error) {
      job.status = 'failed'
      job.error = error instanceof Error ? error.message : 'Unknown error'
      job.updatedAt = new Date()
      this.jobs.set(jobId, job)
      throw error
    }
  }

  /**
   * Convert an image to a 3D model
   */
  async imageTo3D(request: ImageTo3DRequest): Promise<RodinJob> {
    console.log('📸 Converting image to 3D model...')

    const jobId = this.generateJobId()
    const job: RodinJob = {
      jobId,
      status: 'queued',
      type: 'image-to-3d',
      progress: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    this.jobs.set(jobId, job)

    try {
      if (!this.config.apiKey) {
        return this.mockImageTo3D(job, request)
      }

      // Prepare image data
      const imageData = await this.prepareImageData(request.image)

      const formData = new FormData()
      if (imageData instanceof File) {
        formData.append('image', imageData)
      } else {
        formData.append('image_url', imageData)
      }

      if (request.prompt) {
        formData.append('prompt', request.prompt)
      }
      formData.append('preprocess_background', String(request.preprocessBackground !== false))
      formData.append('resolution', String(request.resolution || 512))
      formData.append('multi_view', String(request.multiView || true))
      formData.append('generate_texture', String(request.generateTexture !== false))

      const response = await fetch(`${this.config.apiEndpoint}/image-to-3d`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: formData,
        signal: AbortSignal.timeout(this.config.timeout)
      })

      if (!response.ok) {
        throw new Error(`Rodin AI API error: ${response.statusText}`)
      }

      const data = await response.json()

      job.jobId = data.job_id || jobId
      job.status = 'processing'
      job.updatedAt = new Date()
      this.jobs.set(job.jobId, job)

      this.pollJobStatus(job.jobId)

      return job
    } catch (error) {
      job.status = 'failed'
      job.error = error instanceof Error ? error.message : 'Unknown error'
      job.updatedAt = new Date()
      this.jobs.set(jobId, job)
      throw error
    }
  }

  /**
   * Generate or modify textures for a 3D model
   */
  async synthesizeTexture(request: TextureSynthesisRequest): Promise<RodinJob> {
    console.log(`🎨 Synthesizing texture: "${request.texturePrompt}"`)

    const jobId = this.generateJobId()
    const job: RodinJob = {
      jobId,
      status: 'queued',
      type: 'texture',
      progress: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    this.jobs.set(jobId, job)

    try {
      if (!this.config.apiKey) {
        return this.mockTextureSynthesis(job, request)
      }

      const response = await fetch(`${this.config.apiEndpoint}/texture-synthesis`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model_id: request.modelId,
          texture_prompt: request.texturePrompt,
          resolution: request.resolution || 2048,
          seamless: request.seamless !== false,
          pbr: request.pbr !== false,
          style: request.style
        }),
        signal: AbortSignal.timeout(this.config.timeout)
      })

      if (!response.ok) {
        throw new Error(`Rodin AI API error: ${response.statusText}`)
      }

      const data = await response.json()

      job.jobId = data.job_id || jobId
      job.status = 'processing'
      job.updatedAt = new Date()
      this.jobs.set(job.jobId, job)

      this.pollJobStatus(job.jobId)

      return job
    } catch (error) {
      job.status = 'failed'
      job.error = error instanceof Error ? error.message : 'Unknown error'
      job.updatedAt = new Date()
      this.jobs.set(jobId, job)
      throw error
    }
  }

  /**
   * Apply generative edits to a 3D model
   */
  async generativeEdit(request: GenerativeEditRequest): Promise<RodinJob> {
    console.log(`✏️ Applying generative edit: "${request.editPrompt}"`)

    const jobId = this.generateJobId()
    const job: RodinJob = {
      jobId,
      status: 'queued',
      type: 'edit',
      progress: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    this.jobs.set(jobId, job)

    try {
      if (!this.config.apiKey) {
        return this.mockGenerativeEdit(job, request)
      }

      const response = await fetch(`${this.config.apiEndpoint}/generative-edit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model_id: request.modelId,
          edit_prompt: request.editPrompt,
          mask_region: request.maskRegion,
          strength: request.strength || 0.75
        }),
        signal: AbortSignal.timeout(this.config.timeout)
      })

      if (!response.ok) {
        throw new Error(`Rodin AI API error: ${response.statusText}`)
      }

      const data = await response.json()

      job.jobId = data.job_id || jobId
      job.status = 'processing'
      job.updatedAt = new Date()
      this.jobs.set(job.jobId, job)

      this.pollJobStatus(job.jobId)

      return job
    } catch (error) {
      job.status = 'failed'
      job.error = error instanceof Error ? error.message : 'Unknown error'
      job.updatedAt = new Date()
      this.jobs.set(jobId, job)
      throw error
    }
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<RodinJob | null> {
    const job = this.jobs.get(jobId)
    if (!job) return null

    // If job is complete or failed, return cached result
    if (job.status === 'completed' || job.status === 'failed') {
      return job
    }

    try {
      if (!this.config.apiKey) {
        // Mock mode - simulate progress
        return this.mockJobProgress(job)
      }

      const response = await fetch(
        `${this.config.apiEndpoint}/jobs/${jobId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`
          }
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch job status: ${response.statusText}`)
      }

      const data = await response.json()

      job.status = data.status
      job.progress = data.progress || job.progress
      job.updatedAt = new Date()

      if (data.status === 'completed' && data.result) {
        job.result = {
          modelUrl: data.result.model_url,
          format: data.result.format || 'glb',
          thumbnailUrl: data.result.thumbnail_url,
          metadata: {
            vertices: data.result.vertices || 0,
            triangles: data.result.triangles || 0,
            materials: data.result.materials || 0,
            textureResolution: data.result.texture_resolution,
            fileSize: data.result.file_size || 0
          }
        }
      }

      if (data.status === 'failed') {
        job.error = data.error || 'Job failed'
      }

      this.jobs.set(jobId, job)
      return job
    } catch (error) {
      console.error('Failed to get job status:', error)
      return job
    }
  }

  /**
   * Cancel a job
   */
  async cancelJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId)
    if (!job) {
      throw new Error(`Job not found: ${jobId}`)
    }

    if (job.status === 'completed' || job.status === 'failed') {
      return // Already done
    }

    try {
      if (this.config.apiKey) {
        await fetch(`${this.config.apiEndpoint}/jobs/${jobId}/cancel`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`
          }
        })
      }

      job.status = 'failed'
      job.error = 'Cancelled by user'
      job.updatedAt = new Date()
      this.jobs.set(jobId, job)
    } catch (error) {
      console.error('Failed to cancel job:', error)
      throw error
    }
  }

  /**
   * Download result
   */
  async downloadResult(jobId: string, format?: 'glb' | 'fbx' | 'obj' | 'usdz'): Promise<Blob> {
    const job = await this.getJobStatus(jobId)

    if (!job || job.status !== 'completed' || !job.result) {
      throw new Error('Job not completed or result not available')
    }

    const url = job.result.modelUrl
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error('Failed to download model')
    }

    return response.blob()
  }

  /**
   * Poll job status until completion
   */
  private async pollJobStatus(jobId: string, interval: number = 2000): Promise<void> {
    const poll = async () => {
      const job = await this.getJobStatus(jobId)

      if (!job) return

      if (job.status === 'completed' || job.status === 'failed') {
        console.log(`✅ Job ${jobId} ${job.status}`)
        return
      }

      // Continue polling
      setTimeout(poll, interval)
    }

    poll()
  }

  /**
   * Prepare image data for upload
   */
  private async prepareImageData(image: File | string): Promise<File | string> {
    if (typeof image === 'string') {
      // URL or base64
      return image
    }
    return image
  }

  /**
   * Generate unique job ID
   */
  private generateJobId(): string {
    return `rodin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Mock text-to-3D generation
   */
  private mockTextTo3D(job: RodinJob, request: TextTo3DRequest): RodinJob {
    console.log('🔧 Running in mock mode (no API key)')

    setTimeout(() => {
      job.status = 'processing'
      job.progress = 50
      job.updatedAt = new Date()
      this.jobs.set(job.jobId, job)
    }, 1000)

    setTimeout(() => {
      job.status = 'completed'
      job.progress = 100
      job.result = {
        modelUrl: `/mock-models/text-to-3d-${job.jobId}.glb`,
        format: 'glb',
        thumbnailUrl: `/mock-models/thumb-${job.jobId}.jpg`,
        metadata: {
          vertices: 15420,
          triangles: 28840,
          materials: 3,
          textureResolution: 2048,
          fileSize: 2456789
        }
      }
      job.updatedAt = new Date()
      this.jobs.set(job.jobId, job)
      console.log(`✅ Mock job completed: ${job.jobId}`)
    }, 3000)

    return job
  }

  /**
   * Mock image-to-3D generation
   */
  private mockImageTo3D(job: RodinJob, request: ImageTo3DRequest): RodinJob {
    console.log('🔧 Running in mock mode (no API key)')

    setTimeout(() => {
      job.status = 'processing'
      job.progress = 50
      job.updatedAt = new Date()
      this.jobs.set(job.jobId, job)
    }, 1000)

    setTimeout(() => {
      job.status = 'completed'
      job.progress = 100
      job.result = {
        modelUrl: `/mock-models/image-to-3d-${job.jobId}.glb`,
        format: 'glb',
        thumbnailUrl: `/mock-models/thumb-${job.jobId}.jpg`,
        metadata: {
          vertices: 22150,
          triangles: 41260,
          materials: 1,
          textureResolution: 2048,
          fileSize: 3245678
        }
      }
      job.updatedAt = new Date()
      this.jobs.set(job.jobId, job)
    }, 4000)

    return job
  }

  /**
   * Mock texture synthesis
   */
  private mockTextureSynthesis(job: RodinJob, request: TextureSynthesisRequest): RodinJob {
    console.log('🔧 Running in mock mode (no API key)')

    setTimeout(() => {
      job.status = 'completed'
      job.progress = 100
      job.result = {
        modelUrl: `/mock-models/textured-${job.jobId}.glb`,
        format: 'glb',
        metadata: {
          vertices: 18240,
          triangles: 35120,
          materials: 1,
          textureResolution: request.resolution || 2048,
          fileSize: 4567890
        }
      }
      job.updatedAt = new Date()
      this.jobs.set(job.jobId, job)
    }, 2500)

    return job
  }

  /**
   * Mock generative edit
   */
  private mockGenerativeEdit(job: RodinJob, request: GenerativeEditRequest): RodinJob {
    console.log('🔧 Running in mock mode (no API key)')

    setTimeout(() => {
      job.status = 'completed'
      job.progress = 100
      job.result = {
        modelUrl: `/mock-models/edited-${job.jobId}.glb`,
        format: 'glb',
        metadata: {
          vertices: 19850,
          triangles: 37240,
          materials: 2,
          textureResolution: 2048,
          fileSize: 3789456
        }
      }
      job.updatedAt = new Date()
      this.jobs.set(job.jobId, job)
    }, 3500)

    return job
  }

  /**
   * Mock job progress
   */
  private mockJobProgress(job: RodinJob): RodinJob {
    if (job.progress < 100) {
      job.progress = Math.min(100, job.progress + 10)
      job.updatedAt = new Date()
      this.jobs.set(job.jobId, job)
    }
    return job
  }

  /**
   * Get all jobs
   */
  getAllJobs(): RodinJob[] {
    return Array.from(this.jobs.values())
  }

  /**
   * Clear completed jobs
   */
  clearCompleted(): void {
    for (const [jobId, job] of this.jobs.entries()) {
      if (job.status === 'completed' || job.status === 'failed') {
        this.jobs.delete(jobId)
      }
    }
  }
}

// Export singleton with environment API key
export const rodinAI = new RodinAIService({
  apiKey: process.env.NEXT_PUBLIC_RODIN_API_KEY || '',
  apiEndpoint: process.env.NEXT_PUBLIC_RODIN_API_ENDPOINT
})
