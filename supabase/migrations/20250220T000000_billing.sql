create table if not exists billing_plans (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  monthly_price_cents integer not null default 0,
  annual_price_cents integer,
  included_credits integer not null default 0,
  stripe_price_id text,
  stripe_annual_price_id text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists plan_feature_flags (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references billing_plans(id) on delete cascade,
  feature_key text not null,
  feature_value jsonb not null default '{}',
  created_at timestamptz not null default now(),
  unique(plan_id, feature_key)
);

create table if not exists organization_subscriptions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  plan_id uuid references billing_plans(id),
  stripe_customer_id text,
  stripe_subscription_id text,
  status text not null default 'trialing',
  trial_ends_at timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  credits_balance integer not null default 0,
  credits_reserved integer not null default 0,
  auto_renew boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id)
);

create table if not exists credit_transactions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  subscription_id uuid references organization_subscriptions(id) on delete set null,
  delta integer not null,
  balance integer not null,
  reason text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create table if not exists promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  description text,
  discount_percent integer,
  additional_credits integer,
  max_redemptions integer,
  redemptions integer not null default 0,
  valid_from timestamptz,
  valid_until timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  stripe_invoice_id text,
  amount_cents integer not null,
  currency text not null default 'usd',
  status text not null,
  issued_at timestamptz not null,
  hosted_invoice_url text,
  pdf_url text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create table if not exists referral_events (
  id uuid primary key default gen_random_uuid(),
  referrer_org_id uuid not null references organizations(id) on delete cascade,
  referred_org_id uuid references organizations(id) on delete set null,
  reward_credits integer not null default 0,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger billing_plans_set_updated
before update on billing_plans
for each row execute procedure set_updated_at();

create trigger org_subscriptions_set_updated
before update on organization_subscriptions
for each row execute procedure set_updated_at();
