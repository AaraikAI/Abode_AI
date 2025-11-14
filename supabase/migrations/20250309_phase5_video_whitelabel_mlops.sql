-- Phase 5: Video Collaboration, White-label, & MLOps Tables

-- Video Sessions Table
CREATE TABLE IF NOT EXISTS video_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'ended')),

  participants JSONB NOT NULL DEFAULT '[]'::jsonb,

  recording BOOLEAN NOT NULL DEFAULT FALSE,
  recording_url TEXT,
  transcription JSONB DEFAULT '[]'::jsonb,

  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_video_sessions_project_id ON video_sessions(project_id);
CREATE INDEX idx_video_sessions_host_id ON video_sessions(host_id);
CREATE INDEX idx_video_sessions_status ON video_sessions(status);
CREATE INDEX idx_video_sessions_created_at ON video_sessions(created_at DESC);

ALTER TABLE video_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view video sessions for their projects"
  ON video_sessions FOR SELECT
  USING (
    host_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create video sessions for their projects"
  ON video_sessions FOR INSERT
  WITH CHECK (host_id = auth.uid());

-- Screen Shares Table
CREATE TABLE IF NOT EXISTS screen_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES video_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  stream_id TEXT NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT TRUE,

  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_screen_shares_session_id ON screen_shares(session_id);
CREATE INDEX idx_screen_shares_user_id ON screen_shares(user_id);
CREATE INDEX idx_screen_shares_active ON screen_shares(active) WHERE active = TRUE;

ALTER TABLE screen_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own screen shares"
  ON screen_shares FOR ALL
  USING (user_id = auth.uid());

-- White-label Configurations Table
CREATE TABLE IF NOT EXISTS white_label_configs (
  org_id UUID PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,

  branding JSONB NOT NULL,
  domain JSONB NOT NULL,
  emails JSONB NOT NULL,
  features JSONB NOT NULL,
  billing JSONB NOT NULL,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_white_label_configs_org_id ON white_label_configs(org_id);

ALTER TABLE white_label_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org admins can manage white-label config"
  ON white_label_configs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = org_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  );

-- Tenants Table
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,

  plan TEXT NOT NULL CHECK (plan IN ('starter', 'professional', 'enterprise', 'reseller')),

  users INTEGER NOT NULL DEFAULT 0,
  projects INTEGER NOT NULL DEFAULT 0,
  storage_used BIGINT NOT NULL DEFAULT 0,
  api_calls INTEGER NOT NULL DEFAULT 0,

  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled')),

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tenants_plan ON tenants(plan);
CREATE INDEX idx_tenants_status ON tenants(status);
CREATE INDEX idx_tenants_created_at ON tenants(created_at DESC);

-- ML Model Versions Table
CREATE TABLE IF NOT EXISTS ml_model_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id TEXT NOT NULL,
  version TEXT NOT NULL,

  framework TEXT NOT NULL CHECK (framework IN ('pytorch', 'tensorflow', 'onnx', 'huggingface')),
  artifact_url TEXT NOT NULL,

  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],

  status TEXT NOT NULL DEFAULT 'training' CHECK (status IN ('training', 'staging', 'production', 'archived')),

  deployed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ml_model_versions_model_id ON ml_model_versions(model_id);
CREATE INDEX idx_ml_model_versions_status ON ml_model_versions(status);
CREATE INDEX idx_ml_model_versions_version ON ml_model_versions(model_id, version);

-- A/B Tests Table
CREATE TABLE IF NOT EXISTS ml_ab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,

  models JSONB NOT NULL, -- Array of {versionId, trafficPercent}
  metrics JSONB NOT NULL DEFAULT '[]'::jsonb,

  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'paused', 'completed')),

  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_ml_ab_tests_status ON ml_ab_tests(status);
CREATE INDEX idx_ml_ab_tests_started_at ON ml_ab_tests(started_at DESC);

-- Feature Flags Table
CREATE TABLE IF NOT EXISTS feature_flags (
  key TEXT PRIMARY KEY,

  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  rollout_percent INTEGER NOT NULL DEFAULT 0 CHECK (rollout_percent >= 0 AND rollout_percent <= 100),

  targeting JSONB NOT NULL DEFAULT '{}'::jsonb,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_feature_flags_enabled ON feature_flags(enabled) WHERE enabled = TRUE;

-- Analytics Queries Table
CREATE TABLE IF NOT EXISTS analytics_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  sql TEXT NOT NULL,

  parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
  schedule TEXT,
  output_format TEXT NOT NULL DEFAULT 'json' CHECK (output_format IN ('json', 'csv', 'parquet')),

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_analytics_queries_user_id ON analytics_queries(user_id);

ALTER TABLE analytics_queries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own analytics queries"
  ON analytics_queries FOR ALL
  USING (user_id = auth.uid());

-- Dashboards Table
CREATE TABLE IF NOT EXISTS analytics_dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  name TEXT NOT NULL,

  widgets JSONB NOT NULL DEFAULT '[]'::jsonb,
  filters JSONB NOT NULL DEFAULT '[]'::jsonb,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_analytics_dashboards_user_id ON analytics_dashboards(user_id);

ALTER TABLE analytics_dashboards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own analytics dashboards"
  ON analytics_dashboards FOR ALL
  USING (user_id = auth.uid());

-- Comments
COMMENT ON TABLE video_sessions IS 'WebRTC video collaboration sessions';
COMMENT ON TABLE screen_shares IS 'Screen sharing streams during video sessions';
COMMENT ON TABLE white_label_configs IS 'White-label branding configurations per organization';
COMMENT ON TABLE tenants IS 'Multi-tenant usage tracking';
COMMENT ON TABLE ml_model_versions IS 'ML model registry with versioning';
COMMENT ON TABLE ml_ab_tests IS 'A/B tests for machine learning models';
COMMENT ON TABLE feature_flags IS 'Feature flag management for gradual rollouts';
COMMENT ON TABLE analytics_queries IS 'Saved analytics queries';
COMMENT ON TABLE analytics_dashboards IS 'Custom analytics dashboards';
