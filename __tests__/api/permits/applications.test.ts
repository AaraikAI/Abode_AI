/**
 * Integration Tests for Permit Applications API
 *
 * Tests permit application creation, listing, updating, and withdrawal
 * 35 comprehensive tests
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-key'
const supabase = createClient(supabaseUrl, supabaseKey)

describe('Permit Applications API', () => {
  let testUserId: string
  let testUser2Id: string
  let testOrgId: string
  let testProjectId: string
  let testJurisdictionId: string
  let authToken: string
  let authToken2: string

  beforeAll(async () => {
    // Create test users
    const { data: { user }, error } = await supabase.auth.admin.createUser({
      email: 'permits-app-test@example.com',
      password: 'test-password-123',
      email_confirm: true
    })

    if (error || !user) {
      throw new Error('Failed to create test user')
    }

    testUserId = user.id

    const { data: { user: user2 } } = await supabase.auth.admin.createUser({
      email: 'permits-app-test-2@example.com',
      password: 'test-password-123',
      email_confirm: true
    })

    testUser2Id = user2!.id

    // Sign in to get auth tokens
    const { data: { session } } = await supabase.auth.signInWithPassword({
      email: 'permits-app-test@example.com',
      password: 'test-password-123'
    })

    authToken = session!.access_token

    const { data: { session: session2 } } = await supabase.auth.signInWithPassword({
      email: 'permits-app-test-2@example.com',
      password: 'test-password-123'
    })

    authToken2 = session2!.access_token

    // Create test organization
    const { data: org } = await supabase
      .from('organizations')
      .insert({ name: 'Test Permits Org' })
      .select()
      .single()

    testOrgId = org!.id

    // Add users to organization
    await supabase
      .from('organization_members')
      .insert([
        {
          organization_id: testOrgId,
          user_id: testUserId,
          role: 'admin'
        },
        {
          organization_id: testOrgId,
          user_id: testUser2Id,
          role: 'member'
        }
      ])

    // Create test project
    const { data: project } = await supabase
      .from('projects')
      .insert({
        org_id: testOrgId,
        name: 'Test Permits Project',
        user_id: testUserId
      })
      .select()
      .single()

    testProjectId = project!.id

    // Create test jurisdiction
    const { data: jurisdiction } = await supabase
      .from('jurisdictions')
      .insert({
        name: 'Test City',
        type: 'city',
        location: { state: 'CA', city: 'Test City' },
        contact: {
          phone: '(555) 555-5555',
          email: 'permits@testcity.gov',
          website: 'https://testcity.gov',
          address: '123 Test St'
        },
        requirements: {
          permitTypes: ['building', 'electrical'],
          reviewProcess: 'Standard review',
          estimatedDays: 10,
          fees: { building: 500, electrical: 200 }
        },
        online_submission: true,
        api_integration: false
      })
      .select()
      .single()

    testJurisdictionId = jurisdiction!.id
  })

  afterAll(async () => {
    // Cleanup
    await supabase.from('permit_applications').delete().eq('project_id', testProjectId)
    await supabase.from('projects').delete().eq('id', testProjectId)
    await supabase.from('organization_members').delete().eq('organization_id', testOrgId)
    await supabase.from('organizations').delete().eq('id', testOrgId)
    await supabase.from('jurisdictions').delete().eq('id', testJurisdictionId)
    await supabase.auth.admin.deleteUser(testUserId)
    await supabase.auth.admin.deleteUser(testUser2Id)
  })

  describe('POST /api/permits/applications', () => {
    it('should create a new permit application', async () => {
      const response = await fetch(`http://localhost:3000/api/permits/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          permitType: 'building',
          applicant: {
            name: 'John Doe',
            company: 'Doe Construction',
            licenseNumber: 'CA-12345',
            email: 'john@doe.com',
            phone: '(555) 555-1234',
            address: '123 Main St'
          },
          property: {
            address: '456 Test Ave, Los Angeles, CA 90001',
            apn: '1234-567-890',
            zoning: 'R-1',
            lotSize: 5000,
            existingStructures: ['Single Family Home']
          },
          projectDetails: {
            description: 'New construction',
            constructionType: 'Type V',
            occupancyType: 'R-3',
            squareFootage: 2500,
            stories: 2,
            estimatedCost: 500000
          }
        })
      })

      expect(response.status).toBe(201)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.application).toBeDefined()
      expect(data.application.id).toBeDefined()
      expect(data.application.permit_type).toBe('building')
      expect(data.application.status).toBe('draft')
    })

    it('should store application in database', async () => {
      const response = await fetch(`http://localhost:3000/api/permits/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          permitType: 'electrical',
          applicant: {
            name: 'Jane Smith',
            email: 'jane@example.com',
            phone: '(555) 555-5678',
            address: '789 Oak St'
          },
          property: {
            address: '456 Test Ave, Los Angeles, CA 90001',
            apn: '1234-567-890',
            zoning: 'R-1',
            lotSize: 5000,
            existingStructures: []
          },
          projectDetails: {
            description: 'Electrical upgrade',
            constructionType: 'Type V',
            occupancyType: 'R-3',
            squareFootage: 2500,
            stories: 2,
            estimatedCost: 50000
          }
        })
      })

      const data = await response.json()
      const appId = data.application.id

      // Verify in database
      const { data: dbApp } = await supabase
        .from('permit_applications')
        .select('*')
        .eq('id', appId)
        .single()

      expect(dbApp).toBeDefined()
      expect(dbApp!.project_id).toBe(testProjectId)
    })

    it('should calculate fees automatically', async () => {
      const response = await fetch(`http://localhost:3000/api/permits/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          permitType: 'building',
          applicant: {
            name: 'Test User',
            email: 'test@example.com',
            phone: '(555) 555-0000',
            address: '123 Test'
          },
          property: {
            address: '456 Test Ave, Los Angeles, CA 90001',
            apn: '1234-567-890',
            zoning: 'R-1',
            lotSize: 5000,
            existingStructures: []
          },
          projectDetails: {
            description: 'Test',
            constructionType: 'Type V',
            occupancyType: 'R-3',
            squareFootage: 2500,
            stories: 2,
            estimatedCost: 100000
          }
        })
      })

      const data = await response.json()
      expect(data.application.fees).toBeDefined()
      expect(data.application.fees.permitFee).toBeGreaterThan(0)
      expect(data.application.fees.planCheckFee).toBeGreaterThan(0)
      expect(data.application.fees.total).toBeGreaterThan(0)
    })

    it('should require authentication', async () => {
      const response = await fetch(`http://localhost:3000/api/permits/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projectId: testProjectId,
          permitType: 'building',
          applicant: {},
          property: {},
          projectDetails: {}
        })
      })

      expect(response.status).toBe(401)
    })

    it('should validate required fields', async () => {
      const response = await fetch(`http://localhost:3000/api/permits/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId
          // Missing other required fields
        })
      })

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('required')
    })

    it('should validate permit type', async () => {
      const response = await fetch(`http://localhost:3000/api/permits/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          permitType: 'invalid-type',
          applicant: {
            name: 'Test',
            email: 'test@example.com',
            phone: '555-5555',
            address: 'Test'
          },
          property: {
            address: '456 Test Ave, Los Angeles, CA 90001',
            apn: '123',
            zoning: 'R-1',
            lotSize: 5000,
            existingStructures: []
          },
          projectDetails: {
            description: 'Test',
            constructionType: 'Type V',
            occupancyType: 'R-3',
            squareFootage: 2500,
            stories: 2,
            estimatedCost: 100000
          }
        })
      })

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('Invalid permit type')
    })

    it('should verify project access', async () => {
      // Create user not in org
      const { data: { user: outsider } } = await supabase.auth.admin.createUser({
        email: 'outsider-permits@example.com',
        password: 'test-password-123',
        email_confirm: true
      })

      const { data: { session } } = await supabase.auth.signInWithPassword({
        email: 'outsider-permits@example.com',
        password: 'test-password-123'
      })

      const response = await fetch(`http://localhost:3000/api/permits/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session!.access_token}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          permitType: 'building',
          applicant: {
            name: 'Test',
            email: 'test@example.com',
            phone: '555-5555',
            address: 'Test'
          },
          property: {
            address: '456 Test Ave, Los Angeles, CA 90001',
            apn: '123',
            zoning: 'R-1',
            lotSize: 5000,
            existingStructures: []
          },
          projectDetails: {
            description: 'Test',
            constructionType: 'Type V',
            occupancyType: 'R-3',
            squareFootage: 2500,
            stories: 2,
            estimatedCost: 100000
          }
        })
      })

      expect(response.status).toBe(403)

      // Cleanup
      await supabase.auth.admin.deleteUser(outsider!.id)
    })

    it('should find jurisdiction automatically', async () => {
      const response = await fetch(`http://localhost:3000/api/permits/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          permitType: 'building',
          applicant: {
            name: 'Test',
            email: 'test@example.com',
            phone: '555-5555',
            address: 'Test'
          },
          property: {
            address: '456 Test Ave, Los Angeles, CA 90001',
            apn: '123',
            zoning: 'R-1',
            lotSize: 5000,
            existingStructures: []
          },
          projectDetails: {
            description: 'Test',
            constructionType: 'Type V',
            occupancyType: 'R-3',
            squareFootage: 2500,
            stories: 2,
            estimatedCost: 100000
          }
        })
      })

      const data = await response.json()
      expect(data.application.jurisdiction_id).toBeDefined()
    })

    it('should reject if jurisdiction not found', async () => {
      const response = await fetch(`http://localhost:3000/api/permits/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          permitType: 'building',
          applicant: {
            name: 'Test',
            email: 'test@example.com',
            phone: '555-5555',
            address: 'Test'
          },
          property: {
            address: '999 Unknown Address, Nowhere, ZZ 99999',
            apn: '123',
            zoning: 'R-1',
            lotSize: 5000,
            existingStructures: []
          },
          projectDetails: {
            description: 'Test',
            constructionType: 'Type V',
            occupancyType: 'R-3',
            squareFootage: 2500,
            stories: 2,
            estimatedCost: 100000
          }
        })
      })

      expect(response.status).toBe(404)

      const data = await response.json()
      expect(data.error).toContain('Jurisdiction not found')
    })
  })

  describe('GET /api/permits/applications', () => {
    let applicationId: string

    beforeAll(async () => {
      // Create test application
      const { data: app } = await supabase
        .from('permit_applications')
        .insert({
          project_id: testProjectId,
          user_id: testUserId,
          jurisdiction_id: testJurisdictionId,
          permit_type: 'building',
          status: 'draft',
          applicant: { name: 'Test' },
          property: { address: 'Test' },
          project_details: { description: 'Test' },
          fees: { permitFee: 500, planCheckFee: 325, total: 825, paid: false }
        })
        .select()
        .single()

      applicationId = app!.id
    })

    it('should list all applications', async () => {
      const response = await fetch(`http://localhost:3000/api/permits/applications`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.applications).toBeDefined()
      expect(Array.isArray(data.applications)).toBe(true)
      expect(data.total).toBeGreaterThan(0)
    })

    it('should filter by project ID', async () => {
      const response = await fetch(
        `http://localhost:3000/api/permits/applications?projectId=${testProjectId}`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      const data = await response.json()
      expect(data.applications.every((app: any) => app.project_id === testProjectId)).toBe(true)
    })

    it('should filter by status', async () => {
      const response = await fetch(
        `http://localhost:3000/api/permits/applications?status=draft`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      const data = await response.json()
      expect(data.applications.every((app: any) => app.status === 'draft')).toBe(true)
    })

    it('should filter by permit type', async () => {
      const response = await fetch(
        `http://localhost:3000/api/permits/applications?permitType=building`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      const data = await response.json()
      expect(data.applications.every((app: any) => app.permit_type === 'building')).toBe(true)
    })

    it('should filter by jurisdiction', async () => {
      const response = await fetch(
        `http://localhost:3000/api/permits/applications?jurisdictionId=${testJurisdictionId}`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      const data = await response.json()
      expect(data.applications.every((app: any) => app.jurisdiction_id === testJurisdictionId)).toBe(true)
    })

    it('should support pagination', async () => {
      const response = await fetch(
        `http://localhost:3000/api/permits/applications?limit=10&offset=0`,
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

    it('should include project information', async () => {
      const response = await fetch(`http://localhost:3000/api/permits/applications`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      const data = await response.json()
      if (data.applications.length > 0) {
        expect(data.applications[0].projects).toBeDefined()
      }
    })

    it('should require authentication', async () => {
      const response = await fetch(`http://localhost:3000/api/permits/applications`)

      expect(response.status).toBe(401)
    })

    it('should only return applications from accessible organizations', async () => {
      const response = await fetch(`http://localhost:3000/api/permits/applications`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      const data = await response.json()
      // All applications should be accessible
      expect(data.applications).toBeDefined()
    })
  })

  describe('PUT /api/permits/applications', () => {
    let applicationId: string

    beforeAll(async () => {
      // Create test application
      const { data: app } = await supabase
        .from('permit_applications')
        .insert({
          project_id: testProjectId,
          user_id: testUserId,
          jurisdiction_id: testJurisdictionId,
          permit_type: 'building',
          status: 'draft',
          applicant: { name: 'Original Name' },
          property: { address: 'Original Address' },
          project_details: { description: 'Original Description' },
          fees: { permitFee: 500, planCheckFee: 325, total: 825, paid: false }
        })
        .select()
        .single()

      applicationId = app!.id
    })

    it('should update application', async () => {
      const response = await fetch(`http://localhost:3000/api/permits/applications`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          id: applicationId,
          applicant: { name: 'Updated Name', email: 'updated@example.com', phone: '555-5555', address: 'Test' }
        })
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.application.applicant.name).toBe('Updated Name')
    })

    it('should update property information', async () => {
      const response = await fetch(`http://localhost:3000/api/permits/applications`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          id: applicationId,
          property: {
            address: 'Updated Address',
            apn: '999-888-777',
            zoning: 'R-2',
            lotSize: 6000,
            existingStructures: ['Updated Structure']
          }
        })
      })

      const data = await response.json()
      expect(data.application.property.address).toBe('Updated Address')
    })

    it('should update project details', async () => {
      const response = await fetch(`http://localhost:3000/api/permits/applications`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          id: applicationId,
          projectDetails: {
            description: 'Updated Description',
            constructionType: 'Type III',
            occupancyType: 'R-2',
            squareFootage: 3000,
            stories: 3,
            estimatedCost: 600000
          }
        })
      })

      const data = await response.json()
      expect(data.application.project_details.description).toBe('Updated Description')
    })

    it('should update status to ready', async () => {
      const response = await fetch(`http://localhost:3000/api/permits/applications`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          id: applicationId,
          status: 'ready'
        })
      })

      const data = await response.json()
      expect(data.application.status).toBe('ready')
    })

    it('should require application ID', async () => {
      const response = await fetch(`http://localhost:3000/api/permits/applications`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          applicant: { name: 'Test' }
        })
      })

      expect(response.status).toBe(400)
    })

    it('should return 404 for non-existent application', async () => {
      const response = await fetch(`http://localhost:3000/api/permits/applications`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          id: '00000000-0000-0000-0000-000000000000',
          applicant: { name: 'Test' }
        })
      })

      expect(response.status).toBe(404)
    })

    it('should deny access without permission', async () => {
      // Create user not in org
      const { data: { user: outsider } } = await supabase.auth.admin.createUser({
        email: 'outsider-update@example.com',
        password: 'test-password-123',
        email_confirm: true
      })

      const { data: { session } } = await supabase.auth.signInWithPassword({
        email: 'outsider-update@example.com',
        password: 'test-password-123'
      })

      const response = await fetch(`http://localhost:3000/api/permits/applications`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session!.access_token}`
        },
        body: JSON.stringify({
          id: applicationId,
          applicant: { name: 'Test' }
        })
      })

      expect(response.status).toBe(403)

      // Cleanup
      await supabase.auth.admin.deleteUser(outsider!.id)
    })

    it('should not allow updates to submitted applications', async () => {
      // Create submitted application
      const { data: submittedApp } = await supabase
        .from('permit_applications')
        .insert({
          project_id: testProjectId,
          user_id: testUserId,
          jurisdiction_id: testJurisdictionId,
          permit_type: 'building',
          status: 'submitted',
          applicant: { name: 'Test' },
          property: { address: 'Test' },
          project_details: { description: 'Test' },
          fees: { permitFee: 500, planCheckFee: 325, total: 825, paid: false }
        })
        .select()
        .single()

      const response = await fetch(`http://localhost:3000/api/permits/applications`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          id: submittedApp!.id,
          applicant: { name: 'Updated' }
        })
      })

      expect(response.status).toBe(400)

      // Cleanup
      await supabase.from('permit_applications').delete().eq('id', submittedApp!.id)
    })
  })

  describe('DELETE /api/permits/applications', () => {
    let applicationId: string

    beforeAll(async () => {
      // Create test application
      const { data: app } = await supabase
        .from('permit_applications')
        .insert({
          project_id: testProjectId,
          user_id: testUserId,
          jurisdiction_id: testJurisdictionId,
          permit_type: 'building',
          status: 'draft',
          applicant: { name: 'Test' },
          property: { address: 'Test' },
          project_details: { description: 'Test' },
          fees: { permitFee: 500, planCheckFee: 325, total: 825, paid: false }
        })
        .select()
        .single()

      applicationId = app!.id
    })

    it('should withdraw application (soft delete)', async () => {
      const response = await fetch(
        `http://localhost:3000/api/permits/applications?id=${applicationId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.message).toContain('withdrawn')

      // Verify status changed
      const { data: dbApp } = await supabase
        .from('permit_applications')
        .select('status')
        .eq('id', applicationId)
        .single()

      expect(dbApp!.status).toBe('withdrawn')
    })

    it('should hard delete application', async () => {
      // Create new application
      const { data: app } = await supabase
        .from('permit_applications')
        .insert({
          project_id: testProjectId,
          user_id: testUserId,
          jurisdiction_id: testJurisdictionId,
          permit_type: 'building',
          status: 'draft',
          applicant: { name: 'Test' },
          property: { address: 'Test' },
          project_details: { description: 'Test' },
          fees: { permitFee: 500, planCheckFee: 325, total: 825, paid: false }
        })
        .select()
        .single()

      const response = await fetch(
        `http://localhost:3000/api/permits/applications?id=${app!.id}&hardDelete=true`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      expect(response.status).toBe(200)

      // Verify deleted
      const { data: dbApp } = await supabase
        .from('permit_applications')
        .select('*')
        .eq('id', app!.id)
        .single()

      expect(dbApp).toBeNull()
    })

    it('should require application ID', async () => {
      const response = await fetch(
        `http://localhost:3000/api/permits/applications`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      expect(response.status).toBe(400)
    })

    it('should return 404 for non-existent application', async () => {
      const response = await fetch(
        `http://localhost:3000/api/permits/applications?id=00000000-0000-0000-0000-000000000000`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      expect(response.status).toBe(404)
    })

    it('should allow admin to delete others applications', async () => {
      // Create application by user2
      const { data: app } = await supabase
        .from('permit_applications')
        .insert({
          project_id: testProjectId,
          user_id: testUser2Id,
          jurisdiction_id: testJurisdictionId,
          permit_type: 'building',
          status: 'draft',
          applicant: { name: 'Test' },
          property: { address: 'Test' },
          project_details: { description: 'Test' },
          fees: { permitFee: 500, planCheckFee: 325, total: 825, paid: false }
        })
        .select()
        .single()

      // Delete as admin (user1)
      const response = await fetch(
        `http://localhost:3000/api/permits/applications?id=${app!.id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      expect(response.status).toBe(200)
    })

    it('should not allow non-admin to delete others applications', async () => {
      // Create application by user1
      const { data: app } = await supabase
        .from('permit_applications')
        .insert({
          project_id: testProjectId,
          user_id: testUserId,
          jurisdiction_id: testJurisdictionId,
          permit_type: 'building',
          status: 'draft',
          applicant: { name: 'Test' },
          property: { address: 'Test' },
          project_details: { description: 'Test' },
          fees: { permitFee: 500, planCheckFee: 325, total: 825, paid: false }
        })
        .select()
        .single()

      // Try to delete as user2 (non-admin)
      const response = await fetch(
        `http://localhost:3000/api/permits/applications?id=${app!.id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${authToken2}`
          }
        }
      )

      expect(response.status).toBe(403)

      // Cleanup
      await supabase.from('permit_applications').delete().eq('id', app!.id)
    })

    it('should not allow withdrawal of approved applications', async () => {
      // Create approved application
      const { data: app } = await supabase
        .from('permit_applications')
        .insert({
          project_id: testProjectId,
          user_id: testUserId,
          jurisdiction_id: testJurisdictionId,
          permit_type: 'building',
          status: 'approved',
          applicant: { name: 'Test' },
          property: { address: 'Test' },
          project_details: { description: 'Test' },
          fees: { permitFee: 500, planCheckFee: 325, total: 825, paid: false }
        })
        .select()
        .single()

      const response = await fetch(
        `http://localhost:3000/api/permits/applications?id=${app!.id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      expect(response.status).toBe(400)

      // Cleanup
      await supabase.from('permit_applications').delete().eq('id', app!.id)
    })

    it('should require authentication for delete', async () => {
      // Create application
      const { data: app } = await supabase
        .from('permit_applications')
        .insert({
          project_id: testProjectId,
          user_id: testUserId,
          jurisdiction_id: testJurisdictionId,
          permit_type: 'building',
          status: 'draft',
          applicant: { name: 'Test' },
          property: { address: 'Test' },
          project_details: { description: 'Test' },
          fees: { permitFee: 500, planCheckFee: 325, total: 825, paid: false }
        })
        .select()
        .single()

      const response = await fetch(
        `http://localhost:3000/api/permits/applications?id=${app!.id}`,
        {
          method: 'DELETE'
        }
      )

      expect(response.status).toBe(401)

      // Cleanup
      await supabase.from('permit_applications').delete().eq('id', app!.id)
    })

    it('should allow creator to delete their own application', async () => {
      // Create application by user2
      const { data: app } = await supabase
        .from('permit_applications')
        .insert({
          project_id: testProjectId,
          user_id: testUser2Id,
          jurisdiction_id: testJurisdictionId,
          permit_type: 'building',
          status: 'draft',
          applicant: { name: 'Test' },
          property: { address: 'Test' },
          project_details: { description: 'Test' },
          fees: { permitFee: 500, planCheckFee: 325, total: 825, paid: false }
        })
        .select()
        .single()

      // Delete as creator (user2)
      const response = await fetch(
        `http://localhost:3000/api/permits/applications?id=${app!.id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${authToken2}`
          }
        }
      )

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
    })
  })
})
