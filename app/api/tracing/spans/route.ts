/**
 * Distributed Tracing Spans API Endpoint
 *
 * Get distributed trace spans and submit trace data
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface TraceSpan {
  spanId: string
  traceId: string
  parentSpanId?: string
  name: string
  service: string
  operation: string
  startTime: number // Unix timestamp in microseconds
  duration: number // Duration in microseconds
  status: 'ok' | 'error' | 'unset'
  tags?: Record<string, string | number | boolean>
  logs?: Array<{
    timestamp: number
    fields: Record<string, any>
  }>
  error?: {
    message: string
    stack?: string
    type?: string
  }
}

interface SubmitTraceRequest {
  spans: TraceSpan[]
  projectId?: string
}

interface GetSpansRequest {
  traceId?: string
  service?: string
  operation?: string
  startTime?: number
  endTime?: number
  limit?: number
  minDuration?: number
  maxDuration?: number
  status?: 'ok' | 'error' | 'unset'
}

/**
 * Build trace tree from spans
 */
function buildTraceTree(spans: TraceSpan[]): any[] {
  const spanMap = new Map<string, any>()
  const rootSpans: any[] = []

  // Create map of all spans
  spans.forEach(span => {
    spanMap.set(span.spanId, { ...span, children: [] })
  })

  // Build tree structure
  spans.forEach(span => {
    const spanNode = spanMap.get(span.spanId)!
    if (span.parentSpanId) {
      const parent = spanMap.get(span.parentSpanId)
      if (parent) {
        parent.children.push(spanNode)
      } else {
        rootSpans.push(spanNode)
      }
    } else {
      rootSpans.push(spanNode)
    }
  })

  return rootSpans
}

/**
 * Calculate trace statistics
 */
function calculateTraceStats(spans: TraceSpan[]): {
  totalDuration: number
  spanCount: number
  errorCount: number
  services: string[]
  criticalPath: number
} {
  const totalDuration = Math.max(...spans.map(s => s.startTime + s.duration)) -
                        Math.min(...spans.map(s => s.startTime))
  const spanCount = spans.length
  const errorCount = spans.filter(s => s.status === 'error').length
  const services = [...new Set(spans.map(s => s.service))]

  // Calculate critical path (longest path through the trace)
  const tree = buildTraceTree(spans)
  const criticalPath = calculateCriticalPath(tree)

  return {
    totalDuration,
    spanCount,
    errorCount,
    services,
    criticalPath
  }
}

function calculateCriticalPath(nodes: any[]): number {
  if (nodes.length === 0) return 0

  return Math.max(...nodes.map(node => {
    const childPath = calculateCriticalPath(node.children)
    return node.duration + childPath
  }))
}

