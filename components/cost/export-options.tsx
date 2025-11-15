'use client'

/**
 * Export Options Component
 *
 * Export estimates to PDF, Excel, CSV with template selection
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'
import {
  Download,
  FileText,
  Table2,
  FileSpreadsheet,
  Mail,
  Loader2,
  Settings,
  CheckCircle2
} from 'lucide-react'

export interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv'
  template?: string
  includeSections: {
    coverPage: boolean
    summary: boolean
    materialTakeoff: boolean
    laborBreakdown: boolean
    costChart: boolean
    recommendations: boolean
    scheduleOfValues: boolean
    termsAndConditions: boolean
  }
  branding?: {
    companyName?: string
    companyLogo?: string
    primaryColor?: string
  }
  recipient?: {
    name?: string
    email?: string
    company?: string
  }
}

interface ExportOptionsProps {
  projectId: string
  projectName?: string
  onExport?: (options: ExportOptions) => void
}

const TEMPLATES = {
  pdf: [
    { id: 'standard', name: 'Standard Estimate', description: 'Clean, professional format' },
    { id: 'detailed', name: 'Detailed Breakdown', description: 'Comprehensive line-item details' },
    { id: 'executive', name: 'Executive Summary', description: 'High-level overview for stakeholders' },
    { id: 'bid', name: 'Formal Bid Package', description: 'Complete bid submission package' }
  ],
  excel: [
    { id: 'workbook', name: 'Full Workbook', description: 'Multiple sheets with formulas' },
    { id: 'simple', name: 'Simple Spreadsheet', description: 'Single sheet summary' },
    { id: 'pivot', name: 'Pivot Analysis', description: 'Includes pivot tables for analysis' }
  ],
  csv: [
    { id: 'combined', name: 'Combined Export', description: 'All data in one file' },
    { id: 'separate', name: 'Separate Files', description: 'Individual CSV per section' }
  ]
}

export function ExportOptions({
  projectId,
  projectName = 'Project',
  onExport
}: ExportOptionsProps) {
  const { toast } = useToast()
  const [isExporting, setIsExporting] = useState(false)
  const [format, setFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf')
  const [template, setTemplate] = useState('standard')
  const [sendEmail, setSendEmail] = useState(false)

  const [sections, setSections] = useState({
    coverPage: true,
    summary: true,
    materialTakeoff: true,
    laborBreakdown: true,
    costChart: true,
    recommendations: false,
    scheduleOfValues: true,
    termsAndConditions: true
  })

  const [branding, setBranding] = useState({
    companyName: '',
    companyLogo: '',
    primaryColor: '#3b82f6'
  })

  const [recipient, setRecipient] = useState({
    name: '',
    email: '',
    company: ''
  })

  /**
   * Toggle section inclusion
   */
  const toggleSection = (section: keyof typeof sections) => {
    setSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  /**
   * Handle export
   */
  const handleExport = async () => {
    const exportOptions: ExportOptions = {
      format,
      template,
      includeSections: sections,
      branding,
      ...(sendEmail && { recipient })
    }

    setIsExporting(true)

    try {
      const response = await fetch('/api/cost/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          ...exportOptions
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Export failed')
      }

      // Download file
      if (data.downloadUrl) {
        const a = document.createElement('a')
        a.href = data.downloadUrl
        a.download = data.filename || `estimate-${projectId}.${format}`
        a.click()
      }

      // Send email if requested
      if (sendEmail && recipient.email) {
        toast({
          title: 'Export Complete',
          description: `Estimate sent to ${recipient.email}`
        })
      } else {
        toast({
          title: 'Export Complete',
          description: `Download started: ${data.filename}`
        })
      }

      onExport?.(exportOptions)
    } catch (error: any) {
      toast({
        title: 'Export Failed',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setIsExporting(false)
    }
  }

  /**
   * Quick export (no customization)
   */
  const quickExport = async (quickFormat: 'pdf' | 'excel' | 'csv') => {
    setFormat(quickFormat)
    setIsExporting(true)

    try {
      const response = await fetch('/api/cost/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          format: quickFormat,
          template: 'standard',
          includeSections: sections
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Export failed')
      }

      if (data.downloadUrl) {
        const a = document.createElement('a')
        a.href = data.downloadUrl
        a.download = data.filename || `estimate-${projectId}.${quickFormat}`
        a.click()
      }

      toast({
        title: 'Export Complete',
        description: `Downloaded ${data.filename}`
      })
    } catch (error: any) {
      toast({
        title: 'Export Failed',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setIsExporting(false)
    }
  }

  const currentTemplates = TEMPLATES[format]

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Options
          </CardTitle>
          <CardDescription>
            Export cost estimate in various formats
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Quick Export */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Export</CardTitle>
          <CardDescription>
            Export with default settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="h-24 flex-col gap-2"
              onClick={() => quickExport('pdf')}
              disabled={isExporting}
            >
              <FileText className="h-8 w-8" />
              <div className="text-sm font-medium">PDF Document</div>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex-col gap-2"
              onClick={() => quickExport('excel')}
              disabled={isExporting}
            >
              <FileSpreadsheet className="h-8 w-8" />
              <div className="text-sm font-medium">Excel Workbook</div>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex-col gap-2"
              onClick={() => quickExport('csv')}
              disabled={isExporting}
            >
              <Table2 className="h-8 w-8" />
              <div className="text-sm font-medium">CSV File</div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Custom Export */}
      <Tabs defaultValue="format" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="format">Format</TabsTrigger>
          <TabsTrigger value="sections">Sections</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="delivery">Delivery</TabsTrigger>
        </TabsList>

        {/* Format Tab */}
        <TabsContent value="format" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Select Format & Template</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Export Format</Label>
                <Select value={format} onValueChange={(value: any) => setFormat(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF Document</SelectItem>
                    <SelectItem value="excel">Excel Workbook</SelectItem>
                    <SelectItem value="csv">CSV File</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Template</Label>
                <Select value={template} onValueChange={setTemplate}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currentTemplates.map(tmpl => (
                      <SelectItem key={tmpl.id} value={tmpl.id}>
                        <div>
                          <div className="font-medium">{tmpl.name}</div>
                          <div className="text-xs text-muted-foreground">{tmpl.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sections Tab */}
        <TabsContent value="sections" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Include Sections</CardTitle>
              <CardDescription>
                Select which sections to include in the export
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(sections).map(([key, value]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={key}
                      checked={value}
                      onCheckedChange={() => toggleSection(key as keyof typeof sections)}
                    />
                    <Label
                      htmlFor={key}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branding Tab */}
        <TabsContent value="branding" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Branding Options</CardTitle>
              <CardDescription>
                Customize the appearance with your branding
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company-name">Company Name</Label>
                <Input
                  id="company-name"
                  value={branding.companyName}
                  onChange={(e) => setBranding(prev => ({ ...prev, companyName: e.target.value }))}
                  placeholder="Your Company Name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company-logo">Company Logo URL</Label>
                <Input
                  id="company-logo"
                  value={branding.companyLogo}
                  onChange={(e) => setBranding(prev => ({ ...prev, companyLogo: e.target.value }))}
                  placeholder="https://example.com/logo.png"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="primary-color">Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="primary-color"
                    type="color"
                    value={branding.primaryColor}
                    onChange={(e) => setBranding(prev => ({ ...prev, primaryColor: e.target.value }))}
                    className="w-20 h-10"
                  />
                  <Input
                    value={branding.primaryColor}
                    onChange={(e) => setBranding(prev => ({ ...prev, primaryColor: e.target.value }))}
                    placeholder="#3b82f6"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Delivery Tab */}
        <TabsContent value="delivery" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Delivery Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="send-email"
                  checked={sendEmail}
                  onCheckedChange={(checked) => setSendEmail(checked as boolean)}
                />
                <Label htmlFor="send-email">
                  Send via email
                </Label>
              </div>

              {sendEmail && (
                <div className="space-y-4 ml-6 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="recipient-name">Recipient Name</Label>
                    <Input
                      id="recipient-name"
                      value={recipient.name}
                      onChange={(e) => setRecipient(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="John Doe"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="recipient-email">Recipient Email *</Label>
                    <Input
                      id="recipient-email"
                      type="email"
                      value={recipient.email}
                      onChange={(e) => setRecipient(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="john@example.com"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="recipient-company">Company</Label>
                    <Input
                      id="recipient-company"
                      value={recipient.company}
                      onChange={(e) => setRecipient(prev => ({ ...prev, company: e.target.value }))}
                      placeholder="Acme Corp"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Export Button */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {sendEmail ? (
                <>
                  <Mail className="h-4 w-4 inline mr-1" />
                  Will send to {recipient.email || 'recipient'}
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 inline mr-1" />
                  Will download as {format.toUpperCase()} file
                </>
              )}
            </div>
            <Button
              onClick={handleExport}
              disabled={isExporting || (sendEmail && !recipient.email)}
              size="lg"
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  {sendEmail ? (
                    <>
                      <Mail className="h-5 w-5 mr-2" />
                      Send Estimate
                    </>
                  ) : (
                    <>
                      <Download className="h-5 w-5 mr-2" />
                      Download Estimate
                    </>
                  )}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Export History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Exports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-sm text-muted-foreground py-8">
            No recent exports
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
