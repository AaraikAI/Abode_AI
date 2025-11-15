'use client'

import { useState } from 'react'
import { Users, Circle, Monitor, Smartphone, Tablet } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ScrollArea } from '@/components/ui/scroll-area'

export type UserStatus = 'active' | 'idle' | 'offline'
export type DeviceType = 'desktop' | 'mobile' | 'tablet'

export interface ActiveUser {
  id: string
  name: string
  email?: string
  avatar?: string
  status: UserStatus
  lastActive?: string
  currentPage?: string
  deviceType?: DeviceType
  color?: string
}

interface ActiveUsersProps {
  users: ActiveUser[]
  currentUserId?: string
  maxVisibleAvatars?: number
  showDeviceType?: boolean
  onUserClick?: (userId: string) => void
}

const STATUS_COLORS: Record<UserStatus, string> = {
  active: 'bg-green-500',
  idle: 'bg-yellow-500',
  offline: 'bg-gray-400',
}

const STATUS_LABELS: Record<UserStatus, string> = {
  active: 'Active',
  idle: 'Idle',
  offline: 'Offline',
}

export function ActiveUsers({
  users,
  currentUserId,
  maxVisibleAvatars = 5,
  showDeviceType = true,
  onUserClick,
}: ActiveUsersProps) {
  const [showAll, setShowAll] = useState(false)

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getDeviceIcon = (deviceType?: DeviceType) => {
    switch (deviceType) {
      case 'desktop':
        return <Monitor className="h-3 w-3" />
      case 'mobile':
        return <Smartphone className="h-3 w-3" />
      case 'tablet':
        return <Tablet className="h-3 w-3" />
      default:
        return null
    }
  }

  const formatLastActive = (lastActive?: string) => {
    if (!lastActive) return 'Unknown'

    const date = new Date(lastActive)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  // Sort users: active first, then idle, then offline
  const sortedUsers = [...users].sort((a, b) => {
    const statusOrder = { active: 0, idle: 1, offline: 2 }
    return statusOrder[a.status] - statusOrder[b.status]
  })

  const visibleUsers = showAll ? sortedUsers : sortedUsers.slice(0, maxVisibleAvatars)
  const hiddenCount = sortedUsers.length - maxVisibleAvatars
  const activeCount = users.filter(u => u.status === 'active').length

  return (
    <Card className="p-4">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <h3 className="font-semibold">Active Users</h3>
            <Badge variant="secondary" className="ml-1">
              {activeCount} online
            </Badge>
          </div>
        </div>

        {/* Compact Avatar View */}
        {!showAll && (
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <div className="flex -space-x-2">
                {visibleUsers.map(user => (
                  <Tooltip key={user.id}>
                    <TooltipTrigger asChild>
                      <div
                        className="relative cursor-pointer hover:z-10 transition-transform hover:scale-110"
                        onClick={() => onUserClick?.(user.id)}
                      >
                        <Avatar
                          className="h-10 w-10 border-2 border-background"
                          style={{ borderColor: user.color }}
                        >
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback style={{ backgroundColor: user.color }}>
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div
                          className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background ${
                            STATUS_COLORS[user.status]
                          }`}
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="space-y-1">
                        <p className="font-medium">{user.name}</p>
                        {user.email && (
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        )}
                        <div className="flex items-center gap-2 text-xs">
                          <Circle
                            className={`h-2 w-2 fill-current ${STATUS_COLORS[user.status]}`}
                          />
                          <span>{STATUS_LABELS[user.status]}</span>
                        </div>
                        {user.currentPage && (
                          <p className="text-xs text-muted-foreground">
                            Viewing: {user.currentPage}
                          </p>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </TooltipProvider>

            {hiddenCount > 0 && (
              <button
                onClick={() => setShowAll(true)}
                className="flex items-center justify-center h-10 w-10 rounded-full bg-muted text-sm font-medium hover:bg-muted/80 transition-colors"
              >
                +{hiddenCount}
              </button>
            )}
          </div>
        )}

        {/* Expanded List View */}
        {showAll && (
          <>
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-3">
                {sortedUsers.map(user => {
                  const isCurrentUser = user.id === currentUserId

                  return (
                    <div
                      key={user.id}
                      className={`flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors ${
                        onUserClick ? 'cursor-pointer' : ''
                      }`}
                      onClick={() => onUserClick?.(user.id)}
                    >
                      <div className="relative">
                        <Avatar className="h-10 w-10" style={{ borderColor: user.color }}>
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback style={{ backgroundColor: user.color }}>
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div
                          className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background ${
                            STATUS_COLORS[user.status]
                          }`}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">
                            {user.name}
                            {isCurrentUser && (
                              <span className="text-muted-foreground ml-2">(You)</span>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{STATUS_LABELS[user.status]}</span>
                          {user.status !== 'active' && user.lastActive && (
                            <>
                              <span>•</span>
                              <span>{formatLastActive(user.lastActive)}</span>
                            </>
                          )}
                          {showDeviceType && user.deviceType && (
                            <>
                              <span>•</span>
                              {getDeviceIcon(user.deviceType)}
                            </>
                          )}
                        </div>
                        {user.currentPage && user.status === 'active' && (
                          <p className="text-xs text-muted-foreground truncate mt-1">
                            {user.currentPage}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>

            <button
              onClick={() => setShowAll(false)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors w-full text-center pt-2 border-t"
            >
              Show less
            </button>
          </>
        )}
      </div>
    </Card>
  )
}
