/**
 * Cost Estimation API - Calculate Route
 *
 * Calculates detailed cost estimates from materials and labor inputs.
 * Includes regional pricing, taxes, profit margins, and comprehensive breakdown.
 */

import { NextRequest, NextResponse } from "next/server"
import { requireSession } from "@/lib/auth/session"

// Types
interface Material {
  id: string
  name: string
  quantity: number
  unit: string
  unitPrice?: number // Optional if using material database
  category?: string
  supplier?: string
  wasteFactor?: number // Percentage as decimal (e.g., 0.1 for 10%)
}

interface LaborItem {
  id: string
  role: string // e.g., "carpenter", "electrician", "plumber"
  hours: number
  hourlyRate?: number // Optional if using regional rates
  skillLevel?: "apprentice" | "journeyman" | "master"
  overtimeHours?: number
}

interface RegionalConfig {
  region: string // e.g., "US-CA", "US-TX", "EU-DE"
  taxRate: number // Percentage as decimal
  permitFees?: number
  overheadRate?: number // Percentage as decimal
  profitMargin?: number // Percentage as decimal
}

interface CostBreakdown {
  materials: {
    subtotal: number
    waste: number
    total: number
    byCategory: Record<string, number>
    items: Array<{
      id: string
      name: string
      quantity: number
      unit: string
      unitPrice: number
      lineTotal: number
      waste: number
      totalWithWaste: number
    }>
  }
  labor: {
    subtotal: number
    overtime: number
    total: number
    byRole: Record<string, number>
    items: Array<{
      id: string
      role: string
      hours: number
      hourlyRate: number
      regularPay: number
      overtimePay: number
      total: number
    }>
  }
  fees: {
    permits: number
    overhead: number
    total: number
  }
  taxes: {
    rate: number
    amount: number
  }
  profit: {
    rate: number
    amount: number
  }
  totals: {
    subtotal: number
    fees: number
    taxes: number
    profit: number
    grandTotal: number
  }
}

// Regional pricing database (mock - in production this would be from a database)
const REGIONAL_RATES = {
  "US-CA": {
    laborRates: {
      carpenter: { apprentice: 25, journeyman: 45, master: 75 },
      electrician: { apprentice: 30, journeyman: 55, master: 90 },
      plumber: { apprentice: 28, journeyman: 50, master: 85 },
      mason: { apprentice: 26, journeyman: 48, master: 80 },
      painter: { apprentice: 22, journeyman: 38, master: 65 },
      hvac: { apprentice: 32, journeyman: 58, master: 95 },
      general: { apprentice: 20, journeyman: 35, master: 60 },
    },
    taxRate: 0.0725, // 7.25%
    permitFees: 500,
    overheadRate: 0.15,
    profitMargin: 0.20,
  },
  "US-TX": {
    laborRates: {
      carpenter: { apprentice: 22, journeyman: 40, master: 65 },
      electrician: { apprentice: 26, journeyman: 48, master: 78 },
      plumber: { apprentice: 24, journeyman: 44, master: 72 },
      mason: { apprentice: 23, journeyman: 42, master: 70 },
      painter: { apprentice: 19, journeyman: 33, master: 55 },
      hvac: { apprentice: 28, journeyman: 52, master: 85 },
      general: { apprentice: 18, journeyman: 30, master: 50 },
    },
    taxRate: 0.0625, // 6.25%
    permitFees: 350,
    overheadRate: 0.12,
    profitMargin: 0.18,
  },
  "US-NY": {
    laborRates: {
      carpenter: { apprentice: 28, journeyman: 52, master: 85 },
      electrician: { apprentice: 35, journeyman: 65, master: 105 },
      plumber: { apprentice: 32, journeyman: 58, master: 95 },
      mason: { apprentice: 30, journeyman: 55, master: 90 },
      painter: { apprentice: 25, journeyman: 45, master: 75 },
      hvac: { apprentice: 38, journeyman: 68, master: 110 },
      general: { apprentice: 24, journeyman: 42, master: 70 },
    },
    taxRate: 0.08875, // 8.875%
    permitFees: 750,
    overheadRate: 0.18,
    profitMargin: 0.22,
  },
  "US-FL": {
    laborRates: {
      carpenter: { apprentice: 21, journeyman: 38, master: 62 },
      electrician: { apprentice: 25, journeyman: 46, master: 75 },
      plumber: { apprentice: 23, journeyman: 42, master: 68 },
      mason: { apprentice: 22, journeyman: 40, master: 65 },
      painter: { apprentice: 18, journeyman: 32, master: 52 },
      hvac: { apprentice: 27, journeyman: 50, master: 82 },
      general: { apprentice: 17, journeyman: 28, master: 48 },
    },
    taxRate: 0.06, // 6%
    permitFees: 400,
    overheadRate: 0.13,
    profitMargin: 0.19,
  },
}

