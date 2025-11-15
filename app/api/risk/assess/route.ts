/**
 * Risk Assessment API Endpoint
 *
 * Assesses project risks with AI, generates heat maps, and provides mitigation strategies
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export interface RiskAssessmentParams {
  projectId: string
  assessmentName: string
  projectInfo: {
    type: string // 'residential', 'commercial', 'industrial', etc.
    size: number // sqft
    budget: number // USD
    duration: number // months
    location: {
      city: string
      state: string
      country: string
      climate?: string
      seismicZone?: number
    }
    complexity: 'low' | 'medium' | 'high' | 'very-high'
  }
  stakeholders: {
    client: { experience: string; expectations: string }
    team: { size: number; experience: string }
    contractors: { reliability: string }
  }
  constraints: {
    timeline: { flexible: boolean; criticalMilestones: string[] }
    budget: { contingency: number; fixedCosts: number }
    regulations: string[]
    dependencies: string[]
  }
  analysis: {
    categories: string[] // ['technical', 'financial', 'schedule', 'safety', 'regulatory', 'environmental']
    depth: 'high-level' | 'detailed' | 'comprehensive'
    includeQuantitative: boolean
    includeMitigation: boolean
  }
}

export interface Risk {
  id: string
  category: string
  title: string
  description: string
  probability: number // 0-1
  impact: number // 0-1
  severity: 'critical' | 'high' | 'medium' | 'low'
  riskScore: number // probability * impact * 100
  phase: string // 'design', 'permitting', 'construction', 'closeout'
  triggers: string[]
  indicators: string[]
  consequences: string[]
  mitigation: {
    strategy: 'avoid' | 'transfer' | 'mitigate' | 'accept'
    actions: Array<{
      action: string
      responsibility: string
      timeline: string
      cost: number
      effectiveness: number // 0-1
    }>
    residualRisk: number // after mitigation
  }
}

export interface RiskAssessmentResult {
  summary: {
    totalRisks: number
    criticalRisks: number
    highRisks: number
    mediumRisks: number
    lowRisks: number
    overallRiskScore: number
    riskLevel: 'critical' | 'high' | 'medium' | 'low'
  }
  risks: Risk[]
  heatMap: {
    grid: Array<Array<{
      probability: number
      impact: number
      risks: string[] // risk IDs
      count: number
    }>>
    zones: {
      critical: { min: number; color: string }
      high: { min: number; color: string }
      medium: { min: number; color: string }
      low: { min: number; color: string }
    }
  }
  categoryAnalysis: Array<{
    category: string
    riskCount: number
    averageScore: number
    topRisks: string[]
    trend: 'increasing' | 'stable' | 'decreasing'
  }>
  timeline: Array<{
    phase: string
    risks: string[]
    peakRiskScore: number
  }>
  financialImpact: {
    potentialCost: number
    expectedCost: number
    contingencyRecommended: number
    mitigationCost: number
  }
  recommendations: {
    immediate: string[]
    shortTerm: string[]
    longTerm: string[]
    monitoring: Array<{
      risk: string
      frequency: string
      metrics: string[]
    }>
  }
  aiInsights: {
    summary: string
    keyFindings: string[]
    patterns: string[]
    comparisons: Array<{
      aspect: string
      benchmark: string
      status: 'above' | 'at' | 'below'
    }>
  }
}

/**
 * Simulates AI-powered risk assessment
 */
