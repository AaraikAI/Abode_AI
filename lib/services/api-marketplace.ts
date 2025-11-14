/**
 * API Marketplace Service
 *
 * Developer portal for API key management, webhooks, and usage analytics
 * Enables third-party integrations and custom applications
 */

export interface APIKey {
  id: string
  userId: string
  orgId: string
  name: string
  key: string // Hashed in database
  prefix: string // First 8 chars for display (e.g., "sk_live_...")

  environment: 'development' | 'staging' | 'production'

  permissions: {
    scopes: APIScope[]
    rateLimit: {
      requestsPerMinute: number
      requestsPerHour: number
      requestsPerDay: number
    }
    ipWhitelist?: string[]
  }

  usage: {
    totalRequests: number
    lastUsedAt?: Date
    monthlyRequests: number
    monthlyResetAt: Date
  }

  status: 'active' | 'revoked' | 'expired'
  expiresAt?: Date
  createdAt: Date
  lastRotatedAt?: Date
}

export type APIScope =
  | 'projects:read'
  | 'projects:write'
  | 'render:create'
  | 'render:read'
  | 'models:read'
  | 'models:write'
  | 'simulation:run'
  | 'marketplace:read'
  | 'marketplace:write'
  | 'analytics:read'
  | 'webhooks:manage'

export interface Webhook {
  id: string
  userId: string
  orgId: string
  name: string
  url: string
  events: WebhookEvent[]
  secret: string // For signature verification

  status: 'active' | 'disabled' | 'failed'
  failureCount: number
  lastFailureAt?: Date
  lastSuccessAt?: Date

  retryPolicy: {
    maxRetries: number
    backoffMultiplier: number
    initialDelayMs: number
  }

  headers?: Record<string, string>

  createdAt: Date
  updatedAt: Date
}

export type WebhookEvent =
  | 'project.created'
  | 'project.updated'
  | 'render.started'
  | 'render.completed'
  | 'render.failed'
  | 'simulation.completed'
  | 'asset.purchased'
  | 'training.completed'

export interface WebhookDelivery {
  id: string
  webhookId: string
  event: WebhookEvent
  payload: any

  status: 'pending' | 'success' | 'failed'
  attemptCount: number
  lastAttemptAt?: Date
  nextRetryAt?: Date

  response?: {
    statusCode: number
    body: string
    headers: Record<string, string>
    duration: number
  }

  error?: string

  createdAt: Date
}

export interface UsageMetrics {
  period: 'hour' | 'day' | 'week' | 'month'
  apiKey?: string
  endpoint?: string

  metrics: {
    totalRequests: number
    successfulRequests: number
    failedRequests: number
    averageResponseTime: number
    p95ResponseTime: number
    p99ResponseTime: number
    errorRate: number

    byStatusCode: Record<number, number>
    byEndpoint: Record<string, number>
    byMethod: Record<string, number>
  }

  bandwidth: {
    requestBytes: number
    responseBytes: number
  }

  costs: {
    computeCredits: number
    storageCredits: number
    totalCredits: number
    estimatedUsd: number
  }
}

export interface RateLimitInfo {
  limit: number
  remaining: number
  reset: Date
  retryAfter?: number
}

export class APIMarketplaceService {
  private readonly KEY_PREFIX = 'sk_'
  private readonly KEY_LENGTH = 32

