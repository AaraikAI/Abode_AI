import { NextRequest, NextResponse } from 'next/server'
import { searchModels, getFeaturedModels, getCategories } from '@/lib/data/model-library'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    // Check if requesting featured models
    if (searchParams.get('featured') === 'true') {
      const limit = parseInt(searchParams.get('limit') || '12')
      const models = await getFeaturedModels(limit)
      return NextResponse.json({ models, total: models.length })
    }

    // Check if requesting categories
    if (searchParams.get('categories') === 'true') {
      const categories = await getCategories()
      return NextResponse.json({ categories })
    }

    // Regular search
    const params = {
      query: searchParams.get('q') || undefined,
      category: searchParams.get('category') || undefined,
      subcategory: searchParams.get('subcategory') || undefined,
      tags: searchParams.get('tags')?.split(',') || undefined,
      style: searchParams.get('style')?.split(',') || undefined,
      license: searchParams.get('license') as 'free' | 'pro' | 'enterprise' | undefined,
      minRating: searchParams.get('minRating') ? parseFloat(searchParams.get('minRating')!) : undefined,
      limit: parseInt(searchParams.get('limit') || '20'),
      offset: parseInt(searchParams.get('offset') || '0'),
      sortBy: (searchParams.get('sortBy') as any) || 'relevance',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc'
    }

    const result = await searchModels(params)

    return NextResponse.json(result)

  } catch (error) {
    console.error('Model search error:', error)
    return NextResponse.json(
      { error: 'Failed to search models' },
      { status: 500 }
    )
  }
}
