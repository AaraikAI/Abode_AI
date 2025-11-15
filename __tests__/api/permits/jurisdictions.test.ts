/**
 * Integration Tests for Permit Jurisdictions API
 *
 * Tests jurisdiction listing, creation, and requirements retrieval
 * 20 comprehensive tests
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-key'
const supabase = createClient(supabaseUrl, supabaseKey)

describe('Permit Jurisdictions API', () => {
  let testUserId: string
  let adminUserId: string
  let testOrgId: string
  let testJurisdictionId: string
  let authToken: string
  let adminToken: string

  beforeAll(async () => {
    // Create test users
    const { data: { user }, error } = await supabase.auth.admin.createUser({
      email: 'jurisdiction-test@example.com',
      password: 'test-password-123',
      email_confirm: true
    })

    if (error || !user) {
      throw new Error('Failed to create test user')
    }

    testUserId = user.id

    const { data: { user: adminUser } } = await supabase.auth.admin.createUser({
      email: 'jurisdiction-admin@example.com',
      password: 'test-password-123',
      email_confirm: true
    })

    adminUserId = adminUser!.id

    // Create profiles
    await supabase.from('profiles').insert([
      { id: testUserId, username: 'testuser', role: 'user' },
      { id: adminUserId, username: 'adminuser', role: 'admin' }
    ])

    // Sign in to get auth tokens
    const { data: { session } } = await supabase.auth.signInWithPassword({
      email: 'jurisdiction-test@example.com',
      password: 'test-password-123'
    })

    authToken = session!.access_token

    const { data: { session: adminSession } } = await supabase.auth.signInWithPassword({
      email: 'jurisdiction-admin@example.com',
      password: 'test-password-123'
    })

    adminToken = adminSession!.access_token

    // Create test organization
    const { data: org } = await supabase
      .from('organizations')
      .insert({ name: 'Test Jurisdiction Org' })
      .select()
      .single()

    testOrgId = org!.id

    // Add admin user to organization
    await supabase
      .from('organization_members')
      .insert({
        organization_id: testOrgId,
        user_id: adminUserId,
        role: 'admin'
      })

    // Create test jurisdiction
    const { data: jurisdiction } = await supabase
      .from('jurisdictions')
      .insert({
        name: 'Test Jurisdiction City',
        type: 'city',
        location: { state: 'CA', county: 'Test County', city: 'Test City' },
        contact: {
          phone: '(555) 123-4567',
          email: 'permits@testjurisdiction.gov',
          website: 'https://testjurisdiction.gov',
          address: '123 Government Plaza'
        },
        requirements: {
          permitTypes: ['building', 'electrical', 'plumbing'],
          reviewProcess: 'Standard review process',
          estimatedDays: 14,
          fees: { building: 600, electrical: 250, plumbing: 200 }
        },
        online_submission: true,
        api_integration: true,
        api_endpoint: 'https://api.testjurisdiction.gov/permits'
      })
      .select()
      .single()

    testJurisdictionId = jurisdiction!.id
  })

  afterAll(async () => {
    // Cleanup
    await supabase.from('jurisdictions').delete().eq('id', testJurisdictionId)
    await supabase.from('organization_members').delete().eq('organization_id', testOrgId)
    await supabase.from('organizations').delete().eq('id', testOrgId)
    await supabase.from('profiles').delete().in('id', [testUserId, adminUserId])
    await supabase.auth.admin.deleteUser(testUserId)
    await supabase.auth.admin.deleteUser(adminUserId)
  })

  describe('GET /api/permits/jurisdictions', () => {
    it('should list all jurisdictions', async () => {
      const response = await fetch(`http://localhost:3000/api/permits/jurisdictions`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.jurisdictions).toBeDefined()
      expect(Array.isArray(data.jurisdictions)).toBe(true)
      expect(data.total).toBeGreaterThan(0)
    })

    it('should filter jurisdictions by state', async () => {
      const response = await fetch(
        `http://localhost:3000/api/permits/jurisdictions?state=CA`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      const data = await response.json()
      expect(data.jurisdictions.every((j: any) =>
        j.location?.state === 'CA'
      )).toBe(true)
    })

    it('should filter jurisdictions by type', async () => {
      const response = await fetch(
        `http://localhost:3000/api/permits/jurisdictions?type=city`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      const data = await response.json()
      expect(data.jurisdictions.every((j: any) => j.type === 'city')).toBe(true)
    })

    it('should support pagination', async () => {
      const response = await fetch(
        `http://localhost:3000/api/permits/jurisdictions?limit=10&offset=0`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      const data = await response.json()
      expect(data.limit).toBe(10)
      expect(data.offset).toBe(0)
      expect(data.hasMore).toBeDefined()
    })

    it('should require authentication', async () => {
      const response = await fetch(`http://localhost:3000/api/permits/jurisdictions`)

      expect(response.status).toBe(401)
    })
  })

  describe('GET /api/permits/jurisdictions - Find by Address', () => {
    it('should find jurisdiction by address', async () => {
      const response = await fetch(
        `http://localhost:3000/api/permits/jurisdictions?action=find&address=123 Main St, Los Angeles, CA 90001`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.jurisdiction).toBeDefined()
    })

    it('should return 404 for unknown address', async () => {
      const response = await fetch(
        `http://localhost:3000/api/permits/jurisdictions?action=find&address=999 Unknown St, Nowhere, ZZ 99999`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      expect(response.status).toBe(404)

      const data = await response.json()
      expect(data.error).toContain('No jurisdiction found')
    })
  })

  describe('GET /api/permits/jurisdictions - Requirements', () => {
    it('should get jurisdiction requirements', async () => {
      const response = await fetch(
        `http://localhost:3000/api/permits/jurisdictions?action=requirements&jurisdictionId=${testJurisdictionId}`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.requirements).toBeDefined()
      expect(data.permitTypes).toBeDefined()
      expect(Array.isArray(data.permitTypes)).toBe(true)
      expect(data.fees).toBeDefined()
    })

    it('should include review process information', async () => {
      const response = await fetch(
        `http://localhost:3000/api/permits/jurisdictions?action=requirements&jurisdictionId=${testJurisdictionId}`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      const data = await response.json()
      expect(data.reviewProcess).toBeDefined()
      expect(data.estimatedDays).toBeDefined()
    })

    it('should include submission capabilities', async () => {
      const response = await fetch(
        `http://localhost:3000/api/permits/jurisdictions?action=requirements&jurisdictionId=${testJurisdictionId}`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      const data = await response.json()
      expect(data.onlineSubmission).toBeDefined()
      expect(data.apiIntegration).toBeDefined()
    })

    it('should return 404 for non-existent jurisdiction', async () => {
      const response = await fetch(
        `http://localhost:3000/api/permits/jurisdictions?action=requirements&jurisdictionId=00000000-0000-0000-0000-000000000000`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      expect(response.status).toBe(404)
    })
  })

  describe('POST /api/permits/jurisdictions', () => {
    it('should create new jurisdiction as admin', async () => {
      const response = await fetch(`http://localhost:3000/api/permits/jurisdictions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          name: 'New Test City',
          type: 'city',
          location: {
            state: 'CA',
            county: 'Test County',
            city: 'New Test City'
          },
          contact: {
            phone: '(555) 999-8888',
            email: 'permits@newtestcity.gov',
            website: 'https://newtestcity.gov',
            address: '456 City Hall'
          },
          requirements: {
            permitTypes: ['building', 'electrical'],
            reviewProcess: 'Fast track review',
            estimatedDays: 7,
            fees: { building: 400, electrical: 150 }
          },
          onlineSubmission: true,
          apiIntegration: false
        })
      })

      expect(response.status).toBe(201)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.jurisdiction).toBeDefined()
      expect(data.jurisdiction.name).toBe('New Test City')

      // Cleanup
      await supabase.from('jurisdictions').delete().eq('id', data.jurisdiction.id)
    })

    it('should store jurisdiction in database', async () => {
      const response = await fetch(`http://localhost:3000/api/permits/jurisdictions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          name: 'DB Test City',
          type: 'city',
          location: { state: 'CA', city: 'DB Test City' },
          contact: {
            phone: '555-5555',
            email: 'test@test.gov',
            website: 'https://test.gov',
            address: 'Test'
          },
          requirements: {
            permitTypes: ['building'],
            reviewProcess: 'Test',
            estimatedDays: 10,
            fees: { building: 500 }
          }
        })
      })

      const data = await response.json()
      const jurisdictionId = data.jurisdiction.id

      // Verify in database
      const { data: dbJurisdiction } = await supabase
        .from('jurisdictions')
        .select('*')
        .eq('id', jurisdictionId)
        .single()

      expect(dbJurisdiction).toBeDefined()
      expect(dbJurisdiction!.name).toBe('DB Test City')

      // Cleanup
      await supabase.from('jurisdictions').delete().eq('id', jurisdictionId)
    })

    it('should validate required fields', async () => {
      const response = await fetch(`http://localhost:3000/api/permits/jurisdictions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          name: 'Incomplete City'
          // Missing required fields
        })
      })

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('required')
    })

    it('should validate jurisdiction type', async () => {
      const response = await fetch(`http://localhost:3000/api/permits/jurisdictions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          name: 'Invalid Type City',
          type: 'invalid-type',
          location: { state: 'CA' },
          contact: {
            phone: '555-5555',
            email: 'test@test.gov',
            website: 'https://test.gov',
            address: 'Test'
          },
          requirements: {
            permitTypes: ['building'],
            reviewProcess: 'Test',
            estimatedDays: 10,
            fees: {}
          }
        })
      })

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('Invalid type')
    })

    it('should require admin access', async () => {
      const response = await fetch(`http://localhost:3000/api/permits/jurisdictions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: 'Unauthorized City',
          type: 'city',
          location: { state: 'CA' },
          contact: {
            phone: '555-5555',
            email: 'test@test.gov',
            website: 'https://test.gov',
            address: 'Test'
          },
          requirements: {
            permitTypes: ['building'],
            reviewProcess: 'Test',
            estimatedDays: 10,
            fees: {}
          }
        })
      })

      expect(response.status).toBe(403)
    })

    it('should validate contact information', async () => {
      const response = await fetch(`http://localhost:3000/api/permits/jurisdictions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          name: 'Missing Contact City',
          type: 'city',
          location: { state: 'CA' },
          contact: {
            phone: '555-5555'
            // Missing required contact fields
          },
          requirements: {
            permitTypes: ['building'],
            reviewProcess: 'Test',
            estimatedDays: 10,
            fees: {}
          }
        })
      })

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('contact')
    })

    it('should validate requirements structure', async () => {
      const response = await fetch(`http://localhost:3000/api/permits/jurisdictions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          name: 'Invalid Requirements City',
          type: 'city',
          location: { state: 'CA' },
          contact: {
            phone: '555-5555',
            email: 'test@test.gov',
            website: 'https://test.gov',
            address: 'Test'
          },
          requirements: {
            // Missing permitTypes array
            reviewProcess: 'Test',
            estimatedDays: 10,
            fees: {}
          }
        })
      })

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('permitTypes')
    })
  })

  describe('PUT /api/permits/jurisdictions', () => {
    it('should update jurisdiction as admin', async () => {
      const response = await fetch(`http://localhost:3000/api/permits/jurisdictions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          id: testJurisdictionId,
          name: 'Updated Jurisdiction Name'
        })
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.jurisdiction.name).toBe('Updated Jurisdiction Name')
    })

    it('should require jurisdiction ID', async () => {
      const response = await fetch(`http://localhost:3000/api/permits/jurisdictions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          name: 'No ID City'
        })
      })

      expect(response.status).toBe(400)
    })

    it('should return 404 for non-existent jurisdiction', async () => {
      const response = await fetch(`http://localhost:3000/api/permits/jurisdictions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          id: '00000000-0000-0000-0000-000000000000',
          name: 'Nonexistent'
        })
      })

      expect(response.status).toBe(404)
    })

    it('should require admin access for updates', async () => {
      const response = await fetch(`http://localhost:3000/api/permits/jurisdictions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          id: testJurisdictionId,
          name: 'Unauthorized Update'
        })
      })

      expect(response.status).toBe(403)
    })
  })
})
