import { NextRequest, NextResponse } from "next/server"

import { requireSession } from "@/lib/auth/session"
import { searchStudioAssets, getFallbackAssets } from "@/lib/services/vector-search"

export async function GET(request: NextRequest) {
  const session = await requireSession({ request, enforceDevice: true, enforceGeo: true })
  const orgId = session.user?.orgId ?? "demo-org"
  const search = request.nextUrl.searchParams.get("q") ?? undefined
  const limitParam = request.nextUrl.searchParams.get("limit")
  const limit = limitParam ? Math.min(parseInt(limitParam, 10) || 24, 60) : 24

  const embeddingParam = request.nextUrl.searchParams.get("embedding")
  const embedding = embeddingParam ? embeddingParam.split(",").map((value) => Number(value)).filter((value) => !Number.isNaN(value)) : undefined

  const { assets, categories } = await searchStudioAssets({
    query: search,
    limit,
    orgId,
    embedding,
  })

  const response = {
    assets,
    categories: categories.length ? categories : Array.from(new Set(getFallbackAssets().map((item) => item.category))),
  }

  return NextResponse.json(response)
}
