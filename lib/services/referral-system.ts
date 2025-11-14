/**
 * Referral System Service
 *
 * Manages user referrals, rewards, and growth tracking
 */

export interface ReferralCode {
  code: string
  userId: string
  userName: string
  createdAt: Date
  expiresAt?: Date

  limits: {
    maxUses?: number
    currentUses: number
  }

  rewards: {
    referrerBonus: number // Credits for referrer
    refereeBonus: number // Credits for new user
    tierMultiplier: number // Multiplier based on tier
  }

  metadata?: {
    campaign?: string
    source?: string
    customData?: Record<string, any>
  }
}

export interface Referral {
  id: string
  referrerId: string
  refereeId: string
  referralCode: string

  status: 'pending' | 'completed' | 'rewarded' | 'expired' | 'invalid'

  milestones: {
    signedUp: boolean
    signedUpAt?: Date
    verified: boolean
    verifiedAt?: Date
    firstPurchase: boolean
    firstPurchaseAt?: Date
    monthlyActive: boolean
  }

  rewards: {
    referrerCredits: number
    refereeCredits: number
    totalValue: number
  }

  createdAt: Date
  completedAt?: Date
}

export interface ReferralReward {
  id: string
  userId: string
  referralId: string

  type: 'signup' | 'verification' | 'purchase' | 'milestone' | 'bonus'
  amount: number
  currency: 'credits' | 'usd'

  status: 'pending' | 'approved' | 'paid' | 'cancelled'

  approvedAt?: Date
  paidAt?: Date

  metadata?: {
    description?: string
    customData?: Record<string, any>
  }
}

export interface ReferralTier {
  name: string
  minReferrals: number
  maxReferrals?: number

  benefits: {
    bonusMultiplier: number
    extraCredits: number
    specialPerks: string[]
  }

  badge: {
    name: string
    icon: string
    color: string
  }
}

export interface ReferralStats {
  userId: string
  userName: string

  totals: {
    referrals: number
    completedReferrals: number
    pendingReferrals: number
    totalEarned: number
    lifetimeValue: number
  }

  currentTier: ReferralTier
  nextTier?: ReferralTier
  progressToNextTier?: number

  performance: {
    conversionRate: number // % of referrals that complete
    averageValue: number // Average value per referral
    topMonth: {
      month: string
      referrals: number
      earned: number
    }
  }

  recentReferrals: Referral[]
  leaderboardRank?: number
}

export interface LeaderboardEntry {
  rank: number
  userId: string
  userName: string
  avatar?: string

  stats: {
    totalReferrals: number
    monthlyReferrals: number
    totalEarned: number
  }

  tier: ReferralTier
  badges: string[]
}

export class ReferralSystemService {
  private referralCodes: Map<string, ReferralCode> = new Map()
  private referrals: Map<string, Referral> = new Map()
  private rewards: Map<string, ReferralReward[]> = new Map()

  // Referral tiers
  private tiers: ReferralTier[] = [
    {
      name: 'Starter',
      minReferrals: 0,
      maxReferrals: 4,
      benefits: {
        bonusMultiplier: 1.0,
        extraCredits: 0,
        specialPerks: []
      },
      badge: {
        name: 'Starter',
        icon: '🌱',
        color: '#10b981'
      }
    },
    {
      name: 'Builder',
      minReferrals: 5,
      maxReferrals: 14,
      benefits: {
        bonusMultiplier: 1.25,
        extraCredits: 50,
        specialPerks: ['Priority support', 'Early access to features']
      },
      badge: {
        name: 'Builder',
        icon: '🏗️',
        color: '#3b82f6'
      }
    },
    {
      name: 'Architect',
      minReferrals: 15,
      maxReferrals: 49,
      benefits: {
        bonusMultiplier: 1.5,
        extraCredits: 150,
        specialPerks: ['Priority support', 'Early access', 'Custom training', 'API rate boost']
      },
      badge: {
        name: 'Architect',
        icon: '🏛️',
        color: '#8b5cf6'
      }
    },
    {
      name: 'Visionary',
      minReferrals: 50,
      benefits: {
        bonusMultiplier: 2.0,
        extraCredits: 500,
        specialPerks: [
          'VIP support',
          'Early access',
          'Custom training',
          'API rate boost',
          'Revenue sharing',
          'Co-marketing opportunities'
        ]
      },
      badge: {
        name: 'Visionary',
        icon: '🌟',
        color: '#f59e0b'
      }
    }
  ]

