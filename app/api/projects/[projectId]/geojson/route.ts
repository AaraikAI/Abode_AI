import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { GeoJSONUtils } from '@/lib/geojson/types'
import type { FeatureCollection, Feature } from 'geojson'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * GET /api/projects/[projectId]/geojson
 * Retrieve GeoJSON data for a project
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { projectId } = params

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }

    // Verify project exists and user has access
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*, organizations!inner(id)')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Verify user has access to the organization
    const { data: membership } = await supabase
      .from('user_organization_memberships')
      .select('roles')
      .eq('user_id', session.user.id)
      .eq('organization_id', project.organizations.id)
      .single()

    if (!membership) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Get all parsed features for this project
    const { data: parsedFeatures, error: featuresError } = await supabase
      .from('parsed_features')
      .select('*')
      .eq('project_id', projectId)
      .order('parsed_at', { ascending: false })

    if (featuresError) {
      console.error('Database error:', featuresError)
      return NextResponse.json(
        { error: 'Failed to fetch GeoJSON data' },
        { status: 500 }
      )
    }

    // Merge all GeoJSON features into a single FeatureCollection
    const mergedFeatures: Feature[] = []

    if (parsedFeatures && parsedFeatures.length > 0) {
      for (const parsed of parsedFeatures) {
        if (parsed.geojson?.type === 'FeatureCollection') {
          mergedFeatures.push(...(parsed.geojson.features || []))
        } else if (parsed.geojson?.type === 'Feature') {
          mergedFeatures.push(parsed.geojson)
        }
      }
    }

    const featureCollection: FeatureCollection = {
      type: 'FeatureCollection',
      features: mergedFeatures
    }

    // Calculate bounding box if features exist
    if (mergedFeatures.length > 0) {
      const bbox = GeoJSONUtils.calculateBBox(featureCollection)
      return NextResponse.json({
        ...featureCollection,
        bbox
      })
    }

    return NextResponse.json(featureCollection)

  } catch (error) {
    console.error('GET GeoJSON error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/projects/[projectId]/geojson
 * Add/update GeoJSON features for a project
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { projectId } = params

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { features, fileId } = body

    if (!features || !Array.isArray(features)) {
      return NextResponse.json(
        { error: 'Features array is required' },
        { status: 400 }
      )
    }

    // Validate each feature
    for (const feature of features) {
      if (!feature.type || feature.type !== 'Feature') {
        return NextResponse.json(
          { error: 'Invalid feature type. Each item must be a GeoJSON Feature' },
          { status: 400 }
        )
      }
      if (!feature.geometry || !feature.geometry.type) {
        return NextResponse.json(
          { error: 'Each feature must have a valid geometry' },
          { status: 400 }
        )
      }
    }

    // Verify project exists and user has access
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*, organizations!inner(id)')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Verify user has designer or admin role
    const { data: membership } = await supabase
      .from('user_organization_memberships')
      .select('roles')
      .eq('user_id', session.user.id)
      .eq('organization_id', project.organizations.id)
      .single()

    if (!membership || (!membership.roles.includes('designer') && !membership.roles.includes('admin'))) {
      return NextResponse.json(
        { error: 'Forbidden - Designer or Admin role required' },
        { status: 403 }
      )
    }

    // Get existing parsed features for this project
    const { data: existingParsed } = await supabase
      .from('parsed_features')
      .select('*')
      .eq('project_id', projectId)
      .order('parsed_at', { ascending: false })
      .limit(1)
      .single()

    const newFeatureCollection: FeatureCollection = {
      type: 'FeatureCollection',
      features
    }

    // Validate the GeoJSON
    const validation = GeoJSONUtils.validate(newFeatureCollection)
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Invalid GeoJSON', details: validation.errors },
        { status: 400 }
      )
    }

    let savedFeature

    if (existingParsed) {
      // Merge new features with existing ones
      const existingFeatures = existingParsed.geojson?.features || []
      const mergedFeatures = [...existingFeatures, ...features]

      const mergedCollection: FeatureCollection = {
        type: 'FeatureCollection',
        features: mergedFeatures
      }

      const { data: updated, error: updateError } = await supabase
        .from('parsed_features')
        .update({
          geojson: mergedCollection,
          parsed_at: new Date().toISOString(),
          parsed_by: `user:${session.user.id}`
        })
        .eq('id', existingParsed.id)
        .select()
        .single()

      if (updateError) {
        console.error('Update error:', updateError)
        return NextResponse.json(
          { error: 'Failed to update GeoJSON features' },
          { status: 500 }
        )
      }

      savedFeature = updated
    } else {
      // Create new parsed features entry
      const { data: inserted, error: insertError } = await supabase
        .from('parsed_features')
        .insert({
          project_id: projectId,
          file_id: fileId || null,
          geojson: newFeatureCollection,
          confidence_overall: 1.0,
          parsed_at: new Date().toISOString(),
          parsed_by: `user:${session.user.id}`
        })
        .select()
        .single()

      if (insertError) {
        console.error('Insert error:', insertError)
        return NextResponse.json(
          { error: 'Failed to save GeoJSON features' },
          { status: 500 }
        )
      }

      savedFeature = inserted
    }

    // Update project timestamp
    await supabase
      .from('projects')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', projectId)

    // Log audit event
    await supabase.from('compliance_audit_events').insert({
      org_id: project.organizations.id,
      actor: session.user.id,
      action: 'geojson.features.added',
      resource: `project:${projectId}`,
      metadata: {
        featureCount: features.length,
        fileId: fileId || null
      }
    })

    return NextResponse.json({
      message: 'Features added successfully',
      featureCount: features.length,
      parsed: savedFeature
    })

  } catch (error) {
    console.error('POST GeoJSON error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/projects/[projectId]/geojson
 * Replace entire GeoJSON FeatureCollection for a project
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { projectId } = params

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }

    const body = await request.json()

    if (!body.type || body.type !== 'FeatureCollection') {
      return NextResponse.json(
        { error: 'Request body must be a GeoJSON FeatureCollection' },
        { status: 400 }
      )
    }

    if (!body.features || !Array.isArray(body.features)) {
      return NextResponse.json(
        { error: 'FeatureCollection must have a features array' },
        { status: 400 }
      )
    }

    // Validate the GeoJSON
    const validation = GeoJSONUtils.validate(body)
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Invalid GeoJSON', details: validation.errors },
        { status: 400 }
      )
    }

    // Verify project exists and user has access
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*, organizations!inner(id)')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Verify user has designer or admin role
    const { data: membership } = await supabase
      .from('user_organization_memberships')
      .select('roles')
      .eq('user_id', session.user.id)
      .eq('organization_id', project.organizations.id)
      .single()

    if (!membership || (!membership.roles.includes('designer') && !membership.roles.includes('admin'))) {
      return NextResponse.json(
        { error: 'Forbidden - Designer or Admin role required' },
        { status: 403 }
      )
    }

    // Get existing parsed features
    const { data: existingParsed } = await supabase
      .from('parsed_features')
      .select('*')
      .eq('project_id', projectId)
      .order('parsed_at', { ascending: false })
      .limit(1)
      .single()

    let savedFeature

    if (existingParsed) {
      // Replace existing features
      const { data: updated, error: updateError } = await supabase
        .from('parsed_features')
        .update({
          geojson: body,
          parsed_at: new Date().toISOString(),
          parsed_by: `user:${session.user.id}`
        })
        .eq('id', existingParsed.id)
        .select()
        .single()

      if (updateError) {
        console.error('Update error:', updateError)
        return NextResponse.json(
          { error: 'Failed to replace GeoJSON features' },
          { status: 500 }
        )
      }

      savedFeature = updated
    } else {
      // Create new entry
      const { data: inserted, error: insertError } = await supabase
        .from('parsed_features')
        .insert({
          project_id: projectId,
          geojson: body,
          confidence_overall: 1.0,
          parsed_at: new Date().toISOString(),
          parsed_by: `user:${session.user.id}`
        })
        .select()
        .single()

      if (insertError) {
        console.error('Insert error:', insertError)
        return NextResponse.json(
          { error: 'Failed to save GeoJSON features' },
          { status: 500 }
        )
      }

      savedFeature = inserted
    }

    // Update project timestamp
    await supabase
      .from('projects')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', projectId)

    // Log audit event
    await supabase.from('compliance_audit_events').insert({
      org_id: project.organizations.id,
      actor: session.user.id,
      action: 'geojson.replaced',
      resource: `project:${projectId}`,
      metadata: {
        featureCount: body.features.length
      }
    })

    return NextResponse.json({
      message: 'FeatureCollection replaced successfully',
      featureCount: body.features.length,
      parsed: savedFeature
    })

  } catch (error) {
    console.error('PUT GeoJSON error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/projects/[projectId]/geojson
 * Remove specific features or all GeoJSON data
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { projectId } = params

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }

    const { searchParams } = new URL(request.url)
    const featureIds = searchParams.get('featureIds')?.split(',') || []
    const deleteAll = searchParams.get('all') === 'true'

    // Verify project exists and user has access
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*, organizations!inner(id)')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Verify user has designer or admin role
    const { data: membership } = await supabase
      .from('user_organization_memberships')
      .select('roles')
      .eq('user_id', session.user.id)
      .eq('organization_id', project.organizations.id)
      .single()

    if (!membership || (!membership.roles.includes('designer') && !membership.roles.includes('admin'))) {
      return NextResponse.json(
        { error: 'Forbidden - Designer or Admin role required' },
        { status: 403 }
      )
    }

    if (deleteAll) {
      // Delete all parsed features for this project
      const { error: deleteError } = await supabase
        .from('parsed_features')
        .delete()
        .eq('project_id', projectId)

      if (deleteError) {
        console.error('Delete error:', deleteError)
        return NextResponse.json(
          { error: 'Failed to delete GeoJSON features' },
          { status: 500 }
        )
      }

      // Log audit event
      await supabase.from('compliance_audit_events').insert({
        org_id: project.organizations.id,
        actor: session.user.id,
        action: 'geojson.deleted.all',
        resource: `project:${projectId}`,
        metadata: {}
      })

      return NextResponse.json({
        message: 'All GeoJSON features deleted successfully'
      })
    }

    if (featureIds.length === 0) {
      return NextResponse.json(
        { error: 'Feature IDs are required or use ?all=true to delete all' },
        { status: 400 }
      )
    }

    // Get existing parsed features
    const { data: existingParsed } = await supabase
      .from('parsed_features')
      .select('*')
      .eq('project_id', projectId)
      .order('parsed_at', { ascending: false })
      .limit(1)
      .single()

    if (!existingParsed) {
      return NextResponse.json(
        { error: 'No GeoJSON features found for this project' },
        { status: 404 }
      )
    }

    // Filter out features with matching IDs
    const existingFeatures = existingParsed.geojson?.features || []
    const filteredFeatures = existingFeatures.filter(
      (feature: any) => !featureIds.includes(feature.id)
    )

    if (filteredFeatures.length === existingFeatures.length) {
      return NextResponse.json(
        { error: 'No features found with the specified IDs' },
        { status: 404 }
      )
    }

    const updatedCollection: FeatureCollection = {
      type: 'FeatureCollection',
      features: filteredFeatures
    }

    // Update the parsed features
    const { error: updateError } = await supabase
      .from('parsed_features')
      .update({
        geojson: updatedCollection,
        parsed_at: new Date().toISOString(),
        parsed_by: `user:${session.user.id}`
      })
      .eq('id', existingParsed.id)

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to delete features' },
        { status: 500 }
      )
    }

    // Update project timestamp
    await supabase
      .from('projects')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', projectId)

    // Log audit event
    await supabase.from('compliance_audit_events').insert({
      org_id: project.organizations.id,
      actor: session.user.id,
      action: 'geojson.features.deleted',
      resource: `project:${projectId}`,
      metadata: {
        deletedCount: existingFeatures.length - filteredFeatures.length,
        featureIds
      }
    })

    return NextResponse.json({
      message: 'Features deleted successfully',
      deletedCount: existingFeatures.length - filteredFeatures.length,
      remainingCount: filteredFeatures.length
    })

  } catch (error) {
    console.error('DELETE GeoJSON error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
