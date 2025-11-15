'use client'

/**
 * Job Queue Component
 *
 * List of render jobs with status, progress, priority, cancel/retry functionality
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  List,
  Play,
  Pause,
  X,
  RotateCcw,
  MoreVertical,
  ChevronUp,
  ChevronDown,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Download,
} from 'lucide-react'

export type JobStatus = 'queued' | 'rendering' | 'completed' | 'failed' | 'cancelled' | 'paused'

export interface RenderJob {
  id: string
  name: string
  status: JobStatus
  progress: number
  priority: number
  quality: string
  resolution: string
  samples: number
  currentSample?: number
  estimatedTimeRemaining?: number
  createdAt: Date
  startedAt?: Date
  completedAt?: Date
  outputUrl?: string
  error?: string
}

interface JobQueueProps {
  projectId: string
  jobs?: RenderJob[]
  onCancel?: (jobId: string) => void
  onRetry?: (jobId: string) => void
  onPause?: (jobId: string) => void
  onResume?: (jobId: string) => void
  onChangePriority?: (jobId: string, newPriority: number) => void
  onDownload?: (jobId: string) => void
}

export function JobQueue({
  projectId,
  jobs: initialJobs = [],
  onCancel,
  onRetry,
  onPause,
  onResume,
  onChangePriority,
  onDownload,
}: JobQueueProps) {
  const [jobs, setJobs] = useState<RenderJob[]>(initialJobs)
  const [selectedJob, setSelectedJob] = useState<string | null>(null)
  const [showCancelDialog, setShowCancelDialog] = useState(false)

  // Poll for job updates
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/render/jobs?projectId=${projectId}`)
        if (response.ok) {
          const data = await response.json()
          setJobs(data.jobs)
        }
      } catch (error) {
        console.error('Failed to fetch jobs:', error)
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [projectId])

  const getStatusIcon = (status: JobStatus) => {
    switch (status) {
      case 'queued':
        return <Clock className="h-4 w-4" />
      case 'rendering':
        return <Loader2 className="h-4 w-4 animate-spin" />
      case 'completed':
        return <CheckCircle2 className="h-4 w-4" />
      case 'failed':
        return <XCircle className="h-4 w-4" />
      case 'cancelled':
        return <X className="h-4 w-4" />
      case 'paused':
        return <Pause className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: JobStatus): string => {
    switch (status) {
      case 'queued':
        return 'secondary'
      case 'rendering':
        return 'default'
      case 'completed':
        return 'success'
      case 'failed':
        return 'destructive'
      case 'cancelled':
        return 'secondary'
      case 'paused':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  const formatTimeRemaining = (seconds?: number): string => {
    if (!seconds) return 'Calculating...'
    if (seconds < 60) return `${Math.round(seconds)}s`
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`
    return `${Math.round(seconds / 3600)}h ${Math.round((seconds % 3600) / 60)}m`
  }

  const handleCancelClick = (jobId: string) => {
    setSelectedJob(jobId)
    setShowCancelDialog(true)
  }

  const handleConfirmCancel = () => {
    if (selectedJob) {
      onCancel?.(selectedJob)
      setShowCancelDialog(false)
      setSelectedJob(null)
    }
  }

  const handlePriorityChange = (jobId: string, direction: 'up' | 'down') => {
    const job = jobs.find(j => j.id === jobId)
    if (!job) return

    const newPriority = direction === 'up' ? job.priority + 1 : job.priority - 1
    onChangePriority?.(jobId, Math.max(0, Math.min(10, newPriority)))
  }

  const sortedJobs = [...jobs].sort((a, b) => {
    // Sort by priority first (higher first), then by creation date
    if (a.priority !== b.priority) return b.priority - a.priority
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  })

  const activeJobs = sortedJobs.filter(j => j.status === 'rendering' || j.status === 'queued')
  const completedJobs = sortedJobs.filter(j => j.status === 'completed')
  const failedJobs = sortedJobs.filter(j => j.status === 'failed' || j.status === 'cancelled')

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <List className="h-5 w-5" />
                Render Queue
              </CardTitle>
              <CardDescription>
                {activeJobs.length} active, {completedJobs.length} completed, {failedJobs.length} failed
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline">{jobs.length} total jobs</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-4">
              {/* Active Jobs */}
              {activeJobs.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-muted-foreground">Active</h3>
                  {activeJobs.map((job) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      onCancel={handleCancelClick}
                      onRetry={onRetry}
                      onPause={onPause}
                      onResume={onResume}
                      onPriorityUp={() => handlePriorityChange(job.id, 'up')}
                      onPriorityDown={() => handlePriorityChange(job.id, 'down')}
                      onDownload={onDownload}
                      getStatusIcon={getStatusIcon}
                      getStatusColor={getStatusColor}
                      formatTimeRemaining={formatTimeRemaining}
                    />
                  ))}
                </div>
              )}

              {/* Completed Jobs */}
              {completedJobs.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-muted-foreground">Completed</h3>
                  {completedJobs.map((job) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      onCancel={handleCancelClick}
                      onRetry={onRetry}
                      onPause={onPause}
                      onResume={onResume}
                      onPriorityUp={() => handlePriorityChange(job.id, 'up')}
                      onPriorityDown={() => handlePriorityChange(job.id, 'down')}
                      onDownload={onDownload}
                      getStatusIcon={getStatusIcon}
                      getStatusColor={getStatusColor}
                      formatTimeRemaining={formatTimeRemaining}
                    />
                  ))}
                </div>
              )}

              {/* Failed Jobs */}
              {failedJobs.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-muted-foreground">Failed/Cancelled</h3>
                  {failedJobs.map((job) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      onCancel={handleCancelClick}
                      onRetry={onRetry}
                      onPause={onPause}
                      onResume={onResume}
                      onPriorityUp={() => handlePriorityChange(job.id, 'up')}
                      onPriorityDown={() => handlePriorityChange(job.id, 'down')}
                      onDownload={onDownload}
                      getStatusIcon={getStatusIcon}
                      getStatusColor={getStatusColor}
                      formatTimeRemaining={formatTimeRemaining}
                    />
                  ))}
                </div>
              )}

              {jobs.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <List className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No render jobs in queue</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Render Job?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel the render job and remove it from the queue. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Job</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmCancel}>Cancel Job</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

