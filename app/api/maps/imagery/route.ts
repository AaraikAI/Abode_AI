/**
 * Google Maps Imagery API Endpoint
 *
 * Provides satellite imagery, elevation data, and Street View
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GoogleMapsIntegration, SatelliteImageryParams } from '@/lib/services/google-maps-integration'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { type, params } = body

    // Initialize Google Maps service
    const apiKey = process.env.GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Google Maps API key not configured' },
        { status: 500 }
      )
    }

    const mapsService = new GoogleMapsIntegration(apiKey)

    // Satellite imagery
    if (type === 'satellite') {
      if (!params.center || !params.zoom || !params.size) {
        return NextResponse.json(
          { error: 'Missing required parameters: center, zoom, size' },
          { status: 400 }
        )
      }

      // Validate zoom level
      if (params.zoom < 1 || params.zoom > 22) {
        return NextResponse.json(
          { error: 'Zoom level must be between 1 and 22' },
          { status: 400 }
        )
      }

      // Validate size
      if (params.size.width < 1 || params.size.width > 2048 ||
          params.size.height < 1 || params.size.height > 2048) {
        return NextResponse.json(
          { error: 'Image size must be between 1x1 and 2048x2048' },
          { status: 400 }
        )
      }

      try {
        const imagery = await mapsService.getSatelliteImagery(params as SatelliteImageryParams)
        return NextResponse.json({
          success: true,
          data: imagery
        })
      } catch (error: any) {
        return NextResponse.json(
          { error: error.message || 'Failed to get satellite imagery' },
          { status: 400 }
        )
      }
    }

    // Elevation data
    if (type === 'elevation') {
      if (!params.coordinates || !Array.isArray(params.coordinates)) {
        return NextResponse.json(
          { error: 'Missing or invalid coordinates array' },
          { status: 400 }
        )
      }

      // Limit to 512 coordinates per request
      if (params.coordinates.length > 512) {
        return NextResponse.json(
          { error: 'Too many coordinates. Maximum: 512' },
          { status: 400 }
        )
      }

      try {
        const elevations = await mapsService.getElevation(params.coordinates)
        return NextResponse.json({
          success: true,
          data: elevations
        })
      } catch (error: any) {
        return NextResponse.json(
          { error: error.message || 'Failed to get elevation data' },
          { status: 400 }
        )
      }
    }

    // Street View metadata
    if (type === 'streetview-metadata') {
      if (!params.coordinates) {
        return NextResponse.json(
          { error: 'Missing required parameter: coordinates' },
          { status: 400 }
        )
      }

      const radius = params.radius || 50

      try {
        const streetView = await mapsService.getStreetView(params.coordinates, radius)
        if (!streetView) {
          return NextResponse.json({
            success: true,
            data: null,
            message: 'No Street View imagery available at this location'
          })
        }
        return NextResponse.json({
          success: true,
          data: streetView
        })
      } catch (error: any) {
        return NextResponse.json(
          { error: error.message || 'Failed to get Street View metadata' },
          { status: 400 }
        )
      }
    }

    // Street View image URL
    if (type === 'streetview-image') {
      if (!params.location && !params.panoId) {
        return NextResponse.json(
          { error: 'Missing required parameter: location OR panoId' },
          { status: 400 }
        )
      }

      if (!params.size) {
        return NextResponse.json(
          { error: 'Missing required parameter: size' },
          { status: 400 }
        )
      }

      try {
        const imageUrl = mapsService.getStreetViewImage(params)
        return NextResponse.json({
          success: true,
          data: {
            url: imageUrl,
            attribution: mapsService.getAttribution(true)
          }
        })
      } catch (error: any) {
        return NextResponse.json(
          { error: error.message || 'Failed to generate Street View image URL' },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Invalid type. Supported types: satellite, elevation, streetview-metadata, streetview-image' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Maps imagery API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET - Calculate distance or bounds
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const operation = searchParams.get('operation')

    // Initialize Google Maps service
    const apiKey = process.env.GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Google Maps API key not configured' },
        { status: 500 }
      )
    }

    const mapsService = new GoogleMapsIntegration(apiKey)

    // Calculate distance
    if (operation === 'distance') {
      const lat1 = searchParams.get('lat1')
      const lng1 = searchParams.get('lng1')
      const lat2 = searchParams.get('lat2')
      const lng2 = searchParams.get('lng2')

      if (!lat1 || !lng1 || !lat2 || !lng2) {
        return NextResponse.json(
          { error: 'Missing required parameters: lat1, lng1, lat2, lng2' },
          { status: 400 }
        )
      }

      const distance = mapsService.calculateDistance(
        { lat: parseFloat(lat1), lng: parseFloat(lng1) },
        { lat: parseFloat(lat2), lng: parseFloat(lng2) }
      )

      return NextResponse.json({
        success: true,
        data: {
          distance,
          unit: 'meters',
          distanceFeet: distance * 3.28084,
          distanceMiles: distance / 1609.34
        }
      })
    }

    // Calculate bounds
    if (operation === 'bounds') {
      const lat = searchParams.get('lat')
      const lng = searchParams.get('lng')
      const radius = searchParams.get('radius')

      if (!lat || !lng || !radius) {
        return NextResponse.json(
          { error: 'Missing required parameters: lat, lng, radius' },
          { status: 400 }
        )
      }

      const bounds = mapsService.calculateBounds(
        { lat: parseFloat(lat), lng: parseFloat(lng) },
        parseFloat(radius)
      )

      return NextResponse.json({
        success: true,
        data: bounds
      })
    }

    // Get attribution
    if (operation === 'attribution') {
      const includeLinks = searchParams.get('includeLinks') === 'true'
      const attribution = mapsService.getAttribution(includeLinks)

      return NextResponse.json({
        success: true,
        data: { attribution }
      })
    }

    return NextResponse.json(
      { error: 'Invalid operation. Supported operations: distance, bounds, attribution' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Maps utility API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
