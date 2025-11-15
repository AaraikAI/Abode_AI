/**
 * Zapier Integration Service
 *
 * Manages trigger registration, action execution, and webhook handling for Zapier integrations
 */

export interface ZapierConfig {
  apiKey: string
  webhookBaseUrl: string
  appId?: string
  appVersion?: string
}

export interface ZapierTrigger {
  id: string
  key: string
  name: string
  description: string
  type: 'polling' | 'hook' | 'rest_hook'

  endpoint?: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'

  inputFields: ZapierField[]
  outputFields: ZapierField[]

  sampleData?: any

  webhookUrl?: string
  webhookSubscribeUrl?: string
  webhookUnsubscribeUrl?: string
}

export interface ZapierAction {
  id: string
  key: string
  name: string
  description: string

  endpoint: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

  inputFields: ZapierField[]
  outputFields: ZapierField[]

  sampleData?: any
}

export interface ZapierField {
  key: string
  label: string
  type: 'string' | 'text' | 'integer' | 'number' | 'boolean' | 'datetime' | 'file' | 'password'
  required: boolean
  helpText?: string
  default?: any
  choices?: Array<{ label: string; value: any }>
  dynamic?: string
  list?: boolean
}

export interface WebhookSubscription {
  id: string
  triggerId: string
  webhookUrl: string
  targetUrl: string
  eventType: string
  filters?: Record<string, any>
  createdAt: Date
  isActive: boolean
}

export interface TriggerEvent {
  id: string
  triggerId: string
  eventType: string
  timestamp: Date
  payload: any
  metadata?: Record<string, any>
}

export interface ActionExecution {
  id: string
  actionId: string
  status: 'pending' | 'running' | 'success' | 'error'
  input: any
  output?: any
  error?: {
    message: string
    code?: string
    details?: any
  }
  startedAt: Date
  completedAt?: Date
  retryCount: number
}

export interface ZapierAuth {
  type: 'api_key' | 'oauth2' | 'session' | 'basic'
  test?: {
    url: string
    method: string
    headers?: Record<string, string>
  }
  fields?: ZapierField[]
}

export interface ZapierError {
  type: 'authentication' | 'validation' | 'network' | 'rate_limit' | 'server' | 'not_found'
  message: string
  code?: string
  statusCode?: number
  details?: any
  retry?: boolean
}

export class ZapierService {
  private config: ZapierConfig
  private triggers: Map<string, ZapierTrigger> = new Map()
  private actions: Map<string, ZapierAction> = new Map()
  private webhookSubscriptions: Map<string, WebhookSubscription> = new Map()
  private actionExecutions: Map<string, ActionExecution> = new Map()
  private triggerEvents: TriggerEvent[] = []

  constructor(config: ZapierConfig) {
    this.config = config
  }

  // ===========================
  // Trigger Registration
  // ===========================

  /**
   * Register a new trigger
   */
  registerTrigger(trigger: Omit<ZapierTrigger, 'id'>): ZapierTrigger {
    const id = `trigger_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const fullTrigger: ZapierTrigger = {
      id,
      ...trigger
    }

    this.triggers.set(id, fullTrigger)
    return fullTrigger
  }

  /**
   * Get trigger by ID
   */
  getTrigger(triggerId: string): ZapierTrigger | null {
    return this.triggers.get(triggerId) || null
  }

  /**
   * Get trigger by key
   */
  getTriggerByKey(key: string): ZapierTrigger | null {
    for (const trigger of this.triggers.values()) {
      if (trigger.key === key) {
        return trigger
      }
    }
    return null
  }

  /**
   * List all triggers
   */
  listTriggers(): ZapierTrigger[] {
    return Array.from(this.triggers.values())
  }

  /**
   * Update trigger
   */
  updateTrigger(triggerId: string, updates: Partial<ZapierTrigger>): ZapierTrigger {
    const trigger = this.triggers.get(triggerId)
    if (!trigger) {
      throw this.createError('not_found', `Trigger ${triggerId} not found`)
    }

    const updated = { ...trigger, ...updates, id: triggerId }
    this.triggers.set(triggerId, updated)
    return updated
  }

  /**
   * Delete trigger
   */
  deleteTrigger(triggerId: string): void {
    const deleted = this.triggers.delete(triggerId)
    if (!deleted) {
      throw this.createError('not_found', `Trigger ${triggerId} not found`)
    }

    // Clean up webhook subscriptions
    for (const [subId, sub] of this.webhookSubscriptions.entries()) {
      if (sub.triggerId === triggerId) {
        this.webhookSubscriptions.delete(subId)
      }
    }
  }

  // ===========================
  // Action Registration
  // ===========================

  /**
   * Register a new action
   */
  registerAction(action: Omit<ZapierAction, 'id'>): ZapierAction {
    const id = `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const fullAction: ZapierAction = {
      id,
      ...action
    }

    this.actions.set(id, fullAction)
    return fullAction
  }

