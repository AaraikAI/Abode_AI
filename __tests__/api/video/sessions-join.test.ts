/**
 * Integration Tests for Video Session Join API
 *
 * Tests joining video sessions and retrieving session join information
 * 20 comprehensive tests
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-key'
const supabase = createClient(supabaseUrl, supabaseKey)

describe('Video Session Join API', () => {
  let testUserId: string
  let testUser2Id: string
  let testOrgId: string
  let testProjectId: string
  let testSessionId: string
  let authToken: string
  let authToken2: string

  beforeAll(async () => {
    // Create test users
    const { data: { user }, error } = await supabase.auth.admin.createUser({
      email: 'video-join-test@example.com',
      password: 'test-password-123',
      email_confirm: true
    })

    if (error || !user) {
      throw new Error('Failed to create test user')
    }

    testUserId = user.id

    const { data: { user: user2 } } = await supabase.auth.admin.createUser({
      email: 'video-join-test-2@example.com',
      password: 'test-password-123',
      email_confirm: true
    })

    testUser2Id = user2!.id

    // Create profiles
    await supabase.from('profiles').insert([
      { id: testUserId, username: 'testuser1', full_name: 'Test User 1' },
      { id: testUser2Id, username: 'testuser2', full_name: 'Test User 2' }
    ])

    // Sign in to get auth tokens
    const { data: { session } } = await supabase.auth.signInWithPassword({
      email: 'video-join-test@example.com',
      password: 'test-password-123'
    })

    authToken = session!.access_token

    const { data: { session: session2 } } = await supabase.auth.signInWithPassword({
      email: 'video-join-test-2@example.com',
      password: 'test-password-123'
    })

    authToken2 = session2!.access_token

    // Create test organization
    const { data: org } = await supabase
      .from('organizations')
      .insert({ name: 'Test Video Join Org' })
      .select()
      .single()

    testOrgId = org!.id

    // Add users to organization
    await supabase
      .from('organization_members')
      .insert([
        {
          organization_id: testOrgId,
          user_id: testUserId,
          role: 'admin'
        },
        {
          organization_id: testOrgId,
          user_id: testUser2Id,
          role: 'member'
        }
      ])

    // Create test project
    const { data: project } = await supabase
      .from('projects')
      .insert({
        org_id: testOrgId,
        name: 'Test Video Project',
        user_id: testUserId
      })
      .select()
      .single()

    testProjectId = project!.id

    // Create test video session
    const { data: session_data } = await supabase
      .from('video_sessions')
      .insert({
        project_id: testProjectId,
        host_id: testUserId,
        status: 'waiting',
        recording: false
      })
      .select()
      .single()

    testSessionId = session_data!.id
  })

  afterAll(async () => {
    // Cleanup
    await supabase.from('video_participants').delete().eq('session_id', testSessionId)
    await supabase.from('video_sessions').delete().eq('id', testSessionId)
    await supabase.from('projects').delete().eq('id', testProjectId)
    await supabase.from('organization_members').delete().eq('organization_id', testOrgId)
    await supabase.from('organizations').delete().eq('id', testOrgId)
    await supabase.from('profiles').delete().in('id', [testUserId, testUser2Id])
    await supabase.auth.admin.deleteUser(testUserId)
    await supabase.auth.admin.deleteUser(testUser2Id)
  })

  describe('POST /api/video/sessions/[sessionId]/join', () => {
    it('should join video session successfully', async () => {
      const response = await fetch(
        `http://localhost:3000/api/video/sessions/${testSessionId}/join`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({})
        }
      )

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.config).toBeDefined()
      expect(data.config.iceServers).toBeDefined()
      expect(Array.isArray(data.config.iceServers)).toBe(true)
      expect(data.participant).toBeDefined()
      expect(data.participant.userId).toBe(testUserId)
    })

    it('should join with custom user name', async () => {
      const response = await fetch(
        `http://localhost:3000/api/video/sessions/${testSessionId}/join`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken2}`
          },
          body: JSON.stringify({
            userName: 'Custom User Name'
          })
        }
      )

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.participant.userName).toBe('Custom User Name')
    })

    it('should join with video disabled', async () => {
      const response = await fetch(
        `http://localhost:3000/api/video/sessions/${testSessionId}/join`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            video: false,
            audio: true
          })
        }
      )

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.participant.video).toBe(false)
      expect(data.participant.audio).toBe(true)
    })

    it('should join with audio disabled', async () => {
      const response = await fetch(
        `http://localhost:3000/api/video/sessions/${testSessionId}/join`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken2}`
          },
          body: JSON.stringify({
            video: true,
            audio: false
          })
        }
      )

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.participant.video).toBe(true)
      expect(data.participant.audio).toBe(false)
    })

    it('should join with both video and audio disabled', async () => {
      const response = await fetch(
        `http://localhost:3000/api/video/sessions/${testSessionId}/join`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            video: false,
            audio: false
          })
        }
      )

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.participant.video).toBe(false)
      expect(data.participant.audio).toBe(false)
    })

    it('should record participant join in database', async () => {
      const response = await fetch(
        `http://localhost:3000/api/video/sessions/${testSessionId}/join`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({})
        }
      )

      expect(response.status).toBe(200)

      // Verify participant record exists
      const { data: participant } = await supabase
        .from('video_participants')
        .select('*')
        .eq('session_id', testSessionId)
        .eq('user_id', testUserId)
        .is('left_at', null)
        .single()

      expect(participant).toBeDefined()
      expect(participant!.session_id).toBe(testSessionId)
    })

    it('should require authentication', async () => {
      const response = await fetch(
        `http://localhost:3000/api/video/sessions/${testSessionId}/join`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({})
        }
      )

      expect(response.status).toBe(401)
    })

    it('should reject join with invalid session ID', async () => {
      const response = await fetch(
        `http://localhost:3000/api/video/sessions/00000000-0000-0000-0000-000000000000/join`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({})
        }
      )

      expect(response.status).toBe(404)
    })

    it('should deny access to users not in organization', async () => {
      // Create user not in org
      const { data: { user: outsider } } = await supabase.auth.admin.createUser({
        email: 'outsider-video@example.com',
        password: 'test-password-123',
        email_confirm: true
      })

      const { data: { session } } = await supabase.auth.signInWithPassword({
        email: 'outsider-video@example.com',
        password: 'test-password-123'
      })

      const response = await fetch(
        `http://localhost:3000/api/video/sessions/${testSessionId}/join`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session!.access_token}`
          },
          body: JSON.stringify({})
        }
      )

      expect(response.status).toBe(403)

      // Cleanup
      await supabase.auth.admin.deleteUser(outsider!.id)
    })

    it('should return WebRTC configuration', async () => {
      const response = await fetch(
        `http://localhost:3000/api/video/sessions/${testSessionId}/join`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({})
        }
      )

      const data = await response.json()
      expect(data.config.iceServers).toBeDefined()
      expect(data.config.iceServers.length).toBeGreaterThan(0)

      // Check for STUN server
      const hasStunServer = data.config.iceServers.some((server: any) =>
        server.urls && server.urls.includes('stun:')
      )
      expect(hasStunServer).toBe(true)
    })
  })

  describe('GET /api/video/sessions/[sessionId]/join', () => {
    it('should get session join information', async () => {
      const response = await fetch(
        `http://localhost:3000/api/video/sessions/${testSessionId}/join`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.session).toBeDefined()
      expect(data.session.id).toBe(testSessionId)
      expect(data.session.projectId).toBe(testProjectId)
    })

    it('should include host information', async () => {
      const response = await fetch(
        `http://localhost:3000/api/video/sessions/${testSessionId}/join`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      const data = await response.json()
      expect(data.session.hostId).toBe(testUserId)
      expect(data.session.hostName).toBeDefined()
    })

    it('should include participant count', async () => {
      // Join session first
      await fetch(
        `http://localhost:3000/api/video/sessions/${testSessionId}/join`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({})
        }
      )

      const response = await fetch(
        `http://localhost:3000/api/video/sessions/${testSessionId}/join`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      const data = await response.json()
      expect(data.session.participantCount).toBeGreaterThan(0)
    })

    it('should include participants list', async () => {
      const response = await fetch(
        `http://localhost:3000/api/video/sessions/${testSessionId}/join`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      const data = await response.json()
      expect(data.participants).toBeDefined()
      expect(Array.isArray(data.participants)).toBe(true)
    })

    it('should indicate if user can join', async () => {
      const response = await fetch(
        `http://localhost:3000/api/video/sessions/${testSessionId}/join`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      const data = await response.json()
      expect(data.canJoin).toBeDefined()
      expect(typeof data.canJoin).toBe('boolean')
    })

    it('should require authentication', async () => {
      const response = await fetch(
        `http://localhost:3000/api/video/sessions/${testSessionId}/join`
      )

      expect(response.status).toBe(401)
    })

    it('should return 404 for non-existent session', async () => {
      const response = await fetch(
        `http://localhost:3000/api/video/sessions/00000000-0000-0000-0000-000000000000/join`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      expect(response.status).toBe(404)
    })

    it('should deny access to users not in organization', async () => {
      // Create user not in org
      const { data: { user: outsider } } = await supabase.auth.admin.createUser({
        email: 'outsider-video-get@example.com',
        password: 'test-password-123',
        email_confirm: true
      })

      const { data: { session } } = await supabase.auth.signInWithPassword({
        email: 'outsider-video-get@example.com',
        password: 'test-password-123'
      })

      const response = await fetch(
        `http://localhost:3000/api/video/sessions/${testSessionId}/join`,
        {
          headers: {
            'Authorization': `Bearer ${session!.access_token}`
          }
        }
      )

      expect(response.status).toBe(403)

      // Cleanup
      await supabase.auth.admin.deleteUser(outsider!.id)
    })

    it('should include project name', async () => {
      const response = await fetch(
        `http://localhost:3000/api/video/sessions/${testSessionId}/join`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      const data = await response.json()
      expect(data.session.projectName).toBeDefined()
    })

    it('should include session status', async () => {
      const response = await fetch(
        `http://localhost:3000/api/video/sessions/${testSessionId}/join`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      const data = await response.json()
      expect(data.session.status).toBeDefined()
      expect(['waiting', 'active', 'ended'].includes(data.session.status)).toBe(true)
    })
  })
})
