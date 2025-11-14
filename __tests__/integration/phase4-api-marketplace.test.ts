/**
 * Integration Tests for API Marketplace
 */

import { APIMarketplaceService, APIScope } from '@/lib/services/api-marketplace'

describe('API Marketplace Service', () => {
  let service: APIMarketplaceService
  const testUserId = 'test-user-123'
  const testOrgId = 'test-org-456'

  beforeEach(() => {
    service = new APIMarketplaceService()
  })

  describe('API Key Management', () => {
    test('should create API key with valid configuration', async () => {
      const apiKey = await service.createAPIKey(testUserId, testOrgId, {
        name: 'Test API Key',
        environment: 'development',
        scopes: ['read', 'write'],
        rateLimit: {
          requestsPerMinute: 60,
          requestsPerHour: 1000,
          requestsPerDay: 10000
        }
      })

      expect(apiKey).toBeDefined()
      expect(apiKey.userId).toBe(testUserId)
      expect(apiKey.orgId).toBe(testOrgId)
      expect(apiKey.name).toBe('Test API Key')
      expect(apiKey.environment).toBe('development')
      expect(apiKey.scopes).toContain('read')
      expect(apiKey.scopes).toContain('write')
      expect(apiKey.key).toMatch(/^abode_[a-z0-9]{32}\.[a-f0-9]{64}$/)
    })

    test('should validate API key correctly', async () => {
      const apiKey = await service.createAPIKey(testUserId, testOrgId, {
        name: 'Test Key',
        environment: 'production',
        scopes: ['read']
      })

      const validation = await service.validateAPIKey(apiKey.key, ['read'])

      expect(validation.valid).toBe(true)
      expect(validation.apiKey).toBeDefined()
      expect(validation.apiKey?.userId).toBe(testUserId)
    })

    test('should reject invalid API key', async () => {
      const validation = await service.validateAPIKey('invalid-key', ['read'])

      expect(validation.valid).toBe(false)
      expect(validation.reason).toBe('Invalid API key format')
    })

    test('should check rate limits', async () => {
      const apiKey = await service.createAPIKey(testUserId, testOrgId, {
        name: 'Rate Limited Key',
        environment: 'production',
        scopes: ['read'],
        rateLimit: {
          requestsPerMinute: 2,
          requestsPerHour: 10,
          requestsPerDay: 100
        }
      })

      // First request should pass
      const check1 = await service.checkRateLimit(apiKey.id)
      expect(check1.allowed).toBe(true)

      // Second request should pass
      const check2 = await service.checkRateLimit(apiKey.id)
      expect(check2.allowed).toBe(true)

      // Third request should be rate limited
      const check3 = await service.checkRateLimit(apiKey.id)
      expect(check3.allowed).toBe(false)
      expect(check3.reason).toBe('Rate limit exceeded: requestsPerMinute')
    })

    test('should track API usage metrics', async () => {
      const apiKey = await service.createAPIKey(testUserId, testOrgId, {
        name: 'Metrics Test Key',
        environment: 'production',
        scopes: ['read']
      })

      await service.trackAPIUsage(apiKey.id, {
        endpoint: '/api/projects',
        method: 'GET',
        statusCode: 200,
        responseTime: 45,
        requestSize: 512,
        responseSize: 2048
      })

      const stats = await service.getUsageStats(apiKey.id, 'day')

      expect(stats.totalRequests).toBeGreaterThan(0)
      expect(stats.successRate).toBeGreaterThan(0)
      expect(stats.averageResponseTime).toBeGreaterThan(0)
    })
  })

  describe('Webhook Management', () => {
    test('should register webhook', async () => {
      const webhook = await service.registerWebhook(testUserId, testOrgId, {
        url: 'https://example.com/webhook',
        events: ['project.created', 'render.completed'],
        description: 'Test webhook'
      })

      expect(webhook).toBeDefined()
      expect(webhook.userId).toBe(testUserId)
      expect(webhook.url).toBe('https://example.com/webhook')
      expect(webhook.events).toContain('project.created')
      expect(webhook.active).toBe(true)
    })

    test('should verify webhook signature', () => {
      const secret = 'test-secret-key'
      const payload = { event: 'test', data: { foo: 'bar' } }

      const signature = service.generateWebhookSignature(payload, secret)
      const isValid = service.verifyWebhookSignature(payload, signature, secret)

      expect(isValid).toBe(true)
    })

    test('should reject invalid webhook signature', () => {
      const secret = 'test-secret-key'
      const payload = { event: 'test', data: { foo: 'bar' } }

      const signature = service.generateWebhookSignature(payload, secret)
      const isValid = service.verifyWebhookSignature(
        payload,
        signature,
        'wrong-secret'
      )

      expect(isValid).toBe(false)
    })
  })

  describe('Developer Portal', () => {
    test('should generate API documentation', async () => {
      const docs = await service.generateAPIDocumentation()

      expect(docs).toBeDefined()
      expect(docs.version).toBeDefined()
      expect(docs.endpoints).toBeDefined()
      expect(Array.isArray(docs.endpoints)).toBe(true)
      expect(docs.endpoints.length).toBeGreaterThan(0)
    })

    test('should generate SDK code examples', async () => {
      const examples = await service.generateSDKExamples('typescript')

      expect(examples).toBeDefined()
      expect(examples.installation).toBeDefined()
      expect(examples.authentication).toBeDefined()
      expect(examples.usage).toBeDefined()
      expect(examples.usage.length).toBeGreaterThan(0)
    })
  })
})
