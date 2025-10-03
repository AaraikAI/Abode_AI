"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import useSWR from "swr"
import { GitBranch, GitCommit, GitMerge } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/components/ui/use-toast"
import type { VersionBranch, VersionCommit, VersionPullRequest, VersionEntityType } from "@/lib/data/versioning"

interface VersionControlPanelProps {
  entityType: VersionEntityType
  entityId: string
  snapshot: Record<string, unknown>
}

async function fetcher<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.error || "Versioning request failed")
  }
  return response.json() as Promise<T>
}

export function VersionControlPanel({ entityType, entityId, snapshot }: VersionControlPanelProps) {
  const { toast } = useToast()
  const branchQuery = useSWR<{ branches: VersionBranch[] }>(
    `/api/versioning/branches?entityType=${entityType}&entityId=${entityId}`,
    fetcher
  )
  const prQuery = useSWR<{ pullRequests: VersionPullRequest[] }>(
    `/api/versioning/pull-requests?entityType=${entityType}&entityId=${entityId}`,
    fetcher
  )
  const [activeBranchId, setActiveBranchId] = useState<string | null>(null)
  const commitsQuery = useSWR<{ commits: VersionCommit[] }>(
    activeBranchId ? `/api/versioning/branches/${activeBranchId}/commits` : null,
    fetcher
  )

  const branchData = branchQuery.data?.branches
  const branches = useMemo(() => branchData ?? [], [branchData])
  const activeBranch = useMemo(
    () => branches.find((branch) => branch.id === activeBranchId) ?? branches[0],
    [branches, activeBranchId]
  )

  useEffect(() => {
    if (branches.length && !activeBranchId) {
      setActiveBranchId(branches[0].id)
    }
  }, [branches, activeBranchId])

  const handleCreateBranch = useCallback(
    async (form: HTMLFormElement) => {
      const formData = new FormData(form)
      const name = String(formData.get("branchName") ?? "").trim()
      if (!name) {
        toast({ title: "Branch name required", variant: "destructive" })
        return
      }
      try {
        const response = await fetch(`/api/versioning/branches`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entityType, entityId, name }),
        })
        if (!response.ok) {
          const body = await response.json().catch(() => ({}))
          throw new Error(body.error || "Unable to create branch")
        }
        await branchQuery.mutate()
        form.reset()
        toast({ title: "Branch created", description: name })
      } catch (error) {
        toast({ title: "Create branch failed", description: (error as Error).message, variant: "destructive" })
      }
    },
    [branchQuery, entityId, entityType, toast]
  )

  const handleCommit = useCallback(async () => {
    if (!activeBranch) {
      toast({ title: "Create a branch first", variant: "destructive" })
      return
    }
    try {
      const response = await fetch(`/api/versioning/branches/${activeBranch.id}/commits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ snapshot, message: `Snapshot ${new Date().toISOString()}` }),
      })
      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.error || "Unable to create commit")
      }
      await commitsQuery.mutate()
      toast({ title: "Commit recorded", description: activeBranch.name })
    } catch (error) {
      toast({ title: "Commit failed", description: (error as Error).message, variant: "destructive" })
    }
  }, [activeBranch, commitsQuery, snapshot, toast])

  const handleOpenPullRequest = useCallback(
    async (form: HTMLFormElement) => {
      if (!activeBranch) return
      const formData = new FormData(form)
      const title = String(formData.get("title") ?? "").trim()
      const description = String(formData.get("description") ?? "").trim()
      if (!title) {
        toast({ title: "Title required", variant: "destructive" })
        return
      }
      try {
        const response = await fetch(`/api/versioning/pull-requests`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            entityType,
            entityId,
            sourceBranchId: activeBranch.id,
            targetBranchId: branches.find((branch) => branch.name === "main")?.id ?? activeBranch.id,
            title,
            description,
            diff: { snapshot },
          }),
        })
        if (!response.ok) {
          const body = await response.json().catch(() => ({}))
          throw new Error(body.error || "Unable to open pull request")
        }
        await prQuery.mutate()
        form.reset()
        toast({ title: "Pull request opened", description: title })
      } catch (error) {
        toast({ title: "Pull request failed", description: (error as Error).message, variant: "destructive" })
      }
    },
    [activeBranch, branches, entityId, entityType, prQuery, snapshot, toast]
  )

  return (
    <Card className="border border-border/60 bg-card/80">
      <CardHeader>
        <CardTitle className="text-base">Version control</CardTitle>
        <CardDescription>Branch, commit, and merge scene/pipeline changes.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <GitBranch className="h-4 w-4" /> Branches
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            {branchQuery.isLoading ? (
              <span className="text-muted-foreground">Loading branches…</span>
            ) : (
              branches.map((branch) => (
                <Button
                  key={branch.id}
                  size="sm"
                  variant={activeBranch?.id === branch.id ? "secondary" : "outline"}
                  onClick={() => setActiveBranchId(branch.id)}
                >
                  {branch.name}
                </Button>
              ))
            )}
          </div>
          <form
            className="flex flex-wrap gap-2"
            onSubmit={(event) => {
              event.preventDefault()
              void handleCreateBranch(event.currentTarget)
            }}
          >
            <Input name="branchName" placeholder="feature/new-flow" className="w-full sm:w-auto" />
            <Button type="submit" variant="outline">
              Create branch
            </Button>
          </form>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <GitCommit className="h-4 w-4" /> Commits
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Track snapshots for branch {activeBranch?.name ?? "—"}</p>
            <Button size="sm" variant="outline" onClick={handleCommit} disabled={!activeBranch}>
              Snapshot commit
            </Button>
          </div>
          <ScrollArea className="h-40">
            <div className="space-y-3 text-sm">
              {commitsQuery.data?.commits.map((commit) => (
                <div key={commit.id} className="rounded-xl border border-border/40 bg-background/60 p-3">
                  <div className="text-foreground">{commit.message}</div>
                  <div className="text-xs text-muted-foreground">{new Date(commit.createdAt).toLocaleString()}</div>
                </div>
              ))}
              {!commitsQuery.data?.commits.length ? (
                <p className="text-xs text-muted-foreground">No commits yet for this branch.</p>
              ) : null}
            </div>
          </ScrollArea>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <GitMerge className="h-4 w-4" /> Pull requests
          </div>
          <form
            className="space-y-2"
            onSubmit={(event) => {
              event.preventDefault()
              void handleOpenPullRequest(event.currentTarget)
            }}
          >
            <Input name="title" placeholder="Summarise your merge" />
            <Textarea name="description" rows={2} placeholder="Detail the changes in this request" />
            <Button type="submit" variant="outline">
              Open pull request
            </Button>
          </form>
          <ScrollArea className="h-32">
            <div className="space-y-3 text-sm">
              {prQuery.data?.pullRequests.map((pr) => (
                <div key={pr.id} className="space-y-2 rounded-xl border border-border/40 bg-background/60 p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">{pr.title}</span>
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">{pr.status}</span>
                  </div>
                  {pr.description ? <p className="text-xs text-muted-foreground">{pr.description}</p> : null}
                  {pr.diff ? (
                    <pre className="max-h-32 overflow-auto rounded-lg bg-muted/40 p-2 text-[11px] text-muted-foreground">
                      {JSON.stringify(pr.diff, null, 2)}
                    </pre>
                  ) : null}
                </div>
              ))}
              {!prQuery.data?.pullRequests.length ? (
                <p className="text-xs text-muted-foreground">No pull requests yet.</p>
              ) : null}
            </div>
          </ScrollArea>
        </section>
      </CardContent>
    </Card>
  )
}
