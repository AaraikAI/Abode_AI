/**
 * MLOps API - Models Route
 *
 * Manages ML models registry including listing, filtering, and registration.
 * Supports filtering by status, framework, and task type.
 */

import { NextRequest, NextResponse } from "next/server"
import { requireSession } from "@/lib/auth/session"

// Types
export type ModelStatus = "draft" | "registered" | "deployed" | "archived" | "failed"
export type ModelFramework = "tensorflow" | "pytorch" | "scikit-learn" | "xgboost" | "keras" | "onnx" | "custom"
export type ModelTask = "classification" | "regression" | "clustering" | "detection" | "segmentation" | "nlp" | "forecasting" | "recommendation"

export interface MLModel {
  id: string
  name: string
  version: string
  description?: string
  framework: ModelFramework
  task: ModelTask
  status: ModelStatus
  metrics?: Record<string, number>
  parameters?: Record<string, any>
  tags?: string[]
  artifact_uri?: string
  model_size_bytes?: number
  input_schema?: Record<string, any>
  output_schema?: Record<string, any>
  dependencies?: Record<string, string>
  created_by: string
  created_at: string
  updated_at: string
  deployed_at?: string
  org_id: string
}

interface ListModelsQuery {
  status?: ModelStatus
  framework?: ModelFramework
  task?: ModelTask
  tags?: string[]
  search?: string
  limit?: number
  offset?: number
  sortBy?: "created_at" | "updated_at" | "name" | "version"
  sortOrder?: "asc" | "desc"
}

interface RegisterModelRequest {
  name: string
  version: string
  description?: string
  framework: ModelFramework
  task: ModelTask
  metrics?: Record<string, number>
  parameters?: Record<string, any>
  tags?: string[]
  artifact_uri?: string
  model_size_bytes?: number
  input_schema?: Record<string, any>
  output_schema?: Record<string, any>
  dependencies?: Record<string, string>
}

// Mock database (in production, this would be a real database)
const MODELS_DB: MLModel[] = [
  {
    id: "model-001",
    name: "property-price-predictor",
    version: "1.0.0",
    description: "ML model for predicting property prices based on features",
    framework: "scikit-learn",
    task: "regression",
    status: "deployed",
    metrics: {
      rmse: 0.15,
      mae: 0.12,
      r2: 0.89
    },
    parameters: {
      algorithm: "RandomForest",
      n_estimators: 100,
      max_depth: 10
    },
    tags: ["production", "property", "pricing"],
    artifact_uri: "s3://models/property-price-predictor/1.0.0",
    model_size_bytes: 52428800,
    created_by: "user-001",
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z",
    deployed_at: "2024-01-15T12:00:00Z",
    org_id: "org-001"
  },
  {
    id: "model-002",
    name: "defect-detector",
    version: "2.1.0",
    description: "Computer vision model for detecting construction defects",
    framework: "tensorflow",
    task: "detection",
    status: "deployed",
    metrics: {
      precision: 0.92,
      recall: 0.88,
      f1_score: 0.90,
      map: 0.85
    },
    parameters: {
      architecture: "YOLOv5",
      input_size: [640, 640],
      num_classes: 15
    },
    tags: ["production", "computer-vision", "quality-control"],
    artifact_uri: "s3://models/defect-detector/2.1.0",
    model_size_bytes: 104857600,
    created_by: "user-002",
    created_at: "2024-02-01T08:30:00Z",
    updated_at: "2024-02-05T14:20:00Z",
    deployed_at: "2024-02-06T09:00:00Z",
    org_id: "org-001"
  }
]

function parseQuery(request: NextRequest): ListModelsQuery {
  const { searchParams } = new URL(request.url)

  return {
    status: (searchParams.get("status") as ModelStatus) || undefined,
    framework: (searchParams.get("framework") as ModelFramework) || undefined,
    task: (searchParams.get("task") as ModelTask) || undefined,
    tags: searchParams.get("tags")?.split(",").filter(Boolean),
    search: searchParams.get("search") || undefined,
    limit: parseInt(searchParams.get("limit") || "20"),
    offset: parseInt(searchParams.get("offset") || "0"),
    sortBy: (searchParams.get("sortBy") as ListModelsQuery["sortBy"]) || "created_at",
    sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || "desc"
  }
}

function filterModels(models: MLModel[], query: ListModelsQuery, orgId: string): MLModel[] {
  let filtered = models.filter(m => m.org_id === orgId)

  if (query.status) {
    filtered = filtered.filter(m => m.status === query.status)
  }

  if (query.framework) {
    filtered = filtered.filter(m => m.framework === query.framework)
  }

  if (query.task) {
    filtered = filtered.filter(m => m.task === query.task)
  }

  if (query.tags && query.tags.length > 0) {
    filtered = filtered.filter(m =>
      query.tags!.some(tag => m.tags?.includes(tag))
    )
  }

  if (query.search) {
    const searchLower = query.search.toLowerCase()
    filtered = filtered.filter(m =>
      m.name.toLowerCase().includes(searchLower) ||
      m.description?.toLowerCase().includes(searchLower) ||
      m.version.toLowerCase().includes(searchLower)
    )
  }

  return filtered
}

