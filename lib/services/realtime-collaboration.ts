/**
 * Real-Time Collaboration Service
 *
 * Enables real-time collaboration features including:
 * - Cursor presence
 * - Live editing
 * - Comments and annotations
 * - Community voting
 * - Shared sessions
 */

import { EventEmitter } from 'events'

export interface CollaborationUser {
  id: string
  name: string
  email: string
  avatar?: string
  color: string // Hex color for cursor/presence
  role: 'owner' | 'editor' | 'viewer'
}

export interface CursorPosition {
  x: number
  y: number
  viewport?: string // Which view/canvas (e.g., '2d', '3d', 'plan')
}

export interface UserPresence {
  userId: string
  user: CollaborationUser
  cursor?: CursorPosition
  selection?: string[] // Selected object IDs
  viewingArea?: {
    viewport: string
    zoom: number
    center: { x: number; y: number }
  }
  status: 'active' | 'idle' | 'away'
  lastActivity: Date
}

export interface CollaborationEdit {
  id: string
  userId: string
  userName: string
  timestamp: Date
  type: 'create' | 'update' | 'delete' | 'move' | 'transform'
  target: string // Object ID or path
  before?: any // State before edit
  after?: any // State after edit
  metadata?: Record<string, any>
}

export interface Comment {
  id: string
  projectId: string
  userId: string
  userName: string
  userAvatar?: string
  content: string
  position?: {
    type: '2d' | '3d'
    coordinates: [number, number] | [number, number, number]
    viewport?: string
  }
  attachedTo?: string // Object ID
  thread?: Comment[] // Replies
  reactions?: Record<string, string[]> // emoji => user IDs
  status: 'open' | 'resolved' | 'archived'
  createdAt: Date
  updatedAt: Date
  resolvedAt?: Date
  resolvedBy?: string
}

export interface CollaborationSession {
  id: string
  projectId: string
  name: string
  owner: CollaborationUser
  participants: Map<string, UserPresence>
  activeEdits: CollaborationEdit[]
  comments: Comment[]
  settings: {
    allowAnonymous: boolean
    maxParticipants: number
    editPermissions: 'owner' | 'editors' | 'all'
  }
  createdAt: Date
  expiresAt?: Date
}

export interface VoteItem {
  id: string
  projectId: string
  type: 'design' | 'feature' | 'material' | 'layout'
  title: string
  description?: string
  options: Array<{
    id: string
    label: string
    description?: string
    imageUrl?: string
    votes: string[] // User IDs
  }>
  createdBy: string
  status: 'active' | 'closed'
  createdAt: Date
  closedAt?: Date
}

export interface OperationalTransform {
  operation: 'insert' | 'delete' | 'retain' | 'update'
  path: string[] // Path to the property being modified
  value?: any
  index?: number
  length?: number
}

export class RealtimeCollaborationService extends EventEmitter {
  private sessions: Map<string, CollaborationSession> = new Map()
  private socketConnections: Map<string, any> = new Map() // userId => socket
  private operationQueue: Map<string, OperationalTransform[]> = new Map() // sessionId => operations

  constructor() {
    super()
  }

  /**
   * Create a new collaboration session
   */
  createSession(
    projectId: string,
    owner: CollaborationUser,
    settings?: Partial<CollaborationSession['settings']>
  ): CollaborationSession {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const session: CollaborationSession = {
      id: sessionId,
      projectId,
      name: `Collaboration on ${projectId}`,
      owner,
      participants: new Map(),
      activeEdits: [],
      comments: [],
      settings: {
        allowAnonymous: false,
        maxParticipants: 20,
        editPermissions: 'editors',
        ...settings
      },
      createdAt: new Date()
    }

    // Add owner as first participant
    this.joinSession(sessionId, owner)

    this.sessions.set(sessionId, session)
    this.operationQueue.set(sessionId, [])

    this.emit('session-created', { sessionId, projectId })

    return session
  }

  /**
   * Join a collaboration session
   */
  joinSession(sessionId: string, user: CollaborationUser): boolean {
    const session = this.sessions.get(sessionId)
    if (!session) {
      throw new Error('Session not found')
    }

    // Check max participants
    if (session.participants.size >= session.settings.maxParticipants) {
      throw new Error('Session is full')
    }

    // Add user presence
    const presence: UserPresence = {
      userId: user.id,
      user,
      status: 'active',
      lastActivity: new Date()
    }

    session.participants.set(user.id, presence)

    // Notify other participants
    this.broadcastToSession(sessionId, 'user-joined', {
      user: presence
    }, user.id)

    this.emit('user-joined', { sessionId, userId: user.id })

    return true
  }

