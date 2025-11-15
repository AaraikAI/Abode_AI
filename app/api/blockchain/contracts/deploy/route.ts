/**
 * Blockchain Smart Contract Deployment API Endpoint
 *
 * Deploy and interact with smart contracts on blockchain
 * Track events and transactions for escrow, milestones, and automated payments
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { BlockchainIntegrationService, SmartContract } from '@/lib/services/blockchain-integration'

// Initialize blockchain service
const blockchainService = new BlockchainIntegrationService({
  network: (process.env.BLOCKCHAIN_NETWORK as any) || 'polygon',
  rpcUrl: process.env.BLOCKCHAIN_RPC_URL || 'https://polygon-rpc.com',
  chainId: parseInt(process.env.BLOCKCHAIN_CHAIN_ID || '137'),
  apiKey: process.env.BLOCKCHAIN_API_KEY
})

/**
 * POST /api/blockchain/contracts/deploy
 * Deploy smart contract to blockchain
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()

    // Validate required fields
    if (!body.name || typeof body.name !== 'string') {
      return NextResponse.json(
        { error: 'Contract name is required and must be a string' },
        { status: 400 }
      )
    }

    if (!body.type || !['escrow', 'milestone', 'certification', 'warranty', 'royalty'].includes(body.type)) {
      return NextResponse.json(
        { error: 'Contract type must be one of: escrow, milestone, certification, warranty, royalty' },
        { status: 400 }
      )
    }

    if (!body.parties || !Array.isArray(body.parties) || body.parties.length < 2) {
      return NextResponse.json(
        { error: 'Contract must have at least 2 parties' },
        { status: 400 }
      )
    }

    // Validate parties
    for (const party of body.parties) {
      if (!party.role || !party.address || !party.name) {
        return NextResponse.json(
          { error: 'Each party must have role, address, and name' },
          { status: 400 }
        )
      }
    }

    // Validate terms
    if (!body.terms || typeof body.terms !== 'object') {
      return NextResponse.json(
        { error: 'Contract terms are required' },
        { status: 400 }
      )
    }

    if (!body.terms.conditions || !Array.isArray(body.terms.conditions)) {
      return NextResponse.json(
        { error: 'Contract terms must include conditions array' },
        { status: 400 }
      )
    }

    if (!body.terms.payments || !Array.isArray(body.terms.payments)) {
      return NextResponse.json(
        { error: 'Contract terms must include payments array' },
        { status: 400 }
      )
    }

    // Validate payments
    for (const payment of body.terms.payments) {
      if (typeof payment.amount !== 'number' || payment.amount <= 0) {
        return NextResponse.json(
          { error: 'Payment amount must be a positive number' },
          { status: 400 }
        )
      }

      if (!payment.currency || !payment.recipient || !payment.trigger) {
        return NextResponse.json(
          { error: 'Each payment must have currency, recipient, and trigger' },
          { status: 400 }
        )
      }
    }

    // Validate milestones for milestone and escrow contracts
    if ((body.type === 'milestone' || body.type === 'escrow') && body.terms.milestones) {
      if (!Array.isArray(body.terms.milestones)) {
        return NextResponse.json(
          { error: 'Milestones must be an array' },
          { status: 400 }
        )
      }

      for (const milestone of body.terms.milestones) {
        if (!milestone.description) {
          return NextResponse.json(
            { error: 'Each milestone must have a description' },
            { status: 400 }
          )
        }
      }
    }

    // Generate standard ABI for contract type
    const abi = generateContractABI(body.type)

    // Create smart contract
    const contractData: Omit<SmartContract, 'id' | 'events' | 'createdAt' | 'deployedAt'> = {
      name: body.name.trim(),
      type: body.type,
      network: (body.network as any) || 'polygon',
      address: '', // Will be set after deployment
      abi,
      parties: body.parties.map((party: any) => ({
        role: party.role.trim(),
        address: party.address.trim(),
        name: party.name.trim()
      })),
      terms: {
        conditions: body.terms.conditions,
        payments: body.terms.payments.map((payment: any) => ({
          amount: payment.amount,
          currency: payment.currency,
          recipient: payment.recipient,
          trigger: payment.trigger
        })),
        milestones: body.terms.milestones?.map((milestone: any) => ({
          description: milestone.description,
          dueDate: milestone.dueDate ? new Date(milestone.dueDate) : undefined,
          completed: false,
          proof: undefined
        }))
      },
      status: 'draft'
    }

    // Create contract in blockchain service
    const contract = await blockchainService.createSmartContract(contractData)

    // Deploy contract to blockchain
    const deployment = await blockchainService.deploySmartContract(contract.id)

    // Store in database
    const { data: dbContract, error: dbError } = await supabase
      .from('smart_contracts')
      .insert({
        contract_id: contract.id,
        user_id: user.id,
        name: contract.name,
        type: contract.type,
        network: contract.network,
        address: deployment.address,
        abi: contract.abi,
        parties: contract.parties,
        terms: contract.terms,
        status: contract.status,
        deployed_at: contract.deployedAt,
        deployment_tx_hash: deployment.transactionHash,
        project_id: body.projectId || null
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Failed to store contract in database' },
        { status: 500 }
      )
    }

    // Set up event monitoring
    const unsubscribe = blockchainService.subscribeToContractEvents(
      contract.id,
      async (event) => {
        // Store events in database
        await supabase.from('contract_events').insert({
          contract_id: contract.id,
          event_type: event.eventType,
          timestamp: event.timestamp,
          data: event.data,
          transaction_hash: event.transactionHash,
          block_number: event.blockNumber
        })
      }
    )

    // Store unsubscribe function reference (in production, would be managed differently)
    // For now, we'll just log it
    console.log('Event monitoring setup for contract:', contract.id)

    // Return success response
    return NextResponse.json({
      success: true,
      contract: {
        id: contract.id,
        name: contract.name,
        type: contract.type,
        network: contract.network,
        address: deployment.address,
        status: contract.status,
        deployment: {
          transactionHash: deployment.transactionHash,
          timestamp: contract.deployedAt,
          blockExplorer: getBlockExplorerUrl(contract.network, deployment.transactionHash)
        },
        parties: contract.parties,
        terms: {
          conditions: contract.terms.conditions,
          paymentCount: contract.terms.payments.length,
          totalAmount: contract.terms.payments.reduce((sum, p) => sum + p.amount, 0),
          currency: contract.terms.payments[0]?.currency || 'USD',
          milestoneCount: contract.terms.milestones?.length || 0
        },
        monitoring: {
          enabled: true,
          message: 'Contract events are being monitored'
        }
      }
    }, { status: 201 })

  } catch (error: any) {
    console.error('Contract deployment error:', error)

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    // Handle specific blockchain errors
    if (error.message?.includes('insufficient funds')) {
      return NextResponse.json(
        { error: 'Insufficient funds for contract deployment' },
        { status: 400 }
      )
    }

    if (error.message?.includes('network')) {
      return NextResponse.json(
        { error: 'Blockchain network error. Please try again.' },
        { status: 503 }
      )
    }

    // Handle other errors
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Generate standard ABI for contract type
 */
