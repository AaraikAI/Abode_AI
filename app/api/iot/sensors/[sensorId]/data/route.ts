/**
 * IoT Sensor Data API
 *
 * Manages sensor readings with time-series data and aggregation support
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export interface SensorReading {
  id: string
  sensorId: string
  timestamp: Date
  value: number
  unit: string
  quality: 'good' | 'uncertain' | 'bad'
  metadata?: Record<string, any>
}

export interface AggregatedData {
  period: string
  startTime: Date
  endTime: Date
  count: number
  min: number
  max: number
  avg: number
  sum: number
  stdDev?: number
}

/**
 * GET /api/iot/sensors/[sensorId]/data
 * Get sensor data with time range filtering and aggregation
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { sensorId: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { sensorId } = params
    const searchParams = request.nextUrl.searchParams

    // Time range filters
    const startTime = searchParams.get('startTime')
    const endTime = searchParams.get('endTime')
    const limit = parseInt(searchParams.get('limit') || '1000')
    const aggregate = searchParams.get('aggregate') as 'hourly' | 'daily' | 'weekly' | null
    const quality = searchParams.get('quality')

    // Verify sensor belongs to user
    const { data: sensor, error: sensorError } = await supabase
      .from('iot_devices')
      .select('id')
      .eq('id', sensorId)
      .eq('user_id', user.id)
      .single()

    if (sensorError || !sensor) {
      return NextResponse.json({ error: 'Sensor not found' }, { status: 404 })
    }

    // If aggregation is requested
    if (aggregate) {
      return handleAggregatedData(supabase, sensorId, startTime, endTime, aggregate)
    }

    // Build query for raw data
    let query = supabase
      .from('sensor_readings')
      .select('*')
      .eq('sensor_id', sensorId)
      .order('timestamp', { ascending: false })
      .limit(limit)

    if (startTime) {
      query = query.gte('timestamp', startTime)
    }
    if (endTime) {
      query = query.lte('timestamp', endTime)
    }
    if (quality) {
      query = query.eq('quality', quality)
    }

    const { data: readings, error } = await query

    if (error) {
      console.error('Error fetching sensor data:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Calculate basic statistics
    const values = (readings || []).map(r => r.value)
    const stats = values.length > 0 ? {
      count: values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      latest: readings?.[0]
    } : null

    return NextResponse.json({
      success: true,
      sensorId,
      readings: readings || [],
      stats
    })
  } catch (error: any) {
    console.error('GET /api/iot/sensors/[sensorId]/data error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * Handle aggregated data requests
 */
