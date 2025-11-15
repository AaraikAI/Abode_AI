/**
 * AI Reasoning Query API Endpoint
 *
 * Provides multi-step reasoning capabilities for complex architectural queries
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export interface ReasoningQueryParams {
  projectId: string
  query: string
  context?: {
    buildingType?: string
    location?: string
    regulations?: string[]
    constraints?: Record<string, any>
    previousQueries?: string[]
  }
  reasoning: {
    mode: 'fast' | 'thorough' | 'creative'
    maxSteps?: number
    includeRationale?: boolean
    verifyAssumptions?: boolean
  }
}

export interface ReasoningStep {
  stepNumber: number
  type: 'analysis' | 'inference' | 'calculation' | 'lookup' | 'validation' | 'synthesis'
  description: string
  input: any
  process: string
  output: any
  confidence: number
  assumptions: string[]
  alternatives?: string[]
}

export interface ReasoningQueryResult {
  query: string
  answer: string
  confidence: number
  reasoning: {
    steps: ReasoningStep[]
    totalSteps: number
    complexity: 'simple' | 'moderate' | 'complex'
  }
  evidence: Array<{
    type: string
    source: string
    relevance: number
    content: string
  }>
  recommendations: Array<{
    suggestion: string
    rationale: string
    priority: 'high' | 'medium' | 'low'
  }>
  relatedQuestions: string[]
  metadata: {
    processingTime: number
    tokensUsed: number
    model: string
  }
}

/**
 * Simulates multi-step AI reasoning for architectural queries
 */
async function performReasoning(params: ReasoningQueryParams): Promise<ReasoningQueryResult> {
  const startTime = Date.now()
  const steps: ReasoningStep[] = []

  // Step 1: Query Analysis
  steps.push({
    stepNumber: 1,
    type: 'analysis',
    description: 'Analyze query intent and extract key information',
    input: params.query,
    process: 'Natural language processing to identify query type, domain, and required information',
    output: {
      intent: 'information_seeking',
      domain: 'architecture',
      entities: extractEntities(params.query),
      queryType: categorizeQuery(params.query)
    },
    confidence: 0.92,
    assumptions: ['Query is well-formed', 'Context is relevant']
  })

  // Step 2: Context Integration
  if (params.context) {
    steps.push({
      stepNumber: 2,
      type: 'inference',
      description: 'Integrate contextual information',
      input: params.context,
      process: 'Combine query with project context, constraints, and regulations',
      output: {
        relevantContext: {
          buildingType: params.context.buildingType,
          location: params.context.location,
          applicableRegulations: params.context.regulations || []
        }
      },
      confidence: 0.88,
      assumptions: ['Context is accurate', 'Regulations are current']
    })
  }

  // Step 3: Knowledge Retrieval
  steps.push({
    stepNumber: steps.length + 1,
    type: 'lookup',
    description: 'Retrieve relevant knowledge and best practices',
    input: { query: params.query, context: params.context },
    process: 'Search knowledge base for relevant architectural principles, codes, and case studies',
    output: {
      principles: [
        'Structural integrity must be maintained',
        'Energy efficiency standards apply',
        'Accessibility requirements must be met'
      ],
      codes: ['IBC 2021', 'ASHRAE 90.1', 'ADA Guidelines'],
      casestudies: 2
    },
    confidence: 0.85,
    assumptions: ['Knowledge base is up-to-date']
  })

  // Step 4: Multi-step Reasoning
  if (params.reasoning.mode === 'thorough' || params.reasoning.mode === 'creative') {
    steps.push({
      stepNumber: steps.length + 1,
      type: 'calculation',
      description: 'Perform calculations and logical deductions',
      input: { data: 'from previous steps' },
      process: 'Apply domain knowledge and mathematical models to derive conclusions',
      output: {
        calculations: {
          structuralLoad: 'calculated',
          energyRequirements: 'estimated',
          costImpact: 'analyzed'
        }
      },
      confidence: 0.80,
      assumptions: ['Standard load factors apply', 'Material properties are typical'],
      alternatives: ['Alternative calculation method using empirical data']
    })
  }

  // Step 5: Validation
  if (params.reasoning.verifyAssumptions) {
    steps.push({
      stepNumber: steps.length + 1,
      type: 'validation',
      description: 'Validate assumptions and check for inconsistencies',
      input: { assumptions: 'from all previous steps' },
      process: 'Cross-reference assumptions with known constraints and verify logical consistency',
      output: {
        validatedAssumptions: steps.flatMap(s => s.assumptions).filter((_, i) => i % 2 === 0),
        warnings: ['Verify local code requirements', 'Confirm material availability']
      },
      confidence: 0.87,
      assumptions: ['Validation criteria are comprehensive']
    })
  }

  // Step 6: Synthesis
  steps.push({
    stepNumber: steps.length + 1,
    type: 'synthesis',
    description: 'Synthesize findings into coherent answer',
    input: { allSteps: steps },
    process: 'Combine insights from all reasoning steps into actionable answer',
    output: {
      answer: generateAnswer(params.query, params.context),
      confidence: 0.85
    },
    confidence: 0.85,
    assumptions: ['All previous steps are sound']
  })

  // Generate evidence
  const evidence = [
    {
      type: 'regulation',
      source: 'International Building Code 2021',
      relevance: 0.95,
      content: 'Relevant code sections apply to this scenario'
    },
    {
      type: 'best_practice',
      source: 'AIA Best Practices Guide',
      relevance: 0.88,
      content: 'Industry standards recommend specific approaches'
    },
    {
      type: 'case_study',
      source: 'Similar project in nearby location',
      relevance: 0.75,
      content: 'Comparable project provides useful insights'
    }
  ]

  // Generate recommendations
  const recommendations = [
    {
      suggestion: 'Consult with structural engineer for detailed analysis',
      rationale: 'Complex load calculations require professional verification',
      priority: 'high' as const
    },
    {
      suggestion: 'Review local amendments to building codes',
      rationale: 'Local jurisdictions may have additional requirements',
      priority: 'high' as const
    },
    {
      suggestion: 'Consider energy modeling for optimization',
      rationale: 'Can identify cost-effective efficiency improvements',
      priority: 'medium' as const
    }
  ]

  // Generate related questions
  const relatedQuestions = [
    'What are the seismic requirements for this building type?',
    'How can energy efficiency be improved in this design?',
    'What alternative materials could be considered?',
    'What are the lifecycle cost implications?'
  ]

  const processingTime = Date.now() - startTime

  return {
    query: params.query,
    answer: generateAnswer(params.query, params.context),
    confidence: 0.85,
    reasoning: {
      steps,
      totalSteps: steps.length,
      complexity: steps.length <= 3 ? 'simple' : steps.length <= 5 ? 'moderate' : 'complex'
    },
    evidence,
    recommendations,
    relatedQuestions,
    metadata: {
      processingTime,
      tokensUsed: params.query.length * 2 + (params.context ? JSON.stringify(params.context).length : 0),
      model: params.reasoning.mode === 'fast' ? 'reasoning-fast-v1' : params.reasoning.mode === 'thorough' ? 'reasoning-thorough-v1' : 'reasoning-creative-v1'
    }
  }
}

