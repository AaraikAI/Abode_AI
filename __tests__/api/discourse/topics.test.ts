/**
 * Integration Tests for Discourse Topics API
 *
 * Tests forum topics listing and creation
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-key'
const supabase = createClient(supabaseUrl, supabaseKey)

describe('Discourse Topics API', () => {
  let testUserId: string
  let testOrgId: string
  let testProjectId: string
  let authToken: string

  beforeAll(async () => {
    // Create test user
    const { data: { user }, error } = await supabase.auth.admin.createUser({
      email: 'discourse-test@example.com',
      password: 'test-password-123',
      email_confirm: true
    })

    if (error || !user) {
      throw new Error('Failed to create test user')
    }

    testUserId = user.id

    // Sign in to get auth token
    const { data: { session } } = await supabase.auth.signInWithPassword({
      email: 'discourse-test@example.com',
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
        name: 'Test Discourse Org'
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
        name: 'Test Discourse Project',
        user_id: testUserId
      })
      .select()
      .single()

    testProjectId = project!.id
  })

  afterAll(async () => {
    // Cleanup
    await supabase.from('discourse_topics').delete().eq('org_id', testOrgId)
    await supabase.from('projects').delete().eq('id', testProjectId)
    await supabase.from('organization_members').delete().eq('organization_id', testOrgId)
    await supabase.from('organizations').delete().eq('id', testOrgId)
    await supabase.auth.admin.deleteUser(testUserId)
  })

  describe('POST /api/discourse/topics', () => {
    it('should create a general topic', async () => {
      const response = await fetch(`http://localhost:3000/api/discourse/topics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          title: 'Welcome to the Community',
          content: 'This is the first topic in our community forum. Feel free to introduce yourself!',
          category: 'general',
          tags: ['welcome', 'introduction']
        })
      })

      expect(response.status).toBe(201)

      const data = await response.json()
      expect(data.id).toBeDefined()
      expect(data.title).toBe('Welcome to the Community')
      expect(data.category).toBe('general')
      expect(data.tags).toContain('welcome')
      expect(data.author).toBeDefined()
      expect(data.viewCount).toBe(0)
      expect(data.replyCount).toBe(0)
    })

    it('should create a topic with project association', async () => {
      const response = await fetch(`http://localhost:3000/api/discourse/topics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          title: 'Project Design Discussion',
          content: 'Let\'s discuss the architectural design for this project.',
          category: 'architecture',
          projectId: testProjectId,
          tags: ['design', 'architecture']
        })
      })

      expect(response.status).toBe(201)

      const data = await response.json()
      expect(data.projectId).toBe(testProjectId)
      expect(data.category).toBe('architecture')
    })

    it('should create a feature request topic', async () => {
      const response = await fetch(`http://localhost:3000/api/discourse/topics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          title: 'Add Dark Mode Support',
          content: 'It would be great to have a dark mode option for the application.',
          category: 'feature-requests',
          tags: ['ui', 'enhancement']
        })
      })

      expect(response.status).toBe(201)

      const data = await response.json()
      expect(data.category).toBe('feature-requests')
    })

    it('should validate title length', async () => {
      const response = await fetch(`http://localhost:3000/api/discourse/topics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          title: 'Hi', // Too short
          content: 'This is a valid content that is long enough for a topic.',
          category: 'general'
        })
      })

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('5 and 200 characters')
    })

    it('should validate content length', async () => {
      const response = await fetch(`http://localhost:3000/api/discourse/topics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          title: 'Valid Title Here',
          content: 'Too short', // Too short
          category: 'general'
        })
      })

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('at least 20 characters')
    })

    it('should validate category', async () => {
      const response = await fetch(`http://localhost:3000/api/discourse/topics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          title: 'Valid Title Here',
          content: 'This is valid content that meets the minimum length requirement.',
          category: 'invalid-category'
        })
      })

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('Invalid category')
    })

    it('should create pinned topic', async () => {
      const response = await fetch(`http://localhost:3000/api/discourse/topics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          title: 'Community Guidelines',
          content: 'Please read our community guidelines before posting.',
          category: 'announcements',
          isPinned: true,
          tags: ['important', 'guidelines']
        })
      })

      expect(response.status).toBe(201)

      const data = await response.json()
      expect(data.isPinned).toBe(true)
    })

    it('should require authentication', async () => {
      const response = await fetch(`http://localhost:3000/api/discourse/topics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: 'Test Topic',
          content: 'This should fail due to missing authentication.',
          category: 'general'
        })
      })

      expect(response.status).toBe(401)
    })
  })

  describe('GET /api/discourse/topics', () => {
    beforeAll(async () => {
      // Create multiple test topics
      const topics = [
        {
          title: 'First Topic',
          content: 'Content for the first topic',
          category: 'general',
          tags: ['test'],
          user_id: testUserId,
          org_id: testOrgId,
          view_count: 100,
          reply_count: 5,
          like_count: 10
        },
        {
          title: 'Second Topic',
          content: 'Content for the second topic',
          category: 'support',
          tags: ['help', 'question'],
          user_id: testUserId,
          org_id: testOrgId,
          view_count: 50,
          reply_count: 2,
          like_count: 3
        },
        {
          title: 'Architecture Discussion',
          content: 'Let\'s talk about architecture',
          category: 'architecture',
          project_id: testProjectId,
          tags: ['architecture'],
          user_id: testUserId,
          org_id: testOrgId,
          view_count: 200,
          reply_count: 15,
          like_count: 25
        }
      ]

      await supabase.from('discourse_topics').insert(topics)
    })

    it('should list all topics', async () => {
      const response = await fetch(`http://localhost:3000/api/discourse/topics`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.topics).toBeDefined()
      expect(data.topics.length).toBeGreaterThan(0)
      expect(data.pagination).toBeDefined()
      expect(data.pagination.page).toBe(1)
    })

    it('should filter topics by category', async () => {
      const response = await fetch(
        `http://localhost:3000/api/discourse/topics?category=architecture`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.topics.every((t: any) => t.category === 'architecture')).toBe(true)
    })

    it('should filter topics by project', async () => {
      const response = await fetch(
        `http://localhost:3000/api/discourse/topics?projectId=${testProjectId}`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.topics.every((t: any) => t.projectId === testProjectId)).toBe(true)
    })

    it('should sort topics by popularity', async () => {
      const response = await fetch(
        `http://localhost:3000/api/discourse/topics?sortBy=popular`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.topics).toBeDefined()
      // Verify descending order by view count
      for (let i = 0; i < data.topics.length - 1; i++) {
        expect(data.topics[i].viewCount).toBeGreaterThanOrEqual(
          data.topics[i + 1].viewCount
        )
      }
    })

    it('should paginate results', async () => {
      const response = await fetch(
        `http://localhost:3000/api/discourse/topics?page=1&limit=2`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.topics.length).toBeLessThanOrEqual(2)
      expect(data.pagination.limit).toBe(2)
    })
  })
})
