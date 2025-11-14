-- Phase 3: AR/VR and Digital Twins Tables

-- AR/VR Exports Table
CREATE TABLE IF NOT EXISTS arvr_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  format TEXT NOT NULL CHECK (format IN ('gltf', 'glb')),
  file_url TEXT NOT NULL,
  file_size BIGINT NOT NULL,

  scene_stats JSONB NOT NULL,
  validation_warnings TEXT[],

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_arvr_exports_project_id ON arvr_exports(project_id);
CREATE INDEX idx_arvr_exports_user_id ON arvr_exports(user_id);

ALTER TABLE arvr_exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own AR/VR exports"
  ON arvr_exports FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create AR/VR exports"
  ON arvr_exports FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Digital Twin Sensors Table
CREATE TABLE IF NOT EXISTS iot_sensors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id TEXT NOT NULL,
  sensor_type TEXT NOT NULL CHECK (sensor_type IN ('temperature', 'humidity', 'occupancy', 'light', 'energy', 'co2', 'motion', 'door', 'window')),
  location JSONB,
  unit TEXT NOT NULL,
  range JSONB,
  calibration JSONB,

  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_iot_sensors_building_id ON iot_sensors(building_id);
CREATE INDEX idx_iot_sensors_type ON iot_sensors(sensor_type);

-- Digital Twin Sensor Readings Table (Time-series data)
CREATE TABLE IF NOT EXISTS iot_sensor_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sensor_id UUID NOT NULL REFERENCES iot_sensors(id) ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  value DOUBLE PRECISION NOT NULL,
  quality TEXT NOT NULL DEFAULT 'good' CHECK (quality IN ('good', 'uncertain', 'bad')),
  metadata JSONB,

  PRIMARY KEY (sensor_id, timestamp)
);

-- Use TimescaleDB for time-series optimization (if available)
-- SELECT create_hypertable('iot_sensor_readings', 'timestamp', if_not_exists => TRUE);

CREATE INDEX idx_iot_readings_sensor_time ON iot_sensor_readings(sensor_id, timestamp DESC);

-- Digital Twin Anomalies Table
CREATE TABLE IF NOT EXISTS iot_anomalies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sensor_id UUID NOT NULL REFERENCES iot_sensors(id) ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  expected_value DOUBLE PRECISION NOT NULL,
  actual_value DOUBLE PRECISION NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT NOT NULL,
  acknowledged BOOLEAN NOT NULL DEFAULT FALSE,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_iot_anomalies_sensor_id ON iot_anomalies(sensor_id);
CREATE INDEX idx_iot_anomalies_timestamp ON iot_anomalies(timestamp DESC);

-- Digital Twin Alerts Table
CREATE TABLE IF NOT EXISTS iot_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sensor_id UUID REFERENCES iot_sensors(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('threshold', 'anomaly', 'offline', 'prediction')),
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  message TEXT NOT NULL,
  acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
  acknowledged_by UUID REFERENCES auth.users(id),
  acknowledged_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_iot_alerts_sensor_id ON iot_alerts(sensor_id);
CREATE INDEX idx_iot_alerts_severity ON iot_alerts(severity);
CREATE INDEX idx_iot_alerts_acknowledged ON iot_alerts(acknowledged) WHERE NOT acknowledged;

-- RLS Policies for IoT tables (simplified - expand based on requirements)
ALTER TABLE iot_sensors ENABLE ROW LEVEL SECURITY;
ALTER TABLE iot_sensor_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE iot_anomalies ENABLE ROW LEVEL SECURITY;
ALTER TABLE iot_alerts ENABLE ROW LEVEL SECURITY;

-- Comments
COMMENT ON TABLE arvr_exports IS 'Stores AR/VR scene exports in GLTF/GLB format';
COMMENT ON TABLE iot_sensors IS 'IoT sensor registry for digital twins';
COMMENT ON TABLE iot_sensor_readings IS 'Time-series sensor data for real-time monitoring';
COMMENT ON TABLE iot_anomalies IS 'Detected anomalies in sensor readings';
COMMENT ON TABLE iot_alerts IS 'Real-time alerts from digital twin system';
