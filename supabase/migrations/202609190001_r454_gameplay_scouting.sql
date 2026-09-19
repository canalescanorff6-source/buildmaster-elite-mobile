-- BuildMaster Elite R454 — Gameplay Scouting contextual por edição da carta.
-- Forward-only, sem alterar tabelas existentes. O app continua funcional offline/local quando estas tabelas ainda não foram aplicadas.

create extension if not exists pgcrypto;

create table if not exists public.gameplay_scouting_r454 (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  card_id text not null,
  player_name text not null,
  player_version text not null,
  card_type text not null,
  game_version text not null,
  status text not null default 'SCOUTING_PENDENTE' check (status in ('READY','SCOUTING_PENDENTE','SOURCE_CONFLICT')),
  confidence text not null default 'BAIXA' check (confidence in ('ALTA','MEDIA','BAIXA')),
  payload jsonb not null default '{}'::jsonb,
  last_reviewed timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, card_id, game_version)
);

create index if not exists gameplay_scouting_r454_card_idx on public.gameplay_scouting_r454 (user_id, card_id);
create index if not exists gameplay_scouting_r454_version_idx on public.gameplay_scouting_r454 (user_id, game_version);

create table if not exists public.gameplay_scouting_sources_r454 (
  id uuid primary key default gen_random_uuid(),
  scouting_id uuid not null references public.gameplay_scouting_r454(id) on delete cascade,
  user_id uuid not null default auth.uid(),
  source_type text not null check (source_type in ('OFFICIAL','DATABASE','REVIEWER','COMMUNITY','USER_GAMEPLAY')),
  label text not null,
  url text,
  game_version text not null,
  confidence text not null check (confidence in ('ALTA','MEDIA','BAIXA')),
  observed_at timestamptz not null default now(),
  note text,
  created_at timestamptz not null default now()
);

create index if not exists gameplay_scouting_sources_r454_parent_idx on public.gameplay_scouting_sources_r454 (user_id, scouting_id);

create table if not exists public.gameplay_user_feedback_r454 (
  id uuid primary key default gen_random_uuid(),
  scouting_id uuid not null references public.gameplay_scouting_r454(id) on delete cascade,
  user_id uuid not null default auth.uid(),
  game_version text not null,
  note text not null,
  tags text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.gameplay_source_conflicts_r454 (
  id uuid primary key default gen_random_uuid(),
  scouting_id uuid not null references public.gameplay_scouting_r454(id) on delete cascade,
  user_id uuid not null default auth.uid(),
  field_name text not null,
  source_a text not null,
  source_b text not null,
  value_a text not null,
  value_b text not null,
  adopted_decision text,
  reason text,
  confidence text not null check (confidence in ('ALTA','MEDIA','BAIXA')),
  created_at timestamptz not null default now()
);

alter table public.gameplay_scouting_r454 enable row level security;
alter table public.gameplay_scouting_sources_r454 enable row level security;
alter table public.gameplay_user_feedback_r454 enable row level security;
alter table public.gameplay_source_conflicts_r454 enable row level security;

drop policy if exists gameplay_scouting_r454_owner on public.gameplay_scouting_r454;
create policy gameplay_scouting_r454_owner on public.gameplay_scouting_r454
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists gameplay_scouting_sources_r454_owner on public.gameplay_scouting_sources_r454;
create policy gameplay_scouting_sources_r454_owner on public.gameplay_scouting_sources_r454
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists gameplay_user_feedback_r454_owner on public.gameplay_user_feedback_r454;
create policy gameplay_user_feedback_r454_owner on public.gameplay_user_feedback_r454
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists gameplay_source_conflicts_r454_owner on public.gameplay_source_conflicts_r454;
create policy gameplay_source_conflicts_r454_owner on public.gameplay_source_conflicts_r454
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

comment on table public.gameplay_scouting_r454 is 'R454: scouting versionado por Card ID; nunca substitui dados oficiais nem a autoridade da ficha.';
