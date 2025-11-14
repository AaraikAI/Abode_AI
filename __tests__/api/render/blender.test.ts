/**
 * Integration Tests for Blender Render API
 *
 * Tests render job creation, execution, and status tracking
 */

import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-key'
const supabase = createClient(supabaseUrl, supabaseKey)

describe('Blender Render API', () => {
  let testUserId: string
  let testOrgId: string
  let testProjectId: string
  let authToken: string

  beforeAll(async () => {
    // Create test user
    const { data: { user }, error } = await supabase.auth.admin.createUser({
      email: 'render-test@example.com',
      password: 'test-password-123',
      email_confirm: true
    })

    if (error || !user) {
      throw new Error('Failed to create test user')
    }

    testUserId = user.id

    // Sign in to get auth token
    const { data: { session } } = await supabase.auth.signInWithPassword({
      email: 'render-test@example.com',
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
        name: 'Test Render Org',
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
        name: 'Test Render Project',
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

  describe('POST /api/render/blender', () => {
    it('should create a still render job', async () => {
      const response = await fetch(`http://localhost:3000/api/render/blender`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          sceneData: {
            objects: [
              {
                type: 'cube',
                position: [0, 0, 0],
                rotation: [0, 0, 0],
                scale: [1, 1, 1],
                material: 'wood_oak'
              }
            ],
            lights: [
              {
                type: 'sun',
                position: [10, 10, 10],
                energy: 1.0,
                color: [1, 1, 1]
              }
            ],
            camera: {
              position: [5, 5, 5],
              rotation: [-45, 0, 45],
              lens: 50
            }
          },
          renderType: 'still',
          quality: '1080p',
          engine: 'CYCLES',
          samples: 128,
          denoise: true
        })
      })

      expect(response.status).toBe(202)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.jobId).toBeDefined()
      expect(data.estimatedTime).toBeGreaterThan(0)
      expect(data.credits).toBeGreaterThan(0)

      // Verify job was created in database
      const { data: job } = await supabase
        .from('render_jobs')
        .select('*')
        .eq('id', data.jobId)
        .single()

      expect(job).toBeDefined()
      expect(job!.type).toBe('still')
      expect(job!.quality).toBe('1080p')
      expect(job!.status).toBe('queued')
    })

    it('should create a walkthrough render job', async () => {
      const response = await fetch(`http://localhost:3000/api/render/blender`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          sceneData: {
            objects: [
              {
                type: 'cube',
                position: [0, 0, 0],
                rotation: [0, 0, 0],
                scale: [1, 1, 1]
              }
            ],
            lights: [],
            camera: {
              position: [5, 5, 5],
              rotation: [-45, 0, 45],
              lens: 50
            }
          },
          renderType: 'walkthrough',
          quality: '1080p',
          engine: 'EEVEE',
          samples: 64,
          fps: 30,
          duration: 10,
          cameraPath: [
            { position: [5, 5, 5], rotation: [-45, 0, 45], timestamp: 0 },
            { position: [5, 5, 10], rotation: [-45, 0, 90], timestamp: 5 },
            { position: [10, 5, 10], rotation: [-45, 0, 135], timestamp: 10 }
          ]
        })
      })

      expect(response.status).toBe(202)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.credits).toBeGreaterThan(0)
    })

    it('should reject render with insufficient credits', async () => {
      // Deduct all credits
      await supabase
        .from('organizations')
        .update({ credits: 0 })
        .eq('id', testOrgId)

      const response = await fetch(`http://localhost:3000/api/render/blender`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          sceneData: {
            objects: [],
            lights: [],
            camera: { position: [0, 0, 0], rotation: [0, 0, 0], lens: 50 }
          },
          renderType: 'still',
          quality: '8k',
          engine: 'CYCLES'
        })
      })

      expect(response.status).toBe(402)

      const data = await response.json()
      expect(data.error).toContain('Insufficient credits')

      // Restore credits
      await supabase
        .from('organizations')
        .update({ credits: 1000 })
        .eq('id', testOrgId)
    })

    it('should validate required fields', async () => {
      const response = await fetch(`http://localhost:3000/api/render/blender`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId
          // Missing sceneData
        })
      })

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('required')
    })

    it('should apply post-processing effects', async () => {
      const response = await fetch(`http://localhost:3000/api/render/blender`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          sceneData: {
            objects: [],
            lights: [],
            camera: { position: [0, 0, 0], rotation: [0, 0, 0], lens: 50 }
          },
          renderType: 'still',
          quality: '1080p',
          engine: 'CYCLES',
          postFx: {
            tonemapping: {
              enabled: true,
              operator: 'FILMIC',
              whitePoint: 1.0
            },
            colorGrading: {
              enabled: true,
              temperature: 10,
              saturation: 1.2,
              contrast: 1.1
            },
            bloom: {
              enabled: true,
              threshold: 0.8,
              intensity: 0.3
            }
          }
        })
      })

      expect(response.status).toBe(202)

      const data = await response.json()
      expect(data.success).toBe(true)

      // Verify post-fx settings were stored
      const { data: job } = await supabase
        .from('render_jobs')
        .select('render_settings')
        .eq('id', data.jobId)
        .single()

      expect(job!.render_settings.postFx).toBeDefined()
      expect(job!.render_settings.postFx.tonemapping.enabled).toBe(true)
      expect(job!.render_settings.postFx.bloom.enabled).toBe(true)
    })
  })

  describe('GET /api/render/blender', () => {
    let testJobId: string

    beforeAll(async () => {
      // Create a test render job
      const { data: job } = await supabase
        .from('render_jobs')
        .insert({
          project_id: testProjectId,
          org_id: testOrgId,
          user_id: testUserId,
          type: 'still',
          quality: '1080p',
          status: 'completed',
          scene_data: { objects: [], lights: [], camera: {} },
          camera_settings: {},
          credits_cost: 10,
          estimated_time_seconds: 120,
          progress: 100,
          output_url: 'https://example.com/render.png'
        })
        .select()
        .single()

      testJobId = job!.id
    })

    it('should retrieve render job status', async () => {
      const response = await fetch(`http://localhost:3000/api/render/blender?jobId=${testJobId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.jobId).toBe(testJobId)
      expect(data.status).toBe('completed')
      expect(data.progress).toBe(100)
      expect(data.outputUrl).toBeDefined()
    })

    it('should return 404 for non-existent job', async () => {
      const response = await fetch(`http://localhost:3000/api/render/blender?jobId=00000000-0000-0000-0000-000000000000`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      expect(response.status).toBe(404)
    })

    it('should require jobId parameter', async () => {
      const response = await fetch(`http://localhost:3000/api/render/blender`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('jobId')
    })
  })

  describe('Credit calculations', () => {
    it('should calculate correct credits for still renders', async () => {
      const testCases = [
        { quality: '1080p', engine: 'CYCLES', expected: 15 }, // 10 * 1.5
        { quality: '4k', engine: 'CYCLES', expected: 38 },    // 25 * 1.5
        { quality: '8k', engine: 'EEVEE', expected: 50 },     // 50 * 1.0
      ]

      for (const testCase of testCases) {
        const response = await fetch(`http://localhost:3000/api/render/blender`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            projectId: testProjectId,
            sceneData: { objects: [], lights: [], camera: { position: [0, 0, 0], rotation: [0, 0, 0], lens: 50 } },
            renderType: 'still',
            quality: testCase.quality,
            engine: testCase.engine
          })
        })

        const data = await response.json()
        expect(data.credits).toBe(testCase.expected)
      }
    })
  })
})
