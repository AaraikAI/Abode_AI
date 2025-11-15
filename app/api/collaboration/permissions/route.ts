/**
 * Collaboration Permissions API Endpoint
 *
 * Manages resource-level permissions and access control
 * Supports GET, POST, PUT, DELETE operations
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface Permission {
  id: string
  resource_id: string
  resource_type: 'project' | 'model' | 'document' | 'folder' | 'dataset'
  grantee_type: 'user' | 'team' | 'organization' | 'public'
  grantee_id?: string
  permissions: Array<'read' | 'write' | 'delete' | 'share' | 'admin'>
  granted_by: string
  granted_at: string
  expires_at?: string | null
  conditions?: {
    ip_whitelist?: string[]
    time_restrictions?: {
      start_time?: string
      end_time?: string
      days_of_week?: number[]
    }
    requires_mfa?: boolean
  }
  metadata?: Record<string, any>
  status: 'active' | 'revoked' | 'expired'
  grantee?: {
    id: string
    name: string
    email?: string
    type: string
  }
  granted_by_user?: {
    id: string
    name: string
    email: string
  }
}

interface GrantPermissionRequest {
  resourceId: string
  resourceType: Permission['resource_type']
  granteeType: Permission['grantee_type']
  granteeId?: string
  permissions: Permission['permissions']
  expiresAt?: string
  conditions?: Permission['conditions']
  metadata?: Record<string, any>
}

interface UpdatePermissionRequest {
  id: string
  permissions?: Permission['permissions']
  expiresAt?: string | null
  conditions?: Permission['conditions']
  metadata?: Record<string, any>
}

/**
 * Verify user has admin access to resource
 */
async function hasAdminAccess(
  supabase: any,
  userId: string,
  resourceId: string,
  resourceType: string
): Promise<{ hasAccess: boolean; orgId?: string; error?: string }> {
  // For projects, check organization membership
  if (resourceType === 'project') {
    const { data: project } = await supabase
      .from('projects')
      .select('id, org_id, user_id')
      .eq('id', resourceId)
      .single()

    if (!project) {
      return { hasAccess: false, error: 'Project not found' }
    }

    // Project owner has admin access
    if (project.user_id === userId) {
      return { hasAccess: true, orgId: project.org_id }
    }

    // Check org admin/owner role
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', project.org_id)
      .eq('user_id', userId)
      .single()

    if (!membership) {
      return { hasAccess: false, error: 'Access denied' }
    }

    const hasRole = membership.role === 'admin' || membership.role === 'owner'
    return { hasAccess: hasRole, orgId: project.org_id }
  }

  // For other resources, check parent project permissions
  const resourceTable = resourceType === 'model' ? 'models' :
                       resourceType === 'document' ? 'documents' :
                       resourceType === 'folder' ? 'folders' : 'datasets'

  const { data: resource } = await supabase
    .from(resourceTable)
    .select('project_id')
    .eq('id', resourceId)
    .single()

  if (!resource) {
    return { hasAccess: false, error: `${resourceType} not found` }
  }

  // Recursively check project access
  return hasAdminAccess(supabase, userId, resource.project_id, 'project')
}

