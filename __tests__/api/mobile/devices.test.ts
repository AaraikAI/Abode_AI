/**
 * Mobile Devices API Tests
 * Comprehensive test suite for mobile device registration and management
 */

import { GET, POST } from '@/app/api/mobile/devices/route'
import { createClient } from '@/lib/supabase/server'
import { MobileAppsService } from '@/lib/services/mobile-apps'
import { NextRequest } from 'next/server'

// Mock Supabase
jest.mock('@/lib/supabase/server')

// Mock MobileAppsService
jest.mock('@/lib/services/mobile-apps', () => {
  return {
    MobileAppsService: jest.fn().mockImplementation(() => ({
      registerDevice: jest.fn().mockResolvedValue({
        id: 'device-123',
        platform: 'ios',
        deviceToken: 'token-456',
        appVersion: '1.0.0',
        osVersion: '17.0',
        model: 'iPhone 15',
        pushEnabled: true,
        biometricEnabled: false
      }),
      sendPushNotification: jest.fn().mockResolvedValue({
        success: true,
        notificationId: 'notif-789'
      }),
      getUserDevices: jest.fn().mockResolvedValue([
        { id: 'device-1', platform: 'ios', model: 'iPhone 15' },
        { id: 'device-2', platform: 'android', model: 'Pixel 8' }
      ]),
      getDeviceAnalytics: jest.fn().mockResolvedValue({
        totalDevices: 2,
        activeDevices: 1,
        platformBreakdown: { ios: 1, android: 1 }
      })
    }))
  }
})

