/**
 * Google Maps Geocoding API Endpoint
 *
 * Provides geocoding and reverse geocoding services
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GoogleMapsIntegration } from '@/lib/services/google-maps-integration'

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
    const address = searchParams.get('address')
    const lat = searchParams.get('lat')
    const lng = searchParams.get('lng')

    // Initialize Google Maps service
    const apiKey = process.env.GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Google Maps API key not configured' },
        { status: 500 }
      )
    }

    const mapsService = new GoogleMapsIntegration(apiKey)

    // Forward geocoding (address to coordinates)
    if (address) {
      try {
        const result = await mapsService.geocodeAddress(address)
        return NextResponse.json({
          success: true,
          data: result
        })
      } catch (error: any) {
        return NextResponse.json(
          { error: error.message || 'Geocoding failed' },
          { status: 400 }
        )
      }
    }

    // Reverse geocoding (coordinates to address)
    if (lat && lng) {
      const latitude = parseFloat(lat)
      const longitude = parseFloat(lng)

      if (isNaN(latitude) || isNaN(longitude)) {
        return NextResponse.json(
          { error: 'Invalid coordinates' },
          { status: 400 }
        )
      }

      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        return NextResponse.json(
          { error: 'Coordinates out of range' },
          { status: 400 }
        )
      }

      try {
        const result = await mapsService.reverseGeocode({
          lat: latitude,
          lng: longitude
        })
        return NextResponse.json({
          success: true,
          data: result
        })
      } catch (error: any) {
        return NextResponse.json(
          { error: error.message || 'Reverse geocoding failed' },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Missing required parameters: address OR (lat AND lng)' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Geocoding API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