async function handleAggregatedData(
  supabase: any,
  sensorId: string,
  startTime: string | null,
  endTime: string | null,
  aggregate: 'hourly' | 'daily' | 'weekly'
): Promise<NextResponse> {
  try {
    // Determine the time bucket based on aggregation type
    let timeBucket: string
    switch (aggregate) {
      case 'hourly':
        timeBucket = '1 hour'
        break
      case 'daily':
        timeBucket = '1 day'
        break
      case 'weekly':
        timeBucket = '7 days'
        break
      default:
        return NextResponse.json({ error: 'Invalid aggregate type' }, { status: 400 })
    }

    // Build aggregation query
    let query = supabase
      .from('sensor_readings')
      .select('timestamp, value')
      .eq('sensor_id', sensorId)
      .eq('quality', 'good') // Only aggregate good quality data

    if (startTime) {
      query = query.gte('timestamp', startTime)
    }
    if (endTime) {
      query = query.lte('timestamp', endTime)
    }

    const { data: readings, error } = await query.order('timestamp', { ascending: true })

    if (error) {
      console.error('Error fetching data for aggregation:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!readings || readings.length === 0) {
      return NextResponse.json({
        success: true,
        sensorId,
        aggregate,
        data: []
      })
    }

    // Perform aggregation in memory
    const aggregatedData = aggregateReadings(readings, aggregate)

    return NextResponse.json({
      success: true,
      sensorId,
      aggregate,
      data: aggregatedData,
      summary: {
        totalReadings: readings.length,
        periods: aggregatedData.length,
        timeRange: {
          start: readings[0].timestamp,
          end: readings[readings.length - 1].timestamp
        }
      }
    })
  } catch (error: any) {
    console.error('Aggregation error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * Aggregate readings by time period
 */
function aggregateReadings(
  readings: any[],
  period: 'hourly' | 'daily' | 'weekly'
): AggregatedData[] {
  const buckets = new Map<string, number[]>()

  // Group readings into time buckets
  readings.forEach(reading => {
    const timestamp = new Date(reading.timestamp)
    const bucketKey = getBucketKey(timestamp, period)

    if (!buckets.has(bucketKey)) {
      buckets.set(bucketKey, [])
    }
    buckets.get(bucketKey)!.push(reading.value)
  })

  // Calculate statistics for each bucket
  const result: AggregatedData[] = []
  buckets.forEach((values, bucketKey) => {
    const [startTime, endTime] = parseBucketKey(bucketKey, period)
    const sum = values.reduce((a, b) => a + b, 0)
    const avg = sum / values.length
    const variance = values.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / values.length
    const stdDev = Math.sqrt(variance)

    result.push({
      period: bucketKey,
      startTime,
      endTime,
      count: values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      avg: Math.round(avg * 100) / 100,
      sum: Math.round(sum * 100) / 100,
      stdDev: Math.round(stdDev * 100) / 100
    })
  })

  return result.sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
}

/**
 * Get bucket key for a timestamp
 */
function getBucketKey(date: Date, period: 'hourly' | 'daily' | 'weekly'): string {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  const hour = String(date.getUTCHours()).padStart(2, '0')

  switch (period) {
    case 'hourly':
      return `${year}-${month}-${day}T${hour}:00:00Z`
    case 'daily':
      return `${year}-${month}-${day}T00:00:00Z`
    case 'weekly': {
      // Get Monday of the week
      const dayOfWeek = date.getUTCDay()
      const monday = new Date(date)
      monday.setUTCDate(date.getUTCDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
      const wYear = monday.getUTCFullYear()
      const wMonth = String(monday.getUTCMonth() + 1).padStart(2, '0')
      const wDay = String(monday.getUTCDate()).padStart(2, '0')
      return `${wYear}-${wMonth}-${wDay}T00:00:00Z`
    }
  }
}

/**
 * Parse bucket key to get time range
 */
function parseBucketKey(key: string, period: 'hourly' | 'daily' | 'weekly'): [Date, Date] {
  const startTime = new Date(key)
  const endTime = new Date(startTime)

  switch (period) {
    case 'hourly':
      endTime.setUTCHours(endTime.getUTCHours() + 1)
      break
    case 'daily':
      endTime.setUTCDate(endTime.getUTCDate() + 1)
      break
    case 'weekly':
      endTime.setUTCDate(endTime.getUTCDate() + 7)
      break
  }

  return [startTime, endTime]
}

/**
 * POST /api/iot/sensors/[sensorId]/data
 * Submit new sensor readings
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { sensorId: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { sensorId } = params
    const body = await request.json().catch(() => null)

    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    // Verify sensor belongs to user
    const { data: sensor, error: sensorError } = await supabase
      .from('iot_devices')
      .select('id, type, settings')
      .eq('id', sensorId)
      .eq('user_id', user.id)
      .single()

    if (sensorError || !sensor) {
      return NextResponse.json({ error: 'Sensor not found' }, { status: 404 })
    }

    // Support both single reading and batch readings
    const readings = Array.isArray(body.readings) ? body.readings : [body]

    // Validate readings
    for (const reading of readings) {
      if (reading.value === undefined || reading.value === null) {
        return NextResponse.json({ error: 'Value is required for all readings' }, { status: 400 })
      }

      const validQualities = ['good', 'uncertain', 'bad']
      if (reading.quality && !validQualities.includes(reading.quality)) {
        return NextResponse.json({ error: 'Invalid quality value' }, { status: 400 })
      }
    }

    // Prepare readings for insertion
    const readingsToInsert = readings.map((reading: any) => ({
      sensor_id: sensorId,
      timestamp: reading.timestamp ? new Date(reading.timestamp).toISOString() : new Date().toISOString(),
      value: reading.value,
      unit: reading.unit || sensor.settings?.unit || 'unknown',
      quality: reading.quality || 'good',
      metadata: reading.metadata || {}
    }))

    // Insert readings
    const { data: insertedReadings, error: insertError } = await supabase
      .from('sensor_readings')
      .insert(readingsToInsert)
      .select()

    if (insertError) {
      console.error('Error inserting sensor readings:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // Update device last_seen timestamp
    await supabase
      .from('iot_devices')
      .update({
        last_seen: new Date().toISOString(),
        status: 'online'
      })
      .eq('id', sensorId)

    return NextResponse.json({
      success: true,
      count: insertedReadings?.length || 0,
      readings: insertedReadings
    }, { status: 201 })
  } catch (error: any) {
    console.error('POST /api/iot/sensors/[sensorId]/data error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
