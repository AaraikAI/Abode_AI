-- Energy Simulations Table
-- Stores energy modeling and thermal simulation results

CREATE TABLE IF NOT EXISTS energy_simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Building parameters
  building_params JSONB NOT NULL,
  -- Structure:
  -- {
  --   "floorArea": number (sqft),
  --   "height": number (ft),
  --   "perimeter": number (ft),
  --   "volume": number (cuft),
  --   "numFloors": number,
  --   "orientation": number (degrees),
  --   "shape": "rectangular" | "l-shaped" | "complex"
  -- }

  -- Location
  location JSONB NOT NULL,
  -- {
  --   "latitude": number,
  --   "longitude": number,
  --   "elevation": number (ft),
  --   "timezone": string
  -- }

  -- Climate data (from ClimateDataService)
  climate_data JSONB NOT NULL,
  -- {
  --   "heatingDegreeDays": number,
  --   "coolingDegreeDays": number,
  --   "designTemperature": { "winter": number, "summer": number },
  --   "solarRadiation": { "summer": number, "winter": number },
  --   "humidity": { "summer": number, "winter": number }
  -- }

  -- Building envelope
  envelope JSONB NOT NULL,
  -- {
  --   "walls": { "rValue": number, "area": number },
  --   "windows": { "uValue": number, "area": number, "shgc": number },
  --   "roof": { "rValue": number, "area": number, "color": "light" | "dark" },
  --   "foundation": { "rValue": number, "area": number },
  --   "infiltration": number (ACH)
  -- }

  -- HVAC system
  hvac JSONB NOT NULL,
  -- {
  --   "heatingType": "gas" | "electric" | "heat_pump",
  --   "coolingType": "central" | "heat_pump" | "none",
  --   "heatingEfficiency": number,
  --   "coolingEfficiency": number (SEER),
  --   "thermostat": { "heatingSetpoint": number, "coolingSetpoint": number }
  -- }

  -- Lighting
  lighting JSONB NOT NULL,
  -- {
  --   "powerDensity": number (W/sqft),
  --   "hoursPerDay": number,
  --   "daylightingFactor": number (0-1)
  -- }

  -- Equipment
  equipment JSONB NOT NULL,
  -- {
  --   "powerDensity": number (W/sqft),
  --   "hoursPerDay": number
  -- }

  -- Occupancy
  occupancy JSONB NOT NULL,
  -- {
  --   "peoplePerSqft": number,
  --   "hoursPerDay": number,
  --   "daysPerWeek": number
  -- }

  -- Simulation results
  results JSONB NOT NULL,
  -- {
  --   "annual": {
  --     "heating": number (kWh),
  --     "cooling": number (kWh),
  --     "lighting": number (kWh),
  --     "equipment": number (kWh),
  --     "waterHeating": number (kWh),
  --     "total": number (kWh)
  --   },
  --   "monthly": Array<{
  --     "month": string,
  --     "heating": number,
  --     "cooling": number,
  --     "lighting": number,
  --     "equipment": number,
  --     "total": number
  --   }>,
  --   "peak": {
  --     "heating": number (W),
  --     "cooling": number (W),
  --     "total": number (W)
  --   },
  --   "costs": {
  --     "annual": number ($),
  --     "monthly": number ($),
  --     "perSqFt": number ($/sqft)
  --   },
  --   "carbon": {
  --     "annual": number (kg CO2),
  --     "perSqFt": number (kg CO2/sqft)
  --   },
  --   "efficiency": {
  --     "eui": number (kBtu/sqft/yr),
  --     "euiNormalized": number (% of baseline),
  --     "rating": "A+" | "A" | "B" | "C" | "D" | "E" | "F"
  --   },
  --   "recommendations": Array<{
  --     "category": string,
  --     "title": string,
  --     "description": string,
  --     "savings": number ($),
  --     "cost": number ($),
  --     "paybackYears": number,
  --     "priority": "high" | "medium" | "low"
  --   }>
  -- }

  -- Metadata
  simulated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for energy simulations
CREATE INDEX IF NOT EXISTS idx_energy_simulations_project_id ON energy_simulations(project_id);
CREATE INDEX IF NOT EXISTS idx_energy_simulations_org_id ON energy_simulations(org_id);
CREATE INDEX IF NOT EXISTS idx_energy_simulations_user_id ON energy_simulations(user_id);
CREATE INDEX IF NOT EXISTS idx_energy_simulations_simulated_at ON energy_simulations(simulated_at DESC);

