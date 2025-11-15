/**
 * Model Library API - Individual Model Operations
 * Handles GET, PUT, DELETE for individual 3D models
 */

import { NextRequest, NextResponse } from 'next/server'
import { getModelById, updateModel, deleteModel } from '@/lib/data/model-library'
import { requireSession } from '@/lib/auth/session'

/**
 * GET /api/models/[id]
 * Get model details by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { error: 'Model ID is required' },
        { status: 400 }
      )
    }

    const model = await getModelById(id)

    if (!model) {
      return NextResponse.json(
        { error: 'Model not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ model })

  } catch (error) {
    console.error('Get model error:', error)
    return NextResponse.json(
      { error: 'Failed to get model' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/models/[id]
 * Update model metadata (requires authentication)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require authentication for updates
    await requireSession({ request })

    const { id } = params

    if (!id) {
      return NextResponse.json(
        { error: 'Model ID is required' },
        { status: 400 }
      )
    }

    // Verify model exists
    const existingModel = await getModelById(id)
    if (!existingModel) {
      return NextResponse.json(
        { error: 'Model not found' },
        { status: 404 }
      )
    }

    const body = await request.json()

    // Validate and sanitize updates
    const allowedFields = [
      'name',
      'description',
      'category',
      'subcategory',
      'tags',
      'thumbnail_url',
      'dimensions',
      'poly_count',
      'file_size',
      'has_textures',
      'materials',
      'style',
      'license',
      'author'
    ]

    const updates: any = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field]
      }
    }

    // Add updated_at timestamp
    updates.updated_at = new Date().toISOString()

    // Validate required fields if present
    if (updates.name !== undefined && (!updates.name || typeof updates.name !== 'string')) {
      return NextResponse.json(
        { error: 'Name must be a non-empty string' },
        { status: 400 }
      )
    }

    if (updates.license !== undefined && !['free', 'pro', 'enterprise'].includes(updates.license)) {
      return NextResponse.json(
        { error: 'Invalid license type' },
        { status: 400 }
      )
    }

    if (updates.dimensions !== undefined) {
      const { width, height, depth, unit } = updates.dimensions
      if (!width || !height || !depth || !unit) {
        return NextResponse.json(
          { error: 'Dimensions must include width, height, depth, and unit' },
          { status: 400 }
        )
      }
      if (!['meters', 'feet', 'inches'].includes(unit)) {
        return NextResponse.json(
          { error: 'Invalid dimension unit' },
          { status: 400 }
        )
      }
    }

    const updatedModel = await updateModel(id, updates)

    return NextResponse.json({
      success: true,
      model: updatedModel
    })

  } catch (error: any) {
    console.error('Update model error:', error)

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update model' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/models/[id]
 * Delete a model (requires authentication)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require authentication for deletion
    await requireSession({ request })

    const { id } = params

    if (!id) {
      return NextResponse.json(
        { error: 'Model ID is required' },
        { status: 400 }
      )
    }

    // Verify model exists
    const existingModel = await getModelById(id)
    if (!existingModel) {
      return NextResponse.json(
        { error: 'Model not found' },
        { status: 404 }
      )
    }

    await deleteModel(id)

    return NextResponse.json({
      success: true,
      message: 'Model deleted successfully'
    })

  } catch (error: any) {
    console.error('Delete model error:', error)

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to delete model' },
      { status: 500 }
    )
  }
}
