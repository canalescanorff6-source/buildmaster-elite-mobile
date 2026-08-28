import type { AnalysisResult, TrainingKey } from './analyzerDomain';
import { cardFingerprint, type MatchValidationMode, type MatchConnectionState, type MatchPerformanceMetrics, type MatchValidationRecord } from './appEvolution';
import { TRAINING_LABELS } from './trainingEngine';
import { readAccountStorage, writeAccountStorage } from './accountStorage';
import { trainingPlanTotalCost } from './trainingPlanCore';

export const REAL_GAMEPLAY_VALIDATION_V4050_VERSION = '40.50.0' as const;
export const REAL_GAMEPLAY_VALIDATION_V4050_MIN_MATCHES_PER_ARM = 5;
export const REAL_GAMEPLAY_VALIDATION_V4050_PRIOR_WEIGHT = 3.5;

type ValidationAction = 'COLETAR' | 'MANTER' | 'TESTAR_ALTERNATIVA' | 'PROMOVER_ALTERNATIVA';
type ValidationConfidence = 'INICIAL' | 'MODERADA' | 'ALTA';

type MatchScore = {
  score: number;
  weight: number;
  objectiveEvidence: number;
  connectionWeight: number;
  minutesWeight: number;
  modeWeight: number;
};

export type GameplayValidationArmV4050 = {
  id: string;
  label: string;
  rank: number;
  rawMatches: number;
  effectiveMatches: number;
  priorScore: number;
  observedScore: number | null;
  posteriorScore: number;
  lowerBound: number;
  upperBound: number;
  stableScore: number | null;
  delayedScore: number | null;
  rankedScore: number | null;
  eventsScore: number | null;
  friendsScore: number | null;
  objectiveEvidenceRate: number;
  training?: AnalysisResult['training'];
};

export type GameplayValidationContextV4050 = {
  mode: MatchValidationMode;
  label: string;
  samples: number;
  effectiveSamples: number;
  score: number | null;
};

export type RealGameplayValidationV4050Analysis = {
  engineVersion: typeof REAL_GAMEPLAY_VALIDATION_V4050_VERSION;
  cardFingerprint: string;
  mode: 'VALIDACAO_REAL_GAMEPLAY';
  totalMatches: number;
  effectiveMatches: number;
  stableMatches: number;
  delayedMatches: number;
  contextsCovered: number;
  objectiveEvidenceRate: number;
  confidence: { score: number; level: ValidationConfidence; reasons: string[] };
  arms: GameplayValidationArmV4050[];
  leaderId: string | null;
  leaderLabel: string;
  action: ValidationAction;
  verifiedWinnerId: string | null;
  verifiedWinnerLabel: string | null;
  margin: number;
  learningSignals: Array<{ group: TrainingKey; label: string; direction: 'reforcar' | 'preservar'; score: number; evidence: string }>;
  verdict: string;
  nextAction: string;
  safeguards: string[];
  guarantees: {
    singleMatchNeverChangesBuild: true;
    highDelayDownWeighted: true;
    minimumComparableSampleRequired: true;
    exactCardFingerprintRequired: true;
    noAutomaticPointSpending: true;
  };
};

const MODE_LABELS: Record<MatchValidationMode, string> = {
  ranked: 'Ranqueada',
  events: 'Eventos',
  friendly: 'Contra amigos',
  offline: 'Offline'
};

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));
const round = (value: number, digits = 1) => Number(value.toFixed(digits));
const average = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;

function metric(record: MatchValidationRecord, key: keyof MatchPerformanceMetrics) {
  return Number(record.metrics?.[key] ?? 0);
}

function objectiveMetricCount(record: MatchValidationRecord) {
  const metrics = record.metrics ?? {};
  return Object.values(metrics).filter((value) => Number(value) > 0).length;
}

function connectionWeight(connection: MatchConnectionState | undefined, delayRating: number | undefined) {
  if (connection === 'high_delay' || Number(delayRating ?? 0) >= 5) return .42;
  if (connection === 'variable' || Number(delayRating ?? 0) >= 3) return .72;
  return 1;
}

