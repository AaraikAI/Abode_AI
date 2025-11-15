'use client'

import { useState, useCallback, useRef } from 'react'
import { Upload, FileType, CheckCircle2, AlertCircle, X, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export interface IFCFile {
  id: string
  name: string
  size: number
  type: string
  file: File
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  schema: string
  elements: number
}

export interface ImportProgress {
  stage: 'uploading' | 'validating' | 'parsing' | 'complete' | 'error'
  progress: number
  message: string
}

interface IFCImporterProps {
  onImport?: (file: IFCFile, result: ValidationResult) => void
  onCancel?: () => void
  maxFileSize?: number
  acceptedFormats?: string[]
}

export function IFCImporter({
  onImport,
  onCancel,
  maxFileSize = 100 * 1024 * 1024, // 100MB
  acceptedFormats = ['.ifc', '.ifczip', '.ifcxml'],
}: IFCImporterProps) {
  const [selectedFile, setSelectedFile] = useState<IFCFile | null>(null)
  const [progress, setProgress] = useState<ImportProgress>({
    stage: 'uploading',
    progress: 0,
    message: 'Ready to import',
  })
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = useCallback(async (file: IFCFile): Promise<ValidationResult> => {
    // Simulate validation process
    setProgress({ stage: 'validating', progress: 30, message: 'Validating IFC schema...' })
    await new Promise(resolve => setTimeout(resolve, 1000))

    setProgress({ stage: 'parsing', progress: 60, message: 'Parsing building elements...' })
    await new Promise(resolve => setTimeout(resolve, 1000))

    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [
        'Some elements missing GlobalId attribute',
        'Deprecated IFC2x3 schema detected, consider upgrading to IFC4',
      ],
      schema: 'IFC2x3',
      elements: 1247,
    }

    setProgress({ stage: 'complete', progress: 100, message: 'Import complete' })
    return result
  }, [])

  const handleFileSelect = useCallback(
    async (file: File) => {
      // Validate file size
      if (file.size > maxFileSize) {
        setProgress({
          stage: 'error',
          progress: 0,
          message: `File too large. Maximum size is ${maxFileSize / 1024 / 1024}MB`,
        })
        return
      }

      // Validate file extension
      const extension = '.' + file.name.split('.').pop()?.toLowerCase()
      if (!acceptedFormats.includes(extension)) {
        setProgress({
          stage: 'error',
          progress: 0,
          message: `Invalid file format. Accepted formats: ${acceptedFormats.join(', ')}`,
        })
        return
      }

      const ifcFile: IFCFile = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        type: file.type,
        file,
      }

      setSelectedFile(ifcFile)
      setProgress({ stage: 'uploading', progress: 10, message: 'Uploading file...' })

      const result = await validateFile(ifcFile)
      setValidation(result)

      if (result.isValid) {
        onImport?.(ifcFile, result)
      }
    },
    [maxFileSize, acceptedFormats, validateFile, onImport]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const files = Array.from(e.dataTransfer.files)
      if (files.length > 0) {
        handleFileSelect(files[0])
      }
    },
    [handleFileSelect]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleReset = useCallback(() => {
    setSelectedFile(null)
    setValidation(null)
    setProgress({ stage: 'uploading', progress: 0, message: 'Ready to import' })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
    return (bytes / 1024 / 1024).toFixed(2) + ' MB'
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            <h3 className="font-semibold text-lg">IFC File Import</h3>
          </div>
          {selectedFile && (
            <Button variant="ghost" size="sm" onClick={handleReset}>
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>

        {!selectedFile ? (
          <div
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-muted-foreground/50'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <FileType className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">
              Drop IFC file here or click to browse
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Supported formats: {acceptedFormats.join(', ')}
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Maximum file size: {formatFileSize(maxFileSize)}
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept={acceptedFormats.join(',')}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileSelect(file)
              }}
              className="hidden"
            />
            <Button onClick={() => fileInputRef.current?.click()}>
              Select File
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start justify-between p-4 border rounded-lg">
              <div className="flex items-start gap-3 flex-1">
                <FileType className="h-8 w-8 text-primary mt-1" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(selectedFile.size)}
                  </p>
                  {validation && (
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline">{validation.schema}</Badge>
                      <Badge variant="secondary">
                        {validation.elements} elements
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
              {progress.stage === 'complete' && (
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
              )}
              {progress.stage === 'error' && (
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
              )}
            </div>

            {progress.progress > 0 && progress.progress < 100 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{progress.message}</span>
                  <span className="font-medium">{progress.progress}%</span>
                </div>
                <Progress value={progress.progress} />
              </div>
            )}

            {validation && (
              <Tabs defaultValue="summary" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                  <TabsTrigger value="warnings">
                    Warnings ({validation.warnings.length})
                  </TabsTrigger>
                  <TabsTrigger value="errors">
                    Errors ({validation.errors.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="summary" className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">Schema Version</p>
                      <p className="font-medium">{validation.schema}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Elements</p>
                      <p className="font-medium">{validation.elements}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">File Size</p>
                      <p className="font-medium">{formatFileSize(selectedFile.size)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Badge variant={validation.isValid ? 'default' : 'destructive'}>
                        {validation.isValid ? 'Valid' : 'Invalid'}
                      </Badge>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full" onClick={() => setShowPreview(true)}>
                    <Eye className="h-4 w-4 mr-2" />
                    Preview Model
                  </Button>
                </TabsContent>

                <TabsContent value="warnings" className="space-y-2">
                  {validation.warnings.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No warnings found
                    </p>
                  ) : (
                    validation.warnings.map((warning, index) => (
                      <Alert key={index}>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{warning}</AlertDescription>
                      </Alert>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="errors" className="space-y-2">
                  {validation.errors.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No errors found
                    </p>
                  ) : (
                    validation.errors.map((error, index) => (
                      <Alert key={index} variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    ))
                  )}
                </TabsContent>
              </Tabs>
            )}
          </div>
        )}
      </div>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Model Preview</DialogTitle>
            <DialogDescription>
              3D preview of {selectedFile?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
            <p className="text-muted-foreground">3D viewer would render here</p>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