/**
 * GET - Get resource permissions
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
    const resourceId = searchParams.get('resourceId')
    const resourceType = searchParams.get('resourceType')
    const granteeType = searchParams.get('granteeType')
    const granteeId = searchParams.get('granteeId')
    const status = searchParams.get('status') || 'active'
    const includeExpired = searchParams.get('includeExpired') === 'true'

    if (!resourceId || !resourceType) {
      return NextResponse.json(
        { error: 'Missing required parameters: resourceId, resourceType' },
        { status: 400 }
      )
    }

    // Verify user has access to view permissions
    const { hasAccess, error: accessError } = await hasAdminAccess(
      supabase,
      user.id,
      resourceId,
      resourceType
    )

    if (!hasAccess) {
      return NextResponse.json(
        { error: accessError || 'Access denied' },
        { status: 403 }
      )
    }

    // Build query
    let query = supabase
      .from('permissions')
      .select(`
        *,
        granted_by_user:users!permissions_granted_by_fkey(id, name, email)
      `)
      .eq('resource_id', resourceId)
      .eq('resource_type', resourceType)

    if (!includeExpired) {
      query = query.eq('status', status)
    }

    if (granteeType) {
      query = query.eq('grantee_type', granteeType)
    }

    if (granteeId) {
      query = query.eq('grantee_id', granteeId)
    }

    const { data: permissions, error } = await query.order('granted_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch permissions:', error)
      return NextResponse.json(
        { error: 'Failed to fetch permissions' },
        { status: 500 }
      )
    }

    // Enrich with grantee information
    const enrichedPermissions = await Promise.all(
      (permissions || []).map(async (perm: any) => {
        if (perm.grantee_type === 'user' && perm.grantee_id) {
          const { data: user } = await supabase
            .from('users')
            .select('id, name, email')
            .eq('id', perm.grantee_id)
            .single()

          return {
            ...perm,
            grantee: user ? { ...user, type: 'user' } : null
          }
        } else if (perm.grantee_type === 'team' && perm.grantee_id) {
          const { data: team } = await supabase
            .from('teams')
            .select('id, name')
            .eq('id', perm.grantee_id)
            .single()

          return {
            ...perm,
            grantee: team ? { ...team, type: 'team' } : null
          }
        } else if (perm.grantee_type === 'organization' && perm.grantee_id) {
          const { data: org } = await supabase
            .from('organizations')
            .select('id, name')
            .eq('id', perm.grantee_id)
            .single()

          return {
            ...perm,
            grantee: org ? { ...org, type: 'organization' } : null
          }
        }

        return perm
      })
    )

    // Check for expired permissions
    const now = new Date()
    const activePermissions = enrichedPermissions.map((perm: any) => {
      if (perm.expires_at && new Date(perm.expires_at) < now && perm.status === 'active') {
        // Mark as expired (update in background)
        supabase
          .from('permissions')
          .update({ status: 'expired' })
          .eq('id', perm.id)
          .then(() => {})

        return { ...perm, status: 'expired' }
      }
      return perm
    })

    return NextResponse.json({
      permissions: activePermissions as Permission[]
    })
  } catch (error) {
    console.error('Permissions API GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST - Grant permissions
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json() as GrantPermissionRequest

    // Validate request
    if (!body.resourceId || !body.resourceType || !body.granteeType || !body.permissions) {
      return NextResponse.json(
        { error: 'Missing required fields: resourceId, resourceType, granteeType, permissions' },
        { status: 400 }
      )
    }

    if (body.permissions.length === 0) {
      return NextResponse.json(
        { error: 'At least one permission must be specified' },
        { status: 400 }
      )
    }

    // Validate permission values
    const validPermissions = ['read', 'write', 'delete', 'share', 'admin']
    const invalidPerms = body.permissions.filter(p => !validPermissions.includes(p))
    if (invalidPerms.length > 0) {
      return NextResponse.json(
        { error: `Invalid permissions: ${invalidPerms.join(', ')}` },
        { status: 400 }
      )
    }

    // Verify user has admin access to resource
    const { hasAccess, orgId, error: accessError } = await hasAdminAccess(
      supabase,
      user.id,
      body.resourceId,
      body.resourceType
    )

    if (!hasAccess) {
      return NextResponse.json(
        { error: accessError || 'Access denied. Admin permissions required.' },
        { status: 403 }
      )
    }

    // Validate grantee
    if (body.granteeType !== 'public' && !body.granteeId) {
      return NextResponse.json(
        { error: 'granteeId required for non-public permissions' },
        { status: 400 }
      )
    }

    if (body.granteeType === 'user' && body.granteeId) {
      // Verify user exists and is in same org
      const { data: targetUser } = await supabase
        .from('organization_members')
        .select('user_id')
        .eq('organization_id', orgId)
        .eq('user_id', body.granteeId)
        .single()

      if (!targetUser) {
        return NextResponse.json(
          { error: 'User not found in organization' },
          { status: 404 }
        )
      }
    } else if (body.granteeType === 'team' && body.granteeId) {
      // Verify team exists
      const { data: team } = await supabase
        .from('teams')
        .select('id, org_id')
        .eq('id', body.granteeId)
        .single()

      if (!team) {
        return NextResponse.json(
          { error: 'Team not found' },
          { status: 404 }
        )
      }

      if (team.org_id !== orgId) {
        return NextResponse.json(
          { error: 'Team belongs to different organization' },
          { status: 400 }
        )
      }
    }

    // Validate expiration date
    if (body.expiresAt) {
      const expiresAt = new Date(body.expiresAt)
      if (isNaN(expiresAt.getTime())) {
        return NextResponse.json(
          { error: 'Invalid expiresAt date format' },
          { status: 400 }
        )
      }

      if (expiresAt <= new Date()) {
        return NextResponse.json(
          { error: 'expiresAt must be in the future' },
          { status: 400 }
        )
      }
    }

    // Check for existing active permission
    const { data: existingPerm } = await supabase
      .from('permissions')
      .select('id')
      .eq('resource_id', body.resourceId)
      .eq('resource_type', body.resourceType)
      .eq('grantee_type', body.granteeType)
      .eq('grantee_id', body.granteeId || '')
      .eq('status', 'active')
      .single()

    if (existingPerm) {
      return NextResponse.json(
        { error: 'Active permission already exists for this grantee. Update or revoke it first.' },
        { status: 409 }
      )
    }

    // Create permission
    const { data: permission, error } = await supabase
      .from('permissions')
      .insert({
        resource_id: body.resourceId,
        resource_type: body.resourceType,
        grantee_type: body.granteeType,
        grantee_id: body.granteeId,
        permissions: body.permissions,
        granted_by: user.id,
        expires_at: body.expiresAt,
        conditions: body.conditions,
        metadata: body.metadata,
        status: 'active'
      })
      .select(`
        *,
        granted_by_user:users!permissions_granted_by_fkey(id, name, email)
      `)
      .single()

    if (error || !permission) {
      console.error('Failed to create permission:', error)
      return NextResponse.json(
        { error: 'Failed to grant permission' },
        { status: 500 }
      )
    }

    // Record activity
    await supabase.from('activities').insert({
      project_id: body.resourceType === 'project' ? body.resourceId : null,
      user_id: user.id,
      action: 'permission_granted',
      metadata: {
        permission_id: permission.id,
        resource_type: body.resourceType,
        resource_id: body.resourceId,
        grantee_type: body.granteeType,
        grantee_id: body.granteeId,
        permissions: body.permissions
      }
    })

    // Notify grantee
    if (body.granteeType === 'user' && body.granteeId) {
      await supabase.from('notifications').insert({
        user_id: body.granteeId,
        type: 'permission_granted',
        title: 'New permissions granted',
        message: `You have been granted ${body.permissions.join(', ')} permissions`,
        metadata: {
          permission_id: permission.id,
          resource_type: body.resourceType,
          resource_id: body.resourceId,
          granted_by: user.id
        }
      })
    }

    return NextResponse.json({
      success: true,
      permission: permission as Permission
    }, { status: 201 })
  } catch (error) {
    console.error('Permissions API POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT - Update permissions
 */
