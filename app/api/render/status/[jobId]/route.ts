/**
 * Render Status API Endpoint
 *
 * Retrieves detailed status and progress information for a specific render job
 * Includes real-time progress updates, logs, and performance metrics
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 60 // 1 minute timeout

interface RenderStatusResponse {
  jobId: string
  status: 'queued' | 'scheduled' | 'processing' | 'completed' | 'failed' | 'cancelled'
  progress: number
  position?: number
  currentStep?: string
  steps?: {
    name: string
    status: 'pending' | 'processing' | 'completed' | 'failed'
    progress: number
    startedAt?: string
    completedAt?: string
  }[]
  estimatedTimeRemaining: number
  estimatedCompletionTime?: string
  startedAt?: string
  completedAt?: string
  outputUrl?: string
  thumbnailUrl?: string
  error?: string
  logs?: {
    timestamp: string
    level: 'info' | 'warning' | 'error'
    message: string
  }[]
  metrics?: {
    cpuUsage?: number
    memoryUsage?: number
    gpuUsage?: number
    renderTime?: number
    samplesCompleted?: number
    totalSamples?: number
    framesCompleted?: number
    totalFrames?: number
  }
  metadata?: Record<string, any>
  project?: {
    id: string
    name: string
  }
  renderSettings?: {
    type: string
    quality: string
    priority: string
    engine?: string
    resolution?: { width: number; height: number }
  }
  credits?: {
    cost: number
    refunded?: number
  }
}

interface RenderJobData {
  id: string
  project_id: string
  org_id: string
  user_id: string
  type: string
  quality: string
  status: string
  priority: string
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
  thumbnail_url?: string
  error_message?: string
  metadata?: any
  current_step?: string
  render_logs?: any[]
  render_metrics?: any
}

/**
 * Calculate queue position for a queued job
 */
async function calculateQueuePosition(
  supabase: any,
  job: RenderJobData
): Promise<number | undefined> {
  if (job.status !== 'queued') {
    return undefined
  }

  const priorityOrder: Record<string, number> = {
    critical: 0,
    high: 1,
    normal: 2,
    low: 3
  }

  // Count jobs ahead in queue
  const { count } = await supabase
    .from('render_jobs')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', job.org_id)
    .eq('status', 'queued')
    .or(`priority.lt.${priorityOrder[job.priority]},and(priority.eq.${priorityOrder[job.priority]},created_at.lt.${job.created_at})`)

  return (count || 0) + 1
}

/**
 * Parse render steps from job data
 */
function parseRenderSteps(job: RenderJobData): RenderStatusResponse['steps'] {
  const defaultSteps = [
    { name: 'Initializing', status: 'pending' as const, progress: 0 },
    { name: 'Loading Scene', status: 'pending' as const, progress: 0 },
    { name: 'Preprocessing', status: 'pending' as const, progress: 0 },
    { name: 'Rendering', status: 'pending' as const, progress: 0 },
    { name: 'Post-processing', status: 'pending' as const, progress: 0 },
    { name: 'Finalizing', status: 'pending' as const, progress: 0 }
  ]

  // If job metadata contains custom steps, use those
  if (job.metadata?.steps) {
    return job.metadata.steps
  }

  // Update steps based on job status and progress
  if (job.status === 'processing') {
    const currentProgress = job.progress
    const stepsCount = defaultSteps.length
    const progressPerStep = 100 / stepsCount

    return defaultSteps.map((step, index) => {
      const stepStartProgress = index * progressPerStep
      const stepEndProgress = (index + 1) * progressPerStep

      if (currentProgress >= stepEndProgress) {
        return { ...step, status: 'completed' as const, progress: 100 }
      } else if (currentProgress >= stepStartProgress) {
        const stepProgress = ((currentProgress - stepStartProgress) / progressPerStep) * 100
        return {
          ...step,
          status: 'processing' as const,
          progress: Math.round(stepProgress)
        }
      }
      return step
    })
  }

  if (job.status === 'completed') {
    return defaultSteps.map(step => ({
      ...step,
      status: 'completed' as const,
      progress: 100
    }))
  }

  if (job.status === 'failed' && job.current_step) {
    return defaultSteps.map(step => {
      if (step.name === job.current_step) {
        return { ...step, status: 'failed' as const, progress: 0 }
      }
      if (defaultSteps.indexOf(step) < defaultSteps.findIndex(s => s.name === job.current_step)) {
        return { ...step, status: 'completed' as const, progress: 100 }
      }
      return step
    })
  }

  return defaultSteps
}

