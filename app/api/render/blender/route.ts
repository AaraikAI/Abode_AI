/**
 * Blender Render API Endpoint
 *
 * Submits render jobs to the Blender render farm
 * Supports still images, walkthroughs, and panoramas
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs/promises'

export const maxDuration = 300 // 5 minutes for long-running renders

interface BlenderRenderRequest {
  projectId: string
  sceneData: {
    objects: Array<{
      type: string
      position: [number, number, number]
      rotation: [number, number, number]
      scale: [number, number, number]
      material?: string
    }>
    lights: Array<{
      type: 'point' | 'sun' | 'spot' | 'area'
      position: [number, number, number]
      energy: number
      color: [number, number, number]
    }>
    camera: {
      position: [number, number, number]
      rotation: [number, number, number]
      lens: number
    }
    environment?: {
      hdri?: string
      color?: [number, number, number, number]
    }
  }
  renderType: 'still' | 'walkthrough' | 'panorama'
  quality: '1080p' | '4k' | '8k'
  engine: 'CYCLES' | 'EEVEE'
  samples?: number
  denoise?: boolean
  postFx?: {
    tonemapping?: {
      enabled: boolean
      operator: 'FILMIC' | 'ACES' | 'REINHARD' | 'UNCHARTED2'
      whitePoint?: number
    }
    colorGrading?: {
      enabled: boolean
      temperature?: number
      tint?: number
      saturation?: number
      contrast?: number
      brightness?: number
      lut?: string
    }
    bloom?: {
      enabled: boolean
      threshold?: number
      intensity?: number
      radius?: number
    }
    vignette?: {
      enabled: boolean
      intensity?: number
      roundness?: number
    }
    chromaticAberration?: {
      enabled: boolean
      intensity?: number
    }
    filmGrain?: {
      enabled: boolean
      intensity?: number
      size?: number
    }
    sharpen?: {
      enabled: boolean
      intensity?: number
    }
  }
  // For walkthrough renders
  cameraPath?: Array<{
    position: [number, number, number]
    rotation: [number, number, number]
    timestamp: number
  }>
  fps?: number
  duration?: number
}

interface BlenderRenderResponse {
  success: boolean
  jobId: string
  estimatedTime: number
  credits: number
  outputUrl?: string
  error?: string
}

/**
 * Calculate render credits based on quality and type
 */
function calculateRenderCredits(
  renderType: string,
  quality: string,
  engine: string,
  duration?: number
): number {
  const baseCredits = {
    still: { '1080p': 10, '4k': 25, '8k': 50 },
    walkthrough: { '1080p': 50, '4k': 100, '8k': 200 },
    panorama: { '1080p': 30, '4k': 75, '8k': 150 }
  }

  const engineMultiplier = engine === 'CYCLES' ? 1.5 : 1.0
  let credits = baseCredits[renderType as keyof typeof baseCredits][quality as '1080p' | '4k' | '8k']
  credits *= engineMultiplier

  if (renderType === 'walkthrough' && duration) {
    credits *= Math.ceil(duration / 10) // 10 seconds base
  }

  return Math.ceil(credits)
}

/**
 * Estimate render time in seconds
 */
function estimateRenderTime(
  renderType: string,
  quality: string,
  engine: string,
  samples: number,
  duration?: number
): number {
  const baseTimes = {
    still: { '1080p': 120, '4k': 300, '8k': 600 },
    walkthrough: { '1080p': 600, '4k': 1200, '8k': 2400 },
    panorama: { '1080p': 240, '4k': 600, '8k': 1200 }
  }

  const engineMultiplier = engine === 'CYCLES' ? 1.5 : 1.0
  const sampleMultiplier = samples / 128 // 128 samples base
  let time = baseTimes[renderType as keyof typeof baseTimes][quality as '1080p' | '4k' | '8k']
  time *= engineMultiplier * sampleMultiplier

  if (renderType === 'walkthrough' && duration) {
    time *= Math.ceil(duration / 10) // 10 seconds base
  }

  return Math.ceil(time)
}

/**
 * Execute Blender render via Python service
 */
