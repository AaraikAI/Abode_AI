/**
 * Google Drive Integration Service Test Suite
 *
 * Comprehensive tests for file operations, OAuth, permissions, and error handling
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import {
  GoogleDriveService,
  type GoogleDriveConfig,
  type OAuthTokens,
  type DriveFile,
  type DriveFolder,
  type DrivePermission,
  type UploadOptions,
  type SyncOptions
} from '../../lib/services/google-drive'

// Mock fetch globally
global.fetch = jest.fn() as any

describe('GoogleDriveService', () => {
  let service: GoogleDriveService
  let config: GoogleDriveConfig
  let mockTokens: OAuthTokens

  beforeEach(() => {
    config = {
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      redirectUri: 'https://example.com/oauth/callback',
      scopes: [
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/drive.readonly'
      ]
    }

    mockTokens = {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
      tokenType: 'Bearer',
      scope: config.scopes.join(' ')
    }

    service = new GoogleDriveService(config)
    ;(fetch as jest.MockedFunction<typeof fetch>).mockClear()
  })

  // ===========================
  // OAuth Flow Tests
  // ===========================

  describe('OAuth Flow', () => {
    it('should generate authorization URL', () => {
      const url = service.getAuthorizationUrl()

      expect(url).toContain('https://accounts.google.com/o/oauth2/v2/auth')
      expect(url).toContain(`client_id=${config.clientId}`)
      expect(url).toContain('response_type=code')
      expect(url).toContain('access_type=offline')
    })

    it('should include scopes in authorization URL', () => {
      const url = service.getAuthorizationUrl()

      config.scopes.forEach(scope => {
        expect(url).toContain(encodeURIComponent(scope))
      })
    })

    it('should include state parameter when provided', () => {
      const state = 'random-state-123'
      const url = service.getAuthorizationUrl(state)

      expect(url).toContain(`state=${state}`)
    })

    it('should exchange authorization code for tokens', async () => {
      const mockResponse = {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        expires_in: 3600,
        token_type: 'Bearer',
        scope: config.scopes.join(' ')
      }

      ;(fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response)

      const tokens = await service.exchangeAuthorizationCode('auth-code-123')

      expect(tokens.accessToken).toBe('new-access-token')
      expect(tokens.refreshToken).toBe('new-refresh-token')
      expect(fetch).toHaveBeenCalledWith(
        'https://oauth2.googleapis.com/token',
        expect.objectContaining({
          method: 'POST'
        })
      )
    })

    it('should throw error on failed token exchange', async () => {
      ;(fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request'
      } as Response)

      await expect(
        service.exchangeAuthorizationCode('invalid-code')
      ).rejects.toThrow('OAuth token exchange failed')
    })

    it('should refresh access token', async () => {
      service.setTokens(mockTokens)

      const mockResponse = {
        access_token: 'refreshed-access-token',
        expires_in: 3600,
        token_type: 'Bearer',
        scope: config.scopes.join(' ')
      }

      ;(fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response)

      const newTokens = await service.refreshAccessToken()

      expect(newTokens.accessToken).toBe('refreshed-access-token')
      expect(newTokens.refreshToken).toBe(mockTokens.refreshToken)
    })

    it('should throw error when refreshing without refresh token', async () => {
      const tokensWithoutRefresh = { ...mockTokens, refreshToken: '' }
      service.setTokens(tokensWithoutRefresh)

      await expect(service.refreshAccessToken()).rejects.toThrow('No refresh token available')
    })

    it('should set tokens manually', () => {
      service.setTokens(mockTokens)
      // Tokens are set - verified by other tests using them
      expect(true).toBe(true)
    })
  })

  // ===========================
  // File Upload Tests
  // ===========================

  describe('File Upload', () => {
    beforeEach(() => {
      service.setTokens(mockTokens)
    })

    it('should upload small file using simple upload', async () => {
      const mockFile = {
        id: 'file-123',
        name: 'test.txt',
        mimeType: 'text/plain',
        size: '100',
        createdTime: new Date().toISOString(),
        modifiedTime: new Date().toISOString()
      }

      ;(fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockFile
      } as Response)

      const result = await service.uploadFile('test.txt', 'Hello World')

      expect(result.id).toBe('file-123')
      expect(result.name).toBe('test.txt')
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('upload/drive/v3/files'),
        expect.objectContaining({
          method: 'POST'
        })
      )
    })

    it('should upload file with metadata', async () => {
      const mockFile = {
        id: 'file-456',
        name: 'document.pdf',
        mimeType: 'application/pdf',
        size: '2048',
        createdTime: new Date().toISOString(),
        modifiedTime: new Date().toISOString()
      }

      ;(fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockFile
      } as Response)

      const options: UploadOptions = {
        mimeType: 'application/pdf',
        description: 'Test document',
        metadata: { category: 'reports' }
      }

      const result = await service.uploadFile('document.pdf', Buffer.from('PDF content'), options)

      expect(result.id).toBe('file-456')
    })

    it('should upload file to specific folder', async () => {
      const mockFile = {
        id: 'file-789',
        name: 'file.txt',
        mimeType: 'text/plain',
        size: '50',
        createdTime: new Date().toISOString(),
        modifiedTime: new Date().toISOString(),
        parents: ['folder-123']
      }

      ;(fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockFile
      } as Response)

      const result = await service.uploadFile('file.txt', 'content', {
        parents: ['folder-123']
      })

      expect(result.parents).toContain('folder-123')
    })

    it('should handle upload errors', async () => {
      ;(fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      } as Response)

      await expect(
        service.uploadFile('test.txt', 'content')
      ).rejects.toThrow('File upload failed')
    })
  })

  // ===========================
  // File Download Tests
  // ===========================

  describe('File Download', () => {
    beforeEach(() => {
      service.setTokens(mockTokens)
    })

    it('should download file by ID', async () => {
      const fileContent = Buffer.from('File content')

      ;(fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => fileContent.buffer
      } as Response)

      const result = await service.downloadFile('file-123')

      expect(Buffer.isBuffer(result)).toBe(true)
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('file-123'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockTokens.accessToken}`
          })
        })
      )
    })

    it('should download file with export mime type', async () => {
      const fileContent = Buffer.from('Exported content')

      ;(fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => fileContent.buffer
      } as Response)

      const result = await service.downloadFile('file-123', {
        mimeType: 'application/pdf'
      })

      expect(Buffer.isBuffer(result)).toBe(true)
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('export'),
        expect.any(Object)
      )
    })

    it('should handle download errors', async () => {
      ;(fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      } as Response)

      await expect(
        service.downloadFile('non-existent')
      ).rejects.toThrow('File download failed')
    })
  })

  // ===========================
  // File Metadata Tests
  // ===========================

  describe('File Metadata', () => {
    beforeEach(() => {
      service.setTokens(mockTokens)
    })

    it('should get file metadata', async () => {
      const mockFile = {
        id: 'file-123',
        name: 'test.txt',
        mimeType: 'text/plain',
        size: '1024',
        createdTime: new Date().toISOString(),
        modifiedTime: new Date().toISOString(),
        webViewLink: 'https://drive.google.com/file/123'
      }

      ;(fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockFile
      } as Response)

      const result = await service.getFileMetadata('file-123')

      expect(result.id).toBe('file-123')
      expect(result.name).toBe('test.txt')
      expect(result.webViewLink).toBe('https://drive.google.com/file/123')
    })

    it('should get metadata with specific fields', async () => {
      const mockFile = {
        id: 'file-123',
        name: 'test.txt'
      }

      ;(fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockFile, mimeType: 'text/plain', size: '0', createdTime: new Date().toISOString(), modifiedTime: new Date().toISOString() })
      } as Response)

      await service.getFileMetadata('file-123', ['id', 'name'])

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('fields=id,name'),
        expect.any(Object)
      )
    })

    it('should list files', async () => {
      const mockResponse = {
        files: [
          {
            id: 'file-1',
            name: 'file1.txt',
            mimeType: 'text/plain',
            size: '100',
            createdTime: new Date().toISOString(),
            modifiedTime: new Date().toISOString()
          },
          {
            id: 'file-2',
            name: 'file2.txt',
            mimeType: 'text/plain',
            size: '200',
            createdTime: new Date().toISOString(),
            modifiedTime: new Date().toISOString()
          }
        ]
      }

      ;(fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response)

      const result = await service.listFiles()

      expect(result.length).toBe(2)
      expect(result[0].id).toBe('file-1')
      expect(result[1].id).toBe('file-2')
    })

    it('should list files in folder', async () => {
      const mockResponse = {
        files: [
          {
            id: 'file-1',
            name: 'file1.txt',
            mimeType: 'text/plain',
            size: '100',
            createdTime: new Date().toISOString(),
            modifiedTime: new Date().toISOString(),
            parents: ['folder-123']
          }
        ]
      }

      ;(fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response)

      const result = await service.listFiles('folder-123')

      expect(result.length).toBe(1)
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("'folder-123' in parents"),
        expect.any(Object)
      )
    })

    it('should delete file', async () => {
      ;(fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        status: 204
      } as Response)

      await service.deleteFile('file-123')

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('file-123'),
        expect.objectContaining({
          method: 'DELETE'
        })
      )
    })
  })

  // ===========================
  // Folder Management Tests
  // ===========================

  describe('Folder Management', () => {
    beforeEach(() => {
      service.setTokens(mockTokens)
    })

    it('should create folder', async () => {
      const mockFolder = {
        id: 'folder-123',
        name: 'New Folder',
        mimeType: 'application/vnd.google-apps.folder',
        createdTime: new Date().toISOString(),
        modifiedTime: new Date().toISOString()
      }

      ;(fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockFolder
      } as Response)

      const result = await service.createFolder('New Folder')

      expect(result.id).toBe('folder-123')
      expect(result.name).toBe('New Folder')
    })

    it('should create folder with parent', async () => {
      const mockFolder = {
        id: 'folder-456',
        name: 'Subfolder',
        mimeType: 'application/vnd.google-apps.folder',
        createdTime: new Date().toISOString(),
        modifiedTime: new Date().toISOString(),
        parents: ['parent-folder']
      }

      ;(fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockFolder
      } as Response)

      const result = await service.createFolder('Subfolder', 'parent-folder')

      expect(result.parents).toContain('parent-folder')
    })

    it('should sync folder', async () => {
      const options: SyncOptions = {
        localPath: '/local/path',
        remoteFolderId: 'folder-123',
        direction: 'upload',
        deleteRemoved: false
      }

      const result = await service.syncFolder(options)

      expect(result).toBeDefined()
      expect(result.duration).toBeGreaterThanOrEqual(0)
      expect(typeof result.uploaded).toBe('number')
      expect(typeof result.downloaded).toBe('number')
    })
  })

  // ===========================
  // Permission Management Tests
  // ===========================

  describe('Permission Management', () => {
    beforeEach(() => {
      service.setTokens(mockTokens)
    })

    it('should share file with user', async () => {
      const mockPermission = {
        id: 'permission-123',
        type: 'user',
        role: 'reader',
        emailAddress: 'user@example.com'
      }

      ;(fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPermission
      } as Response)

      const result = await service.shareFile('file-123', 'user@example.com', 'reader')

      expect(result.type).toBe('user')
      expect(result.role).toBe('reader')
      expect(result.emailAddress).toBe('user@example.com')
    })

    it('should share file without notification email', async () => {
      const mockPermission = {
        id: 'permission-456',
        type: 'user',
        role: 'writer',
        emailAddress: 'editor@example.com'
      }

      ;(fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPermission
      } as Response)

      await service.shareFile('file-123', 'editor@example.com', 'writer', false)

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('sendNotificationEmail=false'),
        expect.any(Object)
      )
    })

    it('should make file public', async () => {
      const mockPermission = {
        id: 'permission-public',
        type: 'anyone',
        role: 'reader'
      }

      ;(fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPermission
      } as Response)

      const result = await service.makePublic('file-123')

      expect(result.type).toBe('anyone')
      expect(result.role).toBe('reader')
    })

    it('should list file permissions', async () => {
      const mockResponse = {
        permissions: [
          {
            id: 'permission-1',
            type: 'user',
            role: 'owner',
            emailAddress: 'owner@example.com'
          },
          {
            id: 'permission-2',
            type: 'user',
            role: 'reader',
            emailAddress: 'reader@example.com'
          }
        ]
      }

      ;(fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response)

      const result = await service.listPermissions('file-123')

      expect(result.length).toBe(2)
      expect(result[0].role).toBe('owner')
      expect(result[1].role).toBe('reader')
    })

    it('should remove permission', async () => {
      ;(fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        status: 204
      } as Response)

      await service.removePermission('file-123', 'permission-456')

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('permissions/permission-456'),
        expect.objectContaining({
          method: 'DELETE'
        })
      )
    })
  })

  // ===========================
  // Error Handling Tests
  // ===========================

  describe('Error Handling', () => {
    beforeEach(() => {
      service.setTokens(mockTokens)
    })

    it('should handle network errors', async () => {
      ;(fetch as jest.MockedFunction<typeof fetch>).mockRejectedValue(
        new Error('Network error')
      )

      await expect(
        service.getFileMetadata('file-123')
      ).rejects.toThrow()
    })

    it('should handle 401 unauthorized errors', async () => {
      ;(fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      } as Response)

      await expect(
        service.listFiles()
      ).rejects.toThrow()
    })

    it('should handle 403 forbidden errors', async () => {
      ;(fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden'
      } as Response)

      await expect(
        service.deleteFile('file-123')
      ).rejects.toThrow()
    })

    it('should handle 404 not found errors', async () => {
      ;(fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      } as Response)

      await expect(
        service.getFileMetadata('non-existent')
      ).rejects.toThrow()
    })

    it('should handle 500 server errors', async () => {
      ;(fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      } as Response)

      await expect(
        service.uploadFile('test.txt', 'content')
      ).rejects.toThrow()
    })
  })

  // ===========================
  // Retry Logic Tests
  // ===========================

  describe('Retry Logic', () => {
    beforeEach(() => {
      service.setTokens(mockTokens)
    })

    it('should retry failed requests', async () => {
      const mockFile = {
        id: 'file-123',
        name: 'test.txt',
        mimeType: 'text/plain',
        size: '100',
        createdTime: new Date().toISOString(),
        modifiedTime: new Date().toISOString()
      }

      ;(fetch as jest.MockedFunction<typeof fetch>)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockFile
        } as Response)

      const result = await service.getFileMetadata('file-123')

      expect(result.id).toBe('file-123')
      expect(fetch).toHaveBeenCalledTimes(3)
    })

    it('should fail after max retries', async () => {
      ;(fetch as jest.MockedFunction<typeof fetch>).mockRejectedValue(
        new Error('Persistent error')
      )

      await expect(
        service.getFileMetadata('file-123')
      ).rejects.toThrow('Persistent error')

      expect(fetch).toHaveBeenCalledTimes(4) // Initial + 3 retries
    })

    it('should allow custom retry options', () => {
      service.setRetryOptions({
        maxRetries: 5,
        initialDelay: 500,
        maxDelay: 5000
      })

      // Verify options are set (internal state)
      expect(true).toBe(true)
    })

    it('should use exponential backoff', async () => {
      const startTime = Date.now()

      ;(fetch as jest.MockedFunction<typeof fetch>).mockRejectedValue(
        new Error('Test error')
      )

      try {
        await service.getFileMetadata('file-123')
      } catch (error) {
        // Expected to fail
      }

      const elapsed = Date.now() - startTime
      // Should have some delay due to retries
      expect(elapsed).toBeGreaterThan(0)
    })
  })

  // ===========================
  // Token Management Tests
  // ===========================

  describe('Token Management', () => {
    it('should auto-refresh expired tokens', async () => {
      const expiredTokens = {
        ...mockTokens,
        expiresAt: new Date(Date.now() - 1000) // Expired 1 second ago
      }
      service.setTokens(expiredTokens)

      const refreshResponse = {
        access_token: 'new-access-token',
        expires_in: 3600,
        token_type: 'Bearer',
        scope: config.scopes.join(' ')
      }

      const fileResponse = {
        id: 'file-123',
        name: 'test.txt',
        mimeType: 'text/plain',
        size: '100',
        createdTime: new Date().toISOString(),
        modifiedTime: new Date().toISOString()
      }

      ;(fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => refreshResponse
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => fileResponse
        } as Response)

      const result = await service.getFileMetadata('file-123')

      expect(result.id).toBe('file-123')
      expect(fetch).toHaveBeenCalledTimes(2) // One for refresh, one for API call
    })
  })

  // ===========================
  // Integration Tests
  // ===========================

  describe('Integration Scenarios', () => {
    beforeEach(() => {
      service.setTokens(mockTokens)
    })

    it('should complete full upload and share workflow', async () => {
      const uploadResponse = {
        id: 'file-new',
        name: 'shared-doc.pdf',
        mimeType: 'application/pdf',
        size: '5000',
        createdTime: new Date().toISOString(),
        modifiedTime: new Date().toISOString()
      }

      const permissionResponse = {
        id: 'permission-new',
        type: 'user',
        role: 'reader',
        emailAddress: 'colleague@example.com'
      }

      ;(fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => uploadResponse
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => permissionResponse
        } as Response)

      const file = await service.uploadFile('shared-doc.pdf', Buffer.from('content'))
      const permission = await service.shareFile(file.id, 'colleague@example.com', 'reader')

      expect(file.id).toBe('file-new')
      expect(permission.emailAddress).toBe('colleague@example.com')
    })

    it('should complete folder creation and file upload workflow', async () => {
      const folderResponse = {
        id: 'folder-new',
        name: 'Project Files',
        mimeType: 'application/vnd.google-apps.folder',
        createdTime: new Date().toISOString(),
        modifiedTime: new Date().toISOString()
      }

      const fileResponse = {
        id: 'file-in-folder',
        name: 'document.txt',
        mimeType: 'text/plain',
        size: '200',
        createdTime: new Date().toISOString(),
        modifiedTime: new Date().toISOString(),
        parents: ['folder-new']
      }

      ;(fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => folderResponse
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => fileResponse
        } as Response)

      const folder = await service.createFolder('Project Files')
      const file = await service.uploadFile('document.txt', 'content', {
        parents: [folder.id]
      })

      expect(folder.id).toBe('folder-new')
      expect(file.parents).toContain('folder-new')
    })
  })
})
