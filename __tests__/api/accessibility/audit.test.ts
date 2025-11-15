/**
 * Integration Tests for Accessibility Audit API
 *
 * Tests accessibility audits and WCAG compliance reports
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-key'
const supabase = createClient(supabaseUrl, supabaseKey)

describe('Accessibility Audit API', () => {
  let testUserId: string
  let testOrgId: string
  let testProjectId: string
  let authToken: string

  beforeAll(async () => {
    // Create test user
    const { data: { user }, error } = await supabase.auth.admin.createUser({
      email: 'accessibility-test@example.com',
      password: 'test-password-123',
      email_confirm: true
    })

    if (error || !user) {
      throw new Error('Failed to create test user')
    }

    testUserId = user.id

    // Sign in to get auth token
    const { data: { session } } = await supabase.auth.signInWithPassword({
      email: 'accessibility-test@example.com',
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
        name: 'Test Accessibility Org'
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
        name: 'Test Accessibility Project',
        user_id: testUserId
      })
      .select()
      .single()

    testProjectId = project!.id
  })

  afterAll(async () => {
    // Cleanup
    await supabase.from('accessibility_audits').delete().eq('org_id', testOrgId)
    await supabase.from('projects').delete().eq('id', testProjectId)
    await supabase.from('organization_members').delete().eq('organization_id', testOrgId)
    await supabase.from('organizations').delete().eq('id', testOrgId)
    await supabase.auth.admin.deleteUser(testUserId)
  })

  describe('POST /api/accessibility/audit', () => {
    it('should run audit on URL with WCAG 2.1 AA standards', async () => {
      const response = await fetch(`http://localhost:3000/api/accessibility/audit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          url: 'https://example.com',
          standards: ['WCAG2.1'],
          levels: ['A', 'AA'],
          includeWarnings: true
        })
      })

      expect(response.status).toBe(201)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.auditId).toBeDefined()
      expect(data.summary).toBeDefined()
      expect(data.summary.totalIssues).toBeGreaterThanOrEqual(0)
      expect(data.summary.complianceScore).toBeGreaterThanOrEqual(0)
      expect(data.summary.complianceScore).toBeLessThanOrEqual(100)
      expect(data.issues).toBeDefined()
      expect(Array.isArray(data.issues)).toBe(true)
    })

    it('should run audit with HTML content', async () => {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head><title>Test Page</title></head>
          <body>
            <img src="test.jpg">
            <button>Click me</button>
          </body>
        </html>
      `

      const response = await fetch(`http://localhost:3000/api/accessibility/audit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          html: htmlContent,
          standards: ['WCAG2.2'],
          levels: ['A', 'AA', 'AAA']
        })
      })

      expect(response.status).toBe(201)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.summary).toBeDefined()
    })

    it('should audit with project association', async () => {
      const response = await fetch(`http://localhost:3000/api/accessibility/audit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          url: 'https://example.com',
          projectId: testProjectId,
          standards: ['WCAG2.1'],
          levels: ['AA']
        })
      })

      expect(response.status).toBe(201)

      const data = await response.json()
      expect(data.success).toBe(true)

      // Verify audit was associated with project
      const { data: audit } = await supabase
        .from('accessibility_audits')
        .select('*')
        .eq('id', data.auditId)
        .single()

      expect(audit!.project_id).toBe(testProjectId)
    })

    it('should validate that url or html is provided', async () => {
      const response = await fetch(`http://localhost:3000/api/accessibility/audit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          standards: ['WCAG2.1'],
          levels: ['A']
          // Missing both url and html
        })
      })

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('url or html')
    })

    it('should validate standards are provided', async () => {
      const response = await fetch(`http://localhost:3000/api/accessibility/audit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          url: 'https://example.com',
          levels: ['A']
          // Missing standards
        })
      })

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('standard')
    })

    it('should validate levels are provided', async () => {
      const response = await fetch(`http://localhost:3000/api/accessibility/audit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          url: 'https://example.com',
          standards: ['WCAG2.1']
          // Missing levels
        })
      })

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('level')
    })

    it('should include warnings and notices when requested', async () => {
      const response = await fetch(`http://localhost:3000/api/accessibility/audit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          url: 'https://example.com',
          standards: ['WCAG2.1'],
          levels: ['A', 'AA'],
          includeWarnings: true,
          includeNotices: true
        })
      })

      expect(response.status).toBe(201)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.summary.warnings).toBeGreaterThanOrEqual(0)
      expect(data.summary.notices).toBeGreaterThanOrEqual(0)
    })

    it('should calculate compliance score correctly', async () => {
      const response = await fetch(`http://localhost:3000/api/accessibility/audit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          url: 'https://example.com',
          standards: ['WCAG2.1'],
          levels: ['A', 'AA']
        })
      })

      expect(response.status).toBe(201)

      const data = await response.json()
      expect(data.summary.complianceScore).toBeGreaterThanOrEqual(0)
      expect(data.summary.complianceScore).toBeLessThanOrEqual(100)
      expect(typeof data.summary.complianceScore).toBe('number')
    })

    it('should return detailed issue information', async () => {
      const response = await fetch(`http://localhost:3000/api/accessibility/audit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          url: 'https://example.com',
          standards: ['WCAG2.1'],
          levels: ['A', 'AA'],
          includeWarnings: true
        })
      })

      expect(response.status).toBe(201)

      const data = await response.json()
      if (data.issues.length > 0) {
        const issue = data.issues[0]
        expect(issue.code).toBeDefined()
        expect(issue.type).toBeDefined()
        expect(issue.message).toBeDefined()
        expect(issue.wcagLevel).toBeDefined()
        expect(issue.wcagCriteria).toBeDefined()
        expect(issue.recommendation).toBeDefined()
      }
    })

    it('should require authentication', async () => {
      const response = await fetch(`http://localhost:3000/api/accessibility/audit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: 'https://example.com',
          standards: ['WCAG2.1'],
          levels: ['A']
        })
      })

      expect(response.status).toBe(401)
    })
  })

  describe('GET /api/accessibility/audit', () => {
    let testAuditId: string

    beforeAll(async () => {
      // Create a test audit
      const { data: audit } = await supabase
        .from('accessibility_audits')
        .insert({
          org_id: testOrgId,
          user_id: testUserId,
          project_id: testProjectId,
          url: 'https://example.com',
          standards: ['WCAG2.1'],
          levels: ['A', 'AA'],
          total_issues: 10,
          errors: 5,
          warnings: 3,
          notices: 2,
          compliance_score: 85.5,
          wcag_level: 'A',
          issues: [
            {
              code: 'TEST001',
              type: 'error',
              message: 'Test error',
              context: '<div>',
              selector: 'div',
              wcagLevel: 'A',
              wcagCriteria: ['1.1.1'],
              recommendation: 'Fix this'
            }
          ]
        })
        .select()
        .single()

      testAuditId = audit!.id
    })

    it('should retrieve audit results', async () => {
      const response = await fetch(
        `http://localhost:3000/api/accessibility/audit?auditId=${testAuditId}`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.auditId).toBe(testAuditId)
      expect(data.summary).toBeDefined()
      expect(data.summary.totalIssues).toBe(10)
      expect(data.summary.errors).toBe(5)
      expect(data.summary.complianceScore).toBe(85.5)
      expect(data.issues).toBeDefined()
      expect(data.url).toBe('https://example.com')
    })

    it('should return 404 for non-existent audit', async () => {
      const response = await fetch(
        `http://localhost:3000/api/accessibility/audit?auditId=00000000-0000-0000-0000-000000000000`,
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