  /**
   * Get action by ID
   */
  getAction(actionId: string): ZapierAction | null {
    return this.actions.get(actionId) || null
  }

  /**
   * Get action by key
   */
  getActionByKey(key: string): ZapierAction | null {
    for (const action of this.actions.values()) {
      if (action.key === key) {
        return action
      }
    }
    return null
  }

  /**
   * List all actions
   */
  listActions(): ZapierAction[] {
    return Array.from(this.actions.values())
  }

  /**
   * Update action
   */
  updateAction(actionId: string, updates: Partial<ZapierAction>): ZapierAction {
    const action = this.actions.get(actionId)
    if (!action) {
      throw this.createError('not_found', `Action ${actionId} not found`)
    }

    const updated = { ...action, ...updates, id: actionId }
    this.actions.set(actionId, updated)
    return updated
  }

  /**
   * Delete action
   */
  deleteAction(actionId: string): void {
    const deleted = this.actions.delete(actionId)
    if (!deleted) {
      throw this.createError('not_found', `Action ${actionId} not found`)
    }
  }

  // ===========================
  // Webhook Handling
  // ===========================

  /**
   * Subscribe to webhook
   */
  async subscribeWebhook(
    triggerId: string,
    targetUrl: string,
    eventType: string,
    filters?: Record<string, any>
  ): Promise<WebhookSubscription> {
    const trigger = this.triggers.get(triggerId)
    if (!trigger) {
      throw this.createError('not_found', `Trigger ${triggerId} not found`)
    }

    if (trigger.type !== 'hook' && trigger.type !== 'rest_hook') {
      throw this.createError('validation', 'Trigger does not support webhooks')
    }

    const subscription: WebhookSubscription = {
      id: `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      triggerId,
      webhookUrl: `${this.config.webhookBaseUrl}/${triggerId}`,
      targetUrl,
      eventType,
      filters,
      createdAt: new Date(),
      isActive: true
    }

    this.webhookSubscriptions.set(subscription.id, subscription)

    // Call webhook subscribe endpoint if defined
    if (trigger.webhookSubscribeUrl) {
      await this.makeApiRequest(trigger.webhookSubscribeUrl, {
        method: 'POST',
        body: {
          hookUrl: subscription.webhookUrl,
          targetUrl: subscription.targetUrl,
          eventType: subscription.eventType
        }
      })
    }

    return subscription
  }

  /**
   * Unsubscribe from webhook
   */
  async unsubscribeWebhook(subscriptionId: string): Promise<void> {
    const subscription = this.webhookSubscriptions.get(subscriptionId)
    if (!subscription) {
      throw this.createError('not_found', `Webhook subscription ${subscriptionId} not found`)
    }

    const trigger = this.triggers.get(subscription.triggerId)

    // Call webhook unsubscribe endpoint if defined
    if (trigger?.webhookUnsubscribeUrl) {
      await this.makeApiRequest(trigger.webhookUnsubscribeUrl, {
        method: 'DELETE',
        body: {
          hookUrl: subscription.webhookUrl
        }
      })
    }

    this.webhookSubscriptions.delete(subscriptionId)
  }

  /**
   * Handle incoming webhook
   */
  async handleWebhook(
    triggerId: string,
    payload: any,
    headers?: Record<string, string>
  ): Promise<void> {
    const trigger = this.triggers.get(triggerId)
    if (!trigger) {
      throw this.createError('not_found', `Trigger ${triggerId} not found`)
    }

    // Create trigger event
    const event: TriggerEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      triggerId,
      eventType: trigger.key,
      timestamp: new Date(),
      payload,
      metadata: { headers }
    }

    this.triggerEvents.push(event)

    // Find matching subscriptions
    const subscriptions = Array.from(this.webhookSubscriptions.values())
      .filter(sub => sub.triggerId === triggerId && sub.isActive)

    // Send to each subscriber
    for (const subscription of subscriptions) {
      try {
        await this.sendWebhookToTarget(subscription.targetUrl, payload)
      } catch (error) {
        console.error(`Failed to send webhook to ${subscription.targetUrl}:`, error)
      }
    }
  }

  /**
   * Send webhook data to target URL
   */
  private async sendWebhookToTarget(targetUrl: string, data: any): Promise<void> {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': `Zapier/${this.config.appVersion || '1.0.0'}`
      },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      throw this.createError(
        'network',
        `Webhook delivery failed: ${response.status} ${response.statusText}`,
        response.status
      )
    }
  }

  /**
   * List webhook subscriptions
   */
  listWebhookSubscriptions(triggerId?: string): WebhookSubscription[] {
    const subscriptions = Array.from(this.webhookSubscriptions.values())

    if (triggerId) {
      return subscriptions.filter(sub => sub.triggerId === triggerId)
    }

    return subscriptions
  }

  // ===========================
  // Action Execution
  // ===========================

  /**
   * Execute an action
   */
  async executeAction(
    actionKey: string,
    input: any
  ): Promise<ActionExecution> {
    const action = this.getActionByKey(actionKey)
    if (!action) {
      throw this.createError('not_found', `Action ${actionKey} not found`)
    }

    // Validate input
    const validationError = this.validateInput(input, action.inputFields)
    if (validationError) {
      throw validationError
    }

    const execution: ActionExecution = {
      id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      actionId: action.id,
      status: 'running',
      input,
      startedAt: new Date(),
      retryCount: 0
    }

    this.actionExecutions.set(execution.id, execution)

    try {
      // Make API request
      const response = await this.makeApiRequest(action.endpoint, {
        method: action.method,
        body: input
      })

      execution.status = 'success'
      execution.output = response
      execution.completedAt = new Date()
    } catch (error) {
      execution.status = 'error'
      execution.error = {
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error
      }
      execution.completedAt = new Date()
    }

    this.actionExecutions.set(execution.id, execution)
    return execution
  }

  /**
   * Get action execution status
   */
  getActionExecution(executionId: string): ActionExecution | null {
    return this.actionExecutions.get(executionId) || null
  }

  /**
   * List action executions
   */
  listActionExecutions(actionId?: string): ActionExecution[] {
    const executions = Array.from(this.actionExecutions.values())

    if (actionId) {
      return executions.filter(exec => exec.actionId === actionId)
    }

    return executions
  }

  /**
   * Retry failed action execution
   */
  async retryActionExecution(executionId: string): Promise<ActionExecution> {
    const execution = this.actionExecutions.get(executionId)
    if (!execution) {
      throw this.createError('not_found', `Execution ${executionId} not found`)
    }

    if (execution.status !== 'error') {
      throw this.createError('validation', 'Can only retry failed executions')
    }

    const action = this.actions.get(execution.actionId)
    if (!action) {
      throw this.createError('not_found', 'Associated action not found')
    }

    execution.status = 'running'
    execution.retryCount++
    execution.error = undefined

    try {
      const response = await this.makeApiRequest(action.endpoint, {
        method: action.method,
        body: execution.input
      })

      execution.status = 'success'
      execution.output = response
      execution.completedAt = new Date()
    } catch (error) {
      execution.status = 'error'
      execution.error = {
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error
      }
      execution.completedAt = new Date()
    }

    this.actionExecutions.set(executionId, execution)
    return execution
  }

  // ===========================
  // Authentication
  // ===========================

  /**
   * Test authentication
   */
  async testAuthentication(auth: ZapierAuth): Promise<boolean> {
    if (!auth.test) {
      return true // No test endpoint defined
    }

    try {
      const response = await this.makeApiRequest(auth.test.url, {
        method: auth.test.method as any,
        headers: auth.test.headers
      })

      return response !== null
    } catch (error) {
      throw this.createError('authentication', 'Authentication test failed')
    }
  }

  /**
   * Validate API key
   */
  validateApiKey(apiKey: string): boolean {
    // Simple validation - in production, you'd verify against a database
    return apiKey.length > 0 && apiKey === this.config.apiKey
  }

  // ===========================
  // Trigger Events
  // ===========================

  /**
   * Get trigger events
   */
  getTriggerEvents(
    triggerId?: string,
    limit: number = 100
  ): TriggerEvent[] {
    let events = this.triggerEvents

    if (triggerId) {
      events = events.filter(e => e.triggerId === triggerId)
    }

    return events
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  }

  /**
   * Emit trigger event (for polling triggers)
   */
  emitTriggerEvent(
    triggerId: string,
    payload: any
  ): TriggerEvent {
    const trigger = this.triggers.get(triggerId)
    if (!trigger) {
      throw this.createError('not_found', `Trigger ${triggerId} not found`)
    }

    const event: TriggerEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      triggerId,
      eventType: trigger.key,
      timestamp: new Date(),
      payload
    }

    this.triggerEvents.push(event)
    return event
  }

  // ===========================
  // Error Reporting
  // ===========================

  /**
   * Create standardized error
   */
  private createError(
    type: ZapierError['type'],
    message: string,
    statusCode?: number
  ): ZapierError {
    return {
      type,
      message,
      statusCode,
      retry: type === 'network' || type === 'rate_limit'
    }
  }

  /**
   * Report error to Zapier
   */
  async reportError(error: ZapierError): Promise<void> {
    // In production, this would send to Zapier's error reporting endpoint
    console.error('Zapier Error:', error)
  }

  // ===========================
  // Helper Methods
  // ===========================

  /**
   * Make API request with authentication
   */
  private async makeApiRequest(
    url: string,
    options: {
      method: string
      headers?: Record<string, string>
      body?: any
    }
  ): Promise<any> {
    const headers = {
      'Content-Type': 'application/json',
      'X-Api-Key': this.config.apiKey,
      ...options.headers
    }

    const response = await fetch(url, {
      method: options.method,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined
    })

    if (response.status === 401) {
      throw this.createError('authentication', 'Invalid authentication credentials', 401)
    }

    if (response.status === 429) {
      throw this.createError('rate_limit', 'Rate limit exceeded', 429)
    }

    if (!response.ok) {
      throw this.createError(
        'server',
        `API request failed: ${response.status} ${response.statusText}`,
        response.status
      )
    }

    if (response.status === 204) {
      return null
    }

    return response.json()
  }

  /**
   * Validate input against field definitions
   */
  private validateInput(
    input: any,
    fields: ZapierField[]
  ): ZapierError | null {
    for (const field of fields) {
      if (field.required && !(field.key in input)) {
        return this.createError('validation', `Required field missing: ${field.key}`)
      }

      if (field.key in input) {
        const value = input[field.key]

        // Type validation
        if (field.type === 'integer' && !Number.isInteger(value)) {
          return this.createError('validation', `Field ${field.key} must be an integer`)
        }

        if (field.type === 'number' && typeof value !== 'number') {
          return this.createError('validation', `Field ${field.key} must be a number`)
        }

        if (field.type === 'boolean' && typeof value !== 'boolean') {
          return this.createError('validation', `Field ${field.key} must be a boolean`)
        }

        // Choices validation
        if (field.choices && field.choices.length > 0) {
          const validValues = field.choices.map(c => c.value)
          if (!validValues.includes(value)) {
            return this.createError(
              'validation',
              `Field ${field.key} must be one of: ${validValues.join(', ')}`
            )
          }
        }
      }
    }

    return null
  }

  /**
   * Get service statistics
   */
  getStatistics(): {
    triggers: number
    actions: number
    webhookSubscriptions: number
    totalExecutions: number
    successfulExecutions: number
    failedExecutions: number
    totalEvents: number
  } {
    const executions = Array.from(this.actionExecutions.values())

    return {
      triggers: this.triggers.size,
      actions: this.actions.size,
      webhookSubscriptions: this.webhookSubscriptions.size,
      totalExecutions: executions.length,
      successfulExecutions: executions.filter(e => e.status === 'success').length,
      failedExecutions: executions.filter(e => e.status === 'error').length,
      totalEvents: this.triggerEvents.length
    }
  }
}
