'use client'

/**
 * Model Metrics Component
 *
 * Comprehensive model performance metrics including accuracy, precision,
 * recall, F1 score, confusion matrix, and detailed performance analysis
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
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts'
import {
  Target,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Download,
  RefreshCw,
  BarChart3,
  Activity,
  Zap
} from 'lucide-react'

interface PerformanceMetrics {
  accuracy: number
  precision: number
  recall: number
  f1Score: number
  roc_auc: number
  pr_auc: number
  mcc: number
  specificity: number
}

interface ConfusionMatrix {
  truePositive: number
  trueNegative: number
  falsePositive: number
  falseNegative: number
}

interface ClassMetrics {
  className: string
  precision: number
  recall: number
  f1Score: number
  support: number
}

interface PerformanceByClass {
  classes: ClassMetrics[]
}

interface MetricTrend {
  timestamp: string
  accuracy: number
  precision: number
  recall: number
  f1Score: number
}

interface ThresholdAnalysis {
  threshold: number
  precision: number
  recall: number
  f1Score: number
}

interface ModelInfo {
  id: string
  name: string
  version: string
  framework: string
  dataset: string
  lastEvaluated: string
}

interface ModelMetricsProps {
  modelInfo: ModelInfo
  metrics: PerformanceMetrics
  confusionMatrix: ConfusionMatrix
  classwiseMetrics: PerformanceByClass
  metricTrends: MetricTrend[]
  thresholdAnalysis: ThresholdAnalysis[]
  onRefresh?: () => void
  onExport?: () => void
}

export function ModelMetrics({
  modelInfo,
  metrics,
  confusionMatrix,
  classwiseMetrics,
  metricTrends,
  thresholdAnalysis,
  onRefresh,
  onExport
}: ModelMetricsProps) {
  const [selectedThreshold, setSelectedThreshold] = useState(0.5)

  // Format percentage
  const formatPercent = (value: number) => {
    return (value * 100).toFixed(2) + '%'
  }

  // Calculate total samples
  const totalSamples =
    confusionMatrix.truePositive +
    confusionMatrix.trueNegative +
    confusionMatrix.falsePositive +
    confusionMatrix.falseNegative

  // Prepare confusion matrix data for visualization
  const confusionData = [
    {
      name: 'TP',
      value: confusionMatrix.truePositive,
      label: 'True Positive',
      color: '#10b981'
    },
    {
      name: 'TN',
      value: confusionMatrix.trueNegative,
      label: 'True Negative',
      color: '#3b82f6'
    },
    {
      name: 'FP',
      value: confusionMatrix.falsePositive,
      label: 'False Positive',
      color: '#f59e0b'
    },
    {
      name: 'FN',
      value: confusionMatrix.falseNegative,
      label: 'False Negative',
      color: '#ef4444'
    }
  ]

  // Prepare radar chart data
  const radarData = [
    { metric: 'Accuracy', value: metrics.accuracy },
    { metric: 'Precision', value: metrics.precision },
    { metric: 'Recall', value: metrics.recall },
    { metric: 'F1 Score', value: metrics.f1Score },
    { metric: 'Specificity', value: metrics.specificity },
    { metric: 'MCC', value: (metrics.mcc + 1) / 2 } // Normalize MCC from [-1,1] to [0,1]
  ]

  // Get metric status
  const getMetricStatus = (value: number, threshold: number = 0.9) => {
    if (value >= threshold) {
      return { icon: CheckCircle, color: 'text-green-500', status: 'excellent' }
    } else if (value >= threshold - 0.1) {
      return { icon: AlertCircle, color: 'text-yellow-500', status: 'good' }
    }
    return { icon: AlertCircle, color: 'text-red-500', status: 'needs improvement' }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Model Performance Metrics</h2>
          <p className="text-muted-foreground">
            {modelInfo.name} v{modelInfo.version} • {modelInfo.framework}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Model Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Model Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Model ID</p>
              <code className="text-xs bg-muted px-2 py-1 rounded">{modelInfo.id}</code>
            </div>
            <div>
              <p className="text-muted-foreground">Dataset</p>
              <p className="font-medium">{modelInfo.dataset}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Last Evaluated</p>
              <p className="font-medium">{modelInfo.lastEvaluated}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Total Samples</p>
              <p className="font-medium">{totalSamples.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accuracy</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercent(metrics.accuracy)}</div>
            <Progress value={metrics.accuracy * 100} className="mt-2 h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {getMetricStatus(metrics.accuracy).status}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Precision</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercent(metrics.precision)}</div>
            <Progress value={metrics.precision * 100} className="mt-2 h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {getMetricStatus(metrics.precision).status}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recall</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercent(metrics.recall)}</div>
            <Progress value={metrics.recall * 100} className="mt-2 h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {getMetricStatus(metrics.recall).status}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">F1 Score</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercent(metrics.f1Score)}</div>
            <Progress value={metrics.f1Score * 100} className="mt-2 h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {getMetricStatus(metrics.f1Score).status}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="confusion">Confusion Matrix</TabsTrigger>
          <TabsTrigger value="classwise">Class-wise Metrics</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="threshold">Threshold Analysis</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Radar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Radar</CardTitle>
                <CardDescription>Overall metrics visualization</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" />
                    <PolarRadiusAxis domain={[0, 1]} />
                    <Radar
                      name="Metrics"
                      dataKey="value"
                      stroke="#8b5cf6"
                      fill="#8b5cf6"
                      fillOpacity={0.6}
                    />
                    <Tooltip formatter={(value: number) => formatPercent(value)} />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Additional Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Metrics</CardTitle>
                <CardDescription>Advanced performance indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">ROC AUC</span>
                      <span className="text-sm font-bold">{formatPercent(metrics.roc_auc)}</span>
                    </div>
                    <Progress value={metrics.roc_auc * 100} className="h-2" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">PR AUC</span>
                      <span className="text-sm font-bold">{formatPercent(metrics.pr_auc)}</span>
                    </div>
                    <Progress value={metrics.pr_auc * 100} className="h-2" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">Matthews Correlation (MCC)</span>
                      <span className="text-sm font-bold">{metrics.mcc.toFixed(3)}</span>
                    </div>
                    <Progress value={((metrics.mcc + 1) / 2) * 100} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">Range: -1 to +1</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">Specificity</span>
                      <span className="text-sm font-bold">{formatPercent(metrics.specificity)}</span>
                    </div>
                    <Progress value={metrics.specificity * 100} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Confusion Matrix Tab */}
        <TabsContent value="confusion" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Matrix Visualization */}
            <Card>
              <CardHeader>
                <CardTitle>Confusion Matrix</CardTitle>
                <CardDescription>Classification results breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 rounded-lg bg-green-50 border-2 border-green-500">
                    <div className="text-center">
                      <p className="text-sm font-medium text-green-700 mb-2">True Positive</p>
                      <p className="text-3xl font-bold text-green-900">
                        {confusionMatrix.truePositive.toLocaleString()}
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        {formatPercent(confusionMatrix.truePositive / totalSamples)}
                      </p>
                    </div>
                  </div>
                  <div className="p-6 rounded-lg bg-orange-50 border-2 border-orange-500">
                    <div className="text-center">
                      <p className="text-sm font-medium text-orange-700 mb-2">False Positive</p>
                      <p className="text-3xl font-bold text-orange-900">
                        {confusionMatrix.falsePositive.toLocaleString()}
                      </p>
                      <p className="text-xs text-orange-600 mt-1">
                        {formatPercent(confusionMatrix.falsePositive / totalSamples)}
                      </p>
                    </div>
                  </div>
                  <div className="p-6 rounded-lg bg-red-50 border-2 border-red-500">
                    <div className="text-center">
                      <p className="text-sm font-medium text-red-700 mb-2">False Negative</p>
                      <p className="text-3xl font-bold text-red-900">
                        {confusionMatrix.falseNegative.toLocaleString()}
                      </p>
                      <p className="text-xs text-red-600 mt-1">
                        {formatPercent(confusionMatrix.falseNegative / totalSamples)}
                      </p>
                    </div>
                  </div>
                  <div className="p-6 rounded-lg bg-blue-50 border-2 border-blue-500">
                    <div className="text-center">
                      <p className="text-sm font-medium text-blue-700 mb-2">True Negative</p>
                      <p className="text-3xl font-bold text-blue-900">
                        {confusionMatrix.trueNegative.toLocaleString()}
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        {formatPercent(confusionMatrix.trueNegative / totalSamples)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Distribution Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Prediction Distribution</CardTitle>
                <CardDescription>Visual breakdown of predictions</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={confusionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip
                      formatter={(value: number) => [
                        `${value.toLocaleString()} (${formatPercent(value / totalSamples)})`,
                        'Count'
                      ]}
                    />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {confusionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Class-wise Metrics Tab */}
        <TabsContent value="classwise" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Per-Class Performance</CardTitle>
              <CardDescription>Detailed metrics for each class</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Class</TableHead>
                      <TableHead>Precision</TableHead>
                      <TableHead>Recall</TableHead>
                      <TableHead>F1 Score</TableHead>
                      <TableHead>Support</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classwiseMetrics.classes.map((classMetric, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{classMetric.className}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>{formatPercent(classMetric.precision)}</span>
                            <Progress
                              value={classMetric.precision * 100}
                              className="h-2 w-16"
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>{formatPercent(classMetric.recall)}</span>
                            <Progress
                              value={classMetric.recall * 100}
                              className="h-2 w-16"
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>{formatPercent(classMetric.f1Score)}</span>
                            <Progress
                              value={classMetric.f1Score * 100}
                              className="h-2 w-16"
                            />
                          </div>
                        </TableCell>
                        <TableCell>{classMetric.support.toLocaleString()}</TableCell>
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
          <Card>
            <CardHeader>
              <CardTitle>Metric Trends Over Time</CardTitle>
              <CardDescription>Historical performance tracking</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={metricTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis domain={[0, 1]} />
                  <Tooltip formatter={(value: number) => formatPercent(value)} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="accuracy"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    name="Accuracy"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="precision"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Precision"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="recall"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    name="Recall"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="f1Score"
                    stroke="#ef4444"
                    strokeWidth={2}
                    name="F1 Score"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Threshold Analysis Tab */}
        <TabsContent value="threshold" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Decision Threshold Analysis</CardTitle>
              <CardDescription>
                Precision-Recall tradeoff across different thresholds
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={thresholdAnalysis}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="threshold" />
                  <YAxis domain={[0, 1]} />
                  <Tooltip formatter={(value: number) => formatPercent(value)} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="precision"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Precision"
                  />
                  <Line
                    type="monotone"
                    dataKey="recall"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    name="Recall"
                  />
                  <Line
                    type="monotone"
                    dataKey="f1Score"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    name="F1 Score"
                  />
                </LineChart>
              </ResponsiveContainer>
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Current threshold: <strong>{selectedThreshold}</strong>
                </p>
                <p className="text-xs mt-2">
                  Adjust the decision threshold to balance precision and recall based on your use case.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