function sortModels(models: MLModel[], sortBy: string, sortOrder: "asc" | "desc"): MLModel[] {
  const sorted = [...models].sort((a, b) => {
    let aVal: any = a[sortBy as keyof MLModel]
    let bVal: any = b[sortBy as keyof MLModel]

    if (typeof aVal === "string" && typeof bVal === "string") {
      return aVal.localeCompare(bVal)
    }

    if (aVal < bVal) return -1
    if (aVal > bVal) return 1
    return 0
  })

  return sortOrder === "desc" ? sorted.reverse() : sorted
}

function validateModelRegistration(data: any): RegisterModelRequest {
  const errors: string[] = []

  if (!data.name || typeof data.name !== "string") {
    errors.push("name is required and must be a string")
  }

  if (!data.version || typeof data.version !== "string") {
    errors.push("version is required and must be a string")
  }

  if (!data.framework || !["tensorflow", "pytorch", "scikit-learn", "xgboost", "keras", "onnx", "custom"].includes(data.framework)) {
    errors.push("framework is required and must be a valid framework type")
  }

  if (!data.task || !["classification", "regression", "clustering", "detection", "segmentation", "nlp", "forecasting", "recommendation"].includes(data.task)) {
    errors.push("task is required and must be a valid task type")
  }

  if (data.metrics && typeof data.metrics !== "object") {
    errors.push("metrics must be an object")
  }

  if (data.parameters && typeof data.parameters !== "object") {
    errors.push("parameters must be an object")
  }

  if (data.tags && !Array.isArray(data.tags)) {
    errors.push("tags must be an array")
  }

  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.join(", ")}`)
  }

  return {
    name: data.name,
    version: data.version,
    description: data.description,
    framework: data.framework,
    task: data.task,
    metrics: data.metrics,
    parameters: data.parameters,
    tags: data.tags,
    artifact_uri: data.artifact_uri,
    model_size_bytes: data.model_size_bytes,
    input_schema: data.input_schema,
    output_schema: data.output_schema,
    dependencies: data.dependencies
  }
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const session = await requireSession({ request, enforceDevice: true, enforceGeo: true })
    const orgId = session.user?.orgId ?? "org-001"

    // Parse query parameters
    const query = parseQuery(request)

    // Filter models
    let models = filterModels(MODELS_DB, query, orgId)

    // Sort models
    models = sortModels(models, query.sortBy!, query.sortOrder!)

    // Get total count before pagination
    const total = models.length

    // Apply pagination
    const paginatedModels = models.slice(query.offset, query.offset! + query.limit!)

    return NextResponse.json({
      models: paginatedModels,
      total,
      limit: query.limit,
      offset: query.offset,
      hasMore: (query.offset! + query.limit!) < total
    })
  } catch (error) {
    console.error("Error listing models:", error)
    return NextResponse.json(
      { error: "Failed to list models" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await requireSession({ request, enforceDevice: true, enforceGeo: true })
    const orgId = session.user?.orgId ?? "org-001"
    const userId = session.user?.id ?? "user-001"

    // Parse request body
    const body = await request.json().catch(() => ({}))

    // Validate request
    let validatedData: RegisterModelRequest
    try {
      validatedData = validateModelRegistration(body)
    } catch (validationError) {
      return NextResponse.json(
        {
          error: "Validation error",
          details: validationError instanceof Error ? validationError.message : "Invalid request data"
        },
        { status: 400 }
      )
    }

    // Check for duplicate model name + version
    const duplicate = MODELS_DB.find(
      m => m.org_id === orgId &&
           m.name === validatedData.name &&
           m.version === validatedData.version
    )

    if (duplicate) {
      return NextResponse.json(
        {
          error: "Model already exists",
          details: `Model ${validatedData.name} version ${validatedData.version} already exists`
        },
        { status: 409 }
      )
    }

    // Create new model
    const newModel: MLModel = {
      id: `model-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name: validatedData.name,
      version: validatedData.version,
      description: validatedData.description,
      framework: validatedData.framework,
      task: validatedData.task,
      status: "registered",
      metrics: validatedData.metrics,
      parameters: validatedData.parameters,
      tags: validatedData.tags,
      artifact_uri: validatedData.artifact_uri,
      model_size_bytes: validatedData.model_size_bytes,
      input_schema: validatedData.input_schema,
      output_schema: validatedData.output_schema,
      dependencies: validatedData.dependencies,
      created_by: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      org_id: orgId
    }

    // Save to database (mock)
    MODELS_DB.push(newModel)

    return NextResponse.json(
      {
        success: true,
        model: newModel
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error registering model:", error)
    return NextResponse.json(
      {
        error: "Failed to register model",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
