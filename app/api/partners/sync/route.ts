/**
 * Partner Sync API Endpoint
 *
 * Sync partner catalog/integrations and handle webhook callbacks
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

interface PartnerSyncRequest {
  partnerId: string
  syncType: 'catalog' | 'inventory' | 'pricing' | 'full'
  options?: {
    forceRefresh?: boolean
    categories?: string[]
    since?: string // ISO timestamp
  }
}

interface PartnerSyncResponse {
  success: boolean
  syncId: string
  status: 'pending' | 'syncing' | 'completed' | 'failed'
  stats?: {
    itemsProcessed: number
    itemsAdded: number
    itemsUpdated: number
    itemsDeleted: number
  }
  error?: string
}

interface PartnerWebhookPayload {
  event: 'product.created' | 'product.updated' | 'product.deleted' | 'inventory.updated' | 'pricing.changed'
  partnerId: string
  timestamp: string
  data: any
  signature?: string
}

/**
 * Verify webhook signature
 */
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(payload)
  const expectedSignature = hmac.digest('hex')

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}

/**
 * Sync partner catalog
 */
async function syncPartnerCatalog(
  syncId: string,
  partnerId: string,
  syncType: string,
  options: any
): Promise<{ success: boolean; stats?: any; error?: string }> {
  // Simulate partner sync
  // In production, this would call partner APIs
  return new Promise((resolve) => {
    setTimeout(() => {
      const stats = {
        itemsProcessed: Math.floor(Math.random() * 1000) + 100,
        itemsAdded: Math.floor(Math.random() * 50) + 10,
        itemsUpdated: Math.floor(Math.random() * 100) + 20,
        itemsDeleted: Math.floor(Math.random() * 10)
      }
      resolve({ success: true, stats })
    }, 2000)
  })
}

/**
 * Process webhook event
 */
