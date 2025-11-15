/**
 * Discourse Forum Integration
 *
 * Complete SSO, API integration, and community features
 */

export interface DiscourseConfig {
  baseUrl: string
  apiKey: string
  apiUsername: string
  ssoSecret?: string
}

export interface DiscourseTopic {
  id: number
  title: string
  slug: string
  postsCount: number
  views: number
  categoryId: number
  createdAt: string
  lastPostedAt: string
}

export interface DiscourseUser {
  id: number
  username: string
  name?: string
  avatarUrl: string
  trustLevel: number
  reputation: number
  badges: DiscourseBadge[]
}

export interface DiscourseBadge {
  id: number
  name: string
  description: string
  badgeType: number
  iconUrl: string
}

export class DiscourseIntegration {
  private config: DiscourseConfig

  constructor(config: Partial<DiscourseConfig> = {}) {
    this.config = {
      baseUrl: config.baseUrl || process.env.DISCOURSE_URL || '',
      apiKey: config.apiKey || process.env.DISCOURSE_API_KEY || '',
      apiUsername: config.apiUsername || process.env.DISCOURSE_USERNAME || 'system',
      ssoSecret: config.ssoSecret || process.env.DISCOURSE_SSO_SECRET
    }
  }

  /**
   * Create topic in Discourse
   */
  async createTopic(params: {
    title: string
    raw: string
    categoryId: number
    tags?: string[]
  }): Promise<DiscourseTopic> {
    try {
      const response = await fetch(`${this.config.baseUrl}/posts.json`, {
        method: 'POST',
        headers: {
          'Api-Key': this.config.apiKey,
          'Api-Username': this.config.apiUsername,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      })

      if (!response.ok) {
        throw new Error(`Discourse API error: ${response.statusText}`)
      }

      const data = await response.json()
      return {
        id: data.topic_id,
        title: params.title,
        slug: data.topic_slug,
        postsCount: 1,
        views: 0,
        categoryId: params.categoryId,
        createdAt: new Date().toISOString(),
        lastPostedAt: new Date().toISOString()
      }
    } catch (error) {
      console.error('[Discourse] Create topic failed:', error)
      throw error
    }
  }

  /**
   * Generate SSO payload for authentication
   */
  generateSSOPayload(user: {
    externalId: string
    email: string
    username: string
    name?: string
    avatarUrl?: string
  }): string {
    if (!this.config.ssoSecret) {
      throw new Error('SSO secret not configured')
    }

    const nonce = this.generateNonce()
    const payload = Buffer.from(
      `nonce=${nonce}&external_id=${user.externalId}&email=${user.email}&username=${user.username}` +
      (user.name ? `&name=${user.name}` : '') +
      (user.avatarUrl ? `&avatar_url=${user.avatarUrl}` : '')
    ).toString('base64')

    const crypto = require('crypto')
    const sig = crypto
      .createHmac('sha256', this.config.ssoSecret)
      .update(payload)
      .digest('hex')

    return `${payload}&sig=${sig}`
  }

  /**
   * Sync user reputation from Discourse
   */
  async syncUserReputation(userId: string): Promise<{
    trustLevel: number
    reputation: number
    badges: DiscourseBadge[]
  }> {
    try {
      const response = await fetch(`${this.config.baseUrl}/users/${userId}.json`, {
        headers: {
          'Api-Key': this.config.apiKey,
          'Api-Username': this.config.apiUsername
        }
      })

      if (!response.ok) {
        throw new Error('User not found')
      }

      const data = await response.json()
      return {
        trustLevel: data.user.trust_level,
        reputation: data.user.likes_received + data.user.solutions,
        badges: data.user.badges?.map((b: any) => ({
          id: b.id,
          name: b.name,
          description: b.description,
          badgeType: b.badge_type_id,
          iconUrl: b.icon
        })) || []
      }
    } catch (error) {
      console.error('[Discourse] Sync reputation failed:', error)
      return {trustLevel: 0, reputation: 0, badges: []}
    }
  }

  /**
   * Grant badge to user
   */
  async grantBadge(username: string, badgeId: number): Promise<void> {
    try {
      await fetch(`${this.config.baseUrl}/user_badges.json`, {
        method: 'POST',
        headers: {
          'Api-Key': this.config.apiKey,
          'Api-Username': this.config.apiUsername,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username,
          badge_id: badgeId
        })
      })
    } catch (error) {
      console.error('[Discourse] Grant badge failed:', error)
    }
  }

  /**
   * Auto-create topic for new project
   */
  async createProjectTopic(project: {
    id: string
    name: string
    description: string
    imageUrl?: string
    userId: string
  }): Promise<DiscourseTopic> {
    const raw = `
# ${project.name}

${project.description}

${project.imageUrl ? `![Project Image](${project.imageUrl})` : ''}

**Project ID:** ${project.id}
**Created by:** @user_${project.userId}

[View in Abode AI](${process.env.NEXT_PUBLIC_APP_URL}/projects/${project.id})
`

    return await this.createTopic({
      title: project.name,
      raw,
      categoryId: 5, // Projects category
      tags: ['project', 'showcase']
    })
  }

  private generateNonce(): string {
    return Math.random().toString(36).substring(2, 15)
  }
}

export const discourse = new DiscourseIntegration()
