/**
 * Cost Estimation API - Export Route
 *
 * Exports cost estimates to PDF, Excel, or CSV formats.
 * Supports different templates and returns file download.
 */

import { NextRequest, NextResponse } from "next/server"
import { requireSession } from "@/lib/auth/session"

// Types
interface EstimateData {
  estimateId: string
  projectName?: string
  clientName?: string
  breakdown: {
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
  metadata?: {
    region?: string
    taxRate?: string
    profitMargin?: string
    overheadRate?: string
    createdAt?: string
    validUntil?: string
  }
}

type ExportFormat = "pdf" | "excel" | "csv"
type TemplateType = "detailed" | "summary" | "client-facing" | "internal"

// CSV Generation
function generateCSV(data: EstimateData, template: TemplateType): string {
  const lines: string[] = []

  // Header
  lines.push(`Cost Estimate - ${data.estimateId}`)
  if (data.projectName) {
    lines.push(`Project: ${data.projectName}`)
  }
  if (data.clientName) {
    lines.push(`Client: ${data.clientName}`)
  }
  lines.push(`Generated: ${data.metadata?.createdAt || new Date().toISOString()}`)
  lines.push("") // Empty line

  if (template === "summary" || template === "client-facing") {
    // Summary format
    lines.push("Category,Amount")
    lines.push(`Materials,${data.breakdown.materials.total.toFixed(2)}`)
    lines.push(`Labor,${data.breakdown.labor.total.toFixed(2)}`)
    lines.push(`Fees & Overhead,${data.breakdown.fees.total.toFixed(2)}`)
    lines.push(`Taxes,${data.breakdown.taxes.amount.toFixed(2)}`)

    if (template === "internal") {
      lines.push(`Profit,${data.breakdown.profit.amount.toFixed(2)}`)
    }

    lines.push(`Total,${data.breakdown.totals.grandTotal.toFixed(2)}`)
  } else {
    // Detailed format
    lines.push("Materials")
    lines.push("Item,Quantity,Unit,Unit Price,Subtotal,Waste,Total")
    for (const item of data.breakdown.materials.items) {
      lines.push(
        `"${item.name}",${item.quantity},${item.unit},${item.unitPrice.toFixed(2)},${item.lineTotal.toFixed(2)},${item.waste.toFixed(2)},${item.totalWithWaste.toFixed(2)}`
      )
    }
    lines.push(`,,,,Subtotal:,${data.breakdown.materials.subtotal.toFixed(2)}`)
    lines.push(`,,,,Waste:,${data.breakdown.materials.waste.toFixed(2)}`)
    lines.push(`,,,,Total Materials:,${data.breakdown.materials.total.toFixed(2)}`)
    lines.push("") // Empty line

    lines.push("Labor")
    lines.push("Role,Hours,Hourly Rate,Regular Pay,Overtime Pay,Total")
    for (const item of data.breakdown.labor.items) {
      lines.push(
        `${item.role},${item.hours},${item.hourlyRate.toFixed(2)},${item.regularPay.toFixed(2)},${item.overtimePay.toFixed(2)},${item.total.toFixed(2)}`
      )
    }
    lines.push(`,,,,Subtotal:,${data.breakdown.labor.subtotal.toFixed(2)}`)
    lines.push(`,,,,Overtime:,${data.breakdown.labor.overtime.toFixed(2)}`)
    lines.push(`,,,,Total Labor:,${data.breakdown.labor.total.toFixed(2)}`)
    lines.push("") // Empty line

    lines.push("Fees & Costs")
    lines.push("Category,Amount")
    lines.push(`Permits,${data.breakdown.fees.permits.toFixed(2)}`)
    lines.push(`Overhead,${data.breakdown.fees.overhead.toFixed(2)}`)
    lines.push(`Total Fees,${data.breakdown.fees.total.toFixed(2)}`)
    lines.push("") // Empty line

    lines.push("Taxes")
    lines.push(`Tax Rate,${(data.breakdown.taxes.rate * 100).toFixed(2)}%`)
    lines.push(`Tax Amount,${data.breakdown.taxes.amount.toFixed(2)}`)
    lines.push("") // Empty line

    if (template !== "client-facing") {
      lines.push("Profit")
      lines.push(`Profit Margin,${(data.breakdown.profit.rate * 100).toFixed(2)}%`)
      lines.push(`Profit Amount,${data.breakdown.profit.amount.toFixed(2)}`)
      lines.push("") // Empty line
    }

    lines.push("Summary")
    lines.push("Category,Amount")
    lines.push(`Subtotal,${data.breakdown.totals.subtotal.toFixed(2)}`)
    lines.push(`Fees,${data.breakdown.totals.fees.toFixed(2)}`)
    lines.push(`Taxes,${data.breakdown.totals.taxes.toFixed(2)}`)

    if (template !== "client-facing") {
      lines.push(`Profit,${data.breakdown.totals.profit.toFixed(2)}`)
    }

    lines.push(`Grand Total,${data.breakdown.totals.grandTotal.toFixed(2)}`)
  }

  return lines.join("\n")
}

// Excel Generation (CSV format that Excel can open)
function generateExcel(data: EstimateData, template: TemplateType): string {
  // For now, Excel export is similar to CSV but with more formatting
  // In production, use a library like ExcelJS for proper .xlsx files
  const lines: string[] = []

  lines.push(`Cost Estimate,${data.estimateId}`)
  if (data.projectName) {
    lines.push(`Project Name,${data.projectName}`)
  }
  if (data.clientName) {
    lines.push(`Client Name,${data.clientName}`)
  }
  lines.push(`Generated,${data.metadata?.createdAt || new Date().toISOString()}`)
  if (data.metadata?.validUntil) {
    lines.push(`Valid Until,${data.metadata.validUntil}`)
  }
  lines.push("") // Empty line

  // Materials section
  lines.push("MATERIALS BREAKDOWN")
  lines.push("Item ID,Item Name,Quantity,Unit,Unit Price,Line Total,Waste,Total with Waste")
  for (const item of data.breakdown.materials.items) {
    lines.push(
      `${item.id},"${item.name}",${item.quantity},${item.unit},${item.unitPrice.toFixed(2)},${item.lineTotal.toFixed(2)},${item.waste.toFixed(2)},${item.totalWithWaste.toFixed(2)}`
    )
  }
  lines.push(`,,,,,,Materials Subtotal:,${data.breakdown.materials.subtotal.toFixed(2)}`)
  lines.push(`,,,,,,Total Waste:,${data.breakdown.materials.waste.toFixed(2)}`)
  lines.push(`,,,,,,Total Materials:,${data.breakdown.materials.total.toFixed(2)}`)
  lines.push("") // Empty line

  // Labor section
  lines.push("LABOR BREAKDOWN")
  lines.push("Labor ID,Role,Hours,Hourly Rate,Regular Pay,Overtime Pay,Total")
  for (const item of data.breakdown.labor.items) {
    lines.push(
      `${item.id},${item.role},${item.hours},${item.hourlyRate.toFixed(2)},${item.regularPay.toFixed(2)},${item.overtimePay.toFixed(2)},${item.total.toFixed(2)}`
    )
  }
  lines.push(`,,,,,Labor Subtotal:,${data.breakdown.labor.subtotal.toFixed(2)}`)
  lines.push(`,,,,,Overtime Total:,${data.breakdown.labor.overtime.toFixed(2)}`)
  lines.push(`,,,,,Total Labor:,${data.breakdown.labor.total.toFixed(2)}`)
  lines.push("") // Empty line

  // Fees and costs
  lines.push("FEES & COSTS")
  lines.push("Category,Amount")
  lines.push(`Permit Fees,${data.breakdown.fees.permits.toFixed(2)}`)
  lines.push(`Overhead,${data.breakdown.fees.overhead.toFixed(2)}`)
  lines.push(`Total Fees,${data.breakdown.fees.total.toFixed(2)}`)
  lines.push("") // Empty line

  // Taxes
  lines.push("TAXES")
  lines.push(`Tax Rate,${(data.breakdown.taxes.rate * 100).toFixed(3)}%`)
  lines.push(`Tax Amount,${data.breakdown.taxes.amount.toFixed(2)}`)
  lines.push("") // Empty line

  // Profit (hide for client-facing)
  if (template !== "client-facing") {
    lines.push("PROFIT")
    lines.push(`Profit Margin,${(data.breakdown.profit.rate * 100).toFixed(2)}%`)
    lines.push(`Profit Amount,${data.breakdown.profit.amount.toFixed(2)}`)
    lines.push("") // Empty line
  }

  // Summary
  lines.push("COST SUMMARY")
  lines.push("Category,Amount")
  lines.push(`Project Subtotal,${data.breakdown.totals.subtotal.toFixed(2)}`)
  lines.push(`Total Fees,${data.breakdown.totals.fees.toFixed(2)}`)
  lines.push(`Total Taxes,${data.breakdown.totals.taxes.toFixed(2)}`)

  if (template !== "client-facing") {
    lines.push(`Total Profit,${data.breakdown.totals.profit.toFixed(2)}`)
  }

  lines.push(`GRAND TOTAL,${data.breakdown.totals.grandTotal.toFixed(2)}`)

  // Metadata
  if (data.metadata) {
    lines.push("") // Empty line
    lines.push("ESTIMATE DETAILS")
    if (data.metadata.region) lines.push(`Region,${data.metadata.region}`)
    if (data.metadata.taxRate) lines.push(`Tax Rate,${data.metadata.taxRate}`)
    if (data.metadata.profitMargin && template !== "client-facing") {
      lines.push(`Profit Margin,${data.metadata.profitMargin}`)
    }
    if (data.metadata.overheadRate) lines.push(`Overhead Rate,${data.metadata.overheadRate}`)
  }

  return lines.join("\n")
}

// PDF Generation (simplified HTML that can be converted to PDF)
function generatePDF(data: EstimateData, template: TemplateType): string {
  // In production, use a library like PDFKit or Puppeteer
  // For now, generate HTML that can be converted to PDF
  const hideProfit = template === "client-facing"

  let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Cost Estimate - ${data.estimateId}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
    h1 { color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px; }
    h2 { color: #1e40af; margin-top: 30px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th { background-color: #2563eb; color: white; padding: 12px; text-align: left; }
    td { padding: 10px; border-bottom: 1px solid #ddd; }
    tr:hover { background-color: #f3f4f6; }
    .summary-table td { font-weight: bold; }
    .total-row { background-color: #dbeafe; font-weight: bold; font-size: 1.1em; }
    .metadata { background-color: #f9fafb; padding: 15px; border-radius: 5px; margin-top: 20px; }
    .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
    .amount { text-align: right; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>Cost Estimate</h1>
      <p><strong>Estimate ID:</strong> ${data.estimateId}</p>
      ${data.projectName ? `<p><strong>Project:</strong> ${data.projectName}</p>` : ""}
      ${data.clientName ? `<p><strong>Client:</strong> ${data.clientName}</p>` : ""}
    </div>
    <div>
      <p><strong>Generated:</strong> ${data.metadata?.createdAt || new Date().toISOString()}</p>
      ${data.metadata?.validUntil ? `<p><strong>Valid Until:</strong> ${data.metadata.validUntil}</p>` : ""}
    </div>
  </div>`

  if (template === "summary") {
    // Summary view
    html += `
  <h2>Cost Summary</h2>
  <table class="summary-table">
    <tr><td>Materials</td><td class="amount">$${data.breakdown.materials.total.toFixed(2)}</td></tr>
    <tr><td>Labor</td><td class="amount">$${data.breakdown.labor.total.toFixed(2)}</td></tr>
    <tr><td>Fees & Overhead</td><td class="amount">$${data.breakdown.fees.total.toFixed(2)}</td></tr>
    <tr><td>Taxes</td><td class="amount">$${data.breakdown.taxes.amount.toFixed(2)}</td></tr>
    ${!hideProfit ? `<tr><td>Profit</td><td class="amount">$${data.breakdown.profit.amount.toFixed(2)}</td></tr>` : ""}
    <tr class="total-row"><td>GRAND TOTAL</td><td class="amount">$${data.breakdown.totals.grandTotal.toFixed(2)}</td></tr>
  </table>`
  } else {
    // Detailed view
    html += `
  <h2>Materials Breakdown</h2>
  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th>Quantity</th>
        <th>Unit</th>
        <th class="amount">Unit Price</th>
        <th class="amount">Subtotal</th>
        <th class="amount">Waste</th>
        <th class="amount">Total</th>
      </tr>
    </thead>
    <tbody>`

    for (const item of data.breakdown.materials.items) {
      html += `
      <tr>
        <td>${item.name}</td>
        <td>${item.quantity}</td>
        <td>${item.unit}</td>
        <td class="amount">$${item.unitPrice.toFixed(2)}</td>
        <td class="amount">$${item.lineTotal.toFixed(2)}</td>
        <td class="amount">$${item.waste.toFixed(2)}</td>
        <td class="amount">$${item.totalWithWaste.toFixed(2)}</td>
      </tr>`
    }

    html += `
      <tr class="total-row">
        <td colspan="6">Total Materials</td>
        <td class="amount">$${data.breakdown.materials.total.toFixed(2)}</td>
      </tr>
    </tbody>
  </table>

  <h2>Labor Breakdown</h2>
  <table>
    <thead>
      <tr>
        <th>Role</th>
        <th>Hours</th>
        <th class="amount">Hourly Rate</th>
        <th class="amount">Regular Pay</th>
        <th class="amount">Overtime Pay</th>
        <th class="amount">Total</th>
      </tr>
    </thead>
    <tbody>`

    for (const item of data.breakdown.labor.items) {
      html += `
      <tr>
        <td>${item.role}</td>
        <td>${item.hours}</td>
        <td class="amount">$${item.hourlyRate.toFixed(2)}</td>
        <td class="amount">$${item.regularPay.toFixed(2)}</td>
        <td class="amount">$${item.overtimePay.toFixed(2)}</td>
        <td class="amount">$${item.total.toFixed(2)}</td>
      </tr>`
    }

    html += `
      <tr class="total-row">
        <td colspan="5">Total Labor</td>
        <td class="amount">$${data.breakdown.labor.total.toFixed(2)}</td>
      </tr>
    </tbody>
  </table>

  <h2>Fees & Taxes</h2>
  <table>
    <tbody>
      <tr><td>Permit Fees</td><td class="amount">$${data.breakdown.fees.permits.toFixed(2)}</td></tr>
      <tr><td>Overhead (${data.metadata?.overheadRate || ""})</td><td class="amount">$${data.breakdown.fees.overhead.toFixed(2)}</td></tr>
      <tr><td>Taxes (${data.metadata?.taxRate || ""})</td><td class="amount">$${data.breakdown.taxes.amount.toFixed(2)}</td></tr>
      ${!hideProfit ? `<tr><td>Profit Margin (${data.metadata?.profitMargin || ""})</td><td class="amount">$${data.breakdown.profit.amount.toFixed(2)}</td></tr>` : ""}
    </tbody>
  </table>

  <h2>Final Summary</h2>
  <table class="summary-table">
    <tbody>
      <tr><td>Project Subtotal</td><td class="amount">$${data.breakdown.totals.subtotal.toFixed(2)}</td></tr>
      <tr><td>Total Fees</td><td class="amount">$${data.breakdown.totals.fees.toFixed(2)}</td></tr>
      <tr><td>Total Taxes</td><td class="amount">$${data.breakdown.totals.taxes.toFixed(2)}</td></tr>
      ${!hideProfit ? `<tr><td>Total Profit</td><td class="amount">$${data.breakdown.totals.profit.toFixed(2)}</td></tr>` : ""}
      <tr class="total-row"><td>GRAND TOTAL</td><td class="amount">$${data.breakdown.totals.grandTotal.toFixed(2)}</td></tr>
    </tbody>
  </table>`
  }

  if (data.metadata && (template === "detailed" || template === "internal")) {
    html += `
  <div class="metadata">
    <h3>Estimate Details</h3>
    ${data.metadata.region ? `<p><strong>Region:</strong> ${data.metadata.region}</p>` : ""}
    ${data.metadata.taxRate ? `<p><strong>Tax Rate:</strong> ${data.metadata.taxRate}</p>` : ""}
    ${data.metadata.profitMargin && !hideProfit ? `<p><strong>Profit Margin:</strong> ${data.metadata.profitMargin}</p>` : ""}
    ${data.metadata.overheadRate ? `<p><strong>Overhead Rate:</strong> ${data.metadata.overheadRate}</p>` : ""}
  </div>`
  }

  html += `
</body>
</html>`

  return html
}

function validateExportRequest(body: any): {
  format: ExportFormat
  template: TemplateType
  data: EstimateData
} {
  // Validate format
  if (!body.format || !["pdf", "excel", "csv"].includes(body.format)) {
    throw new Error("Invalid or missing format. Must be one of: pdf, excel, csv")
  }

  // Validate template
  const template = body.template || "detailed"
  if (!["detailed", "summary", "client-facing", "internal"].includes(template)) {
    throw new Error("Invalid template. Must be one of: detailed, summary, client-facing, internal")
  }

  // Validate estimate data
  if (!body.data || typeof body.data !== "object") {
    throw new Error("Missing or invalid estimate data")
  }

  if (!body.data.estimateId) {
    throw new Error("Estimate ID is required")
  }

  if (!body.data.breakdown || typeof body.data.breakdown !== "object") {
    throw new Error("Cost breakdown data is required")
  }

  // Basic validation of breakdown structure
  const requiredBreakdownFields = ["materials", "labor", "fees", "taxes", "profit", "totals"]
  for (const field of requiredBreakdownFields) {
    if (!body.data.breakdown[field]) {
      throw new Error(`Missing breakdown field: ${field}`)
    }
  }

  return {
    format: body.format as ExportFormat,
    template: template as TemplateType,
    data: body.data as EstimateData,
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await requireSession({ request, enforceDevice: true, enforceGeo: true })
    const orgId = session.user?.orgId ?? "demo-org"

    // Parse request body
    const body = await request.json().catch(() => ({}))

    // Validate request
    let format: ExportFormat
    let template: TemplateType
    let data: EstimateData

    try {
      const validated = validateExportRequest(body)
      format = validated.format
      template = validated.template
      data = validated.data
    } catch (validationError) {
      return NextResponse.json(
        {
          error: "Validation error",
          details: validationError instanceof Error ? validationError.message : "Unknown validation error",
        },
        { status: 400 }
      )
    }

    // Generate file content based on format
    let fileContent: string
    let contentType: string
    let fileExtension: string
    let filename: string

    try {
      switch (format) {
        case "csv":
          fileContent = generateCSV(data, template)
          contentType = "text/csv"
          fileExtension = "csv"
          break

        case "excel":
          fileContent = generateExcel(data, template)
          contentType = "application/vnd.ms-excel"
          fileExtension = "csv" // In production, this would be .xlsx
          break

        case "pdf":
          fileContent = generatePDF(data, template)
          contentType = "text/html" // In production, this would be application/pdf
          fileExtension = "html" // In production, this would be pdf
          break

        default:
          throw new Error("Unsupported format")
      }

      // Generate filename
      const timestamp = new Date().toISOString().split("T")[0]
      const projectSlug = data.projectName
        ? data.projectName.toLowerCase().replace(/[^a-z0-9]+/g, "-")
        : "estimate"
      filename = `${projectSlug}-${data.estimateId}-${timestamp}.${fileExtension}`
    } catch (generationError) {
      return NextResponse.json(
        {
          error: "File generation error",
          details: generationError instanceof Error ? generationError.message : "Unknown error",
        },
        { status: 500 }
      )
    }

    // Return file as download
    return new NextResponse(fileContent, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "X-Estimate-ID": data.estimateId,
        "X-Export-Format": format,
        "X-Template-Type": template,
        "X-Org-ID": orgId,
      },
    })
  } catch (error) {
    console.error("Export error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
