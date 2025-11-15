/**
 * Digital Twin by Twin ID API
 *
 * Manages individual digital twin instances with real-time sensor synchronization
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { DigitalTwinManager, SensorReading, IoTSensor } from '@/lib/services/digital-twin'

// Singleton manager instance
const digitalTwinManager = new DigitalTwinManager()

export interface DigitalTwinData {
  id: string
  projectId: string
  name: string
  description?: string
  config: {
    updateInterval: number
    predictionHorizon: number
    anomalyThreshold: number
  }
  sensors: IoTSensor[]
  status: 'active' | 'inactive' | 'error'
  createdAt: Date
  updatedAt: Date
}

/**
 * GET /api/digital-twin/[twinId]
 * Get digital twin state and sensor data
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { twinId: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { twinId } = params
    const searchParams = request.nextUrl.searchParams
    const includeHistory = searchParams.get('includeHistory') === 'true'
    const includePredictions = searchParams.get('includePredictions') === 'true'
    const sensorId = searchParams.get('sensorId')

    // Verify twin belongs to user
    const { data: twinRecord, error: twinError } = await supabase
      .from('digital_twins')
      .select('*')
      .eq('id', twinId)
      .eq('user_id', user.id)
      .single()

    if (twinError || !twinRecord) {
      return NextResponse.json({ error: 'Digital twin not found' }, { status: 404 })
    }

    // Get or create digital twin instance in manager
    let twin = digitalTwinManager.getDigitalTwin(twinId)

    if (!twin) {
      // Twin exists in DB but not in memory - recreate it
      twin = await digitalTwinManager.createDigitalTwin({
        projectId: twinRecord.project_id,
        buildingId: twinId,
        updateInterval: twinRecord.config?.updateInterval || 60000,
        predictionHorizon: twinRecord.config?.predictionHorizon || 24,
        anomalyThreshold: twinRecord.config?.anomalyThreshold || 3
      })

      // Register sensors if any
      if (twinRecord.sensors && Array.isArray(twinRecord.sensors)) {
        twin.registerSensors(twinRecord.sensors)
      }
    }

    const state = twin.getState()

    // Build response based on query parameters
    const response: any = {
      success: true,
      twin: {
        id: twinId,
        projectId: state.projectId,
        buildingId: state.buildingId,
        name: twinRecord.name,
        description: twinRecord.description,
        status: twinRecord.status,
        lastUpdate: state.lastUpdate,
        config: twinRecord.config
      },
      sensors: state.sensors,
      currentReadings: Array.from(state.currentReadings.values()),
      anomalies: state.anomalies.slice(-10), // Last 10 anomalies
      alerts: state.alerts.filter(a => !a.acknowledged).slice(-20) // Last 20 unacknowledged alerts
    }

    // Include historical data if requested
    if (includeHistory) {
      if (sensorId) {
        response.historicalData = {
          sensorId,
          data: state.historicalData.get(sensorId) || []
        }
      } else {
        response.historicalData = Object.fromEntries(state.historicalData)
      }
    }

    // Include predictions if requested
    if (includePredictions) {
      if (sensorId) {
        response.predictions = {
          sensorId,
          data: state.predictions.get(sensorId) || []
        }
      } else {
        response.predictions = Object.fromEntries(state.predictions)
      }
    }

    // Add statistics
    response.statistics = {
      totalSensors: state.sensors.length,
      activeSensors: state.currentReadings.size,
      totalAnomalies: state.anomalies.length,
      activeAlerts: state.alerts.filter(a => !a.acknowledged).length
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('GET /api/digital-twin/[twinId] error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * PUT /api/digital-twin/[twinId]
 * Update digital twin configuration
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { twinId: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { twinId } = params
    const body = await request.json().catch(() => null)

    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    // Verify twin belongs to user
    const { data: existingTwin, error: fetchError } = await supabase
      .from('digital_twins')
      .select('*')
      .eq('id', twinId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existingTwin) {
      return NextResponse.json({ error: 'Digital twin not found' }, { status: 404 })
    }

    const { name, description, config, status } = body

    // Validate status if provided
    if (status) {
      const validStatuses = ['active', 'inactive', 'error']
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
      }
    }

    // Validate config if provided
    if (config) {
      if (config.updateInterval !== undefined && (typeof config.updateInterval !== 'number' || config.updateInterval < 1000)) {
        return NextResponse.json({ error: 'Update interval must be at least 1000ms' }, { status: 400 })
      }
      if (config.predictionHorizon !== undefined && (typeof config.predictionHorizon !== 'number' || config.predictionHorizon < 1)) {
        return NextResponse.json({ error: 'Prediction horizon must be at least 1 hour' }, { status: 400 })
      }
      if (config.anomalyThreshold !== undefined && (typeof config.anomalyThreshold !== 'number' || config.anomalyThreshold < 1)) {
        return NextResponse.json({ error: 'Anomaly threshold must be at least 1 standard deviation' }, { status: 400 })
      }
    }

    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (status !== undefined) updateData.status = status
    if (config !== undefined) {
      updateData.config = {
        ...existingTwin.config,
        ...config
      }
    }

    // Update in database
    const { data: updatedTwin, error: updateError } = await supabase
      .from('digital_twins')
      .update(updateData)
      .eq('id', twinId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating digital twin:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Update in-memory instance if it exists
    const twin = digitalTwinManager.getDigitalTwin(twinId)
    if (twin && config) {
      // Recreate twin with new config
      await digitalTwinManager.removeDigitalTwin(twinId)
      await digitalTwinManager.createDigitalTwin({
        projectId: updatedTwin.project_id,
        buildingId: twinId,
        updateInterval: updatedTwin.config.updateInterval,
        predictionHorizon: updatedTwin.config.predictionHorizon,
        anomalyThreshold: updatedTwin.config.anomalyThreshold
      })
    }

    return NextResponse.json({
      success: true,
      twin: updatedTwin
    })
  } catch (error: any) {
    console.error('PUT /api/digital-twin/[twinId] error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * POST /api/digital-twin/[twinId]
 * Synchronize real-time sensor data
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { twinId: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { twinId } = params
    const body = await request.json().catch(() => null)

    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const { action, data } = body

    // Verify twin belongs to user
    const { data: twinRecord, error: twinError } = await supabase
      .from('digital_twins')
      .select('*')
      .eq('id', twinId)
      .eq('user_id', user.id)
      .single()

    if (twinError || !twinRecord) {
      return NextResponse.json({ error: 'Digital twin not found' }, { status: 404 })
    }

    // Get or create digital twin instance
    let twin = digitalTwinManager.getDigitalTwin(twinId)

    if (!twin) {
      twin = await digitalTwinManager.createDigitalTwin({
        projectId: twinRecord.project_id,
        buildingId: twinId,
        updateInterval: twinRecord.config?.updateInterval || 60000,
        predictionHorizon: twinRecord.config?.predictionHorizon || 24,
        anomalyThreshold: twinRecord.config?.anomalyThreshold || 3
      })

      if (twinRecord.sensors && Array.isArray(twinRecord.sensors)) {
        twin.registerSensors(twinRecord.sensors)
      }
    }

    // Handle different actions
    switch (action) {
      case 'sync-sensor-data': {
        // Synchronize sensor readings
        if (!data.readings || !Array.isArray(data.readings)) {
          return NextResponse.json({ error: 'Readings array is required' }, { status: 400 })
        }

        const results = []
        for (const readingData of data.readings) {
          const reading: SensorReading = {
            sensorId: readingData.sensorId,
            timestamp: new Date(readingData.timestamp || Date.now()),
            value: readingData.value,
            quality: readingData.quality || 'good',
            metadata: readingData.metadata
          }

          await twin.processSensorReading(reading)
          results.push({ sensorId: reading.sensorId, status: 'processed' })
        }

        return NextResponse.json({
          success: true,
          message: `Synchronized ${results.length} sensor readings`,
          results
        })
      }

      case 'register-sensors': {
        // Register new sensors
        if (!data.sensors || !Array.isArray(data.sensors)) {
          return NextResponse.json({ error: 'Sensors array is required' }, { status: 400 })
        }

        twin.registerSensors(data.sensors)

        // Update database
        await supabase
          .from('digital_twins')
          .update({
            sensors: [...(twinRecord.sensors || []), ...data.sensors],
            updated_at: new Date().toISOString()
          })
          .eq('id', twinId)

        return NextResponse.json({
          success: true,
          message: `Registered ${data.sensors.length} sensors`,
          count: data.sensors.length
        })
      }

      case 'acknowledge-alert': {
        // Acknowledge an alert
        if (!data.alertId) {
          return NextResponse.json({ error: 'Alert ID is required' }, { status: 400 })
        }

        const acknowledged = twin.acknowledgeAlert(data.alertId)

        return NextResponse.json({
          success: acknowledged,
          message: acknowledged ? 'Alert acknowledged' : 'Alert not found'
        })
      }

      case 'force-update': {
        // Force immediate update of predictions and anomaly detection
        const state = twin.getState()

        return NextResponse.json({
          success: true,
          message: 'Digital twin updated',
          state: {
            lastUpdate: state.lastUpdate,
            sensorCount: state.sensors.length,
            currentReadings: Array.from(state.currentReadings.values()).length,
            anomalies: state.anomalies.length,
            activeAlerts: state.alerts.filter(a => !a.acknowledged).length
          }
        })
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error: any) {
    console.error('POST /api/digital-twin/[twinId] error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * DELETE /api/digital-twin/[twinId]
 * Remove digital twin instance
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { twinId: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { twinId } = params

    // Verify twin belongs to user
    const { data: existingTwin, error: fetchError } = await supabase
      .from('digital_twins')
      .select('*')
      .eq('id', twinId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existingTwin) {
      return NextResponse.json({ error: 'Digital twin not found' }, { status: 404 })
    }

    // Remove from memory
    await digitalTwinManager.removeDigitalTwin(twinId)

    // Delete from database
    const { error: deleteError } = await supabase
      .from('digital_twins')
      .delete()
      .eq('id', twinId)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Error deleting digital twin:', deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Digital twin removed successfully'
    })
  } catch (error: any) {
    console.error('DELETE /api/digital-twin/[twinId] error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