// Material pricing database (mock)
const MATERIAL_PRICES = {
  "lumber-2x4-8ft": 8.50,
  "lumber-2x6-8ft": 12.75,
  "plywood-4x8-3/4": 52.00,
  "drywall-4x8-1/2": 15.50,
  "concrete-80lb-bag": 5.25,
  "rebar-#4-20ft": 18.50,
  "wire-12-2-romex-250ft": 125.00,
  "pipe-pvc-4in-10ft": 24.50,
  "paint-premium-gallon": 45.00,
  "shingles-bundle": 32.00,
  "insulation-r30-roll": 68.00,
  "tile-ceramic-sqft": 3.50,
}

function validateMaterials(materials: any[]): Material[] {
  if (!Array.isArray(materials)) {
    throw new Error("Materials must be an array")
  }

  return materials.map((item, index) => {
    if (!item.id || typeof item.id !== "string") {
      throw new Error(`Material at index ${index} must have a valid id`)
    }
    if (!item.name || typeof item.name !== "string") {
      throw new Error(`Material at index ${index} must have a valid name`)
    }
    if (typeof item.quantity !== "number" || item.quantity <= 0) {
      throw new Error(`Material "${item.name}" must have a positive quantity`)
    }
    if (!item.unit || typeof item.unit !== "string") {
      throw new Error(`Material "${item.name}" must have a valid unit`)
    }
    if (item.unitPrice !== undefined && (typeof item.unitPrice !== "number" || item.unitPrice < 0)) {
      throw new Error(`Material "${item.name}" has invalid unit price`)
    }
    if (item.wasteFactor !== undefined && (typeof item.wasteFactor !== "number" || item.wasteFactor < 0 || item.wasteFactor > 1)) {
      throw new Error(`Material "${item.name}" has invalid waste factor (must be between 0 and 1)`)
    }

    return {
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: item.unitPrice,
      category: item.category || "general",
      supplier: item.supplier,
      wasteFactor: item.wasteFactor || 0.1, // Default 10% waste
    }
  })
}

function validateLabor(labor: any[]): LaborItem[] {
  if (!Array.isArray(labor)) {
    throw new Error("Labor must be an array")
  }

  return labor.map((item, index) => {
    if (!item.id || typeof item.id !== "string") {
      throw new Error(`Labor item at index ${index} must have a valid id`)
    }
    if (!item.role || typeof item.role !== "string") {
      throw new Error(`Labor item at index ${index} must have a valid role`)
    }
    if (typeof item.hours !== "number" || item.hours <= 0) {
      throw new Error(`Labor item "${item.role}" must have positive hours`)
    }
    if (item.hourlyRate !== undefined && (typeof item.hourlyRate !== "number" || item.hourlyRate < 0)) {
      throw new Error(`Labor item "${item.role}" has invalid hourly rate`)
    }
    if (item.skillLevel && !["apprentice", "journeyman", "master"].includes(item.skillLevel)) {
      throw new Error(`Labor item "${item.role}" has invalid skill level`)
    }
    if (item.overtimeHours !== undefined && (typeof item.overtimeHours !== "number" || item.overtimeHours < 0)) {
      throw new Error(`Labor item "${item.role}" has invalid overtime hours`)
    }

    return {
      id: item.id,
      role: item.role,
      hours: item.hours,
      hourlyRate: item.hourlyRate,
      skillLevel: item.skillLevel || "journeyman",
      overtimeHours: item.overtimeHours || 0,
    }
  })
}

