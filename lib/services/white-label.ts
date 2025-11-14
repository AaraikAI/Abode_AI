/**
 * White-label & Multi-tenancy Service
 *
 * Features:
 * - Custom branding per organization
 * - Custom domains
 * - Reseller portal
 * - Multi-tenant isolation
 * - Usage and billing per tenant
 */

export interface WhiteLabelConfig {
  orgId: string
  branding: {
    logoUrl: string
    logoUrlDark?: string
    faviconUrl: string
    primaryColor: string
    secondaryColor: string
    accentColor: string
    fontFamily: string
  }
  domain: {
    custom?: string
    subdomain: string
    sslEnabled: boolean
  }
  emails: {
    fromName: string
    fromEmail: string
    replyTo: string
    templates: Record<string, string>
  }
  features: {
    enabled: string[]
    limits: Record<string, number>
  }
  billing: {
    stripeAccountId?: string
    revenueShare: number // percentage
  }
}

export interface Tenant {
  id: string
  name: string
  plan: 'starter' | 'professional' | 'enterprise' | 'reseller'
  whiteLabelConfig?: WhiteLabelConfig
  users: number
  projects: number
  storageUsed: number
  apiCalls: number
  createdAt: Date
  status: 'active' | 'suspended' | 'cancelled'
}

export class WhiteLabelService {
  private tenants: Map<string, Tenant> = new Map()
  private whiteLabelConfigs: Map<string, WhiteLabelConfig> = new Map()

  async createWhiteLabel(config: WhiteLabelConfig): Promise<void> {
    this.whiteLabelConfigs.set(config.orgId, config)
    console.log(`Created white-label config for ${config.orgId}`)
  }

  async getWhiteLabelConfig(orgId: string): Promise<WhiteLabelConfig | null> {
    return this.whiteLabelConfigs.get(orgId) || null
  }

  async updateBranding(orgId: string, branding: Partial<WhiteLabelConfig['branding']>): Promise<void> {
    const config = this.whiteLabelConfigs.get(orgId)
    if (config) {
      config.branding = { ...config.branding, ...branding }
    }
  }

  async setCustomDomain(orgId: string, domain: string): Promise<{ success: boolean; dnsRecords: Array<{ type: string; name: string; value: string }> }> {
    const config = this.whiteLabelConfigs.get(orgId)
    if (!config) throw new Error('White-label config not found')

    config.domain.custom = domain

    return {
      success: true,
      dnsRecords: [
        { type: 'CNAME', name: domain, value: 'app.abodeai.com' },
        { type: 'TXT', name: `_acme-challenge.${domain}`, value: 'verification-token' }
      ]
    }
  }

  async getTenantUsage(tenantId: string): Promise<{
    users: number
    projects: number
    storage: number
    apiCalls: number
    renders: number
  }> {
    const tenant = this.tenants.get(tenantId)
    if (!tenant) throw new Error('Tenant not found')

    return {
      users: tenant.users,
      projects: tenant.projects,
      storage: tenant.storageUsed,
      apiCalls: tenant.apiCalls,
      renders: 0
    }
  }

  async calculateRevenueShare(tenantId: string, revenue: number): Promise<{ platform: number; reseller: number }> {
    const config = this.whiteLabelConfigs.get(tenantId)
    const share = config?.billing.revenueShare || 0

    return {
      reseller: revenue * (share / 100),
      platform: revenue * (1 - share / 100)
    }
  }
}
