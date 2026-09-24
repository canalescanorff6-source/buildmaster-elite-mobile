-- BuildMaster Elite R470 — memória leve + aprendizado local/estatístico.
-- Forward-only. Não armazena blobs, imagens ou vídeos no Postgres.

create extension if not exists pgcrypto;

create table if not exists public.card_reading_sessions_r470 (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  session_key text not null,
  status text not null check (status in ('CAPTURED','OCR_RUNNING','OCR_COMPLETE','NORMALIZED','CARD_MATCHED','ENGINE_RUNNING','BUILD_COMPLETE','SYNCED','ERROR')),
  source_file_name text not null default '',
  source_mime text not null default '',
  source_bytes bigint not null default 0 check (source_bytes >= 0),
  image_hash text,
  image_retention text not null default 'KEEP_TEMPORARY' check (image_retention in ('HASH_ONLY','KEEP_TEMPORARY','KEEP_COMPRESSED')),
  ocr_confidence numeric,
  quality_score numeric,
  raw_text_excerpt text not null default '',
  card_id text,
  evidence_id text,
  build_fingerprint text,
  error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, session_key)
);

create table if not exists public.card_build_history_r470 (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  build_fingerprint text not null,
  card_id text not null,
  usage_id text not null,
  player_name text not null,
  usage_position text not null,
  usage_function text not null,
  engine_version text not null,
  training jsonb not null default '{}'::jsonb,
  skills text[] not null default '{}',
  impetos jsonb not null default '[]'::jsonb,
  points_used integer not null default 0,
  points_total integer not null default 0,
  source_session_key text,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  unique (user_id, build_fingerprint)
);

create table if not exists public.learning_models_r470 (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  scope text not null check (scope in ('GLOBAL','FUNCTION','CARD')),
  scope_key text not null,
  card_id text,
  usage_position text not null,
  usage_function text not null,
  model_version text not null,
  samples integer not null default 0,
  effective_samples numeric not null default 0,
  distinct_sessions integer not null default 0,
  stable_share numeric not null default 0,
  current_patch_share numeric not null default 0,
  confidence numeric not null default 0,
  performance_score numeric,
  drift_detected boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (user_id, scope, scope_key)
);

create index if not exists card_reading_sessions_r470_card_idx on public.card_reading_sessions_r470 (user_id, card_id);
create index if not exists card_build_history_r470_card_idx on public.card_build_history_r470 (user_id, card_id, usage_position);
create index if not exists learning_models_r470_card_idx on public.learning_models_r470 (user_id, card_id, usage_position);

alter table public.card_reading_sessions_r470 enable row level security;
alter table public.card_build_history_r470 enable row level security;
alter table public.learning_models_r470 enable row level security;

drop policy if exists card_reading_sessions_r470_owner on public.card_reading_sessions_r470;
create policy card_reading_sessions_r470_owner on public.card_reading_sessions_r470
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists card_build_history_r470_owner on public.card_build_history_r470;
create policy card_build_history_r470_owner on public.card_build_history_r470
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists learning_models_r470_owner on public.learning_models_r470;
create policy learning_models_r470_owner on public.learning_models_r470
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

revoke all on public.card_reading_sessions_r470 from anon;
revoke all on public.card_build_history_r470 from anon;
revoke all on public.learning_models_r470 from anon;

grant select, insert, update, delete on public.card_reading_sessions_r470 to authenticated;
grant select, insert, update, delete on public.card_build_history_r470 to authenticated;
grant select, insert, update, delete on public.learning_models_r470 to authenticated;

comment on table public.card_reading_sessions_r470 is 'R470: sessões leves de leitura. Guarda metadados/hash/evidência, nunca o arquivo binário da imagem ou vídeo.';
comment on table public.card_build_history_r470 is 'R470: histórico versionado de fichas por identidade da carta e contexto de uso.';
comment on table public.learning_models_r470 is 'R470: aprendizado estatístico GLOBAL/FUNCTION/CARD. Read-only em relação ao Clean Slate.';
