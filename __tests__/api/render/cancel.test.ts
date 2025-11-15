/**
 * Render Cancel API Tests
 *
 * Comprehensive tests for render job cancellation
 * Tests cover cancellation, credit refunds, and cleanup
 */

import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-key'
const supabase = createClient(supabaseUrl, supabaseKey)

describe('Render Cancel API', () => {
  let testUserId: string
  let testOrgId: string
  let testProjectId: string
  let authToken: string

  beforeAll(async () => {
    // Create test user
    const { data: { user }, error } = await supabase.auth.admin.createUser({
      email: 'cancel-test@example.com',
      password: 'test-password-123',
      email_confirm: true
    })

    if (error || !user) {
      throw new Error('Failed to create test user')
    }

    testUserId = user.id

    // Sign in to get auth token
    const { data: { session } } = await supabase.auth.signInWithPassword({
      email: 'cancel-test@example.com',
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
        name: 'Test Cancel Org',
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
        name: 'Test Cancel Project',
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

  describe('POST /api/render/cancel/[jobId]', () => {
    it('should cancel a queued render job', async () => {
      // Create a queued job
      const { data: job } = await supabase
        .from('render_jobs')
        .insert({
          project_id: testProjectId,
          org_id: testOrgId,
          user_id: testUserId,
          type: 'still',
          quality: '1080p',
          priority: 'normal',
          status: 'queued',
          scene_data: {},
          credits_cost: 50,
          estimated_time_seconds: 120,
          progress: 0
        })
        .select()
        .single()

      const response = await fetch(`http://localhost:3000/api/render/cancel/${job!.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.jobId).toBe(job!.id)
      expect(data.status).toBe('cancelled')
      expect(data.creditsRefunded).toBe(50) // Full refund for queued job

      // Verify job status was updated
      const { data: updatedJob } = await supabase
        .from('render_jobs')
        .select('status, completed_at')
        .eq('id', job!.id)
        .single()

      expect(updatedJob!.status).toBe('cancelled')
      expect(updatedJob!.completed_at).toBeDefined()
    })

    it('should cancel a processing render job', async () => {
      // Create a processing job
      const { data: job } = await supabase
        .from('render_jobs')
        .insert({
          project_id: testProjectId,
          org_id: testOrgId,
          user_id: testUserId,
          type: 'walkthrough',
          quality: '4k',
          priority: 'high',
          status: 'processing',
          scene_data: {},
          credits_cost: 100,
          estimated_time_seconds: 600,
          progress: 40,
          started_at: new Date().toISOString()
        })
        .select()
        .single()

      const response = await fetch(`http://localhost:3000/api/render/cancel/${job!.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.status).toBe('cancelled')
      expect(data.creditsRefunded).toBeGreaterThan(0)
      expect(data.creditsRefunded).toBeLessThan(100) // Partial refund based on progress
    })

    it('should refund full credits for queued jobs', async () => {
      const { data: orgBefore } = await supabase
        .from('organizations')
        .select('credits')
        .eq('id', testOrgId)
        .single()

      const creditsBefore = orgBefore!.credits

      const { data: job } = await supabase
        .from('render_jobs')
        .insert({
          project_id: testProjectId,
          org_id: testOrgId,
          user_id: testUserId,
          type: 'still',
          quality: '1080p',
          priority: 'normal',
          status: 'queued',
          scene_data: {},
          credits_cost: 30,
          estimated_time_seconds: 120,
          progress: 0
        })
        .select()
        .single()

      const response = await fetch(`http://localhost:3000/api/render/cancel/${job!.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      const data = await response.json()
      expect(data.creditsRefunded).toBe(30)

      const { data: orgAfter } = await supabase
        .from('organizations')
        .select('credits')
        .eq('id', testOrgId)
        .single()

      expect(orgAfter!.credits).toBe(creditsBefore + 30)
    })

    it('should record credit refund transaction', async () => {
      const { data: job } = await supabase
        .from('render_jobs')
        .insert({
          project_id: testProjectId,
          org_id: testOrgId,
          user_id: testUserId,
          type: 'still',
          quality: '1080p',
          priority: 'normal',
          status: 'queued',
          scene_data: {},
          credits_cost: 25,
          estimated_time_seconds: 120,
          progress: 0
        })
        .select()
        .single()

      await fetch(`http://localhost:3000/api/render/cancel/${job!.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      const { data: transaction } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('org_id', testOrgId)
        .contains('metadata', { render_job_id: job!.id })
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      expect(transaction).toBeDefined()
      expect(transaction!.credits).toBe(25)
      expect(transaction!.description).toContain('Refund')
    })

    it('should require authentication', async () => {
      const { data: job } = await supabase
        .from('render_jobs')
        .insert({
          project_id: testProjectId,
          org_id: testOrgId,
          user_id: testUserId,
          type: 'still',
          quality: '1080p',
          priority: 'normal',
          status: 'queued',
          scene_data: {},
          credits_cost: 10,
          estimated_time_seconds: 120,
          progress: 0
        })
        .select()
        .single()

      const response = await fetch(`http://localhost:3000/api/render/cancel/${job!.id}`, {
        method: 'POST'
      })

      expect(response.status).toBe(401)

      const data = await response.json()
      expect(data.error).toBe('Unauthorized')
    })

    it('should validate job ID format', async () => {
      const response = await fetch('http://localhost:3000/api/render/cancel/invalid-id', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('Invalid job ID format')
    })

    it('should return 404 for non-existent job', async () => {
      const response = await fetch('http://localhost:3000/api/render/cancel/00000000-0000-0000-0000-000000000000', {
        method: 'POST',
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
        email: 'other-cancel-user@example.com',
        password: 'test-password-123',
        email_confirm: true
      })

      const { data: { session } } = await supabase.auth.signInWithPassword({
        email: 'other-cancel-user@example.com',
        password: 'test-password-123'
      })

      const otherAuthToken = session!.access_token

      const { data: otherOrg } = await supabase
        .from('organizations')
        .insert({ name: 'Other Cancel Org', credits: 1000 })
        .select()
        .single()

      await supabase
        .from('organization_members')
        .insert({
          organization_id: otherOrg!.id,
          user_id: user!.id,
          role: 'admin'
        })

      const { data: job } = await supabase
        .from('render_jobs')
        .insert({
          project_id: testProjectId,
          org_id: testOrgId,
          user_id: testUserId,
          type: 'still',
          quality: '1080p',
          priority: 'normal',
          status: 'queued',
          scene_data: {},
          credits_cost: 10,
          estimated_time_seconds: 120,
          progress: 0
        })
        .select()
        .single()

      const response = await fetch(`http://localhost:3000/api/render/cancel/${job!.id}`, {
        method: 'POST',
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

    it('should not cancel completed job', async () => {
      const { data: job } = await supabase
        .from('render_jobs')
        .insert({
          project_id: testProjectId,
          org_id: testOrgId,
          user_id: testUserId,
          type: 'still',
          quality: '1080p',
          priority: 'normal',
          status: 'completed',
          scene_data: {},
          credits_cost: 10,
          estimated_time_seconds: 120,
          progress: 100,
          started_at: new Date(Date.now() - 600000).toISOString(),
          completed_at: new Date().toISOString(),
          output_url: 'https://example.com/render.png'
        })
        .select()
        .single()

      const response = await fetch(`http://localhost:3000/api/render/cancel/${job!.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('Cannot cancel')
      expect(data.message).toContain('completed')
    })

    it('should not cancel already cancelled job', async () => {
      const { data: job } = await supabase
        .from('render_jobs')
        .insert({
          project_id: testProjectId,
          org_id: testOrgId,
          user_id: testUserId,
          type: 'still',
          quality: '1080p',
          priority: 'normal',
          status: 'cancelled',
          scene_data: {},
          credits_cost: 10,
          estimated_time_seconds: 120,
          progress: 0,
          completed_at: new Date().toISOString()
        })
        .select()
        .single()

      const response = await fetch(`http://localhost:3000/api/render/cancel/${job!.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('Cannot cancel')
    })

    it('should accept cancellation reason in request body', async () => {
      const { data: job } = await supabase
        .from('render_jobs')
        .insert({
          project_id: testProjectId,
          org_id: testOrgId,
          user_id: testUserId,
          type: 'still',
          quality: '1080p',
          priority: 'normal',
          status: 'queued',
          scene_data: {},
          credits_cost: 10,
          estimated_time_seconds: 120,
          progress: 0
        })
        .select()
        .single()

      const response = await fetch(`http://localhost:3000/api/render/cancel/${job!.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          reason: 'Test cancellation reason'
        })
      })

      expect(response.status).toBe(200)

      const { data: updatedJob } = await supabase
        .from('render_jobs')
        .select('error_message')
        .eq('id', job!.id)
        .single()

      expect(updatedJob!.error_message).toBe('Test cancellation reason')
    })

    it('should store cancellation metadata', async () => {
      const { data: job } = await supabase
        .from('render_jobs')
        .insert({
          project_id: testProjectId,
          org_id: testOrgId,
          user_id: testUserId,
          type: 'still',
          quality: '1080p',
          priority: 'normal',
          status: 'processing',
          scene_data: {},
          credits_cost: 50,
          estimated_time_seconds: 120,
          progress: 25,
          started_at: new Date().toISOString()
        })
        .select()
        .single()

      await fetch(`http://localhost:3000/api/render/cancel/${job!.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      const { data: updatedJob } = await supabase
        .from('render_jobs')
        .select('metadata')
        .eq('id', job!.id)
        .single()

      expect(updatedJob!.metadata.cancelled_at).toBeDefined()
      expect(updatedJob!.metadata.cancelled_by).toBe(testUserId)
      expect(updatedJob!.metadata.credits_refunded).toBeGreaterThan(0)
    })

    it('should cancel scheduled job with full refund', async () => {
      const scheduledFor = new Date(Date.now() + 3600000).toISOString()

      const { data: job } = await supabase
        .from('render_jobs')
        .insert({
          project_id: testProjectId,
          org_id: testOrgId,
          user_id: testUserId,
          type: 'still',
          quality: '1080p',
          priority: 'normal',
          status: 'scheduled',
          scene_data: {},
          credits_cost: 40,
          estimated_time_seconds: 120,
          progress: 0,
          scheduled_for: scheduledFor
        })
        .select()
        .single()

      const response = await fetch(`http://localhost:3000/api/render/cancel/${job!.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.creditsRefunded).toBe(40) // Full refund for scheduled job
    })

    it('should calculate partial refund based on progress', async () => {
      // Test different progress levels
      const progressLevels = [
        { progress: 10, expectedRefundMin: 0.85 }, // 90% remaining
        { progress: 50, expectedRefundMin: 0.45 }, // 50% remaining
        { progress: 90, expectedRefundMin: 0.05 }  // 10% remaining
      ]

      for (const test of progressLevels) {
        const { data: job } = await supabase
          .from('render_jobs')
          .insert({
            project_id: testProjectId,
            org_id: testOrgId,
            user_id: testUserId,
            type: 'still',
            quality: '1080p',
            priority: 'normal',
            status: 'processing',
            scene_data: {},
            credits_cost: 100,
            estimated_time_seconds: 120,
            progress: test.progress,
            started_at: new Date().toISOString()
          })
          .select()
          .single()

        const response = await fetch(`http://localhost:3000/api/render/cancel/${job!.id}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        })

        const data = await response.json()
        const refundPercentage = data.creditsRefunded / 100

        expect(refundPercentage).toBeGreaterThanOrEqual(test.expectedRefundMin)
      }
    })

    it('should include success message with refund information', async () => {
      const { data: job } = await supabase
        .from('render_jobs')
        .insert({
          project_id: testProjectId,
          org_id: testOrgId,
          user_id: testUserId,
          type: 'still',
          quality: '1080p',
          priority: 'normal',
          status: 'queued',
          scene_data: {},
          credits_cost: 20,
          estimated_time_seconds: 120,
          progress: 0
        })
        .select()
        .single()

      const response = await fetch(`http://localhost:3000/api/render/cancel/${job!.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      const data = await response.json()
      expect(data.message).toBeDefined()
      expect(data.message).toContain('cancelled successfully')
      expect(data.message).toContain('20 credits refunded')
    })
  })
})
