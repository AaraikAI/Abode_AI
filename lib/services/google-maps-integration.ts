/**
 * Google Maps Platform Integration
 *
 * Features:
 * - Address and APN/AIN geocoding
 * - Satellite/aerial imagery retrieval
 * - Parcel boundary alignment
 * - Street View integration
 * - Terrain elevation data
 * - Attribution management
 *
 * Compliance:
 * - Google Maps Platform Terms of Service
 * - Attribution requirements
 * - Usage quotas and rate limiting
 * - Ephemeral caching only
 */

import axios from 'axios'

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || ''

export interface Coordinates {
  lat: number
  lng: number
}

export interface BoundingBox {
  northeast: Coordinates
  southwest: Coordinates
}

export interface GeocodeResult {
  address: string
  coordinates: Coordinates
  placeId: string
  formattedAddress: string
  addressComponents: {
    longName: string
    shortName: string
    types: string[]
  }[]
  bounds?: BoundingBox
  viewport: BoundingBox
}

export interface SatelliteImageryParams {
  center: Coordinates
  zoom: number // 1-22
  size: { width: number; height: number }
  scale?: 1 | 2 // For retina displays
  mapType?: 'satellite' | 'hybrid' | 'roadmap'
  heading?: number // 0-360 degrees
  pitch?: number // 0-90 degrees
}

export interface SatelliteImagery {
  url: string
  width: number
  height: number
  center: Coordinates
  zoom: number
  attribution: string
  expiresAt: Date
}

export interface ParcelData {
  apn: string // Assessor's Parcel Number
  ain?: string // Assessor Identification Number
  address: string
  coordinates: Coordinates
  boundaries?: Coordinates[]
  area?: number // square feet
  zoning?: string
  landUse?: string
}

export interface ElevationData {
  location: Coordinates
  elevation: number // meters
  resolution: number // meters
}

export interface StreetViewData {
  panoId: string
  location: Coordinates
  copyright: string
  date: string
  links: {
    panoId: string
    heading: number
    description: string
  }[]
}

export class GoogleMapsIntegration {
  private apiKey: string
  private baseUrl = 'https://maps.googleapis.com/maps/api'

  constructor(apiKey?: string) {
    this.apiKey = apiKey || GOOGLE_MAPS_API_KEY

    if (!this.apiKey) {
      throw new Error('Google Maps API key is required')
    }
  }

  /**
   * Geocode an address to coordinates
   */
  async geocodeAddress(address: string): Promise<GeocodeResult> {
    try {
      const response = await axios.get(`${this.baseUrl}/geocode/json`, {
        params: {
          address,
          key: this.apiKey
        }
      })

      if (response.data.status !== 'OK') {
        throw new Error(`Geocoding failed: ${response.data.status}`)
      }

      const result = response.data.results[0]

      return {
        address,
        coordinates: {
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng
        },
        placeId: result.place_id,
        formattedAddress: result.formatted_address,
        addressComponents: result.address_components.map((component: any) => ({
          longName: component.long_name,
          shortName: component.short_name,
          types: component.types
        })),
        bounds: result.geometry.bounds ? {
          northeast: result.geometry.bounds.northeast,
          southwest: result.geometry.bounds.southwest
        } : undefined,
        viewport: {
          northeast: result.geometry.viewport.northeast,
          southwest: result.geometry.viewport.southwest
        }
      }
    } catch (error) {
      console.error('Geocoding error:', error)
      throw new Error('Failed to geocode address')
    }
  }

  /**
   * Reverse geocode coordinates to address
   */
  async reverseGeocode(coordinates: Coordinates): Promise<GeocodeResult> {
    try {
      const response = await axios.get(`${this.baseUrl}/geocode/json`, {
        params: {
          latlng: `${coordinates.lat},${coordinates.lng}`,
          key: this.apiKey
        }
      })

      if (response.data.status !== 'OK') {
        throw new Error(`Reverse geocoding failed: ${response.data.status}`)
      }

      const result = response.data.results[0]

      return {
        address: result.formatted_address,
        coordinates,
        placeId: result.place_id,
        formattedAddress: result.formatted_address,
        addressComponents: result.address_components.map((component: any) => ({
          longName: component.long_name,
          shortName: component.short_name,
          types: component.types
        })),
        viewport: {
          northeast: result.geometry.viewport.northeast,
          southwest: result.geometry.viewport.southwest
        }
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error)
      throw new Error('Failed to reverse geocode coordinates')
    }
  }

