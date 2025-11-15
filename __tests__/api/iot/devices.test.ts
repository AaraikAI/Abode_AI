/**
 * IoT Devices API Tests
 * Comprehensive test suite for device registration, management, and lifecycle
 */

import { GET, POST, PUT, DELETE } from '@/app/api/iot/devices/route'
import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

// Mock Supabase
jest.mock('@/lib/supabase/server')

describe('IoT Devices API', () => {
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
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis()
    }

    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)
  })

  describe('GET /api/iot/devices', () => {
    test('should list all user devices', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.range.mockResolvedValue({
        data: [
          { id: 'device-1', name: 'Temperature Sensor', type: 'sensor', user_id: 'user-123' },
          { id: 'device-2', name: 'Light Controller', type: 'actuator', user_id: 'user-123' }
        ],
        count: 2,
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/iot/devices')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.devices).toHaveLength(2)
      expect(data.pagination.total).toBe(2)
    })

    test('should require authentication', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Unauthorized')
      })

      const request = new NextRequest('http://localhost:3000/api/iot/devices')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    test('should filter devices by type', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.range.mockResolvedValue({
        data: [{ id: 'device-1', type: 'sensor' }],
        count: 1,
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/iot/devices?type=sensor')
      await GET(request)

      expect(mockSupabase.eq).toHaveBeenCalledWith('type', 'sensor')
    })

    test('should filter devices by status', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.range.mockResolvedValue({
        data: [{ id: 'device-1', status: 'online' }],
        count: 1,
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/iot/devices?status=online')
      await GET(request)

      expect(mockSupabase.eq).toHaveBeenCalledWith('status', 'online')
    })

    test('should filter devices by buildingId', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.range.mockResolvedValue({
        data: [{ id: 'device-1', location: { buildingId: 'building-1' } }],
        count: 1,
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/iot/devices?buildingId=building-1')
      await GET(request)

      expect(mockSupabase.eq).toHaveBeenCalledWith('location->>buildingId', 'building-1')
    })

    test('should filter devices by floor', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.range.mockResolvedValue({
        data: [{ id: 'device-1', location: { floor: 2 } }],
        count: 1,
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/iot/devices?floor=2')
      await GET(request)

      expect(mockSupabase.eq).toHaveBeenCalledWith('location->>floor', 2)
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

      const request = new NextRequest('http://localhost:3000/api/iot/devices?page=2&limit=20')
      const response = await GET(request)
      const data = await response.json()

      expect(mockSupabase.range).toHaveBeenCalledWith(20, 39)
      expect(data.pagination.page).toBe(2)
      expect(data.pagination.limit).toBe(20)
      expect(data.pagination.totalPages).toBe(5)
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

      const request = new NextRequest('http://localhost:3000/api/iot/devices')
      const response = await GET(request)

      expect(response.status).toBe(500)
    })
  })

  describe('POST /api/iot/devices', () => {
    test('should register a new device', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'device-456',
          name: 'New Sensor',
          type: 'sensor',
          status: 'offline',
          user_id: 'user-123'
        },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/iot/devices', {
        method: 'POST',
        body: JSON.stringify({
          name: 'New Sensor',
          type: 'sensor',
          manufacturer: 'Acme Corp',
          model: 'TS-100'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.device.name).toBe('New Sensor')
      expect(data.device.status).toBe('offline')
    })

    test('should require authentication', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Unauthorized')
      })

      const request = new NextRequest('http://localhost:3000/api/iot/devices', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test', type: 'sensor' })
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

      const request = new NextRequest('http://localhost:3000/api/iot/devices', {
        method: 'POST',
        body: JSON.stringify({})
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('required')
    })

    test('should validate device type', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/iot/devices', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Device',
          type: 'invalid-type'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid device type')
    })

    test('should accept all valid device types', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValue({
        data: { id: 'device-1', type: 'sensor' },
        error: null
      })

      const validTypes = ['sensor', 'actuator', 'gateway', 'controller']

      for (const type of validTypes) {
        const request = new NextRequest('http://localhost:3000/api/iot/devices', {
          method: 'POST',
          body: JSON.stringify({ name: 'Test', type })
        })

        const response = await POST(request)
        expect(response.status).toBe(201)
      }
    })

    test('should set default status to offline', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      const insertedData = { status: 'offline' }
      mockSupabase.single.mockResolvedValue({
        data: insertedData,
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/iot/devices', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test', type: 'sensor' })
      })

      await POST(request)

      const insertCall = mockSupabase.insert.mock.calls[0][0]
      expect(insertCall.status).toBe('offline')
    })

    test('should handle malformed JSON', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/iot/devices', {
        method: 'POST',
        body: 'invalid json'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid JSON')
    })

    test('should save device location', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValue({
        data: { id: 'device-1' },
        error: null
      })

      const location = {
        buildingId: 'building-1',
        floor: 2,
        room: 'Conference Room A',
        position: [10, 20, 3]
      }

      const request = new NextRequest('http://localhost:3000/api/iot/devices', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test',
          type: 'sensor',
          location
        })
      })

      await POST(request)

      const insertCall = mockSupabase.insert.mock.calls[0][0]
      expect(insertCall.location).toEqual(location)
    })

    test('should save device capabilities', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValue({
        data: { id: 'device-1' },
        error: null
      })

      const capabilities = ['temperature', 'humidity', 'pressure']

      const request = new NextRequest('http://localhost:3000/api/iot/devices', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Multi-Sensor',
          type: 'sensor',
          capabilities
        })
      })

      await POST(request)

      const insertCall = mockSupabase.insert.mock.calls[0][0]
      expect(insertCall.capabilities).toEqual(capabilities)
    })
  })

  describe('PUT /api/iot/devices', () => {
    test('should update device settings', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'device-1', user_id: 'user-123' },
        error: null
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: 'device-1',
          name: 'Updated Name',
          status: 'online'
        },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/iot/devices', {
        method: 'PUT',
        body: JSON.stringify({
          deviceId: 'device-1',
          name: 'Updated Name',
          status: 'online'
        })
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.device.name).toBe('Updated Name')
    })

    test('should require authentication', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Unauthorized')
      })

      const request = new NextRequest('http://localhost:3000/api/iot/devices', {
        method: 'PUT',
        body: JSON.stringify({ deviceId: 'device-1' })
      })

      const response = await PUT(request)

      expect(response.status).toBe(401)
    })

    test('should require device ID', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/iot/devices', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Test' })
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Device ID is required')
    })

    test('should verify device ownership', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValue({
        data: null,
        error: new Error('Not found')
      })

      const request = new NextRequest('http://localhost:3000/api/iot/devices', {
        method: 'PUT',
        body: JSON.stringify({ deviceId: 'device-1' })
      })

      const response = await PUT(request)

      expect(response.status).toBe(404)
    })

    test('should validate status values', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValue({
        data: { id: 'device-1', user_id: 'user-123' },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/iot/devices', {
        method: 'PUT',
        body: JSON.stringify({
          deviceId: 'device-1',
          status: 'invalid-status'
        })
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid status')
    })

    test('should update last_seen when device comes online', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'device-1', user_id: 'user-123' },
        error: null
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'device-1', status: 'online' },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/iot/devices', {
        method: 'PUT',
        body: JSON.stringify({
          deviceId: 'device-1',
          status: 'online'
        })
      })

      await PUT(request)

      const updateCall = mockSupabase.update.mock.calls[0][0]
      expect(updateCall.last_seen).toBeDefined()
    })

    test('should update device location', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'device-1', user_id: 'user-123' },
        error: null
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'device-1' },
        error: null
      })

      const newLocation = { floor: 3, room: 'Room 301' }

      const request = new NextRequest('http://localhost:3000/api/iot/devices', {
        method: 'PUT',
        body: JSON.stringify({
          deviceId: 'device-1',
          location: newLocation
        })
      })

      await PUT(request)

      const updateCall = mockSupabase.update.mock.calls[0][0]
      expect(updateCall.location).toEqual(newLocation)
    })

    test('should update device settings', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'device-1', user_id: 'user-123' },
        error: null
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'device-1' },
        error: null
      })

      const settings = { interval: 5000, threshold: 25 }

      const request = new NextRequest('http://localhost:3000/api/iot/devices', {
        method: 'PUT',
        body: JSON.stringify({
          deviceId: 'device-1',
          settings
        })
      })

      await PUT(request)

      const updateCall = mockSupabase.update.mock.calls[0][0]
      expect(updateCall.settings).toEqual(settings)
    })

    test('should handle partial updates', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'device-1', name: 'Original', user_id: 'user-123' },
        error: null
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'device-1', status: 'maintenance' },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/iot/devices', {
        method: 'PUT',
        body: JSON.stringify({
          deviceId: 'device-1',
          status: 'maintenance'
        })
      })

      await PUT(request)

      const updateCall = mockSupabase.update.mock.calls[0][0]
      expect(updateCall.status).toBe('maintenance')
      expect(updateCall.name).toBeUndefined() // Name should not be updated
    })
  })

  describe('DELETE /api/iot/devices', () => {
    test('should deregister a device', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValue({
        data: { id: 'device-1', user_id: 'user-123' },
        error: null
      })

      mockSupabase.delete.mockResolvedValue({
        data: null,
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/iot/devices?deviceId=device-1', {
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

      const request = new NextRequest('http://localhost:3000/api/iot/devices?deviceId=device-1', {
        method: 'DELETE'
      })

      const response = await DELETE(request)

      expect(response.status).toBe(401)
    })

    test('should require device ID', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/iot/devices', {
        method: 'DELETE'
      })

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Device ID is required')
    })

    test('should verify device ownership', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValue({
        data: null,
        error: new Error('Not found')
      })

      const request = new NextRequest('http://localhost:3000/api/iot/devices?deviceId=device-1', {
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
        data: { id: 'device-1', user_id: 'user-123' },
        error: null
      })

      mockSupabase.delete.mockResolvedValue({
        data: null,
        error: new Error('Database error')
      })

      const request = new NextRequest('http://localhost:3000/api/iot/devices?deviceId=device-1', {
        method: 'DELETE'
      })

      const response = await DELETE(request)

      expect(response.status).toBe(500)
    })
  })
})
