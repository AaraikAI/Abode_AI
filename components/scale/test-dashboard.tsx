'use client'

/**
 * Load Testing Dashboard
 *
 * Performance testing and load analysis dashboard for stress testing,
 * capacity planning, and performance optimization
 */

import { useState, useEffect } from 'react'
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
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/components/ui/use-toast'
import {
  Activity,
  Zap,
  TrendingUp,
  TrendingDown,
  Play,
  Pause,
  RotateCcw,
  Download,
  AlertTriangle,
  CheckCircle2,
  Users,
  Clock,
  Target,
  Server,
  Gauge
} from 'lucide-react'
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
  ResponsiveContainer,
  Legend
} from 'recharts'

export interface LoadTest {
  id: string
  name: string
  status: 'idle' | 'running' | 'completed' | 'failed'
  progress: number
  config: TestConfig
  results?: TestResults
  startTime?: Date
  endTime?: Date
}

export interface TestConfig {
  virtualUsers: number
  duration: number // seconds
  rampUpTime: number // seconds
  endpoint: string
  requestsPerSecond: number
}

export interface TestResults {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  avgResponseTime: number
  minResponseTime: number
  maxResponseTime: number
  p95ResponseTime: number
  p99ResponseTime: number
  throughput: number // requests per second
  errorRate: number // percentage
  metrics: MetricPoint[]
}

export interface MetricPoint {
  timestamp: number
  responseTime: number
  activeUsers: number
  requestsPerSecond: number
  errorRate: number
  cpuUsage: number
  memoryUsage: number
}

interface TestDashboardProps {
  onStartTest?: (config: TestConfig) => void
  onStopTest?: () => void
  onExportResults?: () => void
}

const mockMetrics: MetricPoint[] = Array.from({ length: 60 }, (_, i) => ({
  timestamp: i,
  responseTime: Math.random() * 500 + 100,
  activeUsers: Math.min(i * 10, 1000),
  requestsPerSecond: Math.random() * 100 + 50,
  errorRate: Math.random() * 5,
  cpuUsage: Math.random() * 80 + 10,
  memoryUsage: Math.random() * 70 + 20
}))

