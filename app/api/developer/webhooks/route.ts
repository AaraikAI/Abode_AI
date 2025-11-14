/**
 * Developer Webhooks Endpoint
 *
 * Manages webhook subscriptions for API events
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { APIMarketplaceService, WebhookEvent } from '@/lib/services/api-marketplace'

const apiService = new APIMarketplaceService()

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'No organization found' }, { status: 403 })
    }

    const body = await request.json()
    const { action } = body

    if (action === 'create') {
      // Create webhook
      const webhook = await apiService.registerWebhook(
        user.id,
        membership.organization_id,
        {
          url: body.url,
          events: body.events,
          secret: body.secret,
          description: body.description,
          retryPolicy: body.retryPolicy
        }
      )

      // Store in database
      await supabase.from('webhooks').insert({
        id: webhook.id,
        user_id: user.id,
        org_id: membership.organization_id,
        url: webhook.url,
        events: webhook.events,
        secret_hash: webhook.secret, // In production, hash this
        description: webhook.description,
        active: webhook.active,
        retry_policy: webhook.retryPolicy,
        created_at: webhook.createdAt
      })

      return NextResponse.json({
        success: true,
        webhook: {
          id: webhook.id,
          url: webhook.url,
          events: webhook.events,
          active: webhook.active
        }
      })
    } else if (action === 'test') {
      // Test webhook
      const { webhookId } = body

      const { data: webhook } = await supabase
        .from('webhooks')
        .select('*')
        .eq('id', webhookId)
        .eq('user_id', user.id)
        .single()

      if (!webhook) {
        return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })
      }

      // Send test event
      const testEvent: WebhookEvent = {
        id: `evt_test_${Date.now()}`,
        type: 'webhook.test',
        timestamp: new Date(),
        data: {
          message: 'This is a test webhook event'
        }
      }

      await apiService.deliverWebhook(
        {
          id: webhook.id,
          userId: webhook.user_id,
          orgId: webhook.org_id,
          url: webhook.url,
          events: webhook.events,
          secret: webhook.secret_hash,
          active: webhook.active,
          retryPolicy: webhook.retry_policy,
          createdAt: new Date(webhook.created_at)
        },
        testEvent,
        testEvent.data
      )

      return NextResponse.json({ success: true, message: 'Test webhook sent' })
    } else if (action === 'update') {
      // Update webhook
      const { webhookId, ...updates } = body

      await supabase
        .from('webhooks')
        .update({
          url: updates.url,
          events: updates.events,
          active: updates.active,
          description: updates.description
        })
        .eq('id', webhookId)
        .eq('user_id', user.id)

      return NextResponse.json({ success: true })
    } else if (action === 'delete') {
      // Delete webhook
      const { webhookId } = body

      await supabase
        .from('webhooks')
        .delete()
        .eq('id', webhookId)
        .eq('user_id', user.id)

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    console.error('Webhooks error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const webhookId = searchParams.get('webhookId')

    if (webhookId) {
      // Get specific webhook with delivery history
      const { data: webhook } = await supabase
        .from('webhooks')
        .select('*')
        .eq('id', webhookId)
        .eq('user_id', user.id)
        .single()

      if (!webhook) {
        return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })
      }

      // Get recent deliveries
      const { data: deliveries } = await supabase
        .from('webhook_deliveries')
        .select('*')
        .eq('webhook_id', webhookId)
        .order('created_at', { ascending: false })
        .limit(50)

      return NextResponse.json({
        success: true,
        webhook: {
          id: webhook.id,
          url: webhook.url,
          events: webhook.events,
          active: webhook.active,
          description: webhook.description,
          createdAt: webhook.created_at
        },
        deliveries: deliveries || []
      })
    }

    // List all webhooks
    const { data: webhooks } = await supabase
      .from('webhooks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    return NextResponse.json({
      success: true,
      webhooks: (webhooks || []).map(webhook => ({
        id: webhook.id,
        url: webhook.url,
        events: webhook.events,
        active: webhook.active,
        description: webhook.description,
        createdAt: webhook.created_at
      }))
    })
  } catch (error: any) {
    console.error('Webhooks GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
