/**
 * Collaboration Versions API Endpoint
 *
 * Manages project version history and snapshots
 * Supports GET, POST operations
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createHash } from 'crypto'

interface Version {
  id: string
  project_id: string
  version_number: string
  name?: string
  description?: string
  created_by: string
  created_at: string
  snapshot_data: {
    models?: Array<{
      id: string
      name: string
      type: string
      url: string
      checksum: string
      size: number
    }>
    documents?: Array<{
      id: string
      name: string
      type: string
      url: string
      checksum: string
      size: number
    }>
    settings?: Record<string, any>
    metadata?: Record<string, any>
  }
  changes_summary?: {
    added: string[]
    modified: string[]
    removed: string[]
    stats: {
      files_changed: number
      additions: number
      deletions: number
    }
  }
  tags?: string[]
  is_major: boolean
  parent_version_id?: string | null
  commit_hash?: string
  size_bytes: number
  status: 'active' | 'archived' | 'deleted'
  user?: {
    id: string
    name: string
    email: string
    avatar_url?: string
  }
}

interface CreateVersionRequest {
  projectId: string
  versionNumber?: string
  name?: string
  description?: string
  snapshotData: Version['snapshot_data']
  changesSummary?: Version['changes_summary']
  tags?: string[]
  isMajor?: boolean
  parentVersionId?: string
}

/**
 * Generate version number
 */
function generateVersionNumber(
  latestVersion: string | null,
  isMajor: boolean
): string {
  if (!latestVersion) {
    return '1.0.0'
  }

  const parts = latestVersion.split('.').map(Number)
  if (parts.length !== 3) {
    return '1.0.0'
  }

  let [major, minor, patch] = parts

  if (isMajor) {
    major += 1
    minor = 0
    patch = 0
  } else {
    minor += 1
    patch = 0
  }

  return `${major}.${minor}.${patch}`
}

/**
 * Calculate snapshot checksum
 */
function calculateChecksum(data: any): string {
  const hash = createHash('sha256')
  hash.update(JSON.stringify(data))
  return hash.digest('hex')
}

/**
 * Calculate snapshot size
 */
function calculateSize(data: any): number {
  return JSON.stringify(data).length
}

/**
 * Compare versions to generate changes summary
 */
async function compareVersions(
  supabase: any,
  projectId: string,
  parentVersionId: string | undefined,
  newSnapshotData: Version['snapshot_data']
): Promise<Version['changes_summary'] | undefined> {
  if (!parentVersionId) {
    return undefined
  }

  const { data: parentVersion } = await supabase
    .from('versions')
    .select('snapshot_data')
    .eq('id', parentVersionId)
    .single()

  if (!parentVersion) {
    return undefined
  }

  const added: string[] = []
  const modified: string[] = []
  const removed: string[] = []

  // Compare models
  const oldModelIds = new Set((parentVersion.snapshot_data.models || []).map((m: any) => m.id))
  const newModelIds = new Set((newSnapshotData.models || []).map((m: any) => m.id))

  newSnapshotData.models?.forEach((model) => {
    if (!oldModelIds.has(model.id)) {
      added.push(`model:${model.name}`)
    } else {
      const oldModel = parentVersion.snapshot_data.models?.find((m: any) => m.id === model.id)
      if (oldModel && oldModel.checksum !== model.checksum) {
        modified.push(`model:${model.name}`)
      }
    }
  })

  parentVersion.snapshot_data.models?.forEach((model: any) => {
    if (!newModelIds.has(model.id)) {
      removed.push(`model:${model.name}`)
    }
  })

  // Compare documents
  const oldDocIds = new Set((parentVersion.snapshot_data.documents || []).map((d: any) => d.id))
  const newDocIds = new Set((newSnapshotData.documents || []).map((d: any) => d.id))

  newSnapshotData.documents?.forEach((doc) => {
    if (!oldDocIds.has(doc.id)) {
      added.push(`document:${doc.name}`)
    } else {
      const oldDoc = parentVersion.snapshot_data.documents?.find((d: any) => d.id === doc.id)
      if (oldDoc && oldDoc.checksum !== doc.checksum) {
        modified.push(`document:${doc.name}`)
      }
    }
  })

  parentVersion.snapshot_data.documents?.forEach((doc: any) => {
    if (!newDocIds.has(doc.id)) {
      removed.push(`document:${doc.name}`)
    }
  })

  return {
    added,
    modified,
    removed,
    stats: {
      files_changed: added.length + modified.length + removed.length,
      additions: added.length,
      deletions: removed.length
    }
  }
}

