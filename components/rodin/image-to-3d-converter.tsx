'use client'

import { useState, useCallback } from 'react'
import { Image as ImageIcon, Upload, Download, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { rodinAI, type RodinJob } from '@/lib/services/rodin-ai'
import { useToast } from '@/hooks/use-toast'

export function ImageTo3DConverter({ onModelGenerated }: { onModelGenerated?: (job: RodinJob) => void }) {
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [prompt, setPrompt] = useState('')
  const [settings, setSettings] = useState({
    preprocessBackground: true,
    multiView: true,
    generateTexture: true,
    resolution: 512
  })
  const [currentJob, setCurrentJob] = useState<RodinJob | null>(null)
  const [isConverting, setIsConverting] = useState(false)
  const { toast } = useToast()

  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file',
        description: 'Please select an image file',
        variant: 'destructive'
      })
      return
    }

    setSelectedImage(file)

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }, [toast])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file)

      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }, [])

  const handleConvert = async () => {
    if (!selectedImage) {
      toast({
        title: 'No image selected',
        description: 'Please select an image to convert',
        variant: 'destructive'
      })
      return
    }

    setIsConverting(true)

    try {
      const job = await rodinAI.imageTo3D({
        image: selectedImage,
        prompt: prompt || undefined,
        preprocessBackground: settings.preprocessBackground,
        multiView: settings.multiView,
        generateTexture: settings.generateTexture,
        resolution: settings.resolution
      })

      setCurrentJob(job)

      toast({
        title: 'Conversion started',
        description: 'Converting image to 3D model...'
      })

      // Poll for updates
      pollJobStatus(job.jobId)
    } catch (error) {
      toast({
        title: 'Conversion failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      })
      setIsConverting(false)
    }
  }

  const pollJobStatus = async (jobId: string) => {
    const poll = async () => {
      const job = await rodinAI.getJobStatus(jobId)

      if (!job) return

      setCurrentJob(job)

      if (job.status === 'completed') {
        setIsConverting(false)
        toast({
          title: '3D model ready!',
          description: 'Your image has been converted to a 3D model'
        })
        onModelGenerated?.(job)
        return
      }

      if (job.status === 'failed') {
        setIsConverting(false)
        toast({
          title: 'Conversion failed',
          description: job.error || 'Unknown error',
          variant: 'destructive'
        })
        return
      }

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

  const clearImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Image-to-3D Converter
          </CardTitle>
          <CardDescription>
            Convert 2D images into 3D models using AI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Image Upload */}
          {!imagePreview ? (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
            >
              <input
                type="file"
                id="image-upload"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
                disabled={isConverting}
              />
              <label htmlFor="image-upload" className="cursor-pointer">
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">
                  Drop image here or click to browse
                </p>
                <p className="text-sm text-muted-foreground">
                  Supports JPG, PNG, WebP
                </p>
              </label>
            </div>
          ) : (
            <div className="relative">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-64 object-contain rounded-lg border"
              />
              {!isConverting && (
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={clearImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}

          {/* Optional Prompt */}
          <div className="space-y-2">
            <Label htmlFor="prompt">Additional Prompt (Optional)</Label>
            <Input
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Add details or refinements..."
              disabled={isConverting}
            />
            <p className="text-xs text-muted-foreground">
              Provide additional context to improve the conversion
            </p>
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Remove Background</Label>
                <p className="text-xs text-muted-foreground">
                  Automatically isolate the main object
                </p>
              </div>
              <Switch
                checked={settings.preprocessBackground}
                onCheckedChange={(checked) => setSettings({ ...settings, preprocessBackground: checked })}
                disabled={isConverting}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Multi-View Generation</Label>
                <p className="text-xs text-muted-foreground">
                  Generate multiple viewpoints for better accuracy
                </p>
              </div>
              <Switch
                checked={settings.multiView}
                onCheckedChange={(checked) => setSettings({ ...settings, multiView: checked })}
                disabled={isConverting}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Generate Texture</Label>
                <p className="text-xs text-muted-foreground">
                  Create textured materials from the image
                </p>
              </div>
              <Switch
                checked={settings.generateTexture}
                onCheckedChange={(checked) => setSettings({ ...settings, generateTexture: checked })}
                disabled={isConverting}
              />
            </div>
          </div>

          {/* Convert Button */}
          <Button
            onClick={handleConvert}
            disabled={isConverting || !selectedImage}
            className="w-full"
            size="lg"
          >
            {isConverting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Converting...
              </>
            ) : (
              <>
                <ImageIcon className="mr-2 h-4 w-4" />
                Convert to 3D
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
              <span>Conversion Status</span>
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
                <p className="text-xs text-muted-foreground">
                  This may take a few minutes depending on complexity...
                </p>
              </div>
            )}

            {currentJob.status === 'completed' && currentJob.result && (
              <div className="space-y-4">
                {currentJob.result.thumbnailUrl && (
                  <img
                    src={currentJob.result.thumbnailUrl}
                    alt="Model preview"
                    className="w-full h-48 object-contain rounded-lg border"
                  />
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Vertices:</span>
                    <p className="font-medium">{currentJob.result.metadata.vertices.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Triangles:</span>
                    <p className="font-medium">{currentJob.result.metadata.triangles.toLocaleString()}</p>
                  </div>
                </div>

                <Button onClick={handleDownload} className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Download Model
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
