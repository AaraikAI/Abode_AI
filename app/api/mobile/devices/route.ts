/**
 * Mobile Devices API
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
    const { action } = body

    if (action === 'register') {
      const device = await mobileService.registerDevice({
        userId: user.id,
        platform: body.platform,
        deviceToken: body.deviceToken,
        appVersion: body.appVersion,
        osVersion: body.osVersion,
        model: body.model
      })

      await supabase.from('mobile_devices').insert({
        id: device.id,
        user_id: user.id,
        platform: device.platform,
        device_token: device.deviceToken,
        app_version: device.appVersion,
        os_version: device.osVersion,
        model: device.model,
        push_enabled: device.pushEnabled,
        biometric_enabled: device.biometricEnabled
      })

      return NextResponse.json({ success: true, device })
    } else if (action === 'push') {
      const result = await mobileService.sendPushNotification({
        userId: user.id,
        title: body.title,
        body: body.body,
        data: body.data,
        priority: body.priority
      })

      return NextResponse.json({ success: true, result })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
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

    const devices = await mobileService.getUserDevices(user.id)
    const analytics = await mobileService.getDeviceAnalytics(user.id)

    return NextResponse.json({ success: true, devices, analytics })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
