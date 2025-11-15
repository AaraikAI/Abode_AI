/**
 * Analytics Dashboards API Tests
 * Comprehensive test suite for dashboard management and visualization
 */

import { GET, POST, PUT, DELETE } from '@/app/api/analytics/dashboards/route'
import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

// Mock Supabase
jest.mock('@/lib/supabase/server')

describe('Analytics Dashboards API', () => {
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
      or: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis()
    }

    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)
  })

  describe('GET /api/analytics/dashboards', () => {
    test('should list all accessible dashboards', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.range.mockResolvedValue({
        data: [
          { id: 'dash-1', name: 'Overview', type: 'overview', user_id: 'user-123' },
          { id: 'dash-2', name: 'Project Dashboard', type: 'project', user_id: 'user-123' }
        ],
        count: 2,
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/analytics/dashboards')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.dashboards).toHaveLength(2)
      expect(data.pagination.total).toBe(2)
    })

    test('should require authentication', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Unauthorized')
      })

      const request = new NextRequest('http://localhost:3000/api/analytics/dashboards')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    test('should filter dashboards by type', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.range.mockResolvedValue({
        data: [{ id: 'dash-1', type: 'energy' }],
        count: 1,
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/analytics/dashboards?type=energy')
      await GET(request)

      expect(mockSupabase.eq).toHaveBeenCalledWith('type', 'energy')
    })

    test('should filter dashboards by category', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.range.mockResolvedValue({
        data: [{ id: 'dash-1', category: 'performance' }],
        count: 1,
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/analytics/dashboards?category=performance')
      await GET(request)

      expect(mockSupabase.eq).toHaveBeenCalledWith('category', 'performance')
    })

    test('should filter by shared status - true', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.range.mockResolvedValue({
        data: [],
        count: 0,
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/analytics/dashboards?shared=true')
      await GET(request)

      expect(mockSupabase.eq).toHaveBeenCalledWith('shared', true)
    })

    test('should filter by shared status - false', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.range.mockResolvedValue({
        data: [],
        count: 0,
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/analytics/dashboards?shared=false')
      await GET(request)

      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', 'user-123')
    })

    test('should search dashboards by name', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.range.mockResolvedValue({
        data: [],
        count: 0,
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/analytics/dashboards?search=energy')
      await GET(request)

      expect(mockSupabase.or).toHaveBeenCalled()
    })

    test('should support pagination', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.range.mockResolvedValue({
        data: [],
        count: 100,
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/analytics/dashboards?page=2&limit=20')
      const response = await GET(request)
      const data = await response.json()

      expect(mockSupabase.range).toHaveBeenCalledWith(20, 39)
      expect(data.pagination.page).toBe(2)
      expect(data.pagination.limit).toBe(20)
      expect(data.pagination.totalPages).toBe(5)
    })

    test('should order by updated_at descending', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.range.mockResolvedValue({
        data: [],
        count: 0,
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/analytics/dashboards')
      await GET(request)

      expect(mockSupabase.order).toHaveBeenCalledWith('updated_at', { ascending: false })
    })

    test('should handle database errors', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.range.mockResolvedValue({
        data: null,
        error: new Error('Database error')
      })

      const request = new NextRequest('http://localhost:3000/api/analytics/dashboards')
      const response = await GET(request)

      expect(response.status).toBe(500)
    })
  })

  describe('POST /api/analytics/dashboards', () => {
    test('should create a new dashboard', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'dash-new',
          name: 'My Dashboard',
          type: 'custom',
          user_id: 'user-123'
        },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/analytics/dashboards', {
        method: 'POST',
        body: JSON.stringify({
          name: 'My Dashboard',
          type: 'custom',
          description: 'Custom analytics dashboard'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.dashboard.name).toBe('My Dashboard')
    })

    test('should require authentication', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Unauthorized')
      })

      const request = new NextRequest('http://localhost:3000/api/analytics/dashboards', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test', type: 'custom' })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    test('should require dashboard name', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/analytics/dashboards', {
        method: 'POST',
        body: JSON.stringify({ type: 'custom' })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('name is required')
    })

    test('should require dashboard type', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/analytics/dashboards', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test Dashboard' })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('type is required')
    })

    test('should validate dashboard type', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/analytics/dashboards', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test',
          type: 'invalid-type'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid type')
    })

    test('should accept all valid dashboard types', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValue({
        data: { id: 'dash-1' },
        error: null
      })

      const validTypes = ['overview', 'project', 'energy', 'cost', 'custom']

      for (const type of validTypes) {
        const request = new NextRequest('http://localhost:3000/api/analytics/dashboards', {
          method: 'POST',
          body: JSON.stringify({ name: 'Test', type })
        })

        const response = await POST(request)
        expect(response.status).toBe(201)
      }
    })

    test('should validate category', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/analytics/dashboards', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test',
          type: 'custom',
          category: 'invalid-category'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid category')
    })

    test('should accept valid categories', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValue({
        data: { id: 'dash-1' },
        error: null
      })

      const validCategories = ['performance', 'analytics', 'monitoring', 'reporting', 'custom']

      for (const category of validCategories) {
        const request = new NextRequest('http://localhost:3000/api/analytics/dashboards', {
          method: 'POST',
          body: JSON.stringify({ name: 'Test', type: 'custom', category })
        })

        const response = await POST(request)
        expect(response.status).toBe(201)
      }
    })

    test('should validate widgets array', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/analytics/dashboards', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test',
          type: 'custom',
          widgets: 'not-an-array'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Widgets must be an array')
    })

    test('should validate widget structure', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/analytics/dashboards', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test',
          type: 'custom',
          widgets: [{ invalid: 'widget' }]
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('widget must have a type and id')
    })

    test('should accept valid widgets', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValue({
        data: { id: 'dash-1' },
        error: null
      })

      const widgets = [
        { id: 'w1', type: 'chart', config: {} },
        { id: 'w2', type: 'table', config: {} }
      ]

      const request = new NextRequest('http://localhost:3000/api/analytics/dashboards', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test',
          type: 'custom',
          widgets
        })
      })

      const response = await POST(request)
      expect(response.status).toBe(201)
    })

    test('should set shared to false by default', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValue({
        data: { id: 'dash-1' },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/analytics/dashboards', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test',
          type: 'custom'
        })
      })

      await POST(request)

      const insertCall = mockSupabase.insert.mock.calls[0][0]
      expect(insertCall.shared).toBe(false)
    })

    test('should handle database errors', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValue({
        data: null,
        error: new Error('Database error')
      })

      const request = new NextRequest('http://localhost:3000/api/analytics/dashboards', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test', type: 'custom' })
      })

      const response = await POST(request)

      expect(response.status).toBe(500)
    })
  })

  describe('PUT /api/analytics/dashboards', () => {
    test('should update dashboard', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'dash-1', user_id: 'user-123', name: 'Old Name' },
        error: null
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'dash-1', name: 'New Name' },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/analytics/dashboards', {
        method: 'PUT',
        body: JSON.stringify({
          dashboardId: 'dash-1',
          name: 'New Name'
        })
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.dashboard.name).toBe('New Name')
    })

    test('should require authentication', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Unauthorized')
      })

      const request = new NextRequest('http://localhost:3000/api/analytics/dashboards', {
        method: 'PUT',
        body: JSON.stringify({ dashboardId: 'dash-1' })
      })

      const response = await PUT(request)

      expect(response.status).toBe(401)
    })

    test('should require dashboardId', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/analytics/dashboards', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Updated' })
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Dashboard ID is required')
    })

    test('should verify dashboard ownership', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValue({
        data: null,
        error: new Error('Not found')
      })

      const request = new NextRequest('http://localhost:3000/api/analytics/dashboards', {
        method: 'PUT',
        body: JSON.stringify({ dashboardId: 'dash-404' })
      })

      const response = await PUT(request)

      expect(response.status).toBe(404)
    })

    test('should validate type on update', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValue({
        data: { id: 'dash-1', user_id: 'user-123' },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/analytics/dashboards', {
        method: 'PUT',
        body: JSON.stringify({
          dashboardId: 'dash-1',
          type: 'invalid-type'
        })
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid type')
    })

    test('should validate category on update', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValue({
        data: { id: 'dash-1', user_id: 'user-123' },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/analytics/dashboards', {
        method: 'PUT',
        body: JSON.stringify({
          dashboardId: 'dash-1',
          category: 'invalid-category'
        })
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid category')
    })

    test('should update widgets', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'dash-1', user_id: 'user-123' },
        error: null
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'dash-1' },
        error: null
      })

      const newWidgets = [{ id: 'w3', type: 'gauge' }]

      const request = new NextRequest('http://localhost:3000/api/analytics/dashboards', {
        method: 'PUT',
        body: JSON.stringify({
          dashboardId: 'dash-1',
          widgets: newWidgets
        })
      })

      await PUT(request)

      const updateCall = mockSupabase.update.mock.calls[0][0]
      expect(updateCall.widgets).toEqual(newWidgets)
    })

    test('should update shared status', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'dash-1', user_id: 'user-123', shared: false },
        error: null
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'dash-1', shared: true },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/analytics/dashboards', {
        method: 'PUT',
        body: JSON.stringify({
          dashboardId: 'dash-1',
          shared: true
        })
      })

      await PUT(request)

      const updateCall = mockSupabase.update.mock.calls[0][0]
      expect(updateCall.shared).toBe(true)
    })

    test('should update timestamp', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'dash-1', user_id: 'user-123' },
        error: null
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'dash-1' },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/analytics/dashboards', {
        method: 'PUT',
        body: JSON.stringify({
          dashboardId: 'dash-1',
          name: 'Updated'
        })
      })

      await PUT(request)

      const updateCall = mockSupabase.update.mock.calls[0][0]
      expect(updateCall.updated_at).toBeDefined()
    })

    test('should handle database errors', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValue({
        data: { id: 'dash-1', user_id: 'user-123' },
        error: null
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: new Error('Database error')
      })

      const request = new NextRequest('http://localhost:3000/api/analytics/dashboards', {
        method: 'PUT',
        body: JSON.stringify({
          dashboardId: 'dash-1',
          name: 'Updated'
        })
      })

      const response = await PUT(request)

      expect(response.status).toBe(500)
    })
  })

  describe('DELETE /api/analytics/dashboards', () => {
    test('should delete dashboard', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValue({
        data: { id: 'dash-1', user_id: 'user-123' },
        error: null
      })

      mockSupabase.delete.mockResolvedValue({
        data: null,
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/analytics/dashboards?dashboardId=dash-1', {
        method: 'DELETE'
      })

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    test('should require authentication', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Unauthorized')
      })

      const request = new NextRequest('http://localhost:3000/api/analytics/dashboards?dashboardId=dash-1', {
        method: 'DELETE'
      })

      const response = await DELETE(request)

      expect(response.status).toBe(401)
    })

    test('should require dashboardId', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/analytics/dashboards', {
        method: 'DELETE'
      })

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Dashboard ID is required')
    })

    test('should verify dashboard ownership before delete', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValue({
        data: null,
        error: new Error('Not found')
      })

      const request = new NextRequest('http://localhost:3000/api/analytics/dashboards?dashboardId=dash-404', {
        method: 'DELETE'
      })

      const response = await DELETE(request)

      expect(response.status).toBe(404)
    })

    test('should handle database errors on delete', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValue({
        data: { id: 'dash-1', user_id: 'user-123' },
        error: null
      })

      mockSupabase.delete.mockResolvedValue({
        data: null,
        error: new Error('Database error')
      })

      const request = new NextRequest('http://localhost:3000/api/analytics/dashboards?dashboardId=dash-1', {
        method: 'DELETE'
      })

      const response = await DELETE(request)

      expect(response.status).toBe(500)
    })
  })
})
