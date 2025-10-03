import { NextResponse } from "next/server"

import { listCreditPacks } from "@/lib/data/credits"

export async function GET() {
  const packs = await listCreditPacks()
  return NextResponse.json({ packs })
}
