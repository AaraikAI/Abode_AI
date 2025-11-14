/**
 * Render Queue Service Tests
 * Tests job queue management, priority scheduling, progress tracking, and cancellation
 */

import { RenderQueue } from '@/lib/services/render-queue'

describe('RenderQueue Service', () => {
  let service: RenderQueue

  beforeEach(() => {
    service = new RenderQueue()
  })

  afterEach(() => {
    // Clean up any running jobs
    service.shutdown()
  })

  describe('Job Creation', () => {
    test('should create a render job with default settings', async () => {
      const job = await service.createJob({
        projectId: 'project-123',
        sceneId: 'scene-456',
        userId: 'user-789',
        outputFormat: 'png',
        resolution: { width: 1920, height: 1080 }
      })

      expect(job).toHaveProperty('id')
      expect(job.status).toBe('queued')
      expect(job.priority).toBe('normal')
      expect(job.progress).toBe(0)
    })

    test('should create a high-priority render job', async () => {
      const job = await service.createJob({
        projectId: 'project-123',
        sceneId: 'scene-456',
        userId: 'user-789',
        outputFormat: 'png',
        resolution: { width: 1920, height: 1080 },
        priority: 'high'
      })

      expect(job.priority).toBe('high')
    })

    test('should support 4K resolution', async () => {
      const job = await service.createJob({
        projectId: 'project-123',
        sceneId: 'scene-456',
        userId: 'user-789',
        outputFormat: 'png',
        resolution: { width: 3840, height: 2160 }
      })

      expect(job.resolution.width).toBe(3840)
      expect(job.resolution.height).toBe(2160)
    })

    test('should support 8K resolution', async () => {
      const job = await service.createJob({
        projectId: 'project-123',
        sceneId: 'scene-456',
        userId: 'user-789',
        outputFormat: 'png',
        resolution: { width: 7680, height: 4320 }
      })

      expect(job.resolution.width).toBe(7680)
    })

    test('should validate required fields', async () => {
      await expect(
        service.createJob({} as any)
      ).rejects.toThrow('Missing required fields')
    })

    test('should validate output format', async () => {
      await expect(
        service.createJob({
          projectId: 'project-123',
          sceneId: 'scene-456',
          userId: 'user-789',
          outputFormat: 'invalid' as any,
          resolution: { width: 1920, height: 1080 }
        })
      ).rejects.toThrow('Invalid output format')
    })
  })

  describe('Job Queue Management', () => {
    test('should process jobs in FIFO order for same priority', async () => {
      const job1 = await service.createJob({
        projectId: 'p1', sceneId: 's1', userId: 'u1',
        outputFormat: 'png', resolution: { width: 1920, height: 1080 }
      })

      const job2 = await service.createJob({
        projectId: 'p2', sceneId: 's2', userId: 'u2',
        outputFormat: 'png', resolution: { width: 1920, height: 1080 }
      })

      const queue = await service.getQueue()
      expect(queue[0].id).toBe(job1.id)
      expect(queue[1].id).toBe(job2.id)
    })

    test('should prioritize high-priority jobs', async () => {
      const normalJob = await service.createJob({
        projectId: 'p1', sceneId: 's1', userId: 'u1',
        outputFormat: 'png', resolution: { width: 1920, height: 1080 },
        priority: 'normal'
      })

      const highJob = await service.createJob({
        projectId: 'p2', sceneId: 's2', userId: 'u2',
        outputFormat: 'png', resolution: { width: 1920, height: 1080 },
        priority: 'high'
      })

      const queue = await service.getQueue()
      expect(queue[0].id).toBe(highJob.id)
      expect(queue[1].id).toBe(normalJob.id)
    })

    test('should handle urgent priority jobs', async () => {
      const normalJob = await service.createJob({
        projectId: 'p1', sceneId: 's1', userId: 'u1',
        outputFormat: 'png', resolution: { width: 1920, height: 1080 }
      })

      const urgentJob = await service.createJob({
        projectId: 'p2', sceneId: 's2', userId: 'u2',
        outputFormat: 'png', resolution: { width: 1920, height: 1080 },
        priority: 'urgent'
      })

      const queue = await service.getQueue()
      expect(queue[0].id).toBe(urgentJob.id)
    })

    test('should enforce max queue size', async () => {
      // Create jobs up to max queue size
      const maxQueueSize = 100
      const jobs = []

      for (let i = 0; i < maxQueueSize; i++) {
        jobs.push(await service.createJob({
          projectId: `p${i}`, sceneId: `s${i}`, userId: 'u1',
          outputFormat: 'png', resolution: { width: 1920, height: 1080 }
        }))
      }

      // Attempt to add one more
      await expect(
        service.createJob({
          projectId: 'p-overflow', sceneId: 's-overflow', userId: 'u1',
          outputFormat: 'png', resolution: { width: 1920, height: 1080 }
        })
      ).rejects.toThrow('Queue is full')
    })
  })

  describe('Job Processing', () => {
    test('should start processing a queued job', async () => {
      const job = await service.createJob({
        projectId: 'project-123',
        sceneId: 'scene-456',
        userId: 'user-789',
        outputFormat: 'png',
        resolution: { width: 1920, height: 1080 }
      })

      await service.startJob(job.id)

      const updatedJob = await service.getJob(job.id)
      expect(updatedJob.status).toBe('rendering')
      expect(updatedJob.startedAt).toBeDefined()
    })

    test('should track progress updates', async () => {
      const job = await service.createJob({
        projectId: 'project-123',
        sceneId: 'scene-456',
        userId: 'user-789',
        outputFormat: 'png',
        resolution: { width: 1920, height: 1080 }
      })

      await service.startJob(job.id)
      await service.updateProgress(job.id, 25)

      const updatedJob = await service.getJob(job.id)
      expect(updatedJob.progress).toBe(25)

      await service.updateProgress(job.id, 50)
      const halfwayJob = await service.getJob(job.id)
      expect(halfwayJob.progress).toBe(50)
    })

    test('should complete a job successfully', async () => {
      const job = await service.createJob({
        projectId: 'project-123',
        sceneId: 'scene-456',
        userId: 'user-789',
        outputFormat: 'png',
        resolution: { width: 1920, height: 1080 }
      })

      await service.startJob(job.id)
      await service.completeJob(job.id, {
        url: 'https://storage.abodeai.com/renders/render-123.png',
        size: 2048000,
        renderTime: 45.2
      })

      const completedJob = await service.getJob(job.id)
      expect(completedJob.status).toBe('completed')
      expect(completedJob.progress).toBe(100)
      expect(completedJob.outputUrl).toBeDefined()
      expect(completedJob.completedAt).toBeDefined()
    })

    test('should handle job failure', async () => {
      const job = await service.createJob({
        projectId: 'project-123',
        sceneId: 'scene-456',
        userId: 'user-789',
        outputFormat: 'png',
        resolution: { width: 1920, height: 1080 }
      })

      await service.startJob(job.id)
      await service.failJob(job.id, 'Out of memory')

      const failedJob = await service.getJob(job.id)
      expect(failedJob.status).toBe('failed')
      expect(failedJob.error).toBe('Out of memory')
    })
  })

  describe('Job Cancellation', () => {
    test('should cancel a queued job', async () => {
      const job = await service.createJob({
        projectId: 'project-123',
        sceneId: 'scene-456',
        userId: 'user-789',
        outputFormat: 'png',
        resolution: { width: 1920, height: 1080 }
      })

      await service.cancelJob(job.id)

      const cancelledJob = await service.getJob(job.id)
      expect(cancelledJob.status).toBe('cancelled')
    })

    test('should cancel a running job', async () => {
      const job = await service.createJob({
        projectId: 'project-123',
        sceneId: 'scene-456',
        userId: 'user-789',
        outputFormat: 'png',
        resolution: { width: 1920, height: 1080 }
      })

      await service.startJob(job.id)
      await service.cancelJob(job.id)

      const cancelledJob = await service.getJob(job.id)
      expect(cancelledJob.status).toBe('cancelled')
    })

    test('should not allow cancelling completed jobs', async () => {
      const job = await service.createJob({
        projectId: 'project-123',
        sceneId: 'scene-456',
        userId: 'user-789',
        outputFormat: 'png',
        resolution: { width: 1920, height: 1080 }
      })

      await service.startJob(job.id)
      await service.completeJob(job.id, {
        url: 'https://storage.abodeai.com/renders/render-123.png'
      })

      await expect(
        service.cancelJob(job.id)
      ).rejects.toThrow('Cannot cancel completed job')
    })
  })

  describe('Real-time Progress', () => {
    test('should emit progress events', async () => {
      const job = await service.createJob({
        projectId: 'project-123',
        sceneId: 'scene-456',
        userId: 'user-789',
        outputFormat: 'png',
        resolution: { width: 1920, height: 1080 }
      })

      const progressUpdates: number[] = []
      service.onProgress(job.id, (progress) => {
        progressUpdates.push(progress)
      })

      await service.startJob(job.id)
      await service.updateProgress(job.id, 25)
      await service.updateProgress(job.id, 50)
      await service.updateProgress(job.id, 75)
      await service.updateProgress(job.id, 100)

      expect(progressUpdates).toEqual([25, 50, 75, 100])
    })

    test('should emit status change events', async () => {
      const job = await service.createJob({
        projectId: 'project-123',
        sceneId: 'scene-456',
        userId: 'user-789',
        outputFormat: 'png',
        resolution: { width: 1920, height: 1080 }
      })

      const statusUpdates: string[] = []
      service.onStatusChange(job.id, (status) => {
        statusUpdates.push(status)
      })

      await service.startJob(job.id)
      await service.completeJob(job.id, {
        url: 'https://storage.abodeai.com/renders/render-123.png'
      })

      expect(statusUpdates).toContain('rendering')
      expect(statusUpdates).toContain('completed')
    })
  })

  describe('Batch Rendering', () => {
    test('should create batch render jobs', async () => {
      const scenes = ['scene-1', 'scene-2', 'scene-3']
      const batchId = await service.createBatchRender({
        projectId: 'project-123',
        sceneIds: scenes,
        userId: 'user-789',
        outputFormat: 'png',
        resolution: { width: 1920, height: 1080 }
      })

      const batch = await service.getBatch(batchId)
      expect(batch.jobs).toHaveLength(3)
      expect(batch.status).toBe('pending')
    })

    test('should track batch progress', async () => {
      const scenes = ['scene-1', 'scene-2']
      const batchId = await service.createBatchRender({
        projectId: 'project-123',
        sceneIds: scenes,
        userId: 'user-789',
        outputFormat: 'png',
        resolution: { width: 1920, height: 1080 }
      })

      const batch = await service.getBatch(batchId)
      await service.completeJob(batch.jobs[0].id, {
        url: 'https://storage.abodeai.com/renders/r1.png'
      })

      const updatedBatch = await service.getBatch(batchId)
      expect(updatedBatch.completedCount).toBe(1)
      expect(updatedBatch.progress).toBe(50)
    })

    test('should complete batch when all jobs done', async () => {
      const scenes = ['scene-1', 'scene-2']
      const batchId = await service.createBatchRender({
        projectId: 'project-123',
        sceneIds: scenes,
        userId: 'user-789',
        outputFormat: 'png',
        resolution: { width: 1920, height: 1080 }
      })

      const batch = await service.getBatch(batchId)
      for (const job of batch.jobs) {
        await service.startJob(job.id)
        await service.completeJob(job.id, {
          url: `https://storage.abodeai.com/renders/${job.id}.png`
        })
      }

      const completedBatch = await service.getBatch(batchId)
      expect(completedBatch.status).toBe('completed')
      expect(completedBatch.progress).toBe(100)
    })
  })

  describe('Resource Management', () => {
    test('should limit concurrent renders', async () => {
      const maxConcurrent = 3

      // Create 5 jobs
      const jobs = []
      for (let i = 0; i < 5; i++) {
        jobs.push(await service.createJob({
          projectId: `p${i}`, sceneId: `s${i}`, userId: 'u1',
          outputFormat: 'png', resolution: { width: 1920, height: 1080 }
        }))
      }

      // Start processing
      await service.processQueue()

      const runningJobs = await service.getRunningJobs()
      expect(runningJobs.length).toBeLessThanOrEqual(maxConcurrent)
    })

    test('should estimate render time based on resolution', async () => {
      const hdJob = await service.createJob({
        projectId: 'p1', sceneId: 's1', userId: 'u1',
        outputFormat: 'png', resolution: { width: 1920, height: 1080 }
      })

      const fourKJob = await service.createJob({
        projectId: 'p2', sceneId: 's2', userId: 'u2',
        outputFormat: 'png', resolution: { width: 3840, height: 2160 }
      })

      const hdEstimate = await service.estimateRenderTime(hdJob.id)
      const fourKEstimate = await service.estimateRenderTime(fourKJob.id)

      expect(fourKEstimate).toBeGreaterThan(hdEstimate)
    })

    test('should clean up old completed jobs', async () => {
      const job = await service.createJob({
        projectId: 'project-123',
        sceneId: 'scene-456',
        userId: 'user-789',
        outputFormat: 'png',
        resolution: { width: 1920, height: 1080 }
      })

      await service.startJob(job.id)
      await service.completeJob(job.id, {
        url: 'https://storage.abodeai.com/renders/render-123.png'
      })

      // Simulate 30 days passing
      jest.useFakeTimers()
      jest.advanceTimersByTime(30 * 24 * 60 * 60 * 1000)

      await service.cleanupOldJobs()

      await expect(
        service.getJob(job.id)
      ).rejects.toThrow('Job not found')

      jest.useRealTimers()
    })
  })

  describe('Error Handling and Retry', () => {
    test('should retry failed jobs automatically', async () => {
      const job = await service.createJob({
        projectId: 'project-123',
        sceneId: 'scene-456',
        userId: 'user-789',
        outputFormat: 'png',
        resolution: { width: 1920, height: 1080 },
        retryOnFailure: true
      })

      await service.startJob(job.id)
      await service.failJob(job.id, 'Temporary network error')

      // Wait for auto-retry
      await new Promise(resolve => setTimeout(resolve, 2000))

      const retriedJob = await service.getJob(job.id)
      expect(retriedJob.retryCount).toBe(1)
      expect(retriedJob.status).toBe('queued')
    })

    test('should not retry after max attempts', async () => {
      const job = await service.createJob({
        projectId: 'project-123',
        sceneId: 'scene-456',
        userId: 'user-789',
        outputFormat: 'png',
        resolution: { width: 1920, height: 1080 },
        retryOnFailure: true,
        maxRetries: 3
      })

      // Fail 3 times
      for (let i = 0; i < 3; i++) {
        await service.startJob(job.id)
        await service.failJob(job.id, 'Persistent error')
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      const finalJob = await service.getJob(job.id)
      expect(finalJob.status).toBe('failed')
      expect(finalJob.retryCount).toBe(3)
    })
  })

  describe('User-specific Operations', () => {
    test('should get all jobs for a user', async () => {
      await service.createJob({
        projectId: 'p1', sceneId: 's1', userId: 'user-123',
        outputFormat: 'png', resolution: { width: 1920, height: 1080 }
      })

      await service.createJob({
        projectId: 'p2', sceneId: 's2', userId: 'user-123',
        outputFormat: 'png', resolution: { width: 1920, height: 1080 }
      })

      await service.createJob({
        projectId: 'p3', sceneId: 's3', userId: 'user-456',
        outputFormat: 'png', resolution: { width: 1920, height: 1080 }
      })

      const userJobs = await service.getUserJobs('user-123')
      expect(userJobs).toHaveLength(2)
    })

    test('should get usage statistics for a user', async () => {
      const job1 = await service.createJob({
        projectId: 'p1', sceneId: 's1', userId: 'user-123',
        outputFormat: 'png', resolution: { width: 1920, height: 1080 }
      })

      const job2 = await service.createJob({
        projectId: 'p2', sceneId: 's2', userId: 'user-123',
        outputFormat: 'png', resolution: { width: 3840, height: 2160 }
      })

      await service.startJob(job1.id)
      await service.completeJob(job1.id, {
        url: 'https://storage.abodeai.com/renders/r1.png',
        renderTime: 30
      })

      await service.startJob(job2.id)
      await service.completeJob(job2.id, {
        url: 'https://storage.abodeai.com/renders/r2.png',
        renderTime: 120
      })

      const stats = await service.getUserStatistics('user-123')
      expect(stats.totalJobs).toBe(2)
      expect(stats.completedJobs).toBe(2)
      expect(stats.totalRenderTime).toBe(150)
    })
  })
})
