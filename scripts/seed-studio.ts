import { config as loadEnv } from "dotenv"
import { randomUUID } from "crypto"

import { createClient } from "@supabase/supabase-js"

loadEnv({ path: ".env.local", override: false })

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Supabase configuration missing from .env.local")
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

async function reloadSchema() {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/reload_schema`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY ?? "",
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    } as HeadersInit,
    body: JSON.stringify({}),
  })

  if (!response.ok) {
    const text = await response.text()
    console.warn(`Schema reload request responded with ${response.status}: ${text}`)
  }
}

async function seedSceneSnapshots() {
  const { count } = await supabase
    .from("studio_scene_snapshots")
    .select("id", { count: "exact", head: true })
    .eq("org_id", "demo-org")

  if ((count ?? 0) > 0) {
    return
  }

  const sampleScene = [
    {
      id: randomUUID(),
      assetId: "asset-floor",
      name: "Studio Floor",
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [20, 1, 20],
      color: "#f1f5f9",
    },
    {
      id: randomUUID(),
      assetId: "asset-desk",
      name: "Work Desk",
      position: [0.5, 0.75, -0.5],
      rotation: [0, Math.PI / 8, 0],
      scale: [1.6, 0.8, 0.75],
      color: "#d6a372",
    },
    {
      id: randomUUID(),
      assetId: "asset-chair",
      name: "Desk Chair",
      position: [0.4, 0.5, -1.2],
      rotation: [0, -Math.PI / 10, 0],
      scale: [0.6, 0.6, 1],
      color: "#334155",
    },
  ]

  const { error } = await supabase.from("studio_scene_snapshots").insert({
    org_id: "demo-org",
    user_id: null,
    scene_json: sampleScene,
    label: "Baseline layout",
  })

  if (error) {
    throw new Error(`Failed to seed studio snapshot: ${error.message}`)
  }
}

async function seedSustainabilityLogs() {
  const { count } = await supabase
    .from("sustainability_logs")
    .select("id", { count: "exact", head: true })
    .eq("org_id", "demo-org")

  if ((count ?? 0) > 0) {
    return
  }

  const now = new Date()
  const entries = Array.from({ length: 3 }).map((_, index) => ({
    org_id: "demo-org",
    user_id: null,
    render_id: `render-${index + 1}`,
    co2_kg: 0.12 + index * 0.03,
    energy_kwh: 0.09 + index * 0.02,
    duration_seconds: 30 + index * 5,
    created_at: new Date(now.getTime() - index * 60_000).toISOString(),
  }))

  const { error } = await supabase.from("sustainability_logs").insert(entries)
  if (error) {
    throw new Error(`Failed to seed sustainability logs: ${error.message}`)
  }
}

async function seedCreditPacks() {
  const { count } = await supabase
    .from("credit_packs")
    .select("id", { count: "exact", head: true })

  if ((count ?? 0) > 0) {
    return
  }

  const packs = [
    {
      id: randomUUID(),
      name: "Starter",
      description: "Kick off with 250 render credits.",
      credits: 250,
      price_cents: 9900,
      featured: false,
    },
    {
      id: randomUUID(),
      name: "Studio",
      description: "Best value for design teams (750 credits).",
      credits: 750,
      price_cents: 23900,
      featured: true,
    },
    {
      id: randomUUID(),
      name: "Enterprise",
      description: "2,000 credits plus priority GPU lanes.",
      credits: 2000,
      price_cents: 59900,
      featured: false,
    },
  ]

  const { error } = await supabase.from("credit_packs").insert(packs)
  if (error) {
    throw new Error(`Failed to seed credit packs: ${error.message}`)
  }
}

async function seedManufacturingData() {
  const { count } = await supabase
    .from("manufacturing_boms")
    .select("id", { count: "exact", head: true })
    .eq("org_id", "demo-org")

  if ((count ?? 0) > 0) {
    return
  }

  const bomId = randomUUID()
  const { error: bomError } = await supabase.from("manufacturing_boms").insert({
    id: bomId,
    org_id: "demo-org",
    status: "generated",
    total_cost: 785,
    metadata: { source: "seed", itemCount: 3 },
  })

  if (bomError) {
    throw new Error(`Failed to seed BOM: ${bomError.message}`)
  }

  const { error: itemError } = await supabase.from("manufacturing_bom_items").insert([
    {
      id: randomUUID(),
      bom_id: bomId,
      name: "Desk frame",
      sku: "DSK-482",
      quantity: 4,
      unit: "unit",
      material: "oak",
      cost: 320,
    },
    {
      id: randomUUID(),
      bom_id: bomId,
      name: "Task chair",
      sku: "CHR-214",
      quantity: 4,
      unit: "unit",
      material: "fabric",
      cost: 180,
    },
    {
      id: randomUUID(),
      bom_id: bomId,
      name: "Indoor planter",
      sku: "PLN-013",
      quantity: 2,
      unit: "unit",
      material: "composite",
      cost: 95,
    },
  ])

  if (itemError) {
    throw new Error(`Failed to seed BOM items: ${itemError.message}`)
  }
}

async function main() {
  await reloadSchema()
  await seedSceneSnapshots()
  await seedSustainabilityLogs()
  await seedCreditPacks()
  await seedManufacturingData()
  console.log("Studio seed complete")
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
