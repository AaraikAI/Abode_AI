'use client'

/**
 * Offline Sync Status Component
 *
 * Displays sync status, queued changes, and conflict resolution
 */

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/components/ui/use-toast'
import {
  Cloud,
  CloudOff,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  FileEdit,
  Trash2,
  FilePlus,
  GitMerge,
  Wifi,
  WifiOff,
  Download,
  Upload,
  Database,
  ChevronRight
} from 'lucide-react'

export interface SyncChange {
  id: string
  type: 'create' | 'update' | 'delete'
  entityType: 'design' | 'project' | 'file' | 'settings' | 'comment'
  entityId: string
  entityName: string
  timestamp: string
  status: 'pending' | 'syncing' | 'synced' | 'failed' | 'conflict'
  retryCount?: number
  error?: string
}

export interface SyncConflict {
  id: string
  changeId: string
  entityType: string
  entityName: string
  localVersion: any
  remoteVersion: any
  timestamp: string
  resolved: boolean
}

export interface SyncStatus {
  isOnline: boolean
  isSyncing: boolean
  lastSyncTime?: string
  pendingChanges: number
  failedChanges: number
  conflicts: number
  totalDataSize: number
  syncedDataSize: number
}

interface OfflineSyncStatusProps {
  status: SyncStatus
  changes: SyncChange[]
  conflicts?: SyncConflict[]
  onSync?: () => void
  onRetryChange?: (changeId: string) => void
  onDiscardChange?: (changeId: string) => void
  onResolveConflict?: (conflictId: string, resolution: 'local' | 'remote' | 'merge') => void
  autoSync?: boolean
}

const CHANGE_TYPE_ICONS = {
  create: FilePlus,
  update: FileEdit,
  delete: Trash2
}

const CHANGE_TYPE_COLORS = {
  create: 'text-green-500',
  update: 'text-blue-500',
  delete: 'text-red-500'
}

const STATUS_COLORS = {
  pending: 'bg-yellow-500',
  syncing: 'bg-blue-500',
  synced: 'bg-green-500',
  failed: 'bg-red-500',
  conflict: 'bg-orange-500'
}

