'use client'

/**
 * A/B Test Results Component
 *
 * A/B testing results for model variants with metrics comparison,
 * statistical significance, and performance analysis
 */

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3,
  Users,
  Target,
  Clock,
  Award,
  Activity
} from 'lucide-react'

interface ModelVariant {
  id: string
  name: string
  version: string
  trafficPercentage: number
}

interface VariantMetrics {
  variantId: string
  accuracy: number
  precision: number
  recall: number
  f1Score: number
  latencyP50: number
  latencyP95: number
  latencyP99: number
  throughput: number
  errorRate: number
  conversionRate: number
  userSatisfaction: number
  totalRequests: number
}

interface ComparisonResult {
  metric: string
  variantA: number
  variantB: number
  difference: number
  percentChange: number
  winner: 'A' | 'B' | 'tie'
  significance: number
  isSignificant: boolean
}

interface TimeSeriesData {
  timestamp: string
  variantA: number
  variantB: number
}

interface ABTestConfig {
  testId: string
  name: string
  status: 'running' | 'completed' | 'paused'
  startDate: string
  endDate?: string
  duration: string
  totalSamples: number
  minimumSampleSize: number
  confidenceLevel: number
}

interface ABTestResultsProps {
  testConfig: ABTestConfig
  variantA: ModelVariant
  variantB: ModelVariant
  metricsA: VariantMetrics
  metricsB: VariantMetrics
  comparisons: ComparisonResult[]
  accuracyTimeSeries: TimeSeriesData[]
  latencyTimeSeries: TimeSeriesData[]
  onSelectWinner?: (variantId: string) => void
  onPauseTest?: () => void
  onResumeTest?: () => void
  onStopTest?: () => void
}

