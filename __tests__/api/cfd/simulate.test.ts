/**
 * Integration Tests for CFD Simulation API
 *
 * Tests computational fluid dynamics simulation capabilities
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-key'
const supabase = createClient(supabaseUrl, supabaseKey)

describe('CFD Simulation API', () => {
  let testUserId: string
  let testProjectId: string
  let authToken: string

  const testSimulationParams = {
    simulationName: 'Office HVAC Airflow Analysis',
    geometry: {
      bounds: {
        minX: 0, maxX: 10,
        minY: 0, maxY: 8,
        minZ: 0, maxZ: 3
      },
      obstacles: [
        {
          id: 'desk-1',
          type: 'box' as const,
          position: { x: 5, y: 4, z: 0 },
          dimensions: { width: 1.5, height: 0.75, depth: 0.8 },
          properties: { thermal: false }
        }
      ],
      inlets: [
        {
          id: 'supply-1',
          position: { x: 2, y: 4, z: 2.8 },
          dimensions: { width: 0.6, height: 0.6 },
          velocity: 2.5,
          temperature: 18,
          direction: { x: 0, y: 0, z: -1 }
        }
      ],
      outlets: [
        {
          id: 'return-1',
          position: { x: 8, y: 4, z: 0.2 },
          dimensions: { width: 0.6, height: 0.6 },
          pressure: 0
        }
      ]
    },
    fluid: {
      type: 'air' as const,
      density: 1.225,
      viscosity: 0.0000181,
      temperature: 22
    },
    simulation: {
      type: 'steady' as const,
      turbulenceModel: 'k-epsilon' as const,
      meshResolution: 'medium' as const,
      convergenceCriteria: 0.001
    },
    analysis: {
      velocityFields: true,
      pressureFields: true,
      temperatureFields: true,
      turbulenceIntensity: true,
      streamlines: true,
      particleTracing: false
    }
  }

  beforeAll(async () => {
    // Create test user
    const { data: { user }, error } = await supabase.auth.admin.createUser({
      email: 'cfd-test@example.com',
      password: 'test-password-123',
      email_confirm: true
    })

    if (error || !user) {
      throw new Error('Failed to create test user')
    }

    testUserId = user.id

    // Sign in to get auth token
    const { data: { session } } = await supabase.auth.signInWithPassword({
      email: 'cfd-test@example.com',
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
        name: 'Test CFD Project',
        user_id: testUserId
      })
      .select()
      .single()

    testProjectId = project!.id
  })

  afterAll(async () => {
    // Cleanup
    await supabase.from('cfd_simulations').delete().eq('project_id', testProjectId)
    await supabase.from('projects').delete().eq('id', testProjectId)
    await supabase.auth.admin.deleteUser(testUserId)
  })

  describe('POST /api/cfd/simulate', () => {
    it('should run CFD simulation successfully', async () => {
      const response = await fetch('http://localhost:3000/api/cfd/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          ...testSimulationParams
        })
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.simulationId).toBeDefined()
      expect(data.data.result).toBeDefined()

      const result = data.data.result
      expect(result.status).toBeDefined()
      expect(['completed', 'failed', 'converged', 'not_converged']).toContain(result.status)
    })

    it('should track convergence history', async () => {
      const response = await fetch('http://localhost:3000/api/cfd/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          ...testSimulationParams
        })
      })

      const data = await response.json()
      const convergence = data.data.result.convergence

      expect(convergence.achieved).toBeDefined()
      expect(typeof convergence.achieved).toBe('boolean')
      expect(convergence.iterations).toBeGreaterThan(0)
      expect(convergence.finalResidual).toBeGreaterThan(0)
      expect(Array.isArray(convergence.convergenceHistory)).toBe(true)
      expect(convergence.convergenceHistory.length).toBeGreaterThan(0)

      const historyPoint = convergence.convergenceHistory[0]
      expect(historyPoint.iteration).toBeDefined()
      expect(historyPoint.residual).toBeDefined()
    })

    it('should calculate velocity field', async () => {
      const response = await fetch('http://localhost:3000/api/cfd/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          ...testSimulationParams
        })
      })

      const data = await response.json()
      const velocity = data.data.result.flowField.velocity

      expect(velocity.average).toBeGreaterThan(0)
      expect(velocity.max).toBeGreaterThan(velocity.average)
      expect(velocity.min).toBeGreaterThan(0)
      expect(velocity.min).toBeLessThan(velocity.average)
      expect(Array.isArray(velocity.distribution)).toBe(true)
      expect(velocity.distribution.length).toBeGreaterThan(0)
    })

    it('should calculate pressure field', async () => {
      const response = await fetch('http://localhost:3000/api/cfd/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          ...testSimulationParams
        })
      })

      const data = await response.json()
      const pressure = data.data.result.flowField.pressure

      expect(pressure.average).toBeGreaterThan(0)
      expect(pressure.max).toBeGreaterThan(pressure.average)
      expect(pressure.min).toBeLessThan(pressure.average)
      expect(Array.isArray(pressure.distribution)).toBe(true)
    })

    it('should calculate temperature field when enabled', async () => {
      const response = await fetch('http://localhost:3000/api/cfd/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          ...testSimulationParams
        })
      })

      const data = await response.json()
      const temperature = data.data.result.flowField.temperature

      expect(temperature).toBeDefined()
      expect(temperature.average).toBeGreaterThan(0)
      expect(temperature.max).toBeGreaterThan(temperature.average)
      expect(temperature.min).toBeLessThan(temperature.average)
    })

    it('should calculate performance metrics', async () => {
      const response = await fetch('http://localhost:3000/api/cfd/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          ...testSimulationParams
        })
      })

      const data = await response.json()
      const performance = data.data.result.performance

      expect(performance.massFlowRate).toBeGreaterThan(0)
      expect(performance.volumeFlowRate).toBeGreaterThan(0)
      expect(performance.pressureDrop).toBeGreaterThanOrEqual(0)
      expect(performance.effectiveness).toBeGreaterThan(0)
      expect(performance.effectiveness).toBeLessThanOrEqual(100)
    })

    it('should analyze zones', async () => {
      const response = await fetch('http://localhost:3000/api/cfd/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          ...testSimulationParams
        })
      })

      const data = await response.json()
      const zones = data.data.result.zones

      expect(Array.isArray(zones)).toBe(true)
      expect(zones.length).toBeGreaterThan(0)

      const zone = zones[0]
      expect(zone.id).toBeDefined()
      expect(zone.name).toBeDefined()
      expect(zone.averageVelocity).toBeGreaterThanOrEqual(0)
      expect(zone.averagePressure).toBeGreaterThan(0)
    })

    it('should generate visualizations', async () => {
      const response = await fetch('http://localhost:3000/api/cfd/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          ...testSimulationParams
        })
      })

      const data = await response.json()
      const visualizations = data.data.result.visualizations

      expect(visualizations.velocityContours).toBeDefined()
      expect(visualizations.pressureContours).toBeDefined()
      expect(visualizations.streamlines).toBeDefined()
      expect(visualizations.vectorField).toBeDefined()

      // Check that visualizations are base64 encoded images
      expect(visualizations.velocityContours).toMatch(/^data:image/)
    })

    it('should provide recommendations', async () => {
      const response = await fetch('http://localhost:3000/api/cfd/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          ...testSimulationParams
        })
      })

      const data = await response.json()
      const recommendations = data.data.result.recommendations

      expect(Array.isArray(recommendations)).toBe(true)

      if (recommendations.length > 0) {
        const rec = recommendations[0]
        expect(rec.category).toBeDefined()
        expect(['high', 'medium', 'low']).toContain(rec.priority)
        expect(rec.issue).toBeDefined()
        expect(rec.solution).toBeDefined()
        expect(rec.impact).toBeDefined()
      }
    })

    it('should track computational metrics', async () => {
      const response = await fetch('http://localhost:3000/api/cfd/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          ...testSimulationParams
        })
      })

      const data = await response.json()
      const metrics = data.data.result.computationalMetrics

      expect(metrics.meshCells).toBeGreaterThan(0)
      expect(metrics.processingTime).toBeGreaterThan(0)
      expect(metrics.memoryUsed).toBeGreaterThan(0)
      expect(metrics.coreUtilization).toBeGreaterThan(0)
      expect(metrics.coreUtilization).toBeLessThanOrEqual(100)
    })

    it('should handle transient simulation', async () => {
      const response = await fetch('http://localhost:3000/api/cfd/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          ...testSimulationParams,
          simulation: {
            ...testSimulationParams.simulation,
            type: 'transient',
            timeStep: 0.1,
            duration: 10
          }
        })
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.data.result).toBeDefined()
    })

    it('should validate required inlets', async () => {
      const response = await fetch('http://localhost:3000/api/cfd/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          ...testSimulationParams,
          geometry: {
            ...testSimulationParams.geometry,
            inlets: []
          }
        })
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('inlet')
    })

    it('should validate required outlets', async () => {
      const response = await fetch('http://localhost:3000/api/cfd/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          ...testSimulationParams,
          geometry: {
            ...testSimulationParams.geometry,
            outlets: []
          }
        })
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('outlet')
    })

    it('should validate simulation type', async () => {
      const response = await fetch('http://localhost:3000/api/cfd/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          ...testSimulationParams,
          simulation: {
            ...testSimulationParams.simulation,
            type: 'invalid-type'
          }
        })
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('type')
    })

    it('should require authentication', async () => {
      const response = await fetch('http://localhost:3000/api/cfd/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projectId: testProjectId,
          ...testSimulationParams
        })
      })

      expect(response.status).toBe(401)
    })
  })

  describe('GET /api/cfd/simulate', () => {
    let testSimulationId: string

    beforeAll(async () => {
      // Create a test simulation record
      const { data: simulation } = await supabase
        .from('cfd_simulations')
        .insert({
          project_id: testProjectId,
          user_id: testUserId,
          simulation_name: 'Test Simulation',
          geometry: testSimulationParams.geometry,
          fluid: testSimulationParams.fluid,
          simulation_config: testSimulationParams.simulation,
          result: {
            simulationId: 'test-sim',
            status: 'converged',
            convergence: { achieved: true, iterations: 100, finalResidual: 0.0005, convergenceHistory: [] },
            flowField: {
              velocity: { average: 2.0, max: 3.0, min: 1.0, distribution: [] },
              pressure: { average: 101325, max: 101350, min: 101300, distribution: [] }
            },
            performance: { massFlowRate: 0.9, volumeFlowRate: 0.735, pressureDrop: 50, effectiveness: 90 },
            zones: [],
            visualizations: { velocityContours: '', pressureContours: '', streamlines: '', vectorField: '' },
            recommendations: [],
            computationalMetrics: { meshCells: 8000, processingTime: 45, memoryUsed: 8, coreUtilization: 80 }
          }
        })
        .select()
        .single()

      testSimulationId = simulation!.id
    })

    it('should retrieve simulation by ID', async () => {
      const response = await fetch(
        `http://localhost:3000/api/cfd/simulate?simulationId=${testSimulationId}`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.id).toBe(testSimulationId)
      expect(data.data.result).toBeDefined()
    })

    it('should return 404 for non-existent simulation', async () => {
      const response = await fetch(
        `http://localhost:3000/api/cfd/simulate?simulationId=00000000-0000-0000-0000-000000000000`,
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
