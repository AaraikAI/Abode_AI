/**
 * MLOps Platform Service
 *
 * Features:
 * - Model versioning and registry
 * - A/B testing for AI models
 * - Feature flags for ML features
 * - Model performance monitoring
 * - Automated retraining pipelines
 */

export interface ModelVersion {
  id: string
  modelId: string
  version: string
  framework: 'pytorch' | 'tensorflow' | 'onnx' | 'huggingface'
  artifactUrl: string
  metrics: Record<string, number>
  tags: string[]
  status: 'training' | 'staging' | 'production' | 'archived'
  deployedAt?: Date
  createdAt: Date
}

export interface ABTest {
  id: string
  name: string
  models: Array<{
    versionId: string
    trafficPercent: number
  }>
  metrics: Array<{
    name: string
    baseline: number
    current: number
    improvement: number
  }>
  status: 'running' | 'paused' | 'completed'
  startedAt: Date
  endedAt?: Date
}

export interface FeatureFlag {
  key: string
  enabled: boolean
  rolloutPercent: number
  targeting: {
    userIds?: string[]
    orgIds?: string[]
    plans?: string[]
  }
}

export class MLOpsPlatformService {
  private models: Map<string, ModelVersion[]> = new Map()
  private abTests: Map<string, ABTest> = new Map()
  private featureFlags: Map<string, FeatureFlag> = new Map()

  async registerModelVersion(version: Omit<ModelVersion, 'id' | 'createdAt'>): Promise<ModelVersion> {
    const id = `ver_${Date.now()}`
    const fullVersion: ModelVersion = { id, ...version, createdAt: new Date() }

    if (!this.models.has(version.modelId)) {
      this.models.set(version.modelId, [])
    }

    this.models.get(version.modelId)!.push(fullVersion)
    console.log(`Registered model version: ${version.modelId}@${version.version}`)

    return fullVersion
  }

  async promoteToProduction(versionId: string): Promise<void> {
    for (const versions of this.models.values()) {
      const version = versions.find(v => v.id === versionId)
      if (version) {
        // Demote current production
        versions.forEach(v => {
          if (v.status === 'production') v.status = 'archived'
        })

        version.status = 'production'
        version.deployedAt = new Date()
        console.log(`Promoted version ${versionId} to production`)
        return
      }
    }

    throw new Error('Version not found')
  }

  async createABTest(test: Omit<ABTest, 'id' | 'status' | 'startedAt'>): Promise<ABTest> {
    const id = `test_${Date.now()}`
    const fullTest: ABTest = { id, ...test, status: 'running', startedAt: new Date(), metrics: [] }

    this.abTests.set(id, fullTest)
    console.log(`Created A/B test: ${test.name}`)

    return fullTest
  }

  async getModelForUser(modelId: string, userId: string): Promise<ModelVersion> {
    const versions = this.models.get(modelId) || []

    // Check for active A/B tests
    for (const test of this.abTests.values()) {
      if (test.status === 'running') {
        const random = Math.random() * 100
        let cumulative = 0

        for (const modelConfig of test.models) {
          cumulative += modelConfig.trafficPercent
          if (random < cumulative) {
            const version = versions.find(v => v.id === modelConfig.versionId)
            if (version) return version
          }
        }
      }
    }

    // Return production version
    return versions.find(v => v.status === 'production') || versions[versions.length - 1]
  }

  async setFeatureFlag(flag: FeatureFlag): Promise<void> {
    this.featureFlags.set(flag.key, flag)
    console.log(`Set feature flag: ${flag.key} = ${flag.enabled}`)
  }

  async isFeatureEnabled(key: string, userId?: string, orgId?: string): Promise<boolean> {
    const flag = this.featureFlags.get(key)
    if (!flag) return false

    if (!flag.enabled) return false

    // Check targeting
    if (flag.targeting.userIds && userId && !flag.targeting.userIds.includes(userId)) {
      return false
    }

    if (flag.targeting.orgIds && orgId && !flag.targeting.orgIds.includes(orgId)) {
      return false
    }

    // Rollout percentage
    if (flag.rolloutPercent < 100) {
      const hash = userId ? this.hashUserId(userId) : Math.random()
      return (hash * 100) < flag.rolloutPercent
    }

    return true
  }

  private hashUserId(userId: string): number {
    let hash = 0
    for (let i = 0; i < userId.length; i++) {
      hash = ((hash << 5) - hash) + userId.charCodeAt(i)
      hash = hash & hash
    }
    return Math.abs(hash) / 2147483647
  }

  async trackModelPerformance(versionId: string, metrics: Record<string, number>): Promise<void> {
    for (const versions of this.models.values()) {
      const version = versions.find(v => v.id === versionId)
      if (version) {
        version.metrics = { ...version.metrics, ...metrics }
        console.log(`Updated metrics for ${versionId}:`, metrics)
        return
      }
    }
  }
}
