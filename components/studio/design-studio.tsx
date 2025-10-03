"use client"

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react"
import useSWR from "swr"
import {
  Badge,
} from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import SceneCanvas from "@/components/studio/scene-canvas"
import SustainabilityWidget from "@/components/studio/sustainability-widget"
import { VersionControlPanel } from "@/components/versioning/version-control-panel"
import { useCollaboration } from "@/hooks/use-collaboration"
import type { StudioObject, StudioAssetDefinition, StableDiffusionJobPayload } from "@/types/studio"
import { useSession } from "next-auth/react"
import Image from "next/image"
import {
  GaugeCircle,
  Layers3,
  Lightbulb,
  Move3d,
  PlusCircle,
  Redo2,
  Trash2,
  Undo2,
  Wand2,
} from "lucide-react"

interface SceneHistoryPayload {
  branches: Array<{ id: string; name: string; updatedAt: string }>
  activeBranch: { id: string; name: string; updatedAt: string }
  commits: Array<{ id: string; message: string; createdAt: string; snapshot: Record<string, unknown> }>
}

interface SceneSnapshotRecord {
  id: string
  createdAt: string
  scene: StudioObject[]
}

const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.error || `Request failed with ${response.status}`)
  }
  return response.json()
}

const FLOOR_OBJECT: StudioObject = {
  id: "floor",
  assetId: "asset-floor",
  name: "Studio Floor",
  position: [0, 0, 0],
  rotation: [0, 0, 0],
  scale: [20, 1, 20],
  color: "#f1f5f9",
}

