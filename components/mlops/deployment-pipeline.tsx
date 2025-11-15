'use client'

/**
 * Deployment Pipeline Component
 *
 * Model deployment workflow with staging, rollback, canary deployments,
 * and progressive rollout capabilities
 */

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Slider } from '@/components/ui/slider'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  GitBranch,
  Rocket,
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  RotateCcw,
  Play,
  Pause,
  FastForward,
  Settings,
  Eye,
  Activity,
  TrendingUp
} from 'lucide-react'

interface DeploymentStage {
  id: string
  name: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped'
  startTime?: string
  endTime?: string
  duration?: string
  checks: StageCheck[]
}

interface StageCheck {
  name: string
  status: 'pending' | 'passed' | 'failed'
  message?: string
}

interface Deployment {
  id: string
  modelName: string
  modelVersion: string
  environment: 'development' | 'staging' | 'production'
  status: 'pending' | 'in-progress' | 'completed' | 'failed' | 'rolled-back'
  strategy: 'blue-green' | 'canary' | 'rolling' | 'recreate'
  createdAt: string
  deployedAt?: string
  stages: DeploymentStage[]
  healthScore: number
  trafficPercentage: number
}

interface CanaryConfig {
  enabled: boolean
  trafficPercentage: number
  duration: number
  successThreshold: number
  errorThreshold: number
}

interface RollbackInfo {
  targetVersion: string
  reason: string
  timestamp: string
  triggeredBy: string
}

interface DeploymentPipelineProps {
  currentDeployment: Deployment
  deploymentHistory: Deployment[]
  canaryConfig: CanaryConfig
  onDeploy?: (deployment: Deployment) => void
  onRollback?: (deploymentId: string) => void
  onPause?: (deploymentId: string) => void
  onResume?: (deploymentId: string) => void
  onUpdateTraffic?: (percentage: number) => void
}

