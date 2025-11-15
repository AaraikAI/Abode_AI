/**
 * Integration Tests for Risk Assessment API
 *
 * Tests AI-powered risk assessment, heat maps, and mitigation strategies
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-key'
const supabase = createClient(supabaseUrl, supabaseKey)

describe('Risk Assessment API', () => {
  let testUserId: string
  let testProjectId: string
  let authToken: string

  const testAssessmentParams = {
    assessmentName: 'Commercial Office Risk Assessment',
    projectInfo: {
      type: 'commercial',
      size: 50000,
      budget: 10000000,
      duration: 18,
      location: {
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        climate: 'Mediterranean',
        seismicZone: 4
      },
      complexity: 'high' as const
    },
    stakeholders: {
      client: { experience: 'moderate', expectations: 'high' },
      team: { size: 12, experience: 'experienced' },
      contractors: { reliability: 'good' }
    },
    constraints: {
      timeline: { flexible: false, criticalMilestones: ['Permit approval', 'Foundation complete', 'Substantial completion'] },
      budget: { contingency: 0.10, fixedCosts: 2000000 },
      regulations: ['IBC 2021', 'California Building Code', 'Title 24'],
      dependencies: ['Utility connections', 'Adjacent property access']
    },
    analysis: {
      categories: ['technical', 'financial', 'schedule', 'safety', 'regulatory', 'environmental'],
      depth: 'comprehensive' as const,
      includeQuantitative: true,
      includeMitigation: true
    }
  }

  beforeAll(async () => {
    // Create test user
    const { data: { user }, error } = await supabase.auth.admin.createUser({
      email: 'risk-test@example.com',
      password: 'test-password-123',
      email_confirm: true
    })

    if (error || !user) {
      throw new Error('Failed to create test user')
    }

    testUserId = user.id

    // Sign in to get auth token
    const { data: { session } } = await supabase.auth.signInWithPassword({
      email: 'risk-test@example.com',
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
        name: 'Test Risk Assessment Project',
        user_id: testUserId
      })
      .select()
      .single()

    testProjectId = project!.id
  })

  afterAll(async () => {
    // Cleanup
    await supabase.from('risk_assessments').delete().eq('project_id', testProjectId)
    await supabase.from('projects').delete().eq('id', testProjectId)
    await supabase.auth.admin.deleteUser(testUserId)
  })

  describe('POST /api/risk/assess', () => {
    it('should perform risk assessment successfully', async () => {
      const response = await fetch('http://localhost:3000/api/risk/assess', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          ...testAssessmentParams
        })
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.assessmentId).toBeDefined()
      expect(data.data.result).toBeDefined()

      const result = data.data.result
      expect(result.summary).toBeDefined()
      expect(result.risks).toBeDefined()
      expect(result.heatMap).toBeDefined()
      expect(result.categoryAnalysis).toBeDefined()
      expect(result.timeline).toBeDefined()
      expect(result.financialImpact).toBeDefined()
      expect(result.recommendations).toBeDefined()
      expect(result.aiInsights).toBeDefined()
    })

    it('should generate comprehensive risk summary', async () => {
      const response = await fetch('http://localhost:3000/api/risk/assess', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          ...testAssessmentParams
        })
      })

      const data = await response.json()
      const summary = data.data.result.summary

      expect(summary.totalRisks).toBeGreaterThan(0)
      expect(summary.criticalRisks).toBeGreaterThanOrEqual(0)
      expect(summary.highRisks).toBeGreaterThanOrEqual(0)
      expect(summary.mediumRisks).toBeGreaterThanOrEqual(0)
      expect(summary.lowRisks).toBeGreaterThanOrEqual(0)
      expect(summary.overallRiskScore).toBeGreaterThan(0)
      expect(['critical', 'high', 'medium', 'low']).toContain(summary.riskLevel)

      // Verify sum
      const totalCounted = summary.criticalRisks + summary.highRisks + summary.mediumRisks + summary.lowRisks
      expect(totalCounted).toBe(summary.totalRisks)
    })

    it('should identify individual risks with details', async () => {
      const response = await fetch('http://localhost:3000/api/risk/assess', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          ...testAssessmentParams
        })
      })

      const data = await response.json()
      const risks = data.data.result.risks

      expect(Array.isArray(risks)).toBe(true)
      expect(risks.length).toBeGreaterThan(0)

      const risk = risks[0]
      expect(risk.id).toBeDefined()
      expect(risk.category).toBeDefined()
      expect(risk.title).toBeDefined()
      expect(risk.description).toBeDefined()
      expect(risk.probability).toBeGreaterThan(0)
      expect(risk.probability).toBeLessThanOrEqual(1)
      expect(risk.impact).toBeGreaterThan(0)
      expect(risk.impact).toBeLessThanOrEqual(1)
      expect(['critical', 'high', 'medium', 'low']).toContain(risk.severity)
      expect(risk.riskScore).toBeGreaterThan(0)
      expect(risk.phase).toBeDefined()
      expect(Array.isArray(risk.triggers)).toBe(true)
      expect(Array.isArray(risk.indicators)).toBe(true)
      expect(Array.isArray(risk.consequences)).toBe(true)
    })

    it('should provide mitigation strategies for each risk', async () => {
      const response = await fetch('http://localhost:3000/api/risk/assess', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          ...testAssessmentParams
        })
      })

      const data = await response.json()
      const risks = data.data.result.risks

      risks.forEach((risk: any) => {
        expect(risk.mitigation).toBeDefined()
        expect(['avoid', 'transfer', 'mitigate', 'accept']).toContain(risk.mitigation.strategy)
        expect(Array.isArray(risk.mitigation.actions)).toBe(true)
        expect(risk.mitigation.actions.length).toBeGreaterThan(0)

        const action = risk.mitigation.actions[0]
        expect(action.action).toBeDefined()
        expect(action.responsibility).toBeDefined()
        expect(action.timeline).toBeDefined()
        expect(action.cost).toBeGreaterThanOrEqual(0)
        expect(action.effectiveness).toBeGreaterThan(0)
        expect(action.effectiveness).toBeLessThanOrEqual(1)

        expect(risk.mitigation.residualRisk).toBeGreaterThanOrEqual(0)
        expect(risk.mitigation.residualRisk).toBeLessThan(risk.probability * risk.impact)
      })
    })

    it('should generate risk heat map', async () => {
      const response = await fetch('http://localhost:3000/api/risk/assess', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          ...testAssessmentParams
        })
      })

      const data = await response.json()
      const heatMap = data.data.result.heatMap

      expect(heatMap.grid).toBeDefined()
      expect(Array.isArray(heatMap.grid)).toBe(true)
      expect(heatMap.grid.length).toBeGreaterThan(0)

      expect(heatMap.zones).toBeDefined()
      expect(heatMap.zones.critical).toBeDefined()
      expect(heatMap.zones.high).toBeDefined()
      expect(heatMap.zones.medium).toBeDefined()
      expect(heatMap.zones.low).toBeDefined()

      // Verify grid structure
      const cell = heatMap.grid[0][0]
      expect(cell.probability).toBeDefined()
      expect(cell.impact).toBeDefined()
      expect(Array.isArray(cell.risks)).toBe(true)
      expect(cell.count).toBeGreaterThanOrEqual(0)
    })

    it('should analyze risks by category', async () => {
      const response = await fetch('http://localhost:3000/api/risk/assess', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          ...testAssessmentParams
        })
      })

      const data = await response.json()
      const categoryAnalysis = data.data.result.categoryAnalysis

      expect(Array.isArray(categoryAnalysis)).toBe(true)
      expect(categoryAnalysis.length).toBeGreaterThan(0)

      const category = categoryAnalysis[0]
      expect(category.category).toBeDefined()
      expect(category.riskCount).toBeGreaterThan(0)
      expect(category.averageScore).toBeGreaterThan(0)
      expect(Array.isArray(category.topRisks)).toBe(true)
      expect(['increasing', 'stable', 'decreasing']).toContain(category.trend)
    })

    it('should analyze risks across project timeline', async () => {
      const response = await fetch('http://localhost:3000/api/risk/assess', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          ...testAssessmentParams
        })
      })

      const data = await response.json()
      const timeline = data.data.result.timeline

      expect(Array.isArray(timeline)).toBe(true)
      expect(timeline.length).toBeGreaterThan(0)

      const phase = timeline[0]
      expect(phase.phase).toBeDefined()
      expect(Array.isArray(phase.risks)).toBe(true)
      expect(phase.peakRiskScore).toBeGreaterThanOrEqual(0)
    })

    it('should calculate financial impact', async () => {
      const response = await fetch('http://localhost:3000/api/risk/assess', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          ...testAssessmentParams
        })
      })

      const data = await response.json()
      const financialImpact = data.data.result.financialImpact

      expect(financialImpact.potentialCost).toBeGreaterThanOrEqual(0)
      expect(financialImpact.expectedCost).toBeGreaterThanOrEqual(0)
      expect(financialImpact.contingencyRecommended).toBeGreaterThan(0)
      expect(financialImpact.mitigationCost).toBeGreaterThanOrEqual(0)

      // Expected cost should be less than potential cost (after mitigation)
      expect(financialImpact.expectedCost).toBeLessThanOrEqual(financialImpact.potentialCost)
    })

    it('should provide actionable recommendations', async () => {
      const response = await fetch('http://localhost:3000/api/risk/assess', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          ...testAssessmentParams
        })
      })

      const data = await response.json()
      const recommendations = data.data.result.recommendations

      expect(Array.isArray(recommendations.immediate)).toBe(true)
      expect(Array.isArray(recommendations.shortTerm)).toBe(true)
      expect(Array.isArray(recommendations.longTerm)).toBe(true)
      expect(Array.isArray(recommendations.monitoring)).toBe(true)

      if (recommendations.monitoring.length > 0) {
        const monitor = recommendations.monitoring[0]
        expect(monitor.risk).toBeDefined()
        expect(monitor.frequency).toBeDefined()
        expect(Array.isArray(monitor.metrics)).toBe(true)
      }
    })

    it('should provide AI insights', async () => {
      const response = await fetch('http://localhost:3000/api/risk/assess', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          ...testAssessmentParams
        })
      })

      const data = await response.json()
      const aiInsights = data.data.result.aiInsights

      expect(aiInsights.summary).toBeDefined()
      expect(typeof aiInsights.summary).toBe('string')
      expect(Array.isArray(aiInsights.keyFindings)).toBe(true)
      expect(aiInsights.keyFindings.length).toBeGreaterThan(0)
      expect(Array.isArray(aiInsights.patterns)).toBe(true)
      expect(Array.isArray(aiInsights.comparisons)).toBe(true)

      if (aiInsights.comparisons.length > 0) {
        const comparison = aiInsights.comparisons[0]
        expect(comparison.aspect).toBeDefined()
        expect(comparison.benchmark).toBeDefined()
        expect(['above', 'at', 'below']).toContain(comparison.status)
      }
    })

    it('should assess risks for different project complexities', async () => {
      const lowComplexityResponse = await fetch('http://localhost:3000/api/risk/assess', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          ...testAssessmentParams,
          projectInfo: {
            ...testAssessmentParams.projectInfo,
            complexity: 'low'
          }
        })
      })

      const lowData = await lowComplexityResponse.json()
      const lowRiskLevel = lowData.data.result.summary.overallRiskScore

      const highComplexityResponse = await fetch('http://localhost:3000/api/risk/assess', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          ...testAssessmentParams,
          projectInfo: {
            ...testAssessmentParams.projectInfo,
            complexity: 'very-high'
          }
        })
      })

      const highData = await highComplexityResponse.json()
      const highRiskLevel = highData.data.result.summary.overallRiskScore

      // Higher complexity should generally result in higher risk
      expect(highRiskLevel).toBeGreaterThanOrEqual(lowRiskLevel)
    })

    it('should validate required categories', async () => {
      const response = await fetch('http://localhost:3000/api/risk/assess', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          ...testAssessmentParams,
          analysis: {
            ...testAssessmentParams.analysis,
            categories: []
          }
        })
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('category')
    })

    it('should validate project information', async () => {
      const response = await fetch('http://localhost:3000/api/risk/assess', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          assessmentName: 'Test',
          analysis: testAssessmentParams.analysis
          // Missing projectInfo
        })
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('project information')
    })

    it('should require authentication', async () => {
      const response = await fetch('http://localhost:3000/api/risk/assess', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projectId: testProjectId,
          ...testAssessmentParams
        })
      })

      expect(response.status).toBe(401)
    })
  })

  describe('GET /api/risk/assess', () => {
    let testAssessmentId: string

    beforeAll(async () => {
      // Create a test assessment record
      const { data: assessment } = await supabase
        .from('risk_assessments')
        .insert({
          project_id: testProjectId,
          user_id: testUserId,
          assessment_name: 'Test Assessment',
          project_info: testAssessmentParams.projectInfo,
          analysis_config: testAssessmentParams.analysis,
          result: {
            summary: { totalRisks: 5, criticalRisks: 1, highRisks: 2, mediumRisks: 2, lowRisks: 0, overallRiskScore: 35, riskLevel: 'high' },
            risks: [],
            heatMap: { grid: [], zones: {} },
            categoryAnalysis: [],
            timeline: [],
            financialImpact: { potentialCost: 500000, expectedCost: 200000, contingencyRecommended: 300000, mitigationCost: 50000 },
            recommendations: { immediate: [], shortTerm: [], longTerm: [], monitoring: [] },
            aiInsights: { summary: 'Test', keyFindings: [], patterns: [], comparisons: [] }
          }
        })
        .select()
        .single()

      testAssessmentId = assessment!.id
    })

    it('should retrieve assessment by ID', async () => {
      const response = await fetch(
        `http://localhost:3000/api/risk/assess?assessmentId=${testAssessmentId}`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.id).toBe(testAssessmentId)
      expect(data.data.result).toBeDefined()
    })

    it('should return 404 for non-existent assessment', async () => {
      const response = await fetch(
        `http://localhost:3000/api/risk/assess?assessmentId=00000000-0000-0000-0000-000000000000`,
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
