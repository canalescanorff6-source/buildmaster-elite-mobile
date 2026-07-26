import type { AnalysisResult } from './analyzerDomain';

export type VerifiedProSource = {
  id: string;
  name: string;
  country: string;
  device: 'MOBILE' | 'CONSOLE' | 'AMBOS';
  authority: 'WORLD_CHAMPION' | 'OFFICIAL_FINALIST' | 'OFFICIAL_COMPETITOR' | 'OFFICIAL_CHANNEL';
  achievement: string;
  channelUrl: string;
  proofUrl: string;
  searchTokens: string[];
  priority: number;
};

/**
 * Registro conservador de fontes públicas verificáveis.
 * Ele não inventa fichas: apenas prioriza campeões/competidores oficiais e
 * canais públicos para a pesquisa da carta exata.
 */
export const VERIFIED_PRO_SOURCES: readonly VerifiedProSource[] = [
  {
    id: 'juninho-mobile-world-2025',
    name: 'Juninho eFootball',
    country: 'Brasil',
    device: 'MOBILE',
    authority: 'WORLD_CHAMPION',
    achievement: 'Campeão mobile do eFootball Championship 2025 World Finals e finalista da FIFAe World Cup 2025',
    channelUrl: 'https://www.youtube.com/results?search_query=Juninho+eFootball+canal',
    proofUrl: 'https://www.konami.com/games/eu/en/topics/18762/',
    searchTokens: ['Juninho eFootball', 'mobile', 'world champion', 'progression', 'build'],
    priority: 100
  },
  {
    id: 'jxmkt-fifae-mobile-2025',
    name: 'JXMKT',
    country: 'Tailândia',
    device: 'MOBILE',
    authority: 'WORLD_CHAMPION',
    achievement: 'Campeão mobile da FIFAe World Cup 2025 featuring eFootball',
    channelUrl: 'https://www.youtube.com/@Jxmkt',
    proofUrl: 'https://www.fifa.gg/news/thailand-and-poland-crowned-worlds-best-at-the-fifae-world-cup-ft-efootball',
    searchTokens: ['JXMKT', 'mobile', 'FIFAe world champion', 'progression', 'build'],
    priority: 99
  },
  {
    id: 'bru-jeansui-console-world-2025',
    name: 'BRU_JEANSUI',
    country: 'Tailândia',
    device: 'CONSOLE',
    authority: 'WORLD_CHAMPION',
    achievement: 'Campeão console do eFootball Championship 2025 World Finals',
    channelUrl: 'https://www.youtube.com/results?search_query=BRU_JEANSUI+eFootball',
    proofUrl: 'https://www.konami.com/games/eu/en/topics/18762/',
    searchTokens: ['BRU JEANSUI', 'console', 'world champion', 'progression', 'build'],
    priority: 96
  },
  {
    id: 'zilo-fifae-console-2025',
    name: 'Zilo',
    country: 'Polônia',
    device: 'CONSOLE',
    authority: 'WORLD_CHAMPION',
    achievement: 'Campeão console da FIFAe World Cup 2025 featuring eFootball',
    channelUrl: 'https://www.youtube.com/results?search_query=Zilo+eFootball+world+champion',
    proofUrl: 'https://www.fifa.gg/news/thailand-and-poland-crowned-worlds-best-at-the-fifae-world-cup-ft-efootball',
    searchTokens: ['Zilo', 'console', 'FIFAe world champion', 'progression', 'build'],
    priority: 95
  },
  {
    id: 'efootball-official',
    name: 'eFootball oficial',
    country: 'Global',
    device: 'AMBOS',
    authority: 'OFFICIAL_CHANNEL',
    achievement: 'Transmissões e partidas oficiais dos principais campeonatos',
    channelUrl: 'https://www.youtube.com/@eFootball',
    proofUrl: 'https://www.konami.com/efootball/en/',
    searchTokens: ['eFootball official', 'championship', 'world finals'],
    priority: 90
  }
] as const;

function normalized(value: unknown): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim();
}

export function proSourceSearchUrl(source: VerifiedProSource, result: AnalysisResult): string {
  const query = [
    ...source.searchTokens,
    'eFootball 2026',
    normalized(result.parsed.playerName),
    normalized(result.parsed.cardType),
    normalized(result.parsed.specialTag),
    result.parsed.maxOverall ? `overall ${result.parsed.maxOverall}` : '',
    'best progression'
  ].filter(Boolean).join(' ');
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

export function preferredProSources(result: AnalysisResult): VerifiedProSource[] {
  const targetIsGoalkeeper = result.bestPosition.code === 'GK';
  return [...VERIFIED_PRO_SOURCES]
    .sort((a, b) => {
      const mobileA = a.device === 'MOBILE' || a.device === 'AMBOS' ? 1 : 0;
      const mobileB = b.device === 'MOBILE' || b.device === 'AMBOS' ? 1 : 0;
      const goalkeeperBoostA = targetIsGoalkeeper && a.authority === 'OFFICIAL_CHANNEL' ? 3 : 0;
      const goalkeeperBoostB = targetIsGoalkeeper && b.authority === 'OFFICIAL_CHANNEL' ? 3 : 0;
      return (b.priority + mobileB * 4 + goalkeeperBoostB) - (a.priority + mobileA * 4 + goalkeeperBoostA);
    });
}
