import type { TacticalStyle } from '@/lib/analyzer';
import type { MatchValidationRecord } from '@/lib/appStartupContractsR200';
import { cardIdentityFingerprintR126 } from '@/lib/cardIdentityFingerprintR126';
import type { IntegratedPlayerRecord, TeamDiagnosis } from '@/modules/core/centralIntelligence';

export const TACTICAL_TWIN_R480_VERSION = '40.80-r480-tactical-twin-v1';

export type TacticalTwinScenarioIdR480 = 'base' | 'pressao' | 'proteger' | 'buscar';

export type TacticalTwinScenarioR480 = {
  id: TacticalTwinScenarioIdR480;
  label: string;
  readiness: number;
  control: number;
  progression: number;
  defensiveSecurity: number;
  transitionRisk: number;
  confidence: number;
  summary: string;
  actions: string[];
};

export type TacticalTwinSnapshotR480 = {
  version: string;
  mode: 'READ_ONLY_TACTICAL_SIMULATION';
  formation: string;
  teamStyle: TacticalStyle;
  confidence: number;
  evidence: {
    starters: number;
    playersWithMatchEvidence: number;
    starterEvidenceCoverage: number;
    matchRecords: number;
    contextualMatchRecords: number;
    contextualAverageRating: number | null;
  };
  structure: {
    globalScore: number;
    attackScore: number;
    midfieldScore: number;
    defenseScore: number;
    goalkeeperScore: number;
    styleFit: number;
    filledSlots: number;
    totalSlots: number;
  };
  strengths: string[];
  risks: string[];
  scenarios: TacticalTwinScenarioR480[];
  authority: {
    readOnly: true;
    canWriteTraining: false;
    canWriteSkills: false;
    canWriteImpetus: false;
    canOverrideR128: false;
  };
  guardrails: string[];
};

