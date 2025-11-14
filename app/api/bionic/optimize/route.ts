/**
 * Bionic Design Optimization API Endpoint
 *
 * Runs genetic algorithm optimization using biomimicry patterns
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { BionicDesignService, BionicDesignParams, GeneticAlgorithmConfig } from '@/lib/services/bionic-design'

const bionicService = new BionicDesignService()

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate required fields
    if (!body.projectId || !body.pattern) {
      return NextResponse.json({
        error: 'Missing required fields: projectId, pattern'
      }, { status: 400 })
    }

    // Prepare parameters
    const params: BionicDesignParams = {
      pattern: body.pattern,
      dimensions: body.dimensions || { width: 10, height: 3, depth: 10 },
      objectives: {
        structural: body.objectives?.structural ?? 0.4,
        thermal: body.objectives?.thermal ?? 0.3,
        aerodynamic: body.objectives?.aerodynamic ?? 0.2,
        aesthetic: body.objectives?.aesthetic ?? 0.1
      },
      constraints: {
        maxWeight: body.constraints?.maxWeight,
        maxCost: body.constraints?.maxCost,
        minStrength: body.constraints?.minStrength || 1.0,
        materialTypes: body.constraints?.materialTypes || ['steel', 'concrete', 'wood'],
        buildingCodes: body.constraints?.buildingCodes || []
      },
      environmentalFactors: {
        windSpeed: body.environmentalFactors?.windSpeed || 20,
        temperature: body.environmentalFactors?.temperature || [5, 35],
        humidity: body.environmentalFactors?.humidity || 50,
        seismicZone: body.environmentalFactors?.seismicZone || 2
      }
    }

    // GA configuration
    const gaConfig: GeneticAlgorithmConfig = {
      populationSize: body.gaConfig?.populationSize || 50,
      generations: body.gaConfig?.generations || 100,
      mutationRate: body.gaConfig?.mutationRate || 0.1,
      crossoverRate: body.gaConfig?.crossoverRate || 0.7,
      elitismRate: body.gaConfig?.elitismRate || 0.1,
      selectionMethod: body.gaConfig?.selectionMethod || 'tournament',
      tournamentSize: body.gaConfig?.tournamentSize || 5,
      convergenceThreshold: body.gaConfig?.convergenceThreshold || 0.001,
      convergenceGenerations: body.gaConfig?.convergenceGenerations || 10
    }

    // Run optimization
    console.log(`Starting bionic optimization for project ${body.projectId}`)
    const result = await bionicService.optimizeDesign(params, gaConfig)

    // Store result in database
    const { data: optimization, error: dbError } = await supabase
      .from('bionic_optimizations')
      .insert({
        project_id: body.projectId,
        user_id: user.id,
        pattern: params.pattern,
        parameters: params,
        ga_config: gaConfig,
        best_design: result.bestDesign,
        scores: result.scores,
        performance_metrics: result.performanceMetrics,
        generation_count: result.generationCount,
        convergence_history: result.convergenceHistory,
        computation_time_ms: result.computationTime
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      throw dbError
    }

    return NextResponse.json({
      success: true,
      optimizationId: optimization.id,
      result: {
        pattern: result.bestDesign.pattern,
        scores: result.scores,
        performanceMetrics: result.performanceMetrics,
        generationCount: result.generationCount,
        computationTime: result.computationTime,
        convergenceAchieved: result.convergenceHistory.length > 0 &&
          result.convergenceHistory[result.convergenceHistory.length - 1].converged
      }
    })
  } catch (error: any) {
    console.error('Bionic optimization error:', error)
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
    const optimizationId = searchParams.get('optimizationId')
    const projectId = searchParams.get('projectId')

    if (optimizationId) {
      // Get specific optimization result
      const { data: optimization, error } = await supabase
        .from('bionic_optimizations')
        .select('*')
        .eq('id', optimizationId)
        .eq('user_id', user.id)
        .single()

      if (error || !optimization) {
        return NextResponse.json({ error: 'Optimization not found' }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        optimization: {
          id: optimization.id,
          projectId: optimization.project_id,
          pattern: optimization.pattern,
          bestDesign: optimization.best_design,
          scores: optimization.scores,
          performanceMetrics: optimization.performance_metrics,
          generationCount: optimization.generation_count,
          convergenceHistory: optimization.convergence_history,
          computationTime: optimization.computation_time_ms,
          createdAt: optimization.created_at
        }
      })
    } else if (projectId) {
      // List optimizations for project
      const { data: optimizations, error } = await supabase
        .from('bionic_optimizations')
        .select('id, pattern, scores, generation_count, computation_time_ms, created_at')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        throw error
      }

      return NextResponse.json({
        success: true,
        optimizations: optimizations || []
      })
    }

    return NextResponse.json({ error: 'Missing required parameter' }, { status: 400 })
  } catch (error: any) {
    console.error('Bionic GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
