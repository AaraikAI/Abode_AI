/**
 * MLOps API - Model Deployment Route
 *
 * Handles model deployment to production/staging environments.
 * Supports multiple deployment strategies: blue-green, canary, rolling.
 */

import { NextRequest, NextResponse } from "next/server"
import { requireSession } from "@/lib/auth/session"

// Types
export type DeploymentEnvironment = "production" | "staging" | "development"
export type DeploymentStrategy = "blue-green" | "canary" | "rolling" | "direct"
export type DeploymentStatus = "pending" | "in_progress" | "completed" | "failed" | "rolled_back"

export interface Deployment {
  id: string
  model_id: string
  model_name: string
  model_version: string
  environment: DeploymentEnvironment
  strategy: DeploymentStrategy
  status: DeploymentStatus
  progress_percentage: number
  replicas?: number
  canary_percentage?: number
  rollback_enabled: boolean
  health_check_url?: string
  endpoint_url?: string
  logs?: string[]
  error_message?: string
  deployed_by: string
  started_at: string
  completed_at?: string
  rolled_back_at?: string
  org_id: string
  metadata?: Record<string, any>
}

interface DeployModelRequest {
  environment: DeploymentEnvironment
  strategy?: DeploymentStrategy
  replicas?: number
  canary_percentage?: number
  rollback_enabled?: boolean
  health_check_url?: string
  auto_scale?: boolean
  min_replicas?: number
  max_replicas?: number
  cpu_request?: string
  memory_request?: string
  cpu_limit?: string
  memory_limit?: string
}

// Mock database
const DEPLOYMENTS_DB: Deployment[] = [
  {
    id: "deploy-001",
    model_id: "model-001",
    model_name: "property-price-predictor",
    model_version: "1.0.0",
    environment: "production",
    strategy: "blue-green",
    status: "completed",
    progress_percentage: 100,
    replicas: 3,
    rollback_enabled: true,
    health_check_url: "https://api.example.com/health",
    endpoint_url: "https://api.example.com/v1/predict/property-price",
    logs: [
      "Starting blue-green deployment",
      "Spinning up green environment",
      "Health checks passed",
      "Switching traffic to green",
      "Deployment completed successfully"
    ],
    deployed_by: "user-001",
    started_at: "2024-01-15T12:00:00Z",
    completed_at: "2024-01-15T12:15:00Z",
    org_id: "org-001",
    metadata: {
      blue_version: "0.9.0",
      green_version: "1.0.0"
    }
  },
  {
    id: "deploy-002",
    model_id: "model-002",
    model_name: "defect-detector",
    model_version: "2.1.0",
    environment: "production",
    strategy: "canary",
    status: "in_progress",
    progress_percentage: 45,
    replicas: 5,
    canary_percentage: 20,
    rollback_enabled: true,
    health_check_url: "https://api.example.com/health",
    endpoint_url: "https://api.example.com/v1/detect/defects",
    logs: [
      "Starting canary deployment",
      "Deploying to 10% of traffic",
      "Monitoring metrics...",
      "Increasing to 20% of traffic"
    ],
    deployed_by: "user-002",
    started_at: "2024-02-06T09:00:00Z",
    org_id: "org-001",
    metadata: {
      canary_metrics: {
        error_rate: 0.02,
        latency_p95: 145
      }
    }
  }
]

const MODELS_DB = new Map([
  ["model-001", { id: "model-001", name: "property-price-predictor", version: "1.0.0", status: "registered" }],
  ["model-002", { id: "model-002", name: "defect-detector", version: "2.1.0", status: "registered" }],
  ["model-003", { id: "model-003", name: "test-model", version: "1.0.0", status: "registered" }]
])

