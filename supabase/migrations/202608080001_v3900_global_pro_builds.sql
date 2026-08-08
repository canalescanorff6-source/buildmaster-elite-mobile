-- BuildMaster v39.00 — catálogo auditável de fichas completas de pro players.
-- Não contém fichas inventadas. Cada registro precisa apontar para vídeo, print ou transmissão verificável.

create table if not exists public.world_pro_builds (
  id text primary key,
  verified_pro_id text not null references public.world_pro_registry(id) on update cascade on delete restrict,
  gamer_tag text not null,
  country text not null default 'Não informado',
  platform text not null check (platform in ('MOBILE', 'CONSOLE', 'AMBOS')),
  source_url text not null check (source_url ~ '^https://'),
  title text not null,
  channel text not null,
  published_at date,
  verified_at date not null default current_date,
  tested_in_matches boolean not null default false,
  target_position text not null check (target_position in ('CF','SS','LWF','RWF','LMF','RMF','AMF','CMF','DMF','CB','LB','RB','GK')),
  playstyle text not null default '',
  card_fingerprint text not null,
  player_name text not null,
  card_type text not null default '',
  special_tag text not null default '',
  main_position text not null check (main_position in ('CF','SS','LWF','RWF','LMF','RMF','AMF','CMF','DMF','CB','LB','RB','GK')),
  max_overall integer check (max_overall is null or max_overall between 1 and 120),
  training_points_total integer not null check (training_points_total between 1 and 300),
  training jsonb not null,
  skills jsonb not null default '[]'::jsonb,
  impeto text not null default '',
  evidence_level text not null check (evidence_level in ('FICHA_COMPLETA', 'PROGRESSAO', 'PARCIAL')),
  proof_type text not null check (proof_type in ('VIDEO', 'SCREENSHOT', 'STREAM', 'MANUAL')),
  tournament text not null default '',
  notes text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint world_pro_builds_training_object check (jsonb_typeof(training) = 'object'),
  constraint world_pro_builds_skills_array check (jsonb_typeof(skills) = 'array')
);

create index if not exists world_pro_builds_card_lookup_idx
  on public.world_pro_builds (card_fingerprint, player_name, card_type, special_tag, main_position, training_points_total)
  where active = true;

create index if not exists world_pro_builds_pro_verified_idx
  on public.world_pro_builds (verified_pro_id, verified_at desc)
  where active = true;

alter table public.world_pro_builds enable row level security;

drop policy if exists "world_pro_builds_public_read" on public.world_pro_builds;
create policy "world_pro_builds_public_read"
  on public.world_pro_builds
  for select
  to anon, authenticated
  using (active = true);

grant select on public.world_pro_builds to anon, authenticated;
revoke insert, update, delete on public.world_pro_builds from anon, authenticated;

-- Atualiza o índice mundial de 2026 sem pré-cadastrar nenhuma ficha não publicada.
insert into public.world_pro_registry
  (id, gamer_tag, display_name, country, platform, tier, authority_score, achievement, official_source_url, verified_at, aliases, active)
values
  ('rentao', 'RENTAO', null, 'Brasil', 'MOBILE', 'WORLD_CHAMPION', 100, 'Campeão mobile do eFootball Championship World Finals 2026', 'https://www.konami.com/games/eu/en/topics/19220/', '2026-07-27', '["Rentão", "Rentao eFootball"]'::jsonb, true),
  ('futeasy-10', 'FUTEASY_10', null, 'Brasil', 'CONSOLE', 'WORLD_CHAMPION', 100, 'Campeão console do eFootball Championship World Finals 2026', 'https://www.konami.com/games/eu/en/topics/19220/', '2026-07-27', '["Futefácil", "Futeasy eFootball"]'::jsonb, true),
  ('ettorito', 'ETTORITO', null, 'Itália', 'CONSOLE', 'WORLD_FINALIST', 98, 'Vice-campeão console do eFootball Championship World Finals 2026', 'https://www.konami.com/games/eu/en/topics/19220/', '2026-07-27', '["Ettorito97", "Ettorito eFootball"]'::jsonb, true),
  ('yassine-ettadlaoui', 'YASSINE ETTADLAOUI', null, 'Marrocos', 'MOBILE', 'WORLD_FINALIST', 98, 'Vice-campeão mobile do eFootball Championship World Finals 2026', 'https://www.konami.com/games/eu/en/topics/19220/', '2026-07-27', '["Yassine", "Yassine Ettadlaoui eFootball"]'::jsonb, true)
on conflict (id) do update set
  gamer_tag = excluded.gamer_tag,
  display_name = excluded.display_name,
  country = excluded.country,
  platform = excluded.platform,
  tier = excluded.tier,
  authority_score = excluded.authority_score,
  achievement = excluded.achievement,
  official_source_url = excluded.official_source_url,
  verified_at = excluded.verified_at,
  aliases = excluded.aliases,
  active = excluded.active,
  updated_at = now();
