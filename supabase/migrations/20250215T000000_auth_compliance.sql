create extension if not exists "pgcrypto";

create table if not exists user_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  device_id text not null,
  user_agent text,
  ip_address text,
  geo_country text,
  trusted boolean not null default false,
  last_seen_at timestamptz default now(),
  created_at timestamptz default now(),
  unique(user_id, device_id)
);

create table if not exists user_mfa_methods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  method_type text not null,
  label text,
  public_key text,
  credential_id text,
  sign_count bigint default 0,
  last_used_at timestamptz,
  created_at timestamptz default now(),
  unique(user_id, method_type, credential_id)
);

create table if not exists org_geo_policies (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  allowed_countries text[] default array[]::text[],
  blocked_countries text[] default array[]::text[],
  enforced boolean not null default false,
  updated_at timestamptz default now(),
  unique(org_id)
);

create trigger org_geo_policies_touch_updated
before update on org_geo_policies
for each row execute procedure set_updated_at();

create table if not exists webauthn_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  challenge text not null,
  expires_at timestamptz not null,
  type text not null,
  created_at timestamptz default now()
);

create index if not exists idx_webauthn_challenges_user on webauthn_challenges(user_id);