function modeWeight(mode: MatchValidationMode | undefined) {
  if (mode === 'offline') return .58;
  if (mode === 'friendly') return .88;
  return 1;
}

function minutesWeight(minutes: number) {
  return clamp(Math.max(.28, Math.min(1, Math.max(1, Number(minutes || 0)) / 75)), .28, 1);
}

function positionSubjectiveScore(result: AnalysisResult, record: MatchValidationRecord) {
  const position = result.bestPosition.code;
  const scores = {
    passing: Number(record.passing || 0) * 20,
    movement: Number(record.movement || 0) * 20,
    finishing: Number(record.finishing || 0) * 20,
    defending: Number(record.defending || 0) * 20,
    physical: Number(record.physical || 0) * 20,
    stamina: Number(record.stamina || 0) * 20,
    overall: Number(record.overallRating || 0) * 20
  };
  if (position === 'GK') return scores.defending * .3 + scores.passing * .15 + scores.movement * .12 + scores.physical * .16 + scores.stamina * .12 + scores.overall * .15;
  if (['CB', 'LB', 'RB'].includes(position)) return scores.defending * .29 + scores.physical * .18 + scores.movement * .14 + scores.passing * .12 + scores.stamina * .12 + scores.overall * .15;
  if (position === 'DMF') return scores.defending * .23 + scores.passing * .2 + scores.movement * .15 + scores.physical * .13 + scores.stamina * .14 + scores.overall * .15;
  if (['CMF', 'LMF', 'RMF'].includes(position)) return scores.passing * .23 + scores.movement * .2 + scores.defending * .11 + scores.physical * .1 + scores.stamina * .12 + scores.finishing * .09 + scores.overall * .15;
  if (['AMF', 'SS'].includes(position)) return scores.passing * .2 + scores.movement * .22 + scores.finishing * .18 + scores.physical * .08 + scores.stamina * .08 + scores.defending * .06 + scores.overall * .18;
  return scores.finishing * .28 + scores.movement * .23 + scores.physical * .11 + scores.passing * .08 + scores.stamina * .08 + scores.defending * .04 + scores.overall * .18;
}

function objectiveScore(result: AnalysisResult, record: MatchValidationRecord) {
  const per90 = (value: number) => value * 90 / Math.max(1, Number(record.minutes || 1));
  const position = result.bestPosition.code;
  const errors = per90(metric(record, 'passErrors')) * 1.15 + per90(metric(record, 'ballLosses')) * .62;
  if (position === 'GK') {
    return clamp(55 + per90(metric(record, 'saves')) * 4.2 + per90(metric(record, 'progressivePasses')) * .8 + per90(metric(record, 'aerialDuelsWon')) * 1.5 - per90(metric(record, 'goalsConceded')) * 6 - errors * .45);
  }
  if (['CB', 'LB', 'RB', 'DMF'].includes(position)) {
    return clamp(54 + per90(metric(record, 'interceptions')) * 3.1 + per90(metric(record, 'tackles')) * 2.6 + per90(metric(record, 'blocks')) * 2.1 + per90(metric(record, 'clearances')) * 1.15 + per90(metric(record, 'recoveries')) * .75 - errors * .62);
  }
  if (['CMF', 'LMF', 'RMF', 'AMF'].includes(position)) {
    return clamp(53 + per90(metric(record, 'assists')) * 9 + per90(metric(record, 'keyPasses')) * 3.2 + per90(metric(record, 'progressivePasses')) * .58 + per90(metric(record, 'recoveries')) * .5 + per90(metric(record, 'dribblesCompleted')) * .9 - errors * .7);
  }
  return clamp(52 + per90(metric(record, 'goals')) * 13 + per90(metric(record, 'assists')) * 7 + per90(metric(record, 'shotsOnTarget')) * 2.4 + per90(metric(record, 'runsBehind')) * 1.35 + per90(metric(record, 'dribblesCompleted')) * 1.15 - errors * .78);
}

