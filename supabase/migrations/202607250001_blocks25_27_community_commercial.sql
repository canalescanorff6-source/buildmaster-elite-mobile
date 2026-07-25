-- BuildMaster v29.80 — Blocos 25 e 27
-- Esta migração NÃO processa pagamentos. Cobranças dependem de provedor externo,
-- confirmação administrativa e integração separada com webhook idempotente.

create extension if not exists pgcrypto;

create table if not exists public.buildmaster_commercial_plans (
  id text primary key,
  name text not null,
  description text not null default '',
  price_cents integer,
  currency text not null default 'BRL' check (currency = 'BRL'),
  billing_period text check (billing_period in ('monthly','annual','lifetime','manual')),
  features jsonb not null default '{}'::jsonb,
  limits jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.buildmaster_commercial_licenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id text not null references public.buildmaster_commercial_plans(id),
  status text not null default 'active' check (status in ('trial','active','suspended','expired','cancelled')),
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  trial_ends_at timestamptz,
  max_devices integer not null default 1 check (max_devices between 1 and 100),
  source text not null default 'administrator' check (source in ('administrator','provider','migration','trial')),
  provider_customer_ref text,
  provider_subscription_ref text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

create table if not exists public.buildmaster_commercial_coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text not null default '',
  discount_type text not null check (discount_type in ('percent','fixed','trial_days','manual')),
  discount_value integer not null default 0 check (discount_value >= 0),
  max_uses integer,
  used_count integer not null default 0 check (used_count >= 0),
  starts_at timestamptz,
  expires_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.buildmaster_commercial_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  license_id uuid references public.buildmaster_commercial_licenses(id) on delete set null,
  entry_type text not null check (entry_type in ('license_created','license_renewed','plan_changed','coupon_applied','manual_payment_recorded','refund_recorded','trial_started')),
  description text not null,
  amount_cents integer,
  currency text not null default 'BRL' check (currency = 'BRL'),
  external_reference text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.buildmaster_terms_acceptances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  terms_version text not null,
  privacy_version text not null,
  accepted_at timestamptz not null default now(),
  source text not null default 'app',
  unique(user_id, terms_version, privacy_version)
);

