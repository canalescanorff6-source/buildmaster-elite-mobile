import type { AnalysisResult } from './analyzerDomain';

declare const process: { env: Record<string, string | undefined> };

export type WorldProPlatform = 'MOBILE' | 'CONSOLE' | 'AMBOS';
export type WorldProTier = 'WORLD_CHAMPION' | 'WORLD_FINALIST' | 'CLUB_CHAMPION' | 'ELITE_VERIFIED';

export type WorldProProfile = {
  id: string;
  gamerTag: string;
  displayName?: string;
  country: string;
  platform: WorldProPlatform;
  tier: WorldProTier;
  authorityScore: number;
  achievement: string;
  officialSourceUrl: string;
  verifiedAt: string;
  aliases: string[];
};

/**
 * A lista abaixo identifica jogadores competitivos confirmados por fontes oficiais.
 * Ela não afirma que uma progressão específica pertence a eles: a ficha só entra no
 * motor depois que o usuário confirma vídeo/print e a identidade exata da carta.
 */
export const WORLD_PRO_REGISTRY: readonly WorldProProfile[] = [
  {
    id: 'rentao', gamerTag: 'RENTAO', country: 'Brasil', platform: 'MOBILE',
    tier: 'WORLD_CHAMPION', authorityScore: 100, achievement: 'Campeão mobile do eFootball Championship World Finals 2026',
    officialSourceUrl: 'https://www.konami.com/games/eu/en/topics/19220/', verifiedAt: '2026-07-27', aliases: ['Rentão', 'Rentao eFootball']
  },
  {
    id: 'futeasy-10', gamerTag: 'FUTEASY_10', country: 'Brasil', platform: 'CONSOLE',
    tier: 'WORLD_CHAMPION', authorityScore: 100, achievement: 'Campeão console do eFootball Championship World Finals 2026',
    officialSourceUrl: 'https://www.konami.com/games/eu/en/topics/19220/', verifiedAt: '2026-07-27', aliases: ['Futefácil', 'Futeasy eFootball']
  },
  {
    id: 'ettorito', gamerTag: 'ETTORITO', country: 'Itália', platform: 'CONSOLE',
    tier: 'WORLD_FINALIST', authorityScore: 98, achievement: 'Vice-campeão console do eFootball Championship World Finals 2026',
    officialSourceUrl: 'https://www.konami.com/games/eu/en/topics/19220/', verifiedAt: '2026-07-27', aliases: ['Ettorito97', 'Ettorito eFootball']
  },
  {
    id: 'yassine-ettadlaoui', gamerTag: 'YASSINE ETTADLAOUI', country: 'Marrocos', platform: 'MOBILE',
    tier: 'WORLD_FINALIST', authorityScore: 98, achievement: 'Vice-campeão mobile do eFootball Championship World Finals 2026',
    officialSourceUrl: 'https://www.konami.com/games/eu/en/topics/19220/', verifiedAt: '2026-07-27', aliases: ['Yassine', 'Yassine Ettadlaoui eFootball']
  },
  {
    id: 'jxmkt', gamerTag: 'JXMKT', displayName: 'Jomkata Yupraphat', country: 'Tailândia', platform: 'MOBILE',
    tier: 'WORLD_CHAMPION', authorityScore: 100, achievement: 'Campeão mobile da FIFAe World Cup 2025',
    officialSourceUrl: 'https://www.fifa.gg/efootball/player/JXMKT', verifiedAt: '2026-07-26', aliases: ['Jomkata', 'JXMKT eFootball']
  },
  {
    id: 'juninho', gamerTag: 'JUNINHO', country: 'Brasil', platform: 'MOBILE',
    tier: 'WORLD_CHAMPION', authorityScore: 99, achievement: 'Campeão mobile do eFootball Championship World Finals 2025 e finalista da FIFAe World Cup 2025',
    officialSourceUrl: 'https://www.konami.com/games/eu/en/topics/18762/', verifiedAt: '2026-07-26', aliases: ['Juninho eFootball', 'Juninho mobile']
  },
  {
    id: 'bru-jeansui', gamerTag: 'BRU_JEANSUI', country: 'Tailândia', platform: 'CONSOLE',
    tier: 'WORLD_CHAMPION', authorityScore: 99, achievement: 'Campeão console do eFootball Championship World Finals 2025',
    officialSourceUrl: 'https://www.konami.com/games/eu/en/topics/18762/', verifiedAt: '2026-07-26', aliases: ['Jeansui', 'BRU Jeansui']
  },
  {
    id: 'minbappe', gamerTag: 'MINBAPPE', country: 'Malásia', platform: 'MOBILE',
    tier: 'WORLD_CHAMPION', authorityScore: 98, achievement: 'Campeão mobile da FIFAe World Cup 2024',
    officialSourceUrl: 'https://www.konami.com/games/eu/en/topics/18389/', verifiedAt: '2026-07-26', aliases: ['Minbappe eFootball']
  },
  {
    id: 'zilo', gamerTag: 'ZILO', country: 'Polônia', platform: 'CONSOLE',
    tier: 'WORLD_CHAMPION', authorityScore: 99, achievement: 'Campeão console por equipes da FIFAe World Cup 2025',
    officialSourceUrl: 'https://www.fifa.gg/efootball/c/fifae-world-cup-25-ft-efootball-console', verifiedAt: '2026-07-26', aliases: ['Ziloooo', 'Zilo eFootball']
  },
  {
    id: 'ostrybuch', gamerTag: 'OSTRYBUCH', country: 'Polônia', platform: 'CONSOLE',
    tier: 'WORLD_CHAMPION', authorityScore: 99, achievement: 'Campeão console por equipes da FIFAe World Cup 2025',
    officialSourceUrl: 'https://www.fifa.gg/efootball/c/fifae-world-cup-25-ft-efootball-console', verifiedAt: '2026-07-26', aliases: ['Ostrybuch eFootball']
  },
  {
    id: 'onic-jvictor', gamerTag: 'ONIC_JVICTOR', country: 'Brasil', platform: 'MOBILE',
    tier: 'CLUB_CHAMPION', authorityScore: 94, achievement: 'Representante competitivo do Manchester United na temporada 2026',
    officialSourceUrl: 'https://efootballchampionship.konami.net/', verifiedAt: '2026-07-26', aliases: ['JVictor eFootball', 'ONIC JVictor']
  },
  {
    id: 'el-mysterio', gamerTag: 'EL_MYSTERIO', country: 'Brasil', platform: 'MOBILE',
    tier: 'WORLD_CHAMPION', authorityScore: 95, achievement: 'Campeão mobile do eFootball Championship 2023',
    officialSourceUrl: 'https://www.konami.com/games/eu/en/topics/17312/', verifiedAt: '2026-07-26', aliases: ['El Mysterio eFootball']
  },
  {
    id: 'udi', gamerTag: 'UDI', country: 'Japão', platform: 'CONSOLE',
    tier: 'WORLD_CHAMPION', authorityScore: 95, achievement: 'Campeão console do eFootball Championship 2023',
    officialSourceUrl: 'https://www.konami.com/games/eu/en/topics/17312/', verifiedAt: '2026-07-26', aliases: ['UDI eFootball']
  }
] as const;