function scoreRecord(result: AnalysisResult, record: MatchValidationRecord): MatchScore {
  const evidenceCount = objectiveMetricCount(record);
  const objectiveEvidence = clamp(evidenceCount / 6, 0, 1);
  const subjective = positionSubjectiveScore(result, record);
  const objective = objectiveScore(result, record);
  const score = clamp(subjective * (objectiveEvidence >= .5 ? .55 : .76) + objective * (objectiveEvidence >= .5 ? .45 : .24) - (record.secondHalfDrop ? 2.5 : 0));
  const cw = connectionWeight(record.connection, record.inputDelayRating);
  const mw = minutesWeight(record.minutes);
  const mdw = modeWeight(record.mode);
  const evidenceWeight = .72 + objectiveEvidence * .28;
  return { score, weight: cw * mw * mdw * evidenceWeight, objectiveEvidence, connectionWeight: cw, minutesWeight: mw, modeWeight: mdw };
}

function weightedStats(items: Array<{ value: number; weight: number }>) {
  const weight = items.reduce((sum, item) => sum + item.weight, 0);
  if (!items.length || weight <= 0) return { mean: null as number | null, variance: 0, effectiveN: 0, stderr: 0 };
  const mean = items.reduce((sum, item) => sum + item.value * item.weight, 0) / weight;
  const variance = items.reduce((sum, item) => sum + item.weight * Math.pow(item.value - mean, 2), 0) / weight;
  const squaredWeight = items.reduce((sum, item) => sum + item.weight * item.weight, 0);
  const kishN = squaredWeight > 0 ? weight * weight / squaredWeight : 0;
  // Como cada peso é <= 1, a exposição ponderada também reduz a amostra quando
  // a maior parte dos jogos tem delay, poucos minutos ou pouca evidência objetiva.
  const effectiveN = Math.min(kishN, weight);
  const stderr = effectiveN > 1 ? Math.sqrt(variance / effectiveN) : Math.sqrt(Math.max(25, variance));
  return { mean, variance, effectiveN, stderr };
}

function priorForMode(result: AnalysisResult, mode: MatchValidationMode) {
  const cleanSlate = (result as AnalysisResult & {
    cleanSlate2027R119?: {
      onlinePerformance?: { rankedScore?: number; friendsScore?: number; matchConsistency?: number };
    };
  }).cleanSlate2027R119;
  if (cleanSlate?.onlinePerformance) {
    if (mode === 'ranked') return Number(cleanSlate.onlinePerformance.rankedScore ?? 70);
    if (mode === 'friendly') return Number(cleanSlate.onlinePerformance.friendsScore ?? 70);
    if (mode === 'events') return Number(cleanSlate.onlinePerformance.matchConsistency ?? cleanSlate.onlinePerformance.rankedScore ?? 70);
    return Number(cleanSlate.onlinePerformance.matchConsistency ?? 70);
  }
  const precision = result.maximumPerformanceV4040;
  if (!precision) return 70;
  if (mode === 'ranked') return precision.contextScores.ranked;
  if (mode === 'events') return precision.contextScores.events;
  if (mode === 'friendly') return precision.contextScores.friends;
  return precision.contextScores.average;
}

function primaryAlternatives(result: AnalysisResult) {
  const cleanSlate = (result as AnalysisResult & {
    cleanSlate2027R119?: {
      competitiveLab?: {
        arms?: Array<{ id:string; label:string; rank:1|2; score:number; training:AnalysisResult['training'] }>;
      };
    };
  }).cleanSlate2027R119;
  if (cleanSlate?.competitiveLab?.arms?.length) {
    return cleanSlate.competitiveLab.arms.slice(0, 2).map((item) => ({
      id: item.id,
      label: item.label,
      rank: item.rank,
      prior: item.score,
      training: item.training
    }));
  }
  const precision = result.maximumPerformanceV4040;
  if (precision?.alternatives?.length) return precision.alternatives.slice(0, 3).map((item, index) => ({
    id: item.id,
    label: item.label,
    rank: index + 1,
    prior: item.score,
    training: item.training
  }));
  return [{ id: 'CURRENT', label: 'Ficha principal', rank: 1, prior: precision?.winnerScore ?? 70, training: result.training }];
}

