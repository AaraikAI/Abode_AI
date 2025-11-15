/**
 * Google Drive Integration Service
 *
 * Manages file uploads, downloads, folder synchronization, and permissions
 */

export interface GoogleDriveConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
  scopes: string[]
}

export interface OAuthTokens {
  accessToken: string
  refreshToken: string
  expiresAt: Date
  tokenType: string
  scope: string
}

export interface DriveFile {
  id: string
  name: string
  mimeType: string
  size: number
  createdTime: Date
  modifiedTime: Date
  parents?: string[]
  webViewLink?: string
  webContentLink?: string
  thumbnailLink?: string
  permissions?: DrivePermission[]
  metadata?: Record<string, any>
}

export interface DriveFolder {
  id: string
  name: string
  parents?: string[]
  createdTime: Date
  modifiedTime: Date
  childCount?: number
  webViewLink?: string
}

export interface DrivePermission {
  id: string
  type: 'user' | 'group' | 'domain' | 'anyone'
  role: 'owner' | 'organizer' | 'fileOrganizer' | 'writer' | 'commenter' | 'reader'
  emailAddress?: string
  domain?: string
  displayName?: string
  photoLink?: string
  expirationTime?: Date
}

export interface UploadOptions {
  folderId?: string
  mimeType?: string
  description?: string
  metadata?: Record<string, any>
  parents?: string[]
  useResumableUpload?: boolean
  onProgress?: (progress: number) => void
}

export interface DownloadOptions {
  destination?: string
  mimeType?: string
  onProgress?: (progress: number) => void
}

export interface SyncOptions {
  localPath: string
  remoteFolderId: string
  direction: 'upload' | 'download' | 'bidirectional'
  deleteRemoved: boolean
  ignorePatterns?: string[]
}

export interface SyncResult {
  uploaded: number
  downloaded: number
  deleted: number
  skipped: number
  errors: Array<{ file: string; error: string }>
  duration: number
}

export interface RetryOptions {
  maxRetries: number
  initialDelay: number
  maxDelay: number
  backoffMultiplier: number
}

export class GoogleDriveService {
  private config: GoogleDriveConfig
  private tokens: OAuthTokens | null = null
  private retryOptions: RetryOptions

  constructor(config: GoogleDriveConfig) {
    this.config = config
    this.retryOptions = {
      maxRetries: 3,
      initialDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2
    }
  }

  // ===========================
  // OAuth Flow
  // ===========================

