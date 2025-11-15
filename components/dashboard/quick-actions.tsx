"use client"

import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Plus,
  Upload,
  FileText,
  Users,
  Settings,
  Zap,
  FolderOpen,
  Sparkles,
  Database,
  Share2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface QuickActionsProps {
  onProjectCreated?: (projectId: string) => void
  onFileUploaded?: (fileId: string) => void
  showTemplates?: boolean
  customActions?: Array<{
    id: string
    label: string
    icon: React.ReactNode
    onClick: () => void
  }>
}

export function QuickActions({
  onProjectCreated,
  onFileUploaded,
  showTemplates = true,
  customActions = [],
}: QuickActionsProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isCreatingProject, setIsCreatingProject] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false)
  const [showUploadDialog, setShowUploadDialog] = useState(false)

  const [projectName, setProjectName] = useState("")
  const [projectDescription, setProjectDescription] = useState("")
  const [projectTemplate, setProjectTemplate] = useState<string>("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleCreateProject = useCallback(async () => {
    if (!projectName.trim()) {
      toast({ title: "Project name required", variant: "destructive" })
      return
    }

    setIsCreatingProject(true)
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: projectName,
          description: projectDescription,
          template: projectTemplate || undefined,
        }),
      })

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.error || "Failed to create project")
      }

      const { project } = await response.json()
      toast({ title: "Project created successfully" })
      setShowNewProjectDialog(false)
      setProjectName("")
      setProjectDescription("")
      setProjectTemplate("")
      onProjectCreated?.(project.id)
      router.push(`/projects/${project.id}`)
    } catch (error) {
      toast({
        title: "Failed to create project",
        description: (error as Error).message,
        variant: "destructive",
      })
    } finally {
      setIsCreatingProject(false)
    }
  }, [projectName, projectDescription, projectTemplate, toast, onProjectCreated, router])

  const handleFileUpload = useCallback(async () => {
    if (!selectedFile) {
      toast({ title: "Please select a file", variant: "destructive" })
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", selectedFile)

      const response = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.error || "Failed to upload file")
      }

      const { file } = await response.json()
      toast({ title: "File uploaded successfully" })
      setShowUploadDialog(false)
      setSelectedFile(null)
      onFileUploaded?.(file.id)
    } catch (error) {
      toast({
        title: "Failed to upload file",
        description: (error as Error).message,
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }, [selectedFile, toast, onFileUploaded])

  const quickActionButtons = [
    {
      id: "new-project",
      label: "New Project",
      description: "Start from scratch",
      icon: <Plus className="h-5 w-5" />,
      onClick: () => setShowNewProjectDialog(true),
      variant: "default" as const,
    },
    {
      id: "upload",
      label: "Upload File",
      description: "Import designs",
      icon: <Upload className="h-5 w-5" />,
      onClick: () => setShowUploadDialog(true),
      variant: "outline" as const,
    },
    ...(showTemplates
      ? [
          {
            id: "templates",
            label: "Templates",
            description: "Use starter",
            icon: <FileText className="h-5 w-5" />,
            onClick: () => router.push("/templates"),
            variant: "outline" as const,
          },
        ]
      : []),
    {
      id: "collaborate",
      label: "Invite Team",
      description: "Add members",
      icon: <Users className="h-5 w-5" />,
      onClick: () => router.push("/team/invite"),
      variant: "outline" as const,
    },
    {
      id: "ai-generate",
      label: "AI Generate",
      description: "Create with AI",
      icon: <Sparkles className="h-5 w-5" />,
      onClick: () => router.push("/studio"),
      variant: "outline" as const,
    },
    {
      id: "import",
      label: "Import Data",
      description: "BIM, CAD files",
      icon: <Database className="h-5 w-5" />,
      onClick: () => router.push("/import"),
      variant: "outline" as const,
    },
  ]

  return (
    <>
      <Card className="border border-border/60 bg-card/80">
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
          <CardDescription>Get started with common tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {quickActionButtons.map((action) => (
              <Button
                key={action.id}
                variant={action.variant}
                onClick={action.onClick}
                className="h-auto flex-col gap-2 py-4"
              >
                {action.icon}
                <div className="text-center">
                  <div className="text-xs font-semibold">{action.label}</div>
                  <div className="text-[10px] font-normal opacity-70">{action.description}</div>
                </div>
              </Button>
            ))}
            {customActions.map((action) => (
              <Button
                key={action.id}
                variant="outline"
                onClick={action.onClick}
                className="h-auto flex-col gap-2 py-4"
              >
                {action.icon}
                <div className="text-xs font-semibold">{action.label}</div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showNewProjectDialog} onOpenChange={setShowNewProjectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Set up a new project with a name, description, and optional template.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project-name">Project Name</Label>
              <Input
                id="project-name"
                placeholder="My Awesome Project"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-description">Description (optional)</Label>
              <Textarea
                id="project-description"
                placeholder="Describe your project..."
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-template">Template (optional)</Label>
              <Select value={projectTemplate} onValueChange={setProjectTemplate}>
                <SelectTrigger id="project-template">
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blank">Blank Project</SelectItem>
                  <SelectItem value="residential">Residential</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="industrial">Industrial</SelectItem>
                  <SelectItem value="landscape">Landscape</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewProjectDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateProject} disabled={isCreatingProject}>
              {isCreatingProject ? "Creating..." : "Create Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload File</DialogTitle>
            <DialogDescription>
              Upload design files, CAD models, or BIM data to your workspace.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file-upload">Select File</Label>
              <Input
                id="file-upload"
                type="file"
                accept=".ifc,.dwg,.dxf,.obj,.fbx,.gltf,.glb,.rvt"
                onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
              />
              {selectedFile && (
                <p className="text-xs text-muted-foreground">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleFileUpload} disabled={isUploading || !selectedFile}>
              {isUploading ? "Uploading..." : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