  /**
   * Leave a collaboration session
   */
  leaveSession(sessionId: string, userId: string): void {
    const session = this.sessions.get(sessionId)
    if (!session) {
      return
    }

    session.participants.delete(userId)

    // Notify other participants
    this.broadcastToSession(sessionId, 'user-left', { userId })

    // Clean up session if empty
    if (session.participants.size === 0) {
      this.sessions.delete(sessionId)
      this.operationQueue.delete(sessionId)
      this.emit('session-ended', { sessionId })
    }

    this.emit('user-left', { sessionId, userId })
  }

  /**
   * Update user cursor position
   */
  updateCursor(
    sessionId: string,
    userId: string,
    position: CursorPosition
  ): void {
    const session = this.sessions.get(sessionId)
    if (!session) {
      return
    }

    const presence = session.participants.get(userId)
    if (!presence) {
      return
    }

    presence.cursor = position
    presence.lastActivity = new Date()

    // Broadcast cursor update (throttled in production)
    this.broadcastToSession(sessionId, 'cursor-moved', {
      userId,
      position
    }, userId)
  }

  /**
   * Update user selection
   */
  updateSelection(
    sessionId: string,
    userId: string,
    selection: string[]
  ): void {
    const session = this.sessions.get(sessionId)
    if (!session) {
      return
    }

    const presence = session.participants.get(userId)
    if (!presence) {
      return
    }

    presence.selection = selection
    presence.lastActivity = new Date()

    // Broadcast selection update
    this.broadcastToSession(sessionId, 'selection-changed', {
      userId,
      selection
    }, userId)
  }

  /**
   * Apply edit with operational transformation
   */
  applyEdit(
    sessionId: string,
    userId: string,
    edit: Omit<CollaborationEdit, 'id' | 'timestamp'>
  ): void {
    const session = this.sessions.get(sessionId)
    if (!session) {
      throw new Error('Session not found')
    }

    // Check edit permissions
    const presence = session.participants.get(userId)
    if (!presence) {
      throw new Error('User not in session')
    }

    if (!this.canUserEdit(session, presence.user)) {
      throw new Error('User does not have edit permissions')
    }

    // Create full edit object
    const fullEdit: CollaborationEdit = {
      id: `edit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ...edit
    }

    // Apply operational transform if there are concurrent edits
    const transformedEdit = this.transformEdit(sessionId, fullEdit)

    // Add to session history
    session.activeEdits.push(transformedEdit)

    // Keep only recent edits (last 100)
    if (session.activeEdits.length > 100) {
      session.activeEdits = session.activeEdits.slice(-100)
    }

    // Broadcast edit to all participants
    this.broadcastToSession(sessionId, 'edit-applied', {
      edit: transformedEdit
    }, userId)

    this.emit('edit-applied', { sessionId, edit: transformedEdit })
  }

  /**
   * Check if user can edit
   */
  private canUserEdit(session: CollaborationSession, user: CollaborationUser): boolean {
    if (session.settings.editPermissions === 'owner') {
      return user.id === session.owner.id
    } else if (session.settings.editPermissions === 'editors') {
      return user.role === 'owner' || user.role === 'editor'
    } else {
      // 'all'
      return true
    }
  }

  /**
   * Transform edit using operational transformation (OT)
   */
  private transformEdit(sessionId: string, edit: CollaborationEdit): CollaborationEdit {
    const queue = this.operationQueue.get(sessionId) || []

    // Simplified OT - production would use a proper OT library
    // This handles concurrent edits to prevent conflicts

    // For now, return edit unchanged
    // In production, transform against queued operations
    return edit
  }

  /**
   * Add comment
   */
  addComment(
    sessionId: string,
    userId: string,
    comment: Omit<Comment, 'id' | 'createdAt' | 'updatedAt'>
  ): Comment {
    const session = this.sessions.get(sessionId)
    if (!session) {
      throw new Error('Session not found')
    }

    const fullComment: Comment = {
      id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...comment
    }

    session.comments.push(fullComment)

    // Broadcast comment to all participants
    this.broadcastToSession(sessionId, 'comment-added', {
      comment: fullComment
    })

    this.emit('comment-added', { sessionId, comment: fullComment })

    return fullComment
  }

  /**
   * Reply to comment
   */
  replyToComment(
    sessionId: string,
    commentId: string,
    userId: string,
    content: string,
    userName: string,
    userAvatar?: string
  ): Comment {
    const session = this.sessions.get(sessionId)
    if (!session) {
      throw new Error('Session not found')
    }

    const parentComment = session.comments.find(c => c.id === commentId)
    if (!parentComment) {
      throw new Error('Comment not found')
    }

    const reply: Comment = {
      id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      projectId: session.projectId,
      userId,
      userName,
      userAvatar,
      content,
      status: 'open',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    if (!parentComment.thread) {
      parentComment.thread = []
    }
    parentComment.thread.push(reply)
    parentComment.updatedAt = new Date()

    // Broadcast reply
    this.broadcastToSession(sessionId, 'comment-replied', {
      commentId,
      reply
    })

    this.emit('comment-replied', { sessionId, commentId, reply })

    return reply
  }

  /**
   * Resolve comment
   */
  resolveComment(sessionId: string, commentId: string, userId: string): void {
    const session = this.sessions.get(sessionId)
    if (!session) {
      throw new Error('Session not found')
    }

    const comment = session.comments.find(c => c.id === commentId)
    if (!comment) {
      throw new Error('Comment not found')
    }

    comment.status = 'resolved'
    comment.resolvedAt = new Date()
    comment.resolvedBy = userId
    comment.updatedAt = new Date()

    // Broadcast resolution
    this.broadcastToSession(sessionId, 'comment-resolved', {
      commentId,
      userId
    })

    this.emit('comment-resolved', { sessionId, commentId })
  }

  /**
   * Add reaction to comment
   */
  addReaction(sessionId: string, commentId: string, userId: string, emoji: string): void {
    const session = this.sessions.get(sessionId)
    if (!session) {
      throw new Error('Session not found')
    }

    const comment = session.comments.find(c => c.id === commentId)
    if (!comment) {
      throw new Error('Comment not found')
    }

    if (!comment.reactions) {
      comment.reactions = {}
    }

    if (!comment.reactions[emoji]) {
      comment.reactions[emoji] = []
    }

    if (!comment.reactions[emoji].includes(userId)) {
      comment.reactions[emoji].push(userId)
    }

    comment.updatedAt = new Date()

    // Broadcast reaction
    this.broadcastToSession(sessionId, 'reaction-added', {
      commentId,
      userId,
      emoji
    })
  }

  /**
   * Create vote
   */
  createVote(
    projectId: string,
    userId: string,
    vote: Omit<VoteItem, 'id' | 'createdAt'>
  ): VoteItem {
    const fullVote: VoteItem = {
      id: `vote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      ...vote
    }

    // Store in database (in production)
    console.log('Vote created:', fullVote.id)

    this.emit('vote-created', { projectId, vote: fullVote })

    return fullVote
  }

