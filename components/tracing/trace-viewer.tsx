'use client'

/**
 * Trace Viewer Component
 *
 * Distributed tracing visualization for debugging microservices,
 * API calls, and performance bottlenecks
 */

import { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/components/ui/use-toast'
import {
  Activity,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Download,
  RefreshCw,
  Zap,
  Database,
  Server,
  Globe,
  Code
} from 'lucide-react'

export interface Span {
  id: string
  traceId: string
  parentId?: string
  name: string
  service: string
  operation: string
  startTime: number
  duration: number
  status: 'success' | 'error' | 'warning'
  tags: Record<string, string>
  logs: SpanLog[]
  children?: Span[]
}

export interface SpanLog {
  timestamp: number
  level: 'info' | 'warning' | 'error'
  message: string
  fields?: Record<string, any>
}

export interface Trace {
  id: string
  name: string
  rootSpan: Span
  totalDuration: number
  spanCount: number
  errorCount: number
  timestamp: Date
  services: string[]
}

interface TraceViewerProps {
  traces?: Trace[]
  onRefresh?: () => void
  onExport?: (traceId: string) => void
}

const mockTraces: Trace[] = [
  {
    id: 'trace-1',
    name: 'POST /api/projects',
    rootSpan: {
      id: 'span-1',
      traceId: 'trace-1',
      name: 'HTTP POST /api/projects',
      service: 'api-gateway',
      operation: 'http.request',
      startTime: Date.now() - 1000,
      duration: 245,
      status: 'success',
      tags: { 'http.method': 'POST', 'http.status_code': '200' },
      logs: [],
      children: [
        {
          id: 'span-2',
          traceId: 'trace-1',
          parentId: 'span-1',
          name: 'DB Query: INSERT projects',
          service: 'database',
          operation: 'db.query',
          startTime: Date.now() - 900,
          duration: 85,
          status: 'success',
          tags: { 'db.type': 'postgresql', 'db.statement': 'INSERT INTO projects...' },
          logs: []
        },
        {
          id: 'span-3',
          traceId: 'trace-1',
          parentId: 'span-1',
          name: 'Cache SET',
          service: 'cache',
          operation: 'cache.set',
          startTime: Date.now() - 800,
          duration: 12,
          status: 'success',
          tags: { 'cache.key': 'project:123' },
          logs: []
        }
      ]
    },
    totalDuration: 245,
    spanCount: 3,
    errorCount: 0,
    timestamp: new Date(),
    services: ['api-gateway', 'database', 'cache']
  }
]

export function TraceViewer({
  traces = mockTraces,
  onRefresh,
  onExport
}: TraceViewerProps) {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTrace, setSelectedTrace] = useState<Trace | null>(null)
  const [selectedSpan, setSelectedSpan] = useState<Span | null>(null)
  const [expandedSpans, setExpandedSpans] = useState<Set<string>>(new Set())

  const getStatusIcon = (status: Span['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
    }
  }

  const getServiceIcon = (service: string) => {
    if (service.includes('gateway')) return <Globe className="h-4 w-4" />
    if (service.includes('database')) return <Database className="h-4 w-4" />
    if (service.includes('cache')) return <Zap className="h-4 w-4" />
    return <Server className="h-4 w-4" />
  }

  const toggleSpan = (spanId: string) => {
    setExpandedSpans(prev => {
      const next = new Set(prev)
      if (next.has(spanId)) {
        next.delete(spanId)
      } else {
        next.add(spanId)
      }
      return next
    })
  }

  const renderSpan = (span: Span, depth: number = 0) => {
    const isExpanded = expandedSpans.has(span.id)
    const hasChildren = span.children && span.children.length > 0

    return (
      <div key={span.id}>
        <div
          onClick={() => {
            setSelectedSpan(span)
            if (hasChildren) toggleSpan(span.id)
          }}
          className={`flex items-center gap-2 p-2 cursor-pointer hover:bg-accent rounded ${
            selectedSpan?.id === span.id ? 'bg-accent' : ''
          }`}
          style={{ paddingLeft: `${depth * 24 + 8}px` }}
        >
          {hasChildren && (
            <span className="text-xs">{isExpanded ? '▼' : '▶'}</span>
          )}
          {getStatusIcon(span.status)}
          {getServiceIcon(span.service)}
          <span className="flex-1 text-sm truncate">{span.name}</span>
          <Badge variant="outline" className="text-xs">
            {span.duration}ms
          </Badge>
        </div>
        {isExpanded && span.children?.map(child => renderSpan(child, depth + 1))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Traces</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{traces.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(traces.reduce((sum, t) => sum + t.totalDuration, 0) / traces.length).toFixed(0)}ms
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((traces.filter(t => t.errorCount > 0).length / traces.length) * 100).toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Services</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(traces.flatMap(t => t.services)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trace List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Traces</CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search traces..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              <div className="space-y-2">
                {traces.map(trace => (
                  <div
                    key={trace.id}
                    onClick={() => setSelectedTrace(trace)}
                    className={`p-3 border rounded-lg cursor-pointer hover:bg-accent transition ${
                      selectedTrace?.id === trace.id ? 'border-primary bg-accent' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm truncate">{trace.name}</span>
                      {trace.errorCount > 0 && (
                        <Badge variant="destructive">{trace.errorCount}</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {trace.totalDuration}ms
                      <span>•</span>
                      {trace.spanCount} spans
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Trace Details */}
        <Card className="lg:col-span-2">
          {selectedTrace ? (
            <>
              <CardHeader>
                <CardTitle>{selectedTrace.name}</CardTitle>
                <CardDescription>Trace ID: {selectedTrace.id}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Duration</div>
                    <div className="font-medium">{selectedTrace.totalDuration}ms</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Spans</div>
                    <div className="font-medium">{selectedTrace.spanCount}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Services</div>
                    <div className="font-medium">{selectedTrace.services.length}</div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-3">Span Waterfall</h4>
                  <ScrollArea className="h-[400px] border rounded-lg p-2">
                    {renderSpan(selectedTrace.rootSpan)}
                  </ScrollArea>
                </div>

                {selectedSpan && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-3">Span Details</h4>
                      <div className="space-y-3 text-sm">
                        <div>
                          <div className="text-muted-foreground">Name</div>
                          <div className="font-medium">{selectedSpan.name}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Service</div>
                          <div className="font-medium">{selectedSpan.service}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Operation</div>
                          <div className="font-medium">{selectedSpan.operation}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Duration</div>
                          <div className="font-medium">{selectedSpan.duration}ms</div>
                        </div>
                        {Object.keys(selectedSpan.tags).length > 0 && (
                          <div>
                            <div className="text-muted-foreground mb-2">Tags</div>
                            <div className="space-y-1">
                              {Object.entries(selectedSpan.tags).map(([key, value]) => (
                                <div key={key} className="flex items-center gap-2 text-xs">
                                  <Badge variant="outline">{key}</Badge>
                                  <span className="text-muted-foreground">{value}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </>
          ) : (
            <CardContent className="p-12 text-center">
              <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Trace Selected</h3>
              <p className="text-muted-foreground">Select a trace to view details</p>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  )
}
