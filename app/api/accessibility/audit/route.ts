/**
 * Accessibility Audit API Endpoint
 *
 * Run accessibility audits and return WCAG compliance reports
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface AccessibilityAuditRequest {
  url?: string
  html?: string
  projectId?: string
  standards: ('WCAG2.0' | 'WCAG2.1' | 'WCAG2.2')[]
  levels: ('A' | 'AA' | 'AAA')[]
  includeWarnings?: boolean
  includeNotices?: boolean
}

interface AccessibilityIssue {
  code: string
  type: 'error' | 'warning' | 'notice'
  message: string
  context: string
  selector: string
  wcagLevel: 'A' | 'AA' | 'AAA'
  wcagCriteria: string[]
  recommendation: string
}

interface AccessibilityAuditResponse {
  success: boolean
  auditId: string
  summary: {
    totalIssues: number
    errors: number
    warnings: number
    notices: number
    complianceScore: number
    wcagLevel: 'A' | 'AA' | 'AAA' | 'Non-compliant'
  }
  issues: AccessibilityIssue[]
  url?: string
  timestamp: string
}

/**
 * Calculate WCAG compliance level
 */
function calculateComplianceLevel(
  errors: number,
  errorsByLevel: { A: number; AA: number; AAA: number }
): 'A' | 'AA' | 'AAA' | 'Non-compliant' {
  if (errors === 0) {
    return 'AAA'
  }
  if (errorsByLevel.A === 0 && errorsByLevel.AA === 0) {
    return 'AA'
  }
  if (errorsByLevel.A === 0) {
    return 'A'
  }
  return 'Non-compliant'
}

/**
 * Calculate compliance score (0-100)
 */
function calculateComplianceScore(
  totalChecks: number,
  errors: number,
  warnings: number
): number {
  const errorWeight = 1.0
  const warningWeight = 0.3

  const deductions = (errors * errorWeight) + (warnings * warningWeight)
  const score = Math.max(0, 100 - (deductions / totalChecks * 100))

  return Math.round(score * 10) / 10
}

/**
 * Run accessibility audit
 */
async function runAccessibilityAudit(
  auditRequest: AccessibilityAuditRequest
): Promise<AccessibilityIssue[]> {
  // Simulate accessibility audit
  // In production, this would use tools like axe-core, pa11y, or lighthouse

  const mockIssues: AccessibilityIssue[] = [
    {
      code: 'WCAG2AA.Principle1.Guideline1_1.1_1_1.H37',
      type: 'error',
      message: 'Img element missing an alt attribute',
      context: '<img src="logo.png">',
      selector: 'img:nth-child(1)',
      wcagLevel: 'A',
      wcagCriteria: ['1.1.1'],
      recommendation: 'Add an alt attribute to the img element describing the image content.'
    },
    {
      code: 'WCAG2AA.Principle1.Guideline1_3.1_3_1.H49.I',
      type: 'warning',
      message: 'Semantic markup should be used for emphasis',
      context: '<b>Important text</b>',
      selector: 'b:nth-child(2)',
      wcagLevel: 'A',
      wcagCriteria: ['1.3.1'],
      recommendation: 'Use <strong> for important text instead of <b>.'
    },
    {
      code: 'WCAG2AA.Principle1.Guideline1_4.1_4_3.G18',
      type: 'error',
      message: 'Insufficient contrast ratio',
      context: 'Text color #777 on background #FFF',
      selector: '.text-muted',
      wcagLevel: 'AA',
      wcagCriteria: ['1.4.3'],
      recommendation: 'Ensure text has a contrast ratio of at least 4.5:1.'
    },
    {
      code: 'WCAG2AA.Principle2.Guideline2_4.2_4_1.H64.1',
      type: 'error',
      message: 'Iframe element requires a non-empty title attribute',
      context: '<iframe src="video.html"></iframe>',
      selector: 'iframe',
      wcagLevel: 'A',
      wcagCriteria: ['2.4.1'],
      recommendation: 'Add a title attribute that describes the iframe content.'
    },
    {
      code: 'WCAG2AA.Principle3.Guideline3_1.3_1_1.H57.2',
      type: 'error',
      message: 'The html element should have a lang attribute',
      context: '<html>',
      selector: 'html',
      wcagLevel: 'A',
      wcagCriteria: ['3.1.1'],
      recommendation: 'Add a lang attribute to the html element (e.g., lang="en").'
    }
  ]

  // Filter based on request options
  return mockIssues.filter(issue => {
    if (issue.type === 'warning' && !auditRequest.includeWarnings) {
      return false
    }
    if (issue.type === 'notice' && !auditRequest.includeNotices) {
      return false
    }
    return true
  })
}

