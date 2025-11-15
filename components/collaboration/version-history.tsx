'use client'

import { useState } from 'react'
import { History, RotateCcw, Eye, GitBranch, User, Calendar, ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
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

export interface ProjectVersion {
  id: string
  versionNumber: number
  name?: string
  description?: string
  author: {
    id: string
    name: string
    avatar?: string
  }
  createdAt: string
  changes?: {
    added: number
    modified: number
    deleted: number
  }
  isCurrent?: boolean
  tags?: string[]
}

interface VersionHistoryProps {
  versions: ProjectVersion[]
  currentVersionId?: string
  onRestore?: (versionId: string) => void
  onPreview?: (versionId: string) => void
  onCompare?: (versionId1: string, versionId2: string) => void
  showComparison?: boolean
}

export function VersionHistory({
  versions,
  currentVersionId,
  onRestore,
  onPreview,
  onCompare,
  showComparison = true,
}: VersionHistoryProps) {
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([])
  const [restoreVersionId, setRestoreVersionId] = useState<string | null>(null)

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minutes ago`
    if (diffHours < 24) return `${diffHours} hours ago`
    if (diffDays < 7) return `${diffDays} days ago`

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    })
  }

  const handleCompareToggle = (versionId: string) => {
    setSelectedForCompare(prev => {
      if (prev.includes(versionId)) {
        return prev.filter(id => id !== versionId)
      }
      if (prev.length >= 2) {
        return [prev[1], versionId]
      }
      return [...prev, versionId]
    })
  }

  const handleCompare = () => {
    if (selectedForCompare.length === 2) {
      onCompare?.(selectedForCompare[0], selectedForCompare[1])
      setSelectedForCompare([])
    }
  }

  const handleRestore = (versionId: string) => {
    setRestoreVersionId(versionId)
  }

  const confirmRestore = () => {
    if (restoreVersionId) {
      onRestore?.(restoreVersionId)
      setRestoreVersionId(null)
    }
  }

  return (
    <>
      <Card className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5" />
              <h3 className="font-semibold text-lg">Version History</h3>
              <Badge variant="secondary">{versions.length} versions</Badge>
            </div>

            {showComparison && selectedForCompare.length === 2 && (
              <Button onClick={handleCompare} size="sm">
                <GitBranch className="h-4 w-4 mr-2" />
                Compare Selected
              </Button>
            )}
          </div>

          {/* Timeline */}
          <ScrollArea className="h-[500px] pr-4">
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-[21px] top-0 bottom-0 w-0.5 bg-border" />

              <div className="space-y-4">
                {versions.map((version, index) => {
                  const isSelected = selectedForCompare.includes(version.id)
                  const isCurrent = version.id === currentVersionId || version.isCurrent

                  return (
                    <div key={version.id} className="relative flex gap-4">
                      {/* Timeline Dot */}
                      <div className="relative z-10 flex-shrink-0">
                        <div
                          className={`h-11 w-11 rounded-full border-4 border-background flex items-center justify-center ${
                            isCurrent
                              ? 'bg-primary text-primary-foreground'
                              : isSelected
                              ? 'bg-blue-500 text-white'
                              : 'bg-muted'
                          }`}
                        >
                          {isCurrent ? (
                            <ChevronRight className="h-5 w-5" />
                          ) : (
                            <span className="text-xs font-bold">v{version.versionNumber}</span>
                          )}
                        </div>
                      </div>

                      {/* Version Card */}
                      <Card
                        className={`flex-1 p-4 ${
                          isSelected ? 'border-blue-500 border-2' : ''
                        } ${isCurrent ? 'bg-primary/5' : ''}`}
                      >
                        <div className="space-y-3">
                          {/* Header */}
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold">
                                  {version.name || `Version ${version.versionNumber}`}
                                </h4>
                                {isCurrent && (
                                  <Badge variant="default">Current</Badge>
                                )}
                                {version.tags?.map(tag => (
                                  <Badge key={tag} variant="outline">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                              {version.description && (
                                <p className="text-sm text-muted-foreground">
                                  {version.description}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Author and Date */}
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={version.author.avatar} />
                                <AvatarFallback className="text-xs">
                                  {getInitials(version.author.name)}
                                </AvatarFallback>
                              </Avatar>
                              <span>{version.author.name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(version.createdAt)}</span>
                            </div>
                          </div>

                          {/* Changes Summary */}
                          {version.changes && (
                            <div className="flex items-center gap-3 text-xs">
                              {version.changes.added > 0 && (
                                <span className="text-green-600">
                                  +{version.changes.added} added
                                </span>
                              )}
                              {version.changes.modified > 0 && (
                                <span className="text-blue-600">
                                  ~{version.changes.modified} modified
                                </span>
                              )}
                              {version.changes.deleted > 0 && (
                                <span className="text-red-600">
                                  -{version.changes.deleted} deleted
                                </span>
                              )}
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            {showComparison && (
                              <Button
                                variant={isSelected ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => handleCompareToggle(version.id)}
                              >
                                {isSelected ? 'Selected' : 'Select to Compare'}
                              </Button>
                            )}

                            {onPreview && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onPreview(version.id)}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                Preview
                              </Button>
                            )}

                            {!isCurrent && onRestore && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRestore(version.id)}
                              >
                                <RotateCcw className="h-3 w-3 mr-1" />
                                Restore
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    </div>
                  )
                })}
              </div>
            </div>
          </ScrollArea>
        </div>
      </Card>

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={restoreVersionId !== null} onOpenChange={() => setRestoreVersionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Version?</AlertDialogTitle>
            <AlertDialogDescription>
              This will restore the project to the selected version. Your current work will be saved
              as a new version. This action can be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRestore}>Restore</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
