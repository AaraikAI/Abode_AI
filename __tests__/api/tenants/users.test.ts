/**
 * Integration Tests for Tenant Users Management API
 *
 * Tests user invitations, role management, and removal
 * 30 comprehensive tests
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-key'
const supabase = createClient(supabaseUrl, supabaseKey)

describe('Tenant Users Management API', () => {
  let ownerUserId: string
  let adminUserId: string
  let memberUserId: string
  let outsiderUserId: string
  let ownerToken: string
  let adminToken: string
  let memberToken: string
  let outsiderToken: string
  let testTenantId: string

  beforeAll(async () => {
    // Create test users
    const { data: { user: owner } } = await supabase.auth.admin.createUser({
      email: 'tenant-owner@example.com',
      password: 'test-password-123',
      email_confirm: true
    })

    ownerUserId = owner!.id

    const { data: { user: admin } } = await supabase.auth.admin.createUser({
      email: 'tenant-admin@example.com',
      password: 'test-password-123',
      email_confirm: true
    })

    adminUserId = admin!.id

    const { data: { user: member } } = await supabase.auth.admin.createUser({
      email: 'tenant-member@example.com',
      password: 'test-password-123',
      email_confirm: true
    })

    memberUserId = member!.id

    const { data: { user: outsider } } = await supabase.auth.admin.createUser({
      email: 'tenant-outsider@example.com',
      password: 'test-password-123',
      email_confirm: true
    })

    outsiderUserId = outsider!.id

    // Sign in users
    const { data: { session: ownerSession } } = await supabase.auth.signInWithPassword({
      email: 'tenant-owner@example.com',
      password: 'test-password-123'
    })

    ownerToken = ownerSession!.access_token

    const { data: { session: adminSession } } = await supabase.auth.signInWithPassword({
      email: 'tenant-admin@example.com',
      password: 'test-password-123'
    })

    adminToken = adminSession!.access_token

    const { data: { session: memberSession } } = await supabase.auth.signInWithPassword({
      email: 'tenant-member@example.com',
      password: 'test-password-123'
    })

    memberToken = memberSession!.access_token

    const { data: { session: outsiderSession } } = await supabase.auth.signInWithPassword({
      email: 'tenant-outsider@example.com',
      password: 'test-password-123'
    })

    outsiderToken = outsiderSession!.access_token

    // Create test tenant
    const { data: tenant } = await supabase
      .from('tenants')
      .insert({
        name: 'User Management Test Tenant',
        slug: 'user-mgmt-test',
        owner_id: ownerUserId,
        status: 'active',
        plan: 'professional',
        settings: {
          max_users: 10
        }
      })
      .select()
      .single()

    testTenantId = tenant!.id

    // Add users to tenant
    await supabase.from('tenant_users').insert([
      {
        tenant_id: testTenantId,
        user_id: ownerUserId,
        role: 'admin',
        status: 'active',
        invited_by: ownerUserId
      },
      {
        tenant_id: testTenantId,
        user_id: adminUserId,
        role: 'admin',
        status: 'active',
        invited_by: ownerUserId
      },
      {
        tenant_id: testTenantId,
        user_id: memberUserId,
        role: 'member',
        status: 'active',
        invited_by: ownerUserId
      }
    ])
  })

  afterAll(async () => {
    // Cleanup
    await supabase.from('tenant_users').delete().eq('tenant_id', testTenantId)
    await supabase.from('tenants').delete().eq('id', testTenantId)
    await supabase.auth.admin.deleteUser(ownerUserId)
    await supabase.auth.admin.deleteUser(adminUserId)
    await supabase.auth.admin.deleteUser(memberUserId)
    await supabase.auth.admin.deleteUser(outsiderUserId)
  })

  describe('GET /api/tenants/[tenantId]/users', () => {
    it('should list tenant users', async () => {
      const response = await fetch(
        `http://localhost:3000/api/tenants/${testTenantId}/users`,
        {
          headers: {
            'Authorization': `Bearer ${ownerToken}`
          }
        }
      )

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.users).toBeDefined()
      expect(Array.isArray(data.users)).toBe(true)
      expect(data.users.length).toBeGreaterThan(0)
      expect(data.pagination).toBeDefined()
    })

    it('should include user details', async () => {
      const response = await fetch(
        `http://localhost:3000/api/tenants/${testTenantId}/users`,
        {
          headers: {
            'Authorization': `Bearer ${ownerToken}`
          }
        }
      )

      const data = await response.json()
      const firstUser = data.users[0]
      expect(firstUser.user).toBeDefined()
      expect(firstUser.user.id).toBeDefined()
      expect(firstUser.user.email).toBeDefined()
    })

    it('should filter users by status', async () => {
      const response = await fetch(
        `http://localhost:3000/api/tenants/${testTenantId}/users?status=active`,
        {
          headers: {
            'Authorization': `Bearer ${ownerToken}`
          }
        }
      )

      const data = await response.json()
      expect(data.users.every((u: any) => u.status === 'active')).toBe(true)
    })

    it('should filter users by role', async () => {
      const response = await fetch(
        `http://localhost:3000/api/tenants/${testTenantId}/users?role=admin`,
        {
          headers: {
            'Authorization': `Bearer ${ownerToken}`
          }
        }
      )

      const data = await response.json()
      expect(data.users.every((u: any) => u.role === 'admin')).toBe(true)
    })

    it('should search users by name or email', async () => {
      const response = await fetch(
        `http://localhost:3000/api/tenants/${testTenantId}/users?search=owner`,
        {
          headers: {
            'Authorization': `Bearer ${ownerToken}`
          }
        }
      )

      expect(response.status).toBe(200)
    })

    it('should paginate results', async () => {
      const response = await fetch(
        `http://localhost:3000/api/tenants/${testTenantId}/users?page=1&limit=2`,
        {
          headers: {
            'Authorization': `Bearer ${ownerToken}`
          }
        }
      )

      const data = await response.json()
      expect(data.users.length).toBeLessThanOrEqual(2)
      expect(data.pagination.page).toBe(1)
      expect(data.pagination.limit).toBe(2)
    })

    it('should require authentication', async () => {
      const response = await fetch(
        `http://localhost:3000/api/tenants/${testTenantId}/users`
      )

      expect(response.status).toBe(401)
    })

    it('should deny access to non-members', async () => {
      const response = await fetch(
        `http://localhost:3000/api/tenants/${testTenantId}/users`,
        {
          headers: {
            'Authorization': `Bearer ${outsiderToken}`
          }
        }
      )

      expect(response.status).toBe(403)
    })

    it('should allow members to list users', async () => {
      const response = await fetch(
        `http://localhost:3000/api/tenants/${testTenantId}/users`,
        {
          headers: {
            'Authorization': `Bearer ${memberToken}`
          }
        }
      )

      expect(response.status).toBe(200)
    })
  })

  describe('POST /api/tenants/[tenantId]/users', () => {
    it('should invite user to tenant', async () => {
      const response = await fetch(
        `http://localhost:3000/api/tenants/${testTenantId}/users`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ownerToken}`
          },
          body: JSON.stringify({
            email: 'tenant-outsider@example.com',
            role: 'viewer'
          })
        }
      )

      expect(response.status).toBe(201)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.user).toBeDefined()
      expect(data.user.role).toBe('viewer')
      expect(data.user.status).toBe('invited')
    })

    it('should default to member role if not specified', async () => {
      // Create another user to invite
      const { data: { user: newUser } } = await supabase.auth.admin.createUser({
        email: 'new-tenant-user@example.com',
        password: 'test-password-123',
        email_confirm: true
      })

      const response = await fetch(
        `http://localhost:3000/api/tenants/${testTenantId}/users`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ownerToken}`
          },
          body: JSON.stringify({
            email: 'new-tenant-user@example.com'
          })
        }
      )

      expect(response.status).toBe(201)

      const data = await response.json()
      expect(data.user.role).toBe('member')

      // Cleanup
      await supabase.from('tenant_users').delete().eq('user_id', newUser!.id)
      await supabase.auth.admin.deleteUser(newUser!.id)
    })

    it('should allow admin to invite users', async () => {
      // Create another user to invite
      const { data: { user: newUser } } = await supabase.auth.admin.createUser({
        email: 'admin-invited@example.com',
        password: 'test-password-123',
        email_confirm: true
      })

      const response = await fetch(
        `http://localhost:3000/api/tenants/${testTenantId}/users`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
          },
          body: JSON.stringify({
            email: 'admin-invited@example.com',
            role: 'viewer'
          })
        }
      )

      expect(response.status).toBe(201)

      // Cleanup
      await supabase.from('tenant_users').delete().eq('user_id', newUser!.id)
      await supabase.auth.admin.deleteUser(newUser!.id)
    })

    it('should require authentication', async () => {
      const response = await fetch(
        `http://localhost:3000/api/tenants/${testTenantId}/users`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: 'test@example.com'
          })
        }
      )

      expect(response.status).toBe(401)
    })

    it('should require admin access', async () => {
      const response = await fetch(
        `http://localhost:3000/api/tenants/${testTenantId}/users`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${memberToken}`
          },
          body: JSON.stringify({
            email: 'test@example.com'
          })
        }
      )

      expect(response.status).toBe(403)
    })

    it('should reject invalid email format', async () => {
      const response = await fetch(
        `http://localhost:3000/api/tenants/${testTenantId}/users`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ownerToken}`
          },
          body: JSON.stringify({
            email: 'invalid-email'
          })
        }
      )

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('Invalid email format')
    })

    it('should reject invalid role', async () => {
      const response = await fetch(
        `http://localhost:3000/api/tenants/${testTenantId}/users`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ownerToken}`
          },
          body: JSON.stringify({
            email: 'test@example.com',
            role: 'invalid-role'
          })
        }
      )

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('Invalid role')
    })

    it('should reject non-existent user', async () => {
      const response = await fetch(
        `http://localhost:3000/api/tenants/${testTenantId}/users`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ownerToken}`
          },
          body: JSON.stringify({
            email: 'nonexistent@example.com'
          })
        }
      )

      expect(response.status).toBe(404)

      const data = await response.json()
      expect(data.error).toContain('User not found')
    })

    it('should reject duplicate invitation', async () => {
      // Try to invite member who is already invited
      const response = await fetch(
        `http://localhost:3000/api/tenants/${testTenantId}/users`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ownerToken}`
          },
          body: JSON.stringify({
            email: 'tenant-member@example.com'
          })
        }
      )

      expect(response.status).toBe(409)

      const data = await response.json()
      expect(data.error).toContain('already')
    })

    it('should require owner to invite other owners', async () => {
      // Create user to invite as owner
      const { data: { user: newUser } } = await supabase.auth.admin.createUser({
        email: 'potential-owner@example.com',
        password: 'test-password-123',
        email_confirm: true
      })

      const response = await fetch(
        `http://localhost:3000/api/tenants/${testTenantId}/users`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}` // admin, not owner
          },
          body: JSON.stringify({
            email: 'potential-owner@example.com',
            role: 'owner'
          })
        }
      )

      expect(response.status).toBe(403)

      const data = await response.json()
      expect(data.error).toContain('owner')

      // Cleanup
      await supabase.auth.admin.deleteUser(newUser!.id)
    })
  })

  describe('PUT /api/tenants/[tenantId]/users', () => {
    it('should update user role', async () => {
      const response = await fetch(
        `http://localhost:3000/api/tenants/${testTenantId}/users`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ownerToken}`
          },
          body: JSON.stringify({
            userId: memberUserId,
            role: 'admin'
          })
        }
      )

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.user.role).toBe('admin')

      // Reset role for other tests
      await supabase
        .from('tenant_users')
        .update({ role: 'member' })
        .eq('tenant_id', testTenantId)
        .eq('user_id', memberUserId)
    })

    it('should allow admin to update roles', async () => {
      const response = await fetch(
        `http://localhost:3000/api/tenants/${testTenantId}/users`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
          },
          body: JSON.stringify({
            userId: memberUserId,
            role: 'viewer'
          })
        }
      )

      expect(response.status).toBe(200)

      // Reset
      await supabase
        .from('tenant_users')
        .update({ role: 'member' })
        .eq('tenant_id', testTenantId)
        .eq('user_id', memberUserId)
    })

    it('should require authentication', async () => {
      const response = await fetch(
        `http://localhost:3000/api/tenants/${testTenantId}/users`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId: memberUserId,
            role: 'admin'
          })
        }
      )

      expect(response.status).toBe(401)
    })

    it('should require admin access', async () => {
      const response = await fetch(
        `http://localhost:3000/api/tenants/${testTenantId}/users`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${memberToken}`
          },
          body: JSON.stringify({
            userId: adminUserId,
            role: 'member'
          })
        }
      )

      expect(response.status).toBe(403)
    })

    it('should reject invalid role', async () => {
      const response = await fetch(
        `http://localhost:3000/api/tenants/${testTenantId}/users`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ownerToken}`
          },
          body: JSON.stringify({
            userId: memberUserId,
            role: 'superuser'
          })
        }
      )

      expect(response.status).toBe(400)
    })

    it('should prevent user from modifying own role', async () => {
      const response = await fetch(
        `http://localhost:3000/api/tenants/${testTenantId}/users`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ownerToken}`
          },
          body: JSON.stringify({
            userId: ownerUserId,
            role: 'member'
          })
        }
      )

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('own role')
    })

    it('should require owner to assign owner role', async () => {
      const response = await fetch(
        `http://localhost:3000/api/tenants/${testTenantId}/users`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
          },
          body: JSON.stringify({
            userId: memberUserId,
            role: 'owner'
          })
        }
      )

      expect(response.status).toBe(403)
    })

    it('should return 404 for non-member user', async () => {
      const response = await fetch(
        `http://localhost:3000/api/tenants/${testTenantId}/users`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ownerToken}`
          },
          body: JSON.stringify({
            userId: outsiderUserId,
            role: 'member'
          })
        }
      )

      expect(response.status).toBe(404)
    })
  })

  describe('DELETE /api/tenants/[tenantId]/users', () => {
    it('should remove user from tenant', async () => {
      // Create a user to remove
      const { data: { user: removeUser } } = await supabase.auth.admin.createUser({
        email: 'to-be-removed@example.com',
        password: 'test-password-123',
        email_confirm: true
      })

      await supabase.from('tenant_users').insert({
        tenant_id: testTenantId,
        user_id: removeUser!.id,
        role: 'viewer',
        status: 'active',
        invited_by: ownerUserId
      })

      const response = await fetch(
        `http://localhost:3000/api/tenants/${testTenantId}/users?userId=${removeUser!.id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${ownerToken}`
          }
        }
      )

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)

      // Verify user was removed
      const { data: removedUser } = await supabase
        .from('tenant_users')
        .select('*')
        .eq('tenant_id', testTenantId)
        .eq('user_id', removeUser!.id)
        .single()

      expect(removedUser).toBeNull()

      // Cleanup
      await supabase.auth.admin.deleteUser(removeUser!.id)
    })

    it('should allow admin to remove users', async () => {
      // Create a user to remove
      const { data: { user: removeUser } } = await supabase.auth.admin.createUser({
        email: 'admin-removed@example.com',
        password: 'test-password-123',
        email_confirm: true
      })

      await supabase.from('tenant_users').insert({
        tenant_id: testTenantId,
        user_id: removeUser!.id,
        role: 'viewer',
        status: 'active',
        invited_by: ownerUserId
      })

      const response = await fetch(
        `http://localhost:3000/api/tenants/${testTenantId}/users?userId=${removeUser!.id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${adminToken}`
          }
        }
      )

      expect(response.status).toBe(200)

      // Cleanup
      await supabase.auth.admin.deleteUser(removeUser!.id)
    })

    it('should require authentication', async () => {
      const response = await fetch(
        `http://localhost:3000/api/tenants/${testTenantId}/users?userId=${memberUserId}`,
        {
          method: 'DELETE'
        }
      )

      expect(response.status).toBe(401)
    })

    it('should require admin access', async () => {
      const response = await fetch(
        `http://localhost:3000/api/tenants/${testTenantId}/users?userId=${adminUserId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${memberToken}`
          }
        }
      )

      expect(response.status).toBe(403)
    })

    it('should prevent user from removing themselves', async () => {
      const response = await fetch(
        `http://localhost:3000/api/tenants/${testTenantId}/users?userId=${ownerUserId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${ownerToken}`
          }
        }
      )

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('Cannot remove yourself')
    })

    it('should return 404 for non-member user', async () => {
      const response = await fetch(
        `http://localhost:3000/api/tenants/${testTenantId}/users?userId=${outsiderUserId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${ownerToken}`
          }
        }
      )

      expect(response.status).toBe(404)
    })

    it('should require userId parameter', async () => {
      const response = await fetch(
        `http://localhost:3000/api/tenants/${testTenantId}/users`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${ownerToken}`
          }
        }
      )

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('userId')
    })
  })
})
