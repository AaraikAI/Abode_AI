/**
 * Google Drive Integration Service
 *
 * Enables storage and retrieval of 3D models and project files in Google Drive
 */

export interface DriveConfig {
  accessToken: string
  refreshToken?: string
  clientId?: string
  clientSecret?: string
}

export interface DriveFile {
  id: string
  name: string
  mimeType: string
  size?: number
  createdTime: string
  modifiedTime: string
  webViewLink?: string
  thumbnailLink?: string
}

export interface UploadOptions {
  folderId?: string
  mimeType?: string
  description?: string
}

export class GoogleDriveIntegration {
  private config: DriveConfig
  private readonly API_BASE = 'https://www.googleapis.com/drive/v3'
  private readonly UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3'

  constructor(config: DriveConfig) {
    this.config = config
  }

  /**
   * List files from Drive
   */
  async listFiles(query?: string, pageSize: number = 10): Promise<DriveFile[]> {
    const params = new URLSearchParams({
      pageSize: pageSize.toString(),
      fields: 'files(id,name,mimeType,size,createdTime,modifiedTime,webViewLink,thumbnailLink)'
    })

    if (query) {
      params.append('q', query)
    }

    const response = await fetch(
      `${this.API_BASE}/files?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Drive API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.files || []
  }

  /**
   * Get file metadata
   */
  async getFile(fileId: string): Promise<DriveFile> {
    const response = await fetch(
      `${this.API_BASE}/files/${fileId}?fields=*`,
      {
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to get file: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Download file content
   */
  async downloadFile(fileId: string): Promise<Blob> {
    const response = await fetch(
      `${this.API_BASE}/files/${fileId}?alt=media`,
      {
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`)
    }

    return response.blob()
  }

  /**
   * Upload file to Drive
   */
  async uploadFile(
    file: File | Blob,
    name: string,
    options: UploadOptions = {}
  ): Promise<DriveFile> {
    console.log(`☁️ Uploading ${name} to Google Drive...`)

    const metadata = {
      name,
      mimeType: options.mimeType || (file as File).type,
      description: options.description,
      parents: options.folderId ? [options.folderId] : undefined
    }

    const form = new FormData()
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
    form.append('file', file)

    const response = await fetch(
      `${this.UPLOAD_BASE}/files?uploadType=multipart&fields=*`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`
        },
        body: form
      }
    )

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`)
    }

    const result = await response.json()
    console.log(`✅ Uploaded to Drive: ${result.id}`)

    return result
  }

  /**
   * Create folder
   */
  async createFolder(name: string, parentId?: string): Promise<DriveFile> {
    const metadata = {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentId ? [parentId] : undefined
    }

    const response = await fetch(
      `${this.API_BASE}/files`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(metadata)
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to create folder: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Delete file
   */
  async deleteFile(fileId: string): Promise<void> {
    const response = await fetch(
      `${this.API_BASE}/files/${fileId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`
        }
      }
    )

    if (!response.ok && response.status !== 404) {
      throw new Error(`Delete failed: ${response.statusText}`)
    }
  }

  /**
   * Share file/folder
   */
  async shareFile(
    fileId: string,
    email: string,
    role: 'reader' | 'writer' | 'commenter' = 'reader'
  ): Promise<void> {
    const permission = {
      type: 'user',
      role,
      emailAddress: email
    }

    const response = await fetch(
      `${this.API_BASE}/files/${fileId}/permissions`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(permission)
      }
    )

    if (!response.ok) {
      throw new Error(`Share failed: ${response.statusText}`)
    }
  }

  /**
   * Search for 3D model files
   */
  async searchModels(searchTerm?: string): Promise<DriveFile[]> {
    const mimeTypes = [
      'model/gltf-binary',
      'model/gltf+json',
      'model/obj',
      'model/fbx'
    ]

    let query = mimeTypes.map(mt => `mimeType='${mt}'`).join(' or ')

    if (searchTerm) {
      query += ` and name contains '${searchTerm}'`
    }

    return this.listFiles(query, 50)
  }

  /**
   * Backup project to Drive
   */
  async backupProject(projectData: any, projectName: string): Promise<DriveFile> {
    const blob = new Blob([JSON.stringify(projectData, null, 2)], {
      type: 'application/json'
    })

    return this.uploadFile(
      blob,
      `${projectName}-backup-${Date.now()}.json`,
      {
        mimeType: 'application/json',
        description: `Abode AI project backup: ${projectName}`
      }
    )
  }
}

export const googleDrive = new GoogleDriveIntegration({
  accessToken: process.env.NEXT_PUBLIC_GOOGLE_DRIVE_TOKEN || ''
})
