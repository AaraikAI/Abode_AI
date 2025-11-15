/**
 * Collaboration Comments API Endpoint
 *
 * Manages comments on projects and resources
 * Supports GET, POST, PUT, DELETE operations
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface Comment {
  id: string
  project_id: string
  resource_id?: string
  resource_type?: 'model' | 'document' | 'render' | 'task' | 'annotation'
  user_id: string
  content: string
  parent_id?: string | null
  mentions?: string[]
  attachments?: Array<{
    id: string
    name: string
    url: string
    type: string
    size: number
  }>
  metadata?: Record<string, any>
  position?: {
    x: number
    y: number
    z?: number
    element_id?: string
  }
  status: 'active' | 'resolved' | 'deleted'
  edited: boolean
  created_at: string
  updated_at: string
  user?: {
    id: string
    name: string
    email: string
    avatar_url?: string
  }
  replies?: Comment[]
  reply_count?: number
  reactions?: Record<string, string[]>
}

interface CreateCommentRequest {
  projectId: string
  resourceId?: string
  resourceType?: Comment['resource_type']
  content: string
  parentId?: string
  mentions?: string[]
  attachments?: Comment['attachments']
  metadata?: Record<string, any>
  position?: Comment['position']
}

interface UpdateCommentRequest {
  id: string
  content: string
  attachments?: Comment['attachments']
  metadata?: Record<string, any>
}

/**
 * GET - List comments for a project/resource
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
    const projectId = searchParams.get('projectId')
    const resourceId = searchParams.get('resourceId')
    const resourceType = searchParams.get('resourceType')
    const status = searchParams.get('status') || 'active'
    const includeReplies = searchParams.get('includeReplies') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!projectId) {
      return NextResponse.json(
        { error: 'Missing required parameter: projectId' },
        { status: 400 }
      )
    }

    // Verify user has access to project
    const { data: project } = await supabase
      .from('projects')
      .select('id, org_id')
      .eq('id', projectId)
      .single()

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Check user is member of organization
    const { data: membership } = await supabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', project.org_id)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Build query
    let query = supabase
      .from('comments')
      .select(`
        *,
        user:users!comments_user_id_fkey(id, name, email, avatar_url)
      `)
      .eq('project_id', projectId)
      .eq('status', status)
      .is('parent_id', null) // Only get top-level comments
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Filter by resource
    if (resourceId) {
      query = query.eq('resource_id', resourceId)
    }

    if (resourceType) {
      query = query.eq('resource_type', resourceType)
    }

    const { data: comments, error } = await query

    if (error) {
      console.error('Failed to fetch comments:', error)
      return NextResponse.json(
        { error: 'Failed to fetch comments' },
        { status: 500 }
      )
    }

    // Fetch replies if requested
    if (includeReplies && comments && comments.length > 0) {
      const commentIds = comments.map(c => c.id)
      const { data: replies } = await supabase
        .from('comments')
        .select(`
          *,
          user:users!comments_user_id_fkey(id, name, email, avatar_url)
        `)
        .in('parent_id', commentIds)
        .eq('status', status)
        .order('created_at', { ascending: true })

      // Group replies by parent
      const repliesMap = new Map<string, Comment[]>()
      replies?.forEach((reply) => {
        if (!repliesMap.has(reply.parent_id!)) {
          repliesMap.set(reply.parent_id!, [])
        }
        repliesMap.get(reply.parent_id!)!.push(reply as Comment)
      })

      // Attach replies to comments
      comments.forEach((comment: any) => {
        comment.replies = repliesMap.get(comment.id) || []
        comment.reply_count = comment.replies.length
      })
    } else if (comments) {
      // Get reply counts
      for (const comment of comments) {
        const { count } = await supabase
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .eq('parent_id', comment.id)
          .eq('status', status)

        comment.reply_count = count || 0
      }
    }

    // Get total count
    let countQuery = supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId)
      .eq('status', status)
      .is('parent_id', null)

    if (resourceId) {
      countQuery = countQuery.eq('resource_id', resourceId)
    }

    if (resourceType) {
      countQuery = countQuery.eq('resource_type', resourceType)
    }

    const { count } = await countQuery

    return NextResponse.json({
      comments: comments as Comment[],
      total: count || 0,
      limit,
      offset,
      hasMore: (offset + limit) < (count || 0)
    })
  } catch (error) {
    console.error('Comments API GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST - Create a new comment
 */
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

    const body = await request.json() as CreateCommentRequest

    // Validate request
    if (!body.projectId || !body.content) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, content' },
        { status: 400 }
      )
    }

    if (body.content.length > 10000) {
      return NextResponse.json(
        { error: 'Comment content exceeds maximum length of 10,000 characters' },
        { status: 400 }
      )
    }

    // Verify user has access to project
    const { data: project } = await supabase
      .from('projects')
      .select('id, org_id')
      .eq('id', body.projectId)
      .single()

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Check user is member of organization
    const { data: membership } = await supabase
      .from('organization_members')
      .select('id, role')
      .eq('organization_id', project.org_id)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // If replying to a comment, verify parent exists
    if (body.parentId) {
      const { data: parentComment } = await supabase
        .from('comments')
        .select('id, project_id')
        .eq('id', body.parentId)
        .eq('status', 'active')
        .single()

      if (!parentComment) {
        return NextResponse.json(
          { error: 'Parent comment not found' },
          { status: 404 }
        )
      }

      if (parentComment.project_id !== body.projectId) {
        return NextResponse.json(
          { error: 'Parent comment belongs to different project' },
          { status: 400 }
        )
      }
    }

    // Validate mentions
    if (body.mentions && body.mentions.length > 0) {
      const { data: mentionedUsers } = await supabase
        .from('organization_members')
        .select('user_id')
        .eq('organization_id', project.org_id)
        .in('user_id', body.mentions)

      const validUserIds = mentionedUsers?.map(m => m.user_id) || []
      const invalidMentions = body.mentions.filter(id => !validUserIds.includes(id))

      if (invalidMentions.length > 0) {
        return NextResponse.json(
          { error: `Invalid mentions: ${invalidMentions.join(', ')}` },
          { status: 400 }
        )
      }
    }

    // Create comment
    const { data: comment, error } = await supabase
      .from('comments')
      .insert({
        project_id: body.projectId,
        resource_id: body.resourceId,
        resource_type: body.resourceType,
        user_id: user.id,
        content: body.content,
        parent_id: body.parentId,
        mentions: body.mentions,
        attachments: body.attachments,
        metadata: body.metadata,
        position: body.position,
        status: 'active',
        edited: false
      })
      .select(`
        *,
        user:users!comments_user_id_fkey(id, name, email, avatar_url)
      `)
      .single()

    if (error || !comment) {
      console.error('Failed to create comment:', error)
      return NextResponse.json(
        { error: 'Failed to create comment' },
        { status: 500 }
      )
    }

    // Send notifications to mentioned users
    if (body.mentions && body.mentions.length > 0) {
      const notifications = body.mentions.map(mentionedUserId => ({
        user_id: mentionedUserId,
        type: 'comment_mention',
        title: 'You were mentioned in a comment',
        message: `${user.email} mentioned you in a comment`,
        metadata: {
          comment_id: comment.id,
          project_id: body.projectId,
          mentioned_by: user.id
        }
      }))

      await supabase.from('notifications').insert(notifications)
    }

    // Notify parent comment author if this is a reply
    if (body.parentId) {
      const { data: parentComment } = await supabase
        .from('comments')
        .select('user_id')
        .eq('id', body.parentId)
        .single()

      if (parentComment && parentComment.user_id !== user.id) {
        await supabase.from('notifications').insert({
          user_id: parentComment.user_id,
          type: 'comment_reply',
          title: 'New reply to your comment',
          message: `${user.email} replied to your comment`,
          metadata: {
            comment_id: comment.id,
            parent_id: body.parentId,
            project_id: body.projectId
          }
        })
      }
    }

    return NextResponse.json({
      success: true,
      comment: comment as Comment
    }, { status: 201 })
  } catch (error) {
    console.error('Comments API POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT - Update a comment
 */
export async function PUT(request: NextRequest) {
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

    const body = await request.json() as UpdateCommentRequest

    // Validate request
    if (!body.id || !body.content) {
      return NextResponse.json(
        { error: 'Missing required fields: id, content' },
        { status: 400 }
      )
    }

    if (body.content.length > 10000) {
      return NextResponse.json(
        { error: 'Comment content exceeds maximum length of 10,000 characters' },
        { status: 400 }
      )
    }

    // Fetch existing comment
    const { data: existingComment } = await supabase
      .from('comments')
      .select('*, project:projects!comments_project_id_fkey(org_id)')
      .eq('id', body.id)
      .single()

    if (!existingComment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      )
    }

    // Check if user is comment author or org admin
    const isAuthor = existingComment.user_id === user.id

    if (!isAuthor) {
      const { data: membership } = await supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', existingComment.project.org_id)
        .eq('user_id', user.id)
        .single()

      const isAdmin = membership?.role === 'admin' || membership?.role === 'owner'

      if (!isAdmin) {
        return NextResponse.json(
          { error: 'Access denied. Only comment author or org admin can edit.' },
          { status: 403 }
        )
      }
    }

    // Update comment
    const { data: comment, error } = await supabase
      .from('comments')
      .update({
        content: body.content,
        attachments: body.attachments,
        metadata: body.metadata,
        edited: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', body.id)
      .select(`
        *,
        user:users!comments_user_id_fkey(id, name, email, avatar_url)
      `)
      .single()

    if (error || !comment) {
      console.error('Failed to update comment:', error)
      return NextResponse.json(
        { error: 'Failed to update comment' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      comment: comment as Comment
    })
  } catch (error) {
    console.error('Comments API PUT error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Delete a comment
 */
export async function DELETE(request: NextRequest) {
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
    const commentId = searchParams.get('id')
    const hardDelete = searchParams.get('hardDelete') === 'true'

    if (!commentId) {
      return NextResponse.json(
        { error: 'Missing required parameter: id' },
        { status: 400 }
      )
    }

    // Fetch existing comment
    const { data: existingComment } = await supabase
      .from('comments')
      .select('*, project:projects!comments_project_id_fkey(org_id)')
      .eq('id', commentId)
      .single()

    if (!existingComment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      )
    }

    // Check if user is comment author or org admin
    const isAuthor = existingComment.user_id === user.id

    if (!isAuthor) {
      const { data: membership } = await supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', existingComment.project.org_id)
        .eq('user_id', user.id)
        .single()

      const isAdmin = membership?.role === 'admin' || membership?.role === 'owner'

      if (!isAdmin) {
        return NextResponse.json(
          { error: 'Access denied. Only comment author or org admin can delete.' },
          { status: 403 }
        )
      }
    }

    if (hardDelete) {
      // Permanently delete comment and all replies
      const { error } = await supabase
        .from('comments')
        .delete()
        .or(`id.eq.${commentId},parent_id.eq.${commentId}`)

      if (error) {
        console.error('Failed to delete comment:', error)
        return NextResponse.json(
          { error: 'Failed to delete comment' },
          { status: 500 }
        )
      }
    } else {
      // Soft delete - mark as deleted
      const { error } = await supabase
        .from('comments')
        .update({
          status: 'deleted',
          updated_at: new Date().toISOString()
        })
        .or(`id.eq.${commentId},parent_id.eq.${commentId}`)

      if (error) {
        console.error('Failed to delete comment:', error)
        return NextResponse.json(
          { error: 'Failed to delete comment' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: hardDelete ? 'Comment permanently deleted' : 'Comment marked as deleted'
    })
  } catch (error) {
    console.error('Comments API DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