  /**
   * Get satellite/aerial imagery
   * Static Maps API or Map Tiles API
   */
  async getSatelliteImagery(params: SatelliteImageryParams): Promise<SatelliteImagery> {
    const {
      center,
      zoom,
      size,
      scale = 2,
      mapType = 'satellite',
      heading = 0,
      pitch = 0
    } = params

    // Construct Static Maps API URL
    const url = `${this.baseUrl}/staticmap`
    const queryParams = {
      center: `${center.lat},${center.lng}`,
      zoom: zoom.toString(),
      size: `${size.width}x${size.height}`,
      scale: scale.toString(),
      maptype: mapType,
      key: this.apiKey,
      // For aerial view adjustments
      ...(heading !== 0 && { heading: heading.toString() }),
      ...(pitch !== 0 && { pitch: pitch.toString() })
    }

    const imageUrl = `${url}?${new URLSearchParams(queryParams)}`

    // Calculate expiration (24 hours for ephemeral use)
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)

    return {
      url: imageUrl,
      width: size.width * scale,
      height: size.height * scale,
      center,
      zoom,
      attribution: '© Google',
      expiresAt
    }
  }

  /**
   * Get parcel data by APN/AIN
   * Note: Requires integration with county assessor databases
   */
  async getParcelByAPN(apn: string, county?: string): Promise<ParcelData | null> {
    // This requires integration with county-specific parcel data APIs
    // Implementation depends on available data sources (Regrid, Mapbox, county APIs)

    try {
      // Example using a hypothetical parcel API
      // In production, integrate with services like:
      // - Regrid API
      // - Attom Data Solutions
      // - County assessor APIs

      // Placeholder implementation
      const geocodeResult = await this.geocodeAddress(apn)

      return {
        apn,
        address: geocodeResult.formattedAddress,
        coordinates: geocodeResult.coordinates,
        boundaries: [], // Would come from parcel data API
        area: undefined,
        zoning: undefined,
        landUse: undefined
      }
    } catch (error) {
      console.error('Parcel lookup error:', error)
      return null
    }
  }

  /**
   * Get elevation data for coordinates
   */
  async getElevation(coordinates: Coordinates[]): Promise<ElevationData[]> {
    try {
      const locations = coordinates.map(c => `${c.lat},${c.lng}`).join('|')

      const response = await axios.get(`${this.baseUrl}/elevation/json`, {
        params: {
          locations,
          key: this.apiKey
        }
      })

      if (response.data.status !== 'OK') {
        throw new Error(`Elevation API failed: ${response.data.status}`)
      }

      return response.data.results.map((result: any) => ({
        location: {
          lat: result.location.lat,
          lng: result.location.lng
        },
        elevation: result.elevation,
        resolution: result.resolution
      }))
    } catch (error) {
      console.error('Elevation API error:', error)
      throw new Error('Failed to get elevation data')
    }
  }

  /**
   * Get Street View metadata
   */
  async getStreetView(coordinates: Coordinates, radius: number = 50): Promise<StreetViewData | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/streetview/metadata`, {
        params: {
          location: `${coordinates.lat},${coordinates.lng}`,
          radius,
          key: this.apiKey
        }
      })

      if (response.data.status !== 'OK') {
        return null
      }

      return {
        panoId: response.data.pano_id,
        location: {
          lat: response.data.location.lat,
          lng: response.data.location.lng
        },
        copyright: response.data.copyright,
        date: response.data.date,
        links: response.data.links?.map((link: any) => ({
          panoId: link.pano,
          heading: link.heading,
          description: link.description || ''
        })) || []
      }
    } catch (error) {
      console.error('Street View API error:', error)
      return null
    }
  }

  /**
   * Get Street View static image
   */
  getStreetViewImage(params: {
    panoId?: string
    location?: Coordinates
    size: { width: number; height: number }
    heading?: number
    pitch?: number
    fov?: number
  }): string {
    const { panoId, location, size, heading = 0, pitch = 0, fov = 90 } = params

    const queryParams: Record<string, string> = {
      size: `${size.width}x${size.height}`,
      heading: heading.toString(),
      pitch: pitch.toString(),
      fov: fov.toString(),
      key: this.apiKey
    }

    if (panoId) {
      queryParams.pano = panoId
    } else if (location) {
      queryParams.location = `${location.lat},${location.lng}`
    }

    return `${this.baseUrl}/streetview?${new URLSearchParams(queryParams)}`
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
    const R = 6371e3 // Earth radius in meters
    const φ1 = (coord1.lat * Math.PI) / 180
    const φ2 = (coord2.lat * Math.PI) / 180
    const Δφ = ((coord2.lat - coord1.lat) * Math.PI) / 180
    const Δλ = ((coord2.lng - coord1.lng) * Math.PI) / 180

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c // Distance in meters
  }

  /**
   * Calculate bounds from center and radius
   */
  calculateBounds(center: Coordinates, radiusMeters: number): BoundingBox {
    const latOffset = (radiusMeters / 111320) // degrees latitude
    const lngOffset = radiusMeters / (111320 * Math.cos(center.lat * Math.PI / 180))

    return {
      northeast: {
        lat: center.lat + latOffset,
        lng: center.lng + lngOffset
      },
      southwest: {
        lat: center.lat - latOffset,
        lng: center.lng - lngOffset
      }
    }
  }

  /**
   * Get attribution string (required by Google Maps ToS)
   */
  getAttribution(includeLinks: boolean = true): string {
    if (includeLinks) {
      return '© <a href="https://www.google.com/maps">Google</a> © <a href="https://www.google.com/intl/en_us/help/terms_maps/">Terms</a>'
    }
    return '© Google'
  }

  /**
   * Validate API key quota
   */
  async validateApiKey(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/geocode/json`, {
        params: {
          address: '1600 Amphitheatre Parkway, Mountain View, CA',
          key: this.apiKey
        }
      })

      return response.data.status === 'OK'
    } catch (error) {
      return false
    }
  }
}

