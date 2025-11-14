-- Phase 4: Referral System Tables

-- Referral Codes Table
CREATE TABLE IF NOT EXISTS referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,

  max_uses INTEGER, -- NULL means unlimited
  current_uses INTEGER NOT NULL DEFAULT 0,

  expires_at TIMESTAMP WITH TIME ZONE,

  -- Rewards configuration
  referrer_bonus INTEGER NOT NULL DEFAULT 100, -- Credits for referrer
  referee_bonus INTEGER NOT NULL DEFAULT 50, -- Credits for new user

  -- Optional campaign tracking
  campaign TEXT,
  source TEXT,
  metadata JSONB,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_referral_codes_code ON referral_codes(code);
CREATE INDEX idx_referral_codes_user_id ON referral_codes(user_id);
CREATE INDEX idx_referral_codes_expires ON referral_codes(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_referral_codes_campaign ON referral_codes(campaign) WHERE campaign IS NOT NULL;

ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referral codes"
  ON referral_codes FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create referral codes"
  ON referral_codes FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Referrals Table
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,

  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rewarded', 'expired', 'invalid')),

  -- Milestones tracking
  milestones JSONB NOT NULL DEFAULT '{
    "signedUp": true,
    "verified": false,
    "firstPurchase": false,
    "monthlyActive": false
  }'::jsonb,

  -- Rewards tracking
  rewards JSONB NOT NULL DEFAULT '{
    "referrerCredits": 0,
    "refereeCredits": 0,
    "totalValue": 0
  }'::jsonb,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX idx_referrals_referee_id ON referrals(referee_id);
CREATE INDEX idx_referrals_code ON referrals(referral_code);
CREATE INDEX idx_referrals_status ON referrals(status);
CREATE INDEX idx_referrals_completed_at ON referrals(completed_at DESC) WHERE completed_at IS NOT NULL;

-- Prevent self-referrals
ALTER TABLE referrals ADD CONSTRAINT no_self_referral CHECK (referrer_id != referee_id);

-- Prevent duplicate referrals for same referee
CREATE UNIQUE INDEX idx_referrals_unique_referee ON referrals(referee_id);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view referrals where they are referrer"
  ON referrals FOR SELECT
  USING (referrer_id = auth.uid() OR referee_id = auth.uid());

CREATE POLICY "System can create referrals"
  ON referrals FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "System can update referrals"
  ON referrals FOR UPDATE
  USING (TRUE);

-- Referral Rewards Table
CREATE TABLE IF NOT EXISTS referral_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_id UUID NOT NULL REFERENCES referrals(id) ON DELETE CASCADE,

  type TEXT NOT NULL CHECK (type IN ('signup', 'verification', 'purchase', 'milestone', 'bonus')),
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'credits' CHECK (currency IN ('credits', 'usd')),

  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),

  approved_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,

  description TEXT,
  metadata JSONB,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_referral_rewards_user_id ON referral_rewards(user_id);
CREATE INDEX idx_referral_rewards_referral_id ON referral_rewards(referral_id);
CREATE INDEX idx_referral_rewards_type ON referral_rewards(type);
CREATE INDEX idx_referral_rewards_status ON referral_rewards(status);
CREATE INDEX idx_referral_rewards_created_at ON referral_rewards(created_at DESC);

ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rewards"
  ON referral_rewards FOR SELECT
  USING (user_id = auth.uid());

-- Referral Tiers Configuration Table
CREATE TABLE IF NOT EXISTS referral_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  min_referrals INTEGER NOT NULL,
  max_referrals INTEGER,

  bonus_multiplier NUMERIC(3,2) NOT NULL DEFAULT 1.0,
  extra_credits INTEGER NOT NULL DEFAULT 0,
  special_perks TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],

  badge_name TEXT NOT NULL,
  badge_icon TEXT NOT NULL,
  badge_color TEXT NOT NULL,

  sort_order INTEGER NOT NULL,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_referral_tiers_name ON referral_tiers(name);
CREATE INDEX idx_referral_tiers_min_referrals ON referral_tiers(min_referrals);
CREATE INDEX idx_referral_tiers_sort_order ON referral_tiers(sort_order);

-- Insert default tiers
INSERT INTO referral_tiers (name, min_referrals, max_referrals, bonus_multiplier, extra_credits, special_perks, badge_name, badge_icon, badge_color, sort_order)
VALUES
  ('Starter', 0, 4, 1.0, 0, ARRAY[]::TEXT[], 'Starter', '🌱', '#10b981', 1),
  ('Builder', 5, 14, 1.25, 50, ARRAY['Priority support', 'Early access to features'], 'Builder', '🏗️', '#3b82f6', 2),
  ('Architect', 15, 49, 1.5, 150, ARRAY['Priority support', 'Early access', 'Custom training', 'API rate boost'], 'Architect', '🏛️', '#8b5cf6', 3),
  ('Visionary', 50, NULL, 2.0, 500, ARRAY['VIP support', 'Early access', 'Custom training', 'API rate boost', 'Revenue sharing', 'Co-marketing opportunities'], 'Visionary', '🌟', '#f59e0b', 4);

-- Referral Analytics View
CREATE OR REPLACE VIEW referral_analytics AS
SELECT
  r.referrer_id,
  COUNT(*) as total_referrals,
  COUNT(*) FILTER (WHERE r.status = 'completed') as completed_referrals,
  COUNT(*) FILTER (WHERE r.status = 'pending') as pending_referrals,
  COALESCE(SUM((r.rewards->>'referrerCredits')::integer), 0) as total_earned,
  COALESCE(AVG((r.rewards->>'referrerCredits')::integer) FILTER (WHERE r.status = 'completed'), 0) as avg_reward,
  COUNT(*) FILTER (WHERE r.created_at >= NOW() - INTERVAL '30 days') as monthly_referrals,
  COUNT(*) FILTER (WHERE r.created_at >= NOW() - INTERVAL '7 days') as weekly_referrals
FROM referrals r
GROUP BY r.referrer_id;

-- Comments
COMMENT ON TABLE referral_codes IS 'User referral codes for inviting new users';
COMMENT ON TABLE referrals IS 'Referral relationships between users';
COMMENT ON TABLE referral_rewards IS 'Rewards earned through referrals';
COMMENT ON TABLE referral_tiers IS 'Referral program tier definitions';
COMMENT ON VIEW referral_analytics IS 'Aggregated referral statistics per user';