  /**
   * Generate referral code for user
   */
  async generateReferralCode(
    userId: string,
    userName: string,
    options?: {
      customCode?: string
      maxUses?: number
      expiresIn?: number // days
      campaign?: string
      referrerBonus?: number
      refereeBonus?: number
    }
  ): Promise<ReferralCode> {
    const code = options?.customCode || this.generateCode(userName)

    // Check if code already exists
    if (this.referralCodes.has(code)) {
      throw new Error('Referral code already exists')
    }

    const referralCode: ReferralCode = {
      code,
      userId,
      userName,
      createdAt: new Date(),
      expiresAt: options?.expiresIn
        ? new Date(Date.now() + options.expiresIn * 24 * 60 * 60 * 1000)
        : undefined,
      limits: {
        maxUses: options?.maxUses,
        currentUses: 0
      },
      rewards: {
        referrerBonus: options?.referrerBonus || 100,
        refereeBonus: options?.refereeBonus || 50,
        tierMultiplier: 1.0
      },
      metadata: {
        campaign: options?.campaign
      }
    }

    this.referralCodes.set(code, referralCode)

    return referralCode
  }

  /**
   * Validate and apply referral code
   */
  async applyReferralCode(
    code: string,
    refereeId: string
  ): Promise<{ valid: boolean; referral?: Referral; reason?: string }> {
    const referralCode = this.referralCodes.get(code)

    if (!referralCode) {
      return { valid: false, reason: 'Invalid referral code' }
    }

    // Check expiration
    if (referralCode.expiresAt && referralCode.expiresAt < new Date()) {
      return { valid: false, reason: 'Referral code expired' }
    }

    // Check usage limits
    if (referralCode.limits.maxUses &&
        referralCode.limits.currentUses >= referralCode.limits.maxUses) {
      return { valid: false, reason: 'Referral code usage limit reached' }
    }

    // Check self-referral
    if (referralCode.userId === refereeId) {
      return { valid: false, reason: 'Cannot refer yourself' }
    }

    // Create referral
    const referral: Referral = {
      id: `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      referrerId: referralCode.userId,
      refereeId,
      referralCode: code,
      status: 'pending',
      milestones: {
        signedUp: true,
        signedUpAt: new Date(),
        verified: false,
        firstPurchase: false,
        monthlyActive: false
      },
      rewards: {
        referrerCredits: 0,
        refereeCredits: referralCode.rewards.refereeBonus,
        totalValue: referralCode.rewards.refereeBonus
      },
      createdAt: new Date()
    }

    this.referrals.set(referral.id, referral)
    referralCode.limits.currentUses++

    // Award signup bonus to referee immediately
    await this.awardReward({
      userId: refereeId,
      referralId: referral.id,
      type: 'signup',
      amount: referralCode.rewards.refereeBonus,
      description: `Welcome bonus from ${referralCode.userName}`
    })

    return { valid: true, referral }
  }

  /**
   * Complete referral milestone
   */
  async completeMilestone(
    referralId: string,
    milestone: 'verified' | 'firstPurchase' | 'monthlyActive'
  ): Promise<{ completed: boolean; rewards: ReferralReward[] }> {
    const referral = this.referrals.get(referralId)
    if (!referral) {
      throw new Error('Referral not found')
    }

    // Mark milestone
    if (milestone === 'verified') {
      referral.milestones.verified = true
      referral.milestones.verifiedAt = new Date()
    } else if (milestone === 'firstPurchase') {
      referral.milestones.firstPurchase = true
      referral.milestones.firstPurchaseAt = new Date()
    } else if (milestone === 'monthlyActive') {
      referral.milestones.monthlyActive = true
    }

    // Calculate rewards based on milestone
    const rewards: ReferralReward[] = []
    const referralCode = Array.from(this.referralCodes.values())
      .find(rc => rc.code === referral.referralCode)

    if (!referralCode) return { completed: false, rewards: [] }

    // Get current tier multiplier
    const stats = await this.getReferralStats(referral.referrerId)
    const tierMultiplier = stats.currentTier.benefits.bonusMultiplier

    if (milestone === 'verified') {
      // Award verification bonus
      const amount = Math.floor(referralCode.rewards.referrerBonus * 0.3 * tierMultiplier)
      const reward = await this.awardReward({
        userId: referral.referrerId,
        referralId: referral.id,
        type: 'verification',
        amount,
        description: 'Referral verified email'
      })
      rewards.push(reward)
      referral.rewards.referrerCredits += amount
    } else if (milestone === 'firstPurchase') {
      // Award main referral bonus
      const amount = Math.floor(referralCode.rewards.referrerBonus * tierMultiplier)
      const reward = await this.awardReward({
        userId: referral.referrerId,
        referralId: referral.id,
        type: 'purchase',
        amount,
        description: 'Referral made first purchase'
      })
      rewards.push(reward)
      referral.rewards.referrerCredits += amount

      // Mark as completed
      referral.status = 'completed'
      referral.completedAt = new Date()
    } else if (milestone === 'monthlyActive') {
      // Award retention bonus
      const amount = Math.floor(referralCode.rewards.referrerBonus * 0.2 * tierMultiplier)
      const reward = await this.awardReward({
        userId: referral.referrerId,
        referralId: referral.id,
        type: 'milestone',
        amount,
        description: 'Referral monthly active'
      })
      rewards.push(reward)
      referral.rewards.referrerCredits += amount
    }

    // Check if referral is now complete
    if (referral.milestones.verified &&
        referral.milestones.firstPurchase &&
        referral.status === 'completed') {
      referral.status = 'rewarded'
    }

    // Update total value
    referral.rewards.totalValue =
      referral.rewards.referrerCredits + referral.rewards.refereeCredits

    return { completed: true, rewards }
  }

  /**
   * Get referral statistics for user
   */
  async getReferralStats(userId: string): Promise<ReferralStats> {
    // Find all referrals by this user
    const userReferrals = Array.from(this.referrals.values())
      .filter(r => r.referrerId === userId)

    const completedReferrals = userReferrals.filter(r =>
      r.status === 'completed' || r.status === 'rewarded'
    )
    const pendingReferrals = userReferrals.filter(r => r.status === 'pending')

    // Calculate total earned
    const totalEarned = userReferrals.reduce((sum, r) =>
      sum + r.rewards.referrerCredits, 0
    )

    // Calculate lifetime value (including referee spending)
    const lifetimeValue = userReferrals.reduce((sum, r) =>
      sum + r.rewards.totalValue, 0
    )

    // Determine tier
    const currentTier = this.getTierForReferralCount(completedReferrals.length)
    const nextTier = this.tiers.find(t => t.minReferrals > completedReferrals.length)
    const progressToNextTier = nextTier
      ? (completedReferrals.length - currentTier.minReferrals) /
        (nextTier.minReferrals - currentTier.minReferrals)
      : undefined

    // Calculate performance metrics
    const conversionRate = userReferrals.length > 0
      ? (completedReferrals.length / userReferrals.length) * 100
      : 0

    const averageValue = completedReferrals.length > 0
      ? totalEarned / completedReferrals.length
      : 0

    // Find top month
    const monthlyStats = this.calculateMonthlyStats(userReferrals)
    const topMonth = monthlyStats.reduce((best, month) =>
      month.earned > best.earned ? month : best,
      { month: '', referrals: 0, earned: 0 }
    )

    // Get user name from referral code
    const userCode = Array.from(this.referralCodes.values())
      .find(rc => rc.userId === userId)
    const userName = userCode?.userName || 'Unknown'

    return {
      userId,
      userName,
      totals: {
        referrals: userReferrals.length,
        completedReferrals: completedReferrals.length,
        pendingReferrals: pendingReferrals.length,
        totalEarned,
        lifetimeValue
      },
      currentTier,
      nextTier,
      progressToNextTier,
      performance: {
        conversionRate,
        averageValue,
        topMonth
      },
      recentReferrals: userReferrals.slice(-10).reverse()
    }
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(
    period: 'all-time' | 'monthly' | 'weekly' = 'all-time',
    limit: number = 100
  ): Promise<LeaderboardEntry[]> {
    // Group referrals by user
    const userStats = new Map<string, {
      userName: string
      totalReferrals: number
      monthlyReferrals: number
      totalEarned: number
    }>()

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    for (const referral of this.referrals.values()) {
      if (!userStats.has(referral.referrerId)) {
        const code = Array.from(this.referralCodes.values())
          .find(rc => rc.userId === referral.referrerId)

        userStats.set(referral.referrerId, {
          userName: code?.userName || 'Unknown',
          totalReferrals: 0,
          monthlyReferrals: 0,
          totalEarned: 0
        })
      }

      const stats = userStats.get(referral.referrerId)!

      if (referral.status === 'completed' || referral.status === 'rewarded') {
        stats.totalReferrals++
        stats.totalEarned += referral.rewards.referrerCredits

        if (referral.completedAt) {
          if (period === 'monthly' && referral.completedAt >= monthStart) {
            stats.monthlyReferrals++
          } else if (period === 'weekly' && referral.completedAt >= weekStart) {
            stats.monthlyReferrals++
          }
        }
      }
    }

    // Convert to leaderboard entries
    const entries: LeaderboardEntry[] = []
    for (const [userId, stats] of userStats.entries()) {
      const tier = this.getTierForReferralCount(stats.totalReferrals)

      entries.push({
        rank: 0, // Will be set after sorting
        userId,
        userName: stats.userName,
        stats: {
          totalReferrals: stats.totalReferrals,
          monthlyReferrals: stats.monthlyReferrals,
          totalEarned: stats.totalEarned
        },
        tier,
        badges: [tier.badge.name]
      })
    }

    // Sort based on period
    if (period === 'all-time') {
      entries.sort((a, b) => b.stats.totalReferrals - a.stats.totalReferrals)
    } else {
      entries.sort((a, b) => b.stats.monthlyReferrals - a.stats.monthlyReferrals)
    }

    // Assign ranks
    entries.forEach((entry, index) => {
      entry.rank = index + 1
    })

    return entries.slice(0, limit)
  }

  /**
   * Award reward to user
   */
  private async awardReward(params: {
    userId: string
    referralId: string
    type: ReferralReward['type']
    amount: number
    description?: string
  }): Promise<ReferralReward> {
    const reward: ReferralReward = {
      id: `reward_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: params.userId,
      referralId: params.referralId,
      type: params.type,
      amount: params.amount,
      currency: 'credits',
      status: 'approved',
      approvedAt: new Date(),
      metadata: {
        description: params.description
      }
    }

    // Store reward
    if (!this.rewards.has(params.userId)) {
      this.rewards.set(params.userId, [])
    }
    this.rewards.get(params.userId)!.push(reward)

    // In production, actually credit user's account
    console.log(`Awarded ${params.amount} credits to user ${params.userId}`)

    return reward
  }

