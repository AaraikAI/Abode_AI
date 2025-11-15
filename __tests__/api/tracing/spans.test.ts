/**
 * Integration Tests for Distributed Tracing Spans API
 *
 * Tests trace span submission and retrieval
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-key'
const supabase = createClient(supabaseUrl, supabaseKey)

describe('Distributed Tracing Spans API', () => {
  let testUserId: string
  let testOrgId: string
  let testProjectId: string
  let authToken: string

  beforeAll(async () => {
    // Create test user
    const { data: { user }, error } = await supabase.auth.admin.createUser({
      email: 'tracing-test@example.com',
      password: 'test-password-123',
      email_confirm: true
    })

    if (error || !user) {
      throw new Error('Failed to create test user')
    }

    testUserId = user.id

    // Sign in to get auth token
    const { data: { session } } = await supabase.auth.signInWithPassword({
      email: 'tracing-test@example.com',
      password: 'test-password-123'
    })

    if (!session) {
      throw new Error('Failed to sign in')
    }

    authToken = session.access_token

    // Create test organization
    const { data: org } = await supabase
      .from('organizations')
      .insert({
        name: 'Test Tracing Org'
      })
      .select()
      .single()

    testOrgId = org!.id

    // Add user to organization
    await supabase
      .from('organization_members')
      .insert({
        organization_id: testOrgId,
        user_id: testUserId,
        role: 'admin'
      })

    // Create test project
    const { data: project } = await supabase
      .from('projects')
      .insert({
        org_id: testOrgId,
        name: 'Test Tracing Project',
        user_id: testUserId
      })
      .select()
      .single()

    testProjectId = project!.id
  })

  afterAll(async () => {
    // Cleanup
    await supabase.from('trace_spans').delete().eq('org_id', testOrgId)
    await supabase.from('traces').delete().eq('org_id', testOrgId)
    await supabase.from('projects').delete().eq('id', testProjectId)
    await supabase.from('organization_members').delete().eq('organization_id', testOrgId)
    await supabase.from('organizations').delete().eq('id', testOrgId)
    await supabase.auth.admin.deleteUser(testUserId)
  })

  describe('POST /api/tracing/spans', () => {
    it('should submit a single trace span', async () => {
      const response = await fetch(`http://localhost:3000/api/tracing/spans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          spans: [
            {
              spanId: 'span-001',
              traceId: 'trace-001',
              name: 'api.request',
              service: 'web-server',
              operation: 'GET /api/users',
              startTime: Date.now() * 1000,
              duration: 150000,
              status: 'ok',
              tags: {
                'http.method': 'GET',
                'http.url': '/api/users',
                'http.status_code': 200
              }
            }
          ]
        })
      })

      expect(response.status).toBe(201)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.spansReceived).toBe(1)
      expect(data.traceIds).toContain('trace-001')
    })

    it('should submit multiple spans forming a trace tree', async () => {
      const now = Date.now() * 1000

      const response = await fetch(`http://localhost:3000/api/tracing/spans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          spans: [
            {
              spanId: 'span-root',
              traceId: 'trace-002',
              name: 'http.request',
              service: 'api-gateway',
              operation: 'POST /api/orders',
              startTime: now,
              duration: 500000,
              status: 'ok',
              tags: { 'http.method': 'POST' }
            },
            {
              spanId: 'span-child-1',
              traceId: 'trace-002',
              parentSpanId: 'span-root',
              name: 'database.query',
              service: 'order-service',
              operation: 'INSERT orders',
              startTime: now + 10000,
              duration: 200000,
              status: 'ok',
              tags: { 'db.type': 'postgres' }
            },
            {
              spanId: 'span-child-2',
              traceId: 'trace-002',
              parentSpanId: 'span-root',
              name: 'http.client',
              service: 'order-service',
              operation: 'POST /inventory',
              startTime: now + 220000,
              duration: 150000,
              status: 'ok',
              tags: { 'http.url': '/inventory' }
            }
          ]
        })
      })

      expect(response.status).toBe(201)

      const data = await response.json()
      expect(data.spansReceived).toBe(3)
      expect(data.traceIds).toContain('trace-002')

      // Verify trace record was created
      const { data: trace } = await supabase
        .from('traces')
        .select('*')
        .eq('trace_id', 'trace-002')
        .single()

      expect(trace).toBeDefined()
      expect(trace!.span_count).toBe(3)
    })

    it('should submit span with error status', async () => {
      const response = await fetch(`http://localhost:3000/api/tracing/spans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          spans: [
            {
              spanId: 'span-error',
              traceId: 'trace-003',
              name: 'database.query',
              service: 'user-service',
              operation: 'SELECT users',
              startTime: Date.now() * 1000,
              duration: 50000,
              status: 'error',
              error: {
                message: 'Connection timeout',
                type: 'TimeoutError',
                stack: 'Error: Connection timeout\n  at...'
              },
              tags: { 'error': true }
            }
          ]
        })
      })

      expect(response.status).toBe(201)

      const data = await response.json()
      expect(data.success).toBe(true)

      // Verify error was recorded
      const { data: span } = await supabase
        .from('trace_spans')
        .select('*')
        .eq('span_id', 'span-error')
        .single()

      expect(span!.status).toBe('error')
      expect(span!.error).toBeDefined()
      expect(span!.error.message).toBe('Connection timeout')
    })

    it('should validate required span fields', async () => {
      const response = await fetch(`http://localhost:3000/api/tracing/spans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          spans: [
            {
              spanId: 'span-invalid',
              // Missing traceId, name, and service
              operation: 'test',
              startTime: Date.now() * 1000,
              duration: 1000,
              status: 'ok'
            }
          ]
        })
      })

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('Invalid span data')
    })

    it('should require at least one span', async () => {
      const response = await fetch(`http://localhost:3000/api/tracing/spans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          spans: []
        })
      })

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('At least one span')
    })

    it('should submit span with logs', async () => {
      const response = await fetch(`http://localhost:3000/api/tracing/spans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          spans: [
            {
              spanId: 'span-with-logs',
              traceId: 'trace-004',
              name: 'process.task',
              service: 'worker',
              operation: 'process-job',
              startTime: Date.now() * 1000,
              duration: 300000,
              status: 'ok',
              logs: [
                {
                  timestamp: Date.now() * 1000,
                  fields: {
                    event: 'processing_started',
                    jobId: 'job-123'
                  }
                },
                {
                  timestamp: Date.now() * 1000 + 100000,
                  fields: {
                    event: 'processing_completed',
                    result: 'success'
                  }
                }
              ]
            }
          ]
        })
      })

      expect(response.status).toBe(201)

      const data = await response.json()
      expect(data.success).toBe(true)
    })

    it('should require authentication', async () => {
      const response = await fetch(`http://localhost:3000/api/tracing/spans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          spans: [
            {
              spanId: 'span-test',
              traceId: 'trace-test',
              name: 'test',
              service: 'test',
              operation: 'test',
              startTime: Date.now() * 1000,
              duration: 1000,
              status: 'ok'
            }
          ]
        })
      })

      expect(response.status).toBe(401)
    })
  })

  describe('GET /api/tracing/spans', () => {
    const testTraceId = 'trace-get-test'

    beforeAll(async () => {
      // Create test spans
      const now = Date.now() * 1000
      const spans = [
        {
          span_id: 'get-span-1',
          trace_id: testTraceId,
          name: 'api.request',
          service: 'api-gateway',
          operation: 'GET /api/data',
          start_time: now,
          duration: 250000,
          status: 'ok',
          tags: {},
          logs: [],
          org_id: testOrgId,
          user_id: testUserId,
          project_id: testProjectId
        },
        {
          span_id: 'get-span-2',
          trace_id: testTraceId,
          parent_span_id: 'get-span-1',
          name: 'database.query',
          service: 'data-service',
          operation: 'SELECT data',
          start_time: now + 10000,
          duration: 150000,
          status: 'ok',
          tags: {},
          logs: [],
          org_id: testOrgId,
          user_id: testUserId,
          project_id: testProjectId
        }
      ]

      await supabase.from('trace_spans').insert(spans)

      // Create trace record
      await supabase.from('traces').insert({
        trace_id: testTraceId,
        org_id: testOrgId,
        project_id: testProjectId,
        total_duration: 250000,
        span_count: 2,
        error_count: 0,
        services: ['api-gateway', 'data-service'],
        critical_path_duration: 400000,
        start_time: now,
        end_time: now + 250000
      })
    })

    it('should retrieve spans by trace ID', async () => {
      const response = await fetch(
        `http://localhost:3000/api/tracing/spans?traceId=${testTraceId}`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.spans).toBeDefined()
      expect(data.spans.length).toBe(2)
      expect(data.trace).toBeDefined()
      expect(data.trace.traceId).toBe(testTraceId)
      expect(data.trace.stats).toBeDefined()
      expect(data.trace.tree).toBeDefined()
    })

    it('should filter spans by service', async () => {
      const response = await fetch(
        `http://localhost:3000/api/tracing/spans?service=api-gateway`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.spans.every((s: any) => s.service === 'api-gateway')).toBe(true)
    })

    it('should filter spans by operation', async () => {
      const response = await fetch(
        `http://localhost:3000/api/tracing/spans?operation=GET /api/data`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.spans.some((s: any) => s.operation === 'GET /api/data')).toBe(true)
    })

    it('should filter spans by duration', async () => {
      const response = await fetch(
        `http://localhost:3000/api/tracing/spans?minDuration=100000&maxDuration=300000`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.spans).toBeDefined()
      data.spans.forEach((span: any) => {
        expect(span.duration).toBeGreaterThanOrEqual(100000)
        expect(span.duration).toBeLessThanOrEqual(300000)
      })
    })

    it('should limit number of spans returned', async () => {
      const response = await fetch(
        `http://localhost:3000/api/tracing/spans?limit=1`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.spans.length).toBeLessThanOrEqual(1)
    })

    it('should return empty array when no spans match', async () => {
      const response = await fetch(
        `http://localhost:3000/api/tracing/spans?traceId=non-existent-trace`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.spans).toEqual([])
      expect(data.count).toBe(0)
    })
  })
})
