/**
 * Discourse Topics API Endpoint
 *
 * List forum topics and create new topics
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface CreateTopicRequest {
  title: string
  content: string
  category: string
  tags?: string[]
  projectId?: string
  isPinned?: boolean
  isLocked?: boolean
}

interface Topic {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  author: {
    id: string
    name: string
    avatar?: string
  }
  projectId?: string
  isPinned: boolean
  isLocked: boolean
  viewCount: number
  replyCount: number
  likeCount: number
  createdAt: string
  updatedAt: string
  lastReplyAt?: string
}

/**
 * GET - List forum topics
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
    const category = searchParams.get('category')
    const projectId = searchParams.get('projectId')
    const tag = searchParams.get('tag')
    const sortBy = searchParams.get('sortBy') || 'latest' // latest, popular, trending
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('discourse_topics')
      .select(`
        *,
        author:user_id (
          id,
          email,
          raw_user_meta_data
        )
      `, { count: 'exact' })

    // Apply filters
    if (category) {
      query = query.eq('category', category)
    }

    if (projectId) {
      query = query.eq('project_id', projectId)
    }

    if (tag) {
      query = query.contains('tags', [tag])
    }

    // Apply sorting
    switch (sortBy) {
      case 'popular':
        query = query.order('view_count', { ascending: false })
        break
      case 'trending':
        query = query.order('like_count', { ascending: false })
        break
      case 'latest':
      default:
        query = query.order('created_at', { ascending: false })
        break
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: topics, error, count } = await query

    if (error) {
      console.error('Failed to fetch topics:', error)
      return NextResponse.json(
        { error: 'Failed to fetch topics' },
        { status: 500 }
      )
    }

    // Format response
    const formattedTopics: Topic[] = (topics || []).map(topic => ({
      id: topic.id,
      title: topic.title,
      content: topic.content,
      category: topic.category,
      tags: topic.tags || [],
      author: {
        id: topic.author.id,
        name: topic.author.raw_user_meta_data?.name || topic.author.email,
        avatar: topic.author.raw_user_meta_data?.avatar_url
      },
      projectId: topic.project_id,
      isPinned: topic.is_pinned || false,
      isLocked: topic.is_locked || false,
      viewCount: topic.view_count || 0,
      replyCount: topic.reply_count || 0,
      likeCount: topic.like_count || 0,
      createdAt: topic.created_at,
      updatedAt: topic.updated_at,
      lastReplyAt: topic.last_reply_at
    }))

    return NextResponse.json({
      topics: formattedTopics,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('Discourse topics GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST - Create new topic
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

    // Parse request body
    const topicRequest = await request.json() as CreateTopicRequest

    // Validate request
    if (!topicRequest.title || !topicRequest.content || !topicRequest.category) {
      return NextResponse.json(
        { error: 'Missing required fields: title, content, category' },
        { status: 400 }
      )
    }

    // Validate title length
    if (topicRequest.title.length < 5 || topicRequest.title.length > 200) {
      return NextResponse.json(
        { error: 'Title must be between 5 and 200 characters' },
        { status: 400 }
      )
    }

    // Validate content length
    if (topicRequest.content.length < 20) {
      return NextResponse.json(
        { error: 'Content must be at least 20 characters' },
        { status: 400 }
      )
    }

    // Validate category
    const validCategories = [
      'general',
      'support',
      'feature-requests',
      'showcase',
      'tutorials',
      'announcements',
      'collaboration',
      'architecture',
      'sustainability'
    ]

    if (!validCategories.includes(topicRequest.category)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${validCategories.join(', ')}` },
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

    const orgId = membership.organization_id

    // If projectId is provided, verify access
    if (topicRequest.projectId) {
      const { data: project } = await supabase
        .from('projects')
        .select('id')
        .eq('id', topicRequest.projectId)
        .eq('org_id', orgId)
        .single()

      if (!project) {
        return NextResponse.json(
          { error: 'Project not found or access denied' },
          { status: 404 }
        )
      }
    }

    // Create topic
    const { data: topic, error: createError } = await supabase
      .from('discourse_topics')
      .insert({
        title: topicRequest.title,
        content: topicRequest.content,
        category: topicRequest.category,
        tags: topicRequest.tags || [],
        user_id: user.id,
        org_id: orgId,
        project_id: topicRequest.projectId,
        is_pinned: topicRequest.isPinned || false,
        is_locked: topicRequest.isLocked || false,
        view_count: 0,
        reply_count: 0,
        like_count: 0
      })
      .select(`
        *,
        author:user_id (
          id,
          email,
          raw_user_meta_data
        )
      `)
      .single()

    if (createError || !topic) {
      console.error('Failed to create topic:', createError)
      return NextResponse.json(
        { error: 'Failed to create topic' },
        { status: 500 }
      )
    }

    // Format response
    const formattedTopic: Topic = {
      id: topic.id,
      title: topic.title,
      content: topic.content,
      category: topic.category,
      tags: topic.tags || [],
      author: {
        id: topic.author.id,
        name: topic.author.raw_user_meta_data?.name || topic.author.email,
        avatar: topic.author.raw_user_meta_data?.avatar_url
      },
      projectId: topic.project_id,
      isPinned: topic.is_pinned || false,
      isLocked: topic.is_locked || false,
      viewCount: topic.view_count || 0,
      replyCount: topic.reply_count || 0,
      likeCount: topic.like_count || 0,
      createdAt: topic.created_at,
      updatedAt: topic.updated_at,
      lastReplyAt: topic.last_reply_at
    }

    // Create activity log
    await supabase
      .from('activity_logs')
      .insert({
        org_id: orgId,
        user_id: user.id,
        action: 'topic.created',
        resource_type: 'discourse_topic',
        resource_id: topic.id,
        metadata: {
          title: topic.title,
          category: topic.category
        }
      })

    return NextResponse.json(formattedTopic, { status: 201 })
  } catch (error) {
    console.error('Discourse topics POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
