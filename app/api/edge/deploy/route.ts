/**
 * Edge Deployment API Endpoint
 *
 * Deploy applications to edge locations and monitor deployments
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 300 // 5 minutes for deployment

interface EdgeDeployRequest {
  projectId: string
  buildId?: string
  regions: string[] // e.g., ['us-east-1', 'eu-west-1', 'ap-southeast-1']
  environment: 'production' | 'staging' | 'preview'
  config?: {
    minInstances?: number
    maxInstances?: number
    autoscale?: boolean
    healthCheckPath?: string
    environmentVariables?: Record<string, string>
    customDomain?: string
    cdn?: {
      enabled: boolean
      cacheTTL?: number
      cacheControl?: string
    }
  }
}

interface EdgeDeployResponse {
  success: boolean
  deploymentId: string
  status: 'deploying' | 'deployed' | 'failed'
  regions: Array<{
    region: string
    status: 'pending' | 'deploying' | 'active' | 'failed'
    endpoint?: string
  }>
  estimatedTime: number
  error?: string
}

/**
 * Calculate deployment time based on regions and size
 */
function estimateDeploymentTime(regionCount: number, environment: string): number {
  const baseTime = 60 // 1 minute base
  const perRegionTime = 30 // 30 seconds per region
  const envMultiplier = environment === 'production' ? 1.5 : 1.0

  return Math.ceil((baseTime + (regionCount * perRegionTime)) * envMultiplier)
}

/**
 * Initialize edge deployment
 */
async function initializeEdgeDeployment(
  deploymentId: string,
  regions: string[],
  config: any
): Promise<{ success: boolean; error?: string }> {
  // Simulate edge deployment initialization
  // In production, this would call actual edge deployment service
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true })
    }, 1000)
  })
}

/**
 * POST - Deploy to edge locations
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
    const deployRequest = await request.json() as EdgeDeployRequest

    // Validate request
    if (!deployRequest.projectId || !deployRequest.regions || deployRequest.regions.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, regions' },
        { status: 400 }
      )
    }

    // Validate regions
    const validRegions = [
      'us-east-1', 'us-west-1', 'us-west-2',
      'eu-west-1', 'eu-central-1',
      'ap-southeast-1', 'ap-northeast-1',
      'sa-east-1', 'af-south-1'
    ]

    const invalidRegions = deployRequest.regions.filter(r => !validRegions.includes(r))
    if (invalidRegions.length > 0) {
      return NextResponse.json(
        { error: `Invalid regions: ${invalidRegions.join(', ')}` },
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

    // Verify project access
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', deployRequest.projectId)
      .eq('org_id', orgId)
      .single()

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      )
    }

    const estimatedTime = estimateDeploymentTime(
      deployRequest.regions.length,
      deployRequest.environment
    )

    // Create deployment record
    const { data: deployment, error: deployError } = await supabase
      .from('edge_deployments')
      .insert({
        project_id: deployRequest.projectId,
        org_id: orgId,
        user_id: user.id,
        build_id: deployRequest.buildId,
        environment: deployRequest.environment,
        regions: deployRequest.regions,
        status: 'deploying',
        config: deployRequest.config || {},
        estimated_time_seconds: estimatedTime,
        started_at: new Date().toISOString()
      })
      .select()
      .single()

    if (deployError || !deployment) {
      console.error('Failed to create deployment:', deployError)
      return NextResponse.json(
        { error: 'Failed to create deployment' },
        { status: 500 }
      )
    }

    // Create region status records
    const regionStatuses = deployRequest.regions.map(region => ({
      deployment_id: deployment.id,
      region,
      status: 'pending',
      endpoint: null
    }))

    await supabase
      .from('edge_deployment_regions')
      .insert(regionStatuses)

    // Initialize edge deployment (async)
    initializeEdgeDeployment(deployment.id, deployRequest.regions, deployRequest.config)
      .then(async (result) => {
        if (result.success) {
          // Update deployment status
          await supabase
            .from('edge_deployments')
            .update({
              status: 'deployed',
              completed_at: new Date().toISOString()
            })
            .eq('id', deployment.id)

          // Update region statuses
          const regionEndpoints = deployRequest.regions.map((region, idx) => ({
            deployment_id: deployment.id,
            region,
            status: 'active',
            endpoint: `https://${deployRequest.projectId}-${region}.edge.abodeai.com`
          }))

          for (const regionEndpoint of regionEndpoints) {
            await supabase
              .from('edge_deployment_regions')
              .update({
                status: regionEndpoint.status,
                endpoint: regionEndpoint.endpoint
              })
              .eq('deployment_id', deployment.id)
              .eq('region', regionEndpoint.region)
          }
        } else {
          await supabase
            .from('edge_deployments')
            .update({
              status: 'failed',
              error_message: result.error,
              completed_at: new Date().toISOString()
            })
            .eq('id', deployment.id)
        }
      })
      .catch(async (error) => {
        console.error('Edge deployment error:', error)
        await supabase
          .from('edge_deployments')
          .update({
            status: 'failed',
            error_message: error.message,
            completed_at: new Date().toISOString()
          })
          .eq('id', deployment.id)
      })

    // Prepare response
    const regionStatusResponse = deployRequest.regions.map(region => ({
      region,
      status: 'pending' as const
    }))

    const response: EdgeDeployResponse = {
      success: true,
      deploymentId: deployment.id,
      status: 'deploying',
      regions: regionStatusResponse,
      estimatedTime
    }

    return NextResponse.json(response, { status: 202 }) // 202 Accepted
  } catch (error) {
    console.error('Edge deploy API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET - Monitor edge deployment status
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
    const deploymentId = searchParams.get('deploymentId')

    if (!deploymentId) {
      return NextResponse.json(
        { error: 'Missing deploymentId parameter' },
        { status: 400 }
      )
    }

    // Get deployment
    const { data: deployment, error } = await supabase
      .from('edge_deployments')
      .select('*')
      .eq('id', deploymentId)
      .eq('user_id', user.id)
      .single()

    if (error || !deployment) {
      return NextResponse.json(
        { error: 'Deployment not found' },
        { status: 404 }
      )
    }

    // Get region statuses
    const { data: regionStatuses } = await supabase
      .from('edge_deployment_regions')
      .select('*')
      .eq('deployment_id', deploymentId)

    return NextResponse.json({
      deploymentId: deployment.id,
      status: deployment.status,
      environment: deployment.environment,
      regions: regionStatuses?.map(r => ({
        region: r.region,
        status: r.status,
        endpoint: r.endpoint
      })) || [],
      startedAt: deployment.started_at,
      completedAt: deployment.completed_at,
      error: deployment.error_message
    })
  } catch (error) {
    console.error('Edge deploy status API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
