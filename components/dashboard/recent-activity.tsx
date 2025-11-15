"use client"

import { useMemo, useCallback } from "react"
import useSWR from "swr"
import Link from "next/link"
import {
  Activity,
  FileEdit,
  Upload,
  Download,
  Share2,
  Trash2,
  UserPlus,
  MessageSquare,
  GitBranch,
  Star,
  Eye,
  Settings,
  Clock,
} from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"

export interface ActivityEvent {
  id: string
  type:
    | "project_created"
    | "project_updated"
    | "project_deleted"
    | "file_uploaded"
    | "file_downloaded"
    | "project_shared"
    | "user_invited"
    | "comment_added"
    | "version_created"
    | "favorite_added"
    | "project_viewed"
    | "settings_changed"
  userId: string
  userName: string
  userAvatar?: string
  targetId?: string
  targetName?: string
  metadata?: Record<string, unknown>
  timestamp: string
  description?: string
}

interface RecentActivityProps {
  orgId?: string
  userId?: string
  limit?: number
  showFilters?: boolean
  autoRefresh?: boolean
  refreshInterval?: number
}

const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.error || `Request failed with ${response.status}`)
  }
  return response.json()
}

const getActivityIcon = (type: ActivityEvent["type"]) => {
  const iconClass = "h-4 w-4"
  switch (type) {
    case "project_created":
    case "project_updated":
      return <FileEdit className={iconClass} />
    case "project_deleted":
      return <Trash2 className={iconClass} />
    case "file_uploaded":
      return <Upload className={iconClass} />
    case "file_downloaded":
      return <Download className={iconClass} />
    case "project_shared":
      return <Share2 className={iconClass} />
    case "user_invited":
      return <UserPlus className={iconClass} />
    case "comment_added":
      return <MessageSquare className={iconClass} />
    case "version_created":
      return <GitBranch className={iconClass} />
    case "favorite_added":
      return <Star className={iconClass} />
    case "project_viewed":
      return <Eye className={iconClass} />
    case "settings_changed":
      return <Settings className={iconClass} />
    default:
      return <Activity className={iconClass} />
  }
}

const getActivityColor = (type: ActivityEvent["type"]) => {
  switch (type) {
    case "project_created":
      return "text-green-500"
    case "project_deleted":
      return "text-red-500"
    case "file_uploaded":
      return "text-blue-500"
    case "project_shared":
      return "text-purple-500"
    case "user_invited":
      return "text-indigo-500"
    case "comment_added":
      return "text-yellow-500"
    case "version_created":
      return "text-cyan-500"
    case "favorite_added":
      return "text-yellow-400"
    default:
      return "text-muted-foreground"
  }
}

const getActivityDescription = (event: ActivityEvent): string => {
  if (event.description) return event.description

  const target = event.targetName ? `"${event.targetName}"` : "a project"

  switch (event.type) {
    case "project_created":
      return `created project ${target}`
    case "project_updated":
      return `updated project ${target}`
    case "project_deleted":
      return `deleted project ${target}`
    case "file_uploaded":
      return `uploaded a file to ${target}`
    case "file_downloaded":
      return `downloaded ${target}`
    case "project_shared":
      return `shared ${target}`
    case "user_invited":
      return `invited ${event.targetName ?? "a user"} to the team`
    case "comment_added":
      return `commented on ${target}`
    case "version_created":
      return `created a new version of ${target}`
    case "favorite_added":
      return `favorited ${target}`
    case "project_viewed":
      return `viewed ${target}`
    case "settings_changed":
      return `updated settings`
    default:
      return `performed an action on ${target}`
  }
}

const formatRelativeTime = (timestamp: string): string => {
  const now = Date.now()
  const time = new Date(timestamp).getTime()
  const diff = now - time

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 7) {
    return new Date(timestamp).toLocaleDateString()
  }
  if (days > 0) {
    return `${days}d ago`
  }
  if (hours > 0) {
    return `${hours}h ago`
  }
  if (minutes > 0) {
    return `${minutes}m ago`
  }
  return "just now"
}

export function RecentActivity({
  orgId = "demo-org",
  userId,
  limit = 50,
  showFilters = false,
  autoRefresh = true,
  refreshInterval = 30000,
}: RecentActivityProps) {
  const apiUrl = useMemo(() => {
    const params = new URLSearchParams()
    if (orgId) params.set("orgId", orgId)
    if (userId) params.set("userId", userId)
    if (limit) params.set("limit", limit.toString())
    return `/api/activity?${params.toString()}`
  }, [orgId, userId, limit])

  const { data, isLoading, mutate } = useSWR<{ events: ActivityEvent[] }>(
    apiUrl,
    fetcher,
    {
      refreshInterval: autoRefresh ? refreshInterval : undefined,
      keepPreviousData: true,
    }
  )

  const events = useMemo(() => data?.events ?? [], [data])

  const handleRefresh = useCallback(() => {
    mutate()
  }, [mutate])

  if (isLoading) {
    return (
      <Card className="border border-border/60 bg-card/80">
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
          <CardDescription>Loading activity feed...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border border-border/60 bg-card/80">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Recent Activity</CardTitle>
            <CardDescription>Latest actions and updates across your workspace</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={handleRefresh} className="gap-2">
            <Activity className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-dashed border-border/60 bg-muted/20">
            <div className="text-center">
              <Activity className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-sm font-medium text-foreground">No recent activity</p>
              <p className="text-xs text-muted-foreground">Activity will appear here as you work</p>
            </div>
          </div>
        ) : (
          <ScrollArea className="h-[500px]">
            <div className="space-y-4">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start gap-3 rounded-lg border border-border/40 bg-background/60 p-3 transition-colors hover:bg-background/80"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={event.userAvatar} alt={event.userName} />
                    <AvatarFallback>
                      {event.userName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-foreground">
                        <span className="font-semibold">{event.userName}</span>{" "}
                        <span className="text-muted-foreground">{getActivityDescription(event)}</span>
                      </p>
                      <div className={`rounded-full bg-muted/50 p-1.5 ${getActivityColor(event.type)}`}>
                        {getActivityIcon(event.type)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatRelativeTime(event.timestamp)}
                      {event.targetId && event.type.includes("project") && (
                        <>
                          <span>•</span>
                          <Link
                            href={`/projects/${event.targetId}`}
                            className="hover:text-foreground hover:underline"
                          >
                            View project
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
