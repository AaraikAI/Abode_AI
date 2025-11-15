'use client'

import { useState, useCallback } from 'react'
import { Upload, File, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { documentProcessor } from '@/lib/services/document-processor'
import { rag } from '@/lib/services/rag'
import { useToast } from '@/hooks/use-toast'

interface DocumentUploadProps {
  onUploadComplete?: (docId: string) => void
}

interface UploadStatus {
  file: File
  status: 'pending' | 'processing' | 'complete' | 'error'
  progress: number
  error?: string
  docId?: string
}

export function DocumentUpload({ onUploadComplete }: DocumentUploadProps) {
  const [uploads, setUploads] = useState<UploadStatus[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const { toast } = useToast()

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

    const files = Array.from(e.dataTransfer.files)
    handleFiles(files)
  }, [])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      handleFiles(files)
    }
  }, [])

  const handleFiles = async (files: File[]) => {
    // Add files to upload queue
    const newUploads: UploadStatus[] = files.map(file => ({
      file,
      status: 'pending',
      progress: 0
    }))

    setUploads(prev => [...prev, ...newUploads])

    // Process each file
    for (const upload of newUploads) {
      await processFile(upload)
    }
  }

  const processFile = async (upload: UploadStatus) => {
    updateUpload(upload.file, { status: 'processing', progress: 10 })

    try {
      // Check if format is supported
      const ext = upload.file.name.split('.').pop()?.toLowerCase() || ''
      if (!documentProcessor.isSupported(ext)) {
        throw new Error(`Unsupported file format: ${ext}`)
      }

      updateUpload(upload.file, { progress: 25 })

      // Process document
      const doc = await documentProcessor.processFile(upload.file, {
        extractMetadata: true,
        cleanText: true,
        maxSize: 10 * 1024 * 1024 // 10MB max
      })

      updateUpload(upload.file, { progress: 50 })

      // Chunk document
      const chunks = await rag.chunkDocument(doc.content, doc.metadata)

      updateUpload(upload.file, { progress: 70 })

      // Generate embeddings
      const embeddedChunks = await rag.generateEmbeddings(chunks)

      updateUpload(upload.file, { progress: 90 })

      // Add to RAG store
      await rag.addChunks(embeddedChunks)

      updateUpload(upload.file, {
        status: 'complete',
        progress: 100,
        docId: doc.id
      })

      toast({
        title: 'Document processed',
        description: `${upload.file.name} has been added to the knowledge base (${chunks.length} chunks)`
      })

      onUploadComplete?.(doc.id)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      updateUpload(upload.file, {
        status: 'error',
        progress: 0,
        error: errorMessage
      })

      toast({
        title: 'Upload failed',
        description: errorMessage,
        variant: 'destructive'
      })
    }
  }

  const updateUpload = (file: File, updates: Partial<UploadStatus>) => {
    setUploads(prev =>
      prev.map(u =>
        u.file === file ? { ...u, ...updates } : u
      )
    )
  }

  const removeUpload = (file: File) => {
    setUploads(prev => prev.filter(u => u.file !== file))
  }

  const getStatusIcon = (status: UploadStatus['status']) => {
    switch (status) {
      case 'pending':
        return <File className="h-4 w-4 text-muted-foreground" />
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin text-primary" />
      case 'complete':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />
    }
  }

  const getStatusColor = (status: UploadStatus['status']) => {
    switch (status) {
      case 'pending':
        return 'secondary'
      case 'processing':
        return 'default'
      case 'complete':
        return 'success'
      case 'error':
        return 'destructive'
    }
  }

  const supportedFormats = documentProcessor.getSupportedFormats()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Documents
        </CardTitle>
        <CardDescription>
          Add documents to your knowledge base for AI-powered search and retrieval
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drop zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-colors
            ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
            hover:border-primary hover:bg-primary/5 cursor-pointer
          `}
        >
          <input
            type="file"
            id="file-upload"
            multiple
            accept={supportedFormats.map(f => `.${f}`).join(',')}
            onChange={handleFileInput}
            className="hidden"
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">
              Drop files here or click to browse
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Supported formats: {supportedFormats.join(', ').toUpperCase()}
            </p>
            <Button type="button" variant="outline">
              Select Files
            </Button>
          </label>
        </div>

        {/* Upload list */}
        {uploads.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Uploads</h4>
            {uploads.map((upload, index) => (
              <div
                key={index}
                className="p-3 rounded-lg border bg-card space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {getStatusIcon(upload.status)}
                    <span className="text-sm font-medium truncate">
                      {upload.file.name}
                    </span>
                    <Badge variant={getStatusColor(upload.status) as any} className="text-xs">
                      {upload.status}
                    </Badge>
                  </div>
                  {upload.status !== 'processing' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removeUpload(upload.file)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>

                {upload.status === 'processing' && (
                  <div className="space-y-1">
                    <Progress value={upload.progress} />
                    <p className="text-xs text-muted-foreground">
                      Processing... {upload.progress}%
                    </p>
                  </div>
                )}

                {upload.error && (
                  <p className="text-xs text-destructive">{upload.error}</p>
                )}

                {upload.status === 'complete' && (
                  <p className="text-xs text-muted-foreground">
                    {Math.round(upload.file.size / 1024)} KB • Ready for search
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Stats */}
        {uploads.length > 0 && (
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>
              Total: {uploads.length}
            </span>
            <span>
              Complete: {uploads.filter(u => u.status === 'complete').length}
            </span>
            <span>
              Processing: {uploads.filter(u => u.status === 'processing').length}
            </span>
            {uploads.filter(u => u.status === 'error').length > 0 && (
              <span className="text-destructive">
                Errors: {uploads.filter(u => u.status === 'error').length}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
