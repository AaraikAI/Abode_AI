import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png']

interface UploadedFile {
  id: string
  projectId: string
  originalName: string
  fileName: string
  fileType: string
  fileSize: number
  url: string
  pages?: number
  uploadedBy: string
  uploadedAt: string
}

export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { projectId } = params
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}` },
        { status: 400 }
      )
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid MIME type. Allowed: ${ALLOWED_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size: 50MB` },
        { status: 400 }
      )
    }

    // Verify project ownership
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, org_id')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Check user has access to this org
    const { data: membership } = await supabase
      .from('user_organization_memberships')
      .select('roles')
      .eq('user_id', session.user.id)
      .eq('organization_id', project.org_id)
      .single()

    if (!membership) {
      return NextResponse.json(
        { error: 'Forbidden - No access to this project' },
        { status: 403 }
      )
    }

    // Upload to Supabase Storage
    const fileName = `${projectId}/${Date.now()}-${file.name}`
    const fileBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(fileBuffer)

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('project-files')
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('project-files')
      .getPublicUrl(fileName)

    // Get page count for PDFs (placeholder - would need PDF.js)
    let pages: number | undefined
    if (file.type === 'application/pdf') {
      pages = 1 // TODO: Implement actual PDF page counting
    }

    // Create database record
    const { data: fileRecord, error: dbError } = await supabase
      .from('project_files')
      .insert({
        project_id: projectId,
        original_name: file.name,
        file_name: fileName,
        file_type: file.type,
        file_size: file.size,
        url: urlData.publicUrl,
        pages,
        uploaded_by: session.user.id,
        uploaded_at: new Date().toISOString()
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      // Clean up uploaded file
      await supabase.storage.from('project-files').remove([fileName])

      return NextResponse.json(
        { error: 'Failed to save file record' },
        { status: 500 }
      )
    }

    // Log audit event
    await supabase.from('compliance_audit_events').insert({
      org_id: project.org_id,
      actor: session.user.id,
      action: 'file.uploaded',
      resource: `project:${projectId}`,
      metadata: {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      }
    })

    const result: UploadedFile = {
      id: fileRecord.id,
      projectId,
      originalName: file.name,
      fileName,
      fileType: file.type,
      fileSize: file.size,
      url: urlData.publicUrl,
      pages,
      uploadedBy: session.user.id!,
      uploadedAt: new Date().toISOString()
    }

    return NextResponse.json(result, { status: 201 })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { projectId } = params

    // Get all files for this project
    const { data: files, error } = await supabase
      .from('project_files')
      .select('*')
      .eq('project_id', projectId)
      .order('uploaded_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch files' },
        { status: 500 }
      )
    }

    return NextResponse.json({ files })

  } catch (error) {
    console.error('Fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
