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

  describe('Edge Cases - Queue Overflow', () => {
    test('should reject jobs when queue is at max capacity', async () => {
      const maxSize = 100

      // Fill queue to capacity
      for (let i = 0; i < maxSize; i++) {
        await service.createJob({
          projectId: `p${i}`, sceneId: `s${i}`, userId: 'u1',
          outputFormat: 'png', resolution: { width: 1920, height: 1080 }
        })
      }

      await expect(
        service.createJob({
          projectId: 'overflow', sceneId: 'overflow', userId: 'u1',
          outputFormat: 'png', resolution: { width: 1920, height: 1080 }
        })
      ).rejects.toThrow('Queue is full')
    })

    test('should allow urgent jobs to bypass normal queue size limits', async () => {
      const maxSize = 100

      for (let i = 0; i < maxSize; i++) {
        await service.createJob({
          projectId: `p${i}`, sceneId: `s${i}`, userId: 'u1',
          outputFormat: 'png', resolution: { width: 1920, height: 1080 }
        })
      }

      const urgentJob = await service.createJob({
        projectId: 'urgent', sceneId: 'urgent', userId: 'u1',
        outputFormat: 'png', resolution: { width: 1920, height: 1080 },
        priority: 'urgent',
        bypassQueueLimit: true
      })

      expect(urgentJob).toBeDefined()
      expect(urgentJob.priority).toBe('urgent')
    })

    test('should evict low-priority jobs when queue is full and high-priority arrives', async () => {
      const maxSize = 100

      // Fill with low priority
      for (let i = 0; i < maxSize; i++) {
        await service.createJob({
          projectId: `p${i}`, sceneId: `s${i}`, userId: 'u1',
          outputFormat: 'png', resolution: { width: 1920, height: 1080 },
          priority: 'low'
        })
      }

      const highJob = await service.createJob({
        projectId: 'high', sceneId: 'high', userId: 'u1',
        outputFormat: 'png', resolution: { width: 1920, height: 1080 },
        priority: 'high',
        allowEviction: true
      })

      expect(highJob).toBeDefined()
      const queue = await service.getQueue()
      expect(queue).toHaveLength(maxSize)
      expect(queue[0].priority).toBe('high')
    })

    test('should maintain queue integrity during concurrent additions', async () => {
      const promises = []

      for (let i = 0; i < 50; i++) {
        promises.push(
          service.createJob({
            projectId: `p${i}`, sceneId: `s${i}`, userId: 'u1',
            outputFormat: 'png', resolution: { width: 1920, height: 1080 }
          })
        )
      }

      const jobs = await Promise.all(promises)
      expect(jobs).toHaveLength(50)
      expect(new Set(jobs.map(j => j.id)).size).toBe(50) // All unique IDs
    })

    test('should handle queue size calculation correctly with mixed priorities', async () => {
      await service.createJob({
        projectId: 'p1', sceneId: 's1', userId: 'u1',
        outputFormat: 'png', resolution: { width: 1920, height: 1080 },
        priority: 'urgent'
      })

      await service.createJob({
        projectId: 'p2', sceneId: 's2', userId: 'u1',
        outputFormat: 'png', resolution: { width: 1920, height: 1080 },
        priority: 'high'
      })

      await service.createJob({
        projectId: 'p3', sceneId: 's3', userId: 'u1',
        outputFormat: 'png', resolution: { width: 1920, height: 1080 },
        priority: 'normal'
      })

      const size = await service.getQueueSize()
      expect(size).toBe(3)
    })
  })

  describe('Edge Cases - Priority Conflicts', () => {
    test('should handle multiple urgent jobs in correct FIFO order', async () => {
      const job1 = await service.createJob({
        projectId: 'p1', sceneId: 's1', userId: 'u1',
        outputFormat: 'png', resolution: { width: 1920, height: 1080 },
        priority: 'urgent'
      })

      const job2 = await service.createJob({
        projectId: 'p2', sceneId: 's2', userId: 'u1',
        outputFormat: 'png', resolution: { width: 1920, height: 1080 },
        priority: 'urgent'
      })

      const queue = await service.getQueue()
      expect(queue[0].id).toBe(job1.id)
      expect(queue[1].id).toBe(job2.id)
    })

    test('should allow priority promotion for existing jobs', async () => {
      const job = await service.createJob({
        projectId: 'p1', sceneId: 's1', userId: 'u1',
        outputFormat: 'png', resolution: { width: 1920, height: 1080 },
        priority: 'normal'
      })

      await service.promotePriority(job.id, 'urgent')

      const updated = await service.getJob(job.id)
      expect(updated.priority).toBe('urgent')
    })

    test('should reorder queue after priority promotion', async () => {
      const job1 = await service.createJob({
        projectId: 'p1', sceneId: 's1', userId: 'u1',
        outputFormat: 'png', resolution: { width: 1920, height: 1080 },
        priority: 'low'
      })

      const job2 = await service.createJob({
        projectId: 'p2', sceneId: 's2', userId: 'u1',
        outputFormat: 'png', resolution: { width: 1920, height: 1080 },
        priority: 'normal'
      })

      await service.promotePriority(job1.id, 'urgent')

      const queue = await service.getQueue()
      expect(queue[0].id).toBe(job1.id)
      expect(queue[1].id).toBe(job2.id)
    })

    test('should not allow priority demotion of running jobs', async () => {
      const job = await service.createJob({
        projectId: 'p1', sceneId: 's1', userId: 'u1',
        outputFormat: 'png', resolution: { width: 1920, height: 1080 },
        priority: 'urgent'
      })

      await service.startJob(job.id)

      await expect(
        service.demotePriority(job.id, 'low')
      ).rejects.toThrow('Cannot demote priority of running job')
    })

    test('should handle priority ties using job creation time', async () => {
      const job1 = await service.createJob({
        projectId: 'p1', sceneId: 's1', userId: 'u1',
        outputFormat: 'png', resolution: { width: 1920, height: 1080 },
        priority: 'normal'
      })

      await new Promise(resolve => setTimeout(resolve, 10))

      const job2 = await service.createJob({
        projectId: 'p2', sceneId: 's2', userId: 'u1',
        outputFormat: 'png', resolution: { width: 1920, height: 1080 },
        priority: 'normal'
      })

      const queue = await service.getQueue()
      expect(queue[0].id).toBe(job1.id)
      expect(queue[1].id).toBe(job2.id)
    })
  })

  describe('Performance Benchmarking', () => {
    test('should handle 1000 job insertions within acceptable time', async () => {
      const start = Date.now()
      const promises = []

      for (let i = 0; i < 1000; i++) {
        promises.push(
          service.createJob({
            projectId: `p${i}`, sceneId: `s${i}`, userId: 'u1',
            outputFormat: 'png', resolution: { width: 1920, height: 1080 }
          })
        )
      }

      await Promise.all(promises)
      const duration = Date.now() - start

      expect(duration).toBeLessThan(5000) // Should complete in under 5 seconds
    })

    test('should retrieve queue status in under 100ms', async () => {
      // Add some jobs
      for (let i = 0; i < 100; i++) {
        await service.createJob({
          projectId: `p${i}`, sceneId: `s${i}`, userId: 'u1',
          outputFormat: 'png', resolution: { width: 1920, height: 1080 }
        })
      }

      const start = Date.now()
      await service.getQueue()
      const duration = Date.now() - start

      expect(duration).toBeLessThan(100)
    })

    test('should handle rapid progress updates efficiently', async () => {
      const job = await service.createJob({
        projectId: 'p1', sceneId: 's1', userId: 'u1',
        outputFormat: 'png', resolution: { width: 1920, height: 1080 }
      })

      await service.startJob(job.id)

      const start = Date.now()
      for (let i = 0; i <= 100; i++) {
        await service.updateProgress(job.id, i)
      }
      const duration = Date.now() - start

      expect(duration).toBeLessThan(1000) // 100 updates in under 1 second
    })

    test('should measure throughput of job processing', async () => {
      const jobCount = 50
      const jobs = []

      for (let i = 0; i < jobCount; i++) {
        jobs.push(await service.createJob({
          projectId: `p${i}`, sceneId: `s${i}`, userId: 'u1',
          outputFormat: 'png', resolution: { width: 1920, height: 1080 }
        }))
      }

      const start = Date.now()

      // Process all jobs concurrently
      await Promise.all(jobs.map(async (job) => {
        await service.startJob(job.id)
        await service.completeJob(job.id, {
          url: `https://storage.abodeai.com/renders/${job.id}.png`
        })
      }))

      const duration = Date.now() - start
      const throughput = jobCount / (duration / 1000) // jobs per second

      expect(throughput).toBeGreaterThan(10) // At least 10 jobs per second
    })

    test('should maintain performance with large queue sizes', async () => {
      // Create large queue
      for (let i = 0; i < 500; i++) {
        await service.createJob({
          projectId: `p${i}`, sceneId: `s${i}`, userId: 'u1',
          outputFormat: 'png', resolution: { width: 1920, height: 1080 }
        })
      }

      const start = Date.now()
      const job = await service.createJob({
        projectId: 'pNew', sceneId: 'sNew', userId: 'u1',
        outputFormat: 'png', resolution: { width: 1920, height: 1080 },
        priority: 'urgent'
      })
      const duration = Date.now() - start

      expect(duration).toBeLessThan(200) // Should add job quickly even with large queue
      expect(job).toBeDefined()
    })
  })

  describe('Concurrent Job Handling', () => {
    test('should handle multiple jobs starting simultaneously', async () => {
      const jobs = []
      for (let i = 0; i < 5; i++) {
        jobs.push(await service.createJob({
          projectId: `p${i}`, sceneId: `s${i}`, userId: 'u1',
          outputFormat: 'png', resolution: { width: 1920, height: 1080 }
        }))
      }

      await Promise.all(jobs.map(job => service.startJob(job.id)))

      const runningJobs = await service.getRunningJobs()
      expect(runningJobs.length).toBeLessThanOrEqual(3) // Respects concurrency limit
    })

    test('should queue excess jobs when concurrency limit reached', async () => {
      const jobs = []
      for (let i = 0; i < 10; i++) {
        jobs.push(await service.createJob({
          projectId: `p${i}`, sceneId: `s${i}`, userId: 'u1',
          outputFormat: 'png', resolution: { width: 1920, height: 1080 }
        }))
      }

      // Try to start all
      await Promise.all(jobs.map(job => service.startJob(job.id)))

      const running = await service.getRunningJobs()
      const queued = await service.getQueuedJobs()

      expect(running.length).toBe(3) // Max concurrent
      expect(queued.length).toBeGreaterThan(0)
    })

    test('should automatically start next job when one completes', async () => {
      const jobs = []
      for (let i = 0; i < 5; i++) {
        jobs.push(await service.createJob({
          projectId: `p${i}`, sceneId: `s${i}`, userId: 'u1',
          outputFormat: 'png', resolution: { width: 1920, height: 1080 }
        }))
      }

      await service.processQueue()

      // Complete one job
      const running = await service.getRunningJobs()
      await service.completeJob(running[0].id, {
        url: 'https://storage.abodeai.com/renders/r1.png'
      })

      // Give time for next job to start
      await new Promise(resolve => setTimeout(resolve, 100))

      const newRunning = await service.getRunningJobs()
      expect(newRunning.length).toBe(3)
    })

    test('should handle race conditions in job status updates', async () => {
      const job = await service.createJob({
        projectId: 'p1', sceneId: 's1', userId: 'u1',
        outputFormat: 'png', resolution: { width: 1920, height: 1080 }
      })

      // Concurrent updates
      await Promise.all([
        service.updateProgress(job.id, 10),
        service.updateProgress(job.id, 20),
        service.updateProgress(job.id, 30)
      ])

      const updated = await service.getJob(job.id)
      expect(updated.progress).toBeGreaterThanOrEqual(10)
      expect(updated.progress).toBeLessThanOrEqual(30)
    })

    test('should prevent concurrent processing of same job', async () => {
      const job = await service.createJob({
        projectId: 'p1', sceneId: 's1', userId: 'u1',
        outputFormat: 'png', resolution: { width: 1920, height: 1080 }
      })

      await service.startJob(job.id)

      await expect(
        service.startJob(job.id)
      ).rejects.toThrow('Job is already running')
    })
  })

  describe('Resource Allocation', () => {
    test('should allocate more resources to 8K renders', async () => {
      const hdJob = await service.createJob({
        projectId: 'p1', sceneId: 's1', userId: 'u1',
        outputFormat: 'png', resolution: { width: 1920, height: 1080 }
      })

      const eightKJob = await service.createJob({
        projectId: 'p2', sceneId: 's2', userId: 'u1',
        outputFormat: 'png', resolution: { width: 7680, height: 4320 }
      })

      const hdAllocation = await service.getResourceAllocation(hdJob.id)
      const eightKAllocation = await service.getResourceAllocation(eightKJob.id)

      expect(eightKAllocation.cpuCores).toBeGreaterThan(hdAllocation.cpuCores)
      expect(eightKAllocation.memoryGB).toBeGreaterThan(hdAllocation.memoryGB)
    })

    test('should respect per-user resource limits', async () => {
      const userLimit = 10

      for (let i = 0; i < userLimit; i++) {
        await service.createJob({
          projectId: `p${i}`, sceneId: `s${i}`, userId: 'limited-user',
          outputFormat: 'png', resolution: { width: 1920, height: 1080 }
        })
      }

      await expect(
        service.createJob({
          projectId: 'overflow', sceneId: 'overflow', userId: 'limited-user',
          outputFormat: 'png', resolution: { width: 1920, height: 1080 }
        })
      ).rejects.toThrow('User has reached job limit')
    })

    test('should track resource usage across concurrent jobs', async () => {
      const jobs = []
      for (let i = 0; i < 3; i++) {
        jobs.push(await service.createJob({
          projectId: `p${i}`, sceneId: `s${i}`, userId: 'u1',
          outputFormat: 'png', resolution: { width: 3840, height: 2160 }
        }))
      }

      await Promise.all(jobs.map(job => service.startJob(job.id)))

      const usage = await service.getTotalResourceUsage()
      expect(usage.cpuCores).toBeGreaterThan(0)
      expect(usage.memoryGB).toBeGreaterThan(0)
    })

    test('should deallocate resources when job completes', async () => {
      const job = await service.createJob({
        projectId: 'p1', sceneId: 's1', userId: 'u1',
        outputFormat: 'png', resolution: { width: 3840, height: 2160 }
      })

      await service.startJob(job.id)
      const usageBefore = await service.getTotalResourceUsage()

      await service.completeJob(job.id, {
        url: 'https://storage.abodeai.com/renders/r1.png'
      })

      const usageAfter = await service.getTotalResourceUsage()
      expect(usageAfter.cpuCores).toBeLessThan(usageBefore.cpuCores)
    })

    test('should implement fair resource distribution', async () => {
      // Create jobs from different users
      const user1Job = await service.createJob({
        projectId: 'p1', sceneId: 's1', userId: 'user-1',
        outputFormat: 'png', resolution: { width: 1920, height: 1080 }
      })

      const user2Job = await service.createJob({
        projectId: 'p2', sceneId: 's2', userId: 'user-2',
        outputFormat: 'png', resolution: { width: 1920, height: 1080 }
      })

      await service.startJob(user1Job.id)
      await service.startJob(user2Job.id)

      const allocation1 = await service.getResourceAllocation(user1Job.id)
      const allocation2 = await service.getResourceAllocation(user2Job.id)

      // Should have similar allocations for same resolution
      expect(Math.abs(allocation1.cpuCores - allocation2.cpuCores)).toBeLessThanOrEqual(1)
    })
  })

  describe('Job Cancellation Edge Cases', () => {
    test('should handle cancellation of partially rendered job', async () => {
      const job = await service.createJob({
        projectId: 'p1', sceneId: 's1', userId: 'u1',
        outputFormat: 'png', resolution: { width: 1920, height: 1080 }
      })

      await service.startJob(job.id)
      await service.updateProgress(job.id, 50)
      await service.cancelJob(job.id)

      const cancelled = await service.getJob(job.id)
      expect(cancelled.status).toBe('cancelled')
      expect(cancelled.progress).toBe(50)
    })

    test('should clean up temporary files on cancellation', async () => {
      const job = await service.createJob({
        projectId: 'p1', sceneId: 's1', userId: 'u1',
        outputFormat: 'png', resolution: { width: 1920, height: 1080 }
      })

      await service.startJob(job.id)
      await service.cancelJob(job.id)

      const tempFiles = await service.getTempFiles(job.id)
      expect(tempFiles).toHaveLength(0)
    })

    test('should handle cancellation during batch render', async () => {
      const batchId = await service.createBatchRender({
        projectId: 'p1',
        sceneIds: ['s1', 's2', 's3'],
        userId: 'u1',
        outputFormat: 'png',
        resolution: { width: 1920, height: 1080 }
      })

      const batch = await service.getBatch(batchId)
      await service.startJob(batch.jobs[0].id)

      await service.cancelBatch(batchId)

      const cancelledBatch = await service.getBatch(batchId)
      expect(cancelledBatch.status).toBe('cancelled')
      cancelledBatch.jobs.forEach(job => {
        expect(job.status).toMatch(/cancelled|queued/)
      })
    })

    test('should not allow cancellation after job is completed', async () => {
      const job = await service.createJob({
        projectId: 'p1', sceneId: 's1', userId: 'u1',
        outputFormat: 'png', resolution: { width: 1920, height: 1080 }
      })

      await service.startJob(job.id)
      await service.completeJob(job.id, {
        url: 'https://storage.abodeai.com/renders/r1.png'
      })

      await expect(
        service.cancelJob(job.id)
      ).rejects.toThrow('Cannot cancel completed job')
    })

    test('should emit cancellation event', async () => {
      const job = await service.createJob({
        projectId: 'p1', sceneId: 's1', userId: 'u1',
        outputFormat: 'png', resolution: { width: 1920, height: 1080 }
      })

      const events: string[] = []
      service.onStatusChange(job.id, (status) => {
        events.push(status)
      })

      await service.startJob(job.id)
      await service.cancelJob(job.id)

      expect(events).toContain('cancelled')
    })
  })

  describe('State Recovery After Crashes', () => {
    test('should recover queued jobs after service restart', async () => {
      const job = await service.createJob({
        projectId: 'p1', sceneId: 's1', userId: 'u1',
        outputFormat: 'png', resolution: { width: 1920, height: 1080 }
      })

      // Simulate restart
      service.shutdown()
      const newService = new RenderQueue()

      const recovered = await newService.getJob(job.id)
      expect(recovered).toBeDefined()
      expect(recovered.status).toBe('queued')
    })

    test('should mark interrupted jobs as failed on recovery', async () => {
      const job = await service.createJob({
        projectId: 'p1', sceneId: 's1', userId: 'u1',
        outputFormat: 'png', resolution: { width: 1920, height: 1080 }
      })

      await service.startJob(job.id)
      await service.updateProgress(job.id, 50)

      // Simulate crash
      service.simulateCrash()

      // Recover
      const newService = new RenderQueue()
      await newService.recoverFromCrash()

      const recovered = await newService.getJob(job.id)
      expect(recovered.status).toBe('failed')
      expect(recovered.error).toContain('interrupted')
    })

    test('should restore job progress state after recovery', async () => {
      const job = await service.createJob({
        projectId: 'p1', sceneId: 's1', userId: 'u1',
        outputFormat: 'png', resolution: { width: 1920, height: 1080 }
      })

      await service.startJob(job.id)
      await service.updateProgress(job.id, 75)
      await service.persistState()

      // Simulate restart
      const newService = new RenderQueue()
      await newService.restoreState()

      const recovered = await newService.getJob(job.id)
      expect(recovered.progress).toBe(75)
    })

    test('should rebuild priority queue from persisted data', async () => {
      await service.createJob({
        projectId: 'p1', sceneId: 's1', userId: 'u1',
        outputFormat: 'png', resolution: { width: 1920, height: 1080 },
        priority: 'urgent'
      })

      await service.createJob({
        projectId: 'p2', sceneId: 's2', userId: 'u1',
        outputFormat: 'png', resolution: { width: 1920, height: 1080 },
        priority: 'normal'
      })

      await service.persistState()

      const newService = new RenderQueue()
      await newService.restoreState()

      const queue = await newService.getQueue()
      expect(queue[0].priority).toBe('urgent')
      expect(queue[1].priority).toBe('normal')
    })

    test('should handle corrupted state data gracefully', async () => {
      await service.createJob({
        projectId: 'p1', sceneId: 's1', userId: 'u1',
        outputFormat: 'png', resolution: { width: 1920, height: 1080 }
      })

      // Corrupt the state
      await service.corruptStateData()

      const newService = new RenderQueue()
      await newService.restoreState()

      // Should fall back to empty state
      const queue = await newService.getQueue()
      expect(queue).toHaveLength(0)
    })
  })

  describe('Distributed Queue Scenarios', () => {
    test('should handle job distribution across multiple workers', async () => {
      const job = await service.createJob({
        projectId: 'p1', sceneId: 's1', userId: 'u1',
        outputFormat: 'png', resolution: { width: 1920, height: 1080 }
      })

      const workers = await service.getAvailableWorkers()
      expect(workers.length).toBeGreaterThan(0)

      await service.assignJobToWorker(job.id, workers[0].id)

      const assignment = await service.getJobAssignment(job.id)
      expect(assignment.workerId).toBe(workers[0].id)
    })

    test('should rebalance jobs when worker becomes unavailable', async () => {
      const job1 = await service.createJob({
        projectId: 'p1', sceneId: 's1', userId: 'u1',
        outputFormat: 'png', resolution: { width: 1920, height: 1080 }
      })

      const job2 = await service.createJob({
        projectId: 'p2', sceneId: 's2', userId: 'u1',
        outputFormat: 'png', resolution: { width: 1920, height: 1080 }
      })

      const workers = await service.getAvailableWorkers()
      await service.assignJobToWorker(job1.id, workers[0].id)
      await service.assignJobToWorker(job2.id, workers[0].id)

      // Worker goes offline
      await service.markWorkerOffline(workers[0].id)

      // Jobs should be reassigned
      await service.rebalanceJobs()

      const assignment1 = await service.getJobAssignment(job1.id)
      const assignment2 = await service.getJobAssignment(job2.id)

      expect(assignment1.workerId).not.toBe(workers[0].id)
      expect(assignment2.workerId).not.toBe(workers[0].id)
    })

    test('should implement sticky assignment for related jobs', async () => {
      const batchId = await service.createBatchRender({
        projectId: 'p1',
        sceneIds: ['s1', 's2', 's3'],
        userId: 'u1',
        outputFormat: 'png',
        resolution: { width: 1920, height: 1080 }
      })

      const batch = await service.getBatch(batchId)
      await service.enableStickyAssignment(batchId)

      const assignments = await Promise.all(
        batch.jobs.map(job => service.getJobAssignment(job.id))
      )

      // All jobs should be on same worker
      const workerIds = new Set(assignments.map(a => a.workerId))
      expect(workerIds.size).toBe(1)
    })

    test('should handle network partitions between workers', async () => {
      const job = await service.createJob({
        projectId: 'p1', sceneId: 's1', userId: 'u1',
        outputFormat: 'png', resolution: { width: 1920, height: 1080 }
      })

      const workers = await service.getAvailableWorkers()
      await service.assignJobToWorker(job.id, workers[0].id)
      await service.startJob(job.id)

      // Simulate network partition
      await service.simulateNetworkPartition(workers[0].id)

      // Should detect partition and reassign
      await new Promise(resolve => setTimeout(resolve, 5000))

      const status = await service.getJob(job.id)
      expect(status.status).toMatch(/queued|failed/)
    })

    test('should implement consensus for job state updates', async () => {
      const job = await service.createJob({
        projectId: 'p1', sceneId: 's1', userId: 'u1',
        outputFormat: 'png', resolution: { width: 1920, height: 1080 }
      })

      await service.enableDistributedConsensus()

      // Multiple concurrent updates from different sources
      await Promise.all([
        service.updateProgress(job.id, 10, 'worker-1'),
        service.updateProgress(job.id, 20, 'worker-2'),
        service.updateProgress(job.id, 15, 'worker-3')
      ])

      const status = await service.getJob(job.id)
      // Should use consensus value (median or latest with quorum)
      expect(status.progress).toBeGreaterThanOrEqual(10)
      expect(status.progress).toBeLessThanOrEqual(20)
    })

    test('should handle distributed queue coordination', async () => {
      // Create jobs on multiple queue instances
      const queue1 = new RenderQueue({ instanceId: 'q1' })
      const queue2 = new RenderQueue({ instanceId: 'q2' })

      const job1 = await queue1.createJob({
        projectId: 'p1', sceneId: 's1', userId: 'u1',
        outputFormat: 'png', resolution: { width: 1920, height: 1080 }
      })

      const job2 = await queue2.createJob({
        projectId: 'p2', sceneId: 's2', userId: 'u1',
        outputFormat: 'png', resolution: { width: 1920, height: 1080 }
      })

      // Both should see combined queue
      const queue1View = await queue1.getQueue()
      const queue2View = await queue2.getQueue()

      expect(queue1View).toHaveLength(2)
      expect(queue2View).toHaveLength(2)
    })

    test('should implement leader election for queue management', async () => {
      const queues = []
      for (let i = 0; i < 3; i++) {
        queues.push(new RenderQueue({ instanceId: `q${i}` }))
      }

      await Promise.all(queues.map(q => q.participateInElection()))

      const leaders = queues.filter(q => q.isLeader())
      expect(leaders).toHaveLength(1)
    })

    test('should handle failover when leader crashes', async () => {
      const queue1 = new RenderQueue({ instanceId: 'q1' })
      const queue2 = new RenderQueue({ instanceId: 'q2' })

      await queue1.participateInElection()
      await queue2.participateInElection()

      const initialLeader = queue1.isLeader() ? queue1 : queue2

      // Simulate leader crash
      await initialLeader.simulateCrash()

      // Wait for new election
      await new Promise(resolve => setTimeout(resolve, 1000))

      const leaders = [queue1, queue2].filter(q => !q.isCrashed() && q.isLeader())
      expect(leaders).toHaveLength(1)
    })

    test('should synchronize job states across distributed instances', async () => {
      const queue1 = new RenderQueue({ instanceId: 'q1' })
      const queue2 = new RenderQueue({ instanceId: 'q2' })

      const job = await queue1.createJob({
        projectId: 'p1', sceneId: 's1', userId: 'u1',
        outputFormat: 'png', resolution: { width: 1920, height: 1080 }
      })

      await queue1.updateProgress(job.id, 50)

      // Wait for sync
      await new Promise(resolve => setTimeout(resolve, 200))

      const job2 = await queue2.getJob(job.id)
      expect(job2.progress).toBe(50)
    })

    test('should handle split-brain scenarios', async () => {
      const queue1 = new RenderQueue({ instanceId: 'q1' })
      const queue2 = new RenderQueue({ instanceId: 'q2' })

      // Both become leaders due to network partition
      await service.simulateSplitBrain([queue1, queue2])

      // They should detect and resolve the conflict
      await new Promise(resolve => setTimeout(resolve, 2000))

      const leaders = [queue1, queue2].filter(q => q.isLeader())
      expect(leaders).toHaveLength(1)
    })
  })
})
