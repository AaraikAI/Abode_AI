'use client'

import { useState } from 'react'
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  Filter,
  Eye,
  Download,
  RefreshCw,
  Search,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu'

export interface ClashResult {
  id: string
  severity: 'critical' | 'major' | 'minor' | 'info'
  elementA: {
    id: string
    name: string
    type: string
  }
  elementB: {
    id: string
    name: string
    type: string
  }
  description: string
  location: {
    x: number
    y: number
    z: number
  }
  volume: number
  status: 'new' | 'active' | 'resolved' | 'ignored'
  suggestions: string[]
  assignedTo?: string
  createdAt: string
}

export interface DetectionProgress {
  stage: 'idle' | 'analyzing' | 'detecting' | 'complete'
  progress: number
  message: string
  totalChecks: number
  completedChecks: number
}

interface ClashDetectionProps {
  clashes?: ClashResult[]
  onRun?: () => void
  onResolve?: (clashId: string, resolution: string) => void
  onIgnore?: (clashId: string) => void
  onFocus?: (clashId: string) => void
  onExport?: (format: 'pdf' | 'excel' | 'bcf') => void
}

function ClashItem({
  clash,
  onResolve,
  onIgnore,
  onFocus,
}: {
  clash: ClashResult
  onResolve: (id: string, resolution: string) => void
  onIgnore: (id: string) => void
  onFocus: (id: string) => void
}) {
  const [showSuggestions, setShowSuggestions] = useState(false)

  const getSeverityIcon = () => {
    switch (clash.severity) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'major':
        return <AlertCircle className="h-4 w-4 text-orange-600" />
      case 'minor':
        return <Info className="h-4 w-4 text-yellow-600" />
      default:
        return <Info className="h-4 w-4 text-blue-600" />
    }
  }

  const getSeverityBadge = () => {
    const variants: Record<string, string> = {
      critical: 'bg-red-500/10 text-red-700 dark:text-red-300',
      major: 'bg-orange-500/10 text-orange-700 dark:text-orange-300',
      minor: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-300',
      info: 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
    }
    return (
      <Badge variant="outline" className={variants[clash.severity]}>
        {clash.severity}
      </Badge>
    )
  }

  const getStatusBadge = () => {
    const variants: Record<string, string> = {
      new: 'bg-purple-500/10 text-purple-700 dark:text-purple-300',
      active: 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
      resolved: 'bg-green-500/10 text-green-700 dark:text-green-300',
      ignored: 'bg-gray-500/10 text-gray-700 dark:text-gray-300',
    }
    return (
      <Badge variant="outline" className={variants[clash.status]}>
        {clash.status}
      </Badge>
    )
  }

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{getSeverityIcon()}</div>
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className="font-medium text-sm">{clash.description}</p>
              <div className="flex items-center gap-2 mt-1">
                {getSeverityBadge()}
                {getStatusBadge()}
                <span className="text-xs text-muted-foreground">
                  Volume: {clash.volume.toFixed(2)} m³
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Element A</p>
              <p className="font-medium truncate">{clash.elementA.name}</p>
              <p className="text-muted-foreground text-xs">{clash.elementA.type}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Element B</p>
              <p className="font-medium truncate">{clash.elementB.name}</p>
              <p className="text-muted-foreground text-xs">{clash.elementB.type}</p>
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            Location: ({clash.location.x.toFixed(1)}, {clash.location.y.toFixed(1)}, {clash.location.z.toFixed(1)})
          </div>

          {clash.suggestions.length > 0 && (
            <div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setShowSuggestions(!showSuggestions)}
              >
                {showSuggestions ? 'Hide' : 'Show'} Resolution Suggestions ({clash.suggestions.length})
              </Button>
              {showSuggestions && (
                <div className="mt-2 space-y-1">
                  {clash.suggestions.map((suggestion, index) => (
                    <div key={index} className="flex items-start gap-2 text-xs">
                      <CheckCircle2 className="h-3 w-3 mt-0.5 text-green-600" />
                      <span>{suggestion}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => onFocus(clash.id)}
            >
              <Eye className="h-3 w-3 mr-1" />
              Focus
            </Button>
            {clash.status !== 'resolved' && (
              <Button
                variant="default"
                size="sm"
                className="h-8"
                onClick={() => onResolve(clash.id, 'Manual resolution')}
              >
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Resolve
              </Button>
            )}
            {clash.status !== 'ignored' && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8"
                onClick={() => onIgnore(clash.id)}
              >
                <X className="h-3 w-3 mr-1" />
                Ignore
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function ClashDetection({
  clashes = [],
  onRun,
  onResolve,
  onIgnore,
  onFocus,
  onExport,
}: ClashDetectionProps) {
  const [progress, setProgress] = useState<DetectionProgress>({
    stage: 'idle',
    progress: 0,
    message: 'Ready to detect clashes',
    totalChecks: 0,
    completedChecks: 0,
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'severity' | 'date' | 'volume'>('severity')

  const handleRun = async () => {
    setProgress({
      stage: 'analyzing',
      progress: 10,
      message: 'Analyzing geometry...',
      totalChecks: 100,
      completedChecks: 0,
    })

    // Simulate detection process
    await new Promise(resolve => setTimeout(resolve, 1000))
    setProgress({
      stage: 'detecting',
      progress: 50,
      message: 'Detecting clashes...',
      totalChecks: 100,
      completedChecks: 50,
    })

    await new Promise(resolve => setTimeout(resolve, 1000))
    setProgress({
      stage: 'complete',
      progress: 100,
      message: 'Detection complete',
      totalChecks: 100,
      completedChecks: 100,
    })

    onRun?.()
  }

  const filteredClashes = clashes
    .filter((clash) => {
      const matchesSearch =
        clash.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        clash.elementA.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        clash.elementB.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesSeverity = severityFilter === 'all' || clash.severity === severityFilter
      const matchesStatus = statusFilter === 'all' || clash.status === statusFilter
      return matchesSearch && matchesSeverity && matchesStatus
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'severity':
          const severityOrder = { critical: 0, major: 1, minor: 2, info: 3 }
          return severityOrder[a.severity] - severityOrder[b.severity]
        case 'volume':
          return b.volume - a.volume
        case 'date':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        default:
          return 0
      }
    })

  const stats = {
    total: clashes.length,
    critical: clashes.filter((c) => c.severity === 'critical').length,
    major: clashes.filter((c) => c.severity === 'major').length,
    minor: clashes.filter((c) => c.severity === 'minor').length,
    resolved: clashes.filter((c) => c.status === 'resolved').length,
  }

  return (
    <Card className="p-6 h-full flex flex-col">
      <div className="space-y-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            <h3 className="font-semibold text-lg">Clash Detection</h3>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onExport?.('pdf')}>
                  Export as PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onExport?.('excel')}>
                  Export as Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onExport?.('bcf')}>
                  Export as BCF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button size="sm" onClick={handleRun} disabled={progress.stage !== 'idle' && progress.stage !== 'complete'}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Run Detection
            </Button>
          </div>
        </div>

        {progress.stage !== 'idle' && progress.stage !== 'complete' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{progress.message}</span>
              <span className="font-medium">
                {progress.completedChecks} / {progress.totalChecks}
              </span>
            </div>
            <Progress value={progress.progress} />
          </div>
        )}

        <div className="grid grid-cols-5 gap-4">
          <Card className="p-3">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total Clashes</p>
          </Card>
          <Card className="p-3">
            <p className="text-2xl font-bold text-red-600">{stats.critical}</p>
            <p className="text-xs text-muted-foreground">Critical</p>
          </Card>
          <Card className="p-3">
            <p className="text-2xl font-bold text-orange-600">{stats.major}</p>
            <p className="text-xs text-muted-foreground">Major</p>
          </Card>
          <Card className="p-3">
            <p className="text-2xl font-bold text-yellow-600">{stats.minor}</p>
            <p className="text-xs text-muted-foreground">Minor</p>
          </Card>
          <Card className="p-3">
            <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
            <p className="text-xs text-muted-foreground">Resolved</p>
          </Card>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clashes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="major">Major</SelectItem>
              <SelectItem value="minor">Minor</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="ignored">Ignored</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="severity">Severity</SelectItem>
              <SelectItem value="volume">Volume</SelectItem>
              <SelectItem value="date">Date</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator className="my-4" />

      <ScrollArea className="flex-1">
        {filteredClashes.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No clashes found</p>
            <p className="text-sm mt-1">Run detection to analyze the model</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredClashes.map((clash) => (
              <ClashItem
                key={clash.id}
                clash={clash}
                onResolve={onResolve || (() => {})}
                onIgnore={onIgnore || (() => {})}
                onFocus={onFocus || (() => {})}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </Card>
  )
}