export function DeploymentPipeline({
  currentDeployment,
  deploymentHistory,
  canaryConfig,
  onDeploy,
  onRollback,
  onPause,
  onResume,
  onUpdateTraffic
}: DeploymentPipelineProps) {
  const [trafficSlider, setTrafficSlider] = useState([currentDeployment.trafficPercentage])

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'passed':
        return 'bg-green-500'
      case 'in-progress':
      case 'running':
        return 'bg-blue-500'
      case 'failed':
        return 'bg-red-500'
      case 'pending':
        return 'bg-gray-500'
      case 'rolled-back':
      case 'skipped':
        return 'bg-yellow-500'
      default:
        return 'bg-gray-500'
    }
  }

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'passed':
        return <CheckCircle className="h-4 w-4" />
      case 'in-progress':
      case 'running':
        return <Activity className="h-4 w-4 animate-pulse" />
      case 'failed':
        return <XCircle className="h-4 w-4" />
      case 'pending':
        return <Clock className="h-4 w-4" />
      case 'rolled-back':
      case 'skipped':
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  // Calculate overall progress
  const calculateProgress = () => {
    const totalStages = currentDeployment.stages.length
    const completedStages = currentDeployment.stages.filter(
      s => s.status === 'completed' || s.status === 'skipped'
    ).length
    return (completedStages / totalStages) * 100
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Deployment Pipeline</h2>
          <p className="text-muted-foreground">
            Manage model deployments with staging, canary, and rollback capabilities
          </p>
        </div>
        <Button>
          <Rocket className="h-4 w-4 mr-2" />
          New Deployment
        </Button>
      </div>

      {/* Current Deployment Status */}
      <Card className="border-l-4 border-l-primary">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="text-xl">
                {currentDeployment.modelName} v{currentDeployment.modelVersion}
              </CardTitle>
              <Badge className={getStatusColor(currentDeployment.status)}>
                <span className="flex items-center gap-1">
                  {getStatusIcon(currentDeployment.status)}
                  {currentDeployment.status}
                </span>
              </Badge>
              <Badge variant="outline">{currentDeployment.environment}</Badge>
              <Badge variant="outline">{currentDeployment.strategy}</Badge>
            </div>
            <div className="flex gap-2">
              {currentDeployment.status === 'in-progress' && (
                <>
                  <Button variant="outline" size="sm" onClick={() => onPause?.(currentDeployment.id)}>
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => onRollback?.(currentDeployment.id)}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Rollback
                  </Button>
                </>
              )}
              {currentDeployment.status === 'completed' && (
                <Button variant="outline" size="sm" onClick={() => onRollback?.(currentDeployment.id)}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Rollback
                </Button>
              )}
            </div>
          </div>
          <CardDescription>
            Deployment ID: {currentDeployment.id} • Started {formatDate(currentDeployment.createdAt)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm text-muted-foreground">{calculateProgress().toFixed(0)}%</span>
            </div>
            <Progress value={calculateProgress()} className="h-3" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Health Score</p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-2xl font-bold">{currentDeployment.healthScore}%</p>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Traffic Routing</p>
              <p className="text-2xl font-bold">{currentDeployment.trafficPercentage}%</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Strategy</p>
              <p className="text-lg font-semibold capitalize">{currentDeployment.strategy}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Environment</p>
              <p className="text-lg font-semibold capitalize">{currentDeployment.environment}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="stages" className="space-y-4">
        <TabsList>
          <TabsTrigger value="stages">Pipeline Stages</TabsTrigger>
          <TabsTrigger value="canary">Canary Config</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Pipeline Stages Tab */}
        <TabsContent value="stages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Deployment Stages</CardTitle>
              <CardDescription>Track progress through each deployment stage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {currentDeployment.stages.map((stage, index) => (
                  <div key={stage.id}>
                    {/* Stage Header */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        getStatusColor(stage.status)
                      } text-white`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{stage.name}</h4>
                          <Badge className={getStatusColor(stage.status)}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(stage.status)}
                              {stage.status}
                            </span>
                          </Badge>
                        </div>
                        {stage.duration && (
                          <p className="text-sm text-muted-foreground">
                            Duration: {stage.duration}
                          </p>
                        )}
                      </div>
                      {stage.status === 'running' && (
                        <Activity className="h-5 w-5 text-blue-500 animate-pulse" />
                      )}
                    </div>

                    {/* Stage Checks */}
                    <div className="ml-14 space-y-2">
                      {stage.checks.map((check, checkIdx) => (
                        <div
                          key={checkIdx}
                          className="flex items-center gap-2 p-2 rounded-lg bg-muted"
                        >
                          <Badge variant="outline" className={getStatusColor(check.status)}>
                            {getStatusIcon(check.status)}
                          </Badge>
                          <span className="text-sm flex-1">{check.name}</span>
                          {check.message && (
                            <span className="text-xs text-muted-foreground">{check.message}</span>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Connector */}
                    {index < currentDeployment.stages.length - 1 && (
                      <div className="ml-5 mt-2 mb-2">
                        <ChevronRight className="h-5 w-5 text-muted-foreground rotate-90" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Canary Configuration Tab */}
        <TabsContent value="canary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Canary Deployment Configuration
              </CardTitle>
              <CardDescription>
                Configure progressive rollout and canary deployment settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">Canary Deployment</p>
                  <p className="text-sm text-muted-foreground">
                    Gradually roll out changes to minimize risk
                  </p>
                </div>
                <Badge className={canaryConfig.enabled ? 'bg-green-500' : 'bg-gray-500'}>
                  {canaryConfig.enabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium">Traffic Split</label>
                    <span className="text-sm text-muted-foreground">{trafficSlider[0]}%</span>
                  </div>
                  <Slider
                    value={trafficSlider}
                    onValueChange={setTrafficSlider}
                    max={100}
                    step={5}
                    className="mb-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Old Version: {100 - trafficSlider[0]}%</span>
                    <span>New Version: {trafficSlider[0]}%</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => onUpdateTraffic?.(trafficSlider[0])}
                  >
                    Apply Traffic Split
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium mb-1">Canary Duration</p>
                    <p className="text-2xl font-bold">{canaryConfig.duration} min</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Success Threshold</p>
                    <p className="text-2xl font-bold">{canaryConfig.successThreshold}%</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Error Threshold</p>
                    <p className="text-2xl font-bold">{canaryConfig.errorThreshold}%</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Current Traffic</p>
                    <p className="text-2xl font-bold">{canaryConfig.trafficPercentage}%</p>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Canary Analysis Active</p>
                      <p>
                        Monitoring metrics and error rates. Automatic rollback will trigger if
                        error threshold is exceeded.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Deployment History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Deployment History</CardTitle>
              <CardDescription>Past deployments and rollbacks</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Model Version</TableHead>
                      <TableHead>Environment</TableHead>
                      <TableHead>Strategy</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Health Score</TableHead>
                      <TableHead>Deployed At</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deploymentHistory.map((deployment) => (
                      <TableRow key={deployment.id}>
                        <TableCell>
                          <div className="font-medium">{deployment.modelName}</div>
                          <code className="text-xs bg-muted px-1 py-0.5 rounded">
                            v{deployment.modelVersion}
                          </code>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {deployment.environment}
                          </Badge>
                        </TableCell>
                        <TableCell className="capitalize">{deployment.strategy}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(deployment.status)}>
                            {deployment.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{deployment.healthScore}%</span>
                            <Progress value={deployment.healthScore} className="h-2 w-16" />
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(deployment.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>
                            {deployment.status === 'completed' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onRollback?.(deployment.id)}
                              >
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                            )}
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
      </Tabs>
    </div>
  )
}