function recordsForArm(records: MatchValidationRecord[], armId: string, rank: number) {
  return records.filter((record) => {
    if (record.testedBuildId === armId) return true;
    if (!record.testedBuildId && rank === 1) return true;
    if (record.experimentArm === 'A' && rank === 1 && !String(record.testedBuildId ?? '').startsWith('MAXIMO_')) return true;
    if (record.experimentArm === 'B' && rank === 2 && !String(record.testedBuildId ?? '').startsWith('MAXIMO_')) return true;
    return false;
  });
}

function buildArm(result: AnalysisResult, all: MatchValidationRecord[], alternative: ReturnType<typeof primaryAlternatives>[number]): GameplayValidationArmV4050 {
  const records = recordsForArm(all, alternative.id, alternative.rank);
  const scored = records.map((record) => ({ record, ...scoreRecord(result, record) }));
  const stats = weightedStats(scored.map((item) => ({ value: item.score, weight: item.weight })));
  const priorWeight = REAL_GAMEPLAY_VALIDATION_V4050_PRIOR_WEIGHT;
  const observedWeight = scored.reduce((sum, item) => sum + item.weight, 0);
  const posterior = stats.mean == null ? alternative.prior : (alternative.prior * priorWeight + stats.mean * observedWeight) / (priorWeight + observedWeight);
  const uncertainty = stats.mean == null ? 10 : Math.max(2.2, Math.min(12, stats.stderr * 1.64 + 5 / Math.sqrt(Math.max(1, stats.effectiveN))));
  const subsetScore = (predicate: (record: MatchValidationRecord) => boolean) => {
    const subset = scored.filter((item) => predicate(item.record));
    const s = weightedStats(subset.map((item) => ({ value: item.score, weight: item.weight })));
    return s.mean == null ? null : round(s.mean);
  };
  return {
    id: alternative.id,
    label: alternative.label,
    rank: alternative.rank,
    rawMatches: records.length,
    effectiveMatches: round(stats.effectiveN, 2),
    priorScore: round(alternative.prior),
    observedScore: stats.mean == null ? null : round(stats.mean),
    posteriorScore: round(posterior),
    lowerBound: round(clamp(posterior - uncertainty)),
    upperBound: round(clamp(posterior + uncertainty)),
    stableScore: subsetScore((record) => record.connection === 'stable'),
    delayedScore: subsetScore((record) => record.connection === 'high_delay'),
    rankedScore: subsetScore((record) => record.mode === 'ranked'),
    eventsScore: subsetScore((record) => record.mode === 'events'),
    friendsScore: subsetScore((record) => record.mode === 'friendly'),
    objectiveEvidenceRate: round(average(scored.map((item) => item.objectiveEvidence)) * 100),
    training: alternative.training
  };
}

function contextSummary(result: AnalysisResult, records: MatchValidationRecord[], mode: MatchValidationMode): GameplayValidationContextV4050 {
  const selected = records.filter((record) => (record.mode ?? 'ranked') === mode);
  const scored = selected.map((record) => scoreRecord(result, record));
  const stats = weightedStats(scored.map((item) => ({ value: item.score, weight: item.weight })));
  const prior = priorForMode(result, mode);
  const observedWeight = scored.reduce((sum, item) => sum + item.weight, 0);
  const posterior = stats.mean == null ? null : (prior * 2 + stats.mean * observedWeight) / (2 + observedWeight);
  return { mode, label: MODE_LABELS[mode], samples: selected.length, effectiveSamples: round(stats.effectiveN, 2), score: posterior == null ? null : round(posterior) };
}

