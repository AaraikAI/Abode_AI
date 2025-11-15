/**
 * Model Library API - Search Tests
 * Tests search, featured models, and categories functionality
 */

import { GET } from '@/app/api/models/search/route'
import { searchModels, getFeaturedModels, getCategories } from '@/lib/data/model-library'
import { NextRequest } from 'next/server'

// Mock dependencies
jest.mock('@/lib/data/model-library')

describe('Model Search API Route', () => {
  const mockModels = [
    {
      id: 'model-1',
      name: 'Modern Chair',
      description: 'A stylish modern chair',
      category: 'Furniture',
      subcategory: 'Seating',
      tags: ['modern', 'chair'],
      thumbnail_url: 'https://example.com/thumb1.jpg',
      model_url: 'https://example.com/model1.glb',
      dimensions: { width: 0.5, height: 1.0, depth: 0.5, unit: 'meters' as const },
      poly_count: 5000,
      file_size: 2000000,
      has_textures: true,
      materials: ['Wood', 'Fabric'],
      style: ['Modern'],
      license: 'free' as const,
      author: 'Designer 1',
      downloads: 100,
      rating: 4.5,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: 'model-2',
      name: 'Contemporary Table',
      description: 'A contemporary dining table',
      category: 'Furniture',
      subcategory: 'Tables',
      tags: ['contemporary', 'table'],
      thumbnail_url: 'https://example.com/thumb2.jpg',
      model_url: 'https://example.com/model2.glb',
      dimensions: { width: 2.0, height: 0.75, depth: 1.0, unit: 'meters' as const },
      poly_count: 8000,
      file_size: 3000000,
      has_textures: true,
      materials: ['Wood', 'Metal'],
      style: ['Contemporary'],
      license: 'pro' as const,
      author: 'Designer 2',
      downloads: 200,
      rating: 4.8,
      created_at: '2024-01-02T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z'
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/models/search - Basic Search', () => {
    test('should search models without query', async () => {
      (searchModels as jest.Mock).mockResolvedValue({
        models: mockModels,
        total: 2,
        hasMore: false
      })

      const request = new NextRequest('http://localhost:3000/api/models/search')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.models).toEqual(mockModels)
      expect(data.total).toBe(2)
      expect(searchModels).toHaveBeenCalledWith(expect.objectContaining({
        query: undefined,
        limit: 20,
        offset: 0
      }))
    })

    test('should search models with query', async () => {
      (searchModels as jest.Mock).mockResolvedValue({
        models: [mockModels[0]],
        total: 1,
        hasMore: false
      })

      const request = new NextRequest('http://localhost:3000/api/models/search?q=chair')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.models).toHaveLength(1)
      expect(searchModels).toHaveBeenCalledWith(expect.objectContaining({
        query: 'chair'
      }))
    })

    test('should handle empty search results', async () => {
      (searchModels as jest.Mock).mockResolvedValue({
        models: [],
        total: 0,
        hasMore: false
      })

      const request = new NextRequest('http://localhost:3000/api/models/search?q=nonexistent')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.models).toEqual([])
      expect(data.total).toBe(0)
    })

    test('should search with category filter', async () => {
      (searchModels as jest.Mock).mockResolvedValue({
        models: mockModels,
        total: 2,
        hasMore: false
      })

      const request = new NextRequest('http://localhost:3000/api/models/search?category=Furniture')
      const response = await GET(request)

      expect(searchModels).toHaveBeenCalledWith(expect.objectContaining({
        category: 'Furniture'
      }))
    })

    test('should search with subcategory filter', async () => {
      (searchModels as jest.Mock).mockResolvedValue({
        models: [mockModels[0]],
        total: 1,
        hasMore: false
      })

      const request = new NextRequest('http://localhost:3000/api/models/search?subcategory=Seating')
      const response = await GET(request)

      expect(searchModels).toHaveBeenCalledWith(expect.objectContaining({
        subcategory: 'Seating'
      }))
    })

    test('should search with combined filters', async () => {
      (searchModels as jest.Mock).mockResolvedValue({
        models: [mockModels[0]],
        total: 1,
        hasMore: false
      })

      const request = new NextRequest('http://localhost:3000/api/models/search?q=chair&category=Furniture&subcategory=Seating')
      const response = await GET(request)

      expect(searchModels).toHaveBeenCalledWith(expect.objectContaining({
        query: 'chair',
        category: 'Furniture',
        subcategory: 'Seating'
      }))
    })
  })

  describe('GET /api/models/search - Filters', () => {
    test('should filter by tags', async () => {
      (searchModels as jest.Mock).mockResolvedValue({
        models: [mockModels[0]],
        total: 1,
        hasMore: false
      })

      const request = new NextRequest('http://localhost:3000/api/models/search?tags=modern,chair')
      const response = await GET(request)

      expect(searchModels).toHaveBeenCalledWith(expect.objectContaining({
        tags: ['modern', 'chair']
      }))
    })

    test('should filter by style', async () => {
      (searchModels as jest.Mock).mockResolvedValue({
        models: [mockModels[0]],
        total: 1,
        hasMore: false
      })

      const request = new NextRequest('http://localhost:3000/api/models/search?style=Modern,Contemporary')
      const response = await GET(request)

      expect(searchModels).toHaveBeenCalledWith(expect.objectContaining({
        style: ['Modern', 'Contemporary']
      }))
    })

    test('should filter by license', async () => {
      (searchModels as jest.Mock).mockResolvedValue({
        models: [mockModels[0]],
        total: 1,
        hasMore: false
      })

      const request = new NextRequest('http://localhost:3000/api/models/search?license=free')
      const response = await GET(request)

      expect(searchModels).toHaveBeenCalledWith(expect.objectContaining({
        license: 'free'
      }))
    })

    test('should filter by minimum rating', async () => {
      (searchModels as jest.Mock).mockResolvedValue({
        models: [mockModels[1]],
        total: 1,
        hasMore: false
      })

      const request = new NextRequest('http://localhost:3000/api/models/search?minRating=4.7')
      const response = await GET(request)

      expect(searchModels).toHaveBeenCalledWith(expect.objectContaining({
        minRating: 4.7
      }))
    })

    test('should parse minRating as float', async () => {
      (searchModels as jest.Mock).mockResolvedValue({
        models: [],
        total: 0,
        hasMore: false
      })

      const request = new NextRequest('http://localhost:3000/api/models/search?minRating=3.5')
      await GET(request)

      expect(searchModels).toHaveBeenCalledWith(expect.objectContaining({
        minRating: 3.5
      }))
    })

    test('should handle invalid minRating gracefully', async () => {
      (searchModels as jest.Mock).mockResolvedValue({
        models: mockModels,
        total: 2,
        hasMore: false
      })

      const request = new NextRequest('http://localhost:3000/api/models/search?minRating=invalid')
      await GET(request)

      expect(searchModels).toHaveBeenCalledWith(expect.objectContaining({
        minRating: undefined
      }))
    })
  })

  describe('GET /api/models/search - Pagination', () => {
    test('should use default pagination', async () => {
      (searchModels as jest.Mock).mockResolvedValue({
        models: mockModels,
        total: 2,
        hasMore: false
      })

      const request = new NextRequest('http://localhost:3000/api/models/search')
      await GET(request)

      expect(searchModels).toHaveBeenCalledWith(expect.objectContaining({
        limit: 20,
        offset: 0
      }))
    })

    test('should support custom limit', async () => {
      (searchModels as jest.Mock).mockResolvedValue({
        models: mockModels,
        total: 2,
        hasMore: false
      })

      const request = new NextRequest('http://localhost:3000/api/models/search?limit=10')
      await GET(request)

      expect(searchModels).toHaveBeenCalledWith(expect.objectContaining({
        limit: 10
      }))
    })

    test('should support custom offset', async () => {
      (searchModels as jest.Mock).mockResolvedValue({
        models: mockModels,
        total: 2,
        hasMore: false
      })

      const request = new NextRequest('http://localhost:3000/api/models/search?offset=20')
      await GET(request)

      expect(searchModels).toHaveBeenCalledWith(expect.objectContaining({
        offset: 20
      }))
    })

    test('should support both limit and offset', async () => {
      (searchModels as jest.Mock).mockResolvedValue({
        models: mockModels,
        total: 2,
        hasMore: true
      })

      const request = new NextRequest('http://localhost:3000/api/models/search?limit=10&offset=10')
      await GET(request)

      expect(searchModels).toHaveBeenCalledWith(expect.objectContaining({
        limit: 10,
        offset: 10
      }))
    })

    test('should return hasMore flag', async () => {
      (searchModels as jest.Mock).mockResolvedValue({
        models: mockModels,
        total: 100,
        hasMore: true
      })

      const request = new NextRequest('http://localhost:3000/api/models/search?limit=20')
      const response = await GET(request)
      const data = await response.json()

      expect(data.hasMore).toBe(true)
    })

    test('should handle invalid pagination parameters', async () => {
      (searchModels as jest.Mock).mockResolvedValue({
        models: mockModels,
        total: 2,
        hasMore: false
      })

      const request = new NextRequest('http://localhost:3000/api/models/search?limit=invalid&offset=invalid')
      await GET(request)

      expect(searchModels).toHaveBeenCalledWith(expect.objectContaining({
        limit: 20,
        offset: 0
      }))
    })
  })

  describe('GET /api/models/search - Sorting', () => {
    test('should use default sorting', async () => {
      (searchModels as jest.Mock).mockResolvedValue({
        models: mockModels,
        total: 2,
        hasMore: false
      })

      const request = new NextRequest('http://localhost:3000/api/models/search')
      await GET(request)

      expect(searchModels).toHaveBeenCalledWith(expect.objectContaining({
        sortBy: 'relevance',
        sortOrder: 'desc'
      }))
    })

    test('should sort by downloads', async () => {
      (searchModels as jest.Mock).mockResolvedValue({
        models: mockModels,
        total: 2,
        hasMore: false
      })

      const request = new NextRequest('http://localhost:3000/api/models/search?sortBy=downloads')
      await GET(request)

      expect(searchModels).toHaveBeenCalledWith(expect.objectContaining({
        sortBy: 'downloads'
      }))
    })

    test('should sort by rating', async () => {
      (searchModels as jest.Mock).mockResolvedValue({
        models: mockModels,
        total: 2,
        hasMore: false
      })

      const request = new NextRequest('http://localhost:3000/api/models/search?sortBy=rating')
      await GET(request)

      expect(searchModels).toHaveBeenCalledWith(expect.objectContaining({
        sortBy: 'rating'
      }))
    })

    test('should sort by name', async () => {
      (searchModels as jest.Mock).mockResolvedValue({
        models: mockModels,
        total: 2,
        hasMore: false
      })

      const request = new NextRequest('http://localhost:3000/api/models/search?sortBy=name')
      await GET(request)

      expect(searchModels).toHaveBeenCalledWith(expect.objectContaining({
        sortBy: 'name'
      }))
    })

    test('should sort by created_at', async () => {
      (searchModels as jest.Mock).mockResolvedValue({
        models: mockModels,
        total: 2,
        hasMore: false
      })

      const request = new NextRequest('http://localhost:3000/api/models/search?sortBy=created_at')
      await GET(request)

      expect(searchModels).toHaveBeenCalledWith(expect.objectContaining({
        sortBy: 'created_at'
      }))
    })

    test('should support ascending order', async () => {
      (searchModels as jest.Mock).mockResolvedValue({
        models: mockModels,
        total: 2,
        hasMore: false
      })

      const request = new NextRequest('http://localhost:3000/api/models/search?sortOrder=asc')
      await GET(request)

      expect(searchModels).toHaveBeenCalledWith(expect.objectContaining({
        sortOrder: 'asc'
      }))
    })

    test('should support descending order', async () => {
      (searchModels as jest.Mock).mockResolvedValue({
        models: mockModels,
        total: 2,
        hasMore: false
      })

      const request = new NextRequest('http://localhost:3000/api/models/search?sortOrder=desc')
      await GET(request)

      expect(searchModels).toHaveBeenCalledWith(expect.objectContaining({
        sortOrder: 'desc'
      }))
    })
  })

  describe('GET /api/models/search - Featured Models', () => {
    test('should get featured models', async () => {
      (getFeaturedModels as jest.Mock).mockResolvedValue(mockModels)

      const request = new NextRequest('http://localhost:3000/api/models/search?featured=true')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.models).toEqual(mockModels)
      expect(data.total).toBe(2)
      expect(getFeaturedModels).toHaveBeenCalledWith(12)
    })

    test('should support custom limit for featured models', async () => {
      (getFeaturedModels as jest.Mock).mockResolvedValue(mockModels)

      const request = new NextRequest('http://localhost:3000/api/models/search?featured=true&limit=24')
      await GET(request)

      expect(getFeaturedModels).toHaveBeenCalledWith(24)
    })

    test('should not call searchModels for featured request', async () => {
      (getFeaturedModels as jest.Mock).mockResolvedValue(mockModels)

      const request = new NextRequest('http://localhost:3000/api/models/search?featured=true')
      await GET(request)

      expect(getFeaturedModels).toHaveBeenCalled()
      expect(searchModels).not.toHaveBeenCalled()
    })

    test('should handle empty featured results', async () => {
      (getFeaturedModels as jest.Mock).mockResolvedValue([])

      const request = new NextRequest('http://localhost:3000/api/models/search?featured=true')
      const response = await GET(request)
      const data = await response.json()

      expect(data.models).toEqual([])
      expect(data.total).toBe(0)
    })
  })

  describe('GET /api/models/search - Categories', () => {
    const mockCategories = [
      { category: 'Furniture', count: 150 },
      { category: 'Lighting', count: 75 },
      { category: 'Decor', count: 50 }
    ]

    test('should get categories', async () => {
      (getCategories as jest.Mock).mockResolvedValue(mockCategories)

      const request = new NextRequest('http://localhost:3000/api/models/search?categories=true')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.categories).toEqual(mockCategories)
      expect(getCategories).toHaveBeenCalled()
    })

    test('should not call searchModels for categories request', async () => {
      (getCategories as jest.Mock).mockResolvedValue(mockCategories)

      const request = new NextRequest('http://localhost:3000/api/models/search?categories=true')
      await GET(request)

      expect(getCategories).toHaveBeenCalled()
      expect(searchModels).not.toHaveBeenCalled()
    })

    test('should handle empty categories', async () => {
      (getCategories as jest.Mock).mockResolvedValue([])

      const request = new NextRequest('http://localhost:3000/api/models/search?categories=true')
      const response = await GET(request)
      const data = await response.json()

      expect(data.categories).toEqual([])
    })
  })

  describe('GET /api/models/search - Error Handling', () => {
    test('should handle search errors', async () => {
      (searchModels as jest.Mock).mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/models/search')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to search models')
    })

    test('should handle featured models errors', async () => {
      (getFeaturedModels as jest.Mock).mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/models/search?featured=true')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to search models')
    })

    test('should handle categories errors', async () => {
      (getCategories as jest.Mock).mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/models/search?categories=true')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to search models')
    })

    test('should log errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      ;(searchModels as jest.Mock).mockRejectedValue(new Error('Test error'))

      const request = new NextRequest('http://localhost:3000/api/models/search')
      await GET(request)

      expect(consoleSpy).toHaveBeenCalledWith('Model search error:', expect.any(Error))
      consoleSpy.mockRestore()
    })
  })

  describe('GET /api/models/search - Complex Queries', () => {
    test('should handle complex multi-filter search', async () => {
      (searchModels as jest.Mock).mockResolvedValue({
        models: [mockModels[0]],
        total: 1,
        hasMore: false
      })

      const request = new NextRequest(
        'http://localhost:3000/api/models/search?q=chair&category=Furniture&subcategory=Seating&tags=modern&style=Modern&license=free&minRating=4.0&limit=10&offset=0&sortBy=rating&sortOrder=desc'
      )
      const response = await GET(request)

      expect(searchModels).toHaveBeenCalledWith({
        query: 'chair',
        category: 'Furniture',
        subcategory: 'Seating',
        tags: ['modern'],
        style: ['Modern'],
        license: 'free',
        minRating: 4.0,
        limit: 10,
        offset: 0,
        sortBy: 'rating',
        sortOrder: 'desc'
      })
    })

    test('should handle URL-encoded parameters', async () => {
      (searchModels as jest.Mock).mockResolvedValue({
        models: mockModels,
        total: 2,
        hasMore: false
      })

      const request = new NextRequest('http://localhost:3000/api/models/search?q=modern%20chair')
      await GET(request)

      expect(searchModels).toHaveBeenCalledWith(expect.objectContaining({
        query: 'modern chair'
      }))
    })

    test('should handle multiple tags', async () => {
      (searchModels as jest.Mock).mockResolvedValue({
        models: mockModels,
        total: 2,
        hasMore: false
      })

      const request = new NextRequest('http://localhost:3000/api/models/search?tags=modern,contemporary,minimalist')
      await GET(request)

      expect(searchModels).toHaveBeenCalledWith(expect.objectContaining({
        tags: ['modern', 'contemporary', 'minimalist']
      }))
    })

    test('should handle multiple styles', async () => {
      (searchModels as jest.Mock).mockResolvedValue({
        models: mockModels,
        total: 2,
        hasMore: false
      })

      const request = new NextRequest('http://localhost:3000/api/models/search?style=Modern,Contemporary')
      await GET(request)

      expect(searchModels).toHaveBeenCalledWith(expect.objectContaining({
        style: ['Modern', 'Contemporary']
      }))
    })
  })

  describe('GET /api/models/search - Response Format', () => {
    test('should return correct response structure', async () => {
      (searchModels as jest.Mock).mockResolvedValue({
        models: mockModels,
        total: 2,
        hasMore: false
      })

      const request = new NextRequest('http://localhost:3000/api/models/search')
      const response = await GET(request)
      const data = await response.json()

      expect(data).toHaveProperty('models')
      expect(data).toHaveProperty('total')
      expect(data).toHaveProperty('hasMore')
    })

    test('should include all model properties', async () => {
      (searchModels as jest.Mock).mockResolvedValue({
        models: [mockModels[0]],
        total: 1,
        hasMore: false
      })

      const request = new NextRequest('http://localhost:3000/api/models/search')
      const response = await GET(request)
      const data = await response.json()

      const model = data.models[0]
      expect(model).toHaveProperty('id')
      expect(model).toHaveProperty('name')
      expect(model).toHaveProperty('description')
      expect(model).toHaveProperty('category')
      expect(model).toHaveProperty('dimensions')
      expect(model).toHaveProperty('poly_count')
      expect(model).toHaveProperty('downloads')
      expect(model).toHaveProperty('rating')
    })
  })
})
