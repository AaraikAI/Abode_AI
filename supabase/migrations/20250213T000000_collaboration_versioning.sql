create extension if not exists "pgcrypto";

create table if not exists collaboration_annotations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  workspace text not null,
  target_id text,
  author_id uuid references users(id) on delete set null,
  author_name text,
  body text not null,
  position jsonb,
  metadata jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_collab_annotations_org_workspace on collaboration_annotations(org_id, workspace);

create table if not exists collaboration_approval_items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  queue_key text not null,
  item_id text not null,
  status text not null default 'queued',
  payload jsonb,
  requested_by uuid references users(id) on delete set null,
  resolved_by uuid references users(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz default now()
);

create unique index if not exists idx_collab_approval_unique on collaboration_approval_items(org_id, queue_key, item_id);

create table if not exists version_branches (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  entity_type text not null,
  entity_id text not null,
  name text not null,
  description text,
  parent_branch_id uuid references version_branches(id) on delete set null,
  created_by uuid references users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(org_id, entity_type, entity_id, name)
);

create table if not exists version_commits (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  branch_id uuid not null references version_branches(id) on delete cascade,
  parent_commit_id uuid references version_commits(id) on delete set null,
  entity_snapshot jsonb not null,
  message text not null,
  created_by uuid references users(id) on delete set null,
  created_at timestamptz default now()
);

create index if not exists idx_version_commits_branch on version_commits(branch_id, created_at desc);

create table if not exists version_pull_requests (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  entity_type text not null,
  entity_id text not null,
  source_branch_id uuid not null references version_branches(id) on delete cascade,
  target_branch_id uuid not null references version_branches(id) on delete cascade,
  status text not null default 'open',
  title text not null,
  description text,
  created_by uuid references users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists version_diffs (
  id uuid primary key default gen_random_uuid(),
  pull_request_id uuid not null references version_pull_requests(id) on delete cascade,
  diff jsonb not null,
  created_at timestamptz default now()
);

create or replace function touch_version_branch()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger version_branches_touch_updated
before update on version_branches
for each row execute procedure touch_version_branch();

create trigger version_pull_requests_touch_updated
before update on version_pull_requests
for each row execute procedure touch_version_branch();
