import type { ManufacturingBom } from "@/lib/data/manufacturing"

function formatNumber(value: number, decimals = 2) {
  return Number.isFinite(value) ? value.toFixed(decimals) : "0"
}

export function generateDxfForBom(bom: ManufacturingBom): string {
  const header = ["0", "SECTION", "2", "HEADER", "0", "ENDSEC", "0", "SECTION", "2", "ENTITIES"]
  const lines: string[] = []
  let cursorY = 0
  const spacing = 6

  bom.items.forEach((item) => {
    const text = `${item.name} x${item.quantity} (${item.unit})`
    lines.push(
      "0",
      "TEXT",
      "8",
      "BOM",
      "10",
      "0",
      "20",
      cursorY.toString(),
      "30",
      "0",
      "40",
      "3",
      "1",
      text
    )

    const width = 20
    const height = 4
    const left = 0
    const right = left + width
    const top = cursorY - 1
    const bottom = top - height

    lines.push(
      "0",
      "LWPOLYLINE",
      "8",
      "BOM",
      "90",
      "5",
      "70",
      "1",
      "10",
      left.toString(),
      "20",
      top.toString(),
      "10",
      right.toString(),
      "20",
      top.toString(),
      "10",
      right.toString(),
      "20",
      bottom.toString(),
      "10",
      left.toString(),
      "20",
      bottom.toString(),
      "10",
      left.toString(),
      "20",
      top.toString()
    )

    cursorY -= spacing
  })

  const footer = ["0", "ENDSEC", "0", "EOF"]
  return [...header, ...lines, ...footer].join("\n")
}

export function generateCutListCsv(bom: ManufacturingBom): string {
  const header = ["Item", "SKU", "Quantity", "Unit", "Material", "Cost", "Dimensions"]
  const rows = bom.items.map((item) => {
    const dimensions = item.dimensions ? JSON.stringify(item.dimensions) : ""
    return [
      wrapCsv(item.name),
      wrapCsv(item.sku),
      String(item.quantity ?? 0),
      wrapCsv(item.unit ?? "unit"),
      wrapCsv(item.material ?? "-"),
      item.cost != null ? formatNumber(item.cost) : "",
      wrapCsv(dimensions),
    ].join(",")
  })

  return [header.join(","), ...rows].join("\n")
}

function wrapCsv(value: string | null | undefined): string {
  if (!value) return ""
  if (value.includes(",") || value.includes("\"")) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}