function learningSignals(result: AnalysisResult, records: MatchValidationRecord[]) {
  if (records.length < 3) return [];
  const weighted = (getter: (record: MatchValidationRecord) => number) => {
    const values = records.map((record) => ({ value: getter(record), weight: scoreRecord(result, record).weight }));
    const stats = weightedStats(values);
    return stats.mean ?? 0;
  };
  const ratings = {
    passing: weighted((r) => Number(r.passing || 0) * 20),
    movement: weighted((r) => Number(r.movement || 0) * 20),
    finishing: weighted((r) => Number(r.finishing || 0) * 20),
    defending: weighted((r) => Number(r.defending || 0) * 20),
    physical: weighted((r) => Number(r.physical || 0) * 20),
    stamina: weighted((r) => Number(r.stamina || 0) * 20)
  };
  const per90 = (key: keyof MatchPerformanceMetrics) => {
    const minutes = records.reduce((sum, record) => sum + Math.max(1, Number(record.minutes || 0)), 0);
    return minutes ? records.reduce((sum, record) => sum + metric(record, key), 0) * 90 / minutes : 0;
  };
  const candidates: Array<{ group: TrainingKey; score: number; evidence: string }> = [];
  if (ratings.passing < 64 || per90('passErrors') > 3.5) candidates.push({ group: 'passing', score: clamp(75 - ratings.passing + per90('passErrors') * 4), evidence: `Passe ${Math.round(ratings.passing)}/100 e ${round(per90('passErrors'))} erro(s)/90.` });
  if (ratings.movement < 65) candidates.push({ group: 'dexterity', score: clamp(75 - ratings.movement), evidence: `Movimentação ${Math.round(ratings.movement)}/100.` });
  if (ratings.stamina < 64 || records.filter((record) => record.secondHalfDrop).length >= 2) candidates.push({ group: 'lowerBodyStrength', score: clamp(78 - ratings.stamina + records.filter((r) => r.secondHalfDrop).length * 3), evidence: `Resistência ${Math.round(ratings.stamina)}/100 e ${records.filter((r) => r.secondHalfDrop).length} queda(s) no 2º tempo.` });
  if (ratings.finishing < 63 && !['GK', 'CB', 'LB', 'RB', 'DMF'].includes(result.bestPosition.code)) candidates.push({ group: 'shooting', score: clamp(76 - ratings.finishing), evidence: `Finalização ${Math.round(ratings.finishing)}/100.` });
  if (ratings.defending < 64 && ['GK', 'CB', 'LB', 'RB', 'DMF', 'CMF'].includes(result.bestPosition.code)) candidates.push({ group: 'defending', score: clamp(78 - ratings.defending), evidence: `Defesa ${Math.round(ratings.defending)}/100.` });
  if (ratings.physical < 62) candidates.push({ group: 'aerialStrength', score: clamp(75 - ratings.physical), evidence: `Físico ${Math.round(ratings.physical)}/100.` });
  if (per90('ballLosses') > 4.5 && result.bestPosition.code !== 'GK') candidates.push({ group: 'dribbling', score: clamp(55 + per90('ballLosses') * 4), evidence: `${round(per90('ballLosses'))} perda(s) de bola/90.` });
  return candidates.sort((a, b) => b.score - a.score).slice(0, 4).map((item) => ({ group: item.group, label: TRAINING_LABELS[item.group], direction: 'reforcar' as const, score: round(item.score), evidence: item.evidence }));
}

