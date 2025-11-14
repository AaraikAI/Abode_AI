/**
 * Marketplace Assets API
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { MarketplaceService } from '@/lib/services/marketplace'

const marketplaceService = new MarketplaceService()

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body

    if (action === 'submit') {
      const asset = await marketplaceService.submitAsset(body.asset, user.id)
      return NextResponse.json({ success: true, asset })
    } else if (action === 'purchase') {
      const purchase = await marketplaceService.purchaseAsset(
        body.assetId,
        user.id,
        body.paymentMethodId
      )
      return NextResponse.json({ success: true, purchase })
    } else if (action === 'review') {
      const review = await marketplaceService.submitReview(
        body.assetId,
        user.id,
        body.userName,
        body.rating,
        body.comment,
        body.title
      )
      return NextResponse.json({ success: true, review })
    } else if (action === 'like') {
      const result = await marketplaceService.toggleLike(body.assetId, user.id)
      return NextResponse.json({ success: true, ...result })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    console.error('Marketplace API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const searchParams = request.nextUrl.searchParams

    const result = await marketplaceService.searchAssets({
      query: searchParams.get('query') || undefined,
      type: searchParams.get('type') as any || undefined,
      category: searchParams.get('category') || undefined,
      tags: searchParams.get('tags')?.split(',') || undefined,
      sortBy: searchParams.get('sortBy') as any || 'popular',
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '24')
    })

    return NextResponse.json({ success: true, ...result })
  } catch (error: any) {
    console.error('Marketplace GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
