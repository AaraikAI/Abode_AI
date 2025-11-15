/**
 * Blockchain Materials Register API Route Tests
 * Tests material registration on blockchain with provenance and QR code generation
 */

import { POST } from '@/app/api/blockchain/materials/register/route'
import { createClient } from '@/lib/supabase/server'
import { BlockchainIntegrationService } from '@/lib/services/blockchain-integration'
import { NextRequest } from 'next/server'
import QRCode from 'qrcode'

// Mock dependencies
jest.mock('@/lib/supabase/server')
jest.mock('@/lib/services/blockchain-integration')
jest.mock('qrcode')

describe('POST /api/blockchain/materials/register', () => {
  let mockSupabase: any
  let mockBlockchainService: any

  beforeEach(() => {
    mockSupabase = {
      auth: {
        getUser: jest.fn()
      },
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis()
    }

    mockBlockchainService = {
      registerMaterial: jest.fn()
    }

    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)
    ;(BlockchainIntegrationService as jest.Mock).mockImplementation(() => mockBlockchainService)
    ;(QRCode.toDataURL as jest.Mock).mockResolvedValue('data:image/png;base64,mockqrcode')
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

      const request = new NextRequest('http://localhost:3000/api/blockchain/materials/register', {
        method: 'POST',
        body: JSON.stringify({ materialName: 'Test Material' })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    test('should reject missing user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/blockchain/materials/register', {
        method: 'POST',
        body: JSON.stringify({ materialName: 'Test' })
      })

      const response = await POST(request)
      expect(response.status).toBe(401)
    })
  })

  // Validation Tests
  describe('Input Validation', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null
      })
    })

    test('should require material name', async () => {
      const request = new NextRequest('http://localhost:3000/api/blockchain/materials/register', {
        method: 'POST',
        body: JSON.stringify({})
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Material name is required')
    })

    test('should validate material name is string', async () => {
      const request = new NextRequest('http://localhost:3000/api/blockchain/materials/register', {
        method: 'POST',
        body: JSON.stringify({ materialName: 123 })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('must be a string')
    })

    test('should require material type', async () => {
      const request = new NextRequest('http://localhost:3000/api/blockchain/materials/register', {
        method: 'POST',
        body: JSON.stringify({ materialName: 'Wood' })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Material type is required')
    })

    test('should validate material type is string', async () => {
      const request = new NextRequest('http://localhost:3000/api/blockchain/materials/register', {
        method: 'POST',
        body: JSON.stringify({
          materialName: 'Wood',
          materialType: true
        })
      })

      const response = await POST(request)
      expect(response.status).toBe(400)
    })

    test('should require origin information', async () => {
      const request = new NextRequest('http://localhost:3000/api/blockchain/materials/register', {
        method: 'POST',
        body: JSON.stringify({
          materialName: 'Wood',
          materialType: 'Timber'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Origin information is required')
    })

    test('should require supplier in origin', async () => {
      const request = new NextRequest('http://localhost:3000/api/blockchain/materials/register', {
        method: 'POST',
        body: JSON.stringify({
          materialName: 'Wood',
          materialType: 'Timber',
          origin: { location: 'Forest' }
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('supplier and location')
    })

    test('should require location in origin', async () => {
      const request = new NextRequest('http://localhost:3000/api/blockchain/materials/register', {
        method: 'POST',
        body: JSON.stringify({
          materialName: 'Wood',
          materialType: 'Timber',
          origin: { supplier: 'ABC Lumber' }
        })
      })

      const response = await POST(request)
      expect(response.status).toBe(400)
    })

    test('should validate carbon footprint is number', async () => {
      const request = new NextRequest('http://localhost:3000/api/blockchain/materials/register', {
        method: 'POST',
        body: JSON.stringify({
          materialName: 'Wood',
          materialType: 'Timber',
          origin: { supplier: 'ABC', location: 'Forest' },
          sustainability: { carbonFootprint: 'invalid' }
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Carbon footprint must be a number')
    })

    test('should validate renewable content range', async () => {
      const request = new NextRequest('http://localhost:3000/api/blockchain/materials/register', {
        method: 'POST',
        body: JSON.stringify({
          materialName: 'Wood',
          materialType: 'Timber',
          origin: { supplier: 'ABC', location: 'Forest' },
          sustainability: { renewableContent: 150 }
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('between 0 and 100')
    })

    test('should validate recycled content range', async () => {
      const request = new NextRequest('http://localhost:3000/api/blockchain/materials/register', {
        method: 'POST',
        body: JSON.stringify({
          materialName: 'Steel',
          materialType: 'Metal',
          origin: { supplier: 'XYZ', location: 'Mill' },
          sustainability: { recycledContent: -10 }
        })
      })

      const response = await POST(request)
      expect(response.status).toBe(400)
    })

    test('should handle malformed JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/blockchain/materials/register', {
        method: 'POST',
        body: 'invalid json'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid JSON')
    })
  })

  // Successful Registration Tests
  describe('Material Registration', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null
      })

      mockBlockchainService.registerMaterial.mockResolvedValue({
        materialId: 'mat_123_abc',
        materialName: 'Oak Wood',
        materialType: 'Timber',
        origin: {
          supplier: 'Sustainable Forests Inc',
          location: 'Pacific Northwest',
          certifications: ['FSC']
        },
        sustainability: {
          carbonFootprint: 50,
          renewableContent: 100,
          recycledContent: 0
        },
        supplyChain: [],
        blockchain: {
          network: 'polygon',
          contractAddress: '0x1234567890',
          tokenId: 'mat_123_abc',
          transactionHash: '0xabcdef',
          blockNumber: 12345678,
          timestamp: new Date()
        },
        verification: {
          verified: false
        }
      })

      mockSupabase.single.mockResolvedValue({
        data: { material_id: 'mat_123_abc' },
        error: null
      })
    })

    test('should register material successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/blockchain/materials/register', {
        method: 'POST',
        body: JSON.stringify({
          materialName: 'Oak Wood',
          materialType: 'Timber',
          origin: {
            supplier: 'Sustainable Forests Inc',
            location: 'Pacific Northwest',
            certifications: ['FSC']
          },
          sustainability: {
            carbonFootprint: 50,
            renewableContent: 100,
            recycledContent: 0
          }
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.material).toBeDefined()
      expect(data.material.materialId).toBeTruthy()
      expect(mockBlockchainService.registerMaterial).toHaveBeenCalled()
    })

    test('should generate QR code for tracking', async () => {
      const request = new NextRequest('http://localhost:3000/api/blockchain/materials/register', {
        method: 'POST',
        body: JSON.stringify({
          materialName: 'Oak Wood',
          materialType: 'Timber',
          origin: { supplier: 'ABC', location: 'Forest' }
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(QRCode.toDataURL).toHaveBeenCalled()
      expect(data.material.tracking.qrCode).toBeTruthy()
      expect(data.material.tracking.url).toBeTruthy()
    })

    test('should generate unique material IDs', async () => {
      const request = new NextRequest('http://localhost:3000/api/blockchain/materials/register', {
        method: 'POST',
        body: JSON.stringify({
          materialName: 'Pine Wood',
          materialType: 'Timber',
          origin: { supplier: 'ABC', location: 'Forest' }
        })
      })

      await POST(request)
      const callArgs = mockBlockchainService.registerMaterial.mock.calls[0][0]

      expect(callArgs.materialId).toMatch(/^mat_\d+_[a-z0-9]+$/)
    })

    test('should store material in database', async () => {
      const request = new NextRequest('http://localhost:3000/api/blockchain/materials/register', {
        method: 'POST',
        body: JSON.stringify({
          materialName: 'Bamboo',
          materialType: 'Composite',
          origin: { supplier: 'EcoMaterials', location: 'Asia' }
        })
      })

      await POST(request)

      expect(mockSupabase.from).toHaveBeenCalledWith('blockchain_materials')
      expect(mockSupabase.insert).toHaveBeenCalled()
    })

    test('should handle optional certifications', async () => {
      const request = new NextRequest('http://localhost:3000/api/blockchain/materials/register', {
        method: 'POST',
        body: JSON.stringify({
          materialName: 'Steel',
          materialType: 'Metal',
          origin: {
            supplier: 'Steel Co',
            location: 'Factory',
            certifications: ['ISO9001', 'LEED']
          }
        })
      })

      const response = await POST(request)
      expect(response.status).toBe(201)

      const callArgs = mockBlockchainService.registerMaterial.mock.calls[0][0]
      expect(callArgs.origin.certifications).toEqual(['ISO9001', 'LEED'])
    })

    test('should handle missing certifications array', async () => {
      const request = new NextRequest('http://localhost:3000/api/blockchain/materials/register', {
        method: 'POST',
        body: JSON.stringify({
          materialName: 'Concrete',
          materialType: 'Building Material',
          origin: { supplier: 'Mix Co', location: 'Plant' }
        })
      })

      const response = await POST(request)
      expect(response.status).toBe(201)

      const callArgs = mockBlockchainService.registerMaterial.mock.calls[0][0]
      expect(callArgs.origin.certifications).toEqual([])
    })

    test('should handle harvest date', async () => {
      const harvestDate = '2024-01-15T00:00:00Z'
      const request = new NextRequest('http://localhost:3000/api/blockchain/materials/register', {
        method: 'POST',
        body: JSON.stringify({
          materialName: 'Maple Wood',
          materialType: 'Timber',
          origin: {
            supplier: 'Forest Inc',
            location: 'Canada',
            harvestDate
          }
        })
      })

      const response = await POST(request)
      expect(response.status).toBe(201)

      const callArgs = mockBlockchainService.registerMaterial.mock.calls[0][0]
      expect(callArgs.origin.harvestDate).toBeDefined()
    })

    test('should trim whitespace from inputs', async () => {
      const request = new NextRequest('http://localhost:3000/api/blockchain/materials/register', {
        method: 'POST',
        body: JSON.stringify({
          materialName: '  Oak Wood  ',
          materialType: '  Timber  ',
          origin: {
            supplier: '  ABC Lumber  ',
            location: '  Forest  '
          }
        })
      })

      await POST(request)
      const callArgs = mockBlockchainService.registerMaterial.mock.calls[0][0]

      expect(callArgs.materialName).toBe('Oak Wood')
      expect(callArgs.materialType).toBe('Timber')
      expect(callArgs.origin.supplier).toBe('ABC Lumber')
      expect(callArgs.origin.location).toBe('Forest')
    })

    test('should include blockchain transaction details', async () => {
      const request = new NextRequest('http://localhost:3000/api/blockchain/materials/register', {
        method: 'POST',
        body: JSON.stringify({
          materialName: 'Glass',
          materialType: 'Window',
          origin: { supplier: 'Glass Co', location: 'Factory' }
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.material.blockchain.transactionHash).toBeTruthy()
      expect(data.material.blockchain.blockNumber).toBeTruthy()
      expect(data.material.blockchain.network).toBeTruthy()
    })

    test('should set default sustainability values', async () => {
      const request = new NextRequest('http://localhost:3000/api/blockchain/materials/register', {
        method: 'POST',
        body: JSON.stringify({
          materialName: 'Brick',
          materialType: 'Masonry',
          origin: { supplier: 'Brick Co', location: 'Kiln' }
        })
      })

      await POST(request)
      const callArgs = mockBlockchainService.registerMaterial.mock.calls[0][0]

      expect(callArgs.sustainability.carbonFootprint).toBe(0)
      expect(callArgs.sustainability.renewableContent).toBe(0)
      expect(callArgs.sustainability.recycledContent).toBe(0)
    })

    test('should include EPD URL when provided', async () => {
      const request = new NextRequest('http://localhost:3000/api/blockchain/materials/register', {
        method: 'POST',
        body: JSON.stringify({
          materialName: 'Aluminum',
          materialType: 'Metal',
          origin: { supplier: 'Metal Co', location: 'Smelter' },
          sustainability: {
            epdUrl: 'https://example.com/epd/aluminum'
          }
        })
      })

      await POST(request)
      const callArgs = mockBlockchainService.registerMaterial.mock.calls[0][0]

      expect(callArgs.sustainability.epdUrl).toBe('https://example.com/epd/aluminum')
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

    test('should handle blockchain service errors', async () => {
      mockBlockchainService.registerMaterial.mockRejectedValue(
        new Error('Blockchain network unavailable')
      )

      const request = new NextRequest('http://localhost:3000/api/blockchain/materials/register', {
        method: 'POST',
        body: JSON.stringify({
          materialName: 'Test',
          materialType: 'Test',
          origin: { supplier: 'Test', location: 'Test' }
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBeTruthy()
    })

    test('should handle database insertion errors', async () => {
      mockBlockchainService.registerMaterial.mockResolvedValue({
        materialId: 'mat_123',
        materialName: 'Test',
        materialType: 'Test',
        origin: { supplier: 'Test', location: 'Test', certifications: [] },
        sustainability: { carbonFootprint: 0, renewableContent: 0, recycledContent: 0 },
        supplyChain: [],
        blockchain: {
          network: 'polygon',
          contractAddress: '0x123',
          transactionHash: '0xabc',
          blockNumber: 123,
          timestamp: new Date()
        },
        verification: { verified: false }
      })

      mockSupabase.single.mockResolvedValue({
        data: null,
        error: new Error('Database error')
      })

      const request = new NextRequest('http://localhost:3000/api/blockchain/materials/register', {
        method: 'POST',
        body: JSON.stringify({
          materialName: 'Test',
          materialType: 'Test',
          origin: { supplier: 'Test', location: 'Test' }
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('Failed to store')
    })

    test('should handle QR code generation errors', async () => {
      mockBlockchainService.registerMaterial.mockResolvedValue({
        materialId: 'mat_123',
        materialName: 'Test',
        materialType: 'Test',
        origin: { supplier: 'Test', location: 'Test', certifications: [] },
        sustainability: { carbonFootprint: 0, renewableContent: 0, recycledContent: 0 },
        supplyChain: [],
        blockchain: {
          network: 'polygon',
          contractAddress: '0x123',
          transactionHash: '0xabc',
          blockNumber: 123,
          timestamp: new Date()
        },
        verification: { verified: false }
      })

      ;(QRCode.toDataURL as jest.Mock).mockRejectedValue(new Error('QR generation failed'))

      const request = new NextRequest('http://localhost:3000/api/blockchain/materials/register', {
        method: 'POST',
        body: JSON.stringify({
          materialName: 'Test',
          materialType: 'Test',
          origin: { supplier: 'Test', location: 'Test' }
        })
      })

      const response = await POST(request)
      expect(response.status).toBe(500)
    })
  })
})
