'use client'

/**
 * Render Progress Component
 *
 * Real-time progress bar, current sample, time elapsed/remaining, live preview
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Activity,
  Clock,
  Zap,
  Image as ImageIcon,
  Pause,
  Play,
  X,
  TrendingUp,
  Timer,
} from 'lucide-react'

export interface RenderProgressData {
  jobId: string
  status: 'rendering' | 'paused' | 'completed' | 'failed'
  progress: number
  currentSample: number
  totalSamples: number
  currentTile?: { x: number; y: number }
  totalTiles?: { x: number; y: number }
  timeElapsed: number
  timeRemaining: number
  averageSampleTime: number
  previewUrl?: string
  lastUpdated: Date
  memoryUsage?: number
  gpuUsage?: number
}

interface RenderProgressProps {
  jobId: string
  onPause?: () => void
  onResume?: () => void
  onCancel?: () => void
  autoRefresh?: boolean
  refreshInterval?: number
}

export function RenderProgress({
  jobId,
  onPause,
  onResume,
  onCancel,
  autoRefresh = true,
  refreshInterval = 1000,
}: RenderProgressProps) {
  const [progressData, setProgressData] = useState<RenderProgressData | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Fetch progress data
  useEffect(() => {
    if (!autoRefresh) return

    const fetchProgress = async () => {
      try {
        const response = await fetch(`/api/render/progress/${jobId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch progress')
        }
        const data = await response.json()
        setProgressData(data)
        setError(null)
      } catch (err: any) {
        setError(err.message)
      }
    }

    fetchProgress()
    const interval = setInterval(fetchProgress, refreshInterval)

    return () => clearInterval(interval)
  }, [jobId, autoRefresh, refreshInterval])

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    }
    return `${secs}s`
  }

  const formatMemory = (bytes?: number): string => {
    if (!bytes) return 'N/A'
    const gb = bytes / (1024 * 1024 * 1024)
    return `${gb.toFixed(2)} GB`
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (!progressData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Progress...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    )
  }

  const completionPercentage = (progressData.currentSample / progressData.totalSamples) * 100
  const samplesPerSecond = progressData.averageSampleTime > 0
    ? 1 / progressData.averageSampleTime
    : 0

  return (
    <div className="space-y-4">
      {/* Main Progress Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Render Progress
              </CardTitle>
              <CardDescription>Job ID: {jobId}</CardDescription>
            </div>
            <div className="flex gap-2">
              {progressData.status === 'rendering' && (
                <>
                  <Button variant="outline" size="sm" onClick={onPause}>
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </Button>
                  <Button variant="destructive" size="sm" onClick={onCancel}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </>
              )}
              {progressData.status === 'paused' && (
                <Button variant="default" size="sm" onClick={onResume}>
                  <Play className="h-4 w-4 mr-2" />
                  Resume
                </Button>
              )}
              <Badge
                variant={
                  progressData.status === 'rendering' ? 'default' :
                  progressData.status === 'completed' ? 'success' :
                  progressData.status === 'failed' ? 'destructive' :
                  'secondary'
                }
              >
                {progressData.status.toUpperCase()}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Main Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-2xl font-bold">{completionPercentage.toFixed(1)}%</span>
            </div>
            <Progress value={completionPercentage} className="h-3" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Sample {progressData.currentSample} / {progressData.totalSamples}</span>
              <span>{samplesPerSecond.toFixed(2)} samples/sec</span>
            </div>
          </div>

          <Separator />

          {/* Time Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-3 w-3" />
                Time Elapsed
              </div>
              <div className="text-lg font-semibold">
                {formatTime(progressData.timeElapsed)}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Timer className="h-3 w-3" />
                Time Remaining
              </div>
              <div className="text-lg font-semibold">
                {formatTime(progressData.timeRemaining)}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <TrendingUp className="h-3 w-3" />
                Avg Sample Time
              </div>
              <div className="text-lg font-semibold">
                {progressData.averageSampleTime.toFixed(3)}s
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Zap className="h-3 w-3" />
                Speed
              </div>
              <div className="text-lg font-semibold">
                {samplesPerSecond.toFixed(2)} /s
              </div>
            </div>
          </div>

          {/* Tile Progress (if applicable) */}
          {progressData.currentTile && progressData.totalTiles && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Tile Progress</span>
                  <span className="text-sm text-muted-foreground">
                    Tile ({progressData.currentTile.x}, {progressData.currentTile.y}) of{' '}
                    ({progressData.totalTiles.x}, {progressData.totalTiles.y})
                  </span>
                </div>
                <Progress
                  value={
                    ((progressData.currentTile.y * progressData.totalTiles.x + progressData.currentTile.x) /
                      (progressData.totalTiles.x * progressData.totalTiles.y)) *
                    100
                  }
                  className="h-2"
                />
              </div>
            </>
          )}

          {/* Resource Usage */}
          {(progressData.memoryUsage || progressData.gpuUsage) && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Resource Usage</h4>
                <div className="grid grid-cols-2 gap-4">
                  {progressData.memoryUsage && (
                    <div>
                      <div className="text-xs text-muted-foreground">Memory</div>
                      <div className="text-sm font-semibold">
                        {formatMemory(progressData.memoryUsage)}
                      </div>
                    </div>
                  )}
                  {progressData.gpuUsage && (
                    <div>
                      <div className="text-xs text-muted-foreground">GPU Usage</div>
                      <div className="text-sm font-semibold">
                        {progressData.gpuUsage.toFixed(1)}%
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Last Updated */}
          <div className="text-xs text-muted-foreground text-right">
            Last updated: {new Date(progressData.lastUpdated).toLocaleTimeString()}
          </div>
        </CardContent>
      </Card>

      {/* Preview Card */}
      {progressData.previewUrl && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Live Preview
            </CardTitle>
            <CardDescription>
              Updates automatically as rendering progresses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
              <img
                src={progressData.previewUrl}
                alt="Render preview"
                className="w-full h-full object-contain"
              />
              {progressData.status === 'rendering' && (
                <div className="absolute top-2 right-2">
                  <Badge>
                    <Activity className="h-3 w-3 mr-1 animate-pulse" />
                    Rendering
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