export default function DesignStudio() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const collabSurfaceRef = useRef<HTMLDivElement | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [sceneObjects, setSceneObjects] = useState<StudioObject[]>([FLOOR_OBJECT])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [history, setHistory] = useState<{ past: StudioObject[][]; future: StudioObject[][] }>({ past: [], future: [] })
  const lastMutationRef = useRef<{ previous: StudioObject[]; next: StudioObject[] } | null>(null)
  const saveTimer = useRef<NodeJS.Timeout | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, startTransition] = useTransition()
  const [lightingPreset, setLightingPreset] = useState<"studio" | "sunset" | "dawn" | "warehouse">("studio")
  const [environmentMap, setEnvironmentMap] = useState<string | null>(null)
  const [enableXR, setEnableXR] = useState(false)
  const [transformMode, setTransformMode] = useState<"translate" | "rotate" | "scale">("translate")
  const [snapshots, setSnapshots] = useState<SceneSnapshotRecord[]>([])
  const [commitMessage, setCommitMessage] = useState("Scene snapshot")
  const [branchName, setBranchName] = useState("main")
  const [historyData, setHistoryData] = useState<SceneHistoryPayload | null>(null)
  const [diffSelection, setDiffSelection] = useState<string[]>([])
  const [annotationsDraft, setAnnotationsDraft] = useState("")
  const [generationJob, setGenerationJob] = useState<StableDiffusionJobPayload | null>(null)
  const [isUpscaling, setIsUpscaling] = useState(false)

  const orgId = (session?.user?.orgId as string | undefined) ?? "demo-org"
  const userId = session?.user?.id ?? undefined

  const assetsKey = useMemo(() => `/api/studio/assets?q=${encodeURIComponent(debouncedSearch)}`, [debouncedSearch])
  const { data: assetsPayload, isLoading: assetsLoading } = useSWR<{ assets: StudioAssetDefinition[]; categories: string[] }>(
    assetsKey,
    fetcher,
    { keepPreviousData: true }
  )

  const assets = useMemo(() => assetsPayload?.assets ?? [], [assetsPayload])
  const categories = useMemo(() => assetsPayload?.categories ?? [], [assetsPayload])
  const filteredAssets = useMemo(() => {
    if (!categoryFilter) return assets
    return assets.filter((asset) => asset.category === categoryFilter)
  }, [assets, categoryFilter])

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(searchTerm), 300)
    return () => clearTimeout(handle)
  }, [searchTerm])

  const collaboration = useCollaboration({
    orgId,
    workspace: "design-studio",
    targetId: branchName,
    userId,
    userName: session?.user?.name ?? session?.user?.email ?? "Guest",
  })

  const selectedObject = useMemo(() => sceneObjects.find((object) => object.id === selectedId) ?? null, [sceneObjects, selectedId])

  const persistSnapshot = useCallback(
    async (objects: StudioObject[]) => {
      setIsSaving(true)
      try {
        const response = await fetch("/api/studio/scene", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scene: objects }),
        })
        if (!response.ok) {
          const body = await response.json().catch(() => ({}))
          throw new Error(body.error || "Unable to persist scene")
        }
        const payload = (await response.json()) as { snapshot: SceneSnapshotRecord }
        setSnapshots((prev) => [payload.snapshot, ...prev].slice(0, 12))
      } catch (error) {
        toast({ title: "Autosave failed", description: (error as Error).message, variant: "destructive" })
      } finally {
        setIsSaving(false)
      }
    },
    [toast]
  )

  const scheduleSave = useCallback(
    (objects: StudioObject[]) => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => persistSnapshot(objects), 500)
    },
    [persistSnapshot]
  )

  const applySceneUpdate = useCallback(
    (updater: (current: StudioObject[]) => StudioObject[], { recordHistory = true } = {}) => {
      setSceneObjects((current) => {
        const next = updater(current)
        if (next === current) {
          lastMutationRef.current = null
          return current
        }
        lastMutationRef.current = { previous: current, next }
        return next
      })

      if (lastMutationRef.current) {
        const { previous, next } = lastMutationRef.current
        if (recordHistory) {
          setHistory((state) => ({ past: [...state.past, previous], future: [] }))
        }
        scheduleSave(next)
        lastMutationRef.current = null
      }
    },
    [scheduleSave]
  )

  const loadInitialScene = useCallback(async () => {
    try {
      const response = await fetch("/api/studio/scene")
      if (response.ok) {
        const payload = (await response.json()) as { snapshot?: SceneSnapshotRecord | null }
        if (payload.snapshot?.scene && Array.isArray(payload.snapshot.scene)) {
          setSceneObjects(payload.snapshot.scene as StudioObject[])
        }
      }

      const snapshotsResponse = await fetch("/api/studio/scene?limit=12")
      if (snapshotsResponse.ok) {
        const data = (await snapshotsResponse.json()) as { snapshots: SceneSnapshotRecord[] }
        setSnapshots(data.snapshots ?? [])
      }
    } catch (error) {
      console.warn("Unable to load studio scene", error)
    }
  }, [])

  useEffect(() => {
    loadInitialScene()
  }, [loadInitialScene])

  const refreshHistory = useCallback(
    async (targetBranch: string) => {
      try {
        const response = await fetch(`/api/studio/scene/history?branch=${encodeURIComponent(targetBranch)}`)
        if (!response.ok) {
          const body = await response.json().catch(() => ({}))
          throw new Error(body.error || "Failed to load history")
        }
        const payload = (await response.json()) as SceneHistoryPayload
        setHistoryData(payload)
      } catch (error) {
        toast({ title: "History unavailable", description: (error as Error).message, variant: "destructive" })
      }
    },
    [toast]
  )

  useEffect(() => {
    refreshHistory(branchName)
  }, [branchName, refreshHistory])

  const handlePlaceAsset = useCallback(
    (asset: StudioAssetDefinition) => {
      applySceneUpdate((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          assetId: asset.id,
          name: asset.name,
          position: asset.id === "asset-floor" ? [0, 0, 0] : [Math.random() * 4 - 2, 0, Math.random() * 4 - 2],
          rotation: [0, 0, 0],
          scale: asset.scale ? [asset.scale.x ?? 1, asset.scale.y ?? 1, asset.scale.z ?? 1] : [1, 1, 1],
          color: asset.color ?? undefined,
          gltfUrl: asset.gltfUrl ?? undefined,
          environment: asset.environment ?? null,
          metadata: asset.metadata ?? undefined,
        },
      ])
      if (asset.environment) {
        setEnvironmentMap(asset.environment)
      }
    },
    [applySceneUpdate]
  )

  const handleRemoveSelected = useCallback(() => {
    if (!selectedId || selectedId === "floor") return
    applySceneUpdate((current) => current.filter((object) => object.id !== selectedId))
    setSelectedId(null)
  }, [applySceneUpdate, selectedId])

  const handleUndo = useCallback(() => {
    setHistory(({ past, future }) => {
      if (!past.length) return { past, future }
      const previous = past[past.length - 1]
      setSceneObjects(previous)
      scheduleSave(previous)
      return { past: past.slice(0, -1), future: [sceneObjects, ...future] }
    })
  }, [scheduleSave, sceneObjects])

  const handleRedo = useCallback(() => {
    setHistory(({ past, future }) => {
      if (!future.length) return { past, future }
      const [next, ...rest] = future
      setSceneObjects(next)
      scheduleSave(next)
      return { past: [...past, sceneObjects], future: rest }
    })
  }, [scheduleSave, sceneObjects])

  const handleTransformObject = useCallback(
    (id: string, transform: { position: [number, number, number]; rotation: [number, number, number]; scale: [number, number, number] }) => {
      applySceneUpdate((current) =>
        current.map((object) =>
          object.id === id
            ? { ...object, position: transform.position, rotation: transform.rotation, scale: transform.scale }
            : object
        )
      )
    },
    [applySceneUpdate]
  )

  const updateSelectedTransform = useCallback(
    (key: "position" | "rotation" | "scale", axis: number, value: number) => {
      if (!selectedObject) return
      const clone = { ...selectedObject }
      const target = [...(clone[key] as [number, number, number])]
      target[axis] = value
      applySceneUpdate((current) => current.map((object) => (object.id === clone.id ? { ...object, [key]: target as [number, number, number] } : object)))
    },
    [applySceneUpdate, selectedObject]
  )

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!collabSurfaceRef.current) return
      const bounds = collabSurfaceRef.current.getBoundingClientRect()
      if (!bounds.width || !bounds.height) return
      const x = ((event.clientX - bounds.left) / bounds.width) * 100
      const y = ((event.clientY - bounds.top) / bounds.height) * 100
      collaboration.emitCursor({ x, y })
    },
    [collaboration]
  )

  const handleAnnotationSubmit = useCallback(() => {
    if (!annotationsDraft.trim()) return
    collaboration.addAnnotation(annotationsDraft)
    setAnnotationsDraft("")
  }, [annotationsDraft, collaboration])

  const handleCommitScene = useCallback(async () => {
    try {
      const response = await fetch("/api/studio/scene/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scene: sceneObjects, message: commitMessage, branchName, label: commitMessage }),
      })
      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.error || "Commit failed")
      }
      const payload = (await response.json()) as { branch: { name: string }; commit: { id: string } }
      toast({ title: "Scene committed", description: `Revision ${payload.commit.id.slice(0, 8)} saved.` })
      await refreshHistory(branchName)
    } catch (error) {
      toast({ title: "Commit failed", description: (error as Error).message, variant: "destructive" })
    }
  }, [branchName, commitMessage, refreshHistory, sceneObjects, toast])

  const handleGenerate = useCallback(() => {
    if (!commitMessage.trim()) {
      toast({ title: "Prompt required", description: "Describe the scene before generating." })
      return
    }
    startTransition(async () => {
      try {
        const response = await fetch("/api/studio/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: commitMessage, style: lightingPreset }),
        })
        if (!response.ok) {
          const body = await response.json().catch(() => ({}))
          throw new Error(body.error || "Generation failed")
        }
        const payload = (await response.json()) as { job: StableDiffusionJobPayload }
        setGenerationJob(payload.job)
        toast({ title: "Generation queued", description: "Stable Diffusion job submitted." })
      } catch (error) {
        toast({ title: "Generation failed", description: (error as Error).message, variant: "destructive" })
      }
    })
  }, [commitMessage, lightingPreset, toast])

  useEffect(() => {
    if (!generationJob || ["success", "failed"].includes(generationJob.status)) return
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/studio/generate/${generationJob.id}`)
        if (!response.ok) return
        const payload = (await response.json()) as { job: StableDiffusionJobPayload }
        setGenerationJob(payload.job)
      } catch (error) {
        console.warn("Polling failed", error)
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [generationJob])

  const handleUpscale = useCallback(async () => {
    if (!generationJob) return
    setIsUpscaling(true)
    try {
      const response = await fetch(`/api/studio/generate/${generationJob.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "upscale", scale: 4 }),
      })
      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.error || "Upscale failed")
      }
      const payload = (await response.json()) as { job: StableDiffusionJobPayload }
      setGenerationJob(payload.job)
      toast({ title: "Upscaling", description: "ESRGAN upscaler running." })
    } catch (error) {
      toast({ title: "Upscale failed", description: (error as Error).message, variant: "destructive" })
    } finally {
      setIsUpscaling(false)
    }
  }, [generationJob, toast])

  const activeDiff = useMemo(() => {
    if (!historyData) return null
    if (diffSelection.length !== 2) return null
    const [leftId, rightId] = diffSelection
    const left = historyData.commits.find((commit) => commit.id === leftId)
    const right = historyData.commits.find((commit) => commit.id === rightId)
    if (!left || !right) return null
    return { left, right }
  }, [historyData, diffSelection])

  const undoDisabled = history.past.length === 0
  const redoDisabled = history.future.length === 0

  return (
    <div
      ref={collabSurfaceRef}
      onPointerMove={handlePointerMove}
      className="relative flex min-h-[calc(100vh-6rem)] flex-col gap-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card/80 p-4">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-foreground">Design Studio</h1>
          <p className="text-sm text-muted-foreground">
            Vector-searched assets, glTF viewport, and AI render orchestration in one workspace.
          </p>
          <p className="text-xs text-muted-foreground">Autosave: {isSaving ? "saving…" : "idle"}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleUndo} disabled={undoDisabled} className="gap-1">
            <Undo2 className="h-4 w-4" /> Undo
          </Button>
          <Button variant="outline" size="sm" onClick={handleRedo} disabled={redoDisabled} className="gap-1">
            <Redo2 className="h-4 w-4" /> Redo
          </Button>
          <Button variant="outline" size="sm" onClick={handleRemoveSelected} disabled={!selectedId || selectedId === "floor"} className="gap-1">
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      {collaboration.error ? (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Collaboration offline: {collaboration.error}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[3fr_1.25fr]">
        <Card className="border border-border/60 bg-card/80">
          <CardHeader>
            <CardTitle className="text-base">3D viewport</CardTitle>
            <CardDescription>HDRI-lit Three.js canvas with optional WebXR preview.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative aspect-video overflow-hidden rounded-xl border border-border/40 bg-background">
              <Suspense fallback={<div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading scene…</div>}>
                <SceneCanvas
                  objects={sceneObjects}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  lightingPreset={lightingPreset}
                  environmentMap={environmentMap}
                  enableXR={enableXR}
                  allowTransform
                  transformMode={transformMode}
                  onTransform={handleTransformObject}
                />
              </Suspense>
              <div className="pointer-events-none absolute inset-0">
                {collaboration.cursors.map((cursor) => (
                  <span
                    key={cursor.userId}
                    className="pointer-events-none absolute -translate-x-1/2 -translate-y-4 text-xs font-semibold"
                    style={{ left: `${cursor.x}%`, top: `${cursor.y}%`, color: cursor.color }}
                  >
                    ● {cursor.userName}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid gap-4 rounded-xl border border-border/50 bg-background/60 p-4 md:grid-cols-2">
              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                  <Move3d className="h-3 w-3" /> Transform mode
                </Label>
                <div className="flex flex-wrap items-center gap-2">
                  {(["translate", "rotate", "scale"] as const).map((mode) => (
                    <Button
                      key={mode}
                      variant={transformMode === mode ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setTransformMode(mode)}
                    >
                      {mode}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                  <Lightbulb className="h-3 w-3" /> Lighting preset
                </Label>
                <Select value={lightingPreset} onValueChange={(value: typeof lightingPreset) => setLightingPreset(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Lighting" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="studio">Studio</SelectItem>
                    <SelectItem value="sunset">Sunset</SelectItem>
                    <SelectItem value="dawn">Dawn</SelectItem>
                    <SelectItem value="warehouse">Warehouse</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Switch checked={enableXR} onCheckedChange={setEnableXR} id="studio-xr" />
                  <Label htmlFor="studio-xr" className="font-medium">WebXR preview</Label>
                </div>
              </div>
            </div>

            {selectedObject ? (
              <div className="space-y-4 rounded-xl border border-border/50 bg-background/60 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Inspector – {selectedObject.name}</h3>
                    <p className="text-xs text-muted-foreground">Fine-tune position, rotation, and scale.</p>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  {(["X", "Y", "Z"] as const).map((axisLabel, index) => (
                    <div key={`pos-${axisLabel}`} className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Position {axisLabel}</Label>
                      <Input
                        type="number"
                        value={Number(selectedObject.position[index].toFixed(2))}
                        onChange={(event) => updateSelectedTransform("position", index, Number(event.target.value))}
                      />
                    </div>
                  ))}
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  {(["X", "Y", "Z"] as const).map((axisLabel, index) => (
                    <div key={`rot-${axisLabel}`} className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Rotation {axisLabel} (deg)</Label>
                      <Input
                        type="number"
                        value={Number((selectedObject.rotation[index] * (180 / Math.PI)).toFixed(1))}
                        onChange={(event) => updateSelectedTransform("rotation", index, Number(event.target.value) * (Math.PI / 180))}
                      />
                    </div>
                  ))}
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  {(["X", "Y", "Z"] as const).map((axisLabel, index) => (
                    <div key={`scale-${axisLabel}`} className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Scale {axisLabel}</Label>
                      <Slider
                        value={[selectedObject.scale[index]]}
                        min={0.1}
                        max={5}
                        step={0.05}
                        onValueChange={(value) => updateSelectedTransform("scale", index, value[0] ?? 1)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card className="border border-border/60 bg-card/80">
            <CardHeader>
              <CardTitle className="text-base">Asset library</CardTitle>
              <CardDescription>Semantic vector search across the model library.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search assets (e.g. Scandinavian sofa)"
              />
              <ScrollArea className="h-8">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge
                    variant={categoryFilter ? "outline" : "secondary"}
                    className="cursor-pointer"
                    onClick={() => setCategoryFilter(null)}
                  >
                    All
                  </Badge>
                  {categories.map((category) => (
                    <Badge
                      key={category}
                      variant={categoryFilter === category ? "secondary" : "outline"}
                      className="cursor-pointer"
                      onClick={() => setCategoryFilter(category)}
                    >
                      {category}
                    </Badge>
                  ))}
                </div>
              </ScrollArea>
              <div className="grid gap-3 sm:grid-cols-2">
                {filteredAssets.map((asset) => (
                  <button
                    key={asset.id}
                    type="button"
                    onClick={() => handlePlaceAsset(asset)}
                    className="rounded-xl border border-border/40 bg-background/60 p-3 text-left transition hover:border-primary/60 hover:shadow"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 flex-shrink-0 rounded-lg bg-muted/50 p-2">
                        <Layers3 className="h-full w-full text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{asset.name}</p>
                        <p className="text-xs text-muted-foreground">{asset.category}</p>
                      </div>
                    </div>
                    {asset.description ? (
                      <p className="mt-2 text-xs text-muted-foreground">{asset.description}</p>
                    ) : null}
                  </button>
                ))}
                {assetsLoading ? (
                  <div className="rounded-xl border border-border/40 bg-background/60 p-4 text-sm text-muted-foreground">
                    Fetching assets…
                  </div>
                ) : null}
                {!assetsLoading && !filteredAssets.length ? (
                  <div className="rounded-xl border border-border/40 bg-background/60 p-4 text-sm text-muted-foreground">
                    No assets found for “{searchTerm}”.
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/60 bg-card/80">
            <CardHeader>
              <CardTitle className="text-base">Scene history & commits</CardTitle>
              <CardDescription>Persist undo stack into Supabase and branch your explorations.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Select value={branchName} onValueChange={(value) => setBranchName(value)}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="main">main</SelectItem>
                    {historyData?.branches
                      ?.filter((branch) => branch.name !== "main")
                      .map((branch) => (
                        <SelectItem key={branch.id} value={branch.name}>
                          {branch.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Button size="sm" variant="outline" onClick={() => refreshHistory(branchName)}>Refresh</Button>
              </div>
              <div className="flex items-center gap-2">
                <Input value={commitMessage} onChange={(event) => setCommitMessage(event.target.value)} placeholder="Snapshot label" />
                <Button size="sm" onClick={handleCommitScene} className="gap-1">
                  <PlusCircle className="h-4 w-4" /> Commit snapshot
                </Button>
              </div>
              <ScrollArea className="h-40 rounded-lg border border-border/40">
                <div className="space-y-2 p-3 text-xs text-muted-foreground">
                  {historyData?.commits?.map((commit) => (
                    <label key={commit.id} className="flex items-start gap-2 rounded-lg border border-border/30 bg-background/60 p-3">
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={diffSelection.includes(commit.id)}
                        onChange={(event) => {
                          setDiffSelection((current) => {
                            if (event.target.checked) {
                              if (current.length >= 2) return [current[1], commit.id]
                              return [...current, commit.id]
                            }
                            return current.filter((value) => value !== commit.id)
                          })
                        }}
                      />
                      <div>
                        <p className="font-semibold text-foreground">{commit.message}</p>
                        <p>{new Date(commit.createdAt).toLocaleString()}</p>
                      </div>
                    </label>
                  ))}
                  {!historyData?.commits?.length ? <p>No commits recorded yet.</p> : null}
                </div>
              </ScrollArea>

              {activeDiff ? (
                <div className="grid gap-3 rounded-xl border border-border/40 bg-background/60 p-4 lg:grid-cols-2">
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground">{activeDiff.left.message}</h4>
                    <pre className="mt-2 max-h-48 overflow-auto rounded-md bg-muted/40 p-2 text-[11px] text-muted-foreground">
                      {JSON.stringify(activeDiff.left.snapshot.scene, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground">{activeDiff.right.message}</h4>
                    <pre className="mt-2 max-h-48 overflow-auto rounded-md bg-muted/40 p-2 text-[11px] text-muted-foreground">
                      {JSON.stringify(activeDiff.right.snapshot.scene, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : null}

              <VersionControlPanel entityType="scene" entityId={branchName} snapshot={{ sceneObjects }} />
            </CardContent>
          </Card>

          <Card className="border border-border/60 bg-card/80">
            <CardHeader>
              <CardTitle className="text-base">Generative assist</CardTitle>
              <CardDescription>Stable Diffusion + ESRGAN with CodeCarbon telemetry.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={commitMessage}
                onChange={(event) => setCommitMessage(event.target.value)}
                rows={3}
                placeholder="Prompt for Stable Diffusion (e.g., 'sunlit atrium with biophilic lounge')"
              />
              <div className="flex items-center gap-2">
                <Button className="gap-2" onClick={handleGenerate} disabled={isLoading}>
                  <Wand2 className="h-4 w-4" /> {isLoading ? "Submitting…" : "Generate"}
                </Button>
                {generationJob && !["success", "failed"].includes(generationJob.status) ? (
                  <span className="text-xs text-muted-foreground">Status: {generationJob.status}</span>
                ) : null}
              </div>
              {generationJob ? (
                <div className="space-y-3 rounded-xl border border-border/40 bg-background/60 p-4 text-xs text-muted-foreground">
                  <div className="flex items-center justify-between text-sm font-semibold text-foreground">
                    <span>Job {generationJob.id.slice(0, 8)}</span>
                    <span>{generationJob.status}</span>
                  </div>
                  <Progress value={generationJob.status === "success" ? 100 : generationJob.status === "failed" ? 0 : 60} />
                  <div className="grid gap-3 sm:grid-cols-2">
                    {generationJob.previewUrl ? (
                      <Image
                        src={generationJob.previewUrl}
                        alt={generationJob.prompt}
                        width={320}
                        height={240}
                        className="h-32 w-full rounded-md object-cover"
                      />
                    ) : null}
                    {generationJob.outputUrl ? (
                      <Image
                        src={generationJob.outputUrl}
                        alt={generationJob.prompt}
                        width={320}
                        height={240}
                        className="h-32 w-full rounded-md object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant="outline">CO₂ {generationJob.co2Kg?.toFixed(4) ?? "–"} kg</Badge>
                    <Badge variant="outline">Energy {generationJob.energyKwh?.toFixed(3) ?? "–"} kWh</Badge>
                    <Badge variant="outline">Duration {generationJob.durationSeconds ?? "–"} s</Badge>
                    {generationJob.status === "success" ? (
                      <Button size="sm" variant="outline" disabled={isUpscaling} onClick={handleUpscale} className="gap-1">
                        <GaugeCircle className="h-4 w-4" /> {isUpscaling ? "Upscaling…" : "ESRGAN 4×"}
                      </Button>
                    ) : null}
                  </div>
                  {generationJob.upscaledUrl ? (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground">Upscaled</p>
                      <Image
                        src={generationJob.upscaledUrl}
                        alt="Upscaled render"
                        width={640}
                        height={360}
                        className="h-36 w-full rounded-md object-cover"
                      />
                    </div>
                  ) : null}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="border border-border/60 bg-card/80">
            <CardHeader>
              <CardTitle className="text-base">Collaborative annotations</CardTitle>
              <CardDescription>Comments and markups sync instantly via Socket.io.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={annotationsDraft}
                onChange={(event) => setAnnotationsDraft(event.target.value)}
                placeholder="Leave feedback for collaborators"
                rows={3}
              />
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={handleAnnotationSubmit} className="gap-1">
                  <PlusCircle className="h-4 w-4" /> Add note
                </Button>
                <span className="text-xs text-muted-foreground">{collaboration.annotations.length} total annotations</span>
              </div>
              <ScrollArea className="h-32">
                <div className="space-y-2 text-xs text-muted-foreground">
                  {collaboration.annotations.map((annotation) => (
                    <div key={annotation.id} className="rounded-lg border border-border/40 bg-background/60 p-3">
                      <p className="font-semibold text-foreground">{annotation.authorName ?? annotation.authorId ?? "Anon"}</p>
                      <p>{annotation.body}</p>
                      <p>{new Date(annotation.createdAt).toLocaleString()}</p>
                    </div>
                  ))}
                  {!collaboration.annotations.length ? <p>No annotations yet.</p> : null}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <SustainabilityWidget />
        </div>
      </div>

      <div className="space-y-2 rounded-2xl border border-border/50 bg-card/80 p-4 text-xs text-muted-foreground">
        <p className="font-semibold text-foreground">Snapshots</p>
        <ScrollArea className="h-20">
          <div className="flex gap-2">
            {snapshots.map((snapshot) => (
              <div key={snapshot.id} className="min-w-[140px] rounded-lg border border-border/40 bg-background/60 p-2">
                <p className="text-xs font-semibold text-foreground">{snapshot.id.slice(0, 8)}</p>
                <p>{new Date(snapshot.createdAt).toLocaleString()}</p>
              </div>
            ))}
            {!snapshots.length ? <p>No snapshots captured yet. Edits will autosave.</p> : null}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
