/**
 * Blockchain Materials Register API Endpoint
 *
 * Registers materials on blockchain with provenance tracking and QR code generation
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { BlockchainIntegrationService } from '@/lib/services/blockchain-integration'
import QRCode from 'qrcode'

// Initialize blockchain service
const blockchainService = new BlockchainIntegrationService({
  network: (process.env.BLOCKCHAIN_NETWORK as any) || 'polygon',
  rpcUrl: process.env.BLOCKCHAIN_RPC_URL || 'https://polygon-rpc.com',
  chainId: parseInt(process.env.BLOCKCHAIN_CHAIN_ID || '137'),
  apiKey: process.env.BLOCKCHAIN_API_KEY
})

/**
 * POST /api/blockchain/materials/register
 * Register material on blockchain with provenance tracking
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
    if (!body.materialName || typeof body.materialName !== 'string') {
      return NextResponse.json(
        { error: 'Material name is required and must be a string' },
        { status: 400 }
      )
    }

    if (!body.materialType || typeof body.materialType !== 'string') {
      return NextResponse.json(
        { error: 'Material type is required and must be a string' },
        { status: 400 }
      )
    }

    if (!body.origin || typeof body.origin !== 'object') {
      return NextResponse.json(
        { error: 'Origin information is required' },
        { status: 400 }
      )
    }

    if (!body.origin.supplier || !body.origin.location) {
      return NextResponse.json(
        { error: 'Origin must include supplier and location' },
        { status: 400 }
      )
    }

    // Validate sustainability data
    const sustainability = body.sustainability || {}
    if (sustainability.carbonFootprint && typeof sustainability.carbonFootprint !== 'number') {
      return NextResponse.json(
        { error: 'Carbon footprint must be a number' },
        { status: 400 }
      )
    }

    if (sustainability.renewableContent &&
        (typeof sustainability.renewableContent !== 'number' ||
         sustainability.renewableContent < 0 ||
         sustainability.renewableContent > 100)) {
      return NextResponse.json(
        { error: 'Renewable content must be a number between 0 and 100' },
        { status: 400 }
      )
    }

    if (sustainability.recycledContent &&
        (typeof sustainability.recycledContent !== 'number' ||
         sustainability.recycledContent < 0 ||
         sustainability.recycledContent > 100)) {
      return NextResponse.json(
        { error: 'Recycled content must be a number between 0 and 100' },
        { status: 400 }
      )
    }

    // Generate unique material ID
    const materialId = `mat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Prepare material data
    const materialData = {
      materialId,
      materialName: body.materialName.trim(),
      materialType: body.materialType.trim(),
      origin: {
        supplier: body.origin.supplier.trim(),
        location: body.origin.location.trim(),
        harvestDate: body.origin.harvestDate ? new Date(body.origin.harvestDate) : undefined,
        certifications: Array.isArray(body.origin.certifications)
          ? body.origin.certifications
          : []
      },
      sustainability: {
        carbonFootprint: sustainability.carbonFootprint || 0,
        renewableContent: sustainability.renewableContent || 0,
        recycledContent: sustainability.recycledContent || 0,
        epdUrl: sustainability.epdUrl || undefined
      },
      supplyChain: []
    }

    // Register material on blockchain
    const material = await blockchainService.registerMaterial(materialData)

    // Generate QR code for tracking
    const trackingUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://abode.ai'}/track/${materialId}`
    const qrCodeDataUrl = await QRCode.toDataURL(trackingUrl, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })

    // Store in database
    const { data: dbMaterial, error: dbError } = await supabase
      .from('blockchain_materials')
      .insert({
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
        verified: material.verification.verified,
        qr_code_url: qrCodeDataUrl,
        tracking_url: trackingUrl
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Failed to store material in database' },
        { status: 500 }
      )
    }

    // Return success response
    return NextResponse.json({
      success: true,
      material: {
        materialId: material.materialId,
        materialName: material.materialName,
        materialType: material.materialType,
        blockchain: {
          network: material.blockchain.network,
          contractAddress: material.blockchain.contractAddress,
          transactionHash: material.blockchain.transactionHash,
          blockNumber: material.blockchain.blockNumber,
          timestamp: material.blockchain.timestamp
        },
        verification: {
          verified: material.verification.verified
        },
        tracking: {
          url: trackingUrl,
          qrCode: qrCodeDataUrl
        }
      }
    }, { status: 201 })

  } catch (error: any) {
    console.error('Material registration error:', error)

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    // Handle other errors
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
