create table if not exists integration_providers (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  display_name text not null,
  description text,
  auth_type text not null default 'oauth2',
  scopes text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(provider)
);

create table if not exists organization_integrations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  provider_id uuid not null references integration_providers(id) on delete cascade,
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  webhook_secret text,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, provider_id)
);

create table if not exists airflow_webhook_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete set null,
  dag_id text not null,
  run_id text not null,
  event_type text not null,
  payload jsonb,
  created_at timestamptz not null default now()
);

create or replace function touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger integration_providers_touch_updated
before update on integration_providers
for each row execute procedure touch_updated_at();

create trigger organization_integrations_touch_updated
before update on organization_integrations
for each row execute procedure touch_updated_at();
