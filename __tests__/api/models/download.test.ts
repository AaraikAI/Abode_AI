/**
 * Model Library API - Download Tests
 * Tests model file download functionality with tracking
 */

import { GET, HEAD } from '@/app/api/models/download/[id]/route'
import { getModelById, incrementDownloads } from '@/lib/data/model-library'
import { NextRequest } from 'next/server'

// Mock dependencies
jest.mock('@/lib/data/model-library')

describe('Model Download API Route', () => {
  const mockModel = {
    id: 'model-123',
    name: 'Modern Chair',
    description: 'A stylish modern chair',
    category: 'Furniture',
    subcategory: 'Seating',
    tags: ['modern', 'chair'],
    thumbnail_url: 'https://example.com/thumb.jpg',
    model_url: 'https://example.com/model.glb',
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
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(incrementDownloads as jest.Mock).mockResolvedValue(undefined)
  })

  describe('GET /api/models/download/[id]', () => {
    test('should download model by redirecting to model URL', async () => {
      (getModelById as jest.Mock).mockResolvedValue(mockModel)

      const request = new NextRequest('http://localhost:3000/api/models/download/model-123')
      const response = await GET(request, { params: { id: 'model-123' } })

      expect(response.status).toBe(302)
      expect(response.headers.get('location')).toBe(mockModel.model_url)
      expect(getModelById).toHaveBeenCalledWith('model-123')
    })

    test('should increment download count', async () => {
      (getModelById as jest.Mock).mockResolvedValue(mockModel)

      const request = new NextRequest('http://localhost:3000/api/models/download/model-123')
      await GET(request, { params: { id: 'model-123' } })

      // Allow async increment to complete
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(incrementDownloads).toHaveBeenCalledWith('model-123')
    })

    test('should return 404 if model not found', async () => {
      (getModelById as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/models/download/invalid-id')
      const response = await GET(request, { params: { id: 'invalid-id' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Model not found')
      expect(incrementDownloads).not.toHaveBeenCalled()
    })

    test('should return 400 if ID is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/models/download/')
      const response = await GET(request, { params: { id: '' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Model ID is required')
    })

    test('should return 404 if model URL is missing', async () => {
      const modelWithoutUrl = { ...mockModel, model_url: '' }
      ;(getModelById as jest.Mock).mockResolvedValue(modelWithoutUrl)

      const request = new NextRequest('http://localhost:3000/api/models/download/model-123')
      const response = await GET(request, { params: { id: 'model-123' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Model file not available')
    })

    test('should handle database errors', async () => {
      (getModelById as jest.Mock).mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/models/download/model-123')
      const response = await GET(request, { params: { id: 'model-123' } })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to download model')
    })

    test('should return download info when redirect=false', async () => {
      (getModelById as jest.Mock).mockResolvedValue(mockModel)

      const request = new NextRequest('http://localhost:3000/api/models/download/model-123?redirect=false')
      const response = await GET(request, { params: { id: 'model-123' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.download_url).toBe(mockModel.model_url)
      expect(data.model.id).toBe('model-123')
      expect(data.model.name).toBe('Modern Chair')
      expect(data.model.file_size).toBe(2000000)
      expect(data.model.downloads).toBe(101) // Incremented
    })

    test('should still increment downloads when redirect=false', async () => {
      (getModelById as jest.Mock).mockResolvedValue(mockModel)

      const request = new NextRequest('http://localhost:3000/api/models/download/model-123?redirect=false')
      await GET(request, { params: { id: 'model-123' } })

      await new Promise(resolve => setTimeout(resolve, 10))

      expect(incrementDownloads).toHaveBeenCalledWith('model-123')
    })

    test('should not fail if increment downloads fails', async () => {
      (getModelById as jest.Mock).mockResolvedValue(mockModel)
      ;(incrementDownloads as jest.Mock).mockRejectedValue(new Error('Increment failed'))

      const request = new NextRequest('http://localhost:3000/api/models/download/model-123')
      const response = await GET(request, { params: { id: 'model-123' } })

      // Should still redirect successfully
      expect(response.status).toBe(302)
    })

    test('should handle special characters in model ID', async () => {
      const specialId = 'model-123-abc_def'
      const specialModel = { ...mockModel, id: specialId }
      ;(getModelById as jest.Mock).mockResolvedValue(specialModel)

      const request = new NextRequest(`http://localhost:3000/api/models/download/${specialId}`)
      const response = await GET(request, { params: { id: specialId } })

      expect(response.status).toBe(302)
      expect(getModelById).toHaveBeenCalledWith(specialId)
    })

    test('should return model metadata in non-redirect mode', async () => {
      (getModelById as jest.Mock).mockResolvedValue(mockModel)

      const request = new NextRequest('http://localhost:3000/api/models/download/model-123?redirect=false')
      const response = await GET(request, { params: { id: 'model-123' } })
      const data = await response.json()

      expect(data.model).toHaveProperty('id')
      expect(data.model).toHaveProperty('name')
      expect(data.model).toHaveProperty('file_size')
      expect(data.model).toHaveProperty('downloads')
    })
  })

  describe('HEAD /api/models/download/[id]', () => {
    test('should return file information headers', async () => {
      (getModelById as jest.Mock).mockResolvedValue(mockModel)

      const request = new NextRequest('http://localhost:3000/api/models/download/model-123', {
        method: 'HEAD'
      })
      const response = await HEAD(request, { params: { id: 'model-123' } })

      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toBe('application/octet-stream')
      expect(response.headers.get('Content-Length')).toBe('2000000')
      expect(response.headers.get('X-Model-Name')).toBe('Modern Chair')
      expect(response.headers.get('X-Model-Downloads')).toBe('100')
    })

    test('should not increment download count on HEAD request', async () => {
      (getModelById as jest.Mock).mockResolvedValue(mockModel)

      const request = new NextRequest('http://localhost:3000/api/models/download/model-123', {
        method: 'HEAD'
      })
      await HEAD(request, { params: { id: 'model-123' } })

      expect(incrementDownloads).not.toHaveBeenCalled()
    })

    test('should return 404 if model not found', async () => {
      (getModelById as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/models/download/invalid-id', {
        method: 'HEAD'
      })
      const response = await HEAD(request, { params: { id: 'invalid-id' } })

      expect(response.status).toBe(404)
    })

    test('should return 400 if ID is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/models/download/', {
        method: 'HEAD'
      })
      const response = await HEAD(request, { params: { id: '' } })

      expect(response.status).toBe(400)
    })

    test('should return 404 if model URL is missing', async () => {
      const modelWithoutUrl = { ...mockModel, model_url: '' }
      ;(getModelById as jest.Mock).mockResolvedValue(modelWithoutUrl)

      const request = new NextRequest('http://localhost:3000/api/models/download/model-123', {
        method: 'HEAD'
      })
      const response = await HEAD(request, { params: { id: 'model-123' } })

      expect(response.status).toBe(404)
    })

    test('should handle database errors', async () => {
      (getModelById as jest.Mock).mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/models/download/model-123', {
        method: 'HEAD'
      })
      const response = await HEAD(request, { params: { id: 'model-123' } })

      expect(response.status).toBe(500)
    })

    test('should return no body in response', async () => {
      (getModelById as jest.Mock).mockResolvedValue(mockModel)

      const request = new NextRequest('http://localhost:3000/api/models/download/model-123', {
        method: 'HEAD'
      })
      const response = await HEAD(request, { params: { id: 'model-123' } })

      const text = await response.text()
      expect(text).toBe('')
    })

    test('should return correct file size for large files', async () => {
      const largeModel = { ...mockModel, file_size: 50000000 } // 50MB
      ;(getModelById as jest.Mock).mockResolvedValue(largeModel)

      const request = new NextRequest('http://localhost:3000/api/models/download/model-123', {
        method: 'HEAD'
      })
      const response = await HEAD(request, { params: { id: 'model-123' } })

      expect(response.headers.get('Content-Length')).toBe('50000000')
    })
  })

  describe('Download Tracking', () => {
    test('should track each download separately', async () => {
      (getModelById as jest.Mock).mockResolvedValue(mockModel)

      // Make multiple download requests
      const request1 = new NextRequest('http://localhost:3000/api/models/download/model-123')
      const request2 = new NextRequest('http://localhost:3000/api/models/download/model-123')

      await GET(request1, { params: { id: 'model-123' } })
      await GET(request2, { params: { id: 'model-123' } })

      await new Promise(resolve => setTimeout(resolve, 20))

      expect(incrementDownloads).toHaveBeenCalledTimes(2)
    })

    test('should track downloads for different models', async () => {
      const model1 = { ...mockModel, id: 'model-1' }
      const model2 = { ...mockModel, id: 'model-2' }

      ;(getModelById as jest.Mock)
        .mockResolvedValueOnce(model1)
        .mockResolvedValueOnce(model2)

      const request1 = new NextRequest('http://localhost:3000/api/models/download/model-1')
      const request2 = new NextRequest('http://localhost:3000/api/models/download/model-2')

      await GET(request1, { params: { id: 'model-1' } })
      await GET(request2, { params: { id: 'model-2' } })

      await new Promise(resolve => setTimeout(resolve, 20))

      expect(incrementDownloads).toHaveBeenCalledWith('model-1')
      expect(incrementDownloads).toHaveBeenCalledWith('model-2')
    })
  })
})
