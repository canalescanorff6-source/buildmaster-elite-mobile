import type { AnalysisResult, TacticalFormation, TacticalStyle } from './analyzer';
import { buildFormationLineup, FORMATION_BLUEPRINTS, styleAdviceForFormation } from './formationRoleEngine';
import { buildSquadRotationReport, type RealSubstitution } from './squadRotation';
import { OPPONENT_PROFILE_LABELS, type OpponentProfile } from './opponentAnalysis';

export const PROFESSIONAL_SQUAD_VERSION = '28.70.0';

const CORE_STYLES: Exclude<TacticalStyle, 'AUTO' | 'POR_FORA' | 'PASSE_LONGO'>[] = [
  'POSSE_DE_BOLA',
  'CONTRA_ATAQUE',
  'CONTRA_ATAQUE_RAPIDO'
];

const STYLE_LABELS: Record<TacticalStyle, string> = {
  AUTO: 'Automático inteligente',
  POSSE_DE_BOLA: 'Posse de bola',
  CONTRA_ATAQUE: 'Contra-ataque normal',
  CONTRA_ATAQUE_RAPIDO: 'Contra-ataque rápido',
  POR_FORA: 'Posse de bola',
  PASSE_LONGO: 'Contra-ataque normal'
};

type LineKey = 'ataque' | 'meio' | 'defesa' | 'goleiro';

export type ProfessionalFormationRank = {
  formation: TacticalFormation;
  style: TacticalStyle;
  score: number;
  lineupScore: number;
  chemistry: number;
  styleFit: number;
  filledSlots: number;
  naturalFits: number;
  improvisedFits: number;
  strongestLine: string;
  weakestLine: string;
  repeatedFunctions: string[];
  reason: string;
};

export type ProfessionalSector = {
  id: LineKey;
  label: string;
  score: number;
  starters: string[];
  reserves: string[];
  coverage: 'forte' | 'adequada' | 'curta' | 'crítica';
  warning: string;
  recommendation: string;
};

export type ProfessionalBenchUnit = {
  id: 'goleiro' | 'defesa' | 'meio' | 'criacao' | 'ataque';
  label: string;
  score: number;
  status: 'completa' | 'funcional' | 'curta' | 'vazia';
  players: string[];
  reason: string;
};

export type ProfessionalScenario = {
  id: 'controlar' | 'buscar' | 'proteger';
  label: string;
  objective: string;
  substitutions: RealSubstitution[];
  firstChange: string;
  warning: string;
};

export type ProfessionalPlan = {
  id: 'A' | 'B' | 'C';
  title: string;
  formation: TacticalFormation;
  style: TacticalStyle;
  score: number;
  objective: string;
  lineup: Array<{ id: string | null; slot: string; player: string | null; score: number }>;
  changes: string[];
  risks: string[];
};

export type ProfessionalOpponentPlan = {
  id: OpponentProfile;
  label: string;
  score: number;
  formation: TacticalFormation;
  style: TacticalStyle;
  headline: string;
  adjustments: string[];
  risks: string[];
};

export type ProfessionalSquadReport = {
  version: string;
  playerCount: number;
  current: ProfessionalFormationRank;
  bestFormation: ProfessionalFormationRank;
  formationRanking: ProfessionalFormationRank[];
  sectors: ProfessionalSector[];
  repeatedFunctions: Array<{ role: string; count: number; severity: 'atenção' | 'alto'; recommendation: string }>;
  benchUnits: ProfessionalBenchUnit[];
  scenarios: ProfessionalScenario[];
  plans: ProfessionalPlan[];
  opponentPlans: ProfessionalOpponentPlan[];
  safeguards: string[];
};

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));
const avg = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;

function prepareRosterResults(results: AnalysisResult[]) {
  const occurrences = new Map<string, number>();
  return results.map((result, index) => {
    const baseId = (result.parsed.internalId || `${result.parsed.playerName}-${result.bestPosition.code || 'SEM_POSICAO'}`).trim() || `jogador-${index + 1}`;
    const occurrence = occurrences.get(baseId) ?? 0;
    occurrences.set(baseId, occurrence + 1);
    if (occurrence === 0) return result;
    return {
      ...result,
      parsed: {
        ...result.parsed,
        internalId: `${baseId}--elenco-${occurrence + 1}`
      }
    };
  });
}

function roleLabel(result: AnalysisResult) {
  return result.teamMap?.functionLabel || result.advancedTacticalFunction?.officialPlaystyle || result.buildName || result.parsed.playstyle || 'Função não confirmada';
}

