/**
 * Model Library API - File Upload
 * Handles multipart/form-data uploads for 3D model files
 */

import { NextRequest, NextResponse } from 'next/server'
import { createModel } from '@/lib/data/model-library'
import { requireSession } from '@/lib/auth/session'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Allowed 3D model file extensions
const ALLOWED_EXTENSIONS = ['glb', 'gltf', 'fbx', 'obj', 'usdz', 'dae', 'stl', '3ds', 'blend']
const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB

/**
 * POST /api/models/upload
 * Upload a 3D model file with metadata
 */
export async function POST(request: NextRequest) {
  try {
    // Require authentication for uploads
    const session = await requireSession({ request })
    const userId = session.user?.id

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const formData = await request.formData()

    // Extract file
    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds maximum of ${MAX_FILE_SIZE / (1024 * 1024)}MB` },
        { status: 400 }
      )
    }

    // Validate file type
    const fileName = file.name.toLowerCase()
    const fileExtension = fileName.split('.').pop()

    if (!fileExtension || !ALLOWED_EXTENSIONS.includes(fileExtension)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}` },
        { status: 400 }
      )
    }

    // Extract metadata from form
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const category = formData.get('category') as string
    const subcategory = formData.get('subcategory') as string
    const tagsStr = formData.get('tags') as string
    const styleStr = formData.get('style') as string
    const materialsStr = formData.get('materials') as string
    const license = formData.get('license') as 'free' | 'pro' | 'enterprise'
    const author = formData.get('author') as string

    // Parse dimensions
    const dimensionsStr = formData.get('dimensions') as string
    let dimensions
    try {
      dimensions = dimensionsStr ? JSON.parse(dimensionsStr) : {
        width: 1,
        height: 1,
        depth: 1,
        unit: 'meters' as const
      }
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid dimensions format' },
        { status: 400 }
      )
    }

    // Validate required fields
    if (!name || !category || !subcategory) {
      return NextResponse.json(
        { error: 'Name, category, and subcategory are required' },
        { status: 400 }
      )
    }

    if (license && !['free', 'pro', 'enterprise'].includes(license)) {
      return NextResponse.json(
        { error: 'Invalid license type' },
        { status: 400 }
      )
    }

    // Parse arrays
    const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()) : []
    const style = styleStr ? styleStr.split(',').map(s => s.trim()) : []
    const materials = materialsStr ? materialsStr.split(',').map(m => m.trim()) : []

    // Upload file to Supabase Storage
    const timestamp = Date.now()
    const storagePath = `models/${userId}/${timestamp}_${fileName}`

    const fileBuffer = await file.arrayBuffer()
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('model-library')
      .upload(storagePath, fileBuffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: false
      })

    if (uploadError) {
      console.error('File upload error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      )
    }

    // Get public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from('model-library')
      .getPublicUrl(storagePath)

    const modelUrl = urlData.publicUrl

    // Upload thumbnail if provided
    const thumbnail = formData.get('thumbnail') as File | null
    let thumbnailUrl = `https://placeholder.com/models/${timestamp}.jpg`

    if (thumbnail) {
      const thumbnailPath = `thumbnails/${userId}/${timestamp}_${thumbnail.name}`
      const thumbnailBuffer = await thumbnail.arrayBuffer()

      const { error: thumbError } = await supabase.storage
        .from('model-library')
        .upload(thumbnailPath, thumbnailBuffer, {
          contentType: thumbnail.type || 'image/jpeg',
          upsert: false
        })

      if (!thumbError) {
        const { data: thumbUrlData } = supabase.storage
          .from('model-library')
          .getPublicUrl(thumbnailPath)
        thumbnailUrl = thumbUrlData.publicUrl
      }
    }

    // Extract additional metadata
    const polyCount = parseInt(formData.get('poly_count') as string) || 10000
    const hasTextures = formData.get('has_textures') === 'true'

    // Create model record in database
    const modelData = {
      name,
      description: description || '',
      category,
      subcategory,
      tags,
      thumbnail_url: thumbnailUrl,
      model_url: modelUrl,
      dimensions,
      poly_count: polyCount,
      file_size: file.size,
      has_textures: hasTextures,
      materials,
      style,
      license: license || 'free',
      author: author || session.user?.name || 'Anonymous'
    }

    const model = await createModel(modelData)

    return NextResponse.json({
      success: true,
      model,
      message: 'Model uploaded successfully'
    }, { status: 201 })

  } catch (error: any) {
    console.error('Upload model error:', error)

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to upload model' },
      { status: 500 }
    )
  }
}
