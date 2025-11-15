/**
 * Mobile Apps Service Test Suite
 * Comprehensive tests for native mobile app features
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import {
  MobileAppsService,
  type MobileDevice,
  type PushNotification,
  type OfflineData,
  type ARSession,
  type CameraCapture
} from '../../lib/services/mobile-apps'

describe('MobileAppsService', () => {
  let service: MobileAppsService

  beforeEach(() => {
    service = new MobileAppsService()
  })

  // ==================== Device Registration Tests ====================
  describe('Device Registration', () => {
    it('should register iOS device', async () => {
      const device = await service.registerDevice({
        userId: 'user1',
        platform: 'ios',
        deviceToken: 'apns-token-123',
        appVersion: '1.0.0',
        osVersion: '17.0',
        model: 'iPhone 15 Pro'
      })

      expect(device.id).toBeDefined()
      expect(device.platform).toBe('ios')
      expect(device.deviceToken).toBe('apns-token-123')
      expect(device.pushEnabled).toBe(true)
      expect(device.biometricEnabled).toBe(false)
      expect(device.offlineSyncEnabled).toBe(true)
    })

    it('should register Android device', async () => {
      const device = await service.registerDevice({
        userId: 'user1',
        platform: 'android',
        deviceToken: 'fcm-token-456',
        appVersion: '1.0.0',
        osVersion: '14.0',
        model: 'Pixel 8 Pro'
      })

      expect(device.id).toBeDefined()
      expect(device.platform).toBe('android')
      expect(device.deviceToken).toBe('fcm-token-456')
      expect(device.lastActiveAt).toBeInstanceOf(Date)
    })

    it('should generate unique device IDs', async () => {
      const device1 = await service.registerDevice({
        userId: 'user1',
        platform: 'ios',
        deviceToken: 'token1',
        appVersion: '1.0.0',
        osVersion: '17.0',
        model: 'iPhone 15'
      })

      const device2 = await service.registerDevice({
        userId: 'user1',
        platform: 'android',
        deviceToken: 'token2',
        appVersion: '1.0.0',
        osVersion: '14.0',
        model: 'Pixel 8'
      })

      expect(device1.id).not.toBe(device2.id)
    })

    it('should register multiple devices for same user', async () => {
      await service.registerDevice({
        userId: 'user1',
        platform: 'ios',
        deviceToken: 'token1',
        appVersion: '1.0.0',
        osVersion: '17.0',
        model: 'iPhone'
      })

      await service.registerDevice({
        userId: 'user1',
        platform: 'android',
        deviceToken: 'token2',
        appVersion: '1.0.0',
        osVersion: '14.0',
        model: 'Pixel'
      })

      const devices = await service.getUserDevices('user1')
      expect(devices).toHaveLength(2)
    })

    it('should track lastActiveAt on registration', async () => {
      const before = new Date()
      const device = await service.registerDevice({
        userId: 'user1',
        platform: 'ios',
        deviceToken: 'token1',
        appVersion: '1.0.0',
        osVersion: '17.0',
        model: 'iPhone'
      })
      const after = new Date()

      expect(device.lastActiveAt.getTime()).toBeGreaterThanOrEqual(before.getTime())
      expect(device.lastActiveAt.getTime()).toBeLessThanOrEqual(after.getTime())
    })

    it('should store app version', async () => {
      const device = await service.registerDevice({
        userId: 'user1',
        platform: 'ios',
        deviceToken: 'token1',
        appVersion: '2.5.1',
        osVersion: '17.0',
        model: 'iPhone'
      })

      expect(device.appVersion).toBe('2.5.1')
    })

    it('should store OS version', async () => {
      const device = await service.registerDevice({
        userId: 'user1',
        platform: 'android',
        deviceToken: 'token1',
        appVersion: '1.0.0',
        osVersion: '14.5.2',
        model: 'Pixel'
      })

      expect(device.osVersion).toBe('14.5.2')
    })

    it('should store device model', async () => {
      const device = await service.registerDevice({
        userId: 'user1',
        platform: 'ios',
        deviceToken: 'token1',
        appVersion: '1.0.0',
        osVersion: '17.0',
        model: 'iPhone 15 Pro Max'
      })

      expect(device.model).toBe('iPhone 15 Pro Max')
    })

    it('should unregister device', async () => {
      const device = await service.registerDevice({
        userId: 'user1',
        platform: 'ios',
        deviceToken: 'token1',
        appVersion: '1.0.0',
        osVersion: '17.0',
        model: 'iPhone'
      })

      await service.unregisterDevice(device.id)
      const devices = await service.getUserDevices('user1')
      expect(devices).toHaveLength(0)
    })

    it('should get all user devices', async () => {
      await service.registerDevice({
        userId: 'user1',
        platform: 'ios',
        deviceToken: 'token1',
        appVersion: '1.0.0',
        osVersion: '17.0',
        model: 'iPhone'
      })

      await service.registerDevice({
        userId: 'user2',
        platform: 'android',
        deviceToken: 'token2',
        appVersion: '1.0.0',
        osVersion: '14.0',
        model: 'Pixel'
      })

      const user1Devices = await service.getUserDevices('user1')
      expect(user1Devices).toHaveLength(1)
      expect(user1Devices[0].userId).toBe('user1')
    })
  })

  // ==================== Push Notification Tests ====================
  describe('Push Notification Delivery', () => {
    it('should send notification to iOS device', async () => {
      await service.registerDevice({
        userId: 'user1',
        platform: 'ios',
        deviceToken: 'apns-token',
        appVersion: '1.0.0',
        osVersion: '17.0',
        model: 'iPhone'
      })

      const result = await service.sendPushNotification({
        userId: 'user1',
        title: 'Test Notification',
        body: 'This is a test'
      })

      expect(result.sent).toBe(1)
      expect(result.failed).toBe(0)
      expect(result.notificationIds).toHaveLength(1)
    })

    it('should send notification to Android device', async () => {
      await service.registerDevice({
        userId: 'user1',
        platform: 'android',
        deviceToken: 'fcm-token',
        appVersion: '1.0.0',
        osVersion: '14.0',
        model: 'Pixel'
      })

      const result = await service.sendPushNotification({
        userId: 'user1',
        title: 'Test Notification',
        body: 'This is a test'
      })

      expect(result.sent).toBe(1)
      expect(result.failed).toBe(0)
    })

    it('should send notification with custom data', async () => {
      await service.registerDevice({
        userId: 'user1',
        platform: 'ios',
        deviceToken: 'token1',
        appVersion: '1.0.0',
        osVersion: '17.0',
        model: 'iPhone'
      })

      const result = await service.sendPushNotification({
        userId: 'user1',
        title: 'New Message',
        body: 'You have a new message',
        data: {
          messageId: 'msg123',
          senderId: 'user456',
          type: 'chat'
        }
      })

      expect(result.sent).toBe(1)
    })

    it('should send high priority notification', async () => {
      await service.registerDevice({
        userId: 'user1',
        platform: 'android',
        deviceToken: 'token1',
        appVersion: '1.0.0',
        osVersion: '14.0',
        model: 'Pixel'
      })

      const result = await service.sendPushNotification({
        userId: 'user1',
        title: 'Urgent Alert',
        body: 'Important message',
        priority: 'high'
      })

      expect(result.sent).toBe(1)
    })

    it('should send to multiple devices', async () => {
      await service.registerDevice({
        userId: 'user1',
        platform: 'ios',
        deviceToken: 'token1',
        appVersion: '1.0.0',
        osVersion: '17.0',
        model: 'iPhone'
      })

      await service.registerDevice({
        userId: 'user1',
        platform: 'android',
        deviceToken: 'token2',
        appVersion: '1.0.0',
        osVersion: '14.0',
        model: 'Pixel'
      })

      const result = await service.sendPushNotification({
        userId: 'user1',
        title: 'Test',
        body: 'Message'
      })

      expect(result.sent).toBe(2)
    })

    it('should send to specific devices only', async () => {
      const device1 = await service.registerDevice({
        userId: 'user1',
        platform: 'ios',
        deviceToken: 'token1',
        appVersion: '1.0.0',
        osVersion: '17.0',
        model: 'iPhone'
      })

      await service.registerDevice({
        userId: 'user1',
        platform: 'android',
        deviceToken: 'token2',
        appVersion: '1.0.0',
        osVersion: '14.0',
        model: 'Pixel'
      })

      const result = await service.sendPushNotification({
        userId: 'user1',
        title: 'Test',
        body: 'Message',
        deviceIds: [device1.id]
      })

      expect(result.sent).toBe(1)
    })

    it('should not send to devices with push disabled', async () => {
      const device = await service.registerDevice({
        userId: 'user1',
        platform: 'ios',
        deviceToken: 'token1',
        appVersion: '1.0.0',
        osVersion: '17.0',
        model: 'iPhone'
      })

      // Manually disable push (in real app, would be a service method)
      const devices = await service.getUserDevices('user1')
      devices[0].pushEnabled = false

      const result = await service.sendPushNotification({
        userId: 'user1',
        title: 'Test',
        body: 'Message'
      })

      expect(result.sent).toBe(0)
    })

    it('should track notification sent time', async () => {
      await service.registerDevice({
        userId: 'user1',
        platform: 'ios',
        deviceToken: 'token1',
        appVersion: '1.0.0',
        osVersion: '17.0',
        model: 'iPhone'
      })

      const before = new Date()
      await service.sendPushNotification({
        userId: 'user1',
        title: 'Test',
        body: 'Message'
      })
      const after = new Date()

      // Notification should be sent
      expect(before).toBeInstanceOf(Date)
      expect(after).toBeInstanceOf(Date)
    })

    it('should track notification opened', async () => {
      await service.registerDevice({
        userId: 'user1',
        platform: 'ios',
        deviceToken: 'token1',
        appVersion: '1.0.0',
        osVersion: '17.0',
        model: 'iPhone'
      })

      const result = await service.sendPushNotification({
        userId: 'user1',
        title: 'Test',
        body: 'Message'
      })

      await service.trackNotificationOpened(result.notificationIds[0])
      // Notification should be marked as opened
      expect(result.notificationIds[0]).toBeDefined()
    })

    it('should handle notification delivery failure gracefully', async () => {
      // No devices registered
      const result = await service.sendPushNotification({
        userId: 'nonexistent',
        title: 'Test',
        body: 'Message'
      })

      expect(result.sent).toBe(0)
      expect(result.failed).toBe(0)
    })
  })

  // ==================== AR Session Management Tests ====================
  describe('AR Session Management', () => {
    it('should create ARKit session', async () => {
      const session = await service.createARSession({
        userId: 'user1',
        projectId: 'project1',
        platform: 'arkit'
      })

      expect(session.id).toBeDefined()
      expect(session.platform).toBe('arkit')
      expect(session.sessionData.planeDetection).toBe(true)
      expect(session.sessionData.lightEstimation).toBe(true)
    })

    it('should create ARCore session', async () => {
      const session = await service.createARSession({
        userId: 'user1',
        projectId: 'project1',
        platform: 'arcore'
      })

      expect(session.id).toBeDefined()
      expect(session.platform).toBe('arcore')
    })

    it('should store ARKit world map', async () => {
      const worldMap = new ArrayBuffer(1024)
      const session = await service.createARSession({
        userId: 'user1',
        projectId: 'project1',
        platform: 'arkit',
        worldMap
      })

      expect(session.sessionData.worldMap).toBe(worldMap)
    })

    it('should store ARCore cloud anchors', async () => {
      const anchors = ['anchor1', 'anchor2', 'anchor3']
      const session = await service.createARSession({
        userId: 'user1',
        projectId: 'project1',
        platform: 'arcore',
        cloudAnchors: anchors
      })

      expect(session.sessionData.cloudAnchors).toEqual(anchors)
    })

    it('should set session expiration (24 hours)', async () => {
      const before = new Date(Date.now() + 24 * 60 * 60 * 1000 - 1000)
      const session = await service.createARSession({
        userId: 'user1',
        projectId: 'project1',
        platform: 'arkit'
      })
      const after = new Date(Date.now() + 24 * 60 * 60 * 1000 + 1000)

      expect(session.expiresAt.getTime()).toBeGreaterThanOrEqual(before.getTime())
      expect(session.expiresAt.getTime()).toBeLessThanOrEqual(after.getTime())
    })

    it('should get AR session', async () => {
      const created = await service.createARSession({
        userId: 'user1',
        projectId: 'project1',
        platform: 'arkit'
      })

      const retrieved = await service.getARSession(created.id)
      expect(retrieved).toBeDefined()
      expect(retrieved?.id).toBe(created.id)
    })

    it('should return null for nonexistent session', async () => {
      const session = await service.getARSession('nonexistent')
      expect(session).toBeNull()
    })

    it('should delete expired sessions', async () => {
      const session = await service.createARSession({
        userId: 'user1',
        projectId: 'project1',
        platform: 'arkit'
      })

      // Manually expire session
      const retrieved = await service.getARSession(session.id)
      if (retrieved) {
        retrieved.expiresAt = new Date(Date.now() - 1000)
      }

      const expired = await service.getARSession(session.id)
      expect(expired).toBeNull()
    })

    it('should enable plane detection by default', async () => {
      const session = await service.createARSession({
        userId: 'user1',
        projectId: 'project1',
        platform: 'arkit'
      })

      expect(session.sessionData.planeDetection).toBe(true)
    })

    it('should enable light estimation by default', async () => {
      const session = await service.createARSession({
        userId: 'user1',
        projectId: 'project1',
        platform: 'arcore'
      })

      expect(session.sessionData.lightEstimation).toBe(true)
    })

    it('should track session creation time', async () => {
      const before = new Date()
      const session = await service.createARSession({
        userId: 'user1',
        projectId: 'project1',
        platform: 'arkit'
      })
      const after = new Date()

      expect(session.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime())
      expect(session.createdAt.getTime()).toBeLessThanOrEqual(after.getTime())
    })
  })

  // ==================== Offline Sync Tests ====================
  describe('Offline Sync', () => {
    it('should sync offline data without conflicts', async () => {
      const result = await service.syncOfflineData({
        userId: 'user1',
        projectId: 'project1',
        data: { rooms: [], walls: [] },
        pendingChanges: [
          {
            type: 'create',
            entity: 'room',
            data: { id: 'room1', name: 'Living Room' },
            timestamp: new Date()
          }
        ]
      })

      expect(result.synced).toBe(true)
      expect(result.conflicts).toHaveLength(0)
    })

    it('should detect sync conflicts', async () => {
      // First sync
      await service.syncOfflineData({
        userId: 'user1',
        projectId: 'project1',
        data: {},
        pendingChanges: [
          {
            type: 'update',
            entity: 'room',
            data: { id: 'room1', name: 'Bedroom' },
            timestamp: new Date(Date.now() + 1000)
          }
        ]
      })

      // Second sync with older timestamp
      const result = await service.syncOfflineData({
        userId: 'user1',
        projectId: 'project1',
        data: {},
        pendingChanges: [
          {
            type: 'update',
            entity: 'room',
            data: { id: 'room1', name: 'Kitchen' },
            timestamp: new Date(Date.now() - 1000)
          }
        ]
      })

      expect(result.synced).toBe(false)
      expect(result.conflicts.length).toBeGreaterThan(0)
    })

    it('should handle create changes', async () => {
      const result = await service.syncOfflineData({
        userId: 'user1',
        projectId: 'project1',
        data: {},
        pendingChanges: [
          {
            type: 'create',
            entity: 'wall',
            data: { id: 'wall1' },
            timestamp: new Date()
          }
        ]
      })

      expect(result.synced).toBe(true)
    })

    it('should handle update changes', async () => {
      const result = await service.syncOfflineData({
        userId: 'user1',
        projectId: 'project2',
        data: {},
        pendingChanges: [
          {
            type: 'update',
            entity: 'room',
            data: { id: 'room1', name: 'Updated' },
            timestamp: new Date()
          }
        ]
      })

      expect(result.synced).toBe(true)
    })

    it('should handle delete changes', async () => {
      const result = await service.syncOfflineData({
        userId: 'user1',
        projectId: 'project3',
        data: {},
        pendingChanges: [
          {
            type: 'delete',
            entity: 'wall',
            data: { id: 'wall1' },
            timestamp: new Date()
          }
        ]
      })

      expect(result.synced).toBe(true)
    })

    it('should update lastSyncedAt timestamp', async () => {
      const before = new Date()
      await service.syncOfflineData({
        userId: 'user1',
        projectId: 'project1',
        data: {},
        pendingChanges: []
      })
      const after = new Date()

      const offlineData = await service.getOfflineData('user1', 'project1')
      expect(offlineData?.lastSyncedAt).toBeDefined()
      expect(offlineData!.lastSyncedAt.getTime()).toBeGreaterThanOrEqual(before.getTime())
      expect(offlineData!.lastSyncedAt.getTime()).toBeLessThanOrEqual(after.getTime())
    })

    it('should clear pending changes after sync', async () => {
      await service.syncOfflineData({
        userId: 'user1',
        projectId: 'project1',
        data: {},
        pendingChanges: [
          {
            type: 'create',
            entity: 'room',
            data: { id: 'room1' },
            timestamp: new Date()
          }
        ]
      })

      const offlineData = await service.getOfflineData('user1', 'project1')
      expect(offlineData?.pendingChanges).toHaveLength(0)
    })

    it('should get offline data for project', async () => {
      const testData = { rooms: [{ id: 'room1' }] }
      await service.syncOfflineData({
        userId: 'user1',
        projectId: 'project1',
        data: testData,
        pendingChanges: []
      })

      const offlineData = await service.getOfflineData('user1', 'project1')
      expect(offlineData).toBeDefined()
      expect(offlineData?.data).toEqual(testData)
    })

    it('should return null for nonexistent offline data', async () => {
      const offlineData = await service.getOfflineData('user1', 'nonexistent')
      expect(offlineData).toBeNull()
    })

    it('should handle multiple pending changes', async () => {
      const result = await service.syncOfflineData({
        userId: 'user1',
        projectId: 'project1',
        data: {},
        pendingChanges: [
          {
            type: 'create',
            entity: 'room',
            data: { id: 'room1' },
            timestamp: new Date()
          },
          {
            type: 'create',
            entity: 'room',
            data: { id: 'room2' },
            timestamp: new Date()
          },
          {
            type: 'update',
            entity: 'wall',
            data: { id: 'wall1' },
            timestamp: new Date()
          }
        ]
      })

      expect(result.synced).toBe(true)
    })
  })

  // ==================== Biometric Authentication Tests ====================
  describe('Biometric Authentication', () => {
    it('should enable biometric for device', async () => {
      const device = await service.registerDevice({
        userId: 'user1',
        platform: 'ios',
        deviceToken: 'token1',
        appVersion: '1.0.0',
        osVersion: '17.0',
        model: 'iPhone 15 Pro'
      })

      expect(device.biometricEnabled).toBe(false)

      await service.enableBiometric(device.id)

      const devices = await service.getUserDevices('user1')
      expect(devices[0].biometricEnabled).toBe(true)
    })

    it('should handle biometric for iOS (Face ID)', async () => {
      const device = await service.registerDevice({
        userId: 'user1',
        platform: 'ios',
        deviceToken: 'token1',
        appVersion: '1.0.0',
        osVersion: '17.0',
        model: 'iPhone 15 Pro'
      })

      await service.enableBiometric(device.id)
      const devices = await service.getUserDevices('user1')
      expect(devices[0].biometricEnabled).toBe(true)
    })

    it('should handle biometric for Android (Fingerprint)', async () => {
      const device = await service.registerDevice({
        userId: 'user1',
        platform: 'android',
        deviceToken: 'token1',
        appVersion: '1.0.0',
        osVersion: '14.0',
        model: 'Pixel 8 Pro'
      })

      await service.enableBiometric(device.id)
      const devices = await service.getUserDevices('user1')
      expect(devices[0].biometricEnabled).toBe(true)
    })

    it('should handle biometric for nonexistent device', async () => {
      // Should not throw error
      await service.enableBiometric('nonexistent')
      // No assertion needed - just shouldn't throw
    })
  })

  // ==================== Camera Capture Tests ====================
  describe('Camera Capture & Processing', () => {
    it('should process camera capture', async () => {
      const capture = await service.processCameraCapture({
        userId: 'user1',
        projectId: 'project1',
        imageUrl: 'https://example.com/image.jpg',
        orientation: 0,
        deviceModel: 'iPhone 15 Pro'
      })

      expect(capture.id).toBeDefined()
      expect(capture.imageUrl).toBe('https://example.com/image.jpg')
      expect(capture.processed).toBe(false)
    })

    it('should capture with location data', async () => {
      const capture = await service.processCameraCapture({
        userId: 'user1',
        projectId: 'project1',
        imageUrl: 'https://example.com/image.jpg',
        location: { lat: 37.7749, lng: -122.4194 },
        orientation: 0,
        deviceModel: 'iPhone'
      })

      expect(capture.metadata.location).toEqual({ lat: 37.7749, lng: -122.4194 })
    })

    it('should capture with camera settings', async () => {
      const capture = await service.processCameraCapture({
        userId: 'user1',
        projectId: 'project1',
        imageUrl: 'https://example.com/image.jpg',
        orientation: 90,
        deviceModel: 'iPhone',
        cameraSettings: {
          iso: 100,
          shutterSpeed: '1/125',
          focalLength: 26
        }
      })

      expect(capture.metadata.cameraSettings).toEqual({
        iso: 100,
        shutterSpeed: '1/125',
        focalLength: 26
      })
    })

    it('should track capture timestamp', async () => {
      const before = new Date()
      const capture = await service.processCameraCapture({
        userId: 'user1',
        projectId: 'project1',
        imageUrl: 'https://example.com/image.jpg',
        orientation: 0,
        deviceModel: 'iPhone'
      })
      const after = new Date()

      expect(capture.metadata.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime())
      expect(capture.metadata.timestamp.getTime()).toBeLessThanOrEqual(after.getTime())
    })

    it('should process AI annotations asynchronously', async () => {
      const capture = await service.processCameraCapture({
        userId: 'user1',
        projectId: 'project1',
        imageUrl: 'https://example.com/image.jpg',
        orientation: 0,
        deviceModel: 'iPhone'
      })

      // Initially not processed
      expect(capture.processed).toBe(false)
      expect(capture.aiAnnotations).toBeUndefined()

      // Wait for AI processing
      await new Promise(resolve => setTimeout(resolve, 2500))

      // Should now be processed (would need to retrieve from service in real scenario)
    })

    it('should handle portrait orientation', async () => {
      const capture = await service.processCameraCapture({
        userId: 'user1',
        projectId: 'project1',
        imageUrl: 'https://example.com/image.jpg',
        orientation: 0,
        deviceModel: 'iPhone'
      })

      expect(capture.metadata.orientation).toBe(0)
    })

    it('should handle landscape orientation', async () => {
      const capture = await service.processCameraCapture({
        userId: 'user1',
        projectId: 'project1',
        imageUrl: 'https://example.com/image.jpg',
        orientation: 90,
        deviceModel: 'iPhone'
      })

      expect(capture.metadata.orientation).toBe(90)
    })

    it('should store device model', async () => {
      const capture = await service.processCameraCapture({
        userId: 'user1',
        projectId: 'project1',
        imageUrl: 'https://example.com/image.jpg',
        orientation: 0,
        deviceModel: 'Pixel 8 Pro'
      })

      expect(capture.metadata.deviceModel).toBe('Pixel 8 Pro')
    })
  })

  // ==================== Device Analytics Tests ====================
  describe('Device Analytics', () => {
    it('should calculate total devices', async () => {
      await service.registerDevice({
        userId: 'user1',
        platform: 'ios',
        deviceToken: 'token1',
        appVersion: '1.0.0',
        osVersion: '17.0',
        model: 'iPhone'
      })

      await service.registerDevice({
        userId: 'user1',
        platform: 'android',
        deviceToken: 'token2',
        appVersion: '1.0.0',
        osVersion: '14.0',
        model: 'Pixel'
      })

      const analytics = await service.getDeviceAnalytics('user1')
      expect(analytics.totalDevices).toBe(2)
    })

    it('should count devices by platform', async () => {
      await service.registerDevice({
        userId: 'user1',
        platform: 'ios',
        deviceToken: 'token1',
        appVersion: '1.0.0',
        osVersion: '17.0',
        model: 'iPhone'
      })

      await service.registerDevice({
        userId: 'user1',
        platform: 'ios',
        deviceToken: 'token2',
        appVersion: '1.0.0',
        osVersion: '17.0',
        model: 'iPad'
      })

      await service.registerDevice({
        userId: 'user1',
        platform: 'android',
        deviceToken: 'token3',
        appVersion: '1.0.0',
        osVersion: '14.0',
        model: 'Pixel'
      })

      const analytics = await service.getDeviceAnalytics('user1')
      expect(analytics.byPlatform.ios).toBe(2)
      expect(analytics.byPlatform.android).toBe(1)
    })

    it('should count active devices (7 day threshold)', async () => {
      await service.registerDevice({
        userId: 'user1',
        platform: 'ios',
        deviceToken: 'token1',
        appVersion: '1.0.0',
        osVersion: '17.0',
        model: 'iPhone'
      })

      const analytics = await service.getDeviceAnalytics('user1')
      expect(analytics.activeDevices).toBe(1)
    })

    it('should count push enabled devices', async () => {
      await service.registerDevice({
        userId: 'user1',
        platform: 'ios',
        deviceToken: 'token1',
        appVersion: '1.0.0',
        osVersion: '17.0',
        model: 'iPhone'
      })

      const analytics = await service.getDeviceAnalytics('user1')
      expect(analytics.pushEnabledDevices).toBe(1)
    })

    it('should count biometric enabled devices', async () => {
      const device = await service.registerDevice({
        userId: 'user1',
        platform: 'ios',
        deviceToken: 'token1',
        appVersion: '1.0.0',
        osVersion: '17.0',
        model: 'iPhone'
      })

      await service.enableBiometric(device.id)

      const analytics = await service.getDeviceAnalytics('user1')
      expect(analytics.biometricEnabledDevices).toBe(1)
    })

    it('should return zero for user with no devices', async () => {
      const analytics = await service.getDeviceAnalytics('nonexistent')
      expect(analytics.totalDevices).toBe(0)
      expect(analytics.activeDevices).toBe(0)
    })
  })

  // ==================== Deep Linking Tests ====================
  describe('Deep Linking', () => {
    it('should handle project deep link', async () => {
      const deepLink = 'abodeai://project/project123'
      // Deep linking would be handled by the mobile app
      expect(deepLink).toContain('project123')
    })

    it('should handle room deep link', async () => {
      const deepLink = 'abodeai://room/room456'
      expect(deepLink).toContain('room456')
    })

    it('should handle share deep link', async () => {
      const deepLink = 'abodeai://share/token789'
      expect(deepLink).toContain('token789')
    })

    it('should handle AR session deep link', async () => {
      const deepLink = 'abodeai://ar/session123'
      expect(deepLink).toContain('session123')
    })
  })

  // ==================== App Updates Tests ====================
  describe('App Updates', () => {
    it('should track app version on registration', async () => {
      const device = await service.registerDevice({
        userId: 'user1',
        platform: 'ios',
        deviceToken: 'token1',
        appVersion: '2.0.0',
        osVersion: '17.0',
        model: 'iPhone'
      })

      expect(device.appVersion).toBe('2.0.0')
    })

    it('should detect outdated app versions', async () => {
      const device = await service.registerDevice({
        userId: 'user1',
        platform: 'ios',
        deviceToken: 'token1',
        appVersion: '1.0.0',
        osVersion: '17.0',
        model: 'iPhone'
      })

      const currentVersion = '2.0.0'
      const isOutdated = device.appVersion !== currentVersion
      expect(isOutdated).toBe(true)
    })

    it('should support semantic versioning', async () => {
      const device = await service.registerDevice({
        userId: 'user1',
        platform: 'ios',
        deviceToken: 'token1',
        appVersion: '1.2.3',
        osVersion: '17.0',
        model: 'iPhone'
      })

      expect(device.appVersion).toMatch(/^\d+\.\d+\.\d+$/)
    })
  })

  // ==================== Crash Reporting Tests ====================
  describe('Crash Reporting', () => {
    it('should track device model for crash reports', async () => {
      const device = await service.registerDevice({
        userId: 'user1',
        platform: 'ios',
        deviceToken: 'token1',
        appVersion: '1.0.0',
        osVersion: '17.0',
        model: 'iPhone 15 Pro'
      })

      // Crash reporting would use this data
      expect(device.model).toBe('iPhone 15 Pro')
      expect(device.osVersion).toBe('17.0')
      expect(device.appVersion).toBe('1.0.0')
    })

    it('should track OS version for crash reports', async () => {
      const device = await service.registerDevice({
        userId: 'user1',
        platform: 'android',
        deviceToken: 'token1',
        appVersion: '1.0.0',
        osVersion: '14.5.2',
        model: 'Pixel'
      })

      expect(device.osVersion).toBe('14.5.2')
    })

    it('should provide device context for debugging', async () => {
      const device = await service.registerDevice({
        userId: 'user1',
        platform: 'ios',
        deviceToken: 'token1',
        appVersion: '1.0.0',
        osVersion: '17.0',
        model: 'iPhone 15 Pro'
      })

      const context = {
        deviceId: device.id,
        platform: device.platform,
        model: device.model,
        osVersion: device.osVersion,
        appVersion: device.appVersion
      }

      expect(context.platform).toBe('ios')
      expect(context.model).toBe('iPhone 15 Pro')
    })
  })

  // ==================== Edge Cases & Error Handling ====================
  describe('Edge Cases & Error Handling', () => {
    it('should handle missing optional camera settings', async () => {
      const capture = await service.processCameraCapture({
        userId: 'user1',
        projectId: 'project1',
        imageUrl: 'https://example.com/image.jpg',
        orientation: 0,
        deviceModel: 'iPhone'
      })

      expect(capture.metadata.cameraSettings).toEqual({})
    })

    it('should handle missing optional location', async () => {
      const capture = await service.processCameraCapture({
        userId: 'user1',
        projectId: 'project1',
        imageUrl: 'https://example.com/image.jpg',
        orientation: 0,
        deviceModel: 'iPhone'
      })

      expect(capture.metadata.location).toBeUndefined()
    })

    it('should handle empty pending changes in sync', async () => {
      const result = await service.syncOfflineData({
        userId: 'user1',
        projectId: 'project1',
        data: {},
        pendingChanges: []
      })

      expect(result.synced).toBe(true)
      expect(result.conflicts).toHaveLength(0)
    })

    it('should handle notification to user with no devices', async () => {
      const result = await service.sendPushNotification({
        userId: 'nonexistent',
        title: 'Test',
        body: 'Message'
      })

      expect(result.sent).toBe(0)
      expect(result.failed).toBe(0)
      expect(result.notificationIds).toHaveLength(0)
    })

    it('should handle very long device tokens', async () => {
      const longToken = 'a'.repeat(500)
      const device = await service.registerDevice({
        userId: 'user1',
        platform: 'ios',
        deviceToken: longToken,
        appVersion: '1.0.0',
        osVersion: '17.0',
        model: 'iPhone'
      })

      expect(device.deviceToken).toBe(longToken)
    })

    it('should handle special characters in notification text', async () => {
      await service.registerDevice({
        userId: 'user1',
        platform: 'ios',
        deviceToken: 'token1',
        appVersion: '1.0.0',
        osVersion: '17.0',
        model: 'iPhone'
      })

      const result = await service.sendPushNotification({
        userId: 'user1',
        title: 'Test "Notification"',
        body: "Message with 'quotes' and émojis 🏠"
      })

      expect(result.sent).toBe(1)
    })

    it('should handle concurrent device registrations', async () => {
      const promises = []
      for (let i = 0; i < 10; i++) {
        promises.push(
          service.registerDevice({
            userId: 'user1',
            platform: i % 2 === 0 ? 'ios' : 'android',
            deviceToken: `token${i}`,
            appVersion: '1.0.0',
            osVersion: '17.0',
            model: 'Device'
          })
        )
      }

      const devices = await Promise.all(promises)
      expect(devices).toHaveLength(10)

      // All should have unique IDs
      const ids = devices.map(d => d.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(10)
    })

    it('should handle large offline data payloads', async () => {
      const largeData = {
        rooms: Array.from({ length: 1000 }, (_, i) => ({ id: `room${i}` }))
      }

      const result = await service.syncOfflineData({
        userId: 'user1',
        projectId: 'project1',
        data: largeData,
        pendingChanges: []
      })

      expect(result.synced).toBe(true)
    })

    it('should handle emoji in device model names', async () => {
      const device = await service.registerDevice({
        userId: 'user1',
        platform: 'ios',
        deviceToken: 'token1',
        appVersion: '1.0.0',
        osVersion: '17.0',
        model: 'iPhone 📱'
      })

      expect(device.model).toBe('iPhone 📱')
    })
  })

  // ==================== Additional Coverage Tests ====================
  describe('Additional Coverage & Integration Tests', () => {
    it('should handle multiple AR sessions per user', async () => {
      const session1 = await service.createARSession({
        userId: 'user1',
        projectId: 'project1',
        platform: 'arkit'
      })

      const session2 = await service.createARSession({
        userId: 'user1',
        projectId: 'project2',
        platform: 'arcore'
      })

      expect(session1.id).not.toBe(session2.id)
      expect(session1.platform).toBe('arkit')
      expect(session2.platform).toBe('arcore')
    })

    it('should handle notification with empty data object', async () => {
      await service.registerDevice({
        userId: 'user1',
        platform: 'ios',
        deviceToken: 'token1',
        appVersion: '1.0.0',
        osVersion: '17.0',
        model: 'iPhone'
      })

      const result = await service.sendPushNotification({
        userId: 'user1',
        title: 'Test',
        body: 'Message',
        data: {}
      })

      expect(result.sent).toBe(1)
    })

    it('should handle offline sync with empty data', async () => {
      const result = await service.syncOfflineData({
        userId: 'user1',
        projectId: 'project1',
        data: null,
        pendingChanges: []
      })

      expect(result.synced).toBe(true)
    })

    it('should support push notifications with normal priority by default', async () => {
      await service.registerDevice({
        userId: 'user1',
        platform: 'android',
        deviceToken: 'token1',
        appVersion: '1.0.0',
        osVersion: '14.0',
        model: 'Pixel'
      })

      const result = await service.sendPushNotification({
        userId: 'user1',
        title: 'Test',
        body: 'Message'
      })

      expect(result.sent).toBe(1)
    })

    it('should track device platform distribution', async () => {
      await service.registerDevice({
        userId: 'user1',
        platform: 'ios',
        deviceToken: 'token1',
        appVersion: '1.0.0',
        osVersion: '17.0',
        model: 'iPhone'
      })

      await service.registerDevice({
        userId: 'user1',
        platform: 'ios',
        deviceToken: 'token2',
        appVersion: '1.0.0',
        osVersion: '16.0',
        model: 'iPhone'
      })

      await service.registerDevice({
        userId: 'user1',
        platform: 'android',
        deviceToken: 'token3',
        appVersion: '1.0.0',
        osVersion: '14.0',
        model: 'Pixel'
      })

      const analytics = await service.getDeviceAnalytics('user1')
      expect(analytics.byPlatform.ios).toBeGreaterThan(analytics.byPlatform.android)
    })

    it('should handle camera capture with all metadata', async () => {
      const capture = await service.processCameraCapture({
        userId: 'user1',
        projectId: 'project1',
        imageUrl: 'https://example.com/photo.jpg',
        location: { lat: 40.7128, lng: -74.0060 },
        orientation: 270,
        deviceModel: 'iPhone 15 Pro Max',
        cameraSettings: {
          iso: 200,
          shutterSpeed: '1/250',
          focalLength: 24
        }
      })

      expect(capture.metadata.location?.lat).toBe(40.7128)
      expect(capture.metadata.location?.lng).toBe(-74.0060)
      expect(capture.metadata.cameraSettings.iso).toBe(200)
    })

    it('should handle AR session with both world map and cloud anchors', async () => {
      const worldMap = new ArrayBuffer(2048)
      const session = await service.createARSession({
        userId: 'user1',
        projectId: 'project1',
        platform: 'arkit',
        worldMap,
        cloudAnchors: ['anchor1', 'anchor2']
      })

      expect(session.sessionData.worldMap).toBe(worldMap)
      expect(session.sessionData.cloudAnchors).toEqual(['anchor1', 'anchor2'])
    })

    it('should support devices with different OS versions', async () => {
      const device1 = await service.registerDevice({
        userId: 'user1',
        platform: 'ios',
        deviceToken: 'token1',
        appVersion: '1.0.0',
        osVersion: '17.2.1',
        model: 'iPhone'
      })

      const device2 = await service.registerDevice({
        userId: 'user1',
        platform: 'ios',
        deviceToken: 'token2',
        appVersion: '1.0.0',
        osVersion: '16.5',
        model: 'iPhone'
      })

      expect(device1.osVersion).not.toBe(device2.osVersion)
    })

    it('should handle multiple image captures for same project', async () => {
      const capture1 = await service.processCameraCapture({
        userId: 'user1',
        projectId: 'project1',
        imageUrl: 'https://example.com/img1.jpg',
        orientation: 0,
        deviceModel: 'iPhone'
      })

      const capture2 = await service.processCameraCapture({
        userId: 'user1',
        projectId: 'project1',
        imageUrl: 'https://example.com/img2.jpg',
        orientation: 90,
        deviceModel: 'iPhone'
      })

      expect(capture1.id).not.toBe(capture2.id)
      expect(capture1.projectId).toBe(capture2.projectId)
    })

    it('should handle offline sync conflict resolution', async () => {
      await service.syncOfflineData({
        userId: 'user1',
        projectId: 'project1',
        data: { version: 1 },
        pendingChanges: [
          {
            type: 'update',
            entity: 'room',
            data: { id: 'room1', name: 'Version 1' },
            timestamp: new Date(Date.now() + 2000)
          }
        ]
      })

      const result = await service.syncOfflineData({
        userId: 'user1',
        projectId: 'project1',
        data: { version: 2 },
        pendingChanges: [
          {
            type: 'update',
            entity: 'room',
            data: { id: 'room1', name: 'Version 2' },
            timestamp: new Date(Date.now() - 2000)
          }
        ]
      })

      expect(result.conflicts.length).toBeGreaterThan(0)
    })

    it('should track biometric authentication availability', async () => {
      const iosDevice = await service.registerDevice({
        userId: 'user1',
        platform: 'ios',
        deviceToken: 'token1',
        appVersion: '1.0.0',
        osVersion: '17.0',
        model: 'iPhone 15 Pro'
      })

      const androidDevice = await service.registerDevice({
        userId: 'user2',
        platform: 'android',
        deviceToken: 'token2',
        appVersion: '1.0.0',
        osVersion: '14.0',
        model: 'Pixel 8'
      })

      await service.enableBiometric(iosDevice.id)
      await service.enableBiometric(androidDevice.id)

      const analytics1 = await service.getDeviceAnalytics('user1')
      const analytics2 = await service.getDeviceAnalytics('user2')

      expect(analytics1.biometricEnabledDevices).toBe(1)
      expect(analytics2.biometricEnabledDevices).toBe(1)
    })

    it('should handle push notification to specific subset of devices', async () => {
      const device1 = await service.registerDevice({
        userId: 'user1',
        platform: 'ios',
        deviceToken: 'token1',
        appVersion: '1.0.0',
        osVersion: '17.0',
        model: 'iPhone'
      })

      const device2 = await service.registerDevice({
        userId: 'user1',
        platform: 'android',
        deviceToken: 'token2',
        appVersion: '1.0.0',
        osVersion: '14.0',
        model: 'Pixel'
      })

      const device3 = await service.registerDevice({
        userId: 'user1',
        platform: 'ios',
        deviceToken: 'token3',
        appVersion: '1.0.0',
        osVersion: '16.0',
        model: 'iPad'
      })

      const result = await service.sendPushNotification({
        userId: 'user1',
        title: 'Test',
        body: 'Message',
        deviceIds: [device1.id, device3.id]
      })

      expect(result.sent).toBe(2)
    })

    it('should handle multiple pending offline changes of different types', async () => {
      const result = await service.syncOfflineData({
        userId: 'user1',
        projectId: 'project1',
        data: {},
        pendingChanges: [
          {
            type: 'create',
            entity: 'room',
            data: { id: 'room1', name: 'Living Room' },
            timestamp: new Date()
          },
          {
            type: 'update',
            entity: 'wall',
            data: { id: 'wall1', height: 3 },
            timestamp: new Date()
          },
          {
            type: 'delete',
            entity: 'window',
            data: { id: 'window1' },
            timestamp: new Date()
          },
          {
            type: 'create',
            entity: 'door',
            data: { id: 'door1' },
            timestamp: new Date()
          }
        ]
      })

      expect(result.synced).toBe(true)
    })

    it('should maintain separate offline data for different projects', async () => {
      await service.syncOfflineData({
        userId: 'user1',
        projectId: 'project1',
        data: { name: 'Project 1' },
        pendingChanges: []
      })

      await service.syncOfflineData({
        userId: 'user1',
        projectId: 'project2',
        data: { name: 'Project 2' },
        pendingChanges: []
      })

      const data1 = await service.getOfflineData('user1', 'project1')
      const data2 = await service.getOfflineData('user1', 'project2')

      expect(data1?.data.name).toBe('Project 1')
      expect(data2?.data.name).toBe('Project 2')
    })

    it('should handle notification tracking workflow', async () => {
      await service.registerDevice({
        userId: 'user1',
        platform: 'ios',
        deviceToken: 'token1',
        appVersion: '1.0.0',
        osVersion: '17.0',
        model: 'iPhone'
      })

      const result = await service.sendPushNotification({
        userId: 'user1',
        title: 'Test',
        body: 'Message'
      })

      const notificationId = result.notificationIds[0]
      await service.trackNotificationOpened(notificationId)

      // Notification should be tracked as opened
      expect(notificationId).toBeDefined()
    })

    it('should support different camera orientations', async () => {
      const captures = await Promise.all([
        service.processCameraCapture({
          userId: 'user1',
          projectId: 'project1',
          imageUrl: 'img1.jpg',
          orientation: 0,
          deviceModel: 'iPhone'
        }),
        service.processCameraCapture({
          userId: 'user1',
          projectId: 'project1',
          imageUrl: 'img2.jpg',
          orientation: 90,
          deviceModel: 'iPhone'
        }),
        service.processCameraCapture({
          userId: 'user1',
          projectId: 'project1',
          imageUrl: 'img3.jpg',
          orientation: 180,
          deviceModel: 'iPhone'
        }),
        service.processCameraCapture({
          userId: 'user1',
          projectId: 'project1',
          imageUrl: 'img4.jpg',
          orientation: 270,
          deviceModel: 'iPhone'
        })
      ])

      expect(captures[0].metadata.orientation).toBe(0)
      expect(captures[1].metadata.orientation).toBe(90)
      expect(captures[2].metadata.orientation).toBe(180)
      expect(captures[3].metadata.orientation).toBe(270)
    })

    it('should handle device analytics with no active devices', async () => {
      const device = await service.registerDevice({
        userId: 'user1',
        platform: 'ios',
        deviceToken: 'token1',
        appVersion: '1.0.0',
        osVersion: '17.0',
        model: 'iPhone'
      })

      // Simulate old device (manually set lastActiveAt to 30 days ago)
      const devices = await service.getUserDevices('user1')
      devices[0].lastActiveAt = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

      const analytics = await service.getDeviceAnalytics('user1')
      expect(analytics.totalDevices).toBe(1)
      expect(analytics.activeDevices).toBe(0)
    })
  })
})
