-- IFC/BIM Import and Export Tables
-- Stores IFC file imports and exports

-- IFC Imports Table
CREATE TABLE IF NOT EXISTS ifc_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- File information
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL CHECK (file_size > 0 AND file_size <= 104857600), -- 100MB max
  file_url TEXT NOT NULL,

  -- Extracted IFC data
  ifc_data JSONB NOT NULL,

  -- Metadata
  imported_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Indexes
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for IFC imports
CREATE INDEX IF NOT EXISTS idx_ifc_imports_project_id ON ifc_imports(project_id);
CREATE INDEX IF NOT EXISTS idx_ifc_imports_org_id ON ifc_imports(org_id);
CREATE INDEX IF NOT EXISTS idx_ifc_imports_user_id ON ifc_imports(user_id);
CREATE INDEX IF NOT EXISTS idx_ifc_imports_imported_at ON ifc_imports(imported_at DESC);

-- Full-text search on IFC data (optional, for searching within IFC content)
CREATE INDEX IF NOT EXISTS idx_ifc_imports_data_gin ON ifc_imports USING gin(ifc_data jsonb_path_ops);

-- RLS Policies for IFC imports
ALTER TABLE ifc_imports ENABLE ROW LEVEL SECURITY;

-- Users can view imports from their organization
CREATE POLICY "Users can view org IFC imports"
  ON ifc_imports
  FOR SELECT
  USING (
    org_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Users can create imports in their organization's projects
CREATE POLICY "Users can create IFC imports"
  ON ifc_imports
  FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
    )
    AND user_id = auth.uid()
  );

-- Users can delete their own imports
CREATE POLICY "Users can delete own IFC imports"
  ON ifc_imports
  FOR DELETE
  USING (user_id = auth.uid());

-- IFC Exports Table
CREATE TABLE IF NOT EXISTS ifc_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- File information
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL CHECK (file_size > 0),
  file_url TEXT NOT NULL,

  -- Export settings
  schema TEXT NOT NULL CHECK (schema IN ('IFC2X3', 'IFC4')),
  object_count INTEGER NOT NULL DEFAULT 0,

  -- Metadata
  exported_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Indexes
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for IFC exports
CREATE INDEX IF NOT EXISTS idx_ifc_exports_project_id ON ifc_exports(project_id);
CREATE INDEX IF NOT EXISTS idx_ifc_exports_org_id ON ifc_exports(org_id);
CREATE INDEX IF NOT EXISTS idx_ifc_exports_user_id ON ifc_exports(user_id);
CREATE INDEX IF NOT EXISTS idx_ifc_exports_exported_at ON ifc_exports(exported_at DESC);

-- RLS Policies for IFC exports
ALTER TABLE ifc_exports ENABLE ROW LEVEL SECURITY;

-- Users can view exports from their organization
CREATE POLICY "Users can view org IFC exports"
  ON ifc_exports
  FOR SELECT
  USING (
    org_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Users can create exports in their organization's projects
CREATE POLICY "Users can create IFC exports"
  ON ifc_exports
  FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
    )
    AND user_id = auth.uid()
  );

-- Users can delete their own exports
CREATE POLICY "Users can delete own IFC exports"
  ON ifc_exports
  FOR DELETE
  USING (user_id = auth.uid());

-- Storage bucket for IFC files (execute via Supabase dashboard or API)
-- This is a comment - actual bucket creation should be done via Supabase dashboard:
-- Bucket name: ifc-files
-- Public: false
-- File size limit: 100MB
-- Allowed MIME types: application/ifc, application/x-step, model/ifc, application/octet-stream

-- Storage policies for IFC files bucket
-- Users can upload IFC files to their organization's projects
-- Users can download IFC files from their organization's projects
-- Users can delete their own uploaded IFC files

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_ifc_imports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ifc_imports_updated_at
  BEFORE UPDATE ON ifc_imports
  FOR EACH ROW
  EXECUTE FUNCTION update_ifc_imports_updated_at();

CREATE OR REPLACE FUNCTION update_ifc_exports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ifc_exports_updated_at
  BEFORE UPDATE ON ifc_exports
  FOR EACH ROW
  EXECUTE FUNCTION update_ifc_exports_updated_at();

-- Comments
COMMENT ON TABLE ifc_imports IS 'Stores IFC file imports with extracted building data';
COMMENT ON TABLE ifc_exports IS 'Stores IFC file exports generated from scene data';
COMMENT ON COLUMN ifc_imports.ifc_data IS 'Extracted IFC data including project, building, objects, materials, spaces, and properties';
COMMENT ON COLUMN ifc_exports.schema IS 'IFC schema version (IFC2X3 or IFC4)';
