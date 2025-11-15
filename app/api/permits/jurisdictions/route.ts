/**
 * Permit Jurisdictions API
 *
 * Manages jurisdiction information for permit submissions
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PermitSystemService } from '@/lib/services/permit-system'

const permitService = new PermitSystemService()

/**
 * GET: List available jurisdictions and get jurisdiction requirements
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action')
    const address = searchParams.get('address')
    const jurisdictionId = searchParams.get('jurisdictionId')
    const state = searchParams.get('state')
    const type = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Action: Find jurisdiction by address
    if (action === 'find' && address) {
      const jurisdiction = await permitService.findJurisdiction(address)

      if (!jurisdiction) {
        return NextResponse.json({
          success: false,
          error: 'No jurisdiction found for this address'
        }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        jurisdiction
      })
    }

    // Action: Get jurisdiction requirements
    if (action === 'requirements' && jurisdictionId) {
      const { data: jurisdiction, error: jurisdictionError } = await supabase
        .from('jurisdictions')
        .select('*')
        .eq('id', jurisdictionId)
        .single()

      if (jurisdictionError || !jurisdiction) {
        return NextResponse.json({ error: 'Jurisdiction not found' }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        requirements: jurisdiction.requirements,
        permitTypes: jurisdiction.requirements?.permitTypes || [],
        reviewProcess: jurisdiction.requirements?.reviewProcess,
        estimatedDays: jurisdiction.requirements?.estimatedDays,
        fees: jurisdiction.requirements?.fees || {},
        onlineSubmission: jurisdiction.online_submission,
        apiIntegration: jurisdiction.api_integration
      })
    }

    // Default: List jurisdictions with filtering
    let query = supabase
      .from('jurisdictions')
      .select('*', { count: 'exact' })

    // Apply filters
    if (state) {
      query = query.contains('location', { state: state })
    }

    if (type) {
      query = query.eq('type', type)
    }

    // Pagination
    query = query.range(offset, offset + limit - 1)
    query = query.order('name', { ascending: true })

    const { data: jurisdictions, error: queryError, count } = await query

    if (queryError) {
      throw queryError
    }

    return NextResponse.json({
      success: true,
      jurisdictions: jurisdictions || [],
      total: count || 0,
      limit,
      offset,
      hasMore: count ? (offset + limit < count) : false
    })
  } catch (error: any) {
    console.error('Error fetching jurisdictions:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * POST: Add jurisdiction (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is platform admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.role === 'admin' || profile?.role === 'superadmin'

    if (!isAdmin) {
      // Check if user is admin in any organization
      const { data: adminMemberships } = await supabase
        .from('organization_members')
        .select('role')
        .eq('user_id', user.id)
        .in('role', ['admin', 'owner'])

      if (!adminMemberships || adminMemberships.length === 0) {
        return NextResponse.json({
          error: 'Admin access required to add jurisdictions'
        }, { status: 403 })
      }
    }

    const body = await request.json()
    const {
      name,
      type,
      location,
      contact,
      requirements,
      onlineSubmission = false,
      apiIntegration = false,
      apiEndpoint
    } = body

    // Validate required fields
    if (!name || !type || !location || !contact || !requirements) {
      return NextResponse.json({
        error: 'Missing required fields: name, type, location, contact, requirements'
      }, { status: 400 })
    }

    // Validate type
    const validTypes = ['city', 'county', 'state']
    if (!validTypes.includes(type)) {
      return NextResponse.json({
        error: `Invalid type. Must be one of: ${validTypes.join(', ')}`
      }, { status: 400 })
    }

    // Validate location structure
    if (!location.state) {
      return NextResponse.json({
        error: 'Location must include state'
      }, { status: 400 })
    }

    // Validate contact structure
    const requiredContactFields = ['phone', 'email', 'website', 'address']
    const missingContactFields = requiredContactFields.filter(field => !contact[field])

    if (missingContactFields.length > 0) {
      return NextResponse.json({
        error: `Missing contact fields: ${missingContactFields.join(', ')}`
      }, { status: 400 })
    }

    // Validate requirements structure
    if (!requirements.permitTypes || !Array.isArray(requirements.permitTypes)) {
      return NextResponse.json({
        error: 'Requirements must include permitTypes array'
      }, { status: 400 })
    }

    if (!requirements.fees || typeof requirements.fees !== 'object') {
      return NextResponse.json({
        error: 'Requirements must include fees object'
      }, { status: 400 })
    }

    // Create jurisdiction
    const { data: jurisdiction, error: insertError } = await supabase
      .from('jurisdictions')
      .insert({
        name,
        type,
        location,
        contact,
        requirements,
        online_submission: onlineSubmission,
        api_integration: apiIntegration,
        api_endpoint: apiEndpoint,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (insertError) {
      throw insertError
    }

    return NextResponse.json({
      success: true,
      jurisdiction
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating jurisdiction:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * PUT: Update jurisdiction (admin only)
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is platform admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.role === 'admin' || profile?.role === 'superadmin'

    if (!isAdmin) {
      // Check if user is admin in any organization
      const { data: adminMemberships } = await supabase
        .from('organization_members')
        .select('role')
        .eq('user_id', user.id)
        .in('role', ['admin', 'owner'])

      if (!adminMemberships || adminMemberships.length === 0) {
        return NextResponse.json({
          error: 'Admin access required to update jurisdictions'
        }, { status: 403 })
      }
    }

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Jurisdiction ID required' }, { status: 400 })
    }

    // Get existing jurisdiction
    const { data: existingJurisdiction, error: fetchError } = await supabase
      .from('jurisdictions')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existingJurisdiction) {
      return NextResponse.json({ error: 'Jurisdiction not found' }, { status: 404 })
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    // Update allowed fields
    if (updates.name) updateData.name = updates.name
    if (updates.type) updateData.type = updates.type
    if (updates.location) updateData.location = updates.location
    if (updates.contact) updateData.contact = updates.contact
    if (updates.requirements) updateData.requirements = updates.requirements
    if (updates.onlineSubmission !== undefined) updateData.online_submission = updates.onlineSubmission
    if (updates.apiIntegration !== undefined) updateData.api_integration = updates.apiIntegration
    if (updates.apiEndpoint !== undefined) updateData.api_endpoint = updates.apiEndpoint

    // Update in database
    const { data: updatedJurisdiction, error: updateError } = await supabase
      .from('jurisdictions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({
      success: true,
      jurisdiction: updatedJurisdiction
    })
  } catch (error: any) {
    console.error('Error updating jurisdiction:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
