'use client'

/**
 * Feature Store Component
 *
 * Feature engineering pipeline with transformations, versioning,
 * and feature lifecycle management
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
  LineChart,
  Line,
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
  Database,
  GitBranch,
  Code,
  Layers,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Trash2,
  Download,
  Upload,
  Activity,
  TrendingUp
} from 'lucide-react'

interface Feature {
  id: string
  name: string
  version: string
  dataType: 'numerical' | 'categorical' | 'boolean' | 'text' | 'timestamp'
  status: 'active' | 'deprecated' | 'experimental'
  description: string
  source: string
  transformation: string
  createdAt: string
  createdBy: string
  lastModified: string
  usageCount: number
  tags: string[]
}

interface FeatureGroup {
  id: string
  name: string
  description: string
  features: string[]
  version: string
  status: 'active' | 'archived'
  createdAt: string
}

interface Transformation {
  id: string
  name: string
  type: 'normalization' | 'encoding' | 'scaling' | 'aggregation' | 'custom'
  description: string
  inputFeatures: string[]
  outputFeature: string
  code: string
  parameters: Record<string, unknown>
}

interface FeatureStats {
  featureId: string
  mean?: number
  median?: number
  stdDev?: number
  min?: number
  max?: number
  nullCount: number
  uniqueCount: number
  distribution: { value: string; count: number }[]
}

interface FeatureUsage {
  featureId: string
  timestamp: string
  modelId: string
  modelName: string
  accessCount: number
}

interface FeatureStoreProps {
  features: Feature[]
  featureGroups: FeatureGroup[]
  transformations: Transformation[]
  featureStats: FeatureStats[]
  usageHistory: FeatureUsage[]
  onCreateFeature?: () => void
  onEditFeature?: (featureId: string) => void
  onDeleteFeature?: (featureId: string) => void
  onViewStats?: (featureId: string) => void
}

export function FeatureStore({
  features,
  featureGroups,
  transformations,
  featureStats,
  usageHistory,
  onCreateFeature,
  onEditFeature,
  onDeleteFeature,
  onViewStats
}: FeatureStoreProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterDataType, setFilterDataType] = useState<string>('all')

  // Filter features
  const filteredFeatures = features.filter(feature => {
    const matchesSearch = feature.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         feature.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || feature.status === filterStatus
    const matchesDataType = filterDataType === 'all' || feature.dataType === filterDataType
    return matchesSearch && matchesStatus && matchesDataType
  })

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500'
      case 'deprecated':
        return 'bg-red-500'
      case 'experimental':
        return 'bg-blue-500'
      case 'archived':
        return 'bg-gray-500'
      default:
        return 'bg-gray-500'
    }
  }

  // Get data type icon
  const getDataTypeIcon = (dataType: string) => {
    switch (dataType) {
      case 'numerical':
        return '123'
      case 'categorical':
        return 'ABC'
      case 'boolean':
        return 'T/F'
      case 'text':
        return 'TXT'
      case 'timestamp':
        return '🕐'
      default:
        return '?'
    }
  }

  // Get transformation type color
  const getTransformationColor = (type: string) => {
    switch (type) {
      case 'normalization':
        return 'bg-purple-500'
      case 'encoding':
        return 'bg-blue-500'
      case 'scaling':
        return 'bg-green-500'
      case 'aggregation':
        return 'bg-orange-500'
      case 'custom':
        return 'bg-pink-500'
      default:
        return 'bg-gray-500'
    }
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

  // Aggregate usage data for chart
  const usageByFeature = features.map(feature => ({
    name: feature.name,
    usage: feature.usageCount
  })).sort((a, b) => b.usage - a.usage).slice(0, 10)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Feature Store</h2>
          <p className="text-muted-foreground">
            Manage feature engineering pipeline, transformations, and versioning
          </p>
        </div>
        <Button onClick={onCreateFeature}>
          <Plus className="h-4 w-4 mr-2" />
          Create Feature
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Features</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{features.length}</div>
            <p className="text-xs text-muted-foreground">
              {features.filter(f => f.status === 'active').length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Feature Groups</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{featureGroups.length}</div>
            <p className="text-xs text-muted-foreground">
              {featureGroups.filter(g => g.status === 'active').length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transformations</CardTitle>
            <Code className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transformations.length}</div>
            <p className="text-xs text-muted-foreground">pipeline steps</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {features.reduce((sum, f) => sum + f.usageCount, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">across all models</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search features..."
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
            variant={filterStatus === 'experimental' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('experimental')}
          >
            Experimental
          </Button>
          <Button
            variant={filterStatus === 'deprecated' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('deprecated')}
          >
            Deprecated
          </Button>
        </div>
      </div>

      <Tabs defaultValue="features" className="space-y-4">
        <TabsList>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="groups">Feature Groups</TabsTrigger>
          <TabsTrigger value="transformations">Transformations</TabsTrigger>
          <TabsTrigger value="usage">Usage Analytics</TabsTrigger>
        </TabsList>

        {/* Features Tab */}
        <TabsContent value="features" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Feature Catalog</CardTitle>
              <CardDescription>
                {filteredFeatures.length} feature{filteredFeatures.length !== 1 ? 's' : ''} found
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Version</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Usage</TableHead>
                      <TableHead>Last Modified</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFeatures.map((feature) => (
                      <TableRow key={feature.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{feature.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {feature.description}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {feature.version}
                          </code>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono">
                            {getDataTypeIcon(feature.dataType)} {feature.dataType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(feature.status)}>
                            {feature.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{feature.source}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{feature.usageCount}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(feature.lastModified)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onViewStats?.(feature.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onEditFeature?.(feature.id)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onDeleteFeature?.(feature.id)}
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

        {/* Feature Groups Tab */}
        <TabsContent value="groups" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Feature Groups</CardTitle>
              <CardDescription>Logical groupings of related features</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {featureGroups.map((group) => (
                    <Card key={group.id} className="border-l-4 border-l-primary">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <CardTitle className="text-lg">{group.name}</CardTitle>
                            <Badge className={getStatusColor(group.status)}>
                              {group.status}
                            </Badge>
                            <Badge variant="outline">v{group.version}</Badge>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <CardDescription>{group.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Database className="h-4 w-4" />
                            <span>{group.features.length} features</span>
                            <span>•</span>
                            <Clock className="h-4 w-4" />
                            <span>Created {formatDate(group.createdAt)}</span>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-3">
                            {group.features.map((featureId, idx) => {
                              const feature = features.find(f => f.id === featureId)
                              return feature ? (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {feature.name}
                                </Badge>
                              ) : null
                            })}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transformations Tab */}
        <TabsContent value="transformations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Feature Transformations</CardTitle>
              <CardDescription>Pipeline steps and transformation logic</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {transformations.map((transformation) => (
                    <Card key={transformation.id} className="border-l-4 border-l-blue-500">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                              <Code className="h-5 w-5" />
                              {transformation.name}
                            </CardTitle>
                            <Badge className={getTransformationColor(transformation.type)}>
                              {transformation.type}
                            </Badge>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <CardDescription>{transformation.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground mb-1">Input Features</p>
                            <div className="flex flex-wrap gap-1">
                              {transformation.inputFeatures.map((input, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {input}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-muted-foreground mb-1">Output Feature</p>
                            <Badge variant="secondary">{transformation.outputFeature}</Badge>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Transformation Code</p>
                          <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
                            {transformation.code}
                          </pre>
                        </div>
                        {Object.keys(transformation.parameters).length > 0 && (
                          <div>
                            <p className="text-sm text-muted-foreground mb-2">Parameters</p>
                            <div className="bg-muted p-3 rounded-lg">
                              <code className="text-xs">
                                {JSON.stringify(transformation.parameters, null, 2)}
                              </code>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Usage Analytics Tab */}
        <TabsContent value="usage" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Top Features by Usage */}
            <Card>
              <CardHeader>
                <CardTitle>Top Features by Usage</CardTitle>
                <CardDescription>Most frequently accessed features</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={usageByFeature} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip />
                    <Bar dataKey="usage" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Usage Over Time */}
            <Card>
              <CardHeader>
                <CardTitle>Feature Access Trends</CardTitle>
                <CardDescription>Feature usage over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={usageHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="accessCount"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      name="Access Count"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Feature Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Feature Statistics</CardTitle>
              <CardDescription>Statistical properties of features</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {featureStats.map((stats) => {
                    const feature = features.find(f => f.id === stats.featureId)
                    return feature ? (
                      <Card key={stats.featureId} className="bg-muted/50">
                        <CardHeader>
                          <CardTitle className="text-base">{feature.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            {stats.mean !== undefined && (
                              <div>
                                <p className="text-muted-foreground">Mean</p>
                                <p className="font-semibold">{stats.mean.toFixed(3)}</p>
                              </div>
                            )}
                            {stats.median !== undefined && (
                              <div>
                                <p className="text-muted-foreground">Median</p>
                                <p className="font-semibold">{stats.median.toFixed(3)}</p>
                              </div>
                            )}
                            {stats.stdDev !== undefined && (
                              <div>
                                <p className="text-muted-foreground">Std Dev</p>
                                <p className="font-semibold">{stats.stdDev.toFixed(3)}</p>
                              </div>
                            )}
                            <div>
                              <p className="text-muted-foreground">Unique Values</p>
                              <p className="font-semibold">{stats.uniqueCount}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Null Count</p>
                              <p className="font-semibold">{stats.nullCount}</p>
                            </div>
                            {stats.min !== undefined && (
                              <div>
                                <p className="text-muted-foreground">Min</p>
                                <p className="font-semibold">{stats.min.toFixed(3)}</p>
                              </div>
                            )}
                            {stats.max !== undefined && (
                              <div>
                                <p className="text-muted-foreground">Max</p>
                                <p className="font-semibold">{stats.max.toFixed(3)}</p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ) : null
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