export function OfflineSyncStatus({
  status,
  changes,
  conflicts = [],
  onSync,
  onRetryChange,
  onDiscardChange,
  onResolveConflict,
  autoSync = true
}: OfflineSyncStatusProps) {
  const { toast } = useToast()
  const [expandedChange, setExpandedChange] = useState<string | null>(null)
  const [expandedConflict, setExpandedConflict] = useState<string | null>(null)

  useEffect(() => {
    // Auto-sync when coming online
    if (status.isOnline && autoSync && status.pendingChanges > 0 && !status.isSyncing) {
      handleSync()
    }
  }, [status.isOnline])

  /**
   * Trigger manual sync
   */
  const handleSync = () => {
    if (!status.isOnline) {
      toast({
        title: 'No Internet Connection',
        description: 'Cannot sync while offline',
        variant: 'destructive'
      })
      return
    }

    onSync?.()
    toast({
      title: 'Sync Started',
      description: `Syncing ${status.pendingChanges} changes...`
    })
  }

  /**
   * Retry failed change
   */
  const retryChange = (changeId: string) => {
    onRetryChange?.(changeId)
    toast({
      title: 'Retrying Sync',
      description: 'Attempting to sync change again...'
    })
  }

  /**
   * Discard pending change
   */
  const discardChange = (changeId: string, changeName: string) => {
    if (confirm(`Are you sure you want to discard changes to "${changeName}"?`)) {
      onDiscardChange?.(changeId)
      toast({
        title: 'Change Discarded',
        description: 'Local changes have been removed'
      })
    }
  }

  /**
   * Resolve conflict
   */
  const resolveConflict = (
    conflictId: string,
    resolution: 'local' | 'remote' | 'merge',
    entityName: string
  ) => {
    onResolveConflict?.(conflictId, resolution)
    toast({
      title: 'Conflict Resolved',
      description: `"${entityName}" resolved using ${resolution} version`
    })
  }

  const syncProgress = status.totalDataSize > 0
    ? (status.syncedDataSize / status.totalDataSize) * 100
    : 0

  const pendingChanges = changes.filter(c => c.status === 'pending')
  const failedChanges = changes.filter(c => c.status === 'failed')
  const conflictChanges = changes.filter(c => c.status === 'conflict')

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {status.isOnline ? (
                <Cloud className="h-5 w-5 text-green-500" />
              ) : (
                <CloudOff className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <CardTitle className="text-base">
                  {status.isOnline ? 'Online' : 'Offline'}
                </CardTitle>
                <CardDescription className="text-xs">
                  {status.lastSyncTime
                    ? `Last synced: ${new Date(status.lastSyncTime).toLocaleString()}`
                    : 'Never synced'}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {status.isOnline ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-muted-foreground" />
              )}
              <Button
                size="sm"
                onClick={handleSync}
                disabled={!status.isOnline || status.isSyncing || status.pendingChanges === 0}
              >
                {status.isSyncing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Sync Now
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        {status.isSyncing && (
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Syncing changes...</span>
              <span>{syncProgress.toFixed(0)}%</span>
            </div>
            <Progress value={syncProgress} />
          </CardContent>
        )}
      </Card>

      {/* Sync Statistics */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-1">
              <div className="flex items-center justify-center">
                <Clock className="h-4 w-4 text-yellow-500 mr-1" />
                <span className="text-2xl font-bold">{status.pendingChanges}</span>
              </div>
              <div className="text-xs text-muted-foreground">Pending</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-1">
              <div className="flex items-center justify-center">
                <XCircle className="h-4 w-4 text-red-500 mr-1" />
                <span className="text-2xl font-bold">{status.failedChanges}</span>
              </div>
              <div className="text-xs text-muted-foreground">Failed</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-1">
              <div className="flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-orange-500 mr-1" />
                <span className="text-2xl font-bold">{status.conflicts}</span>
              </div>
              <div className="text-xs text-muted-foreground">Conflicts</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conflicts Alert */}
      {conflicts.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Sync Conflicts Detected</AlertTitle>
          <AlertDescription>
            {conflicts.length} conflict{conflicts.length > 1 ? 's' : ''} require{' '}
            {conflicts.length === 1 ? 's' : ''} your attention
          </AlertDescription>
        </Alert>
      )}

      {/* Conflicts List */}
      {conflicts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <GitMerge className="h-4 w-4" />
              Conflicts ({conflicts.length})
            </CardTitle>
            <CardDescription>Resolve conflicts to continue syncing</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {conflicts.map((conflict, index) => (
                  <div key={conflict.id}>
                    {index > 0 && <Separator className="my-3" />}
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="font-medium">{conflict.entityName}</div>
                          <div className="text-xs text-muted-foreground">
                            {conflict.entityType} • {new Date(conflict.timestamp).toLocaleString()}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            setExpandedConflict(
                              expandedConflict === conflict.id ? null : conflict.id
                            )
                          }
                        >
                          <ChevronRight
                            className={`h-4 w-4 transition-transform ${
                              expandedConflict === conflict.id ? 'rotate-90' : ''
                            }`}
                          />
                        </Button>
                      </div>

                      {expandedConflict === conflict.id && (
                        <div className="space-y-3 pl-4 border-l-2">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                resolveConflict(conflict.id, 'local', conflict.entityName)
                              }
                            >
                              <Download className="h-3 w-3 mr-1" />
                              Keep Local
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                resolveConflict(conflict.id, 'remote', conflict.entityName)
                              }
                            >
                              <Upload className="h-3 w-3 mr-1" />
                              Use Remote
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                resolveConflict(conflict.id, 'merge', conflict.entityName)
                              }
                            >
                              <GitMerge className="h-3 w-3 mr-1" />
                              Merge
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Pending Changes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="h-4 w-4" />
            Queued Changes ({changes.length})
          </CardTitle>
          <CardDescription>
            Changes waiting to sync with the cloud
          </CardDescription>
        </CardHeader>
        <CardContent>
          {changes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <div className="text-sm">All changes synced</div>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {changes.map((change, index) => {
                  const Icon = CHANGE_TYPE_ICONS[change.type]
                  const isExpanded = expandedChange === change.id

                  return (
                    <div key={change.id}>
                      {index > 0 && <Separator className="my-2" />}
                      <div className="space-y-2">
                        <div className="flex items-start justify-between p-2 rounded hover:bg-accent/50">
                          <div className="flex items-start gap-3 flex-1">
                            <div className={`mt-1 ${CHANGE_TYPE_COLORS[change.type]}`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">{change.entityName}</span>
                                <Badge
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {change.entityType}
                                </Badge>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(change.timestamp).toLocaleString()}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className={`h-2 w-2 rounded-full ${STATUS_COLORS[change.status]}`} />
                              <Badge variant="outline" className="text-xs capitalize">
                                {change.status}
                              </Badge>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              setExpandedChange(isExpanded ? null : change.id)
                            }
                          >
                            <ChevronRight
                              className={`h-4 w-4 transition-transform ${
                                isExpanded ? 'rotate-90' : ''
                              }`}
                            />
                          </Button>
                        </div>

                        {isExpanded && (
                          <div className="pl-11 space-y-2">
                            {change.error && (
                              <Alert variant="destructive">
                                <AlertDescription className="text-xs">
                                  {change.error}
                                </AlertDescription>
                              </Alert>
                            )}
                            {change.retryCount && change.retryCount > 0 && (
                              <div className="text-xs text-muted-foreground">
                                Retry attempts: {change.retryCount}
                              </div>
                            )}
                            <div className="flex gap-2">
                              {change.status === 'failed' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => retryChange(change.id)}
                                >
                                  <RefreshCw className="h-3 w-3 mr-1" />
                                  Retry
                                </Button>
                              )}
                              {(change.status === 'pending' || change.status === 'failed') && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => discardChange(change.id, change.entityName)}
                                >
                                  <Trash2 className="h-3 w-3 mr-1" />
                                  Discard
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