create table if not exists public.buildmaster_lgpd_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  request_type text not null check (request_type in ('access','correction','export','deletion')),
  status text not null default 'requested' check (status in ('requested','processing','completed','rejected')),
  reason text not null default '',
  administrator_note text not null default '',
  requested_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.buildmaster_community_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Jogador BuildMaster',
  bio text not null default '',
  creator boolean not null default false,
  verified boolean not null default false,
  visibility text not null default 'private' check (visibility in ('private','community')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.buildmaster_community_packages (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  share_code text not null unique,
  content_kind text not null check (content_kind in ('player_build','formation','training_plan','opponent_plan','tactical_sequence')),
  title text not null,
  description text not null default '',
  visibility text not null default 'private' check (visibility in ('private','unlisted','community')),
  moderation_status text not null default 'pending' check (moderation_status in ('draft','pending','approved','rejected')),
  payload jsonb not null,
  checksum text not null,
  tags text[] not null default '{}',
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.buildmaster_community_ratings (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references public.buildmaster_community_packages(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  score integer not null check (score between 1 and 5),
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(package_id,user_id)
);

create table if not exists public.buildmaster_community_comments (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references public.buildmaster_community_packages(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  message text not null,
  moderation_status text not null default 'visible' check (moderation_status in ('visible','reported','hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.buildmaster_community_reports (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references public.buildmaster_community_packages(id) on delete cascade,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reason text not null,
  status text not null default 'open' check (status in ('open','reviewed','dismissed','actioned')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  unique(package_id,reporter_id)
);

create index if not exists idx_buildmaster_licenses_user on public.buildmaster_commercial_licenses(user_id);
create index if not exists idx_buildmaster_ledger_user on public.buildmaster_commercial_ledger(user_id,created_at desc);
create index if not exists idx_buildmaster_lgpd_user on public.buildmaster_lgpd_requests(user_id,requested_at desc);
create index if not exists idx_buildmaster_community_owner on public.buildmaster_community_packages(owner_id,created_at desc);
create index if not exists idx_buildmaster_community_visibility on public.buildmaster_community_packages(visibility,moderation_status,created_at desc);

alter table public.buildmaster_commercial_plans enable row level security;
alter table public.buildmaster_commercial_licenses enable row level security;
alter table public.buildmaster_commercial_coupons enable row level security;
alter table public.buildmaster_commercial_ledger enable row level security;
alter table public.buildmaster_terms_acceptances enable row level security;
alter table public.buildmaster_lgpd_requests enable row level security;
alter table public.buildmaster_community_profiles enable row level security;
alter table public.buildmaster_community_packages enable row level security;
alter table public.buildmaster_community_ratings enable row level security;
alter table public.buildmaster_community_comments enable row level security;
alter table public.buildmaster_community_reports enable row level security;

create policy buildmaster_plans_read_authenticated on public.buildmaster_commercial_plans for select to authenticated using (active = true);
create policy buildmaster_license_read_own on public.buildmaster_commercial_licenses for select to authenticated using (user_id = auth.uid());
create policy buildmaster_ledger_read_own on public.buildmaster_commercial_ledger for select to authenticated using (user_id = auth.uid());
create policy buildmaster_terms_manage_own on public.buildmaster_terms_acceptances for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy buildmaster_lgpd_insert_own on public.buildmaster_lgpd_requests for insert to authenticated with check (user_id = auth.uid());
create policy buildmaster_lgpd_read_own on public.buildmaster_lgpd_requests for select to authenticated using (user_id = auth.uid());

create policy buildmaster_community_profile_read on public.buildmaster_community_profiles for select to authenticated using (visibility = 'community' or user_id = auth.uid());
create policy buildmaster_community_profile_manage_own on public.buildmaster_community_profiles for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy buildmaster_community_package_read on public.buildmaster_community_packages for select to authenticated using (owner_id = auth.uid() or visibility = 'unlisted' or (visibility = 'community' and moderation_status = 'approved'));
create policy buildmaster_community_package_create_own on public.buildmaster_community_packages for insert to authenticated with check (owner_id = auth.uid());
create policy buildmaster_community_package_update_own on public.buildmaster_community_packages for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy buildmaster_community_package_delete_own on public.buildmaster_community_packages for delete to authenticated using (owner_id = auth.uid());
create policy buildmaster_community_rating_read on public.buildmaster_community_ratings for select to authenticated using (true);
create policy buildmaster_community_rating_own on public.buildmaster_community_ratings for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy buildmaster_community_comment_read on public.buildmaster_community_comments for select to authenticated using (moderation_status = 'visible' or user_id = auth.uid());
create policy buildmaster_community_comment_insert_own on public.buildmaster_community_comments for insert to authenticated with check (user_id = auth.uid());
create policy buildmaster_community_report_insert_own on public.buildmaster_community_reports for insert to authenticated with check (reporter_id = auth.uid());
create policy buildmaster_community_report_read_own on public.buildmaster_community_reports for select to authenticated using (reporter_id = auth.uid());

insert into public.buildmaster_commercial_plans(id,name,description,price_cents,currency,billing_period,features,limits)
values
 ('essential','Essencial','Leitor e laboratório pessoal.',null,'BRL','manual','{"ocr":true,"player_lab":true}'::jsonb,'{"devices":1,"communityPublications":0,"cloudVersions":1}'::jsonb),
 ('pro','Pro','Recursos táticos e comunidade.',null,'BRL','manual','{"ocr":true,"player_lab":true,"tactical_studio":true,"opponent_assistant":true,"community_publish":true,"cloud_sync":true}'::jsonb,'{"devices":2,"communityPublications":10,"cloudVersions":3}'::jsonb),
 ('elite','Elite','Todos os recursos competitivos.',null,'BRL','manual','{"ocr":true,"player_lab":true,"tactical_studio":true,"opponent_assistant":true,"anti_delay":true,"smart_coach":true,"community_publish":true,"cloud_sync":true}'::jsonb,'{"devices":4,"communityPublications":50,"cloudVersions":8}'::jsonb),
 ('administrator','Administrador','Governança completa.',null,'BRL','manual','{"admin":true,"all":true}'::jsonb,'{"devices":20,"communityPublications":1000,"cloudVersions":20}'::jsonb)
on conflict (id) do update set name=excluded.name,description=excluded.description,features=excluded.features,limits=excluded.limits,updated_at=now();