  /**
   * Get OAuth authorization URL
   */
  getAuthorizationUrl(state?: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: this.config.scopes.join(' '),
      access_type: 'offline',
      prompt: 'consent',
      ...(state && { state })
    })

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeAuthorizationCode(code: string): Promise<OAuthTokens> {
    const response = await this.retryRequest(async () => {
      const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          redirect_uri: this.config.redirectUri,
          grant_type: 'authorization_code'
        })
      })

      if (!res.ok) {
        throw new Error(`OAuth token exchange failed: ${res.status} ${res.statusText}`)
      }

      return res.json()
    })

    this.tokens = this.parseTokenResponse(response)
    return this.tokens
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(): Promise<OAuthTokens> {
    if (!this.tokens?.refreshToken) {
      throw new Error('No refresh token available')
    }

    const response = await this.retryRequest(async () => {
      const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          refresh_token: this.tokens!.refreshToken,
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          grant_type: 'refresh_token'
        })
      })

      if (!res.ok) {
        throw new Error(`Token refresh failed: ${res.status} ${res.statusText}`)
      }

      return res.json()
    })

    this.tokens = {
      ...this.tokens,
      ...this.parseTokenResponse(response)
    }

    return this.tokens
  }

  /**
   * Set tokens manually (for testing or pre-existing tokens)
   */
  setTokens(tokens: OAuthTokens): void {
    this.tokens = tokens
  }

  /**
   * Check if access token is expired
   */
  private isTokenExpired(): boolean {
    if (!this.tokens) return true
    return new Date() >= this.tokens.expiresAt
  }

  /**
   * Ensure valid access token
   */
  private async ensureValidToken(): Promise<void> {
    if (this.isTokenExpired()) {
      await this.refreshAccessToken()
    }
  }

  // ===========================
  // File Upload
  // ===========================

  /**
   * Upload file to Google Drive
   */
  async uploadFile(
    fileName: string,
    content: Buffer | string,
    options: UploadOptions = {}
  ): Promise<DriveFile> {
    await this.ensureValidToken()

    const metadata = {
      name: fileName,
      ...(options.mimeType && { mimeType: options.mimeType }),
      ...(options.description && { description: options.description }),
      ...(options.parents && { parents: options.parents }),
      ...(options.metadata && { properties: options.metadata })
    }

    if (options.useResumableUpload && content.length > 5 * 1024 * 1024) {
      return this.resumableUpload(fileName, content, metadata, options)
    }

    return this.simpleUpload(content, metadata)
  }

  /**
   * Simple upload for small files
   */
  private async simpleUpload(
    content: Buffer | string,
    metadata: any
  ): Promise<DriveFile> {
    const boundary = '-------314159265358979323846'
    const delimiter = `\r\n--${boundary}\r\n`
    const closeDelimiter = `\r\n--${boundary}--`

    const body =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: ' + (metadata.mimeType || 'application/octet-stream') + '\r\n\r\n' +
      content +
      closeDelimiter

    const response = await this.retryRequest(async () => {
      const res = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.tokens!.accessToken}`,
            'Content-Type': `multipart/related; boundary=${boundary}`
          },
          body
        }
      )

      if (!res.ok) {
        throw new Error(`File upload failed: ${res.status} ${res.statusText}`)
      }

      return res.json()
    })

    return this.parseDriveFile(response)
  }

  /**
   * Resumable upload for large files
   */
  private async resumableUpload(
    fileName: string,
    content: Buffer | string,
    metadata: any,
    options: UploadOptions
  ): Promise<DriveFile> {
    // Initiate resumable upload session
    const sessionResponse = await this.retryRequest(async () => {
      const res = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.tokens!.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(metadata)
        }
      )

      if (!res.ok) {
        throw new Error(`Resumable upload init failed: ${res.status} ${res.statusText}`)
      }

      return { location: res.headers.get('Location')! }
    })

    const uploadUrl = sessionResponse.location
    const contentBuffer = Buffer.isBuffer(content) ? content : Buffer.from(content)
    const chunkSize = 256 * 1024 // 256KB chunks
    let uploadedBytes = 0

    // Upload in chunks
    while (uploadedBytes < contentBuffer.length) {
      const chunk = contentBuffer.slice(uploadedBytes, uploadedBytes + chunkSize)
      const endByte = Math.min(uploadedBytes + chunk.length, contentBuffer.length)

      const response = await this.retryRequest(async () => {
        const res = await fetch(uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Length': chunk.length.toString(),
            'Content-Range': `bytes ${uploadedBytes}-${endByte - 1}/${contentBuffer.length}`
          },
          body: chunk
        })

        if (res.status === 308) {
          // Resume incomplete
          return { incomplete: true }
        }

        if (!res.ok && res.status !== 200 && res.status !== 201) {
          throw new Error(`Chunk upload failed: ${res.status} ${res.statusText}`)
        }

        return res.json()
      })

      uploadedBytes = endByte

      if (options.onProgress) {
        options.onProgress((uploadedBytes / contentBuffer.length) * 100)
      }

      if (!response.incomplete) {
        return this.parseDriveFile(response)
      }
    }

    throw new Error('Upload completed but no file metadata returned')
  }

  // ===========================
  // File Download
  // ===========================

  /**
   * Download file from Google Drive
   */
  async downloadFile(fileId: string, options: DownloadOptions = {}): Promise<Buffer> {
    await this.ensureValidToken()

    const url = options.mimeType
      ? `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=${encodeURIComponent(options.mimeType)}`
      : `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`

    const response = await this.retryRequest(async () => {
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.tokens!.accessToken}`
        }
      })

      if (!res.ok) {
        throw new Error(`File download failed: ${res.status} ${res.statusText}`)
      }

      return res.arrayBuffer()
    })

    return Buffer.from(response)
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(
    fileId: string,
    fields?: string[]
  ): Promise<DriveFile> {
    await this.ensureValidToken()

    const fieldsParam = fields?.join(',') || '*'
    const response = await this.retryRequest(async () => {
      const res = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?fields=${fieldsParam}`,
        {
          headers: {
            'Authorization': `Bearer ${this.tokens!.accessToken}`
          }
        }
      )

      if (!res.ok) {
        throw new Error(`Get metadata failed: ${res.status} ${res.statusText}`)
      }

      return res.json()
    })

    return this.parseDriveFile(response)
  }

  /**
   * List files in folder
   */
  async listFiles(
    folderId?: string,
    query?: string,
    pageSize: number = 100
  ): Promise<DriveFile[]> {
    await this.ensureValidToken()

    let q = query || ''
    if (folderId) {
      q += (q ? ' and ' : '') + `'${folderId}' in parents`
    }

    const params = new URLSearchParams({
      pageSize: pageSize.toString(),
      fields: 'files(id,name,mimeType,size,createdTime,modifiedTime,parents,webViewLink)',
      ...(q && { q })
    })

    const response = await this.retryRequest(async () => {
      const res = await fetch(
        `https://www.googleapis.com/drive/v3/files?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${this.tokens!.accessToken}`
          }
        }
      )

      if (!res.ok) {
        throw new Error(`List files failed: ${res.status} ${res.statusText}`)
      }

      return res.json()
    })

    return response.files.map((file: any) => this.parseDriveFile(file))
  }

  /**
   * Delete file
   */
  async deleteFile(fileId: string): Promise<void> {
    await this.ensureValidToken()

    await this.retryRequest(async () => {
      const res = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${this.tokens!.accessToken}`
          }
        }
      )

      if (!res.ok && res.status !== 204) {
        throw new Error(`Delete file failed: ${res.status} ${res.statusText}`)
      }

      return {}
    })
  }

  // ===========================
  // Folder Management
  // ===========================

  /**
   * Create folder
   */
  async createFolder(
    name: string,
    parentId?: string
  ): Promise<DriveFolder> {
    await this.ensureValidToken()

    const metadata = {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      ...(parentId && { parents: [parentId] })
    }

    const response = await this.retryRequest(async () => {
      const res = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.tokens!.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(metadata)
      })

      if (!res.ok) {
        throw new Error(`Create folder failed: ${res.status} ${res.statusText}`)
      }

      return res.json()
    })

    return this.parseDriveFolder(response)
  }

  /**
   * Synchronize local folder with Drive
   */
  async syncFolder(options: SyncOptions): Promise<SyncResult> {
    const startTime = Date.now()
    const result: SyncResult = {
      uploaded: 0,
      downloaded: 0,
      deleted: 0,
      skipped: 0,
      errors: [],
      duration: 0
    }

    try {
      // This is a simplified implementation
      // In production, you would use fs to scan local files
      console.log(`Syncing ${options.localPath} with ${options.remoteFolderId}`)
      console.log(`Direction: ${options.direction}`)

      if (options.direction === 'upload' || options.direction === 'bidirectional') {
        // Upload logic would go here
        result.uploaded = 0
      }

      if (options.direction === 'download' || options.direction === 'bidirectional') {
        // Download logic would go here
        result.downloaded = 0
      }

      result.duration = Date.now() - startTime
      return result
    } catch (error) {
      result.errors.push({
        file: options.localPath,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      result.duration = Date.now() - startTime
      return result
    }
  }

  // ===========================
  // Permission Management
  // ===========================

  /**
   * Share file with user or group
   */
  async shareFile(
    fileId: string,
    emailAddress: string,
    role: DrivePermission['role'],
    sendNotificationEmail: boolean = true
  ): Promise<DrivePermission> {
    await this.ensureValidToken()

    const permission = {
      type: 'user',
      role,
      emailAddress
    }

    const response = await this.retryRequest(async () => {
      const res = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}/permissions?sendNotificationEmail=${sendNotificationEmail}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.tokens!.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(permission)
        }
      )

      if (!res.ok) {
        throw new Error(`Share file failed: ${res.status} ${res.statusText}`)
      }

      return res.json()
    })

    return this.parseDrivePermission(response)
  }

  /**
   * Make file public
   */
  async makePublic(fileId: string): Promise<DrivePermission> {
    await this.ensureValidToken()

    const permission = {
      type: 'anyone',
      role: 'reader'
    }

    const response = await this.retryRequest(async () => {
      const res = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.tokens!.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(permission)
        }
      )

      if (!res.ok) {
        throw new Error(`Make public failed: ${res.status} ${res.statusText}`)
      }

      return res.json()
    })

    return this.parseDrivePermission(response)
  }

  /**
   * List file permissions
   */
  async listPermissions(fileId: string): Promise<DrivePermission[]> {
    await this.ensureValidToken()

    const response = await this.retryRequest(async () => {
      const res = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`,
        {
          headers: {
            'Authorization': `Bearer ${this.tokens!.accessToken}`
          }
        }
      )

      if (!res.ok) {
        throw new Error(`List permissions failed: ${res.status} ${res.statusText}`)
      }

      return res.json()
    })

    return response.permissions.map((p: any) => this.parseDrivePermission(p))
  }

  /**
   * Remove permission
   */
  async removePermission(fileId: string, permissionId: string): Promise<void> {
    await this.ensureValidToken()

    await this.retryRequest(async () => {
      const res = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}/permissions/${permissionId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${this.tokens!.accessToken}`
          }
        }
      )

      if (!res.ok && res.status !== 204) {
        throw new Error(`Remove permission failed: ${res.status} ${res.statusText}`)
      }

      return {}
    })
  }

  // ===========================
  // Retry Logic
  // ===========================

  /**
   * Execute request with retry logic
   */
  private async retryRequest<T>(
    fn: () => Promise<T>,
    retryCount: number = 0
  ): Promise<T> {
    try {
      return await fn()
    } catch (error) {
      if (retryCount >= this.retryOptions.maxRetries) {
        throw error
      }

      // Calculate exponential backoff delay
      const delay = Math.min(
        this.retryOptions.initialDelay * Math.pow(this.retryOptions.backoffMultiplier, retryCount),
        this.retryOptions.maxDelay
      )

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay))

      // Retry the request
      return this.retryRequest(fn, retryCount + 1)
    }
  }

  /**
   * Set retry options
   */
  setRetryOptions(options: Partial<RetryOptions>): void {
    this.retryOptions = { ...this.retryOptions, ...options }
  }

  // ===========================
  // Helper Methods
  // ===========================

  private parseTokenResponse(response: any): OAuthTokens {
    return {
      accessToken: response.access_token,
      refreshToken: response.refresh_token || this.tokens?.refreshToken || '',
      expiresAt: new Date(Date.now() + response.expires_in * 1000),
      tokenType: response.token_type,
      scope: response.scope
    }
  }

  private parseDriveFile(file: any): DriveFile {
    return {
      id: file.id,
      name: file.name,
      mimeType: file.mimeType,
      size: parseInt(file.size || '0', 10),
      createdTime: new Date(file.createdTime),
      modifiedTime: new Date(file.modifiedTime),
      parents: file.parents,
      webViewLink: file.webViewLink,
      webContentLink: file.webContentLink,
      thumbnailLink: file.thumbnailLink,
      permissions: file.permissions?.map((p: any) => this.parseDrivePermission(p)),
      metadata: file.properties
    }
  }

  private parseDriveFolder(folder: any): DriveFolder {
    return {
      id: folder.id,
      name: folder.name,
      parents: folder.parents,
      createdTime: new Date(folder.createdTime),
      modifiedTime: new Date(folder.modifiedTime),
      webViewLink: folder.webViewLink
    }
  }

  private parseDrivePermission(permission: any): DrivePermission {
    return {
      id: permission.id,
      type: permission.type,
      role: permission.role,
      emailAddress: permission.emailAddress,
      domain: permission.domain,
      displayName: permission.displayName,
      photoLink: permission.photoLink,
      expirationTime: permission.expirationTime ? new Date(permission.expirationTime) : undefined
    }
  }
}
