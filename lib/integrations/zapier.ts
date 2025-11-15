/**
 * Zapier Integration Service
 *
 * Enables automation workflows between Abode AI and 1000+ apps via Zapier
 */

export interface ZapierConfig {
  webhookUrl?: string
  apiKey?: string
}

export interface ZapierTrigger {
  event: string
  data: Record<string, any>
  timestamp: Date
}

export interface ZapierAction {
  actionType: string
  appName: string
  config: Record<string, any>
}

export class ZapierIntegration {
  private config: ZapierConfig
  private webhooks: Map<string, string> = new Map()

  constructor(config: ZapierConfig) {
    this.config = config
  }

  /**
   * Register a webhook for an event type
   */
  registerWebhook(eventType: string, webhookUrl: string): void {
    this.webhooks.set(eventType, webhookUrl)
    console.log(`📌 Registered Zapier webhook for: ${eventType}`)
  }

  /**
   * Trigger a Zap with event data
   */
  async triggerZap(eventType: string, data: Record<string, any>): Promise<void> {
    const webhookUrl = this.webhooks.get(eventType) || this.config.webhookUrl

    if (!webhookUrl) {
      console.warn(`No webhook configured for event: ${eventType}`)
      return
    }

    console.log(`⚡ Triggering Zapier webhook: ${eventType}`)

    const trigger: ZapierTrigger = {
      event: eventType,
      data,
      timestamp: new Date()
    }

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(trigger)
      })

      if (!response.ok) {
        console.error(`Zapier webhook failed: ${response.statusText}`)
      } else {
        console.log(`✅ Zapier webhook triggered successfully`)
      }
    } catch (error) {
      console.error('Failed to trigger Zapier webhook:', error)
    }
  }

  /**
   * Trigger when a new project is created
   */
  async onProjectCreated(project: {
    id: string
    name: string
    createdBy: string
    createdAt: Date
  }): Promise<void> {
    await this.triggerZap('project.created', {
      project_id: project.id,
      project_name: project.name,
      created_by: project.createdBy,
      created_at: project.createdAt.toISOString()
    })
  }

  /**
   * Trigger when a render is completed
   */
  async onRenderCompleted(render: {
    id: string
    projectId: string
    imageUrl: string
    duration: number
  }): Promise<void> {
    await this.triggerZap('render.completed', {
      render_id: render.id,
      project_id: render.projectId,
      image_url: render.imageUrl,
      duration_seconds: render.duration
    })
  }

  /**
   * Trigger when a model is uploaded
   */
  async onModelUploaded(model: {
    id: string
    name: string
    format: string
    size: number
  }): Promise<void> {
    await this.triggerZap('model.uploaded', {
      model_id: model.id,
      model_name: model.name,
      format: model.format,
      size_bytes: model.size
    })
  }

  /**
   * Trigger when collaboration invite is sent
   */
  async onCollaborationInvite(invite: {
    projectId: string
    invitedEmail: string
    role: string
  }): Promise<void> {
    await this.triggerZap('collaboration.invite', {
      project_id: invite.projectId,
      invited_email: invite.invitedEmail,
      role: invite.role
    })
  }

  /**
   * Trigger when cost estimate exceeds threshold
   */
  async onCostThresholdExceeded(estimate: {
    projectId: string
    estimatedCost: number
    threshold: number
  }): Promise<void> {
    await this.triggerZap('cost.threshold_exceeded', {
      project_id: estimate.projectId,
      estimated_cost: estimate.estimatedCost,
      threshold: estimate.threshold,
      exceeded_by: estimate.estimatedCost - estimate.threshold
    })
  }

  /**
   * Send data to Zapier via catch hook
   */
  async sendToCatchHook(hookId: string, data: Record<string, any>): Promise<void> {
    const url = `https://hooks.zapier.com/hooks/catch/${hookId}`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      throw new Error(`Failed to send to Zapier: ${response.statusText}`)
    }
  }

  /**
   * Get sample data for Zap testing
   */
  getSampleData(eventType: string): Record<string, any> {
    const samples: Record<string, Record<string, any>> = {
      'project.created': {
        project_id: 'proj_123',
        project_name: 'Modern House Design',
        created_by: 'user@example.com',
        created_at: new Date().toISOString()
      },
      'render.completed': {
        render_id: 'render_456',
        project_id: 'proj_123',
        image_url: 'https://example.com/render.jpg',
        duration_seconds: 45
      },
      'model.uploaded': {
        model_id: 'model_789',
        model_name: 'Chair.glb',
        format: 'glb',
        size_bytes: 1024000
      }
    }

    return samples[eventType] || {}
  }

  /**
   * List all registered webhooks
   */
  listWebhooks(): Array<{ eventType: string; webhookUrl: string }> {
    return Array.from(this.webhooks.entries()).map(([eventType, webhookUrl]) => ({
      eventType,
      webhookUrl
    }))
  }
}

export const zapier = new ZapierIntegration({
  webhookUrl: process.env.NEXT_PUBLIC_ZAPIER_WEBHOOK_URL
})
