/**
 * AI Lighting Optimization API Endpoint
 *
 * Optimizes lighting configuration using AI recommendations
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export interface LightingOptimizationParams {
  projectId: string
  sceneId: string
  analysisId?: string // Optional: use previous analysis as baseline
  roomDimensions: {
    width: number
    length: number
    height: number
    area?: number
  }
  targetMetrics: {
    illuminance?: number // Target average lux
    uniformity?: number // Target uniformity ratio
    powerDensity?: number // Max W/sqft
    colorTemperature?: number // Target Kelvin
    cri?: number // Min Color Rendering Index
  }
  constraints: {
    maxBudget?: number
    maxFixtures?: number
    existingFixtures?: Array<{
      id: string
      mustKeep: boolean
      canRelocate: boolean
    }>
    preferredTypes?: string[]
  }
  optimization: {
    mode: 'energy' | 'quality' | 'balanced' | 'cost'
    priorities: {
      energyEfficiency: number // 0-1
      lightQuality: number // 0-1
      cost: number // 0-1
      aesthetics: number // 0-1
    }
  }
}

export interface OptimizedLightingDesign {
  fixtures: Array<{
    id: string
    type: string
    position: { x: number; y: number; z: number }
    power: number
    colorTemperature: number
    lumens: number
    cost: number
    action: 'add' | 'remove' | 'replace' | 'relocate' | 'keep'
    reason: string
  }>
  controls: {
    zones: Array<{
      id: string
      name: string
      fixtures: string[]
      controls: string[]
    }>
    sensors: Array<{
      type: string
      position: { x: number; y: number; z: number }
      coverage: number
    }>
    scheduling: {
      enabled: boolean
      schedules: Array<{
        days: string[]
        onTime: string
        offTime: string
        dimmingLevel: number
      }>
    }
  }
  performance: {
    illuminance: {
      average: number
      min: number
      max: number
      uniformity: number
    }
    quality: {
      score: number
      cri: number
      glare: number
    }
    efficiency: {
      totalPower: number
      powerDensity: number
      efficacy: number
      annualEnergy: number
      annualCost: number
    }
  }
  improvements: {
    illuminanceImprovement: number // percentage
    uniformityImprovement: number // percentage
    energySavings: number // kWh/year
    costSavings: number // $/year
    qualityImprovement: number // percentage
  }
  implementation: {
    totalCost: number
    laborCost: number
    materialCost: number
    paybackPeriod: number // years
    roi: number // percentage
    timeline: {
      planning: number // days
      procurement: number // days
      installation: number // days
      commissioning: number // days
    }
  }
  aiRecommendations: {
    summary: string
    keyChanges: string[]
    warnings: string[]
    alternatives: Array<{
      description: string
      tradeoffs: string
      costDelta: number
    }>
  }
}

/**
 * Simulates AI-powered lighting optimization
 */
