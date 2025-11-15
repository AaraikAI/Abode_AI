/**
 * Referral System Service Test Suite
 *
 * Comprehensive tests for referral code generation, tracking, rewards, and analytics
 */

import { describe, it, expect, beforeEach } from '@jest/globals'
import {
  ReferralSystemService,
  type ReferralCode,
  type Referral,
  type ReferralReward,
  type ReferralTier,
  type ReferralStats
} from '../../lib/services/referral-system'

describe('ReferralSystemService', () => {
  let service: ReferralSystemService

  beforeEach(() => {
    service = new ReferralSystemService()
  })

  // ===========================
  // Code Generation Tests
  // ===========================

  describe('Referral Code Generation', () => {
    it('should generate referral code successfully', async () => {
      const code = await service.generateReferralCode('user-1', 'JohnDoe')

      expect(code).toBeDefined()
      expect(code.code).toBeDefined()
      expect(code.userId).toBe('user-1')
      expect(code.userName).toBe('JohnDoe')
    })

    it('should generate unique codes for different users', async () => {
      const code1 = await service.generateReferralCode('user-1', 'Alice')
      const code2 = await service.generateReferralCode('user-2', 'Bob')

      expect(code1.code).not.toBe(code2.code)
    })

    it('should accept custom referral code', async () => {
      const code = await service.generateReferralCode('user-1', 'Alice', {
        customCode: 'ALICE2024'
      })

      expect(code.code).toBe('ALICE2024')
    })

    it('should reject duplicate custom codes', async () => {
      await service.generateReferralCode('user-1', 'Alice', {
        customCode: 'DUPLICATE'
      })

      await expect(
        service.generateReferralCode('user-2', 'Bob', {
          customCode: 'DUPLICATE'
        })
      ).rejects.toThrow('Referral code already exists')
    })

    it('should set creation timestamp', async () => {
      const before = new Date()
      const code = await service.generateReferralCode('user-1', 'Alice')
      const after = new Date()

      expect(code.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime())
      expect(code.createdAt.getTime()).toBeLessThanOrEqual(after.getTime())
    })

    it('should set expiration date when specified', async () => {
      const code = await service.generateReferralCode('user-1', 'Alice', {
        expiresIn: 30 // 30 days
      })

      expect(code.expiresAt).toBeDefined()
      const expectedExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      expect(code.expiresAt!.getTime()).toBeCloseTo(expectedExpiry.getTime(), -4)
    })

    it('should initialize usage limits', async () => {
      const code = await service.generateReferralCode('user-1', 'Alice', {
        maxUses: 10
      })

      expect(code.limits.maxUses).toBe(10)
      expect(code.limits.currentUses).toBe(0)
    })

    it('should set default referrer bonus', async () => {
      const code = await service.generateReferralCode('user-1', 'Alice')

      expect(code.rewards.referrerBonus).toBe(100)
      expect(code.rewards.refereeBonus).toBe(50)
    })

    it('should accept custom reward amounts', async () => {
      const code = await service.generateReferralCode('user-1', 'Alice', {
        referrerBonus: 200,
        refereeBonus: 100
      })

      expect(code.rewards.referrerBonus).toBe(200)
      expect(code.rewards.refereeBonus).toBe(100)
    })

    it('should store campaign metadata', async () => {
      const code = await service.generateReferralCode('user-1', 'Alice', {
        campaign: 'spring-2024'
      })

      expect(code.metadata?.campaign).toBe('spring-2024')
    })

    it('should generate code from username', async () => {
      const code = await service.generateReferralCode('user-1', 'John Doe')

      expect(code.code).toMatch(/johndoe/i)
    })

    it('should handle special characters in username', async () => {
      const code = await service.generateReferralCode('user-1', 'John@Doe#123')

      expect(code.code).toBeDefined()
      expect(code.code).not.toContain('@')
      expect(code.code).not.toContain('#')
    })
  })

  // ===========================
  // Attribution Tracking Tests
  // ===========================

  describe('Attribution Tracking', () => {
    it('should apply referral code successfully', async () => {
      const code = await service.generateReferralCode('user-1', 'Alice')
      const result = await service.applyReferralCode(code.code, 'user-2')

      expect(result.valid).toBe(true)
      expect(result.referral).toBeDefined()
      expect(result.referral?.referrerId).toBe('user-1')
      expect(result.referral?.refereeId).toBe('user-2')
    })

    it('should reject invalid referral code', async () => {
      const result = await service.applyReferralCode('INVALID', 'user-2')

      expect(result.valid).toBe(false)
      expect(result.reason).toBe('Invalid referral code')
    })

    it('should reject expired referral code', async () => {
      const code = await service.generateReferralCode('user-1', 'Alice', {
        expiresIn: -1 // Expired yesterday
      })

      const result = await service.applyReferralCode(code.code, 'user-2')

      expect(result.valid).toBe(false)
      expect(result.reason).toBe('Referral code expired')
    })

    it('should reject self-referral', async () => {
      const code = await service.generateReferralCode('user-1', 'Alice')
      const result = await service.applyReferralCode(code.code, 'user-1')

      expect(result.valid).toBe(false)
      expect(result.reason).toBe('Cannot refer yourself')
    })

    it('should enforce usage limits', async () => {
      const code = await service.generateReferralCode('user-1', 'Alice', {
        maxUses: 2
      })

      await service.applyReferralCode(code.code, 'user-2')
      await service.applyReferralCode(code.code, 'user-3')
      const result = await service.applyReferralCode(code.code, 'user-4')

      expect(result.valid).toBe(false)
      expect(result.reason).toBe('Referral code usage limit reached')
    })

    it('should increment usage count on successful application', async () => {
      const code = await service.generateReferralCode('user-1', 'Alice')
      expect(code.limits.currentUses).toBe(0)

      await service.applyReferralCode(code.code, 'user-2')
      const codes = await service.getUserReferralCodes('user-1')
      expect(codes[0].limits.currentUses).toBe(1)
    })

    it('should create referral with pending status', async () => {
      const code = await service.generateReferralCode('user-1', 'Alice')
      const result = await service.applyReferralCode(code.code, 'user-2')

      expect(result.referral?.status).toBe('pending')
    })

    it('should mark signup milestone on application', async () => {
      const code = await service.generateReferralCode('user-1', 'Alice')
      const result = await service.applyReferralCode(code.code, 'user-2')

      expect(result.referral?.milestones.signedUp).toBe(true)
      expect(result.referral?.milestones.signedUpAt).toBeDefined()
    })

    it('should award signup bonus to referee', async () => {
      const code = await service.generateReferralCode('user-1', 'Alice', {
        refereeBonus: 75
      })
      const result = await service.applyReferralCode(code.code, 'user-2')

      expect(result.referral?.rewards.refereeCredits).toBe(75)
    })

    it('should generate unique referral IDs', async () => {
      const code = await service.generateReferralCode('user-1', 'Alice')
      const result1 = await service.applyReferralCode(code.code, 'user-2')
      const result2 = await service.applyReferralCode(code.code, 'user-3')

      expect(result1.referral?.id).not.toBe(result2.referral?.id)
    })
  })

  // ===========================
  // Reward Calculation Tests
  // ===========================

  describe('Reward Calculation', () => {
    it('should calculate verification milestone reward', async () => {
      const code = await service.generateReferralCode('user-1', 'Alice')
      const { referral } = await service.applyReferralCode(code.code, 'user-2')

      const result = await service.completeMilestone(referral!.id, 'verified')

      expect(result.completed).toBe(true)
      expect(result.rewards.length).toBeGreaterThan(0)
      expect(result.rewards[0].type).toBe('verification')
    })

    it('should calculate purchase milestone reward', async () => {
      const code = await service.generateReferralCode('user-1', 'Alice', {
        referrerBonus: 100
      })
      const { referral } = await service.applyReferralCode(code.code, 'user-2')

      const result = await service.completeMilestone(referral!.id, 'firstPurchase')

      expect(result.completed).toBe(true)
      expect(result.rewards.length).toBeGreaterThan(0)
      expect(result.rewards[0].type).toBe('purchase')
    })

    it('should apply tier multiplier to rewards', async () => {
      const code = await service.generateReferralCode('user-1', 'Alice', {
        referrerBonus: 100
      })

      // Create multiple referrals to advance tier
      for (let i = 0; i < 5; i++) {
        const { referral } = await service.applyReferralCode(code.code, `user-${i + 2}`)
        await service.completeMilestone(referral!.id, 'verified')
        await service.completeMilestone(referral!.id, 'firstPurchase')
      }

      // Next referral should have higher multiplier
      const { referral } = await service.applyReferralCode(code.code, 'user-10')
      const result = await service.completeMilestone(referral!.id, 'firstPurchase')

      expect(result.rewards[0].amount).toBeGreaterThan(100)
    })

    it('should update referral status to completed on first purchase', async () => {
      const code = await service.generateReferralCode('user-1', 'Alice')
      const { referral } = await service.applyReferralCode(code.code, 'user-2')

      await service.completeMilestone(referral!.id, 'firstPurchase')
      const updated = await service.getReferral(referral!.id)

      expect(updated?.status).toBe('completed')
      expect(updated?.completedAt).toBeDefined()
    })

    it('should update referral status to rewarded when all milestones complete', async () => {
      const code = await service.generateReferralCode('user-1', 'Alice')
      const { referral } = await service.applyReferralCode(code.code, 'user-2')

      await service.completeMilestone(referral!.id, 'verified')
      await service.completeMilestone(referral!.id, 'firstPurchase')
      const updated = await service.getReferral(referral!.id)

      expect(updated?.status).toBe('rewarded')
    })

    it('should track total reward value', async () => {
      const code = await service.generateReferralCode('user-1', 'Alice')
      const { referral } = await service.applyReferralCode(code.code, 'user-2')

      await service.completeMilestone(referral!.id, 'verified')
      await service.completeMilestone(referral!.id, 'firstPurchase')
      const updated = await service.getReferral(referral!.id)

      expect(updated?.rewards.totalValue).toBeGreaterThan(0)
    })

    it('should award retention bonus for monthly active', async () => {
      const code = await service.generateReferralCode('user-1', 'Alice')
      const { referral } = await service.applyReferralCode(code.code, 'user-2')

      const result = await service.completeMilestone(referral!.id, 'monthlyActive')

      expect(result.rewards.length).toBeGreaterThan(0)
      expect(result.rewards[0].type).toBe('milestone')
    })
  })

  // ===========================
  // Fraud Detection Tests
  // ===========================

  describe('Fraud Detection', () => {
    it('should prevent self-referral fraud', async () => {
      const code = await service.generateReferralCode('user-1', 'Alice')
      const result = await service.applyReferralCode(code.code, 'user-1')

      expect(result.valid).toBe(false)
      expect(result.reason).toContain('yourself')
    })

    it('should enforce expiration dates', async () => {
      const code = await service.generateReferralCode('user-1', 'Alice', {
        expiresIn: -1
      })

      const result = await service.applyReferralCode(code.code, 'user-2')

      expect(result.valid).toBe(false)
      expect(result.reason).toContain('expired')
    })

    it('should enforce usage limits', async () => {
      const code = await service.generateReferralCode('user-1', 'Alice', {
        maxUses: 1
      })

      await service.applyReferralCode(code.code, 'user-2')
      const result = await service.applyReferralCode(code.code, 'user-3')

      expect(result.valid).toBe(false)
    })
  })

  // ===========================
  // Conversion Tracking Tests
  // ===========================

  describe('Conversion Tracking', () => {
    it('should track signup milestone', async () => {
      const code = await service.generateReferralCode('user-1', 'Alice')
      const { referral } = await service.applyReferralCode(code.code, 'user-2')

      expect(referral?.milestones.signedUp).toBe(true)
      expect(referral?.milestones.signedUpAt).toBeDefined()
    })

    it('should track verification milestone', async () => {
      const code = await service.generateReferralCode('user-1', 'Alice')
      const { referral } = await service.applyReferralCode(code.code, 'user-2')

      await service.completeMilestone(referral!.id, 'verified')
      const updated = await service.getReferral(referral!.id)

      expect(updated?.milestones.verified).toBe(true)
      expect(updated?.milestones.verifiedAt).toBeDefined()
    })

    it('should track first purchase milestone', async () => {
      const code = await service.generateReferralCode('user-1', 'Alice')
      const { referral } = await service.applyReferralCode(code.code, 'user-2')

      await service.completeMilestone(referral!.id, 'firstPurchase')
      const updated = await service.getReferral(referral!.id)

      expect(updated?.milestones.firstPurchase).toBe(true)
      expect(updated?.milestones.firstPurchaseAt).toBeDefined()
    })

    it('should track monthly active milestone', async () => {
      const code = await service.generateReferralCode('user-1', 'Alice')
      const { referral } = await service.applyReferralCode(code.code, 'user-2')

      await service.completeMilestone(referral!.id, 'monthlyActive')
      const updated = await service.getReferral(referral!.id)

      expect(updated?.milestones.monthlyActive).toBe(true)
    })

    it('should calculate conversion rate', async () => {
      const code = await service.generateReferralCode('user-1', 'Alice')

      // Create multiple referrals with different completion states
      await service.applyReferralCode(code.code, 'user-2')
      const { referral: ref3 } = await service.applyReferralCode(code.code, 'user-3')
      await service.completeMilestone(ref3!.id, 'firstPurchase')

      const stats = await service.getReferralStats('user-1')

      expect(stats.performance.conversionRate).toBeDefined()
      expect(stats.performance.conversionRate).toBeGreaterThan(0)
      expect(stats.performance.conversionRate).toBeLessThanOrEqual(100)
    })
  })

  // ===========================
  // Referral Analytics Tests
  // ===========================

  describe('Referral Analytics', () => {
    it('should get referral stats for user', async () => {
      const code = await service.generateReferralCode('user-1', 'Alice')
      await service.applyReferralCode(code.code, 'user-2')

      const stats = await service.getReferralStats('user-1')

      expect(stats).toBeDefined()
      expect(stats.userId).toBe('user-1')
      expect(stats.userName).toBe('Alice')
    })

    it('should count total referrals', async () => {
      const code = await service.generateReferralCode('user-1', 'Alice')
      await service.applyReferralCode(code.code, 'user-2')
      await service.applyReferralCode(code.code, 'user-3')

      const stats = await service.getReferralStats('user-1')

      expect(stats.totals.referrals).toBe(2)
    })

    it('should count completed referrals', async () => {
      const code = await service.generateReferralCode('user-1', 'Alice')
      const { referral: ref1 } = await service.applyReferralCode(code.code, 'user-2')
      await service.applyReferralCode(code.code, 'user-3')

      await service.completeMilestone(ref1!.id, 'firstPurchase')
      const stats = await service.getReferralStats('user-1')

      expect(stats.totals.completedReferrals).toBe(1)
      expect(stats.totals.pendingReferrals).toBe(1)
    })

    it('should calculate total earned', async () => {
      const code = await service.generateReferralCode('user-1', 'Alice')
      const { referral } = await service.applyReferralCode(code.code, 'user-2')

      await service.completeMilestone(referral!.id, 'verified')
      await service.completeMilestone(referral!.id, 'firstPurchase')

      const stats = await service.getReferralStats('user-1')

      expect(stats.totals.totalEarned).toBeGreaterThan(0)
    })

    it('should determine current tier', async () => {
      const code = await service.generateReferralCode('user-1', 'Alice')
      const stats = await service.getReferralStats('user-1')

      expect(stats.currentTier).toBeDefined()
      expect(stats.currentTier.name).toBe('Starter')
    })

    it('should show progress to next tier', async () => {
      const code = await service.generateReferralCode('user-1', 'Alice')
      const { referral } = await service.applyReferralCode(code.code, 'user-2')
      await service.completeMilestone(referral!.id, 'firstPurchase')

      const stats = await service.getReferralStats('user-1')

      expect(stats.nextTier).toBeDefined()
      expect(stats.progressToNextTier).toBeDefined()
    })

    it('should calculate average referral value', async () => {
      const code = await service.generateReferralCode('user-1', 'Alice')
      const { referral } = await service.applyReferralCode(code.code, 'user-2')
      await service.completeMilestone(referral!.id, 'firstPurchase')

      const stats = await service.getReferralStats('user-1')

      expect(stats.performance.averageValue).toBeGreaterThan(0)
    })

    it('should track top performing month', async () => {
      const code = await service.generateReferralCode('user-1', 'Alice')
      const { referral } = await service.applyReferralCode(code.code, 'user-2')
      await service.completeMilestone(referral!.id, 'firstPurchase')

      const stats = await service.getReferralStats('user-1')

      expect(stats.performance.topMonth).toBeDefined()
      expect(stats.performance.topMonth.month).toBeDefined()
    })

    it('should include recent referrals', async () => {
      const code = await service.generateReferralCode('user-1', 'Alice')
      await service.applyReferralCode(code.code, 'user-2')
      await service.applyReferralCode(code.code, 'user-3')

      const stats = await service.getReferralStats('user-1')

      expect(stats.recentReferrals).toBeDefined()
      expect(stats.recentReferrals.length).toBe(2)
    })

    it('should limit recent referrals to 10', async () => {
      const code = await service.generateReferralCode('user-1', 'Alice')

      for (let i = 0; i < 15; i++) {
        await service.applyReferralCode(code.code, `user-${i + 2}`)
      }

      const stats = await service.getReferralStats('user-1')

      expect(stats.recentReferrals.length).toBe(10)
    })
  })

  // ===========================
  // Payout Processing Tests
  // ===========================

  describe('Payout Processing', () => {
    it('should create reward with approved status', async () => {
      const code = await service.generateReferralCode('user-1', 'Alice')
      const { referral } = await service.applyReferralCode(code.code, 'user-2')

      const rewards = await service.getUserRewards('user-2')

      expect(rewards.length).toBeGreaterThan(0)
      expect(rewards[0].status).toBe('approved')
    })

    it('should set approval timestamp', async () => {
      const code = await service.generateReferralCode('user-1', 'Alice')
      await service.applyReferralCode(code.code, 'user-2')

      const rewards = await service.getUserRewards('user-2')

      expect(rewards[0].approvedAt).toBeDefined()
    })

    it('should track reward amounts', async () => {
      const code = await service.generateReferralCode('user-1', 'Alice', {
        refereeBonus: 75
      })
      await service.applyReferralCode(code.code, 'user-2')

      const rewards = await service.getUserRewards('user-2')

      expect(rewards[0].amount).toBe(75)
    })

    it('should use credits currency', async () => {
      const code = await service.generateReferralCode('user-1', 'Alice')
      await service.applyReferralCode(code.code, 'user-2')

      const rewards = await service.getUserRewards('user-2')

      expect(rewards[0].currency).toBe('credits')
    })

    it('should generate unique reward IDs', async () => {
      const code = await service.generateReferralCode('user-1', 'Alice')
      const { referral } = await service.applyReferralCode(code.code, 'user-2')
      await service.completeMilestone(referral!.id, 'verified')

      const rewards = await service.getUserRewards('user-2')

      expect(rewards[0].id).toMatch(/^reward_/)
    })

    it('should get all rewards for user', async () => {
      const code = await service.generateReferralCode('user-1', 'Alice')
      const { referral } = await service.applyReferralCode(code.code, 'user-2')
      await service.completeMilestone(referral!.id, 'verified')

      const rewards = await service.getUserRewards('user-1')

      expect(Array.isArray(rewards)).toBe(true)
    })
  })

  // ===========================
  // Leaderboard Tests
  // ===========================

  describe('Leaderboard', () => {
    it('should generate leaderboard', async () => {
      const code1 = await service.generateReferralCode('user-1', 'Alice')
      const code2 = await service.generateReferralCode('user-2', 'Bob')

      const { referral: ref1 } = await service.applyReferralCode(code1.code, 'user-10')
      await service.completeMilestone(ref1!.id, 'firstPurchase')

      const leaderboard = await service.getLeaderboard()

      expect(leaderboard).toBeDefined()
      expect(Array.isArray(leaderboard)).toBe(true)
    })

    it('should rank users by total referrals', async () => {
      const code1 = await service.generateReferralCode('user-1', 'Alice')
      const code2 = await service.generateReferralCode('user-2', 'Bob')

      const { referral: ref1 } = await service.applyReferralCode(code1.code, 'user-10')
      const { referral: ref2 } = await service.applyReferralCode(code1.code, 'user-11')
      const { referral: ref3 } = await service.applyReferralCode(code2.code, 'user-12')

      await service.completeMilestone(ref1!.id, 'firstPurchase')
      await service.completeMilestone(ref2!.id, 'firstPurchase')
      await service.completeMilestone(ref3!.id, 'firstPurchase')

      const leaderboard = await service.getLeaderboard()

      expect(leaderboard[0].rank).toBe(1)
      expect(leaderboard[0].stats.totalReferrals).toBeGreaterThanOrEqual(
        leaderboard[1].stats.totalReferrals
      )
    })

    it('should include user tier in leaderboard', async () => {
      const code = await service.generateReferralCode('user-1', 'Alice')
      const { referral } = await service.applyReferralCode(code.code, 'user-2')
      await service.completeMilestone(referral!.id, 'firstPurchase')

      const leaderboard = await service.getLeaderboard()

      expect(leaderboard[0].tier).toBeDefined()
      expect(leaderboard[0].tier.name).toBeDefined()
    })

    it('should limit leaderboard results', async () => {
      for (let i = 0; i < 10; i++) {
        const code = await service.generateReferralCode(`user-${i}`, `User${i}`)
        const { referral } = await service.applyReferralCode(code.code, `referee-${i}`)
        await service.completeMilestone(referral!.id, 'firstPurchase')
      }

      const leaderboard = await service.getLeaderboard('all-time', 5)

      expect(leaderboard.length).toBeLessThanOrEqual(5)
    })

    it('should support monthly leaderboard', async () => {
      const leaderboard = await service.getLeaderboard('monthly')

      expect(leaderboard).toBeDefined()
      expect(Array.isArray(leaderboard)).toBe(true)
    })

    it('should support weekly leaderboard', async () => {
      const leaderboard = await service.getLeaderboard('weekly')

      expect(leaderboard).toBeDefined()
      expect(Array.isArray(leaderboard)).toBe(true)
    })

    it('should include badges in leaderboard', async () => {
      const code = await service.generateReferralCode('user-1', 'Alice')
      const { referral } = await service.applyReferralCode(code.code, 'user-2')
      await service.completeMilestone(referral!.id, 'firstPurchase')

      const leaderboard = await service.getLeaderboard()

      expect(leaderboard[0].badges).toBeDefined()
      expect(Array.isArray(leaderboard[0].badges)).toBe(true)
    })
  })

  // ===========================
  // Tier System Tests
  // ===========================

  describe('Tier System', () => {
    it('should start users at Starter tier', async () => {
      const stats = await service.getReferralStats('user-1')

      expect(stats.currentTier.name).toBe('Starter')
    })

    it('should advance to Builder tier with 5 referrals', async () => {
      const code = await service.generateReferralCode('user-1', 'Alice')

      for (let i = 0; i < 5; i++) {
        const { referral } = await service.applyReferralCode(code.code, `user-${i + 2}`)
        await service.completeMilestone(referral!.id, 'firstPurchase')
      }

      const stats = await service.getReferralStats('user-1')

      expect(stats.currentTier.name).toBe('Builder')
    })

    it('should advance to Architect tier with 15 referrals', async () => {
      const code = await service.generateReferralCode('user-1', 'Alice')

      for (let i = 0; i < 15; i++) {
        const { referral } = await service.applyReferralCode(code.code, `user-${i + 2}`)
        await service.completeMilestone(referral!.id, 'firstPurchase')
      }

      const stats = await service.getReferralStats('user-1')

      expect(stats.currentTier.name).toBe('Architect')
    })

    it('should advance to Visionary tier with 50 referrals', async () => {
      const code = await service.generateReferralCode('user-1', 'Alice')

      for (let i = 0; i < 50; i++) {
        const { referral } = await service.applyReferralCode(code.code, `user-${i + 2}`)
        await service.completeMilestone(referral!.id, 'firstPurchase')
      }

      const stats = await service.getReferralStats('user-1')

      expect(stats.currentTier.name).toBe('Visionary')
    })

    it('should include tier benefits', async () => {
      const stats = await service.getReferralStats('user-1')

      expect(stats.currentTier.benefits).toBeDefined()
      expect(stats.currentTier.benefits.bonusMultiplier).toBeDefined()
      expect(stats.currentTier.benefits.extraCredits).toBeDefined()
    })

    it('should include tier badge', async () => {
      const stats = await service.getReferralStats('user-1')

      expect(stats.currentTier.badge).toBeDefined()
      expect(stats.currentTier.badge.name).toBeDefined()
      expect(stats.currentTier.badge.icon).toBeDefined()
      expect(stats.currentTier.badge.color).toBeDefined()
    })
  })

  // ===========================
  // Helper Method Tests
  // ===========================

  describe('Helper Methods', () => {
    it('should get user referral codes', async () => {
      await service.generateReferralCode('user-1', 'Alice')
      await service.generateReferralCode('user-1', 'Alice', { customCode: 'ALICE2' })

      const codes = await service.getUserReferralCodes('user-1')

      expect(codes.length).toBe(2)
    })

    it('should get referral by ID', async () => {
      const code = await service.generateReferralCode('user-1', 'Alice')
      const { referral } = await service.applyReferralCode(code.code, 'user-2')

      const found = await service.getReferral(referral!.id)

      expect(found).toBeDefined()
      expect(found?.id).toBe(referral!.id)
    })

    it('should return null for non-existent referral', async () => {
      const found = await service.getReferral('non-existent')

      expect(found).toBeNull()
    })

    it('should get user rewards', async () => {
      const code = await service.generateReferralCode('user-1', 'Alice')
      const { referral } = await service.applyReferralCode(code.code, 'user-2')
      await service.completeMilestone(referral!.id, 'verified')

      const rewards = await service.getUserRewards('user-1')

      expect(Array.isArray(rewards)).toBe(true)
      expect(rewards.length).toBeGreaterThan(0)
    })

    it('should return empty array for user with no rewards', async () => {
      const rewards = await service.getUserRewards('new-user')

      expect(rewards).toEqual([])
    })
  })
})
