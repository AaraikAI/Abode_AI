/**
 * Integration Tests for AI Reasoning Query API
 *
 * Tests multi-step AI reasoning capabilities
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-key'
const supabase = createClient(supabaseUrl, supabaseKey)

describe('AI Reasoning Query API', () => {
  let testUserId: string
  let testProjectId: string
  let authToken: string

  const testQueryParams = {
    query: 'What are the structural requirements for a load-bearing wall in a commercial building?',
    context: {
      buildingType: 'commercial office',
      location: 'San Francisco, CA',
      regulations: ['IBC 2021', 'California Building Code'],
      constraints: {
        height: 50,
        floors: 5
      }
    },
    reasoning: {
      mode: 'thorough' as const,
      maxSteps: 10,
      includeRationale: true,
      verifyAssumptions: true
    }
  }

  beforeAll(async () => {
    // Create test user
    const { data: { user }, error } = await supabase.auth.admin.createUser({
      email: 'reasoning-test@example.com',
      password: 'test-password-123',
      email_confirm: true
    })

    if (error || !user) {
      throw new Error('Failed to create test user')
    }

    testUserId = user.id

    // Sign in to get auth token
    const { data: { session } } = await supabase.auth.signInWithPassword({
      email: 'reasoning-test@example.com',
      password: 'test-password-123'
    })

    if (!session) {
      throw new Error('Failed to sign in')
    }

    authToken = session.access_token

    // Create test project
    const { data: project } = await supabase
      .from('projects')
      .insert({
        name: 'Test Reasoning Project',
        user_id: testUserId
      })
      .select()
      .single()

    testProjectId = project!.id
  })

  afterAll(async () => {
    // Cleanup
    await supabase.from('reasoning_queries').delete().eq('project_id', testProjectId)
    await supabase.from('projects').delete().eq('id', testProjectId)
    await supabase.auth.admin.deleteUser(testUserId)
  })

  describe('POST /api/reasoning/query', () => {
    it('should process reasoning query successfully', async () => {
      const response = await fetch('http://localhost:3000/api/reasoning/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          ...testQueryParams
        })
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.queryId).toBeDefined()
      expect(data.data.result).toBeDefined()

      const result = data.data.result
      expect(result.query).toBe(testQueryParams.query)
      expect(result.answer).toBeDefined()
      expect(result.confidence).toBeGreaterThan(0)
      expect(result.reasoning).toBeDefined()
      expect(result.evidence).toBeDefined()
      expect(result.recommendations).toBeDefined()
      expect(result.relatedQuestions).toBeDefined()
      expect(result.metadata).toBeDefined()
    })

    it('should perform multi-step reasoning', async () => {
      const response = await fetch('http://localhost:3000/api/reasoning/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          ...testQueryParams
        })
      })

      const data = await response.json()
      const reasoning = data.data.result.reasoning

      expect(reasoning.steps).toBeDefined()
      expect(Array.isArray(reasoning.steps)).toBe(true)
      expect(reasoning.steps.length).toBeGreaterThan(0)
      expect(reasoning.totalSteps).toBe(reasoning.steps.length)
      expect(['simple', 'moderate', 'complex']).toContain(reasoning.complexity)

      const step = reasoning.steps[0]
      expect(step.stepNumber).toBeDefined()
      expect(step.type).toBeDefined()
      expect(['analysis', 'inference', 'calculation', 'lookup', 'validation', 'synthesis']).toContain(step.type)
      expect(step.description).toBeDefined()
      expect(step.confidence).toBeGreaterThan(0)
      expect(step.confidence).toBeLessThanOrEqual(1)
    })

    it('should provide evidence for reasoning', async () => {
      const response = await fetch('http://localhost:3000/api/reasoning/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          ...testQueryParams
        })
      })

      const data = await response.json()
      const evidence = data.data.result.evidence

      expect(Array.isArray(evidence)).toBe(true)
      expect(evidence.length).toBeGreaterThan(0)

      const ev = evidence[0]
      expect(ev.type).toBeDefined()
      expect(ev.source).toBeDefined()
      expect(ev.relevance).toBeGreaterThan(0)
      expect(ev.relevance).toBeLessThanOrEqual(1)
      expect(ev.content).toBeDefined()
    })

    it('should generate recommendations', async () => {
      const response = await fetch('http://localhost:3000/api/reasoning/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          ...testQueryParams
        })
      })

      const data = await response.json()
      const recommendations = data.data.result.recommendations

      expect(Array.isArray(recommendations)).toBe(true)
      expect(recommendations.length).toBeGreaterThan(0)

      const rec = recommendations[0]
      expect(rec.suggestion).toBeDefined()
      expect(rec.rationale).toBeDefined()
      expect(['high', 'medium', 'low']).toContain(rec.priority)
    })

    it('should suggest related questions', async () => {
      const response = await fetch('http://localhost:3000/api/reasoning/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          ...testQueryParams
        })
      })

      const data = await response.json()
      const relatedQuestions = data.data.result.relatedQuestions

      expect(Array.isArray(relatedQuestions)).toBe(true)
      expect(relatedQuestions.length).toBeGreaterThan(0)
      relatedQuestions.forEach((q: string) => {
        expect(typeof q).toBe('string')
        expect(q.length).toBeGreaterThan(0)
      })
    })

    it('should handle fast reasoning mode', async () => {
      const response = await fetch('http://localhost:3000/api/reasoning/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          query: 'What is the recommended HVAC system for a small office?',
          reasoning: {
            mode: 'fast',
            maxSteps: 3
          }
        })
      })

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data.data.result.metadata.model).toContain('fast')
      expect(data.data.result.reasoning.steps.length).toBeLessThanOrEqual(5)
    })

    it('should handle creative reasoning mode', async () => {
      const response = await fetch('http://localhost:3000/api/reasoning/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          query: 'How can biomimicry principles be applied to building design?',
          reasoning: {
            mode: 'creative',
            includeRationale: true
          }
        })
      })

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data.data.result.metadata.model).toContain('creative')
      expect(data.data.result.answer).toBeDefined()
    })

    it('should validate query length', async () => {
      const response = await fetch('http://localhost:3000/api/reasoning/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          query: 'short',
          reasoning: { mode: 'fast' }
        })
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('short')
    })

    it('should validate reasoning mode', async () => {
      const response = await fetch('http://localhost:3000/api/reasoning/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          query: testQueryParams.query,
          reasoning: { mode: 'invalid-mode' }
        })
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('mode')
    })

    it('should require authentication', async () => {
      const response = await fetch('http://localhost:3000/api/reasoning/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projectId: testProjectId,
          ...testQueryParams
        })
      })

      expect(response.status).toBe(401)
    })
  })

  describe('GET /api/reasoning/query', () => {
    let testQueryId: string

    beforeAll(async () => {
      // Create a test query record
      const { data: query } = await supabase
        .from('reasoning_queries')
        .insert({
          project_id: testProjectId,
          user_id: testUserId,
          query: 'Test query',
          reasoning_mode: 'fast',
          result: {
            query: 'Test query',
            answer: 'Test answer',
            confidence: 0.85,
            reasoning: { steps: [], totalSteps: 0, complexity: 'simple' },
            evidence: [],
            recommendations: [],
            relatedQuestions: [],
            metadata: { processingTime: 100, tokensUsed: 50, model: 'test' }
          }
        })
        .select()
        .single()

      testQueryId = query!.id
    })

    it('should retrieve query by ID', async () => {
      const response = await fetch(
        `http://localhost:3000/api/reasoning/query?queryId=${testQueryId}`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.id).toBe(testQueryId)
      expect(data.data.result).toBeDefined()
    })

    it('should return 404 for non-existent query', async () => {
      const response = await fetch(
        `http://localhost:3000/api/reasoning/query?queryId=00000000-0000-0000-0000-000000000000`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      expect(response.status).toBe(404)
    })
  })
})
