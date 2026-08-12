export const EFOOTBALL_SEASON_CATALOG_V4070_VERSION = '40.70.0' as const;

export type SeasonFeatureStatusV4070 = 'stable' | 'official-preview';
export type SeasonFeatureKindV4070 = 'team-playstyle' | 'formation' | 'manager' | 'gameplay' | 'mode' | 'data';

export type SeasonFeatureV4070 = {
  id: string;
  title: string;
  kind: SeasonFeatureKindV4070;
  status: SeasonFeatureStatusV4070;
  introducedIn: string;
  affectsBuildEngine: boolean;
  note: string;
};

export const EFOOTBALL_SEASON_V4070 = Object.freeze({
  stableVersion: '5.5.1',
  stableSeason: 'eFootball 2026',
  nextOfficialVersion: '6.0.0',
  nextSeason: 'Atualização da Temporada v6.0.0',
  nextReleaseWindow: 'meados de agosto de 2026',
  previewWeightsEnabled: false,
  officialSourceCheckedAt: '2026-08-12',
  features: [
    {
      id: 'custom-tournament',
      title: 'Torneio Personalizado',
      kind: 'mode',
      status: 'official-preview',
      introducedIn: '6.0.0',
      affectsBuildEngine: false,
      note: 'Usuários poderão criar ou participar de torneios com regulamentos configuráveis.'
    },
    {
      id: 'team-playstyle-overload',
      title: 'Sobreposição',
      kind: 'team-playstyle',
      status: 'official-preview',
      introducedIn: '6.0.0',
      affectsBuildEngine: false,
      note: 'Concentra jogadores no lado da bola para superioridade numérica, passes curtos/posse e defesa compacta com pressão rápida.'
    },
    {
      id: 'fluid-formation',
      title: 'Formação fluída',
      kind: 'formation',
      status: 'official-preview',
      introducedIn: '6.0.0',
      affectsBuildEngine: false,
      note: 'Permite uma formação no ataque e outra na defesa; o BuildMaster deve avaliar a posição funcional nas duas fases.'
    },
    {
      id: 'dual-link-up-manager',
      title: 'Técnico com duas Combinações',
      kind: 'manager',
      status: 'official-preview',
      introducedIn: '6.0.0',
      affectsBuildEngine: false,
      note: 'A v6.0 terá técnicos com duas Combinações; pesos permanecem desligados até os requisitos oficiais estarem disponíveis.'
    },
    {
      id: 'volley-stunning-shot',
      title: 'Voleio com Chute Fenomenal',
      kind: 'gameplay',
      status: 'official-preview',
      introducedIn: '6.0.0',
      affectsBuildEngine: false,
      note: 'O comando Chute Fenomenal poderá gerar voleios quando a bola estiver no ar; o motor não altera pesos de finalização antes da validação da v6.'
    },
    {
      id: 'daily-game-redesign',
      title: 'Novo Jogo diário',
      kind: 'mode',
      status: 'official-preview',
      introducedIn: '6.0.0',
      affectsBuildEngine: false,
      note: 'O Jogo diário será reformulado.'
    },
    {
      id: 'match-history-reset',
      title: 'Histórico de Partidas não mantido',
      kind: 'data',
      status: 'official-preview',
      introducedIn: '6.0.0',
      affectsBuildEngine: false,
      note: 'O histórico do próprio BuildMaster permanece local e independente do histórico que o eFootball não manterá.'
    }
  ] satisfies SeasonFeatureV4070[]
});

export function officialPreviewFeaturesV4070() {
  return EFOOTBALL_SEASON_V4070.features.filter((feature) => feature.status === 'official-preview');
}

export function canApplySeasonWeightsV4070(version: string) {
  return version === EFOOTBALL_SEASON_V4070.stableVersion || EFOOTBALL_SEASON_V4070.previewWeightsEnabled;
}