  /**
   * Generate new API key
   */
  async createAPIKey(
    userId: string,
    orgId: string,
    config: {
      name: string
      environment: APIKey['environment']
      scopes: APIScope[]
      rateLimit?: Partial<APIKey['permissions']['rateLimit']>
      expiresAt?: Date
    }
  ): Promise<APIKey> {
    // Generate cryptographically secure key
    const rawKey = this.generateSecureKey()
    const hashedKey = await this.hashKey(rawKey)
    const prefix = `${this.KEY_PREFIX}${config.environment.slice(0, 4)}_`

    const apiKey: APIKey = {
      id: `apikey_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      orgId,
      name: config.name,
      key: hashedKey,
      prefix: prefix + rawKey.slice(0, 8),
      environment: config.environment,
      permissions: {
        scopes: config.scopes,
        rateLimit: {
          requestsPerMinute: config.rateLimit?.requestsPerMinute || 60,
          requestsPerHour: config.rateLimit?.requestsPerHour || 3600,
          requestsPerDay: config.rateLimit?.requestsPerDay || 100000
        }
      },
      usage: {
        totalRequests: 0,
        monthlyRequests: 0,
        monthlyResetAt: this.getNextMonthStart()
      },
      status: 'active',
      expiresAt: config.expiresAt,
      createdAt: new Date()
    }

    // Store in database (hashed key only)
    console.log('API Key created:', apiKey.id)

    // Return with unhashed key (only time it's visible)
    return {
      ...apiKey,
      key: prefix + rawKey // Return full key once
    }
  }

  /**
   * Generate secure random key
   */
  private generateSecureKey(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let key = ''
    const array = new Uint8Array(this.KEY_LENGTH)
    crypto.getRandomValues(array)

    for (let i = 0; i < this.KEY_LENGTH; i++) {
      key += chars[array[i] % chars.length]
    }

    return key
  }

  /**
   * Hash API key for storage
   */
  private async hashKey(key: string): Promise<string> {
    // In production, use bcrypt or similar
    const encoder = new TextEncoder()
    const data = encoder.encode(key)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  /**
   * Validate API key and check permissions
   */
  async validateAPIKey(
    key: string,
    requiredScope?: APIScope
  ): Promise<{ valid: boolean; apiKey?: APIKey; error?: string }> {
    // Hash provided key
    const hashedKey = await this.hashKey(key.replace(/^sk_[a-z]{4}_/, ''))

    // Look up in database
    const apiKey = await this.getAPIKeyByHash(hashedKey)

    if (!apiKey) {
      return { valid: false, error: 'Invalid API key' }
    }

    // Check status
    if (apiKey.status !== 'active') {
      return { valid: false, error: 'API key is revoked or expired' }
    }

    // Check expiration
    if (apiKey.expiresAt && new Date() > apiKey.expiresAt) {
      return { valid: false, error: 'API key has expired' }
    }

    // Check scope
    if (requiredScope && !apiKey.permissions.scopes.includes(requiredScope)) {
      return { valid: false, error: 'Insufficient permissions' }
    }

    // Check rate limit
    const rateLimitOk = await this.checkRateLimit(apiKey)
    if (!rateLimitOk) {
      return { valid: false, error: 'Rate limit exceeded' }
    }

    return { valid: true, apiKey }
  }

  /**
   * Check rate limit
   */
  private async checkRateLimit(apiKey: APIKey): Promise<boolean> {
    // In production, use Redis for distributed rate limiting
    // For now, simplified check

    const now = Date.now()
    const minuteKey = `ratelimit:${apiKey.id}:minute:${Math.floor(now / 60000)}`
    const hourKey = `ratelimit:${apiKey.id}:hour:${Math.floor(now / 3600000)}`
    const dayKey = `ratelimit:${apiKey.id}:day:${Math.floor(now / 86400000)}`

    // Would check Redis counters in production
    // return requestsInMinute < apiKey.permissions.rateLimit.requestsPerMinute

    return true // Simplified
  }

  /**
   * Get rate limit info for API key
   */
  async getRateLimitInfo(apiKey: APIKey): Promise<RateLimitInfo> {
    // In production, fetch from Redis
    const limit = apiKey.permissions.rateLimit.requestsPerMinute
    const remaining = Math.floor(Math.random() * limit) // Simulated
    const reset = new Date(Date.now() + 60000)

    return {
      limit,
      remaining,
      reset,
      retryAfter: remaining === 0 ? 60 : undefined
    }
  }

  /**
   * Rotate API key
   */
  async rotateAPIKey(apiKeyId: string): Promise<{ newKey: string }> {
    const oldKey = await this.getAPIKey(apiKeyId)
    if (!oldKey) {
      throw new Error('API key not found')
    }

    // Generate new key
    const rawKey = this.generateSecureKey()
    const hashedKey = await this.hashKey(rawKey)

    // Update in database
    oldKey.key = hashedKey
    oldKey.lastRotatedAt = new Date()

    console.log('API Key rotated:', apiKeyId)

    return {
      newKey: oldKey.prefix + rawKey
    }
  }

  /**
   * Revoke API key
   */
  async revokeAPIKey(apiKeyId: string): Promise<void> {
    const apiKey = await this.getAPIKey(apiKeyId)
    if (apiKey) {
      apiKey.status = 'revoked'
      console.log('API Key revoked:', apiKeyId)
    }
  }

  /**
   * Create webhook
   */
  async createWebhook(
    userId: string,
    orgId: string,
    config: {
      name: string
      url: string
      events: WebhookEvent[]
      headers?: Record<string, string>
    }
  ): Promise<Webhook> {
    // Generate webhook secret for signature verification
    const secret = this.generateSecureKey()

    const webhook: Webhook = {
      id: `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      orgId,
      name: config.name,
      url: config.url,
      events: config.events,
      secret,
      status: 'active',
      failureCount: 0,
      retryPolicy: {
        maxRetries: 3,
        backoffMultiplier: 2,
        initialDelayMs: 1000
      },
      headers: config.headers,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    console.log('Webhook created:', webhook.id)

    return webhook
  }

  /**
   * Trigger webhook
   */
  async triggerWebhook(
    event: WebhookEvent,
    payload: any
  ): Promise<void> {
    // Find all webhooks subscribed to this event
    const webhooks = await this.getWebhooksByEvent(event)

    for (const webhook of webhooks) {
      await this.deliverWebhook(webhook, event, payload)
    }
  }

  /**
   * Deliver webhook with retries
   */
  private async deliverWebhook(
    webhook: Webhook,
    event: WebhookEvent,
    payload: any
  ): Promise<void> {
    const delivery: WebhookDelivery = {
      id: `delivery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      webhookId: webhook.id,
      event,
      payload,
      status: 'pending',
      attemptCount: 0,
      createdAt: new Date()
    }

    // Attempt delivery
    for (let attempt = 1; attempt <= webhook.retryPolicy.maxRetries + 1; attempt++) {
      delivery.attemptCount = attempt
      delivery.lastAttemptAt = new Date()

      try {
        const startTime = Date.now()

        // Generate signature
        const signature = await this.generateWebhookSignature(
          webhook.secret,
          payload
        )

        // Send webhook
        const response = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': signature,
            'X-Webhook-Event': event,
            'X-Webhook-Delivery': delivery.id,
            ...webhook.headers
          },
          body: JSON.stringify(payload)
        })

        const duration = Date.now() - startTime
        const responseBody = await response.text()

        delivery.response = {
          statusCode: response.status,
          body: responseBody,
          headers: Object.fromEntries(response.headers.entries()),
          duration
        }

        if (response.ok) {
          // Success
          delivery.status = 'success'
          webhook.lastSuccessAt = new Date()
          webhook.failureCount = 0
          console.log(`Webhook delivered successfully: ${webhook.id}`)
          break
        } else {
          throw new Error(`HTTP ${response.status}: ${responseBody}`)
        }
      } catch (error: any) {
        delivery.error = error.message
        webhook.failureCount++
        webhook.lastFailureAt = new Date()

        if (attempt < webhook.retryPolicy.maxRetries + 1) {
          // Calculate retry delay with exponential backoff
          const delay = webhook.retryPolicy.initialDelayMs *
                       Math.pow(webhook.retryPolicy.backoffMultiplier, attempt - 1)
          delivery.nextRetryAt = new Date(Date.now() + delay)

          console.log(`Webhook delivery failed, retrying in ${delay}ms`)
          await new Promise(resolve => setTimeout(resolve, delay))
        } else {
          // All retries exhausted
          delivery.status = 'failed'

          if (webhook.failureCount >= 5) {
            webhook.status = 'failed'
            console.error(`Webhook disabled after ${webhook.failureCount} failures`)
          }

          break
        }
      }
    }

    // Store delivery record
    console.log('Webhook delivery recorded:', delivery.id, delivery.status)
  }

  /**
   * Generate webhook signature for verification
   */
  private async generateWebhookSignature(
    secret: string,
    payload: any
  ): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(JSON.stringify(payload))
    const keyData = encoder.encode(secret)

    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )

    const signature = await crypto.subtle.sign('HMAC', key, data)
    const hashArray = Array.from(new Uint8Array(signature))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  /**
   * Get usage metrics
   */
  async getUsageMetrics(
    orgId: string,
    period: UsageMetrics['period'],
    apiKeyId?: string
  ): Promise<UsageMetrics> {
    // In production, aggregate from analytics database
    const metrics: UsageMetrics = {
      period,
      apiKey: apiKeyId,
      metrics: {
        totalRequests: 12500,
        successfulRequests: 12250,
        failedRequests: 250,
        averageResponseTime: 145,
        p95ResponseTime: 320,
        p99ResponseTime: 580,
        errorRate: 0.02,
        byStatusCode: {
          200: 11800,
          201: 450,
          400: 150,
          404: 50,
          500: 50
        },
        byEndpoint: {
          '/api/projects': 4500,
          '/api/render': 3200,
          '/api/models': 2800,
          '/api/simulation': 2000
        },
        byMethod: {
          GET: 8500,
          POST: 3500,
          PUT: 400,
          DELETE: 100
        }
      },
      bandwidth: {
        requestBytes: 125000000, // 125 MB
        responseBytes: 450000000 // 450 MB
      },
      costs: {
        computeCredits: 1250,
        storageCredits: 300,
        totalCredits: 1550,
        estimatedUsd: 15.50
      }
    }

    return metrics
  }

  /**
   * Test webhook
   */
  async testWebhook(webhookId: string): Promise<{ success: boolean; error?: string }> {
    const webhook = await this.getWebhook(webhookId)
    if (!webhook) {
      return { success: false, error: 'Webhook not found' }
    }

    const testPayload = {
      event: 'webhook.test',
      timestamp: new Date().toISOString(),
      data: {
        message: 'This is a test webhook delivery'
      }
    }

    try {
      await this.deliverWebhook(webhook, 'project.created', testPayload)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Helper methods (would query database in production)
  private async getAPIKeyByHash(hash: string): Promise<APIKey | null> {
    return null
  }

  private async getAPIKey(id: string): Promise<APIKey | null> {
    return null
  }

  private async getWebhook(id: string): Promise<Webhook | null> {
    return null
  }

  private async getWebhooksByEvent(event: WebhookEvent): Promise<Webhook[]> {
    return []
  }

  private getNextMonthStart(): Date {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth() + 1, 1)
  }
}
