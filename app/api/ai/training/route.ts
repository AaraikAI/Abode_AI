/**
 * Custom AI Training API Endpoint
 *
 * Manages custom model training jobs
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CustomAITrainingService, ModelConfig, TrainingSample } from '@/lib/services/custom-ai-training'

const trainingService = new CustomAITrainingService(
  process.env.AI_TRAINING_API_ENDPOINT || 'https://api.abodeai.com/training',
  process.env.AI_TRAINING_API_KEY || ''
)

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'No organization found' }, { status: 403 })
    }

    const body = await request.json()
    const { action } = body

    if (action === 'create-dataset') {
      const dataset = await trainingService.createDataset(
        body.name,
        body.type,
        user.id,
        membership.organization_id
      )

      await supabase.from('ai_datasets').insert({
        id: dataset.id,
        user_id: user.id,
        org_id: membership.organization_id,
        name: dataset.name,
        type: dataset.type,
        metadata: dataset.metadata
      })

      return NextResponse.json({ success: true, dataset })
    } else if (action === 'add-samples') {
      const { datasetId, samples } = body

      await trainingService.addSamples(datasetId, samples)

      return NextResponse.json({ success: true })
    } else if (action === 'start-training') {
      const { datasetId, modelConfig } = body as {
        datasetId: string
        modelConfig: ModelConfig
      }

      const job = await trainingService.startTraining(
        datasetId,
        modelConfig,
        user.id,
        membership.organization_id
      )

      await supabase.from('ai_training_jobs').insert({
        id: job.id,
        user_id: user.id,
        org_id: membership.organization_id,
        dataset_id: datasetId,
        model_config: modelConfig,
        status: job.status,
        progress: job.progress,
        resources: job.resources,
        created_at: job.createdAt
      })

      return NextResponse.json({ success: true, job })
    } else if (action === 'deploy-model') {
      const { jobId, deploymentConfig } = body

      const deployment = await trainingService.deployModel(jobId, deploymentConfig)

      return NextResponse.json({ success: true, deployment })
    } else if (action === 'inference') {
      const result = await trainingService.runInference(body.request)

      return NextResponse.json({ success: true, result })
    } else if (action === 'list-base-models') {
      const models = await trainingService.listBaseModels()

      return NextResponse.json({ success: true, models })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    console.error('AI training API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const jobId = searchParams.get('jobId')

    if (jobId) {
      const { data: job } = await supabase
        .from('ai_training_jobs')
        .select('*')
        .eq('id', jobId)
        .eq('user_id', user.id)
        .single()

      if (!job) {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 })
      }

      return NextResponse.json({ success: true, job })
    }

    // List all jobs for user
    const { data: jobs } = await supabase
      .from('ai_training_jobs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    return NextResponse.json({ success: true, jobs })
  } catch (error: any) {
    console.error('AI training GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
