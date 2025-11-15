/**
 * Integration Tests for AI Lighting Analysis API
 *
 * Tests AI-powered lighting analysis and recommendations
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-key'
const supabase = createClient(supabaseUrl, supabaseKey)

describe('AI Lighting Analysis API', () => {
  let testUserId: string
  let testProjectId: string
  let authToken: string

  const testAnalysisParams = {
    sceneId: 'test-scene-001',
    roomDimensions: {
      width: 20,
      length: 15,
      height: 10,
      area: 300
    },
    currentLighting: {
      fixtures: [
        {
          type: 'LED Panel',
          position: { x: 5, y: 8, z: 2.5 },
          power: 40,
          colorTemperature: 4000,
          lumens: 4000
        },
        {
          type: 'LED Panel',
          position: { x: 15, y: 8, z: 2.5 },
          power: 40,
          colorTemperature: 4000,
          lumens: 4000
        },
        {
          type: 'LED Downlight',
          position: { x: 10, y: 5, z: 2.5 },
          power: 20,
          colorTemperature: 3000,
          lumens: 1800
        }
      ]
    },
    surfaces: {
      walls: { reflectance: 0.5, color: '#FFFFFF' },
      ceiling: { reflectance: 0.8, color: '#FFFFFF' },
      floor: { reflectance: 0.2, color: '#8B7355' }
    },
    naturalLight: {
      windows: [
        {
          area: 20,
          orientation: 'south',
          transmittance: 0.7
        }
      ]
    },
    usage: {
      type: 'commercial',
      activities: ['office work', 'meetings'],
      occupancyHours: { start: 8, end: 18 }
    }
  }

  beforeAll(async () => {
    // Create test user
    const { data: { user }, error } = await supabase.auth.admin.createUser({
      email: 'lighting-analysis-test@example.com',
      password: 'test-password-123',
      email_confirm: true
    })

    if (error || !user) {
      throw new Error('Failed to create test user')
    }

    testUserId = user.id

    // Sign in to get auth token
    const { data: { session } } = await supabase.auth.signInWithPassword({
      email: 'lighting-analysis-test@example.com',
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
        name: 'Test Lighting Project',
        user_id: testUserId
      })
      .select()
      .single()

    testProjectId = project!.id
  })

  afterAll(async () => {
    // Cleanup
    await supabase.from('lighting_analyses').delete().eq('project_id', testProjectId)
    await supabase.from('projects').delete().eq('id', testProjectId)
    await supabase.auth.admin.deleteUser(testUserId)
  })

  describe('POST /api/ai-lighting/analyze', () => {
    it('should analyze lighting successfully', async () => {
      const response = await fetch('http://localhost:3000/api/ai-lighting/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          ...testAnalysisParams
        })
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.analysisId).toBeDefined()
      expect(data.data.results).toBeDefined()

      const results = data.data.results
      expect(results.illuminance).toBeDefined()
      expect(results.quality).toBeDefined()
      expect(results.efficiency).toBeDefined()
      expect(results.compliance).toBeDefined()
      expect(results.recommendations).toBeDefined()
      expect(results.aiInsights).toBeDefined()
    })

    it('should calculate illuminance metrics correctly', async () => {
      const response = await fetch('http://localhost:3000/api/ai-lighting/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          ...testAnalysisParams
        })
      })

      const data = await response.json()
      const illuminance = data.data.results.illuminance

      expect(illuminance.average).toBeGreaterThan(0)
      expect(illuminance.min).toBeGreaterThan(0)
      expect(illuminance.max).toBeGreaterThan(illuminance.average)
      expect(illuminance.uniformity).toBeGreaterThan(0)
      expect(illuminance.uniformity).toBeLessThanOrEqual(1)
      expect(illuminance.heatmap).toBeDefined()
      expect(Array.isArray(illuminance.heatmap)).toBe(true)
      expect(illuminance.heatmap.length).toBeGreaterThan(0)
    })

    it('should calculate quality metrics', async () => {
      const response = await fetch('http://localhost:3000/api/ai-lighting/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          ...testAnalysisParams
        })
      })

      const data = await response.json()
      const quality = data.data.results.quality

      expect(quality.score).toBeGreaterThanOrEqual(0)
      expect(quality.score).toBeLessThanOrEqual(100)
      expect(quality.colorRendering).toBeGreaterThan(0)
      expect(quality.glareIndex).toBeDefined()
      expect(quality.flickerRate).toBeGreaterThanOrEqual(0)
    })

    it('should calculate efficiency metrics', async () => {
      const response = await fetch('http://localhost:3000/api/ai-lighting/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          ...testAnalysisParams
        })
      })

      const data = await response.json()
      const efficiency = data.data.results.efficiency

      expect(efficiency.powerDensity).toBeGreaterThan(0)
      expect(efficiency.efficacy).toBeGreaterThan(0)
      expect(efficiency.energyConsumption).toBeGreaterThan(0)
      expect(efficiency.cost).toBeGreaterThan(0)
    })

    it('should generate AI recommendations', async () => {
      const response = await fetch('http://localhost:3000/api/ai-lighting/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          ...testAnalysisParams
        })
      })

      const data = await response.json()
      const recommendations = data.data.results.recommendations

      expect(Array.isArray(recommendations)).toBe(true)

      if (recommendations.length > 0) {
        const rec = recommendations[0]
        expect(rec.id).toBeDefined()
        expect(rec.category).toBeDefined()
        expect(['high', 'medium', 'low']).toContain(rec.priority)
        expect(rec.title).toBeDefined()
        expect(rec.description).toBeDefined()
        expect(rec.impact).toBeDefined()
        expect(rec.implementation).toBeDefined()
      }
    })

    it('should provide AI insights', async () => {
      const response = await fetch('http://localhost:3000/api/ai-lighting/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          ...testAnalysisParams
        })
      })

      const data = await response.json()
      const insights = data.data.results.aiInsights

      expect(insights.summary).toBeDefined()
      expect(typeof insights.summary).toBe('string')
      expect(Array.isArray(insights.strengths)).toBe(true)
      expect(Array.isArray(insights.weaknesses)).toBe(true)
      expect(Array.isArray(insights.opportunities)).toBe(true)
    })

    it('should check compliance with standards', async () => {
      const response = await fetch('http://localhost:3000/api/ai-lighting/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          ...testAnalysisParams
        })
      })

      const data = await response.json()
      const compliance = data.data.results.compliance

      expect(Array.isArray(compliance.standardsMet)).toBe(true)
      expect(Array.isArray(compliance.deficiencies)).toBe(true)
    })

    it('should validate room dimensions', async () => {
      const invalidParams = {
        ...testAnalysisParams,
        projectId: testProjectId,
        roomDimensions: {
          width: -1,
          length: 15,
          height: 10
        }
      }

      const response = await fetch('http://localhost:3000/api/ai-lighting/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(invalidParams)
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('dimensions')
    })

    it('should require at least one fixture', async () => {
      const invalidParams = {
        ...testAnalysisParams,
        projectId: testProjectId,
        currentLighting: {
          fixtures: []
        }
      }

      const response = await fetch('http://localhost:3000/api/ai-lighting/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(invalidParams)
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('fixture')
    })

    it('should require required fields', async () => {
      const response = await fetch('http://localhost:3000/api/ai-lighting/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId
          // Missing sceneId and other fields
        })
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('required')
    })

    it('should require authentication', async () => {
      const response = await fetch('http://localhost:3000/api/ai-lighting/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projectId: testProjectId,
          ...testAnalysisParams
        })
      })

      expect(response.status).toBe(401)
    })

    it('should handle insufficient lighting scenario', async () => {
      const lowLightParams = {
        ...testAnalysisParams,
        currentLighting: {
          fixtures: [
            {
              type: 'Low power bulb',
              position: { x: 10, y: 7.5, z: 2.5 },
              power: 10,
              colorTemperature: 2700,
              lumens: 800
            }
          ]
        }
      }

      const response = await fetch('http://localhost:3000/api/ai-lighting/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          ...lowLightParams
        })
      })

      const data = await response.json()
      const recommendations = data.data.results.recommendations

      // Should recommend increasing illuminance
      const illuminanceRec = recommendations.find((r: any) => r.category === 'Illuminance')
      expect(illuminanceRec).toBeDefined()
    })

    it('should recommend LED upgrades for inefficient fixtures', async () => {
      const inefficientParams = {
        ...testAnalysisParams,
        currentLighting: {
          fixtures: [
            {
              type: 'Incandescent',
              position: { x: 10, y: 7.5, z: 2.5 },
              power: 100,
              colorTemperature: 2700,
              lumens: 1600 // Low efficacy
            }
          ]
        }
      }

      const response = await fetch('http://localhost:3000/api/ai-lighting/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          ...inefficientParams
        })
      })

      const data = await response.json()
      const recommendations = data.data.results.recommendations

      // Should recommend LED upgrade
      const ledRec = recommendations.find((r: any) => r.category === 'Efficiency')
      expect(ledRec).toBeDefined()
      expect(ledRec.impact.energySavings).toBeGreaterThan(0)
    })

    it('should recommend daylight harvesting when windows are present', async () => {
      const response = await fetch('http://localhost:3000/api/ai-lighting/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          ...testAnalysisParams,
          naturalLight: {
            windows: [
              { area: 40, orientation: 'south', transmittance: 0.7 },
              { area: 30, orientation: 'east', transmittance: 0.7 }
            ]
          }
        })
      })

      const data = await response.json()
      const recommendations = data.data.results.recommendations

      // Should recommend daylight harvesting
      const daylightRec = recommendations.find((r: any) => r.id === 'daylight-harvesting')
      expect(daylightRec).toBeDefined()
      expect(daylightRec.category).toBe('Controls')
    })
  })

  describe('GET /api/ai-lighting/analyze', () => {
    let testAnalysisId: string

    beforeAll(async () => {
      // Create a test analysis record
      const { data: analysis } = await supabase
        .from('lighting_analyses')
        .insert({
          project_id: testProjectId,
          scene_id: 'test-scene-get',
          user_id: testUserId,
          room_dimensions: testAnalysisParams.roomDimensions,
          current_lighting: testAnalysisParams.currentLighting,
          surfaces: testAnalysisParams.surfaces,
          usage: testAnalysisParams.usage,
          results: {
            illuminance: { average: 350, min: 280, max: 420, uniformity: 0.8, heatmap: [] },
            quality: { score: 75, colorRendering: 85, glareIndex: 19, flickerRate: 0.5 },
            efficiency: { powerDensity: 0.33, efficacy: 98, energyConsumption: 2920, cost: 350 },
            compliance: { standardsMet: ['IES RP-1-12'], deficiencies: [] },
            recommendations: [],
            aiInsights: { summary: 'Good performance', strengths: [], weaknesses: [], opportunities: [] }
          }
        })
        .select()
        .single()

      testAnalysisId = analysis!.id
    })

    it('should retrieve analysis by ID', async () => {
      const response = await fetch(
        `http://localhost:3000/api/ai-lighting/analyze?analysisId=${testAnalysisId}`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.id).toBe(testAnalysisId)
      expect(data.data.results).toBeDefined()
    })

    it('should return 404 for non-existent analysis', async () => {
      const response = await fetch(
        `http://localhost:3000/api/ai-lighting/analyze?analysisId=00000000-0000-0000-0000-000000000000`,
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
