/**
 * Digital Twin by Twin ID API Tests
 * Comprehensive test suite for individual digital twin management and sensor synchronization
 */

import { GET, PUT, POST, DELETE } from '@/app/api/digital-twin/[twinId]/route'
import { createClient } from '@/lib/supabase/server'
import { DigitalTwinManager } from '@/lib/services/digital-twin'
import { NextRequest } from 'next/server'

// Mock Supabase
jest.mock('@/lib/supabase/server')

// Mock Digital Twin Manager
jest.mock('@/lib/services/digital-twin', () => {
  const mockTwin = {
    getState: jest.fn(),
    processSensorReading: jest.fn(),
    registerSensors: jest.fn(),
    acknowledgeAlert: jest.fn()
  }

  return {
    DigitalTwinManager: jest.fn().mockImplementation(() => ({
      getDigitalTwin: jest.fn().mockReturnValue(mockTwin),
      createDigitalTwin: jest.fn().mockResolvedValue(mockTwin),
      removeDigitalTwin: jest.fn().mockResolvedValue(undefined)
    })),
    SensorReading: {},
    IoTSensor: {}
  }
})

describe('Digital Twin by Twin ID API', () => {
  let mockSupabase: any
  let mockManager: any
  let mockTwin: any

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
      single: jest.fn().mockReturnThis()
    }

    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)

    mockTwin = {
      getState: jest.fn().mockReturnValue({
        projectId: 'project-1',
        buildingId: 'twin-1',
        lastUpdate: new Date(),
        sensors: [
          { id: 'sensor-1', type: 'temperature', unit: 'celsius' },
          { id: 'sensor-2', type: 'humidity', unit: 'percent' }
        ],
        currentReadings: new Map([
          ['sensor-1', { sensorId: 'sensor-1', value: 22.5, timestamp: new Date(), quality: 'good' }]
        ]),
        historicalData: new Map([
          ['sensor-1', [{ sensorId: 'sensor-1', value: 22.0, timestamp: new Date(), quality: 'good' }]]
        ]),
        predictions: new Map([
          ['sensor-1', [{ timestamp: new Date(), value: 23.0, confidence: 0.95, lower: 22.5, upper: 23.5 }]]
        ]),
        anomalies: [
          { id: 'anom-1', sensorId: 'sensor-1', timestamp: new Date(), expectedValue: 22, actualValue: 30, severity: 'high', description: 'Temperature spike' }
        ],
        alerts: [
          { id: 'alert-1', type: 'anomaly', severity: 'warning', message: 'Anomaly detected', timestamp: new Date(), acknowledged: false }
        ]
      }),
      processSensorReading: jest.fn().mockResolvedValue(undefined),
      registerSensors: jest.fn(),
      acknowledgeAlert: jest.fn().mockReturnValue(true)
    }

    mockManager = new DigitalTwinManager()
    mockManager.getDigitalTwin.mockReturnValue(mockTwin)
    mockManager.createDigitalTwin.mockResolvedValue(mockTwin)
  })

  describe('GET /api/digital-twin/[twinId]', () => {
    test('should get digital twin state', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'twin-1',
          project_id: 'project-1',
          name: 'Building Twin',
          description: 'Digital twin of main building',
          status: 'active',
          config: {
            updateInterval: 60000,
            predictionHorizon: 24,
            anomalyThreshold: 3
          },
          sensors: []
        },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/digital-twin/twin-1')
      const response = await GET(request, { params: { twinId: 'twin-1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.twin.id).toBe('twin-1')
      expect(data.sensors).toBeDefined()
      expect(data.currentReadings).toBeDefined()
      expect(data.anomalies).toBeDefined()
      expect(data.alerts).toBeDefined()
    })

    test('should require authentication', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Unauthorized')
      })

      const request = new NextRequest('http://localhost:3000/api/digital-twin/twin-1')
      const response = await GET(request, { params: { twinId: 'twin-1' } })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    test('should verify twin ownership', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValue({
        data: null,
        error: new Error('Not found')
      })

      const request = new NextRequest('http://localhost:3000/api/digital-twin/twin-1')
      const response = await GET(request, { params: { twinId: 'twin-1' } })

      expect(response.status).toBe(404)
    })

    test('should include historical data when requested', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'twin-1',
          project_id: 'project-1',
          name: 'Building Twin',
          status: 'active',
          config: {},
          sensors: []
        },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/digital-twin/twin-1?includeHistory=true')
      const response = await GET(request, { params: { twinId: 'twin-1' } })
      const data = await response.json()

      expect(data.historicalData).toBeDefined()
    })

    test('should include predictions when requested', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'twin-1',
          project_id: 'project-1',
          name: 'Building Twin',
          status: 'active',
          config: {},
          sensors: []
        },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/digital-twin/twin-1?includePredictions=true')
      const response = await GET(request, { params: { twinId: 'twin-1' } })
      const data = await response.json()

      expect(data.predictions).toBeDefined()
    })

    test('should filter historical data by sensor ID', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'twin-1',
          project_id: 'project-1',
          name: 'Building Twin',
          status: 'active',
          config: {},
          sensors: []
        },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/digital-twin/twin-1?includeHistory=true&sensorId=sensor-1')
      const response = await GET(request, { params: { twinId: 'twin-1' } })
      const data = await response.json()

      expect(data.historicalData).toBeDefined()
      expect(data.historicalData.sensorId).toBe('sensor-1')
    })

    test('should filter predictions by sensor ID', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'twin-1',
          project_id: 'project-1',
          name: 'Building Twin',
          status: 'active',
          config: {},
          sensors: []
        },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/digital-twin/twin-1?includePredictions=true&sensorId=sensor-1')
      const response = await GET(request, { params: { twinId: 'twin-1' } })
      const data = await response.json()

      expect(data.predictions).toBeDefined()
      expect(data.predictions.sensorId).toBe('sensor-1')
    })

    test('should provide statistics', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'twin-1',
          project_id: 'project-1',
          name: 'Building Twin',
          status: 'active',
          config: {},
          sensors: []
        },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/digital-twin/twin-1')
      const response = await GET(request, { params: { twinId: 'twin-1' } })
      const data = await response.json()

      expect(data.statistics).toBeDefined()
      expect(data.statistics.totalSensors).toBeDefined()
      expect(data.statistics.activeSensors).toBeDefined()
      expect(data.statistics.totalAnomalies).toBeDefined()
      expect(data.statistics.activeAlerts).toBeDefined()
    })

    test('should create twin in memory if not exists', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'twin-1',
          project_id: 'project-1',
          name: 'Building Twin',
          status: 'active',
          config: {
            updateInterval: 60000,
            predictionHorizon: 24,
            anomalyThreshold: 3
          },
          sensors: []
        },
        error: null
      })

      mockManager.getDigitalTwin.mockReturnValueOnce(null)

      const request = new NextRequest('http://localhost:3000/api/digital-twin/twin-1')
      await GET(request, { params: { twinId: 'twin-1' } })

      expect(mockManager.createDigitalTwin).toHaveBeenCalled()
    })
  })

  describe('PUT /api/digital-twin/[twinId]', () => {
    test('should update digital twin configuration', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: 'twin-1',
          project_id: 'project-1',
          config: { updateInterval: 60000 },
          user_id: 'user-123'
        },
        error: null
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: 'twin-1',
          name: 'Updated Twin',
          config: { updateInterval: 30000 }
        },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/digital-twin/twin-1', {
        method: 'PUT',
        body: JSON.stringify({
          name: 'Updated Twin',
          config: { updateInterval: 30000 }
        })
      })

      const response = await PUT(request, { params: { twinId: 'twin-1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.twin.name).toBe('Updated Twin')
    })

    test('should require authentication', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Unauthorized')
      })

      const request = new NextRequest('http://localhost:3000/api/digital-twin/twin-1', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Test' })
      })

      const response = await PUT(request, { params: { twinId: 'twin-1' } })

      expect(response.status).toBe(401)
    })

    test('should verify twin ownership', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValue({
        data: null,
        error: new Error('Not found')
      })

      const request = new NextRequest('http://localhost:3000/api/digital-twin/twin-1', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Test' })
      })

      const response = await PUT(request, { params: { twinId: 'twin-1' } })

      expect(response.status).toBe(404)
    })

    test('should validate status values', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValue({
        data: { id: 'twin-1', user_id: 'user-123', config: {} },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/digital-twin/twin-1', {
        method: 'PUT',
        body: JSON.stringify({ status: 'invalid-status' })
      })

      const response = await PUT(request, { params: { twinId: 'twin-1' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid status')
    })

    test('should validate update interval', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValue({
        data: { id: 'twin-1', user_id: 'user-123', config: {} },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/digital-twin/twin-1', {
        method: 'PUT',
        body: JSON.stringify({
          config: { updateInterval: 500 } // Less than 1000ms
        })
      })

      const response = await PUT(request, { params: { twinId: 'twin-1' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Update interval')
    })

    test('should validate prediction horizon', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValue({
        data: { id: 'twin-1', user_id: 'user-123', config: {} },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/digital-twin/twin-1', {
        method: 'PUT',
        body: JSON.stringify({
          config: { predictionHorizon: 0 }
        })
      })

      const response = await PUT(request, { params: { twinId: 'twin-1' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Prediction horizon')
    })

    test('should validate anomaly threshold', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValue({
        data: { id: 'twin-1', user_id: 'user-123', config: {} },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/digital-twin/twin-1', {
        method: 'PUT',
        body: JSON.stringify({
          config: { anomalyThreshold: 0.5 }
        })
      })

      const response = await PUT(request, { params: { twinId: 'twin-1' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Anomaly threshold')
    })

    test('should merge config with existing values', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: 'twin-1',
          user_id: 'user-123',
          config: {
            updateInterval: 60000,
            predictionHorizon: 24,
            anomalyThreshold: 3
          }
        },
        error: null
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'twin-1', config: {} },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/digital-twin/twin-1', {
        method: 'PUT',
        body: JSON.stringify({
          config: { updateInterval: 30000 }
        })
      })

      await PUT(request, { params: { twinId: 'twin-1' } })

      const updateCall = mockSupabase.update.mock.calls[0][0]
      expect(updateCall.config.updateInterval).toBe(30000)
      expect(updateCall.config.predictionHorizon).toBe(24) // Should be preserved
      expect(updateCall.config.anomalyThreshold).toBe(3) // Should be preserved
    })

    test('should recreate twin in memory when config changes', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'twin-1', user_id: 'user-123', config: {}, project_id: 'project-1' },
        error: null
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: 'twin-1',
          project_id: 'project-1',
          config: { updateInterval: 30000 }
        },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/digital-twin/twin-1', {
        method: 'PUT',
        body: JSON.stringify({
          config: { updateInterval: 30000 }
        })
      })

      await PUT(request, { params: { twinId: 'twin-1' } })

      expect(mockManager.removeDigitalTwin).toHaveBeenCalledWith('twin-1')
      expect(mockManager.createDigitalTwin).toHaveBeenCalled()
    })

    test('should handle malformed JSON', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/digital-twin/twin-1', {
        method: 'PUT',
        body: 'invalid json'
      })

      const response = await PUT(request, { params: { twinId: 'twin-1' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid JSON')
    })
  })

  describe('POST /api/digital-twin/[twinId]', () => {
    test('should synchronize sensor data', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'twin-1',
          project_id: 'project-1',
          config: {},
          sensors: []
        },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/digital-twin/twin-1', {
        method: 'POST',
        body: JSON.stringify({
          action: 'sync-sensor-data',
          data: {
            readings: [
              { sensorId: 'sensor-1', value: 22.5, timestamp: new Date().toISOString() },
              { sensorId: 'sensor-2', value: 65.0, timestamp: new Date().toISOString() }
            ]
          }
        })
      })

      const response = await POST(request, { params: { twinId: 'twin-1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockTwin.processSensorReading).toHaveBeenCalledTimes(2)
    })

    test('should require authentication', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Unauthorized')
      })

      const request = new NextRequest('http://localhost:3000/api/digital-twin/twin-1', {
        method: 'POST',
        body: JSON.stringify({ action: 'sync-sensor-data', data: {} })
      })

      const response = await POST(request, { params: { twinId: 'twin-1' } })

      expect(response.status).toBe(401)
    })

    test('should verify twin ownership', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValue({
        data: null,
        error: new Error('Not found')
      })

      const request = new NextRequest('http://localhost:3000/api/digital-twin/twin-1', {
        method: 'POST',
        body: JSON.stringify({ action: 'sync-sensor-data', data: {} })
      })

      const response = await POST(request, { params: { twinId: 'twin-1' } })

      expect(response.status).toBe(404)
    })

    test('should register new sensors', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: 'twin-1',
          project_id: 'project-1',
          config: {},
          sensors: []
        },
        error: null
      })

      const sensors = [
        { id: 'sensor-3', type: 'co2', unit: 'ppm' },
        { id: 'sensor-4', type: 'light', unit: 'lux' }
      ]

      const request = new NextRequest('http://localhost:3000/api/digital-twin/twin-1', {
        method: 'POST',
        body: JSON.stringify({
          action: 'register-sensors',
          data: { sensors }
        })
      })

      const response = await POST(request, { params: { twinId: 'twin-1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.count).toBe(2)
      expect(mockTwin.registerSensors).toHaveBeenCalledWith(sensors)
    })

    test('should acknowledge alert', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'twin-1',
          project_id: 'project-1',
          config: {},
          sensors: []
        },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/digital-twin/twin-1', {
        method: 'POST',
        body: JSON.stringify({
          action: 'acknowledge-alert',
          data: { alertId: 'alert-1' }
        })
      })

      const response = await POST(request, { params: { twinId: 'twin-1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockTwin.acknowledgeAlert).toHaveBeenCalledWith('alert-1')
    })

    test('should force update digital twin', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'twin-1',
          project_id: 'project-1',
          config: {},
          sensors: []
        },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/digital-twin/twin-1', {
        method: 'POST',
        body: JSON.stringify({
          action: 'force-update',
          data: {}
        })
      })

      const response = await POST(request, { params: { twinId: 'twin-1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.state).toBeDefined()
    })

    test('should validate readings array for sync', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValue({
        data: { id: 'twin-1', project_id: 'project-1', config: {}, sensors: [] },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/digital-twin/twin-1', {
        method: 'POST',
        body: JSON.stringify({
          action: 'sync-sensor-data',
          data: { readings: 'not-an-array' }
        })
      })

      const response = await POST(request, { params: { twinId: 'twin-1' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Readings array is required')
    })

    test('should validate sensors array for registration', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValue({
        data: { id: 'twin-1', project_id: 'project-1', config: {}, sensors: [] },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/digital-twin/twin-1', {
        method: 'POST',
        body: JSON.stringify({
          action: 'register-sensors',
          data: { sensors: 'not-an-array' }
        })
      })

      const response = await POST(request, { params: { twinId: 'twin-1' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Sensors array is required')
    })

    test('should validate alert ID for acknowledgment', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValue({
        data: { id: 'twin-1', project_id: 'project-1', config: {}, sensors: [] },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/digital-twin/twin-1', {
        method: 'POST',
        body: JSON.stringify({
          action: 'acknowledge-alert',
          data: {}
        })
      })

      const response = await POST(request, { params: { twinId: 'twin-1' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Alert ID is required')
    })

    test('should handle invalid action', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValue({
        data: { id: 'twin-1', project_id: 'project-1', config: {}, sensors: [] },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/digital-twin/twin-1', {
        method: 'POST',
        body: JSON.stringify({
          action: 'invalid-action',
          data: {}
        })
      })

      const response = await POST(request, { params: { twinId: 'twin-1' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid action')
    })

    test('should handle malformed JSON', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/digital-twin/twin-1', {
        method: 'POST',
        body: 'invalid json'
      })

      const response = await POST(request, { params: { twinId: 'twin-1' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid JSON')
    })
  })

  describe('DELETE /api/digital-twin/[twinId]', () => {
    test('should remove digital twin', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValue({
        data: { id: 'twin-1', user_id: 'user-123' },
        error: null
      })

      mockSupabase.delete.mockResolvedValue({
        data: null,
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/digital-twin/twin-1', {
        method: 'DELETE'
      })

      const response = await DELETE(request, { params: { twinId: 'twin-1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockManager.removeDigitalTwin).toHaveBeenCalledWith('twin-1')
    })

    test('should require authentication', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Unauthorized')
      })

      const request = new NextRequest('http://localhost:3000/api/digital-twin/twin-1', {
        method: 'DELETE'
      })

      const response = await DELETE(request, { params: { twinId: 'twin-1' } })

      expect(response.status).toBe(401)
    })

    test('should verify twin ownership', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValue({
        data: null,
        error: new Error('Not found')
      })

      const request = new NextRequest('http://localhost:3000/api/digital-twin/twin-1', {
        method: 'DELETE'
      })

      const response = await DELETE(request, { params: { twinId: 'twin-1' } })

      expect(response.status).toBe(404)
    })

    test('should handle database errors on delete', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValue({
        data: { id: 'twin-1', user_id: 'user-123' },
        error: null
      })

      mockSupabase.delete.mockResolvedValue({
        data: null,
        error: new Error('Database error')
      })

      const request = new NextRequest('http://localhost:3000/api/digital-twin/twin-1', {
        method: 'DELETE'
      })

      const response = await DELETE(request, { params: { twinId: 'twin-1' } })

      expect(response.status).toBe(500)
    })
  })
})