/**
 * Image alignment helper
 * Aligns satellite imagery to parcel boundaries
 */
export class ImageryAlignmentHelper {
  /**
   * Calculate alignment transformation matrix
   */
  static calculateAlignment(params: {
    imageCenter: Coordinates
    imageBounds: BoundingBox
    parcelBounds: BoundingBox
    rotation?: number
  }): {
    scale: { x: number; y: number }
    offset: { x: number; y: number }
    rotation: number
  } {
    const { imageCenter, imageBounds, parcelBounds, rotation = 0 } = params

    // Calculate scale factors
    const imageWidth = Math.abs(imageBounds.northeast.lng - imageBounds.southwest.lng)
    const imageHeight = Math.abs(imageBounds.northeast.lat - imageBounds.southwest.lat)
    const parcelWidth = Math.abs(parcelBounds.northeast.lng - parcelBounds.southwest.lng)
    const parcelHeight = Math.abs(parcelBounds.northeast.lat - parcelBounds.southwest.lat)

    const scaleX = parcelWidth / imageWidth
    const scaleY = parcelHeight / imageHeight

    // Calculate offset
    const parcelCenter = {
      lat: (parcelBounds.northeast.lat + parcelBounds.southwest.lat) / 2,
      lng: (parcelBounds.northeast.lng + parcelBounds.southwest.lng) / 2
    }

    const offsetX = parcelCenter.lng - imageCenter.lng
    const offsetY = parcelCenter.lat - imageCenter.lat

    return {
      scale: { x: scaleX, y: scaleY },
      offset: { x: offsetX, y: offsetY },
      rotation
    }
  }

  /**
   * Apply alignment transformation to coordinates
   */
  static transformCoordinates(
    coordinates: Coordinates,
    transformation: ReturnType<typeof ImageryAlignmentHelper.calculateAlignment>
  ): Coordinates {
    let { lat, lng } = coordinates
    const { scale, offset, rotation } = transformation

    // Apply offset
    lng += offset.x
    lat += offset.y

    // Apply scale
    lng *= scale.x
    lat *= scale.y

    // Apply rotation
    if (rotation !== 0) {
      const rad = (rotation * Math.PI) / 180
      const cos = Math.cos(rad)
      const sin = Math.sin(rad)

      const newLng = lng * cos - lat * sin
      const newLat = lng * sin + lat * cos

      lng = newLng
      lat = newLat
    }

    return { lat, lng }
  }
}

/**
 * Usage quota tracking
 */
export class QuotaTracker {
  private usage: Map<string, number> = new Map()
  private resetTime: Date = new Date()

  constructor(private dailyLimit: number = 25000) {
    // Reset daily at midnight
    this.scheduleReset()
  }

  /**
   * Track API call
   */
  track(endpoint: string): boolean {
    this.checkReset()

    const current = this.usage.get(endpoint) || 0
    const total = Array.from(this.usage.values()).reduce((sum, v) => sum + v, 0)

    if (total >= this.dailyLimit) {
      return false // Quota exceeded
    }

    this.usage.set(endpoint, current + 1)
    return true
  }

  /**
   * Get remaining quota
   */
  getRemaining(): number {
    const total = Array.from(this.usage.values()).reduce((sum, v) => sum + v, 0)
    return Math.max(0, this.dailyLimit - total)
  }

  /**
   * Check if reset needed
   */
  private checkReset() {
    if (new Date() >= this.resetTime) {
      this.reset()
    }
  }

  /**
   * Reset usage counters
   */
  private reset() {
    this.usage.clear()
    this.resetTime = new Date()
    this.resetTime.setHours(24, 0, 0, 0)
  }

  /**
   * Schedule daily reset
   */
  private scheduleReset() {
    const now = new Date()
    const tomorrow = new Date()
    tomorrow.setHours(24, 0, 0, 0)
    const msUntilReset = tomorrow.getTime() - now.getTime()

    setTimeout(() => {
      this.reset()
      this.scheduleReset()
    }, msUntilReset)
  }
}
