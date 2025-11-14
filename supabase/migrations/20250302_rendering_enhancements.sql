-- Rendering Enhancements for Phase 2
-- Adds support for Blender rendering and advanced post-processing

-- Ensure render_jobs table exists with all required fields
-- (This may already exist from Phase 1, so we use IF NOT EXISTS)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'render_jobs') THEN
    CREATE TABLE render_jobs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

      -- Render configuration
      type TEXT NOT NULL CHECK (type IN ('still', 'walkthrough', 'panorama', 'batch')),
      quality TEXT NOT NULL CHECK (quality IN ('1080p', '4k', '8k', 'preview', 'draft')),
      status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'cancelled')),

      -- Scene data
      scene_data JSONB NOT NULL,
      camera_settings JSONB NOT NULL,
      render_settings JSONB,

      -- Credits and timing
      credits_cost INTEGER NOT NULL DEFAULT 0,
      estimated_time_seconds INTEGER NOT NULL DEFAULT 0,
      progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),

      -- Output
      output_url TEXT,
      error_message TEXT,

      -- Timestamps
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      started_at TIMESTAMP WITH TIME ZONE,
      completed_at TIMESTAMP WITH TIME ZONE,
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );

    -- Indexes
    CREATE INDEX idx_render_jobs_project_id ON render_jobs(project_id);
    CREATE INDEX idx_render_jobs_org_id ON render_jobs(org_id);
    CREATE INDEX idx_render_jobs_user_id ON render_jobs(user_id);
    CREATE INDEX idx_render_jobs_status ON render_jobs(status);
    CREATE INDEX idx_render_jobs_created_at ON render_jobs(created_at DESC);

    -- RLS Policies
    ALTER TABLE render_jobs ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Users can view org render jobs"
      ON render_jobs FOR SELECT
      USING (org_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

    CREATE POLICY "Users can create render jobs"
      ON render_jobs FOR INSERT
      WITH CHECK (org_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()) AND user_id = auth.uid());

    CREATE POLICY "Users can update own render jobs"
      ON render_jobs FOR UPDATE
      USING (user_id = auth.uid());

    CREATE POLICY "Users can delete own render jobs"
      ON render_jobs FOR DELETE
      USING (user_id = auth.uid());

    -- Trigger for updated_at
    CREATE TRIGGER render_jobs_updated_at
      BEFORE UPDATE ON render_jobs
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Add render_settings column if it doesn't exist (for existing tables)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'render_jobs'
    AND column_name = 'render_settings'
  ) THEN
    ALTER TABLE render_jobs ADD COLUMN render_settings JSONB;
  END IF;
END $$;

-- Credit management functions
-- Deduct credits from organization
CREATE OR REPLACE FUNCTION deduct_credits(
  org_id UUID,
  amount INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  current_credits INTEGER;
BEGIN
  -- Get current credits
  SELECT credits INTO current_credits
  FROM organizations
  WHERE id = org_id
  FOR UPDATE;

  -- Check if sufficient credits
  IF current_credits < amount THEN
    RETURN FALSE;
  END IF;

  -- Deduct credits
  UPDATE organizations
  SET credits = credits - amount,
      updated_at = NOW()
  WHERE id = org_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Add credits to organization
CREATE OR REPLACE FUNCTION add_credits(
  org_id UUID,
  amount INTEGER
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE organizations
  SET credits = credits + amount,
      updated_at = NOW()
  WHERE id = org_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate render queue position
CREATE OR REPLACE FUNCTION get_render_queue_position(job_id UUID)
RETURNS INTEGER AS $$
DECLARE
  position INTEGER;
BEGIN
  SELECT COUNT(*) INTO position
  FROM render_jobs
  WHERE status IN ('queued', 'processing')
    AND created_at <= (SELECT created_at FROM render_jobs WHERE id = job_id)
    AND id != job_id;

  RETURN position + 1;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get render statistics for an organization
CREATE OR REPLACE FUNCTION get_org_render_stats(org_id UUID)
RETURNS JSONB AS $$
DECLARE
  stats JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_renders', COUNT(*),
    'completed_renders', COUNT(*) FILTER (WHERE status = 'completed'),
    'failed_renders', COUNT(*) FILTER (WHERE status = 'failed'),
    'total_credits_spent', COALESCE(SUM(credits_cost) FILTER (WHERE status = 'completed'), 0),
    'average_render_time', COALESCE(AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) FILTER (WHERE status = 'completed'), 0),
    'renders_by_type', jsonb_object_agg(
      type,
      COUNT(*) FILTER (WHERE status = 'completed')
    ) FILTER (WHERE status = 'completed'),
    'renders_by_quality', jsonb_object_agg(
      quality,
      COUNT(*) FILTER (WHERE status = 'completed')
    ) FILTER (WHERE status = 'completed')
  ) INTO stats
  FROM render_jobs
  WHERE render_jobs.org_id = get_org_render_stats.org_id;

  RETURN stats;
END;
$$ LANGUAGE plpgsql STABLE;

-- Storage bucket for renders (execute via Supabase dashboard or API)
-- Bucket name: renders
-- Public: true (for easy access to rendered images/videos)
-- File size limit: 500MB
-- Allowed MIME types: image/png, image/jpeg, video/mp4

-- Update updated_at trigger function (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON FUNCTION deduct_credits IS 'Deducts credits from an organization account';
COMMENT ON FUNCTION add_credits IS 'Adds credits to an organization account (for refunds or purchases)';
COMMENT ON FUNCTION get_render_queue_position IS 'Returns the position of a render job in the queue';
COMMENT ON FUNCTION get_org_render_stats IS 'Returns comprehensive rendering statistics for an organization';
