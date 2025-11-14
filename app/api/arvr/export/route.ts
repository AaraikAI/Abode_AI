/**
 * AR/VR Export API Endpoint
 *
 * Export scenes to GLTF/GLB format for AR/VR platforms
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ARVRExportService, ARVRExportOptions, ARVRScene } from '@/lib/services/arvr-export'

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

    const body = await request.json()
    const { projectId, sceneData, options } = body as {
      projectId: string
      sceneData: ARVRScene
      options?: ARVRExportOptions
    }

    if (!projectId || !sceneData) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, sceneData' },
        { status: 400 }
      )
    }

    // Verify project access
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      )
    }

    // Initialize export service
    const exportService = new ARVRExportService()

    // Validate scene
    const validation = exportService.validateScene(sceneData)
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: 'Scene validation failed',
          errors: validation.errors,
          warnings: validation.warnings
        },
        { status: 400 }
      )
    }

    // Export to GLTF/GLB
    const exportOptions: ARVRExportOptions = {
      format: options?.format || 'glb',
      embedImages: options?.embedImages !== false,
      maxTextureSize: options?.maxTextureSize || 2048,
      draco: options?.draco || false,
      scale: options?.scale || 1.0,
      anchorType: options?.anchorType || 'floor',
      ...options
    }

    const exportedData = await exportService.exportToGLTF(sceneData, exportOptions)

    // Upload to Supabase Storage
    const fileName = `${projectId}_${Date.now()}.${exportOptions.format}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('arvr-exports')
      .upload(fileName, exportedData, {
        contentType: exportOptions.format === 'glb' ? 'model/gltf-binary' : 'model/gltf+json',
        upsert: false
      })

    if (uploadError) {
      throw new Error(`Failed to upload export: ${uploadError.message}`)
    }

    const { data: { publicUrl } } = supabase.storage
      .from('arvr-exports')
      .getPublicUrl(fileName)

    // Store export record
    await supabase
      .from('arvr_exports')
      .insert({
        project_id: projectId,
        user_id: user.id,
        format: exportOptions.format,
        file_url: publicUrl,
        file_size: exportedData.byteLength,
        scene_stats: {
          objects: sceneData.objects.length,
          lights: sceneData.lights.length
        },
        validation_warnings: validation.warnings
      })

    return NextResponse.json({
      success: true,
      downloadUrl: publicUrl,
      format: exportOptions.format,
      size: exportedData.byteLength,
      warnings: validation.warnings
    })
  } catch (error: any) {
    console.error('AR/VR export error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
