/**
 * Render Queue API Endpoint
 *
 * Manages the render job queue for processing
 * Allows submission and retrieval of queued render jobs
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 60 // 1 minute timeout

interface RenderQueueRequest {
  projectId: string
  type: 'still' | 'walkthrough' | 'panorama' | '360_tour' | 'vr'
  quality: '720p' | '1080p' | '4k' | '8k'
  priority?: 'low' | 'normal' | 'high' | 'critical'
  settings?: {
    resolution?: { width: number; height: number }
    frameRate?: number
    samples?: number
    denoise?: boolean
    engine?: 'CYCLES' | 'EEVEE' | 'UNREAL' | 'UNITY'
    outputFormat?: 'PNG' | 'JPG' | 'EXR' | 'MP4' | 'WEBM'
    compression?: 'none' | 'low' | 'medium' | 'high'
  }
  sceneData?: Record<string, any>
  metadata?: Record<string, any>
  scheduledFor?: string // ISO date string for scheduled renders
  notifyOnComplete?: boolean
  webhookUrl?: string
}

interface RenderQueueResponse {
  success: boolean
  jobId: string
  position: number
  estimatedStartTime: string
  estimatedCompletionTime: string
  creditsCost: number
  error?: string
}

interface RenderJob {
  id: string
  project_id: string
  org_id: string
  user_id: string
  type: string
  quality: string
  status: string
  priority: string
  position?: number
  scene_data?: any
  render_settings?: any
  credits_cost: number
  estimated_time_seconds: number
  progress: number
  created_at: string
  started_at?: string
  completed_at?: string
  scheduled_for?: string
  output_url?: string
  error_message?: string
  metadata?: any
}

/**
 * Calculate render credits based on settings
 */
function calculateRenderCredits(
  type: string,
  quality: string,
  priority: string,
  settings?: RenderQueueRequest['settings']
): number {
  const baseCredits: Record<string, Record<string, number>> = {
    still: { '720p': 5, '1080p': 10, '4k': 25, '8k': 50 },
    walkthrough: { '720p': 25, '1080p': 50, '4k': 100, '8k': 200 },
    panorama: { '720p': 15, '1080p': 30, '4k': 75, '8k': 150 },
    '360_tour': { '720p': 40, '1080p': 80, '4k': 160, '8k': 320 },
    vr: { '720p': 50, '1080p': 100, '4k': 200, '8k': 400 }
  }

  const priorityMultiplier: Record<string, number> = {
    low: 0.8,
    normal: 1.0,
    high: 1.5,
    critical: 2.0
  }

  const engineMultiplier: Record<string, number> = {
    CYCLES: 1.5,
    EEVEE: 1.0,
    UNREAL: 1.8,
    UNITY: 1.6
  }

  let credits = baseCredits[type]?.[quality] || 10
  credits *= priorityMultiplier[priority] || 1.0

  if (settings?.engine) {
    credits *= engineMultiplier[settings.engine] || 1.0
  }

  if (settings?.samples && settings.samples > 128) {
    credits *= 1 + ((settings.samples - 128) / 256) * 0.5
  }

  return Math.ceil(credits)
}

/**
 * Calculate estimated render time
 */
function estimateRenderTime(
  type: string,
  quality: string,
  settings?: RenderQueueRequest['settings']
): number {
  const baseTimes: Record<string, Record<string, number>> = {
    still: { '720p': 60, '1080p': 120, '4k': 300, '8k': 600 },
    walkthrough: { '720p': 300, '1080p': 600, '4k': 1200, '8k': 2400 },
    panorama: { '720p': 120, '1080p': 240, '4k': 600, '8k': 1200 },
    '360_tour': { '720p': 400, '1080p': 800, '4k': 1600, '8k': 3200 },
    vr: { '720p': 500, '1080p': 1000, '4k': 2000, '8k': 4000 }
  }

  let time = baseTimes[type]?.[quality] || 120

  if (settings?.engine === 'CYCLES' || settings?.engine === 'UNREAL') {
    time *= 1.5
  }

  if (settings?.samples) {
    time *= settings.samples / 128
  }

  return Math.ceil(time)
}

