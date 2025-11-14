-- Phase 4: Bionic Design Tables

-- Bionic Optimizations Table
CREATE TABLE IF NOT EXISTS bionic_optimizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  pattern TEXT NOT NULL CHECK (pattern IN ('honeycomb', 'spider-web', 'bone', 'tree', 'custom')),

  -- Input parameters
  parameters JSONB NOT NULL, -- BionicDesignParams
  ga_config JSONB NOT NULL, -- GeneticAlgorithmConfig

  -- Results
  best_design JSONB NOT NULL, -- Best genome found
  scores JSONB NOT NULL, -- Multi-objective scores
  performance_metrics JSONB NOT NULL, -- Detailed performance metrics

  -- Optimization metadata
  generation_count INTEGER NOT NULL,
  convergence_history JSONB NOT NULL, -- Array of convergence checkpoints
  computation_time_ms INTEGER NOT NULL,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bionic_optimizations_project_id ON bionic_optimizations(project_id);
CREATE INDEX idx_bionic_optimizations_user_id ON bionic_optimizations(user_id);
CREATE INDEX idx_bionic_optimizations_pattern ON bionic_optimizations(pattern);
CREATE INDEX idx_bionic_optimizations_created_at ON bionic_optimizations(created_at DESC);

ALTER TABLE bionic_optimizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bionic optimizations"
  ON bionic_optimizations FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create bionic optimizations"
  ON bionic_optimizations FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Bionic Patterns Library Table (Pre-defined patterns and templates)
CREATE TABLE IF NOT EXISTS bionic_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  category TEXT NOT NULL,

  natural_inspiration TEXT NOT NULL, -- What organism/structure inspired this
  key_characteristics TEXT[] NOT NULL,

  -- Pattern configuration
  default_parameters JSONB NOT NULL,
  applicable_use_cases TEXT[] NOT NULL,

  -- Example data
  example_images TEXT[], -- URLs to example images
  reference_papers TEXT[], -- Research paper references

  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id),

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bionic_patterns_category ON bionic_patterns(category);
CREATE INDEX idx_bionic_patterns_public ON bionic_patterns(is_public) WHERE is_public = TRUE;

ALTER TABLE bionic_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public bionic patterns"
  ON bionic_patterns FOR SELECT
  USING (is_public = TRUE OR created_by = auth.uid());

-- Simulation Results Cache (For faster retrieval of common simulations)
CREATE TABLE IF NOT EXISTS bionic_simulation_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern TEXT NOT NULL,
  parameters_hash TEXT NOT NULL, -- Hash of input parameters
  results JSONB NOT NULL,

  hit_count INTEGER NOT NULL DEFAULT 0,
  last_accessed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_bionic_cache_pattern_hash ON bionic_simulation_cache(pattern, parameters_hash);
CREATE INDEX idx_bionic_cache_accessed ON bionic_simulation_cache(last_accessed_at DESC);

-- Comments
COMMENT ON TABLE bionic_optimizations IS 'Bionic design optimization results using genetic algorithms';
COMMENT ON TABLE bionic_patterns IS 'Library of biomimicry patterns and templates';
COMMENT ON TABLE bionic_simulation_cache IS 'Cache for frequently run simulations';
