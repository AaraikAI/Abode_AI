/**
 * Mobile Push Notifications API Tests
 * Comprehensive test suite for push notification sending functionality
 */

import { POST } from '@/app/api/mobile/notifications/send/route'
import { createClient } from '@/lib/supabase/server'
import { MobileAppsService } from '@/lib/services/mobile-apps'
import { NextRequest } from 'next/server'

// Mock Supabase
jest.mock('@/lib/supabase/server')

// Mock MobileAppsService
jest.mock('@/lib/services/mobile-apps', () => {
  return {
    MobileAppsService: jest.fn().mockImplementation(() => ({
      sendPushNotification: jest.fn().mockResolvedValue({
        notificationId: 'notif-123',
        success: true,
        sent: 5
      })
    }))
  }
})

describe('Mobile Push Notifications API', () => {
  let mockSupabase: any

  beforeEach(() => {
    mockSupabase = {
      auth: {
        getUser: jest.fn()
      },
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis()
    }

    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)
  })

  describe('POST /api/mobile/notifications/send', () => {
    test('should send push notification to user devices', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.select.mockResolvedValue({
        data: [
          { device_token: 'token-1' },
          { device_token: 'token-2' }
        ],
        error: null
      })

      mockSupabase.single.mockResolvedValue({
        data: { id: 'notif-456' },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/mobile/notifications/send', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Test Notification',
          body: 'This is a test message',
          targetType: 'user',
          targetId: 'user-456'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.notification.targetDevices).toBe(2)
      expect(data.notification.sent).toBe(true)
    })

    test('should require authentication', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Unauthorized')
      })

      const request = new NextRequest('http://localhost:3000/api/mobile/notifications/send', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Test',
          body: 'Test'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    test('should validate required fields - title', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/mobile/notifications/send', {
        method: 'POST',
        body: JSON.stringify({
          body: 'Test message'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Title and body are required')
    })

    test('should validate required fields - body', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/mobile/notifications/send', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Test Title'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Title and body are required')
    })

    test('should validate priority values', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/mobile/notifications/send', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Test',
          body: 'Test',
          priority: 'invalid'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid priority')
    })

    test('should accept valid priority values', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.select.mockResolvedValue({
        data: [{ device_token: 'token-1' }],
        error: null
      })

      mockSupabase.single.mockResolvedValue({
        data: { id: 'notif-1' },
        error: null
      })

      const validPriorities = ['normal', 'high', 'critical']

      for (const priority of validPriorities) {
        const request = new NextRequest('http://localhost:3000/api/mobile/notifications/send', {
          method: 'POST',
          body: JSON.stringify({
            title: 'Test',
            body: 'Test',
            priority,
            targetType: 'broadcast'
          })
        })

        const response = await POST(request)
        expect(response.status).toBe(200)
      }
    })

    test('should validate targetType values', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/mobile/notifications/send', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Test',
          body: 'Test',
          targetType: 'invalid'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid targetType')
    })

    test('should require targetId for user targetType', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/mobile/notifications/send', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Test',
          body: 'Test',
          targetType: 'user'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('targetId is required')
    })

    test('should require targetId for device targetType', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/mobile/notifications/send', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Test',
          body: 'Test',
          targetType: 'device'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('targetId is required')
    })

    test('should validate notification channel', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/mobile/notifications/send', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Test',
          body: 'Test',
          channel: 'invalid-channel',
          targetType: 'broadcast'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid channel')
    })

    test('should accept valid notification channels', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.select.mockResolvedValue({
        data: [{ device_token: 'token-1' }],
        error: null
      })

      mockSupabase.single.mockResolvedValue({
        data: { id: 'notif-1' },
        error: null
      })

      const validChannels = ['default', 'alerts', 'messages', 'updates', 'marketing']

      for (const channel of validChannels) {
        const request = new NextRequest('http://localhost:3000/api/mobile/notifications/send', {
          method: 'POST',
          body: JSON.stringify({
            title: 'Test',
            body: 'Test',
            channel,
            targetType: 'broadcast'
          })
        })

        const response = await POST(request)
        expect(response.status).toBe(200)
      }
    })

    test('should send to specific device', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: { device_token: 'token-123', push_enabled: true },
        error: null
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'notif-1' },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/mobile/notifications/send', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Device Alert',
          body: 'Test device message',
          targetType: 'device',
          targetId: 'device-456'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'device-456')
    })

    test('should handle device not found', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValue({
        data: null,
        error: new Error('Not found')
      })

      const request = new NextRequest('http://localhost:3000/api/mobile/notifications/send', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Test',
          body: 'Test',
          targetType: 'device',
          targetId: 'device-404'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Device not found')
    })

    test('should reject device with push notifications disabled', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValue({
        data: { device_token: 'token-123', push_enabled: false },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/mobile/notifications/send', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Test',
          body: 'Test',
          targetType: 'device',
          targetId: 'device-123'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Push notifications disabled')
    })

    test('should broadcast to all devices', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.select.mockResolvedValue({
        data: [
          { device_token: 'token-1' },
          { device_token: 'token-2' },
          { device_token: 'token-3' }
        ],
        error: null
      })

      mockSupabase.single.mockResolvedValue({
        data: { id: 'notif-1' },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/mobile/notifications/send', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Broadcast',
          body: 'Message to all',
          targetType: 'broadcast'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.notification.targetDevices).toBe(3)
    })

    test('should handle no eligible devices', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.select.mockResolvedValue({
        data: [],
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/mobile/notifications/send', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Test',
          body: 'Test',
          targetType: 'user',
          targetId: 'user-no-devices'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toContain('No eligible devices found')
    })

    test('should schedule notification for future delivery', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.select.mockResolvedValue({
        data: [{ device_token: 'token-1' }],
        error: null
      })

      mockSupabase.single.mockResolvedValue({
        data: { id: 'notif-1' },
        error: null
      })

      const futureDate = new Date(Date.now() + 3600000).toISOString() // 1 hour from now

      const request = new NextRequest('http://localhost:3000/api/mobile/notifications/send', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Scheduled',
          body: 'Future message',
          targetType: 'broadcast',
          scheduled: futureDate
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.notification.scheduled).toBe(true)
      expect(data.notification.sent).toBe(false)
    })

    test('should reject past scheduled time', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      const pastDate = new Date(Date.now() - 3600000).toISOString() // 1 hour ago

      const request = new NextRequest('http://localhost:3000/api/mobile/notifications/send', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Test',
          body: 'Test',
          scheduled: pastDate
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Scheduled time must be in the future')
    })

    test('should reject invalid scheduled time format', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/mobile/notifications/send', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Test',
          body: 'Test',
          scheduled: 'invalid-date'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid scheduled time format')
    })

    test('should include custom data in notification', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.select.mockResolvedValue({
        data: [{ device_token: 'token-1' }],
        error: null
      })

      mockSupabase.single.mockResolvedValue({
        data: { id: 'notif-1' },
        error: null
      })

      const customData = {
        action: 'open-project',
        projectId: 'proj-123',
        url: '/projects/proj-123'
      }

      const request = new NextRequest('http://localhost:3000/api/mobile/notifications/send', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Project Update',
          body: 'Your project has been updated',
          targetType: 'broadcast',
          data: customData
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    test('should handle database errors', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.select.mockResolvedValue({
        data: null,
        error: new Error('Database error')
      })

      const request = new NextRequest('http://localhost:3000/api/mobile/notifications/send', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Test',
          body: 'Test',
          targetType: 'broadcast'
        })
      })

      const response = await POST(request)

      expect(response.status).toBe(500)
    })
  })
})
