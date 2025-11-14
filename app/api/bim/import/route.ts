/**
 * IFC/BIM Import API Endpoint
 *
 * Imports IFC files and extracts building data
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs/promises'
import { v4 as uuidv4 } from 'uuid'

export const maxDuration = 300 // 5 minutes for large IFC files

interface IFCImportResponse {
  success: boolean
  importId: string
  data?: {
    project: any
    site: any
    building: any
    objects: any[]
    materials: any[]
    spaces: any[]
    properties: any[]
  }
  error?: string
}

/**
 * Execute IFC import via Python service
 */
async function executeIFCImport(
  filePath: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  return new Promise((resolve) => {
    const pythonScript = path.join(process.cwd(), 'lib/services/ifc-bim-integration.py')

    const pythonProcess = spawn('python3', [pythonScript, 'import', filePath])

    let stdout = ''
    let stderr = ''

    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString()
    })

    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString()
      console.error('IFC import error:', data.toString())
    })

    pythonProcess.on('close', (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(stdout)
          resolve({
            success: true,
            data: result
          })
        } catch (e) {
          resolve({
            success: false,
            error: 'Failed to parse IFC import output'
          })
        }
      } else {
        resolve({
          success: false,
          error: stderr || 'IFC import process failed'
        })
      }
    })

    pythonProcess.on('error', (error) => {
      resolve({
        success: false,
        error: error.message
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

    // Parse multipart form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const projectId = formData.get('projectId') as string

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!projectId) {
      return NextResponse.json(
        { error: 'Missing projectId' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = [
      'application/x-step',
      'application/ifc',
      'model/ifc',
      'application/octet-stream' // IFC files often have this MIME type
    ]

    const fileName = file.name.toLowerCase()
    if (!fileName.endsWith('.ifc') && !allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only IFC files are supported.' },
        { status: 400 }
      )
    }

    // Validate file size (max 100MB for IFC files)
    const MAX_FILE_SIZE = 100 * 1024 * 1024
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size: 100MB' },
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
      .select('id')
      .eq('id', projectId)
      .eq('org_id', membership.organization_id)
      .single()

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      )
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Save to temporary file
    const importId = uuidv4()
    const tempFilePath = path.join('/tmp', `ifc_${importId}.ifc`)
    await fs.writeFile(tempFilePath, buffer)

    console.log(`Importing IFC file: ${file.name} (${file.size} bytes)`)

    // Execute IFC import
    const result = await executeIFCImport(tempFilePath)

    // Clean up temp file
    await fs.unlink(tempFilePath).catch(() => {})

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'IFC import failed' },
        { status: 400 }
      )
    }

    // Upload original file to Supabase Storage
    const storageFileName = `${projectId}/${importId}_${file.name}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('ifc-files')
      .upload(storageFileName, buffer, {
        contentType: 'application/ifc',
        upsert: false
      })

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

    // Store import record in database
    const { data: importRecord, error: dbError } = await supabase
      .from('ifc_imports')
      .insert({
        id: importId,
        project_id: projectId,
        org_id: membership.organization_id,
        user_id: user.id,
        file_name: file.name,
        file_size: file.size,
        file_url: publicUrl,
        ifc_data: result.data,
        imported_at: new Date().toISOString()
      })
      .select()
      .single()

    if (dbError) {
      console.error('Failed to store import record:', dbError)
      return NextResponse.json(
        { error: 'Failed to store import data' },
        { status: 500 }
      )
    }

    // Return success response
    const response: IFCImportResponse = {
      success: true,
      importId,
      data: result.data
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('IFC import API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET - Retrieve IFC import data
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
    const importId = searchParams.get('importId')
    const projectId = searchParams.get('projectId')

    // Get specific import
    if (importId) {
      const { data: importRecord, error } = await supabase
        .from('ifc_imports')
        .select('*')
        .eq('id', importId)
        .eq('user_id', user.id)
        .single()

      if (error || !importRecord) {
        return NextResponse.json(
          { error: 'Import not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        data: importRecord
      })
    }

    // Get all imports for a project
    if (projectId) {
      const { data: imports, error } = await supabase
        .from('ifc_imports')
        .select('id, file_name, file_size, imported_at')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .order('imported_at', { ascending: false })

      if (error) {
        console.error('Failed to fetch imports:', error)
        return NextResponse.json(
          { error: 'Failed to fetch imports' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        data: imports
      })
    }

    return NextResponse.json(
      { error: 'Missing required parameter: importId OR projectId' },
      { status: 400 }
    )
  } catch (error) {
    console.error('IFC import GET API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
