import { NextResponse } from "next/server"

import { listAgents } from "@/lib/data/agents"

export async function GET() {
  const agents = listAgents()
  return NextResponse.json({ agents })
}