/**
 * Calculate estimated time remaining
 */
function calculateEstimatedTimeRemaining(job: RenderJobData, position?: number): number {
  if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
    return 0
  }

  if (job.status === 'processing') {
    const elapsedTime = job.started_at
      ? (Date.now() - new Date(job.started_at).getTime()) / 1000
      : 0

    if (job.progress > 0 && job.progress < 100) {
      const totalEstimatedTime = (elapsedTime / job.progress) * 100
      return Math.max(0, totalEstimatedTime - elapsedTime)
    }

    return job.estimated_time_seconds - elapsedTime
  }

  if (job.status === 'queued' && position) {
    // Estimate wait time based on position (assume 5 min per job ahead)
    const waitTime = (position - 1) * 300
    return waitTime + job.estimated_time_seconds
  }

  if (job.status === 'scheduled' && job.scheduled_for) {
    const scheduledTime = new Date(job.scheduled_for).getTime()
    const now = Date.now()
    const waitTime = Math.max(0, (scheduledTime - now) / 1000)
    return waitTime + job.estimated_time_seconds
  }

  return job.estimated_time_seconds
}

/**
 * GET - Retrieve render job status and progress
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
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

    const { jobId } = params

    // Validate jobId format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(jobId)) {
      return NextResponse.json(
        { error: 'Invalid job ID format' },
        { status: 400 }
      )
    }

    // Get render job with project details
    const { data: renderJob, error: jobError } = await supabase
      .from('render_jobs')
      .select(`
        *,
        projects:project_id (
          id,
          name
        )
      `)
      .eq('id', jobId)
      .single()

    if (jobError || !renderJob) {
      return NextResponse.json(
        { error: 'Render job not found' },
        { status: 404 }
      )
    }

    // Verify user has access to this job
    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (!membership || membership.organization_id !== renderJob.org_id) {
      return NextResponse.json(
        { error: 'Access denied to this render job' },
        { status: 403 }
      )
    }

    // Calculate queue position if queued
    const position = await calculateQueuePosition(supabase, renderJob)

    // Parse render steps
    const steps = parseRenderSteps(renderJob)

    // Calculate estimated time remaining
    const estimatedTimeRemaining = calculateEstimatedTimeRemaining(renderJob, position)

    // Calculate estimated completion time
    let estimatedCompletionTime: string | undefined
    if (renderJob.status === 'processing' || renderJob.status === 'queued') {
      estimatedCompletionTime = new Date(
        Date.now() + estimatedTimeRemaining * 1000
      ).toISOString()
    }

    // Get current step
    const currentStepObj = steps.find(s => s.status === 'processing')

    // Prepare response
    const response: RenderStatusResponse = {
      jobId: renderJob.id,
      status: renderJob.status,
      progress: renderJob.progress,
      position,
      currentStep: currentStepObj?.name || renderJob.current_step,
      steps,
      estimatedTimeRemaining: Math.round(estimatedTimeRemaining),
      estimatedCompletionTime,
      startedAt: renderJob.started_at,
      completedAt: renderJob.completed_at,
      outputUrl: renderJob.output_url,
      thumbnailUrl: renderJob.thumbnail_url,
      error: renderJob.error_message,
      logs: renderJob.render_logs || [],
      metrics: renderJob.render_metrics || {},
      metadata: renderJob.metadata,
      project: renderJob.projects ? {
        id: renderJob.projects.id,
        name: renderJob.projects.name
      } : undefined,
      renderSettings: {
        type: renderJob.type,
        quality: renderJob.quality,
        priority: renderJob.priority,
        engine: renderJob.render_settings?.engine,
        resolution: renderJob.render_settings?.resolution
      },
      credits: {
        cost: renderJob.credits_cost,
        refunded: renderJob.metadata?.credits_refunded
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Render status GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
