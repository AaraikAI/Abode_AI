/**
 * IoT Sensor Data API Tests
 * Comprehensive test suite for sensor readings, time-series data, and aggregation
 */

import { GET, POST } from '@/app/api/iot/sensors/[sensorId]/data/route'
import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

// Mock Supabase
jest.mock('@/lib/supabase/server')

describe('IoT Sensor Data API', () => {
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
      single: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis()
    }

    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)
  })

  describe('GET /api/iot/sensors/[sensorId]/data', () => {
    test('should get sensor readings', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'sensor-1' },
        error: null
      })

      mockSupabase.limit.mockResolvedValue({
        data: [
          { id: 'r1', sensor_id: 'sensor-1', timestamp: new Date(), value: 22.5, quality: 'good' },
          { id: 'r2', sensor_id: 'sensor-1', timestamp: new Date(), value: 23.0, quality: 'good' }
        ],
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/iot/sensors/sensor-1/data')
      const response = await GET(request, { params: { sensorId: 'sensor-1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.readings).toHaveLength(2)
      expect(data.stats).toBeDefined()
      expect(data.stats.min).toBe(22.5)
      expect(data.stats.max).toBe(23.0)
    })

    test('should require authentication', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Unauthorized')
      })

      const request = new NextRequest('http://localhost:3000/api/iot/sensors/sensor-1/data')
      const response = await GET(request, { params: { sensorId: 'sensor-1' } })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    test('should verify sensor ownership', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValue({
        data: null,
        error: new Error('Not found')
      })

      const request = new NextRequest('http://localhost:3000/api/iot/sensors/sensor-1/data')
      const response = await GET(request, { params: { sensorId: 'sensor-1' } })

      expect(response.status).toBe(404)
    })

    test('should filter by start time', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'sensor-1' },
        error: null
      })

      mockSupabase.limit.mockResolvedValue({
        data: [],
        error: null
      })

      const startTime = new Date('2024-01-01').toISOString()
      const request = new NextRequest(`http://localhost:3000/api/iot/sensors/sensor-1/data?startTime=${startTime}`)
      await GET(request, { params: { sensorId: 'sensor-1' } })

      expect(mockSupabase.gte).toHaveBeenCalledWith('timestamp', startTime)
    })

    test('should filter by end time', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'sensor-1' },
        error: null
      })

      mockSupabase.limit.mockResolvedValue({
        data: [],
        error: null
      })

      const endTime = new Date('2024-12-31').toISOString()
      const request = new NextRequest(`http://localhost:3000/api/iot/sensors/sensor-1/data?endTime=${endTime}`)
      await GET(request, { params: { sensorId: 'sensor-1' } })

      expect(mockSupabase.lte).toHaveBeenCalledWith('timestamp', endTime)
    })

    test('should filter by quality', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'sensor-1' },
        error: null
      })

      mockSupabase.limit.mockResolvedValue({
        data: [],
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/iot/sensors/sensor-1/data?quality=good')
      await GET(request, { params: { sensorId: 'sensor-1' } })

      expect(mockSupabase.eq).toHaveBeenCalledWith('quality', 'good')
    })

    test('should respect limit parameter', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'sensor-1' },
        error: null
      })

      mockSupabase.limit.mockResolvedValue({
        data: [],
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/iot/sensors/sensor-1/data?limit=500')
      await GET(request, { params: { sensorId: 'sensor-1' } })

      expect(mockSupabase.limit).toHaveBeenCalledWith(500)
    })

    test('should provide hourly aggregated data', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'sensor-1' },
        error: null
      })

      const now = new Date()
      mockSupabase.order.mockResolvedValue({
        data: [
          { timestamp: new Date(now.getTime() - 3600000).toISOString(), value: 20 },
          { timestamp: new Date(now.getTime() - 3000000).toISOString(), value: 21 },
          { timestamp: new Date(now.getTime() - 2400000).toISOString(), value: 22 },
          { timestamp: now.toISOString(), value: 23 }
        ],
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/iot/sensors/sensor-1/data?aggregate=hourly')
      const response = await GET(request, { params: { sensorId: 'sensor-1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.aggregate).toBe('hourly')
      expect(data.data).toBeDefined()
      expect(Array.isArray(data.data)).toBe(true)
    })

    test('should provide daily aggregated data', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'sensor-1' },
        error: null
      })

      mockSupabase.order.mockResolvedValue({
        data: [
          { timestamp: '2024-01-01T10:00:00Z', value: 20 },
          { timestamp: '2024-01-01T14:00:00Z', value: 25 },
          { timestamp: '2024-01-02T10:00:00Z', value: 22 }
        ],
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/iot/sensors/sensor-1/data?aggregate=daily')
      const response = await GET(request, { params: { sensorId: 'sensor-1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.aggregate).toBe('daily')
      expect(data.data.length).toBeGreaterThan(0)
    })

    test('should provide weekly aggregated data', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'sensor-1' },
        error: null
      })

      mockSupabase.order.mockResolvedValue({
        data: [
          { timestamp: '2024-01-01T10:00:00Z', value: 20 },
          { timestamp: '2024-01-03T10:00:00Z', value: 25 },
          { timestamp: '2024-01-08T10:00:00Z', value: 22 }
        ],
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/iot/sensors/sensor-1/data?aggregate=weekly')
      const response = await GET(request, { params: { sensorId: 'sensor-1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.aggregate).toBe('weekly')
    })

    test('should calculate aggregation statistics correctly', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'sensor-1' },
        error: null
      })

      mockSupabase.order.mockResolvedValue({
        data: [
          { timestamp: '2024-01-01T10:00:00Z', value: 10 },
          { timestamp: '2024-01-01T10:30:00Z', value: 20 },
          { timestamp: '2024-01-01T10:45:00Z', value: 30 }
        ],
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/iot/sensors/sensor-1/data?aggregate=hourly')
      const response = await GET(request, { params: { sensorId: 'sensor-1' } })
      const data = await response.json()

      expect(data.data[0].count).toBe(3)
      expect(data.data[0].min).toBe(10)
      expect(data.data[0].max).toBe(30)
      expect(data.data[0].avg).toBe(20)
      expect(data.data[0].sum).toBe(60)
      expect(data.data[0].stdDev).toBeDefined()
    })

    test('should handle empty data for aggregation', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'sensor-1' },
        error: null
      })

      mockSupabase.order.mockResolvedValue({
        data: [],
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/iot/sensors/sensor-1/data?aggregate=daily')
      const response = await GET(request, { params: { sensorId: 'sensor-1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data).toEqual([])
    })

    test('should return null stats for empty readings', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'sensor-1' },
        error: null
      })

      mockSupabase.limit.mockResolvedValue({
        data: [],
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/iot/sensors/sensor-1/data')
      const response = await GET(request, { params: { sensorId: 'sensor-1' } })
      const data = await response.json()

      expect(data.stats).toBeNull()
    })
  })

  describe('POST /api/iot/sensors/[sensorId]/data', () => {
    test('should submit a single sensor reading', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'sensor-1', type: 'sensor', settings: { unit: 'celsius' } },
        error: null
      })

      mockSupabase.select.mockResolvedValue({
        data: [{ id: 'r1', value: 22.5 }],
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/iot/sensors/sensor-1/data', {
        method: 'POST',
        body: JSON.stringify({
          value: 22.5,
          quality: 'good'
        })
      })

      const response = await POST(request, { params: { sensorId: 'sensor-1' } })
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.count).toBe(1)
    })

    test('should require authentication', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Unauthorized')
      })

      const request = new NextRequest('http://localhost:3000/api/iot/sensors/sensor-1/data', {
        method: 'POST',
        body: JSON.stringify({ value: 22.5 })
      })

      const response = await POST(request, { params: { sensorId: 'sensor-1' } })

      expect(response.status).toBe(401)
    })

    test('should verify sensor ownership', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValue({
        data: null,
        error: new Error('Not found')
      })

      const request = new NextRequest('http://localhost:3000/api/iot/sensors/sensor-1/data', {
        method: 'POST',
        body: JSON.stringify({ value: 22.5 })
      })

      const response = await POST(request, { params: { sensorId: 'sensor-1' } })

      expect(response.status).toBe(404)
    })

    test('should require value field', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValue({
        data: { id: 'sensor-1', settings: {} },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/iot/sensors/sensor-1/data', {
        method: 'POST',
        body: JSON.stringify({})
      })

      const response = await POST(request, { params: { sensorId: 'sensor-1' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Value is required')
    })

    test('should validate quality values', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValue({
        data: { id: 'sensor-1', settings: {} },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/iot/sensors/sensor-1/data', {
        method: 'POST',
        body: JSON.stringify({
          value: 22.5,
          quality: 'invalid'
        })
      })

      const response = await POST(request, { params: { sensorId: 'sensor-1' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid quality')
    })

    test('should submit batch readings', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'sensor-1', settings: { unit: 'celsius' } },
        error: null
      })

      mockSupabase.select.mockResolvedValue({
        data: [
          { id: 'r1', value: 22.5 },
          { id: 'r2', value: 23.0 },
          { id: 'r3', value: 23.5 }
        ],
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/iot/sensors/sensor-1/data', {
        method: 'POST',
        body: JSON.stringify({
          readings: [
            { value: 22.5 },
            { value: 23.0 },
            { value: 23.5 }
          ]
        })
      })

      const response = await POST(request, { params: { sensorId: 'sensor-1' } })
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.count).toBe(3)
    })

    test('should use default quality as good', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'sensor-1', settings: { unit: 'celsius' } },
        error: null
      })

      mockSupabase.select.mockResolvedValue({
        data: [{ id: 'r1', quality: 'good' }],
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/iot/sensors/sensor-1/data', {
        method: 'POST',
        body: JSON.stringify({ value: 22.5 })
      })

      await POST(request, { params: { sensorId: 'sensor-1' } })

      const insertCall = mockSupabase.insert.mock.calls[0][0]
      expect(insertCall[0].quality).toBe('good')
    })

    test('should use current timestamp if not provided', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'sensor-1', settings: {} },
        error: null
      })

      mockSupabase.select.mockResolvedValue({
        data: [{ id: 'r1' }],
        error: null
      })

      const beforeTime = new Date()
      const request = new NextRequest('http://localhost:3000/api/iot/sensors/sensor-1/data', {
        method: 'POST',
        body: JSON.stringify({ value: 22.5 })
      })

      await POST(request, { params: { sensorId: 'sensor-1' } })
      const afterTime = new Date()

      const insertCall = mockSupabase.insert.mock.calls[0][0]
      const timestamp = new Date(insertCall[0].timestamp)
      expect(timestamp.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime())
      expect(timestamp.getTime()).toBeLessThanOrEqual(afterTime.getTime())
    })

    test('should update device status to online', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'sensor-1', settings: {} },
        error: null
      })

      mockSupabase.select.mockResolvedValue({
        data: [{ id: 'r1' }],
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/iot/sensors/sensor-1/data', {
        method: 'POST',
        body: JSON.stringify({ value: 22.5 })
      })

      await POST(request, { params: { sensorId: 'sensor-1' } })

      expect(mockSupabase.update).toHaveBeenCalled()
      const updateCall = mockSupabase.update.mock.calls[0][0]
      expect(updateCall.status).toBe('online')
      expect(updateCall.last_seen).toBeDefined()
    })

    test('should handle malformed JSON', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/iot/sensors/sensor-1/data', {
        method: 'POST',
        body: 'invalid json'
      })

      const response = await POST(request, { params: { sensorId: 'sensor-1' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid JSON')
    })

    test('should save metadata with readings', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'sensor-1', settings: {} },
        error: null
      })

      mockSupabase.select.mockResolvedValue({
        data: [{ id: 'r1' }],
        error: null
      })

      const metadata = { location: 'room-1', calibrated: true }

      const request = new NextRequest('http://localhost:3000/api/iot/sensors/sensor-1/data', {
        method: 'POST',
        body: JSON.stringify({
          value: 22.5,
          metadata
        })
      })

      await POST(request, { params: { sensorId: 'sensor-1' } })

      const insertCall = mockSupabase.insert.mock.calls[0][0]
      expect(insertCall[0].metadata).toEqual(metadata)
    })
  })
})
