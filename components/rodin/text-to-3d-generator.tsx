'use client'

import { useState } from 'react'
import { Wand2, Download, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { rodinAI, type RodinJob, type TextTo3DRequest } from '@/lib/services/rodin-ai'
import { useToast } from '@/hooks/use-toast'

export function TextTo3DGenerator({ onModelGenerated }: { onModelGenerated?: (job: RodinJob) => void }) {
  const [prompt, setPrompt] = useState('')
  const [negativePrompt, setNegativePrompt] = useState('')
  const [settings, setSettings] = useState<Partial<TextTo3DRequest>>({
    style: 'realistic',
    quality: 'standard',
    resolution: 512,
    guidanceScale: 7.5
  })
  const [currentJob, setCurrentJob] = useState<RodinJob | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const { toast } = useToast()

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: 'Missing prompt',
        description: 'Please enter a description for the 3D model',
        variant: 'destructive'
      })
      return
    }

    setIsGenerating(true)

    try {
      const job = await rodinAI.textTo3D({
        prompt,
        negativePrompt: negativePrompt || undefined,
        ...settings
      } as TextTo3DRequest)

      setCurrentJob(job)

      toast({
        title: 'Generation started',
        description: `Creating 3D model from: "${prompt}"`
      })

      // Poll for updates
      pollJobStatus(job.jobId)
    } catch (error) {
      toast({
        title: 'Generation failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      })
      setIsGenerating(false)
    }
  }

  const pollJobStatus = async (jobId: string) => {
    const poll = async () => {
      const job = await rodinAI.getJobStatus(jobId)

      if (!job) return

      setCurrentJob(job)

      if (job.status === 'completed') {
        setIsGenerating(false)
        toast({
          title: 'Model generated!',
          description: 'Your 3D model is ready to download'
        })
        onModelGenerated?.(job)
        return
      }

      if (job.status === 'failed') {
        setIsGenerating(false)
        toast({
          title: 'Generation failed',
          description: job.error || 'Unknown error',
          variant: 'destructive'
        })
        return
      }

      // Continue polling
      setTimeout(poll, 2000)
    }

    poll()
  }

  const handleDownload = async () => {
    if (!currentJob || !currentJob.result) return

    try {
      const blob = await rodinAI.downloadResult(currentJob.jobId)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `model-${currentJob.jobId}.glb`
      a.click()
      URL.revokeObjectURL(url)

      toast({
        title: 'Download started',
        description: 'Your 3D model is downloading'
      })
    } catch (error) {
      toast({
        title: 'Download failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      })
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            Text-to-3D Generator
          </CardTitle>
          <CardDescription>
            Create 3D models from text descriptions using AI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Prompt */}
          <div className="space-y-2">
            <Label htmlFor="prompt">Prompt *</Label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A modern minimalist chair with wooden legs and gray fabric cushions..."
              className="min-h-[100px]"
              disabled={isGenerating}
            />
            <p className="text-xs text-muted-foreground">
              Describe the 3D model you want to create in detail
            </p>
          </div>

          {/* Negative Prompt */}
          <div className="space-y-2">
            <Label htmlFor="negative-prompt">Negative Prompt (Optional)</Label>
            <Input
              id="negative-prompt"
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              placeholder="low quality, blurry, distorted..."
              disabled={isGenerating}
            />
            <p className="text-xs text-muted-foreground">
              Specify what to avoid in the generated model
            </p>
          </div>

          {/* Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Style</Label>
              <Select
                value={settings.style}
                onValueChange={(value: any) => setSettings({ ...settings, style: value })}
                disabled={isGenerating}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="realistic">Realistic</SelectItem>
                  <SelectItem value="stylized">Stylized</SelectItem>
                  <SelectItem value="minimalist">Minimalist</SelectItem>
                  <SelectItem value="concept-art">Concept Art</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Quality</Label>
              <Select
                value={settings.quality}
                onValueChange={(value: any) => setSettings({ ...settings, quality: value })}
                disabled={isGenerating}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft (Fast)</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="high">High Quality</SelectItem>
                  <SelectItem value="ultra">Ultra (Slow)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Advanced Settings */}
          <details className="space-y-4">
            <summary className="text-sm font-medium cursor-pointer hover:text-primary">
              Advanced Settings
            </summary>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Resolution: {settings.resolution}px</Label>
                <Slider
                  value={[settings.resolution || 512]}
                  onValueChange={([value]) => setSettings({ ...settings, resolution: value })}
                  min={256}
                  max={1024}
                  step={256}
                  disabled={isGenerating}
                />
              </div>

              <div className="space-y-2">
                <Label>Guidance Scale: {settings.guidanceScale}</Label>
                <Slider
                  value={[settings.guidanceScale || 7.5]}
                  onValueChange={([value]) => setSettings({ ...settings, guidanceScale: value })}
                  min={1}
                  max={20}
                  step={0.5}
                  disabled={isGenerating}
                />
                <p className="text-xs text-muted-foreground">
                  Higher values follow the prompt more closely
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="seed">Seed (Optional)</Label>
                <Input
                  id="seed"
                  type="number"
                  value={settings.seed || ''}
                  onChange={(e) => setSettings({ ...settings, seed: parseInt(e.target.value) || undefined })}
                  placeholder="Random"
                  disabled={isGenerating}
                />
              </div>
            </div>
          </details>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-4 w-4" />
                Generate 3D Model
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Job Status */}
      {currentJob && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>Generation Status</span>
              <Badge variant={
                currentJob.status === 'completed' ? 'default' :
                currentJob.status === 'failed' ? 'destructive' :
                'secondary'
              }>
                {currentJob.status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentJob.status === 'processing' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Progress</span>
                  <span>{currentJob.progress}%</span>
                </div>
                <Progress value={currentJob.progress} />
              </div>
            )}

            {currentJob.status === 'failed' && (
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{currentJob.error || 'Generation failed'}</span>
              </div>
            )}

            {currentJob.status === 'completed' && currentJob.result && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Vertices:</span>
                    <p className="font-medium">{currentJob.result.metadata.vertices.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Triangles:</span>
                    <p className="font-medium">{currentJob.result.metadata.triangles.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Materials:</span>
                    <p className="font-medium">{currentJob.result.metadata.materials}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">File Size:</span>
                    <p className="font-medium">
                      {(currentJob.result.metadata.fileSize / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>

                <Button onClick={handleDownload} className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Download Model ({currentJob.result.format.toUpperCase()})
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
