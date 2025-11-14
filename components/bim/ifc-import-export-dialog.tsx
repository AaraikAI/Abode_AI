'use client'

/**
 * IFC Import/Export Dialog
 *
 * Handles IFC file uploads and exports
 */

import { useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import {
  Upload,
  Download,
  FileText,
  Loader2,
  CheckCircle2,
  XCircle,
  Building2,
  Layers,
  Box
} from 'lucide-react'

interface IFCImportExportDialogProps {
  projectId: string
  sceneData?: any
  onImportComplete?: (data: any) => void
  onExportComplete?: (url: string) => void
  trigger?: React.ReactNode
}

export function IFCImportExportDialog({
  projectId,
  sceneData,
  onImportComplete,
  onExportComplete,
  trigger
}: IFCImportExportDialogProps) {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Import state
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [importResult, setImportResult] = useState<any>(null)

  // Export state
  const [isExporting, setIsExporting] = useState(false)
  const [exportSchema, setExportSchema] = useState<'IFC2X3' | 'IFC4'>('IFC4')
  const [includeGeometry, setIncludeGeometry] = useState(true)
  const [includeProperties, setIncludeProperties] = useState(true)
  const [exportUrl, setExportUrl] = useState<string | null>(null)

  // File info
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  /**
   * Handle file selection
   */
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.ifc')) {
      toast({
        title: 'Invalid File',
        description: 'Please select an IFC file (.ifc)',
        variant: 'destructive'
      })
      return
    }

    // Validate file size (max 100MB)
    const MAX_SIZE = 100 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      toast({
        title: 'File Too Large',
        description: 'Maximum file size is 100MB',
        variant: 'destructive'
      })
      return
    }

    setSelectedFile(file)
  }

  /**
   * Import IFC file
   */
  const handleImport = async () => {
    if (!selectedFile) {
      toast({
        title: 'Error',
        description: 'Please select a file first',
        variant: 'destructive'
      })
      return
    }

    setIsImporting(true)
    setImportProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('projectId', projectId)

      // Simulate progress (since we can't track actual upload progress with fetch)
      const progressInterval = setInterval(() => {
        setImportProgress(prev => Math.min(prev + 10, 90))
      }, 500)

      const response = await fetch('/api/bim/import', {
        method: 'POST',
        body: formData
      })

      clearInterval(progressInterval)
      setImportProgress(100)

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Import failed')
      }

      setImportResult(data.data)
      onImportComplete?.(data.data)

      toast({
        title: 'Import Successful',
        description: `Imported ${data.data.objects?.length || 0} objects from ${selectedFile.name}`
      })
    } catch (error: any) {
      console.error('Import error:', error)
      toast({
        title: 'Import Failed',
        description: error.message,
        variant: 'destructive'
      })
      setImportProgress(0)
    } finally {
      setIsImporting(false)
    }
  }

  /**
   * Export to IFC
   */
  const handleExport = async () => {
    if (!sceneData || !sceneData.objects || sceneData.objects.length === 0) {
      toast({
        title: 'Error',
        description: 'No scene data to export',
        variant: 'destructive'
      })
      return
    }

    setIsExporting(true)

    try {
      const response = await fetch('/api/bim/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projectId,
          sceneData,
          schema: exportSchema,
          includeGeometry,
          includeProperties
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Export failed')
      }

      setExportUrl(data.downloadUrl)
      onExportComplete?.(data.downloadUrl)

      toast({
        title: 'Export Successful',
        description: `Exported ${sceneData.objects.length} objects to IFC ${exportSchema}`
      })

      // Automatically download
      const link = document.createElement('a')
      link.href = data.downloadUrl
      link.download = `export_${Date.now()}.ifc`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error: any) {
      console.error('Export error:', error)
      toast({
        title: 'Export Failed',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            IFC Import/Export
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>IFC/BIM File Management</DialogTitle>
          <DialogDescription>
            Import and export IFC (Industry Foundation Classes) files
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="import" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="import">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </TabsTrigger>
            <TabsTrigger value="export">
              <Download className="h-4 w-4 mr-2" />
              Export
            </TabsTrigger>
          </TabsList>

          {/* Import Tab */}
          <TabsContent value="import" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Upload IFC File</CardTitle>
                <CardDescription>
                  Import building data from IFC 2x3 or IFC4 files (max 100MB)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ifc-file">Select IFC File</Label>
                  <div className="flex gap-2">
                    <Input
                      id="ifc-file"
                      type="file"
                      accept=".ifc"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      disabled={isImporting}
                    />
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      variant="outline"
                      disabled={isImporting}
                    >
                      Browse
                    </Button>
                  </div>
                </div>

                {selectedFile && (
                  <div className="rounded-lg bg-muted p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span className="text-sm font-medium">{selectedFile.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                  </div>
                )}

                {isImporting && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Importing...</span>
                      <span>{importProgress}%</span>
                    </div>
                    <Progress value={importProgress} />
                  </div>
                )}

                <Button
                  onClick={handleImport}
                  disabled={!selectedFile || isImporting}
                  className="w-full"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Import IFC File
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Import Results */}
            {importResult && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    Import Successful
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">Project</div>
                        <div className="text-xs text-muted-foreground">
                          {importResult.project?.name || 'Unnamed'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">Building</div>
                        <div className="text-xs text-muted-foreground">
                          {importResult.building?.name || 'Unnamed'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Box className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">Objects</div>
                        <div className="text-xs text-muted-foreground">
                          {importResult.objects?.length || 0} elements
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">Materials</div>
                        <div className="text-xs text-muted-foreground">
                          {importResult.materials?.length || 0} materials
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Export Tab */}
          <TabsContent value="export" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Export to IFC</CardTitle>
                <CardDescription>
                  Convert your scene to IFC format for interoperability
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="schema">IFC Schema Version</Label>
                  <Select value={exportSchema} onValueChange={(value: any) => setExportSchema(value)}>
                    <SelectTrigger id="schema">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IFC4">IFC4 (Recommended)</SelectItem>
                      <SelectItem value="IFC2X3">IFC 2x3 (Legacy)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    IFC4 is the latest standard with improved support for modern BIM workflows
                  </p>
                </div>

                <div className="space-y-3">
                  <Label>Export Options</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="geometry"
                        checked={includeGeometry}
                        onCheckedChange={(checked) => setIncludeGeometry(checked as boolean)}
                      />
                      <label
                        htmlFor="geometry"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Include 3D Geometry
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="properties"
                        checked={includeProperties}
                        onCheckedChange={(checked) => setIncludeProperties(checked as boolean)}
                      />
                      <label
                        htmlFor="properties"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Include Property Sets
                      </label>
                    </div>
                  </div>
                </div>

                {sceneData?.objects && (
                  <div className="rounded-lg bg-muted p-4">
                    <div className="text-sm">
                      <span className="font-medium">Ready to export:</span>{' '}
                      {sceneData.objects.length} objects
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleExport}
                  disabled={isExporting || !sceneData?.objects}
                  className="w-full"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Export to IFC {exportSchema}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Export Success */}
            {exportUrl && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    Export Successful
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Your IFC file has been generated</span>
                    <Button
                      onClick={() => {
                        const link = document.createElement('a')
                        link.href = exportUrl
                        link.download = `export_${Date.now()}.ifc`
                        document.body.appendChild(link)
                        link.click()
                        document.body.removeChild(link)
                      }}
                      variant="outline"
                      size="sm"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Again
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
