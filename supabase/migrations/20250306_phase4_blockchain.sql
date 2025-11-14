-- Phase 4: Blockchain Integration Tables

-- Blockchain Materials Table
CREATE TABLE IF NOT EXISTS blockchain_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  material_name TEXT NOT NULL,
  material_type TEXT NOT NULL,

  -- Origin information
  origin JSONB NOT NULL, -- Supplier, location, harvest date, certifications

  -- Sustainability metrics
  sustainability JSONB NOT NULL, -- Carbon footprint, renewable content, etc.

  -- Blockchain data
  blockchain_network TEXT NOT NULL CHECK (blockchain_network IN ('ethereum', 'polygon', 'hyperledger')),
  contract_address TEXT NOT NULL,
  transaction_hash TEXT NOT NULL,
  block_number BIGINT NOT NULL,

  -- Verification
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  proof_url TEXT, -- IPFS URL for verification proof

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_blockchain_materials_user_id ON blockchain_materials(user_id);
CREATE INDEX idx_blockchain_materials_material_id ON blockchain_materials(material_id);
CREATE INDEX idx_blockchain_materials_verified ON blockchain_materials(verified);
CREATE INDEX idx_blockchain_materials_network ON blockchain_materials(blockchain_network);

ALTER TABLE blockchain_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own materials"
  ON blockchain_materials FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can register materials"
  ON blockchain_materials FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Supply Chain Events Table
CREATE TABLE IF NOT EXISTS supply_chain_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL UNIQUE,
  material_id TEXT NOT NULL,

  event_type TEXT NOT NULL CHECK (event_type IN ('extraction', 'processing', 'manufacturing', 'shipping', 'receiving', 'installation')),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT NOT NULL,
  actor TEXT NOT NULL,
  description TEXT NOT NULL,

  data JSONB, -- Additional event-specific data

  -- Blockchain data
  transaction_hash TEXT NOT NULL,
  block_number BIGINT NOT NULL,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_supply_chain_events_material_id ON supply_chain_events(material_id);
CREATE INDEX idx_supply_chain_events_event_type ON supply_chain_events(event_type);
CREATE INDEX idx_supply_chain_events_timestamp ON supply_chain_events(timestamp DESC);

-- Smart Contracts Table
CREATE TABLE IF NOT EXISTS smart_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('escrow', 'milestone', 'certification', 'warranty', 'royalty')),

  -- Blockchain deployment
  network TEXT NOT NULL CHECK (network IN ('ethereum', 'polygon', 'hyperledger')),
  address TEXT,
  abi JSONB NOT NULL,

  -- Contract parties
  parties JSONB NOT NULL, -- Array of {role, address, name}

  -- Contract terms
  terms JSONB NOT NULL, -- Conditions, payments, milestones

  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'cancelled', 'disputed')),

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deployed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_smart_contracts_user_id ON smart_contracts(user_id);
CREATE INDEX idx_smart_contracts_type ON smart_contracts(type);
CREATE INDEX idx_smart_contracts_status ON smart_contracts(status);
CREATE INDEX idx_smart_contracts_network ON smart_contracts(network);

ALTER TABLE smart_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own contracts"
  ON smart_contracts FOR ALL
  USING (user_id = auth.uid());

-- Contract Events Table
CREATE TABLE IF NOT EXISTS contract_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES smart_contracts(id) ON DELETE CASCADE,

  event_type TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  data JSONB NOT NULL,

  transaction_hash TEXT NOT NULL,
  block_number BIGINT NOT NULL,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contract_events_contract_id ON contract_events(contract_id);
CREATE INDEX idx_contract_events_timestamp ON contract_events(timestamp DESC);

-- Sustainability Proofs Table
CREATE TABLE IF NOT EXISTS sustainability_proofs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  proof_hash TEXT NOT NULL,
  ipfs_url TEXT NOT NULL,

  certificate JSONB NOT NULL, -- Certificate data with metrics

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sustainability_proofs_project_id ON sustainability_proofs(project_id);
CREATE INDEX idx_sustainability_proofs_user_id ON sustainability_proofs(user_id);

ALTER TABLE sustainability_proofs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sustainability proofs"
  ON sustainability_proofs FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create sustainability proofs"
  ON sustainability_proofs FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Comments
COMMENT ON TABLE blockchain_materials IS 'Material provenance tracking on blockchain';
COMMENT ON TABLE supply_chain_events IS 'Supply chain event history for materials';
COMMENT ON TABLE smart_contracts IS 'Smart contracts for automated transactions';
COMMENT ON TABLE contract_events IS 'Event history for smart contracts';
COMMENT ON TABLE sustainability_proofs IS 'Blockchain-verified sustainability certificates';
