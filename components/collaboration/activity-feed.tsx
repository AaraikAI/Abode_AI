'use client'

import { useState } from 'react'
import {
  Activity,
  Edit,
  MessageSquare,
  UserPlus,
  Share2,
  FileText,
  Trash2,
  GitBranch,
  Filter,
  RefreshCw,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export type ActivityType =
  | 'edit'
  | 'comment'
  | 'share'
  | 'member_added'
  | 'member_removed'
  | 'file_added'
  | 'file_deleted'
  | 'version_created'

export interface ActivityItem {
  id: string
  type: ActivityType
  userId: string
  userName: string
  userAvatar?: string
  timestamp: string
  description: string
  metadata?: {
    fileName?: string
    commentText?: string
    memberEmail?: string
    versionNumber?: number
    changeCount?: number
  }
}

interface ActivityFeedProps {
  activities: ActivityItem[]
  onRefresh?: () => void
  showFilters?: boolean
  autoRefresh?: boolean
  refreshInterval?: number
  maxHeight?: string
}

const ACTIVITY_CONFIG: Record<
  ActivityType,
  {
    icon: React.ComponentType<{ className?: string }>
    color: string
    bgColor: string
  }
> = {
  edit: {
    icon: Edit,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  comment: {
    icon: MessageSquare,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  share: {
    icon: Share2,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  member_added: {
    icon: UserPlus,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
  },
  member_removed: {
    icon: Trash2,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
  },
  file_added: {
    icon: FileText,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
  },
  file_deleted: {
    icon: Trash2,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
  },
  version_created: {
    icon: GitBranch,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-100',
  },
}

export function ActivityFeed({
  activities,
  onRefresh,
  showFilters = true,
  autoRefresh = false,
  refreshInterval = 30000,
  maxHeight = '600px',
}: ActivityFeedProps) {
  const [selectedTypes, setSelectedTypes] = useState<ActivityType[]>(
    Object.keys(ACTIVITY_CONFIG) as ActivityType[]
  )
  const [isRefreshing, setIsRefreshing] = useState(false)

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      ...(date.getFullYear() !== now.getFullYear() && { year: 'numeric' }),
    })
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await onRefresh?.()
    setTimeout(() => setIsRefreshing(false), 500)
  }

  const toggleActivityType = (type: ActivityType) => {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
  }

  const filteredActivities = activities.filter(activity =>
    selectedTypes.includes(activity.type)
  )

  // Group activities by date
  const groupedActivities = filteredActivities.reduce((groups, activity) => {
    const date = new Date(activity.timestamp).toLocaleDateString()
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(activity)
    return groups
  }, {} as Record<string, ActivityItem[]>)

  const isToday = (dateString: string) => {
    const today = new Date().toLocaleDateString()
    return dateString === today
  }

  const isYesterday = (dateString: string) => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60000).toLocaleDateString()
    return dateString === yesterday
  }

  const formatDateHeader = (dateString: string) => {
    if (isToday(dateString)) return 'Today'
    if (isYesterday(dateString)) return 'Yesterday'
    return dateString
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            <h3 className="font-semibold text-lg">Activity Feed</h3>
            {filteredActivities.length !== activities.length && (
              <Badge variant="secondary">
                {filteredActivities.length} of {activities.length}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {showFilters && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {(Object.entries(ACTIVITY_CONFIG) as [ActivityType, typeof ACTIVITY_CONFIG[ActivityType]][]).map(
                    ([type, config]) => {
                      const Icon = config.icon
                      return (
                        <DropdownMenuCheckboxItem
                          key={type}
                          checked={selectedTypes.includes(type)}
                          onCheckedChange={() => toggleActivityType(type)}
                        >
                          <Icon className={`h-4 w-4 mr-2 ${config.color}`} />
                          {type.replace('_', ' ')}
                        </DropdownMenuCheckboxItem>
                      )
                    }
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            )}
          </div>
        </div>

        {/* Activity List */}
        <ScrollArea style={{ height: maxHeight }} className="pr-4">
          {filteredActivities.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No activities to show</p>
              {selectedTypes.length < Object.keys(ACTIVITY_CONFIG).length && (
                <p className="text-sm mt-2">Try adjusting your filters</p>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedActivities).map(([date, dateActivities]) => (
                <div key={date}>
                  {/* Date Header */}
                  <div className="sticky top-0 bg-background py-2 mb-3">
                    <h4 className="text-sm font-semibold text-muted-foreground">
                      {formatDateHeader(date)}
                    </h4>
                  </div>

                  {/* Activities for this date */}
                  <div className="space-y-3">
                    {dateActivities.map(activity => {
                      const config = ACTIVITY_CONFIG[activity.type]
                      const Icon = config.icon

                      return (
                        <div key={activity.id} className="flex gap-3">
                          {/* Icon */}
                          <div
                            className={`flex-shrink-0 h-10 w-10 rounded-full ${config.bgColor} flex items-center justify-center`}
                          >
                            <Icon className={`h-5 w-5 ${config.color}`} />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <Avatar className="h-5 w-5">
                                    <AvatarImage src={activity.userAvatar} />
                                    <AvatarFallback className="text-xs">
                                      {getInitials(activity.userName)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm font-medium">
                                    {activity.userName}
                                  </span>
                                </div>
                                <p className="text-sm text-foreground">
                                  {activity.description}
                                </p>

                                {/* Metadata */}
                                {activity.metadata && (
                                  <div className="mt-1 text-xs text-muted-foreground">
                                    {activity.metadata.fileName && (
                                      <span>File: {activity.metadata.fileName}</span>
                                    )}
                                    {activity.metadata.commentText && (
                                      <span className="italic">
                                        "{activity.metadata.commentText}"
                                      </span>
                                    )}
                                    {activity.metadata.memberEmail && (
                                      <span>{activity.metadata.memberEmail}</span>
                                    )}
                                    {activity.metadata.versionNumber !== undefined && (
                                      <span>v{activity.metadata.versionNumber}</span>
                                    )}
                                    {activity.metadata.changeCount !== undefined && (
                                      <span>{activity.metadata.changeCount} changes</span>
                                    )}
                                  </div>
                                )}
                              </div>

                              <span className="text-xs text-muted-foreground flex-shrink-0">
                                {formatTimestamp(activity.timestamp)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </Card>
  )
}
