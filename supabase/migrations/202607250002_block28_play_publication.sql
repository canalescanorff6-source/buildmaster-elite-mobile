-- BuildMaster v30.00 — Bloco 28: publicação profissional, Play Integrity e exclusão pública

create table if not exists public.buildmaster_public_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  request_key text not null unique,
  user_id uuid references auth.users(id) on delete set null,
  username_hash text not null,
  username_hint text not null default '',
  reason text not null default '',
  source text not null default 'public_web' check (source in ('public_web','authenticated_app')),
  status text not null default 'requested' check (status in ('requested','processing','completed','rejected')),
  ip_hash text not null default '',
  requested_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.buildmaster_public_request_limits (
  rate_key text primary key,
  request_count integer not null default 0,
  window_started_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.buildmaster_play_integrity_audit (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  request_hash text not null,
  app_recognition text not null default '',
  app_licensing text not null default '',
  device_verdicts text[] not null default '{}',
  version_code bigint,
  allowed boolean not null default false,
  reason text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists idx_buildmaster_public_deletion_status on public.buildmaster_public_deletion_requests(status,requested_at desc);
create index if not exists idx_buildmaster_public_deletion_user on public.buildmaster_public_deletion_requests(user_id,requested_at desc);
create index if not exists idx_buildmaster_integrity_user on public.buildmaster_play_integrity_audit(user_id,created_at desc);

alter table public.buildmaster_public_deletion_requests enable row level security;
alter table public.buildmaster_public_request_limits enable row level security;
alter table public.buildmaster_play_integrity_audit enable row level security;

-- As Edge Functions usam a service role. Nenhuma tabela pública recebe policy anônima.
-- Usuários autenticados podem consultar apenas as próprias solicitações vinculadas.
create policy buildmaster_public_deletion_read_own
  on public.buildmaster_public_deletion_requests for select to authenticated
  using (user_id = auth.uid());

create policy buildmaster_integrity_read_own
  on public.buildmaster_play_integrity_audit for select to authenticated
  using (user_id = auth.uid());
