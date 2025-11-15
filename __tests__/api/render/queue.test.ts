/**
 * Render Queue API Tests
 *
 * Comprehensive tests for render queue submission and listing
 * Tests cover authentication, validation, credits, and queue management
 */

import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-key'
const supabase = createClient(supabaseUrl, supabaseKey)

describe('Render Queue API', () => {
  let testUserId: string
  let testOrgId: string
  let testProjectId: string
  let authToken: string

  beforeAll(async () => {
    // Create test user
    const { data: { user }, error } = await supabase.auth.admin.createUser({
      email: 'queue-test@example.com',
      password: 'test-password-123',
      email_confirm: true
    })

    if (error || !user) {
      throw new Error('Failed to create test user')
    }

    testUserId = user.id

    // Sign in to get auth token
    const { data: { session } } = await supabase.auth.signInWithPassword({
      email: 'queue-test@example.com',
      password: 'test-password-123'
    })

    if (!session) {
      throw new Error('Failed to sign in')
    }

    authToken = session.access_token

    // Create test organization with credits
    const { data: org } = await supabase
      .from('organizations')
      .insert({
        name: 'Test Queue Org',
        credits: 5000
      })
      .select()
      .single()

    testOrgId = org!.id

    // Add user to organization
    await supabase
      .from('organization_members')
      .insert({
        organization_id: testOrgId,
        user_id: testUserId,
        role: 'admin'
      })

    // Create test project
    const { data: project } = await supabase
      .from('projects')
      .insert({
        org_id: testOrgId,
        name: 'Test Queue Project',
        user_id: testUserId
      })
      .select()
      .single()

    testProjectId = project!.id
  })

  afterAll(async () => {
    // Cleanup
    await supabase.from('render_jobs').delete().eq('project_id', testProjectId)
    await supabase.from('projects').delete().eq('id', testProjectId)
    await supabase.from('organization_members').delete().eq('organization_id', testOrgId)
    await supabase.from('organizations').delete().eq('id', testOrgId)
    await supabase.auth.admin.deleteUser(testUserId)
  })

  describe('POST /api/render/queue - Job Submission', () => {
    it('should submit a still render job to queue', async () => {
      const response = await fetch('http://localhost:3000/api/render/queue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          type: 'still',
          quality: '1080p',
          priority: 'normal'
        })
      })

      expect(response.status).toBe(202)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.jobId).toBeDefined()
      expect(data.position).toBeGreaterThan(0)
      expect(data.estimatedStartTime).toBeDefined()
      expect(data.estimatedCompletionTime).toBeDefined()
      expect(data.creditsCost).toBeGreaterThan(0)
    })

    it('should submit a walkthrough render job', async () => {
      const response = await fetch('http://localhost:3000/api/render/queue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          type: 'walkthrough',
          quality: '4k',
          priority: 'high',
          settings: {
            engine: 'UNREAL',
            frameRate: 60,
            samples: 256
          }
        })
      })

      expect(response.status).toBe(202)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.creditsCost).toBeGreaterThan(50)
    })

    it('should submit a panorama render job', async () => {
      const response = await fetch('http://localhost:3000/api/render/queue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          type: 'panorama',
          quality: '8k',
          priority: 'low'
        })
      })

      expect(response.status).toBe(202)

      const data = await response.json()
      expect(data.success).toBe(true)
    })

    it('should submit a 360 tour render job', async () => {
      const response = await fetch('http://localhost:3000/api/render/queue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          type: '360_tour',
          quality: '1080p',
          priority: 'normal'
        })
      })

      expect(response.status).toBe(202)

      const data = await response.json()
      expect(data.success).toBe(true)
    })

    it('should submit a VR render job', async () => {
      const response = await fetch('http://localhost:3000/api/render/queue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          type: 'vr',
          quality: '4k',
          priority: 'critical'
        })
      })

      expect(response.status).toBe(202)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.creditsCost).toBeGreaterThan(100)
    })

    it('should require authentication', async () => {
      const response = await fetch('http://localhost:3000/api/render/queue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projectId: testProjectId,
          type: 'still',
          quality: '1080p'
        })
      })

      expect(response.status).toBe(401)

      const data = await response.json()
      expect(data.error).toBe('Unauthorized')
    })

    it('should validate required fields', async () => {
      const response = await fetch('http://localhost:3000/api/render/queue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId
          // Missing type and quality
        })
      })

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('required')
    })

    it('should validate render type', async () => {
      const response = await fetch('http://localhost:3000/api/render/queue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          type: 'invalid_type',
          quality: '1080p'
        })
      })

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('Invalid type')
    })

    it('should validate quality level', async () => {
      const response = await fetch('http://localhost:3000/api/render/queue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          type: 'still',
          quality: 'ultra_hd'
        })
      })

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('Invalid quality')
    })

    it('should validate priority level', async () => {
      const response = await fetch('http://localhost:3000/api/render/queue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          type: 'still',
          quality: '1080p',
          priority: 'super_urgent'
        })
      })

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('Invalid priority')
    })

    it('should verify project exists', async () => {
      const response = await fetch('http://localhost:3000/api/render/queue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: '00000000-0000-0000-0000-000000000000',
          type: 'still',
          quality: '1080p'
        })
      })

      expect(response.status).toBe(404)

      const data = await response.json()
      expect(data.error).toBe('Project not found')
    })

    it('should verify project ownership', async () => {
      // Create another org and project
      const { data: otherOrg } = await supabase
        .from('organizations')
        .insert({ name: 'Other Org', credits: 1000 })
        .select()
        .single()

      const { data: otherProject } = await supabase
        .from('projects')
        .insert({
          org_id: otherOrg!.id,
          name: 'Other Project',
          user_id: 'other-user'
        })
        .select()
        .single()

      const response = await fetch('http://localhost:3000/api/render/queue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: otherProject!.id,
          type: 'still',
          quality: '1080p'
        })
      })

      expect(response.status).toBe(403)

      const data = await response.json()
      expect(data.error).toContain('does not belong')

      // Cleanup
      await supabase.from('projects').delete().eq('id', otherProject!.id)
      await supabase.from('organizations').delete().eq('id', otherOrg!.id)
    })

    it('should check for sufficient credits', async () => {
      // Temporarily set credits to 0
      await supabase
        .from('organizations')
        .update({ credits: 0 })
        .eq('id', testOrgId)

      const response = await fetch('http://localhost:3000/api/render/queue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          type: 'still',
          quality: '1080p'
        })
      })

      expect(response.status).toBe(402)

      const data = await response.json()
      expect(data.error).toContain('Insufficient credits')
      expect(data.creditsCost).toBeDefined()
      expect(data.creditsAvailable).toBe(0)

      // Restore credits
      await supabase
        .from('organizations')
        .update({ credits: 5000 })
        .eq('id', testOrgId)
    })

    it('should deduct credits on submission', async () => {
      const { data: orgBefore } = await supabase
        .from('organizations')
        .select('credits')
        .eq('id', testOrgId)
        .single()

      const creditsBefore = orgBefore!.credits

      const response = await fetch('http://localhost:3000/api/render/queue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          type: 'still',
          quality: '720p'
        })
      })

      const data = await response.json()
      const creditsCost = data.creditsCost

      const { data: orgAfter } = await supabase
        .from('organizations')
        .select('credits')
        .eq('id', testOrgId)
        .single()

      const creditsAfter = orgAfter!.credits

      expect(creditsAfter).toBe(creditsBefore - creditsCost)
    })

    it('should record credit transaction', async () => {
      const response = await fetch('http://localhost:3000/api/render/queue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          type: 'still',
          quality: '1080p'
        })
      })

      const data = await response.json()

      const { data: transaction } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('org_id', testOrgId)
        .contains('metadata', { render_job_id: data.jobId })
        .single()

      expect(transaction).toBeDefined()
      expect(transaction!.credits).toBeLessThan(0)
      expect(transaction!.description).toContain('Render job queued')
    })

    it('should handle custom render settings', async () => {
      const response = await fetch('http://localhost:3000/api/render/queue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          type: 'still',
          quality: '4k',
          settings: {
            engine: 'CYCLES',
            samples: 512,
            denoise: true,
            resolution: { width: 3840, height: 2160 },
            outputFormat: 'EXR',
            compression: 'high'
          }
        })
      })

      expect(response.status).toBe(202)

      const data = await response.json()
      expect(data.success).toBe(true)

      const { data: job } = await supabase
        .from('render_jobs')
        .select('render_settings')
        .eq('id', data.jobId)
        .single()

      expect(job!.render_settings.engine).toBe('CYCLES')
      expect(job!.render_settings.samples).toBe(512)
    })

    it('should handle scene data', async () => {
      const sceneData = {
        objects: [{ type: 'cube', position: [0, 0, 0] }],
        lights: [{ type: 'sun', intensity: 1.0 }],
        camera: { position: [5, 5, 5] }
      }

      const response = await fetch('http://localhost:3000/api/render/queue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          type: 'still',
          quality: '1080p',
          sceneData
        })
      })

      expect(response.status).toBe(202)

      const data = await response.json()

      const { data: job } = await supabase
        .from('render_jobs')
        .select('scene_data')
        .eq('id', data.jobId)
        .single()

      expect(job!.scene_data).toEqual(sceneData)
    })

    it('should handle metadata and webhooks', async () => {
      const response = await fetch('http://localhost:3000/api/render/queue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          type: 'still',
          quality: '1080p',
          metadata: { custom: 'data', tags: ['test', 'demo'] },
          notifyOnComplete: true,
          webhookUrl: 'https://example.com/webhook'
        })
      })

      expect(response.status).toBe(202)

      const data = await response.json()

      const { data: job } = await supabase
        .from('render_jobs')
        .select('metadata')
        .eq('id', data.jobId)
        .single()

      expect(job!.metadata.custom).toBe('data')
      expect(job!.metadata.notify_on_complete).toBe(true)
      expect(job!.metadata.webhook_url).toBe('https://example.com/webhook')
    })

    it('should support scheduled renders', async () => {
      const scheduledFor = new Date(Date.now() + 3600000).toISOString()

      const response = await fetch('http://localhost:3000/api/render/queue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          type: 'still',
          quality: '1080p',
          scheduledFor
        })
      })

      expect(response.status).toBe(202)

      const data = await response.json()

      const { data: job } = await supabase
        .from('render_jobs')
        .select('status, scheduled_for')
        .eq('id', data.jobId)
        .single()

      expect(job!.status).toBe('scheduled')
      expect(job!.scheduled_for).toBe(scheduledFor)
    })

    it('should calculate credits with priority multiplier', async () => {
      const responses = await Promise.all([
        fetch('http://localhost:3000/api/render/queue', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            projectId: testProjectId,
            type: 'still',
            quality: '1080p',
            priority: 'low'
          })
        }),
        fetch('http://localhost:3000/api/render/queue', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            projectId: testProjectId,
            type: 'still',
            quality: '1080p',
            priority: 'critical'
          })
        })
      ])

      const [lowPriority, criticalPriority] = await Promise.all(
        responses.map(r => r.json())
      )

      expect(criticalPriority.creditsCost).toBeGreaterThan(lowPriority.creditsCost)
    })

    it('should calculate credits with engine multiplier', async () => {
      const responses = await Promise.all([
        fetch('http://localhost:3000/api/render/queue', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            projectId: testProjectId,
            type: 'still',
            quality: '1080p',
            settings: { engine: 'EEVEE' }
          })
        }),
        fetch('http://localhost:3000/api/render/queue', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            projectId: testProjectId,
            type: 'still',
            quality: '1080p',
            settings: { engine: 'UNREAL' }
          })
        })
      ])

      const [eevee, unreal] = await Promise.all(responses.map(r => r.json()))

      expect(unreal.creditsCost).toBeGreaterThan(eevee.creditsCost)
    })
  })

  describe('GET /api/render/queue - Queue Listing', () => {
    let testJobIds: string[] = []

    beforeAll(async () => {
      // Create multiple test jobs
      const jobTypes = ['still', 'walkthrough', 'panorama']
      const priorities = ['low', 'normal', 'high']
      const statuses = ['queued', 'processing', 'scheduled']

      for (let i = 0; i < 9; i++) {
        const { data: job } = await supabase
          .from('render_jobs')
          .insert({
            project_id: testProjectId,
            org_id: testOrgId,
            user_id: testUserId,
            type: jobTypes[i % 3],
            quality: '1080p',
            status: statuses[i % 3],
            priority: priorities[i % 3],
            scene_data: {},
            credits_cost: 10,
            estimated_time_seconds: 120,
            progress: 0
          })
          .select()
          .single()

        testJobIds.push(job!.id)
      }
    })

    afterAll(async () => {
      await supabase
        .from('render_jobs')
        .delete()
        .in('id', testJobIds)
    })

    it('should list queued render jobs', async () => {
      const response = await fetch('http://localhost:3000/api/render/queue', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.jobs).toBeDefined()
      expect(Array.isArray(data.jobs)).toBe(true)
      expect(data.jobs.length).toBeGreaterThan(0)
    })

    it('should filter by status', async () => {
      const response = await fetch('http://localhost:3000/api/render/queue?status=queued', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.jobs.every((job: any) => job.status === 'queued')).toBe(true)
    })

    it('should filter by priority', async () => {
      const response = await fetch('http://localhost:3000/api/render/queue?priority=high', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.jobs.every((job: any) => job.priority === 'high')).toBe(true)
    })

    it('should filter by type', async () => {
      const response = await fetch('http://localhost:3000/api/render/queue?type=walkthrough', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.jobs.every((job: any) => job.type === 'walkthrough')).toBe(true)
    })

    it('should filter by project ID', async () => {
      const response = await fetch(`http://localhost:3000/api/render/queue?projectId=${testProjectId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.jobs.every((job: any) => job.project_id === testProjectId)).toBe(true)
    })

    it('should support pagination', async () => {
      const response = await fetch('http://localhost:3000/api/render/queue?limit=5&offset=0', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.jobs.length).toBeLessThanOrEqual(5)
      expect(data.pagination).toBeDefined()
      expect(data.pagination.limit).toBe(5)
      expect(data.pagination.offset).toBe(0)
      expect(data.pagination.total).toBeGreaterThan(0)
    })

    it('should include queue statistics', async () => {
      const response = await fetch('http://localhost:3000/api/render/queue', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.stats).toBeDefined()
      expect(data.stats.totalJobs).toBeGreaterThan(0)
      expect(data.stats.queued).toBeDefined()
      expect(data.stats.processing).toBeDefined()
      expect(data.stats.scheduled).toBeDefined()
      expect(data.stats.avgWaitTime).toBeDefined()
    })

    it('should calculate queue positions', async () => {
      const response = await fetch('http://localhost:3000/api/render/queue?status=queued', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      const queuedJobs = data.jobs.filter((job: any) => job.status === 'queued')

      queuedJobs.forEach((job: any) => {
        expect(job.position).toBeDefined()
        expect(job.position).toBeGreaterThan(0)
      })
    })

    it('should require authentication for listing', async () => {
      const response = await fetch('http://localhost:3000/api/render/queue')

      expect(response.status).toBe(401)

      const data = await response.json()
      expect(data.error).toBe('Unauthorized')
    })

    it('should only show organization jobs', async () => {
      const response = await fetch('http://localhost:3000/api/render/queue', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.jobs.every((job: any) => job.org_id === testOrgId)).toBe(true)
    })

    it('should support multiple status filters', async () => {
      const response = await fetch('http://localhost:3000/api/render/queue?status=queued,processing', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.jobs.every((job: any) =>
        job.status === 'queued' || job.status === 'processing'
      )).toBe(true)
    })

    it('should order by priority and creation time', async () => {
      const response = await fetch('http://localhost:3000/api/render/queue?status=queued', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      expect(response.status).toBe(200)

      const data = await response.json()

      const priorities = data.jobs.map((job: any) => job.priority)
      const priorityOrder = ['critical', 'high', 'normal', 'low']

      // Check that jobs are ordered by priority
      for (let i = 0; i < priorities.length - 1; i++) {
        const currentPriority = priorityOrder.indexOf(priorities[i])
        const nextPriority = priorityOrder.indexOf(priorities[i + 1])
        expect(currentPriority).toBeLessThanOrEqual(nextPriority)
      }
    })

    it('should handle empty queue', async () => {
      // Delete all jobs temporarily
      await supabase
        .from('render_jobs')
        .delete()
        .eq('org_id', testOrgId)

      const response = await fetch('http://localhost:3000/api/render/queue', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.jobs).toEqual([])
      expect(data.stats.totalJobs).toBe(0)
    })
  })
})
