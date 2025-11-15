/**
 * Integration Tests for Cost Estimation Calculate API
 *
 * Tests cost calculation with materials, labor, regional pricing, taxes, and profit margins.
 * Total: 30 comprehensive tests
 */

import { describe, it, expect, beforeAll, afterAll } from "@jest/globals"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:54321"
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "test-key"
const supabase = createClient(supabaseUrl, supabaseKey)

describe("Cost Estimation Calculate API", () => {
  let testUserId: string
  let testOrgId: string
  let authToken: string

  beforeAll(async () => {
    // Create test user
    const {
      data: { user },
      error,
    } = await supabase.auth.admin.createUser({
      email: "cost-estimate-test@example.com",
      password: "test-password-123",
      email_confirm: true,
    })

    if (error || !user) {
      throw new Error("Failed to create test user")
    }

    testUserId = user.id

    // Sign in to get auth token
    const {
      data: { session },
    } = await supabase.auth.signInWithPassword({
      email: "cost-estimate-test@example.com",
      password: "test-password-123",
    })

    if (!session) {
      throw new Error("Failed to sign in")
    }

    authToken = session.access_token

    // Create test organization
    const { data: org } = await supabase
      .from("organizations")
      .insert({
        name: "Test Cost Estimation Org",
        credits: 5000,
      })
      .select()
      .single()

    testOrgId = org!.id

    // Add user to organization
    await supabase.from("organization_members").insert({
      organization_id: testOrgId,
      user_id: testUserId,
      role: "admin",
    })
  })

  afterAll(async () => {
    // Cleanup
    await supabase.from("organization_members").delete().eq("organization_id", testOrgId)
    await supabase.from("organizations").delete().eq("id", testOrgId)
    await supabase.auth.admin.deleteUser(testUserId)
  })

  describe("POST /api/cost-estimation/calculate - Basic Functionality", () => {
    it("should calculate cost estimate with valid materials and labor", async () => {
      const response = await fetch(`http://localhost:3000/api/cost-estimation/calculate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          materials: [
            {
              id: "lumber-2x4-8ft",
              name: "2x4 Lumber 8ft",
              quantity: 50,
              unit: "pieces",
              category: "lumber",
            },
            {
              id: "drywall-4x8-1/2",
              name: "Drywall 4x8 1/2 inch",
              quantity: 20,
              unit: "sheets",
              category: "drywall",
            },
          ],
          labor: [
            {
              id: "labor-001",
              role: "carpenter",
              hours: 40,
              skillLevel: "journeyman",
            },
            {
              id: "labor-002",
              role: "electrician",
              hours: 20,
              skillLevel: "master",
            },
          ],
          regional: {
            region: "US-CA",
          },
        }),
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.estimateId).toBeDefined()
      expect(data.estimateId).toMatch(/^EST-/)
      expect(data.breakdown).toBeDefined()
      expect(data.breakdown.materials.total).toBeGreaterThan(0)
      expect(data.breakdown.labor.total).toBeGreaterThan(0)
      expect(data.breakdown.totals.grandTotal).toBeGreaterThan(0)
    })

    it("should include waste factor in materials calculation", async () => {
      const response = await fetch(`http://localhost:3000/api/cost-estimation/calculate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          materials: [
            {
              id: "lumber-2x4-8ft",
              name: "2x4 Lumber 8ft",
              quantity: 100,
              unit: "pieces",
              wasteFactor: 0.15, // 15% waste
            },
          ],
          labor: [
            {
              id: "labor-001",
              role: "carpenter",
              hours: 10,
            },
          ],
          regional: {
            region: "US-CA",
          },
        }),
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.breakdown.materials.waste).toBeGreaterThan(0)
      expect(data.breakdown.materials.total).toBe(
        data.breakdown.materials.subtotal + data.breakdown.materials.waste
      )
    })

    it("should calculate overtime pay correctly", async () => {
      const response = await fetch(`http://localhost:3000/api/cost-estimation/calculate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          materials: [
            {
              id: "lumber-2x4-8ft",
              name: "2x4 Lumber",
              quantity: 10,
              unit: "pieces",
            },
          ],
          labor: [
            {
              id: "labor-001",
              role: "carpenter",
              hours: 40,
              overtimeHours: 10,
              skillLevel: "journeyman",
            },
          ],
          regional: {
            region: "US-CA",
          },
        }),
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.breakdown.labor.overtime).toBeGreaterThan(0)
      expect(data.breakdown.labor.items[0].overtimePay).toBeGreaterThan(0)
      // Overtime should be 1.5x regular rate
      const hourlyRate = data.breakdown.labor.items[0].hourlyRate
      expect(data.breakdown.labor.items[0].overtimePay).toBe(10 * hourlyRate * 1.5)
    })

    it("should apply regional tax rates correctly", async () => {
      const response = await fetch(`http://localhost:3000/api/cost-estimation/calculate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          materials: [
            {
              id: "lumber-2x4-8ft",
              name: "2x4 Lumber",
              quantity: 10,
              unit: "pieces",
            },
          ],
          labor: [
            {
              id: "labor-001",
              role: "carpenter",
              hours: 10,
            },
          ],
          regional: {
            region: "US-CA",
          },
        }),
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.breakdown.taxes.rate).toBe(0.0725) // California tax rate
      expect(data.breakdown.taxes.amount).toBeGreaterThan(0)
      expect(data.metadata.taxRate).toBe("7.25%")
    })

    it("should calculate profit margin correctly", async () => {
      const response = await fetch(`http://localhost:3000/api/cost-estimation/calculate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          materials: [
            {
              id: "lumber-2x4-8ft",
              name: "2x4 Lumber",
              quantity: 10,
              unit: "pieces",
            },
          ],
          labor: [
            {
              id: "labor-001",
              role: "carpenter",
              hours: 10,
            },
          ],
          regional: {
            region: "US-CA",
          },
        }),
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.breakdown.profit.rate).toBe(0.20) // 20% profit margin for CA
      expect(data.breakdown.profit.amount).toBeGreaterThan(0)
      expect(data.metadata.profitMargin).toBe("20.00%")
    })

    it("should include permit fees and overhead", async () => {
      const response = await fetch(`http://localhost:3000/api/cost-estimation/calculate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          materials: [
            {
              id: "lumber-2x4-8ft",
              name: "2x4 Lumber",
              quantity: 10,
              unit: "pieces",
            },
          ],
          labor: [
            {
              id: "labor-001",
              role: "carpenter",
              hours: 10,
            },
          ],
          regional: {
            region: "US-CA",
          },
        }),
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.breakdown.fees.permits).toBe(500) // CA permit fees
      expect(data.breakdown.fees.overhead).toBeGreaterThan(0)
      expect(data.breakdown.fees.total).toBe(data.breakdown.fees.permits + data.breakdown.fees.overhead)
    })
  })

  describe("POST /api/cost-estimation/calculate - Regional Variations", () => {
    it("should calculate correctly for US-TX region", async () => {
      const response = await fetch(`http://localhost:3000/api/cost-estimation/calculate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          materials: [
            {
              id: "lumber-2x4-8ft",
              name: "2x4 Lumber",
              quantity: 10,
              unit: "pieces",
            },
          ],
          labor: [
            {
              id: "labor-001",
              role: "carpenter",
              hours: 10,
              skillLevel: "journeyman",
            },
          ],
          regional: {
            region: "US-TX",
          },
        }),
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.breakdown.taxes.rate).toBe(0.0625) // TX tax rate
      expect(data.breakdown.fees.permits).toBe(350) // TX permit fees
      expect(data.metadata.region).toBe("US-TX")
    })

    it("should calculate correctly for US-NY region", async () => {
      const response = await fetch(`http://localhost:3000/api/cost-estimation/calculate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          materials: [
            {
              id: "lumber-2x4-8ft",
              name: "2x4 Lumber",
              quantity: 10,
              unit: "pieces",
            },
          ],
          labor: [
            {
              id: "labor-001",
              role: "carpenter",
              hours: 10,
              skillLevel: "journeyman",
            },
          ],
          regional: {
            region: "US-NY",
          },
        }),
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.breakdown.taxes.rate).toBe(0.08875) // NY tax rate
      expect(data.breakdown.fees.permits).toBe(750) // NY permit fees
      expect(data.breakdown.profit.rate).toBe(0.22) // NY profit margin
    })

    it("should calculate correctly for US-FL region", async () => {
      const response = await fetch(`http://localhost:3000/api/cost-estimation/calculate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          materials: [
            {
              id: "lumber-2x4-8ft",
              name: "2x4 Lumber",
              quantity: 10,
              unit: "pieces",
            },
          ],
          labor: [
            {
              id: "labor-001",
              role: "carpenter",
              hours: 10,
            },
          ],
          regional: {
            region: "US-FL",
          },
        }),
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.breakdown.taxes.rate).toBe(0.06) // FL tax rate
      expect(data.breakdown.fees.permits).toBe(400) // FL permit fees
    })

    it("should allow custom regional parameters", async () => {
      const response = await fetch(`http://localhost:3000/api/cost-estimation/calculate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          materials: [
            {
              id: "lumber-2x4-8ft",
              name: "2x4 Lumber",
              quantity: 10,
              unit: "pieces",
            },
          ],
          labor: [
            {
              id: "labor-001",
              role: "carpenter",
              hours: 10,
              hourlyRate: 50,
            },
          ],
          regional: {
            region: "CUSTOM-REGION",
            taxRate: 0.08,
            permitFees: 600,
            overheadRate: 0.16,
            profitMargin: 0.25,
          },
        }),
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.breakdown.taxes.rate).toBe(0.08)
      expect(data.breakdown.fees.permits).toBe(600)
      expect(data.breakdown.profit.rate).toBe(0.25)
    })
  })

  describe("POST /api/cost-estimation/calculate - Labor Rates", () => {
    it("should use different rates for different skill levels", async () => {
      const apprenticeResponse = await fetch(`http://localhost:3000/api/cost-estimation/calculate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          materials: [
            {
              id: "lumber-2x4-8ft",
              name: "2x4 Lumber",
              quantity: 1,
              unit: "pieces",
            },
          ],
          labor: [
            {
              id: "labor-001",
              role: "carpenter",
              hours: 10,
              skillLevel: "apprentice",
            },
          ],
          regional: {
            region: "US-CA",
          },
        }),
      })

      const masterResponse = await fetch(`http://localhost:3000/api/cost-estimation/calculate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          materials: [
            {
              id: "lumber-2x4-8ft",
              name: "2x4 Lumber",
              quantity: 1,
              unit: "pieces",
            },
          ],
          labor: [
            {
              id: "labor-001",
              role: "carpenter",
              hours: 10,
              skillLevel: "master",
            },
          ],
          regional: {
            region: "US-CA",
          },
        }),
      })

      const apprenticeData = await apprenticeResponse.json()
      const masterData = await masterResponse.json()

      expect(apprenticeData.breakdown.labor.items[0].hourlyRate).toBeLessThan(
        masterData.breakdown.labor.items[0].hourlyRate
      )
    })

    it("should support multiple labor roles", async () => {
      const response = await fetch(`http://localhost:3000/api/cost-estimation/calculate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          materials: [
            {
              id: "lumber-2x4-8ft",
              name: "2x4 Lumber",
              quantity: 10,
              unit: "pieces",
            },
          ],
          labor: [
            {
              id: "labor-001",
              role: "carpenter",
              hours: 20,
            },
            {
              id: "labor-002",
              role: "electrician",
              hours: 15,
            },
            {
              id: "labor-003",
              role: "plumber",
              hours: 10,
            },
          ],
          regional: {
            region: "US-CA",
          },
        }),
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.breakdown.labor.items).toHaveLength(3)
      expect(data.breakdown.labor.byRole).toHaveProperty("carpenter")
      expect(data.breakdown.labor.byRole).toHaveProperty("electrician")
      expect(data.breakdown.labor.byRole).toHaveProperty("plumber")
    })

    it("should allow custom hourly rates", async () => {
      const response = await fetch(`http://localhost:3000/api/cost-estimation/calculate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          materials: [
            {
              id: "lumber-2x4-8ft",
              name: "2x4 Lumber",
              quantity: 10,
              unit: "pieces",
            },
          ],
          labor: [
            {
              id: "labor-001",
              role: "carpenter",
              hours: 10,
              hourlyRate: 65.5,
            },
          ],
          regional: {
            region: "US-CA",
          },
        }),
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.breakdown.labor.items[0].hourlyRate).toBe(65.5)
      expect(data.breakdown.labor.items[0].regularPay).toBe(655)
    })
  })

  describe("POST /api/cost-estimation/calculate - Materials", () => {
    it("should support multiple material categories", async () => {
      const response = await fetch(`http://localhost:3000/api/cost-estimation/calculate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          materials: [
            {
              id: "lumber-2x4-8ft",
              name: "2x4 Lumber",
              quantity: 10,
              unit: "pieces",
              category: "lumber",
            },
            {
              id: "drywall-4x8-1/2",
              name: "Drywall",
              quantity: 5,
              unit: "sheets",
              category: "drywall",
            },
            {
              id: "concrete-80lb-bag",
              name: "Concrete Mix",
              quantity: 20,
              unit: "bags",
              category: "concrete",
            },
          ],
          labor: [
            {
              id: "labor-001",
              role: "carpenter",
              hours: 10,
            },
          ],
          regional: {
            region: "US-CA",
          },
        }),
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.breakdown.materials.byCategory).toHaveProperty("lumber")
      expect(data.breakdown.materials.byCategory).toHaveProperty("drywall")
      expect(data.breakdown.materials.byCategory).toHaveProperty("concrete")
    })

    it("should allow custom material prices", async () => {
      const response = await fetch(`http://localhost:3000/api/cost-estimation/calculate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          materials: [
            {
              id: "custom-material",
              name: "Custom Premium Lumber",
              quantity: 10,
              unit: "pieces",
              unitPrice: 25.5,
            },
          ],
          labor: [
            {
              id: "labor-001",
              role: "carpenter",
              hours: 10,
            },
          ],
          regional: {
            region: "US-CA",
          },
        }),
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.breakdown.materials.items[0].unitPrice).toBe(25.5)
      expect(data.breakdown.materials.items[0].lineTotal).toBe(255)
    })

    it("should handle large quantities correctly", async () => {
      const response = await fetch(`http://localhost:3000/api/cost-estimation/calculate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          materials: [
            {
              id: "lumber-2x4-8ft",
              name: "2x4 Lumber",
              quantity: 1000,
              unit: "pieces",
            },
          ],
          labor: [
            {
              id: "labor-001",
              role: "carpenter",
              hours: 100,
            },
          ],
          regional: {
            region: "US-CA",
          },
        }),
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.breakdown.materials.items[0].quantity).toBe(1000)
      expect(data.breakdown.materials.subtotal).toBeGreaterThan(5000)
    })
  })

  describe("POST /api/cost-estimation/calculate - Validation", () => {
    it("should require materials field", async () => {
      const response = await fetch(`http://localhost:3000/api/cost-estimation/calculate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          labor: [
            {
              id: "labor-001",
              role: "carpenter",
              hours: 10,
            },
          ],
          regional: {
            region: "US-CA",
          },
        }),
      })

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toContain("required")
    })

    it("should require labor field", async () => {
      const response = await fetch(`http://localhost:3000/api/cost-estimation/calculate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          materials: [
            {
              id: "lumber-2x4-8ft",
              name: "2x4 Lumber",
              quantity: 10,
              unit: "pieces",
            },
          ],
          regional: {
            region: "US-CA",
          },
        }),
      })

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toContain("required")
    })

    it("should require regional configuration", async () => {
      const response = await fetch(`http://localhost:3000/api/cost-estimation/calculate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          materials: [
            {
              id: "lumber-2x4-8ft",
              name: "2x4 Lumber",
              quantity: 10,
              unit: "pieces",
            },
          ],
          labor: [
            {
              id: "labor-001",
              role: "carpenter",
              hours: 10,
            },
          ],
        }),
      })

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toContain("required")
    })

    it("should validate material quantity is positive", async () => {
      const response = await fetch(`http://localhost:3000/api/cost-estimation/calculate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          materials: [
            {
              id: "lumber-2x4-8ft",
              name: "2x4 Lumber",
              quantity: -10,
              unit: "pieces",
            },
          ],
          labor: [
            {
              id: "labor-001",
              role: "carpenter",
              hours: 10,
            },
          ],
          regional: {
            region: "US-CA",
          },
        }),
      })

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toBe("Validation error")
      expect(data.details).toContain("positive quantity")
    })

    it("should validate labor hours are positive", async () => {
      const response = await fetch(`http://localhost:3000/api/cost-estimation/calculate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          materials: [
            {
              id: "lumber-2x4-8ft",
              name: "2x4 Lumber",
              quantity: 10,
              unit: "pieces",
            },
          ],
          labor: [
            {
              id: "labor-001",
              role: "carpenter",
              hours: -5,
            },
          ],
          regional: {
            region: "US-CA",
          },
        }),
      })

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toBe("Validation error")
      expect(data.details).toContain("positive hours")
    })

    it("should validate waste factor is between 0 and 1", async () => {
      const response = await fetch(`http://localhost:3000/api/cost-estimation/calculate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          materials: [
            {
              id: "lumber-2x4-8ft",
              name: "2x4 Lumber",
              quantity: 10,
              unit: "pieces",
              wasteFactor: 1.5,
            },
          ],
          labor: [
            {
              id: "labor-001",
              role: "carpenter",
              hours: 10,
            },
          ],
          regional: {
            region: "US-CA",
          },
        }),
      })

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toBe("Validation error")
      expect(data.details).toContain("waste factor")
    })

    it("should reject unknown material IDs without custom price", async () => {
      const response = await fetch(`http://localhost:3000/api/cost-estimation/calculate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          materials: [
            {
              id: "unknown-material-999",
              name: "Unknown Material",
              quantity: 10,
              unit: "pieces",
            },
          ],
          labor: [
            {
              id: "labor-001",
              role: "carpenter",
              hours: 10,
            },
          ],
          regional: {
            region: "US-CA",
          },
        }),
      })

      expect(response.status).toBe(422)

      const data = await response.json()
      expect(data.error).toBe("Calculation error")
      expect(data.details).toContain("No price found")
    })

    it("should reject unknown labor role without custom rate", async () => {
      const response = await fetch(`http://localhost:3000/api/cost-estimation/calculate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          materials: [
            {
              id: "lumber-2x4-8ft",
              name: "2x4 Lumber",
              quantity: 10,
              unit: "pieces",
            },
          ],
          labor: [
            {
              id: "labor-001",
              role: "unknown-role-999",
              hours: 10,
            },
          ],
          regional: {
            region: "US-CA",
          },
        }),
      })

      expect(response.status).toBe(422)

      const data = await response.json()
      expect(data.error).toBe("Calculation error")
      expect(data.details).toContain("No rates found")
    })
  })

  describe("POST /api/cost-estimation/calculate - Response Structure", () => {
    it("should return complete breakdown structure", async () => {
      const response = await fetch(`http://localhost:3000/api/cost-estimation/calculate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          materials: [
            {
              id: "lumber-2x4-8ft",
              name: "2x4 Lumber",
              quantity: 10,
              unit: "pieces",
            },
          ],
          labor: [
            {
              id: "labor-001",
              role: "carpenter",
              hours: 10,
            },
          ],
          regional: {
            region: "US-CA",
          },
        }),
      })

      const data = await response.json()

      // Check top-level structure
      expect(data).toHaveProperty("success")
      expect(data).toHaveProperty("estimateId")
      expect(data).toHaveProperty("breakdown")
      expect(data).toHaveProperty("summary")
      expect(data).toHaveProperty("metadata")

      // Check breakdown structure
      expect(data.breakdown).toHaveProperty("materials")
      expect(data.breakdown).toHaveProperty("labor")
      expect(data.breakdown).toHaveProperty("fees")
      expect(data.breakdown).toHaveProperty("taxes")
      expect(data.breakdown).toHaveProperty("profit")
      expect(data.breakdown).toHaveProperty("totals")
    })

    it("should include metadata with region information", async () => {
      const response = await fetch(`http://localhost:3000/api/cost-estimation/calculate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          materials: [
            {
              id: "lumber-2x4-8ft",
              name: "2x4 Lumber",
              quantity: 10,
              unit: "pieces",
            },
          ],
          labor: [
            {
              id: "labor-001",
              role: "carpenter",
              hours: 10,
            },
          ],
          regional: {
            region: "US-TX",
          },
        }),
      })

      const data = await response.json()
      expect(data.metadata.region).toBe("US-TX")
      expect(data.metadata.taxRate).toBeDefined()
      expect(data.metadata.profitMargin).toBeDefined()
      expect(data.metadata.overheadRate).toBeDefined()
      expect(data.metadata.materialItemCount).toBe(1)
      expect(data.metadata.laborItemCount).toBe(1)
    })

    it("should include summary with all totals", async () => {
      const response = await fetch(`http://localhost:3000/api/cost-estimation/calculate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          materials: [
            {
              id: "lumber-2x4-8ft",
              name: "2x4 Lumber",
              quantity: 10,
              unit: "pieces",
            },
          ],
          labor: [
            {
              id: "labor-001",
              role: "carpenter",
              hours: 10,
            },
          ],
          regional: {
            region: "US-CA",
          },
        }),
      })

      const data = await response.json()
      expect(data.summary).toHaveProperty("totalMaterials")
      expect(data.summary).toHaveProperty("totalLabor")
      expect(data.summary).toHaveProperty("totalFees")
      expect(data.summary).toHaveProperty("totalTaxes")
      expect(data.summary).toHaveProperty("totalProfit")
      expect(data.summary).toHaveProperty("grandTotal")
    })

    it("should generate unique estimate IDs", async () => {
      const response1 = await fetch(`http://localhost:3000/api/cost-estimation/calculate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          materials: [
            {
              id: "lumber-2x4-8ft",
              name: "2x4 Lumber",
              quantity: 10,
              unit: "pieces",
            },
          ],
          labor: [
            {
              id: "labor-001",
              role: "carpenter",
              hours: 10,
            },
          ],
          regional: {
            region: "US-CA",
          },
        }),
      })

      const response2 = await fetch(`http://localhost:3000/api/cost-estimation/calculate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          materials: [
            {
              id: "lumber-2x4-8ft",
              name: "2x4 Lumber",
              quantity: 10,
              unit: "pieces",
            },
          ],
          labor: [
            {
              id: "labor-001",
              role: "carpenter",
              hours: 10,
            },
          ],
          regional: {
            region: "US-CA",
          },
        }),
      })

      const data1 = await response1.json()
      const data2 = await response2.json()

      expect(data1.estimateId).not.toBe(data2.estimateId)
    })
  })

  describe("POST /api/cost-estimation/calculate - Authentication", () => {
    it("should require authentication", async () => {
      const response = await fetch(`http://localhost:3000/api/cost-estimation/calculate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          materials: [
            {
              id: "lumber-2x4-8ft",
              name: "2x4 Lumber",
              quantity: 10,
              unit: "pieces",
            },
          ],
          labor: [
            {
              id: "labor-001",
              role: "carpenter",
              hours: 10,
            },
          ],
          regional: {
            region: "US-CA",
          },
        }),
      })

      expect(response.status).not.toBe(200)
    })
  })
})
