/**
 * Digital Twin API Endpoint
 *
 * Manages digital twin instances and IoT data
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { DigitalTwinManager, DigitalTwinConfig, IoTSensor, SensorReading } from '@/lib/services/digital-twin'

// Singleton manager instance
const digitalTwinManager = new DigitalTwinManager()

export async function GET(
  request: NextRequest,
  { params }: { params: { buildingId: string } }
) {
  try {
    const supabase = createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { buildingId } = params
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action')

    const twin = digitalTwinManager.getDigitalTwin(buildingId)
    if (!twin) {
      return NextResponse.json({ error: 'Digital twin not found' }, { status: 404 })
    }

    if (action === 'state') {
      const state = twin.getState()
      return NextResponse.json({
        success: true,
        state: {
          projectId: state.projectId,
          buildingId: state.buildingId,
          lastUpdate: state.lastUpdate,
          sensorCount: state.sensors.length,
          currentReadings: Array.from(state.currentReadings.values()),
          anomalies: state.anomalies.slice(-10),
          alerts: state.alerts.filter(a => !a.acknowledged).slice(-20)
        }
      })
    } else if (action === 'stats') {
      const sensorId = searchParams.get('sensorId')
      const period = searchParams.get('period') as 'hour' | 'day' | 'week' | 'month' || 'day'

      if (!sensorId) {
        return NextResponse.json({ error: 'Missing sensorId' }, { status: 400 })
      }

      const stats = twin.getSensorStatistics(sensorId, period)
      return NextResponse.json({ success: true, stats })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    console.error('Digital twin GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { buildingId: string } }
) {
  try {
    const supabase = createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { buildingId } = params
    const body = await request.json()
    const { action, data } = body

    if (action === 'create') {
      // Create new digital twin
      const config: DigitalTwinConfig = {
        projectId: data.projectId,
        buildingId,
        updateInterval: data.updateInterval || 60000, // 1 minute
        predictionHorizon: data.predictionHorizon || 24, // 24 hours
        anomalyThreshold: data.anomalyThreshold || 3, // 3 standard deviations
        ...data.config
      }

      const twin = await digitalTwinManager.createDigitalTwin(config)

      // Register sensors if provided
      if (data.sensors && Array.isArray(data.sensors)) {
        twin.registerSensors(data.sensors)
      }

      return NextResponse.json({ success: true, buildingId })
    } else if (action === 'sensor-reading') {
      // Process sensor reading
      const twin = digitalTwinManager.getDigitalTwin(buildingId)
      if (!twin) {
        return NextResponse.json({ error: 'Digital twin not found' }, { status: 404 })
      }

      const reading: SensorReading = {
        sensorId: data.sensorId,
        timestamp: new Date(data.timestamp || Date.now()),
        value: data.value,
        quality: data.quality || 'good',
        metadata: data.metadata
      }

      await twin.processSensorReading(reading)

      return NextResponse.json({ success: true })
    } else if (action === 'register-sensors') {
      const twin = digitalTwinManager.getDigitalTwin(buildingId)
      if (!twin) {
        return NextResponse.json({ error: 'Digital twin not found' }, { status: 404 })
      }

      const sensors: IoTSensor[] = data.sensors
      twin.registerSensors(sensors)

      return NextResponse.json({ success: true, count: sensors.length })
    } else if (action === 'acknowledge-alert') {
      const twin = digitalTwinManager.getDigitalTwin(buildingId)
      if (!twin) {
        return NextResponse.json({ error: 'Digital twin not found' }, { status: 404 })
      }

      const acknowledged = twin.acknowledgeAlert(data.alertId)
      return NextResponse.json({ success: acknowledged })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    console.error('Digital twin POST error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { buildingId: string } }
) {
  try {
    const supabase = createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { buildingId } = params

    await digitalTwinManager.removeDigitalTwin(buildingId)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Digital twin DELETE error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
