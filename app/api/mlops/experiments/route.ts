/**
 * MLOps API - Experiments Route
 *
 * Manages ML experiment tracking including runs, metrics, parameters, and artifacts.
 * Enables comprehensive experiment management and comparison.
 */

import { NextRequest, NextResponse } from "next/server"
import { requireSession } from "@/lib/auth/session"

// Types
export type ExperimentStatus = "running" | "completed" | "failed" | "stopped"

export interface Experiment {
  id: string
  name: string
  description?: string
  tags?: string[]
  created_by: string
  created_at: string
  updated_at: string
  org_id: string
}

export interface ExperimentRun {
  id: string
  experiment_id: string
  experiment_name: string
  run_name?: string
  status: ExperimentStatus
  metrics: Record<string, number>
  parameters: Record<string, any>
  artifacts?: Array<{
    name: string
    type: string
    uri: string
    size_bytes?: number
  }>
  tags?: string[]
  start_time: string
  end_time?: string
  duration_ms?: number
  git_commit?: string
  source_file?: string
  created_by: string
  org_id: string
  metadata?: Record<string, any>
}

interface ListExperimentsQuery {
  search?: string
  tags?: string[]
  created_by?: string
  limit?: number
  offset?: number
  sortBy?: "created_at" | "updated_at" | "name"
  sortOrder?: "asc" | "desc"
}

interface CreateExperimentRunRequest {
  experiment_name: string
  run_name?: string
  parameters: Record<string, any>
  metrics?: Record<string, number>
  tags?: string[]
  git_commit?: string
  source_file?: string
  metadata?: Record<string, any>
}

// Mock database
const EXPERIMENTS_DB: Experiment[] = [
  {
    id: "exp-001",
    name: "property-price-prediction",
    description: "Experiment for optimizing property price prediction models",
    tags: ["regression", "pricing", "real-estate"],
    created_by: "user-001",
    created_at: "2024-01-10T08:00:00Z",
    updated_at: "2024-01-15T10:00:00Z",
    org_id: "org-001"
  },
  {
    id: "exp-002",
    name: "defect-detection",
    description: "Computer vision experiments for construction defect detection",
    tags: ["computer-vision", "detection", "quality-control"],
    created_by: "user-002",
    created_at: "2024-01-20T09:00:00Z",
    updated_at: "2024-02-01T14:30:00Z",
    org_id: "org-001"
  }
]

const RUNS_DB: ExperimentRun[] = [
  {
    id: "run-001",
    experiment_id: "exp-001",
    experiment_name: "property-price-prediction",
    run_name: "random-forest-v1",
    status: "completed",
    metrics: {
      rmse: 0.15,
      mae: 0.12,
      r2: 0.89,
      training_time: 125.5
    },
    parameters: {
      algorithm: "RandomForest",
      n_estimators: 100,
      max_depth: 10,
      min_samples_split: 2,
      learning_rate: 0.1
    },
    artifacts: [
      {
        name: "model.pkl",
        type: "model",
        uri: "s3://experiments/property-price-prediction/run-001/model.pkl",
        size_bytes: 52428800
      },
      {
        name: "feature_importance.png",
        type: "plot",
        uri: "s3://experiments/property-price-prediction/run-001/feature_importance.png",
        size_bytes: 102400
      }
    ],
    tags: ["production-candidate"],
    start_time: "2024-01-15T09:00:00Z",
    end_time: "2024-01-15T09:25:00Z",
    duration_ms: 1500000,
    git_commit: "abc123def456",
    source_file: "train_model.py",
    created_by: "user-001",
    org_id: "org-001",
    metadata: {
      dataset_version: "v2.1",
      feature_count: 45
    }
  },
  {
    id: "run-002",
    experiment_id: "exp-001",
    experiment_name: "property-price-prediction",
    run_name: "xgboost-v1",
    status: "completed",
    metrics: {
      rmse: 0.13,
      mae: 0.10,
      r2: 0.92,
      training_time: 95.2
    },
    parameters: {
      algorithm: "XGBoost",
      n_estimators: 200,
      max_depth: 8,
      min_child_weight: 1,
      learning_rate: 0.05
    },
    artifacts: [
      {
        name: "model.xgb",
        type: "model",
        uri: "s3://experiments/property-price-prediction/run-002/model.xgb",
        size_bytes: 41943040
      }
    ],
    tags: ["best-performance"],
    start_time: "2024-01-15T10:00:00Z",
    end_time: "2024-01-15T10:15:00Z",
    duration_ms: 900000,
    git_commit: "abc123def456",
    source_file: "train_model.py",
    created_by: "user-001",
    org_id: "org-001",
    metadata: {
      dataset_version: "v2.1",
      feature_count: 45
    }
  }
]

function parseQuery(request: NextRequest): ListExperimentsQuery {
  const { searchParams } = new URL(request.url)

  return {
    search: searchParams.get("search") || undefined,
    tags: searchParams.get("tags")?.split(",").filter(Boolean),
    created_by: searchParams.get("created_by") || undefined,
    limit: parseInt(searchParams.get("limit") || "20"),
    offset: parseInt(searchParams.get("offset") || "0"),
    sortBy: (searchParams.get("sortBy") as ListExperimentsQuery["sortBy"]) || "created_at",
    sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || "desc"
  }
}

