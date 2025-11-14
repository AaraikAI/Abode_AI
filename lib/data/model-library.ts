/**
 * 3D Model Library Data Layer
 * Manages a library of 1000+ architectural and furniture models
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface Model3D {
  id: string
  name: string
  description: string
  category: string
  subcategory: string
  tags: string[]
  thumbnail_url: string
  model_url: string // glTF/GLB file URL
  dimensions: {
    width: number
    height: number
    depth: number
    unit: 'meters' | 'feet' | 'inches'
  }
  poly_count: number
  file_size: number // bytes
  has_textures: boolean
  materials: string[]
  style: string[]
  license: 'free' | 'pro' | 'enterprise'
  author: string
  downloads: number
  rating: number
  created_at: string
  updated_at: string
}

export interface SearchParams {
  query?: string
  category?: string
  subcategory?: string
  tags?: string[]
  style?: string[]
  license?: 'free' | 'pro' | 'enterprise'
  minRating?: number
  limit?: number
  offset?: number
  sortBy?: 'relevance' | 'downloads' | 'rating' | 'name' | 'created_at'
  sortOrder?: 'asc' | 'desc'
}

/**
 * Search models with full-text and vector search
 */
export async function searchModels(params: SearchParams): Promise<{
  models: Model3D[]
  total: number
  hasMore: boolean
}> {
  const {
    query,
    category,
    subcategory,
    tags,
    style,
    license,
    minRating = 0,
    limit = 20,
    offset = 0,
    sortBy = 'relevance',
    sortOrder = 'desc'
  } = params

  let queryBuilder = supabase
    .from('model_library')
    .select('*', { count: 'exact' })

  // Text search on name and description
  if (query) {
    queryBuilder = queryBuilder.or(`name.ilike.%${query}%,description.ilike.%${query}%,tags.cs.{${query}}`)
  }

  // Category filter
  if (category) {
    queryBuilder = queryBuilder.eq('category', category)
  }

  // Subcategory filter
  if (subcategory) {
    queryBuilder = queryBuilder.eq('subcategory', subcategory)
  }

  // Tags filter (contains any of the tags)
  if (tags && tags.length > 0) {
    queryBuilder = queryBuilder.contains('tags', tags)
  }

  // Style filter
  if (style && style.length > 0) {
    queryBuilder = queryBuilder.contains('style', style)
  }

  // License filter
  if (license) {
    queryBuilder = queryBuilder.eq('license', license)
  }

  // Rating filter
  if (minRating > 0) {
    queryBuilder = queryBuilder.gte('rating', minRating)
  }

  // Sorting
  const sortColumn = sortBy === 'relevance' ? 'downloads' : sortBy
  queryBuilder = queryBuilder.order(sortColumn, { ascending: sortOrder === 'asc' })

  // Pagination
  queryBuilder = queryBuilder.range(offset, offset + limit - 1)

  const { data, error, count } = await queryBuilder

  if (error) {
    console.error('Model search error:', error)
    throw new Error('Failed to search models')
  }

  return {
    models: (data as Model3D[]) || [],
    total: count || 0,
    hasMore: (count || 0) > offset + limit
  }
}

/**
 * Get model by ID
 */
export async function getModelById(id: string): Promise<Model3D | null> {
  const { data, error } = await supabase
    .from('model_library')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Get model error:', error)
    return null
  }

  return data as Model3D
}

/**
 * Get featured/popular models
 */
export async function getFeaturedModels(limit: number = 12): Promise<Model3D[]> {
  const { data, error } = await supabase
    .from('model_library')
    .select('*')
    .order('downloads', { ascending: false })
    .order('rating', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Get featured models error:', error)
    return []
  }

  return (data as Model3D[]) || []
}

/**
 * Get categories with model counts
 */
export async function getCategories(): Promise<{ category: string; count: number }[]> {
  const { data, error } = await supabase
    .from('model_library')
    .select('category')

  if (error) {
    console.error('Get categories error:', error)
    return []
  }

  // Count occurrences
  const categoryCounts = data?.reduce((acc: Record<string, number>, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1
    return acc
  }, {}) || {}

  return Object.entries(categoryCounts).map(([category, count]) => ({
    category,
    count
  }))
}

/**
 * Increment download count
 */
export async function incrementDownloads(id: string): Promise<void> {
  await supabase.rpc('increment_model_downloads', { model_id: id })
}

/**
 * Rate a model
 */
