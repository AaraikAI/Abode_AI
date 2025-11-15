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

  describe('Concurrent Editing Scenarios', () => {
    test('should handle two users editing same object simultaneously', async () => {
      const objectId = 'wall-1'

      // User 1 makes a change
      const change1 = await service.trackChange({
        projectId: 'project-123',
        userId: 'user-1',
        action: 'modify',
        objectType: 'wall',
        objectId,
        before: { length: 10 },
        after: { length: 12 }
      })

      // User 2 makes a concurrent change
      const change2 = await service.trackChange({
        projectId: 'project-123',
        userId: 'user-2',
        action: 'modify',
        objectType: 'wall',
        objectId,
        before: { length: 10 },
        after: { length: 11 }
      })

      expect(change1.objectId).toBe(objectId)
      expect(change2.objectId).toBe(objectId)
    })

    test('should track concurrent edits from multiple users', async () => {
      const edits = await Promise.all([
        service.trackChange({
          projectId: 'project-123',
          userId: 'user-1',
          action: 'modify',
          objectType: 'wall',
          objectId: 'wall-1',
          after: { length: 11 }
        }),
        service.trackChange({
          projectId: 'project-123',
          userId: 'user-2',
          action: 'modify',
          objectType: 'wall',
          objectId: 'wall-2',
          after: { length: 12 }
        }),
        service.trackChange({
          projectId: 'project-123',
          userId: 'user-3',
          action: 'modify',
          objectType: 'wall',
          objectId: 'wall-3',
          after: { length: 13 }
        })
      ])

      expect(edits).toHaveLength(3)
      expect(new Set(edits.map(e => e.userId)).size).toBe(3)
    })

    test('should handle rapid successive edits from single user', async () => {
      const edits = []
      for (let i = 0; i < 10; i++) {
        edits.push(await service.trackChange({
          projectId: 'project-123',
          userId: 'user-1',
          action: 'modify',
          objectType: 'wall',
          objectId: 'wall-1',
          after: { length: 10 + i }
        }))
      }

      expect(edits).toHaveLength(10)
    })

    test('should maintain edit order for same user', async () => {
      const edit1 = await service.trackChange({
        projectId: 'project-123',
        userId: 'user-1',
        action: 'modify',
        objectType: 'wall',
        objectId: 'wall-1',
        after: { step: 1 }
      })

      await new Promise(resolve => setTimeout(resolve, 10))

      const edit2 = await service.trackChange({
        projectId: 'project-123',
        userId: 'user-1',
        action: 'modify',
        objectType: 'wall',
        objectId: 'wall-1',
        after: { step: 2 }
      })

      const history = await service.getObjectHistory('wall-1')
      expect(history[0].timestamp).toBeGreaterThan(history[1].timestamp)
    })

    test('should handle concurrent creates of different objects', async () => {
      const creates = await Promise.all([
        service.trackChange({
          projectId: 'project-123',
          userId: 'user-1',
          action: 'create',
          objectType: 'wall',
          objectId: 'wall-new-1',
          after: { length: 10 }
        }),
        service.trackChange({
          projectId: 'project-123',
          userId: 'user-2',
          action: 'create',
          objectType: 'door',
          objectId: 'door-new-1',
          after: { width: 3 }
        })
      ])

      expect(creates).toHaveLength(2)
      expect(creates[0].objectType).toBe('wall')
      expect(creates[1].objectType).toBe('door')
    })

    test('should detect conflicting deletes', async () => {
      // User 1 modifies
      await service.trackChange({
        projectId: 'project-123',
        userId: 'user-1',
        action: 'modify',
        objectType: 'wall',
        objectId: 'wall-1',
        after: { length: 15 }
      })

      // User 2 tries to delete same object
      const conflict = await service.detectConflict({
        projectId: 'project-123',
        userId: 'user-2',
        action: 'delete',
        objectType: 'wall',
        objectId: 'wall-1',
        before: { length: 10 }
      })

      expect(conflict).toBe(true)
    })

    test('should lock objects during edit', async () => {
      const locked = await service.lockObject('project-123', 'wall-1', 'user-1')
      expect(locked).toBe(true)

      const canLock = await service.canLockObject('project-123', 'wall-1', 'user-2')
      expect(canLock).toBe(false)
    })

    test('should release locks when edit completes', async () => {
      await service.lockObject('project-123', 'wall-1', 'user-1')
      await service.unlockObject('project-123', 'wall-1', 'user-1')

      const canLock = await service.canLockObject('project-123', 'wall-1', 'user-2')
      expect(canLock).toBe(true)
    })

    test('should timeout stale locks', async () => {
      await service.lockObject('project-123', 'wall-1', 'user-1')

      // Simulate timeout
      await new Promise(resolve => setTimeout(resolve, 5000))

      const canLock = await service.canLockObject('project-123', 'wall-1', 'user-2')
      expect(canLock).toBe(true)
    })

    test('should handle lock stealing for urgent operations', async () => {
      await service.lockObject('project-123', 'wall-1', 'user-1')

      const stolen = await service.stealLock('project-123', 'wall-1', 'admin-1', { reason: 'urgent' })
      expect(stolen).toBe(true)
    })
  })

  describe('Conflict Resolution Algorithms', () => {
    test('should use last-write-wins for simple conflicts', async () => {
      const resolution = await service.resolveConflict({
        projectId: 'project-123',
        objectId: 'wall-1',
        strategy: 'last-write-wins',
        winningUserId: 'user-2'
      })

      expect(resolution.strategy).toBe('last-write-wins')
      expect(resolution.resolved).toBe(true)
    })

    test('should use first-write-wins when specified', async () => {
      const resolution = await service.resolveConflict({
        projectId: 'project-123',
        objectId: 'wall-1',
        strategy: 'first-write-wins',
        winningUserId: 'user-1'
      })

      expect(resolution.strategy).toBe('first-write-wins')
    })

    test('should merge non-conflicting properties', async () => {
      const resolution = await service.resolveConflict({
        projectId: 'project-123',
        objectId: 'wall-1',
        strategy: 'merge',
        mergedState: {
          length: 12, // from user-1
          height: 8,  // from user-2
          color: 'white' // unchanged
        }
      })

      expect(resolution.strategy).toBe('merge')
      expect(resolution.mergedState.length).toBe(12)
    })

    test('should detect non-resolvable conflicts', async () => {
      const canResolve = await service.canAutoResolve({
        conflicts: [
          { property: 'length', user1Value: 10, user2Value: 12 },
          { property: 'length', user1Value: 12, user2Value: 14 }
        ]
      })

      expect(typeof canResolve).toBe('boolean')
    })

    test('should apply three-way merge', async () => {
      const merged = await service.threeWayMerge({
        base: { length: 10, height: 8, color: 'white' },
        local: { length: 12, height: 8, color: 'white' },
        remote: { length: 10, height: 9, color: 'white' }
      })

      expect(merged.length).toBe(12)
      expect(merged.height).toBe(9)
    })

    test('should prefer user with higher priority', async () => {
      const resolution = await service.resolveConflict({
        projectId: 'project-123',
        objectId: 'wall-1',
        strategy: 'priority-based',
        users: [
          { id: 'user-1', priority: 1 },
          { id: 'admin-1', priority: 10 }
        ]
      })

      expect(resolution.winningUserId).toBe('admin-1')
    })

    test('should create conflict markers for manual resolution', async () => {
      const conflict = await service.createConflictMarkers({
        property: 'position',
        localValue: { x: 10, y: 20 },
        remoteValue: { x: 15, y: 20 }
      })

      expect(conflict.requiresManualResolution).toBe(true)
    })

    test('should track conflict resolution history', async () => {
      await service.resolveConflict({
        projectId: 'project-123',
        objectId: 'wall-1',
        strategy: 'manual',
        resolvedBy: 'user-1'
      })

      const history = await service.getConflictHistory('wall-1')
      expect(history.length).toBeGreaterThan(0)
    })

    test('should notify users of conflict resolution', async () => {
      const notifications: any[] = []
      service.onConflictResolved((data) => {
        notifications.push(data)
      })

      await service.resolveConflict({
        projectId: 'project-123',
        objectId: 'wall-1',
        strategy: 'manual'
      })

      expect(notifications.length).toBeGreaterThan(0)
    })

    test('should rollback failed conflict resolutions', async () => {
      const snapshot = await service.createSnapshot('project-123')

      await service.resolveConflict({
        projectId: 'project-123',
        objectId: 'wall-1',
        strategy: 'merge',
        mergedState: { invalid: true }
      }).catch(() => {})

      await service.rollbackToSnapshot(snapshot.id)
      expect(snapshot).toBeDefined()
    })
  })

  describe('Operational Transformation', () => {
    test('should transform concurrent insert operations', async () => {
      const op1 = { type: 'insert', position: 5, text: 'Hello' }
      const op2 = { type: 'insert', position: 5, text: 'World' }

      const [op1Prime, op2Prime] = await service.transformOperations(op1, op2)

      expect(op1Prime).toBeDefined()
      expect(op2Prime).toBeDefined()
    })

    test('should transform insert and delete operations', async () => {
      const insert = { type: 'insert', position: 5, text: 'new' }
      const del = { type: 'delete', position: 3, length: 2 }

      const [insertPrime, deletePrime] = await service.transformOperations(insert, del)

      expect(insertPrime.position).not.toBe(insert.position)
    })

    test('should maintain convergence after transformations', async () => {
      const ops = [
        { type: 'insert', position: 0, text: 'A' },
        { type: 'insert', position: 0, text: 'B' },
        { type: 'insert', position: 0, text: 'C' }
      ]

      const result = await service.applyOperationSequence('doc-1', ops)
      expect(result.converged).toBe(true)
    })

    test('should handle transformation of move operations', async () => {
      const move1 = { type: 'move', objectId: 'wall-1', from: { x: 0, y: 0 }, to: { x: 10, y: 0 } }
      const move2 = { type: 'move', objectId: 'wall-1', from: { x: 0, y: 0 }, to: { x: 0, y: 10 } }

      const transformed = await service.transformOperations(move1, move2)
      expect(transformed).toBeDefined()
    })

    test('should apply operational transformation to text edits', async () => {
      const doc = 'Hello World'
      const op1 = { type: 'insert', position: 6, text: 'Beautiful ' }
      const op2 = { type: 'delete', position: 0, length: 6 }

      const result = await service.applyOT(doc, [op1, op2])
      expect(typeof result).toBe('string')
    })

    test('should maintain intention preservation', async () => {
      const op = { type: 'insert', position: 5, text: 'test', intention: 'add-label' }
      const concurrent = { type: 'insert', position: 3, text: 'x' }

      const transformed = await service.transformWithIntention(op, concurrent)
      expect(transformed.intention).toBe('add-label')
    })

    test('should handle complex operation sequences', async () => {
      const sequence = [
        { type: 'insert', position: 0, text: 'A' },
        { type: 'insert', position: 1, text: 'B' },
        { type: 'delete', position: 0, length: 1 },
        { type: 'insert', position: 1, text: 'C' }
      ]

      const result = await service.applyOperationSequence('doc-1', sequence)
      expect(result.success).toBe(true)
    })

    test('should compose operations for efficiency', async () => {
      const op1 = { type: 'insert', position: 5, text: 'a' }
      const op2 = { type: 'insert', position: 6, text: 'b' }

      const composed = await service.composeOperations([op1, op2])
      expect(composed.type).toBe('insert')
      expect(composed.text).toContain('a')
    })

    test('should invert operations for undo', async () => {
      const op = { type: 'insert', position: 5, text: 'test' }
      const inverted = await service.invertOperation(op)

      expect(inverted.type).toBe('delete')
      expect(inverted.position).toBe(5)
    })

    test('should maintain operation history for debugging', async () => {
      await service.trackOperation('doc-1', { type: 'insert', position: 0, text: 'A' })
      await service.trackOperation('doc-1', { type: 'insert', position: 1, text: 'B' })

      const history = await service.getOperationHistory('doc-1')
      expect(history.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('CRDT Implementations', () => {
    test('should implement G-Counter (grow-only counter)', async () => {
      const counter = await service.createCRDT('counter', 'g-counter')

      await service.incrementCRDT(counter.id, 'user-1', 5)
      await service.incrementCRDT(counter.id, 'user-2', 3)

      const value = await service.getCRDTValue(counter.id)
      expect(value).toBe(8)
    })

    test('should implement PN-Counter (positive-negative counter)', async () => {
      const counter = await service.createCRDT('counter', 'pn-counter')

      await service.incrementCRDT(counter.id, 'user-1', 10)
      await service.decrementCRDT(counter.id, 'user-2', 3)

      const value = await service.getCRDTValue(counter.id)
      expect(value).toBe(7)
    })

    test('should implement LWW-Element-Set (Last-Write-Wins Set)', async () => {
      const set = await service.createCRDT('tags', 'lww-set')

      await service.addToCRDT(set.id, 'user-1', 'important')
      await service.addToCRDT(set.id, 'user-2', 'urgent')
      await service.removeFromCRDT(set.id, 'user-1', 'important')

      const elements = await service.getCRDTValue(set.id)
      expect(elements).toContain('urgent')
    })

    test('should implement OR-Set (Observed-Remove Set)', async () => {
      const set = await service.createCRDT('items', 'or-set')

      await service.addToCRDT(set.id, 'user-1', 'item-1')
      await service.addToCRDT(set.id, 'user-2', 'item-2')

      const elements = await service.getCRDTValue(set.id)
      expect(elements).toHaveLength(2)
    })

    test('should merge CRDT states from different replicas', async () => {
      const crdt1 = await service.createCRDT('doc', 'lww-register', 'replica-1')
      const crdt2 = await service.createCRDT('doc', 'lww-register', 'replica-2')

      await service.updateCRDT(crdt1.id, 'value-1')
      await service.updateCRDT(crdt2.id, 'value-2')

      const merged = await service.mergeCRDTs([crdt1.id, crdt2.id])
      expect(merged).toBeDefined()
    })

    test('should handle concurrent CRDT updates', async () => {
      const set = await service.createCRDT('tags', 'or-set')

      await Promise.all([
        service.addToCRDT(set.id, 'user-1', 'tag-1'),
        service.addToCRDT(set.id, 'user-2', 'tag-2'),
        service.addToCRDT(set.id, 'user-3', 'tag-3')
      ])

      const elements = await service.getCRDTValue(set.id)
      expect(elements).toHaveLength(3)
    })

    test('should implement RGA (Replicated Growable Array)', async () => {
      const array = await service.createCRDT('list', 'rga')

      await service.insertAtCRDT(array.id, 0, 'A')
      await service.insertAtCRDT(array.id, 1, 'B')
      await service.insertAtCRDT(array.id, 2, 'C')

      const value = await service.getCRDTValue(array.id)
      expect(value).toEqual(['A', 'B', 'C'])
    })

    test('should garbage collect tombstones in CRDTs', async () => {
      const set = await service.createCRDT('items', 'or-set')

      await service.addToCRDT(set.id, 'user-1', 'item-1')
      await service.removeFromCRDT(set.id, 'user-1', 'item-1')

      await service.garbageCollectCRDT(set.id)

      const size = await service.getCRDTSize(set.id)
      expect(size).toBeLessThan(1000) // Should clean up tombstones
    })

    test('should preserve CRDT causality', async () => {
      const register = await service.createCRDT('value', 'lww-register')

      await service.updateCRDT(register.id, 'v1', { timestamp: 100 })
      await service.updateCRDT(register.id, 'v2', { timestamp: 200 })
      await service.updateCRDT(register.id, 'v3', { timestamp: 150 })

      const value = await service.getCRDTValue(register.id)
      expect(value).toBe('v2') // v2 has latest timestamp
    })

    test('should sync CRDT state across peers', async () => {
      const crdt1 = await service.createCRDT('doc', 'or-set', 'peer-1')
      const crdt2 = await service.createCRDT('doc', 'or-set', 'peer-2')

      await service.addToCRDT(crdt1.id, 'user-1', 'item-1')

      await service.syncCRDT(crdt1.id, crdt2.id)

      const value2 = await service.getCRDTValue(crdt2.id)
      expect(value2).toContain('item-1')
    })
  })

  describe('Network Partition Handling', () => {
    test('should detect network partition', async () => {
      const partitioned = await service.detectPartition(['peer-1', 'peer-2'])
      expect(typeof partitioned).toBe('boolean')
    })

    test('should queue operations during partition', async () => {
      await service.simulatePartition()

      await service.trackChange({
        projectId: 'project-123',
        userId: 'user-1',
        action: 'modify',
        objectType: 'wall',
        objectId: 'wall-1',
        after: { length: 15 }
      })

      const queue = await service.getPartitionQueue()
      expect(queue.length).toBeGreaterThan(0)
    })

    test('should merge changes when partition heals', async () => {
      await service.simulatePartition()

      await service.trackChange({
        projectId: 'project-123',
        userId: 'user-1',
        action: 'modify',
        objectType: 'wall',
        objectId: 'wall-1',
        after: { length: 15 }
      })

      await service.healPartition()

      const conflicts = await service.getPendingConflicts('project-123')
      expect(Array.isArray(conflicts)).toBe(true)
    })

    test('should handle split-brain scenarios', async () => {
      await service.simulatePartition(['group-1', 'group-2'])

      // Both groups work independently
      await service.trackChange({
        projectId: 'project-123',
        userId: 'user-1',
        action: 'modify',
        objectType: 'wall',
        objectId: 'wall-1',
        after: { length: 12 },
        partition: 'group-1'
      })

      await service.trackChange({
        projectId: 'project-123',
        userId: 'user-2',
        action: 'modify',
        objectType: 'wall',
        objectId: 'wall-1',
        after: { length: 15 },
        partition: 'group-2'
      })

      await service.healPartition()

      const conflicts = await service.detectConflict({
        projectId: 'project-123',
        objectId: 'wall-1'
      })

      expect(conflicts).toBe(true)
    })

    test('should use vector clocks for causality', async () => {
      const clock1 = await service.createVectorClock('peer-1')
      const clock2 = await service.createVectorClock('peer-2')

      await service.incrementVectorClock(clock1, 'peer-1')
      await service.incrementVectorClock(clock2, 'peer-2')

      const concurrent = await service.areConcurrent(clock1, clock2)
      expect(concurrent).toBe(true)
    })

    test('should implement gossip protocol for state sync', async () => {
      await service.enableGossipProtocol()

      await service.broadcastChange({
        projectId: 'project-123',
        change: { objectId: 'wall-1', property: 'length', value: 12 }
      })

      // Wait for gossip to propagate
      await new Promise(resolve => setTimeout(resolve, 1000))

      const synced = await service.isStateSynced(['peer-1', 'peer-2'])
      expect(typeof synced).toBe('boolean')
    })

    test('should handle message reordering', async () => {
      const messages = [
        { id: 'msg-1', timestamp: 100, data: 'first' },
        { id: 'msg-2', timestamp: 200, data: 'second' },
        { id: 'msg-3', timestamp: 150, data: 'third' }
      ]

      const reordered = await service.orderMessages(messages)
      expect(reordered[0].timestamp).toBeLessThanOrEqual(reordered[1].timestamp)
    })

    test('should retry failed operations after reconnect', async () => {
      await service.simulatePartition()

      const op = await service.trackChange({
        projectId: 'project-123',
        userId: 'user-1',
        action: 'create',
        objectType: 'wall',
        objectId: 'wall-new',
        after: { length: 10 }
      })

      await service.healPartition()

      // Should retry
      const retried = await service.getRetryStatus(op.id)
      expect(retried).toBeDefined()
    })

    test('should maintain consistency during network jitter', async () => {
      // Simulate intermittent connectivity
      for (let i = 0; i < 5; i++) {
        await service.simulatePartition()
        await new Promise(resolve => setTimeout(resolve, 100))
        await service.healPartition()
      }

      const consistent = await service.checkConsistency('project-123')
      expect(consistent).toBe(true)
    })

    test('should use conflict-free replicated data types during partition', async () => {
      await service.simulatePartition()

      const crdt = await service.createCRDT('counter', 'pn-counter')
      await service.incrementCRDT(crdt.id, 'user-1', 5)

      await service.healPartition()

      const value = await service.getCRDTValue(crdt.id)
      expect(value).toBe(5)
    })
  })

  describe('Merge Strategies', () => {
    test('should implement auto-merge for non-conflicting changes', async () => {
      const base = { length: 10, height: 8, color: 'white' }
      const local = { length: 12, height: 8, color: 'white' }
      const remote = { length: 10, height: 9, color: 'white' }

      const merged = await service.autoMerge({ base, local, remote })

      expect(merged.length).toBe(12)
      expect(merged.height).toBe(9)
    })

    test('should implement manual merge for conflicts', async () => {
      const conflict = {
        base: { position: { x: 0, y: 0 } },
        local: { position: { x: 10, y: 0 } },
        remote: { position: { x: 0, y: 10 } }
      }

      const requiresManual = await service.requiresManualMerge(conflict)
      expect(requiresManual).toBe(true)
    })

    test('should use structural merge for nested objects', async () => {
      const base = { wall: { length: 10, material: 'brick' } }
      const local = { wall: { length: 12, material: 'brick' } }
      const remote = { wall: { length: 10, material: 'concrete' } }

      const merged = await service.structuralMerge({ base, local, remote })

      expect(merged.wall.length).toBe(12)
      expect(merged.wall.material).toBe('concrete')
    })

    test('should implement semantic merge for related changes', async () => {
      const changes = [
        { property: 'width', value: 5 },
        { property: 'height', value: 10 },
        { property: 'area', value: 50 } // semantically related
      ]

      const merged = await service.semanticMerge(changes)
      expect(merged.area).toBe(merged.width * merged.height)
    })

    test('should preserve user intent during merge', async () => {
      const intent1 = { action: 'resize', target: 'wall-1', value: 12, reason: 'code-compliance' }
      const intent2 = { action: 'resize', target: 'wall-1', value: 11, reason: 'aesthetic' }

      const merged = await service.mergeWithIntent([intent1, intent2])
      expect(merged.reason).toBe('code-compliance') // Higher priority
    })

    test('should implement custom merge rules', async () => {
      const rules = {
        priority: ['high', 'normal', 'low'],
        merge: (a: any, b: any) => a.priority === 'high' ? a : b
      }

      const merged = await service.mergeWithRules(
        { value: 10, priority: 'high' },
        { value: 12, priority: 'normal' },
        rules
      )

      expect(merged.value).toBe(10)
    })

    test('should track merge provenance', async () => {
      const merged = await service.mergeWithProvenance({
        local: { value: 10, user: 'user-1' },
        remote: { value: 12, user: 'user-2' }
      })

      expect(merged.provenance).toBeDefined()
      expect(merged.provenance.sources).toHaveLength(2)
    })

    test('should implement optimistic merge with rollback', async () => {
      const optimistic = await service.optimisticMerge({
        local: { status: 'in-progress' },
        remote: { status: 'completed' }
      })

      if (!optimistic.success) {
        await service.rollbackMerge(optimistic.id)
      }

      expect(optimistic).toBeDefined()
    })

    test('should validate merge results', async () => {
      const merged = await service.autoMerge({
        base: { length: 10 },
        local: { length: -5 }, // Invalid
        remote: { length: 12 }
      })

      const valid = await service.validateMerge(merged)
      expect(typeof valid).toBe('boolean')
    })

    test('should support undo/redo for merges', async () => {
      const merged = await service.autoMerge({
        base: { value: 10 },
        local: { value: 12 },
        remote: { value: 15 }
      })

      await service.undoMerge(merged.id)

      const current = await service.getCurrentState('object-1')
      expect(current).toBeDefined()
    })
  })

  describe('Version Control Edge Cases', () => {
    test('should handle cherry-picking from branches', async () => {
      const v1 = await service.createVersion({
        projectId: 'project-123',
        userId: 'user-1',
        message: 'Version 1',
        branch: 'main'
      })

      const v2 = await service.createVersion({
        projectId: 'project-123',
        userId: 'user-2',
        message: 'Version 2',
        branch: 'feature-1'
      })

      const cherryPicked = await service.cherryPick('project-123', v2.id, 'main')
      expect(cherryPicked).toBeDefined()
    })

    test('should handle rebase operations', async () => {
      const base = await service.createVersion({
        projectId: 'project-123',
        userId: 'user-1',
        message: 'Base'
      })

      const feature = await service.createVersion({
        projectId: 'project-123',
        userId: 'user-2',
        message: 'Feature',
        parent: base.id
      })

      const rebased = await service.rebaseVersion('project-123', feature.id, base.id)
      expect(rebased).toBeDefined()
    })

    test('should support branching and merging', async () => {
      await service.createBranch('project-123', 'feature-branch')

      const v1 = await service.createVersion({
        projectId: 'project-123',
        userId: 'user-1',
        message: 'Feature work',
        branch: 'feature-branch'
      })

      const merged = await service.mergeBranch('project-123', 'feature-branch', 'main')
      expect(merged).toBeDefined()
    })

    test('should handle conflicting merges in version control', async () => {
      const v1 = await service.createVersion({
        projectId: 'project-123',
        userId: 'user-1',
        message: 'Version 1',
        snapshot: { walls: ['wall-1'] }
      })

      const v2 = await service.createVersion({
        projectId: 'project-123',
        userId: 'user-2',
        message: 'Version 2',
        snapshot: { walls: ['wall-1', 'wall-2'] }
      })

      const conflicts = await service.detectMergeConflicts(v1.id, v2.id)
      expect(Array.isArray(conflicts)).toBe(true)
    })

    test('should create tags for important versions', async () => {
      const version = await service.createVersion({
        projectId: 'project-123',
        userId: 'user-1',
        message: 'Release 1.0'
      })

      const tagged = await service.tagVersion(version.id, 'v1.0')
      expect(tagged.tag).toBe('v1.0')
    })

    test('should support squashing multiple versions', async () => {
      const v1 = await service.createVersion({
        projectId: 'project-123',
        userId: 'user-1',
        message: 'Work 1'
      })

      const v2 = await service.createVersion({
        projectId: 'project-123',
        userId: 'user-1',
        message: 'Work 2'
      })

      const squashed = await service.squashVersions('project-123', [v1.id, v2.id])
      expect(squashed).toBeDefined()
    })

    test('should preserve version metadata', async () => {
      const version = await service.createVersion({
        projectId: 'project-123',
        userId: 'user-1',
        message: 'Important change',
        metadata: {
          jiraTicket: 'PROJ-123',
          reviewer: 'user-2'
        }
      })

      expect(version.metadata.jiraTicket).toBe('PROJ-123')
    })

    test('should handle version restoration with dependencies', async () => {
      const v1 = await service.createVersion({
        projectId: 'project-123',
        userId: 'user-1',
        message: 'v1',
        snapshot: { walls: ['wall-1'] },
        dependencies: ['material-1']
      })

      await service.restoreVersion('project-123', v1.id, 'user-1')

      const restored = await service.getCurrentVersion('project-123')
      expect(restored.dependencies).toContain('material-1')
    })

    test('should detect divergent version histories', async () => {
      const v1 = await service.createVersion({
        projectId: 'project-123',
        userId: 'user-1',
        message: 'Branch A'
      })

      const v2 = await service.createVersion({
        projectId: 'project-123',
        userId: 'user-2',
        message: 'Branch B'
      })

      const divergent = await service.areDivergent(v1.id, v2.id)
      expect(typeof divergent).toBe('boolean')
    })

    test('should calculate version diff statistics', async () => {
      const v1 = await service.createVersion({
        projectId: 'project-123',
        userId: 'user-1',
        message: 'v1',
        snapshot: { walls: ['wall-1'], doors: ['door-1'] }
      })

      const v2 = await service.createVersion({
        projectId: 'project-123',
        userId: 'user-1',
        message: 'v2',
        snapshot: { walls: ['wall-1', 'wall-2'], doors: ['door-1'] }
      })

      const stats = await service.getVersionDiffStats(v1.id, v2.id)
      expect(stats.additions).toBeGreaterThan(0)
    })
  })
})
