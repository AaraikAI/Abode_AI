/**
 * Mobile Push Notifications API
 * Handles sending push notifications to mobile devices
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { MobileAppsService } from '@/lib/services/mobile-apps'

const mobileService = new MobileAppsService()

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      body: messageBody,
      data,
      priority = 'normal',
      targetType = 'user', // 'user', 'device', 'broadcast'
      targetId,
      channel = 'default',
      scheduled,
      badge,
      sound = 'default',
      category
    } = body

    // Validate required fields
    if (!title || !messageBody) {
      return NextResponse.json(
        { error: 'Title and body are required' },
        { status: 400 }
      )
    }

    // Validate priority
    if (!['normal', 'high', 'critical'].includes(priority)) {
      return NextResponse.json(
        { error: 'Invalid priority. Must be: normal, high, or critical' },
        { status: 400 }
      )
    }

    // Validate target type
    if (!['user', 'device', 'broadcast'].includes(targetType)) {
      return NextResponse.json(
        { error: 'Invalid targetType. Must be: user, device, or broadcast' },
        { status: 400 }
      )
    }

    // Require targetId for user and device types
    if ((targetType === 'user' || targetType === 'device') && !targetId) {
      return NextResponse.json(
        { error: 'targetId is required for user and device targets' },
        { status: 400 }
      )
    }

    // Validate channel
    const validChannels = ['default', 'alerts', 'messages', 'updates', 'marketing']
    if (!validChannels.includes(channel)) {
      return NextResponse.json(
        { error: `Invalid channel. Must be one of: ${validChannels.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate scheduled time if provided
    if (scheduled) {
      const scheduledDate = new Date(scheduled)
      if (isNaN(scheduledDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid scheduled time format' },
          { status: 400 }
        )
      }
      if (scheduledDate < new Date()) {
        return NextResponse.json(
          { error: 'Scheduled time must be in the future' },
          { status: 400 }
        )
      }
    }

    // Get target devices based on targetType
    let targetDevices: string[] = []

    if (targetType === 'user') {
      const { data: devices, error } = await supabase
        .from('mobile_devices')
        .select('device_token')
        .eq('user_id', targetId)
        .eq('push_enabled', true)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      targetDevices = devices?.map(d => d.device_token) || []
    } else if (targetType === 'device') {
      const { data: device, error } = await supabase
        .from('mobile_devices')
        .select('device_token, push_enabled')
        .eq('id', targetId)
        .single()

      if (error || !device) {
        return NextResponse.json({ error: 'Device not found' }, { status: 404 })
      }

      if (!device.push_enabled) {
        return NextResponse.json(
          { error: 'Push notifications disabled for this device' },
          { status: 400 }
        )
      }

      targetDevices = [device.device_token]
    } else if (targetType === 'broadcast') {
      const { data: devices, error } = await supabase
        .from('mobile_devices')
        .select('device_token')
        .eq('push_enabled', true)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      targetDevices = devices?.map(d => d.device_token) || []
    }

    if (targetDevices.length === 0) {
      return NextResponse.json(
        { error: 'No eligible devices found for notification' },
        { status: 404 }
      )
    }

    // Send push notification
    const result = await mobileService.sendPushNotification({
      userId: user.id,
      title,
      body: messageBody,
      data,
      priority,
      deviceTokens: targetDevices,
      channel,
      scheduled: scheduled ? new Date(scheduled) : undefined,
      badge,
      sound,
      category
    })

    // Store notification record
    const notificationRecord = {
      user_id: user.id,
      target_type: targetType,
      target_id: targetId,
      title,
      body: messageBody,
      data,
      priority,
      channel,
      scheduled,
      device_count: targetDevices.length,
      sent: !scheduled,
      sent_at: !scheduled ? new Date().toISOString() : null,
      created_at: new Date().toISOString()
    }

    const { data: notification, error: insertError } = await supabase
      .from('push_notifications')
      .insert(notificationRecord)
      .select()
      .single()

    if (insertError) {
      console.error('Failed to store notification record:', insertError)
    }

    return NextResponse.json({
      success: true,
      notification: {
        id: notification?.id || result.notificationId,
        targetDevices: targetDevices.length,
        scheduled: !!scheduled,
        sent: !scheduled
      },
      result
    }, { status: scheduled ? 201 : 200 })

  } catch (error: any) {
    console.error('Push notification error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send push notification' },
      { status: 500 }
    )
  }
}
