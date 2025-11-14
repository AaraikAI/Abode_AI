-- Phase 4: API Marketplace Tables

-- API Keys Table
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE, -- Hashed API key for security
  environment TEXT NOT NULL CHECK (environment IN ('development', 'staging', 'production')),
  scopes TEXT[] NOT NULL DEFAULT ARRAY['read'],

  rate_limit JSONB NOT NULL DEFAULT '{"requestsPerMinute": 60, "requestsPerHour": 1000, "requestsPerDay": 10000}'::jsonb,

  revoked BOOLEAN NOT NULL DEFAULT FALSE,
  revoked_at TIMESTAMP WITH TIME ZONE,

  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_org_id ON api_keys(org_id);
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash) WHERE NOT revoked;
CREATE INDEX idx_api_keys_last_used ON api_keys(last_used_at DESC);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own API keys"
  ON api_keys FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create API keys"
  ON api_keys FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own API keys"
  ON api_keys FOR UPDATE
  USING (user_id = auth.uid());

-- Webhooks Table
CREATE TABLE IF NOT EXISTS webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  url TEXT NOT NULL,
  events TEXT[] NOT NULL, -- Array of event types to listen for
  secret_hash TEXT NOT NULL, -- Hashed webhook secret for HMAC

  description TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,

  retry_policy JSONB NOT NULL DEFAULT '{"maxRetries": 3, "initialDelayMs": 1000, "backoffMultiplier": 2}'::jsonb,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_webhooks_user_id ON webhooks(user_id);
CREATE INDEX idx_webhooks_org_id ON webhooks(org_id);
CREATE INDEX idx_webhooks_active ON webhooks(active) WHERE active = TRUE;

ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own webhooks"
  ON webhooks FOR ALL
  USING (user_id = auth.uid());

-- Webhook Deliveries Table (For tracking webhook delivery attempts)
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,

  event_type TEXT NOT NULL,
  event_id TEXT NOT NULL,

  status TEXT NOT NULL CHECK (status IN ('pending', 'success', 'failed')),
  http_status_code INTEGER,
  error_message TEXT,

  attempt_number INTEGER NOT NULL DEFAULT 1,
  response_time_ms INTEGER,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_webhook_deliveries_webhook_id ON webhook_deliveries(webhook_id);
CREATE INDEX idx_webhook_deliveries_created_at ON webhook_deliveries(created_at DESC);
CREATE INDEX idx_webhook_deliveries_status ON webhook_deliveries(status);

-- API Usage Metrics Table
CREATE TABLE IF NOT EXISTS api_usage_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,

  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,

  status_code INTEGER NOT NULL,
  response_time_ms INTEGER NOT NULL,

  request_size_bytes INTEGER,
  response_size_bytes INTEGER
);

CREATE INDEX idx_api_usage_key_timestamp ON api_usage_metrics(api_key_id, timestamp DESC);
CREATE INDEX idx_api_usage_timestamp ON api_usage_metrics(timestamp DESC);

-- Use TimescaleDB for time-series optimization (if available)
-- SELECT create_hypertable('api_usage_metrics', 'timestamp', if_not_exists => TRUE);

-- Comments
COMMENT ON TABLE api_keys IS 'API keys for developer integrations';
COMMENT ON TABLE webhooks IS 'Webhook subscriptions for event notifications';
COMMENT ON TABLE webhook_deliveries IS 'Webhook delivery attempts and outcomes';
COMMENT ON TABLE api_usage_metrics IS 'API usage statistics and performance metrics';
