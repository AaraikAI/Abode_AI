/**
 * Energy Simulation API Endpoint
 *
 * Performs energy and thermal modeling for buildings
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  EnergySimulation,
  EnergySimulationParams,
  ClimateDataService
} from '@/lib/services/energy-simulation'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const params = await request.json() as EnergySimulationParams

    // Validate request
    if (!params.projectId || !params.building || !params.location) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, building, location' },
        { status: 400 }
      )
    }

    // Validate building dimensions
    if (params.building.floorArea <= 0) {
      return NextResponse.json(
        { error: 'Invalid floor area' },
        { status: 400 }
      )
    }

    if (params.building.height <= 0) {
      return NextResponse.json(
        { error: 'Invalid building height' },
        { status: 400 }
      )
    }

    // Validate location coordinates
    if (params.location.latitude < -90 || params.location.latitude > 90) {
      return NextResponse.json(
        { error: 'Invalid latitude' },
        { status: 400 }
      )
    }

    if (params.location.longitude < -180 || params.location.longitude > 180) {
      return NextResponse.json(
        { error: 'Invalid longitude' },
        { status: 400 }
      )
    }

    // Get user's organization
    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json(
        { error: 'User not associated with any organization' },
        { status: 403 }
      )
    }

    // Verify project access
    const { data: project } = await supabase
      .from('projects')
      .select('id, name')
      .eq('id', params.projectId)
      .eq('org_id', membership.organization_id)
      .single()

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      )
    }

    console.log(`Running energy simulation for project: ${project.name}`)

    // Get climate data
    const climateService = new ClimateDataService()
    let climateData
    try {
      climateData = await climateService.getClimateData(
        params.location.latitude,
        params.location.longitude
      )
    } catch (error: any) {
      console.error('Failed to get climate data:', error)
      return NextResponse.json(
        { error: 'Failed to retrieve climate data for location' },
        { status: 400 }
      )
    }

    // Run energy simulation
    const energySimulation = new EnergySimulation()
    const results = await energySimulation.simulate({
      ...params,
      climate: climateData
    })

    // Store simulation results in database
    const { data: simulationRecord, error: dbError } = await supabase
      .from('energy_simulations')
      .insert({
        project_id: params.projectId,
        org_id: membership.organization_id,
        user_id: user.id,
        building_params: params.building,
        location: params.location,
        climate_data: climateData,
        envelope: params.envelope,
        hvac: params.hvac,
        lighting: params.lighting,
        equipment: params.equipment,
        occupancy: params.occupancy,
        results,
        simulated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (dbError) {
      console.error('Failed to store simulation results:', dbError)
      // Don't fail the request - simulation was successful
    }

    return NextResponse.json({
      success: true,
      data: {
        simulationId: simulationRecord?.id,
        results,
        climateData: {
          heatingDegreeDays: climateData.heatingDegreeDays,
          coolingDegreeDays: climateData.coolingDegreeDays,
          designTemperature: climateData.designTemperature
        }
      }
    })
  } catch (error) {
    console.error('Energy simulation API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET - Retrieve simulation results
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const simulationId = searchParams.get('simulationId')
    const projectId = searchParams.get('projectId')

    // Get specific simulation
    if (simulationId) {
      const { data: simulation, error } = await supabase
        .from('energy_simulations')
        .select('*')
        .eq('id', simulationId)
        .eq('user_id', user.id)
        .single()

      if (error || !simulation) {
        return NextResponse.json(
          { error: 'Simulation not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        data: simulation
      })
    }

    // Get all simulations for a project
    if (projectId) {
      const { data: simulations, error } = await supabase
        .from('energy_simulations')
        .select('id, simulated_at, results')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .order('simulated_at', { ascending: false })

      if (error) {
        console.error('Failed to fetch simulations:', error)
        return NextResponse.json(
          { error: 'Failed to fetch simulations' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        data: simulations
      })
    }

    return NextResponse.json(
      { error: 'Missing required parameter: simulationId OR projectId' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Energy simulation GET API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
