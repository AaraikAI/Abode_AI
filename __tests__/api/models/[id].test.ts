/**
 * Model Library API - Individual Model Operations Tests
 * Tests GET, PUT, DELETE operations for individual models
 */

import { GET, PUT, DELETE } from '@/app/api/models/[id]/route'
import { getModelById, updateModel, deleteModel } from '@/lib/data/model-library'
import { requireSession } from '@/lib/auth/session'
import { NextRequest } from 'next/server'

// Mock dependencies
jest.mock('@/lib/data/model-library')
jest.mock('@/lib/auth/session')

describe('Model [id] API Route', () => {
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
  })

  describe('GET /api/models/[id]', () => {
    test('should get model by ID', async () => {
      (getModelById as jest.Mock).mockResolvedValue(mockModel)

      const request = new NextRequest('http://localhost:3000/api/models/model-123')
      const response = await GET(request, { params: { id: 'model-123' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.model).toEqual(mockModel)
      expect(getModelById).toHaveBeenCalledWith('model-123')
    })

    test('should return 404 if model not found', async () => {
      (getModelById as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/models/invalid-id')
      const response = await GET(request, { params: { id: 'invalid-id' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Model not found')
    })

    test('should return 400 if ID is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/models/')
      const response = await GET(request, { params: { id: '' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Model ID is required')
    })

    test('should handle database errors', async () => {
      (getModelById as jest.Mock).mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/models/model-123')
      const response = await GET(request, { params: { id: 'model-123' } })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to get model')
    })

    test('should return complete model data', async () => {
      (getModelById as jest.Mock).mockResolvedValue(mockModel)

      const request = new NextRequest('http://localhost:3000/api/models/model-123')
      const response = await GET(request, { params: { id: 'model-123' } })
      const data = await response.json()

      expect(data.model).toHaveProperty('id')
      expect(data.model).toHaveProperty('name')
      expect(data.model).toHaveProperty('dimensions')
      expect(data.model).toHaveProperty('poly_count')
      expect(data.model).toHaveProperty('rating')
    })
  })

  describe('PUT /api/models/[id]', () => {
    const mockSession = {
      user: { id: 'user-123', name: 'Test User' }
    }

    beforeEach(() => {
      (requireSession as jest.Mock).mockResolvedValue(mockSession)
      (getModelById as jest.Mock).mockResolvedValue(mockModel)
    })

    test('should update model metadata', async () => {
      const updatedModel = { ...mockModel, name: 'Updated Chair' }
      ;(updateModel as jest.Mock).mockResolvedValue(updatedModel)

      const request = new NextRequest('http://localhost:3000/api/models/model-123', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Updated Chair' })
      })

      const response = await PUT(request, { params: { id: 'model-123' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.model.name).toBe('Updated Chair')
      expect(updateModel).toHaveBeenCalledWith('model-123', expect.objectContaining({
        name: 'Updated Chair',
        updated_at: expect.any(String)
      }))
    })

    test('should require authentication', async () => {
      (requireSession as jest.Mock).mockRejectedValue(new Error('Unauthorized'))

      const request = new NextRequest('http://localhost:3000/api/models/model-123', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Updated' })
      })

      const response = await PUT(request, { params: { id: 'model-123' } })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    test('should validate model ID', async () => {
      const request = new NextRequest('http://localhost:3000/api/models/', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Updated' })
      })

      const response = await PUT(request, { params: { id: '' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Model ID is required')
    })

    test('should return 404 if model does not exist', async () => {
      (getModelById as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/models/invalid-id', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Updated' })
      })

      const response = await PUT(request, { params: { id: 'invalid-id' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Model not found')
    })

    test('should only update allowed fields', async () => {
      (updateModel as jest.Mock).mockResolvedValue(mockModel)

      const request = new NextRequest('http://localhost:3000/api/models/model-123', {
        method: 'PUT',
        body: JSON.stringify({
          name: 'Updated',
          downloads: 999999, // Should not be updated
          rating: 5.0, // Should not be updated
          id: 'different-id' // Should not be updated
        })
      })

      await PUT(request, { params: { id: 'model-123' } })

      const updateCall = (updateModel as jest.Mock).mock.calls[0][1]
      expect(updateCall.name).toBe('Updated')
      expect(updateCall.downloads).toBeUndefined()
      expect(updateCall.rating).toBeUndefined()
      expect(updateCall.id).toBeUndefined()
    })

    test('should validate name field', async () => {
      const request = new NextRequest('http://localhost:3000/api/models/model-123', {
        method: 'PUT',
        body: JSON.stringify({ name: '' })
      })

      const response = await PUT(request, { params: { id: 'model-123' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Name must be a non-empty string')
    })

    test('should validate license type', async () => {
      const request = new NextRequest('http://localhost:3000/api/models/model-123', {
        method: 'PUT',
        body: JSON.stringify({ license: 'invalid' })
      })

      const response = await PUT(request, { params: { id: 'model-123' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid license type')
    })

    test('should validate dimensions structure', async () => {
      const request = new NextRequest('http://localhost:3000/api/models/model-123', {
        method: 'PUT',
        body: JSON.stringify({
          dimensions: { width: 1, height: 1 } // Missing depth and unit
        })
      })

      const response = await PUT(request, { params: { id: 'model-123' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Dimensions must include')
    })

    test('should validate dimension unit', async () => {
      const request = new NextRequest('http://localhost:3000/api/models/model-123', {
        method: 'PUT',
        body: JSON.stringify({
          dimensions: { width: 1, height: 1, depth: 1, unit: 'invalid' }
        })
      })

      const response = await PUT(request, { params: { id: 'model-123' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid dimension unit')
    })

    test('should update multiple fields', async () => {
      const updatedModel = {
        ...mockModel,
        name: 'New Name',
        description: 'New Description',
        tags: ['new', 'tags']
      }
      ;(updateModel as jest.Mock).mockResolvedValue(updatedModel)

      const request = new NextRequest('http://localhost:3000/api/models/model-123', {
        method: 'PUT',
        body: JSON.stringify({
          name: 'New Name',
          description: 'New Description',
          tags: ['new', 'tags']
        })
      })

      const response = await PUT(request, { params: { id: 'model-123' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.model.name).toBe('New Name')
      expect(data.model.description).toBe('New Description')
      expect(data.model.tags).toEqual(['new', 'tags'])
    })

    test('should add updated_at timestamp', async () => {
      (updateModel as jest.Mock).mockResolvedValue(mockModel)

      const request = new NextRequest('http://localhost:3000/api/models/model-123', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Updated' })
      })

      await PUT(request, { params: { id: 'model-123' } })

      const updateCall = (updateModel as jest.Mock).mock.calls[0][1]
      expect(updateCall.updated_at).toBeDefined()
      expect(new Date(updateCall.updated_at).getTime()).toBeGreaterThan(0)
    })
  })

  describe('DELETE /api/models/[id]', () => {
    const mockSession = {
      user: { id: 'user-123', name: 'Test User' }
    }

    beforeEach(() => {
      (requireSession as jest.Mock).mockResolvedValue(mockSession)
      (getModelById as jest.Mock).mockResolvedValue(mockModel)
      (deleteModel as jest.Mock).mockResolvedValue(undefined)
    })

    test('should delete model', async () => {
      const request = new NextRequest('http://localhost:3000/api/models/model-123', {
        method: 'DELETE'
      })

      const response = await DELETE(request, { params: { id: 'model-123' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Model deleted successfully')
      expect(deleteModel).toHaveBeenCalledWith('model-123')
    })

    test('should require authentication for deletion', async () => {
      (requireSession as jest.Mock).mockRejectedValue(new Error('Unauthorized'))

      const request = new NextRequest('http://localhost:3000/api/models/model-123', {
        method: 'DELETE'
      })

      const response = await DELETE(request, { params: { id: 'model-123' } })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
      expect(deleteModel).not.toHaveBeenCalled()
    })

    test('should validate model ID', async () => {
      const request = new NextRequest('http://localhost:3000/api/models/', {
        method: 'DELETE'
      })

      const response = await DELETE(request, { params: { id: '' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Model ID is required')
    })

    test('should return 404 if model does not exist', async () => {
      (getModelById as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/models/invalid-id', {
        method: 'DELETE'
      })

      const response = await DELETE(request, { params: { id: 'invalid-id' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Model not found')
      expect(deleteModel).not.toHaveBeenCalled()
    })

    test('should handle deletion errors', async () => {
      (deleteModel as jest.Mock).mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/models/model-123', {
        method: 'DELETE'
      })

      const response = await DELETE(request, { params: { id: 'model-123' } })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to delete model')
    })

    test('should verify model exists before deletion', async () => {
      const request = new NextRequest('http://localhost:3000/api/models/model-123', {
        method: 'DELETE'
      })

      await DELETE(request, { params: { id: 'model-123' } })

      expect(getModelById).toHaveBeenCalledWith('model-123')
      expect(getModelById).toHaveBeenCalledBefore(deleteModel as jest.Mock)
    })
  })

  describe('Error Handling', () => {
    test('should handle JSON parse errors in PUT', async () => {
      (requireSession as jest.Mock).mockResolvedValue({ user: { id: 'user-123' } })
      (getModelById as jest.Mock).mockResolvedValue(mockModel)

      const request = new NextRequest('http://localhost:3000/api/models/model-123', {
        method: 'PUT',
        body: 'invalid json'
      })

      const response = await PUT(request, { params: { id: 'model-123' } })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBeDefined()
    })

    test('should handle missing request body in PUT', async () => {
      (requireSession as jest.Mock).mockResolvedValue({ user: { id: 'user-123' } })
      (getModelById as jest.Mock).mockResolvedValue(mockModel)
      (updateModel as jest.Mock).mockResolvedValue(mockModel)

      const request = new NextRequest('http://localhost:3000/api/models/model-123', {
        method: 'PUT',
        body: JSON.stringify({})
      })

      const response = await PUT(request, { params: { id: 'model-123' } })

      // Should still succeed with empty updates
      expect(response.status).toBe(200)
    })

    test('should handle database connection failures', async () => {
      (getModelById as jest.Mock).mockRejectedValue(new Error('Connection refused'))

      const request = new NextRequest('http://localhost:3000/api/models/model-123')
      const response = await GET(request, { params: { id: 'model-123' } })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to get model')
    })
  })
})
