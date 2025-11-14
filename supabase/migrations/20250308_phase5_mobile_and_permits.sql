-- Phase 5: Mobile Apps & Permit System Tables

-- Mobile Devices Table
CREATE TABLE IF NOT EXISTS mobile_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  device_token TEXT NOT NULL,
  app_version TEXT NOT NULL,
  os_version TEXT NOT NULL,
  model TEXT NOT NULL,

  push_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  biometric_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  offline_sync_enabled BOOLEAN NOT NULL DEFAULT TRUE,

  last_active_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mobile_devices_user_id ON mobile_devices(user_id);
CREATE INDEX idx_mobile_devices_platform ON mobile_devices(platform);
CREATE INDEX idx_mobile_devices_last_active ON mobile_devices(last_active_at DESC);

ALTER TABLE mobile_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own mobile devices"
  ON mobile_devices FOR ALL
  USING (user_id = auth.uid());

-- Push Notifications Table
CREATE TABLE IF NOT EXISTS push_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id UUID REFERENCES mobile_devices(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,

  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal', 'high')),

  sent BOOLEAN NOT NULL DEFAULT FALSE,
  sent_at TIMESTAMP WITH TIME ZONE,
  opened BOOLEAN NOT NULL DEFAULT FALSE,
  opened_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_push_notifications_user_id ON push_notifications(user_id);
CREATE INDEX idx_push_notifications_device_id ON push_notifications(device_id);
CREATE INDEX idx_push_notifications_sent_at ON push_notifications(sent_at DESC) WHERE sent = TRUE;

ALTER TABLE push_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own push notifications"
  ON push_notifications FOR SELECT
  USING (user_id = auth.uid());

-- AR Sessions Table
CREATE TABLE IF NOT EXISTS ar_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  platform TEXT NOT NULL CHECK (platform IN ('arkit', 'arcore')),
  session_data JSONB NOT NULL,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_ar_sessions_user_id ON ar_sessions(user_id);
CREATE INDEX idx_ar_sessions_project_id ON ar_sessions(project_id);
CREATE INDEX idx_ar_sessions_expires_at ON ar_sessions(expires_at) WHERE expires_at > NOW();

ALTER TABLE ar_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own AR sessions"
  ON ar_sessions FOR ALL
  USING (user_id = auth.uid());

-- Permit Applications Table
CREATE TABLE IF NOT EXISTS permit_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  jurisdiction_id TEXT NOT NULL,
  permit_type TEXT NOT NULL CHECK (permit_type IN ('building', 'electrical', 'plumbing', 'mechanical', 'grading', 'zoning', 'demolition', 'fire')),

  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'ready', 'submitted', 'under_review', 'approved', 'rejected', 'resubmit')),

  applicant JSONB NOT NULL,
  property JSONB NOT NULL,
  project_details JSONB NOT NULL,

  documents JSONB NOT NULL DEFAULT '[]'::jsonb,
  engineer_stamp JSONB,
  compliance_checks JSONB NOT NULL DEFAULT '[]'::jsonb,

  fees JSONB NOT NULL,

  submitted_at TIMESTAMP WITH TIME ZONE,
  review_started_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_permit_applications_user_id ON permit_applications(user_id);
CREATE INDEX idx_permit_applications_project_id ON permit_applications(project_id);
CREATE INDEX idx_permit_applications_status ON permit_applications(status);
CREATE INDEX idx_permit_applications_permit_type ON permit_applications(permit_type);
CREATE INDEX idx_permit_applications_created_at ON permit_applications(created_at DESC);

ALTER TABLE permit_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own permit applications"
  ON permit_applications FOR ALL
  USING (user_id = auth.uid());

-- Permit Packages Table
CREATE TABLE IF NOT EXISTS permit_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES permit_applications(id) ON DELETE CASCADE,

  documents JSONB NOT NULL,
  cover_sheet JSONB NOT NULL,

  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_permit_packages_application_id ON permit_packages(application_id);

ALTER TABLE permit_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own permit packages"
  ON permit_packages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM permit_applications pa
      WHERE pa.id = application_id AND pa.user_id = auth.uid()
    )
  );

-- Comments
COMMENT ON TABLE mobile_devices IS 'Registered mobile devices for push notifications and offline sync';
COMMENT ON TABLE push_notifications IS 'Push notification history';
COMMENT ON TABLE ar_sessions IS 'AR/VR sessions with world maps and cloud anchors';
COMMENT ON TABLE permit_applications IS 'Building permit applications and submissions';
COMMENT ON TABLE permit_packages IS 'Generated permit packages with all documents';