async function executeBlenderRender(
  jobId: string,
  renderRequest: BlenderRenderRequest
): Promise<{ success: boolean; outputPath?: string; error?: string }> {
  return new Promise((resolve) => {
    const pythonScript = path.join(process.cwd(), 'lib/services/blender-renderer.py')
    const outputDir = path.join(process.cwd(), 'public/renders', jobId)

    // Prepare render config
    const config = {
      job_id: jobId,
      render_type: renderRequest.renderType,
      scene_data: renderRequest.sceneData,
      quality: renderRequest.quality,
      engine: renderRequest.engine,
      samples: renderRequest.samples || (renderRequest.engine === 'CYCLES' ? 256 : 128),
      denoise: renderRequest.denoise !== false,
      output_dir: outputDir,
      camera_path: renderRequest.cameraPath,
      fps: renderRequest.fps || 30,
      duration: renderRequest.duration || 10.0,
      post_fx: renderRequest.postFx
    }

    const configPath = path.join('/tmp', `blender_config_${jobId}.json`)

    // Write config to temp file
    fs.writeFile(configPath, JSON.stringify(config, null, 2))
      .then(() => {
        const pythonProcess = spawn('python3', [pythonScript, configPath])

        let stdout = ''
        let stderr = ''

        pythonProcess.stdout.on('data', (data) => {
          stdout += data.toString()
          console.log(`Blender render ${jobId}:`, data.toString())
        })

        pythonProcess.stderr.on('data', (data) => {
          stderr += data.toString()
          console.error(`Blender render ${jobId} error:`, data.toString())
        })

        pythonProcess.on('close', async (code) => {
          // Clean up config file
          await fs.unlink(configPath).catch(() => {})

          if (code === 0) {
            try {
              const result = JSON.parse(stdout)
              resolve({
                success: true,
                outputPath: result.output_path
              })
            } catch (e) {
              resolve({
                success: false,
                error: 'Failed to parse render output'
              })
            }
          } else {
            resolve({
              success: false,
              error: stderr || 'Render process failed'
            })
          }
        })

        pythonProcess.on('error', (error) => {
          resolve({
            success: false,
            error: error.message
          })
        })
      })
      .catch((error) => {
        resolve({
          success: false,
          error: `Failed to write config: ${error.message}`
        })
      })
  })
}

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
    const renderRequest = await request.json() as BlenderRenderRequest

    // Validate request
    if (!renderRequest.projectId || !renderRequest.sceneData) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, sceneData' },
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
    const credits = calculateRenderCredits(
      renderRequest.renderType,
      renderRequest.quality,
      renderRequest.engine,
      renderRequest.duration
    )

    if (org.credits < credits) {
      return NextResponse.json(
        { error: `Insufficient credits. Required: ${credits}, Available: ${org.credits}` },
        { status: 402 }
      )
    }

    const estimatedTime = estimateRenderTime(
      renderRequest.renderType,
      renderRequest.quality,
      renderRequest.engine,
      renderRequest.samples || (renderRequest.engine === 'CYCLES' ? 256 : 128),
      renderRequest.duration
    )

    // Create render job record
    const { data: renderJob, error: jobError } = await supabase
      .from('render_jobs')
      .insert({
        project_id: renderRequest.projectId,
        org_id: orgId,
        user_id: user.id,
        type: renderRequest.renderType,
        quality: renderRequest.quality,
        status: 'queued',
        scene_data: renderRequest.sceneData,
        camera_settings: renderRequest.sceneData.camera,
        render_settings: {
          engine: renderRequest.engine,
          samples: renderRequest.samples,
          denoise: renderRequest.denoise,
          postFx: renderRequest.postFx,
          cameraPath: renderRequest.cameraPath,
          fps: renderRequest.fps,
          duration: renderRequest.duration
        },
        credits_cost: credits,
        estimated_time_seconds: estimatedTime,
        progress: 0
      })
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
      amount: credits
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
      credits: -credits,
      description: `Blender render job: ${renderRequest.renderType} (${renderRequest.quality})`,
      metadata: {
        render_job_id: renderJob.id,
        render_type: renderRequest.renderType,
        quality: renderRequest.quality
      }
    })

    // Update job status to processing
    await supabase
      .from('render_jobs')
      .update({ status: 'processing', started_at: new Date().toISOString() })
      .eq('id', renderJob.id)

    // Execute render (async - don't wait for completion)
    executeBlenderRender(renderJob.id, renderRequest).then(async (result) => {
      if (result.success) {
        // Upload to Supabase Storage
        const fileName = `${renderJob.id}.${renderRequest.renderType === 'walkthrough' ? 'mp4' : 'png'}`
        const fileBuffer = await fs.readFile(result.outputPath!)

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('renders')
          .upload(fileName, fileBuffer, {
            contentType: renderRequest.renderType === 'walkthrough' ? 'video/mp4' : 'image/png',
            upsert: true
          })

        if (uploadError) {
          console.error('Failed to upload render:', uploadError)
          await supabase
            .from('render_jobs')
            .update({
              status: 'failed',
              error_message: 'Failed to upload render output',
              completed_at: new Date().toISOString()
            })
            .eq('id', renderJob.id)
          return
        }

        const { data: { publicUrl } } = supabase.storage
          .from('renders')
          .getPublicUrl(fileName)

        // Update job as completed
        await supabase
          .from('render_jobs')
          .update({
            status: 'completed',
            output_url: publicUrl,
            progress: 100,
            completed_at: new Date().toISOString()
          })
          .eq('id', renderJob.id)

        // Clean up local file
        await fs.unlink(result.outputPath!).catch(() => {})
      } else {
        // Update job as failed
        await supabase
          .from('render_jobs')
          .update({
            status: 'failed',
            error_message: result.error,
            completed_at: new Date().toISOString()
          })
          .eq('id', renderJob.id)

        // Refund credits
        await supabase.rpc('add_credits', {
          org_id: orgId,
          amount: credits
        })

        await supabase.from('credit_transactions').insert({
          org_id: orgId,
          credits: credits,
          description: `Refund for failed render job`,
          metadata: {
            render_job_id: renderJob.id,
            original_cost: credits
          }
        })
      }
    }).catch(async (error) => {
      console.error('Render execution error:', error)
      await supabase
        .from('render_jobs')
        .update({
          status: 'failed',
          error_message: error.message,
          completed_at: new Date().toISOString()
        })
        .eq('id', renderJob.id)
    })

    // Return immediate response
    const response: BlenderRenderResponse = {
      success: true,
      jobId: renderJob.id,
      estimatedTime,
      credits
    }

    return NextResponse.json(response, { status: 202 }) // 202 Accepted
  } catch (error) {
    console.error('Blender render API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET - Check render job status
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
    const jobId = searchParams.get('jobId')

    if (!jobId) {
      return NextResponse.json(
        { error: 'Missing jobId parameter' },
        { status: 400 }
      )
    }

    // Get render job
    const { data: renderJob, error } = await supabase
      .from('render_jobs')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single()

    if (error || !renderJob) {
      return NextResponse.json(
        { error: 'Render job not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      jobId: renderJob.id,
      status: renderJob.status,
      progress: renderJob.progress,
      outputUrl: renderJob.output_url,
      estimatedTimeRemaining: renderJob.estimated_time_seconds * (1 - renderJob.progress / 100),
      error: renderJob.error_message
    })
  } catch (error) {
    console.error('Render status API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
