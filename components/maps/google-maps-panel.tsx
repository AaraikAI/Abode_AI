'use client'

/**
 * Google Maps Integration Panel
 *
 * Provides address geocoding, satellite imagery, and alignment controls
 */

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, MapPin, Satellite, Download, RefreshCw } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface Coordinates {
  lat: number
  lng: number
}

interface GeocodeResult {
  address: string
  coordinates: Coordinates
  formattedAddress: string
  bounds?: {
    northeast: Coordinates
    southwest: Coordinates
  }
  viewport: {
    northeast: Coordinates
    southwest: Coordinates
  }
}

interface SatelliteImagery {
  url: string
  width: number
  height: number
  center: Coordinates
  zoom: number
  attribution: string
}

interface GoogleMapsPanelProps {
  projectId: string
  onLocationSelected?: (location: GeocodeResult) => void
  onImageryLoaded?: (imagery: SatelliteImagery) => void
}

export function GoogleMapsPanel({
  projectId,
  onLocationSelected,
  onImageryLoaded
}: GoogleMapsPanelProps) {
  const { toast } = useToast()

  // Geocoding state
  const [address, setAddress] = useState('')
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [geocodeResult, setGeocodeResult] = useState<GeocodeResult | null>(null)

  // Imagery state
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [isLoadingImagery, setIsLoadingImagery] = useState(false)
  const [zoom, setZoom] = useState(18)
  const [mapType, setMapType] = useState<'satellite' | 'hybrid' | 'roadmap'>('satellite')
  const [imageSize, setImageSize] = useState({ width: 640, height: 640 })
  const [scale, setScale] = useState<1 | 2>(2)

  // Alignment state
  const [rotation, setRotation] = useState(0)
  const [offsetX, setOffsetX] = useState(0)
  const [offsetY, setOffsetY] = useState(0)

  /**
   * Geocode an address
   */
  const handleGeocode = async () => {
    if (!address.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter an address',
        variant: 'destructive'
      })
      return
    }

    setIsGeocoding(true)

    try {
      const response = await fetch(`/api/maps/geocode?address=${encodeURIComponent(address)}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Geocoding failed')
      }

      setGeocodeResult(data.data)
      onLocationSelected?.(data.data)

      toast({
        title: 'Success',
        description: `Found location: ${data.data.formattedAddress}`
      })

      // Automatically load imagery for the geocoded location
      loadSatelliteImagery(data.data.coordinates)
    } catch (error: any) {
      console.error('Geocoding error:', error)
      toast({
        title: 'Geocoding Failed',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setIsGeocoding(false)
    }
  }

  /**
   * Load satellite imagery
   */
  const loadSatelliteImagery = async (center?: Coordinates) => {
    const coords = center || geocodeResult?.coordinates
    if (!coords) {
      toast({
        title: 'Error',
        description: 'Please geocode an address first',
        variant: 'destructive'
      })
      return
    }

    setIsLoadingImagery(true)

    try {
      const response = await fetch('/api/maps/imagery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'satellite',
          params: {
            center: coords,
            zoom,
            size: imageSize,
            scale,
            mapType
          }
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load imagery')
      }

      setImageUrl(data.data.url)
      onImageryLoaded?.(data.data)

      toast({
        title: 'Success',
        description: 'Satellite imagery loaded'
      })
    } catch (error: any) {
      console.error('Imagery loading error:', error)
      toast({
        title: 'Imagery Loading Failed',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setIsLoadingImagery(false)
    }
  }

  /**
   * Download imagery
   */
  const handleDownloadImagery = () => {
    if (!imageUrl) return

    const link = document.createElement('a')
    link.href = imageUrl
    link.download = `satellite_${geocodeResult?.coordinates.lat}_${geocodeResult?.coordinates.lng}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      {/* Geocoding Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Address Geocoding
          </CardTitle>
          <CardDescription>
            Find coordinates for an address or APN/AIN
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">Address or APN</Label>
            <div className="flex gap-2">
              <Input
                id="address"
                placeholder="123 Main St, City, State ZIP"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGeocode()}
              />
              <Button
                onClick={handleGeocode}
                disabled={isGeocoding}
              >
                {isGeocoding ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Search'
                )}
              </Button>
            </div>
          </div>

          {geocodeResult && (
            <div className="rounded-lg bg-muted p-4 space-y-2">
              <div className="text-sm font-medium">
                {geocodeResult.formattedAddress}
              </div>
              <div className="text-xs text-muted-foreground">
                Latitude: {geocodeResult.coordinates.lat.toFixed(6)}<br />
                Longitude: {geocodeResult.coordinates.lng.toFixed(6)}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Satellite Imagery Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Satellite className="h-5 w-5" />
            Satellite Imagery
          </CardTitle>
          <CardDescription>
            Load and configure aerial imagery
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="zoom">Zoom Level: {zoom}</Label>
              <Slider
                id="zoom"
                min={1}
                max={22}
                step={1}
                value={[zoom]}
                onValueChange={([value]) => setZoom(value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mapType">Map Type</Label>
              <Select value={mapType} onValueChange={(value: any) => setMapType(value)}>
                <SelectTrigger id="mapType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="satellite">Satellite</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                  <SelectItem value="roadmap">Roadmap</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scale">Resolution</Label>
              <Select value={scale.toString()} onValueChange={(value) => setScale(parseInt(value) as 1 | 2)}>
                <SelectTrigger id="scale">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Standard</SelectItem>
                  <SelectItem value="2">High (Retina)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Image Size</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Width"
                  value={imageSize.width}
                  onChange={(e) => setImageSize(prev => ({ ...prev, width: parseInt(e.target.value) || 640 }))}
                  min={1}
                  max={2048}
                />
                <Input
                  type="number"
                  placeholder="Height"
                  value={imageSize.height}
                  onChange={(e) => setImageSize(prev => ({ ...prev, height: parseInt(e.target.value) || 640 }))}
                  min={1}
                  max={2048}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => loadSatelliteImagery()}
              disabled={!geocodeResult || isLoadingImagery}
              className="flex-1"
            >
              {isLoadingImagery ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Load Imagery
            </Button>

            {imageUrl && (
              <Button
                onClick={handleDownloadImagery}
                variant="outline"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            )}
          </div>

          {imageUrl && (
            <div className="rounded-lg overflow-hidden border">
              <img
                src={imageUrl}
                alt="Satellite imagery"
                className="w-full h-auto"
              />
              <div className="p-2 bg-muted text-xs text-center text-muted-foreground">
                © Google
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alignment Controls */}
      {imageUrl && (
        <Card>
          <CardHeader>
            <CardTitle>Image Alignment</CardTitle>
            <CardDescription>
              Adjust imagery alignment to match parcel boundaries
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rotation">Rotation: {rotation}°</Label>
              <Slider
                id="rotation"
                min={0}
                max={360}
                step={1}
                value={[rotation]}
                onValueChange={([value]) => setRotation(value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="offsetX">Offset X: {offsetX}px</Label>
                <Slider
                  id="offsetX"
                  min={-200}
                  max={200}
                  step={1}
                  value={[offsetX]}
                  onValueChange={([value]) => setOffsetX(value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="offsetY">Offset Y: {offsetY}px</Label>
                <Slider
                  id="offsetY"
                  min={-200}
                  max={200}
                  step={1}
                  value={[offsetY]}
                  onValueChange={([value]) => setOffsetY(value)}
                />
              </div>
            </div>

            <Button
              onClick={() => {
                setRotation(0)
                setOffsetX(0)
                setOffsetY(0)
              }}
              variant="outline"
              className="w-full"
            >
              Reset Alignment
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
