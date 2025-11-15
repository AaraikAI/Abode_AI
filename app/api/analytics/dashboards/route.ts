/**
 * Analytics Dashboards API
 * Manages custom analytics dashboards and visualizations
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
    const category = searchParams.get('category')
    const shared = searchParams.get('shared')
    const search = searchParams.get('search')

    let query = supabase
      .from('analytics_dashboards')
      .select('*', { count: 'exact' })
      .or(`user_id.eq.${user.id},shared.eq.true`)

    // Apply filters
    if (type) {
      query = query.eq('type', type)
    }

    if (category) {
      query = query.eq('category', category)
    }

    if (shared === 'true') {
      query = query.eq('shared', true)
    } else if (shared === 'false') {
      query = query.eq('user_id', user.id)
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // Pagination
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1).order('updated_at', { ascending: false })

    const { data: dashboards, count, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      dashboards: dashboards || [],
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
    const { name, description, type, category, widgets, layout, filters, shared = false } = body

    // Validate required fields
    if (!name) {
      return NextResponse.json({ error: 'Dashboard name is required' }, { status: 400 })
    }

    if (!type) {
      return NextResponse.json({ error: 'Dashboard type is required' }, { status: 400 })
    }

    // Validate type
    const validTypes = ['overview', 'project', 'energy', 'cost', 'custom']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate category
    const validCategories = ['performance', 'analytics', 'monitoring', 'reporting', 'custom']
    if (category && !validCategories.includes(category)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${validCategories.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate widgets
    if (widgets && !Array.isArray(widgets)) {
      return NextResponse.json({ error: 'Widgets must be an array' }, { status: 400 })
    }

    // Validate each widget
    if (widgets) {
      for (const widget of widgets) {
        if (!widget.type || !widget.id) {
          return NextResponse.json(
            { error: 'Each widget must have a type and id' },
            { status: 400 }
          )
        }
      }
    }

    const dashboardData = {
      user_id: user.id,
      name,
      description: description || null,
      type,
      category: category || 'custom',
      widgets: widgets || [],
      layout: layout || {},
      filters: filters || {},
      shared,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: dashboard, error } = await supabase
      .from('analytics_dashboards')
      .insert(dashboardData)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      dashboard
    }, { status: 201 })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { dashboardId, name, description, type, category, widgets, layout, filters, shared } = body

    if (!dashboardId) {
      return NextResponse.json({ error: 'Dashboard ID is required' }, { status: 400 })
    }

    // Verify ownership
    const { data: existing, error: fetchError } = await supabase
      .from('analytics_dashboards')
      .select('*')
      .eq('id', dashboardId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 })
    }

    // Validate type if provided
    if (type) {
      const validTypes = ['overview', 'project', 'energy', 'cost', 'custom']
      if (!validTypes.includes(type)) {
        return NextResponse.json(
          { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
          { status: 400 }
        )
      }
    }

    // Validate category if provided
    if (category) {
      const validCategories = ['performance', 'analytics', 'monitoring', 'reporting', 'custom']
      if (!validCategories.includes(category)) {
        return NextResponse.json(
          { error: `Invalid category. Must be one of: ${validCategories.join(', ')}` },
          { status: 400 }
        )
      }
    }

    // Build update object
    const updates: any = {
      updated_at: new Date().toISOString()
    }

    if (name !== undefined) updates.name = name
    if (description !== undefined) updates.description = description
    if (type !== undefined) updates.type = type
    if (category !== undefined) updates.category = category
    if (widgets !== undefined) updates.widgets = widgets
    if (layout !== undefined) updates.layout = layout
    if (filters !== undefined) updates.filters = filters
    if (shared !== undefined) updates.shared = shared

    const { data: dashboard, error: updateError } = await supabase
      .from('analytics_dashboards')
      .update(updates)
      .eq('id', dashboardId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      dashboard
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const dashboardId = searchParams.get('dashboardId')

    if (!dashboardId) {
      return NextResponse.json({ error: 'Dashboard ID is required' }, { status: 400 })
    }

    // Verify ownership
    const { data: existing, error: fetchError } = await supabase
      .from('analytics_dashboards')
      .select('id')
      .eq('id', dashboardId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 })
    }

    const { error: deleteError } = await supabase
      .from('analytics_dashboards')
      .delete()
      .eq('id', dashboardId)
      .eq('user_id', user.id)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Dashboard deleted successfully'
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