function validateRegionalConfig(config: any): RegionalConfig {
  if (!config || typeof config !== "object") {
    throw new Error("Regional configuration is required")
  }
  if (!config.region || typeof config.region !== "string") {
    throw new Error("Region is required")
  }

  // Check if region is supported
  const regionData = REGIONAL_RATES[config.region as keyof typeof REGIONAL_RATES]
  if (!regionData && config.taxRate === undefined) {
    throw new Error(`Unsupported region: ${config.region}. Please provide tax rate.`)
  }

  return {
    region: config.region,
    taxRate: config.taxRate ?? regionData?.taxRate ?? 0,
    permitFees: config.permitFees ?? regionData?.permitFees ?? 0,
    overheadRate: config.overheadRate ?? regionData?.overheadRate ?? 0.15,
    profitMargin: config.profitMargin ?? regionData?.profitMargin ?? 0.20,
  }
}

function getMaterialPrice(material: Material): number {
  // If unit price is provided, use it
  if (material.unitPrice !== undefined) {
    return material.unitPrice
  }

  // Otherwise, look up in database
  const price = MATERIAL_PRICES[material.id as keyof typeof MATERIAL_PRICES]
  if (price === undefined) {
    throw new Error(`No price found for material: ${material.name} (${material.id})`)
  }

  return price
}

function getLaborRate(labor: LaborItem, region: string): number {
  // If hourly rate is provided, use it
  if (labor.hourlyRate !== undefined) {
    return labor.hourlyRate
  }

  // Otherwise, look up regional rate
  const regionData = REGIONAL_RATES[region as keyof typeof REGIONAL_RATES]
  if (!regionData) {
    throw new Error(`No labor rates found for region: ${region}`)
  }

  const roleRates = regionData.laborRates[labor.role as keyof typeof regionData.laborRates]
  if (!roleRates) {
    throw new Error(`No rates found for role: ${labor.role} in region ${region}`)
  }

  const skillLevel = labor.skillLevel || "journeyman"
  return roleRates[skillLevel]
}

function calculateMaterialsCost(materials: Material[]): CostBreakdown["materials"] {
  let subtotal = 0
  let totalWaste = 0
  const byCategory: Record<string, number> = {}
  const items: CostBreakdown["materials"]["items"] = []

  for (const material of materials) {
    const unitPrice = getMaterialPrice(material)
    const lineTotal = material.quantity * unitPrice
    const waste = lineTotal * material.wasteFactor
    const totalWithWaste = lineTotal + waste

    subtotal += lineTotal
    totalWaste += waste

    const category = material.category || "general"
    byCategory[category] = (byCategory[category] || 0) + totalWithWaste

    items.push({
      id: material.id,
      name: material.name,
      quantity: material.quantity,
      unit: material.unit,
      unitPrice,
      lineTotal,
      waste,
      totalWithWaste,
    })
  }

  return {
    subtotal,
    waste: totalWaste,
    total: subtotal + totalWaste,
    byCategory,
    items,
  }
}

function calculateLaborCost(labor: LaborItem[], region: string): CostBreakdown["labor"] {
  let subtotal = 0
  let totalOvertime = 0
  const byRole: Record<string, number> = {}
  const items: CostBreakdown["labor"]["items"] = []

  for (const item of labor) {
    const hourlyRate = getLaborRate(item, region)
    const regularPay = item.hours * hourlyRate
    const overtimePay = (item.overtimeHours || 0) * hourlyRate * 1.5 // 1.5x for overtime
    const total = regularPay + overtimePay

    subtotal += regularPay
    totalOvertime += overtimePay

    byRole[item.role] = (byRole[item.role] || 0) + total

    items.push({
      id: item.id,
      role: item.role,
      hours: item.hours,
      hourlyRate,
      regularPay,
      overtimePay,
      total,
    })
  }

  return {
    subtotal,
    overtime: totalOvertime,
    total: subtotal + totalOvertime,
    byRole,
    items,
  }
}

