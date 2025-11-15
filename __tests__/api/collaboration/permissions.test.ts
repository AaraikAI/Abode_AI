/**
 * Integration Tests for Collaboration Permissions API
 *
 * Tests permission granting, updating, and revoking
 * 25 comprehensive tests
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-key'
const supabase = createClient(supabaseUrl, supabaseKey)

describe('Collaboration Permissions API', () => {
  let testUserId: string
  let testUser2Id: string
  let testUser3Id: string
  let testOrgId: string
  let testProjectId: string
  let testTeamId: string
  let authToken: string
  let authToken2: string

  beforeAll(async () => {
    // Create test users
    const { data: { user }, error } = await supabase.auth.admin.createUser({
      email: 'permissions-test@example.com',
      password: 'test-password-123',
      email_confirm: true
    })

    if (error || !user) {
      throw new Error('Failed to create test user')
    }

    testUserId = user.id

    const { data: { user: user2 } } = await supabase.auth.admin.createUser({
      email: 'permissions-test-2@example.com',
      password: 'test-password-123',
      email_confirm: true
    })

    testUser2Id = user2!.id

    const { data: { user: user3 } } = await supabase.auth.admin.createUser({
      email: 'permissions-test-3@example.com',
      password: 'test-password-123',
      email_confirm: true
    })

    testUser3Id = user3!.id

    // Sign in to get auth tokens
    const { data: { session } } = await supabase.auth.signInWithPassword({
      email: 'permissions-test@example.com',
      password: 'test-password-123'
    })

    authToken = session!.access_token

    const { data: { session: session2 } } = await supabase.auth.signInWithPassword({
      email: 'permissions-test-2@example.com',
      password: 'test-password-123'
    })

    authToken2 = session2!.access_token

    // Create test organization
    const { data: org } = await supabase
      .from('organizations')
      .insert({ name: 'Test Permissions Org' })
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
        },
        {
          organization_id: testOrgId,
          user_id: testUser3Id,
          role: 'member'
        }
      ])

    // Create test project
    const { data: project } = await supabase
      .from('projects')
      .insert({
        org_id: testOrgId,
        name: 'Test Permissions Project',
        user_id: testUserId
      })
      .select()
      .single()

    testProjectId = project!.id

    // Create test team
    const { data: team } = await supabase
      .from('teams')
      .insert({
        org_id: testOrgId,
        name: 'Test Team',
        created_by: testUserId
      })
      .select()
      .single()

    testTeamId = team!.id
  })

  afterAll(async () => {
    // Cleanup
    await supabase.from('permissions').delete().eq('resource_id', testProjectId)
    await supabase.from('teams').delete().eq('id', testTeamId)
    await supabase.from('projects').delete().eq('id', testProjectId)
    await supabase.from('organization_members').delete().eq('organization_id', testOrgId)
    await supabase.from('organizations').delete().eq('id', testOrgId)
    await supabase.auth.admin.deleteUser(testUserId)
    await supabase.auth.admin.deleteUser(testUser2Id)
    await supabase.auth.admin.deleteUser(testUser3Id)
  })

  describe('POST /api/collaboration/permissions', () => {
    it('should grant read permission to user', async () => {
      const response = await fetch(`http://localhost:3000/api/collaboration/permissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          resourceId: testProjectId,
          resourceType: 'project',
          granteeType: 'user',
          granteeId: testUser2Id,
          permissions: ['read']
        })
      })

      expect(response.status).toBe(201)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.permission).toBeDefined()
      expect(data.permission.permissions).toEqual(['read'])
      expect(data.permission.grantee_id).toBe(testUser2Id)
      expect(data.permission.status).toBe('active')
    })

    it('should grant multiple permissions to user', async () => {
      const response = await fetch(`http://localhost:3000/api/collaboration/permissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          resourceId: testProjectId,
          resourceType: 'project',
          granteeType: 'user',
          granteeId: testUser3Id,
          permissions: ['read', 'write', 'share']
        })
      })

      expect(response.status).toBe(201)

      const data = await response.json()
      expect(data.permission.permissions).toEqual(['read', 'write', 'share'])
    })

    it('should grant permission to team', async () => {
      const response = await fetch(`http://localhost:3000/api/collaboration/permissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          resourceId: testProjectId,
          resourceType: 'project',
          granteeType: 'team',
          granteeId: testTeamId,
          permissions: ['read', 'write']
        })
      })

      expect(response.status).toBe(201)

      const data = await response.json()
      expect(data.permission.grantee_type).toBe('team')
      expect(data.permission.grantee_id).toBe(testTeamId)
    })

    it('should grant public permission', async () => {
      const response = await fetch(`http://localhost:3000/api/collaboration/permissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          resourceId: testProjectId,
          resourceType: 'project',
          granteeType: 'public',
          permissions: ['read']
        })
      })

      expect(response.status).toBe(201)

      const data = await response.json()
      expect(data.permission.grantee_type).toBe('public')
      expect(data.permission.grantee_id).toBeUndefined()
    })

    it('should grant permission with expiration', async () => {
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7) // 7 days from now

      const response = await fetch(`http://localhost:3000/api/collaboration/permissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          resourceId: testProjectId,
          resourceType: 'project',
          granteeType: 'organization',
          granteeId: testOrgId,
          permissions: ['read'],
          expiresAt: expiresAt.toISOString()
        })
      })

      expect(response.status).toBe(201)

      const data = await response.json()
      expect(data.permission.expires_at).toBeDefined()
    })

    it('should grant permission with conditions', async () => {
      const conditions = {
        ip_whitelist: ['192.168.1.0/24'],
        time_restrictions: {
          start_time: '09:00',
          end_time: '17:00',
          days_of_week: [1, 2, 3, 4, 5]
        },
        requires_mfa: true
      }

      const response = await fetch(`http://localhost:3000/api/collaboration/permissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          resourceId: testProjectId,
          resourceType: 'project',
          granteeType: 'user',
          granteeId: testUser2Id,
          permissions: ['admin'],
          conditions
        })
      })

      expect(response.status).toBe(201)

      const data = await response.json()
      expect(data.permission.conditions).toEqual(conditions)
    })

    it('should reject permission without required fields', async () => {
      const response = await fetch(`http://localhost:3000/api/collaboration/permissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          resourceId: testProjectId,
          resourceType: 'project'
          // Missing granteeType and permissions
        })
      })

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('required')
    })

    it('should reject empty permissions array', async () => {
      const response = await fetch(`http://localhost:3000/api/collaboration/permissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          resourceId: testProjectId,
          resourceType: 'project',
          granteeType: 'user',
          granteeId: testUser2Id,
          permissions: []
        })
      })

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('At least one permission')
    })

    it('should reject invalid permission values', async () => {
      const response = await fetch(`http://localhost:3000/api/collaboration/permissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          resourceId: testProjectId,
          resourceType: 'project',
          granteeType: 'user',
          granteeId: testUser2Id,
          permissions: ['read', 'invalid-permission']
        })
      })

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('Invalid permissions')
    })

    it('should reject user not in organization', async () => {
      // Create user not in org
      const { data: { user: outsider } } = await supabase.auth.admin.createUser({
        email: 'outsider-perm@example.com',
        password: 'test-password-123',
        email_confirm: true
      })

      const response = await fetch(`http://localhost:3000/api/collaboration/permissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          resourceId: testProjectId,
          resourceType: 'project',
          granteeType: 'user',
          granteeId: outsider!.id,
          permissions: ['read']
        })
      })

      expect(response.status).toBe(404)

      // Cleanup
      await supabase.auth.admin.deleteUser(outsider!.id)
    })

    it('should reject permission with past expiration date', async () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 1)

      const response = await fetch(`http://localhost:3000/api/collaboration/permissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          resourceId: testProjectId,
          resourceType: 'project',
          granteeType: 'user',
          granteeId: testUser2Id,
          permissions: ['read'],
          expiresAt: pastDate.toISOString()
        })
      })

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('must be in the future')
    })

    it('should reject duplicate active permission', async () => {
      // Grant permission
      await fetch(`http://localhost:3000/api/collaboration/permissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          resourceId: testProjectId,
          resourceType: 'project',
          granteeType: 'user',
          granteeId: testUser2Id,
          permissions: ['delete']
        })
      })

      // Try to grant again
      const response = await fetch(`http://localhost:3000/api/collaboration/permissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          resourceId: testProjectId,
          resourceType: 'project',
          granteeType: 'user',
          granteeId: testUser2Id,
          permissions: ['delete']
        })
      })

      expect(response.status).toBe(409)

      const data = await response.json()
      expect(data.error).toContain('already exists')
    })

    it('should deny non-admin from granting permissions', async () => {
      const response = await fetch(`http://localhost:3000/api/collaboration/permissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken2}` // non-admin user
        },
        body: JSON.stringify({
          resourceId: testProjectId,
          resourceType: 'project',
          granteeType: 'user',
          granteeId: testUser3Id,
          permissions: ['read']
        })
      })

      expect(response.status).toBe(403)
    })
  })

  describe('GET /api/collaboration/permissions', () => {
    let permissionId: string

    beforeAll(async () => {
      // Create test permissions
      const { data: permission } = await supabase
        .from('permissions')
        .insert({
          resource_id: testProjectId,
          resource_type: 'project',
          grantee_type: 'user',
          grantee_id: testUser2Id,
          permissions: ['read', 'write'],
          granted_by: testUserId,
          status: 'active'
        })
        .select()
        .single()

      permissionId = permission!.id
    })

    it('should list permissions for a resource', async () => {
      const response = await fetch(
        `http://localhost:3000/api/collaboration/permissions?resourceId=${testProjectId}&resourceType=project`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.permissions).toBeDefined()
      expect(Array.isArray(data.permissions)).toBe(true)
      expect(data.permissions.length).toBeGreaterThan(0)
    })

    it('should filter by grantee type', async () => {
      const response = await fetch(
        `http://localhost:3000/api/collaboration/permissions?resourceId=${testProjectId}&resourceType=project&granteeType=user`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      const data = await response.json()
      expect(data.permissions.every((p: any) => p.grantee_type === 'user')).toBe(true)
    })

    it('should filter by grantee ID', async () => {
      const response = await fetch(
        `http://localhost:3000/api/collaboration/permissions?resourceId=${testProjectId}&resourceType=project&granteeId=${testUser2Id}`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      const data = await response.json()
      expect(data.permissions.every((p: any) => p.grantee_id === testUser2Id)).toBe(true)
    })

    it('should include grantee information', async () => {
      const response = await fetch(
        `http://localhost:3000/api/collaboration/permissions?resourceId=${testProjectId}&resourceType=project`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      const data = await response.json()
      const userPermission = data.permissions.find((p: any) => p.grantee_type === 'user')
      if (userPermission) {
        expect(userPermission.grantee).toBeDefined()
        expect(userPermission.grantee.id).toBeDefined()
      }
    })

    it('should detect and mark expired permissions', async () => {
      // Create expired permission
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 1)

      await supabase
        .from('permissions')
        .insert({
          resource_id: testProjectId,
          resource_type: 'project',
          grantee_type: 'user',
          grantee_id: testUser3Id,
          permissions: ['read'],
          granted_by: testUserId,
          expires_at: pastDate.toISOString(),
          status: 'active'
        })

      const response = await fetch(
        `http://localhost:3000/api/collaboration/permissions?resourceId=${testProjectId}&resourceType=project`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      const data = await response.json()
      const expiredPerm = data.permissions.find((p: any) =>
        p.grantee_id === testUser3Id && p.expires_at < new Date().toISOString()
      )

      if (expiredPerm) {
        expect(expiredPerm.status).toBe('expired')
      }
    })

    it('should require resourceId and resourceType', async () => {
      const response = await fetch(
        `http://localhost:3000/api/collaboration/permissions`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      expect(response.status).toBe(400)
    })

    it('should deny non-admin from viewing permissions', async () => {
      const response = await fetch(
        `http://localhost:3000/api/collaboration/permissions?resourceId=${testProjectId}&resourceType=project`,
        {
          headers: {
            'Authorization': `Bearer ${authToken2}`
          }
        }
      )

      expect(response.status).toBe(403)
    })
  })

  describe('PUT /api/collaboration/permissions', () => {
    let permissionId: string

    beforeAll(async () => {
      const { data: permission } = await supabase
        .from('permissions')
        .insert({
          resource_id: testProjectId,
          resource_type: 'project',
          grantee_type: 'user',
          grantee_id: testUser2Id,
          permissions: ['read'],
          granted_by: testUserId,
          status: 'active'
        })
        .select()
        .single()

      permissionId = permission!.id
    })

    it('should update permission levels', async () => {
      const response = await fetch(`http://localhost:3000/api/collaboration/permissions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          id: permissionId,
          permissions: ['read', 'write', 'delete']
        })
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.permission.permissions).toEqual(['read', 'write', 'delete'])
    })

    it('should update expiration date', async () => {
      const newExpiry = new Date()
      newExpiry.setDate(newExpiry.getDate() + 30)

      const response = await fetch(`http://localhost:3000/api/collaboration/permissions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          id: permissionId,
          expiresAt: newExpiry.toISOString()
        })
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.permission.expires_at).toBeDefined()
    })

    it('should update conditions', async () => {
      const newConditions = {
        requires_mfa: true,
        ip_whitelist: ['10.0.0.0/8']
      }

      const response = await fetch(`http://localhost:3000/api/collaboration/permissions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          id: permissionId,
          conditions: newConditions
        })
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.permission.conditions).toEqual(newConditions)
    })

    it('should reject update without permission ID', async () => {
      const response = await fetch(`http://localhost:3000/api/collaboration/permissions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          permissions: ['read']
        })
      })

      expect(response.status).toBe(400)
    })

    it('should return 404 for non-existent permission', async () => {
      const response = await fetch(`http://localhost:3000/api/collaboration/permissions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          id: '00000000-0000-0000-0000-000000000000',
          permissions: ['read']
        })
      })

      expect(response.status).toBe(404)
    })
  })

  describe('DELETE /api/collaboration/permissions', () => {
    it('should soft delete (revoke) permission', async () => {
      // Create permission
      const { data: permission } = await supabase
        .from('permissions')
        .insert({
          resource_id: testProjectId,
          resource_type: 'project',
          grantee_type: 'user',
          grantee_id: testUser2Id,
          permissions: ['read'],
          granted_by: testUserId,
          status: 'active'
        })
        .select()
        .single()

      const response = await fetch(
        `http://localhost:3000/api/collaboration/permissions?id=${permission!.id}`,
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

      // Verify status changed
      const { data: revokedPerm } = await supabase
        .from('permissions')
        .select('status')
        .eq('id', permission!.id)
        .single()

      expect(revokedPerm!.status).toBe('revoked')
    })

    it('should hard delete permission permanently', async () => {
      // Create permission
      const { data: permission } = await supabase
        .from('permissions')
        .insert({
          resource_id: testProjectId,
          resource_type: 'project',
          grantee_type: 'user',
          grantee_id: testUser2Id,
          permissions: ['read'],
          granted_by: testUserId,
          status: 'active'
        })
        .select()
        .single()

      const response = await fetch(
        `http://localhost:3000/api/collaboration/permissions?id=${permission!.id}&hardDelete=true`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      expect(response.status).toBe(200)

      // Verify deleted
      const { data: deletedPerm } = await supabase
        .from('permissions')
        .select('*')
        .eq('id', permission!.id)
        .single()

      expect(deletedPerm).toBeNull()
    })

    it('should require permission ID', async () => {
      const response = await fetch(
        `http://localhost:3000/api/collaboration/permissions`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      expect(response.status).toBe(400)
    })
  })
})
