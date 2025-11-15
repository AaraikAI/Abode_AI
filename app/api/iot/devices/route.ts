/**
 * IoT Devices API
 *
 * Manages IoT device registration, configuration, and lifecycle
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export interface IoTDevice {
  id: string
  name: string
  type: 'sensor' | 'actuator' | 'gateway' | 'controller'
  status: 'online' | 'offline' | 'maintenance' | 'error'
  manufacturer?: string
  model?: string
  firmwareVersion?: string
  location?: {
    buildingId?: string
    floor?: number
    room?: string
    position?: [number, number, number]
  }
  capabilities?: string[]
  settings?: Record<string, any>
  lastSeen?: Date
  metadata?: Record<string, any>
  userId: string
  createdAt: Date
  updatedAt: Date
}

/**
 * GET /api/iot/devices
 * List IoT devices with filtering
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const buildingId = searchParams.get('buildingId')
    const floor = searchParams.get('floor')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    let query = supabase
      .from('iot_devices')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)

    // Apply filters
    if (type) {
      query = query.eq('type', type)
    }
    if (status) {
      query = query.eq('status', status)
    }
    if (buildingId) {
      query = query.eq('location->>buildingId', buildingId)
    }
    if (floor) {
      query = query.eq('location->>floor', parseInt(floor))
    }

    // Apply pagination
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: devices, error, count } = await query

    if (error) {
      console.error('Error fetching devices:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      devices: devices || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error: any) {
    console.error('GET /api/iot/devices error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * POST /api/iot/devices
 * Register new IoT device
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => null)

    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const { name, type, manufacturer, model, firmwareVersion, location, capabilities, settings, metadata } = body

    // Validation
    if (!name || !type) {
      return NextResponse.json({ error: 'Name and type are required' }, { status: 400 })
    }

    const validTypes = ['sensor', 'actuator', 'gateway', 'controller']
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid device type' }, { status: 400 })
    }

    // Create device
    const deviceData = {
      name,
      type,
      status: 'offline', // New devices start as offline until first heartbeat
      manufacturer,
      model,
      firmware_version: firmwareVersion,
      location,
      capabilities,
      settings: settings || {},
      metadata: metadata || {},
      user_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: device, error } = await supabase
      .from('iot_devices')
      .insert(deviceData)
      .select()
      .single()

    if (error) {
      console.error('Error creating device:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, device }, { status: 201 })
  } catch (error: any) {
    console.error('POST /api/iot/devices error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * PUT /api/iot/devices
 * Update device settings
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => null)

    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const { deviceId, name, status, firmwareVersion, location, capabilities, settings, metadata } = body

    if (!deviceId) {
      return NextResponse.json({ error: 'Device ID is required' }, { status: 400 })
    }

    // Check device exists and belongs to user
    const { data: existingDevice, error: fetchError } = await supabase
      .from('iot_devices')
      .select('*')
      .eq('id', deviceId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existingDevice) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 })
    }

    // Validate status if provided
    if (status) {
      const validStatuses = ['online', 'offline', 'maintenance', 'error']
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
      }
    }

    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (name !== undefined) updateData.name = name
    if (status !== undefined) updateData.status = status
    if (firmwareVersion !== undefined) updateData.firmware_version = firmwareVersion
    if (location !== undefined) updateData.location = location
    if (capabilities !== undefined) updateData.capabilities = capabilities
    if (settings !== undefined) updateData.settings = settings
    if (metadata !== undefined) updateData.metadata = metadata

    // Update last_seen if device is coming online
    if (status === 'online') {
      updateData.last_seen = new Date().toISOString()
    }

    const { data: updatedDevice, error: updateError } = await supabase
      .from('iot_devices')
      .update(updateData)
      .eq('id', deviceId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating device:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, device: updatedDevice })
  } catch (error: any) {
    console.error('PUT /api/iot/devices error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * DELETE /api/iot/devices
 * Deregister device
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const deviceId = searchParams.get('deviceId')

    if (!deviceId) {
      return NextResponse.json({ error: 'Device ID is required' }, { status: 400 })
    }

    // Check device exists and belongs to user
    const { data: existingDevice, error: fetchError } = await supabase
      .from('iot_devices')
      .select('*')
      .eq('id', deviceId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existingDevice) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 })
    }

    // Delete device
    const { error: deleteError } = await supabase
      .from('iot_devices')
      .delete()
      .eq('id', deviceId)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Error deleting device:', deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Device deregistered successfully' })
  } catch (error: any) {
    console.error('DELETE /api/iot/devices error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