interface JobCardProps {
  job: RenderJob
  onCancel: (jobId: string) => void
  onRetry?: (jobId: string) => void
  onPause?: (jobId: string) => void
  onResume?: (jobId: string) => void
  onPriorityUp: () => void
  onPriorityDown: () => void
  onDownload?: (jobId: string) => void
  getStatusIcon: (status: JobStatus) => JSX.Element
  getStatusColor: (status: JobStatus) => string
  formatTimeRemaining: (seconds?: number) => string
}

function JobCard({
  job,
  onCancel,
  onRetry,
  onPause,
  onResume,
  onPriorityUp,
  onPriorityDown,
  onDownload,
  getStatusIcon,
  getStatusColor,
  formatTimeRemaining,
}: JobCardProps) {
  return (
    <div className="p-4 border rounded-lg space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold">{job.name}</h4>
            <Badge variant={getStatusColor(job.status) as any}>
              {getStatusIcon(job.status)}
              <span className="ml-1 capitalize">{job.status}</span>
            </Badge>
            {job.priority > 0 && (
              <Badge variant="outline">Priority: {job.priority}</Badge>
            )}
          </div>
          <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
            <span>{job.quality}</span>
            <span>{job.resolution}</span>
            <span>{job.samples} samples</span>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {job.status === 'rendering' && (
              <DropdownMenuItem onClick={() => onPause?.(job.id)}>
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </DropdownMenuItem>
            )}
            {job.status === 'paused' && (
              <DropdownMenuItem onClick={() => onResume?.(job.id)}>
                <Play className="h-4 w-4 mr-2" />
                Resume
              </DropdownMenuItem>
            )}
            {(job.status === 'failed' || job.status === 'cancelled') && (
              <DropdownMenuItem onClick={() => onRetry?.(job.id)}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Retry
              </DropdownMenuItem>
            )}
            {job.status === 'completed' && job.outputUrl && (
              <DropdownMenuItem onClick={() => onDownload?.(job.id)}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onPriorityUp}>
              <ChevronUp className="h-4 w-4 mr-2" />
              Increase Priority
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onPriorityDown}>
              <ChevronDown className="h-4 w-4 mr-2" />
              Decrease Priority
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {(job.status === 'queued' || job.status === 'rendering' || job.status === 'paused') && (
              <DropdownMenuItem
                onClick={() => onCancel(job.id)}
                className="text-destructive"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Progress Bar */}
      {(job.status === 'rendering' || job.status === 'paused') && (
        <div className="space-y-1">
          <Progress value={job.progress} />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              {job.currentSample && job.samples
                ? `Sample ${job.currentSample} / ${job.samples}`
                : `${job.progress}%`}
            </span>
            <span>{formatTimeRemaining(job.estimatedTimeRemaining)}</span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {job.status === 'failed' && job.error && (
        <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">
          {job.error}
        </div>
      )}
    </div>
  )
}
