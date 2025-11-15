/**
 * Integration Tests for Tenant Branding API
 *
 * Tests branding configuration management
 * 25 comprehensive tests
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-key'
const supabase = createClient(supabaseUrl, supabaseKey)

describe('Tenant Branding API', () => {
  let testUserId: string
  let testUser2Id: string
  let authToken: string
  let authToken2: string
  let testTenantId: string
  let testTenantId2: string

  beforeAll(async () => {
    // Create test users
    const { data: { user } } = await supabase.auth.admin.createUser({
      email: 'branding-test@example.com',
      password: 'test-password-123',
      email_confirm: true
    })

    testUserId = user!.id

    const { data: { user: user2 } } = await supabase.auth.admin.createUser({
      email: 'branding-test-2@example.com',
      password: 'test-password-123',
      email_confirm: true
    })

    testUser2Id = user2!.id

    // Sign in
    const { data: { session } } = await supabase.auth.signInWithPassword({
      email: 'branding-test@example.com',
      password: 'test-password-123'
    })

    authToken = session!.access_token

    const { data: { session: session2 } } = await supabase.auth.signInWithPassword({
      email: 'branding-test-2@example.com',
      password: 'test-password-123'
    })

    authToken2 = session2!.access_token

    // Create test tenants
    const { data: tenant1 } = await supabase
      .from('tenants')
      .insert({
        name: 'Branding Test Tenant 1',
        slug: 'branding-test-1',
        owner_id: testUserId,
        status: 'active',
        plan: 'professional'
      })
      .select()
      .single()

    testTenantId = tenant1!.id

    const { data: tenant2 } = await supabase
      .from('tenants')
      .insert({
        name: 'Branding Test Tenant 2',
        slug: 'branding-test-2',
        owner_id: testUser2Id,
        status: 'active',
        plan: 'professional'
      })
      .select()
      .single()

    testTenantId2 = tenant2!.id

    // Create default branding
    await supabase.from('tenant_branding').insert([
      {
        tenant_id: testTenantId,
        logo_url: null,
        logo_url_dark: null,
        favicon_url: null,
        primary_color: '#3b82f6',
        secondary_color: '#10b981',
        accent_color: '#f59e0b',
        font_family: 'Inter, sans-serif',
        custom_css: null
      },
      {
        tenant_id: testTenantId2,
        logo_url: null,
        logo_url_dark: null,
        favicon_url: null,
        primary_color: '#3b82f6',
        secondary_color: '#10b981',
        accent_color: '#f59e0b',
        font_family: 'Inter, sans-serif',
        custom_css: null
      }
    ])

    // Add user as tenant member
    await supabase.from('tenant_users').insert({
      tenant_id: testTenantId,
      user_id: testUserId,
      role: 'admin',
      status: 'active',
      invited_by: testUserId
    })
  })

  afterAll(async () => {
    // Cleanup
    await supabase.from('tenant_branding').delete().in('tenant_id', [testTenantId, testTenantId2])
    await supabase.from('tenant_users').delete().in('tenant_id', [testTenantId, testTenantId2])
    await supabase.from('tenants').delete().in('id', [testTenantId, testTenantId2])
    await supabase.auth.admin.deleteUser(testUserId)
    await supabase.auth.admin.deleteUser(testUser2Id)
  })

  describe('GET /api/tenants/[tenantId]/branding', () => {
    it('should get tenant branding configuration', async () => {
      const response = await fetch(
        `http://localhost:3000/api/tenants/${testTenantId}/branding`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.branding).toBeDefined()
      expect(data.tenant).toBeDefined()
      expect(data.branding.tenant_id).toBe(testTenantId)
      expect(data.branding.primary_color).toBeDefined()
    })

    it('should allow public access to branding', async () => {
      const response = await fetch(
        `http://localhost:3000/api/tenants/${testTenantId}/branding`
      )

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.branding).toBeDefined()
    })

    it('should hide custom_css for non-authenticated users', async () => {
      const response = await fetch(
        `http://localhost:3000/api/tenants/${testTenantId}/branding`
      )

      const data = await response.json()
      expect(data.branding.custom_css).toBeNull()
    })

    it('should return 404 for non-existent tenant', async () => {
      const response = await fetch(
        `http://localhost:3000/api/tenants/00000000-0000-0000-0000-000000000000/branding`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      expect(response.status).toBe(404)
    })

    it('should include tenant information', async () => {
      const response = await fetch(
        `http://localhost:3000/api/tenants/${testTenantId}/branding`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      const data = await response.json()
      expect(data.tenant.id).toBe(testTenantId)
      expect(data.tenant.name).toBeDefined()
      expect(data.tenant.slug).toBeDefined()
    })

    it('should create default branding if none exists', async () => {
      // Create a tenant without branding
      const { data: newTenant } = await supabase
        .from('tenants')
        .insert({
          name: 'No Branding Tenant',
          slug: 'no-branding-tenant',
          owner_id: testUserId,
          status: 'active',
          plan: 'starter'
        })
        .select()
        .single()

      const response = await fetch(
        `http://localhost:3000/api/tenants/${newTenant!.id}/branding`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.branding).toBeDefined()
      expect(data.branding.primary_color).toBe('#3b82f6')

      // Cleanup
      await supabase.from('tenant_branding').delete().eq('tenant_id', newTenant!.id)
      await supabase.from('tenants').delete().eq('id', newTenant!.id)
    })
  })

  describe('PUT /api/tenants/[tenantId]/branding', () => {
    it('should update primary color', async () => {
      const response = await fetch(
        `http://localhost:3000/api/tenants/${testTenantId}/branding`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            primaryColor: '#ff0000'
          })
        }
      )

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.branding.primary_color).toBe('#ff0000')
    })

    it('should update multiple colors', async () => {
      const response = await fetch(
        `http://localhost:3000/api/tenants/${testTenantId}/branding`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            primaryColor: '#1e40af',
            secondaryColor: '#059669',
            accentColor: '#dc2626'
          })
        }
      )

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.branding.primary_color).toBe('#1e40af')
      expect(data.branding.secondary_color).toBe('#059669')
      expect(data.branding.accent_color).toBe('#dc2626')
    })

    it('should update logo URLs', async () => {
      const response = await fetch(
        `http://localhost:3000/api/tenants/${testTenantId}/branding`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            logoUrl: 'https://example.com/logo.png',
            logoUrlDark: 'https://example.com/logo-dark.png',
            faviconUrl: 'https://example.com/favicon.ico'
          })
        }
      )

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.branding.logo_url).toBe('https://example.com/logo.png')
      expect(data.branding.logo_url_dark).toBe('https://example.com/logo-dark.png')
      expect(data.branding.favicon_url).toBe('https://example.com/favicon.ico')
    })

    it('should update font family', async () => {
      const response = await fetch(
        `http://localhost:3000/api/tenants/${testTenantId}/branding`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            fontFamily: 'Roboto, sans-serif'
          })
        }
      )

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.branding.font_family).toBe('Roboto, sans-serif')
    })

    it('should update custom CSS', async () => {
      const customCss = 'body { background: #fff; }'

      const response = await fetch(
        `http://localhost:3000/api/tenants/${testTenantId}/branding`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            customCss
          })
        }
      )

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.branding.custom_css).toBe(customCss)
    })

    it('should update custom domain', async () => {
      const response = await fetch(
        `http://localhost:3000/api/tenants/${testTenantId}/branding`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            customDomain: 'custom.example.com'
          })
        }
      )

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.branding.custom_domain).toBe('custom.example.com')
    })

    it('should clear logo URLs with null', async () => {
      const response = await fetch(
        `http://localhost:3000/api/tenants/${testTenantId}/branding`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            logoUrl: null
          })
        }
      )

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.branding.logo_url).toBeNull()
    })

    it('should reject update without authentication', async () => {
      const response = await fetch(
        `http://localhost:3000/api/tenants/${testTenantId}/branding`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            primaryColor: '#000000'
          })
        }
      )

      expect(response.status).toBe(401)
    })

    it('should reject update without admin access', async () => {
      const response = await fetch(
        `http://localhost:3000/api/tenants/${testTenantId2}/branding`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            primaryColor: '#000000'
          })
        }
      )

      expect(response.status).toBe(403)
    })

    it('should reject invalid hex color format', async () => {
      const response = await fetch(
        `http://localhost:3000/api/tenants/${testTenantId}/branding`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            primaryColor: 'invalid-color'
          })
        }
      )

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('Invalid primaryColor format')
    })

    it('should reject invalid URL format', async () => {
      const response = await fetch(
        `http://localhost:3000/api/tenants/${testTenantId}/branding`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            logoUrl: 'not-a-valid-url'
          })
        }
      )

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('Invalid logoUrl format')
    })

    it('should reject invalid custom domain format', async () => {
      const response = await fetch(
        `http://localhost:3000/api/tenants/${testTenantId}/branding`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            customDomain: 'invalid domain with spaces'
          })
        }
      )

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('Invalid custom domain format')
    })

    it('should reject duplicate custom domain', async () => {
      // Set custom domain on first tenant
      await fetch(
        `http://localhost:3000/api/tenants/${testTenantId}/branding`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            customDomain: 'unique-domain.com'
          })
        }
      )

      // Try to set same domain on second tenant
      const response = await fetch(
        `http://localhost:3000/api/tenants/${testTenantId2}/branding`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken2}`
          },
          body: JSON.stringify({
            customDomain: 'unique-domain.com'
          })
        }
      )

      expect(response.status).toBe(409)

      const data = await response.json()
      expect(data.error).toContain('already in use')
    })

    it('should reject custom CSS that is too large', async () => {
      const largeCss = 'a'.repeat(51000)

      const response = await fetch(
        `http://localhost:3000/api/tenants/${testTenantId}/branding`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            customCss: largeCss
          })
        }
      )

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('too large')
    })

    it('should reject font family that is too long', async () => {
      const longFont = 'a'.repeat(201)

      const response = await fetch(
        `http://localhost:3000/api/tenants/${testTenantId}/branding`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            fontFamily: longFont
          })
        }
      )

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('too long')
    })

    it('should reject empty update request', async () => {
      const response = await fetch(
        `http://localhost:3000/api/tenants/${testTenantId}/branding`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({})
        }
      )

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('At least one')
    })

    it('should accept 3-character hex colors', async () => {
      const response = await fetch(
        `http://localhost:3000/api/tenants/${testTenantId}/branding`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            primaryColor: '#fff'
          })
        }
      )

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.branding.primary_color).toBe('#fff')
    })

    it('should accept 6-character hex colors', async () => {
      const response = await fetch(
        `http://localhost:3000/api/tenants/${testTenantId}/branding`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            primaryColor: '#ffffff'
          })
        }
      )

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.branding.primary_color).toBe('#ffffff')
    })
  })
})
