'use client'

import { useState } from 'react'
import {
  Download,
  FileType,
  CheckCircle2,
  AlertCircle,
  Settings,
  Info,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

export interface ExportSettings {
  schema: 'IFC2x3' | 'IFC4' | 'IFC4x3'
  format: 'ifc' | 'ifcxml' | 'ifczip'
  coordinateView: 'Design' | 'Coordination' | 'Presentation'
  includeGeometry: boolean
  includeProperties: boolean
  includeQuantities: boolean
  includeClassifications: boolean
  includeMaterials: boolean
  includeRelationships: boolean
  spatialStructure: 'full' | 'minimal'
  compressionLevel: number
}

export interface ValidationIssue {
  type: 'error' | 'warning' | 'info'
  message: string
  element?: string
  code?: string
}

export interface ExportProgress {
  stage: 'idle' | 'validating' | 'preparing' | 'exporting' | 'complete' | 'error'
  progress: number
  message: string
  issues: ValidationIssue[]
}

interface IFCExportProps {
  modelName?: string
  elementCount?: number
  onExport?: (settings: ExportSettings) => void
  onCancel?: () => void
}

export function IFCExport({
  modelName = 'Untitled Model',
  elementCount = 0,
  onExport,
  onCancel,
}: IFCExportProps) {
  const [settings, setSettings] = useState<ExportSettings>({
    schema: 'IFC4',
    format: 'ifc',
    coordinateView: 'Design',
    includeGeometry: true,
    includeProperties: true,
    includeQuantities: true,
    includeClassifications: true,
    includeMaterials: true,
    includeRelationships: true,
    spatialStructure: 'full',
    compressionLevel: 5,
  })

  const [progress, setProgress] = useState<ExportProgress>({
    stage: 'idle',
    progress: 0,
    message: 'Ready to export',
    issues: [],
  })

  const updateSetting = <K extends keyof ExportSettings>(
    key: K,
    value: ExportSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const handleExport = async () => {
    setProgress({
      stage: 'validating',
      progress: 10,
      message: 'Validating model...',
      issues: [],
    })

    await new Promise(resolve => setTimeout(resolve, 1000))

    const issues: ValidationIssue[] = [
      {
        type: 'warning',
        message: 'Some elements missing GlobalId will be auto-generated',
        code: 'W001',
      },
      {
        type: 'info',
        message: `Exporting ${elementCount} elements`,
      },
    ]

    setProgress({
      stage: 'preparing',
      progress: 40,
      message: 'Preparing export data...',
      issues,
    })

    await new Promise(resolve => setTimeout(resolve, 1000))

    setProgress({
      stage: 'exporting',
      progress: 70,
      message: 'Writing IFC file...',
      issues,
    })

    await new Promise(resolve => setTimeout(resolve, 1500))

    setProgress({
      stage: 'complete',
      progress: 100,
      message: 'Export complete',
      issues,
    })

    onExport?.(settings)
  }

  const getEstimatedSize = () => {
    const baseSize = elementCount * 2 // ~2KB per element
    const multiplier = settings.includeGeometry ? 1.5 : 0.5
    const compressed = settings.format === 'ifczip' ? 0.3 : 1
    return ((baseSize * multiplier * compressed) / 1024).toFixed(2)
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            <h3 className="font-semibold text-lg">Export to IFC</h3>
          </div>
          <Badge variant="secondary">{elementCount} elements</Badge>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
            <div className="flex items-center gap-3">
              <FileType className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium">{modelName}</p>
                <p className="text-sm text-muted-foreground">
                  Est. size: ~{getEstimatedSize()} MB
                </p>
              </div>
            </div>
          </div>
        </div>

        {progress.stage !== 'idle' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{progress.message}</span>
              <span className="font-medium">{progress.progress}%</span>
            </div>
            <Progress value={progress.progress} />

            {progress.issues.length > 0 && (
              <div className="space-y-2">
                {progress.issues.map((issue, index) => (
                  <Alert
                    key={index}
                    variant={issue.type === 'error' ? 'destructive' : 'default'}
                  >
                    {issue.type === 'error' ? (
                      <AlertCircle className="h-4 w-4" />
                    ) : issue.type === 'warning' ? (
                      <AlertCircle className="h-4 w-4" />
                    ) : (
                      <Info className="h-4 w-4" />
                    )}
                    <AlertDescription>
                      {issue.code && <span className="font-mono mr-2">[{issue.code}]</span>}
                      {issue.message}
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            )}

            {progress.stage === 'complete' && (
              <Alert className="bg-green-500/10 text-green-900 dark:text-green-100 border-green-500/20">
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  File exported successfully! Download should start automatically.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <Separator />

        <Accordion type="single" collapsible defaultValue="schema">
          <AccordionItem value="schema">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Schema & Format
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>IFC Schema Version</Label>
                <RadioGroup
                  value={settings.schema}
                  onValueChange={(value) => updateSetting('schema', value as any)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="IFC2x3" id="ifc2x3" />
                    <Label htmlFor="ifc2x3" className="font-normal cursor-pointer">
                      IFC 2x3 (Legacy, maximum compatibility)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="IFC4" id="ifc4" />
                    <Label htmlFor="ifc4" className="font-normal cursor-pointer">
                      IFC 4 (Recommended, modern standard)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="IFC4x3" id="ifc4x3" />
                    <Label htmlFor="ifc4x3" className="font-normal cursor-pointer">
                      IFC 4.3 (Latest, infrastructure support)
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="format">File Format</Label>
                <Select
                  value={settings.format}
                  onValueChange={(value) => updateSetting('format', value as any)}
                >
                  <SelectTrigger id="format">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ifc">.ifc (Standard STEP format)</SelectItem>
                    <SelectItem value="ifcxml">.ifcXML (XML format)</SelectItem>
                    <SelectItem value="ifczip">.ifcZIP (Compressed)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="coordinateView">Model View Definition</Label>
                <Select
                  value={settings.coordinateView}
                  onValueChange={(value) => updateSetting('coordinateView', value as any)}
                >
                  <SelectTrigger id="coordinateView">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Design">Design Transfer View</SelectItem>
                    <SelectItem value="Coordination">Coordination View</SelectItem>
                    <SelectItem value="Presentation">Presentation View</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="content">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <FileType className="h-4 w-4" />
                Content Options
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pt-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="geometry"
                  checked={settings.includeGeometry}
                  onCheckedChange={(checked) =>
                    updateSetting('includeGeometry', checked as boolean)
                  }
                />
                <Label htmlFor="geometry" className="font-normal cursor-pointer">
                  Include Geometry (3D shapes)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="properties"
                  checked={settings.includeProperties}
                  onCheckedChange={(checked) =>
                    updateSetting('includeProperties', checked as boolean)
                  }
                />
                <Label htmlFor="properties" className="font-normal cursor-pointer">
                  Include IFC Properties
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="quantities"
                  checked={settings.includeQuantities}
                  onCheckedChange={(checked) =>
                    updateSetting('includeQuantities', checked as boolean)
                  }
                />
                <Label htmlFor="quantities" className="font-normal cursor-pointer">
                  Include Quantity Sets
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="classifications"
                  checked={settings.includeClassifications}
                  onCheckedChange={(checked) =>
                    updateSetting('includeClassifications', checked as boolean)
                  }
                />
                <Label htmlFor="classifications" className="font-normal cursor-pointer">
                  Include Classifications
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="materials"
                  checked={settings.includeMaterials}
                  onCheckedChange={(checked) =>
                    updateSetting('includeMaterials', checked as boolean)
                  }
                />
                <Label htmlFor="materials" className="font-normal cursor-pointer">
                  Include Materials & Textures
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="relationships"
                  checked={settings.includeRelationships}
                  onCheckedChange={(checked) =>
                    updateSetting('includeRelationships', checked as boolean)
                  }
                />
                <Label htmlFor="relationships" className="font-normal cursor-pointer">
                  Include Element Relationships
                </Label>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="structure">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Advanced Options
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="spatial">Spatial Structure</Label>
                <Select
                  value={settings.spatialStructure}
                  onValueChange={(value) => updateSetting('spatialStructure', value as any)}
                >
                  <SelectTrigger id="spatial">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Full hierarchy (Site/Building/Story)</SelectItem>
                    <SelectItem value="minimal">Minimal structure</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {settings.format === 'ifczip' && (
                <div className="space-y-2">
                  <Label htmlFor="compression">
                    Compression Level: {settings.compressionLevel}
                  </Label>
                  <input
                    id="compression"
                    type="range"
                    min="1"
                    max="9"
                    value={settings.compressionLevel}
                    onChange={(e) =>
                      updateSetting('compressionLevel', parseInt(e.target.value))
                    }
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Faster</span>
                    <span>Smaller</span>
                  </div>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="flex items-center gap-3 pt-4">
          {onCancel && (
            <Button variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
          )}
          <Button
            onClick={handleExport}
            disabled={progress.stage !== 'idle' && progress.stage !== 'complete'}
            className="flex-1"
          >
            {progress.stage === 'exporting' ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export IFC
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  )
}