export function buildRealGameplayValidationV4050(result: AnalysisResult, allRecords: MatchValidationRecord[]): RealGameplayValidationV4050Analysis {
  const fingerprint = cardFingerprint(result);
  const records = allRecords.filter((record) => record.cardFingerprint === fingerprint && record.targetPosition === result.bestPosition.code);
  const scored = records.map((record) => scoreRecord(result, record));
  const allStats = weightedStats(scored.map((item) => ({ value: item.score, weight: item.weight })));
  const arms = primaryAlternatives(result).map((alternative) => buildArm(result, records, alternative)).sort((a, b) => b.posteriorScore - a.posteriorScore || a.rank - b.rank);
  const leader = arms[0] ?? null;
  const runnerUp = arms[1] ?? null;
  const margin = leader && runnerUp ? round(leader.posteriorScore - runnerUp.posteriorScore) : 0;
  const comparable = Boolean(leader && runnerUp && leader.rawMatches >= REAL_GAMEPLAY_VALIDATION_V4050_MIN_MATCHES_PER_ARM && runnerUp.rawMatches >= REAL_GAMEPLAY_VALIDATION_V4050_MIN_MATCHES_PER_ARM && leader.effectiveMatches >= 3.2 && runnerUp.effectiveMatches >= 3.2);
  const statisticallySeparated = Boolean(comparable && leader && runnerUp && leader.lowerBound > runnerUp.upperBound + .4 && margin >= 3);
  const currentId = primaryAlternatives(result).find((item) => item.rank === 1)?.id ?? 'CURRENT';
  const leaderIsCurrent = leader?.id === currentId;
  let action: ValidationAction = 'COLETAR';
  let verifiedWinnerId: string | null = null;
  if (comparable && statisticallySeparated && leader) {
    verifiedWinnerId = leader.id;
    action = leaderIsCurrent ? 'MANTER' : 'PROMOVER_ALTERNATIVA';
  } else if (records.length >= 5 && leader && !leaderIsCurrent && margin >= 2) action = 'TESTAR_ALTERNATIVA';
  else if (records.length >= 5 && leaderIsCurrent) action = 'MANTER';

  const contexts = (['ranked', 'events', 'friendly', 'offline'] as MatchValidationMode[]).map((mode) => contextSummary(result, records, mode));
  const contextsCovered = contexts.filter((item) => item.samples > 0).length;
  const stableMatches = records.filter((record) => record.connection === 'stable').length;
  const delayedMatches = records.filter((record) => record.connection === 'high_delay').length;
  const objectiveEvidenceRate = round(average(scored.map((item) => item.objectiveEvidence)) * 100);
  const sampleScore = clamp(allStats.effectiveN / 10 * 100);
  const coverageScore = clamp(contextsCovered / 3 * 100);
  const stableScore = clamp(stableMatches / Math.max(1, records.length) * 100);
  const confidenceScore = round(sampleScore * .48 + coverageScore * .18 + objectiveEvidenceRate * .2 + stableScore * .14);
  const confidenceLevel: ValidationConfidence = confidenceScore >= 78 && comparable ? 'ALTA' : confidenceScore >= 48 ? 'MODERADA' : 'INICIAL';

  const verdict = !records.length
    ? 'Ainda não existe evidência real desta carta nesta posição. A v40.40 continua sendo a referência até o laboratório reunir partidas comparáveis.'
    : statisticallySeparated && leader
      ? `${leader.label} abriu vantagem estatisticamente separada de ${margin} ponto(s), já descontando amostra pequena, delay e contexto.`
      : comparable
        ? `As fichas já têm amostra comparável, mas os intervalos ainda se sobrepõem. Não há justificativa segura para trocar a vencedora atual.`
        : `${records.length} partida(s) registradas; a evidência já influencia confiança e diagnóstico, mas ainda não autoriza substituir a ficha por acaso.`;

  const nextAction = action === 'PROMOVER_ALTERNATIVA'
    ? `A alternativa ${leader?.label ?? ''} pode ser promovida como recomendação validada; confirme antes de gastar GP/itens ou resetar progressão.`
    : action === 'TESTAR_ALTERNATIVA'
      ? `A alternativa ${leader?.label ?? ''} está sinalizando ganho. Complete pelo menos ${REAL_GAMEPLAY_VALIDATION_V4050_MIN_MATCHES_PER_ARM} partidas em cada braço, alternando condições semelhantes.`
      : comparable
        ? 'Continue alternando A/B nas mesmas condições até existir separação real entre os intervalos.'
        : `Colete pelo menos ${REAL_GAMEPLAY_VALIDATION_V4050_MIN_MATCHES_PER_ARM} partidas por opção, priorizando conexão estável e 60+ minutos de uso.`;

  return {
    engineVersion: REAL_GAMEPLAY_VALIDATION_V4050_VERSION,
    cardFingerprint: fingerprint,
    mode: 'VALIDACAO_REAL_GAMEPLAY',
    totalMatches: records.length,
    effectiveMatches: round(allStats.effectiveN, 2),
    stableMatches,
    delayedMatches,
    contextsCovered,
    objectiveEvidenceRate,
    confidence: {
      score: confidenceScore,
      level: confidenceLevel,
      reasons: [
        `Amostra efetiva: ${round(allStats.effectiveN, 1)} partida(s) após ponderar minutos, conexão e contexto.`,
        `Evidência objetiva preenchida: ${objectiveEvidenceRate}%.`,
        `${stableMatches} partida(s) em conexão estável e ${delayedMatches} com delay alto; delay alto recebe peso reduzido.`,
        `${contextsCovered} contexto(s) coberto(s) entre ranqueada, eventos, contra amigos e offline.`
      ]
    },
    arms,
    leaderId: leader?.id ?? null,
    leaderLabel: leader?.label ?? 'Sem líder',
    action,
    verifiedWinnerId,
    verifiedWinnerLabel: verifiedWinnerId ? leader?.label ?? null : null,
    margin,
    learningSignals: learningSignals(result, records),
    verdict,
    nextAction,
    safeguards: [
      'Uma partida isolada nunca altera a ficha nem os pesos de treino.',
      'Partidas com delay alto, poucos minutos ou pouca evidência objetiva recebem peso menor.',
      `Uma troca só pode ser promovida após pelo menos ${REAL_GAMEPLAY_VALIDATION_V4050_MIN_MATCHES_PER_ARM} partidas por braço e separação estatística entre as opções.`,
      'O histórico é preso à mesma carta e à mesma posição para não misturar versões ou funções diferentes.',
      'Na r123, o laboratório Clean Slate é somente leitura: mesmo um vencedor A/B não sobrescreve automaticamente ficha, Top 5 ou Ímpeto.'
    ],
    guarantees: {
      singleMatchNeverChangesBuild: true,
      highDelayDownWeighted: true,
      minimumComparableSampleRequired: true,
      exactCardFingerprintRequired: true,
      noAutomaticPointSpending: true
    }
  };
}