async function processWebhookEvent(
  event: PartnerWebhookPayload,
  supabase: any
): Promise<{ success: boolean; error?: string }> {
  try {
    // Record webhook event
    await supabase
      .from('partner_webhook_events')
      .insert({
        partner_id: event.partnerId,
        event_type: event.event,
        payload: event.data,
        timestamp: event.timestamp,
        processed: true,
        processed_at: new Date().toISOString()
      })

    // Process based on event type
    switch (event.event) {
      case 'product.created':
      case 'product.updated':
        await supabase
          .from('partner_products')
          .upsert({
            partner_id: event.partnerId,
            external_id: event.data.id,
            name: event.data.name,
            description: event.data.description,
            price: event.data.price,
            inventory: event.data.inventory,
            metadata: event.data,
            updated_at: new Date().toISOString()
          })
        break

      case 'product.deleted':
        await supabase
          .from('partner_products')
          .delete()
          .eq('partner_id', event.partnerId)
          .eq('external_id', event.data.id)
        break

      case 'inventory.updated':
        await supabase
          .from('partner_products')
          .update({
            inventory: event.data.quantity,
            updated_at: new Date().toISOString()
          })
          .eq('partner_id', event.partnerId)
          .eq('external_id', event.data.productId)
        break

      case 'pricing.changed':
        await supabase
          .from('partner_products')
          .update({
            price: event.data.price,
            updated_at: new Date().toISOString()
          })
          .eq('partner_id', event.partnerId)
          .eq('external_id', event.data.productId)
        break
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * POST - Sync partner catalog or handle webhook
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    // Check if this is a webhook callback
    const webhookHeader = request.headers.get('x-partner-webhook')

    if (webhookHeader) {
      // Handle webhook
      const signature = request.headers.get('x-partner-signature')
      const rawBody = await request.text()
      const webhookPayload = JSON.parse(rawBody) as PartnerWebhookPayload

      // Get partner webhook secret
      const { data: partner } = await supabase
        .from('partners')
        .select('webhook_secret')
        .eq('id', webhookPayload.partnerId)
        .single()

      if (!partner) {
        return NextResponse.json(
          { error: 'Partner not found' },
          { status: 404 }
        )
      }

      // Verify signature if present
      if (signature && partner.webhook_secret) {
        const isValid = verifyWebhookSignature(
          rawBody,
          signature,
          partner.webhook_secret
        )

        if (!isValid) {
          return NextResponse.json(
            { error: 'Invalid webhook signature' },
            { status: 401 }
          )
        }
      }

      // Process webhook event
      const result = await processWebhookEvent(webhookPayload, supabase)

      if (result.success) {
        return NextResponse.json({ success: true })
      } else {
        return NextResponse.json(
          { error: result.error },
          { status: 500 }
        )
      }
    }

    // Regular sync request - requires authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse sync request
    const syncRequest = await request.json() as PartnerSyncRequest

    // Validate request
    if (!syncRequest.partnerId || !syncRequest.syncType) {
      return NextResponse.json(
        { error: 'Missing required fields: partnerId, syncType' },
        { status: 400 }
      )
    }

    // Get user's organization
    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json(
        { error: 'User not associated with any organization' },
        { status: 403 }
      )
    }

    const orgId = membership.organization_id

    // Verify partner integration
    const { data: integration } = await supabase
      .from('partner_integrations')
      .select('*')
      .eq('partner_id', syncRequest.partnerId)
      .eq('org_id', orgId)
      .single()

    if (!integration || !integration.enabled) {
      return NextResponse.json(
        { error: 'Partner integration not found or disabled' },
        { status: 404 }
      )
    }

    // Create sync record
    const { data: sync, error: syncError } = await supabase
      .from('partner_syncs')
      .insert({
        partner_id: syncRequest.partnerId,
        org_id: orgId,
        user_id: user.id,
        sync_type: syncRequest.syncType,
        status: 'pending',
        options: syncRequest.options || {},
        started_at: new Date().toISOString()
      })
      .select()
      .single()

    if (syncError || !sync) {
      console.error('Failed to create sync:', syncError)
      return NextResponse.json(
        { error: 'Failed to create sync' },
        { status: 500 }
      )
    }

    // Execute sync (async)
    syncPartnerCatalog(
      sync.id,
      syncRequest.partnerId,
      syncRequest.syncType,
      syncRequest.options || {}
    ).then(async (result) => {
      if (result.success) {
        await supabase
          .from('partner_syncs')
          .update({
            status: 'completed',
            stats: result.stats,
            completed_at: new Date().toISOString()
          })
          .eq('id', sync.id)
      } else {
        await supabase
          .from('partner_syncs')
          .update({
            status: 'failed',
            error_message: result.error,
            completed_at: new Date().toISOString()
          })
          .eq('id', sync.id)
      }
    }).catch(async (error) => {
      console.error('Partner sync error:', error)
      await supabase
        .from('partner_syncs')
        .update({
          status: 'failed',
          error_message: error.message,
          completed_at: new Date().toISOString()
        })
        .eq('id', sync.id)
    })

    const response: PartnerSyncResponse = {
      success: true,
      syncId: sync.id,
      status: 'pending'
    }

    return NextResponse.json(response, { status: 202 })
  } catch (error) {
    console.error('Partner sync API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET - Get sync status
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const syncId = searchParams.get('syncId')

    if (!syncId) {
      return NextResponse.json(
        { error: 'Missing syncId parameter' },
        { status: 400 }
      )
    }

    // Get sync
    const { data: sync, error } = await supabase
      .from('partner_syncs')
      .select('*')
      .eq('id', syncId)
      .eq('user_id', user.id)
      .single()

    if (error || !sync) {
      return NextResponse.json(
        { error: 'Sync not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      syncId: sync.id,
      partnerId: sync.partner_id,
      syncType: sync.sync_type,
      status: sync.status,
      stats: sync.stats,
      startedAt: sync.started_at,
      completedAt: sync.completed_at,
      error: sync.error_message
    })
  } catch (error) {
    console.error('Partner sync status API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
