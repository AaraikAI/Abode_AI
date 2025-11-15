/**
 * MLOps Deployment API Tests
 * Comprehensive tests for model deployment endpoints
 */

import { GET, POST } from "@/app/api/mlops/models/[modelId]/deploy/route"
import { requireSession } from "@/lib/auth/session"
import { NextRequest } from "next/server"

// Mock dependencies
jest.mock("@/lib/auth/session")

describe("MLOps Deployment API", () => {
  const mockSession = {
    user: {
      id: "user-001",
      orgId: "org-001",
      email: "test@example.com"
    }
  }

  const validModelId = "model-001"
  const invalidModelId = "model-999"

  beforeEach(() => {
    jest.clearAllMocks()
    ;(requireSession as jest.Mock).mockResolvedValue(mockSession)
  })

  describe("POST /api/mlops/models/[modelId]/deploy - Deploy Model", () => {
    test("should deploy model to production with direct strategy", async () => {
      const deploymentRequest = {
        environment: "production",
        strategy: "direct",
        replicas: 3
      }

      const request = new NextRequest(
        `http://localhost:3000/api/mlops/models/${validModelId}/deploy`,
        {
          method: "POST",
          body: JSON.stringify(deploymentRequest)
        }
      )

      const response = await POST(request, { params: { modelId: validModelId } })
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.deployment).toBeDefined()
      expect(data.deployment.model_id).toBe(validModelId)
      expect(data.deployment.environment).toBe("production")
      expect(data.deployment.strategy).toBe("direct")
      expect(data.deployment.status).toBe("in_progress")
    })

    test("should deploy model with blue-green strategy", async () => {
      const deploymentRequest = {
        environment: "production",
        strategy: "blue-green",
        replicas: 5,
        rollback_enabled: true
      }

      const request = new NextRequest(
        `http://localhost:3000/api/mlops/models/${validModelId}/deploy`,
        {
          method: "POST",
          body: JSON.stringify(deploymentRequest)
        }
      )

      const response = await POST(request, { params: { modelId: validModelId } })
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.deployment.strategy).toBe("blue-green")
      expect(data.deployment.replicas).toBe(5)
      expect(data.deployment.rollback_enabled).toBe(true)
    })

    test("should deploy model with canary strategy", async () => {
      const deploymentRequest = {
        environment: "production",
        strategy: "canary",
        canary_percentage: 10,
        replicas: 5
      }

      const request = new NextRequest(
        `http://localhost:3000/api/mlops/models/${validModelId}/deploy`,
        {
          method: "POST",
          body: JSON.stringify(deploymentRequest)
        }
      )

      const response = await POST(request, { params: { modelId: validModelId } })
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.deployment.strategy).toBe("canary")
      expect(data.deployment.canary_percentage).toBe(10)
    })

    test("should deploy model with rolling strategy", async () => {
      const deploymentRequest = {
        environment: "production",
        strategy: "rolling",
        replicas: 4
      }

      const request = new NextRequest(
        `http://localhost:3000/api/mlops/models/${validModelId}/deploy`,
        {
          method: "POST",
          body: JSON.stringify(deploymentRequest)
        }
      )

      const response = await POST(request, { params: { modelId: validModelId } })
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.deployment.strategy).toBe("rolling")
    })

    test("should deploy to staging environment", async () => {
      const deploymentRequest = {
        environment: "staging",
        strategy: "direct"
      }

      const request = new NextRequest(
        `http://localhost:3000/api/mlops/models/${validModelId}/deploy`,
        {
          method: "POST",
          body: JSON.stringify(deploymentRequest)
        }
      )

      const response = await POST(request, { params: { modelId: validModelId } })
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.deployment.environment).toBe("staging")
    })

    test("should deploy to development environment", async () => {
      const deploymentRequest = {
        environment: "development",
        strategy: "direct"
      }

      const request = new NextRequest(
        `http://localhost:3000/api/mlops/models/${validModelId}/deploy`,
        {
          method: "POST",
          body: JSON.stringify(deploymentRequest)
        }
      )

      const response = await POST(request, { params: { modelId: validModelId } })
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.deployment.environment).toBe("development")
    })

    test("should reject deployment without environment", async () => {
      const deploymentRequest = {
        strategy: "direct"
      }

      const request = new NextRequest(
        `http://localhost:3000/api/mlops/models/${validModelId}/deploy`,
        {
          method: "POST",
          body: JSON.stringify(deploymentRequest)
        }
      )

      const response = await POST(request, { params: { modelId: validModelId } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("Validation error")
    })

    test("should reject invalid environment", async () => {
      const deploymentRequest = {
        environment: "invalid-env",
        strategy: "direct"
      }

      const request = new NextRequest(
        `http://localhost:3000/api/mlops/models/${validModelId}/deploy`,
        {
          method: "POST",
          body: JSON.stringify(deploymentRequest)
        }
      )

      const response = await POST(request, { params: { modelId: validModelId } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("Validation error")
    })

    test("should reject invalid strategy", async () => {
      const deploymentRequest = {
        environment: "production",
        strategy: "invalid-strategy"
      }

      const request = new NextRequest(
        `http://localhost:3000/api/mlops/models/${validModelId}/deploy`,
        {
          method: "POST",
          body: JSON.stringify(deploymentRequest)
        }
      )

      const response = await POST(request, { params: { modelId: validModelId } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("Validation error")
    })

    test("should reject invalid replicas count", async () => {
      const deploymentRequest = {
        environment: "production",
        strategy: "direct",
        replicas: -1
      }

      const request = new NextRequest(
        `http://localhost:3000/api/mlops/models/${validModelId}/deploy`,
        {
          method: "POST",
          body: JSON.stringify(deploymentRequest)
        }
      )

      const response = await POST(request, { params: { modelId: validModelId } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("Validation error")
    })

    test("should reject replicas count exceeding maximum", async () => {
      const deploymentRequest = {
        environment: "production",
        strategy: "direct",
        replicas: 101
      }

      const request = new NextRequest(
        `http://localhost:3000/api/mlops/models/${validModelId}/deploy`,
        {
          method: "POST",
          body: JSON.stringify(deploymentRequest)
        }
      )

      const response = await POST(request, { params: { modelId: validModelId } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("Validation error")
    })

    test("should require canary_percentage for canary strategy", async () => {
      const deploymentRequest = {
        environment: "production",
        strategy: "canary"
      }

      const request = new NextRequest(
        `http://localhost:3000/api/mlops/models/${validModelId}/deploy`,
        {
          method: "POST",
          body: JSON.stringify(deploymentRequest)
        }
      )

      const response = await POST(request, { params: { modelId: validModelId } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("Validation error")
    })

    test("should reject invalid canary_percentage", async () => {
      const deploymentRequest = {
        environment: "production",
        strategy: "canary",
        canary_percentage: 150
      }

      const request = new NextRequest(
        `http://localhost:3000/api/mlops/models/${validModelId}/deploy`,
        {
          method: "POST",
          body: JSON.stringify(deploymentRequest)
        }
      )

      const response = await POST(request, { params: { modelId: validModelId } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("Validation error")
    })

    test("should reject deployment of non-existent model", async () => {
      const deploymentRequest = {
        environment: "production",
        strategy: "direct"
      }

      const request = new NextRequest(
        `http://localhost:3000/api/mlops/models/${invalidModelId}/deploy`,
        {
          method: "POST",
          body: JSON.stringify(deploymentRequest)
        }
      )

      const response = await POST(request, { params: { modelId: invalidModelId } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe("Model not found")
    })

    test("should include deployment metadata", async () => {
      const deploymentRequest = {
        environment: "production",
        strategy: "direct",
        cpu_request: "1000m",
        memory_request: "2Gi",
        cpu_limit: "2000m",
        memory_limit: "4Gi"
      }

      const request = new NextRequest(
        `http://localhost:3000/api/mlops/models/${validModelId}/deploy`,
        {
          method: "POST",
          body: JSON.stringify(deploymentRequest)
        }
      )

      const response = await POST(request, { params: { modelId: validModelId } })
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.deployment.metadata.resources).toBeDefined()
      expect(data.deployment.metadata.resources.cpu_request).toBe("1000m")
      expect(data.deployment.metadata.resources.memory_request).toBe("2Gi")
    })

    test("should include auto-scaling configuration", async () => {
      const deploymentRequest = {
        environment: "production",
        strategy: "direct",
        auto_scale: true,
        min_replicas: 2,
        max_replicas: 10
      }

      const request = new NextRequest(
        `http://localhost:3000/api/mlops/models/${validModelId}/deploy`,
        {
          method: "POST",
          body: JSON.stringify(deploymentRequest)
        }
      )

      const response = await POST(request, { params: { modelId: validModelId } })
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.deployment.metadata.auto_scale).toBe(true)
      expect(data.deployment.metadata.min_replicas).toBe(2)
      expect(data.deployment.metadata.max_replicas).toBe(10)
    })

    test("should enable rollback by default", async () => {
      const deploymentRequest = {
        environment: "production",
        strategy: "blue-green"
      }

      const request = new NextRequest(
        `http://localhost:3000/api/mlops/models/${validModelId}/deploy`,
        {
          method: "POST",
          body: JSON.stringify(deploymentRequest)
        }
      )

      const response = await POST(request, { params: { modelId: validModelId } })
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.deployment.rollback_enabled).toBe(true)
    })

    test("should include health check URL if provided", async () => {
      const deploymentRequest = {
        environment: "production",
        strategy: "direct",
        health_check_url: "https://api.example.com/health"
      }

      const request = new NextRequest(
        `http://localhost:3000/api/mlops/models/${validModelId}/deploy`,
        {
          method: "POST",
          body: JSON.stringify(deploymentRequest)
        }
      )

      const response = await POST(request, { params: { modelId: validModelId } })
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.deployment.health_check_url).toBe("https://api.example.com/health")
    })

    test("should generate unique deployment ID", async () => {
      const deploymentRequest = {
        environment: "production",
        strategy: "direct"
      }

      const request = new NextRequest(
        `http://localhost:3000/api/mlops/models/${validModelId}/deploy`,
        {
          method: "POST",
          body: JSON.stringify(deploymentRequest)
        }
      )

      const response = await POST(request, { params: { modelId: validModelId } })
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.deployment.id).toBeDefined()
      expect(data.deployment.id).toMatch(/^deploy-/)
    })

    test("should include deployment logs", async () => {
      const deploymentRequest = {
        environment: "production",
        strategy: "blue-green"
      }

      const request = new NextRequest(
        `http://localhost:3000/api/mlops/models/${validModelId}/deploy`,
        {
          method: "POST",
          body: JSON.stringify(deploymentRequest)
        }
      )

      const response = await POST(request, { params: { modelId: validModelId } })
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.deployment.logs).toBeDefined()
      expect(Array.isArray(data.deployment.logs)).toBe(true)
      expect(data.deployment.logs.length).toBeGreaterThan(0)
    })

    test("should track deployment progress", async () => {
      const deploymentRequest = {
        environment: "production",
        strategy: "canary",
        canary_percentage: 20
      }

      const request = new NextRequest(
        `http://localhost:3000/api/mlops/models/${validModelId}/deploy`,
        {
          method: "POST",
          body: JSON.stringify(deploymentRequest)
        }
      )

      const response = await POST(request, { params: { modelId: validModelId } })
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.deployment.progress_percentage).toBeDefined()
      expect(typeof data.deployment.progress_percentage).toBe("number")
    })

    test("should include deployed_by user ID", async () => {
      const deploymentRequest = {
        environment: "production",
        strategy: "direct"
      }

      const request = new NextRequest(
        `http://localhost:3000/api/mlops/models/${validModelId}/deploy`,
        {
          method: "POST",
          body: JSON.stringify(deploymentRequest)
        }
      )

      const response = await POST(request, { params: { modelId: validModelId } })
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.deployment.deployed_by).toBe(mockSession.user.id)
    })

    test("should include organization ID", async () => {
      const deploymentRequest = {
        environment: "production",
        strategy: "direct"
      }

      const request = new NextRequest(
        `http://localhost:3000/api/mlops/models/${validModelId}/deploy`,
        {
          method: "POST",
          body: JSON.stringify(deploymentRequest)
        }
      )

      const response = await POST(request, { params: { modelId: validModelId } })
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.deployment.org_id).toBe(mockSession.user.orgId)
    })

    test("should include started_at timestamp", async () => {
      const deploymentRequest = {
        environment: "production",
        strategy: "direct"
      }

      const request = new NextRequest(
        `http://localhost:3000/api/mlops/models/${validModelId}/deploy`,
        {
          method: "POST",
          body: JSON.stringify(deploymentRequest)
        }
      )

      const response = await POST(request, { params: { modelId: validModelId } })
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.deployment.started_at).toBeDefined()
      expect(new Date(data.deployment.started_at).toString()).not.toBe("Invalid Date")
    })
  })

  describe("GET /api/mlops/models/[modelId]/deploy - Get Deployment Status", () => {
    test("should get all deployments for a model", async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/mlops/models/${validModelId}/deploy`
      )

      const response = await GET(request, { params: { modelId: validModelId } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.deployments).toBeDefined()
      expect(Array.isArray(data.deployments)).toBe(true)
      expect(data.total).toBeDefined()
    })

    test("should return deployments sorted by started_at", async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/mlops/models/${validModelId}/deploy`
      )

      const response = await GET(request, { params: { modelId: validModelId } })
      const data = await response.json()

      if (data.deployments.length > 1) {
        const timestamps = data.deployments.map((d: any) => new Date(d.started_at).getTime())
        for (let i = 1; i < timestamps.length; i++) {
          expect(timestamps[i-1]).toBeGreaterThanOrEqual(timestamps[i])
        }
      }
    })

    test("should return latest deployment per environment", async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/mlops/models/${validModelId}/deploy`
      )

      const response = await GET(request, { params: { modelId: validModelId } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.latest_by_environment).toBeDefined()
      expect(typeof data.latest_by_environment).toBe("object")
    })

    test("should filter active deployments", async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/mlops/models/${validModelId}/deploy`
      )

      const response = await GET(request, { params: { modelId: validModelId } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.active_deployments).toBeDefined()
      expect(Array.isArray(data.active_deployments)).toBe(true)
      expect(data.active_deployments.every((d: any) => d.status === "in_progress")).toBe(true)
    })

    test("should return empty array for model with no deployments", async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/mlops/models/model-003/deploy`
      )

      const response = await GET(request, { params: { modelId: "model-003" } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.deployments).toEqual([])
      expect(data.total).toBe(0)
    })

    test("should filter deployments by organization", async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/mlops/models/${validModelId}/deploy`
      )

      const response = await GET(request, { params: { modelId: validModelId } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.deployments.every((d: any) => d.org_id === mockSession.user.orgId)).toBe(true)
    })

    test("should handle authentication errors", async () => {
      (requireSession as jest.Mock).mockRejectedValue(new Error("Unauthorized"))

      const request = new NextRequest(
        `http://localhost:3000/api/mlops/models/${validModelId}/deploy`
      )

      const response = await GET(request, { params: { modelId: validModelId } })

      expect(response.status).toBe(500)
    })
  })
})
