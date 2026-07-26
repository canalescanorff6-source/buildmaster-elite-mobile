-- BuildMaster v30.10 — índice mundial atualizável de jogadores competitivos.
-- O APK pode ler esta tabela com a chave pública. Escritas permanecem restritas ao painel/serviço administrativo.

create table if not exists public.world_pro_registry (
  id text primary key,
  gamer_tag text not null,
  display_name text,
  country text not null default 'Não informado',
  platform text not null check (platform in ('MOBILE', 'CONSOLE', 'AMBOS')),
  tier text not null check (tier in ('WORLD_CHAMPION', 'WORLD_FINALIST', 'CLUB_CHAMPION', 'ELITE_VERIFIED')),
  authority_score integer not null default 0 check (authority_score between 0 and 100),
  achievement text not null,
  official_source_url text not null check (official_source_url ~ '^https://'),
  verified_at date not null default current_date,
  aliases jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.world_pro_registry enable row level security;

drop policy if exists "world_pro_registry_public_read" on public.world_pro_registry;
create policy "world_pro_registry_public_read"
  on public.world_pro_registry
  for select
  to anon, authenticated
  using (active = true);

grant select on public.world_pro_registry to anon, authenticated;
revoke insert, update, delete on public.world_pro_registry from anon, authenticated;

insert into public.world_pro_registry
  (id, gamer_tag, display_name, country, platform, tier, authority_score, achievement, official_source_url, verified_at, aliases, active)
values
  ('rentao', 'RENTAO', null, 'Brasil', 'MOBILE', 'WORLD_CHAMPION', 100, 'Campeão mobile do eFootball Championship World Finals 2026', 'https://efootballchampionship.konami.net/worldfinals/results/knockout-stage/', '2026-07-26', '["Rentão", "Rentao eFootball"]'::jsonb, true),
  ('futeasy-10', 'FUTEASY_10', null, 'Brasil', 'CONSOLE', 'WORLD_CHAMPION', 100, 'Campeão console do eFootball Championship World Finals 2026', 'https://efootballchampionship.konami.net/worldfinals/results/knockout-stage/', '2026-07-26', '["Futefácil", "Futeasy eFootball"]'::jsonb, true),
  ('jxmkt', 'JXMKT', 'Jomkata Yupraphat', 'Tailândia', 'MOBILE', 'WORLD_CHAMPION', 100, 'Campeão mobile da FIFAe World Cup 2025', 'https://www.fifa.gg/efootball/player/JXMKT', '2026-07-26', '["Jomkata", "JXMKT eFootball"]'::jsonb, true),
  ('juninho', 'JUNINHO', null, 'Brasil', 'MOBILE', 'WORLD_CHAMPION', 99, 'Campeão mobile do eFootball Championship World Finals 2025 e finalista da FIFAe World Cup 2025', 'https://www.konami.com/games/eu/en/topics/18762/', '2026-07-26', '["Juninho eFootball", "Juninho mobile"]'::jsonb, true),
  ('bru-jeansui', 'BRU_JEANSUI', null, 'Tailândia', 'CONSOLE', 'WORLD_CHAMPION', 99, 'Campeão console do eFootball Championship World Finals 2025', 'https://www.konami.com/games/eu/en/topics/18762/', '2026-07-26', '["Jeansui", "BRU Jeansui"]'::jsonb, true),
  ('minbappe', 'MINBAPPE', null, 'Malásia', 'MOBILE', 'WORLD_CHAMPION', 98, 'Campeão mobile da FIFAe World Cup 2024', 'https://www.konami.com/games/eu/en/topics/18389/', '2026-07-26', '["Minbappe eFootball"]'::jsonb, true),
  ('zilo', 'ZILO', null, 'Polônia', 'CONSOLE', 'WORLD_CHAMPION', 99, 'Campeão console por equipes da FIFAe World Cup 2025', 'https://www.fifa.gg/efootball/c/fifae-world-cup-25-ft-efootball-console', '2026-07-26', '["Ziloooo", "Zilo eFootball"]'::jsonb, true),
  ('ostrybuch', 'OSTRYBUCH', null, 'Polônia', 'CONSOLE', 'WORLD_CHAMPION', 99, 'Campeão console por equipes da FIFAe World Cup 2025', 'https://www.fifa.gg/efootball/c/fifae-world-cup-25-ft-efootball-console', '2026-07-26', '["Ostrybuch eFootball"]'::jsonb, true),
  ('onic-jvictor', 'ONIC_JVICTOR', null, 'Brasil', 'MOBILE', 'CLUB_CHAMPION', 94, 'Representante competitivo do Manchester United na temporada 2026', 'https://efootballchampionship.konami.net/', '2026-07-26', '["JVictor eFootball", "ONIC JVictor"]'::jsonb, true),
  ('el-mysterio', 'EL_MYSTERIO', null, 'Brasil', 'MOBILE', 'WORLD_CHAMPION', 95, 'Campeão mobile do eFootball Championship 2023', 'https://www.konami.com/games/eu/en/topics/17312/', '2026-07-26', '["El Mysterio eFootball"]'::jsonb, true),
  ('udi', 'UDI', null, 'Japão', 'CONSOLE', 'WORLD_CHAMPION', 95, 'Campeão console do eFootball Championship 2023', 'https://www.konami.com/games/eu/en/topics/17312/', '2026-07-26', '["UDI eFootball"]'::jsonb, true)
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