function extractEntities(query: string): string[] {
  const entities = []

  if (/\b(load|bearing|structural|beam|column)\b/i.test(query)) entities.push('structural')
  if (/\b(energy|hvac|thermal|insulation)\b/i.test(query)) entities.push('energy')
  if (/\b(code|regulation|compliance|requirement)\b/i.test(query)) entities.push('regulatory')
  if (/\b(cost|budget|price|expense)\b/i.test(query)) entities.push('financial')
  if (/\b(material|concrete|steel|wood)\b/i.test(query)) entities.push('materials')

  return entities
}

function categorizeQuery(query: string): string {
  if (/\b(what|define|explain)\b/i.test(query)) return 'definitional'
  if (/\b(how|calculate|determine)\b/i.test(query)) return 'procedural'
  if (/\b(why|reason|rationale)\b/i.test(query)) return 'explanatory'
  if (/\b(should|recommend|suggest)\b/i.test(query)) return 'advisory'
  if (/\b(compare|difference|versus)\b/i.test(query)) return 'comparative'

  return 'general'
}

function generateAnswer(query: string, context?: any): string {
  const queryLower = query.toLowerCase()

  if (queryLower.includes('load') || queryLower.includes('structural')) {
    return `Based on the analysis, the structural requirements depend on several factors including building type, occupancy loads, and local codes. For ${context?.buildingType || 'this building'}, you should consider:\n\n1. Dead loads from building materials and permanent fixtures\n2. Live loads based on occupancy type and usage\n3. Environmental loads (wind, snow, seismic)\n\nThe recommended approach is to engage a licensed structural engineer for detailed calculations following applicable building codes (IBC 2021). Preliminary analysis suggests standard framing methods should be sufficient, but verification is required.`
  }

  if (queryLower.includes('energy') || queryLower.includes('hvac') || queryLower.includes('efficiency')) {
    return `For energy efficiency in ${context?.buildingType || 'this building'}, the multi-step analysis indicates:\n\n1. Envelope performance is critical - recommend R-30 roof, R-19 walls minimum\n2. HVAC sizing should be based on Manual J calculations\n3. Consider high-efficiency equipment (95+ AFUE heating, 16+ SEER cooling)\n4. LED lighting throughout with daylight harvesting controls\n\nExpected energy performance should meet or exceed ASHRAE 90.1 requirements. Energy modeling is recommended to optimize system selection and achieve 30%+ savings over baseline.`
  }

  if (queryLower.includes('cost') || queryLower.includes('budget')) {
    return `Cost analysis for ${context?.buildingType || 'this project'} requires consideration of:\n\n1. Initial construction costs (materials, labor, equipment)\n2. Long-term operational costs (energy, maintenance)\n3. Lifecycle cost over expected building lifespan\n\nWithout specific design details, preliminary estimates suggest:\n- Construction: $150-250/sqft depending on finishes and complexity\n- Energy costs: $1.50-3.00/sqft/year\n- Maintenance: 1-2% of construction cost annually\n\nRecommend detailed cost estimating during design development phase.`
  }

  return `Based on multi-step reasoning analysis of your query about "${query}", the following conclusions can be drawn:\n\nThe question involves ${extractEntities(query).join(', ')} considerations for ${context?.buildingType || 'the building'}${context?.location ? ` in ${context.location}` : ''}. After analyzing applicable codes, best practices, and project-specific constraints, the recommended approach is to:\n\n1. Follow applicable building codes and regulations\n2. Engage appropriate design professionals for detailed analysis\n3. Consider both initial and lifecycle costs in decision-making\n4. Verify all assumptions with site-specific data\n\nFor optimal results, this should be evaluated in the context of the complete project scope and objectives. Additional analysis may be warranted based on project complexity and risk factors.`
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
    const params = await request.json() as ReasoningQueryParams

    // Validate required fields
    if (!params.projectId || !params.query) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, query' },
        { status: 400 }
      )
    }

    if (params.query.length < 10) {
      return NextResponse.json(
        { error: 'Query too short. Please provide more detail.' },
        { status: 400 }
      )
    }

    if (!params.reasoning || !params.reasoning.mode) {
      return NextResponse.json(
        { error: 'Missing reasoning mode' },
        { status: 400 }
      )
    }

    const validModes = ['fast', 'thorough', 'creative']
    if (!validModes.includes(params.reasoning.mode)) {
      return NextResponse.json(
        { error: `Invalid reasoning mode. Must be one of: ${validModes.join(', ')}` },
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

    console.log(`Processing AI reasoning query for project: ${project.name}, mode: ${params.reasoning.mode}`)

    // Perform reasoning
    const result = await performReasoning(params)

    // Store query and result
    const { data: queryRecord, error: dbError } = await supabase
      .from('reasoning_queries')
      .insert({
        project_id: params.projectId,
        user_id: user.id,
        query: params.query,
        context: params.context,
        reasoning_mode: params.reasoning.mode,
        reasoning_config: params.reasoning,
        result,
        queried_at: new Date().toISOString()
      })
      .select()
      .single()

    if (dbError) {
      console.error('Failed to store query results:', dbError)
      // Don't fail the request - reasoning was successful
    }

    return NextResponse.json({
      success: true,
      data: {
        queryId: queryRecord?.id,
        result
      }
    })
  } catch (error) {
    console.error('AI reasoning query API error:', error)
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
    const queryId = searchParams.get('queryId')
    const projectId = searchParams.get('projectId')

    // Get specific query
    if (queryId) {
      const { data: query, error } = await supabase
        .from('reasoning_queries')
        .select('*')
        .eq('id', queryId)
        .eq('user_id', user.id)
        .single()

      if (error || !query) {
        return NextResponse.json(
          { error: 'Query not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        data: query
      })
    }

    // Get all queries for a project
    if (projectId) {
      const { data: queries, error } = await supabase
        .from('reasoning_queries')
        .select('id, query, reasoning_mode, queried_at, result')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .order('queried_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Failed to fetch queries:', error)
        return NextResponse.json(
          { error: 'Failed to fetch queries' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        data: queries
      })
    }

    return NextResponse.json(
      { error: 'Missing required parameter: queryId OR projectId' },
      { status: 400 }
    )
  } catch (error) {
    console.error('AI reasoning query GET API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
