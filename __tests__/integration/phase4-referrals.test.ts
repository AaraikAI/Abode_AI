/**
 * Integration Tests for Referral System
 */

import { ReferralSystemService } from '@/lib/services/referral-system'

describe('Referral System Service', () => {
  let service: ReferralSystemService

  beforeEach(() => {
    service = new ReferralSystemService()
  })

  describe('Referral Code Generation', () => {
    test('should generate unique referral code', async () => {
      const code = await service.generateReferralCode(
        'user-123',
        'testuser',
        {}
      )

      expect(code).toBeDefined()
      expect(code.code).toBeDefined()
      expect(code.code.length).toBeGreaterThan(0)
      expect(code.userId).toBe('user-123')
      expect(code.userName).toBe('testuser')
      expect(code.rewards.referrerBonus).toBe(100)
      expect(code.rewards.refereeBonus).toBe(50)
    })

    test('should create custom referral code', async () => {
      const code = await service.generateReferralCode(
        'user-123',
        'testuser',
        {
          customCode: 'CUSTOM2024',
          referrerBonus: 200,
          refereeBonus: 100
        }
      )

      expect(code.code).toBe('CUSTOM2024')
      expect(code.rewards.referrerBonus).toBe(200)
      expect(code.rewards.refereeBonus).toBe(100)
    })

    test('should create code with expiration', async () => {
      const expiresIn = 30 // 30 days
      const code = await service.generateReferralCode(
        'user-123',
        'testuser',
        { expiresIn }
      )

      expect(code.expiresAt).toBeDefined()
      const daysUntilExpiry = Math.floor(
        (code.expiresAt!.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
      expect(daysUntilExpiry).toBeLessThanOrEqual(expiresIn)
      expect(daysUntilExpiry).toBeGreaterThan(expiresIn - 1)
    })

    test('should create code with usage limit', async () => {
      const code = await service.generateReferralCode(
        'user-123',
        'testuser',
        { maxUses: 10 }
      )

      expect(code.limits.maxUses).toBe(10)
      expect(code.limits.currentUses).toBe(0)
    })

    test('should reject duplicate custom code', async () => {
      await service.generateReferralCode('user-123', 'testuser', {
        customCode: 'DUPLICATE'
      })

      await expect(
        service.generateReferralCode('user-456', 'otheruser', {
          customCode: 'DUPLICATE'
        })
      ).rejects.toThrow('Referral code already exists')
    })
  })

  describe('Referral Application', () => {
    test('should apply valid referral code', async () => {
      const code = await service.generateReferralCode(
        'referrer-123',
        'referrer',
        {}
      )

      const result = await service.applyReferralCode(code.code, 'referee-456')

      expect(result.valid).toBe(true)
      expect(result.referral).toBeDefined()
      expect(result.referral!.referrerId).toBe('referrer-123')
      expect(result.referral!.refereeId).toBe('referee-456')
      expect(result.referral!.status).toBe('pending')
      expect(result.referral!.milestones.signedUp).toBe(true)
    })

    test('should reject invalid code', async () => {
      const result = await service.applyReferralCode('INVALID', 'referee-456')

      expect(result.valid).toBe(false)
      expect(result.reason).toBe('Invalid referral code')
    })

    test('should reject expired code', async () => {
      const code = await service.generateReferralCode(
        'referrer-123',
        'referrer',
        { expiresIn: -1 } // Already expired
      )

      const result = await service.applyReferralCode(code.code, 'referee-456')

      expect(result.valid).toBe(false)
      expect(result.reason).toBe('Referral code expired')
    })

    test('should reject self-referral', async () => {
      const code = await service.generateReferralCode(
        'user-123',
        'testuser',
        {}
      )

      const result = await service.applyReferralCode(code.code, 'user-123')

      expect(result.valid).toBe(false)
      expect(result.reason).toBe('Cannot refer yourself')
    })

    test('should reject code at usage limit', async () => {
      const code = await service.generateReferralCode(
        'referrer-123',
        'referrer',
        { maxUses: 1 }
      )

      // First application should succeed
      const result1 = await service.applyReferralCode(code.code, 'referee-1')
      expect(result1.valid).toBe(true)

      // Second application should fail
      const result2 = await service.applyReferralCode(code.code, 'referee-2')
      expect(result2.valid).toBe(false)
      expect(result2.reason).toBe('Referral code usage limit reached')
    })
  })

  describe('Milestone Completion', () => {
    test('should complete verification milestone', async () => {
      const code = await service.generateReferralCode(
        'referrer-123',
        'referrer',
        {}
      )

      const applyResult = await service.applyReferralCode(code.code, 'referee-456')
      const referralId = applyResult.referral!.id

      const result = await service.completeMilestone(referralId, 'verified')

      expect(result.completed).toBe(true)
      expect(result.rewards.length).toBeGreaterThan(0)
      expect(result.rewards[0].type).toBe('verification')
    })

    test('should complete first purchase milestone', async () => {
      const code = await service.generateReferralCode(
        'referrer-123',
        'referrer',
        {}
      )

      const applyResult = await service.applyReferralCode(code.code, 'referee-456')
      const referralId = applyResult.referral!.id

      // Complete verified first
      await service.completeMilestone(referralId, 'verified')

      // Then complete first purchase
      const result = await service.completeMilestone(referralId, 'firstPurchase')

      expect(result.completed).toBe(true)
      expect(result.rewards.length).toBeGreaterThan(0)
      expect(result.rewards[0].type).toBe('purchase')
    })

    test('should apply tier multiplier to rewards', async () => {
      // Create referrer with multiple completed referrals to reach higher tier
      const code = await service.generateReferralCode(
        'referrer-123',
        'referrer',
        {}
      )

      // Create and complete 5 referrals to reach Builder tier
      for (let i = 0; i < 5; i++) {
        const result = await service.applyReferralCode(code.code, `referee-${i}`)
        await service.completeMilestone(result.referral!.id, 'verified')
        await service.completeMilestone(result.referral!.id, 'firstPurchase')
      }

      // Get stats to verify tier
      const stats = await service.getReferralStats('referrer-123')
      expect(stats.currentTier.name).toBe('Builder')
      expect(stats.currentTier.benefits.bonusMultiplier).toBe(1.25)

      // New referral should get 1.25x multiplier
      const newResult = await service.applyReferralCode(code.code, 'referee-new')
      await service.completeMilestone(newResult.referral!.id, 'verified')
      const purchaseResult = await service.completeMilestone(
        newResult.referral!.id,
        'firstPurchase'
      )

      // Base reward is 100, with 1.25x multiplier = 125
      expect(purchaseResult.rewards[0].amount).toBeGreaterThanOrEqual(125)
    })
  })

  describe('Referral Statistics', () => {
    test('should get referral stats for user', async () => {
      const code = await service.generateReferralCode(
        'referrer-123',
        'referrer',
        {}
      )

      // Create a few referrals
      await service.applyReferralCode(code.code, 'referee-1')
      await service.applyReferralCode(code.code, 'referee-2')
      await service.applyReferralCode(code.code, 'referee-3')

      const stats = await service.getReferralStats('referrer-123')

      expect(stats.totals.referrals).toBe(3)
      expect(stats.totals.pendingReferrals).toBe(3)
      expect(stats.totals.completedReferrals).toBe(0)
      expect(stats.currentTier.name).toBe('Starter')
    })

    test('should calculate conversion rate', async () => {
      const code = await service.generateReferralCode(
        'referrer-123',
        'referrer',
        {}
      )

      // Create 5 referrals, complete 3
      for (let i = 0; i < 5; i++) {
        const result = await service.applyReferralCode(code.code, `referee-${i}`)
        if (i < 3) {
          await service.completeMilestone(result.referral!.id, 'verified')
          await service.completeMilestone(result.referral!.id, 'firstPurchase')
        }
      }

      const stats = await service.getReferralStats('referrer-123')

      expect(stats.performance.conversionRate).toBe(60) // 3/5 = 60%
      expect(stats.totals.completedReferrals).toBe(3)
    })
  })

  describe('Leaderboard', () => {
    test('should generate all-time leaderboard', async () => {
      // Create multiple users with referrals
      const users = ['user-1', 'user-2', 'user-3']

      for (const userId of users) {
        const code = await service.generateReferralCode(userId, userId, {})

        // Give each user different number of referrals
        const referralCount = users.indexOf(userId) + 1
        for (let i = 0; i < referralCount * 2; i++) {
          const result = await service.applyReferralCode(
            code.code,
            `${userId}-referee-${i}`
          )
          await service.completeMilestone(result.referral!.id, 'verified')
          await service.completeMilestone(result.referral!.id, 'firstPurchase')
        }
      }

      const leaderboard = await service.getLeaderboard('all-time', 10)

      expect(leaderboard.length).toBe(3)
      expect(leaderboard[0].rank).toBe(1)
      expect(leaderboard[0].userId).toBe('user-3') // Most referrals
      expect(leaderboard[1].userId).toBe('user-2')
      expect(leaderboard[2].userId).toBe('user-1')
    })

    test('should include tier information in leaderboard', async () => {
      const code = await service.generateReferralCode('user-1', 'user1', {})

      // Create 20 referrals to reach Architect tier
      for (let i = 0; i < 20; i++) {
        const result = await service.applyReferralCode(code.code, `referee-${i}`)
        await service.completeMilestone(result.referral!.id, 'verified')
        await service.completeMilestone(result.referral!.id, 'firstPurchase')
      }

      const leaderboard = await service.getLeaderboard('all-time', 10)

      expect(leaderboard[0].tier.name).toBe('Architect')
      expect(leaderboard[0].stats.totalReferrals).toBe(20)
    })
  })

  describe('Tier System', () => {
    test('should start at Starter tier', async () => {
      const stats = await service.getReferralStats('new-user')

      expect(stats.currentTier.name).toBe('Starter')
      expect(stats.currentTier.benefits.bonusMultiplier).toBe(1.0)
    })

    test('should progress to Builder tier at 5 referrals', async () => {
      const code = await service.generateReferralCode('user-1', 'user1', {})

      for (let i = 0; i < 5; i++) {
        const result = await service.applyReferralCode(code.code, `referee-${i}`)
        await service.completeMilestone(result.referral!.id, 'verified')
        await service.completeMilestone(result.referral!.id, 'firstPurchase')
      }

      const stats = await service.getReferralStats('user-1')

      expect(stats.currentTier.name).toBe('Builder')
      expect(stats.currentTier.benefits.bonusMultiplier).toBe(1.25)
    })

    test('should progress to Architect tier at 15 referrals', async () => {
      const code = await service.generateReferralCode('user-1', 'user1', {})

      for (let i = 0; i < 15; i++) {
        const result = await service.applyReferralCode(code.code, `referee-${i}`)
        await service.completeMilestone(result.referral!.id, 'verified')
        await service.completeMilestone(result.referral!.id, 'firstPurchase')
      }

      const stats = await service.getReferralStats('user-1')

      expect(stats.currentTier.name).toBe('Architect')
      expect(stats.currentTier.benefits.bonusMultiplier).toBe(1.5)
    })

    test('should progress to Visionary tier at 50 referrals', async () => {
      const code = await service.generateReferralCode('user-1', 'user1', {})

      for (let i = 0; i < 50; i++) {
        const result = await service.applyReferralCode(code.code, `referee-${i}`)
        await service.completeMilestone(result.referral!.id, 'verified')
        await service.completeMilestone(result.referral!.id, 'firstPurchase')
      }

      const stats = await service.getReferralStats('user-1')

      expect(stats.currentTier.name).toBe('Visionary')
      expect(stats.currentTier.benefits.bonusMultiplier).toBe(2.0)
    })
  })
})
