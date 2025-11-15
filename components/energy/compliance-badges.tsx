'use client'

/**
 * Compliance Badges Component
 *
 * Displays energy certifications and compliance status
 * including LEED, Energy Star, Passive House, and other standards
 */

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Award,
  Star,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
  Download,
  ExternalLink,
  Info,
  Target,
  Leaf,
  Zap,
  Home
} from 'lucide-react'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell
} from 'recharts'

interface CertificationRequirement {
  category: string
  requirement: string
  status: 'met' | 'not-met' | 'in-progress'
  currentValue?: number
  requiredValue?: number
  unit?: string
}

interface Certification {
  id: string
  name: string
  level: string
  status: 'certified' | 'eligible' | 'in-progress' | 'not-eligible'
  score: number
  maxScore: number
  achievedDate?: string
  expiryDate?: string
  certificationBody: string
  description: string
  benefits: string[]
  requirements: CertificationRequirement[]
  nextSteps?: string[]
  documentationUrl?: string
  applicationUrl?: string
}

interface ComplianceBadgesProps {
  buildingName?: string
  buildingType?: string
  certifications: Certification[]
  onApply?: (certificationId: string) => void
  onDownloadReport?: (certificationId: string) => void
  onExport?: () => void
}

export function ComplianceBadges({
  buildingName = 'Building',
  buildingType = 'Commercial Office',
  certifications,
  onApply,
  onDownloadReport,
  onExport
}: ComplianceBadgesProps) {
  const [selectedCert, setSelectedCert] = useState<string>(certifications[0]?.id || '')

  const currentCert = certifications.find(c => c.id === selectedCert)

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'certified':
        return 'bg-green-500'
      case 'eligible':
        return 'bg-blue-500'
      case 'in-progress':
        return 'bg-yellow-500'
      case 'not-eligible':
        return 'bg-gray-400'
      default:
        return 'bg-gray-400'
    }
  }

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'certified':
        return CheckCircle2
      case 'eligible':
        return TrendingUp
      case 'in-progress':
        return AlertCircle
      case 'not-eligible':
        return XCircle
      default:
        return AlertCircle
    }
  }

  // Get requirement status
  const getRequirementStatus = (status: string) => {
    switch (status) {
      case 'met':
        return { icon: CheckCircle2, color: 'text-green-500' }
      case 'not-met':
        return { icon: XCircle, color: 'text-red-500' }
      case 'in-progress':
        return { icon: AlertCircle, color: 'text-yellow-500' }
      default:
        return { icon: AlertCircle, color: 'text-gray-500' }
    }
  }

  // Calculate progress
  const calculateProgress = (cert: Certification) => {
    const metRequirements = cert.requirements.filter(r => r.status === 'met').length
    const totalRequirements = cert.requirements.length
    return (metRequirements / totalRequirements) * 100
  }

  // Certification comparison data
  const comparisonData = certifications.map(cert => ({
    name: cert.name,
    score: cert.score,
    maxScore: cert.maxScore,
    percentage: (cert.score / cert.maxScore) * 100
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Energy Certifications</h2>
          <p className="text-muted-foreground">{buildingName} - {buildingType}</p>
        </div>
        <Button variant="outline" onClick={onExport}>
          <Download className="h-4 w-4 mr-2" />
          Export All
        </Button>
      </div>

      {/* Certification Overview Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {certifications.map((cert) => {
          const StatusIcon = getStatusIcon(cert.status)
          const progress = calculateProgress(cert)

          return (
            <button
              key={cert.id}
              onClick={() => setSelectedCert(cert.id)}
              className={`p-4 border-2 rounded-lg text-left transition-all ${
                selectedCert === cert.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <Award className="h-6 w-6 text-muted-foreground" />
                <Badge className={getStatusColor(cert.status)}>
                  {cert.status}
                </Badge>
              </div>
              <h3 className="font-semibold mb-1">{cert.name}</h3>
              <p className="text-sm text-muted-foreground mb-3">{cert.level}</p>
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {progress.toFixed(0)}% requirements met
              </p>
            </button>
          )
        })}
      </div>

      {/* Detailed View */}
      {currentCert && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Certification Details */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle>{currentCert.name}</CardTitle>
                    <Badge className={getStatusColor(currentCert.status)}>
                      {currentCert.status}
                    </Badge>
                  </div>
                  <CardDescription>{currentCert.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Score Display */}
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Current Score</span>
                  <span className="text-2xl font-bold">
                    {currentCert.score} / {currentCert.maxScore}
                  </span>
                </div>
                <Progress value={(currentCert.score / currentCert.maxScore) * 100} className="h-3" />
                {currentCert.achievedDate && (
                  <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                    <span>Achieved: {currentCert.achievedDate}</span>
                    {currentCert.expiryDate && <span>Expires: {currentCert.expiryDate}</span>}
                  </div>
                )}
              </div>

              {/* Requirements */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Requirements Checklist
                </h4>
                <div className="space-y-3">
                  {currentCert.requirements.map((req, index) => {
                    const reqStatus = getRequirementStatus(req.status)
                    const ReqIcon = reqStatus.icon

                    return (
                      <div
                        key={index}
                        className={`p-3 border rounded-lg ${
                          req.status === 'met' ? 'bg-green-50 border-green-200' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <ReqIcon className={`h-5 w-5 mt-0.5 ${reqStatus.color}`} />
                          <div className="flex-1">
                            <div className="font-medium">{req.category}</div>
                            <div className="text-sm text-muted-foreground">{req.requirement}</div>
                            {req.currentValue !== undefined && req.requiredValue !== undefined && (
                              <div className="mt-2">
                                <div className="flex items-center justify-between text-xs mb-1">
                                  <span>
                                    Current: {req.currentValue} {req.unit}
                                  </span>
                                  <span>
                                    Required: {req.requiredValue} {req.unit}
                                  </span>
                                </div>
                                <Progress
                                  value={Math.min(
                                    (req.currentValue / req.requiredValue) * 100,
                                    100
                                  )}
                                  className="h-1"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Next Steps */}
              {currentCert.nextSteps && currentCert.nextSteps.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Next Steps to Achieve Certification
                  </h4>
                  <ol className="space-y-2">
                    {currentCert.nextSteps.map((step, index) => (
                      <li key={index} className="flex gap-2 text-sm">
                        <span className="font-medium text-muted-foreground">{index + 1}.</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                {currentCert.status === 'eligible' && (
                  <Button onClick={() => onApply?.(currentCert.id)}>
                    <Award className="h-4 w-4 mr-2" />
                    Apply for Certification
                  </Button>
                )}
                {currentCert.status === 'certified' && (
                  <Button onClick={() => onDownloadReport?.(currentCert.id)}>
                    <Download className="h-4 w-4 mr-2" />
                    Download Certificate
                  </Button>
                )}
                {currentCert.documentationUrl && (
                  <Button variant="outline" asChild>
                    <a href={currentCert.documentationUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Documentation
                    </a>
                  </Button>
                )}
                {currentCert.applicationUrl && (
                  <Button variant="outline" asChild>
                    <a href={currentCert.applicationUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Learn More
                    </a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Sidebar Info */}
          <div className="space-y-6">
            {/* Certification Body */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Certification Body</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium mb-2">{currentCert.certificationBody}</p>
                <p className="text-sm text-muted-foreground">
                  {currentCert.level}
                </p>
              </CardContent>
            </Card>

            {/* Benefits */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Benefits</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {currentCert.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Star className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Progress Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Progress Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Requirements Met</span>
                  <span className="font-bold">
                    {currentCert.requirements.filter(r => r.status === 'met').length} /{' '}
                    {currentCert.requirements.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">In Progress</span>
                  <span className="font-bold text-yellow-600">
                    {currentCert.requirements.filter(r => r.status === 'in-progress').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Not Met</span>
                  <span className="font-bold text-red-600">
                    {currentCert.requirements.filter(r => r.status === 'not-met').length}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Comparison Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Certification Comparison</CardTitle>
          <CardDescription>Performance across all certifications</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="score" fill="#8b5cf6" name="Current Score">
                {comparisonData.map((entry, index) => {
                  const cert = certifications[index]
                  let color = '#94a3b8' // gray
                  if (cert.status === 'certified') color = '#10b981' // green
                  else if (cert.status === 'eligible') color = '#3b82f6' // blue
                  else if (cert.status === 'in-progress') color = '#f59e0b' // yellow

                  return <Cell key={`cell-${index}`} fill={color} />
                })}
              </Bar>
              <Bar dataKey="maxScore" fill="#e2e8f0" name="Maximum Score" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Information Panel */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Info className="h-5 w-5" />
            About Energy Certifications
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-blue-900">
          <p>
            <strong>LEED (Leadership in Energy and Environmental Design):</strong> The most widely used
            green building rating system in the world, certifying sustainable buildings.
          </p>
          <p>
            <strong>ENERGY STAR:</strong> EPA program that certifies buildings performing in the top 25%
            of their category for energy efficiency.
          </p>
          <p>
            <strong>Passive House:</strong> Rigorous voluntary standard for energy efficiency resulting in
            ultra-low energy buildings requiring little heating or cooling.
          </p>
          <p>
            <strong>WELL Building Standard:</strong> Performance-based system for measuring, certifying,
            and monitoring features that impact human health and wellbeing.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
