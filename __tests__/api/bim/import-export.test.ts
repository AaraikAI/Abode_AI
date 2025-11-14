/**
 * Integration Tests for IFC/BIM Import/Export API
 *
 * Tests IFC file import and export functionality
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-key'
const supabase = createClient(supabaseUrl, supabaseKey)

describe('IFC/BIM Import/Export API', () => {
  let testUserId: string
  let testOrgId: string
  let testProjectId: string
  let authToken: string

  beforeAll(async () => {
    // Create test user
    const { data: { user }, error } = await supabase.auth.admin.createUser({
      email: 'ifc-test@example.com',
      password: 'test-password-123',
      email_confirm: true
    })

    if (error || !user) {
      throw new Error('Failed to create test user')
    }

    testUserId = user.id

    // Sign in to get auth token
    const { data: { session } } = await supabase.auth.signInWithPassword({
      email: 'ifc-test@example.com',
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
        name: 'Test IFC Org'
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
        name: 'Test IFC Project',
        user_id: testUserId
      })
      .select()
      .single()

    testProjectId = project!.id
  })

  afterAll(async () => {
    // Cleanup
    await supabase.from('ifc_imports').delete().eq('project_id', testProjectId)
    await supabase.from('ifc_exports').delete().eq('project_id', testProjectId)
    await supabase.from('projects').delete().eq('id', testProjectId)
    await supabase.from('organization_members').delete().eq('organization_id', testOrgId)
    await supabase.from('organizations').delete().eq('id', testOrgId)
    await supabase.auth.admin.deleteUser(testUserId)
  })

  describe('POST /api/bim/import', () => {
    it('should import a valid IFC file', async () => {
      // Create a minimal test IFC file
      const testIfcContent = `ISO-10303-21;
HEADER;
FILE_DESCRIPTION(('ViewDefinition [CoordinationView]'),'2;1');
FILE_NAME('test.ifc','2025-01-01T00:00:00',(''),(''),'','','');
FILE_SCHEMA(('IFC4'));
ENDSEC;
DATA;
#1=IFCPROJECT('0123456789',#2,'Test Project',$,$,$,$,$,$);
#2=IFCOWNERHISTORY(#3,#4,$,.ADDED.,$,$,$,0);
#3=IFCPERSON($,$,'Test',$,$,$,$,$);
#4=IFCORGANIZATION($,'Test Org',$,$,$);
ENDSEC;
END-ISO-10303-21;`

      const blob = new Blob([testIfcContent], { type: 'application/ifc' })
      const file = new File([blob], 'test.ifc', { type: 'application/ifc' })

      const formData = new FormData()
      formData.append('file', file)
      formData.append('projectId', testProjectId)

      const response = await fetch('http://localhost:3000/api/bim/import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: formData
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.importId).toBeDefined()
      expect(data.data).toBeDefined()

      // Verify import record was created
      const { data: importRecord } = await supabase
        .from('ifc_imports')
        .select('*')
        .eq('id', data.importId)
        .single()

      expect(importRecord).toBeDefined()
      expect(importRecord!.file_name).toBe('test.ifc')
      expect(importRecord!.project_id).toBe(testProjectId)
    })

    it('should reject non-IFC files', async () => {
      const textFile = new File(['not an ifc file'], 'test.txt', { type: 'text/plain' })

      const formData = new FormData()
      formData.append('file', textFile)
      formData.append('projectId', testProjectId)

      const response = await fetch('http://localhost:3000/api/bim/import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: formData
      })

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('Invalid file type')
    })

    it('should reject files larger than 100MB', async () => {
      // Create a mock large file (we won't actually upload 100MB in tests)
      const largeContent = 'x'.repeat(101 * 1024 * 1024) // 101MB
      const largeFile = new File([largeContent], 'large.ifc', { type: 'application/ifc' })

      const formData = new FormData()
      formData.append('file', largeFile)
      formData.append('projectId', testProjectId)

      const response = await fetch('http://localhost:3000/api/bim/import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: formData
      })

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('too large')
    })

    it('should require projectId', async () => {
      const file = new File(['test'], 'test.ifc', { type: 'application/ifc' })

      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('http://localhost:3000/api/bim/import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: formData
      })

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('projectId')
    })

    it('should require authentication', async () => {
      const file = new File(['test'], 'test.ifc', { type: 'application/ifc' })

      const formData = new FormData()
      formData.append('file', file)
      formData.append('projectId', testProjectId)

      const response = await fetch('http://localhost:3000/api/bim/import', {
        method: 'POST',
        body: formData
      })

      expect(response.status).toBe(401)
    })
  })

  describe('GET /api/bim/import', () => {
    let testImportId: string

    beforeAll(async () => {
      // Create a test import record
      const { data: importRecord } = await supabase
        .from('ifc_imports')
        .insert({
          project_id: testProjectId,
          org_id: testOrgId,
          user_id: testUserId,
          file_name: 'test.ifc',
          file_size: 1024,
          file_url: 'https://example.com/test.ifc',
          ifc_data: {
            project: { name: 'Test Project' },
            objects: [],
            materials: []
          }
        })
        .select()
        .single()

      testImportId = importRecord!.id
    })

    it('should retrieve import by ID', async () => {
      const response = await fetch(
        `http://localhost:3000/api/bim/import?importId=${testImportId}`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.id).toBe(testImportId)
      expect(data.data.file_name).toBe('test.ifc')
    })

    it('should list imports for a project', async () => {
      const response = await fetch(
        `http://localhost:3000/api/bim/import?projectId=${testProjectId}`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(Array.isArray(data.data)).toBe(true)
      expect(data.data.length).toBeGreaterThan(0)
    })

    it('should return 404 for non-existent import', async () => {
      const response = await fetch(
        `http://localhost:3000/api/bim/import?importId=00000000-0000-0000-0000-000000000000`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      expect(response.status).toBe(404)
    })
  })

  describe('POST /api/bim/export', () => {
    const testSceneData = {
      project: {
        name: 'Test Export Project',
        description: 'Test export'
      },
      building: {
        name: 'Test Building',
        numStoreys: 2
      },
      objects: [
        {
          id: '1',
          type: 'IfcWall',
          name: 'Wall 1',
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
          geometry: {
            type: 'box',
            dimensions: { width: 5, height: 3, depth: 0.2 }
          },
          material: 'Concrete'
        },
        {
          id: '2',
          type: 'IfcWindow',
          name: 'Window 1',
          position: [2, 0, 1],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
          geometry: {
            type: 'box',
            dimensions: { width: 1.5, height: 1.2, depth: 0.1 }
          },
          material: 'Glass'
        }
      ],
      materials: [
        { name: 'Concrete', color: [0.5, 0.5, 0.5, 1.0] },
        { name: 'Glass', color: [0.8, 0.9, 1.0, 0.3] }
      ]
    }

    it('should export to IFC4', async () => {
      const response = await fetch('http://localhost:3000/api/bim/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          sceneData: testSceneData,
          schema: 'IFC4'
        })
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.exportId).toBeDefined()
      expect(data.downloadUrl).toBeDefined()

      // Verify export record was created
      const { data: exportRecord } = await supabase
        .from('ifc_exports')
        .select('*')
        .eq('id', data.exportId)
        .single()

      expect(exportRecord).toBeDefined()
      expect(exportRecord!.schema).toBe('IFC4')
      expect(exportRecord!.object_count).toBe(2)
    })

    it('should export to IFC2X3', async () => {
      const response = await fetch('http://localhost:3000/api/bim/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          sceneData: testSceneData,
          schema: 'IFC2X3'
        })
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)

      // Verify schema
      const { data: exportRecord } = await supabase
        .from('ifc_exports')
        .select('schema')
        .eq('id', data.exportId)
        .single()

      expect(exportRecord!.schema).toBe('IFC2X3')
    })

    it('should require scene data with objects', async () => {
      const response = await fetch('http://localhost:3000/api/bim/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          sceneData: { objects: [] }
        })
      })

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('at least one object')
    })

    it('should validate required fields', async () => {
      const response = await fetch('http://localhost:3000/api/bim/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId
          // Missing sceneData
        })
      })

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('required')
    })
  })

  describe('GET /api/bim/export', () => {
    let testExportId: string

    beforeAll(async () => {
      // Create a test export record
      const { data: exportRecord } = await supabase
        .from('ifc_exports')
        .insert({
          project_id: testProjectId,
          org_id: testOrgId,
          user_id: testUserId,
          file_name: 'export.ifc',
          file_size: 2048,
          file_url: 'https://example.com/export.ifc',
          schema: 'IFC4',
          object_count: 5
        })
        .select()
        .single()

      testExportId = exportRecord!.id
    })

    it('should retrieve export by ID', async () => {
      const response = await fetch(
        `http://localhost:3000/api/bim/export?exportId=${testExportId}`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.id).toBe(testExportId)
      expect(data.data.schema).toBe('IFC4')
      expect(data.data.object_count).toBe(5)
    })

    it('should list exports for a project', async () => {
      const response = await fetch(
        `http://localhost:3000/api/bim/export?projectId=${testProjectId}`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(Array.isArray(data.data)).toBe(true)
      expect(data.data.length).toBeGreaterThan(0)
    })
  })
})
