export type UserRole =
  | "admin"
  | "designer"
  | "analyst"
  | "compliance"
  | "auditor"
  | "manufacturer"
  | "developer"
  | "freelancer"

export type WorkspaceId = "orchestration" | "design-studio" | "manufacturing"

export interface HeroStat {
  label: string
  value: string
  helper?: string
}

import type { LucideIcon } from "lucide-react"

export interface WorkspaceHighlight {
  title: string
  description: string
  icon: LucideIcon | string
}

export interface WorkspaceJourneyStep {
  title: string
  description: string
}

export interface WorkspaceMetric {
  label: string
  value: string
}

export interface WorkspaceDefinition {
  id: WorkspaceId
  label: string
  description: string
  highlights: WorkspaceHighlight[]
  journey: WorkspaceJourneyStep[]
  metrics: WorkspaceMetric[]
}

export interface CapabilitySectionItem {
  name: string
  description: string
  badge?: string
}

export interface CapabilitySection {
  title: string
  items: CapabilitySectionItem[]
}

export interface AutomationStep {
  name: string
  description: string
  dependencies: string
}

export interface ObservabilityMetric {
  name: string
  value: string
  change: string
  positive?: boolean
}

export interface SustainabilityPoint {
  month: string
  co2: number
}

export interface ComplianceDiscipline {
  name: string
  controls: string[]
}

export interface IntegrationCategory {
  title: string
  items: string[]
}

export interface PricingTier {
  name: string
  price: string
  credits: string
  features: string[]
  cta: string
  mostPopular?: boolean
}

export interface RoadmapItem {
  phase: string
  quarter: string
  focus: string
  metrics: string[]
}

export interface WorkspaceTemplate {
  id: WorkspaceId
  name: string
  description: string
  rbac: UserRole[]
  defaultAgents: string[]
  checklist: string[]
}

export interface ProjectSummary {
  id: string
  name: string
  workspace: WorkspaceId
  status: "draft" | "in_review" | "approved" | "exported"
  owner: {
    name: string
    role: UserRole
    org: string
  }
  updatedAt: string
  metrics: {
    renders: number
    co2Kg: number
    creditsConsumed: number
    satisfaction?: number
  }
  nextActions: string[]
}

export interface AgentTemplate {
  id: string
  name: string
  version: string
  description: string
  capabilities: string[]
  averageDuration: string
  rating: number
}

export interface SustainabilityMetric {
  id: string
  renderId: string
  projectId: string
  co2Kg: number
  energyKwh: number
  region: string
  timestamp: string
  offsets?: {
    method: "renewable" | "carbon-credit" | "none"
    value: number
  }
}

export interface CreditLedgerEntry {
  id: string
  orgId: string
  delta: number
  balance: number
  currency: "credits"
  reason: string
  actor: string
  createdAt: string
  metadata?: Record<string, unknown>
}

export interface BillingAlert {
  type: "usage" | "invoice" | "compliance"
  message: string
  link?: string
}

export interface BillingSummary {
  orgId: string
  tier: "free" | "pro" | "team" | "enterprise"
  billingCycleEndsAt: string
  includedCredits: number
  creditsRemaining: number
  rolloverCredits: number
  alerts: BillingAlert[]
  ledger: CreditLedgerEntry[]
}

export interface SustainabilitySummary {
  summary: {
    rollingAverageKg: number
    targetKg: number
    variance: number
    trend: "up" | "down" | "flat"
    sampleSize: number
  }
  items: SustainabilityMetric[]
}

export interface PlatformSnapshot {
  heroStats: HeroStat[]
  workspaces: WorkspaceDefinition[]
  workspaceTemplates: WorkspaceTemplate[]
  agentCatalog: AgentTemplate[]
  projects: ProjectSummary[]
  capabilitySections: CapabilitySection[]
  automationFlow: AutomationStep[]
  observabilityMetrics: ObservabilityMetric[]
  sustainabilitySeries: SustainabilityPoint[]
  complianceMatrix: ComplianceDiscipline[]
  integrationCatalog: IntegrationCategory[]
  pricingTiers: PricingTier[]
  roadmap: RoadmapItem[]
}

export interface TelemetryEvent {
  type: "sustainability" | "credits" | "incident"
  payload: Record<string, unknown>
  timestamp: string
}
