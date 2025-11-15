/**
 * MLOps Models API Tests
 * Comprehensive tests for ML model registry endpoints
 */

import { GET, POST } from "@/app/api/mlops/models/route"
import { requireSession } from "@/lib/auth/session"
import { NextRequest } from "next/server"

// Mock dependencies
jest.mock("@/lib/auth/session")

describe("MLOps Models API", () => {
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

  describe("GET /api/mlops/models - List Models", () => {
    test("should list all models without filters", async () => {
      const request = new NextRequest("http://localhost:3000/api/mlops/models")
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty("models")
      expect(data).toHaveProperty("total")
      expect(data).toHaveProperty("limit")
      expect(data).toHaveProperty("offset")
      expect(data).toHaveProperty("hasMore")
      expect(Array.isArray(data.models)).toBe(true)
    })

    test("should filter models by status", async () => {
      const request = new NextRequest("http://localhost:3000/api/mlops/models?status=deployed")
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.models.every((m: any) => m.status === "deployed")).toBe(true)
    })

    test("should filter models by framework", async () => {
      const request = new NextRequest("http://localhost:3000/api/mlops/models?framework=tensorflow")
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.models.every((m: any) => m.framework === "tensorflow")).toBe(true)
    })

    test("should filter models by task type", async () => {
      const request = new NextRequest("http://localhost:3000/api/mlops/models?task=regression")
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.models.every((m: any) => m.task === "regression")).toBe(true)
    })

    test("should filter models by tags", async () => {
      const request = new NextRequest("http://localhost:3000/api/mlops/models?tags=production")
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.models.every((m: any) => m.tags?.includes("production"))).toBe(true)
    })

    test("should filter models by multiple tags", async () => {
      const request = new NextRequest("http://localhost:3000/api/mlops/models?tags=production,computer-vision")
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      for (const model of data.models) {
        const hasTag = model.tags?.includes("production") || model.tags?.includes("computer-vision")
        expect(hasTag).toBe(true)
      }
    })

    test("should search models by name", async () => {
      const request = new NextRequest("http://localhost:3000/api/mlops/models?search=price")
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      for (const model of data.models) {
        const matchesSearch =
          model.name.toLowerCase().includes("price") ||
          model.description?.toLowerCase().includes("price")
        expect(matchesSearch).toBe(true)
      }
    })

    test("should search models by description", async () => {
      const request = new NextRequest("http://localhost:3000/api/mlops/models?search=defect")
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      for (const model of data.models) {
        const matchesSearch =
          model.name.toLowerCase().includes("defect") ||
          model.description?.toLowerCase().includes("defect")
        expect(matchesSearch).toBe(true)
      }
    })

    test("should apply pagination with default values", async () => {
      const request = new NextRequest("http://localhost:3000/api/mlops/models")
      const response = await GET(request)
      const data = await response.json()

      expect(data.limit).toBe(20)
      expect(data.offset).toBe(0)
    })

    test("should apply custom pagination", async () => {
      const request = new NextRequest("http://localhost:3000/api/mlops/models?limit=5&offset=1")
      const response = await GET(request)
      const data = await response.json()

      expect(data.limit).toBe(5)
      expect(data.offset).toBe(1)
      expect(data.models.length).toBeLessThanOrEqual(5)
    })

    test("should sort by created_at descending by default", async () => {
      const request = new NextRequest("http://localhost:3000/api/mlops/models")
      const response = await GET(request)
      const data = await response.json()

      if (data.models.length > 1) {
        const dates = data.models.map((m: any) => new Date(m.created_at).getTime())
        for (let i = 1; i < dates.length; i++) {
          expect(dates[i-1]).toBeGreaterThanOrEqual(dates[i])
        }
      }
    })

    test("should sort by name ascending", async () => {
      const request = new NextRequest("http://localhost:3000/api/mlops/models?sortBy=name&sortOrder=asc")
      const response = await GET(request)
      const data = await response.json()

      if (data.models.length > 1) {
        const names = data.models.map((m: any) => m.name)
        for (let i = 1; i < names.length; i++) {
          expect(names[i-1].localeCompare(names[i])).toBeLessThanOrEqual(0)
        }
      }
    })

    test("should sort by updated_at", async () => {
      const request = new NextRequest("http://localhost:3000/api/mlops/models?sortBy=updated_at&sortOrder=desc")
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.models).toBeDefined()
    })

    test("should combine multiple filters", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/mlops/models?status=deployed&framework=tensorflow&task=detection"
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      for (const model of data.models) {
        expect(model.status).toBe("deployed")
        expect(model.framework).toBe("tensorflow")
        expect(model.task).toBe("detection")
      }
    })

    test("should return empty array when no models match filters", async () => {
      const request = new NextRequest("http://localhost:3000/api/mlops/models?status=failed&framework=custom")
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.models).toEqual([])
      expect(data.total).toBe(0)
    })

    test("should include all model properties", async () => {
      const request = new NextRequest("http://localhost:3000/api/mlops/models")
      const response = await GET(request)
      const data = await response.json()

      if (data.models.length > 0) {
        const model = data.models[0]
        expect(model).toHaveProperty("id")
        expect(model).toHaveProperty("name")
        expect(model).toHaveProperty("version")
        expect(model).toHaveProperty("framework")
        expect(model).toHaveProperty("task")
        expect(model).toHaveProperty("status")
        expect(model).toHaveProperty("created_at")
        expect(model).toHaveProperty("updated_at")
      }
    })

    test("should handle authentication errors", async () => {
      (requireSession as jest.Mock).mockRejectedValue(new Error("Unauthorized"))

      const request = new NextRequest("http://localhost:3000/api/mlops/models")
      const response = await GET(request)

      expect(response.status).toBe(500)
    })

    test("should filter models by organization", async () => {
      const customSession = {
        user: {
          id: "user-002",
          orgId: "org-002",
          email: "test2@example.com"
        }
      }
      ;(requireSession as jest.Mock).mockResolvedValue(customSession)

      const request = new NextRequest("http://localhost:3000/api/mlops/models")
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.models.every((m: any) => m.org_id === "org-002")).toBe(true)
    })

    test("should calculate hasMore flag correctly", async () => {
      const request = new NextRequest("http://localhost:3000/api/mlops/models?limit=1")
      const response = await GET(request)
      const data = await response.json()

      if (data.total > 1) {
        expect(data.hasMore).toBe(true)
      } else {
        expect(data.hasMore).toBe(false)
      }
    })
  })

  describe("POST /api/mlops/models - Register Model", () => {
    test("should register a new model successfully", async () => {
      const newModel = {
        name: "test-model",
        version: "1.0.0",
        description: "Test model for unit testing",
        framework: "pytorch",
        task: "classification",
        metrics: {
          accuracy: 0.95,
          precision: 0.93,
          recall: 0.94
        },
        parameters: {
          learning_rate: 0.001,
          batch_size: 32
        },
        tags: ["test", "classification"]
      }

      const request = new NextRequest("http://localhost:3000/api/mlops/models", {
        method: "POST",
        body: JSON.stringify(newModel)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.model).toBeDefined()
      expect(data.model.name).toBe(newModel.name)
      expect(data.model.version).toBe(newModel.version)
      expect(data.model.framework).toBe(newModel.framework)
      expect(data.model.task).toBe(newModel.task)
      expect(data.model.status).toBe("registered")
    })

    test("should reject registration without name", async () => {
      const invalidModel = {
        version: "1.0.0",
        framework: "pytorch",
        task: "classification"
      }

      const request = new NextRequest("http://localhost:3000/api/mlops/models", {
        method: "POST",
        body: JSON.stringify(invalidModel)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("Validation error")
    })

    test("should reject registration without version", async () => {
      const invalidModel = {
        name: "test-model",
        framework: "pytorch",
        task: "classification"
      }

      const request = new NextRequest("http://localhost:3000/api/mlops/models", {
        method: "POST",
        body: JSON.stringify(invalidModel)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("Validation error")
    })

    test("should reject registration without framework", async () => {
      const invalidModel = {
        name: "test-model",
        version: "1.0.0",
        task: "classification"
      }

      const request = new NextRequest("http://localhost:3000/api/mlops/models", {
        method: "POST",
        body: JSON.stringify(invalidModel)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("Validation error")
    })

    test("should reject registration without task", async () => {
      const invalidModel = {
        name: "test-model",
        version: "1.0.0",
        framework: "pytorch"
      }

      const request = new NextRequest("http://localhost:3000/api/mlops/models", {
        method: "POST",
        body: JSON.stringify(invalidModel)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("Validation error")
    })

    test("should reject invalid framework", async () => {
      const invalidModel = {
        name: "test-model",
        version: "1.0.0",
        framework: "invalid-framework",
        task: "classification"
      }

      const request = new NextRequest("http://localhost:3000/api/mlops/models", {
        method: "POST",
        body: JSON.stringify(invalidModel)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("Validation error")
    })

    test("should reject invalid task type", async () => {
      const invalidModel = {
        name: "test-model",
        version: "1.0.0",
        framework: "pytorch",
        task: "invalid-task"
      }

      const request = new NextRequest("http://localhost:3000/api/mlops/models", {
        method: "POST",
        body: JSON.stringify(invalidModel)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("Validation error")
    })

    test("should reject invalid metrics type", async () => {
      const invalidModel = {
        name: "test-model",
        version: "1.0.0",
        framework: "pytorch",
        task: "classification",
        metrics: "invalid"
      }

      const request = new NextRequest("http://localhost:3000/api/mlops/models", {
        method: "POST",
        body: JSON.stringify(invalidModel)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("Validation error")
    })

    test("should reject invalid parameters type", async () => {
      const invalidModel = {
        name: "test-model",
        version: "1.0.0",
        framework: "pytorch",
        task: "classification",
        parameters: "invalid"
      }

      const request = new NextRequest("http://localhost:3000/api/mlops/models", {
        method: "POST",
        body: JSON.stringify(invalidModel)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("Validation error")
    })

    test("should reject invalid tags type", async () => {
      const invalidModel = {
        name: "test-model",
        version: "1.0.0",
        framework: "pytorch",
        task: "classification",
        tags: "invalid"
      }

      const request = new NextRequest("http://localhost:3000/api/mlops/models", {
        method: "POST",
        body: JSON.stringify(invalidModel)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("Validation error")
    })

    test("should prevent duplicate model registration", async () => {
      const model = {
        name: "property-price-predictor",
        version: "1.0.0",
        framework: "scikit-learn",
        task: "regression"
      }

      const request = new NextRequest("http://localhost:3000/api/mlops/models", {
        method: "POST",
        body: JSON.stringify(model)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.error).toBe("Model already exists")
    })

    test("should accept optional description", async () => {
      const model = {
        name: "new-test-model",
        version: "2.0.0",
        description: "Model with description",
        framework: "pytorch",
        task: "classification"
      }

      const request = new NextRequest("http://localhost:3000/api/mlops/models", {
        method: "POST",
        body: JSON.stringify(model)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.model.description).toBe(model.description)
    })

    test("should accept optional metrics", async () => {
      const model = {
        name: "metrics-test-model",
        version: "1.0.0",
        framework: "tensorflow",
        task: "regression",
        metrics: {
          mse: 0.05,
          rmse: 0.22
        }
      }

      const request = new NextRequest("http://localhost:3000/api/mlops/models", {
        method: "POST",
        body: JSON.stringify(model)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.model.metrics).toEqual(model.metrics)
    })

    test("should accept optional parameters", async () => {
      const model = {
        name: "params-test-model",
        version: "1.0.0",
        framework: "xgboost",
        task: "classification",
        parameters: {
          n_estimators: 100,
          learning_rate: 0.1
        }
      }

      const request = new NextRequest("http://localhost:3000/api/mlops/models", {
        method: "POST",
        body: JSON.stringify(model)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.model.parameters).toEqual(model.parameters)
    })

    test("should include created_by in model", async () => {
      const model = {
        name: "creator-test-model",
        version: "1.0.0",
        framework: "pytorch",
        task: "classification"
      }

      const request = new NextRequest("http://localhost:3000/api/mlops/models", {
        method: "POST",
        body: JSON.stringify(model)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.model.created_by).toBe(mockSession.user.id)
    })

    test("should include org_id in model", async () => {
      const model = {
        name: "org-test-model",
        version: "1.0.0",
        framework: "pytorch",
        task: "classification"
      }

      const request = new NextRequest("http://localhost:3000/api/mlops/models", {
        method: "POST",
        body: JSON.stringify(model)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.model.org_id).toBe(mockSession.user.orgId)
    })

    test("should include timestamps in model", async () => {
      const model = {
        name: "timestamp-test-model",
        version: "1.0.0",
        framework: "pytorch",
        task: "classification"
      }

      const request = new NextRequest("http://localhost:3000/api/mlops/models", {
        method: "POST",
        body: JSON.stringify(model)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.model.created_at).toBeDefined()
      expect(data.model.updated_at).toBeDefined()
    })

    test("should generate unique model ID", async () => {
      const model = {
        name: "id-test-model",
        version: "1.0.0",
        framework: "pytorch",
        task: "classification"
      }

      const request = new NextRequest("http://localhost:3000/api/mlops/models", {
        method: "POST",
        body: JSON.stringify(model)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.model.id).toBeDefined()
      expect(data.model.id).toMatch(/^model-/)
    })

    test("should handle malformed JSON", async () => {
      const request = new NextRequest("http://localhost:3000/api/mlops/models", {
        method: "POST",
        body: "invalid json"
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("Validation error")
    })
  })
})