function lineLabel(line: LineKey) {
  return line === 'ataque' ? 'Ataque' : line === 'meio' ? 'Meio-campo' : line === 'defesa' ? 'Defesa' : 'Goleiro';
}

function analyzeFormation(results: AnalysisResult[], formation: TacticalFormation, style: TacticalStyle): ProfessionalFormationRank {
  const blueprint = FORMATION_BLUEPRINTS.find((item) => item.id === (formation === 'AUTO' ? '4-2-2-2' : formation)) ?? FORMATION_BLUEPRINTS[0];
  const lineup = buildFormationLineup(results, blueprint);
  const styleFit = styleAdviceForFormation(blueprint, style).fit;
  const filled = lineup.filter((item) => item.player);
  const naturalFits = filled.filter((item) => item.positionFit >= 82).length;
  const improvisedFits = filled.filter((item) => item.positionFit < 70).length;
  const roleCounts = new Map<string, number>();
  filled.forEach((item) => {
    const role = roleLabel(item.player!);
    roleCounts.set(role, (roleCounts.get(role) ?? 0) + 1);
  });
  const repeatedFunctions = [...roleCounts.entries()].filter(([, count]) => count >= 3).map(([role, count]) => `${role} (${count})`);
  const lineScores = (['ataque', 'meio', 'defesa', 'goleiro'] as LineKey[]).map((line) => ({
    line,
    score: clamp(avg(lineup.filter((item) => item.slot.line === line).map((item) => item.score)))
  })).sort((a, b) => b.score - a.score);
  const lineupScore = clamp(avg(lineup.map((item) => item.score)));
  const completeness = Math.round((filled.length / Math.max(1, blueprint.slots.length)) * 100);
  const lineValues = lineScores.map((item) => item.score);
  const lineSpread = Math.max(...lineValues) - Math.min(...lineValues);
  const chemistry = clamp(avg(lineValues) * .64 + (naturalFits / Math.max(1, filled.length)) * 24 + styleFit * .12 - lineSpread * .18 - repeatedFunctions.length * 3);
  const score = clamp(lineupScore * .39 + chemistry * .30 + styleFit * .16 + completeness * .15 - improvisedFits * 2.4 - repeatedFunctions.length * 2);
  return {
    formation: blueprint.id as TacticalFormation,
    style,
    score,
    lineupScore,
    chemistry,
    styleFit,
    filledSlots: filled.length,
    naturalFits,
    improvisedFits,
    strongestLine: lineLabel(lineScores[0]?.line ?? 'meio'),
    weakestLine: lineLabel(lineScores.at(-1)?.line ?? 'meio'),
    repeatedFunctions,
    reason: `${blueprint.name}: ${filled.length}/11 preenchidos, ${naturalFits} encaixes naturais, entrosamento ${chemistry}/100 e estilo ${styleFit}/100.`
  };
}

function buildSectorReport(results: AnalysisResult[], rank: ProfessionalFormationRank): ProfessionalSector[] {
  const blueprint = FORMATION_BLUEPRINTS.find((item) => item.id === rank.formation) ?? FORMATION_BLUEPRINTS[0];
  const lineup = buildFormationLineup(results, blueprint);
  const starterIds = new Set(lineup.filter((item) => item.player).map((item) => item.player!.parsed.internalId));
  const reserves = results.filter((result) => !starterIds.has(result.parsed.internalId));
  const linePositions: Record<LineKey, string[]> = {
    goleiro: ['GK'], defesa: ['CB', 'LB', 'RB'], meio: ['DMF', 'CMF', 'AMF', 'LMF', 'RMF'], ataque: ['CF', 'SS', 'LWF', 'RWF']
  };
  const recommendations: Record<LineKey, string> = {
    goleiro: 'Mantenha um goleiro reserva para não deixar a escalação sem substituição segura.',
    defesa: 'Tenha pelo menos um zagueiro e um lateral defensivo no banco para proteger vantagem.',
    meio: 'Combine proteção, passe e infiltração; não repita apenas funções de criação.',
    ataque: 'Leve ao banco um finalizador e uma opção de velocidade ou apoio.'
  };
  return (['goleiro', 'defesa', 'meio', 'ataque'] as LineKey[]).map((line) => {
    const starters = lineup.filter((item) => item.slot.line === line && item.player).map((item) => item.player!.parsed.playerName);
    const reserveNames = reserves.filter((result) => linePositions[line].includes(result.bestPosition.code)).map((result) => result.parsed.playerName);
    const lineItems = lineup.filter((item) => item.slot.line === line);
    const score = clamp(avg(lineItems.map((item) => item.score)) * .76 + Math.min(100, reserveNames.length * 34) * .24);
    const coverage: ProfessionalSector['coverage'] = starters.length < lineItems.length ? 'crítica' : reserveNames.length >= 2 ? 'forte' : reserveNames.length === 1 ? 'adequada' : 'curta';
    const warning = starters.length < lineItems.length
      ? `${lineItems.length - starters.length} vaga(s) ainda sem titular seguro.`
      : reserveNames.length === 0
        ? 'Titulares definidos, mas sem reserva natural para este setor.'
        : `${reserveNames.length} alternativa(s) natural(is) disponível(is).`;
    return { id: line, label: lineLabel(line), score, starters, reserves: reserveNames, coverage, warning, recommendation: recommendations[line] };
  });
}