  /**
   * Get tier for referral count
   */
  private getTierForReferralCount(count: number): ReferralTier {
    for (let i = this.tiers.length - 1; i >= 0; i--) {
      if (count >= this.tiers[i].minReferrals) {
        return this.tiers[i]
      }
    }
    return this.tiers[0]
  }

  /**
   * Calculate monthly statistics
   */
  private calculateMonthlyStats(referrals: Referral[]): Array<{
    month: string
    referrals: number
    earned: number
  }> {
    const monthlyMap = new Map<string, { referrals: number; earned: number }>()

    for (const referral of referrals) {
      if (referral.completedAt) {
        const monthKey = referral.completedAt.toISOString().substr(0, 7) // YYYY-MM

        if (!monthlyMap.has(monthKey)) {
          monthlyMap.set(monthKey, { referrals: 0, earned: 0 })
        }

        const stats = monthlyMap.get(monthKey)!
        stats.referrals++
        stats.earned += referral.rewards.referrerCredits
      }
    }

    return Array.from(monthlyMap.entries()).map(([month, stats]) => ({
      month,
      ...stats
    }))
  }

  /**
   * Generate unique referral code
   */
  private generateCode(userName: string): string {
    // Create code from username + random suffix
    const cleanName = userName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substr(0, 8)

    const suffix = Math.random().toString(36).substr(2, 4).toUpperCase()

    return `${cleanName}${suffix}`
  }

  /**
   * Get all referral codes for user
   */
  async getUserReferralCodes(userId: string): Promise<ReferralCode[]> {
    return Array.from(this.referralCodes.values())
      .filter(rc => rc.userId === userId)
  }

  /**
   * Get referral by ID
   */
  async getReferral(referralId: string): Promise<Referral | null> {
    return this.referrals.get(referralId) || null
  }

  /**
   * Get all rewards for user
   */
  async getUserRewards(userId: string): Promise<ReferralReward[]> {
    return this.rewards.get(userId) || []
  }
}
