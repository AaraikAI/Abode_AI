/**
 * Zapier Integration Service Test Suite
 *
 * Comprehensive tests for triggers, actions, webhooks, and authentication
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import {
  ZapierService,
  type ZapierConfig,
  type ZapierTrigger,
  type ZapierAction,
  type ZapierField,
  type ZapierAuth,
  type WebhookSubscription
} from '../../lib/services/zapier'

// Mock fetch globally
global.fetch = jest.fn() as any

describe('ZapierService', () => {
  let service: ZapierService
  let config: ZapierConfig

  beforeEach(() => {
    config = {
      apiKey: 'test-api-key-123',
      webhookBaseUrl: 'https://hooks.example.com',
      appId: 'test-app',
      appVersion: '1.0.0'
    }

    service = new ZapierService(config)
    ;(fetch as jest.MockedFunction<typeof fetch>).mockClear()
  })

  // ===========================
  // Trigger Registration Tests
  // ===========================

  describe('Trigger Registration', () => {
    it('should register a polling trigger', () => {
      const trigger = service.registerTrigger({
        key: 'new_project',
        name: 'New Project',
        description: 'Triggers when a new project is created',
        type: 'polling',
        endpoint: '/api/projects',
        method: 'GET',
        inputFields: [],
        outputFields: [
          { key: 'id', label: 'Project ID', type: 'string', required: true },
          { key: 'name', label: 'Project Name', type: 'string', required: true }
        ]
      })

      expect(trigger.id).toBeDefined()
      expect(trigger.key).toBe('new_project')
      expect(trigger.type).toBe('polling')
    })

    it('should register a webhook trigger', () => {
      const trigger = service.registerTrigger({
        key: 'project_completed',
        name: 'Project Completed',
        description: 'Triggers when a project is completed',
        type: 'hook',
        inputFields: [],
        outputFields: [
          { key: 'projectId', label: 'Project ID', type: 'string', required: true }
        ],
        webhookSubscribeUrl: 'https://api.example.com/webhooks/subscribe',
        webhookUnsubscribeUrl: 'https://api.example.com/webhooks/unsubscribe'
      })

      expect(trigger.type).toBe('hook')
      expect(trigger.webhookSubscribeUrl).toBeDefined()
    })

    it('should get trigger by ID', () => {
      const trigger = service.registerTrigger({
        key: 'test_trigger',
        name: 'Test Trigger',
        description: 'Test',
        type: 'polling',
        inputFields: [],
        outputFields: []
      })

      const found = service.getTrigger(trigger.id)

      expect(found).toBeDefined()
      expect(found?.id).toBe(trigger.id)
    })

    it('should get trigger by key', () => {
      service.registerTrigger({
        key: 'unique_key',
        name: 'Unique Trigger',
        description: 'Test',
        type: 'polling',
        inputFields: [],
        outputFields: []
      })

      const found = service.getTriggerByKey('unique_key')

      expect(found).toBeDefined()
      expect(found?.key).toBe('unique_key')
    })

    it('should list all triggers', () => {
      service.registerTrigger({
        key: 'trigger1',
        name: 'Trigger 1',
        description: 'Test',
        type: 'polling',
        inputFields: [],
        outputFields: []
      })

      service.registerTrigger({
        key: 'trigger2',
        name: 'Trigger 2',
        description: 'Test',
        type: 'hook',
        inputFields: [],
        outputFields: []
      })

      const triggers = service.listTriggers()

      expect(triggers.length).toBe(2)
    })

    it('should update trigger', () => {
      const trigger = service.registerTrigger({
        key: 'test_trigger',
        name: 'Original Name',
        description: 'Original',
        type: 'polling',
        inputFields: [],
        outputFields: []
      })

      const updated = service.updateTrigger(trigger.id, {
        name: 'Updated Name',
        description: 'Updated description'
      })

      expect(updated.name).toBe('Updated Name')
      expect(updated.description).toBe('Updated description')
    })

    it('should delete trigger', () => {
      const trigger = service.registerTrigger({
        key: 'test_trigger',
        name: 'Test',
        description: 'Test',
        type: 'polling',
        inputFields: [],
        outputFields: []
      })

      service.deleteTrigger(trigger.id)

      const found = service.getTrigger(trigger.id)
      expect(found).toBeNull()
    })

    it('should throw error when updating non-existent trigger', () => {
      expect(() => {
        service.updateTrigger('non-existent', { name: 'Test' })
      }).toThrow('not found')
    })

    it('should throw error when deleting non-existent trigger', () => {
      expect(() => {
        service.deleteTrigger('non-existent')
      }).toThrow('not found')
    })
  })

  // ===========================
  // Action Registration Tests
  // ===========================

  describe('Action Registration', () => {
    it('should register an action', () => {
      const action = service.registerAction({
        key: 'create_project',
        name: 'Create Project',
        description: 'Creates a new project',
        endpoint: 'https://api.example.com/projects',
        method: 'POST',
        inputFields: [
          { key: 'name', label: 'Project Name', type: 'string', required: true },
          { key: 'description', label: 'Description', type: 'text', required: false }
        ],
        outputFields: [
          { key: 'id', label: 'Project ID', type: 'string', required: true },
          { key: 'name', label: 'Project Name', type: 'string', required: true }
        ]
      })

      expect(action.id).toBeDefined()
      expect(action.key).toBe('create_project')
      expect(action.method).toBe('POST')
    })

    it('should get action by ID', () => {
      const action = service.registerAction({
        key: 'test_action',
        name: 'Test Action',
        description: 'Test',
        endpoint: 'https://api.example.com/test',
        method: 'POST',
        inputFields: [],
        outputFields: []
      })

      const found = service.getAction(action.id)

      expect(found).toBeDefined()
      expect(found?.id).toBe(action.id)
    })

    it('should get action by key', () => {
      service.registerAction({
        key: 'unique_action',
        name: 'Unique Action',
        description: 'Test',
        endpoint: 'https://api.example.com/test',
        method: 'POST',
        inputFields: [],
        outputFields: []
      })

      const found = service.getActionByKey('unique_action')

      expect(found).toBeDefined()
      expect(found?.key).toBe('unique_action')
    })

    it('should list all actions', () => {
      service.registerAction({
        key: 'action1',
        name: 'Action 1',
        description: 'Test',
        endpoint: 'https://api.example.com/action1',
        method: 'POST',
        inputFields: [],
        outputFields: []
      })

      service.registerAction({
        key: 'action2',
        name: 'Action 2',
        description: 'Test',
        endpoint: 'https://api.example.com/action2',
        method: 'PUT',
        inputFields: [],
        outputFields: []
      })

      const actions = service.listActions()

      expect(actions.length).toBe(2)
    })

    it('should update action', () => {
      const action = service.registerAction({
        key: 'test_action',
        name: 'Original',
        description: 'Original',
        endpoint: 'https://api.example.com/test',
        method: 'POST',
        inputFields: [],
        outputFields: []
      })

      const updated = service.updateAction(action.id, {
        name: 'Updated Action'
      })

      expect(updated.name).toBe('Updated Action')
    })

    it('should delete action', () => {
      const action = service.registerAction({
        key: 'test_action',
        name: 'Test',
        description: 'Test',
        endpoint: 'https://api.example.com/test',
        method: 'POST',
        inputFields: [],
        outputFields: []
      })

      service.deleteAction(action.id)

      const found = service.getAction(action.id)
      expect(found).toBeNull()
    })
  })

  // ===========================
  // Webhook Handling Tests
  // ===========================

  describe('Webhook Handling', () => {
    it('should subscribe to webhook', async () => {
      const trigger = service.registerTrigger({
        key: 'webhook_trigger',
        name: 'Webhook Trigger',
        description: 'Test',
        type: 'hook',
        inputFields: [],
        outputFields: []
      })

      ;(fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      } as Response)

      const subscription = await service.subscribeWebhook(
        trigger.id,
        'https://hooks.zapier.com/catch/123',
        'project.created'
      )

      expect(subscription.id).toBeDefined()
      expect(subscription.triggerId).toBe(trigger.id)
      expect(subscription.targetUrl).toBe('https://hooks.zapier.com/catch/123')
      expect(subscription.isActive).toBe(true)
    })

    it('should throw error when subscribing to non-webhook trigger', async () => {
      const trigger = service.registerTrigger({
        key: 'polling_trigger',
        name: 'Polling Trigger',
        description: 'Test',
        type: 'polling',
        inputFields: [],
        outputFields: []
      })

      await expect(
        service.subscribeWebhook(trigger.id, 'https://hooks.zapier.com/catch/123', 'test')
      ).rejects.toThrow('does not support webhooks')
    })

    it('should unsubscribe from webhook', async () => {
      const trigger = service.registerTrigger({
        key: 'webhook_trigger',
        name: 'Webhook Trigger',
        description: 'Test',
        type: 'hook',
        inputFields: [],
        outputFields: []
      })

      const subscription = await service.subscribeWebhook(
        trigger.id,
        'https://hooks.zapier.com/catch/123',
        'test'
      )

      await service.unsubscribeWebhook(subscription.id)

      const subscriptions = service.listWebhookSubscriptions(trigger.id)
      expect(subscriptions.length).toBe(0)
    })

    it('should handle incoming webhook', async () => {
      const trigger = service.registerTrigger({
        key: 'webhook_trigger',
        name: 'Webhook Trigger',
        description: 'Test',
        type: 'hook',
        inputFields: [],
        outputFields: []
      })

      const subscription = await service.subscribeWebhook(
        trigger.id,
        'https://hooks.zapier.com/catch/123',
        'test'
      )

      ;(fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        status: 200
      } as Response)

      const payload = { projectId: '123', name: 'Test Project' }
      await service.handleWebhook(trigger.id, payload)

      expect(fetch).toHaveBeenCalledWith(
        subscription.targetUrl,
        expect.objectContaining({
          method: 'POST'
        })
      )
    })

    it('should list webhook subscriptions', async () => {
      const trigger = service.registerTrigger({
        key: 'webhook_trigger',
        name: 'Webhook Trigger',
        description: 'Test',
        type: 'hook',
        inputFields: [],
        outputFields: []
      })

      await service.subscribeWebhook(trigger.id, 'https://hooks.zapier.com/catch/1', 'test')
      await service.subscribeWebhook(trigger.id, 'https://hooks.zapier.com/catch/2', 'test')

      const subscriptions = service.listWebhookSubscriptions(trigger.id)

      expect(subscriptions.length).toBe(2)
    })

    it('should filter subscriptions by trigger ID', async () => {
      const trigger1 = service.registerTrigger({
        key: 'trigger1',
        name: 'Trigger 1',
        description: 'Test',
        type: 'hook',
        inputFields: [],
        outputFields: []
      })

      const trigger2 = service.registerTrigger({
        key: 'trigger2',
        name: 'Trigger 2',
        description: 'Test',
        type: 'hook',
        inputFields: [],
        outputFields: []
      })

      await service.subscribeWebhook(trigger1.id, 'https://hooks.zapier.com/catch/1', 'test')
      await service.subscribeWebhook(trigger2.id, 'https://hooks.zapier.com/catch/2', 'test')

      const subscriptions = service.listWebhookSubscriptions(trigger1.id)

      expect(subscriptions.length).toBe(1)
      expect(subscriptions[0].triggerId).toBe(trigger1.id)
    })
  })

  // ===========================
  // Action Execution Tests
  // ===========================

  describe('Action Execution', () => {
    it('should execute action successfully', async () => {
      const action = service.registerAction({
        key: 'create_item',
        name: 'Create Item',
        description: 'Test',
        endpoint: 'https://api.example.com/items',
        method: 'POST',
        inputFields: [
          { key: 'name', label: 'Name', type: 'string', required: true }
        ],
        outputFields: [
          { key: 'id', label: 'ID', type: 'string', required: true }
        ]
      })

      ;(fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'item-123', name: 'Test Item' })
      } as Response)

      const execution = await service.executeAction('create_item', { name: 'Test Item' })

      expect(execution.status).toBe('success')
      expect(execution.output).toEqual({ id: 'item-123', name: 'Test Item' })
    })

    it('should validate required fields', async () => {
      service.registerAction({
        key: 'create_item',
        name: 'Create Item',
        description: 'Test',
        endpoint: 'https://api.example.com/items',
        method: 'POST',
        inputFields: [
          { key: 'name', label: 'Name', type: 'string', required: true }
        ],
        outputFields: []
      })

      await expect(
        service.executeAction('create_item', {})
      ).rejects.toThrow('Required field missing: name')
    })

    it('should handle execution errors', async () => {
      const action = service.registerAction({
        key: 'create_item',
        name: 'Create Item',
        description: 'Test',
        endpoint: 'https://api.example.com/items',
        method: 'POST',
        inputFields: [],
        outputFields: []
      })

      ;(fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      } as Response)

      const execution = await service.executeAction('create_item', {})

      expect(execution.status).toBe('error')
      expect(execution.error).toBeDefined()
    })

    it('should get action execution by ID', async () => {
      const action = service.registerAction({
        key: 'test_action',
        name: 'Test',
        description: 'Test',
        endpoint: 'https://api.example.com/test',
        method: 'POST',
        inputFields: [],
        outputFields: []
      })

      ;(fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      } as Response)

      const execution = await service.executeAction('test_action', {})
      const found = service.getActionExecution(execution.id)

      expect(found).toBeDefined()
      expect(found?.id).toBe(execution.id)
    })

    it('should list action executions', async () => {
      const action = service.registerAction({
        key: 'test_action',
        name: 'Test',
        description: 'Test',
        endpoint: 'https://api.example.com/test',
        method: 'POST',
        inputFields: [],
        outputFields: []
      })

      ;(fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      } as Response)

      await service.executeAction('test_action', {})
      await service.executeAction('test_action', {})

      const executions = service.listActionExecutions()

      expect(executions.length).toBeGreaterThanOrEqual(2)
    })

    it('should retry failed execution', async () => {
      const action = service.registerAction({
        key: 'test_action',
        name: 'Test',
        description: 'Test',
        endpoint: 'https://api.example.com/test',
        method: 'POST',
        inputFields: [],
        outputFields: []
      })

      ;(fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Error'
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true })
        } as Response)

      const execution = await service.executeAction('test_action', {})
      expect(execution.status).toBe('error')

      const retried = await service.retryActionExecution(execution.id)

      expect(retried.status).toBe('success')
      expect(retried.retryCount).toBe(1)
    })

    it('should throw error when retrying non-failed execution', async () => {
      const action = service.registerAction({
        key: 'test_action',
        name: 'Test',
        description: 'Test',
        endpoint: 'https://api.example.com/test',
        method: 'POST',
        inputFields: [],
        outputFields: []
      })

      ;(fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      } as Response)

      const execution = await service.executeAction('test_action', {})

      await expect(
        service.retryActionExecution(execution.id)
      ).rejects.toThrow('Can only retry failed executions')
    })
  })

  // ===========================
  // Authentication Tests
  // ===========================

  describe('Authentication', () => {
    it('should test authentication with test endpoint', async () => {
      const auth: ZapierAuth = {
        type: 'api_key',
        test: {
          url: 'https://api.example.com/auth/test',
          method: 'GET',
          headers: {
            'X-Api-Key': config.apiKey
          }
        }
      }

      ;(fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ authenticated: true })
      } as Response)

      const result = await service.testAuthentication(auth)

      expect(result).toBe(true)
    })

    it('should handle authentication test failure', async () => {
      const auth: ZapierAuth = {
        type: 'api_key',
        test: {
          url: 'https://api.example.com/auth/test',
          method: 'GET'
        }
      }

      ;(fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      } as Response)

      await expect(
        service.testAuthentication(auth)
      ).rejects.toThrow('Authentication test failed')
    })

    it('should validate API key', () => {
      expect(service.validateApiKey('test-api-key-123')).toBe(true)
      expect(service.validateApiKey('wrong-key')).toBe(false)
      expect(service.validateApiKey('')).toBe(false)
    })
  })

  // ===========================
  // Field Validation Tests
  // ===========================

  describe('Field Validation', () => {
    it('should validate integer fields', async () => {
      service.registerAction({
        key: 'test_action',
        name: 'Test',
        description: 'Test',
        endpoint: 'https://api.example.com/test',
        method: 'POST',
        inputFields: [
          { key: 'count', label: 'Count', type: 'integer', required: true }
        ],
        outputFields: []
      })

      await expect(
        service.executeAction('test_action', { count: 3.14 })
      ).rejects.toThrow('must be an integer')
    })

    it('should validate number fields', async () => {
      service.registerAction({
        key: 'test_action',
        name: 'Test',
        description: 'Test',
        endpoint: 'https://api.example.com/test',
        method: 'POST',
        inputFields: [
          { key: 'price', label: 'Price', type: 'number', required: true }
        ],
        outputFields: []
      })

      await expect(
        service.executeAction('test_action', { price: 'not-a-number' })
      ).rejects.toThrow('must be a number')
    })

    it('should validate boolean fields', async () => {
      service.registerAction({
        key: 'test_action',
        name: 'Test',
        description: 'Test',
        endpoint: 'https://api.example.com/test',
        method: 'POST',
        inputFields: [
          { key: 'active', label: 'Active', type: 'boolean', required: true }
        ],
        outputFields: []
      })

      await expect(
        service.executeAction('test_action', { active: 'yes' })
      ).rejects.toThrow('must be a boolean')
    })

    it('should validate choice fields', async () => {
      service.registerAction({
        key: 'test_action',
        name: 'Test',
        description: 'Test',
        endpoint: 'https://api.example.com/test',
        method: 'POST',
        inputFields: [
          {
            key: 'status',
            label: 'Status',
            type: 'string',
            required: true,
            choices: [
              { label: 'Active', value: 'active' },
              { label: 'Inactive', value: 'inactive' }
            ]
          }
        ],
        outputFields: []
      })

      await expect(
        service.executeAction('test_action', { status: 'invalid' })
      ).rejects.toThrow('must be one of')
    })
  })

  // ===========================
  // Trigger Events Tests
  // ===========================

  describe('Trigger Events', () => {
    it('should emit trigger event', () => {
      const trigger = service.registerTrigger({
        key: 'test_trigger',
        name: 'Test',
        description: 'Test',
        type: 'polling',
        inputFields: [],
        outputFields: []
      })

      const event = service.emitTriggerEvent(trigger.id, { data: 'test' })

      expect(event.id).toBeDefined()
      expect(event.triggerId).toBe(trigger.id)
      expect(event.payload).toEqual({ data: 'test' })
    })

    it('should get trigger events', () => {
      const trigger = service.registerTrigger({
        key: 'test_trigger',
        name: 'Test',
        description: 'Test',
        type: 'polling',
        inputFields: [],
        outputFields: []
      })

      service.emitTriggerEvent(trigger.id, { data: 1 })
      service.emitTriggerEvent(trigger.id, { data: 2 })

      const events = service.getTriggerEvents(trigger.id)

      expect(events.length).toBe(2)
    })

    it('should limit returned events', () => {
      const trigger = service.registerTrigger({
        key: 'test_trigger',
        name: 'Test',
        description: 'Test',
        type: 'polling',
        inputFields: [],
        outputFields: []
      })

      for (let i = 0; i < 150; i++) {
        service.emitTriggerEvent(trigger.id, { data: i })
      }

      const events = service.getTriggerEvents(trigger.id, 50)

      expect(events.length).toBe(50)
    })

    it('should return events in descending order', () => {
      const trigger = service.registerTrigger({
        key: 'test_trigger',
        name: 'Test',
        description: 'Test',
        type: 'polling',
        inputFields: [],
        outputFields: []
      })

      service.emitTriggerEvent(trigger.id, { order: 1 })
      service.emitTriggerEvent(trigger.id, { order: 2 })
      service.emitTriggerEvent(trigger.id, { order: 3 })

      const events = service.getTriggerEvents(trigger.id)

      expect(events[0].payload.order).toBe(3)
      expect(events[1].payload.order).toBe(2)
      expect(events[2].payload.order).toBe(1)
    })
  })

  // ===========================
  // Error Reporting Tests
  // ===========================

  describe('Error Reporting', () => {
    it('should report errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      await service.reportError({
        type: 'authentication',
        message: 'Authentication failed',
        statusCode: 401
      })

      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('should handle network errors during API calls', async () => {
      service.registerAction({
        key: 'test_action',
        name: 'Test',
        description: 'Test',
        endpoint: 'https://api.example.com/test',
        method: 'POST',
        inputFields: [],
        outputFields: []
      })

      ;(fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(
        new Error('Network error')
      )

      const execution = await service.executeAction('test_action', {})

      expect(execution.status).toBe('error')
      expect(execution.error?.message).toContain('Network error')
    })
  })

  // ===========================
  // Statistics Tests
  // ===========================

  describe('Statistics', () => {
    it('should provide service statistics', async () => {
      service.registerTrigger({
        key: 'trigger1',
        name: 'Trigger 1',
        description: 'Test',
        type: 'polling',
        inputFields: [],
        outputFields: []
      })

      const action = service.registerAction({
        key: 'action1',
        name: 'Action 1',
        description: 'Test',
        endpoint: 'https://api.example.com/test',
        method: 'POST',
        inputFields: [],
        outputFields: []
      })

      ;(fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      } as Response)

      await service.executeAction('action1', {})

      const stats = service.getStatistics()

      expect(stats.triggers).toBe(1)
      expect(stats.actions).toBe(1)
      expect(stats.totalExecutions).toBe(1)
      expect(stats.successfulExecutions).toBe(1)
    })

    it('should count failed executions', async () => {
      service.registerAction({
        key: 'failing_action',
        name: 'Failing Action',
        description: 'Test',
        endpoint: 'https://api.example.com/test',
        method: 'POST',
        inputFields: [],
        outputFields: []
      })

      ;(fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Error'
      } as Response)

      await service.executeAction('failing_action', {})

      const stats = service.getStatistics()

      expect(stats.failedExecutions).toBe(1)
    })
  })
})
