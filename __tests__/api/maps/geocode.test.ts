/**
 * Integration Tests for Google Maps Geocoding API
 *
 * Tests address geocoding and reverse geocoding
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-key'
const supabase = createClient(supabaseUrl, supabaseKey)

// Skip tests if Google Maps API key is not configured
const skipIfNoApiKey = process.env.GOOGLE_MAPS_API_KEY ? describe : describe.skip

skipIfNoApiKey('Google Maps Geocoding API', () => {
  let testUserId: string
  let authToken: string

  beforeAll(async () => {
    // Create test user
    const { data: { user }, error } = await supabase.auth.admin.createUser({
      email: 'maps-test@example.com',
      password: 'test-password-123',
      email_confirm: true
    })

    if (error || !user) {
      throw new Error('Failed to create test user')
    }

    testUserId = user.id

    // Sign in to get auth token
    const { data: { session } } = await supabase.auth.signInWithPassword({
      email: 'maps-test@example.com',
      password: 'test-password-123'
    })

    if (!session) {
      throw new Error('Failed to sign in')
    }

    authToken = session.access_token
  })

  afterAll(async () => {
    // Cleanup
    await supabase.auth.admin.deleteUser(testUserId)
  })

  describe('GET /api/maps/geocode', () => {
    it('should geocode a valid address', async () => {
      const address = '1600 Amphitheatre Parkway, Mountain View, CA'
      const response = await fetch(
        `http://localhost:3000/api/maps/geocode?address=${encodeURIComponent(address)}`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data).toBeDefined()
      expect(data.data.coordinates).toBeDefined()
      expect(data.data.coordinates.lat).toBeCloseTo(37.4224, 2)
      expect(data.data.coordinates.lng).toBeCloseTo(-122.0842, 2)
      expect(data.data.formattedAddress).toContain('Mountain View')
      expect(data.data.placeId).toBeDefined()
    })

    it('should reverse geocode valid coordinates', async () => {
      const lat = 37.4224
      const lng = -122.0842

      const response = await fetch(
        `http://localhost:3000/api/maps/geocode?lat=${lat}&lng=${lng}`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data).toBeDefined()
      expect(data.data.formattedAddress).toBeDefined()
      expect(data.data.coordinates.lat).toBeCloseTo(lat, 4)
      expect(data.data.coordinates.lng).toBeCloseTo(lng, 4)
    })

    it('should return error for invalid address', async () => {
      const address = 'THIS IS NOT A REAL ADDRESS XYZABC123'
      const response = await fetch(
        `http://localhost:3000/api/maps/geocode?address=${encodeURIComponent(address)}`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toBeDefined()
    })

    it('should validate coordinate ranges', async () => {
      const invalidCases = [
        { lat: 91, lng: 0 },    // lat > 90
        { lat: -91, lng: 0 },   // lat < -90
        { lat: 0, lng: 181 },   // lng > 180
        { lat: 0, lng: -181 }   // lng < -180
      ]

      for (const coords of invalidCases) {
        const response = await fetch(
          `http://localhost:3000/api/maps/geocode?lat=${coords.lat}&lng=${coords.lng}`,
          {
            headers: {
              'Authorization': `Bearer ${authToken}`
            }
          }
        )

        expect(response.status).toBe(400)

        const data = await response.json()
        expect(data.error).toContain('range')
      }
    })

    it('should require either address or coordinates', async () => {
      const response = await fetch(
        `http://localhost:3000/api/maps/geocode`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('required')
    })

    it('should require authentication', async () => {
      const response = await fetch(
        `http://localhost:3000/api/maps/geocode?address=test`
      )

      expect(response.status).toBe(401)
    })

    it('should return address components', async () => {
      const address = '1600 Amphitheatre Parkway, Mountain View, CA'
      const response = await fetch(
        `http://localhost:3000/api/maps/geocode?address=${encodeURIComponent(address)}`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      const data = await response.json()
      expect(data.data.addressComponents).toBeDefined()
      expect(Array.isArray(data.data.addressComponents)).toBe(true)
      expect(data.data.addressComponents.length).toBeGreaterThan(0)

      // Check for common components
      const hasStreetNumber = data.data.addressComponents.some(
        (c: any) => c.types.includes('street_number')
      )
      const hasRoute = data.data.addressComponents.some(
        (c: any) => c.types.includes('route')
      )
      const hasLocality = data.data.addressComponents.some(
        (c: any) => c.types.includes('locality')
      )

      expect(hasStreetNumber || hasRoute).toBe(true)
      expect(hasLocality).toBe(true)
    })

    it('should return viewport bounds', async () => {
      const address = '1600 Amphitheatre Parkway, Mountain View, CA'
      const response = await fetch(
        `http://localhost:3000/api/maps/geocode?address=${encodeURIComponent(address)}`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      const data = await response.json()
      expect(data.data.viewport).toBeDefined()
      expect(data.data.viewport.northeast).toBeDefined()
      expect(data.data.viewport.southwest).toBeDefined()
      expect(data.data.viewport.northeast.lat).toBeGreaterThan(data.data.viewport.southwest.lat)
      expect(data.data.viewport.northeast.lng).toBeGreaterThan(data.data.viewport.southwest.lng)
    })
  })
})
