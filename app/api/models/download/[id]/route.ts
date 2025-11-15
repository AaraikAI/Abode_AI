/**
 * Model Library API - File Download
 * Handles model file downloads with tracking
 */

import { NextRequest, NextResponse } from 'next/server'
import { getModelById, incrementDownloads } from '@/lib/data/model-library'

/**
 * GET /api/models/download/[id]
 * Download model file and track download count
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

    // Get model details
    const model = await getModelById(id)

    if (!model) {
      return NextResponse.json(
        { error: 'Model not found' },
        { status: 404 }
      )
    }

    // Check if model URL exists
    if (!model.model_url) {
      return NextResponse.json(
        { error: 'Model file not available' },
        { status: 404 }
      )
    }

    // Increment download count asynchronously
    incrementDownloads(id).catch(err => {
      console.error('Failed to increment downloads:', err)
    })

    // For direct file download, redirect to the model URL
    // If you want to proxy the file through this endpoint, you would fetch and stream it
    const searchParams = request.nextUrl.searchParams
    const redirect = searchParams.get('redirect') !== 'false'

    if (redirect) {
      // Redirect to the actual file URL
      return NextResponse.redirect(model.model_url, 302)
    }

    // Return download information without redirecting
    return NextResponse.json({
      success: true,
      download_url: model.model_url,
      model: {
        id: model.id,
        name: model.name,
        file_size: model.file_size,
        downloads: model.downloads + 1
      }
    })

  } catch (error) {
    console.error('Download model error:', error)
    return NextResponse.json(
      { error: 'Failed to download model' },
      { status: 500 }
    )
  }
}

/**
 * HEAD /api/models/download/[id]
 * Get download information without incrementing counter
 */
export async function HEAD(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return new NextResponse(null, { status: 400 })
    }

    const model = await getModelById(id)

    if (!model || !model.model_url) {
      return new NextResponse(null, { status: 404 })
    }

    // Return headers with file information
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Length': model.file_size.toString(),
        'X-Model-Name': model.name,
        'X-Model-Downloads': model.downloads.toString()
      }
    })

  } catch (error) {
    console.error('Head download model error:', error)
    return new NextResponse(null, { status: 500 })
  }
}
