/**
 * Blockchain Material History API Route Tests
 * Tests complete material provenance chain from source to installation
 */

import { GET } from '@/app/api/blockchain/materials/[id]/history/route'
import { createClient } from '@/lib/supabase/server'
import { BlockchainIntegrationService } from '@/lib/services/blockchain-integration'
import { NextRequest } from 'next/server'

// Mock dependencies
jest.mock('@/lib/supabase/server')
jest.mock('@/lib/services/blockchain-integration')

describe('GET /api/blockchain/materials/[id]/history', () => {
  let mockSupabase: any
  let mockBlockchainService: any

  const mockMaterial = {
    material_id: 'mat_123_abc',
    user_id: 'user-123',
    material_name: 'Oak Wood',
    material_type: 'Timber',
    origin: {
      supplier: 'Forest Inc',
      location: 'Pacific Northwest',
      certifications: ['FSC']
    },
    sustainability: {
      carbonFootprint: 50,
      renewableContent: 100,
      recycledContent: 0
    },
    blockchain_network: 'polygon',
    contract_address: '0x1234567890',
    transaction_hash: '0xabcdef',
    block_number: 12345678,
    verified: true,
    verified_by: 'user-456',
    verified_at: '2024-01-15T10:00:00Z',
    proof_url: 'ipfs://Qm123',
    tracking_url: 'https://abode.ai/track/mat_123_abc',
    qr_code_url: 'data:image/png;base64,qrcode',
    created_at: '2024-01-01T00:00:00Z'
  }

  const mockEvents = [
    {
      event_id: 'event_1',
      material_id: 'mat_123_abc',
      event_type: 'extraction',
      timestamp: '2024-01-01T08:00:00Z',
      location: 'Forest Site A',
      actor: 'Harvest Team',
      description: 'Timber harvested from sustainable forest',
      data: { quantity: 100, unit: 'kg' },
      transaction_hash: '0xhash1',
      block_number: 12345678,
      verified: true
    },
    {
      event_id: 'event_2',
      material_id: 'mat_123_abc',
      event_type: 'processing',
      timestamp: '2024-01-02T10:00:00Z',
      location: 'Sawmill B',
      actor: 'Processing Team',
      description: 'Timber processed and cut',
      data: { quantity: 95, unit: 'kg' },
      transaction_hash: '0xhash2',
      block_number: 12345679,
      verified: true
    },
    {
      event_id: 'event_3',
      material_id: 'mat_123_abc',
      event_type: 'shipping',
      timestamp: '2024-01-05T14:00:00Z',
      location: 'Port C',
      actor: 'Shipping Company',
      description: 'Shipped to distribution center',
      data: { temperature: 20, humidity: 60 },
      transaction_hash: '0xhash3',
      block_number: 12345680,
      verified: true
    }
  ]

  beforeEach(() => {
    mockSupabase = {
      auth: {
        getUser: jest.fn()
      },
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis()
    }

    mockBlockchainService = {
      verifySupplyChain: jest.fn()
    }

    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)
    ;(BlockchainIntegrationService as jest.Mock).mockImplementation(() => mockBlockchainService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  // Authentication Tests
  describe('Authentication', () => {
    test('should require authentication', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Unauthorized')
      })

      const request = new NextRequest('http://localhost:3000/api/blockchain/materials/mat_123/history')
      const response = await GET(request, { params: { id: 'mat_123' } })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    test('should reject missing user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/blockchain/materials/mat_123/history')
      const response = await GET(request, { params: { id: 'mat_123' } })

      expect(response.status).toBe(401)
    })
  })

  // Validation Tests
  describe('Input Validation', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })
    })

    test('should require material ID', async () => {
      const request = new NextRequest('http://localhost:3000/api/blockchain/materials//history')
      const response = await GET(request, { params: { id: '' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Material ID is required')
    })

    test('should validate material ID type', async () => {
      const request = new NextRequest('http://localhost:3000/api/blockchain/materials/123/history')
      const response = await GET(request, { params: { id: 123 as any } })

      expect(response.status).toBe(400)
    })
  })

  // Material Not Found Tests
  describe('Material Not Found', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })
    })

    test('should return 404 for non-existent material', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: new Error('Not found')
      })

      const request = new NextRequest('http://localhost:3000/api/blockchain/materials/invalid_id/history')
      const response = await GET(request, { params: { id: 'invalid_id' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Material not found')
    })
  })

  // Permission Tests
  describe('Permissions', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-789' } },
        error: null
      })
    })

    test('should check user access to material', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { ...mockMaterial, user_id: 'user-123' },
        error: null
      })

      mockSupabase.select.mockReturnValueOnce({
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: null
        })
      })

      const request = new NextRequest('http://localhost:3000/api/blockchain/materials/mat_123/history')
      const response = await GET(request, { params: { id: 'mat_123' } })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toContain('Forbidden')
    })

    test('should allow owner access', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: mockMaterial,
        error: null
      })

      mockSupabase.order.mockResolvedValue({
        data: mockEvents,
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/blockchain/materials/mat_123/history')
      const response = await GET(request, { params: { id: 'mat_123' } })

      expect(response.status).toBe(200)
    })

    test('should allow access via shared project', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-789' } },
        error: null
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: { ...mockMaterial, user_id: 'user-123' },
        error: null
      })

      // Mock project materials query
      const fromMock = jest.fn().mockReturnThis()
      const selectMock = jest.fn().mockReturnThis()
      const eqMock = jest.fn().mockResolvedValue({
        data: [{
          project_id: 'proj_1',
          projects: {
            user_id: 'user-789',
            shared_with: []
          }
        }],
        error: null
      })

      mockSupabase.from = fromMock
      fromMock.mockReturnValue({
        select: selectMock,
        eq: eqMock,
        single: mockSupabase.single,
        order: mockSupabase.order
      })

      selectMock.mockReturnValue({
        eq: eqMock
      })

      mockSupabase.order.mockResolvedValue({
        data: mockEvents,
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/blockchain/materials/mat_123/history')
      const response = await GET(request, { params: { id: 'mat_123' } })

      expect(response.status).toBe(200)
    })
  })

  // History Retrieval Tests
  describe('History Retrieval', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValue({
        data: mockMaterial,
        error: null
      })

      mockSupabase.order.mockResolvedValue({
        data: mockEvents,
        error: null
      })
    })

    test('should retrieve complete material history', async () => {
      const request = new NextRequest('http://localhost:3000/api/blockchain/materials/mat_123/history')
      const response = await GET(request, { params: { id: 'mat_123' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.material).toBeDefined()
      expect(data.provenance).toBeDefined()
      expect(data.timeline).toBeDefined()
    })

    test('should include material details', async () => {
      const request = new NextRequest('http://localhost:3000/api/blockchain/materials/mat_123/history')
      const response = await GET(request, { params: { id: 'mat_123' } })
      const data = await response.json()

      expect(data.material.materialId).toBe('mat_123_abc')
      expect(data.material.materialName).toBe('Oak Wood')
      expect(data.material.materialType).toBe('Timber')
      expect(data.material.origin).toBeDefined()
      expect(data.material.sustainability).toBeDefined()
    })

    test('should include blockchain information', async () => {
      const request = new NextRequest('http://localhost:3000/api/blockchain/materials/mat_123/history')
      const response = await GET(request, { params: { id: 'mat_123' } })
      const data = await response.json()

      expect(data.material.blockchain.network).toBe('polygon')
      expect(data.material.blockchain.contractAddress).toBeTruthy()
      expect(data.material.blockchain.transactionHash).toBeTruthy()
      expect(data.material.blockchain.blockNumber).toBeTruthy()
    })

    test('should include supply chain events in order', async () => {
      const request = new NextRequest('http://localhost:3000/api/blockchain/materials/mat_123/history')
      const response = await GET(request, { params: { id: 'mat_123' } })
      const data = await response.json()

      expect(data.provenance.supplyChain).toHaveLength(3)
      expect(data.provenance.supplyChain[0].eventType).toBe('extraction')
      expect(data.provenance.supplyChain[1].eventType).toBe('processing')
      expect(data.provenance.supplyChain[2].eventType).toBe('shipping')
    })

    test('should calculate journey statistics', async () => {
      const request = new NextRequest('http://localhost:3000/api/blockchain/materials/mat_123/history')
      const response = await GET(request, { params: { id: 'mat_123' } })
      const data = await response.json()

      expect(data.provenance.journeyStats.totalEvents).toBe(3)
      expect(data.provenance.journeyStats.startDate).toBeTruthy()
      expect(data.provenance.journeyStats.endDate).toBeTruthy()
      expect(data.provenance.journeyStats.locations).toBeDefined()
      expect(data.provenance.journeyStats.actors).toBeDefined()
      expect(data.provenance.journeyStats.eventTypes).toBeDefined()
    })

    test('should include timeline format', async () => {
      const request = new NextRequest('http://localhost:3000/api/blockchain/materials/mat_123/history')
      const response = await GET(request, { params: { id: 'mat_123' } })
      const data = await response.json()

      expect(data.timeline).toHaveLength(3)
      expect(data.timeline[0].step).toBe(1)
      expect(data.timeline[0].eventType).toBe('extraction')
      expect(data.timeline[0].blockchainProof).toBeDefined()
    })

    test('should handle empty supply chain', async () => {
      mockSupabase.order.mockResolvedValue({
        data: [],
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/blockchain/materials/mat_123/history')
      const response = await GET(request, { params: { id: 'mat_123' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.provenance.supplyChain).toHaveLength(0)
      expect(data.timeline).toHaveLength(0)
    })
  })

  // Query Parameters Tests
  describe('Query Parameters', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValue({
        data: mockMaterial,
        error: null
      })

      mockSupabase.order.mockResolvedValue({
        data: mockEvents,
        error: null
      })

      mockBlockchainService.verifySupplyChain.mockResolvedValue({
        valid: true,
        events: mockEvents,
        issues: []
      })
    })

    test('should support verification parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/blockchain/materials/mat_123/history?includeVerification=true')
      const response = await GET(request, { params: { id: 'mat_123' } })
      const data = await response.json()

      expect(mockBlockchainService.verifySupplyChain).toHaveBeenCalledWith('mat_123')
      expect(data.provenance.verification).toBeDefined()
    })

    test('should support timeline format', async () => {
      const request = new NextRequest('http://localhost:3000/api/blockchain/materials/mat_123/history?format=timeline')
      const response = await GET(request, { params: { id: 'mat_123' } })
      const data = await response.json()

      expect(data.timeline).toBeDefined()
      expect(data.stats).toBeDefined()
      expect(data.materialId).toBe('mat_123_abc')
    })

    test('should support CSV export format', async () => {
      const request = new NextRequest('http://localhost:3000/api/blockchain/materials/mat_123/history?format=csv')
      const response = await GET(request, { params: { id: 'mat_123' } })
      const text = await response.text()

      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toBe('text/csv')
      expect(response.headers.get('Content-Disposition')).toContain('material-mat_123-history.csv')
      expect(text).toContain('Step,Event Type,Date,Location,Actor,Description,Transaction Hash')
    })

    test('should default to JSON format', async () => {
      const request = new NextRequest('http://localhost:3000/api/blockchain/materials/mat_123/history')
      const response = await GET(request, { params: { id: 'mat_123' } })
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.material).toBeDefined()
      expect(data.provenance).toBeDefined()
    })
  })

  // Error Handling Tests
  describe('Error Handling', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })
    })

    test('should handle database errors', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: new Error('Database connection failed')
      })

      const request = new NextRequest('http://localhost:3000/api/blockchain/materials/mat_123/history')
      const response = await GET(request, { params: { id: 'mat_123' } })
      const data = await response.json()

      expect(response.status).toBe(404)
    })

    test('should handle events fetch errors gracefully', async () => {
      mockSupabase.single.mockResolvedValue({
        data: mockMaterial,
        error: null
      })

      mockSupabase.order.mockResolvedValue({
        data: null,
        error: new Error('Events fetch failed')
      })

      const request = new NextRequest('http://localhost:3000/api/blockchain/materials/mat_123/history')
      const response = await GET(request, { params: { id: 'mat_123' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.provenance.supplyChain).toHaveLength(0)
    })

    test('should handle verification errors', async () => {
      mockSupabase.single.mockResolvedValue({
        data: mockMaterial,
        error: null
      })

      mockSupabase.order.mockResolvedValue({
        data: mockEvents,
        error: null
      })

      mockBlockchainService.verifySupplyChain.mockRejectedValue(
        new Error('Verification failed')
      )

      const request = new NextRequest('http://localhost:3000/api/blockchain/materials/mat_123/history?includeVerification=true')
      const response = await GET(request, { params: { id: 'mat_123' } })

      expect(response.status).toBe(500)
    })
  })
})
