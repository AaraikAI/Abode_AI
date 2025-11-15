/**
 * Integration Tests for Edge Deploy API
 *
 * Tests edge deployment creation and monitoring
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-key'
const supabase = createClient(supabaseUrl, supabaseKey)

describe('Edge Deploy API', () => {
  let testUserId: string
  let testOrgId: string
  let testProjectId: string
  let authToken: string

  beforeAll(async () => {
    // Create test user
    const { data: { user }, error } = await supabase.auth.admin.createUser({
      email: 'edge-deploy-test@example.com',
      password: 'test-password-123',
      email_confirm: true
    })

    if (error || !user) {
      throw new Error('Failed to create test user')
    }

    testUserId = user.id

    // Sign in to get auth token
    const { data: { session } } = await supabase.auth.signInWithPassword({
      email: 'edge-deploy-test@example.com',
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
        name: 'Test Edge Deploy Org'
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
        name: 'Test Edge Project',
        user_id: testUserId
      })
      .select()
      .single()

    testProjectId = project!.id
  })

  afterAll(async () => {
    // Cleanup
    await supabase.from('edge_deployment_regions').delete().match({ deployment_id: testProjectId })
    await supabase.from('edge_deployments').delete().eq('project_id', testProjectId)
    await supabase.from('projects').delete().eq('id', testProjectId)
    await supabase.from('organization_members').delete().eq('organization_id', testOrgId)
    await supabase.from('organizations').delete().eq('id', testOrgId)
    await supabase.auth.admin.deleteUser(testUserId)
  })

  describe('POST /api/edge/deploy', () => {
    it('should create a production deployment to multiple regions', async () => {
      const response = await fetch(`http://localhost:3000/api/edge/deploy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          regions: ['us-east-1', 'eu-west-1', 'ap-southeast-1'],
          environment: 'production',
          config: {
            minInstances: 2,
            maxInstances: 10,
            autoscale: true,
            healthCheckPath: '/health'
          }
        })
      })

      expect(response.status).toBe(202)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.deploymentId).toBeDefined()
      expect(data.status).toBe('deploying')
      expect(data.regions).toHaveLength(3)
      expect(data.estimatedTime).toBeGreaterThan(0)
    })

    it('should create a staging deployment', async () => {
      const response = await fetch(`http://localhost:3000/api/edge/deploy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          regions: ['us-west-1'],
          environment: 'staging'
        })
      })

      expect(response.status).toBe(202)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.regions).toHaveLength(1)
      expect(data.regions[0].region).toBe('us-west-1')
    })

    it('should reject deployment with invalid regions', async () => {
      const response = await fetch(`http://localhost:3000/api/edge/deploy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          regions: ['invalid-region', 'us-east-1'],
          environment: 'production'
        })
      })

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('Invalid regions')
    })

    it('should validate required fields', async () => {
      const response = await fetch(`http://localhost:3000/api/edge/deploy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId
          // Missing regions
        })
      })

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('required')
    })

    it('should deploy with CDN configuration', async () => {
      const response = await fetch(`http://localhost:3000/api/edge/deploy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          regions: ['us-east-1'],
          environment: 'production',
          config: {
            cdn: {
              enabled: true,
              cacheTTL: 3600,
              cacheControl: 'public, max-age=3600'
            },
            customDomain: 'app.example.com'
          }
        })
      })

      expect(response.status).toBe(202)

      const data = await response.json()
      expect(data.success).toBe(true)

      // Verify deployment record
      const { data: deployment } = await supabase
        .from('edge_deployments')
        .select('*')
        .eq('id', data.deploymentId)
        .single()

      expect(deployment).toBeDefined()
      expect(deployment!.config.cdn.enabled).toBe(true)
      expect(deployment!.config.customDomain).toBe('app.example.com')
    })

    it('should reject deployment to non-existent project', async () => {
      const response = await fetch(`http://localhost:3000/api/edge/deploy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: '00000000-0000-0000-0000-000000000000',
          regions: ['us-east-1'],
          environment: 'production'
        })
      })

      expect(response.status).toBe(404)

      const data = await response.json()
      expect(data.error).toContain('not found')
    })

    it('should require authentication', async () => {
      const response = await fetch(`http://localhost:3000/api/edge/deploy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projectId: testProjectId,
          regions: ['us-east-1'],
          environment: 'production'
        })
      })

      expect(response.status).toBe(401)
    })

    it('should deploy with environment variables', async () => {
      const response = await fetch(`http://localhost:3000/api/edge/deploy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          regions: ['us-east-1'],
          environment: 'production',
          config: {
            environmentVariables: {
              API_KEY: 'test-key',
              DATABASE_URL: 'postgres://localhost'
            }
          }
        })
      })

      expect(response.status).toBe(202)

      const data = await response.json()
      expect(data.success).toBe(true)
    })
  })

  describe('GET /api/edge/deploy', () => {
    let testDeploymentId: string

    beforeAll(async () => {
      // Create a test deployment
      const { data: deployment } = await supabase
        .from('edge_deployments')
        .insert({
          project_id: testProjectId,
          org_id: testOrgId,
          user_id: testUserId,
          environment: 'production',
          regions: ['us-east-1', 'eu-west-1'],
          status: 'deployed',
          config: {},
          estimated_time_seconds: 120,
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString()
        })
        .select()
        .single()

      testDeploymentId = deployment!.id

      // Create region statuses
      await supabase
        .from('edge_deployment_regions')
        .insert([
          {
            deployment_id: testDeploymentId,
            region: 'us-east-1',
            status: 'active',
            endpoint: 'https://test-us-east-1.edge.abodeai.com'
          },
          {
            deployment_id: testDeploymentId,
            region: 'eu-west-1',
            status: 'active',
            endpoint: 'https://test-eu-west-1.edge.abodeai.com'
          }
        ])
    })

    it('should retrieve deployment status', async () => {
      const response = await fetch(
        `http://localhost:3000/api/edge/deploy?deploymentId=${testDeploymentId}`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.deploymentId).toBe(testDeploymentId)
      expect(data.status).toBe('deployed')
      expect(data.environment).toBe('production')
      expect(data.regions).toHaveLength(2)
      expect(data.regions[0].status).toBe('active')
      expect(data.regions[0].endpoint).toBeDefined()
    })

    it('should return 404 for non-existent deployment', async () => {
      const response = await fetch(
        `http://localhost:3000/api/edge/deploy?deploymentId=00000000-0000-0000-0000-000000000000`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      expect(response.status).toBe(404)
    })
  })
})