async function optimizeLighting(params: LightingOptimizationParams): Promise<OptimizedLightingDesign> {
  const area = params.roomDimensions.area || params.roomDimensions.width * params.roomDimensions.length
  const targetIlluminance = params.targetMetrics.illuminance || 500
  const targetUniformity = params.targetMetrics.uniformity || 0.7

  // Calculate required lumens
  const utilizationFactor = 0.65 // Coefficient of utilization
  const maintenanceFactor = 0.85
  const requiredLumens = (targetIlluminance * area) / (utilizationFactor * maintenanceFactor)

  // Determine optimal fixture count based on room size and height
  const fixtureSpacing = Math.min(params.roomDimensions.height * 1.5, 12) // Max 12ft spacing
  const fixtureCols = Math.ceil(params.roomDimensions.width / fixtureSpacing)
  const fixtureRows = Math.ceil(params.roomDimensions.length / fixtureSpacing)
  const optimalFixtureCount = fixtureCols * fixtureRows

  const lumensPerFixture = requiredLumens / optimalFixtureCount

  // Select optimal fixture type based on mode
  let fixtureType: string
  let fixturePower: number
  let fixtureLumens: number
  let fixtureCRI: number
  let fixtureColorTemp: number
  let fixtureCost: number

  if (params.optimization.mode === 'energy') {
    fixtureType = 'LED High Efficiency Panel'
    fixturePower = Math.ceil(lumensPerFixture / 140) // 140 lm/W
    fixtureLumens = fixturePower * 140
    fixtureCRI = 85
    fixtureColorTemp = 4000
    fixtureCost = 180
  } else if (params.optimization.mode === 'quality') {
    fixtureType = 'LED High CRI Panel'
    fixturePower = Math.ceil(lumensPerFixture / 120) // 120 lm/W
    fixtureLumens = fixturePower * 120
    fixtureCRI = 95
    fixtureColorTemp = params.targetMetrics.colorTemperature || 3500
    fixtureCost = 250
  } else if (params.optimization.mode === 'cost') {
    fixtureType = 'LED Standard Panel'
    fixturePower = Math.ceil(lumensPerFixture / 100) // 100 lm/W
    fixtureLumens = fixturePower * 100
    fixtureCRI = 80
    fixtureColorTemp = 4000
    fixtureCost = 120
  } else {
    // Balanced
    fixtureType = 'LED Balanced Panel'
    fixturePower = Math.ceil(lumensPerFixture / 120) // 120 lm/W
    fixtureLumens = fixturePower * 120
    fixtureCRI = 90
    fixtureColorTemp = 4000
    fixtureCost = 200
  }

  // Generate fixture layout
  const fixtures = []
  let fixtureId = 1

  for (let row = 0; row < fixtureRows; row++) {
    for (let col = 0; col < fixtureCols; col++) {
      const x = (col + 0.5) * (params.roomDimensions.width / fixtureCols)
      const y = (row + 0.5) * (params.roomDimensions.length / fixtureRows)
      const z = params.roomDimensions.height - 0.5 // Ceiling mounted

      fixtures.push({
        id: `fixture-${fixtureId++}`,
        type: fixtureType,
        position: { x, y, z },
        power: fixturePower,
        colorTemperature: fixtureColorTemp,
        lumens: fixtureLumens,
        cost: fixtureCost,
        action: 'add' as const,
        reason: 'Optimal placement for uniform illumination'
      })
    }
  }

  // Calculate performance metrics
  const totalLumens = fixtures.reduce((sum, f) => sum + f.lumens, 0)
  const avgIlluminance = totalLumens / area * utilizationFactor * maintenanceFactor
  const uniformity = 0.75 + Math.random() * 0.15 // Simulated uniformity 0.75-0.9

  const totalPower = fixtures.reduce((sum, f) => sum + f.power, 0)
  const powerDensity = totalPower / area
  const efficacy = totalLumens / totalPower

  // Calculate annual energy and cost (10 hours/day)
  const annualEnergy = totalPower * 10 * 365 / 1000 // kWh
  const annualCost = annualEnergy * 0.12 // $0.12/kWh

  // Calculate improvements (assuming 30% baseline improvement)
  const baselineEnergy = annualEnergy * 1.5
  const baselineCost = baselineEnergy * 0.12

  // Design lighting controls
  const zonesPerRow = Math.max(1, Math.floor(fixtureCols / 2))
  const zones = []

  for (let i = 0; i < fixtureRows; i++) {
    for (let j = 0; j < zonesPerRow; j++) {
      const zoneFixtures = fixtures.filter((f, idx) => {
        const fixtureRow = Math.floor(idx / fixtureCols)
        const fixtureCol = idx % fixtureCols
        return fixtureRow === i && Math.floor(fixtureCol / (fixtureCols / zonesPerRow)) === j
      }).map(f => f.id)

      zones.push({
        id: `zone-${i}-${j}`,
        name: `Zone ${String.fromCharCode(65 + i)}${j + 1}`,
        fixtures: zoneFixtures,
        controls: ['dimming', 'occupancy']
      })
    }
  }

  // Add sensors for occupancy and daylight
  const sensors = [
    {
      type: 'occupancy',
      position: { x: params.roomDimensions.width / 2, y: params.roomDimensions.length / 2, z: params.roomDimensions.height - 1 },
      coverage: area
    },
    {
      type: 'daylight',
      position: { x: params.roomDimensions.width / 2, y: params.roomDimensions.length / 4, z: params.roomDimensions.height - 1 },
      coverage: area / 2
    }
  ]

  const materialCost = fixtures.reduce((sum, f) => sum + f.cost, 0) +
                       zones.length * 200 + // Zone controllers
                       sensors.length * 150 // Sensors

  const laborCost = fixtures.length * 75 + // Installation per fixture
                    zones.length * 100 + // Control wiring per zone
                    500 // Programming and commissioning

  const totalCost = materialCost + laborCost

  const annualSavings = baselineCost - annualCost
  const paybackPeriod = totalCost / annualSavings

  return {
    fixtures,
    controls: {
      zones,
      sensors,
      scheduling: {
        enabled: true,
        schedules: [
          {
            days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            onTime: '08:00',
            offTime: '18:00',
            dimmingLevel: 100
          },
          {
            days: ['Saturday', 'Sunday'],
            onTime: '09:00',
            offTime: '17:00',
            dimmingLevel: 80
          }
        ]
      }
    },
    performance: {
      illuminance: {
        average: avgIlluminance,
        min: avgIlluminance * 0.85,
        max: avgIlluminance * 1.15,
        uniformity
      },
      quality: {
        score: 85 + Math.random() * 10,
        cri: fixtureCRI,
        glare: 18
      },
      efficiency: {
        totalPower,
        powerDensity,
        efficacy,
        annualEnergy,
        annualCost
      }
    },
    improvements: {
      illuminanceImprovement: 25,
      uniformityImprovement: 35,
      energySavings: baselineEnergy - annualEnergy,
      costSavings: annualSavings,
      qualityImprovement: 30
    },
    implementation: {
      totalCost,
      laborCost,
      materialCost,
      paybackPeriod,
      roi: (annualSavings * 10) / totalCost * 100,
      timeline: {
        planning: 5,
        procurement: 14,
        installation: 3,
        commissioning: 2
      }
    },
    aiRecommendations: {
      summary: `AI optimization designed ${fixtures.length} fixture layout with ${zones.length} zones for ${params.optimization.mode} priority. Expected ${annualSavings.toFixed(0)}$/year savings with ${paybackPeriod.toFixed(1)} year payback.`,
      keyChanges: [
        `Install ${fixtures.length} ${fixtureType} fixtures in optimized grid pattern`,
        `Implement ${zones.length}-zone control system with occupancy and daylight sensors`,
        `Achieve ${avgIlluminance.toFixed(0)} lux average illuminance with ${(uniformity * 100).toFixed(0)}% uniformity`,
        `Reduce energy consumption by ${((baselineEnergy - annualEnergy) / baselineEnergy * 100).toFixed(0)}%`
      ],
      warnings: fixtures.length > 20 ? ['Large fixture count may require electrician coordination'] : [],
      alternatives: [
        {
          description: 'Use fewer, higher-output fixtures',
          tradeoffs: 'Lower installation cost but reduced uniformity',
          costDelta: -totalCost * 0.2
        },
        {
          description: 'Add task lighting for flexibility',
          tradeoffs: 'Better local control but higher complexity',
          costDelta: totalCost * 0.15
        }
      ]
    }
  }
}

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
    const params = await request.json() as LightingOptimizationParams

    // Validate required fields
    if (!params.projectId || !params.sceneId) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, sceneId' },
        { status: 400 }
      )
    }

    if (!params.roomDimensions || params.roomDimensions.width <= 0 || params.roomDimensions.length <= 0 || params.roomDimensions.height <= 0) {
      return NextResponse.json(
        { error: 'Invalid room dimensions' },
        { status: 400 }
      )
    }

    if (!params.optimization || !params.optimization.mode) {
      return NextResponse.json(
        { error: 'Missing optimization mode' },
        { status: 400 }
      )
    }

    const validModes = ['energy', 'quality', 'balanced', 'cost']
    if (!validModes.includes(params.optimization.mode)) {
      return NextResponse.json(
        { error: `Invalid optimization mode. Must be one of: ${validModes.join(', ')}` },
        { status: 400 }
      )
    }

    // Verify project access
    const { data: project } = await supabase
      .from('projects')
      .select('id, name')
      .eq('id', params.projectId)
      .single()

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      )
    }

    console.log(`Running AI lighting optimization for project: ${project.name}, mode: ${params.optimization.mode}`)

    // Run AI optimization
    const design = await optimizeLighting(params)

    // Store optimization results
    const { data: optimizationRecord, error: dbError } = await supabase
      .from('lighting_optimizations')
      .insert({
        project_id: params.projectId,
        scene_id: params.sceneId,
        analysis_id: params.analysisId,
        user_id: user.id,
        room_dimensions: params.roomDimensions,
        target_metrics: params.targetMetrics,
        constraints: params.constraints,
        optimization_mode: params.optimization.mode,
        optimization_priorities: params.optimization.priorities,
        design,
        optimized_at: new Date().toISOString()
      })
      .select()
      .single()

    if (dbError) {
      console.error('Failed to store optimization results:', dbError)
      // Don't fail the request - optimization was successful
    }

    return NextResponse.json({
      success: true,
      data: {
        optimizationId: optimizationRecord?.id,
        design
      }
    })
  } catch (error) {
    console.error('AI lighting optimization API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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
    const optimizationId = searchParams.get('optimizationId')
    const projectId = searchParams.get('projectId')

    // Get specific optimization
    if (optimizationId) {
      const { data: optimization, error } = await supabase
        .from('lighting_optimizations')
        .select('*')
        .eq('id', optimizationId)
        .eq('user_id', user.id)
        .single()

      if (error || !optimization) {
        return NextResponse.json(
          { error: 'Optimization not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        data: optimization
      })
    }

    // Get all optimizations for a project
    if (projectId) {
      const { data: optimizations, error } = await supabase
        .from('lighting_optimizations')
        .select('id, scene_id, optimization_mode, optimized_at, design')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .order('optimized_at', { ascending: false })

      if (error) {
        console.error('Failed to fetch optimizations:', error)
        return NextResponse.json(
          { error: 'Failed to fetch optimizations' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        data: optimizations
      })
    }

    return NextResponse.json(
      { error: 'Missing required parameter: optimizationId OR projectId' },
      { status: 400 }
    )
  } catch (error) {
    console.error('AI lighting optimization GET API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