type TacticalTwinInputR480 = {
  team: TeamDiagnosis;
  players: IntegratedPlayerRecord[];
  records: MatchValidationRecord[];
  teamStyle: TacticalStyle;
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function average(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function lineScore(team: TeamDiagnosis, line: 'ataque' | 'meio' | 'defesa' | 'goleiro') {
  const scores = team.lineup.filter((item) => item.slot.line === line).map((item) => item.score);
  return clamp(average(scores));
}

function styleControlBonus(style: TacticalStyle) {
  if (style === 'POSSE_DE_BOLA') return 9;
  if (style === 'CONTRA_ATAQUE_RAPIDO') return 3;
  if (style === 'CONTRA_ATAQUE') return 4;
  if (style === 'POR_FORA') return 4;
  if (style === 'PASSE_LONGO') return 2;
  return 5;
}

function styleProgressionBonus(style: TacticalStyle) {
  if (style === 'CONTRA_ATAQUE_RAPIDO') return 10;
  if (style === 'CONTRA_ATAQUE') return 8;
  if (style === 'POSSE_DE_BOLA') return 6;
  if (style === 'POR_FORA') return 7;
  if (style === 'PASSE_LONGO') return 7;
  return 5;
}

function benchProfileCount(team: TeamDiagnosis, pattern: RegExp) {
  return team.benchSuggestions.filter((item) => pattern.test(`${item.role} ${item.reason} ${item.behaviourChange}`)).length;
}

function scenario(
  id: TacticalTwinScenarioIdR480,
  label: string,
  values: Omit<TacticalTwinScenarioR480, 'id' | 'label'>
): TacticalTwinScenarioR480 {
  return {
    id,
    label,
    ...values,
    readiness: clamp(values.readiness),
    control: clamp(values.control),
    progression: clamp(values.progression),
    defensiveSecurity: clamp(values.defensiveSecurity),
    transitionRisk: clamp(values.transitionRisk),
    confidence: clamp(values.confidence)
  };
}

export function buildTacticalTwinR480({ team, players, records, teamStyle }: TacticalTwinInputR480): TacticalTwinSnapshotR480 {
  const starterFingerprints = new Set(
    team.lineup
      .flatMap((item) => item.player ? [cardIdentityFingerprintR126(item.player.parsed)] : [])
      .filter(Boolean)
  );
  const starterRecords = records.filter((record) => starterFingerprints.has(record.cardFingerprint));
  const contextualRecords = starterRecords.filter((record) =>
    record.formation === team.formation && (teamStyle === 'AUTO' || record.teamStyle === teamStyle)
  );
  const playersWithEvidence = new Set(starterRecords.map((record) => record.cardFingerprint)).size;
  const starterCount = starterFingerprints.size;
  const starterEvidenceCoverage = starterCount ? clamp((playersWithEvidence / starterCount) * 100) : 0;
  const contextualAverageRating = contextualRecords.length
    ? Number((average(contextualRecords.map((record) => Number(record.overallRating || 0)))).toFixed(1))
    : null;

  const confirmedPlayers = players.filter((player) => player.status === 'completo' && player.confidence >= 75).length;
  const rosterConfidence = players.length ? (confirmedPlayers / players.length) * 100 : 0;
  const contextEvidenceScore = contextualRecords.length
    ? clamp(Math.min(100, 45 + contextualRecords.length * 7 + starterEvidenceCoverage * .25))
    : clamp(starterEvidenceCoverage * .45);

  const confidence = clamp(
    (team.filledSlots / Math.max(1, team.totalSlots)) * 30 +
    rosterConfidence * .2 +
    starterEvidenceCoverage * .25 +
    contextEvidenceScore * .25
  );

  const attackScore = lineScore(team, 'ataque');
  const midfieldScore = lineScore(team, 'meio');
  const defenseScore = lineScore(team, 'defesa');
  const goalkeeperScore = lineScore(team, 'goleiro');
  const missingPenalty = Math.min(18, team.missingRoles.length * 4);
  const repeatedPenalty = Math.min(12, team.repeatedFunctions.length * 4);
  const matchAdjustment = contextualAverageRating == null ? 0 : (contextualAverageRating - 3) * 4;
  const controlBase = clamp(midfieldScore * .46 + team.styleFit * .36 + team.globalScore * .18 + styleControlBonus(teamStyle) + matchAdjustment);
  const progressionBase = clamp(attackScore * .46 + midfieldScore * .22 + team.styleFit * .18 + team.globalScore * .14 + styleProgressionBonus(teamStyle));
  const defenseBase = clamp(defenseScore * .55 + goalkeeperScore * .2 + team.globalScore * .25 - missingPenalty);
  const transitionRiskBase = clamp(100 - (defenseBase * .54 + midfieldScore * .26 + team.styleFit * .2) + repeatedPenalty + missingPenalty);

  const defensiveBench = benchProfileCount(team, /vol|defens|zague|lateral|cobertura|marcação/i);
  const creativeBench = benchProfileCount(team, /meia|armador|orquestr|passe|cria|infiltra/i);
  const attackingBench = benchProfileCount(team, /ca|atac|final|artil|pivô|pivo|veloc/i);

  const scenarioConfidence = clamp(confidence - (contextualRecords.length ? 0 : 12));
  const scenarios: TacticalTwinScenarioR480[] = [
    scenario('base', 'Plano base', {
      readiness: team.globalScore - missingPenalty / 2,
      control: controlBase,
      progression: progressionBase,
      defensiveSecurity: defenseBase,
      transitionRisk: transitionRiskBase,
      confidence: scenarioConfidence,
      summary: `A ${team.formation} mantém o desenho atual com foco no encaixe coletivo já calculado.`,
      actions: [
        `Preservar o setor mais forte: ${team.strongestLine}.`,
        `Proteger primeiro o setor mais vulnerável: ${team.weakestLine}.`,
        team.pairingNotes[0] ?? 'Manter funções complementares entre as linhas.'
      ]
    }),
    scenario('pressao', 'Sob pressão', {
      readiness: team.globalScore - 5 - missingPenalty,
      control: controlBase - 9 - repeatedPenalty,
      progression: progressionBase - 5,
      defensiveSecurity: defenseBase - 4,
      transitionRisk: transitionRiskBase + 10 + repeatedPenalty,
      confidence: scenarioConfidence,
      summary: 'Simula perda de tempo/espaço para decidir; não prevê placar e não altera a escalação.',
      actions: [
        'Reduzir risco no primeiro passe e oferecer apoio curto atrás da bola.',
        `Evitar expor ${team.weakestLine} durante a saída.`,
        'Se a pressão quebrar a estrutura, reciclar a posse antes de procurar progressão vertical.'
      ]
    }),
    scenario('proteger', 'Protegendo vantagem', {
      readiness: team.globalScore + Math.min(5, defensiveBench * 2) - missingPenalty,
      control: controlBase + 3,
      progression: progressionBase - 9,
      defensiveSecurity: defenseBase + Math.min(12, 4 + defensiveBench * 3),
      transitionRisk: transitionRiskBase - Math.min(14, 5 + defensiveBench * 3),
      confidence: scenarioConfidence,
      summary: 'Prioriza segurança estrutural e retenção sem transformar o time em bloco passivo.',
      actions: [
        defensiveBench ? `Há ${defensiveBench} opção(ões) de banco com perfil de cobertura.` : 'O banco tem pouca cobertura defensiva explícita; preserve um titular de proteção.',
        'Manter ao menos uma saída segura para não devolver a bola imediatamente.',
        'Trocar por função e comportamento, não por Overall.'
      ]
    }),
    scenario('buscar', 'Buscando o resultado', {
      readiness: team.globalScore + Math.min(6, attackingBench + creativeBench) - missingPenalty,
      control: controlBase - 4 + Math.min(6, creativeBench * 2),
      progression: progressionBase + Math.min(14, 5 + attackingBench * 3 + creativeBench),
      defensiveSecurity: defenseBase - 9,
      transitionRisk: transitionRiskBase + 12,
      confidence: scenarioConfidence,
      summary: 'Aumenta presença e progressão ofensiva mantendo um limite explícito para o risco de transição.',
      actions: [
        attackingBench ? `Há ${attackingBench} opção(ões) de impacto ofensivo no banco.` : 'O banco tem pouco impacto ofensivo explícito para mudar o comportamento.',
        creativeBench ? `Há ${creativeBench} opção(ões) criativas para aumentar conexão entre meio e ataque.` : 'Preserve o principal criador ao aumentar presença ofensiva.',
        'Não retirar simultaneamente todas as funções de cobertura.'
      ]
    })
  ];

  const strengths = [
    team.styleFit >= 80 ? `Estilo coletivo com ${team.styleFit}% de encaixe.` : null,
    team.globalScore >= 75 ? `Estrutura base competitiva: ${team.globalScore}/100.` : null,
    starterEvidenceCoverage >= 50 ? `Evidência real cobre ${starterEvidenceCoverage}% dos titulares identificados.` : null,
    contextualRecords.length >= 3 ? `${contextualRecords.length} registro(s) no mesmo contexto de formação/estilo.` : null,
    team.pairingNotes[0] ?? null
  ].filter((item): item is string => Boolean(item));

  const risks = [
    ...team.missingRoles.slice(0, 3),
    ...team.repeatedFunctions.slice(0, 2).map((item) => `Função repetida: ${item}.`),
    contextualRecords.length === 0 ? 'Sem amostra de partida no mesmo contexto de formação/estilo; confiança do Twin foi reduzida.' : null,
    starterEvidenceCoverage < 40 ? 'Poucos titulares possuem evidência de partida ligada à carta atual.' : null
  ].filter((item): item is string => Boolean(item));

  return {
    version: TACTICAL_TWIN_R480_VERSION,
    mode: 'READ_ONLY_TACTICAL_SIMULATION',
    formation: team.formation,
    teamStyle,
    confidence,
    evidence: {
      starters: starterCount,
      playersWithMatchEvidence: playersWithEvidence,
      starterEvidenceCoverage,
      matchRecords: starterRecords.length,
      contextualMatchRecords: contextualRecords.length,
      contextualAverageRating
    },
    structure: {
      globalScore: team.globalScore,
      attackScore,
      midfieldScore,
      defenseScore,
      goalkeeperScore,
      styleFit: team.styleFit,
      filledSlots: team.filledSlots,
      totalSlots: team.totalSlots
    },
    strengths,
    risks,
    scenarios,
    authority: {
      readOnly: true,
      canWriteTraining: false,
      canWriteSkills: false,
      canWriteImpetus: false,
      canOverrideR128: false
    },
    guardrails: [
      'O Tactical Twin R480 é observacional e não escreve ficha, Top 5 ou Ímpeto.',
      'Os cenários são simulações heurísticas do comportamento estrutural; não são previsão de vitória, placar ou matchmaking.',
      'Sem evidência contextual suficiente, a confiança cai em vez de inventar certeza.',
      'A autoridade final R119 → R126 → R128 permanece fora deste módulo.'
    ]
  };
}