export async function PUT(request: NextRequest) {
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

    const body = await request.json() as UpdatePermissionRequest

    // Validate request
    if (!body.id) {
      return NextResponse.json(
        { error: 'Missing required field: id' },
        { status: 400 }
      )
    }

    // Fetch existing permission
    const { data: existingPerm } = await supabase
      .from('permissions')
      .select('*')
      .eq('id', body.id)
      .single()

    if (!existingPerm) {
      return NextResponse.json(
        { error: 'Permission not found' },
        { status: 404 }
      )
    }

    // Verify user has admin access to resource
    const { hasAccess, error: accessError } = await hasAdminAccess(
      supabase,
      user.id,
      existingPerm.resource_id,
      existingPerm.resource_type
    )

    if (!hasAccess) {
      return NextResponse.json(
        { error: accessError || 'Access denied' },
        { status: 403 }
      )
    }

    // Validate permissions if provided
    if (body.permissions) {
      if (body.permissions.length === 0) {
        return NextResponse.json(
          { error: 'At least one permission must be specified' },
          { status: 400 }
        )
      }

      const validPermissions = ['read', 'write', 'delete', 'share', 'admin']
      const invalidPerms = body.permissions.filter(p => !validPermissions.includes(p))
      if (invalidPerms.length > 0) {
        return NextResponse.json(
          { error: `Invalid permissions: ${invalidPerms.join(', ')}` },
          { status: 400 }
        )
      }
    }

    // Validate expiration date if provided
    if (body.expiresAt !== undefined && body.expiresAt !== null) {
      const expiresAt = new Date(body.expiresAt)
      if (isNaN(expiresAt.getTime())) {
        return NextResponse.json(
          { error: 'Invalid expiresAt date format' },
          { status: 400 }
        )
      }

      if (expiresAt <= new Date()) {
        return NextResponse.json(
          { error: 'expiresAt must be in the future' },
          { status: 400 }
        )
      }
    }

    // Update permission
    const updateData: any = {}
    if (body.permissions) updateData.permissions = body.permissions
    if (body.expiresAt !== undefined) updateData.expires_at = body.expiresAt
    if (body.conditions) updateData.conditions = body.conditions
    if (body.metadata) updateData.metadata = body.metadata

    const { data: permission, error } = await supabase
      .from('permissions')
      .update(updateData)
      .eq('id', body.id)
      .select(`
        *,
        granted_by_user:users!permissions_granted_by_fkey(id, name, email)
      `)
      .single()

    if (error || !permission) {
      console.error('Failed to update permission:', error)
      return NextResponse.json(
        { error: 'Failed to update permission' },
        { status: 500 }
      )
    }

    // Record activity
    await supabase.from('activities').insert({
      project_id: existingPerm.resource_type === 'project' ? existingPerm.resource_id : null,
      user_id: user.id,
      action: 'permission_updated',
      metadata: {
        permission_id: permission.id,
        changes: updateData
      }
    })

    return NextResponse.json({
      success: true,
      permission: permission as Permission
    })
  } catch (error) {
    console.error('Permissions API PUT error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Revoke permissions
 */
export async function DELETE(request: NextRequest) {
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
    const permissionId = searchParams.get('id')
    const hardDelete = searchParams.get('hardDelete') === 'true'

    if (!permissionId) {
      return NextResponse.json(
        { error: 'Missing required parameter: id' },
        { status: 400 }
      )
    }

    // Fetch existing permission
    const { data: existingPerm } = await supabase
      .from('permissions')
      .select('*')
      .eq('id', permissionId)
      .single()

    if (!existingPerm) {
      return NextResponse.json(
        { error: 'Permission not found' },
        { status: 404 }
      )
    }

    // Verify user has admin access to resource
    const { hasAccess, error: accessError } = await hasAdminAccess(
      supabase,
      user.id,
      existingPerm.resource_id,
      existingPerm.resource_type
    )

    if (!hasAccess) {
      return NextResponse.json(
        { error: accessError || 'Access denied' },
        { status: 403 }
      )
    }

    if (hardDelete) {
      // Permanently delete permission
      const { error } = await supabase
        .from('permissions')
        .delete()
        .eq('id', permissionId)

      if (error) {
        console.error('Failed to delete permission:', error)
        return NextResponse.json(
          { error: 'Failed to delete permission' },
          { status: 500 }
        )
      }
    } else {
      // Soft delete - mark as revoked
      const { error } = await supabase
        .from('permissions')
        .update({ status: 'revoked' })
        .eq('id', permissionId)

      if (error) {
        console.error('Failed to revoke permission:', error)
        return NextResponse.json(
          { error: 'Failed to revoke permission' },
          { status: 500 }
        )
      }
    }

    // Record activity
    await supabase.from('activities').insert({
      project_id: existingPerm.resource_type === 'project' ? existingPerm.resource_id : null,
      user_id: user.id,
      action: hardDelete ? 'permission_deleted' : 'permission_revoked',
      metadata: {
        permission_id: permissionId,
        resource_type: existingPerm.resource_type,
        resource_id: existingPerm.resource_id
      }
    })

    // Notify grantee
    if (existingPerm.grantee_type === 'user' && existingPerm.grantee_id) {
      await supabase.from('notifications').insert({
        user_id: existingPerm.grantee_id,
        type: 'permission_revoked',
        title: 'Permissions revoked',
        message: `Your ${existingPerm.permissions.join(', ')} permissions have been revoked`,
        metadata: {
          permission_id: permissionId,
          resource_type: existingPerm.resource_type,
          resource_id: existingPerm.resource_id
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: hardDelete ? 'Permission permanently deleted' : 'Permission revoked'
    })
  } catch (error) {
    console.error('Permissions API DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
