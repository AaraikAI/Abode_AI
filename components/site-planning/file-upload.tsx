'use client'

import { useState, useCallback, useRef } from 'react'
import { Upload, File, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Card } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface UploadedFile {
  id: string
  originalName: string
  fileType: string
  fileSize: number
  url: string
  pages?: number
  uploadedAt: string
}

interface FileUploadProps {
  projectId: string
  onUploadComplete?: (file: UploadedFile) => void
  onUploadError?: (error: string) => void
}

interface UploadingFile {
  file: File
  progress: number
  error?: string
  success?: boolean
}

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png']

export function FileUpload({ projectId, onUploadComplete, onUploadError }: FileUploadProps) {
  const [uploadingFiles, setUploadingFiles] = useState<Map<string, UploadingFile>>(new Map())
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()

    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      return `Invalid file type. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`
    }

    if (file.size > MAX_FILE_SIZE) {
      return `File too large. Maximum size: 50MB. File size: ${formatFileSize(file.size)}`
    }

    return null
  }

  const uploadFile = async (file: File) => {
    const fileId = `${file.name}-${Date.now()}`

    // Validate
    const validationError = validateFile(file)
    if (validationError) {
      setUploadingFiles(prev => new Map(prev).set(fileId, {
        file,
        progress: 0,
        error: validationError
      }))
      onUploadError?.(validationError)
      return
    }

    // Initialize upload state
    setUploadingFiles(prev => new Map(prev).set(fileId, {
      file,
      progress: 0
    }))

    try {
      const formData = new FormData()
      formData.append('file', file)

      const xhr = new XMLHttpRequest()

      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100)
          setUploadingFiles(prev => {
            const updated = new Map(prev)
            const current = updated.get(fileId)
            if (current) {
              updated.set(fileId, { ...current, progress })
            }
            return updated
          })
        }
      })

      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const result = JSON.parse(xhr.responseText)

          setUploadingFiles(prev => {
            const updated = new Map(prev)
            const current = updated.get(fileId)
            if (current) {
              updated.set(fileId, { ...current, progress: 100, success: true })
            }
            return updated
          })

          onUploadComplete?.(result)

          // Remove from list after 2 seconds
          setTimeout(() => {
            setUploadingFiles(prev => {
              const updated = new Map(prev)
              updated.delete(fileId)
              return updated
            })
          }, 2000)
        } else {
          const error = JSON.parse(xhr.responseText)
          setUploadingFiles(prev => {
            const updated = new Map(prev)
            const current = updated.get(fileId)
            if (current) {
              updated.set(fileId, {
                ...current,
                error: error.error || 'Upload failed'
              })
            }
            return updated
          })
          onUploadError?.(error.error || 'Upload failed')
        }
      })

      // Handle errors
      xhr.addEventListener('error', () => {
        setUploadingFiles(prev => {
          const updated = new Map(prev)
          const current = updated.get(fileId)
          if (current) {
            updated.set(fileId, { ...current, error: 'Network error' })
          }
          return updated
        })
        onUploadError?.('Network error')
      })

      xhr.open('POST', `/api/projects/${projectId}/files/upload`)
      xhr.send(formData)

    } catch (error) {
      console.error('Upload error:', error)
      setUploadingFiles(prev => {
        const updated = new Map(prev)
        const current = updated.get(fileId)
        if (current) {
          updated.set(fileId, {
            ...current,
            error: error instanceof Error ? error.message : 'Upload failed'
          })
        }
        return updated
      })
      onUploadError?.(error instanceof Error ? error.message : 'Upload failed')
    }
  }

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return

    Array.from(files).forEach(file => {
      uploadFile(file)
    })
  }, [projectId])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files)
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [handleFiles])

  const removeFile = (fileId: string) => {
    setUploadingFiles(prev => {
      const updated = new Map(prev)
      updated.delete(fileId)
      return updated
    })
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const getFileIcon = (fileType: string) => {
    if (fileType === 'application/pdf') return '📄'
    if (fileType.startsWith('image/')) return '🖼️'
    return '📎'
  }

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors duration-200
          ${isDragging
            ? 'border-primary bg-primary/5'
            : 'border-gray-300 hover:border-gray-400'
          }
        `}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-lg font-medium mb-2">
          Drop files here or click to browse
        </p>
        <p className="text-sm text-gray-500 mb-4">
          Supports: PDF, JPG, PNG (max 50MB)
        </p>
        <Button type="button" variant="outline">
          Select Files
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileInputChange}
          className="hidden"
        />
      </div>

      {/* Uploading Files List */}
      {uploadingFiles.size > 0 && (
        <div className="space-y-2">
          {Array.from(uploadingFiles.entries()).map(([fileId, uploadingFile]) => (
            <Card key={fileId} className="p-4">
              <div className="flex items-start gap-4">
                <div className="text-2xl">
                  {getFileIcon(uploadingFile.file.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium truncate">
                      {uploadingFile.file.name}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(fileId)}
                      disabled={uploadingFile.progress > 0 && uploadingFile.progress < 100}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <p className="text-xs text-gray-500 mb-2">
                    {formatFileSize(uploadingFile.file.size)}
                  </p>

                  {uploadingFile.error ? (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        {uploadingFile.error}
                      </AlertDescription>
                    </Alert>
                  ) : uploadingFile.success ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-xs">Upload complete</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Progress value={uploadingFile.progress} />
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Uploading...
                        </span>
                        <span>{uploadingFile.progress}%</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