-- GIN index for JSONB fields (enables efficient querying of nested data)
CREATE INDEX IF NOT EXISTS idx_energy_simulations_results_gin ON energy_simulations USING gin(results jsonb_path_ops);
CREATE INDEX IF NOT EXISTS idx_energy_simulations_building_params_gin ON energy_simulations USING gin(building_params jsonb_path_ops);

-- RLS Policies for energy simulations
ALTER TABLE energy_simulations ENABLE ROW LEVEL SECURITY;

-- Users can view simulations from their organization
CREATE POLICY "Users can view org energy simulations"
  ON energy_simulations
  FOR SELECT
  USING (
    org_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Users can create simulations in their organization's projects
CREATE POLICY "Users can create energy simulations"
  ON energy_simulations
  FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
    )
    AND user_id = auth.uid()
  );

-- Users can update their own simulations
CREATE POLICY "Users can update own energy simulations"
  ON energy_simulations
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own simulations
CREATE POLICY "Users can delete own energy simulations"
  ON energy_simulations
  FOR DELETE
  USING (user_id = auth.uid());

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_energy_simulations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER energy_simulations_updated_at
  BEFORE UPDATE ON energy_simulations
  FOR EACH ROW
  EXECUTE FUNCTION update_energy_simulations_updated_at();

-- Helper function to get latest simulation for a project
CREATE OR REPLACE FUNCTION get_latest_energy_simulation(p_project_id UUID)
RETURNS energy_simulations AS $$
  SELECT *
  FROM energy_simulations
  WHERE project_id = p_project_id
  ORDER BY simulated_at DESC
  LIMIT 1;
$$ LANGUAGE sql STABLE;

-- Helper function to compare simulations (for A/B testing different configurations)
CREATE OR REPLACE FUNCTION compare_energy_simulations(
  sim1_id UUID,
  sim2_id UUID
)
RETURNS JSONB AS $$
DECLARE
  sim1 energy_simulations;
  sim2 energy_simulations;
  comparison JSONB;
BEGIN
  SELECT * INTO sim1 FROM energy_simulations WHERE id = sim1_id;
  SELECT * INTO sim2 FROM energy_simulations WHERE id = sim2_id;

  IF sim1 IS NULL OR sim2 IS NULL THEN
    RETURN jsonb_build_object('error', 'One or both simulations not found');
  END IF;

  comparison := jsonb_build_object(
    'annual_energy_diff', (sim1.results->'annual'->>'total')::numeric - (sim2.results->'annual'->>'total')::numeric,
    'annual_cost_diff', (sim1.results->'costs'->>'annual')::numeric - (sim2.results->'costs'->>'annual')::numeric,
    'carbon_diff', (sim1.results->'carbon'->>'annual')::numeric - (sim2.results->'carbon'->>'annual')::numeric,
    'eui_diff', (sim1.results->'efficiency'->>'eui')::numeric - (sim2.results->'efficiency'->>'eui')::numeric,
    'simulation1', jsonb_build_object(
      'id', sim1.id,
      'simulated_at', sim1.simulated_at,
      'total_energy', sim1.results->'annual'->>'total',
      'total_cost', sim1.results->'costs'->>'annual',
      'rating', sim1.results->'efficiency'->>'rating'
    ),
    'simulation2', jsonb_build_object(
      'id', sim2.id,
      'simulated_at', sim2.simulated_at,
      'total_energy', sim2.results->'annual'->>'total',
      'total_cost', sim2.results->'costs'->>'annual',
      'rating', sim2.results->'efficiency'->>'rating'
    )
  );

  RETURN comparison;
END;
$$ LANGUAGE plpgsql STABLE;

-- Comments
COMMENT ON TABLE energy_simulations IS 'Stores energy modeling and thermal simulation results for buildings';
COMMENT ON COLUMN energy_simulations.building_params IS 'Physical building parameters (area, height, volume, etc.)';
COMMENT ON COLUMN energy_simulations.climate_data IS 'Climate data for the building location (HDD, CDD, solar radiation, etc.)';
COMMENT ON COLUMN energy_simulations.envelope IS 'Building envelope characteristics (walls, windows, roof, foundation, infiltration)';
COMMENT ON COLUMN energy_simulations.hvac IS 'HVAC system configuration (heating/cooling types and efficiencies)';
COMMENT ON COLUMN energy_simulations.results IS 'Simulation results including annual/monthly energy, costs, carbon, and recommendations';
COMMENT ON FUNCTION get_latest_energy_simulation IS 'Returns the most recent energy simulation for a project';
COMMENT ON FUNCTION compare_energy_simulations IS 'Compares two energy simulations and returns the differences';
