/**
 * Cloud Render Queue Service
 *
 * Manages rendering jobs for:
 * - Still images (1080p, 4K)
 * - Video walkthroughs (1080p MP4, 30fps)
 * - Batch rendering
 *
 * Integrates with cloud render farm (Blender/Cycles or GPU-based renderer)
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export type RenderType = 'still' | 'walkthrough' | 'panorama' | 'batch'
export type RenderStatus = 'queued' | 'rendering' | 'processing' | 'completed' | 'failed'
export type RenderQuality = '1080p' | '4k' | '8k'

export interface RenderJob {
  id: string
  org_id: string
  user_id: string
  project_id: string
  type: RenderType
  status: RenderStatus
  quality: RenderQuality
  scene_data: any // JSON scene description
  camera_settings: {
    position: [number, number, number]
    target: [number, number, number]
    fov: number
  }
  render_settings: {
    samples: number
    max_bounces: number
    denoising: boolean
    shadows: boolean
    reflections: boolean
    ambient_occlusion: boolean
  }
  walkthrough_path?: {
    keyframes: Array<{
      time: number
      position: [number, number, number]
      target: [number, number, number]
    }>
    duration: number // seconds
    fps: number
  }
  progress: number // 0-100
  estimated_time: number // seconds
  started_at?: string
  completed_at?: string
  output_url?: string
  thumbnail_url?: string
  file_size?: number
  error_message?: string
  credits_used: number
  created_at: string
  updated_at: string
}

/**
 * Create a new render job
 */
export async function createRenderJob(params: {
  orgId: string
  userId: string
  projectId: string
  type: RenderType
  quality: RenderQuality
  sceneData: any
  cameraSettings: RenderJob['camera_settings']
  renderSettings?: Partial<RenderJob['render_settings']>
  walkthroughPath?: RenderJob['walkthrough_path']
}): Promise<RenderJob> {
  const {
    orgId,
    userId,
    projectId,
    type,
    quality,
    sceneData,
    cameraSettings,
    renderSettings = {},
    walkthroughPath
  } = params

  // Calculate credits required
  const credits = calculateCredits(type, quality)

  // Check if org has enough credits
  const { data: credits Data } = await supabase
    .from('credit_transactions')
    .select('credits')
    .eq('org_id', orgId)

  const balance = creditsData?.reduce((sum, t) => sum + t.credits, 0) || 0

  if (balance < credits) {
    throw new Error('Insufficient credits')
  }

  // Estimate render time
  const estimatedTime = estimateRenderTime(type, quality, sceneData)

  // Default render settings
  const defaultRenderSettings: RenderJob['render_settings'] = {
    samples: quality === '4k' ? 256 : quality === '8k' ? 512 : 128,
    max_bounces: 12,
    denoising: true,
    shadows: true,
    reflections: true,
    ambient_occlusion: true,
    ...renderSettings
  }

  // Create job
  const { data: job, error } = await supabase
    .from('render_jobs')
    .insert({
      org_id: orgId,
      user_id: userId,
      project_id: projectId,
      type,
      status: 'queued',
      quality,
      scene_data: sceneData,
      camera_settings: cameraSettings,
      render_settings: defaultRenderSettings,
      walkthrough_path: walkthroughPath,
      progress: 0,
      estimated_time: estimatedTime,
      credits_used: credits,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) {
    console.error('Create render job error:', error)
    throw new Error('Failed to create render job')
  }

  // Deduct credits
  await supabase
    .from('credit_transactions')
    .insert({
      org_id: orgId,
      credits: -credits,
      description: `Render job: ${type} (${quality})`,
      metadata: { render_job_id: job.id }
    })

  // Submit to render farm
  await submitToRenderFarm(job as RenderJob)

  return job as RenderJob
}

/**
 * Get render job by ID
 */
export async function getRenderJob(id: string): Promise<RenderJob | null> {
  const { data, error } = await supabase
    .from('render_jobs')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Get render job error:', error)
    return null
  }

  return data as RenderJob
}

/**
 * List render jobs for an organization
 */
export async function listRenderJobs(params: {
  orgId: string
  projectId?: string
  status?: RenderStatus
  limit?: number
  offset?: number
}): Promise<{ jobs: RenderJob[]; total: number }> {
  const { orgId, projectId, status, limit = 20, offset = 0 } = params

  let query = supabase
    .from('render_jobs')
    .select('*', { count: 'exact' })
    .eq('org_id', orgId)

  if (projectId) {
    query = query.eq('project_id', projectId)
  }

  if (status) {
    query = query.eq('status', status)
  }

  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) {
    console.error('List render jobs error:', error)
    return { jobs: [], total: 0 }
  }

  return {
    jobs: (data as RenderJob[]) || [],
    total: count || 0
  }
}

