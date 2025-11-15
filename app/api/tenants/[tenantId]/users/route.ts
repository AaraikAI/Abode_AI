/**
 * Tenant Users Management API Endpoint
 *
 * Manages users within a tenant
 * Supports GET (list users), POST (invite user), PUT (update role), DELETE (remove user)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface TenantUser {
  id: string
  tenant_id: string
  user_id: string
  role: 'owner' | 'admin' | 'member' | 'viewer'
  status: 'active' | 'invited' | 'suspended'
  invited_by: string
  invited_at: string
  joined_at: string | null
  last_active_at: string | null
  metadata?: Record<string, any>
  user?: {
    id: string
    name: string
    email: string
    avatar_url?: string
  }
  invited_by_user?: {
    id: string
    name: string
    email: string
  }
}

interface InviteUserRequest {
  email: string
  role?: TenantUser['role']
  metadata?: Record<string, any>
}

interface UpdateUserRoleRequest {
  userId: string
  role: TenantUser['role']
}

/**
 * Verify user has access to tenant
 */
async function verifyTenantAccess(
  supabase: any,
  userId: string,
  tenantId: string,
  requireAdmin: boolean = false
): Promise<{ hasAccess: boolean; isOwner: boolean; userRole?: string; error?: string }> {
  // Check if tenant exists
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, owner_id, status')
    .eq('id', tenantId)
    .single()

  if (!tenant) {
    return { hasAccess: false, isOwner: false, error: 'Tenant not found' }
  }

  if (tenant.status !== 'active') {
    return { hasAccess: false, isOwner: false, error: 'Tenant is not active' }
  }

  // Check if user is owner
  if (tenant.owner_id === userId) {
    return { hasAccess: true, isOwner: true, userRole: 'owner' }
  }

  // Check if user is member
  const { data: membership } = await supabase
    .from('tenant_users')
    .select('role, status')
    .eq('tenant_id', tenantId)
    .eq('user_id', userId)
    .single()

  if (!membership || membership.status !== 'active') {
    return { hasAccess: false, isOwner: false, error: 'Access denied' }
  }

  const userRole = membership.role
  const hasAdminRole = userRole === 'admin' || userRole === 'owner'

  if (requireAdmin && !hasAdminRole) {
    return { hasAccess: false, isOwner: false, userRole, error: 'Admin access required' }
  }

  return { hasAccess: true, isOwner: false, userRole }
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * GET - List tenant users
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  try {
    const supabase = createClient()
    const { tenantId } = params

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify tenant access
    const { hasAccess, error: accessError } = await verifyTenantAccess(
      supabase,
      user.id,
      tenantId
    )

    if (!hasAccess) {
      return NextResponse.json({ error: accessError || 'Access denied' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const status = searchParams.get('status')
    const role = searchParams.get('role')
    const search = searchParams.get('search')

    const offset = (page - 1) * limit

    let query = supabase
      .from('tenant_users')
      .select(
        `
        *,
        user:users!tenant_users_user_id_fkey(id, name, email, avatar_url),
        invited_by_user:users!tenant_users_invited_by_fkey(id, name, email)
      `,
        { count: 'exact' }
      )
      .eq('tenant_id', tenantId)

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }

    if (role) {
      query = query.eq('role', role)
    }

    if (search) {
      // Search by user name or email
      const { data: matchingUsers } = await supabase
        .from('users')
        .select('id')
        .or(`name.ilike.%${search}%,email.ilike.%${search}%`)

      if (matchingUsers && matchingUsers.length > 0) {
        const userIds = matchingUsers.map((u) => u.id)
        query = query.in('user_id', userIds)
      } else {
        // No matching users, return empty result
        return NextResponse.json({
          users: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
          },
        })
      }
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1).order('joined_at', { ascending: false })

    const { data: tenantUsers, error, count } = await query

    if (error) {
      console.error('Failed to fetch tenant users:', error)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    return NextResponse.json({
      users: (tenantUsers || []) as TenantUser[],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error('Tenant Users API GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST - Invite user to tenant
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  try {
    const supabase = createClient()
    const { tenantId } = params

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify tenant access (admin required)
    const { hasAccess, error: accessError } = await verifyTenantAccess(
      supabase,
      user.id,
      tenantId,
      true // require admin
    )

    if (!hasAccess) {
      return NextResponse.json(
        { error: accessError || 'Admin access required' },
        { status: 403 }
      )
    }

    const body = (await request.json()) as InviteUserRequest

    // Validate request
    if (!body.email) {
      return NextResponse.json({ error: 'Missing required field: email' }, { status: 400 })
    }

    // Validate email format
    if (!isValidEmail(body.email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Validate role
    const validRoles = ['owner', 'admin', 'member', 'viewer']
    const role = body.role || 'member'
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${validRoles.join(', ')}` },
        { status: 400 }
      )
    }

    // Only owner can invite other owners
    if (role === 'owner') {
      const { isOwner } = await verifyTenantAccess(supabase, user.id, tenantId)
      if (!isOwner) {
        return NextResponse.json(
          { error: 'Only tenant owner can invite other owners' },
          { status: 403 }
        )
      }
    }

    // Check if user exists
    const { data: targetUser } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('email', body.email.toLowerCase())
      .single()

    let targetUserId: string

    if (!targetUser) {
      // User doesn't exist, create invitation
      // In a real system, you might send an invitation email
      // For now, we'll create a pending user record
      return NextResponse.json(
        {
          error: 'User not found. Please ensure the user has an account before inviting.',
        },
        { status: 404 }
      )
    } else {
      targetUserId = targetUser.id

      // Check if user is already a member
      const { data: existingMembership } = await supabase
        .from('tenant_users')
        .select('id, status, role')
        .eq('tenant_id', tenantId)
        .eq('user_id', targetUserId)
        .single()

      if (existingMembership) {
        if (existingMembership.status === 'active') {
          return NextResponse.json(
            {
              error: `User is already a ${existingMembership.role} of this tenant`,
            },
            { status: 409 }
          )
        } else if (existingMembership.status === 'invited') {
          return NextResponse.json(
            { error: 'User has already been invited' },
            { status: 409 }
          )
        }
      }

      // Check tenant user limits
      const { data: tenant } = await supabase
        .from('tenants')
        .select('settings')
        .eq('id', tenantId)
        .single()

      const maxUsers = tenant?.settings?.max_users || -1
      if (maxUsers !== -1) {
        const { count } = await supabase
          .from('tenant_users')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', tenantId)
          .eq('status', 'active')

        if (count !== null && count >= maxUsers) {
          return NextResponse.json(
            { error: 'Tenant has reached maximum user limit' },
            { status: 403 }
          )
        }
      }
    }

    // Create tenant user invitation
    const { data: tenantUser, error } = await supabase
      .from('tenant_users')
      .insert({
        tenant_id: tenantId,
        user_id: targetUserId,
        role,
        status: 'invited',
        invited_by: user.id,
        metadata: body.metadata || {},
      })
      .select(
        `
        *,
        user:users!tenant_users_user_id_fkey(id, name, email, avatar_url),
        invited_by_user:users!tenant_users_invited_by_fkey(id, name, email)
      `
      )
      .single()

    if (error || !tenantUser) {
      console.error('Failed to invite user:', error)
      return NextResponse.json({ error: 'Failed to invite user' }, { status: 500 })
    }

    // Send notification to invited user
    await supabase.from('notifications').insert({
      user_id: targetUserId,
      type: 'tenant_invitation',
      title: 'Tenant invitation',
      message: `You have been invited to join a tenant as ${role}`,
      metadata: {
        tenant_id: tenantId,
        tenant_user_id: tenantUser.id,
        invited_by: user.id,
        role,
      },
    })

    // Record activity
    await supabase.from('activities').insert({
      user_id: user.id,
      action: 'tenant_user_invited',
      metadata: {
        tenant_id: tenantId,
        invited_user_id: targetUserId,
        role,
      },
    })

    return NextResponse.json(
      {
        success: true,
        user: tenantUser as TenantUser,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Tenant Users API POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT - Update user role
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  try {
    const supabase = createClient()
    const { tenantId } = params

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify tenant access (admin required)
    const { hasAccess, isOwner, error: accessError } = await verifyTenantAccess(
      supabase,
      user.id,
      tenantId,
      true
    )

    if (!hasAccess) {
      return NextResponse.json(
        { error: accessError || 'Admin access required' },
        { status: 403 }
      )
    }

    const body = (await request.json()) as UpdateUserRoleRequest

    // Validate request
    if (!body.userId || !body.role) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, role' },
        { status: 400 }
      )
    }

    // Validate role
    const validRoles = ['owner', 'admin', 'member', 'viewer']
    if (!validRoles.includes(body.role)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${validRoles.join(', ')}` },
        { status: 400 }
      )
    }

    // Only owner can assign owner role
    if (body.role === 'owner' && !isOwner) {
      return NextResponse.json(
        { error: 'Only tenant owner can assign owner role' },
        { status: 403 }
      )
    }

    // Cannot modify own role
    if (body.userId === user.id) {
      return NextResponse.json({ error: 'Cannot modify your own role' }, { status: 400 })
    }

    // Fetch existing membership
    const { data: existingMembership } = await supabase
      .from('tenant_users')
      .select('id, role, status')
      .eq('tenant_id', tenantId)
      .eq('user_id', body.userId)
      .single()

    if (!existingMembership) {
      return NextResponse.json({ error: 'User is not a member of this tenant' }, { status: 404 })
    }

    if (existingMembership.status !== 'active') {
      return NextResponse.json(
        { error: 'Cannot update role for non-active user' },
        { status: 400 }
      )
    }

    // Only owner can demote other owners
    if (existingMembership.role === 'owner' && !isOwner) {
      return NextResponse.json(
        { error: 'Only tenant owner can change another owner\'s role' },
        { status: 403 }
      )
    }

    // Update user role
    const { data: updatedUser, error } = await supabase
      .from('tenant_users')
      .update({ role: body.role })
      .eq('id', existingMembership.id)
      .select(
        `
        *,
        user:users!tenant_users_user_id_fkey(id, name, email, avatar_url),
        invited_by_user:users!tenant_users_invited_by_fkey(id, name, email)
      `
      )
      .single()

    if (error || !updatedUser) {
      console.error('Failed to update user role:', error)
      return NextResponse.json({ error: 'Failed to update user role' }, { status: 500 })
    }

    // Notify user of role change
    await supabase.from('notifications').insert({
      user_id: body.userId,
      type: 'role_changed',
      title: 'Your role has been updated',
      message: `Your role has been changed from ${existingMembership.role} to ${body.role}`,
      metadata: {
        tenant_id: tenantId,
        old_role: existingMembership.role,
        new_role: body.role,
        changed_by: user.id,
      },
    })

    // Record activity
    await supabase.from('activities').insert({
      user_id: user.id,
      action: 'tenant_user_role_updated',
      metadata: {
        tenant_id: tenantId,
        target_user_id: body.userId,
        old_role: existingMembership.role,
        new_role: body.role,
      },
    })

    return NextResponse.json({
      success: true,
      user: updatedUser as TenantUser,
    })
  } catch (error) {
    console.error('Tenant Users API PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE - Remove user from tenant
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  try {
    const supabase = createClient()
    const { tenantId } = params

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify tenant access (admin required)
    const { hasAccess, isOwner, error: accessError } = await verifyTenantAccess(
      supabase,
      user.id,
      tenantId,
      true
    )

    if (!hasAccess) {
      return NextResponse.json(
        { error: accessError || 'Admin access required' },
        { status: 403 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'Missing required parameter: userId' }, { status: 400 })
    }

    // Cannot remove yourself
    if (userId === user.id) {
      return NextResponse.json(
        { error: 'Cannot remove yourself. Transfer ownership first.' },
        { status: 400 }
      )
    }

    // Fetch existing membership
    const { data: existingMembership } = await supabase
      .from('tenant_users')
      .select('id, role, status, user_id')
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .single()

    if (!existingMembership) {
      return NextResponse.json({ error: 'User is not a member of this tenant' }, { status: 404 })
    }

    // Only owner can remove other owners
    if (existingMembership.role === 'owner' && !isOwner) {
      return NextResponse.json(
        { error: 'Only tenant owner can remove another owner' },
        { status: 403 }
      )
    }

    // Delete tenant user membership
    const { error } = await supabase
      .from('tenant_users')
      .delete()
      .eq('id', existingMembership.id)

    if (error) {
      console.error('Failed to remove user:', error)
      return NextResponse.json({ error: 'Failed to remove user' }, { status: 500 })
    }

    // Notify removed user
    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'removed_from_tenant',
      title: 'Removed from tenant',
      message: 'You have been removed from a tenant',
      metadata: {
        tenant_id: tenantId,
        removed_by: user.id,
      },
    })

    // Record activity
    await supabase.from('activities').insert({
      user_id: user.id,
      action: 'tenant_user_removed',
      metadata: {
        tenant_id: tenantId,
        removed_user_id: userId,
        role: existingMembership.role,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'User removed from tenant',
    })
  } catch (error) {
    console.error('Tenant Users API DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
