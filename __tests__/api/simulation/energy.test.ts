/**
 * Integration Tests for Energy Simulation API
 *
 * Tests energy modeling and simulation functionality
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-key'
const supabase = createClient(supabaseUrl, supabaseKey)

describe('Energy Simulation API', () => {
  let testUserId: string
  let testOrgId: string
  let testProjectId: string
  let authToken: string

  const testSimulationParams = {
    building: {
      floorArea: 2000, // sqft
      height: 10, // ft
      perimeter: 180, // ft
      volume: 20000, // cuft
      numFloors: 1,
      orientation: 0, // degrees
      shape: 'rectangular' as const
    },
    location: {
      latitude: 37.7749, // San Francisco
      longitude: -122.4194,
      elevation: 0,
      timezone: 'America/Los_Angeles'
    },
    envelope: {
      walls: {
        rValue: 19, // R-19 insulation
        area: 1800 // sqft
      },
      windows: {
        uValue: 0.3, // U-0.3
        area: 300, // sqft
        shgc: 0.3 // Solar Heat Gain Coefficient
      },
      roof: {
        rValue: 38, // R-38
        area: 2000, // sqft
        color: 'light' as const
      },
      foundation: {
        rValue: 10, // R-10
        area: 2000 // sqft
      },
      infiltration: 0.35 // ACH (air changes per hour)
    },
    hvac: {
      heatingType: 'gas' as const,
      coolingType: 'central' as const,
      heatingEfficiency: 0.95, // 95% AFUE
      coolingEfficiency: 16, // 16 SEER
      thermostat: {
        heatingSetpoint: 68, // °F
        coolingSetpoint: 76 // °F
      }
    },
    lighting: {
      powerDensity: 0.8, // W/sqft
      hoursPerDay: 8,
      daylightingFactor: 0.3
    },
    equipment: {
      powerDensity: 1.0, // W/sqft
      hoursPerDay: 10
    },
    occupancy: {
      peoplePerSqft: 0.005, // 200 sqft per person
      hoursPerDay: 10,
      daysPerWeek: 5
    }
  }

  beforeAll(async () => {
    // Create test user
    const { data: { user }, error } = await supabase.auth.admin.createUser({
      email: 'energy-test@example.com',
      password: 'test-password-123',
      email_confirm: true
    })

    if (error || !user) {
      throw new Error('Failed to create test user')
    }

    testUserId = user.id

    // Sign in to get auth token
    const { data: { session } } = await supabase.auth.signInWithPassword({
      email: 'energy-test@example.com',
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
        name: 'Test Energy Org'
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
        name: 'Test Energy Project',
        user_id: testUserId
      })
      .select()
      .single()

    testProjectId = project!.id
  })

  afterAll(async () => {
    // Cleanup
    await supabase.from('energy_simulations').delete().eq('project_id', testProjectId)
    await supabase.from('projects').delete().eq('id', testProjectId)
    await supabase.from('organization_members').delete().eq('organization_id', testOrgId)
    await supabase.from('organizations').delete().eq('id', testOrgId)
    await supabase.auth.admin.deleteUser(testUserId)
  })

  describe('POST /api/simulation/energy', () => {
    it('should run energy simulation successfully', async () => {
      const response = await fetch('http://localhost:3000/api/simulation/energy', {
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
      expect(data.data.results).toBeDefined()
      expect(data.data.climateData).toBeDefined()

      // Verify results structure
      const results = data.data.results
      expect(results.annual).toBeDefined()
      expect(results.annual.heating).toBeGreaterThan(0)
      expect(results.annual.cooling).toBeGreaterThan(0)
      expect(results.annual.lighting).toBeGreaterThan(0)
      expect(results.annual.total).toBeGreaterThan(0)

      expect(results.monthly).toBeDefined()
      expect(Array.isArray(results.monthly)).toBe(true)
      expect(results.monthly.length).toBe(12)

      expect(results.costs).toBeDefined()
      expect(results.costs.annual).toBeGreaterThan(0)
      expect(results.costs.perSqFt).toBeGreaterThan(0)

      expect(results.carbon).toBeDefined()
      expect(results.carbon.annual).toBeGreaterThan(0)

      expect(results.efficiency).toBeDefined()
      expect(results.efficiency.eui).toBeGreaterThan(0)
      expect(results.efficiency.rating).toBeDefined()

      expect(results.recommendations).toBeDefined()
      expect(Array.isArray(results.recommendations)).toBe(true)
    })

    it('should validate building parameters', async () => {
      const invalidParams = {
        ...testSimulationParams,
        projectId: testProjectId,
        building: {
          ...testSimulationParams.building,
          floorArea: -1 // Invalid
        }
      }

      const response = await fetch('http://localhost:3000/api/simulation/energy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(invalidParams)
      })

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('floor area')
    })

    it('should validate location coordinates', async () => {
      const invalidCases = [
        { lat: 91, lng: 0 },
        { lat: -91, lng: 0 },
        { lat: 0, lng: 181 },
        { lat: 0, lng: -181 }
      ]

      for (const coords of invalidCases) {
        const response = await fetch('http://localhost:3000/api/simulation/energy', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            projectId: testProjectId,
            ...testSimulationParams,
            location: {
              ...testSimulationParams.location,
              latitude: coords.lat,
              longitude: coords.lng
            }
          })
        })

        expect(response.status).toBe(400)

        const data = await response.json()
        expect(data.error).toContain('Invalid')
      }
    })

    it('should require required fields', async () => {
      const response = await fetch('http://localhost:3000/api/simulation/energy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId
          // Missing building, location
        })
      })

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('required')
    })

    it('should require authentication', async () => {
      const response = await fetch('http://localhost:3000/api/simulation/energy', {
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

    it('should generate recommendations', async () => {
      const response = await fetch('http://localhost:3000/api/simulation/energy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          ...testSimulationParams,
          // Use lower efficiency to trigger recommendations
          envelope: {
            ...testSimulationParams.envelope,
            walls: { ...testSimulationParams.envelope.walls, rValue: 11 } // Lower R-value
          }
        })
      })

      const data = await response.json()
      expect(data.data.results.recommendations.length).toBeGreaterThan(0)

      // Verify recommendation structure
      const rec = data.data.results.recommendations[0]
      expect(rec.category).toBeDefined()
      expect(rec.title).toBeDefined()
      expect(rec.description).toBeDefined()
      expect(rec.savings).toBeGreaterThan(0)
      expect(rec.cost).toBeGreaterThan(0)
      expect(rec.paybackYears).toBeGreaterThan(0)
      expect(['high', 'medium', 'low']).toContain(rec.priority)
    })

    it('should calculate monthly breakdown correctly', async () => {
      const response = await fetch('http://localhost:3000/api/simulation/energy', {
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
      const monthly = data.data.results.monthly

      // Verify 12 months
      expect(monthly.length).toBe(12)

      // Verify month names
      const expectedMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      monthly.forEach((m: any, i: number) => {
        expect(m.month).toBe(expectedMonths[i])
        expect(m.heating).toBeGreaterThanOrEqual(0)
        expect(m.cooling).toBeGreaterThanOrEqual(0)
        expect(m.lighting).toBeGreaterThan(0)
        expect(m.equipment).toBeGreaterThan(0)
        expect(m.total).toBeGreaterThan(0)
      })

      // Verify annual total matches sum of monthly
      const monthlySum = monthly.reduce((sum: number, m: any) => sum + m.total, 0)
      expect(monthlySum).toBeCloseTo(data.data.results.annual.total, 1)
    })

    it('should calculate efficiency rating', async () => {
      const response = await fetch('http://localhost:3000/api/simulation/energy', {
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
      const efficiency = data.data.results.efficiency

      expect(efficiency.eui).toBeGreaterThan(0)
      expect(efficiency.euiNormalized).toBeGreaterThan(0)
      expect(['A+', 'A', 'B', 'C', 'D', 'E', 'F']).toContain(efficiency.rating)
    })
  })

  describe('GET /api/simulation/energy', () => {
    let testSimulationId: string

    beforeAll(async () => {
      // Create a test simulation record
      const { data: simulation } = await supabase
        .from('energy_simulations')
        .insert({
          project_id: testProjectId,
          org_id: testOrgId,
          user_id: testUserId,
          building_params: testSimulationParams.building,
          location: testSimulationParams.location,
          climate_data: {
            heatingDegreeDays: 3000,
            coolingDegreeDays: 1000
          },
          envelope: testSimulationParams.envelope,
          hvac: testSimulationParams.hvac,
          lighting: testSimulationParams.lighting,
          equipment: testSimulationParams.equipment,
          occupancy: testSimulationParams.occupancy,
          results: {
            annual: {
              heating: 10000,
              cooling: 5000,
              lighting: 3000,
              equipment: 4000,
              waterHeating: 2000,
              total: 24000
            },
            monthly: [],
            peak: { heating: 10000, cooling: 8000, total: 18000 },
            costs: { annual: 3600, monthly: 300, perSqFt: 1.8 },
            carbon: { annual: 10000, perSqFt: 5 },
            efficiency: { eui: 50, euiNormalized: 80, rating: 'B' },
            recommendations: []
          }
        })
        .select()
        .single()

      testSimulationId = simulation!.id
    })

    it('should retrieve simulation by ID', async () => {
      const response = await fetch(
        `http://localhost:3000/api/simulation/energy?simulationId=${testSimulationId}`,
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
      expect(data.data.results).toBeDefined()
    })

    it('should list simulations for a project', async () => {
      const response = await fetch(
        `http://localhost:3000/api/simulation/energy?projectId=${testProjectId}`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(Array.isArray(data.data)).toBe(true)
      expect(data.data.length).toBeGreaterThan(0)
    })

    it('should return 404 for non-existent simulation', async () => {
      const response = await fetch(
        `http://localhost:3000/api/simulation/energy?simulationId=00000000-0000-0000-0000-000000000000`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      expect(response.status).toBe(404)
    })

    it('should require parameter', async () => {
      const response = await fetch(
        `http://localhost:3000/api/simulation/energy`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('required')
    })
  })
})
