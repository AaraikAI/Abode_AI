/**
 * Tenant Management API Endpoint
 *
 * Multi-tenant white-label platform management
 * Supports GET (list tenants), POST (create tenant)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface Tenant {
  id: string
  name: string
  slug: string
  plan: 'starter' | 'professional' | 'enterprise' | 'reseller'
  status: 'active' | 'suspended' | 'cancelled'
  owner_id: string
  created_at: string
  updated_at: string
  settings: {
    max_users?: number
    max_projects?: number
    max_storage_gb?: number
    features_enabled?: string[]
  }
  metadata?: Record<string, any>
  owner?: {
    id: string
    name: string
    email: string
  }
}

interface CreateTenantRequest {
  name: string
  slug: string
  plan?: Tenant['plan']
  ownerId?: string
  settings?: Tenant['settings']
  metadata?: Record<string, any>
}

/**
 * Verify user has admin/platform access
 */
async function hasAdminAccess(supabase: any, userId: string): Promise<boolean> {
  // Check if user has platform admin role
  const { data: userRoles } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .in('role', ['platform_admin', 'super_admin'])

  return userRoles && userRoles.length > 0
}

/**
 * Verify user owns or has admin access to tenant
 */
async function hasTenantAccess(
  supabase: any,
  userId: string,
  tenantId?: string
): Promise<{ hasAccess: boolean; isOwner: boolean; tenantId?: string }> {
  if (!tenantId) {
    // Check if user owns any tenant
    const { data: ownedTenant } = await supabase
      .from('tenants')
      .select('id, owner_id')
      .eq('owner_id', userId)
      .single()

    if (ownedTenant) {
      return { hasAccess: true, isOwner: true, tenantId: ownedTenant.id }
    }

    // Check if user is member of any tenant
    const { data: membership } = await supabase
      .from('tenant_users')
      .select('tenant_id, role')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    if (membership) {
      return {
        hasAccess: membership.role === 'admin',
        isOwner: false,
        tenantId: membership.tenant_id,
      }
    }

    return { hasAccess: false, isOwner: false }
  }

  // Check specific tenant access
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, owner_id')
    .eq('id', tenantId)
    .single()

  if (!tenant) {
    return { hasAccess: false, isOwner: false }
  }

  if (tenant.owner_id === userId) {
    return { hasAccess: true, isOwner: true, tenantId }
  }

  // Check if user is admin of tenant
  const { data: membership } = await supabase
    .from('tenant_users')
    .select('role')
    .eq('tenant_id', tenantId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()

  return {
    hasAccess: membership?.role === 'admin',
    isOwner: false,
    tenantId,
  }
}

/**
 * GET - List all tenants (admin only) or user's tenants
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const status = searchParams.get('status')
    const plan = searchParams.get('plan')
    const search = searchParams.get('search')
    const includeOwner = searchParams.get('includeOwner') === 'true'

    const isAdmin = await hasAdminAccess(supabase, user.id)
    const offset = (page - 1) * limit

    let query = supabase.from('tenants').select(
      `
      *,
      ${includeOwner ? 'owner:users!tenants_owner_id_fkey(id, name, email)' : ''}
    `,
      { count: 'exact' }
    )

    // Non-admin users can only see their tenants
    if (!isAdmin) {
      // Get user's tenant IDs
      const { data: userTenants } = await supabase
        .from('tenant_users')
        .select('tenant_id')
        .eq('user_id', user.id)
        .eq('status', 'active')

      const tenantIds = [
        ...(userTenants?.map((t) => t.tenant_id) || []),
        // Also include tenants they own
      ]

      const { data: ownedTenants } = await supabase
        .from('tenants')
        .select('id')
        .eq('owner_id', user.id)

      const ownedIds = ownedTenants?.map((t) => t.id) || []
      const allTenantIds = [...new Set([...tenantIds, ...ownedIds])]

      if (allTenantIds.length === 0) {
        return NextResponse.json({
          tenants: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
          },
        })
      }

      query = query.in('id', allTenantIds)
    }

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }

    if (plan) {
      query = query.eq('plan', plan)
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false })

    const { data: tenants, error, count } = await query

    if (error) {
      console.error('Failed to fetch tenants:', error)
      return NextResponse.json({ error: 'Failed to fetch tenants' }, { status: 500 })
    }

    return NextResponse.json({
      tenants: (tenants || []) as Tenant[],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error('Tenants API GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST - Create new tenant
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await request.json()) as CreateTenantRequest

    // Validate request
    if (!body.name || !body.slug) {
      return NextResponse.json(
        { error: 'Missing required fields: name, slug' },
        { status: 400 }
      )
    }

    // Validate slug format (alphanumeric and hyphens only)
    const slugRegex = /^[a-z0-9-]+$/
    if (!slugRegex.test(body.slug)) {
      return NextResponse.json(
        { error: 'Invalid slug format. Use lowercase letters, numbers, and hyphens only.' },
        { status: 400 }
      )
    }

    // Validate slug length
    if (body.slug.length < 3 || body.slug.length > 63) {
      return NextResponse.json(
        { error: 'Slug must be between 3 and 63 characters' },
        { status: 400 }
      )
    }

    // Validate tenant name length
    if (body.name.length < 2 || body.name.length > 100) {
      return NextResponse.json(
        { error: 'Tenant name must be between 2 and 100 characters' },
        { status: 400 }
      )
    }

    // Check if slug already exists
    const { data: existingTenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', body.slug)
      .single()

    if (existingTenant) {
      return NextResponse.json({ error: 'Slug already in use' }, { status: 409 })
    }

    // Determine owner (defaults to current user)
    const ownerId = body.ownerId || user.id

    // If setting different owner, verify admin access
    if (body.ownerId && body.ownerId !== user.id) {
      const isAdmin = await hasAdminAccess(supabase, user.id)
      if (!isAdmin) {
        return NextResponse.json(
          { error: 'Only platform admins can create tenants for other users' },
          { status: 403 }
        )
      }

      // Verify target user exists
      const { data: targetUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', ownerId)
        .single()

      if (!targetUser) {
        return NextResponse.json({ error: 'Owner user not found' }, { status: 404 })
      }
    }

    // Validate plan
    const validPlans = ['starter', 'professional', 'enterprise', 'reseller']
    const plan = body.plan || 'starter'
    if (!validPlans.includes(plan)) {
      return NextResponse.json(
        { error: `Invalid plan. Must be one of: ${validPlans.join(', ')}` },
        { status: 400 }
      )
    }

    // Set default settings based on plan
    const defaultSettings = {
      starter: {
        max_users: 5,
        max_projects: 10,
        max_storage_gb: 10,
        features_enabled: ['basic_features'],
      },
      professional: {
        max_users: 20,
        max_projects: 50,
        max_storage_gb: 100,
        features_enabled: ['basic_features', 'advanced_features'],
      },
      enterprise: {
        max_users: -1, // unlimited
        max_projects: -1,
        max_storage_gb: 1000,
        features_enabled: ['basic_features', 'advanced_features', 'enterprise_features'],
      },
      reseller: {
        max_users: -1,
        max_projects: -1,
        max_storage_gb: -1,
        features_enabled: [
          'basic_features',
          'advanced_features',
          'enterprise_features',
          'white_label',
        ],
      },
    }

    const settings = {
      ...defaultSettings[plan as keyof typeof defaultSettings],
      ...body.settings,
    }

    // Create tenant
    const { data: tenant, error } = await supabase
      .from('tenants')
      .insert({
        name: body.name,
        slug: body.slug,
        plan,
        owner_id: ownerId,
        status: 'active',
        settings,
        metadata: body.metadata || {},
      })
      .select(
        `
        *,
        owner:users!tenants_owner_id_fkey(id, name, email)
      `
      )
      .single()

    if (error || !tenant) {
      console.error('Failed to create tenant:', error)
      return NextResponse.json({ error: 'Failed to create tenant' }, { status: 500 })
    }

    // Add owner as admin user
    await supabase.from('tenant_users').insert({
      tenant_id: tenant.id,
      user_id: ownerId,
      role: 'admin',
      status: 'active',
      invited_by: user.id,
    })

    // Create default branding configuration
    await supabase.from('tenant_branding').insert({
      tenant_id: tenant.id,
      logo_url: null,
      logo_url_dark: null,
      favicon_url: null,
      primary_color: '#3b82f6',
      secondary_color: '#10b981',
      accent_color: '#f59e0b',
      font_family: 'Inter, sans-serif',
      custom_css: null,
    })

    // Record activity
    await supabase.from('activities').insert({
      user_id: user.id,
      action: 'tenant_created',
      metadata: {
        tenant_id: tenant.id,
        tenant_name: body.name,
        tenant_slug: body.slug,
        plan,
      },
    })

    return NextResponse.json(
      {
        success: true,
        tenant: tenant as Tenant,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Tenants API POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
