/**
 * Blockchain Smart Contract Deploy API Route Tests
 * Tests smart contract deployment, interaction, and event tracking
 */

import { POST } from '@/app/api/blockchain/contracts/deploy/route'
import { createClient } from '@/lib/supabase/server'
import { BlockchainIntegrationService } from '@/lib/services/blockchain-integration'
import { NextRequest } from 'next/server'

// Mock dependencies
jest.mock('@/lib/supabase/server')
jest.mock('@/lib/services/blockchain-integration')

describe('POST /api/blockchain/contracts/deploy', () => {
  let mockSupabase: any
  let mockBlockchainService: any

  const validContractData = {
    name: 'Project Escrow Contract',
    type: 'escrow',
    network: 'polygon',
    parties: [
      { role: 'client', address: '0x123', name: 'Client Corp' },
      { role: 'contractor', address: '0x456', name: 'Builder Inc' }
    ],
    terms: {
      conditions: ['Milestone completion', 'Quality verification'],
      payments: [
        {
          amount: 50000,
          currency: 'USD',
          recipient: '0x456',
          trigger: 'Milestone 1 completion'
        }
      ],
      milestones: [
        {
          description: 'Foundation complete',
          dueDate: '2024-06-01'
        }
      ]
    }
  }

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
      createSmartContract: jest.fn(),
      deploySmartContract: jest.fn(),
      subscribeToContractEvents: jest.fn()
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

      const request = new NextRequest('http://localhost:3000/api/blockchain/contracts/deploy', {
        method: 'POST',
        body: JSON.stringify(validContractData)
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

      const request = new NextRequest('http://localhost:3000/api/blockchain/contracts/deploy', {
        method: 'POST',
        body: JSON.stringify(validContractData)
      })

      const response = await POST(request)
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

    test('should require contract name', async () => {
      const data = { ...validContractData }
      delete data.name

      const request = new NextRequest('http://localhost:3000/api/blockchain/contracts/deploy', {
        method: 'POST',
        body: JSON.stringify(data)
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.error).toContain('Contract name is required')
    })

    test('should validate contract name is string', async () => {
      const data = { ...validContractData, name: 123 }

      const request = new NextRequest('http://localhost:3000/api/blockchain/contracts/deploy', {
        method: 'POST',
        body: JSON.stringify(data)
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.error).toContain('must be a string')
    })

    test('should require valid contract type', async () => {
      const data = { ...validContractData, type: 'invalid' }

      const request = new NextRequest('http://localhost:3000/api/blockchain/contracts/deploy', {
        method: 'POST',
        body: JSON.stringify(data)
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.error).toContain('Contract type must be one of')
    })

    test('should validate escrow contract type', async () => {
      const data = { ...validContractData, type: 'escrow' }

      mockBlockchainService.createSmartContract.mockResolvedValue({
        id: 'contract_123',
        ...data,
        address: '',
        abi: [],
        events: [],
        status: 'draft',
        createdAt: new Date()
      })

      mockBlockchainService.deploySmartContract.mockResolvedValue({
        address: '0xdeployed',
        transactionHash: '0xtxhash'
      })

      mockSupabase.single.mockResolvedValue({
        data: { contract_id: 'contract_123' },
        error: null
      })

      mockBlockchainService.subscribeToContractEvents.mockReturnValue(() => {})

      const request = new NextRequest('http://localhost:3000/api/blockchain/contracts/deploy', {
        method: 'POST',
        body: JSON.stringify(data)
      })

      const response = await POST(request)
      expect(response.status).toBe(201)
    })

    test('should validate milestone contract type', async () => {
      const data = { ...validContractData, type: 'milestone' }

      mockBlockchainService.createSmartContract.mockResolvedValue({
        id: 'contract_123',
        ...data,
        address: '',
        abi: [],
        events: [],
        status: 'draft',
        createdAt: new Date()
      })

      mockBlockchainService.deploySmartContract.mockResolvedValue({
        address: '0xdeployed',
        transactionHash: '0xtxhash'
      })

      mockSupabase.single.mockResolvedValue({
        data: { contract_id: 'contract_123' },
        error: null
      })

      mockBlockchainService.subscribeToContractEvents.mockReturnValue(() => {})

      const request = new NextRequest('http://localhost:3000/api/blockchain/contracts/deploy', {
        method: 'POST',
        body: JSON.stringify(data)
      })

      const response = await POST(request)
      expect(response.status).toBe(201)
    })

    test('should require parties array', async () => {
      const data = { ...validContractData }
      delete data.parties

      const request = new NextRequest('http://localhost:3000/api/blockchain/contracts/deploy', {
        method: 'POST',
        body: JSON.stringify(data)
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.error).toContain('at least 2 parties')
    })

    test('should require minimum 2 parties', async () => {
      const data = {
        ...validContractData,
        parties: [{ role: 'client', address: '0x123', name: 'Client' }]
      }

      const request = new NextRequest('http://localhost:3000/api/blockchain/contracts/deploy', {
        method: 'POST',
        body: JSON.stringify(data)
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.error).toContain('at least 2 parties')
    })

    test('should validate party structure', async () => {
      const data = {
        ...validContractData,
        parties: [
          { role: 'client', address: '0x123' }, // Missing name
          { role: 'contractor', address: '0x456', name: 'Builder' }
        ]
      }

      const request = new NextRequest('http://localhost:3000/api/blockchain/contracts/deploy', {
        method: 'POST',
        body: JSON.stringify(data)
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.error).toContain('role, address, and name')
    })

    test('should require contract terms', async () => {
      const data = { ...validContractData }
      delete data.terms

      const request = new NextRequest('http://localhost:3000/api/blockchain/contracts/deploy', {
        method: 'POST',
        body: JSON.stringify(data)
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.error).toContain('Contract terms are required')
    })

    test('should require conditions array', async () => {
      const data = {
        ...validContractData,
        terms: { ...validContractData.terms, conditions: null }
      }

      const request = new NextRequest('http://localhost:3000/api/blockchain/contracts/deploy', {
        method: 'POST',
        body: JSON.stringify(data)
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.error).toContain('conditions array')
    })

    test('should require payments array', async () => {
      const data = {
        ...validContractData,
        terms: { ...validContractData.terms, payments: null }
      }

      const request = new NextRequest('http://localhost:3000/api/blockchain/contracts/deploy', {
        method: 'POST',
        body: JSON.stringify(data)
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.error).toContain('payments array')
    })

    test('should validate payment amount is positive', async () => {
      const data = {
        ...validContractData,
        terms: {
          ...validContractData.terms,
          payments: [
            {
              amount: -1000,
              currency: 'USD',
              recipient: '0x456',
              trigger: 'Test'
            }
          ]
        }
      }

      const request = new NextRequest('http://localhost:3000/api/blockchain/contracts/deploy', {
        method: 'POST',
        body: JSON.stringify(data)
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.error).toContain('positive number')
    })

    test('should validate payment has all required fields', async () => {
      const data = {
        ...validContractData,
        terms: {
          ...validContractData.terms,
          payments: [
            {
              amount: 1000,
              currency: 'USD'
              // Missing recipient and trigger
            }
          ]
        }
      }

      const request = new NextRequest('http://localhost:3000/api/blockchain/contracts/deploy', {
        method: 'POST',
        body: JSON.stringify(data)
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.error).toContain('currency, recipient, and trigger')
    })

    test('should validate milestones for escrow contracts', async () => {
      const data = {
        ...validContractData,
        type: 'escrow',
        terms: {
          ...validContractData.terms,
          milestones: [{ dueDate: '2024-06-01' }] // Missing description
        }
      }

      const request = new NextRequest('http://localhost:3000/api/blockchain/contracts/deploy', {
        method: 'POST',
        body: JSON.stringify(data)
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.error).toContain('description')
    })

    test('should handle malformed JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/blockchain/contracts/deploy', {
        method: 'POST',
        body: 'invalid json'
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.error).toContain('Invalid JSON')
    })
  })

  // Successful Deployment Tests
  describe('Contract Deployment', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockBlockchainService.createSmartContract.mockResolvedValue({
        id: 'contract_123_abc',
        name: 'Project Escrow Contract',
        type: 'escrow',
        network: 'polygon',
        address: '',
        abi: [],
        parties: validContractData.parties,
        terms: validContractData.terms,
        status: 'draft',
        events: [],
        createdAt: new Date(),
        deployedAt: new Date()
      })

      mockBlockchainService.deploySmartContract.mockResolvedValue({
        address: '0xdeployedcontract123',
        transactionHash: '0xtransactionhash123'
      })

      mockSupabase.single.mockResolvedValue({
        data: { contract_id: 'contract_123_abc' },
        error: null
      })

      mockBlockchainService.subscribeToContractEvents.mockReturnValue(() => {
        console.log('Unsubscribed')
      })
    })

    test('should deploy contract successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/blockchain/contracts/deploy', {
        method: 'POST',
        body: JSON.stringify(validContractData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.contract).toBeDefined()
      expect(mockBlockchainService.createSmartContract).toHaveBeenCalled()
      expect(mockBlockchainService.deploySmartContract).toHaveBeenCalled()
    })

    test('should return contract deployment details', async () => {
      const request = new NextRequest('http://localhost:3000/api/blockchain/contracts/deploy', {
        method: 'POST',
        body: JSON.stringify(validContractData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.contract.id).toBeTruthy()
      expect(data.contract.name).toBe('Project Escrow Contract')
      expect(data.contract.type).toBe('escrow')
      expect(data.contract.address).toBe('0xdeployedcontract123')
      expect(data.contract.deployment.transactionHash).toBe('0xtransactionhash123')
    })

    test('should include block explorer URL', async () => {
      const request = new NextRequest('http://localhost:3000/api/blockchain/contracts/deploy', {
        method: 'POST',
        body: JSON.stringify(validContractData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.contract.deployment.blockExplorer).toContain('0xtransactionhash123')
      expect(data.contract.deployment.blockExplorer).toContain('polygonscan.com')
    })

    test('should store contract in database', async () => {
      const request = new NextRequest('http://localhost:3000/api/blockchain/contracts/deploy', {
        method: 'POST',
        body: JSON.stringify(validContractData)
      })

      await POST(request)

      expect(mockSupabase.from).toHaveBeenCalledWith('smart_contracts')
      expect(mockSupabase.insert).toHaveBeenCalled()
    })

    test('should set up event monitoring', async () => {
      const request = new NextRequest('http://localhost:3000/api/blockchain/contracts/deploy', {
        method: 'POST',
        body: JSON.stringify(validContractData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(mockBlockchainService.subscribeToContractEvents).toHaveBeenCalled()
      expect(data.contract.monitoring.enabled).toBe(true)
    })

    test('should handle certification contract type', async () => {
      const certData = {
        ...validContractData,
        type: 'certification',
        terms: {
          conditions: ['Inspection passed'],
          payments: []
        }
      }

      mockBlockchainService.createSmartContract.mockResolvedValue({
        id: 'contract_cert',
        ...certData,
        address: '',
        abi: [],
        events: [],
        status: 'draft',
        createdAt: new Date()
      })

      const request = new NextRequest('http://localhost:3000/api/blockchain/contracts/deploy', {
        method: 'POST',
        body: JSON.stringify(certData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.contract.type).toBe('certification')
    })

    test('should handle warranty contract type', async () => {
      const warrantyData = {
        ...validContractData,
        type: 'warranty',
        terms: {
          conditions: ['Product registration'],
          payments: []
        }
      }

      mockBlockchainService.createSmartContract.mockResolvedValue({
        id: 'contract_warranty',
        ...warrantyData,
        address: '',
        abi: [],
        events: [],
        status: 'draft',
        createdAt: new Date()
      })

      const request = new NextRequest('http://localhost:3000/api/blockchain/contracts/deploy', {
        method: 'POST',
        body: JSON.stringify(warrantyData)
      })

      const response = await POST(request)
      expect(response.status).toBe(201)
    })

    test('should handle royalty contract type', async () => {
      const royaltyData = {
        ...validContractData,
        type: 'royalty',
        parties: [
          { role: 'creator', address: '0x111', name: 'Creator' },
          { role: 'distributor', address: '0x222', name: 'Distributor' },
          { role: 'platform', address: '0x333', name: 'Platform' }
        ],
        terms: {
          conditions: ['Sales revenue distribution'],
          payments: [
            { amount: 10, currency: 'USD', recipient: '0x111', trigger: 'Per sale' }
          ]
        }
      }

      mockBlockchainService.createSmartContract.mockResolvedValue({
        id: 'contract_royalty',
        ...royaltyData,
        address: '',
        abi: [],
        events: [],
        status: 'draft',
        createdAt: new Date()
      })

      const request = new NextRequest('http://localhost:3000/api/blockchain/contracts/deploy', {
        method: 'POST',
        body: JSON.stringify(royaltyData)
      })

      const response = await POST(request)
      expect(response.status).toBe(201)
    })

    test('should trim whitespace from inputs', async () => {
      const dataWithSpaces = {
        ...validContractData,
        name: '  Contract Name  ',
        parties: [
          { role: '  client  ', address: '  0x123  ', name: '  Client  ' },
          { role: '  contractor  ', address: '  0x456  ', name: '  Builder  ' }
        ]
      }

      const request = new NextRequest('http://localhost:3000/api/blockchain/contracts/deploy', {
        method: 'POST',
        body: JSON.stringify(dataWithSpaces)
      })

      await POST(request)
      const callArgs = mockBlockchainService.createSmartContract.mock.calls[0][0]

      expect(callArgs.name).toBe('Contract Name')
      expect(callArgs.parties[0].role).toBe('client')
      expect(callArgs.parties[0].address).toBe('0x123')
      expect(callArgs.parties[0].name).toBe('Client')
    })

    test('should calculate total payment amount', async () => {
      const multiPaymentData = {
        ...validContractData,
        terms: {
          ...validContractData.terms,
          payments: [
            { amount: 10000, currency: 'USD', recipient: '0x456', trigger: 'Milestone 1' },
            { amount: 20000, currency: 'USD', recipient: '0x456', trigger: 'Milestone 2' },
            { amount: 15000, currency: 'USD', recipient: '0x456', trigger: 'Completion' }
          ]
        }
      }

      const request = new NextRequest('http://localhost:3000/api/blockchain/contracts/deploy', {
        method: 'POST',
        body: JSON.stringify(multiPaymentData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.contract.terms.totalAmount).toBe(45000)
    })

    test('should include milestone count', async () => {
      const request = new NextRequest('http://localhost:3000/api/blockchain/contracts/deploy', {
        method: 'POST',
        body: JSON.stringify(validContractData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.contract.terms.milestoneCount).toBe(1)
    })

    test('should support optional projectId', async () => {
      const dataWithProject = {
        ...validContractData,
        projectId: 'project_123'
      }

      const request = new NextRequest('http://localhost:3000/api/blockchain/contracts/deploy', {
        method: 'POST',
        body: JSON.stringify(dataWithProject)
      })

      await POST(request)

      const insertCall = mockSupabase.insert.mock.calls[0][0]
      expect(insertCall.project_id).toBe('project_123')
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
      mockBlockchainService.createSmartContract.mockRejectedValue(
        new Error('Blockchain service unavailable')
      )

      const request = new NextRequest('http://localhost:3000/api/blockchain/contracts/deploy', {
        method: 'POST',
        body: JSON.stringify(validContractData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBeTruthy()
    })

    test('should handle deployment errors', async () => {
      mockBlockchainService.createSmartContract.mockResolvedValue({
        id: 'contract_123',
        name: 'Test',
        type: 'escrow',
        network: 'polygon',
        address: '',
        abi: [],
        parties: [],
        terms: { conditions: [], payments: [] },
        status: 'draft',
        events: [],
        createdAt: new Date()
      })

      mockBlockchainService.deploySmartContract.mockRejectedValue(
        new Error('Deployment failed')
      )

      const request = new NextRequest('http://localhost:3000/api/blockchain/contracts/deploy', {
        method: 'POST',
        body: JSON.stringify(validContractData)
      })

      const response = await POST(request)
      expect(response.status).toBe(500)
    })

    test('should handle insufficient funds error', async () => {
      mockBlockchainService.createSmartContract.mockResolvedValue({
        id: 'contract_123',
        name: 'Test',
        type: 'escrow',
        network: 'polygon',
        address: '',
        abi: [],
        parties: [],
        terms: { conditions: [], payments: [] },
        status: 'draft',
        events: [],
        createdAt: new Date()
      })

      mockBlockchainService.deploySmartContract.mockRejectedValue(
        new Error('insufficient funds for gas')
      )

      const request = new NextRequest('http://localhost:3000/api/blockchain/contracts/deploy', {
        method: 'POST',
        body: JSON.stringify(validContractData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Insufficient funds')
    })

    test('should handle network errors', async () => {
      mockBlockchainService.createSmartContract.mockResolvedValue({
        id: 'contract_123',
        name: 'Test',
        type: 'escrow',
        network: 'polygon',
        address: '',
        abi: [],
        parties: [],
        terms: { conditions: [], payments: [] },
        status: 'draft',
        events: [],
        createdAt: new Date()
      })

      mockBlockchainService.deploySmartContract.mockRejectedValue(
        new Error('network timeout')
      )

      const request = new NextRequest('http://localhost:3000/api/blockchain/contracts/deploy', {
        method: 'POST',
        body: JSON.stringify(validContractData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(503)
      expect(data.error).toContain('network error')
    })

    test('should handle database errors', async () => {
      mockBlockchainService.createSmartContract.mockResolvedValue({
        id: 'contract_123',
        name: 'Test',
        type: 'escrow',
        network: 'polygon',
        address: '',
        abi: [],
        parties: [],
        terms: { conditions: [], payments: [] },
        status: 'draft',
        events: [],
        createdAt: new Date()
      })

      mockBlockchainService.deploySmartContract.mockResolvedValue({
        address: '0xdeployed',
        transactionHash: '0xtxhash'
      })

      mockSupabase.single.mockResolvedValue({
        data: null,
        error: new Error('Database error')
      })

      mockBlockchainService.subscribeToContractEvents.mockReturnValue(() => {})

      const request = new NextRequest('http://localhost:3000/api/blockchain/contracts/deploy', {
        method: 'POST',
        body: JSON.stringify(validContractData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('Failed to store')
    })
  })
})
