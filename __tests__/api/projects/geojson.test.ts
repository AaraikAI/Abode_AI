/**
 * GeoJSON API Route Tests
 * Tests GeoJSON CRUD operations, validation, authentication, and error handling
 */

import { GET, POST, PUT, DELETE } from '@/app/api/projects/[projectId]/geojson/route'
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { createClient } from '@supabase/supabase-js'

// Mock dependencies
jest.mock('next-auth')
jest.mock('@supabase/supabase-js')

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>

describe('GeoJSON API Routes', () => {
  let mockSupabase: any
  const projectId = 'test-project-123'
  const userId = 'user-456'
  const orgId = 'org-789'

  const mockSession = {
    user: {
      id: userId,
      email: 'test@example.com'
    }
  }

  const mockProject = {
    id: projectId,
    name: 'Test Project',
    organizations: {
      id: orgId
    }
  }

  const mockMembership = {
    roles: ['designer', 'admin']
  }

  const sampleFeature = {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [100.0, 0.0]
    },
    properties: {
      name: 'Test Feature'
    }
  }

  const sampleFeatureCollection = {
    type: 'FeatureCollection',
    features: [sampleFeature]
  }

  beforeEach(() => {
    jest.clearAllMocks()

    // Mock Supabase client
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis()
    }

    mockCreateClient.mockReturnValue(mockSupabase)
  })

  describe('GET /api/projects/[projectId]/geojson', () => {
    test('should retrieve GeoJSON data for a project', async () => {
      mockGetServerSession.mockResolvedValue(mockSession as any)

      mockSupabase.single.mockResolvedValueOnce({
        data: mockProject,
        error: null
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: mockMembership,
        error: null
      })

      mockSupabase.order.mockResolvedValue({
        data: [
          {
            id: 'parsed-1',
            geojson: sampleFeatureCollection,
            parsed_at: new Date().toISOString()
          }
        ],
        error: null
      })

      const request = new NextRequest(
        `http://localhost:3000/api/projects/${projectId}/geojson`
      )

      const response = await GET(request, { params: { projectId } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.type).toBe('FeatureCollection')
      expect(data.features).toHaveLength(1)
      expect(data.features[0]).toEqual(sampleFeature)
    })

    test('should return empty FeatureCollection when no features exist', async () => {
      mockGetServerSession.mockResolvedValue(mockSession as any)

      mockSupabase.single.mockResolvedValueOnce({
        data: mockProject,
        error: null
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: mockMembership,
        error: null
      })

      mockSupabase.order.mockResolvedValue({
        data: [],
        error: null
      })

      const request = new NextRequest(
        `http://localhost:3000/api/projects/${projectId}/geojson`
      )

      const response = await GET(request, { params: { projectId } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.type).toBe('FeatureCollection')
      expect(data.features).toEqual([])
    })

    test('should return 401 when not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const request = new NextRequest(
        `http://localhost:3000/api/projects/${projectId}/geojson`
      )

      const response = await GET(request, { params: { projectId } })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    test('should return 404 when project not found', async () => {
      mockGetServerSession.mockResolvedValue(mockSession as any)

      mockSupabase.single.mockResolvedValue({
        data: null,
        error: new Error('Not found')
      })

      const request = new NextRequest(
        `http://localhost:3000/api/projects/${projectId}/geojson`
      )

      const response = await GET(request, { params: { projectId } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Project not found')
    })

    test('should return 403 when user lacks organization access', async () => {
      mockGetServerSession.mockResolvedValue(mockSession as any)

      mockSupabase.single.mockResolvedValueOnce({
        data: mockProject,
        error: null
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: null
      })

      const request = new NextRequest(
        `http://localhost:3000/api/projects/${projectId}/geojson`
      )

      const response = await GET(request, { params: { projectId } })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Forbidden')
    })

    test('should calculate and include bounding box', async () => {
      mockGetServerSession.mockResolvedValue(mockSession as any)

      mockSupabase.single.mockResolvedValueOnce({
        data: mockProject,
        error: null
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: mockMembership,
        error: null
      })

      const multiFeatureCollection = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [0, 0] },
            properties: {}
          },
          {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [100, 100] },
            properties: {}
          }
        ]
      }

      mockSupabase.order.mockResolvedValue({
        data: [{ geojson: multiFeatureCollection }],
        error: null
      })

      const request = new NextRequest(
        `http://localhost:3000/api/projects/${projectId}/geojson`
      )

      const response = await GET(request, { params: { projectId } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.bbox).toBeDefined()
      expect(Array.isArray(data.bbox)).toBe(true)
      expect(data.bbox).toHaveLength(4)
    })
  })

  describe('POST /api/projects/[projectId]/geojson', () => {
    test('should add new features to project', async () => {
      mockGetServerSession.mockResolvedValue(mockSession as any)

      mockSupabase.single.mockResolvedValueOnce({
        data: mockProject,
        error: null
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: mockMembership,
        error: null
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: null
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: 'parsed-new',
          geojson: sampleFeatureCollection
        },
        error: null
      })

      const request = new NextRequest(
        `http://localhost:3000/api/projects/${projectId}/geojson`,
        {
          method: 'POST',
          body: JSON.stringify({
            features: [sampleFeature]
          })
        }
      )

      const response = await POST(request, { params: { projectId } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('Features added successfully')
      expect(data.featureCount).toBe(1)
      expect(mockSupabase.insert).toHaveBeenCalled()
    })

    test('should merge features with existing collection', async () => {
      mockGetServerSession.mockResolvedValue(mockSession as any)

      mockSupabase.single.mockResolvedValueOnce({
        data: mockProject,
        error: null
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: mockMembership,
        error: null
      })

      const existingFeature = {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [50, 50] },
        properties: { name: 'Existing' }
      }

      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: 'parsed-existing',
          geojson: {
            type: 'FeatureCollection',
            features: [existingFeature]
          }
        },
        error: null
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: 'parsed-existing',
          geojson: {
            type: 'FeatureCollection',
            features: [existingFeature, sampleFeature]
          }
        },
        error: null
      })

      const request = new NextRequest(
        `http://localhost:3000/api/projects/${projectId}/geojson`,
        {
          method: 'POST',
          body: JSON.stringify({
            features: [sampleFeature]
          })
        }
      )

      const response = await POST(request, { params: { projectId } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(mockSupabase.update).toHaveBeenCalled()
    })

    test('should validate features array is required', async () => {
      mockGetServerSession.mockResolvedValue(mockSession as any)

      const request = new NextRequest(
        `http://localhost:3000/api/projects/${projectId}/geojson`,
        {
          method: 'POST',
          body: JSON.stringify({})
        }
      )

      const response = await POST(request, { params: { projectId } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Features array is required')
    })

    test('should validate each feature has valid type', async () => {
      mockGetServerSession.mockResolvedValue(mockSession as any)

      const invalidFeature = {
        type: 'InvalidType',
        geometry: { type: 'Point', coordinates: [0, 0] }
      }

      const request = new NextRequest(
        `http://localhost:3000/api/projects/${projectId}/geojson`,
        {
          method: 'POST',
          body: JSON.stringify({
            features: [invalidFeature]
          })
        }
      )

      const response = await POST(request, { params: { projectId } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid feature type')
    })

    test('should validate each feature has geometry', async () => {
      mockGetServerSession.mockResolvedValue(mockSession as any)

      const invalidFeature = {
        type: 'Feature',
        properties: { name: 'No Geometry' }
      }

      const request = new NextRequest(
        `http://localhost:3000/api/projects/${projectId}/geojson`,
        {
          method: 'POST',
          body: JSON.stringify({
            features: [invalidFeature]
          })
        }
      )

      const response = await POST(request, { params: { projectId } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('valid geometry')
    })

    test('should require designer or admin role', async () => {
      mockGetServerSession.mockResolvedValue(mockSession as any)

      mockSupabase.single.mockResolvedValueOnce({
        data: mockProject,
        error: null
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: { roles: ['viewer'] },
        error: null
      })

      const request = new NextRequest(
        `http://localhost:3000/api/projects/${projectId}/geojson`,
        {
          method: 'POST',
          body: JSON.stringify({
            features: [sampleFeature]
          })
        }
      )

      const response = await POST(request, { params: { projectId } })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toContain('Forbidden')
    })

    test('should log audit event on success', async () => {
      mockGetServerSession.mockResolvedValue(mockSession as any)

      mockSupabase.single.mockResolvedValueOnce({
        data: mockProject,
        error: null
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: mockMembership,
        error: null
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: null
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'parsed-new', geojson: sampleFeatureCollection },
        error: null
      })

      const request = new NextRequest(
        `http://localhost:3000/api/projects/${projectId}/geojson`,
        {
          method: 'POST',
          body: JSON.stringify({
            features: [sampleFeature]
          })
        }
      )

      await POST(request, { params: { projectId } })

      // Verify audit log was called
      const fromCalls = mockSupabase.from.mock.calls
      const auditCall = fromCalls.find((call: any) => call[0] === 'compliance_audit_events')
      expect(auditCall).toBeDefined()
    })
  })

  describe('PUT /api/projects/[projectId]/geojson', () => {
    test('should replace entire FeatureCollection', async () => {
      mockGetServerSession.mockResolvedValue(mockSession as any)

      mockSupabase.single.mockResolvedValueOnce({
        data: mockProject,
        error: null
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: mockMembership,
        error: null
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: 'parsed-existing',
          geojson: sampleFeatureCollection
        },
        error: null
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: 'parsed-existing',
          geojson: sampleFeatureCollection
        },
        error: null
      })

      const request = new NextRequest(
        `http://localhost:3000/api/projects/${projectId}/geojson`,
        {
          method: 'PUT',
          body: JSON.stringify(sampleFeatureCollection)
        }
      )

      const response = await PUT(request, { params: { projectId } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('FeatureCollection replaced successfully')
      expect(mockSupabase.update).toHaveBeenCalled()
    })

    test('should validate FeatureCollection type', async () => {
      mockGetServerSession.mockResolvedValue(mockSession as any)

      const request = new NextRequest(
        `http://localhost:3000/api/projects/${projectId}/geojson`,
        {
          method: 'PUT',
          body: JSON.stringify({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [0, 0] }
          })
        }
      )

      const response = await PUT(request, { params: { projectId } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('FeatureCollection')
    })

    test('should validate features array exists', async () => {
      mockGetServerSession.mockResolvedValue(mockSession as any)

      const request = new NextRequest(
        `http://localhost:3000/api/projects/${projectId}/geojson`,
        {
          method: 'PUT',
          body: JSON.stringify({
            type: 'FeatureCollection'
          })
        }
      )

      const response = await PUT(request, { params: { projectId } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('features array')
    })

    test('should create new entry if none exists', async () => {
      mockGetServerSession.mockResolvedValue(mockSession as any)

      mockSupabase.single.mockResolvedValueOnce({
        data: mockProject,
        error: null
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: mockMembership,
        error: null
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: null
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: 'parsed-new',
          geojson: sampleFeatureCollection
        },
        error: null
      })

      const request = new NextRequest(
        `http://localhost:3000/api/projects/${projectId}/geojson`,
        {
          method: 'PUT',
          body: JSON.stringify(sampleFeatureCollection)
        }
      )

      const response = await PUT(request, { params: { projectId } })

      expect(response.status).toBe(200)
      expect(mockSupabase.insert).toHaveBeenCalled()
    })
  })

  describe('DELETE /api/projects/[projectId]/geojson', () => {
    test('should delete all features when all=true', async () => {
      mockGetServerSession.mockResolvedValue(mockSession as any)

      mockSupabase.single.mockResolvedValueOnce({
        data: mockProject,
        error: null
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: mockMembership,
        error: null
      })

      mockSupabase.delete.mockResolvedValue({
        data: null,
        error: null
      })

      const request = new NextRequest(
        `http://localhost:3000/api/projects/${projectId}/geojson?all=true`,
        { method: 'DELETE' }
      )

      const response = await DELETE(request, { params: { projectId } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('All GeoJSON features deleted successfully')
      expect(mockSupabase.delete).toHaveBeenCalled()
    })

    test('should delete specific features by ID', async () => {
      mockGetServerSession.mockResolvedValue(mockSession as any)

      mockSupabase.single.mockResolvedValueOnce({
        data: mockProject,
        error: null
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: mockMembership,
        error: null
      })

      const featuresWithIds = {
        type: 'FeatureCollection',
        features: [
          { ...sampleFeature, id: 'feature-1' },
          { ...sampleFeature, id: 'feature-2' }
        ]
      }

      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: 'parsed-1',
          geojson: featuresWithIds
        },
        error: null
      })

      const request = new NextRequest(
        `http://localhost:3000/api/projects/${projectId}/geojson?featureIds=feature-1`,
        { method: 'DELETE' }
      )

      const response = await DELETE(request, { params: { projectId } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.deletedCount).toBe(1)
      expect(data.remainingCount).toBe(1)
    })

    test('should return 404 when no features found', async () => {
      mockGetServerSession.mockResolvedValue(mockSession as any)

      mockSupabase.single.mockResolvedValueOnce({
        data: mockProject,
        error: null
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: mockMembership,
        error: null
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: null
      })

      const request = new NextRequest(
        `http://localhost:3000/api/projects/${projectId}/geojson?featureIds=feature-1`,
        { method: 'DELETE' }
      )

      const response = await DELETE(request, { params: { projectId } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toContain('No GeoJSON features found')
    })

    test('should return 400 when no featureIds or all parameter', async () => {
      mockGetServerSession.mockResolvedValue(mockSession as any)

      mockSupabase.single.mockResolvedValueOnce({
        data: mockProject,
        error: null
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: mockMembership,
        error: null
      })

      const request = new NextRequest(
        `http://localhost:3000/api/projects/${projectId}/geojson`,
        { method: 'DELETE' }
      )

      const response = await DELETE(request, { params: { projectId } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Feature IDs are required')
    })

    test('should return 404 when specified feature IDs not found', async () => {
      mockGetServerSession.mockResolvedValue(mockSession as any)

      mockSupabase.single.mockResolvedValueOnce({
        data: mockProject,
        error: null
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: mockMembership,
        error: null
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: 'parsed-1',
          geojson: {
            type: 'FeatureCollection',
            features: [{ ...sampleFeature, id: 'different-id' }]
          }
        },
        error: null
      })

      const request = new NextRequest(
        `http://localhost:3000/api/projects/${projectId}/geojson?featureIds=nonexistent-id`,
        { method: 'DELETE' }
      )

      const response = await DELETE(request, { params: { projectId } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toContain('No features found with the specified IDs')
    })
  })

  describe('Error Handling', () => {
    test('should handle database errors gracefully', async () => {
      mockGetServerSession.mockResolvedValue(mockSession as any)

      mockSupabase.single.mockResolvedValue({
        data: null,
        error: new Error('Database connection failed')
      })

      const request = new NextRequest(
        `http://localhost:3000/api/projects/${projectId}/geojson`
      )

      const response = await GET(request, { params: { projectId } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBeDefined()
    })

    test('should handle malformed JSON in POST', async () => {
      mockGetServerSession.mockResolvedValue(mockSession as any)

      const request = new NextRequest(
        `http://localhost:3000/api/projects/${projectId}/geojson`,
        {
          method: 'POST',
          body: 'invalid json'
        }
      )

      const response = await POST(request, { params: { projectId } })

      expect(response.status).toBe(500)
    })

    test('should validate invalid project ID format', async () => {
      mockGetServerSession.mockResolvedValue(mockSession as any)

      const request = new NextRequest(
        'http://localhost:3000/api/projects//geojson'
      )

      const response = await GET(request, { params: { projectId: '' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Project ID is required')
    })
  })
})
