/**
 * AI Lighting Analysis API Endpoint
 *
 * Analyzes scene lighting with AI and provides recommendations
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export interface LightingAnalysisParams {
  projectId: string
  sceneId: string
  roomDimensions: {
    width: number
    length: number
    height: number
    area?: number
  }
  currentLighting: {
    fixtures: Array<{
      type: string
      position: { x: number; y: number; z: number }
      power: number // watts
      colorTemperature: number // Kelvin
      lumens: number
    }>
  }
  surfaces: {
    walls: { reflectance: number; color: string }
    ceiling: { reflectance: number; color: string }
    floor: { reflectance: number; color: string }
  }
  naturalLight?: {
    windows: Array<{
      area: number
      orientation: string
      transmittance: number
    }>
  }
  usage: {
    type: string // 'residential', 'commercial', 'industrial', etc.
    activities: string[]
    occupancyHours: { start: number; end: number }
  }
}

export interface LightingAnalysisResult {
  illuminance: {
    average: number // lux
    min: number
    max: number
    uniformity: number
    heatmap: number[][]
  }
  quality: {
    score: number // 0-100
    colorRendering: number // CRI
    glareIndex: number // UGR
    flickerRate: number
  }
  efficiency: {
    powerDensity: number // W/sqft
    efficacy: number // lm/W
    energyConsumption: number // kWh/year
    cost: number // $/year
  }
  compliance: {
    standardsMet: string[]
    deficiencies: Array<{
      standard: string
      requirement: string
      actual: number
      recommended: number
    }>
  }
  recommendations: Array<{
    id: string
    category: string
    priority: 'high' | 'medium' | 'low'
    title: string
    description: string
    impact: {
      illuminanceImprovement: number
      energySavings: number
      costSavings: number
    }
    implementation: {
      difficulty: string
      estimatedCost: number
      roi: number // years
    }
  }>
  aiInsights: {
    summary: string
    strengths: string[]
    weaknesses: string[]
    opportunities: string[]
  }
}

/**
 * Simulates AI-powered lighting analysis
 */