export const REAL_GAMEPLAY_VALIDATION_V4050_STORAGE_KEY = 'buildmaster_real_gameplay_validation_v4050';

type GameplayValidationMemoryEntryV4050 = {
  engineVersion: typeof REAL_GAMEPLAY_VALIDATION_V4050_VERSION;
  cardFingerprint: string;
  position: AnalysisResult['bestPosition']['code'];
  winnerId: string;
  winnerLabel: string;
  training: AnalysisResult['training'];
  confidenceScore: number;
  rawMatches: number;
  effectiveMatches: number;
  verifiedAt: string;
};

type GameplayValidationMemoryEnvelopeV4050 = {
  version: typeof REAL_GAMEPLAY_VALIDATION_V4050_VERSION;
  entries: GameplayValidationMemoryEntryV4050[];
};

function readValidationMemory(): GameplayValidationMemoryEnvelopeV4050 {
  try {
    const raw = readAccountStorage(REAL_GAMEPLAY_VALIDATION_V4050_STORAGE_KEY, { migrateLegacy: false });
    if (!raw) return { version: REAL_GAMEPLAY_VALIDATION_V4050_VERSION, entries: [] };
    const parsed = JSON.parse(raw) as Partial<GameplayValidationMemoryEnvelopeV4050>;
    const entries = Array.isArray(parsed.entries)
      ? parsed.entries.filter((entry): entry is GameplayValidationMemoryEntryV4050 => Boolean(entry && entry.engineVersion === REAL_GAMEPLAY_VALIDATION_V4050_VERSION && entry.cardFingerprint && entry.winnerId && entry.training))
      : [];
    return { version: REAL_GAMEPLAY_VALIDATION_V4050_VERSION, entries: entries.slice(0, 240) };
  } catch {
    return { version: REAL_GAMEPLAY_VALIDATION_V4050_VERSION, entries: [] };
  }
}

function writeValidationMemory(envelope: GameplayValidationMemoryEnvelopeV4050) {
  try {
    writeAccountStorage(REAL_GAMEPLAY_VALIDATION_V4050_STORAGE_KEY, JSON.stringify({ ...envelope, entries: envelope.entries.slice(0, 240) }));
  } catch {
    // Memória de validação nunca pode bloquear a ficha.
  }
}