export function TestDashboard({
  onStartTest,
  onStopTest,
  onExportResults
}: TestDashboardProps) {
  const { toast } = useToast()

  const [config, setConfig] = useState<TestConfig>({
    virtualUsers: 100,
    duration: 300,
    rampUpTime: 60,
    endpoint: 'https://api.example.com/v1',
    requestsPerSecond: 50
  })

  const [currentTest, setCurrentTest] = useState<LoadTest | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [testProgress, setTestProgress] = useState(0)
  const [metrics, setMetrics] = useState<MetricPoint[]>(mockMetrics)

  const [liveStats, setLiveStats] = useState({
    activeUsers: 0,
    requestsPerSecond: 0,
    avgResponseTime: 0,
    errorRate: 0
  })

  /**
   * Simulate test progression
   */
  useEffect(() => {
    if (!isRunning) return

    const interval = setInterval(() => {
      setTestProgress(prev => {
        if (prev >= 100) {
          setIsRunning(false)
          return 100
        }
        return prev + (100 / config.duration)
      })

      setLiveStats({
        activeUsers: Math.min(
          Math.floor((testProgress / 100) * config.virtualUsers),
          config.virtualUsers
        ),
        requestsPerSecond: Math.random() * config.requestsPerSecond * 2,
        avgResponseTime: Math.random() * 500 + 100,
        errorRate: Math.random() * 5
      })

      setMetrics(prev => [
        ...prev.slice(1),
        {
          timestamp: prev[prev.length - 1].timestamp + 1,
          responseTime: Math.random() * 500 + 100,
          activeUsers: Math.min(
            Math.floor((testProgress / 100) * config.virtualUsers),
            config.virtualUsers
          ),
          requestsPerSecond: Math.random() * config.requestsPerSecond * 2,
          errorRate: Math.random() * 5,
          cpuUsage: Math.random() * 80 + 10,
          memoryUsage: Math.random() * 70 + 20
        }
      ])
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning, testProgress, config])

  /**
   * Start load test
   */
  const handleStartTest = () => {
    setIsRunning(true)
    setTestProgress(0)
    onStartTest?.(config)

    toast({
      title: 'Load Test Started',
      description: `Testing with ${config.virtualUsers} virtual users`
    })
  }

  /**
   * Stop load test
   */
  const handleStopTest = () => {
    setIsRunning(false)
    onStopTest?.()

    toast({
      title: 'Load Test Stopped',
      description: 'Test has been terminated'
    })
  }

  /**
   * Reset test
   */
  const handleReset = () => {
    setIsRunning(false)
    setTestProgress(0)
    setLiveStats({
      activeUsers: 0,
      requestsPerSecond: 0,
      avgResponseTime: 0,
      errorRate: 0
    })
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{liveStats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              of {config.virtualUsers} target
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Requests/sec</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {liveStats.requestsPerSecond.toFixed(0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Target: {config.requestsPerSecond}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {liveStats.avgResponseTime.toFixed(0)}ms
            </div>
            <p className="text-xs text-muted-foreground">
              {liveStats.avgResponseTime < 200 ? (
                <span className="text-green-500">Excellent</span>
              ) : liveStats.avgResponseTime < 500 ? (
                <span className="text-yellow-500">Good</span>
              ) : (
                <span className="text-red-500">Slow</span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {liveStats.errorRate.toFixed(1)}%
            </div>
            <Progress value={liveStats.errorRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Test Progress</CardTitle>
            <Gauge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{testProgress.toFixed(0)}%</div>
            <Progress value={testProgress} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Test Configuration</CardTitle>
            <CardDescription>Configure load test parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Endpoint</Label>
              <Input
                value={config.endpoint}
                onChange={e => setConfig({ ...config, endpoint: e.target.value })}
                disabled={isRunning}
                placeholder="https://api.example.com/v1"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Virtual Users</Label>
                <span className="text-sm font-medium">{config.virtualUsers}</span>
              </div>
              <Slider
                value={[config.virtualUsers]}
                onValueChange={([value]) => setConfig({ ...config, virtualUsers: value })}
                min={1}
                max={1000}
                step={1}
                disabled={isRunning}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Duration (seconds)</Label>
                <span className="text-sm font-medium">{config.duration}s</span>
              </div>
              <Slider
                value={[config.duration]}
                onValueChange={([value]) => setConfig({ ...config, duration: value })}
                min={10}
                max={3600}
                step={10}
                disabled={isRunning}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Ramp-up Time (seconds)</Label>
                <span className="text-sm font-medium">{config.rampUpTime}s</span>
              </div>
              <Slider
                value={[config.rampUpTime]}
                onValueChange={([value]) => setConfig({ ...config, rampUpTime: value })}
                min={0}
                max={300}
                step={5}
                disabled={isRunning}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Requests per Second</Label>
                <span className="text-sm font-medium">{config.requestsPerSecond}</span>
              </div>
              <Slider
                value={[config.requestsPerSecond]}
                onValueChange={([value]) =>
                  setConfig({ ...config, requestsPerSecond: value })
                }
                min={1}
                max={200}
                step={1}
                disabled={isRunning}
              />
            </div>

            <div className="flex gap-2">
              {isRunning ? (
                <Button onClick={handleStopTest} variant="destructive" className="flex-1">
                  <Pause className="h-4 w-4 mr-2" />
                  Stop Test
                </Button>
              ) : (
                <Button onClick={handleStartTest} className="flex-1">
                  <Play className="h-4 w-4 mr-2" />
                  Start Test
                </Button>
              )}
              <Button onClick={handleReset} variant="outline" disabled={isRunning}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Real-time Metrics */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Real-time test metrics</CardDescription>
              </div>
              <Badge variant={isRunning ? 'default' : 'secondary'}>
                {isRunning ? 'Running' : 'Idle'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="response">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="response">Response Time</TabsTrigger>
                <TabsTrigger value="throughput">Throughput</TabsTrigger>
                <TabsTrigger value="errors">Errors</TabsTrigger>
                <TabsTrigger value="resources">Resources</TabsTrigger>
              </TabsList>

              <TabsContent value="response" className="mt-4">
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={metrics}>
                    <defs>
                      <linearGradient id="colorResponse" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="responseTime"
                      stroke="#3b82f6"
                      fillOpacity={1}
                      fill="url(#colorResponse)"
                      name="Response Time (ms)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </TabsContent>

              <TabsContent value="throughput" className="mt-4">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={metrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="requestsPerSecond"
                      stroke="#10b981"
                      strokeWidth={2}
                      name="Requests/sec"
                    />
                    <Line
                      type="monotone"
                      dataKey="activeUsers"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      name="Active Users"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </TabsContent>

              <TabsContent value="errors" className="mt-4">
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={metrics}>
                    <defs>
                      <linearGradient id="colorErrors" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="errorRate"
                      stroke="#ef4444"
                      fillOpacity={1}
                      fill="url(#colorErrors)"
                      name="Error Rate (%)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </TabsContent>

              <TabsContent value="resources" className="mt-4">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={metrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="cpuUsage"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      name="CPU Usage (%)"
                    />
                    <Line
                      type="monotone"
                      dataKey="memoryUsage"
                      stroke="#ec4899"
                      strokeWidth={2}
                      name="Memory Usage (%)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Test Summary */}
      {testProgress === 100 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Test Results Summary</CardTitle>
                <CardDescription>Performance test completed</CardDescription>
              </div>
              <Button onClick={onExportResults} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Total Requests</div>
                <div className="text-2xl font-bold">
                  {(config.requestsPerSecond * config.duration).toLocaleString()}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Success Rate</div>
                <div className="text-2xl font-bold text-green-500">
                  {(100 - liveStats.errorRate).toFixed(1)}%
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Avg Response</div>
                <div className="text-2xl font-bold">{liveStats.avgResponseTime.toFixed(0)}ms</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Throughput</div>
                <div className="text-2xl font-bold">
                  {config.requestsPerSecond.toFixed(0)} req/s
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
