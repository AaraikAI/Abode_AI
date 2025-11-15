/**
 * MLOps Experiments API Tests
 * Comprehensive tests for experiment tracking endpoints
 */

import { GET, POST } from "@/app/api/mlops/experiments/route"
import { requireSession } from "@/lib/auth/session"
import { NextRequest } from "next/server"

// Mock dependencies
jest.mock("@/lib/auth/session")

describe("MLOps Experiments API", () => {
  const mockSession = {
    user: {
      id: "user-001",
      orgId: "org-001",
      email: "test@example.com"
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(requireSession as jest.Mock).mockResolvedValue(mockSession)
  })

  describe("GET /api/mlops/experiments - List Experiments", () => {
    test("should list all experiments", async () => {
      const request = new NextRequest("http://localhost:3000/api/mlops/experiments")
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty("experiments")
      expect(data).toHaveProperty("total")
      expect(data).toHaveProperty("limit")
      expect(data).toHaveProperty("offset")
      expect(data).toHaveProperty("hasMore")
      expect(Array.isArray(data.experiments)).toBe(true)
    })

    test("should include run counts in experiments", async () => {
      const request = new NextRequest("http://localhost:3000/api/mlops/experiments")
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      if (data.experiments.length > 0) {
        expect(data.experiments[0]).toHaveProperty("run_count")
      }
    })

    test("should include latest run in experiments", async () => {
      const request = new NextRequest("http://localhost:3000/api/mlops/experiments")
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      if (data.experiments.length > 0) {
        expect(data.experiments[0]).toHaveProperty("latest_run")
      }
    })

    test("should filter experiments by search query", async () => {
      const request = new NextRequest("http://localhost:3000/api/mlops/experiments?search=property")
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      for (const exp of data.experiments) {
        const matchesSearch =
          exp.name.toLowerCase().includes("property") ||
          exp.description?.toLowerCase().includes("property")
        expect(matchesSearch).toBe(true)
      }
    })

    test("should filter experiments by tags", async () => {
      const request = new NextRequest("http://localhost:3000/api/mlops/experiments?tags=regression")
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      for (const exp of data.experiments) {
        expect(exp.tags?.includes("regression")).toBe(true)
      }
    })

    test("should filter experiments by created_by", async () => {
      const request = new NextRequest("http://localhost:3000/api/mlops/experiments?created_by=user-001")
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.experiments.every((e: any) => e.created_by === "user-001")).toBe(true)
    })

    test("should apply default pagination", async () => {
      const request = new NextRequest("http://localhost:3000/api/mlops/experiments")
      const response = await GET(request)
      const data = await response.json()

      expect(data.limit).toBe(20)
      expect(data.offset).toBe(0)
    })

    test("should apply custom pagination", async () => {
      const request = new NextRequest("http://localhost:3000/api/mlops/experiments?limit=5&offset=1")
      const response = await GET(request)
      const data = await response.json()

      expect(data.limit).toBe(5)
      expect(data.offset).toBe(1)
    })

    test("should sort experiments by created_at descending by default", async () => {
      const request = new NextRequest("http://localhost:3000/api/mlops/experiments")
      const response = await GET(request)
      const data = await response.json()

      if (data.experiments.length > 1) {
        const dates = data.experiments.map((e: any) => new Date(e.created_at).getTime())
        for (let i = 1; i < dates.length; i++) {
          expect(dates[i-1]).toBeGreaterThanOrEqual(dates[i])
        }
      }
    })

    test("should list runs for specific experiment", async () => {
      const request = new NextRequest("http://localhost:3000/api/mlops/experiments?experiment_id=exp-001")
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty("runs")
      expect(data).toHaveProperty("experiment_id")
      expect(data.experiment_id).toBe("exp-001")
      expect(Array.isArray(data.runs)).toBe(true)
    })

    test("should sort runs by start_time descending", async () => {
      const request = new NextRequest("http://localhost:3000/api/mlops/experiments?experiment_id=exp-001")
      const response = await GET(request)
      const data = await response.json()

      if (data.runs && data.runs.length > 1) {
        const timestamps = data.runs.map((r: any) => new Date(r.start_time).getTime())
        for (let i = 1; i < timestamps.length; i++) {
          expect(timestamps[i-1]).toBeGreaterThanOrEqual(timestamps[i])
        }
      }
    })

    test("should filter experiments by organization", async () => {
      const request = new NextRequest("http://localhost:3000/api/mlops/experiments")
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.experiments.every((e: any) => e.org_id === mockSession.user.orgId)).toBe(true)
    })
  })

  describe("POST /api/mlops/experiments - Create Experiment Run", () => {
    test("should create new experiment run", async () => {
      const runRequest = {
        experiment_name: "new-experiment",
        run_name: "test-run-1",
        parameters: {
          learning_rate: 0.001,
          batch_size: 32,
          epochs: 10
        },
        metrics: {
          accuracy: 0.95,
          loss: 0.12
        }
      }

      const request = new NextRequest("http://localhost:3000/api/mlops/experiments", {
        method: "POST",
        body: JSON.stringify(runRequest)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.run).toBeDefined()
      expect(data.experiment).toBeDefined()
      expect(data.run.experiment_name).toBe("new-experiment")
      expect(data.run.run_name).toBe("test-run-1")
      expect(data.run.status).toBe("running")
    })

    test("should create experiment if it doesn't exist", async () => {
      const runRequest = {
        experiment_name: "brand-new-experiment",
        parameters: {
          learning_rate: 0.001
        }
      }

      const request = new NextRequest("http://localhost:3000/api/mlops/experiments", {
        method: "POST",
        body: JSON.stringify(runRequest)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.experiment.name).toBe("brand-new-experiment")
    })

    test("should use existing experiment if it exists", async () => {
      const runRequest = {
        experiment_name: "property-price-prediction",
        parameters: {
          learning_rate: 0.001
        }
      }

      const request = new NextRequest("http://localhost:3000/api/mlops/experiments", {
        method: "POST",
        body: JSON.stringify(runRequest)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.experiment.name).toBe("property-price-prediction")
    })

    test("should reject run without experiment_name", async () => {
      const runRequest = {
        parameters: {
          learning_rate: 0.001
        }
      }

      const request = new NextRequest("http://localhost:3000/api/mlops/experiments", {
        method: "POST",
        body: JSON.stringify(runRequest)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("Validation error")
    })

    test("should reject run without parameters", async () => {
      const runRequest = {
        experiment_name: "test-experiment"
      }

      const request = new NextRequest("http://localhost:3000/api/mlops/experiments", {
        method: "POST",
        body: JSON.stringify(runRequest)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("Validation error")
    })

    test("should accept optional metrics", async () => {
      const runRequest = {
        experiment_name: "test-experiment",
        parameters: { lr: 0.001 },
        metrics: {
          accuracy: 0.95,
          precision: 0.93
        }
      }

      const request = new NextRequest("http://localhost:3000/api/mlops/experiments", {
        method: "POST",
        body: JSON.stringify(runRequest)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.run.metrics).toEqual(runRequest.metrics)
    })

    test("should accept optional tags", async () => {
      const runRequest = {
        experiment_name: "test-experiment",
        parameters: { lr: 0.001 },
        tags: ["test", "baseline"]
      }

      const request = new NextRequest("http://localhost:3000/api/mlops/experiments", {
        method: "POST",
        body: JSON.stringify(runRequest)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.run.tags).toEqual(runRequest.tags)
    })

    test("should accept optional git_commit", async () => {
      const runRequest = {
        experiment_name: "test-experiment",
        parameters: { lr: 0.001 },
        git_commit: "abc123def456"
      }

      const request = new NextRequest("http://localhost:3000/api/mlops/experiments", {
        method: "POST",
        body: JSON.stringify(runRequest)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.run.git_commit).toBe("abc123def456")
    })

    test("should accept optional source_file", async () => {
      const runRequest = {
        experiment_name: "test-experiment",
        parameters: { lr: 0.001 },
        source_file: "train.py"
      }

      const request = new NextRequest("http://localhost:3000/api/mlops/experiments", {
        method: "POST",
        body: JSON.stringify(runRequest)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.run.source_file).toBe("train.py")
    })

    test("should accept optional metadata", async () => {
      const runRequest = {
        experiment_name: "test-experiment",
        parameters: { lr: 0.001 },
        metadata: {
          dataset_version: "v1.0",
          feature_count: 50
        }
      }

      const request = new NextRequest("http://localhost:3000/api/mlops/experiments", {
        method: "POST",
        body: JSON.stringify(runRequest)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.run.metadata).toEqual(runRequest.metadata)
    })

    test("should generate run_name if not provided", async () => {
      const runRequest = {
        experiment_name: "test-experiment",
        parameters: { lr: 0.001 }
      }

      const request = new NextRequest("http://localhost:3000/api/mlops/experiments", {
        method: "POST",
        body: JSON.stringify(runRequest)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.run.run_name).toBeDefined()
      expect(data.run.run_name).toMatch(/^run-/)
    })

    test("should generate unique run ID", async () => {
      const runRequest = {
        experiment_name: "test-experiment",
        parameters: { lr: 0.001 }
      }

      const request = new NextRequest("http://localhost:3000/api/mlops/experiments", {
        method: "POST",
        body: JSON.stringify(runRequest)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.run.id).toBeDefined()
      expect(data.run.id).toMatch(/^run-/)
    })

    test("should include created_by in run", async () => {
      const runRequest = {
        experiment_name: "test-experiment",
        parameters: { lr: 0.001 }
      }

      const request = new NextRequest("http://localhost:3000/api/mlops/experiments", {
        method: "POST",
        body: JSON.stringify(runRequest)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.run.created_by).toBe(mockSession.user.id)
    })

    test("should include org_id in run", async () => {
      const runRequest = {
        experiment_name: "test-experiment",
        parameters: { lr: 0.001 }
      }

      const request = new NextRequest("http://localhost:3000/api/mlops/experiments", {
        method: "POST",
        body: JSON.stringify(runRequest)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.run.org_id).toBe(mockSession.user.orgId)
    })

    test("should include start_time in run", async () => {
      const runRequest = {
        experiment_name: "test-experiment",
        parameters: { lr: 0.001 }
      }

      const request = new NextRequest("http://localhost:3000/api/mlops/experiments", {
        method: "POST",
        body: JSON.stringify(runRequest)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.run.start_time).toBeDefined()
      expect(new Date(data.run.start_time).toString()).not.toBe("Invalid Date")
    })

    test("should handle malformed JSON", async () => {
      const request = new NextRequest("http://localhost:3000/api/mlops/experiments", {
        method: "POST",
        body: "invalid json"
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("Validation error")
    })

    test("should reject invalid metrics type", async () => {
      const runRequest = {
        experiment_name: "test-experiment",
        parameters: { lr: 0.001 },
        metrics: "invalid"
      }

      const request = new NextRequest("http://localhost:3000/api/mlops/experiments", {
        method: "POST",
        body: JSON.stringify(runRequest)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("Validation error")
    })

    test("should reject invalid tags type", async () => {
      const runRequest = {
        experiment_name: "test-experiment",
        parameters: { lr: 0.001 },
        tags: "invalid"
      }

      const request = new NextRequest("http://localhost:3000/api/mlops/experiments", {
        method: "POST",
        body: JSON.stringify(runRequest)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("Validation error")
    })
  })
})
