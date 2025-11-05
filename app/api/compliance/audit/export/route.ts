import { NextRequest, NextResponse } from "next/server"

import { requireSession } from "@/lib/auth/session"
import { listComplianceEvents } from "@/lib/data/compliance"

function asCsv(rows: Array<Record<string, string | number | null | undefined>>) {
  const headers = Object.keys(rows[0] ?? {})
  const lines = [headers.join(",")]
  for (const row of rows) {
    lines.push(
      headers
        .map((header) => {
          const value = row[header]
          if (value == null) return ""
          const str = String(value)
          return str.includes(",") ? `"${str.replace(/"/g, '""')}"` : str
        })
        .join(",")
    )
  }
  return lines.join("\n")
}

export async function GET(request: NextRequest) {
  const session = await requireSession({ request, enforceDevice: true, enforceGeo: true })
  const orgId = session.user?.orgId ?? "demo-org"
  const events = await listComplianceEvents(orgId, 200)
  if (!events.length) {
    return NextResponse.json({ error: "No audit events found" }, { status: 404 })
  }

  const csv = asCsv(
    events.map((event) => ({
      id: event.id,
      actor: event.actor,
      action: event.action,
      resource: event.resource ?? "",
      metadata: event.metadata ? JSON.stringify(event.metadata) : "",
      timestamp: event.createdAt,
    }))
  )

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=abodeai-audit.csv",
    },
  })
}
