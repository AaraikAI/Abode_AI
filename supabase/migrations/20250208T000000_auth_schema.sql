create extension if not exists "pgcrypto";

create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  external_ref text unique not null,
  name text not null,
  slug text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  auth0_user_id text unique not null,
  email text,
  display_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists user_organization_memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  roles text[] not null default array['designer']::text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, organization_id)
);

create table if not exists user_sessions (
  id uuid primary key,
  user_id uuid not null references users(id) on delete cascade,
  organization_id uuid references organizations(id) on delete cascade,
  ip_address text,
  geo_country text,
  user_agent text,
  metadata jsonb,
  last_seen_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  expires_at timestamptz,
  ended_at timestamptz
);

create index if not exists idx_user_sessions_user on user_sessions(user_id);
create index if not exists idx_user_sessions_org on user_sessions(organization_id);

create table if not exists auth_audits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  organization_id uuid references organizations(id) on delete set null,
  event_type text not null,
  ip_address text,
  geo_country text,
  user_agent text,
  metadata jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_auth_audits_user_created on auth_audits(user_id, created_at desc);
create index if not exists idx_auth_audits_org_created on auth_audits(organization_id, created_at desc);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger organizations_set_updated_at
before update on organizations
for each row execute procedure set_updated_at();

create trigger users_set_updated_at
before update on users
for each row execute procedure set_updated_at();

create trigger memberships_set_updated_at
before update on user_organization_memberships
for each row execute procedure set_updated_at();

create trigger user_sessions_set_updated_at
before update on user_sessions
for each row execute procedure set_updated_at();
