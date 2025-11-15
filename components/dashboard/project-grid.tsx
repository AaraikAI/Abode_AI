"use client"

import { useCallback, useMemo, useState } from "react"
import useSWR from "swr"
import Image from "next/image"
import Link from "next/link"
import {
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Share2,
  Download,
  Star,
  Clock,
  Users,
  Folder,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"

export interface Project {
  id: string
  name: string
  description?: string
  thumbnail?: string
  status: "active" | "archived" | "draft"
  lastModified: string
  createdAt: string
  owner: {
    id: string
    name: string
    avatar?: string
  }
  collaborators?: Array<{ id: string; name: string; avatar?: string }>
  stats: {
    views: number
    downloads: number
    comments: number
  }
  isFavorite?: boolean
  tags?: string[]
}

interface ProjectGridProps {
  orgId?: string
  filter?: "all" | "active" | "archived" | "favorites"
  searchTerm?: string
  sortBy?: "name" | "modified" | "created"
}

const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.error || `Request failed with ${response.status}`)
  }
  return response.json()
}

export function ProjectGrid({
  orgId = "demo-org",
  filter = "all",
  searchTerm = "",
  sortBy = "modified",
}: ProjectGridProps) {
  const { toast } = useToast()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const apiUrl = useMemo(() => {
    const params = new URLSearchParams()
    if (orgId) params.set("orgId", orgId)
    if (filter && filter !== "all") params.set("filter", filter)
    if (searchTerm) params.set("q", searchTerm)
    if (sortBy) params.set("sort", sortBy)
    return `/api/projects?${params.toString()}`
  }, [orgId, filter, searchTerm, sortBy])

  const { data, isLoading, mutate } = useSWR<{ projects: Project[] }>(apiUrl, fetcher, {
    keepPreviousData: true,
  })

  const projects = useMemo(() => data?.projects ?? [], [data])

  const handleToggleFavorite = useCallback(
    async (projectId: string, isFavorite: boolean) => {
      try {
        const response = await fetch(`/api/projects/${projectId}/favorite`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ favorite: !isFavorite }),
        })
        if (!response.ok) {
          const body = await response.json().catch(() => ({}))
          throw new Error(body.error || "Failed to toggle favorite")
        }
        await mutate()
        toast({ title: isFavorite ? "Removed from favorites" : "Added to favorites" })
      } catch (error) {
        toast({
          title: "Failed to update favorite",
          description: (error as Error).message,
          variant: "destructive",
        })
      }
    },
    [mutate, toast]
  )

  const handleDelete = useCallback(
    async (projectId: string) => {
      setDeletingId(projectId)
      try {
        const response = await fetch(`/api/projects/${projectId}`, {
          method: "DELETE",
        })
        if (!response.ok) {
          const body = await response.json().catch(() => ({}))
          throw new Error(body.error || "Failed to delete project")
        }
        await mutate()
        toast({ title: "Project deleted successfully" })
      } catch (error) {
        toast({
          title: "Failed to delete project",
          description: (error as Error).message,
          variant: "destructive",
        })
      } finally {
        setDeletingId(null)
      }
    },
    [mutate, toast]
  )

  const handleShare = useCallback(
    async (projectId: string) => {
      try {
        const response = await fetch(`/api/projects/${projectId}/share`, {
          method: "POST",
        })
        if (!response.ok) {
          const body = await response.json().catch(() => ({}))
          throw new Error(body.error || "Failed to generate share link")
        }
        const { shareUrl } = await response.json()
        await navigator.clipboard.writeText(shareUrl)
        toast({ title: "Share link copied to clipboard" })
      } catch (error) {
        toast({
          title: "Failed to share project",
          description: (error as Error).message,
          variant: "destructive",
        })
      }
    },
    [toast]
  )

  const handleDownload = useCallback(
    async (projectId: string) => {
      try {
        const response = await fetch(`/api/projects/${projectId}/export`, {
          method: "POST",
        })
        if (!response.ok) {
          const body = await response.json().catch(() => ({}))
          throw new Error(body.error || "Failed to export project")
        }
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `project-${projectId}.zip`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        toast({ title: "Project downloaded successfully" })
      } catch (error) {
        toast({
          title: "Failed to download project",
          description: (error as Error).message,
          variant: "destructive",
        })
      }
    },
    [toast]
  )

  if (isLoading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="border border-border/60 bg-card/80">
            <CardHeader className="space-y-2">
              <Skeleton className="h-40 w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!projects.length) {
    return (
      <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-dashed border-border/60 bg-card/40">
        <div className="text-center">
          <Folder className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold text-foreground">No projects found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {searchTerm ? `No projects match "${searchTerm}"` : "Get started by creating your first project"}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {projects.map((project) => (
        <Card
          key={project.id}
          className="group relative border border-border/60 bg-card/80 transition-all hover:border-primary/40 hover:shadow-lg"
        >
          <CardHeader className="space-y-3 pb-3">
            <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
              {project.thumbnail ? (
                <Image
                  src={project.thumbnail}
                  alt={project.name}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Folder className="h-12 w-12 text-muted-foreground/50" />
                </div>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2 h-8 w-8 bg-background/80 backdrop-blur-sm"
                onClick={() => handleToggleFavorite(project.id, Boolean(project.isFavorite))}
              >
                <Star
                  className={`h-4 w-4 ${project.isFavorite ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
                />
              </Button>
            </div>
            <div className="space-y-1">
              <div className="flex items-start justify-between gap-2">
                <h3 className="line-clamp-1 text-base font-semibold text-foreground">{project.name}</h3>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/projects/${project.id}`} className="gap-2">
                        <Eye className="h-4 w-4" /> View
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/projects/${project.id}/edit`} className="gap-2">
                        <Edit className="h-4 w-4" /> Edit
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleShare(project.id)} className="gap-2">
                      <Share2 className="h-4 w-4" /> Share
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDownload(project.id)} className="gap-2">
                      <Download className="h-4 w-4" /> Download
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleDelete(project.id)}
                      disabled={deletingId === project.id}
                      className="gap-2 text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              {project.description && (
                <p className="line-clamp-2 text-xs text-muted-foreground">{project.description}</p>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pb-3">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {project.stats.views}
              </div>
              <div className="flex items-center gap-1">
                <Download className="h-3 w-3" />
                {project.stats.downloads}
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {project.collaborators?.length ?? 0}
              </div>
            </div>
            {project.tags && project.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {project.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-[10px]">
                    {tag}
                  </Badge>
                ))}
                {project.tags.length > 3 && (
                  <Badge variant="outline" className="text-[10px]">
                    +{project.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex items-center justify-between border-t border-border/40 pt-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(project.lastModified).toLocaleDateString()}
            </div>
            <Badge variant={project.status === "active" ? "default" : "secondary"}>{project.status}</Badge>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
