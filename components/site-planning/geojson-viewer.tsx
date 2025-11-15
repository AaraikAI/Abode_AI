'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Download, Copy, Check, Code, Map } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export interface GeoJSONData {
  type: 'FeatureCollection'
  features: Array<{
    type: 'Feature'
    id?: string | number
    properties: Record<string, any>
    geometry: any
  }>
}

export interface GeoJSONViewerProps {
  data: GeoJSONData
  onExport?: (format: 'geojson' | 'json') => void
  showMap?: boolean
}

export function GeoJSONViewer({
  data,
  onExport,
  showMap = false
}: GeoJSONViewerProps) {
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<'formatted' | 'raw' | 'map'>('formatted')

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `geojson-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getStats = () => {
    const featureCount = data.features.length
    const geometryTypes = new Set(data.features.map(f => f.geometry.type))
    const totalProperties = data.features.reduce((sum, f) =>
      sum + Object.keys(f.properties).length, 0
    )

    return {
      features: featureCount,
      geometryTypes: Array.from(geometryTypes),
      properties: totalProperties,
    }
  }

  const stats = getStats()

  return (
    <Card className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm">GeoJSON Viewer</h3>
            <div className="flex gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                {stats.features} Features
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {stats.properties} Properties
              </Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="h-4 w-4 mr-1" />
              ) : (
                <Copy className="h-4 w-4 mr-1" />
              )}
              {copied ? 'Copied!' : 'Copy'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col">
        <div className="px-4 pt-2">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="formatted">
              <Code className="h-4 w-4 mr-1" />
              Formatted
            </TabsTrigger>
            <TabsTrigger value="raw">
              <Code className="h-4 w-4 mr-1" />
              Raw
            </TabsTrigger>
            {showMap && (
              <TabsTrigger value="map">
                <Map className="h-4 w-4 mr-1" />
                Map
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        <TabsContent value="formatted" className="flex-1 mt-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              {data.features.map((feature, index) => (
                <Card key={feature.id || index} className="p-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">{feature.geometry.type}</Badge>
                      {feature.id && (
                        <span className="text-xs text-muted-foreground">
                          ID: {feature.id}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-semibold">Properties:</p>
                      {Object.entries(feature.properties).length > 0 ? (
                        <div className="text-xs space-y-1 pl-2">
                          {Object.entries(feature.properties).map(([key, value]) => (
                            <div key={key} className="grid grid-cols-2 gap-2">
                              <span className="font-medium">{key}:</span>
                              <span className="text-muted-foreground">
                                {JSON.stringify(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic pl-2">
                          No properties
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-semibold">Coordinates:</p>
                      <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                        {JSON.stringify(feature.geometry.coordinates, null, 2)}
                      </pre>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="raw" className="flex-1 mt-0">
          <ScrollArea className="h-full">
            <pre className="p-4 text-xs overflow-x-auto">
              {JSON.stringify(data, null, 2)}
            </pre>
          </ScrollArea>
        </TabsContent>

        {showMap && (
          <TabsContent value="map" className="flex-1 mt-0">
            <div className="p-4">
              <div className="border rounded-lg h-96 flex items-center justify-center bg-muted">
                <p className="text-sm text-muted-foreground">
                  Map view would be rendered here
                </p>
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>

      <div className="p-4 border-t">
        <div className="text-xs text-muted-foreground">
          <p>Geometry Types: {stats.geometryTypes.join(', ')}</p>
        </div>
      </div>
    </Card>
  )
}