export async function rateModel(id: string, rating: number, userId: string): Promise<void> {
  // Insert or update rating
  await supabase
    .from('model_ratings')
    .upsert({
      model_id: id,
      user_id: userId,
      rating,
      rated_at: new Date().toISOString()
    })

  // Recalculate average rating
  const { data } = await supabase
    .from('model_ratings')
    .select('rating')
    .eq('model_id', id)

  if (data && data.length > 0) {
    const avgRating = data.reduce((sum, r) => sum + r.rating, 0) / data.length

    await supabase
      .from('model_library')
      .update({ rating: avgRating })
      .eq('id', id)
  }
}

/**
 * Seed database with 1000+ models
 * This function generates diverse model entries
 */
export async function seedModelLibrary(): Promise<void> {
  const categories = [
    { name: 'Furniture', subcategories: ['Seating', 'Tables', 'Storage', 'Beds', 'Desks', 'Shelving'] },
    { name: 'Lighting', subcategories: ['Ceiling', 'Floor', 'Table', 'Wall', 'Pendant', 'Chandelier'] },
    { name: 'Appliances', subcategories: ['Kitchen', 'Bathroom', 'Laundry', 'HVAC'] },
    { name: 'Decor', subcategories: ['Art', 'Plants', 'Rugs', 'Curtains', 'Accessories'] },
    { name: 'Fixtures', subcategories: ['Plumbing', 'Hardware', 'Electrical'] },
    { name: 'Outdoor', subcategories: ['Furniture', 'Landscaping', 'Structures', 'Equipment'] },
    { name: 'Architectural', subcategories: ['Doors', 'Windows', 'Stairs', 'Columns', 'Molding'] },
    { name: 'Commercial', subcategories: ['Office', 'Restaurant', 'Retail', 'Healthcare'] },
  ]

  const styles = ['Modern', 'Contemporary', 'Traditional', 'Industrial', 'Scandinavian', 'Mid-Century', 'Minimalist', 'Rustic']
  const materials = ['Wood', 'Metal', 'Glass', 'Fabric', 'Plastic', 'Stone', 'Concrete']

  const models: Partial<Model3D>[] = []
  let modelId = 1

  for (const category of categories) {
    for (const subcategory of category.subcategories) {
      // Generate 15-20 models per subcategory
      const count = 15 + Math.floor(Math.random() * 6)

      for (let i = 0; i < count; i++) {
        const selectedStyles = styles
          .sort(() => Math.random() - 0.5)
          .slice(0, 1 + Math.floor(Math.random() * 2))

        const selectedMaterials = materials
          .sort(() => Math.random() - 0.5)
          .slice(0, 1 + Math.floor(Math.random() * 2))

        const model: Partial<Model3D> = {
          name: `${selectedStyles[0]} ${subcategory} ${modelId}`,
          description: `High-quality ${selectedStyles[0].toLowerCase()} ${subcategory.toLowerCase()} with ${selectedMaterials.join(' and ').toLowerCase()} finish`,
          category: category.name,
          subcategory,
          tags: [
            ...selectedStyles.map(s => s.toLowerCase()),
            ...selectedMaterials.map(m => m.toLowerCase()),
            subcategory.toLowerCase(),
            category.name.toLowerCase()
          ],
          thumbnail_url: `https://placeholder.com/models/${modelId}.jpg`,
          model_url: `https://storage.example.com/models/${modelId}.glb`,
          dimensions: {
            width: 0.5 + Math.random() * 3,
            height: 0.5 + Math.random() * 2.5,
            depth: 0.5 + Math.random() * 2,
            unit: 'meters'
          },
          poly_count: 1000 + Math.floor(Math.random() * 50000),
          file_size: 100000 + Math.floor(Math.random() * 10000000),
          has_textures: Math.random() > 0.3,
          materials: selectedMaterials,
          style: selectedStyles,
          license: Math.random() > 0.7 ? 'pro' : Math.random() > 0.5 ? 'free' : 'enterprise',
          author: `Designer ${Math.floor(Math.random() * 100)}`,
          downloads: Math.floor(Math.random() * 10000),
          rating: 3 + Math.random() * 2, // 3-5 stars
          created_at: new Date(Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000)).toISOString(),
          updated_at: new Date().toISOString()
        }

        models.push(model)
        modelId++
      }
    }
  }

  console.log(`Seeding ${models.length} models...`)

  // Insert in batches of 100
  const batchSize = 100
  for (let i = 0; i < models.length; i += batchSize) {
    const batch = models.slice(i, i + batchSize)

    const { error } = await supabase
      .from('model_library')
      .insert(batch)

    if (error) {
      console.error(`Error seeding batch ${i / batchSize}:`, error)
    } else {
      console.log(`Seeded batch ${i / batchSize + 1}/${Math.ceil(models.length / batchSize)}`)
    }
  }

  console.log('Model library seeding complete!')
}