function validateDeploymentRequest(data: any): DeployModelRequest {
  const errors: string[] = []

  if (!data.environment || !["production", "staging", "development"].includes(data.environment)) {
    errors.push("environment is required and must be 'production', 'staging', or 'development'")
  }

  if (data.strategy && !["blue-green", "canary", "rolling", "direct"].includes(data.strategy)) {
    errors.push("strategy must be 'blue-green', 'canary', 'rolling', or 'direct'")
  }

  if (data.replicas !== undefined) {
    if (typeof data.replicas !== "number" || data.replicas < 1 || data.replicas > 100) {
      errors.push("replicas must be a number between 1 and 100")
    }
  }

  if (data.canary_percentage !== undefined) {
    if (typeof data.canary_percentage !== "number" || data.canary_percentage < 1 || data.canary_percentage > 100) {
      errors.push("canary_percentage must be a number between 1 and 100")
    }
  }

  if (data.strategy === "canary" && !data.canary_percentage) {
    errors.push("canary_percentage is required when using canary strategy")
  }

  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.join(", ")}`)
  }

  return {
    environment: data.environment,
    strategy: data.strategy || "direct",
    replicas: data.replicas || 1,
    canary_percentage: data.canary_percentage,
    rollback_enabled: data.rollback_enabled !== false, // Default to true
    health_check_url: data.health_check_url,
    auto_scale: data.auto_scale,
    min_replicas: data.min_replicas,
    max_replicas: data.max_replicas,
    cpu_request: data.cpu_request,
    memory_request: data.memory_request,
    cpu_limit: data.cpu_limit,
    memory_limit: data.memory_limit
  }
}

function simulateDeployment(deployment: Deployment): Deployment {
  // Simulate deployment progress
  const logs = [...(deployment.logs || [])]

  switch (deployment.strategy) {
    case "blue-green":
      logs.push("Starting blue-green deployment")
      logs.push("Spinning up green environment")
      logs.push("Running health checks...")
      break
    case "canary":
      logs.push("Starting canary deployment")
      logs.push(`Deploying to ${deployment.canary_percentage}% of traffic`)
      logs.push("Monitoring metrics...")
      break
    case "rolling":
      logs.push("Starting rolling deployment")
      logs.push("Updating instances one by one...")
      break
    case "direct":
      logs.push("Starting direct deployment")
      logs.push("Deploying new version...")
      break
  }

  return {
    ...deployment,
    logs,
    progress_percentage: 10
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { modelId: string } }
) {
  try {
    // Authenticate user
    const session = await requireSession({ request, enforceDevice: true, enforceGeo: true })
    const orgId = session.user?.orgId ?? "org-001"
    const userId = session.user?.id ?? "user-001"

    const modelId = params.modelId

    // Check if model exists
    const model = MODELS_DB.get(modelId)
    if (!model) {
      return NextResponse.json(
        { error: "Model not found" },
        { status: 404 }
      )
    }

    // Parse request body
    const body = await request.json().catch(() => ({}))

    // Validate request
    let validatedData: DeployModelRequest
    try {
      validatedData = validateDeploymentRequest(body)
    } catch (validationError) {
      return NextResponse.json(
        {
          error: "Validation error",
          details: validationError instanceof Error ? validationError.message : "Invalid request data"
        },
        { status: 400 }
      )
    }

    // Check for existing active deployment
    const existingDeployment = DEPLOYMENTS_DB.find(
      d => d.model_id === modelId &&
           d.environment === validatedData.environment &&
           d.status === "in_progress"
    )

    if (existingDeployment) {
      return NextResponse.json(
        {
          error: "Deployment in progress",
          details: `Model is already being deployed to ${validatedData.environment}`,
          deployment_id: existingDeployment.id
        },
        { status: 409 }
      )
    }

    // Create deployment
    const deployment: Deployment = {
      id: `deploy-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      model_id: modelId,
      model_name: model.name,
      model_version: model.version,
      environment: validatedData.environment,
      strategy: validatedData.strategy!,
      status: "pending",
      progress_percentage: 0,
      replicas: validatedData.replicas,
      canary_percentage: validatedData.canary_percentage,
      rollback_enabled: validatedData.rollback_enabled!,
      health_check_url: validatedData.health_check_url,
      logs: [],
      deployed_by: userId,
      started_at: new Date().toISOString(),
      org_id: orgId,
      metadata: {
        auto_scale: validatedData.auto_scale,
        min_replicas: validatedData.min_replicas,
        max_replicas: validatedData.max_replicas,
        resources: {
          cpu_request: validatedData.cpu_request,
          memory_request: validatedData.memory_request,
          cpu_limit: validatedData.cpu_limit,
          memory_limit: validatedData.memory_limit
        }
      }
    }

    // Simulate deployment start
    const updatedDeployment = simulateDeployment(deployment)
    updatedDeployment.status = "in_progress"

    // Save to database (mock)
    DEPLOYMENTS_DB.push(updatedDeployment)

    return NextResponse.json(
      {
        success: true,
        deployment: updatedDeployment,
        message: `Deployment started for model ${model.name} to ${validatedData.environment}`
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error deploying model:", error)
    return NextResponse.json(
      {
        error: "Failed to deploy model",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { modelId: string } }
) {
  try {
    // Authenticate user
    const session = await requireSession({ request, enforceDevice: true, enforceGeo: true })
    const orgId = session.user?.orgId ?? "org-001"

    const modelId = params.modelId

    // Get all deployments for this model
    const deployments = DEPLOYMENTS_DB.filter(
      d => d.model_id === modelId && d.org_id === orgId
    )

    if (deployments.length === 0) {
      return NextResponse.json({
        deployments: [],
        total: 0,
        message: "No deployments found for this model"
      })
    }

    // Sort by started_at (most recent first)
    const sortedDeployments = deployments.sort((a, b) =>
      new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
    )

    // Get latest deployment per environment
    const latestByEnvironment: Record<string, Deployment> = {}
    for (const deployment of sortedDeployments) {
      if (!latestByEnvironment[deployment.environment]) {
        latestByEnvironment[deployment.environment] = deployment
      }
    }

    return NextResponse.json({
      deployments: sortedDeployments,
      total: sortedDeployments.length,
      latest_by_environment: latestByEnvironment,
      active_deployments: sortedDeployments.filter(d => d.status === "in_progress")
    })
  } catch (error) {
    console.error("Error getting deployment status:", error)
    return NextResponse.json(
      { error: "Failed to get deployment status" },
      { status: 500 }
    )
  }
}
