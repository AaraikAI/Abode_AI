/**
 * Blockchain Material History API Endpoint
 *
 * Get complete material provenance chain from source to installation
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { BlockchainIntegrationService } from '@/lib/services/blockchain-integration'

// Initialize blockchain service
const blockchainService = new BlockchainIntegrationService({
  network: (process.env.BLOCKCHAIN_NETWORK as any) || 'polygon',
  rpcUrl: process.env.BLOCKCHAIN_RPC_URL || 'https://polygon-rpc.com',
  chainId: parseInt(process.env.BLOCKCHAIN_CHAIN_ID || '137'),
  apiKey: process.env.BLOCKCHAIN_API_KEY
})

/**
 * GET /api/blockchain/materials/[id]/history
 * Get complete material history and provenance chain
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get material ID from params
    const materialId = params.id

    if (!materialId || typeof materialId !== 'string') {
      return NextResponse.json(
        { error: 'Material ID is required' },
        { status: 400 }
      )
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const includeVerification = searchParams.get('includeVerification') === 'true'
    const format = searchParams.get('format') || 'json'

    // Fetch material from database
    const { data: material, error: materialError } = await supabase
      .from('blockchain_materials')
      .select('*')
      .eq('material_id', materialId)
      .single()

    if (materialError || !material) {
      return NextResponse.json(
        { error: 'Material not found' },
        { status: 404 }
      )
    }

    // Check if user has access to this material
    // Material must be owned by user or be in a shared project
    const { data: projectMaterials } = await supabase
      .from('project_materials')
      .select(`
        project_id,
        projects!inner (
          user_id,
          shared_with
        )
      `)
      .eq('material_id', materialId)

    const hasAccess = material.user_id === user.id ||
      projectMaterials?.some((pm: any) =>
        pm.projects.user_id === user.id ||
        pm.projects.shared_with?.includes(user.id)
      )

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Forbidden - You do not have access to this material' },
        { status: 403 }
      )
    }

    // Fetch supply chain events
    const { data: events, error: eventsError } = await supabase
      .from('supply_chain_events')
      .select('*')
      .eq('material_id', materialId)
      .order('timestamp', { ascending: true })

    if (eventsError) {
      console.error('Events fetch error:', eventsError)
    }

    // Transform supply chain events
    const supplyChain = (events || []).map((event: any) => ({
      id: event.event_id,
      eventType: event.event_type,
      timestamp: event.timestamp,
      location: event.location,
      actor: event.actor,
      description: event.description,
      data: event.data,
      transactionHash: event.transaction_hash,
      blockNumber: event.block_number,
      verified: event.verified || false
    }))

    // Calculate journey statistics
    const journeyStats = {
      totalEvents: supplyChain.length,
      startDate: supplyChain.length > 0 ? supplyChain[0].timestamp : null,
      endDate: supplyChain.length > 0 ? supplyChain[supplyChain.length - 1].timestamp : null,
      locations: [...new Set(supplyChain.map((e: any) => e.location))],
      actors: [...new Set(supplyChain.map((e: any) => e.actor))],
      eventTypes: [...new Set(supplyChain.map((e: any) => e.eventType))]
    }

    // Calculate duration
    if (journeyStats.startDate && journeyStats.endDate) {
      const durationMs = new Date(journeyStats.endDate).getTime() - new Date(journeyStats.startDate).getTime()
      journeyStats.durationDays = Math.floor(durationMs / (1000 * 60 * 60 * 24))
    }

    // Verify supply chain integrity if requested
    let verification = null
    if (includeVerification) {
      verification = await blockchainService.verifySupplyChain(materialId)
    }

    // Build response data
    const responseData = {
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
          blockNumber: material.block_number,
          timestamp: material.created_at
        },
        verification: {
          verified: material.verified,
          verifiedBy: material.verified_by,
          verifiedAt: material.verified_at,
          proofUrl: material.proof_url
        },
        tracking: {
          url: material.tracking_url,
          qrCode: material.qr_code_url
        }
      },
      provenance: {
        supplyChain,
        journeyStats,
        verification: includeVerification ? verification : undefined
      },
      timeline: supplyChain.map((event: any, index: number) => ({
        step: index + 1,
        eventType: event.eventType,
        date: event.timestamp,
        location: event.location,
        actor: event.actor,
        description: event.description,
        blockchainProof: {
          transactionHash: event.transactionHash,
          blockNumber: event.blockNumber,
          verified: event.verified
        }
      }))
    }

    // Return in requested format
    if (format === 'timeline') {
      return NextResponse.json({
        success: true,
        materialId: material.material_id,
        materialName: material.material_name,
        timeline: responseData.timeline,
        stats: journeyStats
      })
    } else if (format === 'csv') {
      // Generate CSV format for export
      const csvHeaders = ['Step', 'Event Type', 'Date', 'Location', 'Actor', 'Description', 'Transaction Hash']
      const csvRows = responseData.timeline.map((event: any) => [
        event.step,
        event.eventType,
        event.date,
        event.location,
        event.actor,
        event.description,
        event.blockchainProof.transactionHash
      ])

      const csv = [
        csvHeaders.join(','),
        ...csvRows.map((row: any) => row.map((cell: any) => `"${cell}"`).join(','))
      ].join('\n')

      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="material-${materialId}-history.csv"`
        }
      })
    }

    // Return JSON format (default)
    return NextResponse.json(responseData)

  } catch (error: any) {
    console.error('Material history error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