/**
 * Get queue position for new job
 */
async function getQueuePosition(
  supabase: any,
  priority: string,
  orgId: string
): Promise<number> {
  const priorityOrder: Record<string, number> = {
    critical: 0,
    high: 1,
    normal: 2,
    low: 3
  }

  const currentPriorityLevel = priorityOrder[priority] || 2

  // Count jobs with higher or equal priority that are queued
  const { count } = await supabase
    .from('render_jobs')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .in('status', ['queued', 'processing'])

  return (count || 0) + 1
}

/**
 * POST - Submit render job to queue
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

    // Parse request body
    const queueRequest = await request.json() as RenderQueueRequest

    // Validate required fields
    if (!queueRequest.projectId || !queueRequest.type || !queueRequest.quality) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, type, quality' },
        { status: 400 }
      )
    }

    // Validate enum values
    const validTypes = ['still', 'walkthrough', 'panorama', '360_tour', 'vr']
    const validQualities = ['720p', '1080p', '4k', '8k']
    const validPriorities = ['low', 'normal', 'high', 'critical']

    if (!validTypes.includes(queueRequest.type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    if (!validQualities.includes(queueRequest.quality)) {
      return NextResponse.json(
        { error: `Invalid quality. Must be one of: ${validQualities.join(', ')}` },
        { status: 400 }
      )
    }

    const priority = queueRequest.priority || 'normal'
    if (!validPriorities.includes(priority)) {
      return NextResponse.json(
        { error: `Invalid priority. Must be one of: ${validPriorities.join(', ')}` },
        { status: 400 }
      )
    }

    // Get user's organization
    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json(
        { error: 'User not associated with any organization' },
        { status: 403 }
      )
    }

    const orgId = membership.organization_id

    // Verify project belongs to organization
    const { data: project } = await supabase
      .from('projects')
      .select('id, org_id')
      .eq('id', queueRequest.projectId)
      .single()

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    if (project.org_id !== orgId) {
      return NextResponse.json(
        { error: 'Project does not belong to your organization' },
        { status: 403 }
      )
    }

    // Check organization credits
    const { data: org } = await supabase
      .from('organizations')
      .select('credits')
      .eq('id', orgId)
      .single()

    if (!org) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    // Calculate credits and time
    const creditsCost = calculateRenderCredits(
      queueRequest.type,
      queueRequest.quality,
      priority,
      queueRequest.settings
    )

    if (org.credits < creditsCost) {
      return NextResponse.json(
        {
          error: `Insufficient credits. Required: ${creditsCost}, Available: ${org.credits}`,
          creditsCost,
          creditsAvailable: org.credits
        },
        { status: 402 }
      )
    }

    const estimatedTimeSeconds = estimateRenderTime(
      queueRequest.type,
      queueRequest.quality,
      queueRequest.settings
    )

    // Get queue position
    const queuePosition = await getQueuePosition(supabase, priority, orgId)

    // Create render job record
    const jobData: any = {
      project_id: queueRequest.projectId,
      org_id: orgId,
      user_id: user.id,
      type: queueRequest.type,
      quality: queueRequest.quality,
      status: queueRequest.scheduledFor ? 'scheduled' : 'queued',
      priority: priority,
      scene_data: queueRequest.sceneData || {},
      render_settings: queueRequest.settings || {},
      credits_cost: creditsCost,
      estimated_time_seconds: estimatedTimeSeconds,
      progress: 0,
      metadata: {
        ...queueRequest.metadata,
        notify_on_complete: queueRequest.notifyOnComplete || false,
        webhook_url: queueRequest.webhookUrl
      }
    }

    if (queueRequest.scheduledFor) {
      jobData.scheduled_for = queueRequest.scheduledFor
    }

    const { data: renderJob, error: jobError } = await supabase
      .from('render_jobs')
      .insert(jobData)
      .select()
      .single()

    if (jobError || !renderJob) {
      console.error('Failed to create render job:', jobError)
      return NextResponse.json(
        { error: 'Failed to create render job' },
        { status: 500 }
      )
    }

    // Deduct credits
    const { error: creditError } = await supabase.rpc('deduct_credits', {
      org_id: orgId,
      amount: creditsCost
    })

    if (creditError) {
      console.error('Failed to deduct credits:', creditError)
      // Rollback job creation
      await supabase.from('render_jobs').delete().eq('id', renderJob.id)
      return NextResponse.json(
        { error: 'Failed to deduct credits' },
        { status: 500 }
      )
    }

    // Record credit transaction
    await supabase.from('credit_transactions').insert({
      org_id: orgId,
      credits: -creditsCost,
      description: `Render job queued: ${queueRequest.type} (${queueRequest.quality})`,
      metadata: {
        render_job_id: renderJob.id,
        render_type: queueRequest.type,
        quality: queueRequest.quality,
        priority: priority
      }
    })

    // Calculate estimated times
    const estimatedStartTime = new Date(Date.now() + (queuePosition - 1) * 60000).toISOString()
    const estimatedCompletionTime = new Date(
      Date.now() + (queuePosition - 1) * 60000 + estimatedTimeSeconds * 1000
    ).toISOString()

    // Prepare response
    const response: RenderQueueResponse = {
      success: true,
      jobId: renderJob.id,
      position: queuePosition,
      estimatedStartTime,
      estimatedCompletionTime,
      creditsCost
    }

    return NextResponse.json(response, { status: 202 }) // 202 Accepted
  } catch (error) {
    console.error('Render queue POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET - List all render jobs in queue
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
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const type = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const projectId = searchParams.get('projectId')

    // Get user's organization
    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json(
        { error: 'User not associated with any organization' },
        { status: 403 }
      )
    }

    const orgId = membership.organization_id

    // Build query
    let query = supabase
      .from('render_jobs')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId)

    // Apply filters
    if (status) {
      const statuses = status.split(',')
      query = query.in('status', statuses)
    } else {
      // Default to showing queue-related statuses
      query = query.in('status', ['queued', 'scheduled', 'processing'])
    }

    if (priority) {
      query = query.eq('priority', priority)
    }

    if (type) {
      query = query.eq('type', type)
    }

    if (projectId) {
      query = query.eq('project_id', projectId)
    }

    // Apply pagination and ordering
    const { data: jobs, error: queryError, count } = await query
      .order('priority', { ascending: true })
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1)

    if (queryError) {
      console.error('Failed to fetch render jobs:', queryError)
      return NextResponse.json(
        { error: 'Failed to fetch render jobs' },
        { status: 500 }
      )
    }

    // Calculate queue positions for queued jobs
    const jobsWithPosition = jobs?.map((job: RenderJob, index: number) => {
      if (job.status === 'queued') {
        return {
          ...job,
          position: offset + index + 1
        }
      }
      return job
    }) || []

    // Calculate queue statistics
    const queueStats = {
      totalJobs: count || 0,
      queued: jobsWithPosition.filter((j: RenderJob) => j.status === 'queued').length,
      processing: jobsWithPosition.filter((j: RenderJob) => j.status === 'processing').length,
      scheduled: jobsWithPosition.filter((j: RenderJob) => j.status === 'scheduled').length,
      avgWaitTime: jobsWithPosition.length > 0
        ? jobsWithPosition.reduce((sum: number, j: RenderJob) => sum + j.estimated_time_seconds, 0) / jobsWithPosition.length
        : 0
    }

    return NextResponse.json({
      jobs: jobsWithPosition,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      },
      stats: queueStats
    })
  } catch (error) {
    console.error('Render queue GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
