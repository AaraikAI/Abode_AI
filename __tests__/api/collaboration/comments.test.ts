/**
 * Integration Tests for Collaboration Comments API
 *
 * Tests comment creation, listing, updating, and deletion
 * 35 comprehensive tests
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-key'
const supabase = createClient(supabaseUrl, supabaseKey)

describe('Collaboration Comments API', () => {
  let testUserId: string
  let testUser2Id: string
  let testOrgId: string
  let testProjectId: string
  let authToken: string
  let authToken2: string

  beforeAll(async () => {
    // Create test users
    const { data: { user }, error } = await supabase.auth.admin.createUser({
      email: 'comments-test@example.com',
      password: 'test-password-123',
      email_confirm: true
    })

    if (error || !user) {
      throw new Error('Failed to create test user')
    }

    testUserId = user.id

    const { data: { user: user2 } } = await supabase.auth.admin.createUser({
      email: 'comments-test-2@example.com',
      password: 'test-password-123',
      email_confirm: true
    })

    testUser2Id = user2!.id

    // Sign in to get auth tokens
    const { data: { session } } = await supabase.auth.signInWithPassword({
      email: 'comments-test@example.com',
      password: 'test-password-123'
    })

    authToken = session!.access_token

    const { data: { session: session2 } } = await supabase.auth.signInWithPassword({
      email: 'comments-test-2@example.com',
      password: 'test-password-123'
    })

    authToken2 = session2!.access_token

    // Create test organization
    const { data: org } = await supabase
      .from('organizations')
      .insert({ name: 'Test Comments Org' })
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
        name: 'Test Comments Project',
        user_id: testUserId
      })
      .select()
      .single()

    testProjectId = project!.id
  })

  afterAll(async () => {
    // Cleanup
    await supabase.from('comments').delete().eq('project_id', testProjectId)
    await supabase.from('projects').delete().eq('id', testProjectId)
    await supabase.from('organization_members').delete().eq('organization_id', testOrgId)
    await supabase.from('organizations').delete().eq('id', testOrgId)
    await supabase.auth.admin.deleteUser(testUserId)
    await supabase.auth.admin.deleteUser(testUser2Id)
  })

  describe('POST /api/collaboration/comments', () => {
    it('should create a new comment', async () => {
      const response = await fetch(`http://localhost:3000/api/collaboration/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          content: 'This is a test comment'
        })
      })

      expect(response.status).toBe(201)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.comment).toBeDefined()
      expect(data.comment.content).toBe('This is a test comment')
      expect(data.comment.user_id).toBe(testUserId)
      expect(data.comment.status).toBe('active')
      expect(data.comment.edited).toBe(false)
    })

    it('should create comment with resource association', async () => {
      const response = await fetch(`http://localhost:3000/api/collaboration/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          resourceId: 'model-123',
          resourceType: 'model',
          content: 'Comment on model'
        })
      })

      expect(response.status).toBe(201)

      const data = await response.json()
      expect(data.comment.resource_id).toBe('model-123')
      expect(data.comment.resource_type).toBe('model')
    })

    it('should create comment with mentions', async () => {
      const response = await fetch(`http://localhost:3000/api/collaboration/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          content: `Hey @user, check this out`,
          mentions: [testUser2Id]
        })
      })

      expect(response.status).toBe(201)

      const data = await response.json()
      expect(data.comment.mentions).toContain(testUser2Id)
    })

    it('should create comment with attachments', async () => {
      const attachments = [
        {
          id: 'att-1',
          name: 'screenshot.png',
          url: 'https://example.com/screenshot.png',
          type: 'image/png',
          size: 102400
        }
      ]

      const response = await fetch(`http://localhost:3000/api/collaboration/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          content: 'Comment with attachment',
          attachments
        })
      })

      expect(response.status).toBe(201)

      const data = await response.json()
      expect(data.comment.attachments).toHaveLength(1)
      expect(data.comment.attachments[0].name).toBe('screenshot.png')
    })

    it('should create comment with position data', async () => {
      const position = {
        x: 100,
        y: 200,
        z: 50,
        element_id: 'wall-1'
      }

      const response = await fetch(`http://localhost:3000/api/collaboration/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          content: 'Spatial comment',
          position
        })
      })

      expect(response.status).toBe(201)

      const data = await response.json()
      expect(data.comment.position).toEqual(position)
    })

    it('should create reply to existing comment', async () => {
      // Create parent comment
      const parentResponse = await fetch(`http://localhost:3000/api/collaboration/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          content: 'Parent comment'
        })
      })

      const parentData = await parentResponse.json()
      const parentId = parentData.comment.id

      // Create reply
      const response = await fetch(`http://localhost:3000/api/collaboration/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken2}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          content: 'Reply to comment',
          parentId
        })
      })

      expect(response.status).toBe(201)

      const data = await response.json()
      expect(data.comment.parent_id).toBe(parentId)
    })

    it('should reject comment without required fields', async () => {
      const response = await fetch(`http://localhost:3000/api/collaboration/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId
          // Missing content
        })
      })

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('required')
    })

    it('should reject comment exceeding max length', async () => {
      const longContent = 'a'.repeat(10001)

      const response = await fetch(`http://localhost:3000/api/collaboration/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          content: longContent
        })
      })

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('maximum length')
    })

    it('should reject comment without authentication', async () => {
      const response = await fetch(`http://localhost:3000/api/collaboration/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projectId: testProjectId,
          content: 'Test comment'
        })
      })

      expect(response.status).toBe(401)
    })

    it('should reject comment with invalid mentions', async () => {
      const response = await fetch(`http://localhost:3000/api/collaboration/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          content: 'Comment with invalid mention',
          mentions: ['00000000-0000-0000-0000-000000000000']
        })
      })

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('Invalid mentions')
    })

    it('should reject reply to non-existent parent', async () => {
      const response = await fetch(`http://localhost:3000/api/collaboration/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          content: 'Invalid reply',
          parentId: '00000000-0000-0000-0000-000000000000'
        })
      })

      expect(response.status).toBe(404)

      const data = await response.json()
      expect(data.error).toContain('Parent comment not found')
    })
  })

  describe('GET /api/collaboration/comments', () => {
    let commentId: string

    beforeAll(async () => {
      // Create test comments
      const { data: comment } = await supabase
        .from('comments')
        .insert({
          project_id: testProjectId,
          user_id: testUserId,
          content: 'Test comment for GET',
          status: 'active',
          edited: false
        })
        .select()
        .single()

      commentId = comment!.id

      // Create some replies
      await supabase
        .from('comments')
        .insert([
          {
            project_id: testProjectId,
            user_id: testUser2Id,
            content: 'Reply 1',
            parent_id: commentId,
            status: 'active',
            edited: false
          },
          {
            project_id: testProjectId,
            user_id: testUserId,
            content: 'Reply 2',
            parent_id: commentId,
            status: 'active',
            edited: false
          }
        ])
    })

    it('should list comments for a project', async () => {
      const response = await fetch(
        `http://localhost:3000/api/collaboration/comments?projectId=${testProjectId}`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.comments).toBeDefined()
      expect(Array.isArray(data.comments)).toBe(true)
      expect(data.total).toBeGreaterThan(0)
    })

    it('should include reply count without fetching replies', async () => {
      const response = await fetch(
        `http://localhost:3000/api/collaboration/comments?projectId=${testProjectId}`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      const data = await response.json()
      const commentWithReplies = data.comments.find((c: any) => c.id === commentId)
      expect(commentWithReplies.reply_count).toBe(2)
    })

    it('should include replies when requested', async () => {
      const response = await fetch(
        `http://localhost:3000/api/collaboration/comments?projectId=${testProjectId}&includeReplies=true`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      const data = await response.json()
      const commentWithReplies = data.comments.find((c: any) => c.id === commentId)
      expect(commentWithReplies.replies).toBeDefined()
      expect(commentWithReplies.replies.length).toBe(2)
    })

    it('should filter by resource ID', async () => {
      // Create comment with resource
      await supabase
        .from('comments')
        .insert({
          project_id: testProjectId,
          user_id: testUserId,
          resource_id: 'model-xyz',
          resource_type: 'model',
          content: 'Model comment',
          status: 'active',
          edited: false
        })

      const response = await fetch(
        `http://localhost:3000/api/collaboration/comments?projectId=${testProjectId}&resourceId=model-xyz`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      const data = await response.json()
      expect(data.comments.every((c: any) => c.resource_id === 'model-xyz')).toBe(true)
    })

    it('should filter by resource type', async () => {
      const response = await fetch(
        `http://localhost:3000/api/collaboration/comments?projectId=${testProjectId}&resourceType=model`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      const data = await response.json()
      expect(data.comments.every((c: any) => !c.resource_type || c.resource_type === 'model')).toBe(true)
    })

    it('should support pagination', async () => {
      const response = await fetch(
        `http://localhost:3000/api/collaboration/comments?projectId=${testProjectId}&limit=2&offset=0`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      const data = await response.json()
      expect(data.comments.length).toBeLessThanOrEqual(2)
      expect(data.limit).toBe(2)
      expect(data.offset).toBe(0)
    })

    it('should return hasMore flag', async () => {
      const response = await fetch(
        `http://localhost:3000/api/collaboration/comments?projectId=${testProjectId}&limit=1`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      const data = await response.json()
      expect(data.hasMore).toBeDefined()
    })

    it('should require projectId parameter', async () => {
      const response = await fetch(
        `http://localhost:3000/api/collaboration/comments`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('projectId')
    })

    it('should require authentication', async () => {
      const response = await fetch(
        `http://localhost:3000/api/collaboration/comments?projectId=${testProjectId}`
      )

      expect(response.status).toBe(401)
    })

    it('should deny access to non-members', async () => {
      // Create user not in org
      const { data: { user: outsider } } = await supabase.auth.admin.createUser({
        email: 'outsider@example.com',
        password: 'test-password-123',
        email_confirm: true
      })

      const { data: { session } } = await supabase.auth.signInWithPassword({
        email: 'outsider@example.com',
        password: 'test-password-123'
      })

      const response = await fetch(
        `http://localhost:3000/api/collaboration/comments?projectId=${testProjectId}`,
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
  })

  describe('PUT /api/collaboration/comments', () => {
    let commentId: string

    beforeAll(async () => {
      const { data: comment } = await supabase
        .from('comments')
        .insert({
          project_id: testProjectId,
          user_id: testUserId,
          content: 'Original content',
          status: 'active',
          edited: false
        })
        .select()
        .single()

      commentId = comment!.id
    })

    it('should update comment content', async () => {
      const response = await fetch(`http://localhost:3000/api/collaboration/comments`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          id: commentId,
          content: 'Updated content'
        })
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.comment.content).toBe('Updated content')
      expect(data.comment.edited).toBe(true)
    })

    it('should update comment attachments', async () => {
      const response = await fetch(`http://localhost:3000/api/collaboration/comments`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          id: commentId,
          content: 'Content with new attachment',
          attachments: [
            {
              id: 'att-2',
              name: 'updated.pdf',
              url: 'https://example.com/updated.pdf',
              type: 'application/pdf',
              size: 204800
            }
          ]
        })
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.comment.attachments).toHaveLength(1)
      expect(data.comment.attachments[0].name).toBe('updated.pdf')
    })

    it('should allow org admin to edit others comments', async () => {
      // Create comment by user2
      const { data: comment } = await supabase
        .from('comments')
        .insert({
          project_id: testProjectId,
          user_id: testUser2Id,
          content: 'User 2 comment',
          status: 'active',
          edited: false
        })
        .select()
        .single()

      // Edit as admin (testUserId)
      const response = await fetch(`http://localhost:3000/api/collaboration/comments`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          id: comment!.id,
          content: 'Edited by admin'
        })
      })

      expect(response.status).toBe(200)
    })

    it('should reject update without required fields', async () => {
      const response = await fetch(`http://localhost:3000/api/collaboration/comments`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          id: commentId
          // Missing content
        })
      })

      expect(response.status).toBe(400)
    })

    it('should reject update of non-existent comment', async () => {
      const response = await fetch(`http://localhost:3000/api/collaboration/comments`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          id: '00000000-0000-0000-0000-000000000000',
          content: 'Updated content'
        })
      })

      expect(response.status).toBe(404)
    })

    it('should deny non-author from editing without admin role', async () => {
      // Try to edit as user2 (non-admin, non-author)
      const response = await fetch(`http://localhost:3000/api/collaboration/comments`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken2}`
        },
        body: JSON.stringify({
          id: commentId,
          content: 'Unauthorized edit'
        })
      })

      expect(response.status).toBe(403)
    })
  })

  describe('DELETE /api/collaboration/comments', () => {
    let commentId: string
    let commentWithRepliesId: string

    beforeAll(async () => {
      // Create comment for soft delete
      const { data: comment } = await supabase
        .from('comments')
        .insert({
          project_id: testProjectId,
          user_id: testUserId,
          content: 'To be deleted',
          status: 'active',
          edited: false
        })
        .select()
        .single()

      commentId = comment!.id

      // Create comment with replies
      const { data: parentComment } = await supabase
        .from('comments')
        .insert({
          project_id: testProjectId,
          user_id: testUserId,
          content: 'Parent to be deleted',
          status: 'active',
          edited: false
        })
        .select()
        .single()

      commentWithRepliesId = parentComment!.id

      await supabase
        .from('comments')
        .insert({
          project_id: testProjectId,
          user_id: testUser2Id,
          content: 'Reply to deleted parent',
          parent_id: commentWithRepliesId,
          status: 'active',
          edited: false
        })
    })

    it('should soft delete comment', async () => {
      const response = await fetch(
        `http://localhost:3000/api/collaboration/comments?id=${commentId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)

      // Verify status changed to deleted
      const { data: comment } = await supabase
        .from('comments')
        .select('status')
        .eq('id', commentId)
        .single()

      expect(comment!.status).toBe('deleted')
    })

    it('should hard delete comment permanently', async () => {
      // Create new comment for hard delete
      const { data: comment } = await supabase
        .from('comments')
        .insert({
          project_id: testProjectId,
          user_id: testUserId,
          content: 'To be hard deleted',
          status: 'active',
          edited: false
        })
        .select()
        .single()

      const response = await fetch(
        `http://localhost:3000/api/collaboration/comments?id=${comment!.id}&hardDelete=true`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      expect(response.status).toBe(200)

      // Verify comment was deleted
      const { data: deletedComment } = await supabase
        .from('comments')
        .select('*')
        .eq('id', comment!.id)
        .single()

      expect(deletedComment).toBeNull()
    })

    it('should delete comment and all replies', async () => {
      const response = await fetch(
        `http://localhost:3000/api/collaboration/comments?id=${commentWithRepliesId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      expect(response.status).toBe(200)

      // Verify all replies are also deleted
      const { data: replies } = await supabase
        .from('comments')
        .select('status')
        .eq('parent_id', commentWithRepliesId)

      expect(replies!.every((r: any) => r.status === 'deleted')).toBe(true)
    })

    it('should require id parameter', async () => {
      const response = await fetch(
        `http://localhost:3000/api/collaboration/comments`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      expect(response.status).toBe(400)
    })

    it('should return 404 for non-existent comment', async () => {
      const response = await fetch(
        `http://localhost:3000/api/collaboration/comments?id=00000000-0000-0000-0000-000000000000`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      expect(response.status).toBe(404)
    })

    it('should allow org admin to delete others comments', async () => {
      // Create comment by user2
      const { data: comment } = await supabase
        .from('comments')
        .insert({
          project_id: testProjectId,
          user_id: testUser2Id,
          content: 'User 2 comment to delete',
          status: 'active',
          edited: false
        })
        .select()
        .single()

      // Delete as admin
      const response = await fetch(
        `http://localhost:3000/api/collaboration/comments?id=${comment!.id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      expect(response.status).toBe(200)
    })

    it('should deny non-author from deleting without admin role', async () => {
      // Create comment by user1
      const { data: comment } = await supabase
        .from('comments')
        .insert({
          project_id: testProjectId,
          user_id: testUserId,
          content: 'Protected comment',
          status: 'active',
          edited: false
        })
        .select()
        .single()

      // Try to delete as user2 (non-admin, non-author)
      const response = await fetch(
        `http://localhost:3000/api/collaboration/comments?id=${comment!.id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${authToken2}`
          }
        }
      )

      expect(response.status).toBe(403)
    })

    it('should require authentication for delete', async () => {
      const { data: comment } = await supabase
        .from('comments')
        .insert({
          project_id: testProjectId,
          user_id: testUserId,
          content: 'Test comment',
          status: 'active',
          edited: false
        })
        .select()
        .single()

      const response = await fetch(
        `http://localhost:3000/api/collaboration/comments?id=${comment!.id}`,
        {
          method: 'DELETE'
        }
      )

      expect(response.status).toBe(401)
    })
  })
})
