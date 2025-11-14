-- Create projects table if not exists
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  address TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  apn TEXT, -- Assessor's Parcel Number
  ain TEXT, -- Assessor Identification Number
  status TEXT DEFAULT 'draft',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create project_files table
CREATE TABLE IF NOT EXISTS project_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  original_name TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  url TEXT NOT NULL,
  pages INTEGER,
  uploaded_by UUID REFERENCES users(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_file_type CHECK (file_type IN ('application/pdf', 'image/jpeg', 'image/png', 'image/jpg')),
  CONSTRAINT valid_file_size CHECK (file_size > 0 AND file_size <= 52428800) -- 50MB
);

-- Create parsed_features table for AI parsing results
CREATE TABLE IF NOT EXISTS parsed_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  file_id UUID REFERENCES project_files(id) ON DELETE CASCADE,
  geojson JSONB NOT NULL,
  scale JSONB, -- { "detected": true, "value": 100, "unit": "feet", "confidence": 0.95 }
  north_arrow JSONB, -- { "detected": true, "angle": 15, "confidence": 0.88 }
  property_lines JSONB, -- GeoJSON FeatureCollection
  existing_structures JSONB, -- GeoJSON FeatureCollection
  trees JSONB, -- GeoJSON FeatureCollection
  driveways JSONB, -- GeoJSON FeatureCollection
  annotations JSONB, -- OCR extracted text with positions
  confidence_overall DOUBLE PRECISION,
  parsed_at TIMESTAMPTZ DEFAULT NOW(),
  parsed_by TEXT DEFAULT 'ai-parser-v1'
);

-- Create manual_corrections table
CREATE TABLE IF NOT EXISTS manual_corrections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parsed_feature_id UUID NOT NULL REFERENCES parsed_features(id) ON DELETE CASCADE,
  feature_type TEXT NOT NULL, -- 'scale', 'property_line', 'structure', etc.
  original_data JSONB,
  corrected_data JSONB NOT NULL,
  corrected_by UUID REFERENCES users(id),
  corrected_at TIMESTAMPTZ DEFAULT NOW(),
  reason TEXT
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_org_id ON projects(org_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at);
CREATE INDEX IF NOT EXISTS idx_project_files_project_id ON project_files(project_id);
CREATE INDEX IF NOT EXISTS idx_project_files_uploaded_at ON project_files(uploaded_at);
CREATE INDEX IF NOT EXISTS idx_parsed_features_project_id ON parsed_features(project_id);
CREATE INDEX IF NOT EXISTS idx_parsed_features_file_id ON parsed_features(file_id);
CREATE INDEX IF NOT EXISTS idx_manual_corrections_parsed_feature_id ON manual_corrections(parsed_feature_id);

-- Create GiST index for geojson spatial queries
CREATE INDEX IF NOT EXISTS idx_parsed_features_geojson ON parsed_features USING GIN (geojson);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE parsed_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE manual_corrections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for projects
CREATE POLICY "Users can view projects in their org"
  ON projects FOR SELECT
  USING (
    org_id IN (
      SELECT organization_id FROM user_organization_memberships
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create projects in their org"
  ON projects FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT organization_id FROM user_organization_memberships
      WHERE user_id = auth.uid()
      AND 'designer' = ANY(roles) OR 'admin' = ANY(roles)
    )
  );

CREATE POLICY "Users can update projects in their org"
  ON projects FOR UPDATE
  USING (
    org_id IN (
      SELECT organization_id FROM user_organization_memberships
      WHERE user_id = auth.uid()
      AND 'designer' = ANY(roles) OR 'admin' = ANY(roles)
    )
  );

-- RLS Policies for project_files
CREATE POLICY "Users can view files in their org projects"
  ON project_files FOR SELECT
  USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN user_organization_memberships m ON p.org_id = m.organization_id
      WHERE m.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can upload files to their org projects"
  ON project_files FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN user_organization_memberships m ON p.org_id = m.organization_id
      WHERE m.user_id = auth.uid()
      AND 'designer' = ANY(m.roles) OR 'admin' = ANY(m.roles)
    )
  );

-- RLS Policies for parsed_features
CREATE POLICY "Users can view parsed features in their org projects"
  ON parsed_features FOR SELECT
  USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN user_organization_memberships m ON p.org_id = m.organization_id
      WHERE m.user_id = auth.uid()
    )
  );

-- RLS Policies for manual_corrections
CREATE POLICY "Users can view corrections in their org projects"
  ON manual_corrections FOR SELECT
  USING (
    parsed_feature_id IN (
      SELECT pf.id FROM parsed_features pf
      JOIN projects p ON pf.project_id = p.id
      JOIN user_organization_memberships m ON p.org_id = m.organization_id
      WHERE m.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create corrections in their org projects"
  ON manual_corrections FOR INSERT
  WITH CHECK (
    parsed_feature_id IN (
      SELECT pf.id FROM parsed_features pf
      JOIN projects p ON pf.project_id = p.id
      JOIN user_organization_memberships m ON p.org_id = m.organization_id
      WHERE m.user_id = auth.uid()
      AND 'designer' = ANY(m.roles) OR 'admin' = ANY(m.roles)
    )
  );

-- Create storage bucket for project files
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-files', 'project-files', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Users can upload to their org folders"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'project-files' AND
    (storage.foldername(name))[1] IN (
      SELECT p.id::text FROM projects p
      JOIN user_organization_memberships m ON p.org_id = m.organization_id
      WHERE m.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their org files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'project-files' AND
    (storage.foldername(name))[1] IN (
      SELECT p.id::text FROM projects p
      JOIN user_organization_memberships m ON p.org_id = m.organization_id
      WHERE m.user_id = auth.uid()
    )
  );