/**
 * POST - Run accessibility audit
 */
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
    const auditRequest = await request.json() as AccessibilityAuditRequest

    // Validate request
    if (!auditRequest.url && !auditRequest.html) {
      return NextResponse.json(
        { error: 'Either url or html must be provided' },
        { status: 400 }
      )
    }

    if (!auditRequest.standards || auditRequest.standards.length === 0) {
      return NextResponse.json(
        { error: 'At least one WCAG standard must be specified' },
        { status: 400 }
      )
    }

    if (!auditRequest.levels || auditRequest.levels.length === 0) {
      return NextResponse.json(
        { error: 'At least one WCAG level must be specified' },
        { status: 400 }
      )
    }

    // Get user's organization
    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json(
        { error: 'User not associated with any organization' },
        { status: 403 }
      )
    }

    const orgId = membership.organization_id

    // If projectId is provided, verify access
    if (auditRequest.projectId) {
      const { data: project } = await supabase
        .from('projects')
        .select('id')
        .eq('id', auditRequest.projectId)
        .eq('org_id', orgId)
        .single()

      if (!project) {
        return NextResponse.json(
          { error: 'Project not found or access denied' },
          { status: 404 }
        )
      }
    }

    // Run accessibility audit
    const issues = await runAccessibilityAudit(auditRequest)

    // Calculate statistics
    const errors = issues.filter(i => i.type === 'error').length
    const warnings = issues.filter(i => i.type === 'warning').length
    const notices = issues.filter(i => i.type === 'notice').length

    const errorsByLevel = {
      A: issues.filter(i => i.type === 'error' && i.wcagLevel === 'A').length,
      AA: issues.filter(i => i.type === 'error' && i.wcagLevel === 'AA').length,
      AAA: issues.filter(i => i.type === 'error' && i.wcagLevel === 'AAA').length
    }

    const wcagLevel = calculateComplianceLevel(errors, errorsByLevel)
    const totalChecks = 50 // Simulated total number of checks
    const complianceScore = calculateComplianceScore(totalChecks, errors, warnings)

    // Create audit record
    const { data: audit, error: auditError } = await supabase
      .from('accessibility_audits')
      .insert({
        org_id: orgId,
        user_id: user.id,
        project_id: auditRequest.projectId,
        url: auditRequest.url,
        standards: auditRequest.standards,
        levels: auditRequest.levels,
        total_issues: issues.length,
        errors,
        warnings,
        notices,
        compliance_score: complianceScore,
        wcag_level: wcagLevel,
        issues: issues,
        metadata: {
          includeWarnings: auditRequest.includeWarnings,
          includeNotices: auditRequest.includeNotices
        }
      })
      .select()
      .single()

    if (auditError || !audit) {
      console.error('Failed to create audit record:', auditError)
      return NextResponse.json(
        { error: 'Failed to create audit record' },
        { status: 500 }
      )
    }

    // Create activity log
    await supabase
      .from('activity_logs')
      .insert({
        org_id: orgId,
        user_id: user.id,
        action: 'accessibility.audit',
        resource_type: 'accessibility_audit',
        resource_id: audit.id,
        metadata: {
          url: auditRequest.url,
          compliance_score: complianceScore,
          wcag_level: wcagLevel
        }
      })

    const response: AccessibilityAuditResponse = {
      success: true,
      auditId: audit.id,
      summary: {
        totalIssues: issues.length,
        errors,
        warnings,
        notices,
        complianceScore,
        wcagLevel
      },
      issues,
      url: auditRequest.url,
      timestamp: audit.created_at
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Accessibility audit API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET - Get audit results
 */
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
    const auditId = searchParams.get('auditId')

    if (!auditId) {
      return NextResponse.json(
        { error: 'Missing auditId parameter' },
        { status: 400 }
      )
    }

    // Get audit
    const { data: audit, error } = await supabase
      .from('accessibility_audits')
      .select('*')
      .eq('id', auditId)
      .eq('user_id', user.id)
      .single()

    if (error || !audit) {
      return NextResponse.json(
        { error: 'Audit not found' },
        { status: 404 }
      )
    }

    const response: AccessibilityAuditResponse = {
      success: true,
      auditId: audit.id,
      summary: {
        totalIssues: audit.total_issues,
        errors: audit.errors,
        warnings: audit.warnings,
        notices: audit.notices,
        complianceScore: audit.compliance_score,
        wcagLevel: audit.wcag_level
      },
      issues: audit.issues,
      url: audit.url,
      timestamp: audit.created_at
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Accessibility audit GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
