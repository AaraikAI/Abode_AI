/**
 * Integration Tests for Partner Sync API
 *
 * Tests partner catalog sync and webhook handling
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-key'
const supabase = createClient(supabaseUrl, supabaseKey)

describe('Partner Sync API', () => {
  let testUserId: string
  let testOrgId: string
  let testPartnerId: string
  let authToken: string
  const webhookSecret = 'test-webhook-secret-123'

  beforeAll(async () => {
    // Create test user
    const { data: { user }, error } = await supabase.auth.admin.createUser({
      email: 'partner-sync-test@example.com',
      password: 'test-password-123',
      email_confirm: true
    })

    if (error || !user) {
      throw new Error('Failed to create test user')
    }

    testUserId = user.id

    // Sign in to get auth token
    const { data: { session } } = await supabase.auth.signInWithPassword({
      email: 'partner-sync-test@example.com',
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
        name: 'Test Partner Sync Org'
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

    // Create test partner
    const { data: partner } = await supabase
      .from('partners')
      .insert({
        name: 'Test Partner',
        webhook_secret: webhookSecret
      })
      .select()
      .single()

    testPartnerId = partner!.id

    // Create partner integration
    await supabase
      .from('partner_integrations')
      .insert({
        partner_id: testPartnerId,
        org_id: testOrgId,
        enabled: true,
        config: {}
      })
  })

  afterAll(async () => {
    // Cleanup
    await supabase.from('partner_webhook_events').delete().eq('partner_id', testPartnerId)
    await supabase.from('partner_products').delete().eq('partner_id', testPartnerId)
    await supabase.from('partner_syncs').delete().eq('partner_id', testPartnerId)
    await supabase.from('partner_integrations').delete().eq('partner_id', testPartnerId)
    await supabase.from('partners').delete().eq('id', testPartnerId)
    await supabase.from('organization_members').delete().eq('organization_id', testOrgId)
    await supabase.from('organizations').delete().eq('id', testOrgId)
    await supabase.auth.admin.deleteUser(testUserId)
  })

  describe('POST /api/partners/sync - Sync', () => {
    it('should create a full catalog sync', async () => {
      const response = await fetch(`http://localhost:3000/api/partners/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          partnerId: testPartnerId,
          syncType: 'full'
        })
      })

      expect(response.status).toBe(202)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.syncId).toBeDefined()
      expect(data.status).toBe('pending')
    })

    it('should create a catalog-only sync', async () => {
      const response = await fetch(`http://localhost:3000/api/partners/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          partnerId: testPartnerId,
          syncType: 'catalog',
          options: {
            forceRefresh: true,
            categories: ['furniture', 'lighting']
          }
        })
      })

      expect(response.status).toBe(202)

      const data = await response.json()
      expect(data.success).toBe(true)

      // Verify sync record
      const { data: sync } = await supabase
        .from('partner_syncs')
        .select('*')
        .eq('id', data.syncId)
        .single()

      expect(sync).toBeDefined()
      expect(sync!.sync_type).toBe('catalog')
      expect(sync!.options.forceRefresh).toBe(true)
    })

    it('should create an inventory sync', async () => {
      const response = await fetch(`http://localhost:3000/api/partners/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          partnerId: testPartnerId,
          syncType: 'inventory'
        })
      })

      expect(response.status).toBe(202)

      const data = await response.json()
      expect(data.success).toBe(true)
    })

    it('should validate required fields', async () => {
      const response = await fetch(`http://localhost:3000/api/partners/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          syncType: 'catalog'
          // Missing partnerId
        })
      })

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('required')
    })

    it('should reject sync for disabled integration', async () => {
      // Disable integration
      await supabase
        .from('partner_integrations')
        .update({ enabled: false })
        .eq('partner_id', testPartnerId)
        .eq('org_id', testOrgId)

      const response = await fetch(`http://localhost:3000/api/partners/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          partnerId: testPartnerId,
          syncType: 'catalog'
        })
      })

      expect(response.status).toBe(404)

      // Re-enable integration
      await supabase
        .from('partner_integrations')
        .update({ enabled: true })
        .eq('partner_id', testPartnerId)
        .eq('org_id', testOrgId)
    })

    it('should require authentication for sync', async () => {
      const response = await fetch(`http://localhost:3000/api/partners/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          partnerId: testPartnerId,
          syncType: 'catalog'
        })
      })

      expect(response.status).toBe(401)
    })
  })

  describe('POST /api/partners/sync - Webhook', () => {
    function signPayload(payload: string, secret: string): string {
      const hmac = crypto.createHmac('sha256', secret)
      hmac.update(payload)
      return hmac.digest('hex')
    }

    it('should handle product created webhook', async () => {
      const payload = {
        event: 'product.created',
        partnerId: testPartnerId,
        timestamp: new Date().toISOString(),
        data: {
          id: 'ext-product-123',
          name: 'Modern Chair',
          description: 'A comfortable modern chair',
          price: 299.99,
          inventory: 50
        }
      }

      const payloadString = JSON.stringify(payload)
      const signature = signPayload(payloadString, webhookSecret)

      const response = await fetch(`http://localhost:3000/api/partners/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-partner-webhook': 'true',
          'x-partner-signature': signature
        },
        body: payloadString
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)

      // Verify product was created
      const { data: product } = await supabase
        .from('partner_products')
        .select('*')
        .eq('partner_id', testPartnerId)
        .eq('external_id', 'ext-product-123')
        .single()

      expect(product).toBeDefined()
      expect(product!.name).toBe('Modern Chair')
      expect(product!.price).toBe(299.99)
    })

    it('should handle product updated webhook', async () => {
      const payload = {
        event: 'product.updated',
        partnerId: testPartnerId,
        timestamp: new Date().toISOString(),
        data: {
          id: 'ext-product-123',
          name: 'Modern Chair - Updated',
          description: 'Updated description',
          price: 349.99,
          inventory: 75
        }
      }

      const payloadString = JSON.stringify(payload)
      const signature = signPayload(payloadString, webhookSecret)

      const response = await fetch(`http://localhost:3000/api/partners/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-partner-webhook': 'true',
          'x-partner-signature': signature
        },
        body: payloadString
      })

      expect(response.status).toBe(200)

      // Verify product was updated
      const { data: product } = await supabase
        .from('partner_products')
        .select('*')
        .eq('partner_id', testPartnerId)
        .eq('external_id', 'ext-product-123')
        .single()

      expect(product!.name).toBe('Modern Chair - Updated')
      expect(product!.price).toBe(349.99)
    })

    it('should reject webhook with invalid signature', async () => {
      const payload = {
        event: 'product.created',
        partnerId: testPartnerId,
        timestamp: new Date().toISOString(),
        data: { id: 'test' }
      }

      const response = await fetch(`http://localhost:3000/api/partners/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-partner-webhook': 'true',
          'x-partner-signature': 'invalid-signature'
        },
        body: JSON.stringify(payload)
      })

      expect(response.status).toBe(401)
    })

    it('should handle inventory updated webhook', async () => {
      const payload = {
        event: 'inventory.updated',
        partnerId: testPartnerId,
        timestamp: new Date().toISOString(),
        data: {
          productId: 'ext-product-123',
          quantity: 100
        }
      }

      const payloadString = JSON.stringify(payload)
      const signature = signPayload(payloadString, webhookSecret)

      const response = await fetch(`http://localhost:3000/api/partners/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-partner-webhook': 'true',
          'x-partner-signature': signature
        },
        body: payloadString
      })

      expect(response.status).toBe(200)

      // Verify inventory was updated
      const { data: product } = await supabase
        .from('partner_products')
        .select('inventory')
        .eq('partner_id', testPartnerId)
        .eq('external_id', 'ext-product-123')
        .single()

      expect(product!.inventory).toBe(100)
    })
  })

  describe('GET /api/partners/sync', () => {
    let testSyncId: string

    beforeAll(async () => {
      // Create a test sync
      const { data: sync } = await supabase
        .from('partner_syncs')
        .insert({
          partner_id: testPartnerId,
          org_id: testOrgId,
          user_id: testUserId,
          sync_type: 'catalog',
          status: 'completed',
          options: {},
          stats: {
            itemsProcessed: 500,
            itemsAdded: 50,
            itemsUpdated: 100,
            itemsDeleted: 10
          },
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString()
        })
        .select()
        .single()

      testSyncId = sync!.id
    })

    it('should retrieve sync status', async () => {
      const response = await fetch(
        `http://localhost:3000/api/partners/sync?syncId=${testSyncId}`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.syncId).toBe(testSyncId)
      expect(data.status).toBe('completed')
      expect(data.stats).toBeDefined()
      expect(data.stats.itemsProcessed).toBe(500)
    })
  })
})
