/**
 * Render Status API Tests
 *
 * Comprehensive tests for render job status retrieval
 * Tests cover status tracking, progress updates, and metrics
 */

import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-key'
const supabase = createClient(supabaseUrl, supabaseKey)

describe('Render Status API', () => {
  let testUserId: string
  let testOrgId: string
  let testProjectId: string
  let authToken: string
  let testJobIds: Record<string, string> = {}

  beforeAll(async () => {
    // Create test user
    const { data: { user }, error } = await supabase.auth.admin.createUser({
      email: 'status-test@example.com',
      password: 'test-password-123',
      email_confirm: true
    })

    if (error || !user) {
      throw new Error('Failed to create test user')
    }

    testUserId = user.id

    // Sign in to get auth token
    const { data: { session } } = await supabase.auth.signInWithPassword({
      email: 'status-test@example.com',
      password: 'test-password-123'
    })

    if (!session) {
      throw new Error('Failed to sign in')
    }

    authToken = session.access_token

    // Create test organization
    const { data: org } = await supabase
      .from('organizations')
      .insert({
        name: 'Test Status Org',
        credits: 1000
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
        name: 'Test Status Project',
        user_id: testUserId
      })
      .select()
      .single()

    testProjectId = project!.id

    // Create test jobs in different states
    const jobs = [
      {
        name: 'queued',
        status: 'queued',
        progress: 0
      },
      {
        name: 'processing',
        status: 'processing',
        progress: 45,
        started_at: new Date().toISOString()
      },
      {
        name: 'completed',
        status: 'completed',
        progress: 100,
        started_at: new Date(Date.now() - 600000).toISOString(),
        completed_at: new Date().toISOString(),
        output_url: 'https://example.com/render.png'
      },
      {
        name: 'failed',
        status: 'failed',
        progress: 30,
        started_at: new Date(Date.now() - 300000).toISOString(),
        completed_at: new Date().toISOString(),
        error_message: 'Render engine crashed'
      }
    ]

    for (const jobConfig of jobs) {
      const { data: job } = await supabase
        .from('render_jobs')
        .insert({
          project_id: testProjectId,
          org_id: testOrgId,
          user_id: testUserId,
          type: 'still',
          quality: '1080p',
          priority: 'normal',
          status: jobConfig.status,
          scene_data: {},
          credits_cost: 10,
          estimated_time_seconds: 120,
          progress: jobConfig.progress,
          started_at: jobConfig.started_at,
          completed_at: jobConfig.completed_at,
          output_url: jobConfig.output_url,
          error_message: jobConfig.error_message
        })
        .select()
        .single()

      testJobIds[jobConfig.name] = job!.id
    }
  })

  afterAll(async () => {
    // Cleanup
    await supabase.from('render_jobs').delete().eq('project_id', testProjectId)
    await supabase.from('projects').delete().eq('id', testProjectId)
    await supabase.from('organization_members').delete().eq('organization_id', testOrgId)
    await supabase.from('organizations').delete().eq('id', testOrgId)
    await supabase.auth.admin.deleteUser(testUserId)
  })

  describe('GET /api/render/status/[jobId]', () => {
    it('should get status of queued job', async () => {
      const jobId = testJobIds.queued

      const response = await fetch(`http://localhost:3000/api/render/status/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.jobId).toBe(jobId)
      expect(data.status).toBe('queued')
      expect(data.progress).toBe(0)
      expect(data.position).toBeDefined()
      expect(data.estimatedTimeRemaining).toBeGreaterThan(0)
    })

    it('should get status of processing job', async () => {
      const jobId = testJobIds.processing

      const response = await fetch(`http://localhost:3000/api/render/status/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.jobId).toBe(jobId)
      expect(data.status).toBe('processing')
      expect(data.progress).toBe(45)
      expect(data.startedAt).toBeDefined()
      expect(data.estimatedTimeRemaining).toBeGreaterThan(0)
      expect(data.estimatedCompletionTime).toBeDefined()
    })

    it('should get status of completed job', async () => {
      const jobId = testJobIds.completed

      const response = await fetch(`http://localhost:3000/api/render/status/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.jobId).toBe(jobId)
      expect(data.status).toBe('completed')
      expect(data.progress).toBe(100)
      expect(data.startedAt).toBeDefined()
      expect(data.completedAt).toBeDefined()
      expect(data.outputUrl).toBeDefined()
      expect(data.estimatedTimeRemaining).toBe(0)
    })

    it('should get status of failed job', async () => {
      const jobId = testJobIds.failed

      const response = await fetch(`http://localhost:3000/api/render/status/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.jobId).toBe(jobId)
      expect(data.status).toBe('failed')
      expect(data.error).toBeDefined()
      expect(data.error).toContain('crashed')
      expect(data.estimatedTimeRemaining).toBe(0)
    })

    it('should require authentication', async () => {
      const jobId = testJobIds.queued

      const response = await fetch(`http://localhost:3000/api/render/status/${jobId}`)

      expect(response.status).toBe(401)

      const data = await response.json()
      expect(data.error).toBe('Unauthorized')
    })

    it('should validate job ID format', async () => {
      const response = await fetch('http://localhost:3000/api/render/status/invalid-id', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('Invalid job ID format')
    })

    it('should return 404 for non-existent job', async () => {
      const response = await fetch('http://localhost:3000/api/render/status/00000000-0000-0000-0000-000000000000', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      expect(response.status).toBe(404)

      const data = await response.json()
      expect(data.error).toBe('Render job not found')
    })

    it('should verify user has access to job', async () => {
      // Create another user and org
      const { data: { user } } = await supabase.auth.admin.createUser({
        email: 'other-status-user@example.com',
        password: 'test-password-123',
        email_confirm: true
      })

      const { data: { session } } = await supabase.auth.signInWithPassword({
        email: 'other-status-user@example.com',
        password: 'test-password-123'
      })

      const otherAuthToken = session!.access_token

      const { data: otherOrg } = await supabase
        .from('organizations')
        .insert({ name: 'Other Org', credits: 1000 })
        .select()
        .single()

      await supabase
        .from('organization_members')
        .insert({
          organization_id: otherOrg!.id,
          user_id: user!.id,
          role: 'admin'
        })

      const response = await fetch(`http://localhost:3000/api/render/status/${testJobIds.queued}`, {
        headers: {
          'Authorization': `Bearer ${otherAuthToken}`
        }
      })

      expect(response.status).toBe(403)

      const data = await response.json()
      expect(data.error).toContain('Access denied')

      // Cleanup
      await supabase.from('organization_members').delete().eq('organization_id', otherOrg!.id)
      await supabase.from('organizations').delete().eq('id', otherOrg!.id)
      await supabase.auth.admin.deleteUser(user!.id)
    })

    it('should include render steps', async () => {
      const jobId = testJobIds.processing

      const response = await fetch(`http://localhost:3000/api/render/status/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.steps).toBeDefined()
      expect(Array.isArray(data.steps)).toBe(true)
      expect(data.steps.length).toBeGreaterThan(0)
      expect(data.steps[0]).toHaveProperty('name')
      expect(data.steps[0]).toHaveProperty('status')
      expect(data.steps[0]).toHaveProperty('progress')
    })

    it('should include current step', async () => {
      const jobId = testJobIds.processing

      const response = await fetch(`http://localhost:3000/api/render/status/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.currentStep).toBeDefined()

      const currentStep = data.steps.find((s: any) => s.status === 'processing')
      expect(currentStep).toBeDefined()
    })

    it('should include project information', async () => {
      const jobId = testJobIds.queued

      const response = await fetch(`http://localhost:3000/api/render/status/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.project).toBeDefined()
      expect(data.project.id).toBe(testProjectId)
      expect(data.project.name).toBe('Test Status Project')
    })

    it('should include render settings', async () => {
      const jobId = testJobIds.queued

      const response = await fetch(`http://localhost:3000/api/render/status/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.renderSettings).toBeDefined()
      expect(data.renderSettings.type).toBe('still')
      expect(data.renderSettings.quality).toBe('1080p')
      expect(data.renderSettings.priority).toBe('normal')
    })

    it('should include credits information', async () => {
      const jobId = testJobIds.queued

      const response = await fetch(`http://localhost:3000/api/render/status/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.credits).toBeDefined()
      expect(data.credits.cost).toBe(10)
    })

    it('should include render logs if available', async () => {
      // Update job with logs
      await supabase
        .from('render_jobs')
        .update({
          render_logs: [
            { timestamp: new Date().toISOString(), level: 'info', message: 'Starting render' },
            { timestamp: new Date().toISOString(), level: 'warning', message: 'High memory usage' }
          ]
        })
        .eq('id', testJobIds.processing)

      const response = await fetch(`http://localhost:3000/api/render/status/${testJobIds.processing}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.logs).toBeDefined()
      expect(Array.isArray(data.logs)).toBe(true)
      expect(data.logs.length).toBe(2)
      expect(data.logs[0]).toHaveProperty('timestamp')
      expect(data.logs[0]).toHaveProperty('level')
      expect(data.logs[0]).toHaveProperty('message')
    })

    it('should include render metrics if available', async () => {
      // Update job with metrics
      await supabase
        .from('render_jobs')
        .update({
          render_metrics: {
            cpuUsage: 85,
            memoryUsage: 4096,
            gpuUsage: 95,
            renderTime: 180,
            samplesCompleted: 64,
            totalSamples: 128
          }
        })
        .eq('id', testJobIds.processing)

      const response = await fetch(`http://localhost:3000/api/render/status/${testJobIds.processing}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.metrics).toBeDefined()
      expect(data.metrics.cpuUsage).toBe(85)
      expect(data.metrics.gpuUsage).toBe(95)
      expect(data.metrics.samplesCompleted).toBe(64)
      expect(data.metrics.totalSamples).toBe(128)
    })

    it('should calculate queue position for queued jobs', async () => {
      const jobId = testJobIds.queued

      const response = await fetch(`http://localhost:3000/api/render/status/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.position).toBeDefined()
      expect(data.position).toBeGreaterThan(0)
    })

    it('should include thumbnail URL if available', async () => {
      // Update completed job with thumbnail
      await supabase
        .from('render_jobs')
        .update({
          thumbnail_url: 'https://example.com/thumbnail.jpg'
        })
        .eq('id', testJobIds.completed)

      const response = await fetch(`http://localhost:3000/api/render/status/${testJobIds.completed}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.thumbnailUrl).toBe('https://example.com/thumbnail.jpg')
    })

    it('should include metadata if available', async () => {
      // Update job with metadata
      await supabase
        .from('render_jobs')
        .update({
          metadata: {
            custom: 'data',
            tags: ['test', 'demo'],
            notify_on_complete: true
          }
        })
        .eq('id', testJobIds.queued)

      const response = await fetch(`http://localhost:3000/api/render/status/${testJobIds.queued}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.metadata).toBeDefined()
      expect(data.metadata.custom).toBe('data')
      expect(data.metadata.tags).toEqual(['test', 'demo'])
    })

    it('should calculate accurate time remaining for processing jobs', async () => {
      const jobId = testJobIds.processing

      const response = await fetch(`http://localhost:3000/api/render/status/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      expect(response.status).toBe(200)

      const data = await response.json()

      // For a 45% complete job, should have less than total estimated time remaining
      expect(data.estimatedTimeRemaining).toBeGreaterThan(0)
      expect(data.estimatedTimeRemaining).toBeLessThan(120)
    })
  })
})
