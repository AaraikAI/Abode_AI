/**
 * Video Collaboration Sessions API
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { VideoCollaborationService } from '@/lib/services/video-collaboration'

const videoService = new VideoCollaborationService()

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body

    if (action === 'create') {
      const session = await videoService.createSession(body.projectId, user.id)

      await supabase.from('video_sessions').insert({
        id: session.id,
        project_id: session.projectId,
        host_id: session.hostId,
        status: session.status,
        recording: session.recording,
        created_at: session.createdAt
      })

      return NextResponse.json({ success: true, session })
    } else if (action === 'join') {
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single()

      const config = await videoService.joinSession(
        body.sessionId,
        user.id,
        profile?.username || user.email || 'User'
      )

      return NextResponse.json({ success: true, config })
    } else if (action === 'leave') {
      await videoService.leaveSession(body.sessionId, user.id)
      return NextResponse.json({ success: true })
    } else if (action === 'screen-share') {
      const streamId = await videoService.startScreenShare(body.sessionId, user.id)
      return NextResponse.json({ success: true, streamId })
    } else if (action === 'stop-screen-share') {
      await videoService.stopScreenShare(body.streamId)
      return NextResponse.json({ success: true })
    } else if (action === 'start-recording') {
      await videoService.startRecording(body.sessionId)
      return NextResponse.json({ success: true })
    } else if (action === 'stop-recording') {
      const recordingUrl = await videoService.stopRecording(body.sessionId)
      return NextResponse.json({ success: true, recordingUrl })
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

    const searchParams = request.nextUrl.searchParams
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }

    const transcription = await videoService.getSessionTranscription(sessionId)
    return NextResponse.json({ success: true, transcription })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
