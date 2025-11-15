/**
 * Analytics Reports API Tests
 * Comprehensive test suite for report generation and export
 */

import { GET, POST } from '@/app/api/analytics/reports/route'
import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

// Mock Supabase
jest.mock('@/lib/supabase/server')

describe('Analytics Reports API', () => {
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
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis()
    }

    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)
  })

  describe('GET /api/analytics/reports', () => {
    test('should list all user reports', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.range.mockResolvedValue({
        data: [
          { id: 'rep-1', name: 'Monthly Report', type: 'project-summary', status: 'completed' },
          { id: 'rep-2', name: 'Energy Report', type: 'energy-usage', status: 'completed' }
        ],
        count: 2,
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/analytics/reports')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.reports).toHaveLength(2)
      expect(data.pagination.total).toBe(2)
    })

    test('should require authentication', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Unauthorized')
      })

      const request = new NextRequest('http://localhost:3000/api/analytics/reports')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    test('should filter reports by type', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.range.mockResolvedValue({
        data: [{ id: 'rep-1', type: 'energy-usage' }],
        count: 1,
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/analytics/reports?type=energy-usage')
      await GET(request)

      expect(mockSupabase.eq).toHaveBeenCalledWith('type', 'energy-usage')
    })

    test('should filter reports by status', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.range.mockResolvedValue({
        data: [{ id: 'rep-1', status: 'generating' }],
        count: 1,
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/analytics/reports?status=generating')
      await GET(request)

      expect(mockSupabase.eq).toHaveBeenCalledWith('status', 'generating')
    })

    test('should filter reports by projectId', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.range.mockResolvedValue({
        data: [],
        count: 0,
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/analytics/reports?projectId=proj-123')
      await GET(request)

      expect(mockSupabase.eq).toHaveBeenCalledWith('project_id', 'proj-123')
    })

    test('should filter reports by date range - start date', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.range.mockResolvedValue({
        data: [],
        count: 0,
        error: null
      })

      const startDate = '2024-01-01'
      const request = new NextRequest(`http://localhost:3000/api/analytics/reports?startDate=${startDate}`)
      await GET(request)

      expect(mockSupabase.gte).toHaveBeenCalledWith('created_at', startDate)
    })

    test('should filter reports by date range - end date', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.range.mockResolvedValue({
        data: [],
        count: 0,
        error: null
      })

      const endDate = '2024-12-31'
      const request = new NextRequest(`http://localhost:3000/api/analytics/reports?endDate=${endDate}`)
      await GET(request)

      expect(mockSupabase.lte).toHaveBeenCalledWith('created_at', endDate)
    })

    test('should search reports by name', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.range.mockResolvedValue({
        data: [],
        count: 0,
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/analytics/reports?search=monthly')
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
        count: 50,
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/analytics/reports?page=3&limit=10')
      const response = await GET(request)
      const data = await response.json()

      expect(mockSupabase.range).toHaveBeenCalledWith(20, 29)
      expect(data.pagination.page).toBe(3)
      expect(data.pagination.limit).toBe(10)
      expect(data.pagination.totalPages).toBe(5)
    })

    test('should order by created_at descending', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.range.mockResolvedValue({
        data: [],
        count: 0,
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/analytics/reports')
      await GET(request)

      expect(mockSupabase.order).toHaveBeenCalledWith('created_at', { ascending: false })
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

      const request = new NextRequest('http://localhost:3000/api/analytics/reports')
      const response = await GET(request)

      expect(response.status).toBe(500)
    })
  })

  describe('POST /api/analytics/reports', () => {
    test('should generate a new report', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'rep-new',
          name: 'New Report',
          type: 'project-summary',
          status: 'generating',
          user_id: 'user-123'
        },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/analytics/reports', {
        method: 'POST',
        body: JSON.stringify({
          name: 'New Report',
          type: 'project-summary',
          format: 'pdf'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.report.status).toBe('generating')
      expect(data.report.estimatedCompletionTime).toBeDefined()
    })

    test('should require authentication', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Unauthorized')
      })

      const request = new NextRequest('http://localhost:3000/api/analytics/reports', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test', type: 'custom' })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    test('should require report name', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/analytics/reports', {
        method: 'POST',
        body: JSON.stringify({ type: 'project-summary' })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('name is required')
    })

    test('should require report type', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/analytics/reports', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test Report' })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('type is required')
    })

    test('should validate report type', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/analytics/reports', {
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

    test('should accept all valid report types', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValue({
        data: { id: 'rep-1', status: 'generating' },
        error: null
      })

      const validTypes = [
        'project-summary',
        'energy-usage',
        'cost-analysis',
        'performance',
        'compliance',
        'sustainability',
        'custom'
      ]

      for (const type of validTypes) {
        const request = new NextRequest('http://localhost:3000/api/analytics/reports', {
          method: 'POST',
          body: JSON.stringify({ name: 'Test', type })
        })

        const response = await POST(request)
        expect(response.status).toBe(201)
      }
    })

    test('should validate export format', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/analytics/reports', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test',
          type: 'custom',
          format: 'invalid-format'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid format')
    })

    test('should accept PDF format', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValue({
        data: { id: 'rep-1', format: 'pdf' },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/analytics/reports', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test',
          type: 'custom',
          format: 'pdf'
        })
      })

      const response = await POST(request)
      expect(response.status).toBe(201)
    })

    test('should accept CSV format', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValue({
        data: { id: 'rep-1', format: 'csv' },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/analytics/reports', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test',
          type: 'custom',
          format: 'csv'
        })
      })

      const response = await POST(request)
      expect(response.status).toBe(201)
    })

    test('should accept Excel format', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValue({
        data: { id: 'rep-1', format: 'excel' },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/analytics/reports', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test',
          type: 'custom',
          format: 'excel'
        })
      })

      const response = await POST(request)
      expect(response.status).toBe(201)
    })

    test('should accept JSON format', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValue({
        data: { id: 'rep-1', format: 'json' },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/analytics/reports', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test',
          type: 'custom',
          format: 'json'
        })
      })

      const response = await POST(request)
      expect(response.status).toBe(201)
    })

    test('should validate date range - missing end date', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/analytics/reports', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test',
          type: 'custom',
          dateRange: { start: '2024-01-01' }
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Date range must include start and end dates')
    })

    test('should validate date range - invalid format', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/analytics/reports', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test',
          type: 'custom',
          dateRange: { start: 'invalid', end: 'invalid' }
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid date range format')
    })

    test('should validate date range - start after end', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/analytics/reports', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test',
          type: 'custom',
          dateRange: { start: '2024-12-31', end: '2024-01-01' }
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Start date must be before end date')
    })

    test('should validate metrics array', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/analytics/reports', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test',
          type: 'custom',
          metrics: 'not-an-array'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Metrics must be an array')
    })

    test('should validate schedule frequency', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/analytics/reports', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test',
          type: 'custom',
          schedule: { frequency: 'invalid-frequency' }
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid schedule frequency')
    })

    test('should accept valid schedule frequencies', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValue({
        data: { id: 'rep-1' },
        error: null
      })

      const validFrequencies = ['daily', 'weekly', 'monthly', 'quarterly']

      for (const frequency of validFrequencies) {
        const request = new NextRequest('http://localhost:3000/api/analytics/reports', {
          method: 'POST',
          body: JSON.stringify({
            name: 'Test',
            type: 'custom',
            schedule: { frequency }
          })
        })

        const response = await POST(request)
        expect(response.status).toBe(201)
      }
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

      const request = new NextRequest('http://localhost:3000/api/analytics/reports', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test', type: 'custom' })
      })

      const response = await POST(request)

      expect(response.status).toBe(500)
    })
  })
})