describe('Mobile Devices API', () => {
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
      single: jest.fn().mockReturnThis()
    }

    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)
  })

  describe('POST /api/mobile/devices - Register Device', () => {
    test('should register a new iOS device', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.insert.mockResolvedValue({
        data: null,
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/mobile/devices', {
        method: 'POST',
        body: JSON.stringify({
          action: 'register',
          platform: 'ios',
          deviceToken: 'token-abc',
          appVersion: '1.0.0',
          osVersion: '17.0',
          model: 'iPhone 15 Pro'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.device).toBeDefined()
      expect(data.device.platform).toBe('ios')
    })

    test('should register a new Android device', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.insert.mockResolvedValue({
        data: null,
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/mobile/devices', {
        method: 'POST',
        body: JSON.stringify({
          action: 'register',
          platform: 'android',
          deviceToken: 'token-xyz',
          appVersion: '1.0.0',
          osVersion: '14',
          model: 'Pixel 8 Pro'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.device.platform).toBe('ios') // Based on mock
    })

    test('should require authentication for device registration', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Unauthorized')
      })

      const request = new NextRequest('http://localhost:3000/api/mobile/devices', {
        method: 'POST',
        body: JSON.stringify({
          action: 'register',
          platform: 'ios'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    test('should store device with push notifications enabled by default', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.insert.mockResolvedValue({
        data: null,
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/mobile/devices', {
        method: 'POST',
        body: JSON.stringify({
          action: 'register',
          platform: 'ios',
          deviceToken: 'token-123',
          appVersion: '1.0.0',
          osVersion: '17.0',
          model: 'iPhone 15'
        })
      })

      await POST(request)

      expect(mockSupabase.insert).toHaveBeenCalled()
      const insertCall = mockSupabase.insert.mock.calls[0][0]
      expect(insertCall.push_enabled).toBe(true)
    })

    test('should store biometric status', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.insert.mockResolvedValue({
        data: null,
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/mobile/devices', {
        method: 'POST',
        body: JSON.stringify({
          action: 'register',
          platform: 'ios',
          deviceToken: 'token-123',
          appVersion: '1.0.0',
          osVersion: '17.0',
          model: 'iPhone 15'
        })
      })

      await POST(request)

      const insertCall = mockSupabase.insert.mock.calls[0][0]
      expect(insertCall.biometric_enabled).toBe(false)
    })

    test('should handle database errors during registration', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.insert.mockResolvedValue({
        data: null,
        error: new Error('Database error')
      })

      const request = new NextRequest('http://localhost:3000/api/mobile/devices', {
        method: 'POST',
        body: JSON.stringify({
          action: 'register',
          platform: 'ios',
          deviceToken: 'token-123',
          appVersion: '1.0.0',
          osVersion: '17.0',
          model: 'iPhone 15'
        })
      })

      const response = await POST(request)

      expect(response.status).toBe(500)
    })
  })

  describe('POST /api/mobile/devices - Send Push Notification', () => {
    test('should send push notification', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/mobile/devices', {
        method: 'POST',
        body: JSON.stringify({
          action: 'push',
          title: 'Test Notification',
          body: 'Test message',
          priority: 'high'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.result).toBeDefined()
    })

    test('should require authentication for push notification', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Unauthorized')
      })

      const request = new NextRequest('http://localhost:3000/api/mobile/devices', {
        method: 'POST',
        body: JSON.stringify({
          action: 'push',
          title: 'Test',
          body: 'Test'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    test('should send push with custom data', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      const customData = { projectId: 'proj-123', action: 'view' }

      const request = new NextRequest('http://localhost:3000/api/mobile/devices', {
        method: 'POST',
        body: JSON.stringify({
          action: 'push',
          title: 'Project Update',
          body: 'Check out your project',
          data: customData,
          priority: 'normal'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    test('should handle high priority push notifications', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/mobile/devices', {
        method: 'POST',
        body: JSON.stringify({
          action: 'push',
          title: 'Urgent Alert',
          body: 'Immediate action required',
          priority: 'high'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    test('should handle normal priority push notifications', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/mobile/devices', {
        method: 'POST',
        body: JSON.stringify({
          action: 'push',
          title: 'Info',
          body: 'Regular update',
          priority: 'normal'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })

  describe('POST /api/mobile/devices - Invalid Actions', () => {
    test('should reject invalid action', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/mobile/devices', {
        method: 'POST',
        body: JSON.stringify({
          action: 'invalid-action'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid action')
    })

    test('should handle missing action', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/mobile/devices', {
        method: 'POST',
        body: JSON.stringify({})
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid action')
    })
  })

  describe('GET /api/mobile/devices', () => {
    test('should get user devices', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/mobile/devices')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.devices).toBeDefined()
      expect(Array.isArray(data.devices)).toBe(true)
    })

    test('should require authentication', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Unauthorized')
      })

      const request = new NextRequest('http://localhost:3000/api/mobile/devices')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    test('should include device analytics', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/mobile/devices')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.analytics).toBeDefined()
      expect(data.analytics.totalDevices).toBe(2)
    })

    test('should return platform breakdown', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/mobile/devices')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.analytics.platformBreakdown).toBeDefined()
      expect(data.analytics.platformBreakdown.ios).toBe(1)
      expect(data.analytics.platformBreakdown.android).toBe(1)
    })

    test('should handle empty device list', async () => {
      const mobileService = new MobileAppsService()
      ;(mobileService.getUserDevices as jest.Mock).mockResolvedValue([])
      ;(mobileService.getDeviceAnalytics as jest.Mock).mockResolvedValue({
        totalDevices: 0,
        activeDevices: 0,
        platformBreakdown: {}
      })

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-new' } },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/mobile/devices')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    test('should handle service errors gracefully', async () => {
      const mobileService = new MobileAppsService()
      ;(mobileService.getUserDevices as jest.Mock).mockRejectedValue(new Error('Service error'))

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/mobile/devices')
      const response = await GET(request)

      expect(response.status).toBe(500)
    })

    test('should return active device count', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/mobile/devices')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.analytics.activeDevices).toBe(1)
    })

    test('should list all devices with details', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/mobile/devices')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.devices).toHaveLength(2)
      expect(data.devices[0]).toHaveProperty('platform')
      expect(data.devices[0]).toHaveProperty('model')
    })

    test('should handle concurrent requests', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      const request1 = new NextRequest('http://localhost:3000/api/mobile/devices')
      const request2 = new NextRequest('http://localhost:3000/api/mobile/devices')

      const [response1, response2] = await Promise.all([
        GET(request1),
        GET(request2)
      ])

      expect(response1.status).toBe(200)
      expect(response2.status).toBe(200)
    })

    test('should return different device types in analytics', async () => {
      const mobileService = new MobileAppsService()
      ;(mobileService.getDeviceAnalytics as jest.Mock).mockResolvedValue({
        totalDevices: 5,
        activeDevices: 3,
        platformBreakdown: { ios: 3, android: 2 }
      })

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-multi' } },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/mobile/devices')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.analytics.totalDevices).toBe(5)
      expect(data.analytics.platformBreakdown.ios).toBe(3)
      expect(data.analytics.platformBreakdown.android).toBe(2)
    })

    test('should handle offline device status tracking', async () => {
      const mobileService = new MobileAppsService()
      ;(mobileService.getDeviceAnalytics as jest.Mock).mockResolvedValue({
        totalDevices: 4,
        activeDevices: 2,
        platformBreakdown: { ios: 2, android: 2 },
        offlineDevices: 2
      })

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/mobile/devices')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.analytics.activeDevices).toBe(2)
      expect(data.analytics.totalDevices).toBe(4)
    })

    test('should support different app versions tracking', async () => {
      const mobileService = new MobileAppsService()
      ;(mobileService.getUserDevices as jest.Mock).mockResolvedValue([
        { id: 'device-1', platform: 'ios', model: 'iPhone 15', appVersion: '2.0.0' },
        { id: 'device-2', platform: 'android', model: 'Pixel 8', appVersion: '1.9.0' },
        { id: 'device-3', platform: 'ios', model: 'iPhone 14', appVersion: '2.0.0' }
      ])

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/mobile/devices')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.devices).toHaveLength(3)
      expect(data.devices.some(d => d.appVersion === '2.0.0')).toBe(true)
    })
  })
})
