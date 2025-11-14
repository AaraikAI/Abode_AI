-- Create model_library table
CREATE TABLE IF NOT EXISTS model_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  subcategory TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  thumbnail_url TEXT NOT NULL,
  model_url TEXT NOT NULL,
  dimensions JSONB NOT NULL,
  poly_count INTEGER NOT NULL,
  file_size BIGINT NOT NULL,
  has_textures BOOLEAN DEFAULT false,
  materials TEXT[] DEFAULT '{}',
  style TEXT[] DEFAULT '{}',
  license TEXT NOT NULL CHECK (license IN ('free', 'pro', 'enterprise')),
  author TEXT,
  downloads INTEGER DEFAULT 0,
  rating DOUBLE PRECISION DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create model_ratings table for user ratings
CREATE TABLE IF NOT EXISTS model_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID NOT NULL REFERENCES model_library(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  rated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(model_id, user_id)
);

-- Create indexes for fast searching
CREATE INDEX IF NOT EXISTS idx_model_library_category ON model_library(category);
CREATE INDEX IF NOT EXISTS idx_model_library_subcategory ON model_library(subcategory);
CREATE INDEX IF NOT EXISTS idx_model_library_license ON model_library(license);
CREATE INDEX IF NOT EXISTS idx_model_library_rating ON model_library(rating DESC);
CREATE INDEX IF NOT EXISTS idx_model_library_downloads ON model_library(downloads DESC);
CREATE INDEX IF NOT EXISTS idx_model_library_created_at ON model_library(created_at DESC);

-- GIN index for array columns (tags, materials, style)
CREATE INDEX IF NOT EXISTS idx_model_library_tags ON model_library USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_model_library_materials ON model_library USING GIN (materials);
CREATE INDEX IF NOT EXISTS idx_model_library_style ON model_library USING GIN (style);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_model_library_search ON model_library USING GIN (
  to_tsvector('english', name || ' ' || COALESCE(description, ''))
);

-- Function to increment downloads atomically
CREATE OR REPLACE FUNCTION increment_model_downloads(model_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE model_library
  SET downloads = downloads + 1
  WHERE id = model_id;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security
ALTER TABLE model_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_ratings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for model_library (read-only for all authenticated users)
CREATE POLICY "All users can view models"
  ON model_library FOR SELECT
  USING (true);

-- RLS Policies for model_ratings
CREATE POLICY "Users can view all ratings"
  ON model_ratings FOR SELECT
  USING (true);

CREATE POLICY "Users can rate models"
  ON model_ratings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ratings"
  ON model_ratings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Seed initial data with diverse models (1000+)
-- This will be executed via the seedModelLibrary() function
-- You can run it manually: SELECT seed_model_library();

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_model_library_updated_at
  BEFORE UPDATE ON model_library
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create materialized view for popular models (for performance)
CREATE MATERIALIZED VIEW IF NOT EXISTS popular_models AS
SELECT *
FROM model_library
WHERE rating >= 4.0
ORDER BY downloads DESC, rating DESC
LIMIT 100;

CREATE UNIQUE INDEX ON popular_models (id);

-- Refresh popular models view function
CREATE OR REPLACE FUNCTION refresh_popular_models()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY popular_models;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE model_library IS '3D model library with 1000+ architectural and furniture models';
COMMENT ON COLUMN model_library.dimensions IS 'JSON object with width, height, depth, and unit';
COMMENT ON COLUMN model_library.poly_count IS 'Number of polygons in the 3D model';
COMMENT ON COLUMN model_library.license IS 'License tier: free, pro, or enterprise';
COMMENT ON COLUMN model_library.downloads IS 'Number of times this model has been downloaded';
COMMENT ON COLUMN model_library.rating IS 'Average user rating from 0-5';
