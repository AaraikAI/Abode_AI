/**
 * Integration Tests for Collaboration Versions API
 *
 * Tests version creation, history, and snapshots
 * 30 comprehensive tests
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-key'
const supabase = createClient(supabaseUrl, supabaseKey)

describe('Collaboration Versions API', () => {
  let testUserId: string
  let testUser2Id: string
  let testOrgId: string
  let testProjectId: string
  let authToken: string
  let authToken2: string

  beforeAll(async () => {
    // Create test users
    const { data: { user }, error } = await supabase.auth.admin.createUser({
      email: 'versions-test@example.com',
      password: 'test-password-123',
      email_confirm: true
    })

    if (error || !user) {
      throw new Error('Failed to create test user')
    }

    testUserId = user.id

    const { data: { user: user2 } } = await supabase.auth.admin.createUser({
      email: 'versions-test-2@example.com',
      password: 'test-password-123',
      email_confirm: true
    })

    testUser2Id = user2!.id

    // Sign in to get auth tokens
    const { data: { session } } = await supabase.auth.signInWithPassword({
      email: 'versions-test@example.com',
      password: 'test-password-123'
    })

    authToken = session!.access_token

    const { data: { session: session2 } } = await supabase.auth.signInWithPassword({
      email: 'versions-test-2@example.com',
      password: 'test-password-123'
    })

    authToken2 = session2!.access_token

    // Create test organization
    const { data: org } = await supabase
      .from('organizations')
      .insert({ name: 'Test Versions Org' })
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
        name: 'Test Versions Project',
        user_id: testUserId
      })
      .select()
      .single()

    testProjectId = project!.id
  })

  afterAll(async () => {
    // Cleanup
    await supabase.from('versions').delete().eq('project_id', testProjectId)
    await supabase.from('projects').delete().eq('id', testProjectId)
    await supabase.from('organization_members').delete().eq('organization_id', testOrgId)
    await supabase.from('organizations').delete().eq('id', testOrgId)
    await supabase.auth.admin.deleteUser(testUserId)
    await supabase.auth.admin.deleteUser(testUser2Id)
  })

  describe('POST /api/collaboration/versions', () => {
    it('should create first version with auto-generated version number', async () => {
      const snapshotData = {
        models: [
          {
            id: 'model-1',
            name: 'floor-plan.ifc',
            type: 'ifc',
            url: 'https://example.com/model-1.ifc',
            checksum: 'abc123',
            size: 1024000
          }
        ],
        documents: [],
        settings: { scale: 1.0 },
        metadata: { author: 'Test User' }
      }

      const response = await fetch(`http://localhost:3000/api/collaboration/versions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          name: 'Initial version',
          description: 'First project snapshot',
          snapshotData
        })
      })

      expect(response.status).toBe(201)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.version).toBeDefined()
      expect(data.version.version_number).toBe('1.0.0')
      expect(data.version.snapshot_data).toEqual(snapshotData)
      expect(data.version.status).toBe('active')
    })

    it('should create version with custom version number', async () => {
      const response = await fetch(`http://localhost:3000/api/collaboration/versions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          versionNumber: '2.0.0',
          snapshotData: {
            models: [],
            documents: []
          }
        })
      })

      expect(response.status).toBe(201)

      const data = await response.json()
      expect(data.version.version_number).toBe('2.0.0')
    })

    it('should create major version', async () => {
      const response = await fetch(`http://localhost:3000/api/collaboration/versions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          isMajor: true,
          snapshotData: {
            models: [],
            documents: []
          }
        })
      })

      expect(response.status).toBe(201)

      const data = await response.json()
      expect(data.version.is_major).toBe(true)
      // Should increment major version
      expect(data.version.version_number).toMatch(/^\d+\.0\.0$/)
    })

    it('should create version with tags', async () => {
      const response = await fetch(`http://localhost:3000/api/collaboration/versions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          snapshotData: { models: [], documents: [] },
          tags: ['milestone', 'design-review', 'client-approved']
        })
      })

      expect(response.status).toBe(201)

      const data = await response.json()
      expect(data.version.tags).toEqual(['milestone', 'design-review', 'client-approved'])
    })

    it('should create version with parent reference', async () => {
      // Create parent version
      const parentResponse = await fetch(`http://localhost:3000/api/collaboration/versions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          versionNumber: '3.0.0',
          snapshotData: { models: [], documents: [] }
        })
      })

      const parentData = await parentResponse.json()
      const parentId = parentData.version.id

      // Create child version
      const response = await fetch(`http://localhost:3000/api/collaboration/versions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          versionNumber: '3.1.0',
          snapshotData: { models: [], documents: [] },
          parentVersionId: parentId
        })
      })

      expect(response.status).toBe(201)

      const data = await response.json()
      expect(data.version.parent_version_id).toBe(parentId)
    })

    it('should calculate changes summary from parent version', async () => {
      // Create parent version
      const parentSnapshot = {
        models: [
          {
            id: 'model-1',
            name: 'floor-plan.ifc',
            type: 'ifc',
            url: 'https://example.com/model-1.ifc',
            checksum: 'abc123',
            size: 1024000
          }
        ],
        documents: []
      }

      const parentResponse = await fetch(`http://localhost:3000/api/collaboration/versions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          versionNumber: '4.0.0',
          snapshotData: parentSnapshot
        })
      })

      const parentData = await parentResponse.json()

      // Create new version with changes
      const newSnapshot = {
        models: [
          {
            id: 'model-1',
            name: 'floor-plan.ifc',
            type: 'ifc',
            url: 'https://example.com/model-1.ifc',
            checksum: 'xyz789', // Different checksum (modified)
            size: 1024000
          },
          {
            id: 'model-2',
            name: 'elevation.ifc',
            type: 'ifc',
            url: 'https://example.com/model-2.ifc',
            checksum: 'def456',
            size: 512000
          }
        ],
        documents: []
      }

      const response = await fetch(`http://localhost:3000/api/collaboration/versions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          versionNumber: '4.1.0',
          snapshotData: newSnapshot,
          parentVersionId: parentData.version.id
        })
      })

      expect(response.status).toBe(201)

      const data = await response.json()
      expect(data.version.changes_summary).toBeDefined()
      expect(data.version.changes_summary.added).toContain('model:elevation.ifc')
      expect(data.version.changes_summary.modified).toContain('model:floor-plan.ifc')
    })

    it('should generate commit hash for snapshot', async () => {
      const response = await fetch(`http://localhost:3000/api/collaboration/versions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          versionNumber: '5.0.0',
          snapshotData: { models: [], documents: [] }
        })
      })

      expect(response.status).toBe(201)

      const data = await response.json()
      expect(data.version.commit_hash).toBeDefined()
      expect(data.version.commit_hash).toMatch(/^[a-f0-9]{64}$/) // SHA-256 hash
    })

    it('should calculate snapshot size', async () => {
      const response = await fetch(`http://localhost:3000/api/collaboration/versions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          versionNumber: '6.0.0',
          snapshotData: { models: [], documents: [] }
        })
      })

      expect(response.status).toBe(201)

      const data = await response.json()
      expect(data.version.size_bytes).toBeGreaterThan(0)
    })

    it('should reject duplicate version number', async () => {
      // Create version
      await fetch(`http://localhost:3000/api/collaboration/versions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          versionNumber: '7.0.0',
          snapshotData: { models: [], documents: [] }
        })
      })

      // Try to create again with same version
      const response = await fetch(`http://localhost:3000/api/collaboration/versions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          versionNumber: '7.0.0',
          snapshotData: { models: [], documents: [] }
        })
      })

      expect(response.status).toBe(409)

      const data = await response.json()
      expect(data.error).toContain('already exists')
    })

    it('should detect duplicate snapshots', async () => {
      const snapshotData = {
        models: [{ id: 'unique-model', name: 'test.ifc', type: 'ifc', url: 'https://example.com/test.ifc', checksum: 'unique123', size: 1000 }],
        documents: []
      }

      // Create first version
      await fetch(`http://localhost:3000/api/collaboration/versions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          versionNumber: '8.0.0',
          snapshotData
        })
      })

      // Try to create with identical snapshot but different version number
      const response = await fetch(`http://localhost:3000/api/collaboration/versions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          versionNumber: '8.1.0',
          snapshotData
        })
      })

      expect(response.status).toBe(409)

      const data = await response.json()
      expect(data.error).toContain('Duplicate snapshot')
      expect(data.existingVersionId).toBeDefined()
    })

    it('should reject version without required fields', async () => {
      const response = await fetch(`http://localhost:3000/api/collaboration/versions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId
          // Missing snapshotData
        })
      })

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('required')
    })

    it('should reject version without authentication', async () => {
      const response = await fetch(`http://localhost:3000/api/collaboration/versions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projectId: testProjectId,
          snapshotData: { models: [], documents: [] }
        })
      })

      expect(response.status).toBe(401)
    })

    it('should reject version with invalid parent', async () => {
      const response = await fetch(`http://localhost:3000/api/collaboration/versions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          versionNumber: '9.0.0',
          snapshotData: { models: [], documents: [] },
          parentVersionId: '00000000-0000-0000-0000-000000000000'
        })
      })

      expect(response.status).toBe(404)

      const data = await response.json()
      expect(data.error).toContain('Parent version not found')
    })

    it('should reject viewer from creating versions', async () => {
      // Create viewer user
      const { data: { user: viewer } } = await supabase.auth.admin.createUser({
        email: 'viewer@example.com',
        password: 'test-password-123',
        email_confirm: true
      })

      await supabase
        .from('organization_members')
        .insert({
          organization_id: testOrgId,
          user_id: viewer!.id,
          role: 'viewer'
        })

      const { data: { session } } = await supabase.auth.signInWithPassword({
        email: 'viewer@example.com',
        password: 'test-password-123'
      })

      const response = await fetch(`http://localhost:3000/api/collaboration/versions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session!.access_token}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          snapshotData: { models: [], documents: [] }
        })
      })

      expect(response.status).toBe(403)

      const data = await response.json()
      expect(data.error).toContain('Viewers cannot create versions')

      // Cleanup
      await supabase.from('organization_members').delete().eq('user_id', viewer!.id)
      await supabase.auth.admin.deleteUser(viewer!.id)
    })
  })

  describe('GET /api/collaboration/versions', () => {
    let versionId: string

    beforeAll(async () => {
      // Create test versions
      const { data: version } = await supabase
        .from('versions')
        .insert({
          project_id: testProjectId,
          version_number: '10.0.0',
          created_by: testUserId,
          snapshot_data: { models: [], documents: [] },
          commit_hash: 'test-hash-1',
          size_bytes: 1000,
          is_major: true,
          status: 'active',
          tags: ['release']
        })
        .select()
        .single()

      versionId = version!.id

      // Create more versions
      await supabase
        .from('versions')
        .insert([
          {
            project_id: testProjectId,
            version_number: '10.1.0',
            created_by: testUser2Id,
            snapshot_data: { models: [], documents: [] },
            commit_hash: 'test-hash-2',
            size_bytes: 1500,
            is_major: false,
            status: 'active',
            tags: ['development']
          },
          {
            project_id: testProjectId,
            version_number: '10.2.0',
            created_by: testUserId,
            snapshot_data: { models: [], documents: [] },
            commit_hash: 'test-hash-3',
            size_bytes: 2000,
            is_major: false,
            status: 'active'
          }
        ])
    })

    it('should list versions for a project', async () => {
      const response = await fetch(
        `http://localhost:3000/api/collaboration/versions?projectId=${testProjectId}`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.versions).toBeDefined()
      expect(Array.isArray(data.versions)).toBe(true)
      expect(data.versions.length).toBeGreaterThan(0)
      expect(data.total).toBeGreaterThan(0)
    })

    it('should get specific version by ID', async () => {
      const response = await fetch(
        `http://localhost:3000/api/collaboration/versions?projectId=${testProjectId}&versionId=${versionId}`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.version).toBeDefined()
      expect(data.version.id).toBe(versionId)
      expect(data.version.version_number).toBe('10.0.0')
    })

    it('should filter by major versions only', async () => {
      const response = await fetch(
        `http://localhost:3000/api/collaboration/versions?projectId=${testProjectId}&isMajor=true`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      const data = await response.json()
      expect(data.versions.every((v: any) => v.is_major === true)).toBe(true)
    })

    it('should filter by tags', async () => {
      const response = await fetch(
        `http://localhost:3000/api/collaboration/versions?projectId=${testProjectId}&tags=release`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      const data = await response.json()
      expect(data.versions.every((v: any) => v.tags?.includes('release'))).toBe(true)
    })

    it('should support pagination', async () => {
      const response = await fetch(
        `http://localhost:3000/api/collaboration/versions?projectId=${testProjectId}&limit=2&offset=0`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      const data = await response.json()
      expect(data.versions.length).toBeLessThanOrEqual(2)
      expect(data.limit).toBe(2)
      expect(data.offset).toBe(0)
    })

    it('should return versions in chronological order (newest first)', async () => {
      const response = await fetch(
        `http://localhost:3000/api/collaboration/versions?projectId=${testProjectId}`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      const data = await response.json()
      const timestamps = data.versions.map((v: any) => new Date(v.created_at).getTime())

      for (let i = 1; i < timestamps.length; i++) {
        expect(timestamps[i]).toBeLessThanOrEqual(timestamps[i - 1])
      }
    })

    it('should include user information', async () => {
      const response = await fetch(
        `http://localhost:3000/api/collaboration/versions?projectId=${testProjectId}`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      const data = await response.json()
      expect(data.versions[0].user).toBeDefined()
      expect(data.versions[0].user.id).toBeDefined()
      expect(data.versions[0].user.name).toBeDefined()
    })

    it('should require projectId parameter', async () => {
      const response = await fetch(
        `http://localhost:3000/api/collaboration/versions`,
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
        `http://localhost:3000/api/collaboration/versions?projectId=${testProjectId}`
      )

      expect(response.status).toBe(401)
    })

    it('should deny access to non-members', async () => {
      // Create user not in org
      const { data: { user: outsider } } = await supabase.auth.admin.createUser({
        email: 'outsider-version@example.com',
        password: 'test-password-123',
        email_confirm: true
      })

      const { data: { session } } = await supabase.auth.signInWithPassword({
        email: 'outsider-version@example.com',
        password: 'test-password-123'
      })

      const response = await fetch(
        `http://localhost:3000/api/collaboration/versions?projectId=${testProjectId}`,
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

    it('should return 404 for non-existent version', async () => {
      const response = await fetch(
        `http://localhost:3000/api/collaboration/versions?projectId=${testProjectId}&versionId=00000000-0000-0000-0000-000000000000`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      expect(response.status).toBe(404)
    })

    it('should return hasMore flag', async () => {
      const response = await fetch(
        `http://localhost:3000/api/collaboration/versions?projectId=${testProjectId}&limit=1`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      const data = await response.json()
      expect(data.hasMore).toBeDefined()
    })
  })

  describe('Version number generation', () => {
    it('should auto-increment minor version for non-major releases', async () => {
      // Create base version
      await fetch(`http://localhost:3000/api/collaboration/versions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          versionNumber: '20.5.0',
          snapshotData: { models: [], documents: [] }
        })
      })

      // Create next version without specifying number
      const response = await fetch(`http://localhost:3000/api/collaboration/versions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          isMajor: false,
          snapshotData: { models: [], documents: [] }
        })
      })

      const data = await response.json()
      expect(data.version.version_number).toBe('20.6.0')
    })

    it('should auto-increment major version and reset minor/patch', async () => {
      const response = await fetch(`http://localhost:3000/api/collaboration/versions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          isMajor: true,
          snapshotData: { models: [], documents: [] }
        })
      })

      const data = await response.json()
      expect(data.version.version_number).toMatch(/^\d+\.0\.0$/)
    })

    it('should start at 1.0.0 for first version', async () => {
      // Create new project with no versions
      const { data: newProject } = await supabase
        .from('projects')
        .insert({
          org_id: testOrgId,
          name: 'Empty Project',
          user_id: testUserId
        })
        .select()
        .single()

      const response = await fetch(`http://localhost:3000/api/collaboration/versions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: newProject!.id,
          snapshotData: { models: [], documents: [] }
        })
      })

      const data = await response.json()
      expect(data.version.version_number).toBe('1.0.0')

      // Cleanup
      await supabase.from('versions').delete().eq('project_id', newProject!.id)
      await supabase.from('projects').delete().eq('id', newProject!.id)
    })
  })

  describe('Version metadata and tracking', () => {
    it('should track version creator', async () => {
      const response = await fetch(`http://localhost:3000/api/collaboration/versions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken2}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          versionNumber: '30.0.0',
          snapshotData: { models: [], documents: [] }
        })
      })

      const data = await response.json()
      expect(data.version.created_by).toBe(testUser2Id)
      expect(data.version.user).toBeDefined()
      expect(data.version.user.id).toBe(testUser2Id)
    })
  })
})