const TIER_LABELS: Record<WorldProTier, string> = {
  WORLD_CHAMPION: 'Campeão mundial',
  WORLD_FINALIST: 'Finalista mundial',
  CLUB_CHAMPION: 'Campeão de clube',
  ELITE_VERIFIED: 'Elite verificada'
};

export function worldProTierLabel(tier: WorldProTier): string {
  return TIER_LABELS[tier];
}

function filterWorldPros(profiles: readonly WorldProProfile[], platform: WorldProPlatform | 'TODOS'): WorldProProfile[] {
  return profiles
    .filter((profile) => platform === 'TODOS' || profile.platform === platform || profile.platform === 'AMBOS')
    .sort((a, b) => b.authorityScore - a.authorityScore || a.gamerTag.localeCompare(b.gamerTag));
}

export function listWorldPros(platform: WorldProPlatform | 'TODOS' = 'TODOS'): WorldProProfile[] {
  return filterWorldPros(WORLD_PRO_REGISTRY, platform);
}

function sanitizeRemoteProfile(input: Record<string, unknown>): WorldProProfile | null {
  const platform = String(input.platform || '').toUpperCase() as WorldProPlatform;
  const tier = String(input.tier || '').toUpperCase() as WorldProTier;
  if (!['MOBILE', 'CONSOLE', 'AMBOS'].includes(platform) || !Object.hasOwn(TIER_LABELS, tier)) return null;
  const id = String(input.id || '').trim().slice(0, 80);
  const gamerTag = String(input.gamer_tag || input.gamerTag || '').trim().slice(0, 80);
  const officialSourceUrl = String(input.official_source_url || input.officialSourceUrl || '').trim().slice(0, 500);
  if (!id || !gamerTag || !/^https:\/\//i.test(officialSourceUrl)) return null;
  const aliasesRaw = input.aliases;
  return {
    id,
    gamerTag,
    displayName: String(input.display_name || input.displayName || '').trim().slice(0, 120) || undefined,
    country: String(input.country || 'Não informado').trim().slice(0, 80),
    platform,
    tier,
    authorityScore: Math.max(0, Math.min(100, Math.round(Number(input.authority_score ?? input.authorityScore) || 0))),
    achievement: String(input.achievement || '').trim().slice(0, 240),
    officialSourceUrl,
    verifiedAt: String(input.verified_at || input.verifiedAt || '').slice(0, 10) || '2026-07-26',
    aliases: Array.isArray(aliasesRaw) ? aliasesRaw.map((value) => String(value).trim().slice(0, 80)).filter(Boolean).slice(0, 12) : []
  };
}

/** Carrega o índice online, com fallback local seguro para o app continuar funcionando offline. */
export async function loadWorldProRegistry(platform: WorldProPlatform | 'TODOS' = 'TODOS'): Promise<{ profiles: WorldProProfile[]; source: 'ONLINE' | 'LOCAL' }> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return { profiles: listWorldPros(platform), source: 'LOCAL' };
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/world_pro_registry?select=*&active=eq.true&order=authority_score.desc,gamer_tag.asc`, {
      headers: { apikey: SUPABASE_ANON_KEY, Accept: 'application/json' },
      cache: 'no-store'
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const body = await response.json() as Array<Record<string, unknown>>;
    const profiles = body.map(sanitizeRemoteProfile).filter((profile): profile is WorldProProfile => Boolean(profile));
    if (!profiles.length) throw new Error('EMPTY_REGISTRY');
    return { profiles: filterWorldPros(profiles, platform), source: 'ONLINE' };
  } catch {
    return { profiles: listWorldPros(platform), source: 'LOCAL' };
  }
}

export function exactCardSearchQuery(result: AnalysisResult, profile?: WorldProProfile): string {
  const card = result.parsed;
  return [
    profile?.gamerTag,
    'eFootball 2026',
    card.playerName,
    card.cardType,
    card.specialTag,
    card.maxOverall ? `overall ${card.maxOverall}` : '',
    'progression skills booster full build',
  ].filter(Boolean).join(' ');
}

export function exactCardSearchUrl(result: AnalysisResult, profile?: WorldProProfile): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(exactCardSearchQuery(result, profile))}`;
}