  /**
   * Cast vote
   */
  castVote(voteId: string, optionId: string, userId: string): void {
    // In production, update database
    console.log(`User ${userId} voted for option ${optionId} in vote ${voteId}`)

    this.emit('vote-cast', { voteId, optionId, userId })
  }

  /**
   * Get session state
   */
  getSession(sessionId: string): CollaborationSession | undefined {
    return this.sessions.get(sessionId)
  }

  /**
   * Get active participants
   */
  getActiveParticipants(sessionId: string): UserPresence[] {
    const session = this.sessions.get(sessionId)
    if (!session) {
      return []
    }

    return Array.from(session.participants.values())
  }

  /**
   * Broadcast event to all participants in session except sender
   */
  private broadcastToSession(
    sessionId: string,
    event: string,
    data: any,
    excludeUserId?: string
  ): void {
    const session = this.sessions.get(sessionId)
    if (!session) {
      return
    }

    session.participants.forEach((presence, userId) => {
      if (userId !== excludeUserId) {
        const socket = this.socketConnections.get(userId)
        if (socket) {
          socket.emit(event, { sessionId, ...data })
        }
      }
    })
  }

  /**
   * Register socket connection
   */
  registerSocket(userId: string, socket: any): void {
    this.socketConnections.set(userId, socket)

    socket.on('disconnect', () => {
      this.socketConnections.delete(userId)
      // Leave all sessions
      this.sessions.forEach((session, sessionId) => {
        if (session.participants.has(userId)) {
          this.leaveSession(sessionId, userId)
        }
      })
    })
  }

  /**
   * Update user status (active/idle/away)
   */
  updateUserStatus(sessionId: string, userId: string, status: UserPresence['status']): void {
    const session = this.sessions.get(sessionId)
    if (!session) {
      return
    }

    const presence = session.participants.get(userId)
    if (!presence) {
      return
    }

    presence.status = status
    presence.lastActivity = new Date()

    // Broadcast status update
    this.broadcastToSession(sessionId, 'status-changed', {
      userId,
      status
    }, userId)
  }

  /**
   * Get session statistics
   */
  getSessionStats(sessionId: string): {
    participants: number
    edits: number
    comments: number
    duration: number // seconds
  } | null {
    const session = this.sessions.get(sessionId)
    if (!session) {
      return null
    }

    const duration = Math.floor((Date.now() - session.createdAt.getTime()) / 1000)

    return {
      participants: session.participants.size,
      edits: session.activeEdits.length,
      comments: session.comments.length,
      duration
    }
  }

  /**
   * Export session history
   */
  exportSessionHistory(sessionId: string): {
    session: CollaborationSession
    edits: CollaborationEdit[]
    comments: Comment[]
  } | null {
    const session = this.sessions.get(sessionId)
    if (!session) {
      return null
    }

    return {
      session,
      edits: session.activeEdits,
      comments: session.comments
    }
  }
}

/**
 * Singleton instance
 */
export const collaborationService = new RealtimeCollaborationService()
