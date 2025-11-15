/**
 * Model Library API - Upload Tests
 * Tests multipart/form-data file upload functionality
 */

import { POST } from '@/app/api/models/upload/route'
import { createModel } from '@/lib/data/model-library'
import { requireSession } from '@/lib/auth/session'
import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Mock dependencies
jest.mock('@/lib/data/model-library')
jest.mock('@/lib/auth/session')
jest.mock('@supabase/supabase-js')

describe('Model Upload API Route', () => {
  const mockSession = {
    user: { id: 'user-123', name: 'Test User' }
  }

  const mockSupabase = {
    storage: {
      from: jest.fn().mockReturnThis(),
      upload: jest.fn(),
      getPublicUrl: jest.fn()
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(requireSession as jest.Mock).mockResolvedValue(mockSession)
    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)
  })

  const createFormData = (data: Record<string, any>) => {
    const formData = new FormData()
    Object.entries(data).forEach(([key, value]) => {
      if (value instanceof File) {
        formData.append(key, value)
      } else if (typeof value === 'object') {
        formData.append(key, JSON.stringify(value))
      } else {
        formData.append(key, String(value))
      }
    })
    return formData
  }

  const createMockFile = (name: string, size: number, type: string = 'model/gltf-binary') => {
    const buffer = new ArrayBuffer(size)
    return new File([buffer], name, { type })
  }

  describe('POST /api/models/upload - Authentication', () => {
    test('should require authentication', async () => {
      (requireSession as jest.Mock).mockRejectedValue(new Error('Unauthorized'))

      const formData = createFormData({
        file: createMockFile('model.glb', 1000),
        name: 'Test Model',
        category: 'Furniture',
        subcategory: 'Seating'
      })

      const request = new NextRequest('http://localhost:3000/api/models/upload', {
        method: 'POST',
        body: formData
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    test('should extract user ID from session', async () => {
      mockSupabase.storage.upload.mockResolvedValue({ data: { path: 'test.glb' }, error: null })
      mockSupabase.storage.getPublicUrl.mockReturnValue({ data: { publicUrl: 'http://example.com/test.glb' } })
      ;(createModel as jest.Mock).mockResolvedValue({ id: 'model-123' })

      const formData = createFormData({
        file: createMockFile('model.glb', 1000),
        name: 'Test Model',
        category: 'Furniture',
        subcategory: 'Seating'
      })

      const request = new NextRequest('http://localhost:3000/api/models/upload', {
        method: 'POST',
        body: formData
      })

      await POST(request)

      expect(requireSession).toHaveBeenCalledWith({ request })
    })
  })

  describe('POST /api/models/upload - File Validation', () => {
    test('should require file', async () => {
      const formData = createFormData({
        name: 'Test Model',
        category: 'Furniture',
        subcategory: 'Seating'
      })

      const request = new NextRequest('http://localhost:3000/api/models/upload', {
        method: 'POST',
        body: formData
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('No file provided')
    })

    test('should validate file size', async () => {
      const largeFile = createMockFile('large.glb', 150 * 1024 * 1024) // 150MB

      const formData = createFormData({
        file: largeFile,
        name: 'Test Model',
        category: 'Furniture',
        subcategory: 'Seating'
      })

      const request = new NextRequest('http://localhost:3000/api/models/upload', {
        method: 'POST',
        body: formData
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('File size exceeds')
    })

    test('should accept GLB files', async () => {
      mockSupabase.storage.upload.mockResolvedValue({ data: { path: 'test.glb' }, error: null })
      mockSupabase.storage.getPublicUrl.mockReturnValue({ data: { publicUrl: 'http://example.com/test.glb' } })
      ;(createModel as jest.Mock).mockResolvedValue({ id: 'model-123' })

      const formData = createFormData({
        file: createMockFile('model.glb', 1000),
        name: 'Test Model',
        category: 'Furniture',
        subcategory: 'Seating'
      })

      const request = new NextRequest('http://localhost:3000/api/models/upload', {
        method: 'POST',
        body: formData
      })

      const response = await POST(request)

      expect(response.status).toBe(201)
    })

    test('should accept FBX files', async () => {
      mockSupabase.storage.upload.mockResolvedValue({ data: { path: 'test.fbx' }, error: null })
      mockSupabase.storage.getPublicUrl.mockReturnValue({ data: { publicUrl: 'http://example.com/test.fbx' } })
      ;(createModel as jest.Mock).mockResolvedValue({ id: 'model-123' })

      const formData = createFormData({
        file: createMockFile('model.fbx', 1000, 'application/octet-stream'),
        name: 'Test Model',
        category: 'Furniture',
        subcategory: 'Seating'
      })

      const request = new NextRequest('http://localhost:3000/api/models/upload', {
        method: 'POST',
        body: formData
      })

      const response = await POST(request)

      expect(response.status).toBe(201)
    })

    test('should accept OBJ files', async () => {
      mockSupabase.storage.upload.mockResolvedValue({ data: { path: 'test.obj' }, error: null })
      mockSupabase.storage.getPublicUrl.mockReturnValue({ data: { publicUrl: 'http://example.com/test.obj' } })
      ;(createModel as jest.Mock).mockResolvedValue({ id: 'model-123' })

      const formData = createFormData({
        file: createMockFile('model.obj', 1000, 'text/plain'),
        name: 'Test Model',
        category: 'Furniture',
        subcategory: 'Seating'
      })

      const request = new NextRequest('http://localhost:3000/api/models/upload', {
        method: 'POST',
        body: formData
      })

      const response = await POST(request)

      expect(response.status).toBe(201)
    })

    test('should reject invalid file types', async () => {
      const formData = createFormData({
        file: createMockFile('document.pdf', 1000, 'application/pdf'),
        name: 'Test Model',
        category: 'Furniture',
        subcategory: 'Seating'
      })

      const request = new NextRequest('http://localhost:3000/api/models/upload', {
        method: 'POST',
        body: formData
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid file type')
    })

    test('should reject files without extension', async () => {
      const formData = createFormData({
        file: createMockFile('model', 1000),
        name: 'Test Model',
        category: 'Furniture',
        subcategory: 'Seating'
      })

      const request = new NextRequest('http://localhost:3000/api/models/upload', {
        method: 'POST',
        body: formData
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid file type')
    })
  })

  describe('POST /api/models/upload - Metadata Validation', () => {
    test('should require name', async () => {
      const formData = createFormData({
        file: createMockFile('model.glb', 1000),
        category: 'Furniture',
        subcategory: 'Seating'
      })

      const request = new NextRequest('http://localhost:3000/api/models/upload', {
        method: 'POST',
        body: formData
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('required')
    })

    test('should require category', async () => {
      const formData = createFormData({
        file: createMockFile('model.glb', 1000),
        name: 'Test Model',
        subcategory: 'Seating'
      })

      const request = new NextRequest('http://localhost:3000/api/models/upload', {
        method: 'POST',
        body: formData
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('required')
    })

    test('should require subcategory', async () => {
      const formData = createFormData({
        file: createMockFile('model.glb', 1000),
        name: 'Test Model',
        category: 'Furniture'
      })

      const request = new NextRequest('http://localhost:3000/api/models/upload', {
        method: 'POST',
        body: formData
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('required')
    })

    test('should validate license type', async () => {
      const formData = createFormData({
        file: createMockFile('model.glb', 1000),
        name: 'Test Model',
        category: 'Furniture',
        subcategory: 'Seating',
        license: 'invalid'
      })

      const request = new NextRequest('http://localhost:3000/api/models/upload', {
        method: 'POST',
        body: formData
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid license type')
    })

    test('should parse dimensions JSON', async () => {
      mockSupabase.storage.upload.mockResolvedValue({ data: { path: 'test.glb' }, error: null })
      mockSupabase.storage.getPublicUrl.mockReturnValue({ data: { publicUrl: 'http://example.com/test.glb' } })
      ;(createModel as jest.Mock).mockResolvedValue({ id: 'model-123' })

      const formData = createFormData({
        file: createMockFile('model.glb', 1000),
        name: 'Test Model',
        category: 'Furniture',
        subcategory: 'Seating',
        dimensions: { width: 2, height: 1, depth: 1.5, unit: 'meters' }
      })

      const request = new NextRequest('http://localhost:3000/api/models/upload', {
        method: 'POST',
        body: formData
      })

      const response = await POST(request)

      expect(response.status).toBe(201)
      expect(createModel).toHaveBeenCalledWith(expect.objectContaining({
        dimensions: { width: 2, height: 1, depth: 1.5, unit: 'meters' }
      }))
    })

    test('should handle invalid dimensions JSON', async () => {
      const formData = new FormData()
      formData.append('file', createMockFile('model.glb', 1000))
      formData.append('name', 'Test Model')
      formData.append('category', 'Furniture')
      formData.append('subcategory', 'Seating')
      formData.append('dimensions', 'invalid json')

      const request = new NextRequest('http://localhost:3000/api/models/upload', {
        method: 'POST',
        body: formData
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid dimensions format')
    })

    test('should parse comma-separated tags', async () => {
      mockSupabase.storage.upload.mockResolvedValue({ data: { path: 'test.glb' }, error: null })
      mockSupabase.storage.getPublicUrl.mockReturnValue({ data: { publicUrl: 'http://example.com/test.glb' } })
      ;(createModel as jest.Mock).mockResolvedValue({ id: 'model-123' })

      const formData = createFormData({
        file: createMockFile('model.glb', 1000),
        name: 'Test Model',
        category: 'Furniture',
        subcategory: 'Seating',
        tags: 'modern, chair, wood'
      })

      const request = new NextRequest('http://localhost:3000/api/models/upload', {
        method: 'POST',
        body: formData
      })

      await POST(request)

      expect(createModel).toHaveBeenCalledWith(expect.objectContaining({
        tags: ['modern', 'chair', 'wood']
      }))
    })
  })

  describe('POST /api/models/upload - File Upload', () => {
    test('should upload file to Supabase storage', async () => {
      mockSupabase.storage.upload.mockResolvedValue({ data: { path: 'test.glb' }, error: null })
      mockSupabase.storage.getPublicUrl.mockReturnValue({ data: { publicUrl: 'http://example.com/test.glb' } })
      ;(createModel as jest.Mock).mockResolvedValue({ id: 'model-123' })

      const formData = createFormData({
        file: createMockFile('model.glb', 1000),
        name: 'Test Model',
        category: 'Furniture',
        subcategory: 'Seating'
      })

      const request = new NextRequest('http://localhost:3000/api/models/upload', {
        method: 'POST',
        body: formData
      })

      await POST(request)

      expect(mockSupabase.storage.from).toHaveBeenCalledWith('model-library')
      expect(mockSupabase.storage.upload).toHaveBeenCalled()
    })

    test('should handle storage upload errors', async () => {
      mockSupabase.storage.upload.mockResolvedValue({
        data: null,
        error: new Error('Storage error')
      })

      const formData = createFormData({
        file: createMockFile('model.glb', 1000),
        name: 'Test Model',
        category: 'Furniture',
        subcategory: 'Seating'
      })

      const request = new NextRequest('http://localhost:3000/api/models/upload', {
        method: 'POST',
        body: formData
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to upload file')
    })

    test('should generate unique file path', async () => {
      mockSupabase.storage.upload.mockResolvedValue({ data: { path: 'test.glb' }, error: null })
      mockSupabase.storage.getPublicUrl.mockReturnValue({ data: { publicUrl: 'http://example.com/test.glb' } })
      ;(createModel as jest.Mock).mockResolvedValue({ id: 'model-123' })

      const formData = createFormData({
        file: createMockFile('model.glb', 1000),
        name: 'Test Model',
        category: 'Furniture',
        subcategory: 'Seating'
      })

      const request = new NextRequest('http://localhost:3000/api/models/upload', {
        method: 'POST',
        body: formData
      })

      await POST(request)

      const uploadCall = mockSupabase.storage.upload.mock.calls[0]
      const filePath = uploadCall[0]

      expect(filePath).toContain('models/')
      expect(filePath).toContain('user-123')
      expect(filePath).toContain('model.glb')
    })

    test('should upload thumbnail if provided', async () => {
      mockSupabase.storage.upload.mockResolvedValue({ data: { path: 'test' }, error: null })
      mockSupabase.storage.getPublicUrl.mockReturnValue({ data: { publicUrl: 'http://example.com/test' } })
      ;(createModel as jest.Mock).mockResolvedValue({ id: 'model-123' })

      const formData = createFormData({
        file: createMockFile('model.glb', 1000),
        thumbnail: createMockFile('thumb.jpg', 500, 'image/jpeg'),
        name: 'Test Model',
        category: 'Furniture',
        subcategory: 'Seating'
      })

      const request = new NextRequest('http://localhost:3000/api/models/upload', {
        method: 'POST',
        body: formData
      })

      await POST(request)

      expect(mockSupabase.storage.upload).toHaveBeenCalledTimes(2)
    })

    test('should handle thumbnail upload errors gracefully', async () => {
      mockSupabase.storage.upload
        .mockResolvedValueOnce({ data: { path: 'model.glb' }, error: null })
        .mockResolvedValueOnce({ data: null, error: new Error('Thumbnail error') })
      mockSupabase.storage.getPublicUrl.mockReturnValue({ data: { publicUrl: 'http://example.com/test' } })
      ;(createModel as jest.Mock).mockResolvedValue({ id: 'model-123' })

      const formData = createFormData({
        file: createMockFile('model.glb', 1000),
        thumbnail: createMockFile('thumb.jpg', 500, 'image/jpeg'),
        name: 'Test Model',
        category: 'Furniture',
        subcategory: 'Seating'
      })

      const request = new NextRequest('http://localhost:3000/api/models/upload', {
        method: 'POST',
        body: formData
      })

      const response = await POST(request)

      // Should still succeed with placeholder thumbnail
      expect(response.status).toBe(201)
    })
  })

  describe('POST /api/models/upload - Model Creation', () => {
    test('should create model record with all data', async () => {
      mockSupabase.storage.upload.mockResolvedValue({ data: { path: 'test.glb' }, error: null })
      mockSupabase.storage.getPublicUrl.mockReturnValue({ data: { publicUrl: 'http://example.com/test.glb' } })
      const createdModel = { id: 'model-123', name: 'Test Model' }
      ;(createModel as jest.Mock).mockResolvedValue(createdModel)

      const formData = createFormData({
        file: createMockFile('model.glb', 1000),
        name: 'Test Model',
        description: 'A test model',
        category: 'Furniture',
        subcategory: 'Seating',
        tags: 'modern, chair',
        style: 'Modern',
        materials: 'Wood, Fabric',
        license: 'free',
        author: 'Test Author',
        poly_count: '5000',
        has_textures: 'true'
      })

      const request = new NextRequest('http://localhost:3000/api/models/upload', {
        method: 'POST',
        body: formData
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.model).toEqual(createdModel)
      expect(createModel).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Test Model',
        description: 'A test model',
        category: 'Furniture',
        subcategory: 'Seating',
        license: 'free',
        author: 'Test Author',
        poly_count: 5000,
        has_textures: true
      }))
    })

    test('should use default values for optional fields', async () => {
      mockSupabase.storage.upload.mockResolvedValue({ data: { path: 'test.glb' }, error: null })
      mockSupabase.storage.getPublicUrl.mockReturnValue({ data: { publicUrl: 'http://example.com/test.glb' } })
      ;(createModel as jest.Mock).mockResolvedValue({ id: 'model-123' })

      const formData = createFormData({
        file: createMockFile('model.glb', 1000),
        name: 'Test Model',
        category: 'Furniture',
        subcategory: 'Seating'
      })

      const request = new NextRequest('http://localhost:3000/api/models/upload', {
        method: 'POST',
        body: formData
      })

      await POST(request)

      expect(createModel).toHaveBeenCalledWith(expect.objectContaining({
        description: '',
        tags: [],
        style: [],
        materials: [],
        license: 'free',
        poly_count: 10000,
        has_textures: false
      }))
    })

    test('should handle model creation errors', async () => {
      mockSupabase.storage.upload.mockResolvedValue({ data: { path: 'test.glb' }, error: null })
      mockSupabase.storage.getPublicUrl.mockReturnValue({ data: { publicUrl: 'http://example.com/test.glb' } })
      ;(createModel as jest.Mock).mockRejectedValue(new Error('Database error'))

      const formData = createFormData({
        file: createMockFile('model.glb', 1000),
        name: 'Test Model',
        category: 'Furniture',
        subcategory: 'Seating'
      })

      const request = new NextRequest('http://localhost:3000/api/models/upload', {
        method: 'POST',
        body: formData
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBeDefined()
    })

    test('should return created model in response', async () => {
      mockSupabase.storage.upload.mockResolvedValue({ data: { path: 'test.glb' }, error: null })
      mockSupabase.storage.getPublicUrl.mockReturnValue({ data: { publicUrl: 'http://example.com/test.glb' } })
      const createdModel = {
        id: 'model-123',
        name: 'Test Model',
        downloads: 0,
        rating: 0
      }
      ;(createModel as jest.Mock).mockResolvedValue(createdModel)

      const formData = createFormData({
        file: createMockFile('model.glb', 1000),
        name: 'Test Model',
        category: 'Furniture',
        subcategory: 'Seating'
      })

      const request = new NextRequest('http://localhost:3000/api/models/upload', {
        method: 'POST',
        body: formData
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.model).toEqual(createdModel)
      expect(data.message).toBe('Model uploaded successfully')
    })

    test('should store file size from uploaded file', async () => {
      mockSupabase.storage.upload.mockResolvedValue({ data: { path: 'test.glb' }, error: null })
      mockSupabase.storage.getPublicUrl.mockReturnValue({ data: { publicUrl: 'http://example.com/test.glb' } })
      ;(createModel as jest.Mock).mockResolvedValue({ id: 'model-123' })

      const fileSize = 2500000 // 2.5MB
      const formData = createFormData({
        file: createMockFile('model.glb', fileSize),
        name: 'Test Model',
        category: 'Furniture',
        subcategory: 'Seating'
      })

      const request = new NextRequest('http://localhost:3000/api/models/upload', {
        method: 'POST',
        body: formData
      })

      await POST(request)

      expect(createModel).toHaveBeenCalledWith(expect.objectContaining({
        file_size: fileSize
      }))
    })

    test('should use session user name as default author', async () => {
      mockSupabase.storage.upload.mockResolvedValue({ data: { path: 'test.glb' }, error: null })
      mockSupabase.storage.getPublicUrl.mockReturnValue({ data: { publicUrl: 'http://example.com/test.glb' } })
      ;(createModel as jest.Mock).mockResolvedValue({ id: 'model-123' })

      const formData = createFormData({
        file: createMockFile('model.glb', 1000),
        name: 'Test Model',
        category: 'Furniture',
        subcategory: 'Seating'
      })

      const request = new NextRequest('http://localhost:3000/api/models/upload', {
        method: 'POST',
        body: formData
      })

      await POST(request)

      expect(createModel).toHaveBeenCalledWith(expect.objectContaining({
        author: 'Test User'
      }))
    })
  })

  describe('POST /api/models/upload - Edge Cases', () => {
    test('should handle case-insensitive file extensions', async () => {
      mockSupabase.storage.upload.mockResolvedValue({ data: { path: 'test.GLB' }, error: null })
      mockSupabase.storage.getPublicUrl.mockReturnValue({ data: { publicUrl: 'http://example.com/test.GLB' } })
      ;(createModel as jest.Mock).mockResolvedValue({ id: 'model-123' })

      const formData = createFormData({
        file: createMockFile('model.GLB', 1000),
        name: 'Test Model',
        category: 'Furniture',
        subcategory: 'Seating'
      })

      const request = new NextRequest('http://localhost:3000/api/models/upload', {
        method: 'POST',
        body: formData
      })

      const response = await POST(request)

      expect(response.status).toBe(201)
    })

    test('should trim whitespace from tags', async () => {
      mockSupabase.storage.upload.mockResolvedValue({ data: { path: 'test.glb' }, error: null })
      mockSupabase.storage.getPublicUrl.mockReturnValue({ data: { publicUrl: 'http://example.com/test.glb' } })
      ;(createModel as jest.Mock).mockResolvedValue({ id: 'model-123' })

      const formData = createFormData({
        file: createMockFile('model.glb', 1000),
        name: 'Test Model',
        category: 'Furniture',
        subcategory: 'Seating',
        tags: '  modern  ,  chair  ,  wood  '
      })

      const request = new NextRequest('http://localhost:3000/api/models/upload', {
        method: 'POST',
        body: formData
      })

      await POST(request)

      expect(createModel).toHaveBeenCalledWith(expect.objectContaining({
        tags: ['modern', 'chair', 'wood']
      }))
    })

    test('should handle empty optional fields', async () => {
      mockSupabase.storage.upload.mockResolvedValue({ data: { path: 'test.glb' }, error: null })
      mockSupabase.storage.getPublicUrl.mockReturnValue({ data: { publicUrl: 'http://example.com/test.glb' } })
      ;(createModel as jest.Mock).mockResolvedValue({ id: 'model-123' })

      const formData = createFormData({
        file: createMockFile('model.glb', 1000),
        name: 'Test Model',
        category: 'Furniture',
        subcategory: 'Seating',
        tags: '',
        style: '',
        materials: ''
      })

      const request = new NextRequest('http://localhost:3000/api/models/upload', {
        method: 'POST',
        body: formData
      })

      const response = await POST(request)

      expect(response.status).toBe(201)
    })
  })
})
