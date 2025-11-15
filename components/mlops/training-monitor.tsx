'use client'

/**
 * Training Monitor Component
 *
 * Real-time training metrics, loss curves, GPU utilization, and training progress monitoring
 * for ML model training workflows
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import {
  Activity,
  Cpu,
  HardDrive,
  Zap,
  Clock,
  TrendingDown,
  TrendingUp,
  PlayCircle,
  PauseCircle,
  StopCircle,
  RefreshCw,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react'

interface TrainingMetrics {
  epoch: number
  trainLoss: number
  valLoss: number
  trainAccuracy: number
  valAccuracy: number
  learningRate: number
  timestamp: string
}

interface GPUMetrics {
  gpuId: number
  utilization: number
  memoryUsed: number
  memoryTotal: number
  temperature: number
  powerUsage: number
}

interface TrainingRun {
  id: string
  modelName: string
  status: 'running' | 'completed' | 'failed' | 'paused'
  currentEpoch: number
  totalEpochs: number
  progress: number
  elapsedTime: string
  estimatedTimeRemaining: string
  startedAt: string
  bestValLoss: number
  currentLoss: number
}

interface SystemMetrics {
  cpuUsage: number
  ramUsage: number
  diskUsage: number
  networkThroughput: number
}

interface TrainingMonitorProps {
  trainingRun: TrainingRun
  metricsHistory: TrainingMetrics[]
  gpuMetrics: GPUMetrics[]
  systemMetrics: SystemMetrics
  onPause?: () => void
  onResume?: () => void
  onStop?: () => void
  onRefresh?: () => void
}

export function TrainingMonitor({
  trainingRun,
  metricsHistory,
  gpuMetrics,
  systemMetrics,
  onPause,
  onResume,
  onStop,
  onRefresh
}: TrainingMonitorProps) {
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Auto-refresh every 5 seconds when enabled
  useEffect(() => {
    if (autoRefresh && trainingRun.status === 'running') {
      const interval = setInterval(() => {
        onRefresh?.()
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, trainingRun.status, onRefresh])

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-green-500'
      case 'completed':
        return 'bg-blue-500'
      case 'failed':
        return 'bg-red-500'
      case 'paused':
        return 'bg-yellow-500'
      default:
        return 'bg-gray-500'
    }
  }

  // Format time
  const formatTime = (timeString: string) => {
    return timeString
  }

  // Calculate improvement
  const calculateImprovement = () => {
    if (metricsHistory.length < 2) return 0
    const current = metricsHistory[metricsHistory.length - 1].valLoss
    const previous = metricsHistory[metricsHistory.length - 2].valLoss
    return ((previous - current) / previous) * 100
  }

  const improvement = calculateImprovement()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Training Monitor</h2>
          <p className="text-muted-foreground">
            Real-time monitoring for {trainingRun.modelName}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </Button>
          {trainingRun.status === 'running' && (
            <>
              <Button variant="outline" size="sm" onClick={onPause}>
                <PauseCircle className="h-4 w-4 mr-2" />
                Pause
              </Button>
              <Button variant="destructive" size="sm" onClick={onStop}>
                <StopCircle className="h-4 w-4 mr-2" />
                Stop
              </Button>
            </>
          )}
          {trainingRun.status === 'paused' && (
            <Button variant="default" size="sm" onClick={onResume}>
              <PlayCircle className="h-4 w-4 mr-2" />
              Resume
            </Button>
          )}
        </div>
      </div>

      {/* Training Progress Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle>{trainingRun.modelName}</CardTitle>
              <Badge className={getStatusColor(trainingRun.status)}>
                {trainingRun.status}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              Run ID: <code className="text-xs bg-muted px-2 py-1 rounded">{trainingRun.id}</code>
            </div>
          </div>
          <CardDescription>
            Epoch {trainingRun.currentEpoch} of {trainingRun.totalEpochs}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Training Progress</span>
              <span className="text-sm text-muted-foreground">{trainingRun.progress}%</span>
            </div>
            <Progress value={trainingRun.progress} className="h-3" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Elapsed Time</p>
              <p className="text-lg font-semibold flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {formatTime(trainingRun.elapsedTime)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Time Remaining</p>
              <p className="text-lg font-semibold flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {formatTime(trainingRun.estimatedTimeRemaining)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Current Loss</p>
              <p className="text-lg font-semibold">{trainingRun.currentLoss.toFixed(4)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Best Val Loss</p>
              <p className="text-lg font-semibold flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                {trainingRun.bestValLoss.toFixed(4)}
              </p>
            </div>
          </div>

          {improvement !== 0 && (
            <div className={`flex items-center gap-2 p-3 rounded-lg ${
              improvement > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {improvement > 0 ? (
                <TrendingDown className="h-4 w-4" />
              ) : (
                <TrendingUp className="h-4 w-4" />
              )}
              <span className="text-sm font-medium">
                {improvement > 0 ? 'Improvement' : 'Degradation'}: {Math.abs(improvement).toFixed(2)}%
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="metrics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="metrics">Training Metrics</TabsTrigger>
          <TabsTrigger value="gpu">GPU Utilization</TabsTrigger>
          <TabsTrigger value="system">System Resources</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        {/* Training Metrics Tab */}
        <TabsContent value="metrics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Loss Curves */}
            <Card>
              <CardHeader>
                <CardTitle>Loss Curves</CardTitle>
                <CardDescription>Training vs validation loss over epochs</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={metricsHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="epoch" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="trainLoss"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      name="Train Loss"
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="valLoss"
                      stroke="#ef4444"
                      strokeWidth={2}
                      name="Val Loss"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Accuracy Curves */}
            <Card>
              <CardHeader>
                <CardTitle>Accuracy Curves</CardTitle>
                <CardDescription>Training vs validation accuracy</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={metricsHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="epoch" />
                    <YAxis domain={[0, 1]} />
                    <Tooltip formatter={(value: number) => (value * 100).toFixed(2) + '%'} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="trainAccuracy"
                      stroke="#10b981"
                      strokeWidth={2}
                      name="Train Accuracy"
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="valAccuracy"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      name="Val Accuracy"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Learning Rate */}
            <Card>
              <CardHeader>
                <CardTitle>Learning Rate Schedule</CardTitle>
                <CardDescription>Learning rate over training epochs</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={metricsHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="epoch" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="learningRate"
                      stroke="#6366f1"
                      fill="#6366f1"
                      fillOpacity={0.3}
                      name="Learning Rate"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Metrics Table */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Metrics</CardTitle>
                <CardDescription>Last 5 epochs</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2 text-sm">
                    {metricsHistory.slice(-5).reverse().map((metric, idx) => (
                      <div key={idx} className="p-3 bg-muted rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold">Epoch {metric.epoch}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(metric.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>Train Loss: {metric.trainLoss.toFixed(4)}</div>
                          <div>Val Loss: {metric.valLoss.toFixed(4)}</div>
                          <div>Train Acc: {(metric.trainAccuracy * 100).toFixed(2)}%</div>
                          <div>Val Acc: {(metric.valAccuracy * 100).toFixed(2)}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* GPU Utilization Tab */}
        <TabsContent value="gpu" className="space-y-4">
          <div className="grid gap-4">
            {gpuMetrics.map((gpu) => (
              <Card key={gpu.gpuId}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Cpu className="h-5 w-5" />
                    GPU {gpu.gpuId}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Utilization</p>
                      <div className="mt-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-lg font-semibold">{gpu.utilization}%</span>
                        </div>
                        <Progress value={gpu.utilization} className="h-2" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Memory</p>
                      <div className="mt-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-lg font-semibold">
                            {gpu.memoryUsed}GB / {gpu.memoryTotal}GB
                          </span>
                        </div>
                        <Progress
                          value={(gpu.memoryUsed / gpu.memoryTotal) * 100}
                          className="h-2"
                        />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Temperature</p>
                      <p className="text-lg font-semibold flex items-center gap-1 mt-2">
                        <Activity className="h-4 w-4" />
                        {gpu.temperature}°C
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Power Usage</p>
                      <p className="text-lg font-semibold flex items-center gap-1 mt-2">
                        <Zap className="h-4 w-4" />
                        {gpu.powerUsage}W
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* System Resources Tab */}
        <TabsContent value="system" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="h-5 w-5" />
                  CPU Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">{systemMetrics.cpuUsage}%</span>
                  </div>
                  <Progress value={systemMetrics.cpuUsage} className="h-3" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5" />
                  RAM Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">{systemMetrics.ramUsage}%</span>
                  </div>
                  <Progress value={systemMetrics.ramUsage} className="h-3" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5" />
                  Disk Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">{systemMetrics.diskUsage}%</span>
                  </div>
                  <Progress value={systemMetrics.diskUsage} className="h-3" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Network Throughput
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">
                      {systemMetrics.networkThroughput} MB/s
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Training Logs</CardTitle>
              <CardDescription>Real-time training output</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] font-mono text-xs bg-black text-green-400 p-4 rounded">
                <div className="space-y-1">
                  <p>[{new Date().toISOString()}] Starting training run {trainingRun.id}...</p>
                  <p>[{new Date().toISOString()}] Model: {trainingRun.modelName}</p>
                  <p>[{new Date().toISOString()}] Total epochs: {trainingRun.totalEpochs}</p>
                  {metricsHistory.map((metric, idx) => (
                    <p key={idx}>
                      [{metric.timestamp}] Epoch {metric.epoch}/{trainingRun.totalEpochs} -
                      loss: {metric.trainLoss.toFixed(4)} - acc: {(metric.trainAccuracy * 100).toFixed(2)}% -
                      val_loss: {metric.valLoss.toFixed(4)} - val_acc: {(metric.valAccuracy * 100).toFixed(2)}%
                    </p>
                  ))}
                  <p className="text-yellow-400">
                    [{new Date().toISOString()}] Current status: {trainingRun.status}
                  </p>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
