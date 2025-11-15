/**
 * Permit Applications API
 *
 * Manages permit applications with full CRUD operations
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PermitSystemService, PermitType } from '@/lib/services/permit-system'

const permitService = new PermitSystemService()

/**
 * GET: List permit applications with filtering
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const projectId = searchParams.get('projectId')
    const status = searchParams.get('status')
    const permitType = searchParams.get('permitType')
    const jurisdictionId = searchParams.get('jurisdictionId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    let query = supabase
      .from('permit_applications')
      .select('*, projects(name, org_id), jurisdictions:jurisdiction_id(name, type)', { count: 'exact' })

    // Filter by user's accessible projects
    const { data: userOrgs } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)

    if (!userOrgs || userOrgs.length === 0) {
      return NextResponse.json({
        success: true,
        applications: [],
        total: 0,
        limit,
        offset
      })
    }

    const orgIds = userOrgs.map(o => o.organization_id)

    // Apply filters
    if (projectId) {
      query = query.eq('project_id', projectId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (permitType) {
      query = query.eq('permit_type', permitType)
    }

    if (jurisdictionId) {
      query = query.eq('jurisdiction_id', jurisdictionId)
    }

    // Pagination
    query = query.range(offset, offset + limit - 1)
    query = query.order('created_at', { ascending: false })

    const { data: applications, error: queryError, count } = await query

    if (queryError) {
      throw queryError
    }

    // Filter by organization access
    const filteredApplications = applications?.filter(app =>
      orgIds.includes(app.projects?.org_id)
    ) || []

    return NextResponse.json({
      success: true,
      applications: filteredApplications,
      total: count || 0,
      limit,
      offset,
      hasMore: count ? (offset + limit < count) : false
    })
  } catch (error: any) {
    console.error('Error fetching permit applications:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * POST: Submit new permit application
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      projectId,
      permitType,
      applicant,
      property,
      projectDetails
    } = body

    // Validate required fields
    if (!projectId || !permitType || !applicant || !property || !projectDetails) {
      return NextResponse.json({
        error: 'Missing required fields: projectId, permitType, applicant, property, projectDetails'
      }, { status: 400 })
    }

    // Validate permit type
    const validPermitTypes: PermitType[] = [
      'building', 'electrical', 'plumbing', 'mechanical',
      'grading', 'zoning', 'demolition', 'fire'
    ]

    if (!validPermitTypes.includes(permitType)) {
      return NextResponse.json({
        error: `Invalid permit type. Must be one of: ${validPermitTypes.join(', ')}`
      }, { status: 400 })
    }

    // Verify project exists and user has access
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, org_id')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Verify organization membership
    const { data: membership } = await supabase
      .from('organization_members')
      .select('*')
      .eq('organization_id', project.org_id)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Find jurisdiction
    const jurisdiction = await permitService.findJurisdiction(property.address)

    if (!jurisdiction) {
      return NextResponse.json({
        error: 'Jurisdiction not found for the provided address'
      }, { status: 404 })
    }

    // Create application through service
    const application = await permitService.createApplication({
      projectId,
      userId: user.id,
      jurisdictionId: jurisdiction.id,
      permitType,
      applicant,
      property,
      projectDetails
    })

    // Store in database
    const { data: dbApplication, error: insertError } = await supabase
      .from('permit_applications')
      .insert({
        id: application.id,
        project_id: application.projectId,
        user_id: user.id,
        jurisdiction_id: application.jurisdictionId,
        permit_type: application.permitType,
        status: application.status,
        applicant: application.applicant,
        property: application.property,
        project_details: application.projectDetails,
        documents: application.documents,
        compliance_checks: application.complianceChecks,
        fees: application.fees,
        created_at: application.createdAt,
        updated_at: application.updatedAt
      })
      .select()
      .single()

    if (insertError) {
      throw insertError
    }

    return NextResponse.json({
      success: true,
      application: dbApplication
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating permit application:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * PUT: Update permit application
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Application ID required' }, { status: 400 })
    }

    // Get existing application
    const { data: existingApp, error: fetchError } = await supabase
      .from('permit_applications')
      .select('*, projects(org_id)')
      .eq('id', id)
      .single()

    if (fetchError || !existingApp) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    // Verify access
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', existingApp.projects.org_id)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Only allow updates for draft or resubmit status
    if (!['draft', 'resubmit'].includes(existingApp.status)) {
      return NextResponse.json({
        error: 'Cannot update application in current status'
      }, { status: 400 })
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    // Update allowed fields
    if (updates.applicant) updateData.applicant = updates.applicant
    if (updates.property) updateData.property = updates.property
    if (updates.projectDetails) updateData.project_details = updates.projectDetails
    if (updates.documents) updateData.documents = updates.documents
    if (updates.status) {
      // Only allow certain status transitions
      const allowedStatusChanges = ['draft', 'ready']
      if (allowedStatusChanges.includes(updates.status)) {
        updateData.status = updates.status
      }
    }

    // Update in database
    const { data: updatedApp, error: updateError } = await supabase
      .from('permit_applications')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({
      success: true,
      application: updatedApp
    })
  } catch (error: any) {
    console.error('Error updating permit application:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * DELETE: Withdraw permit application
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Application ID required' }, { status: 400 })
    }

    // Get existing application
    const { data: existingApp, error: fetchError } = await supabase
      .from('permit_applications')
      .select('*, projects(org_id)')
      .eq('id', id)
      .single()

    if (fetchError || !existingApp) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    // Verify access - must be admin or application creator
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', existingApp.projects.org_id)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const isAdmin = membership.role === 'admin' || membership.role === 'owner'
    const isCreator = existingApp.user_id === user.id

    if (!isAdmin && !isCreator) {
      return NextResponse.json({
        error: 'Only application creator or admin can withdraw'
      }, { status: 403 })
    }

    // Cannot delete submitted applications that are under review or approved
    if (['under_review', 'approved'].includes(existingApp.status)) {
      return NextResponse.json({
        error: 'Cannot withdraw application in current status. Contact jurisdiction directly.'
      }, { status: 400 })
    }

    const hardDelete = searchParams.get('hardDelete') === 'true'

    if (hardDelete) {
      // Permanently delete
      const { error: deleteError } = await supabase
        .from('permit_applications')
        .delete()
        .eq('id', id)

      if (deleteError) {
        throw deleteError
      }

      return NextResponse.json({
        success: true,
        message: 'Application permanently deleted'
      })
    } else {
      // Soft delete - update status to withdrawn
      const { error: updateError } = await supabase
        .from('permit_applications')
        .update({
          status: 'withdrawn',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (updateError) {
        throw updateError
      }

      return NextResponse.json({
        success: true,
        message: 'Application withdrawn'
      })
    }
  } catch (error: any) {
    console.error('Error deleting permit application:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
