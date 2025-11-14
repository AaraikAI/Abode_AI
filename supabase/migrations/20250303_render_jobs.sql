-- Create render_jobs table
CREATE TABLE IF NOT EXISTS render_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('still', 'walkthrough', 'panorama', 'batch')),
  status TEXT NOT NULL CHECK (status IN ('queued', 'rendering', 'processing', 'completed', 'failed')),
  quality TEXT NOT NULL CHECK (quality IN ('1080p', '4k', '8k')),
  scene_data JSONB NOT NULL,
  camera_settings JSONB NOT NULL,
  render_settings JSONB NOT NULL,
  walkthrough_path JSONB,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  estimated_time INTEGER,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  output_url TEXT,
  thumbnail_url TEXT,
  file_size BIGINT,
  error_message TEXT,
  credits_used INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_render_jobs_org_id ON render_jobs(org_id);
CREATE INDEX IF NOT EXISTS idx_render_jobs_user_id ON render_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_render_jobs_project_id ON render_jobs(project_id);
CREATE INDEX IF NOT EXISTS idx_render_jobs_status ON render_jobs(status);
CREATE INDEX IF NOT EXISTS idx_render_jobs_created_at ON render_jobs(created_at DESC);

-- Enable RLS
ALTER TABLE render_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view jobs in their org"
  ON render_jobs FOR SELECT
  USING (
    org_id IN (
      SELECT organization_id FROM user_organization_memberships
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create jobs in their org"
  ON render_jobs FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT organization_id FROM user_organization_memberships
      WHERE user_id = auth.uid()
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_render_jobs_updated_at
  BEFORE UPDATE ON render_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
