import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { parseDocument } from '@/lib/services/ai-parsing'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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
    const body = await request.json()
    const { fileId } = body

    if (!fileId) {
      return NextResponse.json(
        { error: 'File ID is required' },
        { status: 400 }
      )
    }

    // Get file info
    const { data: file, error: fileError } = await supabase
      .from('project_files')
      .select('*, projects!inner(org_id)')
      .eq('id', fileId)
      .eq('project_id', projectId)
      .single()

    if (fileError || !file) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    // Verify user has access
    const { data: membership } = await supabase
      .from('user_organization_memberships')
      .select('roles')
      .eq('user_id', session.user.id)
      .eq('organization_id', file.projects.org_id)
      .single()

    if (!membership) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Check if already parsed
    const { data: existingParse } = await supabase
      .from('parsed_features')
      .select('*')
      .eq('file_id', fileId)
      .single()

    if (existingParse) {
      return NextResponse.json({
        message: 'File already parsed',
        parsed: existingParse
      })
    }

    // Parse the document
    const parseResult = await parseDocument({
      fileUrl: file.url,
      fileType: file.file_type,
      fileName: file.original_name
    })

    // Save parsed features
    const { data: parsedFeature, error: insertError } = await supabase
      .from('parsed_features')
      .insert({
        project_id: projectId,
        file_id: fileId,
        geojson: parseResult.geojson,
        scale: parseResult.scale,
        north_arrow: parseResult.northArrow,
        property_lines: parseResult.propertyLines,
        existing_structures: parseResult.existingStructures,
        trees: parseResult.trees,
        driveways: parseResult.driveways,
        annotations: parseResult.annotations,
        confidence_overall: parseResult.confidenceOverall,
        parsed_at: new Date().toISOString(),
        parsed_by: 'ai-parser-v1'
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json(
        { error: 'Failed to save parse results' },
        { status: 500 }
      )
    }

    // Update project with parsed data
    await supabase
      .from('projects')
      .update({
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)

    // Log audit event
    await supabase.from('compliance_audit_events').insert({
      org_id: file.projects.org_id,
      actor: session.user.id,
      action: 'file.parsed',
      resource: `file:${fileId}`,
      metadata: {
        fileName: file.original_name,
        confidence: parseResult.confidenceOverall,
        features: {
          scale: parseResult.scale?.detected,
          northArrow: parseResult.northArrow?.detected,
          propertyLines: parseResult.propertyLines?.features?.length || 0,
          structures: parseResult.existingStructures?.features?.length || 0,
          trees: parseResult.trees?.features?.length || 0
        }
      }
    })

    return NextResponse.json({
      message: 'Parsing complete',
      parsed: parsedFeature,
      confidence: parseResult.confidenceOverall,
      features: {
        scale: parseResult.scale,
        northArrow: parseResult.northArrow,
        propertyLines: parseResult.propertyLines?.features?.length || 0,
        structures: parseResult.existingStructures?.features?.length || 0,
        trees: parseResult.trees?.features?.length || 0,
        annotations: parseResult.annotations?.length || 0
      }
    })

  } catch (error) {
    console.error('Parse error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Parsing failed' },
      { status: 500 }
    )
  }
}

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

    // Get all parsed features for this project
    const { data: parsedFeatures, error } = await supabase
      .from('parsed_features')
      .select('*, project_files(original_name, file_type)')
      .eq('project_id', projectId)
      .order('parsed_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch parsed features' },
        { status: 500 }
      )
    }

    return NextResponse.json({ parsedFeatures })

  } catch (error) {
    console.error('Fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
