'use client'

/**
 * Edge Deployment Status
 *
 * Real-time monitoring and management of edge computing deployments
 * for distributed AI processing and IoT device management
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
  Server,
  Cpu,
  HardDrive,
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  TrendingDown,
  MapPin,
  Globe,
  Wifi,
  WifiOff,
  Play,
  Pause,
  RotateCcw,
  Terminal,
  Eye,
  Trash2,
  Download
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

export interface EdgeNode {
  id: string
  name: string
  location: string
  region: string
  status: 'online' | 'offline' | 'degraded' | 'deploying'
  ipAddress: string
  deployment?: Deployment
  resources: {
    cpuUsage: number
    memoryUsage: number
    diskUsage: number
    networkIn: number
    networkOut: number
  }
  health: {
    uptime: number
    lastHeartbeat: Date
    latency: number
  }
  models: DeployedModel[]
}

export interface Deployment {
  id: string
  version: string
  status: 'pending' | 'deploying' | 'running' | 'failed' | 'stopped'
  progress: number
  startedAt: Date
  completedAt?: Date
  logs: DeploymentLog[]
}

export interface DeployedModel {
  id: string
  name: string
  version: string
  size: number
  requests: number
  avgLatency: number
  status: 'active' | 'idle' | 'error'
}

export interface DeploymentLog {
  timestamp: Date
  level: 'info' | 'warning' | 'error'
  message: string
}

export interface MetricsData {
  timestamp: string
  cpu: number
  memory: number
  requests: number
  latency: number
}

interface DeploymentStatusProps {
  nodes?: EdgeNode[]
  onDeploy?: (nodeId: string, modelId: string) => void
  onStop?: (nodeId: string) => void
  onRestart?: (nodeId: string) => void
  onRemove?: (nodeId: string) => void
  autoRefresh?: boolean
  refreshInterval?: number
}

const defaultNodes: EdgeNode[] = [
  {
    id: 'edge-1',
    name: 'Edge Node - US East',
    location: 'New York, NY',
    region: 'us-east-1',
    status: 'online',
    ipAddress: '10.0.1.15',
    deployment: {
      id: 'dep-1',
      version: 'v2.3.1',
      status: 'running',
      progress: 100,
      startedAt: new Date('2024-01-15T10:00:00'),
      completedAt: new Date('2024-01-15T10:05:00'),
      logs: []
    },
    resources: {
      cpuUsage: 45,
      memoryUsage: 62,
      diskUsage: 38,
      networkIn: 1.2,
      networkOut: 0.8
    },
    health: {
      uptime: 99.8,
      lastHeartbeat: new Date(),
      latency: 12
    },
    models: [
      {
        id: 'model-1',
        name: 'Object Detection',
        version: 'v1.2',
        size: 245,
        requests: 1248,
        avgLatency: 45,
        status: 'active'
      }
    ]
  },
  {
    id: 'edge-2',
    name: 'Edge Node - Europe',
    location: 'London, UK',
    region: 'eu-west-1',
    status: 'online',
    ipAddress: '10.0.2.20',
    resources: {
      cpuUsage: 28,
      memoryUsage: 51,
      diskUsage: 42,
      networkIn: 0.9,
      networkOut: 0.6
    },
    health: {
      uptime: 99.9,
      lastHeartbeat: new Date(),
      latency: 8
    },
    models: []
  },
  {
    id: 'edge-3',
    name: 'Edge Node - Asia Pacific',
    location: 'Singapore',
    region: 'ap-southeast-1',
    status: 'degraded',
    ipAddress: '10.0.3.25',
    resources: {
      cpuUsage: 85,
      memoryUsage: 78,
      diskUsage: 65,
      networkIn: 2.1,
      networkOut: 1.5
    },
    health: {
      uptime: 98.2,
      lastHeartbeat: new Date(),
      latency: 45
    },
    models: []
  }
]

const metricsHistory: MetricsData[] = Array.from({ length: 24 }, (_, i) => ({
  timestamp: `${i}:00`,
  cpu: Math.random() * 100,
  memory: Math.random() * 100,
  requests: Math.floor(Math.random() * 1000),
  latency: Math.random() * 100
}))

export function DeploymentStatus({
  nodes = defaultNodes,
  onDeploy,
  onStop,
  onRestart,
  onRemove,
  autoRefresh = true,
  refreshInterval = 5000
}: DeploymentStatusProps) {
  const { toast } = useToast()
  const [selectedNode, setSelectedNode] = useState<EdgeNode | null>(nodes[0] || null)
  const [metricsData, setMetricsData] = useState<MetricsData[]>(metricsHistory)
  const [showLogs, setShowLogs] = useState(false)

  // Calculate global metrics
  const totalNodes = nodes.length
  const onlineNodes = nodes.filter(n => n.status === 'online').length
  const degradedNodes = nodes.filter(n => n.status === 'degraded').length
  const offlineNodes = nodes.filter(n => n.status === 'offline').length
  const totalModels = nodes.reduce((sum, n) => sum + n.models.length, 0)
  const totalRequests = nodes.reduce(
    (sum, n) => sum + n.models.reduce((s, m) => s + m.requests, 0),
    0
  )
  const avgLatency =
    nodes.reduce((sum, n) => sum + n.health.latency, 0) / nodes.length

  /**
   * Auto-refresh
   */
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      // Simulate metrics update
      setMetricsData(prev => [
        ...prev.slice(1),
        {
          timestamp: new Date().toLocaleTimeString(),
          cpu: Math.random() * 100,
          memory: Math.random() * 100,
          requests: Math.floor(Math.random() * 1000),
          latency: Math.random() * 100
        }
      ])
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval])

  /**
   * Get status badge variant
   */
  const getStatusVariant = (status: EdgeNode['status']) => {
    switch (status) {
      case 'online':
        return 'default'
      case 'offline':
        return 'destructive'
      case 'degraded':
        return 'secondary'
      case 'deploying':
        return 'outline'
    }
  }

  /**
   * Get status icon
   */
  const getStatusIcon = (status: EdgeNode['status']) => {
    switch (status) {
      case 'online':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'offline':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'deploying':
        return <Clock className="h-4 w-4 text-blue-500" />
    }
  }

  /**
   * Handle deployment actions
   */
  const handleDeploy = (nodeId: string) => {
    onDeploy?.(nodeId, 'model-default')
    toast({
      title: 'Deployment Started',
      description: `Deploying to ${nodes.find(n => n.id === nodeId)?.name}`
    })
  }

  const handleStop = (nodeId: string) => {
    onStop?.(nodeId)
    toast({
      title: 'Node Stopped',
      description: 'Edge node has been stopped'
    })
  }

  const handleRestart = (nodeId: string) => {
    onRestart?.(nodeId)
    toast({
      title: 'Node Restarting',
      description: 'Edge node is restarting...'
    })
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Nodes</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalNodes}</div>
            <p className="text-xs text-muted-foreground">
              {onlineNodes} online
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Health Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{onlineNodes}</div>
            <p className="text-xs text-muted-foreground">
              {degradedNodes} degraded, {offlineNodes} offline
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deployed Models</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalModels}</div>
            <p className="text-xs text-muted-foreground">
              Across all nodes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRequests.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Last 24 hours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Latency</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgLatency.toFixed(0)}ms</div>
            <p className="text-xs text-muted-foreground">
              Global average
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Node List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Edge Nodes</CardTitle>
            <CardDescription>Manage your edge deployments</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-3">
                {nodes.map(node => (
                  <div
                    key={node.id}
                    onClick={() => setSelectedNode(node)}
                    className={`p-4 border rounded-lg cursor-pointer transition-all hover:bg-accent/50 ${
                      selectedNode?.id === node.id ? 'border-primary bg-accent/30' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-start gap-2">
                        {getStatusIcon(node.status)}
                        <div>
                          <div className="font-medium">{node.name}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {node.location}
                          </div>
                        </div>
                      </div>
                      <Badge variant={getStatusVariant(node.status)}>
                        {node.status}
                      </Badge>
                    </div>

                    <div className="space-y-2 mt-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">CPU</span>
                        <span className="font-medium">{node.resources.cpuUsage}%</span>
                      </div>
                      <Progress value={node.resources.cpuUsage} className="h-1" />

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Memory</span>
                        <span className="font-medium">{node.resources.memoryUsage}%</span>
                      </div>
                      <Progress value={node.resources.memoryUsage} className="h-1" />
                    </div>

                    {node.models.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="text-xs text-muted-foreground">
                          {node.models.length} model{node.models.length > 1 ? 's' : ''} deployed
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Node Details */}
        <Card className="lg:col-span-2">
          {selectedNode ? (
            <>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{selectedNode.name}</CardTitle>
                    <CardDescription>
                      {selectedNode.region} • {selectedNode.ipAddress}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRestart(selectedNode.id)}
                      disabled={selectedNode.status === 'offline'}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Restart
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStop(selectedNode.id)}
                      disabled={selectedNode.status === 'offline'}
                    >
                      <Pause className="h-4 w-4 mr-2" />
                      Stop
                    </Button>
                    {selectedNode.status === 'offline' && (
                      <Button
                        size="sm"
                        onClick={() => handleDeploy(selectedNode.id)}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Deploy
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="overview">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="models">Models</TabsTrigger>
                    <TabsTrigger value="metrics">Metrics</TabsTrigger>
                    <TabsTrigger value="logs">Logs</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">Health</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Uptime</span>
                            <span className="font-medium">{selectedNode.health.uptime}%</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Latency</span>
                            <span className="font-medium">{selectedNode.health.latency}ms</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Last Heartbeat</span>
                            <span className="font-medium">
                              {selectedNode.health.lastHeartbeat.toLocaleTimeString()}
                            </span>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">Resources</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span>CPU Usage</span>
                              <span>{selectedNode.resources.cpuUsage}%</span>
                            </div>
                            <Progress value={selectedNode.resources.cpuUsage} />
                          </div>
                          <div>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span>Memory</span>
                              <span>{selectedNode.resources.memoryUsage}%</span>
                            </div>
                            <Progress value={selectedNode.resources.memoryUsage} />
                          </div>
                          <div>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span>Disk</span>
                              <span>{selectedNode.resources.diskUsage}%</span>
                            </div>
                            <Progress value={selectedNode.resources.diskUsage} />
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {selectedNode.deployment && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Current Deployment</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Version</span>
                            <Badge>{selectedNode.deployment.version}</Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Status</span>
                            <Badge variant={selectedNode.deployment.status === 'running' ? 'default' : 'secondary'}>
                              {selectedNode.deployment.status}
                            </Badge>
                          </div>
                          {selectedNode.deployment.status === 'deploying' && (
                            <div>
                              <div className="flex items-center justify-between text-sm mb-2">
                                <span>Progress</span>
                                <span>{selectedNode.deployment.progress}%</span>
                              </div>
                              <Progress value={selectedNode.deployment.progress} />
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  <TabsContent value="models" className="space-y-3">
                    {selectedNode.models.length > 0 ? (
                      selectedNode.models.map(model => (
                        <Card key={model.id}>
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div>
                                <CardTitle className="text-base">{model.name}</CardTitle>
                                <CardDescription>{model.version}</CardDescription>
                              </div>
                              <Badge variant={model.status === 'active' ? 'default' : 'secondary'}>
                                {model.status}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <div className="text-muted-foreground">Size</div>
                                <div className="font-medium">{model.size} MB</div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">Requests</div>
                                <div className="font-medium">{model.requests.toLocaleString()}</div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">Avg Latency</div>
                                <div className="font-medium">{model.avgLatency}ms</div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        No models deployed
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="metrics" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Resource Usage (24h)</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={200}>
                          <AreaChart data={metricsData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="timestamp" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Area
                              type="monotone"
                              dataKey="cpu"
                              stroke="#3b82f6"
                              fill="#3b82f6"
                              fillOpacity={0.3}
                              name="CPU %"
                            />
                            <Area
                              type="monotone"
                              dataKey="memory"
                              stroke="#10b981"
                              fill="#10b981"
                              fillOpacity={0.3}
                              name="Memory %"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Request Volume & Latency</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={200}>
                          <LineChart data={metricsData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="timestamp" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="requests"
                              stroke="#f59e0b"
                              strokeWidth={2}
                              name="Requests"
                            />
                            <Line
                              type="monotone"
                              dataKey="latency"
                              stroke="#ef4444"
                              strokeWidth={2}
                              name="Latency (ms)"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="logs">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Deployment Logs</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-[400px]">
                          <div className="space-y-2 font-mono text-xs">
                            <div className="flex items-start gap-2">
                              <span className="text-muted-foreground">[INFO]</span>
                              <span>Edge node initialized successfully</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="text-muted-foreground">[INFO]</span>
                              <span>Loading model checkpoint v2.3.1...</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="text-green-500">[INFO]</span>
                              <span>Model loaded successfully (245 MB)</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="text-muted-foreground">[INFO]</span>
                              <span>Starting inference server on port 8080</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="text-green-500">[INFO]</span>
                              <span>Server ready to accept requests</span>
                            </div>
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </>
          ) : (
            <CardContent className="p-12 text-center">
              <Server className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Node Selected</h3>
              <p className="text-muted-foreground">Select a node to view details</p>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  )
}