export function registryFreshnessLabel(profiles: readonly WorldProProfile[] = WORLD_PRO_REGISTRY): string {
  const newest = profiles.reduce((latest, profile) => profile.verifiedAt > latest ? profile.verifiedAt : latest, '');
  return newest ? `Verificado em ${newest.split('-').reverse().join('/')}` : 'Verificação pendente';
}

export type WorldProVideoCandidate = {
  id: string;
  title: string;
  channel: string;
  url: string;
  publishedAt: string;
  thumbnail: string;
  gamerTag: string;
};

export type WorldProSearchResult = {
  mode: 'API' | 'FALLBACK';
  query: string;
  videos: WorldProVideoCandidate[];
  fallbackUrl: string;
  message: string;
};

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function searchWorldProVideos(result: AnalysisResult, profile?: WorldProProfile): Promise<WorldProSearchResult> {
  const query = exactCardSearchQuery(result, profile);
  const fallbackUrl = exactCardSearchUrl(result, profile);
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return { mode: 'FALLBACK', query, videos: [], fallbackUrl, message: 'Busca oficial não configurada; abrindo pesquisa exata no YouTube.' };
  }
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/pro-build-search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY
      },
      body: JSON.stringify({ query, gamerTag: profile?.gamerTag || '', limit: 8 })
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const body = await response.json() as { videos?: WorldProVideoCandidate[]; message?: string };
    const videos = Array.isArray(body.videos) ? body.videos.slice(0, 8) : [];
    return { mode: 'API', query, videos, fallbackUrl, message: body.message || (videos.length ? `${videos.length} vídeo(s) encontrado(s).` : 'Nenhum vídeo exato encontrado.') };
  } catch {
    return { mode: 'FALLBACK', query, videos: [], fallbackUrl, message: 'A busca protegida ficou indisponível; use a pesquisa exata do YouTube.' };
  }
}
