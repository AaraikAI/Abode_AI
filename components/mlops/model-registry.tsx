'use client'

/**
 * Model Registry Component
 *
 * ML model versions, metadata, deployment status, and lineage tracking
 * for comprehensive model lifecycle management
 */

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  Box,
  GitBranch,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Upload,
  Download,
  Search,
  Filter,
  ArrowUpDown,
  Eye,
  Trash2,
  PlayCircle
} from 'lucide-react'

interface ModelVersion {
  id: string
  name: string
  version: string
  status: 'active' | 'staging' | 'archived' | 'failed'
  accuracy: number
  precision: number
  recall: number
  f1Score: number
  createdAt: string
  createdBy: string
  framework: string
  modelSize: string
  tags: string[]
  deploymentCount: number
}

interface ModelLineage {
  modelId: string
  version: string
  parentVersion?: string
  datasetId: string
  trainingRunId: string
  experimentId: string
  gitCommit: string
  dependencies: string[]
}

interface DeploymentInfo {
  id: string
  modelVersion: string
  environment: 'production' | 'staging' | 'development'
  endpoint: string
  status: 'active' | 'inactive' | 'error'
  requestCount: number
  avgLatency: number
  deployedAt: string
}

interface ModelRegistryProps {
  models: ModelVersion[]
  lineage: ModelLineage[]
  deployments: DeploymentInfo[]
  onDeploy?: (modelId: string) => void
  onArchive?: (modelId: string) => void
  onDownload?: (modelId: string) => void
  onViewDetails?: (modelId: string) => void
}

export function ModelRegistry({
  models,
  lineage,
  deployments,
  onDeploy,
  onArchive,
  onDownload,
  onViewDetails
}: ModelRegistryProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [selectedModel, setSelectedModel] = useState<string | null>(null)

  // Filter models based on search and status
  const filteredModels = models.filter(model => {
    const matchesSearch = model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         model.version.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || model.status === filterStatus
    return matchesSearch && matchesStatus
  })

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500'
      case 'staging':
        return 'bg-blue-500'
      case 'archived':
        return 'bg-gray-500'
      case 'failed':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4" />
      case 'staging':
        return <Clock className="h-4 w-4" />
      case 'archived':
        return <Box className="h-4 w-4" />
      case 'failed':
        return <XCircle className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  // Format model size
  const formatSize = (size: string) => {
    return size
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

  // Get model lineage info
  const getModelLineage = (modelId: string) => {
    return lineage.find(l => l.modelId === modelId)
  }

  // Get deployments for model
  const getModelDeployments = (version: string) => {
    return deployments.filter(d => d.modelVersion === version)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Model Registry</h2>
          <p className="text-muted-foreground">
            Manage ML model versions, metadata, and deployment lifecycle
          </p>
        </div>
        <Button>
          <Upload className="h-4 w-4 mr-2" />
          Register Model
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search models by name or version..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filterStatus === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('all')}
          >
            All
          </Button>
          <Button
            variant={filterStatus === 'active' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('active')}
          >
            Active
          </Button>
          <Button
            variant={filterStatus === 'staging' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('staging')}
          >
            Staging
          </Button>
          <Button
            variant={filterStatus === 'archived' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('archived')}
          >
            Archived
          </Button>
        </div>
      </div>

      <Tabs defaultValue="models" className="space-y-4">
        <TabsList>
          <TabsTrigger value="models">Models</TabsTrigger>
          <TabsTrigger value="lineage">Lineage</TabsTrigger>
          <TabsTrigger value="deployments">Deployments</TabsTrigger>
        </TabsList>

        {/* Models Tab */}
        <TabsContent value="models" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Registered Models</CardTitle>
              <CardDescription>
                {filteredModels.length} model{filteredModels.length !== 1 ? 's' : ''} found
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Model Name</TableHead>
                      <TableHead>Version</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Accuracy</TableHead>
                      <TableHead>F1 Score</TableHead>
                      <TableHead>Framework</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Deployments</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredModels.map((model) => (
                      <TableRow key={model.id}>
                        <TableCell className="font-medium">{model.name}</TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {model.version}
                          </code>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(model.status)}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(model.status)}
                              {model.status}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell>{(model.accuracy * 100).toFixed(2)}%</TableCell>
                        <TableCell>{(model.f1Score * 100).toFixed(2)}%</TableCell>
                        <TableCell>{model.framework}</TableCell>
                        <TableCell>{formatSize(model.modelSize)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{model.deploymentCount}</Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(model.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onViewDetails?.(model.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onDeploy?.(model.id)}
                            >
                              <PlayCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onDownload?.(model.id)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onArchive?.(model.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
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

        {/* Lineage Tab */}
        <TabsContent value="lineage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Model Lineage & Provenance</CardTitle>
              <CardDescription>
                Track model evolution, training data, and dependencies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-6">
                  {lineage.map((item) => {
                    const model = models.find(m => m.id === item.modelId)
                    return (
                      <Card key={item.modelId} className="border-l-4 border-l-primary">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2">
                              <GitBranch className="h-5 w-5" />
                              {model?.name || 'Unknown Model'} v{item.version}
                            </CardTitle>
                            <Badge>{model?.framework}</Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Dataset ID</p>
                              <code className="text-xs bg-muted px-2 py-1 rounded">
                                {item.datasetId}
                              </code>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Training Run ID</p>
                              <code className="text-xs bg-muted px-2 py-1 rounded">
                                {item.trainingRunId}
                              </code>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Experiment ID</p>
                              <code className="text-xs bg-muted px-2 py-1 rounded">
                                {item.experimentId}
                              </code>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Git Commit</p>
                              <code className="text-xs bg-muted px-2 py-1 rounded">
                                {item.gitCommit.substring(0, 8)}
                              </code>
                            </div>
                          </div>
                          {item.parentVersion && (
                            <div>
                              <p className="text-muted-foreground text-sm">Parent Version</p>
                              <Badge variant="outline" className="mt-1">
                                v{item.parentVersion}
                              </Badge>
                            </div>
                          )}
                          <div>
                            <p className="text-muted-foreground text-sm mb-2">Dependencies</p>
                            <div className="flex flex-wrap gap-2">
                              {item.dependencies.map((dep, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {dep}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Deployments Tab */}
        <TabsContent value="deployments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Model Deployments</CardTitle>
              <CardDescription>Active deployments across environments</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Model Version</TableHead>
                      <TableHead>Environment</TableHead>
                      <TableHead>Endpoint</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Requests</TableHead>
                      <TableHead>Avg Latency</TableHead>
                      <TableHead>Deployed At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deployments.map((deployment) => (
                      <TableRow key={deployment.id}>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {deployment.modelVersion}
                          </code>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              deployment.environment === 'production'
                                ? 'bg-purple-500'
                                : deployment.environment === 'staging'
                                ? 'bg-blue-500'
                                : 'bg-gray-500'
                            }
                          >
                            {deployment.environment}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {deployment.endpoint}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              deployment.status === 'active'
                                ? 'bg-green-500'
                                : deployment.status === 'inactive'
                                ? 'bg-gray-500'
                                : 'bg-red-500'
                            }
                          >
                            {deployment.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {deployment.requestCount.toLocaleString()}
                        </TableCell>
                        <TableCell>{deployment.avgLatency}ms</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(deployment.deployedAt)}
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
