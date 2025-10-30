create table if not exists telemetry_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete set null,
  event_type text not null,
  payload jsonb,
  trace_id text,
  span_id text,
  source text,
  created_at timestamptz not null default now()
);

create table if not exists slo_checks (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  target text not null,
  provider text not null default 'checkly',
  slo_threshold numeric,
  slo_window text,
  status text not null default 'unknown',
  last_checked_at timestamptz,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create table if not exists sustainability_targets (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  target_name text not null,
  target_value numeric not null,
  unit text not null,
  period text not null,
  created_at timestamptz not null default now()
);

create table if not exists sustainability_actuals (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  target_id uuid references sustainability_targets(id) on delete cascade,
  actual_value numeric not null,
  collected_at timestamptz not null default now(),
  metadata jsonb
);
