/**
 * Blockchain Materials API Endpoint
 *
 * Manages material provenance tracking on blockchain
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { BlockchainIntegrationService, MaterialProvenance, SupplyChainEvent } from '@/lib/services/blockchain-integration'

// Initialize blockchain service
const blockchainService = new BlockchainIntegrationService({
  network: (process.env.BLOCKCHAIN_NETWORK as any) || 'polygon',
  rpcUrl: process.env.BLOCKCHAIN_RPC_URL || 'https://polygon-rpc.com',
  chainId: parseInt(process.env.BLOCKCHAIN_CHAIN_ID || '137'),
  apiKey: process.env.BLOCKCHAIN_API_KEY
})

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body

    if (action === 'register') {
      // Register material on blockchain
      const materialData = {
        materialId: `mat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        materialName: body.materialName,
        materialType: body.materialType,
        origin: {
          supplier: body.origin.supplier,
          location: body.origin.location,
          harvestDate: body.origin.harvestDate ? new Date(body.origin.harvestDate) : undefined,
          certifications: body.origin.certifications || []
        },
        sustainability: {
          carbonFootprint: body.sustainability.carbonFootprint || 0,
          renewableContent: body.sustainability.renewableContent || 0,
          recycledContent: body.sustainability.recycledContent || 0,
          epdUrl: body.sustainability.epdUrl
        },
        supplyChain: []
      }

      const material = await blockchainService.registerMaterial(materialData)

      // Store in database
      await supabase.from('blockchain_materials').insert({
        material_id: material.materialId,
        user_id: user.id,
        material_name: material.materialName,
        material_type: material.materialType,
        origin: material.origin,
        sustainability: material.sustainability,
        blockchain_network: material.blockchain.network,
        contract_address: material.blockchain.contractAddress,
        transaction_hash: material.blockchain.transactionHash,
        block_number: material.blockchain.blockNumber,
        verified: material.verification.verified
      })

      return NextResponse.json({
        success: true,
        material: {
          materialId: material.materialId,
          materialName: material.materialName,
          blockchain: material.blockchain,
          verification: material.verification
        }
      })
    } else if (action === 'add-event') {
      // Add supply chain event
      const { materialId, event } = body

      const supplyChainEvent = await blockchainService.addSupplyChainEvent(
        materialId,
        {
          eventType: event.eventType,
          timestamp: new Date(event.timestamp || Date.now()),
          location: event.location,
          actor: event.actor,
          description: event.description,
          data: event.data
        }
      )

      // Store in database
      await supabase.from('supply_chain_events').insert({
        event_id: supplyChainEvent.id,
        material_id: materialId,
        event_type: supplyChainEvent.eventType,
        timestamp: supplyChainEvent.timestamp,
        location: supplyChainEvent.location,
        actor: supplyChainEvent.actor,
        description: supplyChainEvent.description,
        data: supplyChainEvent.data,
        transaction_hash: supplyChainEvent.transactionHash,
        block_number: supplyChainEvent.blockNumber
      })

      return NextResponse.json({
        success: true,
        event: supplyChainEvent
      })
    } else if (action === 'verify') {
      // Verify material authenticity
      const { materialId, verifierName } = body

      const verification = await blockchainService.verifyMaterial(
        materialId,
        user.id,
        verifierName || 'User'
      )

      // Update database
      await supabase
        .from('blockchain_materials')
        .update({
          verified: verification.verified,
          verified_by: user.id,
          verified_at: new Date().toISOString(),
          proof_url: verification.proof
        })
        .eq('material_id', materialId)

      return NextResponse.json({
        success: true,
        verification
      })
    } else if (action === 'carbon-credits') {
      // Calculate carbon credits
      const { materialIds } = body

      const credits = await blockchainService.calculateCarbonCredits(materialIds)

      return NextResponse.json({
        success: true,
        carbonCredits: credits
      })
    } else if (action === 'sustainability-proof') {
      // Generate sustainability proof
      const { projectId, materialIds } = body

      const proof = await blockchainService.generateSustainabilityProof(
        projectId,
        materialIds
      )

      // Store in database
      await supabase.from('sustainability_proofs').insert({
        project_id: projectId,
        user_id: user.id,
        proof_hash: proof.proofHash,
        ipfs_url: proof.ipfsUrl,
        certificate: proof.certificate
      })

      return NextResponse.json({
        success: true,
        proof
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    console.error('Blockchain materials error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const materialId = searchParams.get('materialId')
    const action = searchParams.get('action')

    if (materialId && action === 'provenance') {
      // Get material provenance
      const { data: material, error } = await supabase
        .from('blockchain_materials')
        .select('*')
        .eq('material_id', materialId)
        .single()

      if (error || !material) {
        return NextResponse.json({ error: 'Material not found' }, { status: 404 })
      }

      // Get supply chain events
      const { data: events } = await supabase
        .from('supply_chain_events')
        .select('*')
        .eq('material_id', materialId)
        .order('timestamp', { ascending: true })

      return NextResponse.json({
        success: true,
        material: {
          materialId: material.material_id,
          materialName: material.material_name,
          materialType: material.material_type,
          origin: material.origin,
          sustainability: material.sustainability,
          blockchain: {
            network: material.blockchain_network,
            contractAddress: material.contract_address,
            transactionHash: material.transaction_hash,
            blockNumber: material.block_number
          },
          verification: {
            verified: material.verified,
            verifiedBy: material.verified_by,
            verifiedAt: material.verified_at,
            proofUrl: material.proof_url
          },
          supplyChain: events || []
        }
      })
    } else if (materialId && action === 'verify-chain') {
      // Verify supply chain integrity
      const verification = await blockchainService.verifySupplyChain(materialId)

      return NextResponse.json({
        success: true,
        verification
      })
    } else if (action === 'list') {
      // List user's materials
      const { data: materials, error } = await supabase
        .from('blockchain_materials')
        .select('material_id, material_name, material_type, verified, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) {
        throw error
      }

      return NextResponse.json({
        success: true,
        materials: materials || []
      })
    }

    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
  } catch (error: any) {
    console.error('Blockchain GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
