'use client'

import { useState, useRef } from 'react'
import {
  Palette,
  Upload,
  Image as ImageIcon,
  Type,
  Code,
  Save,
  Eye,
  RotateCcw,
  Check,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'

export interface BrandingConfig {
  logo?: string
  logoUrl?: string
  favicon?: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  backgroundColor: string
  textColor: string
  fontFamily: string
  fontUrl?: string
  customCss?: string
}

export interface BrandingEditorProps {
  config: BrandingConfig
  onSave?: (config: BrandingConfig) => Promise<void>
  onPreview?: (config: BrandingConfig) => void
  onReset?: () => void
}

const defaultFonts = [
  { value: 'inter', label: 'Inter' },
  { value: 'roboto', label: 'Roboto' },
  { value: 'open-sans', label: 'Open Sans' },
  { value: 'lato', label: 'Lato' },
  { value: 'montserrat', label: 'Montserrat' },
  { value: 'poppins', label: 'Poppins' },
  { value: 'custom', label: 'Custom Font URL' },
]

export default function BrandingEditor({
  config,
  onSave,
  onPreview,
  onReset,
}: BrandingEditorProps) {
  const [branding, setBranding] = useState<BrandingConfig>(config)
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(config.logoUrl || null)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const faviconInputRef = useRef<HTMLInputElement>(null)

  const updateBranding = (updates: Partial<BrandingConfig>) => {
    const updated = { ...branding, ...updates }
    setBranding(updated)
    setSaved(false)
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        setLogoPreview(result)
        updateBranding({ logoUrl: result, logo: file.name })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleFaviconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        updateBranding({ favicon: reader.result as string })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave?.(branding)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Failed to save branding:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handlePreview = () => {
    onPreview?.(branding)
  }

  const handleReset = () => {
    onReset?.()
    setSaved(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Palette className="h-6 w-6" />
            Branding Editor
          </h2>
          <p className="text-sm text-muted-foreground">
            Customize your brand identity with logos, colors, fonts, and custom CSS
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePreview}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>

      <Tabs defaultValue="logos" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="logos">
            <ImageIcon className="h-4 w-4 mr-2" />
            Logos
          </TabsTrigger>
          <TabsTrigger value="colors">
            <Palette className="h-4 w-4 mr-2" />
            Colors
          </TabsTrigger>
          <TabsTrigger value="typography">
            <Type className="h-4 w-4 mr-2" />
            Typography
          </TabsTrigger>
          <TabsTrigger value="custom-css">
            <Code className="h-4 w-4 mr-2" />
            Custom CSS
          </TabsTrigger>
        </TabsList>

        {/* Logos Tab */}
        <TabsContent value="logos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Logo & Icon</CardTitle>
              <CardDescription>Upload your brand logos and favicon</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Main Logo */}
              <div className="space-y-3">
                <Label>Primary Logo</Label>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    {logoPreview ? (
                      <div className="relative border rounded-lg p-4 bg-muted/50 flex items-center justify-center h-32">
                        <img
                          src={logoPreview}
                          alt="Logo preview"
                          className="max-h-24 max-w-full object-contain"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => {
                            setLogoPreview(null)
                            updateBranding({ logoUrl: undefined, logo: undefined })
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div
                        className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => logoInputRef.current?.click()}
                      >
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Click to upload logo
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          PNG, JPG, SVG up to 5MB
                        </p>
                      </div>
                    )}
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Favicon */}
              <div className="space-y-3">
                <Label>Favicon</Label>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    {branding.favicon ? (
                      <div className="flex items-center gap-3 p-3 border rounded-lg">
                        <img
                          src={branding.favicon}
                          alt="Favicon"
                          className="h-8 w-8"
                        />
                        <span className="text-sm flex-1">favicon.ico</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateBranding({ favicon: undefined })}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={() => faviconInputRef.current?.click()}
                        className="w-full"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Favicon
                      </Button>
                    )}
                    <input
                      ref={faviconInputRef}
                      type="file"
                      accept="image/x-icon,image/png"
                      onChange={handleFaviconUpload}
                      className="hidden"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Recommended: 32x32px or 16x16px ICO or PNG file
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Colors Tab */}
        <TabsContent value="colors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Color Scheme</CardTitle>
              <CardDescription>Define your brand color palette</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primary-color">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primary-color"
                      type="color"
                      value={branding.primaryColor}
                      onChange={(e) => updateBranding({ primaryColor: e.target.value })}
                      className="w-20 h-10 p-1"
                    />
                    <Input
                      value={branding.primaryColor}
                      onChange={(e) => updateBranding({ primaryColor: e.target.value })}
                      placeholder="#000000"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondary-color">Secondary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondary-color"
                      type="color"
                      value={branding.secondaryColor}
                      onChange={(e) => updateBranding({ secondaryColor: e.target.value })}
                      className="w-20 h-10 p-1"
                    />
                    <Input
                      value={branding.secondaryColor}
                      onChange={(e) => updateBranding({ secondaryColor: e.target.value })}
                      placeholder="#000000"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accent-color">Accent Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="accent-color"
                      type="color"
                      value={branding.accentColor}
                      onChange={(e) => updateBranding({ accentColor: e.target.value })}
                      className="w-20 h-10 p-1"
                    />
                    <Input
                      value={branding.accentColor}
                      onChange={(e) => updateBranding({ accentColor: e.target.value })}
                      placeholder="#000000"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="background-color">Background Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="background-color"
                      type="color"
                      value={branding.backgroundColor}
                      onChange={(e) => updateBranding({ backgroundColor: e.target.value })}
                      className="w-20 h-10 p-1"
                    />
                    <Input
                      value={branding.backgroundColor}
                      onChange={(e) => updateBranding({ backgroundColor: e.target.value })}
                      placeholder="#FFFFFF"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="text-color">Text Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="text-color"
                      type="color"
                      value={branding.textColor}
                      onChange={(e) => updateBranding({ textColor: e.target.value })}
                      className="w-20 h-10 p-1"
                    />
                    <Input
                      value={branding.textColor}
                      onChange={(e) => updateBranding({ textColor: e.target.value })}
                      placeholder="#000000"
                    />
                  </div>
                </div>
              </div>

              {/* Color Preview */}
              <div className="mt-6">
                <Label className="mb-3 block">Preview</Label>
                <div
                  className="p-6 rounded-lg border-2"
                  style={{ backgroundColor: branding.backgroundColor }}
                >
                  <div
                    className="text-2xl font-bold mb-2"
                    style={{ color: branding.primaryColor }}
                  >
                    Primary Text
                  </div>
                  <div
                    className="text-lg mb-2"
                    style={{ color: branding.secondaryColor }}
                  >
                    Secondary Text
                  </div>
                  <div
                    className="inline-block px-4 py-2 rounded"
                    style={{ backgroundColor: branding.accentColor, color: '#fff' }}
                  >
                    Accent Button
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Typography Tab */}
        <TabsContent value="typography" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Typography</CardTitle>
              <CardDescription>Configure fonts and text styles</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="font-family">Font Family</Label>
                <Select
                  value={branding.fontFamily}
                  onValueChange={(v) => updateBranding({ fontFamily: v })}
                >
                  <SelectTrigger id="font-family">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {defaultFonts.map((font) => (
                      <SelectItem key={font.value} value={font.value}>
                        {font.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {branding.fontFamily === 'custom' && (
                <div className="space-y-2">
                  <Label htmlFor="font-url">Custom Font URL</Label>
                  <Input
                    id="font-url"
                    value={branding.fontUrl || ''}
                    onChange={(e) => updateBranding({ fontUrl: e.target.value })}
                    placeholder="https://fonts.googleapis.com/css2?family=..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter a Google Fonts URL or custom font stylesheet URL
                  </p>
                </div>
              )}

              {/* Font Preview */}
              <div className="mt-6">
                <Label className="mb-3 block">Preview</Label>
                <div
                  className="p-6 border rounded-lg space-y-2"
                  style={{ fontFamily: branding.fontFamily }}
                >
                  <h1 className="text-3xl font-bold">Heading 1</h1>
                  <h2 className="text-2xl font-semibold">Heading 2</h2>
                  <p className="text-base">
                    This is a sample paragraph to preview the selected font family.
                    The quick brown fox jumps over the lazy dog.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Custom CSS Tab */}
        <TabsContent value="custom-css" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Custom CSS</CardTitle>
              <CardDescription>
                Add custom CSS to further customize your branding
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="custom-css">CSS Code</Label>
                <Textarea
                  id="custom-css"
                  value={branding.customCss || ''}
                  onChange={(e) => updateBranding({ customCss: e.target.value })}
                  placeholder=".custom-class {&#10;  color: #000;&#10;  font-weight: bold;&#10;}"
                  className="font-mono text-sm min-h-[300px]"
                />
                <p className="text-xs text-muted-foreground">
                  Write custom CSS rules to override default styles
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t">
        <Button onClick={handleSave} disabled={isSaving} size="lg">
          {isSaving ? (
            'Saving...'
          ) : saved ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Saved
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Branding
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
