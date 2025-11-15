/**
 * Analytics Reports API
 * Generates and exports analytics reports in multiple formats
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const projectId = searchParams.get('projectId')
    const search = searchParams.get('search')

    let query = supabase
      .from('analytics_reports')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)

    // Apply filters
    if (type) {
      query = query.eq('type', type)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (projectId) {
      query = query.eq('project_id', projectId)
    }

    if (startDate) {
      query = query.gte('created_at', startDate)
    }

    if (endDate) {
      query = query.lte('created_at', endDate)
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // Pagination
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false })

    const { data: reports, count, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      reports: reports || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      description,
      type,
      format = 'pdf',
      projectId,
      dateRange,
      metrics,
      filters,
      schedule
    } = body

    // Validate required fields
    if (!name) {
      return NextResponse.json({ error: 'Report name is required' }, { status: 400 })
    }

    if (!type) {
      return NextResponse.json({ error: 'Report type is required' }, { status: 400 })
    }

    // Validate type
    const validTypes = [
      'project-summary',
      'energy-usage',
      'cost-analysis',
      'performance',
      'compliance',
      'sustainability',
      'custom'
    ]
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate format
    const validFormats = ['pdf', 'csv', 'excel', 'json']
    if (!validFormats.includes(format)) {
      return NextResponse.json(
        { error: `Invalid format. Must be one of: ${validFormats.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate date range if provided
    if (dateRange) {
      if (!dateRange.start || !dateRange.end) {
        return NextResponse.json(
          { error: 'Date range must include start and end dates' },
          { status: 400 }
        )
      }

      const start = new Date(dateRange.start)
      const end = new Date(dateRange.end)

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return NextResponse.json(
          { error: 'Invalid date range format' },
          { status: 400 }
        )
      }

      if (start > end) {
        return NextResponse.json(
          { error: 'Start date must be before end date' },
          { status: 400 }
        )
      }
    }

    // Validate metrics if provided
    if (metrics && !Array.isArray(metrics)) {
      return NextResponse.json({ error: 'Metrics must be an array' }, { status: 400 })
    }

    // Validate schedule if provided
    if (schedule) {
      const validFrequencies = ['daily', 'weekly', 'monthly', 'quarterly']
      if (!validFrequencies.includes(schedule.frequency)) {
        return NextResponse.json(
          { error: `Invalid schedule frequency. Must be one of: ${validFrequencies.join(', ')}` },
          { status: 400 }
        )
      }
    }

    // Create report record
    const reportData = {
      user_id: user.id,
      project_id: projectId || null,
      name,
      description: description || null,
      type,
      format,
      date_range: dateRange || null,
      metrics: metrics || [],
      filters: filters || {},
      schedule: schedule || null,
      status: 'generating',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: report, error } = await supabase
      .from('analytics_reports')
      .insert(reportData)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Simulate report generation (in a real app, this would trigger a background job)
    // For now, we'll just return the created report
    setTimeout(async () => {
      await supabase
        .from('analytics_reports')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          file_url: `/reports/${report.id}.${format}`,
          file_size: Math.floor(Math.random() * 1000000) + 100000 // Random size between 100KB - 1MB
        })
        .eq('id', report.id)
    }, 1000)

    return NextResponse.json({
      success: true,
      report: {
        ...report,
        estimatedCompletionTime: 10 // seconds
      }
    }, { status: 201 })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
