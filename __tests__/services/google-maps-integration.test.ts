/**
 * Google Maps Integration Service Tests
 * Comprehensive test suite covering geocoding, imagery, elevation, and Street View
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals'
import axios from 'axios'
import {
  GoogleMapsIntegration,
  ImageryAlignmentHelper,
  QuotaTracker,
  type Coordinates,
  type BoundingBox,
  type GeocodeResult,
  type SatelliteImageryParams,
  type ElevationData,
  type StreetViewData
} from '../../lib/services/google-maps-integration'

// Mock axios
jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

describe('GoogleMapsIntegration', () => {
  let service: GoogleMapsIntegration
  const mockApiKey = 'test-api-key-12345'

  beforeEach(() => {
    jest.clearAllMocks()
    service = new GoogleMapsIntegration(mockApiKey)
  })

  describe('Constructor', () => {
    it('should initialize with provided API key', () => {
      const customService = new GoogleMapsIntegration('custom-key')
      expect(customService).toBeInstanceOf(GoogleMapsIntegration)
    })

    it('should use environment variable if no key provided', () => {
      const originalEnv = process.env.GOOGLE_MAPS_API_KEY
      process.env.GOOGLE_MAPS_API_KEY = 'env-key'
      const envService = new GoogleMapsIntegration()
      expect(envService).toBeInstanceOf(GoogleMapsIntegration)
      process.env.GOOGLE_MAPS_API_KEY = originalEnv
    })

    it('should throw error if no API key available', () => {
      const originalEnv = process.env.GOOGLE_MAPS_API_KEY
      delete process.env.GOOGLE_MAPS_API_KEY
      expect(() => new GoogleMapsIntegration()).toThrow('Google Maps API key is required')
      process.env.GOOGLE_MAPS_API_KEY = originalEnv
    })

    it('should initialize with empty API key if provided explicitly', () => {
      expect(() => new GoogleMapsIntegration('')).toThrow('Google Maps API key is required')
    })
  })

  describe('geocodeAddress - Forward Geocoding', () => {
    const mockGeocodeResponse = {
      data: {
        status: 'OK',
        results: [{
          place_id: 'ChIJ1234567890',
          formatted_address: '1600 Amphitheatre Parkway, Mountain View, CA 94043, USA',
          geometry: {
            location: { lat: 37.4224764, lng: -122.0842499 },
            viewport: {
              northeast: { lat: 37.4238253802915, lng: -122.0829009197085 },
              southwest: { lat: 37.4211274197085, lng: -122.0855988802915 }
            },
            bounds: {
              northeast: { lat: 37.4238253802915, lng: -122.0829009197085 },
              southwest: { lat: 37.4211274197085, lng: -122.0855988802915 }
            }
          },
          address_components: [
            { long_name: '1600', short_name: '1600', types: ['street_number'] },
            { long_name: 'Amphitheatre Parkway', short_name: 'Amphitheatre Pkwy', types: ['route'] },
            { long_name: 'Mountain View', short_name: 'Mountain View', types: ['locality'] },
            { long_name: 'California', short_name: 'CA', types: ['administrative_area_level_1'] },
            { long_name: 'United States', short_name: 'US', types: ['country'] },
            { long_name: '94043', short_name: '94043', types: ['postal_code'] }
          ]
        }]
      }
    }

    it('should successfully geocode a valid address', async () => {
      mockedAxios.get.mockResolvedValueOnce(mockGeocodeResponse)

      const result = await service.geocodeAddress('1600 Amphitheatre Parkway, Mountain View, CA')

      expect(result).toMatchObject({
        address: '1600 Amphitheatre Parkway, Mountain View, CA',
        coordinates: { lat: 37.4224764, lng: -122.0842499 },
        placeId: 'ChIJ1234567890',
        formattedAddress: '1600 Amphitheatre Parkway, Mountain View, CA 94043, USA'
      })
      expect(result.addressComponents).toHaveLength(6)
    })

    it('should include bounds when available', async () => {
      mockedAxios.get.mockResolvedValueOnce(mockGeocodeResponse)

      const result = await service.geocodeAddress('Test Address')

      expect(result.bounds).toBeDefined()
      expect(result.bounds?.northeast).toMatchObject({ lat: 37.4238253802915, lng: -122.0829009197085 })
      expect(result.bounds?.southwest).toMatchObject({ lat: 37.4211274197085, lng: -122.0855988802915 })
    })

    it('should handle missing bounds', async () => {
      const responseWithoutBounds = {
        data: {
          status: 'OK',
          results: [{
            ...mockGeocodeResponse.data.results[0],
            geometry: {
              ...mockGeocodeResponse.data.results[0].geometry,
              bounds: undefined
            }
          }]
        }
      }
      mockedAxios.get.mockResolvedValueOnce(responseWithoutBounds)

      const result = await service.geocodeAddress('Test Address')

      expect(result.bounds).toBeUndefined()
      expect(result.viewport).toBeDefined()
    })

    it('should include viewport in result', async () => {
      mockedAxios.get.mockResolvedValueOnce(mockGeocodeResponse)

      const result = await service.geocodeAddress('Test Address')

      expect(result.viewport).toMatchObject({
        northeast: { lat: 37.4238253802915, lng: -122.0829009197085 },
        southwest: { lat: 37.4211274197085, lng: -122.0855988802915 }
      })
    })

    it('should handle ZERO_RESULTS status', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: { status: 'ZERO_RESULTS' } })

      await expect(service.geocodeAddress('Invalid Address'))
        .rejects.toThrow('Geocoding failed: ZERO_RESULTS')
    })

    it('should handle REQUEST_DENIED status', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: { status: 'REQUEST_DENIED' } })

      await expect(service.geocodeAddress('Test Address'))
        .rejects.toThrow('Geocoding failed: REQUEST_DENIED')
    })

    it('should handle OVER_QUERY_LIMIT status', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: { status: 'OVER_QUERY_LIMIT' } })

      await expect(service.geocodeAddress('Test Address'))
        .rejects.toThrow('Geocoding failed: OVER_QUERY_LIMIT')
    })

    it('should handle INVALID_REQUEST status', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: { status: 'INVALID_REQUEST' } })

      await expect(service.geocodeAddress(''))
        .rejects.toThrow('Geocoding failed: INVALID_REQUEST')
    })

    it('should handle network errors', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'))

      await expect(service.geocodeAddress('Test Address'))
        .rejects.toThrow('Failed to geocode address')
    })

    it('should parse address components correctly', async () => {
      mockedAxios.get.mockResolvedValueOnce(mockGeocodeResponse)

      const result = await service.geocodeAddress('Test Address')

      expect(result.addressComponents[0]).toMatchObject({
        longName: '1600',
        shortName: '1600',
        types: ['street_number']
      })
    })

    it('should make API call with correct parameters', async () => {
      mockedAxios.get.mockResolvedValueOnce(mockGeocodeResponse)

      await service.geocodeAddress('123 Main St')

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://maps.googleapis.com/maps/api/geocode/json',
        {
          params: {
            address: '123 Main St',
            key: mockApiKey
          }
        }
      )
    })
  })

  describe('reverseGeocode - Reverse Geocoding', () => {
    const mockReverseGeocodeResponse = {
      data: {
        status: 'OK',
        results: [{
          place_id: 'ChIJ9876543210',
          formatted_address: '1600 Amphitheatre Parkway, Mountain View, CA 94043, USA',
          geometry: {
            location: { lat: 37.4224764, lng: -122.0842499 },
            viewport: {
              northeast: { lat: 37.4238253802915, lng: -122.0829009197085 },
              southwest: { lat: 37.4211274197085, lng: -122.0855988802915 }
            }
          },
          address_components: [
            { long_name: '1600', short_name: '1600', types: ['street_number'] },
            { long_name: 'Amphitheatre Parkway', short_name: 'Amphitheatre Pkwy', types: ['route'] }
          ]
        }]
      }
    }

    it('should successfully reverse geocode coordinates', async () => {
      mockedAxios.get.mockResolvedValueOnce(mockReverseGeocodeResponse)

      const coords: Coordinates = { lat: 37.4224764, lng: -122.0842499 }
      const result = await service.reverseGeocode(coords)

      expect(result).toMatchObject({
        address: '1600 Amphitheatre Parkway, Mountain View, CA 94043, USA',
        coordinates: coords,
        placeId: 'ChIJ9876543210',
        formattedAddress: '1600 Amphitheatre Parkway, Mountain View, CA 94043, USA'
      })
    })

    it('should preserve input coordinates', async () => {
      mockedAxios.get.mockResolvedValueOnce(mockReverseGeocodeResponse)

      const coords: Coordinates = { lat: 40.7128, lng: -74.0060 }
      const result = await service.reverseGeocode(coords)

      expect(result.coordinates).toEqual(coords)
    })

    it('should make API call with correct latlng format', async () => {
      mockedAxios.get.mockResolvedValueOnce(mockReverseGeocodeResponse)

      const coords: Coordinates = { lat: 37.4224764, lng: -122.0842499 }
      await service.reverseGeocode(coords)

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://maps.googleapis.com/maps/api/geocode/json',
        {
          params: {
            latlng: '37.4224764,-122.0842499',
            key: mockApiKey
          }
        }
      )
    })

    it('should handle negative coordinates', async () => {
      mockedAxios.get.mockResolvedValueOnce(mockReverseGeocodeResponse)

      const coords: Coordinates = { lat: -33.8688, lng: 151.2093 }
      await service.reverseGeocode(coords)

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            latlng: '-33.8688,151.2093'
          })
        })
      )
    })

    it('should handle ZERO_RESULTS status', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: { status: 'ZERO_RESULTS' } })

      await expect(service.reverseGeocode({ lat: 0, lng: 0 }))
        .rejects.toThrow('Reverse geocoding failed: ZERO_RESULTS')
    })

    it('should handle network errors', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'))

      await expect(service.reverseGeocode({ lat: 37.4224764, lng: -122.0842499 }))
        .rejects.toThrow('Failed to reverse geocode coordinates')
    })

    it('should include viewport in result', async () => {
      mockedAxios.get.mockResolvedValueOnce(mockReverseGeocodeResponse)

      const result = await service.reverseGeocode({ lat: 37.4224764, lng: -122.0842499 })

      expect(result.viewport).toBeDefined()
      expect(result.viewport.northeast).toMatchObject({ lat: 37.4238253802915, lng: -122.0829009197085 })
    })
  })

  describe('getSatelliteImagery - Satellite Imagery', () => {
    it('should generate satellite imagery URL with basic parameters', async () => {
      const params: SatelliteImageryParams = {
        center: { lat: 37.4224764, lng: -122.0842499 },
        zoom: 18,
        size: { width: 640, height: 640 }
      }

      const result = await service.getSatelliteImagery(params)

      expect(result.url).toContain('https://maps.googleapis.com/maps/api/staticmap')
      expect(result.url).toContain('center=37.4224764,-122.0842499')
      expect(result.url).toContain('zoom=18')
      expect(result.url).toContain('size=640x640')
      expect(result.width).toBe(1280) // 640 * 2 (default scale)
      expect(result.height).toBe(1280)
    })

    it('should default to scale 2 for retina displays', async () => {
      const params: SatelliteImageryParams = {
        center: { lat: 0, lng: 0 },
        zoom: 10,
        size: { width: 400, height: 400 }
      }

      const result = await service.getSatelliteImagery(params)

      expect(result.url).toContain('scale=2')
      expect(result.width).toBe(800)
      expect(result.height).toBe(800)
    })

    it('should support scale 1', async () => {
      const params: SatelliteImageryParams = {
        center: { lat: 0, lng: 0 },
        zoom: 10,
        size: { width: 400, height: 400 },
        scale: 1
      }

      const result = await service.getSatelliteImagery(params)

      expect(result.url).toContain('scale=1')
      expect(result.width).toBe(400)
      expect(result.height).toBe(400)
    })

    it('should default to satellite map type', async () => {
      const params: SatelliteImageryParams = {
        center: { lat: 0, lng: 0 },
        zoom: 10,
        size: { width: 400, height: 400 }
      }

      const result = await service.getSatelliteImagery(params)

      expect(result.url).toContain('maptype=satellite')
    })

    it('should support hybrid map type', async () => {
      const params: SatelliteImageryParams = {
        center: { lat: 0, lng: 0 },
        zoom: 10,
        size: { width: 400, height: 400 },
        mapType: 'hybrid'
      }

      const result = await service.getSatelliteImagery(params)

      expect(result.url).toContain('maptype=hybrid')
    })

    it('should support roadmap type', async () => {
      const params: SatelliteImageryParams = {
        center: { lat: 0, lng: 0 },
        zoom: 10,
        size: { width: 400, height: 400 },
        mapType: 'roadmap'
      }

      const result = await service.getSatelliteImagery(params)

      expect(result.url).toContain('maptype=roadmap')
    })

    it('should include heading parameter when provided', async () => {
      const params: SatelliteImageryParams = {
        center: { lat: 0, lng: 0 },
        zoom: 10,
        size: { width: 400, height: 400 },
        heading: 90
      }

      const result = await service.getSatelliteImagery(params)

      expect(result.url).toContain('heading=90')
    })

    it('should include pitch parameter when provided', async () => {
      const params: SatelliteImageryParams = {
        center: { lat: 0, lng: 0 },
        zoom: 10,
        size: { width: 400, height: 400 },
        pitch: 45
      }

      const result = await service.getSatelliteImagery(params)

      expect(result.url).toContain('pitch=45')
    })

    it('should omit heading when 0', async () => {
      const params: SatelliteImageryParams = {
        center: { lat: 0, lng: 0 },
        zoom: 10,
        size: { width: 400, height: 400 },
        heading: 0
      }

      const result = await service.getSatelliteImagery(params)

      expect(result.url).not.toContain('heading=')
    })

    it('should omit pitch when 0', async () => {
      const params: SatelliteImageryParams = {
        center: { lat: 0, lng: 0 },
        zoom: 10,
        size: { width: 400, height: 400 },
        pitch: 0
      }

      const result = await service.getSatelliteImagery(params)

      expect(result.url).not.toContain('pitch=')
    })

    it('should include API key in URL', async () => {
      const params: SatelliteImageryParams = {
        center: { lat: 0, lng: 0 },
        zoom: 10,
        size: { width: 400, height: 400 }
      }

      const result = await service.getSatelliteImagery(params)

      expect(result.url).toContain(`key=${mockApiKey}`)
    })

    it('should return metadata with center and zoom', async () => {
      const params: SatelliteImageryParams = {
        center: { lat: 37.4224764, lng: -122.0842499 },
        zoom: 18,
        size: { width: 640, height: 640 }
      }

      const result = await service.getSatelliteImagery(params)

      expect(result.center).toEqual(params.center)
      expect(result.zoom).toBe(18)
    })

    it('should include Google attribution', async () => {
      const params: SatelliteImageryParams = {
        center: { lat: 0, lng: 0 },
        zoom: 10,
        size: { width: 400, height: 400 }
      }

      const result = await service.getSatelliteImagery(params)

      expect(result.attribution).toBe('© Google')
    })

    it('should set expiration to 24 hours in future', async () => {
      const beforeTime = new Date()
      beforeTime.setHours(beforeTime.getHours() + 23, 59, 0, 0)

      const params: SatelliteImageryParams = {
        center: { lat: 0, lng: 0 },
        zoom: 10,
        size: { width: 400, height: 400 }
      }

      const result = await service.getSatelliteImagery(params)

      const afterTime = new Date()
      afterTime.setHours(afterTime.getHours() + 24, 1, 0, 0)

      expect(result.expiresAt.getTime()).toBeGreaterThan(beforeTime.getTime())
      expect(result.expiresAt.getTime()).toBeLessThan(afterTime.getTime())
    })
  })

  describe('getElevation - Elevation Data', () => {
    const mockElevationResponse = {
      data: {
        status: 'OK',
        results: [
          { location: { lat: 39.7391536, lng: -104.9847034 }, elevation: 1655.637, resolution: 4.771976 },
          { location: { lat: 36.4566448, lng: -116.8666666 }, elevation: -86.245, resolution: 19.087912 }
        ]
      }
    }

    it('should fetch elevation for single coordinate', async () => {
      mockedAxios.get.mockResolvedValueOnce(mockElevationResponse)

      const coords: Coordinates[] = [{ lat: 39.7391536, lng: -104.9847034 }]
      const result = await service.getElevation(coords)

      expect(result).toHaveLength(2)
      expect(result[0]).toMatchObject({
        location: { lat: 39.7391536, lng: -104.9847034 },
        elevation: 1655.637,
        resolution: 4.771976
      })
    })

    it('should fetch elevation for multiple coordinates', async () => {
      mockedAxios.get.mockResolvedValueOnce(mockElevationResponse)

      const coords: Coordinates[] = [
        { lat: 39.7391536, lng: -104.9847034 },
        { lat: 36.4566448, lng: -116.8666666 }
      ]
      const result = await service.getElevation(coords)

      expect(result).toHaveLength(2)
      expect(result[1]).toMatchObject({
        location: { lat: 36.4566448, lng: -116.8666666 },
        elevation: -86.245,
        resolution: 19.087912
      })
    })

    it('should format locations parameter correctly', async () => {
      mockedAxios.get.mockResolvedValueOnce(mockElevationResponse)

      const coords: Coordinates[] = [
        { lat: 39.7391536, lng: -104.9847034 },
        { lat: 36.4566448, lng: -116.8666666 }
      ]
      await service.getElevation(coords)

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://maps.googleapis.com/maps/api/elevation/json',
        {
          params: {
            locations: '39.7391536,-104.9847034|36.4566448,-116.8666666',
            key: mockApiKey
          }
        }
      )
    })

    it('should handle INVALID_REQUEST status', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: { status: 'INVALID_REQUEST' } })

      await expect(service.getElevation([{ lat: 0, lng: 0 }]))
        .rejects.toThrow('Elevation API failed: INVALID_REQUEST')
    })

    it('should handle network errors', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'))

      await expect(service.getElevation([{ lat: 0, lng: 0 }]))
        .rejects.toThrow('Failed to get elevation data')
    })

    it('should handle negative elevations', async () => {
      mockedAxios.get.mockResolvedValueOnce(mockElevationResponse)

      const result = await service.getElevation([{ lat: 36.4566448, lng: -116.8666666 }])

      expect(result[1].elevation).toBeLessThan(0)
    })
  })

  describe('getStreetView - Street View Metadata', () => {
    const mockStreetViewResponse = {
      data: {
        status: 'OK',
        pano_id: 'CAoSLEFGMVFpcE1fSGU2VnBMVk5fblhGQ2s2N3JKQklnOURjZnNnMlRjMENDLVRr',
        location: { lat: 37.4224764, lng: -122.0842499 },
        copyright: '© 2023 Google',
        date: '2023-05',
        links: [
          { pano: 'pano123', heading: 90, description: 'East' },
          { pano: 'pano456', heading: 270, description: 'West' }
        ]
      }
    }

    it('should fetch Street View metadata successfully', async () => {
      mockedAxios.get.mockResolvedValueOnce(mockStreetViewResponse)

      const coords: Coordinates = { lat: 37.4224764, lng: -122.0842499 }
      const result = await service.getStreetView(coords)

      expect(result).toMatchObject({
        panoId: 'CAoSLEFGMVFpcE1fSGU2VnBMVk5fblhGQ2s2N3JKQklnOURjZnNnMlRjMENDLVRr',
        location: coords,
        copyright: '© 2023 Google',
        date: '2023-05'
      })
      expect(result?.links).toHaveLength(2)
    })

    it('should use default radius of 50 meters', async () => {
      mockedAxios.get.mockResolvedValueOnce(mockStreetViewResponse)

      await service.getStreetView({ lat: 37.4224764, lng: -122.0842499 })

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            radius: 50
          })
        })
      )
    })

    it('should accept custom radius', async () => {
      mockedAxios.get.mockResolvedValueOnce(mockStreetViewResponse)

      await service.getStreetView({ lat: 37.4224764, lng: -122.0842499 }, 100)

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            radius: 100
          })
        })
      )
    })

    it('should return null when no Street View available', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: { status: 'ZERO_RESULTS' } })

      const result = await service.getStreetView({ lat: 0, lng: 0 })

      expect(result).toBeNull()
    })

    it('should handle missing links', async () => {
      const responseWithoutLinks = {
        data: {
          ...mockStreetViewResponse.data,
          links: undefined
        }
      }
      mockedAxios.get.mockResolvedValueOnce(responseWithoutLinks)

      const result = await service.getStreetView({ lat: 37.4224764, lng: -122.0842499 })

      expect(result?.links).toEqual([])
    })

    it('should handle network errors gracefully', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'))

      const result = await service.getStreetView({ lat: 0, lng: 0 })

      expect(result).toBeNull()
    })

    it('should parse links with descriptions', async () => {
      mockedAxios.get.mockResolvedValueOnce(mockStreetViewResponse)

      const result = await service.getStreetView({ lat: 37.4224764, lng: -122.0842499 })

      expect(result?.links[0]).toMatchObject({
        panoId: 'pano123',
        heading: 90,
        description: 'East'
      })
    })

    it('should handle links without descriptions', async () => {
      const responseWithEmptyDescription = {
        data: {
          ...mockStreetViewResponse.data,
          links: [{ pano: 'pano789', heading: 180 }]
        }
      }
      mockedAxios.get.mockResolvedValueOnce(responseWithEmptyDescription)

      const result = await service.getStreetView({ lat: 37.4224764, lng: -122.0842499 })

      expect(result?.links[0]).toMatchObject({
        panoId: 'pano789',
        heading: 180,
        description: ''
      })
    })
  })

  describe('getStreetViewImage - Street View Image URL', () => {
    it('should generate URL with panoId', () => {
      const url = service.getStreetViewImage({
        panoId: 'test-pano-id',
        size: { width: 600, height: 400 }
      })

      expect(url).toContain('https://maps.googleapis.com/maps/api/streetview')
      expect(url).toContain('pano=test-pano-id')
      expect(url).toContain('size=600x400')
    })

    it('should generate URL with location coordinates', () => {
      const url = service.getStreetViewImage({
        location: { lat: 37.4224764, lng: -122.0842499 },
        size: { width: 600, height: 400 }
      })

      expect(url).toContain('location=37.4224764,-122.0842499')
      expect(url).not.toContain('pano=')
    })

    it('should default to heading 0', () => {
      const url = service.getStreetViewImage({
        panoId: 'test-pano-id',
        size: { width: 600, height: 400 }
      })

      expect(url).toContain('heading=0')
    })

    it('should accept custom heading', () => {
      const url = service.getStreetViewImage({
        panoId: 'test-pano-id',
        size: { width: 600, height: 400 },
        heading: 90
      })

      expect(url).toContain('heading=90')
    })

    it('should default to pitch 0', () => {
      const url = service.getStreetViewImage({
        panoId: 'test-pano-id',
        size: { width: 600, height: 400 }
      })

      expect(url).toContain('pitch=0')
    })

    it('should accept custom pitch', () => {
      const url = service.getStreetViewImage({
        panoId: 'test-pano-id',
        size: { width: 600, height: 400 },
        pitch: 45
      })

      expect(url).toContain('pitch=45')
    })

    it('should default to fov 90', () => {
      const url = service.getStreetViewImage({
        panoId: 'test-pano-id',
        size: { width: 600, height: 400 }
      })

      expect(url).toContain('fov=90')
    })

    it('should accept custom fov', () => {
      const url = service.getStreetViewImage({
        panoId: 'test-pano-id',
        size: { width: 600, height: 400 },
        fov: 120
      })

      expect(url).toContain('fov=120')
    })

    it('should include API key', () => {
      const url = service.getStreetViewImage({
        panoId: 'test-pano-id',
        size: { width: 600, height: 400 }
      })

      expect(url).toContain(`key=${mockApiKey}`)
    })
  })

  describe('calculateDistance - Haversine Distance', () => {
    it('should calculate distance between two coordinates', () => {
      const coord1: Coordinates = { lat: 37.4224764, lng: -122.0842499 }
      const coord2: Coordinates = { lat: 37.4238253, lng: -122.0829009 }

      const distance = service.calculateDistance(coord1, coord2)

      expect(distance).toBeGreaterThan(0)
      expect(distance).toBeLessThan(200) // Approximately 180 meters
    })

    it('should return 0 for same coordinates', () => {
      const coord: Coordinates = { lat: 37.4224764, lng: -122.0842499 }

      const distance = service.calculateDistance(coord, coord)

      expect(distance).toBe(0)
    })

    it('should handle long distances correctly', () => {
      const newYork: Coordinates = { lat: 40.7128, lng: -74.0060 }
      const london: Coordinates = { lat: 51.5074, lng: -0.1278 }

      const distance = service.calculateDistance(newYork, london)

      expect(distance).toBeGreaterThan(5_000_000) // > 5000 km
      expect(distance).toBeLessThan(6_000_000) // < 6000 km
    })

    it('should handle southern hemisphere coordinates', () => {
      const sydney: Coordinates = { lat: -33.8688, lng: 151.2093 }
      const melbourne: Coordinates = { lat: -37.8136, lng: 144.9631 }

      const distance = service.calculateDistance(sydney, melbourne)

      expect(distance).toBeGreaterThan(700_000) // > 700 km
      expect(distance).toBeLessThan(800_000) // < 800 km
    })

    it('should handle coordinates crossing date line', () => {
      const coord1: Coordinates = { lat: 0, lng: 179 }
      const coord2: Coordinates = { lat: 0, lng: -179 }

      const distance = service.calculateDistance(coord1, coord2)

      expect(distance).toBeGreaterThan(0)
      expect(distance).toBeLessThan(300_000) // Should be short distance
    })
  })

  describe('calculateBounds - Bounds Calculation', () => {
    it('should calculate bounds from center and radius', () => {
      const center: Coordinates = { lat: 37.4224764, lng: -122.0842499 }
      const radius = 1000 // 1 km

      const bounds = service.calculateBounds(center, radius)

      expect(bounds.northeast.lat).toBeGreaterThan(center.lat)
      expect(bounds.northeast.lng).toBeGreaterThan(center.lng)
      expect(bounds.southwest.lat).toBeLessThan(center.lat)
      expect(bounds.southwest.lng).toBeLessThan(center.lng)
    })

    it('should create symmetric bounds', () => {
      const center: Coordinates = { lat: 0, lng: 0 }
      const radius = 1000

      const bounds = service.calculateBounds(center, radius)

      const latDiff = Math.abs(bounds.northeast.lat - center.lat)
      const latDiffSW = Math.abs(center.lat - bounds.southwest.lat)

      expect(latDiff).toBeCloseTo(latDiffSW, 10)
    })

    it('should handle small radii', () => {
      const center: Coordinates = { lat: 37.4224764, lng: -122.0842499 }
      const radius = 10 // 10 meters

      const bounds = service.calculateBounds(center, radius)

      expect(bounds).toBeDefined()
      expect(bounds.northeast.lat - bounds.southwest.lat).toBeGreaterThan(0)
    })

    it('should handle large radii', () => {
      const center: Coordinates = { lat: 37.4224764, lng: -122.0842499 }
      const radius = 100000 // 100 km

      const bounds = service.calculateBounds(center, radius)

      expect(bounds.northeast.lat - bounds.southwest.lat).toBeGreaterThan(1)
    })

    it('should adjust longitude offset based on latitude', () => {
      const equator: Coordinates = { lat: 0, lng: 0 }
      const arctic: Coordinates = { lat: 80, lng: 0 }
      const radius = 1000

      const boundsEquator = service.calculateBounds(equator, radius)
      const boundsArctic = service.calculateBounds(arctic, radius)

      const lngDiffEquator = boundsEquator.northeast.lng - boundsEquator.southwest.lng
      const lngDiffArctic = boundsArctic.northeast.lng - boundsArctic.southwest.lng

      expect(lngDiffArctic).toBeGreaterThan(lngDiffEquator)
    })
  })

  describe('getAttribution - Attribution Strings', () => {
    it('should return attribution with links by default', () => {
      const attribution = service.getAttribution()

      expect(attribution).toContain('© <a href="https://www.google.com/maps">Google</a>')
      expect(attribution).toContain('Terms')
    })

    it('should return attribution with links when explicitly requested', () => {
      const attribution = service.getAttribution(true)

      expect(attribution).toContain('<a href')
      expect(attribution).toContain('Google')
      expect(attribution).toContain('Terms')
    })

    it('should return plain attribution without links', () => {
      const attribution = service.getAttribution(false)

      expect(attribution).toBe('© Google')
      expect(attribution).not.toContain('<a')
    })
  })

  describe('validateApiKey - API Key Validation', () => {
    it('should return true for valid API key', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { status: 'OK', results: [] }
      })

      const isValid = await service.validateApiKey()

      expect(isValid).toBe(true)
    })

    it('should return false for invalid API key', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { status: 'REQUEST_DENIED' }
      })

      const isValid = await service.validateApiKey()

      expect(isValid).toBe(false)
    })

    it('should return false on network error', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'))

      const isValid = await service.validateApiKey()

      expect(isValid).toBe(false)
    })

    it('should use Google HQ address for validation', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { status: 'OK', results: [] }
      })

      await service.validateApiKey()

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            address: '1600 Amphitheatre Parkway, Mountain View, CA'
          })
        })
      )
    })
  })

  describe('getParcelByAPN - Parcel Data Lookup', () => {
    const mockGeocodeResponse = {
      data: {
        status: 'OK',
        results: [{
          place_id: 'test-place-id',
          formatted_address: '123 Main St, Anytown, CA 12345',
          geometry: {
            location: { lat: 37.4224764, lng: -122.0842499 },
            viewport: {
              northeast: { lat: 37.4238253, lng: -122.0829009 },
              southwest: { lat: 37.4211274, lng: -122.0855988 }
            }
          },
          address_components: []
        }]
      }
    }

    it('should fetch parcel data by APN', async () => {
      mockedAxios.get.mockResolvedValueOnce(mockGeocodeResponse)

      const result = await service.getParcelByAPN('123-456-789')

      expect(result).toMatchObject({
        apn: '123-456-789',
        address: '123 Main St, Anytown, CA 12345',
        coordinates: { lat: 37.4224764, lng: -122.0842499 }
      })
    })

    it('should return placeholder boundaries array', async () => {
      mockedAxios.get.mockResolvedValueOnce(mockGeocodeResponse)

      const result = await service.getParcelByAPN('123-456-789')

      expect(result?.boundaries).toEqual([])
    })

    it('should return undefined for area, zoning, and landUse', async () => {
      mockedAxios.get.mockResolvedValueOnce(mockGeocodeResponse)

      const result = await service.getParcelByAPN('123-456-789')

      expect(result?.area).toBeUndefined()
      expect(result?.zoning).toBeUndefined()
      expect(result?.landUse).toBeUndefined()
    })

    it('should accept optional county parameter', async () => {
      mockedAxios.get.mockResolvedValueOnce(mockGeocodeResponse)

      const result = await service.getParcelByAPN('123-456-789', 'Los Angeles')

      expect(result).toBeDefined()
    })

    it('should return null on geocoding error', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Geocoding failed'))

      const result = await service.getParcelByAPN('invalid-apn')

      expect(result).toBeNull()
    })
  })
})

describe('ImageryAlignmentHelper', () => {
  describe('calculateAlignment', () => {
    it('should calculate alignment transformation', () => {
      const result = ImageryAlignmentHelper.calculateAlignment({
        imageCenter: { lat: 37.422, lng: -122.084 },
        imageBounds: {
          northeast: { lat: 37.423, lng: -122.083 },
          southwest: { lat: 37.421, lng: -122.085 }
        },
        parcelBounds: {
          northeast: { lat: 37.424, lng: -122.082 },
          southwest: { lat: 37.420, lng: -122.086 }
        }
      })

      expect(result).toHaveProperty('scale')
      expect(result).toHaveProperty('offset')
      expect(result).toHaveProperty('rotation')
      expect(result.scale.x).toBeGreaterThan(0)
      expect(result.scale.y).toBeGreaterThan(0)
    })

    it('should calculate scale factors correctly', () => {
      const result = ImageryAlignmentHelper.calculateAlignment({
        imageCenter: { lat: 0, lng: 0 },
        imageBounds: {
          northeast: { lat: 0.001, lng: 0.001 },
          southwest: { lat: -0.001, lng: -0.001 }
        },
        parcelBounds: {
          northeast: { lat: 0.002, lng: 0.002 },
          southwest: { lat: -0.002, lng: -0.002 }
        }
      })

      expect(result.scale.x).toBeCloseTo(2, 10)
      expect(result.scale.y).toBeCloseTo(2, 10)
    })

    it('should calculate offset from center difference', () => {
      const result = ImageryAlignmentHelper.calculateAlignment({
        imageCenter: { lat: 0, lng: 0 },
        imageBounds: {
          northeast: { lat: 0.001, lng: 0.001 },
          southwest: { lat: -0.001, lng: -0.001 }
        },
        parcelBounds: {
          northeast: { lat: 0.101, lng: 0.101 },
          southwest: { lat: 0.099, lng: 0.099 }
        }
      })

      expect(result.offset.x).toBeCloseTo(0.1, 10)
      expect(result.offset.y).toBeCloseTo(0.1, 10)
    })

    it('should default rotation to 0', () => {
      const result = ImageryAlignmentHelper.calculateAlignment({
        imageCenter: { lat: 0, lng: 0 },
        imageBounds: {
          northeast: { lat: 0.001, lng: 0.001 },
          southwest: { lat: -0.001, lng: -0.001 }
        },
        parcelBounds: {
          northeast: { lat: 0.001, lng: 0.001 },
          southwest: { lat: -0.001, lng: -0.001 }
        }
      })

      expect(result.rotation).toBe(0)
    })

    it('should accept custom rotation', () => {
      const result = ImageryAlignmentHelper.calculateAlignment({
        imageCenter: { lat: 0, lng: 0 },
        imageBounds: {
          northeast: { lat: 0.001, lng: 0.001 },
          southwest: { lat: -0.001, lng: -0.001 }
        },
        parcelBounds: {
          northeast: { lat: 0.001, lng: 0.001 },
          southwest: { lat: -0.001, lng: -0.001 }
        },
        rotation: 45
      })

      expect(result.rotation).toBe(45)
    })
  })

  describe('transformCoordinates', () => {
    it('should apply offset transformation', () => {
      const transformation = {
        scale: { x: 1, y: 1 },
        offset: { x: 0.1, y: 0.1 },
        rotation: 0
      }

      const result = ImageryAlignmentHelper.transformCoordinates(
        { lat: 0, lng: 0 },
        transformation
      )

      expect(result.lat).toBeCloseTo(0.1, 10)
      expect(result.lng).toBeCloseTo(0.1, 10)
    })

    it('should apply scale transformation', () => {
      const transformation = {
        scale: { x: 2, y: 2 },
        offset: { x: 0, y: 0 },
        rotation: 0
      }

      const result = ImageryAlignmentHelper.transformCoordinates(
        { lat: 1, lng: 1 },
        transformation
      )

      expect(result.lat).toBeCloseTo(2, 10)
      expect(result.lng).toBeCloseTo(2, 10)
    })

    it('should apply rotation transformation', () => {
      const transformation = {
        scale: { x: 1, y: 1 },
        offset: { x: 0, y: 0 },
        rotation: 90
      }

      const result = ImageryAlignmentHelper.transformCoordinates(
        { lat: 1, lng: 0 },
        transformation
      )

      expect(result.lng).toBeCloseTo(-1, 5)
      expect(result.lat).toBeCloseTo(0, 5)
    })

    it('should skip rotation when 0', () => {
      const transformation = {
        scale: { x: 1, y: 1 },
        offset: { x: 0.5, y: 0.5 },
        rotation: 0
      }

      const result = ImageryAlignmentHelper.transformCoordinates(
        { lat: 1, lng: 1 },
        transformation
      )

      expect(result.lat).toBeCloseTo(1.5, 10)
      expect(result.lng).toBeCloseTo(1.5, 10)
    })

    it('should apply combined transformations in correct order', () => {
      const transformation = {
        scale: { x: 2, y: 2 },
        offset: { x: 1, y: 1 },
        rotation: 0
      }

      const result = ImageryAlignmentHelper.transformCoordinates(
        { lat: 1, lng: 1 },
        transformation
      )

      // Order: offset -> scale -> rotation
      expect(result.lat).toBeCloseTo(4, 10) // (1 + 1) * 2
      expect(result.lng).toBeCloseTo(4, 10)
    })
  })
})

describe('QuotaTracker', () => {
  let tracker: QuotaTracker

  beforeEach(() => {
    tracker = new QuotaTracker(1000)
  })

  afterEach(() => {
    // Clean up any timers
    jest.clearAllTimers()
  })

  describe('Constructor', () => {
    it('should initialize with default daily limit', () => {
      const defaultTracker = new QuotaTracker()
      expect(defaultTracker.getRemaining()).toBe(25000)
    })

    it('should initialize with custom daily limit', () => {
      const customTracker = new QuotaTracker(5000)
      expect(customTracker.getRemaining()).toBe(5000)
    })
  })

  describe('track', () => {
    it('should track API call', () => {
      const success = tracker.track('geocode')

      expect(success).toBe(true)
      expect(tracker.getRemaining()).toBe(999)
    })

    it('should track multiple endpoints separately', () => {
      tracker.track('geocode')
      tracker.track('elevation')

      expect(tracker.getRemaining()).toBe(998)
    })

    it('should track multiple calls to same endpoint', () => {
      tracker.track('geocode')
      tracker.track('geocode')
      tracker.track('geocode')

      expect(tracker.getRemaining()).toBe(997)
    })

    it('should return false when quota exceeded', () => {
      const smallTracker = new QuotaTracker(2)
      smallTracker.track('geocode')
      smallTracker.track('geocode')
      const result = smallTracker.track('geocode')

      expect(result).toBe(false)
      expect(smallTracker.getRemaining()).toBe(0)
    })

    it('should not increment usage when quota exceeded', () => {
      const smallTracker = new QuotaTracker(1)
      smallTracker.track('geocode')
      smallTracker.track('geocode') // Should fail

      expect(smallTracker.getRemaining()).toBe(0)
    })
  })

  describe('getRemaining', () => {
    it('should return initial quota', () => {
      expect(tracker.getRemaining()).toBe(1000)
    })

    it('should return correct remaining after usage', () => {
      tracker.track('geocode')
      tracker.track('elevation')
      tracker.track('streetview')

      expect(tracker.getRemaining()).toBe(997)
    })

    it('should never return negative values', () => {
      const smallTracker = new QuotaTracker(1)
      smallTracker.track('geocode')
      smallTracker.track('geocode') // Exceeds quota

      expect(smallTracker.getRemaining()).toBe(0)
    })
  })
})
