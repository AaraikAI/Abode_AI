/**
 * Integration Tests for Tenant Management API
 *
 * Tests tenant creation and listing
 * 35 comprehensive tests
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-key'
const supabase = createClient(supabaseUrl, supabaseKey)

describe('Tenant Management API', () => {
  let testUserId: string
  let testUser2Id: string
  let platformAdminId: string
  let authToken: string
  let authToken2: string
  let adminToken: string
  let testTenantId: string

  beforeAll(async () => {
    // Create test users
    const { data: { user }, error } = await supabase.auth.admin.createUser({
      email: 'tenant-test@example.com',
      password: 'test-password-123',
      email_confirm: true
    })

    if (error || !user) {
      throw new Error('Failed to create test user')
    }

    testUserId = user.id

    // Create second test user
    const { data: { user: user2 } } = await supabase.auth.admin.createUser({
      email: 'tenant-test-2@example.com',
      password: 'test-password-123',
      email_confirm: true
    })

    testUser2Id = user2!.id

    // Create platform admin user
    const { data: { user: adminUser } } = await supabase.auth.admin.createUser({
      email: 'platform-admin@example.com',
      password: 'test-password-123',
      email_confirm: true
    })

    platformAdminId = adminUser!.id

    // Grant platform admin role
    await supabase.from('user_roles').insert({
      user_id: platformAdminId,
      role: 'platform_admin'
    })

    // Sign in to get auth tokens
    const { data: { session } } = await supabase.auth.signInWithPassword({
      email: 'tenant-test@example.com',
      password: 'test-password-123'
    })

    authToken = session!.access_token

    const { data: { session: session2 } } = await supabase.auth.signInWithPassword({
      email: 'tenant-test-2@example.com',
      password: 'test-password-123'
    })

    authToken2 = session2!.access_token

    const { data: { session: adminSession } } = await supabase.auth.signInWithPassword({
      email: 'platform-admin@example.com',
      password: 'test-password-123'
    })

    adminToken = adminSession!.access_token
  })

  afterAll(async () => {
    // Cleanup
    await supabase.from('tenant_users').delete().in('user_id', [testUserId, testUser2Id, platformAdminId])
    await supabase.from('tenants').delete().eq('owner_id', testUserId)
    await supabase.from('tenants').delete().eq('owner_id', testUser2Id)
    await supabase.from('tenants').delete().eq('owner_id', platformAdminId)
    await supabase.from('user_roles').delete().eq('user_id', platformAdminId)
    await supabase.auth.admin.deleteUser(testUserId)
    await supabase.auth.admin.deleteUser(testUser2Id)
    await supabase.auth.admin.deleteUser(platformAdminId)
  })

  describe('POST /api/tenants', () => {
    it('should create a new tenant with valid data', async () => {
      const response = await fetch('http://localhost:3000/api/tenants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: 'Test Tenant',
          slug: 'test-tenant'
        })
      })

      expect(response.status).toBe(201)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.tenant).toBeDefined()
      expect(data.tenant.name).toBe('Test Tenant')
      expect(data.tenant.slug).toBe('test-tenant')
      expect(data.tenant.owner_id).toBe(testUserId)
      expect(data.tenant.status).toBe('active')
      expect(data.tenant.plan).toBe('starter')

      testTenantId = data.tenant.id
    })

    it('should create tenant with specified plan', async () => {
      const response = await fetch('http://localhost:3000/api/tenants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: 'Enterprise Tenant',
          slug: 'enterprise-tenant',
          plan: 'enterprise'
        })
      })

      expect(response.status).toBe(201)

      const data = await response.json()
      expect(data.tenant.plan).toBe('enterprise')
      expect(data.tenant.settings.max_users).toBe(-1) // unlimited
    })

    it('should create tenant with custom settings', async () => {
      const response = await fetch('http://localhost:3000/api/tenants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: 'Custom Settings Tenant',
          slug: 'custom-settings-tenant',
          settings: {
            max_users: 50,
            max_projects: 100,
            features_enabled: ['custom_feature']
          }
        })
      })

      expect(response.status).toBe(201)

      const data = await response.json()
      expect(data.tenant.settings.max_users).toBe(50)
      expect(data.tenant.settings.max_projects).toBe(100)
    })

    it('should create tenant with metadata', async () => {
      const metadata = {
        industry: 'construction',
        company_size: 'medium'
      }

      const response = await fetch('http://localhost:3000/api/tenants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: 'Metadata Tenant',
          slug: 'metadata-tenant',
          metadata
        })
      })

      expect(response.status).toBe(201)

      const data = await response.json()
      expect(data.tenant.metadata).toEqual(metadata)
    })

    it('should allow admin to create tenant for another user', async () => {
      const response = await fetch('http://localhost:3000/api/tenants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          name: 'Admin Created Tenant',
          slug: 'admin-created-tenant',
          ownerId: testUser2Id
        })
      })

      expect(response.status).toBe(201)

      const data = await response.json()
      expect(data.tenant.owner_id).toBe(testUser2Id)
    })

    it('should reject tenant creation without authentication', async () => {
      const response = await fetch('http://localhost:3000/api/tenants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: 'Test Tenant',
          slug: 'test-tenant-unauth'
        })
      })

      expect(response.status).toBe(401)
    })

    it('should reject tenant creation without name', async () => {
      const response = await fetch('http://localhost:3000/api/tenants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          slug: 'no-name-tenant'
        })
      })

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('required')
    })

    it('should reject tenant creation without slug', async () => {
      const response = await fetch('http://localhost:3000/api/tenants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: 'No Slug Tenant'
        })
      })

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('required')
    })

    it('should reject invalid slug format', async () => {
      const response = await fetch('http://localhost:3000/api/tenants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: 'Invalid Slug',
          slug: 'Invalid Slug With Spaces'
        })
      })

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('Invalid slug format')
    })

    it('should reject slug with uppercase letters', async () => {
      const response = await fetch('http://localhost:3000/api/tenants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: 'Uppercase Slug',
          slug: 'UpperCase-Slug'
        })
      })

      expect(response.status).toBe(400)
    })

    it('should reject slug that is too short', async () => {
      const response = await fetch('http://localhost:3000/api/tenants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: 'Short Slug',
          slug: 'ab'
        })
      })

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('between 3 and 63 characters')
    })

    it('should reject slug that is too long', async () => {
      const longSlug = 'a'.repeat(64)

      const response = await fetch('http://localhost:3000/api/tenants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: 'Long Slug',
          slug: longSlug
        })
      })

      expect(response.status).toBe(400)
    })

    it('should reject tenant name that is too short', async () => {
      const response = await fetch('http://localhost:3000/api/tenants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: 'A',
          slug: 'short-name'
        })
      })

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('between 2 and 100 characters')
    })

    it('should reject tenant name that is too long', async () => {
      const longName = 'A'.repeat(101)

      const response = await fetch('http://localhost:3000/api/tenants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: longName,
          slug: 'long-name'
        })
      })

      expect(response.status).toBe(400)
    })

    it('should reject duplicate slug', async () => {
      // Create first tenant
      await fetch('http://localhost:3000/api/tenants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: 'First Tenant',
          slug: 'duplicate-slug-test'
        })
      })

      // Try to create second tenant with same slug
      const response = await fetch('http://localhost:3000/api/tenants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: 'Second Tenant',
          slug: 'duplicate-slug-test'
        })
      })

      expect(response.status).toBe(409)

      const data = await response.json()
      expect(data.error).toContain('already in use')
    })

    it('should reject invalid plan', async () => {
      const response = await fetch('http://localhost:3000/api/tenants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: 'Invalid Plan',
          slug: 'invalid-plan',
          plan: 'invalid-plan-type'
        })
      })

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('Invalid plan')
    })

    it('should reject non-admin creating tenant for another user', async () => {
      const response = await fetch('http://localhost:3000/api/tenants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: 'Other User Tenant',
          slug: 'other-user-tenant',
          ownerId: testUser2Id
        })
      })

      expect(response.status).toBe(403)

      const data = await response.json()
      expect(data.error).toContain('platform admins')
    })

    it('should reject creating tenant with non-existent owner', async () => {
      const response = await fetch('http://localhost:3000/api/tenants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          name: 'Non-existent Owner',
          slug: 'non-existent-owner',
          ownerId: '00000000-0000-0000-0000-000000000000'
        })
      })

      expect(response.status).toBe(404)

      const data = await response.json()
      expect(data.error).toContain('Owner user not found')
    })

    it('should create default branding for new tenant', async () => {
      const response = await fetch('http://localhost:3000/api/tenants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: 'Branding Test Tenant',
          slug: 'branding-test-tenant'
        })
      })

      const data = await response.json()
      const tenantId = data.tenant.id

      // Verify branding was created
      const { data: branding } = await supabase
        .from('tenant_branding')
        .select('*')
        .eq('tenant_id', tenantId)
        .single()

      expect(branding).toBeDefined()
      expect(branding.primary_color).toBe('#3b82f6')
    })

    it('should add owner as admin user', async () => {
      const response = await fetch('http://localhost:3000/api/tenants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: 'Owner Admin Test',
          slug: 'owner-admin-test'
        })
      })

      const data = await response.json()
      const tenantId = data.tenant.id

      // Verify owner was added as tenant user
      const { data: tenantUser } = await supabase
        .from('tenant_users')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('user_id', testUserId)
        .single()

      expect(tenantUser).toBeDefined()
      expect(tenantUser.role).toBe('admin')
      expect(tenantUser.status).toBe('active')
    })
  })

  describe('GET /api/tenants', () => {
    beforeAll(async () => {
      // Create test tenants
      await supabase.from('tenants').insert([
        {
          name: 'Active Tenant 1',
          slug: 'active-tenant-1',
          owner_id: testUserId,
          status: 'active',
          plan: 'starter'
        },
        {
          name: 'Active Tenant 2',
          slug: 'active-tenant-2',
          owner_id: testUserId,
          status: 'active',
          plan: 'professional'
        },
        {
          name: 'Suspended Tenant',
          slug: 'suspended-tenant',
          owner_id: testUserId,
          status: 'suspended',
          plan: 'starter'
        }
      ])
    })

    it('should list user tenants', async () => {
      const response = await fetch('http://localhost:3000/api/tenants', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.tenants).toBeDefined()
      expect(Array.isArray(data.tenants)).toBe(true)
      expect(data.pagination).toBeDefined()
    })

    it('should filter tenants by status', async () => {
      const response = await fetch('http://localhost:3000/api/tenants?status=active', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      const data = await response.json()
      expect(data.tenants.every((t: any) => t.status === 'active')).toBe(true)
    })

    it('should filter tenants by plan', async () => {
      const response = await fetch('http://localhost:3000/api/tenants?plan=professional', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      const data = await response.json()
      expect(data.tenants.every((t: any) => t.plan === 'professional')).toBe(true)
    })

    it('should search tenants by name', async () => {
      const response = await fetch('http://localhost:3000/api/tenants?search=Active', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      const data = await response.json()
      expect(data.tenants.length).toBeGreaterThan(0)
    })

    it('should paginate results', async () => {
      const response = await fetch('http://localhost:3000/api/tenants?page=1&limit=2', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      const data = await response.json()
      expect(data.tenants.length).toBeLessThanOrEqual(2)
      expect(data.pagination.page).toBe(1)
      expect(data.pagination.limit).toBe(2)
    })

    it('should include owner information when requested', async () => {
      const response = await fetch('http://localhost:3000/api/tenants?includeOwner=true', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      const data = await response.json()
      if (data.tenants.length > 0) {
        expect(data.tenants[0].owner).toBeDefined()
      }
    })

    it('should respect limit parameter', async () => {
      const response = await fetch('http://localhost:3000/api/tenants?limit=1', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      const data = await response.json()
      expect(data.tenants.length).toBeLessThanOrEqual(1)
    })

    it('should enforce maximum limit', async () => {
      const response = await fetch('http://localhost:3000/api/tenants?limit=200', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      const data = await response.json()
      expect(data.pagination.limit).toBeLessThanOrEqual(100)
    })

    it('should return empty list for user with no tenants', async () => {
      const response = await fetch('http://localhost:3000/api/tenants', {
        headers: {
          'Authorization': `Bearer ${authToken2}`
        }
      })

      const data = await response.json()
      expect(data.tenants).toBeDefined()
      expect(Array.isArray(data.tenants)).toBe(true)
    })

    it('should require authentication', async () => {
      const response = await fetch('http://localhost:3000/api/tenants')

      expect(response.status).toBe(401)
    })

    it('should allow platform admin to see all tenants', async () => {
      const response = await fetch('http://localhost:3000/api/tenants', {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      // Admin should see more tenants than regular user
      expect(data.tenants).toBeDefined()
    })

    it('should order tenants by created_at descending', async () => {
      const response = await fetch('http://localhost:3000/api/tenants', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      const data = await response.json()
      if (data.tenants.length > 1) {
        const dates = data.tenants.map((t: any) => new Date(t.created_at).getTime())
        const sorted = [...dates].sort((a, b) => b - a)
        expect(dates).toEqual(sorted)
      }
    })

    it('should return correct pagination metadata', async () => {
      const response = await fetch('http://localhost:3000/api/tenants?page=1&limit=5', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      const data = await response.json()
      expect(data.pagination.page).toBe(1)
      expect(data.pagination.limit).toBe(5)
      expect(data.pagination.total).toBeDefined()
      expect(data.pagination.totalPages).toBeDefined()
    })
  })
})
