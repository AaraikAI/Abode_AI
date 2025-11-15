'use client'

import { useState, useCallback, useRef } from 'react'
import { Upload, X, File, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

export interface UploadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpload?: (file: File, metadata: ModelMetadata) => Promise<void>
  maxFileSizeMB?: number
  allowedFormats?: string[]
}

export interface ModelMetadata {
  name: string
  category: string
  description?: string
  tags: string[]
}

interface UploadState {
  status: 'idle' | 'uploading' | 'success' | 'error'
  progress: number
  error?: string
}

const categories = ['Furniture', 'Lighting', 'Fixtures', 'Appliances', 'Decor', 'Other']
const defaultAllowedFormats = ['.glb', '.fbx', '.obj', '.gltf', '.usd', '.usdz']

export function UploadModal({
  open,
  onOpenChange,
  onUpload,
  maxFileSizeMB = 100,
  allowedFormats = defaultAllowedFormats,
}: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [metadata, setMetadata] = useState<ModelMetadata>({
    name: '',
    category: '',
    description: '',
    tags: [],
  })
  const [tagInput, setTagInput] = useState('')
  const [uploadState, setUploadState] = useState<UploadState>({
    status: 'idle',
    progress: 0,
  })
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase()

    if (!allowedFormats.includes(extension)) {
      return `Invalid file format. Allowed: ${allowedFormats.join(', ')}`
    }

    const fileSizeMB = file.size / (1024 * 1024)
    if (fileSizeMB > maxFileSizeMB) {
      return `File size exceeds ${maxFileSizeMB}MB limit`
    }

    return null
  }

  const handleFileSelect = (selectedFile: File) => {
    const error = validateFile(selectedFile)

    if (error) {
      setUploadState({
        status: 'error',
        progress: 0,
        error,
      })
      return
    }

    setFile(selectedFile)
    setUploadState({ status: 'idle', progress: 0 })

    // Auto-populate name from filename if not set
    if (!metadata.name) {
      const name = selectedFile.name.replace(/\.[^/.]+$/, '')
      setMetadata(prev => ({ ...prev, name }))
    }
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      handleFileSelect(droppedFile)
    }
  }, [])

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      handleFileSelect(selectedFile)
    }
  }

  const handleAddTag = () => {
    const tag = tagInput.trim()
    if (tag && !metadata.tags.includes(tag)) {
      setMetadata(prev => ({
        ...prev,
        tags: [...prev.tags, tag],
      }))
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setMetadata(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }))
  }

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }

  const handleUpload = async () => {
    if (!file || !metadata.name || !metadata.category) {
      setUploadState({
        status: 'error',
        progress: 0,
        error: 'Please fill in all required fields',
      })
      return
    }

    try {
      setUploadState({ status: 'uploading', progress: 0 })

      // Simulate progress for demo (replace with actual upload logic)
      const progressInterval = setInterval(() => {
        setUploadState(prev => {
          const newProgress = Math.min(prev.progress + 10, 90)
          return { ...prev, progress: newProgress }
        })
      }, 200)

      await onUpload?.(file, metadata)

      clearInterval(progressInterval)
      setUploadState({ status: 'success', progress: 100 })

      // Reset form after success
      setTimeout(() => {
        handleReset()
        onOpenChange(false)
      }, 1500)
    } catch (error) {
      setUploadState({
        status: 'error',
        progress: 0,
        error: error instanceof Error ? error.message : 'Upload failed',
      })
    }
  }

  const handleReset = () => {
    setFile(null)
    setMetadata({
      name: '',
      category: '',
      description: '',
      tags: [],
    })
    setTagInput('')
    setUploadState({ status: 'idle', progress: 0 })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const canUpload = file && metadata.name && metadata.category && uploadState.status !== 'uploading'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload 3D Model</DialogTitle>
          <DialogDescription>
            Upload a new 3D model to your library. Supported formats: {allowedFormats.join(', ')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* File Upload Area */}
          <div>
            <Label>Model File *</Label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`
                mt-2 border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
                ${file ? 'bg-muted/50' : 'hover:bg-muted/50'}
              `}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={allowedFormats.join(',')}
                onChange={handleFileInputChange}
                className="hidden"
              />

              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <File className="h-8 w-8 text-primary" />
                  <div className="text-left">
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleReset()
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div>
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm font-medium mb-1">
                    Drop your 3D model here, or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Max file size: {maxFileSizeMB}MB
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Upload Progress */}
          {uploadState.status === 'uploading' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading...
                </span>
                <span>{uploadState.progress}%</span>
              </div>
              <Progress value={uploadState.progress} />
            </div>
          )}

          {/* Success Message */}
          {uploadState.status === 'success' && (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">Upload successful!</span>
            </div>
          )}

          {/* Error Message */}
          {uploadState.status === 'error' && uploadState.error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm">{uploadState.error}</span>
            </div>
          )}

          {/* Metadata Fields */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="model-name">Model Name *</Label>
              <Input
                id="model-name"
                value={metadata.name}
                onChange={(e) => setMetadata(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Modern Sofa"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="category">Category *</Label>
              <Select
                value={metadata.category}
                onValueChange={(value) => setMetadata(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger id="category" className="mt-2">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={metadata.description}
                onChange={(e) => setMetadata(prev => ({ ...prev, description: e.target.value }))}
                placeholder="A detailed description of your 3D model..."
                className="mt-2 resize-none"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="tags">Tags</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="tags"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagInputKeyDown}
                  placeholder="Add tags (press Enter)"
                />
                <Button type="button" variant="outline" onClick={handleAddTag}>
                  Add
                </Button>
              </div>
              {metadata.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {metadata.tags.map(tag => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                      <X
                        className="h-3 w-3 ml-1 cursor-pointer"
                        onClick={() => handleRemoveTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!canUpload}
          >
            {uploadState.status === 'uploading' ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Model
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
