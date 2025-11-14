/**
 * Video Collaboration Service
 *
 * Features:
 * - WebRTC video calls
 * - Screen sharing
 * - Session recording
 * - Real-time annotations during calls
 * - Meeting transcription
 */

export interface VideoSession {
  id: string
  projectId: string
  hostId: string
  participants: Array<{
    userId: string
    userName: string
    joinedAt: Date
    role: 'host' | 'participant'
    video: boolean
    audio: boolean
    screen: boolean
  }>
  status: 'waiting' | 'active' | 'ended'
  recording: boolean
  recordingUrl?: string
  transcription?: string[]
  startedAt?: Date
  endedAt?: Date
  createdAt: Date
}

export interface WebRTCConfig {
  iceServers: Array<{
    urls: string | string[]
    username?: string
    credential?: string
  }>
}

export interface ScreenShare {
  userId: string
  sessionId: string
  streamId: string
  active: boolean
  startedAt: Date
  endedAt?: Date
}

export class VideoCollaborationService {
  private sessions: Map<string, VideoSession> = new Map()
  private screenShares: Map<string, ScreenShare> = new Map()

  async createSession(projectId: string, hostId: string): Promise<VideoSession> {
    const sessionId = `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const session: VideoSession = {
      id: sessionId,
      projectId,
      hostId,
      participants: [],
      status: 'waiting',
      recording: false,
      createdAt: new Date()
    }

    this.sessions.set(sessionId, session)
    console.log(`Created video session: ${sessionId}`)

    return session
  }

  async joinSession(sessionId: string, userId: string, userName: string): Promise<WebRTCConfig> {
    const session = this.sessions.get(sessionId)
    if (!session) throw new Error('Session not found')

    session.participants.push({
      userId,
      userName,
      joinedAt: new Date(),
      role: userId === session.hostId ? 'host' : 'participant',
      video: true,
      audio: true,
      screen: false
    })

    if (session.status === 'waiting') {
      session.status = 'active'
      session.startedAt = new Date()
    }

    console.log(`${userName} joined session ${sessionId}`)

    // Return WebRTC configuration
    return {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        {
          urls: 'turn:turn.abodeai.com:3478',
          username: 'abodeai',
          credential: 'secret'
        }
      ]
    }
  }

  async leaveSession(sessionId: string, userId: string): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (!session) return

    session.participants = session.participants.filter(p => p.userId !== userId)

    if (session.participants.length === 0) {
      session.status = 'ended'
      session.endedAt = new Date()
      console.log(`Session ${sessionId} ended - no participants`)
    }
  }

  async startScreenShare(sessionId: string, userId: string): Promise<string> {
    const session = this.sessions.get(sessionId)
    if (!session) throw new Error('Session not found')

    const streamId = `stream_${Date.now()}`

    const screenShare: ScreenShare = {
      userId,
      sessionId,
      streamId,
      active: true,
      startedAt: new Date()
    }

    this.screenShares.set(streamId, screenShare)

    // Update participant
    const participant = session.participants.find(p => p.userId === userId)
    if (participant) {
      participant.screen = true
    }

    console.log(`${userId} started screen sharing in ${sessionId}`)

    return streamId
  }

  async stopScreenShare(streamId: string): Promise<void> {
    const screenShare = this.screenShares.get(streamId)
    if (!screenShare) return

    screenShare.active = false
    screenShare.endedAt = new Date()

    const session = this.sessions.get(screenShare.sessionId)
    if (session) {
      const participant = session.participants.find(p => p.userId === screenShare.userId)
      if (participant) {
        participant.screen = false
      }
    }

    console.log(`Screen share ${streamId} stopped`)
  }

  async startRecording(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (!session) throw new Error('Session not found')

    session.recording = true
    console.log(`Started recording session ${sessionId}`)
  }

  async stopRecording(sessionId: string): Promise<string> {
    const session = this.sessions.get(sessionId)
    if (!session) throw new Error('Session not found')

    session.recording = false
    session.recordingUrl = `https://cdn.abodeai.com/recordings/${sessionId}.mp4`

    console.log(`Stopped recording session ${sessionId}`)

    return session.recordingUrl
  }

  async getSessionTranscription(sessionId: string): Promise<string[]> {
    const session = this.sessions.get(sessionId)
    if (!session) throw new Error('Session not found')

    return session.transcription || []
  }

  async addTranscriptionEntry(sessionId: string, userId: string, text: string): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (!session) throw new Error('Session not found')

    if (!session.transcription) {
      session.transcription = []
    }

    const participant = session.participants.find(p => p.userId === userId)
    const userName = participant?.userName || 'Unknown'

    session.transcription.push(`[${new Date().toISOString()}] ${userName}: ${text}`)
  }

  async toggleAudio(sessionId: string, userId: string, enabled: boolean): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (!session) throw new Error('Session not found')

    const participant = session.participants.find(p => p.userId === userId)
    if (participant) {
      participant.audio = enabled
    }
  }

  async toggleVideo(sessionId: string, userId: string, enabled: boolean): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (!session) throw new Error('Session not found')

    const participant = session.participants.find(p => p.userId === userId)
    if (participant) {
      participant.video = enabled
    }
  }
}
