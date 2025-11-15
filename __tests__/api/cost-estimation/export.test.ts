/**
 * Integration Tests for Cost Estimation Export API
 *
 * Tests export functionality for PDF, Excel, and CSV formats with different templates.
 * Total: 20 comprehensive tests
 */

import { describe, it, expect, beforeAll, afterAll } from "@jest/globals"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:54321"
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "test-key"
const supabase = createClient(supabaseUrl, supabaseKey)

describe("Cost Estimation Export API", () => {
  let testUserId: string
  let testOrgId: string
  let authToken: string

  // Sample estimate data for testing
  const sampleEstimateData = {
    estimateId: "EST-1234567890-ABCDEFG",
    projectName: "Modern Office Renovation",
    clientName: "Acme Corporation",
    breakdown: {
      materials: {
        subtotal: 10000,
        waste: 1000,
        total: 11000,
        byCategory: {
          lumber: 5000,
          drywall: 3000,
          electrical: 3000,
        },
        items: [
          {
            id: "lumber-2x4-8ft",
            name: "2x4 Lumber 8ft",
            quantity: 100,
            unit: "pieces",
            unitPrice: 8.5,
            lineTotal: 850,
            waste: 85,
            totalWithWaste: 935,
          },
          {
            id: "drywall-4x8-1/2",
            name: "Drywall 4x8 1/2 inch",
            quantity: 50,
            unit: "sheets",
            unitPrice: 15.5,
            lineTotal: 775,
            waste: 77.5,
            totalWithWaste: 852.5,
          },
        ],
      },
      labor: {
        subtotal: 8000,
        overtime: 500,
        total: 8500,
        byRole: {
          carpenter: 4500,
          electrician: 4000,
        },
        items: [
          {
            id: "labor-001",
            role: "carpenter",
            hours: 100,
            hourlyRate: 45,
            regularPay: 4500,
            overtimePay: 0,
            total: 4500,
          },
          {
            id: "labor-002",
            role: "electrician",
            hours: 70,
            hourlyRate: 55,
            regularPay: 3850,
            overtimePay: 150,
            total: 4000,
          },
        ],
      },
      fees: {
        permits: 500,
        overhead: 2925,
        total: 3425,
      },
      taxes: {
        rate: 0.0725,
        amount: 1662.06,
      },
      profit: {
        rate: 0.2,
        amount: 4917.41,
      },
      totals: {
        subtotal: 19500,
        fees: 3425,
        taxes: 1662.06,
        profit: 4917.41,
        grandTotal: 29504.47,
      },
    },
    metadata: {
      region: "US-CA",
      taxRate: "7.25%",
      profitMargin: "20.00%",
      overheadRate: "15.00%",
      createdAt: "2025-11-15T12:00:00Z",
      validUntil: "2025-12-15T12:00:00Z",
    },
  }

  beforeAll(async () => {
    // Create test user
    const {
      data: { user },
      error,
    } = await supabase.auth.admin.createUser({
      email: "cost-export-test@example.com",
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
      email: "cost-export-test@example.com",
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
        name: "Test Export Org",
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

  describe("POST /api/cost-estimation/export - CSV Export", () => {
    it("should export estimate to CSV format", async () => {
      const response = await fetch(`http://localhost:3000/api/cost-estimation/export`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          format: "csv",
          template: "detailed",
          data: sampleEstimateData,
        }),
      })

      expect(response.status).toBe(200)
      expect(response.headers.get("Content-Type")).toBe("text/csv")
      expect(response.headers.get("Content-Disposition")).toContain("attachment")
      expect(response.headers.get("Content-Disposition")).toContain(".csv")

      const content = await response.text()
      expect(content).toContain("Cost Estimate")
      expect(content).toContain(sampleEstimateData.estimateId)
      expect(content).toContain("Materials")
      expect(content).toContain("Labor")
    })

    it("should export CSV with summary template", async () => {
      const response = await fetch(`http://localhost:3000/api/cost-estimation/export`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          format: "csv",
          template: "summary",
          data: sampleEstimateData,
        }),
      })

      expect(response.status).toBe(200)

      const content = await response.text()
      expect(content).toContain("Category,Amount")
      expect(content).toContain("Materials")
      expect(content).toContain("Labor")
      expect(content).toContain("Total")
    })

    it("should export CSV with client-facing template (hide profit)", async () => {
      const response = await fetch(`http://localhost:3000/api/cost-estimation/export`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          format: "csv",
          template: "client-facing",
          data: sampleEstimateData,
        }),
      })

      expect(response.status).toBe(200)

      const content = await response.text()
      expect(content).not.toContain("Profit")
      expect(content).toContain("Materials")
      expect(content).toContain("Labor")
    })

    it("should include project name in CSV", async () => {
      const response = await fetch(`http://localhost:3000/api/cost-estimation/export`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          format: "csv",
          template: "detailed",
          data: sampleEstimateData,
        }),
      })

      expect(response.status).toBe(200)

      const content = await response.text()
      expect(content).toContain(sampleEstimateData.projectName)
      expect(content).toContain(sampleEstimateData.clientName)
    })
  })

  describe("POST /api/cost-estimation/export - Excel Export", () => {
    it("should export estimate to Excel format", async () => {
      const response = await fetch(`http://localhost:3000/api/cost-estimation/export`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          format: "excel",
          template: "detailed",
          data: sampleEstimateData,
        }),
      })

      expect(response.status).toBe(200)
      expect(response.headers.get("Content-Type")).toBe("application/vnd.ms-excel")
      expect(response.headers.get("Content-Disposition")).toContain("attachment")

      const content = await response.text()
      expect(content).toContain(sampleEstimateData.estimateId)
      expect(content).toContain("MATERIALS BREAKDOWN")
      expect(content).toContain("LABOR BREAKDOWN")
    })

    it("should include all breakdown sections in Excel", async () => {
      const response = await fetch(`http://localhost:3000/api/cost-estimation/export`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          format: "excel",
          template: "detailed",
          data: sampleEstimateData,
        }),
      })

      expect(response.status).toBe(200)

      const content = await response.text()
      expect(content).toContain("MATERIALS BREAKDOWN")
      expect(content).toContain("LABOR BREAKDOWN")
      expect(content).toContain("FEES & COSTS")
      expect(content).toContain("TAXES")
      expect(content).toContain("PROFIT")
      expect(content).toContain("COST SUMMARY")
    })

    it("should hide profit in client-facing Excel template", async () => {
      const response = await fetch(`http://localhost:3000/api/cost-estimation/export`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          format: "excel",
          template: "client-facing",
          data: sampleEstimateData,
        }),
      })

      expect(response.status).toBe(200)

      const content = await response.text()
      expect(content).not.toContain("PROFIT")
      expect(content).toContain("MATERIALS BREAKDOWN")
      expect(content).toContain("LABOR BREAKDOWN")
    })

    it("should include metadata in Excel export", async () => {
      const response = await fetch(`http://localhost:3000/api/cost-estimation/export`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          format: "excel",
          template: "detailed",
          data: sampleEstimateData,
        }),
      })

      expect(response.status).toBe(200)

      const content = await response.text()
      expect(content).toContain("ESTIMATE DETAILS")
      expect(content).toContain(sampleEstimateData.metadata.region)
    })
  })

  describe("POST /api/cost-estimation/export - PDF Export", () => {
    it("should export estimate to PDF format (as HTML)", async () => {
      const response = await fetch(`http://localhost:3000/api/cost-estimation/export`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          format: "pdf",
          template: "detailed",
          data: sampleEstimateData,
        }),
      })

      expect(response.status).toBe(200)
      expect(response.headers.get("Content-Type")).toBe("text/html")

      const content = await response.text()
      expect(content).toContain("<!DOCTYPE html>")
      expect(content).toContain("<h1>Cost Estimate</h1>")
      expect(content).toContain(sampleEstimateData.estimateId)
    })

    it("should generate PDF with proper styling", async () => {
      const response = await fetch(`http://localhost:3000/api/cost-estimation/export`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          format: "pdf",
          template: "detailed",
          data: sampleEstimateData,
        }),
      })

      expect(response.status).toBe(200)

      const content = await response.text()
      expect(content).toContain("<style>")
      expect(content).toContain("font-family")
      expect(content).toContain("table")
    })

    it("should show summary in PDF summary template", async () => {
      const response = await fetch(`http://localhost:3000/api/cost-estimation/export`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          format: "pdf",
          template: "summary",
          data: sampleEstimateData,
        }),
      })

      expect(response.status).toBe(200)

      const content = await response.text()
      expect(content).toContain("Cost Summary")
      expect(content).toContain("Materials")
      expect(content).toContain("Labor")
      expect(content).toContain("GRAND TOTAL")
    })

    it("should hide profit in client-facing PDF", async () => {
      const response = await fetch(`http://localhost:3000/api/cost-estimation/export`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          format: "pdf",
          template: "client-facing",
          data: sampleEstimateData,
        }),
      })

      expect(response.status).toBe(200)

      const content = await response.text()
      expect(content).not.toContain(">Profit<")
      expect(content).toContain("Materials Breakdown")
    })

    it("should include project and client information in PDF", async () => {
      const response = await fetch(`http://localhost:3000/api/cost-estimation/export`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          format: "pdf",
          template: "detailed",
          data: sampleEstimateData,
        }),
      })

      expect(response.status).toBe(200)

      const content = await response.text()
      expect(content).toContain(sampleEstimateData.projectName)
      expect(content).toContain(sampleEstimateData.clientName)
    })
  })

  describe("POST /api/cost-estimation/export - Validation", () => {
    it("should require format field", async () => {
      const response = await fetch(`http://localhost:3000/api/cost-estimation/export`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          template: "detailed",
          data: sampleEstimateData,
        }),
      })

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toBe("Validation error")
      expect(data.details).toContain("format")
    })

    it("should validate format is one of pdf, excel, csv", async () => {
      const response = await fetch(`http://localhost:3000/api/cost-estimation/export`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          format: "invalid-format",
          template: "detailed",
          data: sampleEstimateData,
        }),
      })

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toBe("Validation error")
      expect(data.details).toContain("Invalid or missing format")
    })

    it("should validate template type", async () => {
      const response = await fetch(`http://localhost:3000/api/cost-estimation/export`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          format: "csv",
          template: "invalid-template",
          data: sampleEstimateData,
        }),
      })

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toBe("Validation error")
      expect(data.details).toContain("Invalid template")
    })

    it("should require estimate data", async () => {
      const response = await fetch(`http://localhost:3000/api/cost-estimation/export`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          format: "csv",
          template: "detailed",
        }),
      })

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toBe("Validation error")
      expect(data.details).toContain("estimate data")
    })

    it("should require estimate ID in data", async () => {
      const response = await fetch(`http://localhost:3000/api/cost-estimation/export`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          format: "csv",
          template: "detailed",
          data: {
            breakdown: sampleEstimateData.breakdown,
          },
        }),
      })

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toBe("Validation error")
      expect(data.details).toContain("Estimate ID")
    })

    it("should require breakdown in data", async () => {
      const response = await fetch(`http://localhost:3000/api/cost-estimation/export`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          format: "csv",
          template: "detailed",
          data: {
            estimateId: "EST-12345",
          },
        }),
      })

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toBe("Validation error")
      expect(data.details).toContain("breakdown")
    })
  })

  describe("POST /api/cost-estimation/export - Response Headers", () => {
    it("should set correct filename with project name", async () => {
      const response = await fetch(`http://localhost:3000/api/cost-estimation/export`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          format: "csv",
          template: "detailed",
          data: sampleEstimateData,
        }),
      })

      expect(response.status).toBe(200)

      const contentDisposition = response.headers.get("Content-Disposition")
      expect(contentDisposition).toContain("modern-office-renovation")
      expect(contentDisposition).toContain(sampleEstimateData.estimateId)
    })

    it("should include estimate ID in response headers", async () => {
      const response = await fetch(`http://localhost:3000/api/cost-estimation/export`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          format: "pdf",
          template: "detailed",
          data: sampleEstimateData,
        }),
      })

      expect(response.status).toBe(200)
      expect(response.headers.get("X-Estimate-ID")).toBe(sampleEstimateData.estimateId)
      expect(response.headers.get("X-Export-Format")).toBe("pdf")
      expect(response.headers.get("X-Template-Type")).toBe("detailed")
    })

    it("should include org ID in response headers", async () => {
      const response = await fetch(`http://localhost:3000/api/cost-estimation/export`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          format: "csv",
          template: "detailed",
          data: sampleEstimateData,
        }),
      })

      expect(response.status).toBe(200)
      expect(response.headers.get("X-Org-ID")).toBeDefined()
    })
  })

  describe("POST /api/cost-estimation/export - Authentication", () => {
    it("should require authentication", async () => {
      const response = await fetch(`http://localhost:3000/api/cost-estimation/export`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          format: "csv",
          template: "detailed",
          data: sampleEstimateData,
        }),
      })

      expect(response.status).not.toBe(200)
    })
  })
})