function filterExperiments(experiments: Experiment[], query: ListExperimentsQuery, orgId: string): Experiment[] {
  let filtered = experiments.filter(e => e.org_id === orgId)

  if (query.search) {
    const searchLower = query.search.toLowerCase()
    filtered = filtered.filter(e =>
      e.name.toLowerCase().includes(searchLower) ||
      e.description?.toLowerCase().includes(searchLower)
    )
  }

  if (query.tags && query.tags.length > 0) {
    filtered = filtered.filter(e =>
      query.tags!.some(tag => e.tags?.includes(tag))
    )
  }

  if (query.created_by) {
    filtered = filtered.filter(e => e.created_by === query.created_by)
  }

  return filtered
}

function sortExperiments(experiments: Experiment[], sortBy: string, sortOrder: "asc" | "desc"): Experiment[] {
  const sorted = [...experiments].sort((a, b) => {
    let aVal: any = a[sortBy as keyof Experiment]
    let bVal: any = b[sortBy as keyof Experiment]

    if (typeof aVal === "string" && typeof bVal === "string") {
      return aVal.localeCompare(bVal)
    }

    if (aVal < bVal) return -1
    if (aVal > bVal) return 1
    return 0
  })

  return sortOrder === "desc" ? sorted.reverse() : sorted
}

function validateExperimentRun(data: any): CreateExperimentRunRequest {
  const errors: string[] = []

  if (!data.experiment_name || typeof data.experiment_name !== "string") {
    errors.push("experiment_name is required and must be a string")
  }

  if (!data.parameters || typeof data.parameters !== "object") {
    errors.push("parameters is required and must be an object")
  }

  if (data.metrics && typeof data.metrics !== "object") {
    errors.push("metrics must be an object")
  }

  if (data.tags && !Array.isArray(data.tags)) {
    errors.push("tags must be an array")
  }

  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.join(", ")}`)
  }

  return {
    experiment_name: data.experiment_name,
    run_name: data.run_name,
    parameters: data.parameters,
    metrics: data.metrics || {},
    tags: data.tags,
    git_commit: data.git_commit,
    source_file: data.source_file,
    metadata: data.metadata
  }
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const session = await requireSession({ request, enforceDevice: true, enforceGeo: true })
    const orgId = session.user?.orgId ?? "org-001"

    // Parse query parameters
    const query = parseQuery(request)

    // Check if we're listing runs for a specific experiment
    const { searchParams } = new URL(request.url)
    const experimentId = searchParams.get("experiment_id")

    if (experimentId) {
      // Return runs for specific experiment
      const runs = RUNS_DB.filter(r =>
        r.experiment_id === experimentId && r.org_id === orgId
      )

      // Sort by start_time (most recent first)
      const sortedRuns = runs.sort((a, b) =>
        new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
      )

      return NextResponse.json({
        runs: sortedRuns,
        total: sortedRuns.length,
        experiment_id: experimentId
      })
    }

    // Filter experiments
    let experiments = filterExperiments(EXPERIMENTS_DB, query, orgId)

    // Sort experiments
    experiments = sortExperiments(experiments, query.sortBy!, query.sortOrder!)

    // Get total count before pagination
    const total = experiments.length

    // Apply pagination
    const paginatedExperiments = experiments.slice(query.offset, query.offset! + query.limit!)

    // Add run counts
    const experimentsWithCounts = paginatedExperiments.map(exp => {
      const runs = RUNS_DB.filter(r => r.experiment_id === exp.id)
      return {
        ...exp,
        run_count: runs.length,
        latest_run: runs.length > 0 ? runs.sort((a, b) =>
          new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
        )[0] : null
      }
    })

    return NextResponse.json({
      experiments: experimentsWithCounts,
      total,
      limit: query.limit,
      offset: query.offset,
      hasMore: (query.offset! + query.limit!) < total
    })
  } catch (error) {
    console.error("Error listing experiments:", error)
    return NextResponse.json(
      { error: "Failed to list experiments" },
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
    let validatedData: CreateExperimentRunRequest
    try {
      validatedData = validateExperimentRun(body)
    } catch (validationError) {
      return NextResponse.json(
        {
          error: "Validation error",
          details: validationError instanceof Error ? validationError.message : "Invalid request data"
        },
        { status: 400 }
      )
    }

    // Find or create experiment
    let experiment = EXPERIMENTS_DB.find(
      e => e.name === validatedData.experiment_name && e.org_id === orgId
    )

    if (!experiment) {
      // Create new experiment
      experiment = {
        id: `exp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        name: validatedData.experiment_name,
        tags: validatedData.tags,
        created_by: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        org_id: orgId
      }
      EXPERIMENTS_DB.push(experiment)
    }

    // Create experiment run
    const run: ExperimentRun = {
      id: `run-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      experiment_id: experiment.id,
      experiment_name: experiment.name,
      run_name: validatedData.run_name || `run-${Date.now()}`,
      status: "running",
      metrics: validatedData.metrics!,
      parameters: validatedData.parameters,
      tags: validatedData.tags,
      start_time: new Date().toISOString(),
      git_commit: validatedData.git_commit,
      source_file: validatedData.source_file,
      created_by: userId,
      org_id: orgId,
      metadata: validatedData.metadata
    }

    // Save to database (mock)
    RUNS_DB.push(run)

    // Update experiment updated_at
    experiment.updated_at = new Date().toISOString()

    return NextResponse.json(
      {
        success: true,
        run,
        experiment,
        message: `Experiment run started: ${run.run_name}`
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating experiment run:", error)
    return NextResponse.json(
      {
        error: "Failed to create experiment run",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
