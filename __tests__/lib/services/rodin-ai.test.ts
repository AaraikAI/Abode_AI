import { describe, it, expect, beforeEach, vi } from 'vitest'
import { RodinAIService, type RodinJob } from '@/lib/services/rodin-ai'

describe('RodinAIService', () => {
  let service: RodinAIService

  beforeEach(() => {
    // Create service without API key to use mock mode
    service = new RodinAIService({
      apiKey: '',
      timeout: 5000
    })
  })

  describe('Text-to-3D Generation', () => {
    it('should create a text-to-3D job', async () => {
      const job = await service.textTo3D({
        prompt: 'A modern chair',
        style: 'realistic',
        quality: 'standard'
      })

      expect(job).toBeDefined()
      expect(job.jobId).toBeTruthy()
      expect(job.type).toBe('text-to-3d')
      expect(job.status).toBe('queued')
      expect(job.createdAt).toBeInstanceOf(Date)
    })

    it('should accept all text-to-3D parameters', async () => {
      const job = await service.textTo3D({
        prompt: 'Detailed prompt',
        negativePrompt: 'low quality',
        style: 'minimalist',
        quality: 'high',
        resolution: 1024,
        seed: 42,
        guidanceScale: 10
      })

      expect(job).toBeDefined()
      expect(job.type).toBe('text-to-3d')
    })

    it('should complete text-to-3D job in mock mode', async () => {
      const job = await service.textTo3D({
        prompt: 'Test model'
      })

      // Wait for mock completion
      await new Promise(resolve => setTimeout(resolve, 3500))

      const status = await service.getJobStatus(job.jobId)

      expect(status?.status).toBe('completed')
      expect(status?.result).toBeDefined()
      expect(status?.result?.modelUrl).toBeTruthy()
      expect(status?.result?.format).toBe('glb')
      expect(status?.result?.metadata).toBeDefined()
    })
  })

  describe('Image-to-3D Conversion', () => {
    it('should create an image-to-3D job', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      const job = await service.imageTo3D({
        image: mockFile,
        preprocessBackground: true,
        generateTexture: true
      })

      expect(job).toBeDefined()
      expect(job.jobId).toBeTruthy()
      expect(job.type).toBe('image-to-3d')
      expect(job.status).toBe('queued')
    })

    it('should accept image URL', async () => {
      const job = await service.imageTo3D({
        image: 'https://example.com/image.jpg',
        multiView: true
      })

      expect(job).toBeDefined()
      expect(job.type).toBe('image-to-3d')
    })

    it('should complete image-to-3D job in mock mode', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      const job = await service.imageTo3D({
        image: mockFile
      })

      // Wait for mock completion
      await new Promise(resolve => setTimeout(resolve, 4500))

      const status = await service.getJobStatus(job.jobId)

      expect(status?.status).toBe('completed')
      expect(status?.result).toBeDefined()
    })
  })

  describe('Texture Synthesis', () => {
    it('should create a texture synthesis job', async () => {
      const job = await service.synthesizeTexture({
        modelId: 'model_123',
        texturePrompt: 'Wooden texture',
        resolution: 2048,
        pbr: true
      })

      expect(job).toBeDefined()
      expect(job.type).toBe('texture')
      expect(job.status).toBe('queued')
    })

    it('should complete texture synthesis in mock mode', async () => {
      const job = await service.synthesizeTexture({
        modelId: 'model_123',
        texturePrompt: 'Metal texture'
      })

      // Wait for mock completion
      await new Promise(resolve => setTimeout(resolve, 3000))

      const status = await service.getJobStatus(job.jobId)

      expect(status?.status).toBe('completed')
      expect(status?.result?.metadata.textureResolution).toBeDefined()
    })
  })

  describe('Generative Editing', () => {
    it('should create a generative edit job', async () => {
      const job = await service.generativeEdit({
        modelId: 'model_123',
        editPrompt: 'Add decorative patterns',
        strength: 0.8
      })

      expect(job).toBeDefined()
      expect(job.type).toBe('edit')
      expect(job.status).toBe('queued')
    })

    it('should accept mask region', async () => {
      const job = await service.generativeEdit({
        modelId: 'model_123',
        editPrompt: 'Modify region',
        maskRegion: {
          type: 'box',
          coordinates: [0, 0, 0, 1, 1, 1]
        }
      })

      expect(job).toBeDefined()
    })

    it('should complete generative edit in mock mode', async () => {
      const job = await service.generativeEdit({
        modelId: 'model_123',
        editPrompt: 'Test edit'
      })

      // Wait for mock completion
      await new Promise(resolve => setTimeout(resolve, 4000))

      const status = await service.getJobStatus(job.jobId)

      expect(status?.status).toBe('completed')
      expect(status?.result).toBeDefined()
    })
  })

  describe('Job Management', () => {
    it('should get job status', async () => {
      const job = await service.textTo3D({
        prompt: 'Test'
      })

      const status = await service.getJobStatus(job.jobId)

      expect(status).toBeDefined()
      expect(status?.jobId).toBe(job.jobId)
    })

    it('should return null for non-existent job', async () => {
      const status = await service.getJobStatus('non_existent_id')

      expect(status).toBeNull()
    })

    it('should update job progress', async () => {
      const job = await service.textTo3D({
        prompt: 'Test'
      })

      // Wait for some progress
      await new Promise(resolve => setTimeout(resolve, 1500))

      const status = await service.getJobStatus(job.jobId)

      expect(status?.progress).toBeGreaterThan(0)
    })

    it('should track multiple jobs', async () => {
      const job1 = await service.textTo3D({ prompt: 'Model 1' })
      const job2 = await service.imageTo3D({ image: new File([''], 'test.jpg') })
      const job3 = await service.synthesizeTexture({
        modelId: '123',
        texturePrompt: 'Texture'
      })

      const allJobs = service.getAllJobs()

      expect(allJobs.length).toBeGreaterThanOrEqual(3)
      expect(allJobs.some(j => j.jobId === job1.jobId)).toBe(true)
      expect(allJobs.some(j => j.jobId === job2.jobId)).toBe(true)
      expect(allJobs.some(j => j.jobId === job3.jobId)).toBe(true)
    })

    it('should cancel a job', async () => {
      const job = await service.textTo3D({
        prompt: 'Test'
      })

      await service.cancelJob(job.jobId)

      const status = await service.getJobStatus(job.jobId)

      expect(status?.status).toBe('failed')
      expect(status?.error).toContain('Cancel')
    })

    it('should clear completed jobs', async () => {
      const job = await service.textTo3D({
        prompt: 'Test'
      })

      // Wait for completion
      await new Promise(resolve => setTimeout(resolve, 3500))

      service.clearCompleted()

      const status = await service.getJobStatus(job.jobId)

      expect(status).toBeNull()
    })
  })

  describe('Result Download', () => {
    it('should download completed result', async () => {
      const job = await service.textTo3D({
        prompt: 'Test'
      })

      // Wait for completion
      await new Promise(resolve => setTimeout(resolve, 3500))

      // Mock fetch for download
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          blob: () => Promise.resolve(new Blob(['model data']))
        } as Response)
      )

      const blob = await service.downloadResult(job.jobId)

      expect(blob).toBeInstanceOf(Blob)
    })

    it('should fail to download incomplete job', async () => {
      const job = await service.textTo3D({
        prompt: 'Test'
      })

      await expect(service.downloadResult(job.jobId)).rejects.toThrow()
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      const serviceWithKey = new RodinAIService({
        apiKey: 'test_key'
      })

      // Mock fetch to fail
      global.fetch = vi.fn(() => Promise.reject(new Error('Network error')))

      await expect(
        serviceWithKey.textTo3D({ prompt: 'Test' })
      ).rejects.toThrow()
    })

    it('should handle API errors', async () => {
      const serviceWithKey = new RodinAIService({
        apiKey: 'test_key'
      })

      // Mock fetch to return error
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          statusText: 'Bad Request'
        } as Response)
      )

      await expect(
        serviceWithKey.textTo3D({ prompt: 'Test' })
      ).rejects.toThrow('Rodin AI API error')
    })
  })

  describe('Job ID Generation', () => {
    it('should generate unique job IDs', async () => {
      const job1 = await service.textTo3D({ prompt: 'Test 1' })
      const job2 = await service.textTo3D({ prompt: 'Test 2' })

      expect(job1.jobId).not.toBe(job2.jobId)
      expect(job1.jobId).toMatch(/^rodin_\d+_[a-z0-9]+$/)
      expect(job2.jobId).toMatch(/^rodin_\d+_[a-z0-9]+$/)
    })
  })

  describe('Job Metadata', () => {
    it('should include correct timestamps', async () => {
      const before = new Date()
      const job = await service.textTo3D({ prompt: 'Test' })
      const after = new Date()

      expect(job.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime())
      expect(job.createdAt.getTime()).toBeLessThanOrEqual(after.getTime())
      expect(job.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime())
      expect(job.updatedAt.getTime()).toBeLessThanOrEqual(after.getTime())
    })

    it('should update timestamps on status changes', async () => {
      const job = await service.textTo3D({ prompt: 'Test' })
      const initialUpdated = job.updatedAt

      await new Promise(resolve => setTimeout(resolve, 1500))

      const status = await service.getJobStatus(job.jobId)

      expect(status?.updatedAt.getTime()).toBeGreaterThan(initialUpdated.getTime())
    })
  })

  describe('Mock Mode', () => {
    it('should run in mock mode without API key', async () => {
      const serviceNoKey = new RodinAIService({ apiKey: '' })

      const job = await serviceNoKey.textTo3D({ prompt: 'Test' })

      expect(job).toBeDefined()
      expect(job.status).toBe('queued')
    })

    it('should simulate realistic progress in mock mode', async () => {
      const job = await service.textTo3D({ prompt: 'Test' })

      // Check progress at different times
      await new Promise(resolve => setTimeout(resolve, 1200))
      const status1 = await service.getJobStatus(job.jobId)
      expect(status1?.progress).toBeGreaterThan(0)

      await new Promise(resolve => setTimeout(resolve, 2000))
      const status2 = await service.getJobStatus(job.jobId)
      expect(status2?.progress).toBeGreaterThanOrEqual(status1?.progress || 0)
    })

    it('should generate realistic mock results', async () => {
      const job = await service.textTo3D({
        prompt: 'Test',
        quality: 'high',
        resolution: 1024
      })

      await new Promise(resolve => setTimeout(resolve, 3500))

      const status = await service.getJobStatus(job.jobId)

      expect(status?.result?.metadata.vertices).toBeGreaterThan(0)
      expect(status?.result?.metadata.triangles).toBeGreaterThan(0)
      expect(status?.result?.metadata.materials).toBeGreaterThan(0)
      expect(status?.result?.metadata.fileSize).toBeGreaterThan(0)
    })
  })
})