function buildRepeatedFunctions(results: AnalysisResult[], rank: ProfessionalFormationRank) {
  const blueprint = FORMATION_BLUEPRINTS.find((item) => item.id === rank.formation) ?? FORMATION_BLUEPRINTS[0];
  const lineup = buildFormationLineup(results, blueprint).filter((item) => item.player);
  const counts = new Map<string, number>();
  lineup.forEach((item) => {
    const role = roleLabel(item.player!);
    counts.set(role, (counts.get(role) ?? 0) + 1);
  });
  return [...counts.entries()].filter(([, count]) => count >= 2).map(([role, count]) => ({
    role,
    count,
    severity: count >= 3 ? 'alto' as const : 'atenção' as const,
    recommendation: count >= 3
      ? `Troque ao menos um ${role} por uma função complementar para evitar movimentos iguais.`
      : `A dupla de ${role} pode funcionar, mas confirme se ocupa espaços diferentes.`
  }));
}

function buildBenchUnits(results: AnalysisResult[], rank: ProfessionalFormationRank): ProfessionalBenchUnit[] {
  const rotation = buildSquadRotationReport(results, rank.formation, rank.style, 'EMPATANDO', 'MEDIA');
  const bench = rotation?.bench.map((item) => item.player) ?? [];
  const definitions: Array<{ id: ProfessionalBenchUnit['id']; label: string; filter: (player: typeof bench[number]) => boolean; reason: string }> = [
    { id: 'goleiro', label: 'Goleiro reserva', filter: (player) => player.position === 'GK', reason: 'Cobertura obrigatória da posição mais específica.' },
    { id: 'defesa', label: 'Proteção defensiva', filter: (player) => ['CB', 'LB', 'RB', 'DMF'].includes(player.position) || player.defense >= 76, reason: 'Reforça marcação, cobertura e proteção de resultado.' },
    { id: 'meio', label: 'Controle do meio', filter: (player) => ['DMF', 'CMF', 'LMF', 'RMF'].includes(player.position), reason: 'Renova energia e mantém equilíbrio entre os setores.' },
    { id: 'criacao', label: 'Criação', filter: (player) => ['AMF', 'SS', 'CMF'].includes(player.position) || player.creation >= 76, reason: 'Ajuda contra pressão ou bloco baixo.' },
    { id: 'ataque', label: 'Impacto ofensivo', filter: (player) => ['CF', 'SS', 'LWF', 'RWF'].includes(player.position) || player.finishing >= 76, reason: 'Oferece finalização, velocidade ou mudança de comportamento.' }
  ];
  return definitions.map((definition) => {
    const players = bench.filter(definition.filter).sort((a, b) => b.score - a.score);
    const score = clamp(avg(players.slice(0, 3).map((player) => player.score)) + Math.min(18, players.length * 6));
    const status: ProfessionalBenchUnit['status'] = players.length >= 2 ? 'completa' : players.length === 1 ? 'funcional' : bench.length ? 'curta' : 'vazia';
    return { id: definition.id, label: definition.label, score, status, players: players.slice(0, 4).map((player) => player.name), reason: definition.reason };
  });
}

function scenario(results: AnalysisResult[], formation: TacticalFormation, style: TacticalStyle, id: ProfessionalScenario['id']): ProfessionalScenario {
  const config = id === 'buscar'
    ? { state: 'PERDENDO_1' as const, energy: 'MEDIA' as const, label: 'Buscar gol', objective: 'Aumentar criação e presença ofensiva sem retirar toda a proteção.', warning: 'Não use as três trocas ofensivas se o meio já estiver aberto.' }
    : id === 'proteger'
      ? { state: 'VENCENDO_1' as const, energy: 'MEDIA' as const, label: 'Proteger vantagem', objective: 'Renovar marcação e energia, mantendo uma saída para o contra-ataque.', warning: 'Recuar todos os jogadores entrega território e aumenta a pressão.' }
      : { state: 'EMPATANDO' as const, energy: 'MEDIA' as const, label: 'Controlar partida', objective: 'Trocar por queda de participação e preservar funções complementares.', warning: 'Não troque apenas pelo overall; observe função, energia e contexto.' };
  const report = buildSquadRotationReport(results, formation, style, config.state, config.energy);
  const substitutions = report?.substitutions.slice(0, 3) ?? [];
  return {
    id,
    label: config.label,
    objective: config.objective,
    substitutions,
    firstChange: substitutions[0] ? `${substitutions[0].outPlayer} → ${substitutions[0].inPlayer} (${substitutions[0].minute})` : 'Banco ainda sem troca nominal segura.',
    warning: config.warning
  };
}

