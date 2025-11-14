/**
 * IFC/BIM Export API Endpoint
 *
 * Exports scene data to IFC format
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs/promises'
import { v4 as uuidv4 } from 'uuid'

export const maxDuration = 300 // 5 minutes for large exports

interface IFCExportRequest {
  projectId: string
  sceneData: {
    project?: {
      name: string
      description?: string
      address?: string
    }
    site?: {
      name: string
      location?: {
        latitude: number
        longitude: number
        elevation?: number
      }
    }
    building?: {
      name: string
      numStoreys?: number
      elevationAboveGround?: number
    }
    objects: Array<{
      id: string
      type: string
      name?: string
      position: [number, number, number]
      rotation: [number, number, number]
      scale: [number, number, number]
      geometry?: {
        type: 'box' | 'cylinder' | 'mesh'
        dimensions?: any
        vertices?: number[][]
        faces?: number[][]
      }
      material?: string
      properties?: Record<string, any>
    }>
    materials?: Array<{
      name: string
      color?: [number, number, number, number]
      properties?: Record<string, any>
    }>
  }
  schema?: 'IFC2X3' | 'IFC4'
  includeGeometry?: boolean
  includeProperties?: boolean
}

interface IFCExportResponse {
  success: boolean
  exportId: string
  downloadUrl?: string
  error?: string
}

/**
 * Execute IFC export via Python service
 */
async function executeIFCExport(
  exportId: string,
  sceneData: any,
  schema: string = 'IFC4'
): Promise<{ success: boolean; outputPath?: string; error?: string }> {
  return new Promise((resolve) => {
    const pythonScript = path.join(process.cwd(), 'lib/services/ifc-bim-integration.py')
    const outputPath = path.join('/tmp', `ifc_export_${exportId}.ifc`)

    // Write scene data to temp file
    const sceneDataPath = path.join('/tmp', `scene_data_${exportId}.json`)

    fs.writeFile(sceneDataPath, JSON.stringify(sceneData, null, 2))
      .then(() => {
        const pythonProcess = spawn('python3', [
          pythonScript,
          'export',
          sceneDataPath,
          outputPath,
          schema
        ])

        let stdout = ''
        let stderr = ''

        pythonProcess.stdout.on('data', (data) => {
          stdout += data.toString()
        })

        pythonProcess.stderr.on('data', (data) => {
          stderr += data.toString()
          console.error('IFC export error:', data.toString())
        })

        pythonProcess.on('close', async (code) => {
          // Clean up scene data file
          await fs.unlink(sceneDataPath).catch(() => {})

          if (code === 0) {
            resolve({
              success: true,
              outputPath
            })
          } else {
            resolve({
              success: false,
              error: stderr || 'IFC export process failed'
            })
          }
        })

        pythonProcess.on('error', async (error) => {
          await fs.unlink(sceneDataPath).catch(() => {})
          resolve({
            success: false,
            error: error.message
          })
        })
      })
      .catch((error) => {
        resolve({
          success: false,
          error: `Failed to write scene data: ${error.message}`
        })
      })
  })
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const exportRequest = await request.json() as IFCExportRequest

    // Validate request
    if (!exportRequest.projectId || !exportRequest.sceneData) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, sceneData' },
        { status: 400 }
      )
    }

    if (!exportRequest.sceneData.objects || exportRequest.sceneData.objects.length === 0) {
      return NextResponse.json(
        { error: 'Scene data must contain at least one object' },
        { status: 400 }
      )
    }

    // Get user's organization
    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json(
        { error: 'User not associated with any organization' },
        { status: 403 }
      )
    }

    // Verify project access
    const { data: project } = await supabase
      .from('projects')
      .select('id, name')
      .eq('id', exportRequest.projectId)
      .eq('org_id', membership.organization_id)
      .single()

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      )
    }

    const exportId = uuidv4()
    const schema = exportRequest.schema || 'IFC4'

    console.log(`Exporting to IFC (${schema}): ${exportRequest.sceneData.objects.length} objects`)

    // Prepare scene data with defaults
    const sceneData = {
      project: exportRequest.sceneData.project || {
        name: project.name,
        description: `Exported from Abode AI - ${new Date().toISOString()}`
      },
      site: exportRequest.sceneData.site || {
        name: 'Default Site'
      },
      building: exportRequest.sceneData.building || {
        name: 'Default Building',
        numStoreys: 1
      },
      objects: exportRequest.sceneData.objects,
      materials: exportRequest.sceneData.materials || []
    }

    // Execute IFC export
    const result = await executeIFCExport(exportId, sceneData, schema)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'IFC export failed' },
        { status: 400 }
      )
    }

    // Read exported file
    const fileBuffer = await fs.readFile(result.outputPath!)
    const fileName = `${exportId}_${project.name.replace(/[^a-z0-9]/gi, '_')}.ifc`

    // Upload to Supabase Storage
    const storageFileName = `${exportRequest.projectId}/${fileName}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('ifc-files')
      .upload(storageFileName, fileBuffer, {
        contentType: 'application/ifc',
        upsert: false
      })

    // Clean up temp file
    await fs.unlink(result.outputPath!).catch(() => {})

    if (uploadError) {
      console.error('Failed to upload IFC file:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload IFC file' },
        { status: 500 }
      )
    }

    const { data: { publicUrl } } = supabase.storage
      .from('ifc-files')
      .getPublicUrl(storageFileName)

    // Store export record in database
    const { error: dbError } = await supabase
      .from('ifc_exports')
      .insert({
        id: exportId,
        project_id: exportRequest.projectId,
        org_id: membership.organization_id,
        user_id: user.id,
        file_name: fileName,
        file_size: fileBuffer.length,
        file_url: publicUrl,
        schema,
        object_count: exportRequest.sceneData.objects.length,
        exported_at: new Date().toISOString()
      })

    if (dbError) {
      console.error('Failed to store export record:', dbError)
      // Don't fail the request - file was exported successfully
    }

    // Return success response
    const response: IFCExportResponse = {
      success: true,
      exportId,
      downloadUrl: publicUrl
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('IFC export API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET - Retrieve IFC export data
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const exportId = searchParams.get('exportId')
    const projectId = searchParams.get('projectId')

    // Get specific export
    if (exportId) {
      const { data: exportRecord, error } = await supabase
        .from('ifc_exports')
        .select('*')
        .eq('id', exportId)
        .eq('user_id', user.id)
        .single()

      if (error || !exportRecord) {
        return NextResponse.json(
          { error: 'Export not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        data: exportRecord
      })
    }

    // Get all exports for a project
    if (projectId) {
      const { data: exports, error } = await supabase
        .from('ifc_exports')
        .select('id, file_name, file_size, schema, object_count, exported_at, file_url')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .order('exported_at', { ascending: false })

      if (error) {
        console.error('Failed to fetch exports:', error)
        return NextResponse.json(
          { error: 'Failed to fetch exports' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        data: exports
      })
    }

    return NextResponse.json(
      { error: 'Missing required parameter: exportId OR projectId' },
      { status: 400 }
    )
  } catch (error) {
    console.error('IFC export GET API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
