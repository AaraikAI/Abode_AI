/**
 * Collaboration Service Tests
 * Tests real-time collaboration, commenting, version control, and permissions
 */

import { CollaborationService } from '@/lib/services/collaboration'

describe('CollaborationService', () => {
  let service: CollaborationService

  beforeEach(() => {
    service = new CollaborationService()
  })

  describe('Comments', () => {
    test('should create a comment on a project', async () => {
      const comment = await service.createComment({
        projectId: 'project-123',
        userId: 'user-456',
        content: 'This wall should be moved 2 feet to the left',
        position: { x: 10.5, y: 0, z: 5.2 }
      })

      expect(comment).toHaveProperty('id')
      expect(comment.content).toBe('This wall should be moved 2 feet to the left')
      expect(comment.resolved).toBe(false)
      expect(comment.createdAt).toBeDefined()
    })

    test('should support annotations with screenshots', async () => {
      const comment = await service.createComment({
        projectId: 'project-123',
        userId: 'user-456',
        content: 'See attached screenshot',
        attachments: [{
          type: 'image',
          url: 'https://storage.abodeai.com/screenshots/screenshot-1.png'
        }]
      })

      expect(comment.attachments).toHaveLength(1)
      expect(comment.attachments[0].type).toBe('image')
    })

    test('should reply to comments', async () => {
      const parentComment = await service.createComment({
        projectId: 'project-123',
        userId: 'user-456',
        content: 'Original comment'
      })

      const reply = await service.replyToComment({
        commentId: parentComment.id,
        userId: 'user-789',
        content: 'Good point, I will make that change'
      })

      expect(reply.parentId).toBe(parentComment.id)
      expect(reply.threadId).toBe(parentComment.id)
    })

    test('should resolve comments', async () => {
      const comment = await service.createComment({
        projectId: 'project-123',
        userId: 'user-456',
        content: 'Fix this issue'
      })

      await service.resolveComment(comment.id, 'user-456')

      const resolved = await service.getComment(comment.id)
      expect(resolved.resolved).toBe(true)
      expect(resolved.resolvedBy).toBe('user-456')
      expect(resolved.resolvedAt).toBeDefined()
    })

    test('should get all comments for a project', async () => {
      await service.createComment({
        projectId: 'project-123',
        userId: 'user-1',
        content: 'Comment 1'
      })

      await service.createComment({
        projectId: 'project-123',
        userId: 'user-2',
        content: 'Comment 2'
      })

      await service.createComment({
        projectId: 'project-456',
        userId: 'user-3',
        content: 'Comment 3'
      })

      const comments = await service.getProjectComments('project-123')
      expect(comments).toHaveLength(2)
    })

    test('should filter comments by resolved status', async () => {
      const comment1 = await service.createComment({
        projectId: 'project-123',
        userId: 'user-1',
        content: 'Unresolved'
      })

      const comment2 = await service.createComment({
        projectId: 'project-123',
        userId: 'user-2',
        content: 'To be resolved'
      })

      await service.resolveComment(comment2.id, 'user-1')

      const unresolved = await service.getProjectComments('project-123', { resolved: false })
      expect(unresolved).toHaveLength(1)
      expect(unresolved[0].id).toBe(comment1.id)
    })
  })

  describe('Real-time Collaboration', () => {
    test('should track active users in a project', async () => {
      await service.joinProject('project-123', 'user-1', 'Alice')
      await service.joinProject('project-123', 'user-2', 'Bob')

      const activeUsers = await service.getActiveUsers('project-123')
      expect(activeUsers).toHaveLength(2)
      expect(activeUsers.map(u => u.name)).toContain('Alice')
      expect(activeUsers.map(u => u.name)).toContain('Bob')
    })

    test('should remove users when they leave', async () => {
      await service.joinProject('project-123', 'user-1', 'Alice')
      await service.joinProject('project-123', 'user-2', 'Bob')
      await service.leaveProject('project-123', 'user-1')

      const activeUsers = await service.getActiveUsers('project-123')
      expect(activeUsers).toHaveLength(1)
      expect(activeUsers[0].name).toBe('Bob')
    })

    test('should broadcast cursor positions', async () => {
      await service.joinProject('project-123', 'user-1', 'Alice')

      const cursors: any[] = []
      service.onCursorMove('project-123', (data) => {
        cursors.push(data)
      })

      await service.updateCursor('project-123', 'user-1', {
        x: 100,
        y: 200,
        z: 0
      })

      expect(cursors).toHaveLength(1)
      expect(cursors[0].position).toEqual({ x: 100, y: 200, z: 0 })
    })

    test('should broadcast selection changes', async () => {
      await service.joinProject('project-123', 'user-1', 'Alice')

      const selections: any[] = []
      service.onSelectionChange('project-123', (data) => {
        selections.push(data)
      })

      await service.updateSelection('project-123', 'user-1', ['wall-1', 'door-2'])

      expect(selections).toHaveLength(1)
      expect(selections[0].objectIds).toEqual(['wall-1', 'door-2'])
    })

    test('should handle presence awareness', async () => {
      await service.joinProject('project-123', 'user-1', 'Alice')

      const presence = await service.getPresence('project-123', 'user-1')
      expect(presence.status).toBe('active')
      expect(presence.lastSeen).toBeDefined()
    })
  })

  describe('Version Control', () => {
    test('should create a version snapshot', async () => {
      const version = await service.createVersion({
        projectId: 'project-123',
        userId: 'user-456',
        message: 'Added kitchen layout',
        changes: {
          added: ['wall-1', 'door-2'],
          modified: ['floor-1'],
          removed: []
        }
      })

      expect(version).toHaveProperty('id')
      expect(version.message).toBe('Added kitchen layout')
      expect(version.versionNumber).toBe(1)
    })

    test('should increment version numbers', async () => {
      await service.createVersion({
        projectId: 'project-123',
        userId: 'user-456',
        message: 'Version 1'
      })

      const version2 = await service.createVersion({
        projectId: 'project-123',
        userId: 'user-456',
        message: 'Version 2'
      })

      expect(version2.versionNumber).toBe(2)
    })

    test('should get version history', async () => {
      await service.createVersion({
        projectId: 'project-123',
        userId: 'user-1',
        message: 'Initial layout'
      })

      await service.createVersion({
        projectId: 'project-123',
        userId: 'user-2',
        message: 'Added second floor'
      })

      const history = await service.getVersionHistory('project-123')
      expect(history).toHaveLength(2)
      expect(history[0].versionNumber).toBe(2) // Most recent first
      expect(history[1].versionNumber).toBe(1)
    })

    test('should restore to a previous version', async () => {
      const v1 = await service.createVersion({
        projectId: 'project-123',
        userId: 'user-1',
        message: 'Version 1',
        snapshot: { walls: ['wall-1'] }
      })

      await service.createVersion({
        projectId: 'project-123',
        userId: 'user-1',
        message: 'Version 2',
        snapshot: { walls: ['wall-1', 'wall-2'] }
      })

      await service.restoreVersion('project-123', v1.id, 'user-1')

      const current = await service.getCurrentVersion('project-123')
      expect(current.snapshot.walls).toEqual(['wall-1'])
    })

    test('should compare two versions', async () => {
      const v1 = await service.createVersion({
        projectId: 'project-123',
        userId: 'user-1',
        message: 'Version 1',
        snapshot: { walls: ['wall-1'], doors: ['door-1'] }
      })

      const v2 = await service.createVersion({
        projectId: 'project-123',
        userId: 'user-1',
        message: 'Version 2',
        snapshot: { walls: ['wall-1', 'wall-2'], doors: ['door-1'] }
      })

      const diff = await service.compareVersions(v1.id, v2.id)
      expect(diff.added.walls).toEqual(['wall-2'])
      expect(diff.modified).toEqual([])
      expect(diff.removed).toEqual([])
    })
  })

  describe('Permissions and Access Control', () => {
    test('should add collaborator with viewer role', async () => {
      const collab = await service.addCollaborator({
        projectId: 'project-123',
        userId: 'user-456',
        role: 'viewer',
        addedBy: 'owner-123'
      })

      expect(collab.role).toBe('viewer')
      expect(collab.permissions).toEqual({
        canView: true,
        canComment: true,
        canEdit: false,
        canShare: false,
        canDelete: false
      })
    })

    test('should add collaborator with editor role', async () => {
      const collab = await service.addCollaborator({
        projectId: 'project-123',
        userId: 'user-456',
        role: 'editor',
        addedBy: 'owner-123'
      })

      expect(collab.role).toBe('editor')
      expect(collab.permissions.canEdit).toBe(true)
      expect(collab.permissions.canDelete).toBe(false)
    })

    test('should add collaborator with admin role', async () => {
      const collab = await service.addCollaborator({
        projectId: 'project-123',
        userId: 'user-456',
        role: 'admin',
        addedBy: 'owner-123'
      })

      expect(collab.role).toBe('admin')
      expect(collab.permissions.canDelete).toBe(true)
    })

    test('should check if user has permission', async () => {
      await service.addCollaborator({
        projectId: 'project-123',
        userId: 'user-456',
        role: 'viewer',
        addedBy: 'owner-123'
      })

      const canView = await service.checkPermission('project-123', 'user-456', 'canView')
      const canEdit = await service.checkPermission('project-123', 'user-456', 'canEdit')

      expect(canView).toBe(true)
      expect(canEdit).toBe(false)
    })

    test('should remove collaborator', async () => {
      await service.addCollaborator({
        projectId: 'project-123',
        userId: 'user-456',
        role: 'viewer',
        addedBy: 'owner-123'
      })

      await service.removeCollaborator('project-123', 'user-456', 'owner-123')

      const canView = await service.checkPermission('project-123', 'user-456', 'canView')
      expect(canView).toBe(false)
    })

    test('should update collaborator role', async () => {
      await service.addCollaborator({
        projectId: 'project-123',
        userId: 'user-456',
        role: 'viewer',
        addedBy: 'owner-123'
      })

      await service.updateCollaboratorRole('project-123', 'user-456', 'editor', 'owner-123')

      const canEdit = await service.checkPermission('project-123', 'user-456', 'canEdit')
      expect(canEdit).toBe(true)
    })

    test('should list all collaborators', async () => {
      await service.addCollaborator({
        projectId: 'project-123',
        userId: 'user-1',
        role: 'viewer',
        addedBy: 'owner-123'
      })

      await service.addCollaborator({
        projectId: 'project-123',
        userId: 'user-2',
        role: 'editor',
        addedBy: 'owner-123'
      })

      const collaborators = await service.getCollaborators('project-123')
      expect(collaborators).toHaveLength(2)
    })
  })

  describe('Change Tracking', () => {
    test('should track object changes', async () => {
      const change = await service.trackChange({
        projectId: 'project-123',
        userId: 'user-456',
        action: 'create',
        objectType: 'wall',
        objectId: 'wall-1',
        before: null,
        after: { length: 10, height: 8 }
      })

      expect(change).toHaveProperty('id')
      expect(change.action).toBe('create')
      expect(change.timestamp).toBeDefined()
    })

    test('should track modifications', async () => {
      const change = await service.trackChange({
        projectId: 'project-123',
        userId: 'user-456',
        action: 'modify',
        objectType: 'wall',
        objectId: 'wall-1',
        before: { length: 10 },
        after: { length: 12 }
      })

      expect(change.action).toBe('modify')
      expect(change.before).toEqual({ length: 10 })
      expect(change.after).toEqual({ length: 12 })
    })

    test('should track deletions', async () => {
      const change = await service.trackChange({
        projectId: 'project-123',
        userId: 'user-456',
        action: 'delete',
        objectType: 'wall',
        objectId: 'wall-1',
        before: { length: 10, height: 8 },
        after: null
      })

      expect(change.action).toBe('delete')
      expect(change.after).toBeNull()
    })

    test('should get change history for an object', async () => {
      await service.trackChange({
        projectId: 'project-123',
        userId: 'user-1',
        action: 'create',
        objectType: 'wall',
        objectId: 'wall-1',
        after: { length: 10 }
      })

      await service.trackChange({
        projectId: 'project-123',
        userId: 'user-2',
        action: 'modify',
        objectType: 'wall',
        objectId: 'wall-1',
        before: { length: 10 },
        after: { length: 12 }
      })

      const history = await service.getObjectHistory('wall-1')
      expect(history).toHaveLength(2)
      expect(history[0].action).toBe('modify')
      expect(history[1].action).toBe('create')
    })
  })

  describe('Conflict Resolution', () => {
    test('should detect conflicting edits', async () => {
      // User 1 edits wall
      await service.trackChange({
        projectId: 'project-123',
        userId: 'user-1',
        action: 'modify',
        objectType: 'wall',
        objectId: 'wall-1',
        before: { length: 10 },
        after: { length: 12 }
      })

      // User 2 edits same wall concurrently
      const conflict = await service.detectConflict({
        projectId: 'project-123',
        userId: 'user-2',
        action: 'modify',
        objectType: 'wall',
        objectId: 'wall-1',
        before: { length: 10 },
        after: { length: 11 }
      })

      expect(conflict).toBe(true)
    })

    test('should resolve conflicts with last-write-wins', async () => {
      const resolution = await service.resolveConflict({
        projectId: 'project-123',
        objectId: 'wall-1',
        strategy: 'last-write-wins',
        winningUserId: 'user-2'
      })

      expect(resolution.strategy).toBe('last-write-wins')
      expect(resolution.resolved).toBe(true)
    })

    test('should resolve conflicts with manual merge', async () => {
      const resolution = await service.resolveConflict({
        projectId: 'project-123',
        objectId: 'wall-1',
        strategy: 'manual',
        mergedState: { length: 11.5 }
      })

      expect(resolution.strategy).toBe('manual')
      expect(resolution.mergedState).toEqual({ length: 11.5 })
    })
  })

  describe('Activity Feed', () => {
    test('should generate activity feed', async () => {
      await service.trackChange({
        projectId: 'project-123',
        userId: 'user-1',
        action: 'create',
        objectType: 'wall',
        objectId: 'wall-1'
      })

      await service.createComment({
        projectId: 'project-123',
        userId: 'user-2',
        content: 'Looks good!'
      })

      await service.createVersion({
        projectId: 'project-123',
        userId: 'user-1',
        message: 'Initial version'
      })

      const feed = await service.getActivityFeed('project-123')
      expect(feed.length).toBeGreaterThanOrEqual(3)
    })

    test('should filter activity by type', async () => {
      await service.trackChange({
        projectId: 'project-123',
        userId: 'user-1',
        action: 'create',
        objectType: 'wall',
        objectId: 'wall-1'
      })

      await service.createComment({
        projectId: 'project-123',
        userId: 'user-2',
        content: 'Comment'
      })

      const commentActivity = await service.getActivityFeed('project-123', { type: 'comment' })
      expect(commentActivity).toHaveLength(1)
      expect(commentActivity[0].type).toBe('comment')
    })

    test('should filter activity by user', async () => {
      await service.trackChange({
        projectId: 'project-123',
        userId: 'user-1',
        action: 'create',
        objectType: 'wall',
        objectId: 'wall-1'
      })

      await service.trackChange({
        projectId: 'project-123',
        userId: 'user-2',
        action: 'create',
        objectType: 'door',
        objectId: 'door-1'
      })

      const user1Activity = await service.getActivityFeed('project-123', { userId: 'user-1' })
      expect(user1Activity).toHaveLength(1)
      expect(user1Activity[0].userId).toBe('user-1')
    })
  })

  describe('Notifications', () => {
    test('should notify users of mentions in comments', async () => {
      const notifications: any[] = []
      service.onNotification('user-456', (notification) => {
        notifications.push(notification)
      })

      await service.createComment({
        projectId: 'project-123',
        userId: 'user-1',
        content: '@user-456 please review this'
      })

      expect(notifications).toHaveLength(1)
      expect(notifications[0].type).toBe('mention')
    })

    test('should notify users of replies to their comments', async () => {
      const notifications: any[] = []
      service.onNotification('user-1', (notification) => {
        notifications.push(notification)
      })

      const comment = await service.createComment({
        projectId: 'project-123',
        userId: 'user-1',
        content: 'Original comment'
      })

      await service.replyToComment({
        commentId: comment.id,
        userId: 'user-2',
        content: 'Reply'
      })

      expect(notifications).toHaveLength(1)
      expect(notifications[0].type).toBe('reply')
    })

    test('should notify project owner of new collaborators', async () => {
      const notifications: any[] = []
      service.onNotification('owner-123', (notification) => {
        notifications.push(notification)
      })

      await service.addCollaborator({
        projectId: 'project-123',
        userId: 'user-456',
        role: 'editor',
        addedBy: 'admin-789'
      })

      expect(notifications).toHaveLength(1)
      expect(notifications[0].type).toBe('collaborator_added')
    })
  })
})
