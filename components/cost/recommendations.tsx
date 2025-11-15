'use client'

/**
 * Cost Recommendations Component
 *
 * AI-powered cost-saving recommendations with savings estimates
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'
import {
  Lightbulb,
  TrendingDown,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  AlertTriangle,
  DollarSign,
  Calendar,
  Package
} from 'lucide-react'

export interface Recommendation {
  id: string
  category: 'material' | 'labor' | 'schedule' | 'vendor' | 'design' | 'other'
  title: string
  description: string
  estimatedSavings: number
  savingsPercentage: number
  confidence: 'high' | 'medium' | 'low'
  impact: 'high' | 'medium' | 'low'
  implementation: 'easy' | 'moderate' | 'difficult'
  timeToImplement?: string
  risks?: string[]
  benefits?: string[]
  steps?: string[]
  status?: 'pending' | 'accepted' | 'rejected' | 'implemented'
}

interface RecommendationsProps {
  projectId: string
  currentCost?: number
  recommendations?: Recommendation[]
  onRecommendationUpdate?: (recommendation: Recommendation) => void
}

const CATEGORY_ICONS = {
  material: Package,
  labor: DollarSign,
  schedule: Calendar,
  vendor: Package,
  design: Lightbulb,
  other: Lightbulb
}

const CATEGORY_COLORS = {
  material: 'bg-blue-500',
  labor: 'bg-green-500',
  schedule: 'bg-purple-500',
  vendor: 'bg-orange-500',
  design: 'bg-pink-500',
  other: 'bg-gray-500'
}

export function Recommendations({
  projectId,
  currentCost = 0,
  recommendations: initialRecommendations = [],
  onRecommendationUpdate
}: RecommendationsProps) {
  const { toast } = useToast()
  const [recommendations, setRecommendations] = useState<Recommendation[]>(initialRecommendations)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'savings' | 'confidence' | 'impact'>('savings')

  /**
   * Generate AI recommendations
   */
  const generateRecommendations = async () => {
    setIsLoading(true)

    try {
      const response = await fetch('/api/cost/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate recommendations')
      }

      setRecommendations(data.recommendations)

      toast({
        title: 'Recommendations Generated',
        description: `Found ${data.recommendations.length} cost-saving opportunities`
      })
    } catch (error: any) {
      toast({
        title: 'Generation Failed',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Update recommendation status
   */
  const updateRecommendationStatus = (id: string, status: Recommendation['status']) => {
    const updated = recommendations.map(rec => {
      if (rec.id === id) {
        const updatedRec = { ...rec, status }
        onRecommendationUpdate?.(updatedRec)
        return updatedRec
      }
      return rec
    })

    setRecommendations(updated)

    const statusMessages = {
      accepted: 'Recommendation accepted',
      rejected: 'Recommendation rejected',
      implemented: 'Recommendation marked as implemented'
    }

    toast({
      title: 'Status Updated',
      description: statusMessages[status as keyof typeof statusMessages]
    })
  }

  /**
   * Calculate total potential savings
   */
  const calculateTotalSavings = (recs: Recommendation[] = recommendations): number => {
    return recs
      .filter(rec => rec.status !== 'rejected')
      .reduce((sum, rec) => sum + rec.estimatedSavings, 0)
  }

  /**
   * Filter and sort recommendations
   */
  const getFilteredRecommendations = (): Recommendation[] => {
    let filtered = recommendations

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(rec => rec.category === selectedCategory)
    }

    // Sort
    const sortFunctions = {
      savings: (a: Recommendation, b: Recommendation) => b.estimatedSavings - a.estimatedSavings,
      confidence: (a: Recommendation, b: Recommendation) => {
        const order = { high: 3, medium: 2, low: 1 }
        return order[b.confidence] - order[a.confidence]
      },
      impact: (a: Recommendation, b: Recommendation) => {
        const order = { high: 3, medium: 2, low: 1 }
        return order[b.impact] - order[a.impact]
      }
    }

    return filtered.sort(sortFunctions[sortBy])
  }

  /**
   * Get badge variant based on value
   */
  const getConfidenceBadge = (confidence: string) => {
    const variants = {
      high: 'default',
      medium: 'secondary',
      low: 'outline'
    }
    return variants[confidence as keyof typeof variants] || 'outline'
  }

  const filteredRecommendations = getFilteredRecommendations()
  const totalSavings = calculateTotalSavings()
  const acceptedSavings = calculateTotalSavings(
    recommendations.filter(r => r.status === 'accepted' || r.status === 'implemented')
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Cost Recommendations
              </CardTitle>
              <CardDescription>
                AI-powered suggestions to reduce project costs
              </CardDescription>
            </div>
            <Button
              onClick={generateRecommendations}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Generate Recommendations
                </>
              )}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingDown className="h-4 w-4" />
                Total Potential Savings
              </div>
              <div className="text-2xl font-bold">
                ${totalSavings.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              {currentCost > 0 && (
                <div className="text-sm text-muted-foreground">
                  {((totalSavings / currentCost) * 100).toFixed(1)}% of current cost
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4" />
                Accepted Savings
              </div>
              <div className="text-2xl font-bold text-green-600">
                ${acceptedSavings.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Lightbulb className="h-4 w-4" />
                Total Recommendations
              </div>
              <div className="text-2xl font-bold">
                {recommendations.length}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Acceptance Rate</div>
              <div className="text-2xl font-bold">
                {recommendations.length > 0
                  ? ((recommendations.filter(r => r.status === 'accepted' || r.status === 'implemented').length / recommendations.length) * 100).toFixed(0)
                  : 0}%
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('all')}
            >
              All ({recommendations.length})
            </Button>
            {['material', 'labor', 'schedule', 'vendor', 'design', 'other'].map(cat => {
              const count = recommendations.filter(r => r.category === cat).length
              return count > 0 ? (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)} ({count})
                </Button>
              ) : null
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations List */}
      <div className="space-y-4">
        {filteredRecommendations.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              {isLoading ? (
                <>
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p>Analyzing project for cost-saving opportunities...</p>
                </>
              ) : (
                <>
                  <Lightbulb className="h-8 w-8 mx-auto mb-4 opacity-50" />
                  <p>No recommendations available. Click &quot;Generate Recommendations&quot; to get started.</p>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredRecommendations.map((rec) => {
            const Icon = CATEGORY_ICONS[rec.category]
            const colorClass = CATEGORY_COLORS[rec.category]

            return (
              <Card key={rec.id} className={rec.status === 'implemented' ? 'opacity-60' : ''}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex gap-3">
                      <div className={`w-10 h-10 rounded-lg ${colorClass} flex items-center justify-center text-white flex-shrink-0`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-lg">{rec.title}</CardTitle>
                          <Badge variant={getConfidenceBadge(rec.confidence)}>
                            {rec.confidence} confidence
                          </Badge>
                          <Badge variant="outline">
                            {rec.impact} impact
                          </Badge>
                        </div>
                        <CardDescription>{rec.description}</CardDescription>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        -${rec.estimatedSavings.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {rec.savingsPercentage.toFixed(1)}% savings
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="details" className="w-full">
                    <TabsList>
                      <TabsTrigger value="details">Details</TabsTrigger>
                      {rec.steps && <TabsTrigger value="steps">Implementation</TabsTrigger>}
                      {rec.risks && <TabsTrigger value="risks">Risks & Benefits</TabsTrigger>}
                    </TabsList>

                    <TabsContent value="details" className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Category:</span>{' '}
                          <span className="font-medium capitalize">{rec.category}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Implementation:</span>{' '}
                          <span className="font-medium capitalize">{rec.implementation}</span>
                        </div>
                        {rec.timeToImplement && (
                          <div>
                            <span className="text-muted-foreground">Time to Implement:</span>{' '}
                            <span className="font-medium">{rec.timeToImplement}</span>
                          </div>
                        )}
                        {rec.status && (
                          <div>
                            <span className="text-muted-foreground">Status:</span>{' '}
                            <Badge variant="outline" className="ml-2 capitalize">
                              {rec.status}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    {rec.steps && (
                      <TabsContent value="steps">
                        <div className="space-y-2">
                          {rec.steps.map((step, index) => (
                            <div key={index} className="flex gap-3">
                              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                                {index + 1}
                              </div>
                              <div className="flex-1 text-sm">{step}</div>
                            </div>
                          ))}
                        </div>
                      </TabsContent>
                    )}

                    {rec.risks && (
                      <TabsContent value="risks" className="space-y-4">
                        {rec.risks.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <AlertTriangle className="h-4 w-4 text-orange-500" />
                              <span className="font-medium">Risks</span>
                            </div>
                            <ul className="space-y-1 ml-6">
                              {rec.risks.map((risk, index) => (
                                <li key={index} className="text-sm text-muted-foreground list-disc">
                                  {risk}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {rec.benefits && rec.benefits.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                              <span className="font-medium">Benefits</span>
                            </div>
                            <ul className="space-y-1 ml-6">
                              {rec.benefits.map((benefit, index) => (
                                <li key={index} className="text-sm text-muted-foreground list-disc">
                                  {benefit}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </TabsContent>
                    )}
                  </Tabs>

                  <div className="flex gap-2 mt-4 pt-4 border-t">
                    {rec.status !== 'accepted' && rec.status !== 'implemented' && (
                      <Button
                        size="sm"
                        onClick={() => updateRecommendationStatus(rec.id, 'accepted')}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Accept
                      </Button>
                    )}
                    {rec.status === 'accepted' && (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => updateRecommendationStatus(rec.id, 'implemented')}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Mark as Implemented
                      </Button>
                    )}
                    {rec.status !== 'rejected' && rec.status !== 'implemented' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateRecommendationStatus(rec.id, 'rejected')}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
