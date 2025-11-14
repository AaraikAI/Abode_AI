/**
 * Referrals API Endpoint
 *
 * Manages user referrals and rewards
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ReferralSystemService } from '@/lib/services/referral-system'

const referralService = new ReferralSystemService()

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, email')
      .eq('id', user.id)
      .single()

    const body = await request.json()
    const { action } = body

    if (action === 'generate-code') {
      // Generate referral code
      const code = await referralService.generateReferralCode(
        user.id,
        profile?.username || user.email || 'User',
        {
          customCode: body.customCode,
          maxUses: body.maxUses,
          expiresIn: body.expiresIn,
          campaign: body.campaign,
          referrerBonus: body.referrerBonus,
          refereeBonus: body.refereeBonus
        }
      )

      // Store in database
      await supabase.from('referral_codes').insert({
        code: code.code,
        user_id: user.id,
        user_name: code.userName,
        max_uses: code.limits.maxUses,
        current_uses: code.limits.currentUses,
        expires_at: code.expiresAt,
        referrer_bonus: code.rewards.referrerBonus,
        referee_bonus: code.rewards.refereeBonus,
        campaign: code.metadata?.campaign,
        created_at: code.createdAt
      })

      return NextResponse.json({
        success: true,
        code: code.code,
        url: `${process.env.NEXT_PUBLIC_APP_URL}/signup?ref=${code.code}`
      })
    } else if (action === 'apply-code') {
      // Apply referral code
      const { code } = body

      const result = await referralService.applyReferralCode(code, user.id)

      if (!result.valid) {
        return NextResponse.json({
          success: false,
          error: result.reason
        }, { status: 400 })
      }

      // Store referral in database
      await supabase.from('referrals').insert({
        id: result.referral!.id,
        referrer_id: result.referral!.referrerId,
        referee_id: result.referral!.refereeId,
        referral_code: result.referral!.referralCode,
        status: result.referral!.status,
        milestones: result.referral!.milestones,
        rewards: result.referral!.rewards,
        created_at: result.referral!.createdAt
      })

      return NextResponse.json({
        success: true,
        referral: {
          id: result.referral!.id,
          bonusCredits: result.referral!.rewards.refereeCredits
        }
      })
    } else if (action === 'complete-milestone') {
      // Complete referral milestone
      const { referralId, milestone } = body

      const result = await referralService.completeMilestone(referralId, milestone)

      if (result.completed) {
        // Update database
        const { data: referral } = await supabase
          .from('referrals')
          .select('*')
          .eq('id', referralId)
          .single()

        if (referral) {
          await supabase
            .from('referrals')
            .update({
              status: referral.status,
              milestones: referral.milestones,
              rewards: referral.rewards,
              completed_at: referral.completedAt
            })
            .eq('id', referralId)
        }

        // Store rewards
        for (const reward of result.rewards) {
          await supabase.from('referral_rewards').insert({
            id: reward.id,
            user_id: reward.userId,
            referral_id: reward.referralId,
            type: reward.type,
            amount: reward.amount,
            currency: reward.currency,
            status: reward.status,
            approved_at: reward.approvedAt
          })
        }
      }

      return NextResponse.json({
        success: result.completed,
        rewards: result.rewards
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    console.error('Referrals error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action') || 'stats'

    if (action === 'code') {
      // Get user's referral code
      const { data: code } = await supabase
        .from('referral_codes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (!code) {
        // Generate one if doesn't exist
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, email')
          .eq('id', user.id)
          .single()

        const newCode = await referralService.generateReferralCode(
          user.id,
          profile?.username || user.email || 'User'
        )

        await supabase.from('referral_codes').insert({
          code: newCode.code,
          user_id: user.id,
          user_name: newCode.userName,
          max_uses: newCode.limits.maxUses,
          current_uses: newCode.limits.currentUses,
          referrer_bonus: newCode.rewards.referrerBonus,
          referee_bonus: newCode.rewards.refereeBonus,
          created_at: newCode.createdAt
        })

        return NextResponse.json({
          success: true,
          code: newCode.code,
          url: `${process.env.NEXT_PUBLIC_APP_URL}/signup?ref=${newCode.code}`
        })
      }

      return NextResponse.json({
        success: true,
        code: code.code,
        url: `${process.env.NEXT_PUBLIC_APP_URL}/signup?ref=${code.code}`,
        uses: `${code.current_uses}${code.max_uses ? `/${code.max_uses}` : ''}`
      })
    } else if (action === 'stats') {
      // Get referral statistics
      const stats = await referralService.getReferralStats(user.id)

      return NextResponse.json({
        success: true,
        stats: {
          totals: stats.totals,
          currentTier: {
            name: stats.currentTier.name,
            badge: stats.currentTier.badge,
            benefits: stats.currentTier.benefits
          },
          nextTier: stats.nextTier ? {
            name: stats.nextTier.name,
            minReferrals: stats.nextTier.minReferrals
          } : null,
          progressToNextTier: stats.progressToNextTier,
          performance: stats.performance,
          recentReferrals: stats.recentReferrals.map(r => ({
            id: r.id,
            status: r.status,
            createdAt: r.createdAt,
            completedAt: r.completedAt,
            rewards: r.rewards.referrerCredits
          }))
        }
      })
    } else if (action === 'leaderboard') {
      // Get leaderboard
      const period = searchParams.get('period') as any || 'all-time'
      const limit = parseInt(searchParams.get('limit') || '100')

      const leaderboard = await referralService.getLeaderboard(period, limit)

      return NextResponse.json({
        success: true,
        leaderboard: leaderboard.map(entry => ({
          rank: entry.rank,
          userName: entry.userName,
          stats: entry.stats,
          tier: {
            name: entry.tier.name,
            badge: entry.tier.badge
          }
        }))
      })
    } else if (action === 'rewards') {
      // Get user's rewards
      const rewards = await referralService.getUserRewards(user.id)

      return NextResponse.json({
        success: true,
        rewards: rewards.map(r => ({
          id: r.id,
          type: r.type,
          amount: r.amount,
          currency: r.currency,
          status: r.status,
          approvedAt: r.approvedAt,
          description: r.metadata?.description
        }))
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    console.error('Referrals GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
