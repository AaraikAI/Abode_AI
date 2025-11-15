/**
 * Integration Tests for AI Lighting Optimization API
 *
 * Tests AI-powered lighting optimization and design generation
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-key'
const supabase = createClient(supabaseUrl, supabaseKey)

describe('AI Lighting Optimization API', () => {
  let testUserId: string
  let testProjectId: string
  let authToken: string

  const testOptimizationParams = {
    sceneId: 'test-scene-opt-001',
    roomDimensions: {
      width: 30,
      length: 20,
      height: 12,
      area: 600
    },
    targetMetrics: {
      illuminance: 500,
      uniformity: 0.7,
      powerDensity: 1.0,
      colorTemperature: 4000,
      cri: 90
    },
    constraints: {
      maxBudget: 10000,
      maxFixtures: 20
    },
    optimization: {
      mode: 'balanced' as const,
      priorities: {
        energyEfficiency: 0.4,
        lightQuality: 0.3,
        cost: 0.2,
        aesthetics: 0.1
      }
    }
  }

  beforeAll(async () => {
    // Create test user
    const { data: { user }, error } = await supabase.auth.admin.createUser({
      email: 'lighting-optimize-test@example.com',
      password: 'test-password-123',
      email_confirm: true
    })

    if (error || !user) {
      throw new Error('Failed to create test user')
    }

    testUserId = user.id

    // Sign in to get auth token
    const { data: { session } } = await supabase.auth.signInWithPassword({
      email: 'lighting-optimize-test@example.com',
      password: 'test-password-123'
    })

    if (!session) {
      throw new Error('Failed to sign in')
    }

    authToken = session.access_token

    // Create test project
    const { data: project } = await supabase
      .from('projects')
      .insert({
        name: 'Test Lighting Optimization Project',
        user_id: testUserId
      })
      .select()
      .single()

    testProjectId = project!.id
  })

  afterAll(async () => {
    // Cleanup
    await supabase.from('lighting_optimizations').delete().eq('project_id', testProjectId)
    await supabase.from('projects').delete().eq('id', testProjectId)
    await supabase.auth.admin.deleteUser(testUserId)
  })

  describe('POST /api/ai-lighting/optimize', () => {
    it('should optimize lighting successfully', async () => {
      const response = await fetch('http://localhost:3000/api/ai-lighting/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          ...testOptimizationParams
        })
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.optimizationId).toBeDefined()
      expect(data.data.design).toBeDefined()

      const design = data.data.design
      expect(design.fixtures).toBeDefined()
      expect(design.controls).toBeDefined()
      expect(design.performance).toBeDefined()
      expect(design.improvements).toBeDefined()
      expect(design.implementation).toBeDefined()
      expect(design.aiRecommendations).toBeDefined()
    })

    it('should generate fixture layout', async () => {
      const response = await fetch('http://localhost:3000/api/ai-lighting/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          ...testOptimizationParams
        })
      })

      const data = await response.json()
      const fixtures = data.data.design.fixtures

      expect(Array.isArray(fixtures)).toBe(true)
      expect(fixtures.length).toBeGreaterThan(0)

      const fixture = fixtures[0]
      expect(fixture.id).toBeDefined()
      expect(fixture.type).toBeDefined()
      expect(fixture.position).toBeDefined()
      expect(fixture.position.x).toBeGreaterThanOrEqual(0)
      expect(fixture.position.y).toBeGreaterThanOrEqual(0)
      expect(fixture.position.z).toBeGreaterThanOrEqual(0)
      expect(fixture.power).toBeGreaterThan(0)
      expect(fixture.lumens).toBeGreaterThan(0)
      expect(fixture.action).toBeDefined()
      expect(['add', 'remove', 'replace', 'relocate', 'keep']).toContain(fixture.action)
    })

    it('should design control zones', async () => {
      const response = await fetch('http://localhost:3000/api/ai-lighting/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          ...testOptimizationParams
        })
      })

      const data = await response.json()
      const controls = data.data.design.controls

      expect(controls.zones).toBeDefined()
      expect(Array.isArray(controls.zones)).toBe(true)
      expect(controls.zones.length).toBeGreaterThan(0)

      const zone = controls.zones[0]
      expect(zone.id).toBeDefined()
      expect(zone.name).toBeDefined()
      expect(Array.isArray(zone.fixtures)).toBe(true)
      expect(Array.isArray(zone.controls)).toBe(true)
    })

    it('should include sensors in design', async () => {
      const response = await fetch('http://localhost:3000/api/ai-lighting/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          ...testOptimizationParams
        })
      })

      const data = await response.json()
      const sensors = data.data.design.controls.sensors

      expect(Array.isArray(sensors)).toBe(true)
      expect(sensors.length).toBeGreaterThan(0)

      const sensor = sensors[0]
      expect(sensor.type).toBeDefined()
      expect(sensor.position).toBeDefined()
      expect(sensor.coverage).toBeGreaterThan(0)
    })

    it('should include scheduling configuration', async () => {
      const response = await fetch('http://localhost:3000/api/ai-lighting/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          ...testOptimizationParams
        })
      })

      const data = await response.json()
      const scheduling = data.data.design.controls.scheduling

      expect(scheduling.enabled).toBeDefined()
      expect(Array.isArray(scheduling.schedules)).toBe(true)

      if (scheduling.schedules.length > 0) {
        const schedule = scheduling.schedules[0]
        expect(schedule.days).toBeDefined()
        expect(schedule.onTime).toBeDefined()
        expect(schedule.offTime).toBeDefined()
        expect(schedule.dimmingLevel).toBeDefined()
      }
    })

    it('should calculate performance metrics', async () => {
      const response = await fetch('http://localhost:3000/api/ai-lighting/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          ...testOptimizationParams
        })
      })

      const data = await response.json()
      const performance = data.data.design.performance

      expect(performance.illuminance.average).toBeGreaterThan(0)
      expect(performance.illuminance.uniformity).toBeGreaterThan(0)
      expect(performance.quality.score).toBeGreaterThan(0)
      expect(performance.quality.cri).toBeGreaterThan(0)
      expect(performance.efficiency.totalPower).toBeGreaterThan(0)
      expect(performance.efficiency.powerDensity).toBeGreaterThan(0)
      expect(performance.efficiency.annualEnergy).toBeGreaterThan(0)
    })

    it('should calculate improvements and savings', async () => {
      const response = await fetch('http://localhost:3000/api/ai-lighting/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          ...testOptimizationParams
        })
      })

      const data = await response.json()
      const improvements = data.data.design.improvements

      expect(improvements.illuminanceImprovement).toBeDefined()
      expect(improvements.uniformityImprovement).toBeDefined()
      expect(improvements.energySavings).toBeGreaterThanOrEqual(0)
      expect(improvements.costSavings).toBeGreaterThanOrEqual(0)
      expect(improvements.qualityImprovement).toBeDefined()
    })

    it('should provide implementation details', async () => {
      const response = await fetch('http://localhost:3000/api/ai-lighting/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          ...testOptimizationParams
        })
      })

      const data = await response.json()
      const implementation = data.data.design.implementation

      expect(implementation.totalCost).toBeGreaterThan(0)
      expect(implementation.laborCost).toBeGreaterThan(0)
      expect(implementation.materialCost).toBeGreaterThan(0)
      expect(implementation.paybackPeriod).toBeGreaterThan(0)
      expect(implementation.roi).toBeDefined()
      expect(implementation.timeline).toBeDefined()
      expect(implementation.timeline.planning).toBeGreaterThan(0)
      expect(implementation.timeline.installation).toBeGreaterThan(0)
    })

    it('should provide AI recommendations', async () => {
      const response = await fetch('http://localhost:3000/api/ai-lighting/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          ...testOptimizationParams
        })
      })

      const data = await response.json()
      const aiRecs = data.data.design.aiRecommendations

      expect(aiRecs.summary).toBeDefined()
      expect(typeof aiRecs.summary).toBe('string')
      expect(Array.isArray(aiRecs.keyChanges)).toBe(true)
      expect(aiRecs.keyChanges.length).toBeGreaterThan(0)
      expect(Array.isArray(aiRecs.warnings)).toBe(true)
      expect(Array.isArray(aiRecs.alternatives)).toBe(true)
    })

    it('should optimize for energy mode', async () => {
      const response = await fetch('http://localhost:3000/api/ai-lighting/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          ...testOptimizationParams,
          optimization: {
            mode: 'energy',
            priorities: { energyEfficiency: 0.8, lightQuality: 0.1, cost: 0.05, aesthetics: 0.05 }
          }
        })
      })

      expect(response.status).toBe(200)
      const data = await response.json()

      // Energy mode should prioritize high efficacy
      const efficacy = data.data.design.performance.efficiency.efficacy
      expect(efficacy).toBeGreaterThan(100) // Should be high-efficiency LEDs
    })

    it('should optimize for quality mode', async () => {
      const response = await fetch('http://localhost:3000/api/ai-lighting/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          ...testOptimizationParams,
          optimization: {
            mode: 'quality',
            priorities: { energyEfficiency: 0.1, lightQuality: 0.8, cost: 0.05, aesthetics: 0.05 }
          }
        })
      })

      expect(response.status).toBe(200)
      const data = await response.json()

      // Quality mode should prioritize high CRI
      const cri = data.data.design.performance.quality.cri
      expect(cri).toBeGreaterThanOrEqual(90) // Should have high CRI fixtures
    })

    it('should optimize for cost mode', async () => {
      const response = await fetch('http://localhost:3000/api/ai-lighting/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          ...testOptimizationParams,
          optimization: {
            mode: 'cost',
            priorities: { energyEfficiency: 0.2, lightQuality: 0.2, cost: 0.5, aesthetics: 0.1 }
          }
        })
      })

      expect(response.status).toBe(200)
      const data = await response.json()

      // Cost mode should have lower total cost
      const totalCost = data.data.design.implementation.totalCost
      expect(totalCost).toBeDefined()
      expect(totalCost).toBeGreaterThan(0)
    })

    it('should validate optimization mode', async () => {
      const response = await fetch('http://localhost:3000/api/ai-lighting/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          ...testOptimizationParams,
          optimization: {
            mode: 'invalid-mode',
            priorities: testOptimizationParams.optimization.priorities
          }
        })
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('mode')
    })

    it('should validate room dimensions', async () => {
      const response = await fetch('http://localhost:3000/api/ai-lighting/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          ...testOptimizationParams,
          roomDimensions: {
            width: -10,
            length: 20,
            height: 12
          }
        })
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('dimensions')
    })

    it('should require authentication', async () => {
      const response = await fetch('http://localhost:3000/api/ai-lighting/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projectId: testProjectId,
          ...testOptimizationParams
        })
      })

      expect(response.status).toBe(401)
    })
  })

  describe('GET /api/ai-lighting/optimize', () => {
    let testOptimizationId: string

    beforeAll(async () => {
      // Create a test optimization record
      const { data: optimization } = await supabase
        .from('lighting_optimizations')
        .insert({
          project_id: testProjectId,
          scene_id: 'test-scene-get',
          user_id: testUserId,
          room_dimensions: testOptimizationParams.roomDimensions,
          target_metrics: testOptimizationParams.targetMetrics,
          optimization_mode: 'balanced',
          design: {
            fixtures: [],
            controls: { zones: [], sensors: [], scheduling: { enabled: false, schedules: [] } },
            performance: {
              illuminance: { average: 500, min: 425, max: 575, uniformity: 0.85 },
              quality: { score: 85, cri: 90, glare: 18 },
              efficiency: { totalPower: 400, powerDensity: 0.67, efficacy: 125, annualEnergy: 1460, annualCost: 175 }
            },
            improvements: { illuminanceImprovement: 20, uniformityImprovement: 30, energySavings: 500, costSavings: 60, qualityImprovement: 25 },
            implementation: {
              totalCost: 5000,
              laborCost: 1500,
              materialCost: 3500,
              paybackPeriod: 3.5,
              roi: 120,
              timeline: { planning: 5, procurement: 14, installation: 3, commissioning: 2 }
            },
            aiRecommendations: { summary: 'Test summary', keyChanges: [], warnings: [], alternatives: [] }
          }
        })
        .select()
        .single()

      testOptimizationId = optimization!.id
    })

    it('should retrieve optimization by ID', async () => {
      const response = await fetch(
        `http://localhost:3000/api/ai-lighting/optimize?optimizationId=${testOptimizationId}`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.id).toBe(testOptimizationId)
      expect(data.data.design).toBeDefined()
    })

    it('should return 404 for non-existent optimization', async () => {
      const response = await fetch(
        `http://localhost:3000/api/ai-lighting/optimize?optimizationId=00000000-0000-0000-0000-000000000000`,
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
