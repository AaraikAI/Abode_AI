-- Phase 3: AI Training and Marketplace Tables

-- AI Training Datasets Table
CREATE TABLE IF NOT EXISTS ai_datasets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('image_generation', 'style_transfer', 'object_detection', 'text_to_image', 'image_to_text')),
  sample_count INTEGER NOT NULL DEFAULT 0,
  total_size BIGINT NOT NULL DEFAULT 0,

  metadata JSONB NOT NULL DEFAULT '{}',

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_datasets_user_id ON ai_datasets(user_id);
CREATE INDEX idx_ai_datasets_org_id ON ai_datasets(org_id);
CREATE INDEX idx_ai_datasets_type ON ai_datasets(type);

-- AI Training Jobs Table
CREATE TABLE IF NOT EXISTS ai_training_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  dataset_id UUID NOT NULL REFERENCES ai_datasets(id) ON DELETE CASCADE,

  model_config JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'preparing', 'training', 'validating', 'completed', 'failed', 'cancelled')),
  progress JSONB NOT NULL DEFAULT '{"currentEpoch": 0, "totalEpochs": 0, "currentStep": 0, "totalSteps": 0, "trainingLoss": 0}',
  resources JSONB NOT NULL,
  artifacts JSONB,
  error_message TEXT,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_training_jobs_user_id ON ai_training_jobs(user_id);
CREATE INDEX idx_ai_training_jobs_org_id ON ai_training_jobs(org_id);
CREATE INDEX idx_ai_training_jobs_status ON ai_training_jobs(status);
CREATE INDEX idx_ai_training_jobs_created_at ON ai_training_jobs(created_at DESC);

-- Marketplace Assets Table
CREATE TABLE IF NOT EXISTS marketplace_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  creator_name TEXT NOT NULL,

  type TEXT NOT NULL CHECK (type IN ('model', 'material', 'template', 'scene', 'hdri', 'texture')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  tags TEXT[] NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,

  pricing JSONB NOT NULL,
  files JSONB NOT NULL,
  metadata JSONB NOT NULL,

  stats JSONB NOT NULL DEFAULT '{"downloads": 0, "views": 0, "likes": 0, "rating": 0, "ratingCount": 0}',

  ip_protection JSONB, -- NFT-like blockchain protection

  status TEXT NOT NULL DEFAULT 'pending_review' CHECK (status IN ('draft', 'pending_review', 'approved', 'rejected', 'removed')),
  rejection_reason TEXT,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_marketplace_assets_creator_id ON marketplace_assets(creator_id);
CREATE INDEX idx_marketplace_assets_type ON marketplace_assets(type);
CREATE INDEX idx_marketplace_assets_category ON marketplace_assets(category);
CREATE INDEX idx_marketplace_assets_status ON marketplace_assets(status);
CREATE INDEX idx_marketplace_assets_published_at ON marketplace_assets(published_at DESC) WHERE status = 'approved';

-- Full-text search on assets
CREATE INDEX idx_marketplace_assets_search ON marketplace_assets USING gin(to_tsvector('english', title || ' ' || description));

-- Asset Reviews Table
CREATE TABLE IF NOT EXISTS marketplace_asset_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES marketplace_assets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,

  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT,
  helpful INTEGER NOT NULL DEFAULT 0,
  verified BOOLEAN NOT NULL DEFAULT FALSE,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  UNIQUE(asset_id, user_id) -- One review per user per asset
);

CREATE INDEX idx_marketplace_reviews_asset_id ON marketplace_asset_reviews(asset_id);
CREATE INDEX idx_marketplace_reviews_user_id ON marketplace_asset_reviews(user_id);

-- Asset Purchases Table
CREATE TABLE IF NOT EXISTS marketplace_asset_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES marketplace_assets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  amount INTEGER NOT NULL, -- USD cents
  payment_method TEXT NOT NULL,
  stripe_payment_intent_id TEXT,

  download_count INTEGER NOT NULL DEFAULT 0,
  max_downloads INTEGER NOT NULL DEFAULT -1, -- -1 = unlimited

  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_marketplace_purchases_asset_id ON marketplace_asset_purchases(asset_id);
CREATE INDEX idx_marketplace_purchases_user_id ON marketplace_asset_purchases(user_id);

-- Asset Likes Table
CREATE TABLE IF NOT EXISTS marketplace_asset_likes (
  asset_id UUID NOT NULL REFERENCES marketplace_assets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  PRIMARY KEY (asset_id, user_id)
);

CREATE INDEX idx_marketplace_likes_asset_id ON marketplace_asset_likes(asset_id);
CREATE INDEX idx_marketplace_likes_user_id ON marketplace_asset_likes(user_id);

-- RLS Policies
ALTER TABLE ai_datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_training_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_asset_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_asset_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_asset_likes ENABLE ROW LEVEL SECURITY;

-- AI Datasets: Users can view and manage own datasets
CREATE POLICY "Users can view org datasets"
  ON ai_datasets FOR SELECT
  USING (org_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can create datasets"
  ON ai_datasets FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Marketplace: Public can view approved assets
CREATE POLICY "Public can view approved assets"
  ON marketplace_assets FOR SELECT
  USING (status = 'approved');

CREATE POLICY "Creators can view own assets"
  ON marketplace_assets FOR SELECT
  USING (creator_id = auth.uid());

CREATE POLICY "Creators can create assets"
  ON marketplace_assets FOR INSERT
  WITH CHECK (creator_id = auth.uid());

-- Comments
COMMENT ON TABLE ai_datasets IS 'Custom AI training datasets';
COMMENT ON TABLE ai_training_jobs IS 'AI model training jobs with progress tracking';
COMMENT ON TABLE marketplace_assets IS 'User-generated marketplace assets with NFT protection';
COMMENT ON TABLE marketplace_asset_reviews IS 'User reviews and ratings for marketplace assets';
COMMENT ON TABLE marketplace_asset_purchases IS 'Asset purchase records';
COMMENT ON TABLE marketplace_asset_likes IS 'Asset likes/favorites';