export function persistVerifiedGameplayWinnerV4050(result: AnalysisResult, analysis: RealGameplayValidationV4050Analysis) {
  if (!analysis.verifiedWinnerId || analysis.confidence.level !== 'ALTA') return false;
  const arm = analysis.arms.find((item) => item.id === analysis.verifiedWinnerId);
  if (!arm?.training) return false;
  const entry: GameplayValidationMemoryEntryV4050 = {
    engineVersion: REAL_GAMEPLAY_VALIDATION_V4050_VERSION,
    cardFingerprint: analysis.cardFingerprint,
    position: result.bestPosition.code,
    winnerId: arm.id,
    winnerLabel: arm.label,
    training: { ...arm.training },
    confidenceScore: analysis.confidence.score,
    rawMatches: arm.rawMatches,
    effectiveMatches: arm.effectiveMatches,
    verifiedAt: new Date().toISOString()
  };
  const memory = readValidationMemory();
  const entries = [entry, ...memory.entries.filter((item) => !(item.cardFingerprint === entry.cardFingerprint && item.position === entry.position))];
  writeValidationMemory({ version: REAL_GAMEPLAY_VALIDATION_V4050_VERSION, entries });
  return true;
}

export function applyVerifiedGameplayWinnerV4050(result: AnalysisResult): AnalysisResult {
  if (result.objective !== 'COMPETITIVE' || !result.maximumPerformanceV4040) return result;
  const fingerprint = cardFingerprint(result);
  const entry = readValidationMemory().entries.find((item) => item.cardFingerprint === fingerprint && item.position === result.bestPosition.code);
  if (!entry) return result;
  const candidate = result.maximumPerformanceV4040.alternatives.find((item) => item.id === entry.winnerId);
  if (!candidate) return result;
  // O candidato precisa continuar existindo na busca atual. Isso impede uma memória antiga de sobreviver a mudanças estruturais do motor.
  const samePlan = JSON.stringify(candidate.training) === JSON.stringify(entry.training);
  if (!samePlan) return result;
  if (trainingPlanTotalCost(entry.training) !== result.trainingPointsTotal) return result;
  const used = trainingPlanTotalCost(entry.training);
  return {
    ...result,
    training: { ...entry.training },
    trainingPointsUsed: used,
    trainingPointsRemaining: Math.max(0, result.trainingPointsTotal - used),
    buildName: `Ficha Automática v40.50 — Validada em Gameplay — ${entry.winnerLabel} — ${result.parsed.playerName}`,
    recommendationExplanation: [
      `Validação real v40.50 recuperou ${entry.winnerLabel}, confirmada com confiança ${Math.round(entry.confidenceScore)}/100 e ${entry.rawMatches} partidas no braço vencedor.`,
      'A promoção só foi aceita porque a mesma alternativa continua existindo na busca Pareto atual e mantém orçamento exato.',
      ...result.recommendationExplanation
    ].filter((item, index, all) => all.indexOf(item) === index).slice(0, 30),
    strengths: [
      'A ficha aplicada possui vencedor confirmado por amostra comparável de gameplay real, sem decisão baseada em uma partida isolada.',
      ...result.strengths
    ].filter((item, index, all) => all.indexOf(item) === index).slice(0, 18),
    note: `${result.note} Validação real v40.50: ${entry.winnerLabel} foi promovida após evidência A/B suficiente; a memória é descartada automaticamente se o candidato deixar de existir ou mudar de distribuição.`,
    gameplayValidationMemoryV4050: {
      engineVersion: REAL_GAMEPLAY_VALIDATION_V4050_VERSION,
      applied: true,
      winnerId: entry.winnerId,
      winnerLabel: entry.winnerLabel,
      confidenceScore: entry.confidenceScore,
      rawMatches: entry.rawMatches,
      effectiveMatches: entry.effectiveMatches,
      verifiedAt: entry.verifiedAt
    }
  };
}
