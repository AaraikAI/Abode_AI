/**
 * Video Session Join API
 *
 * Handles joining video sessions and retrieving join information
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { VideoCollaborationService } from '@/lib/services/video-collaboration'

const videoService = new VideoCollaborationService()

/**
 * POST: Join a video session
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { sessionId } = params

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }

    const body = await request.json()
    const { userName, video = true, audio = true } = body

    // Get user profile for username
    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single()

    const displayName = userName || profile?.username || user.email || 'User'

    // Verify session exists in database
    const { data: sessionData, error: sessionError } = await supabase
      .from('video_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (sessionError || !sessionData) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Verify user has access to the project
    const { data: projectAccess } = await supabase
      .from('projects')
      .select('id, org_id')
      .eq('id', sessionData.project_id)
      .single()

    if (!projectAccess) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Check organization membership
    const { data: membership } = await supabase
      .from('organization_members')
      .select('*')
      .eq('organization_id', projectAccess.org_id)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Join the session through video service
    const config = await videoService.joinSession(sessionId, user.id, displayName)

    // Update participant settings if provided
    if (video !== undefined) {
      await videoService.toggleVideo(sessionId, user.id, video)
    }

    if (audio !== undefined) {
      await videoService.toggleAudio(sessionId, user.id, audio)
    }

    // Record participant join in database
    await supabase.from('video_participants').insert({
      session_id: sessionId,
      user_id: user.id,
      user_name: displayName,
      video_enabled: video,
      audio_enabled: audio,
      joined_at: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      config,
      participant: {
        userId: user.id,
        userName: displayName,
        video,
        audio
      }
    })
  } catch (error: any) {
    console.error('Error joining video session:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * GET: Get session join information
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { sessionId } = params

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }

    // Get session information
    const { data: sessionData, error: sessionError } = await supabase
      .from('video_sessions')
      .select('*, projects(id, name, org_id)')
      .eq('id', sessionId)
      .single()

    if (sessionError || !sessionData) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Verify user has access to the project
    const { data: membership } = await supabase
      .from('organization_members')
      .select('*')
      .eq('organization_id', sessionData.projects.org_id)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get current participants
    const { data: participants } = await supabase
      .from('video_participants')
      .select('user_id, user_name, video_enabled, audio_enabled, joined_at')
      .eq('session_id', sessionId)
      .is('left_at', null)

    // Get host information
    const { data: hostProfile } = await supabase
      .from('profiles')
      .select('username, full_name')
      .eq('id', sessionData.host_id)
      .single()

    return NextResponse.json({
      success: true,
      session: {
        id: sessionData.id,
        projectId: sessionData.project_id,
        projectName: sessionData.projects?.name,
        hostId: sessionData.host_id,
        hostName: hostProfile?.full_name || hostProfile?.username || 'Host',
        status: sessionData.status,
        recording: sessionData.recording,
        participantCount: participants?.length || 0,
        createdAt: sessionData.created_at
      },
      participants: participants || [],
      canJoin: sessionData.status === 'waiting' || sessionData.status === 'active'
    })
  } catch (error: any) {
    console.error('Error getting session join info:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