/**
 * GET - List project versions/history
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
    const projectId = searchParams.get('projectId')
    const versionId = searchParams.get('versionId')
    const status = searchParams.get('status') || 'active'
    const isMajor = searchParams.get('isMajor')
    const tags = searchParams.get('tags')?.split(',')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!projectId) {
      return NextResponse.json(
        { error: 'Missing required parameter: projectId' },
        { status: 400 }
      )
    }

    // Verify user has access to project
    const { data: project } = await supabase
      .from('projects')
      .select('id, org_id')
      .eq('id', projectId)
      .single()

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Check user is member of organization
    const { data: membership } = await supabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', project.org_id)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // If specific version requested
    if (versionId) {
      const { data: version, error } = await supabase
        .from('versions')
        .select(`
          *,
          user:users!versions_created_by_fkey(id, name, email, avatar_url)
        `)
        .eq('id', versionId)
        .eq('project_id', projectId)
        .single()

      if (error || !version) {
        return NextResponse.json(
          { error: 'Version not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        version: version as Version
      })
    }

    // Build query for list
    let query = supabase
      .from('versions')
      .select(`
        *,
        user:users!versions_created_by_fkey(id, name, email, avatar_url)
      `, { count: 'exact' })
      .eq('project_id', projectId)
      .eq('status', status)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (isMajor !== null) {
      query = query.eq('is_major', isMajor === 'true')
    }

    if (tags && tags.length > 0) {
      query = query.contains('tags', tags)
    }

    const { data: versions, error, count } = await query

    if (error) {
      console.error('Failed to fetch versions:', error)
      return NextResponse.json(
        { error: 'Failed to fetch versions' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      versions: versions as Version[],
      total: count || 0,
      limit,
      offset,
      hasMore: (offset + limit) < (count || 0)
    })
  } catch (error) {
    console.error('Versions API GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST - Create new version/snapshot
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

    const body = await request.json() as CreateVersionRequest

    // Validate request
    if (!body.projectId || !body.snapshotData) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, snapshotData' },
        { status: 400 }
      )
    }

    // Verify user has access to project
    const { data: project } = await supabase
      .from('projects')
      .select('id, org_id')
      .eq('id', body.projectId)
      .single()

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Check user is member of organization with write access
    const { data: membership } = await supabase
      .from('organization_members')
      .select('id, role')
      .eq('organization_id', project.org_id)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Viewers cannot create versions
    if (membership.role === 'viewer') {
      return NextResponse.json(
        { error: 'Insufficient permissions. Viewers cannot create versions.' },
        { status: 403 }
      )
    }

    // Get latest version for this project
    const { data: latestVersion } = await supabase
      .from('versions')
      .select('version_number')
      .eq('project_id', body.projectId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // Generate version number if not provided
    const versionNumber = body.versionNumber || generateVersionNumber(
      latestVersion?.version_number || null,
      body.isMajor || false
    )

    // Check if version number already exists
    if (body.versionNumber) {
      const { data: existingVersion } = await supabase
        .from('versions')
        .select('id')
        .eq('project_id', body.projectId)
        .eq('version_number', body.versionNumber)
        .single()

      if (existingVersion) {
        return NextResponse.json(
          { error: `Version ${body.versionNumber} already exists` },
          { status: 409 }
        )
      }
    }

    // Validate parent version if specified
    if (body.parentVersionId) {
      const { data: parentVersion } = await supabase
        .from('versions')
        .select('id, project_id')
        .eq('id', body.parentVersionId)
        .single()

      if (!parentVersion) {
        return NextResponse.json(
          { error: 'Parent version not found' },
          { status: 404 }
        )
      }

      if (parentVersion.project_id !== body.projectId) {
        return NextResponse.json(
          { error: 'Parent version belongs to different project' },
          { status: 400 }
        )
      }
    }

    // Generate changes summary if not provided
    const changesSummary = body.changesSummary || await compareVersions(
      supabase,
      body.projectId,
      body.parentVersionId,
      body.snapshotData
    )

    // Calculate checksum and size
    const commitHash = calculateChecksum(body.snapshotData)
    const sizeBytes = calculateSize(body.snapshotData)

    // Check for duplicate snapshot
    const { data: duplicateVersion } = await supabase
      .from('versions')
      .select('id, version_number')
      .eq('project_id', body.projectId)
      .eq('commit_hash', commitHash)
      .single()

    if (duplicateVersion) {
      return NextResponse.json(
        {
          error: `Duplicate snapshot detected. Identical to version ${duplicateVersion.version_number}`,
          existingVersionId: duplicateVersion.id
        },
        { status: 409 }
      )
    }

    // Create version
    const { data: version, error } = await supabase
      .from('versions')
      .insert({
        project_id: body.projectId,
        version_number: versionNumber,
        name: body.name,
        description: body.description,
        created_by: user.id,
        snapshot_data: body.snapshotData,
        changes_summary: changesSummary,
        tags: body.tags,
        is_major: body.isMajor || false,
        parent_version_id: body.parentVersionId,
        commit_hash: commitHash,
        size_bytes: sizeBytes,
        status: 'active'
      })
      .select(`
        *,
        user:users!versions_created_by_fkey(id, name, email, avatar_url)
      `)
      .single()

    if (error || !version) {
      console.error('Failed to create version:', error)
      return NextResponse.json(
        { error: 'Failed to create version' },
        { status: 500 }
      )
    }

    // Record activity
    await supabase.from('activities').insert({
      project_id: body.projectId,
      user_id: user.id,
      action: 'version_created',
      metadata: {
        version_id: version.id,
        version_number: versionNumber,
        is_major: body.isMajor || false,
        size_bytes: sizeBytes
      }
    })

    return NextResponse.json({
      success: true,
      version: version as Version
    }, { status: 201 })
  } catch (error) {
    console.error('Versions API POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