/**
 * Update render job status
 */
export async function updateRenderJob(
  id: string,
  updates: Partial<RenderJob>
): Promise<RenderJob | null> {
  const { data, error } = await supabase
    .from('render_jobs')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Update render job error:', error)
    return null
  }

  return data as RenderJob
}

/**
 * Cancel a render job
 */
export async function cancelRenderJob(id: string): Promise<boolean> {
  const job = await getRenderJob(id)

  if (!job) {
    return false
  }

  // Can only cancel queued or rendering jobs
  if (job.status !== 'queued' && job.status !== 'rendering') {
    return false
  }

  // Update status
  await updateRenderJob(id, { status: 'failed', error_message: 'Cancelled by user' })

  // Refund credits
  await supabase
    .from('credit_transactions')
    .insert({
      org_id: job.org_id,
      credits: job.credits_used,
      description: `Refund for cancelled render job`,
      metadata: { render_job_id: id }
    })

  // Cancel on render farm
  await cancelOnRenderFarm(id)

  return true
}

/**
 * Submit job to render farm
 */
async function submitToRenderFarm(job: RenderJob): Promise<void> {
  const renderFarmUrl = process.env.RENDER_FARM_URL

  if (!renderFarmUrl) {
    console.warn('RENDER_FARM_URL not configured, using mock renderer')
    // Mock rendering for development
    setTimeout(async () => {
      await mockRenderProgress(job.id)
    }, 1000)
    return
  }

  try {
    const response = await fetch(`${renderFarmUrl}/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RENDER_FARM_API_KEY}`
      },
      body: JSON.stringify({
        jobId: job.id,
        type: job.type,
        quality: job.quality,
        scene: job.scene_data,
        camera: job.camera_settings,
        renderSettings: job.render_settings,
        walkthroughPath: job.walkthrough_path,
        callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/render/callback`
      })
    })

    if (!response.ok) {
      throw new Error(`Render farm error: ${response.statusText}`)
    }

    console.log(`Submitted render job ${job.id} to render farm`)

  } catch (error) {
    console.error('Submit to render farm error:', error)

    // Mark job as failed
    await updateRenderJob(job.id, {
      status: 'failed',
      error_message: error instanceof Error ? error.message : 'Failed to submit to render farm'
    })
  }
}

/**
 * Cancel job on render farm
 */
async function cancelOnRenderFarm(jobId: string): Promise<void> {
  const renderFarmUrl = process.env.RENDER_FARM_URL

  if (!renderFarmUrl) {
    return
  }

  try {
    await fetch(`${renderFarmUrl}/jobs/${jobId}/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RENDER_FARM_API_KEY}`
      }
    })
  } catch (error) {
    console.error('Cancel on render farm error:', error)
  }
}

/**
 * Calculate credits required for render job
 */
function calculateCredits(type: RenderType, quality: RenderQuality): number {
  const baseCredits = {
    still: { '1080p': 10, '4k': 25, '8k': 50 },
    walkthrough: { '1080p': 50, '4k': 125, '8k': 250 },
    panorama: { '1080p': 15, '4k': 35, '8k': 70 },
    batch: { '1080p': 100, '4k': 250, '8k': 500 }
  }

  return baseCredits[type][quality] || 10
}

/**
 * Estimate render time in seconds
 */
function estimateRenderTime(type: RenderType, quality: RenderQuality, sceneData: any): number {
  // Basic estimation based on type and quality
  const baseTime = {
    still: { '1080p': 30, '4k': 120, '8k': 300 },
    walkthrough: { '1080p': 180, '4k': 600, '8k': 1200 },
    panorama: { '1080p': 60, '4k': 180, '8k': 400 },
    batch: { '1080p': 300, '4k': 900, '8k': 1800 }
  }

  let time = baseTime[type][quality] || 60

  // Adjust based on scene complexity
  const objectCount = sceneData?.objects?.length || 0
  time += objectCount * 2

  return time
}

/**
 * Mock render progress for development
 */
async function mockRenderProgress(jobId: string): Promise<void> {
  // Simulate rendering progress
  for (let progress = 0; progress <= 100; progress += 10) {
    await new Promise(resolve => setTimeout(resolve, 2000))

    if (progress === 0) {
      await updateRenderJob(jobId, { status: 'rendering', started_at: new Date().toISOString() })
    } else if (progress === 100) {
      await updateRenderJob(jobId, {
        status: 'completed',
        progress: 100,
        completed_at: new Date().toISOString(),
        output_url: `https://placeholder.com/renders/${jobId}.mp4`,
        thumbnail_url: `https://placeholder.com/renders/${jobId}_thumb.jpg`,
        file_size: 15000000 // 15MB
      })
    } else {
      await updateRenderJob(jobId, { progress })
    }
  }
}