function lineupFor(results: AnalysisResult[], formation: TacticalFormation) {
  const blueprint = FORMATION_BLUEPRINTS.find((item) => item.id === formation) ?? FORMATION_BLUEPRINTS[0];
  return buildFormationLineup(results, blueprint).map((item) => ({ id: item.player?.parsed.internalId ?? null, slot: item.slot.label, player: item.player?.parsed.playerName ?? null, score: item.score }));
}

function buildPlans(results: AnalysisResult[], current: ProfessionalFormationRank, ranking: ProfessionalFormationRank[]): ProfessionalPlan[] {
  const best = ranking[0] ?? current;
  const safest = [...ranking].sort((a, b) => {
    const defensiveA = /5-|4-2-3-1|4-1-4-1/.test(String(a.formation)) ? 8 : 0;
    const defensiveB = /5-|4-2-3-1|4-1-4-1/.test(String(b.formation)) ? 8 : 0;
    return (b.score + defensiveB - b.improvisedFits * 2) - (a.score + defensiveA - a.improvisedFits * 2);
  })[0] ?? current;
  const definitions = [
    { id: 'A' as const, title: 'Plano A • Base principal', rank: current, objective: 'Começar com a formação escolhida e confirmar o comportamento do adversário.' },
    { id: 'B' as const, title: 'Plano B • Melhor encaixe automático', rank: best, objective: 'Usar a combinação com maior nota entre escalação, entrosamento e estilo.' },
    { id: 'C' as const, title: 'Plano C • Proteção e controle', rank: safest, objective: 'Reduzir improvisos e proteger o setor mais vulnerável.' }
  ];
  return definitions.map((definition) => ({
    id: definition.id,
    title: definition.title,
    formation: definition.rank.formation,
    style: definition.rank.style,
    score: definition.rank.score,
    objective: definition.objective,
    lineup: lineupFor(results, definition.rank.formation),
    changes: definition.id === 'A'
      ? ['Mantém sua escolha atual e organiza os melhores encaixes disponíveis.']
      : [`Usa ${definition.rank.formation} com ${STYLE_LABELS[definition.rank.style]}.`, `${definition.rank.naturalFits} encaixes naturais e ${definition.rank.improvisedFits} improvisado(s).`, `Setor prioritário: ${definition.rank.weakestLine}.`],
    risks: definition.rank.repeatedFunctions.length ? [`Funções repetidas: ${definition.rank.repeatedFunctions.join(', ')}.`] : ['Nenhuma repetição crítica de função foi detectada.']
  }));
}