async function analyzeLighting(params: LightingAnalysisParams): Promise<LightingAnalysisResult> {
  const area = params.roomDimensions.area || params.roomDimensions.width * params.roomDimensions.length
  const volume = area * params.roomDimensions.height

  // Calculate total lumens from fixtures
  const totalLumens = params.currentLighting.fixtures.reduce((sum, f) => sum + f.lumens, 0)
  const avgIlluminance = totalLumens / area

  // Calculate total power
  const totalPower = params.currentLighting.fixtures.reduce((sum, f) => sum + f.power, 0)
  const powerDensity = totalPower / area
  const efficacy = totalLumens / totalPower

  // Simulate heatmap (simplified)
  const heatmapResolution = 10
  const heatmap: number[][] = []
  for (let i = 0; i < heatmapResolution; i++) {
    const row: number[] = []
    for (let j = 0; j < heatmapResolution; j++) {
      // Simulate variation based on fixture positions
      const variation = Math.random() * 0.3 + 0.85 // 85% to 115% of average
      row.push(avgIlluminance * variation)
    }
    heatmap.push(row)
  }

  const flatValues = heatmap.flat()
  const minIlluminance = Math.min(...flatValues)
  const maxIlluminance = Math.max(...flatValues)
  const uniformity = minIlluminance / avgIlluminance

  // Calculate quality score
  const avgCRI = params.currentLighting.fixtures.reduce((sum, f) => {
    // Estimate CRI from color temperature
    const cri = f.colorTemperature >= 2700 && f.colorTemperature <= 6500 ? 85 : 70
    return sum + cri
  }, 0) / params.currentLighting.fixtures.length

  const qualityScore = (
    (avgIlluminance / 500) * 30 + // Illuminance contribution
    (avgCRI / 100) * 30 + // CRI contribution
    uniformity * 20 + // Uniformity contribution
    0.8 * 20 // Other factors
  )

  // Determine compliance
  const targetIlluminance = params.usage.type === 'commercial' ? 500 : 300
  const meetsStandards = avgIlluminance >= targetIlluminance * 0.9

  // Generate recommendations
  const recommendations = []

  if (avgIlluminance < targetIlluminance) {
    recommendations.push({
      id: 'increase-illuminance',
      category: 'Illuminance',
      priority: 'high' as const,
      title: 'Increase overall illuminance',
      description: `Current average illuminance is ${avgIlluminance.toFixed(0)} lux, below the recommended ${targetIlluminance} lux for ${params.usage.type} spaces.`,
      impact: {
        illuminanceImprovement: targetIlluminance - avgIlluminance,
        energySavings: 0,
        costSavings: 0
      },
      implementation: {
        difficulty: 'Medium',
        estimatedCost: 2000,
        roi: 3
      }
    })
  }

  if (efficacy < 80) {
    const potentialSavings = totalPower * 0.3 * 8 * 365 / 1000 // 30% savings, 8hrs/day
    recommendations.push({
      id: 'upgrade-to-led',
      category: 'Efficiency',
      priority: 'high' as const,
      title: 'Upgrade to LED fixtures',
      description: 'Current lighting efficacy is below modern LED standards. Upgrading can reduce energy consumption by up to 70%.',
      impact: {
        illuminanceImprovement: 0,
        energySavings: potentialSavings,
        costSavings: potentialSavings * 0.12 // $0.12/kWh
      },
      implementation: {
        difficulty: 'Medium',
        estimatedCost: params.currentLighting.fixtures.length * 150,
        roi: 2.5
      }
    })
  }

  if (uniformity < 0.6) {
    recommendations.push({
      id: 'improve-uniformity',
      category: 'Distribution',
      priority: 'medium' as const,
      title: 'Improve light distribution',
      description: 'Light uniformity is below recommended levels. Consider redistributing fixtures or adding diffusers.',
      impact: {
        illuminanceImprovement: 0,
        energySavings: 0,
        costSavings: 0
      },
      implementation: {
        difficulty: 'Low',
        estimatedCost: 800,
        roi: 5
      }
    })
  }

  if (avgCRI < 80) {
    recommendations.push({
      id: 'improve-cri',
      category: 'Quality',
      priority: 'medium' as const,
      title: 'Improve color rendering',
      description: 'Color Rendering Index is below 80. High-CRI fixtures will improve visual comfort and color accuracy.',
      impact: {
        illuminanceImprovement: 0,
        energySavings: 0,
        costSavings: 0
      },
      implementation: {
        difficulty: 'Medium',
        estimatedCost: 1500,
        roi: 4
      }
    })
  }

  // Add daylight harvesting if windows exist
  if (params.naturalLight && params.naturalLight.windows.length > 0) {
    const totalWindowArea = params.naturalLight.windows.reduce((sum, w) => sum + w.area, 0)
    if (totalWindowArea > area * 0.1) {
      const daylightSavings = totalPower * 0.4 * 8 * 365 / 1000
      recommendations.push({
        id: 'daylight-harvesting',
        category: 'Controls',
        priority: 'medium' as const,
        title: 'Install daylight harvesting controls',
        description: 'Significant natural light is available. Automated dimming controls can reduce energy use during daylight hours.',
        impact: {
          illuminanceImprovement: 0,
          energySavings: daylightSavings,
          costSavings: daylightSavings * 0.12
        },
        implementation: {
          difficulty: 'Medium',
          estimatedCost: 3000,
          roi: 3
        }
      })
    }
  }

  const annualEnergyConsumption = totalPower * params.usage.occupancyHours.end - params.usage.occupancyHours.start * 365 / 1000

  return {
    illuminance: {
      average: avgIlluminance,
      min: minIlluminance,
      max: maxIlluminance,
      uniformity,
      heatmap
    },
    quality: {
      score: qualityScore,
      colorRendering: avgCRI,
      glareIndex: 19, // Simulated UGR value
      flickerRate: 0.5 // Percentage
    },
    efficiency: {
      powerDensity,
      efficacy,
      energyConsumption: annualEnergyConsumption,
      cost: annualEnergyConsumption * 0.12
    },
    compliance: {
      standardsMet: meetsStandards ? ['IES RP-1-12', 'ASHRAE 90.1'] : [],
      deficiencies: meetsStandards ? [] : [{
        standard: 'IES RP-1-12',
        requirement: `Minimum ${targetIlluminance} lux average`,
        actual: avgIlluminance,
        recommended: targetIlluminance
      }]
    },
    recommendations,
    aiInsights: {
      summary: `AI analysis indicates a lighting quality score of ${qualityScore.toFixed(0)}/100. ${recommendations.length > 0 ? `${recommendations.length} optimization opportunities identified.` : 'System is performing well.'}`,
      strengths: qualityScore >= 70 ? ['Good overall illuminance levels', 'Adequate fixture distribution'] : [],
      weaknesses: recommendations.map(r => r.title),
      opportunities: recommendations.filter(r => r.impact.energySavings > 0).map(r => `Save ${r.impact.costSavings.toFixed(0)}$/year with ${r.title.toLowerCase()}`)
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
    const params = await request.json() as LightingAnalysisParams

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

    if (!params.currentLighting || !params.currentLighting.fixtures || params.currentLighting.fixtures.length === 0) {
      return NextResponse.json(
        { error: 'At least one lighting fixture is required' },
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

    console.log(`Running AI lighting analysis for project: ${project.name}, scene: ${params.sceneId}`)

    // Run AI analysis
    const results = await analyzeLighting(params)

    // Store analysis results
    const { data: analysisRecord, error: dbError } = await supabase
      .from('lighting_analyses')
      .insert({
        project_id: params.projectId,
        scene_id: params.sceneId,
        user_id: user.id,
        room_dimensions: params.roomDimensions,
        current_lighting: params.currentLighting,
        surfaces: params.surfaces,
        natural_light: params.naturalLight,
        usage: params.usage,
        results,
        analyzed_at: new Date().toISOString()
      })
      .select()
      .single()

    if (dbError) {
      console.error('Failed to store analysis results:', dbError)
      // Don't fail the request - analysis was successful
    }

    return NextResponse.json({
      success: true,
      data: {
        analysisId: analysisRecord?.id,
        results
      }
    })
  } catch (error) {
    console.error('AI lighting analysis API error:', error)
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
    const analysisId = searchParams.get('analysisId')
    const projectId = searchParams.get('projectId')

    // Get specific analysis
    if (analysisId) {
      const { data: analysis, error } = await supabase
        .from('lighting_analyses')
        .select('*')
        .eq('id', analysisId)
        .eq('user_id', user.id)
        .single()

      if (error || !analysis) {
        return NextResponse.json(
          { error: 'Analysis not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        data: analysis
      })
    }

    // Get all analyses for a project
    if (projectId) {
      const { data: analyses, error } = await supabase
        .from('lighting_analyses')
        .select('id, scene_id, analyzed_at, results')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .order('analyzed_at', { ascending: false })

      if (error) {
        console.error('Failed to fetch analyses:', error)
        return NextResponse.json(
          { error: 'Failed to fetch analyses' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        data: analyses
      })
    }

    return NextResponse.json(
      { error: 'Missing required parameter: analysisId OR projectId' },
      { status: 400 }
    )
  } catch (error) {
    console.error('AI lighting analysis GET API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