/**
 * POST - Submit trace data
 */
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
    const traceRequest = await request.json() as SubmitTraceRequest

    // Validate request
    if (!traceRequest.spans || traceRequest.spans.length === 0) {
      return NextResponse.json(
        { error: 'At least one span must be provided' },
        { status: 400 }
      )
    }

    // Validate span data
    for (const span of traceRequest.spans) {
      if (!span.spanId || !span.traceId || !span.name || !span.service) {
        return NextResponse.json(
          { error: 'Invalid span data: spanId, traceId, name, and service are required' },
          { status: 400 }
        )
      }
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

    const orgId = membership.organization_id

    // If projectId is provided, verify access
    if (traceRequest.projectId) {
      const { data: project } = await supabase
        .from('projects')
        .select('id')
        .eq('id', traceRequest.projectId)
        .eq('org_id', orgId)
        .single()

      if (!project) {
        return NextResponse.json(
          { error: 'Project not found or access denied' },
          { status: 404 }
        )
      }
    }

    // Group spans by traceId
    const traceIds = new Set(traceRequest.spans.map(s => s.traceId))

    // Store spans
    const spanRecords = traceRequest.spans.map(span => ({
      span_id: span.spanId,
      trace_id: span.traceId,
      parent_span_id: span.parentSpanId,
      name: span.name,
      service: span.service,
      operation: span.operation,
      start_time: span.startTime,
      duration: span.duration,
      status: span.status,
      tags: span.tags || {},
      logs: span.logs || [],
      error: span.error,
      org_id: orgId,
      user_id: user.id,
      project_id: traceRequest.projectId
    }))

    const { error: spanError } = await supabase
      .from('trace_spans')
      .insert(spanRecords)

    if (spanError) {
      console.error('Failed to store spans:', spanError)
      return NextResponse.json(
        { error: 'Failed to store trace spans' },
        { status: 500 }
      )
    }

    // Update or create trace records
    for (const traceId of traceIds) {
      const traceSpans = traceRequest.spans.filter(s => s.traceId === traceId)
      const stats = calculateTraceStats(traceSpans)

      await supabase
        .from('traces')
        .upsert({
          trace_id: traceId,
          org_id: orgId,
          project_id: traceRequest.projectId,
          total_duration: stats.totalDuration,
          span_count: stats.spanCount,
          error_count: stats.errorCount,
          services: stats.services,
          critical_path_duration: stats.criticalPath,
          start_time: Math.min(...traceSpans.map(s => s.startTime)),
          end_time: Math.max(...traceSpans.map(s => s.startTime + s.duration))
        })
    }

    return NextResponse.json({
      success: true,
      spansReceived: traceRequest.spans.length,
      traceIds: Array.from(traceIds)
    }, { status: 201 })
  } catch (error) {
    console.error('Trace submit API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET - Get distributed trace spans
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
    const traceId = searchParams.get('traceId')
    const service = searchParams.get('service')
    const operation = searchParams.get('operation')
    const startTime = searchParams.get('startTime')
    const endTime = searchParams.get('endTime')
    const limit = parseInt(searchParams.get('limit') || '100')
    const minDuration = searchParams.get('minDuration')
    const maxDuration = searchParams.get('maxDuration')
    const status = searchParams.get('status') as 'ok' | 'error' | 'unset' | null

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

    const orgId = membership.organization_id

    // Build query
    let query = supabase
      .from('trace_spans')
      .select('*')
      .eq('org_id', orgId)
      .order('start_time', { ascending: false })
      .limit(limit)

    // Apply filters
    if (traceId) {
      query = query.eq('trace_id', traceId)
    }

    if (service) {
      query = query.eq('service', service)
    }

    if (operation) {
      query = query.eq('operation', operation)
    }

    if (startTime) {
      query = query.gte('start_time', parseInt(startTime))
    }

    if (endTime) {
      query = query.lte('start_time', parseInt(endTime))
    }

    if (minDuration) {
      query = query.gte('duration', parseInt(minDuration))
    }

    if (maxDuration) {
      query = query.lte('duration', parseInt(maxDuration))
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data: spans, error } = await query

    if (error) {
      console.error('Failed to fetch spans:', error)
      return NextResponse.json(
        { error: 'Failed to fetch trace spans' },
        { status: 500 }
      )
    }

    // Format response
    const formattedSpans: TraceSpan[] = (spans || []).map(span => ({
      spanId: span.span_id,
      traceId: span.trace_id,
      parentSpanId: span.parent_span_id,
      name: span.name,
      service: span.service,
      operation: span.operation,
      startTime: span.start_time,
      duration: span.duration,
      status: span.status,
      tags: span.tags,
      logs: span.logs,
      error: span.error
    }))

    // If traceId is specified, build trace tree
    let trace = null
    if (traceId && formattedSpans.length > 0) {
      const stats = calculateTraceStats(formattedSpans)
      trace = {
        traceId,
        stats,
        tree: buildTraceTree(formattedSpans)
      }
    }

    return NextResponse.json({
      spans: formattedSpans,
      count: formattedSpans.length,
      trace
    })
  } catch (error) {
    console.error('Trace spans GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
