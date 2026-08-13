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
  stableVersion: '6.0.0',
  stableSeason: 'eFootball 2027',
  nextOfficialVersion: 'não anunciada',
  nextSeason: 'não anunciada',
  nextReleaseWindow: 'não anunciada',
  previewWeightsEnabled: false,
  officialSourceCheckedAt: '2026-08-13',
  features: [
    {
      id: 'custom-tournament',
      title: 'Torneio Personalizado',
      kind: 'mode',
      status: 'stable',
      introducedIn: '6.0.0',
      affectsBuildEngine: false,
      note: 'Modo ao vivo na v6.0 com torneios criados por usuários e regras configuráveis.'
    },
    {
      id: 'team-playstyle-overload',
      title: 'Sobreposição',
      kind: 'team-playstyle',
      status: 'stable',
      introducedIn: '6.0.0',
      affectsBuildEngine: true,
      note: 'Concentra jogadores no lado da bola para superioridade numérica, passe curto/posse e defesa compacta com pressão rápida.'
    },
    {
      id: 'fluid-formation',
      title: 'Formação fluída',
      kind: 'formation',
      status: 'stable',
      introducedIn: '6.0.0',
      affectsBuildEngine: true,
      note: 'Permite uma formação no ataque e outra na defesa; o BuildMaster avalia a função nas duas fases.'
    },
    {
      id: 'dual-player-playstyle',
      title: 'Estilo ofensivo e defensivo por jogador',
      kind: 'gameplay',
      status: 'stable',
      introducedIn: '6.0.0',
      affectsBuildEngine: true,
      note: 'Alguns jogadores agora podem ter um estilo ofensivo e outro defensivo; estilos defensivos novos só recebem peso após confirmação.'
    },
    {
      id: 'dual-link-up-manager',
      title: 'Técnico com duas Combinações',
      kind: 'manager',
      status: 'stable',
      introducedIn: '6.0.0',
      affectsBuildEngine: true,
      note: 'Técnicos com duas Combinações ampliam as opções táticas; requisitos conhecidos podem ser avaliados sem inventar condições.'
    },
    {
      id: 'defensive-ai-rebalance',
      title: 'Defesa e corte de linhas reequilibrados',
      kind: 'gameplay',
      status: 'stable',
      introducedIn: '6.0.0',
      affectsBuildEngine: true,
      note: 'Correção de posicionamento para cortar linhas passa a depender mais de Dedicação defensiva e Interceptação; reações automáticas foram reduzidas.'
    },
    {
      id: 'reception-control-rework',
      title: 'Domínio e recepção retrabalhados',
      kind: 'gameplay',
      status: 'stable',
      introducedIn: '6.0.0',
      affectsBuildEngine: true,
      note: 'Recepção, orientação do corpo e velocidade ao dominar a bola foram retrabalhadas; o motor prioriza robustez de primeiro toque e passe curto quando necessário.'
    },
    {
      id: 'volley-stunning-shot',
      title: 'Voleio Dinâmico',
      kind: 'gameplay',
      status: 'stable',
      introducedIn: '6.0.0',
      affectsBuildEngine: false,
      note: 'Novo comando para atacar bolas no ar; não altera automaticamente pesos de ficha sem evidência funcional por posição.'
    }
  ] satisfies SeasonFeatureV4070[]
});

export function officialPreviewFeaturesV4070() {
  return (EFOOTBALL_SEASON_V4070.features as readonly SeasonFeatureV4070[]).filter((feature) => feature.status === 'official-preview');
}

export function canApplySeasonWeightsV4070(version: string) {
  return version === EFOOTBALL_SEASON_V4070.stableVersion || EFOOTBALL_SEASON_V4070.previewWeightsEnabled;
}
