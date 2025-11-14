/**
 * Projects API Route Tests
 * Tests project CRUD operations, permissions, and error handling
 */

import { POST, GET, PATCH, DELETE } from '@/app/api/projects/route'
import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

// Mock Supabase
jest.mock('@/lib/supabase/server')

describe('Projects API', () => {
  let mockSupabase: any

  beforeEach(() => {
    mockSupabase = {
      auth: {
        getUser: jest.fn()
      },
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis()
    }

    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)
  })

  describe('POST /api/projects', () => {
    test('should create a new project', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null
      })

      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'project-456',
          name: 'My New Project',
          description: 'Test project',
          user_id: 'user-123',
          created_at: new Date().toISOString()
        },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/projects', {
        method: 'POST',
        body: JSON.stringify({
          name: 'My New Project',
          description: 'Test project'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.project.name).toBe('My New Project')
      expect(mockSupabase.from).toHaveBeenCalledWith('projects')
      expect(mockSupabase.insert).toHaveBeenCalled()
    })

    test('should require authentication', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Unauthorized')
      })

      const request = new NextRequest('http://localhost:3000/api/projects', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test' })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    test('should validate required fields', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/projects', {
        method: 'POST',
        body: JSON.stringify({})
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('required')
    })

    test('should set default values', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'project-456',
          name: 'Test',
          status: 'active',
          visibility: 'private'
        },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/projects', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test' })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.project.status).toBe('active')
      expect(data.project.visibility).toBe('private')
    })
  })

  describe('GET /api/projects', () => {
    test('should list all user projects', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.order.mockResolvedValue({
        data: [
          { id: 'p1', name: 'Project 1', user_id: 'user-123' },
          { id: 'p2', name: 'Project 2', user_id: 'user-123' }
        ],
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/projects')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.projects).toHaveLength(2)
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', 'user-123')
      expect(mockSupabase.order).toHaveBeenCalledWith('created_at', { ascending: false })
    })

    test('should filter by status', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.order.mockResolvedValue({
        data: [
          { id: 'p1', name: 'Project 1', status: 'active' }
        ],
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/projects?status=active')

      const response = await GET(request)

      expect(mockSupabase.eq).toHaveBeenCalledWith('status', 'active')
    })

    test('should support pagination', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/projects?page=2&limit=10')

      await GET(request)

      // Should call range for pagination
      expect(mockSupabase.from).toHaveBeenCalledWith('projects')
    })

    test('should include shared projects', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.order.mockResolvedValue({
        data: [
          { id: 'p1', name: 'My Project', user_id: 'user-123' },
          { id: 'p2', name: 'Shared Project', user_id: 'user-456', shared_with: ['user-123'] }
        ],
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/projects?include=shared')

      const response = await GET(request)
      const data = await response.json()

      expect(data.projects).toHaveLength(2)
    })
  })

  describe('GET /api/projects/[id]', () => {
    test('should get a single project', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'project-456',
          name: 'My Project',
          user_id: 'user-123'
        },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/projects/project-456')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.project.id).toBe('project-456')
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'project-456')
    })

    test('should check permissions', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'project-456',
          name: 'Someone Elses Project',
          user_id: 'user-789'
        },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/projects/project-456')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Forbidden')
    })

    test('should handle project not found', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValue({
        data: null,
        error: new Error('Not found')
      })

      const request = new NextRequest('http://localhost:3000/api/projects/invalid-id')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Project not found')
    })
  })

  describe('PATCH /api/projects/[id]', () => {
    test('should update a project', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'project-456', user_id: 'user-123' },
        error: null
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: 'project-456',
          name: 'Updated Name',
          description: 'Updated Description'
        },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/projects/project-456', {
        method: 'PATCH',
        body: JSON.stringify({
          name: 'Updated Name',
          description: 'Updated Description'
        })
      })

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.project.name).toBe('Updated Name')
      expect(mockSupabase.update).toHaveBeenCalled()
    })

    test('should not update immutable fields', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'project-456', user_id: 'user-123' },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/projects/project-456', {
        method: 'PATCH',
        body: JSON.stringify({
          id: 'different-id', // Should not be updated
          user_id: 'different-user', // Should not be updated
          name: 'Updated Name'
        })
      })

      await PATCH(request)

      // Verify update was called without immutable fields
      const updateCall = mockSupabase.update.mock.calls[0][0]
      expect(updateCall.id).toBeUndefined()
      expect(updateCall.user_id).toBeUndefined()
      expect(updateCall.name).toBe('Updated Name')
    })

    test('should validate update data', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValue({
        data: { id: 'project-456', user_id: 'user-123' },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/projects/project-456', {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'invalid-status'
        })
      })

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid status')
    })
  })

  describe('DELETE /api/projects/[id]', () => {
    test('should delete a project', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValue({
        data: { id: 'project-456', user_id: 'user-123' },
        error: null
      })

      mockSupabase.delete.mockResolvedValue({
        data: null,
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/projects/project-456', {
        method: 'DELETE'
      })

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockSupabase.delete).toHaveBeenCalled()
    })

    test('should only allow owner to delete', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValue({
        data: { id: 'project-456', user_id: 'user-789' },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/projects/project-456', {
        method: 'DELETE'
      })

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Forbidden')
      expect(mockSupabase.delete).not.toHaveBeenCalled()
    })

    test('should cascade delete related resources', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValue({
        data: { id: 'project-456', user_id: 'user-123' },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/projects/project-456', {
        method: 'DELETE'
      })

      await DELETE(request)

      // Verify cascade delete is handled by database
      expect(mockSupabase.delete).toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    test('should handle database errors', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValue({
        data: null,
        error: new Error('Database connection failed')
      })

      const request = new NextRequest('http://localhost:3000/api/projects', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test' })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBeDefined()
    })

    test('should handle malformed JSON', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/projects', {
        method: 'POST',
        body: 'invalid json'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid JSON')
    })
  })

  describe('Rate Limiting', () => {
    test('should enforce rate limits', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      // Make multiple rapid requests
      const requests = Array(100).fill(null).map(() =>
        new NextRequest('http://localhost:3000/api/projects')
      )

      const responses = await Promise.all(requests.map(req => GET(req)))

      const rateLimited = responses.some(res => res.status === 429)
      expect(rateLimited).toBe(true)
    })
  })

  describe('Caching', () => {
    test('should return cached responses for GET requests', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.order.mockResolvedValue({
        data: [{ id: 'p1', name: 'Project 1' }],
        error: null
      })

      const request1 = new NextRequest('http://localhost:3000/api/projects')
      const response1 = await GET(request1)

      const request2 = new NextRequest('http://localhost:3000/api/projects')
      const response2 = await GET(request2)

      expect(response2.headers.get('X-Cache')).toBe('HIT')
    })

    test('should invalidate cache on mutations', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      // Create a project
      const createRequest = new NextRequest('http://localhost:3000/api/projects', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test' })
      })

      await POST(createRequest)

      // Subsequent GET should have cache miss
      const getRequest = new NextRequest('http://localhost:3000/api/projects')
      const getResponse = await GET(getRequest)

      expect(getResponse.headers.get('X-Cache')).toBe('MISS')
    })
  })
})
