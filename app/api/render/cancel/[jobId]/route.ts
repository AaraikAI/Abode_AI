/**
 * Render Cancel API Endpoint
 *
 * Cancels a running or queued render job
 * Handles credit refunds and cleanup of partial renders
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 60 // 1 minute timeout

interface CancelRenderResponse {
  success: boolean
  jobId: string
  status: string
  creditsRefunded: number
  message: string
  error?: string
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
  credits_cost: number
  progress: number
  started_at?: string
  metadata?: any
}

/**
 * Calculate credit refund based on progress
 */
function calculateCreditRefund(
  job: RenderJobData
): number {
  // Full refund for queued or scheduled jobs
  if (job.status === 'queued' || job.status === 'scheduled') {
    return job.credits_cost
  }

  // Partial refund for processing jobs based on progress
  if (job.status === 'processing') {
    const remainingProgress = 100 - job.progress
    const refundPercentage = remainingProgress / 100
    return Math.ceil(job.credits_cost * refundPercentage)
  }

  // No refund for completed, failed, or already cancelled jobs
  return 0
}

/**
 * Terminate render process if running
 */
async function terminateRenderProcess(jobId: string): Promise<boolean> {
  try {
    // In a real implementation, this would:
    // 1. Send signal to the render worker/container
    // 2. Kill the Blender/render engine process
    // 3. Clean up temporary files
    // 4. Release GPU/compute resources

    // For now, we'll just log the termination
    console.log(`Terminating render process for job ${jobId}`)

    // Simulate process termination
    // In production, this might call a worker API or send a message to a queue
    // await fetch(`http://render-worker/terminate/${jobId}`, { method: 'POST' })

    return true
  } catch (error) {
    console.error(`Failed to terminate render process for job ${jobId}:`, error)
    return false
  }
}

/**
 * Clean up partial render outputs
 */
async function cleanupPartialRender(
  supabase: any,
  jobId: string
): Promise<void> {
  try {
    // Delete partial render files from storage
    const { data: files } = await supabase.storage
      .from('renders')
      .list(`${jobId}/`)

    if (files && files.length > 0) {
      const filePaths = files.map((file: any) => `${jobId}/${file.name}`)
      await supabase.storage
        .from('renders')
        .remove(filePaths)
    }

    // Also check for the main file
    await supabase.storage
      .from('renders')
      .remove([`${jobId}.png`, `${jobId}.jpg`, `${jobId}.mp4`])

    console.log(`Cleaned up partial render files for job ${jobId}`)
  } catch (error) {
    console.error(`Failed to cleanup partial render for job ${jobId}:`, error)
  }
}

/**
 * POST - Cancel a render job
 */
export async function POST(
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

    // Optional: Parse request body for cancellation reason
    let cancellationReason = 'User requested cancellation'
    try {
      const body = await request.json()
      if (body.reason) {
        cancellationReason = body.reason
      }
    } catch {
      // Body is optional, ignore parse errors
    }

    // Get render job
    const { data: renderJob, error: jobError } = await supabase
      .from('render_jobs')
      .select('*')
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

    // Check if job can be cancelled
    const cancellableStatuses = ['queued', 'scheduled', 'processing']
    if (!cancellableStatuses.includes(renderJob.status)) {
      return NextResponse.json(
        {
          error: `Cannot cancel job with status: ${renderJob.status}`,
          message: `Job is already ${renderJob.status}`
        },
        { status: 400 }
      )
    }

    // Calculate credit refund
    const creditsRefunded = calculateCreditRefund(renderJob)

    // Terminate render process if it's running
    if (renderJob.status === 'processing') {
      const terminated = await terminateRenderProcess(jobId)
      if (!terminated) {
        console.warn(`Failed to terminate render process for job ${jobId}, proceeding with cancellation anyway`)
      }

      // Clean up partial render outputs
      await cleanupPartialRender(supabase, jobId)
    }

    // Update job status to cancelled
    const { error: updateError } = await supabase
      .from('render_jobs')
      .update({
        status: 'cancelled',
        completed_at: new Date().toISOString(),
        error_message: cancellationReason,
        metadata: {
          ...renderJob.metadata,
          cancelled_at: new Date().toISOString(),
          cancelled_by: user.id,
          cancellation_reason: cancellationReason,
          credits_refunded: creditsRefunded
        }
      })
      .eq('id', jobId)

    if (updateError) {
      console.error('Failed to update job status:', updateError)
      return NextResponse.json(
        { error: 'Failed to cancel render job' },
        { status: 500 }
      )
    }

    // Refund credits if applicable
    if (creditsRefunded > 0) {
      const { error: refundError } = await supabase.rpc('add_credits', {
        org_id: renderJob.org_id,
        amount: creditsRefunded
      })

      if (refundError) {
        console.error('Failed to refund credits:', refundError)
        // Don't fail the cancellation, but log the issue
        // In production, this should trigger an alert for manual reconciliation
      } else {
        // Record credit transaction
        await supabase.from('credit_transactions').insert({
          org_id: renderJob.org_id,
          credits: creditsRefunded,
          description: `Refund for cancelled render job: ${renderJob.type} (${renderJob.quality})`,
          metadata: {
            render_job_id: jobId,
            original_cost: renderJob.credits_cost,
            progress_at_cancellation: renderJob.progress,
            cancellation_reason: cancellationReason
          }
        })
      }
    }

    // Send notification if enabled
    if (renderJob.metadata?.notify_on_complete) {
      // In production, this would send an email/notification
      console.log(`Notification: Render job ${jobId} was cancelled`)
    }

    // Call webhook if configured
    if (renderJob.metadata?.webhook_url) {
      try {
        await fetch(renderJob.metadata.webhook_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Abode-Event': 'render.cancelled'
          },
          body: JSON.stringify({
            event: 'render.cancelled',
            jobId,
            status: 'cancelled',
            creditsRefunded,
            timestamp: new Date().toISOString()
          })
        })
      } catch (error) {
        console.error('Failed to call webhook:', error)
      }
    }

    // Prepare response
    const response: CancelRenderResponse = {
      success: true,
      jobId,
      status: 'cancelled',
      creditsRefunded,
      message: creditsRefunded > 0
        ? `Job cancelled successfully. ${creditsRefunded} credits refunded.`
        : 'Job cancelled successfully. No credits refunded.'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Render cancel POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
