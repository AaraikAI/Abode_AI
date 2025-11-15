/**
 * Discourse Forum Integration Service
 * SSO authentication and badge system integration
 */

import crypto from 'crypto'

export interface DiscourseBadge {
  id: number
  name: string
  description: string
  icon: string
  badge_type_id: number
}

export class DiscourseIntegrationService {
  private apiKey: string
  private apiUsername: string
  private baseUrl: string
  private ssoSecret: string

  constructor() {
    this.apiKey = process.env.DISCOURSE_API_KEY || ''
    this.apiUsername = process.env.DISCOURSE_USERNAME || 'system'
    this.baseUrl = process.env.DISCOURSE_URL || 'https://forum.abode-ai.com'
    this.ssoSecret = process.env.DISCOURSE_SSO_SECRET || ''
  }

  /**
   * Generate SSO payload for Discourse authentication
   */
  generateSSOPayload(user: {
    id: string
    email: string
    username: string
    name: string
    avatar_url?: string
  }): { sso: string; sig: string } {
    const nonce = crypto.randomBytes(16).toString('hex')

    const payload = {
      nonce,
      email: user.email,
      external_id: user.id,
      username: user.username,
      name: user.name,
      avatar_url: user.avatar_url || '',
      return_sso_url: `${this.baseUrl}/session/sso_login`
    }

    const base64Payload = Buffer.from(new URLSearchParams(payload).toString()).toString('base64')
    const sig = crypto.createHmac('sha256', this.ssoSecret).update(base64Payload).digest('hex')

    return { sso: base64Payload, sig }
  }

  /**
   * Verify SSO payload from Discourse
   */
  verifySSOPayload(sso: string, sig: string): boolean {
    const expectedSig = crypto.createHmac('sha256', this.ssoSecret).update(sso).digest('hex')
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))
  }

  /**
   * Grant badge to user
   */
  async grantBadge(userId: string, badgeId: number): Promise<void> {
    await fetch(`${this.baseUrl}/user_badges.json`, {
      method: 'POST',
      headers: {
        'Api-Key': this.apiKey,
        'Api-Username': this.apiUsername,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: userId,
        badge_id: badgeId
      })
    })
  }

  /**
   * Create custom badge
   */
  async createBadge(badge: {
    name: string
    description: string
    icon: string
    badge_type_id: number
  }): Promise<DiscourseBadge> {
    const response = await fetch(`${this.baseUrl}/admin/badges.json`, {
      method: 'POST',
      headers: {
        'Api-Key': this.apiKey,
        'Api-Username': this.apiUsername,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ badge })
    })

    return response.json()
  }

  /**
   * Create forum topic
   */
  async createTopic(title: string, content: string, category?: number): Promise<{ topic_id: number }> {
    const response = await fetch(`${this.baseUrl}/posts.json`, {
      method: 'POST',
      headers: {
        'Api-Key': this.apiKey,
        'Api-Username': this.apiUsername,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title,
        raw: content,
        category: category || 1
      })
    })

    return response.json()
  }
}

export const discourse = new DiscourseIntegrationService()
