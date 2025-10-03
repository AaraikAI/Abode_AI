import { randomUUID } from "crypto"

import { db } from "@/lib/db/sqlite"

export interface Agent {
  id: string
  name: string
  description: string
  version: string
  tags: string[]
  status: "active" | "draft" | "deprecated"
  author: string
  rating?: number
  createdAt: string
  updatedAt: string
}

const selectAgentsStmt = db.prepare(
  "SELECT id, name, description, version, tags, status, author, rating, created_at as createdAt, updated_at as updatedAt FROM agents ORDER BY name"
)

const selectAgentByIdStmt = db.prepare(
  "SELECT id, name, description, version, tags, status, author, rating, created_at as createdAt, updated_at as updatedAt FROM agents WHERE id = ?"
)

const insertAgentStmt = db.prepare(
  "INSERT INTO agents (id, name, description, version, tags, status, author, rating) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
)

function ensureSeedData() {
  const existing = selectAgentsStmt.get()
  if (existing) {
    return
  }
  const agents: Array<Omit<Agent, "id" | "createdAt" | "updatedAt">> = [
    {
      name: "Site Parser",
      description: "Converts PDF/DXF plans to GeoJSON, flags Vastu and zoning issues",
      version: "1.6.0",
      tags: ["computer-vision", "compliance"],
      status: "active",
      author: "Abode AI",
      rating: 4.8,
    },
    {
      name: "Concept Variation",
      description: "Generates digital twin variations optimised for sustainability",
      version: "2.1.3",
      tags: ["stable-diffusion", "digital-twin"],
      status: "active",
      author: "Abode AI",
      rating: 4.6,
    },
    {
      name: "Manufacturing Export",
      description: "Produces BOMs, cutlists, and JEGA payloads from approved scenes",
      version: "1.2.4",
      tags: ["bom", "erp"],
      status: "active",
      author: "Abode AI",
      rating: 4.9,
    },
  ]

  const insertMany = db.transaction(() => {
    agents.forEach((agent) => {
      insertAgentStmt.run(
        randomUUID(),
        agent.name,
        agent.description,
        agent.version,
        agent.tags.join(","),
        agent.status,
        agent.author,
        agent.rating ?? null
      )
    })
  })

  insertMany()
}

ensureSeedData()

export function listAgents(): Agent[] {
  return selectAgentsStmt.all().map((row: any) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    version: row.version,
    tags: row.tags ? String(row.tags).split(",").filter(Boolean) : [],
    status: row.status,
    author: row.author,
    rating: row.rating ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }))
}

export function getAgentById(id: string): Agent | null {
  const row = selectAgentByIdStmt.get(id) as any | undefined
  if (!row) return null
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    version: row.version,
    tags: row.tags ? String(row.tags).split(",").filter(Boolean) : [],
    status: row.status,
    author: row.author,
    rating: row.rating ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}