function buildOpponentPlans(candidates: ProfessionalFormationRank[]): ProfessionalOpponentPlan[] {
  const profiles: Array<{
    id: OpponentProfile;
    preferredStyles: TacticalStyle[];
    preferredFormations: TacticalFormation[];
    headline: string;
    adjustments: string[];
    risks: string[];
  }> = [
    {
      id: 'POSSE',
      preferredStyles: ['CONTRA_ATAQUE_RAPIDO', 'CONTRA_ATAQUE'],
      preferredFormations: ['4-2-3-1', '4-2-2-2', '4-1-4-1'],
      headline: 'Feche o centro e acelere nas costas dos jogadores que participam da posse.',
      adjustments: ['Preservar dois jogadores de cobertura no eixo.', 'Pressionar apenas em domínio ruim ou passe recuado.', 'Manter uma saída rápida após recuperar.'],
      risks: ['Ser atraído para fora da posição.', 'Perder a bola no passe central.', 'Deixar os dois laterais avançarem juntos.']
    },
    {
      id: 'CONTRA_RAPIDO',
      preferredStyles: ['CONTRA_ATAQUE', 'POSSE_DE_BOLA'],
      preferredFormations: ['4-2-2-2', '4-2-3-1', '5-3-2'],
      headline: 'Proteja profundidade, reduza perdas perigosas e mantenha os setores compactos.',
      adjustments: ['Usar um volante de proteção.', 'Evitar passes forçados na saída.', 'Deixar um zagueiro cobrindo quando o outro antecipar.'],
      risks: ['Linha defensiva exposta.', 'Dois zagueiros saindo ao mesmo tempo.', 'Meio sem cobertura após perda.']
    },
    {
      id: 'BLOCO_BAIXO',
      preferredStyles: ['POSSE_DE_BOLA'],
      preferredFormations: ['4-2-3-1', '4-1-2-3', '4-3-3'],
      headline: 'Mova o bloco, crie superioridade entre linhas e finalize só depois de abrir espaço.',
      adjustments: ['Circular e inverter o lado antes do passe final.', 'Usar um criador entre linhas.', 'Manter contra-pressão com volante e zagueiros.'],
      risks: ['Finalização precipitada.', 'CA isolado.', 'Contra-ataque após perda na entrada da área.']
    },
    {
      id: 'POR_FORA',
      preferredStyles: ['CONTRA_ATAQUE_RAPIDO', 'CONTRA_ATAQUE'],
      preferredFormations: ['4-1-4-1', '5-3-2', '4-2-3-1'],
      headline: 'Dobre a marcação nos corredores e ataque o espaço deixado pelos laterais.',
      adjustments: ['Aproximar meia ou ponta do lateral.', 'Proteger o segundo poste.', 'Atacar as costas do lateral assim que recuperar.'],
      risks: ['Dois contra um no lado.', 'Cruzamento limpo.', 'Inversão rápida para o corredor oposto.']
    }
  ];
  return profiles.map((profile) => {
    const preferred = candidates
      .filter((candidate) => profile.preferredStyles.includes(candidate.style))
      .sort((a, b) => {
        const boostA = profile.preferredFormations.includes(a.formation) ? 8 : 0;
        const boostB = profile.preferredFormations.includes(b.formation) ? 8 : 0;
        return (b.score + boostB) - (a.score + boostA);
      })[0] ?? candidates[0];
    return {
      id: profile.id,
      label: OPPONENT_PROFILE_LABELS[profile.id],
      score: preferred?.score ?? 0,
      formation: preferred?.formation ?? '4-2-2-2',
      style: preferred?.style ?? 'CONTRA_ATAQUE',
      headline: profile.headline,
      adjustments: profile.adjustments,
      risks: profile.risks
    };
  });
}

export function buildProfessionalSquadReport(resultsInput: AnalysisResult[], formation: TacticalFormation, style: TacticalStyle): ProfessionalSquadReport | null {
  const results = prepareRosterResults(resultsInput);
  if (!results.length) return null;
  const normalizedFormation = formation === 'AUTO' ? '4-2-2-2' : formation;
  const normalizedStyle: TacticalStyle = style === 'AUTO' ? 'POSSE_DE_BOLA' : style === 'POR_FORA' ? 'POSSE_DE_BOLA' : style === 'PASSE_LONGO' ? 'CONTRA_ATAQUE' : style;
  const current = analyzeFormation(results, normalizedFormation, normalizedStyle);
  const candidates = FORMATION_BLUEPRINTS.flatMap((blueprint) => CORE_STYLES.map((candidateStyle) => analyzeFormation(results, blueprint.id as TacticalFormation, candidateStyle)))
    .sort((a, b) => b.score - a.score);
  const ranking = candidates.filter((item, index, array) => array.findIndex((other) => other.formation === item.formation) === index);
  const bestFormation = ranking[0] ?? current;
  return {
    version: PROFESSIONAL_SQUAD_VERSION,
    playerCount: results.length,
    current,
    bestFormation,
    formationRanking: ranking.slice(0, 6),
    sectors: buildSectorReport(results, current),
    repeatedFunctions: buildRepeatedFunctions(results, current),
    benchUnits: buildBenchUnits(results, current),
    scenarios: [scenario(results, current.formation, current.style, 'controlar'), scenario(results, current.formation, current.style, 'buscar'), scenario(results, current.formation, current.style, 'proteger')],
    plans: buildPlans(results, current, ranking),
    opponentPlans: buildOpponentPlans(candidates),
    safeguards: [
      'A posição escolhida de cada jogador é preservada; o motor apenas procura o melhor espaço compatível.',
      'Nenhuma formação, titular, reserva, substituição ou plano é aplicado sem ação do usuário.',
      'As sugestões usam função tática, encaixe, setores e banco; overall alto sozinho não decide a escalação.',
      'Planos antigos e dados do Cofre continuam preservados nas chaves existentes.'
    ]
  };
}