function generateContractABI(contractType: string): any[] {
  const baseABI = [
    {
      type: 'constructor',
      inputs: [
        { name: 'parties', type: 'address[]' },
        { name: 'terms', type: 'bytes' }
      ]
    },
    {
      type: 'function',
      name: 'getStatus',
      inputs: [],
      outputs: [{ name: '', type: 'uint8' }],
      stateMutability: 'view'
    }
  ]

  switch (contractType) {
    case 'escrow':
      return [
        ...baseABI,
        {
          type: 'function',
          name: 'deposit',
          inputs: [{ name: 'amount', type: 'uint256' }],
          outputs: [],
          stateMutability: 'payable'
        },
        {
          type: 'function',
          name: 'releasePayment',
          inputs: [
            { name: 'milestoneIndex', type: 'uint256' },
            { name: 'amount', type: 'uint256' },
            { name: 'recipient', type: 'address' },
            { name: 'proof', type: 'string' }
          ],
          outputs: [],
          stateMutability: 'nonpayable'
        },
        {
          type: 'function',
          name: 'refund',
          inputs: [],
          outputs: [],
          stateMutability: 'nonpayable'
        },
        {
          type: 'event',
          name: 'PaymentReleased',
          inputs: [
            { name: 'milestone', type: 'uint256', indexed: true },
            { name: 'recipient', type: 'address', indexed: true },
            { name: 'amount', type: 'uint256' }
          ]
        }
      ]

    case 'milestone':
      return [
        ...baseABI,
        {
          type: 'function',
          name: 'completeMilestone',
          inputs: [
            { name: 'milestoneIndex', type: 'uint256' },
            { name: 'proof', type: 'string' }
          ],
          outputs: [],
          stateMutability: 'nonpayable'
        },
        {
          type: 'function',
          name: 'verifyMilestone',
          inputs: [
            { name: 'milestoneIndex', type: 'uint256' },
            { name: 'approved', type: 'bool' }
          ],
          outputs: [],
          stateMutability: 'nonpayable'
        },
        {
          type: 'event',
          name: 'MilestoneCompleted',
          inputs: [
            { name: 'milestone', type: 'uint256', indexed: true },
            { name: 'timestamp', type: 'uint256' }
          ]
        }
      ]

    case 'certification':
      return [
        ...baseABI,
        {
          type: 'function',
          name: 'issueCertificate',
          inputs: [
            { name: 'recipient', type: 'address' },
            { name: 'certificateHash', type: 'bytes32' },
            { name: 'ipfsUrl', type: 'string' }
          ],
          outputs: [],
          stateMutability: 'nonpayable'
        },
        {
          type: 'function',
          name: 'verifyCertificate',
          inputs: [
            { name: 'certificateHash', type: 'bytes32' }
          ],
          outputs: [{ name: '', type: 'bool' }],
          stateMutability: 'view'
        },
        {
          type: 'event',
          name: 'CertificateIssued',
          inputs: [
            { name: 'recipient', type: 'address', indexed: true },
            { name: 'certificateHash', type: 'bytes32', indexed: true }
          ]
        }
      ]

    case 'warranty':
      return [
        ...baseABI,
        {
          type: 'function',
          name: 'registerWarranty',
          inputs: [
            { name: 'productId', type: 'string' },
            { name: 'duration', type: 'uint256' },
            { name: 'terms', type: 'string' }
          ],
          outputs: [],
          stateMutability: 'nonpayable'
        },
        {
          type: 'function',
          name: 'claimWarranty',
          inputs: [
            { name: 'productId', type: 'string' },
            { name: 'reason', type: 'string' }
          ],
          outputs: [],
          stateMutability: 'nonpayable'
        },
        {
          type: 'event',
          name: 'WarrantyClaimed',
          inputs: [
            { name: 'productId', type: 'string', indexed: true },
            { name: 'claimant', type: 'address', indexed: true }
          ]
        }
      ]

    case 'royalty':
      return [
        ...baseABI,
        {
          type: 'function',
          name: 'distributeRoyalties',
          inputs: [
            { name: 'amount', type: 'uint256' }
          ],
          outputs: [],
          stateMutability: 'payable'
        },
        {
          type: 'function',
          name: 'updateRoyaltyShare',
          inputs: [
            { name: 'recipient', type: 'address' },
            { name: 'percentage', type: 'uint256' }
          ],
          outputs: [],
          stateMutability: 'nonpayable'
        },
        {
          type: 'event',
          name: 'RoyaltiesDistributed',
          inputs: [
            { name: 'totalAmount', type: 'uint256' },
            { name: 'recipientCount', type: 'uint256' }
          ]
        }
      ]

    default:
      return baseABI
  }
}

/**
 * Get block explorer URL for transaction
 */
function getBlockExplorerUrl(network: string, txHash: string): string {
  const explorers: Record<string, string> = {
    ethereum: 'https://etherscan.io/tx/',
    polygon: 'https://polygonscan.com/tx/',
    hyperledger: 'https://explorer.hyperledger.org/tx/'
  }

  return `${explorers[network] || explorers.polygon}${txHash}`
}