export function ABTestResults({
  testConfig,
  variantA,
  variantB,
  metricsA,
  metricsB,
  comparisons,
  accuracyTimeSeries,
  latencyTimeSeries,
  onSelectWinner,
  onPauseTest,
  onResumeTest,
  onStopTest
}: ABTestResultsProps) {
  const [selectedMetric, setSelectedMetric] = useState('accuracy')

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-green-500'
      case 'completed':
        return 'bg-blue-500'
      case 'paused':
        return 'bg-yellow-500'
      default:
        return 'bg-gray-500'
    }
  }

  // Get comparison icon
  const getComparisonIcon = (winner: 'A' | 'B' | 'tie') => {
    if (winner === 'tie') return <Minus className="h-4 w-4" />
    return <TrendingUp className="h-4 w-4" />
  }

  // Format percentage
  const formatPercent = (value: number) => {
    return (value * 100).toFixed(2) + '%'
  }

  // Format number with commas
  const formatNumber = (value: number) => {
    return value.toLocaleString()
  }

  // Calculate overall winner
  const calculateOverallWinner = () => {
    const aWins = comparisons.filter(c => c.winner === 'A' && c.isSignificant).length
    const bWins = comparisons.filter(c => c.winner === 'B' && c.isSignificant).length

    if (aWins > bWins) return 'A'
    if (bWins > aWins) return 'B'
    return 'tie'
  }

  const overallWinner = calculateOverallWinner()

  // Traffic distribution data
  const trafficData = [
    { name: variantA.name, value: variantA.trafficPercentage, color: '#8b5cf6' },
    { name: variantB.name, value: variantB.trafficPercentage, color: '#10b981' }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">A/B Test Results</h2>
          <p className="text-muted-foreground">{testConfig.name}</p>
        </div>
        <div className="flex gap-2">
          {testConfig.status === 'running' && (
            <>
              <Button variant="outline" size="sm" onClick={onPauseTest}>
                Pause Test
              </Button>
              <Button variant="destructive" size="sm" onClick={onStopTest}>
                Stop Test
              </Button>
            </>
          )}
          {testConfig.status === 'paused' && (
            <Button variant="default" size="sm" onClick={onResumeTest}>
              Resume Test
            </Button>
          )}
          {testConfig.status === 'completed' && overallWinner !== 'tie' && (
            <Button
              variant="default"
              size="sm"
              onClick={() => onSelectWinner?.(overallWinner === 'A' ? variantA.id : variantB.id)}
            >
              <Award className="h-4 w-4 mr-2" />
              Deploy Winner
            </Button>
          )}
        </div>
      </div>

      {/* Test Status Card */}
      <Card className="border-l-4 border-l-primary">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle>Test Status</CardTitle>
              <Badge className={getStatusColor(testConfig.status)}>
                {testConfig.status}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              Test ID: <code className="bg-muted px-2 py-1 rounded">{testConfig.testId}</code>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Duration</p>
              <p className="text-xl font-bold flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {testConfig.duration}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Samples</p>
              <p className="text-xl font-bold flex items-center gap-1">
                <Users className="h-4 w-4" />
                {formatNumber(testConfig.totalSamples)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Confidence Level</p>
              <p className="text-xl font-bold flex items-center gap-1">
                <Target className="h-4 w-4" />
                {testConfig.confidenceLevel}%
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Overall Winner</p>
              <p className="text-xl font-bold">
                {overallWinner === 'tie' ? 'No Clear Winner' : `Variant ${overallWinner}`}
              </p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Sample Collection Progress</span>
              <span className="text-sm text-muted-foreground">
                {formatNumber(testConfig.totalSamples)} / {formatNumber(testConfig.minimumSampleSize)}
              </span>
            </div>
            <Progress
              value={(testConfig.totalSamples / testConfig.minimumSampleSize) * 100}
              className="h-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Variant Comparison Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Variant A */}
        <Card className={overallWinner === 'A' ? 'border-2 border-green-500' : ''}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  Variant A
                  {overallWinner === 'A' && <Award className="h-5 w-5 text-green-500" />}
                </CardTitle>
                <CardDescription>
                  {variantA.name} v{variantA.version}
                </CardDescription>
              </div>
              <Badge variant="outline">{variantA.trafficPercentage}% traffic</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Accuracy</p>
                <p className="text-lg font-bold">{formatPercent(metricsA.accuracy)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">F1 Score</p>
                <p className="text-lg font-bold">{formatPercent(metricsA.f1Score)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Latency (P95)</p>
                <p className="text-lg font-bold">{metricsA.latencyP95}ms</p>
              </div>
              <div>
                <p className="text-muted-foreground">Error Rate</p>
                <p className="text-lg font-bold">{formatPercent(metricsA.errorRate)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Conversion</p>
                <p className="text-lg font-bold">{formatPercent(metricsA.conversionRate)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Requests</p>
                <p className="text-lg font-bold">{formatNumber(metricsA.totalRequests)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Variant B */}
        <Card className={overallWinner === 'B' ? 'border-2 border-green-500' : ''}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  Variant B
                  {overallWinner === 'B' && <Award className="h-5 w-5 text-green-500" />}
                </CardTitle>
                <CardDescription>
                  {variantB.name} v{variantB.version}
                </CardDescription>
              </div>
              <Badge variant="outline">{variantB.trafficPercentage}% traffic</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Accuracy</p>
                <p className="text-lg font-bold">{formatPercent(metricsB.accuracy)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">F1 Score</p>
                <p className="text-lg font-bold">{formatPercent(metricsB.f1Score)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Latency (P95)</p>
                <p className="text-lg font-bold">{metricsB.latencyP95}ms</p>
              </div>
              <div>
                <p className="text-muted-foreground">Error Rate</p>
                <p className="text-lg font-bold">{formatPercent(metricsB.errorRate)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Conversion</p>
                <p className="text-lg font-bold">{formatPercent(metricsB.conversionRate)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Requests</p>
                <p className="text-lg font-bold">{formatNumber(metricsB.totalRequests)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="comparison" className="space-y-4">
        <TabsList>
          <TabsTrigger value="comparison">Metric Comparison</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="traffic">Traffic Distribution</TabsTrigger>
        </TabsList>

        {/* Comparison Tab */}
        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Statistical Comparison</CardTitle>
              <CardDescription>
                Detailed metric-by-metric comparison with statistical significance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Metric</TableHead>
                      <TableHead>Variant A</TableHead>
                      <TableHead>Variant B</TableHead>
                      <TableHead>Difference</TableHead>
                      <TableHead>% Change</TableHead>
                      <TableHead>Winner</TableHead>
                      <TableHead>Significance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {comparisons.map((comparison, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{comparison.metric}</TableCell>
                        <TableCell>{comparison.variantA.toFixed(4)}</TableCell>
                        <TableCell>{comparison.variantB.toFixed(4)}</TableCell>
                        <TableCell>
                          <span className={
                            comparison.difference > 0 ? 'text-green-600' :
                            comparison.difference < 0 ? 'text-red-600' : ''
                          }>
                            {comparison.difference > 0 ? '+' : ''}
                            {comparison.difference.toFixed(4)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {comparison.percentChange > 0 ? (
                              <TrendingUp className="h-4 w-4 text-green-600" />
                            ) : comparison.percentChange < 0 ? (
                              <TrendingDown className="h-4 w-4 text-red-600" />
                            ) : (
                              <Minus className="h-4 w-4 text-gray-400" />
                            )}
                            <span className={
                              comparison.percentChange > 0 ? 'text-green-600' :
                              comparison.percentChange < 0 ? 'text-red-600' : ''
                            }>
                              {Math.abs(comparison.percentChange).toFixed(2)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              comparison.winner === 'A' ? 'bg-purple-500' :
                              comparison.winner === 'B' ? 'bg-green-500' :
                              'bg-gray-500'
                            }
                          >
                            {comparison.winner === 'tie' ? 'Tie' : `Variant ${comparison.winner}`}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {comparison.isSignificant ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-gray-400" />
                            )}
                            <span className="text-sm">
                              p={comparison.significance.toFixed(3)}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Accuracy Over Time */}
            <Card>
              <CardHeader>
                <CardTitle>Accuracy Over Time</CardTitle>
                <CardDescription>Comparison of accuracy trends</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={accuracyTimeSeries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis domain={[0, 1]} />
                    <Tooltip formatter={(value: number) => formatPercent(value)} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="variantA"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      name="Variant A"
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="variantB"
                      stroke="#10b981"
                      strokeWidth={2}
                      name="Variant B"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Latency Over Time */}
            <Card>
              <CardHeader>
                <CardTitle>Latency Over Time</CardTitle>
                <CardDescription>P95 latency comparison</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={latencyTimeSeries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `${value}ms`} />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="variantA"
                      stroke="#8b5cf6"
                      fill="#8b5cf6"
                      fillOpacity={0.3}
                      name="Variant A"
                    />
                    <Area
                      type="monotone"
                      dataKey="variantB"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.3}
                      name="Variant B"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Traffic Distribution Tab */}
        <TabsContent value="traffic" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Traffic Split</CardTitle>
                <CardDescription>Current traffic distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={trafficData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {trafficData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Request Distribution</CardTitle>
                <CardDescription>Total requests per variant</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={[
                      { name: 'Variant A', requests: metricsA.totalRequests },
                      { name: 'Variant B', requests: metricsB.totalRequests }
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => formatNumber(value)} />
                    <Bar dataKey="requests" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
