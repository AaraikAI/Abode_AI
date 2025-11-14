/**
 * Developer API Keys Endpoint
 *
 * Manages API key creation and management for developers
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { APIMarketplaceService, APIScope } from '@/lib/services/api-marketplace'

const apiService = new APIMarketplaceService()

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get organization
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
      // Create new API key
      const apiKey = await apiService.createAPIKey(
        user.id,
        membership.organization_id,
        {
          name: body.name,
          environment: body.environment || 'production',
          scopes: body.scopes || ['read', 'write'],
          rateLimit: body.rateLimit
        }
      )

      // Store in database
      await supabase.from('api_keys').insert({
        id: apiKey.id,
        user_id: user.id,
        org_id: membership.organization_id,
        name: apiKey.name,
        key_hash: apiKey.key.split('.')[1], // Store hash, not full key
        environment: apiKey.environment,
        scopes: apiKey.scopes,
        rate_limit: apiKey.permissions.rateLimit,
        created_at: apiKey.createdAt,
        last_used_at: apiKey.lastUsedAt
      })

      return NextResponse.json({
        success: true,
        apiKey: {
          id: apiKey.id,
          key: apiKey.key, // Only returned once
          name: apiKey.name,
          environment: apiKey.environment,
          scopes: apiKey.scopes
        }
      })
    } else if (action === 'revoke') {
      // Revoke API key
      const { keyId } = body

      // Update in database
      await supabase
        .from('api_keys')
        .update({ revoked: true, revoked_at: new Date().toISOString() })
        .eq('id', keyId)
        .eq('user_id', user.id)

      return NextResponse.json({ success: true })
    } else if (action === 'rotate') {
      // Rotate API key
      const { keyId } = body

      // Get old key
      const { data: oldKey } = await supabase
        .from('api_keys')
        .select('*')
        .eq('id', keyId)
        .eq('user_id', user.id)
        .single()

      if (!oldKey) {
        return NextResponse.json({ error: 'API key not found' }, { status: 404 })
      }

      // Create new key with same settings
      const newApiKey = await apiService.createAPIKey(
        user.id,
        membership.organization_id,
        {
          name: oldKey.name,
          environment: oldKey.environment,
          scopes: oldKey.scopes,
          rateLimit: oldKey.rate_limit
        }
      )

      // Revoke old key
      await supabase
        .from('api_keys')
        .update({ revoked: true, revoked_at: new Date().toISOString() })
        .eq('id', keyId)

      // Store new key
      await supabase.from('api_keys').insert({
        id: newApiKey.id,
        user_id: user.id,
        org_id: membership.organization_id,
        name: newApiKey.name,
        key_hash: newApiKey.key.split('.')[1],
        environment: newApiKey.environment,
        scopes: newApiKey.scopes,
        rate_limit: newApiKey.permissions.rateLimit,
        created_at: newApiKey.createdAt
      })

      return NextResponse.json({
        success: true,
        apiKey: {
          id: newApiKey.id,
          key: newApiKey.key,
          name: newApiKey.name,
          environment: newApiKey.environment
        }
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    console.error('API keys error:', error)
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
    const keyId = searchParams.get('keyId')

    if (keyId) {
      // Get specific key (without the actual key value)
      const { data: apiKey, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('id', keyId)
        .eq('user_id', user.id)
        .single()

      if (error || !apiKey) {
        return NextResponse.json({ error: 'API key not found' }, { status: 404 })
      }

      // Get usage stats
      const usage = await apiService.getUsageStats(keyId, 'day')

      return NextResponse.json({
        success: true,
        apiKey: {
          id: apiKey.id,
          name: apiKey.name,
          environment: apiKey.environment,
          scopes: apiKey.scopes,
          rateLimit: apiKey.rate_limit,
          createdAt: apiKey.created_at,
          lastUsedAt: apiKey.last_used_at,
          revoked: apiKey.revoked
        },
        usage
      })
    }

    // List all keys for user
    const { data: apiKeys, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      apiKeys: apiKeys.map(key => ({
        id: key.id,
        name: key.name,
        environment: key.environment,
        scopes: key.scopes,
        createdAt: key.created_at,
        lastUsedAt: key.last_used_at,
        revoked: key.revoked
      }))
    })
  } catch (error: any) {
    console.error('API keys GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