function calculateCostBreakdown(
  materials: Material[],
  labor: LaborItem[],
  regional: RegionalConfig
): CostBreakdown {
  // Calculate materials
  const materialsCost = calculateMaterialsCost(materials)

  // Calculate labor
  const laborCost = calculateLaborCost(labor, regional.region)

  // Calculate project subtotal (materials + labor)
  const projectSubtotal = materialsCost.total + laborCost.total

  // Calculate fees
  const overheadAmount = projectSubtotal * regional.overheadRate
  const fees = {
    permits: regional.permitFees,
    overhead: overheadAmount,
    total: regional.permitFees + overheadAmount,
  }

  // Calculate subtotal before tax and profit
  const subtotalBeforeTaxAndProfit = projectSubtotal + fees.total

  // Calculate taxes (on subtotal + fees)
  const taxes = {
    rate: regional.taxRate,
    amount: subtotalBeforeTaxAndProfit * regional.taxRate,
  }

  // Calculate profit (on subtotal + fees + taxes)
  const profit = {
    rate: regional.profitMargin,
    amount: (subtotalBeforeTaxAndProfit + taxes.amount) * regional.profitMargin,
  }

  // Calculate grand total
  const grandTotal = subtotalBeforeTaxAndProfit + taxes.amount + profit.amount

  return {
    materials: materialsCost,
    labor: laborCost,
    fees,
    taxes,
    profit,
    totals: {
      subtotal: projectSubtotal,
      fees: fees.total,
      taxes: taxes.amount,
      profit: profit.amount,
      grandTotal,
    },
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await requireSession({ request, enforceDevice: true, enforceGeo: true })
    const orgId = session.user?.orgId ?? "demo-org"
    const userId = session.user?.id ?? "demo-user"

    // Parse request body
    const body = await request.json().catch(() => ({}))

    // Validate required fields
    if (!body.materials || !body.labor || !body.regional) {
      return NextResponse.json(
        {
          error: "Missing required fields: materials, labor, and regional configuration are required",
        },
        { status: 400 }
      )
    }

    // Validate and parse inputs
    let materials: Material[]
    let labor: LaborItem[]
    let regional: RegionalConfig

    try {
      materials = validateMaterials(body.materials)
      labor = validateLabor(body.labor)
      regional = validateRegionalConfig(body.regional)
    } catch (validationError) {
      return NextResponse.json(
        {
          error: "Validation error",
          details: validationError instanceof Error ? validationError.message : "Unknown validation error",
        },
        { status: 400 }
      )
    }

    // Calculate cost breakdown
    let breakdown: CostBreakdown
    try {
      breakdown = calculateCostBreakdown(materials, labor, regional)
    } catch (calcError) {
      return NextResponse.json(
        {
          error: "Calculation error",
          details: calcError instanceof Error ? calcError.message : "Unknown calculation error",
        },
        { status: 422 }
      )
    }

    // Generate estimate ID
    const estimateId = `EST-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`

    // Return detailed breakdown
    return NextResponse.json(
      {
        success: true,
        estimateId,
        orgId,
        userId,
        timestamp: new Date().toISOString(),
        breakdown,
        summary: {
          totalMaterials: breakdown.materials.total,
          totalLabor: breakdown.labor.total,
          totalFees: breakdown.fees.total,
          totalTaxes: breakdown.taxes.amount,
          totalProfit: breakdown.profit.amount,
          grandTotal: breakdown.totals.grandTotal,
        },
        metadata: {
          region: regional.region,
          taxRate: `${(regional.taxRate * 100).toFixed(2)}%`,
          profitMargin: `${(regional.profitMargin * 100).toFixed(2)}%`,
          overheadRate: `${(regional.overheadRate * 100).toFixed(2)}%`,
          materialItemCount: materials.length,
          laborItemCount: labor.length,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Cost estimation error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