async function performRiskAssessment(params: RiskAssessmentParams): Promise<RiskAssessmentResult> {
  const risks: Risk[] = []

  // Technical Risks
  if (params.analysis.categories.includes('technical')) {
    risks.push({
      id: 'tech-001',
      category: 'Technical',
      title: 'Design Complexity Risk',
      description: `Project complexity rated as ${params.projectInfo.complexity} increases risk of design errors and rework`,
      probability: params.projectInfo.complexity === 'very-high' ? 0.7 : params.projectInfo.complexity === 'high' ? 0.5 : 0.3,
      impact: 0.7,
      severity: params.projectInfo.complexity === 'very-high' ? 'critical' : 'high',
      riskScore: 0,
      phase: 'design',
      triggers: ['Insufficient design review', 'Unclear requirements', 'Technology limitations'],
      indicators: ['Design change requests increasing', 'Extended review cycles', 'Coordination issues'],
      consequences: ['Schedule delays', 'Budget overruns', 'Quality issues'],
      mitigation: {
        strategy: 'mitigate',
        actions: [
          {
            action: 'Implement robust design review process with multiple checkpoints',
            responsibility: 'Design Team Lead',
            timeline: 'Immediate',
            cost: 15000,
            effectiveness: 0.8
          },
          {
            action: 'Engage specialist consultants for complex systems',
            responsibility: 'Project Manager',
            timeline: 'Within 2 weeks',
            cost: 25000,
            effectiveness: 0.75
          }
        ],
        residualRisk: 0.15
      }
    })

    risks.push({
      id: 'tech-002',
      category: 'Technical',
      title: 'Site Conditions Uncertainty',
      description: 'Unknown subsurface conditions or environmental factors',
      probability: 0.5,
      impact: 0.6,
      severity: 'medium',
      riskScore: 0,
      phase: 'construction',
      triggers: ['Limited geotechnical data', 'Historical site uses'],
      indicators: ['Unexpected soil conditions', 'Contamination found'],
      consequences: ['Foundation redesign', 'Remediation costs', 'Schedule delays'],
      mitigation: {
        strategy: 'mitigate',
        actions: [
          {
            action: 'Comprehensive geotechnical investigation',
            responsibility: 'Civil Engineer',
            timeline: 'Before design completion',
            cost: 20000,
            effectiveness: 0.85
          }
        ],
        residualRisk: 0.08
      }
    })
  }

  // Financial Risks
  if (params.analysis.categories.includes('financial')) {
    risks.push({
      id: 'fin-001',
      category: 'Financial',
      title: 'Budget Overrun Risk',
      description: `Project budget of $${(params.projectInfo.budget / 1000000).toFixed(1)}M with ${(params.constraints.budget.contingency * 100).toFixed(0)}% contingency`,
      probability: params.constraints.budget.contingency < 0.1 ? 0.7 : 0.4,
      impact: 0.8,
      severity: params.constraints.budget.contingency < 0.1 ? 'critical' : 'high',
      riskScore: 0,
      phase: 'construction',
      triggers: ['Material price escalation', 'Scope changes', 'Construction delays'],
      indicators: ['Current costs trending above estimates', 'Change orders accumulating'],
      consequences: ['Project funding shortfall', 'Scope reduction', 'Quality compromises'],
      mitigation: {
        strategy: 'mitigate',
        actions: [
          {
            action: 'Implement strict change order review process',
            responsibility: 'Project Manager',
            timeline: 'Immediate',
            cost: 5000,
            effectiveness: 0.7
          },
          {
            action: 'Lock in material prices with early procurement',
            responsibility: 'Procurement Manager',
            timeline: '1 month',
            cost: 0,
            effectiveness: 0.8
          },
          {
            action: 'Increase contingency reserve to 15%',
            responsibility: 'Owner',
            timeline: 'Before construction',
            cost: params.projectInfo.budget * 0.05,
            effectiveness: 0.9
          }
        ],
        residualRisk: 0.12
      }
    })

    risks.push({
      id: 'fin-002',
      category: 'Financial',
      title: 'Cash Flow Risk',
      description: 'Potential cash flow disruptions during construction',
      probability: 0.35,
      impact: 0.5,
      severity: 'medium',
      riskScore: 0,
      phase: 'construction',
      triggers: ['Payment delays', 'Funding gaps', 'Contractor financial issues'],
      indicators: ['Late payments', 'Contractor complaints'],
      consequences: ['Work stoppages', 'Contractor liens', 'Schedule delays'],
      mitigation: {
        strategy: 'mitigate',
        actions: [
          {
            action: 'Establish line of credit for contingencies',
            responsibility: 'Owner',
            timeline: 'Before construction',
            cost: 10000,
            effectiveness: 0.85
          }
        ],
        residualRisk: 0.05
      }
    })
  }

  // Schedule Risks
  if (params.analysis.categories.includes('schedule')) {
    risks.push({
      id: 'sch-001',
      category: 'Schedule',
      title: 'Permitting Delays',
      description: 'Delays in obtaining required permits and approvals',
      probability: 0.6,
      impact: 0.7,
      severity: 'high',
      riskScore: 0,
      phase: 'permitting',
      triggers: ['Complex regulatory requirements', 'Incomplete applications', 'Agency backlogs'],
      indicators: ['Extended review periods', 'Multiple resubmissions required'],
      consequences: ['Project start delays', 'Increased soft costs', 'Market timing issues'],
      mitigation: {
        strategy: 'mitigate',
        actions: [
          {
            action: 'Engage permitting consultant early',
            responsibility: 'Project Manager',
            timeline: 'Design phase',
            cost: 12000,
            effectiveness: 0.75
          },
          {
            action: 'Pre-application meetings with authorities',
            responsibility: 'Architect',
            timeline: 'Before submission',
            cost: 3000,
            effectiveness: 0.7
          }
        ],
        residualRisk: 0.15
      }
    })

    if (!params.constraints.timeline.flexible) {
      risks.push({
        id: 'sch-002',
        category: 'Schedule',
        title: 'Inflexible Schedule Risk',
        description: 'Fixed deadlines with limited flexibility',
        probability: 0.5,
        impact: 0.8,
        severity: 'critical',
        riskScore: 0,
        phase: 'construction',
        triggers: ['Weather delays', 'Material shortages', 'Labor issues'],
        indicators: ['Critical path activities delayed', 'Float consumed'],
        consequences: ['Missed milestones', 'Liquidated damages', 'Stakeholder dissatisfaction'],
        mitigation: {
          strategy: 'mitigate',
          actions: [
            {
              action: 'Develop detailed recovery schedule options',
              responsibility: 'Project Scheduler',
              timeline: 'Ongoing',
              cost: 8000,
              effectiveness: 0.6
            },
            {
              action: 'Consider accelerated construction methods',
              responsibility: 'Construction Manager',
              timeline: 'If needed',
              cost: 50000,
              effectiveness: 0.75
            }
          ],
          residualRisk: 0.2
        }
      })
    }
  }

  // Safety Risks
  if (params.analysis.categories.includes('safety')) {
    risks.push({
      id: 'saf-001',
      category: 'Safety',
      title: 'Construction Safety Risk',
      description: 'Worker safety risks during construction',
      probability: 0.4,
      impact: 0.9,
      severity: 'high',
      riskScore: 0,
      phase: 'construction',
      triggers: ['Hazardous conditions', 'Inadequate safety protocols', 'Worker fatigue'],
      indicators: ['Near-miss incidents', 'Safety violations', 'OSHA citations'],
      consequences: ['Worker injuries', 'Project shutdown', 'Legal liability', 'Reputation damage'],
      mitigation: {
        strategy: 'mitigate',
        actions: [
          {
            action: 'Implement comprehensive safety program',
            responsibility: 'Safety Manager',
            timeline: 'Before construction',
            cost: 30000,
            effectiveness: 0.9
          },
          {
            action: 'Daily safety briefings and inspections',
            responsibility: 'Site Superintendent',
            timeline: 'Daily',
            cost: 15000,
            effectiveness: 0.85
          }
        ],
        residualRisk: 0.04
      }
    })
  }

  // Regulatory Risks
  if (params.analysis.categories.includes('regulatory')) {
    risks.push({
      id: 'reg-001',
      category: 'Regulatory',
      title: 'Code Compliance Risk',
      description: 'Changes in building codes or interpretation issues',
      probability: 0.3,
      impact: 0.6,
      severity: 'medium',
      riskScore: 0,
      phase: 'design',
      triggers: ['Code updates', 'Local amendments', 'Inspector interpretations'],
      indicators: ['Code questions arising', 'Alternative compliance needed'],
      consequences: ['Design changes', 'Cost increases', 'Schedule impacts'],
      mitigation: {
        strategy: 'mitigate',
        actions: [
          {
            action: 'Early code review with authority having jurisdiction',
            responsibility: 'Code Consultant',
            timeline: 'Design development',
            cost: 8000,
            effectiveness: 0.8
          }
        ],
        residualRisk: 0.06
      }
    })
  }

  // Environmental Risks
  if (params.analysis.categories.includes('environmental')) {
    risks.push({
      id: 'env-001',
      category: 'Environmental',
      title: 'Weather and Climate Risk',
      description: 'Adverse weather impacting construction',
      probability: 0.5,
      impact: 0.5,
      severity: 'medium',
      riskScore: 0,
      phase: 'construction',
      triggers: ['Seasonal weather patterns', 'Extreme weather events'],
      indicators: ['Weather forecasts', 'Historical climate data'],
      consequences: ['Work stoppages', 'Schedule delays', 'Damage to materials'],
      mitigation: {
        strategy: 'mitigate',
        actions: [
          {
            action: 'Schedule weather-sensitive work for optimal seasons',
            responsibility: 'Project Scheduler',
            timeline: 'Planning phase',
            cost: 0,
            effectiveness: 0.7
          },
          {
            action: 'Weather protection measures for materials',
            responsibility: 'Site Superintendent',
            timeline: 'Throughout construction',
            cost: 10000,
            effectiveness: 0.75
          }
        ],
        residualRisk: 0.125
      }
    })
  }

  // Calculate risk scores
  risks.forEach(risk => {
    risk.riskScore = risk.probability * risk.impact * 100
  })

  // Sort by risk score
  risks.sort((a, b) => b.riskScore - a.riskScore)

  // Calculate summary
  const criticalRisks = risks.filter(r => r.severity === 'critical').length
  const highRisks = risks.filter(r => r.severity === 'high').length
  const mediumRisks = risks.filter(r => r.severity === 'medium').length
  const lowRisks = risks.filter(r => r.severity === 'low').length

  const totalRiskScore = risks.reduce((sum, r) => sum + r.riskScore, 0)
  const averageRiskScore = totalRiskScore / risks.length

  let overallRiskLevel: 'critical' | 'high' | 'medium' | 'low'
  if (averageRiskScore >= 50 || criticalRisks > 0) overallRiskLevel = 'critical'
  else if (averageRiskScore >= 30 || highRisks > 2) overallRiskLevel = 'high'
  else if (averageRiskScore >= 15) overallRiskLevel = 'medium'
  else overallRiskLevel = 'low'

  // Generate heat map
  const heatMapGrid: Array<Array<any>> = []
  for (let i = 0; i < 5; i++) {
    heatMapGrid[i] = []
    for (let j = 0; j < 5; j++) {
      const probMin = i * 0.2
      const probMax = (i + 1) * 0.2
      const impactMin = j * 0.2
      const impactMax = (j + 1) * 0.2

      const cellRisks = risks.filter(r =>
        r.probability >= probMin && r.probability < probMax &&
        r.impact >= impactMin && r.impact < impactMax
      )

      heatMapGrid[i][j] = {
        probability: (probMin + probMax) / 2,
        impact: (impactMin + impactMax) / 2,
        risks: cellRisks.map(r => r.id),
        count: cellRisks.length
      }
    }
  }

  // Category analysis
  const categories = [...new Set(risks.map(r => r.category))]
  const categoryAnalysis = categories.map(cat => {
    const catRisks = risks.filter(r => r.category === cat)
    return {
      category: cat,
      riskCount: catRisks.length,
      averageScore: catRisks.reduce((sum, r) => sum + r.riskScore, 0) / catRisks.length,
      topRisks: catRisks.slice(0, 3).map(r => r.id),
      trend: 'stable' as const
    }
  })

  // Timeline analysis
  const phases = ['design', 'permitting', 'construction', 'closeout']
  const timeline = phases.map(phase => {
    const phaseRisks = risks.filter(r => r.phase === phase)
    return {
      phase,
      risks: phaseRisks.map(r => r.id),
      peakRiskScore: phaseRisks.length > 0 ? Math.max(...phaseRisks.map(r => r.riskScore)) : 0
    }
  })

  // Financial impact
  const potentialCost = risks.reduce((sum, r) => sum + r.probability * r.impact * params.projectInfo.budget * 0.1, 0)
  const mitigationCost = risks.reduce((sum, r) => sum + r.mitigation.actions.reduce((s, a) => s + a.cost, 0), 0)
  const expectedCost = risks.reduce((sum, r) => sum + r.mitigation.residualRisk * r.impact * params.projectInfo.budget * 0.1, 0)

  return {
    summary: {
      totalRisks: risks.length,
      criticalRisks,
      highRisks,
      mediumRisks,
      lowRisks,
      overallRiskScore: averageRiskScore,
      riskLevel: overallRiskLevel
    },
    risks,
    heatMap: {
      grid: heatMapGrid,
      zones: {
        critical: { min: 50, color: '#DC2626' },
        high: { min: 30, color: '#F59E0B' },
        medium: { min: 15, color: '#FBBF24' },
        low: { min: 0, color: '#10B981' }
      }
    },
    categoryAnalysis,
    timeline,
    financialImpact: {
      potentialCost,
      expectedCost,
      contingencyRecommended: Math.max(expectedCost * 1.5, params.projectInfo.budget * 0.15),
      mitigationCost
    },
    recommendations: {
      immediate: risks.filter(r => r.severity === 'critical').map(r => `Address ${r.title}: ${r.mitigation.actions[0]?.action}`),
      shortTerm: risks.filter(r => r.severity === 'high').map(r => r.mitigation.actions[0]?.action),
      longTerm: ['Establish continuous risk monitoring process', 'Conduct quarterly risk reviews'],
      monitoring: risks.slice(0, 5).map(r => ({
        risk: r.title,
        frequency: r.severity === 'critical' ? 'weekly' : 'monthly',
        metrics: r.indicators
      }))
    },
    aiInsights: {
      summary: `AI analysis identified ${risks.length} significant risks with overall ${overallRiskLevel} risk level. Recommended contingency: $${(Math.max(expectedCost * 1.5, params.projectInfo.budget * 0.15) / 1000000).toFixed(2)}M.`,
      keyFindings: [
        `${criticalRisks + highRisks} high-priority risks require immediate attention`,
        `${categoryAnalysis[0]?.category || 'Technical'} risks are most prevalent`,
        `Estimated risk exposure: $${(potentialCost / 1000000).toFixed(2)}M before mitigation`,
        `Mitigation investment of $${(mitigationCost / 1000000).toFixed(2)}M recommended`
      ],
      patterns: [
        params.projectInfo.complexity === 'high' || params.projectInfo.complexity === 'very-high' ? 'High complexity driving technical risks' : 'Complexity is manageable',
        !params.constraints.timeline.flexible ? 'Inflexible schedule increases risk' : 'Schedule flexibility reduces risk',
        params.constraints.budget.contingency < 0.15 ? 'Insufficient contingency for risk level' : 'Adequate contingency reserves'
      ],
      comparisons: [
        {
          aspect: 'Risk Level',
          benchmark: 'Similar projects',
          status: overallRiskLevel === 'high' || overallRiskLevel === 'critical' ? 'above' : 'at'
        },
        {
          aspect: 'Mitigation Investment',
          benchmark: 'Industry standard (3-5%)',
          status: (mitigationCost / params.projectInfo.budget) > 0.05 ? 'above' : 'below'
        }
      ]
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const params = await request.json() as RiskAssessmentParams

    // Validate required fields
    if (!params.projectId || !params.assessmentName) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, assessmentName' },
        { status: 400 }
      )
    }

    if (!params.projectInfo || !params.projectInfo.type || !params.projectInfo.budget) {
      return NextResponse.json(
        { error: 'Missing project information' },
        { status: 400 }
      )
    }

    if (!params.analysis || !params.analysis.categories || params.analysis.categories.length === 0) {
      return NextResponse.json(
        { error: 'At least one risk category must be specified' },
        { status: 400 }
      )
    }

    // Verify project access
    const { data: project } = await supabase
      .from('projects')
      .select('id, name')
      .eq('id', params.projectId)
      .single()

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      )
    }

    console.log(`Performing risk assessment for project: ${project.name}`)

    // Perform risk assessment
    const result = await performRiskAssessment(params)

    // Store assessment results
    const { data: assessmentRecord, error: dbError } = await supabase
      .from('risk_assessments')
      .insert({
        project_id: params.projectId,
        user_id: user.id,
        assessment_name: params.assessmentName,
        project_info: params.projectInfo,
        stakeholders: params.stakeholders,
        constraints: params.constraints,
        analysis_config: params.analysis,
        result,
        assessed_at: new Date().toISOString()
      })
      .select()
      .single()

    if (dbError) {
      console.error('Failed to store assessment results:', dbError)
      // Don't fail the request - assessment was successful
    }

    return NextResponse.json({
      success: true,
      data: {
        assessmentId: assessmentRecord?.id,
        result
      }
    })
  } catch (error) {
    console.error('Risk assessment API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const assessmentId = searchParams.get('assessmentId')
    const projectId = searchParams.get('projectId')

    // Get specific assessment
    if (assessmentId) {
      const { data: assessment, error } = await supabase
        .from('risk_assessments')
        .select('*')
        .eq('id', assessmentId)
        .eq('user_id', user.id)
        .single()

      if (error || !assessment) {
        return NextResponse.json(
          { error: 'Assessment not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        data: assessment
      })
    }

    // Get all assessments for a project
    if (projectId) {
      const { data: assessments, error } = await supabase
        .from('risk_assessments')
        .select('id, assessment_name, assessed_at, result')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .order('assessed_at', { ascending: false })

      if (error) {
        console.error('Failed to fetch assessments:', error)
        return NextResponse.json(
          { error: 'Failed to fetch assessments' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        data: assessments
      })
    }

    return NextResponse.json(
      { error: 'Missing required parameter: assessmentId OR projectId' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Risk assessment GET API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
