'use client'

/**
 * Accessibility Audit Report
 *
 * Comprehensive WCAG compliance audit with automated testing,
 * issue tracking, and remediation guidance
 */

import { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/components/ui/use-toast'
import {
  Eye,
  EyeOff,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Info,
  TrendingUp,
  TrendingDown,
  Download,
  Play,
  RefreshCw,
  Code,
  Lightbulb,
  Target,
  Shield,
  Zap
} from 'lucide-react'

export interface AuditIssue {
  id: string
  severity: 'critical' | 'serious' | 'moderate' | 'minor'
  wcagLevel: 'A' | 'AA' | 'AAA'
  wcagCriterion: string
  title: string
  description: string
  impact: string
  element: string
  selector: string
  snippet: string
  recommendation: string
  helpUrl: string
  occurrences: number
  status: 'open' | 'in-progress' | 'resolved' | 'ignored'
}

export interface AuditResult {
  url: string
  timestamp: Date
  score: number
  passedTests: number
  failedTests: number
  warnings: number
  issues: AuditIssue[]
  wcagCompliance: {
    A: number
    AA: number
    AAA: number
  }
}

interface AuditReportProps {
  projectId?: string
  auditResults?: AuditResult
  onRunAudit?: () => Promise<AuditResult>
  onFixIssue?: (issueId: string) => void
  onIgnoreIssue?: (issueId: string) => void
  onExportReport?: () => void
}

const defaultResult: AuditResult = {
  url: 'https://example.com',
  timestamp: new Date(),
  score: 78,
  passedTests: 45,
  failedTests: 12,
  warnings: 8,
  wcagCompliance: {
    A: 95,
    AA: 78,
    AAA: 45
  },
  issues: [
    {
      id: 'issue-1',
      severity: 'critical',
      wcagLevel: 'A',
      wcagCriterion: '1.1.1 Non-text Content',
      title: 'Images missing alt text',
      description: '15 images are missing alternative text',
      impact: 'Screen readers cannot describe images to blind users',
      element: 'img',
      selector: '.hero-image',
      snippet: '<img src="banner.jpg" class="hero-image">',
      recommendation: 'Add descriptive alt text to all images',
      helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html',
      occurrences: 15,
      status: 'open'
    },
    {
      id: 'issue-2',
      severity: 'serious',
      wcagLevel: 'AA',
      wcagCriterion: '1.4.3 Contrast (Minimum)',
      title: 'Insufficient color contrast',
      description: 'Text has insufficient contrast ratio (2.8:1, should be 4.5:1)',
      impact: 'Users with low vision may have difficulty reading text',
      element: 'p',
      selector: '.text-gray-400',
      snippet: '<p class="text-gray-400">Low contrast text</p>',
      recommendation: 'Increase contrast to at least 4.5:1 for normal text',
      helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html',
      occurrences: 8,
      status: 'open'
    },
    {
      id: 'issue-3',
      severity: 'moderate',
      wcagLevel: 'A',
      wcagCriterion: '2.1.1 Keyboard',
      title: 'Interactive elements not keyboard accessible',
      description: 'Custom dropdown not accessible via keyboard',
      impact: 'Keyboard-only users cannot interact with this element',
      element: 'div',
      selector: '.custom-dropdown',
      snippet: '<div class="custom-dropdown" onclick="toggle()">',
      recommendation: 'Make interactive elements keyboard accessible with proper focus management',
      helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/keyboard.html',
      occurrences: 3,
      status: 'in-progress'
    },
    {
      id: 'issue-4',
      severity: 'serious',
      wcagLevel: 'A',
      wcagCriterion: '4.1.2 Name, Role, Value',
      title: 'Form inputs missing labels',
      description: 'Input fields do not have associated labels',
      impact: 'Screen reader users cannot identify the purpose of form fields',
      element: 'input',
      selector: '#email-input',
      snippet: '<input type="email" id="email-input" placeholder="Email">',
      recommendation: 'Add <label> elements or aria-label attributes to all inputs',
      helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html',
      occurrences: 6,
      status: 'open'
    }
  ]
}

export function AuditReport({
  projectId,
  auditResults = defaultResult,
  onRunAudit,
  onFixIssue,
  onIgnoreIssue,
  onExportReport
}: AuditReportProps) {
  const { toast } = useToast()
  const [isRunning, setIsRunning] = useState(false)
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all')
  const [selectedLevel, setSelectedLevel] = useState<string>('all')
  const [selectedIssue, setSelectedIssue] = useState<AuditIssue | null>(null)

  // Filter issues
  const filteredIssues = auditResults.issues.filter(issue => {
    if (selectedSeverity !== 'all' && issue.severity !== selectedSeverity) return false
    if (selectedLevel !== 'all' && issue.wcagLevel !== selectedLevel) return false
    return true
  })

  // Calculate metrics
  const criticalIssues = auditResults.issues.filter(i => i.severity === 'critical').length
  const seriousIssues = auditResults.issues.filter(i => i.severity === 'serious').length
  const totalOccurrences = auditResults.issues.reduce((sum, i) => sum + i.occurrences, 0)
  const resolvedIssues = auditResults.issues.filter(i => i.status === 'resolved').length

  /**
   * Get severity color
   */
  const getSeverityColor = (severity: AuditIssue['severity']) => {
    switch (severity) {
      case 'critical':
        return 'text-red-500 bg-red-500/10 border-red-500'
      case 'serious':
        return 'text-orange-500 bg-orange-500/10 border-orange-500'
      case 'moderate':
        return 'text-yellow-500 bg-yellow-500/10 border-yellow-500'
      case 'minor':
        return 'text-blue-500 bg-blue-500/10 border-blue-500'
    }
  }

  /**
   * Get severity icon
   */
  const getSeverityIcon = (severity: AuditIssue['severity']) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="h-4 w-4" />
      case 'serious':
        return <AlertTriangle className="h-4 w-4" />
      case 'moderate':
        return <Info className="h-4 w-4" />
      case 'minor':
        return <Info className="h-4 w-4" />
    }
  }

  /**
   * Run audit
   */
  const handleRunAudit = async () => {
    setIsRunning(true)

    try {
      if (onRunAudit) {
        await onRunAudit()
      } else {
        // Simulate audit
        await new Promise(resolve => setTimeout(resolve, 3000))
      }

      toast({
        title: 'Audit Complete',
        description: `Found ${auditResults.failedTests} issues`
      })
    } catch (error) {
      toast({
        title: 'Audit Failed',
        description: 'Failed to run accessibility audit',
        variant: 'destructive'
      })
    } finally {
      setIsRunning(false)
    }
  }

  /**
   * Handle fix issue
   */
  const handleFixIssue = (issue: AuditIssue) => {
    onFixIssue?.(issue.id)
    toast({
      title: 'Issue Marked for Fix',
      description: `Working on: ${issue.title}`
    })
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{auditResults.score}/100</div>
            <Progress value={auditResults.score} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{criticalIssues}</div>
            <p className="text-xs text-muted-foreground">
              Immediate attention required
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Serious Issues</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{seriousIssues}</div>
            <p className="text-xs text-muted-foreground">
              Should be fixed soon
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tests Passed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {auditResults.passedTests}
            </div>
            <p className="text-xs text-muted-foreground">
              Out of {auditResults.passedTests + auditResults.failedTests}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">WCAG AA</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{auditResults.wcagCompliance.AA}%</div>
            <Progress value={auditResults.wcagCompliance.AA} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Accessibility Audit</CardTitle>
              <CardDescription>
                Last run: {auditResults.timestamp.toLocaleString()}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleRunAudit}
                disabled={isRunning}
                variant="default"
              >
                {isRunning ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Run Audit
                  </>
                )}
              </Button>
              <Button onClick={onExportReport} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* WCAG Compliance */}
      <Card>
        <CardHeader>
          <CardTitle>WCAG Compliance Levels</CardTitle>
          <CardDescription>
            Web Content Accessibility Guidelines compliance status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Level A</span>
                <Badge variant="default">{auditResults.wcagCompliance.A}%</Badge>
              </div>
              <Progress value={auditResults.wcagCompliance.A} />
              <p className="text-xs text-muted-foreground">
                Essential support - minimum level
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Level AA</span>
                <Badge variant="secondary">{auditResults.wcagCompliance.AA}%</Badge>
              </div>
              <Progress value={auditResults.wcagCompliance.AA} />
              <p className="text-xs text-muted-foreground">
                Ideal support - recommended level
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Level AAA</span>
                <Badge variant="outline">{auditResults.wcagCompliance.AAA}%</Badge>
              </div>
              <Progress value={auditResults.wcagCompliance.AAA} />
              <p className="text-xs text-muted-foreground">
                Specialized support - maximum level
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Issues */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Accessibility Issues</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="serious">Serious</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="minor">Minor</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="WCAG Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="A">Level A</SelectItem>
                  <SelectItem value="AA">Level AA</SelectItem>
                  <SelectItem value="AAA">Level AAA</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredIssues.map(issue => (
              <Card
                key={issue.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedIssue?.id === issue.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedIssue(issue)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`p-2 rounded-lg ${getSeverityColor(issue.severity)}`}>
                        {getSeverityIcon(issue.severity)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-base">{issue.title}</CardTitle>
                          <Badge variant="outline" className="text-xs">
                            WCAG {issue.wcagLevel}
                          </Badge>
                        </div>
                        <CardDescription>{issue.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge
                        variant="outline"
                        className={getSeverityColor(issue.severity)}
                      >
                        {issue.severity}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {issue.occurrences} {issue.occurrences > 1 ? 'instances' : 'instance'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                {selectedIssue?.id === issue.id && (
                  <CardContent className="space-y-4 pt-0">
                    <Separator />

                    <div>
                      <h4 className="text-sm font-medium mb-2">WCAG Criterion</h4>
                      <p className="text-sm text-muted-foreground">{issue.wcagCriterion}</p>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-2">Impact</h4>
                      <p className="text-sm text-muted-foreground">{issue.impact}</p>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-2">Element</h4>
                      <div className="rounded-lg bg-muted p-3 font-mono text-xs">
                        <div className="text-muted-foreground mb-1">Selector: {issue.selector}</div>
                        <code>{issue.snippet}</code>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                        <Lightbulb className="h-4 w-4" />
                        Recommendation
                      </h4>
                      <p className="text-sm text-muted-foreground">{issue.recommendation}</p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(issue.helpUrl, '_blank')}
                      >
                        <Info className="h-4 w-4 mr-2" />
                        Learn More
                      </Button>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onIgnoreIssue?.(issue.id)}
                        >
                          <EyeOff className="h-4 w-4 mr-2" />
                          Ignore
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleFixIssue(issue)}
                          disabled={issue.status === 'resolved'}
                        >
                          {issue.status === 'resolved' ? (
                            <>
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Resolved
                            </>
                          ) : (
                            <>
                              <Zap className="h-4 w-4 mr-2" />
                              Fix Issue
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
