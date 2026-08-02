import type { AnalysisResult, PositionCode, TrainingKey } from './analyzerDomain';
import { cardFingerprint, type MatchPerformanceMetrics, type MatchValidationRecord } from './appEvolution';
import { TRAINING_LABELS } from './trainingEngine';

export const REAL_VALIDATION_V3760_VERSION = '37.60.0' as const;
export const REAL_VALIDATION_PROFILE_STORAGE_KEY = 'buildmaster_real_validation_profile_v3760';

export type ControlStyleV3760 = 'quick-pass' | 'carry-dribble' | 'mixed' | 'manual-defense';
export type ExperimentArmV3760 = 'A' | 'B' | 'NONE';
export type ValidationConfidenceV3760 = 'inicial' | 'moderada' | 'alta';

type PositionMetricKey =
  | 'distribution'
  | 'movement'
  | 'finishing'
  | 'defending'
  | 'physical'
  | 'stamina'
  | 'ballSecurity'
  | 'creation'
  | 'goalkeeping'
  | 'aerial'
  | 'pressure';

export type PositionMetricV3760 = {
  key: PositionMetricKey;
  label: string;
  score: number;
  sampleCount: number;
  evidence: string;
  status: 'forte' | 'estável' | 'atenção';
};

export type AbExperimentArmV3760 = {
  arm: 'A' | 'B';
  buildId: string;
  buildTitle: string;
  boosterName: string;
  matches: number;
  rawScore: number;
  contextAdjustedScore: number;
  stableScore: number | null;
  delayedScore: number | null;
  passErrorsPer90: number;
  ballLossesPer90: number;
};

export type AbExperimentV3760 = {
  experimentId: string;
  minimumMatchesPerArm: number;
  arms: AbExperimentArmV3760[];
  status: 'não iniciado' | 'coletando' | 'comparável' | 'concluído';
  winner: 'A' | 'B' | null;
  confidence: ValidationConfidenceV3760;
  verdict: string;
  nextAction: string;
};

export type DelayAnalysisV3760 = {
  stableMatches: number;
  variableMatches: number;
  delayedMatches: number;
  stableScore: number | null;
  delayedScore: number | null;
  sensitivity: number;
  level: 'baixa' | 'moderada' | 'alta';
  evidence: string[];
};

export type UserLearningV3760 = {
  engineVersion: typeof REAL_VALIDATION_V3760_VERSION;
  sampleCount: number;
  confidence: ValidationConfidenceV3760;
  dominantControlStyle: ControlStyleV3760;
  controlStyleLabel: string;
  learnedWeights: Partial<Record<TrainingKey, number>>;
  tendencies: Array<{ label: string; score: number; evidence: string }>;
  recurringProblems: Array<{ label: string; count: number }>;
  delaySensitivity: number;
  summary: string;
};

export type MatchAnalysisV3760 = {
  samples: number;
  score: number;
  confidence: ValidationConfidenceV3760;
  positionMetrics: PositionMetricV3760[];
  delay: DelayAnalysisV3760;
  repeatedPatterns: string[];
  strengths: string[];
  weaknesses: string[];
  verdict: string;
};

export type AdaptiveAdjustmentV3760 = {
  recommendedBuildId: string | null;
  recommendedBuildTitle: string;
  recommendedBooster: string;
  preferredStrategy: 'recomendada' | 'função' | 'identidade' | 'equilíbrio' | 'robustez';
  trainingWeightAdjustments: Partial<Record<TrainingKey, number>>;
  reasons: string[];
  safeguards: string[];
};

export type RealValidationV3760Analysis = {
  engineVersion: typeof REAL_VALIDATION_V3760_VERSION;
  cardFingerprint: string;
  experiment: AbExperimentV3760;
  matchAnalysis: MatchAnalysisV3760;
  userLearning: UserLearningV3760;
  adjustment: AdaptiveAdjustmentV3760;
};

const CONTROL_STYLE_LABELS: Record<ControlStyleV3760, string> = {
  'quick-pass': 'Toques e passes rápidos',
  'carry-dribble': 'Condução e drible',
  mixed: 'Misto e adaptável',
  'manual-defense': 'Defesa e marcação manual'
};

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, Math.round(value)));
const round = (value: number, digits = 1) => Number(value.toFixed(digits));
const safeAverage = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;

function metric(record: MatchValidationRecord, key: keyof MatchPerformanceMetrics) {
  return Number(record.metrics?.[key] || 0);
}

function per90(records: MatchValidationRecord[], key: keyof MatchPerformanceMetrics) {
  const minutes = records.reduce((sum, record) => sum + Math.max(1, Number(record.minutes || 0)), 0);
  if (!minutes) return 0;
  return records.reduce((sum, record) => sum + metric(record, key), 0) * 90 / minutes;
}

function recordBaseScore(record: MatchValidationRecord, position: PositionCode) {
  const ratingWeights: Record<PositionCode, Array<[keyof Pick<MatchValidationRecord, 'passing' | 'movement' | 'finishing' | 'defending' | 'physical' | 'stamina'>, number]>> = {
    GK: [['defending', .32], ['passing', .18], ['physical', .18], ['movement', .12], ['stamina', .2]],
    CB: [['defending', .36], ['physical', .22], ['passing', .15], ['movement', .13], ['stamina', .14]],
    LB: [['defending', .25], ['passing', .2], ['movement', .2], ['physical', .15], ['stamina', .2]],
    RB: [['defending', .25], ['passing', .2], ['movement', .2], ['physical', .15], ['stamina', .2]],
    DMF: [['defending', .28], ['passing', .24], ['movement', .16], ['physical', .15], ['stamina', .17]],
    CMF: [['passing', .28], ['movement', .24], ['defending', .14], ['physical', .12], ['stamina', .14], ['finishing', .08]],
    LMF: [['passing', .24], ['movement', .25], ['finishing', .12], ['physical', .12], ['stamina', .17], ['defending', .1]],
    RMF: [['passing', .24], ['movement', .25], ['finishing', .12], ['physical', .12], ['stamina', .17], ['defending', .1]],
    AMF: [['passing', .3], ['movement', .27], ['finishing', .18], ['physical', .08], ['stamina', .1], ['defending', .07]],
    SS: [['finishing', .27], ['movement', .27], ['passing', .2], ['physical', .1], ['stamina', .1], ['defending', .06]],
    CF: [['finishing', .38], ['movement', .25], ['physical', .16], ['stamina', .1], ['passing', .07], ['defending', .04]],
    LWF: [['movement', .29], ['finishing', .25], ['passing', .17], ['physical', .1], ['stamina', .13], ['defending', .06]],
    RWF: [['movement', .29], ['finishing', .25], ['passing', .17], ['physical', .1], ['stamina', .13], ['defending', .06]]
  };
  const ratingScore = ratingWeights[position].reduce((sum, [key, weight]) => sum + Number(record[key] || 0) * 20 * weight, 0);
  const minutesFactor = Math.min(1, Math.max(.35, Number(record.minutes || 0) / 70));
  const objectiveBonus = (
    metric(record, 'goals') * 4
    + metric(record, 'assists') * 3
    + metric(record, 'interceptions') * 1.4
    + metric(record, 'tackles') * 1.2
    + metric(record, 'saves') * 1.3
    + metric(record, 'keyPasses') * 1.2
    + metric(record, 'progressivePasses') * .45
    + metric(record, 'shotsOnTarget') * .8
    + metric(record, 'clearances') * .7
    + metric(record, 'blocks') * .8
    + metric(record, 'recoveries') * .6
  );
  const errorPenalty = metric(record, 'passErrors') * 1.2 + metric(record, 'ballLosses') * .75 + metric(record, 'goalsConceded') * 1.2;
  const secondHalfPenalty = record.secondHalfDrop ? 4 : 0;
  return clamp((ratingScore + objectiveBonus - errorPenalty - secondHalfPenalty) * (.82 + minutesFactor * .18));
}

function delayContextBonus(record: MatchValidationRecord) {
  const delayRating = Number(record.inputDelayRating || (record.connection === 'high_delay' ? 5 : record.connection === 'variable' ? 3 : 1));
  return Math.max(0, delayRating - 2) * 1.4;
}

function summarizeArm(result: AnalysisResult, arm: 'A' | 'B', option: { buildId: string; buildTitle: string; boosterName: string }, records: MatchValidationRecord[]): AbExperimentArmV3760 {
  const armRecords = records.filter((record) => {
    if (record.experimentArm === 'A' || record.experimentArm === 'B') return record.experimentArm === arm;
    const buildMatches = record.testedBuildId === option.buildId;
    const boosterMatches = !record.testedBoosterName || record.testedBoosterName === option.boosterName;
    return buildMatches && boosterMatches;
  });
  const rawScores = armRecords.map((record) => recordBaseScore(record, result.bestPosition.code));
  const adjustedScores = armRecords.map((record) => recordBaseScore(record, result.bestPosition.code) + delayContextBonus(record));
  const stable = armRecords.filter((record) => record.connection === 'stable');
  const delayed = armRecords.filter((record) => record.connection === 'high_delay');
  return {
    arm,
    buildId: option.buildId,
    buildTitle: option.buildTitle,
    boosterName: option.boosterName,
    matches: armRecords.length,
    rawScore: round(safeAverage(rawScores) ?? 0),
    contextAdjustedScore: round(safeAverage(adjustedScores) ?? 0),
    stableScore: stable.length ? round(safeAverage(stable.map((record) => recordBaseScore(record, result.bestPosition.code))) ?? 0) : null,
    delayedScore: delayed.length ? round(safeAverage(delayed.map((record) => recordBaseScore(record, result.bestPosition.code))) ?? 0) : null,
    passErrorsPer90: round(per90(armRecords, 'passErrors')),
    ballLossesPer90: round(per90(armRecords, 'ballLosses'))
  };
}

function buildExperiment(result: AnalysisResult, records: MatchValidationRecord[]): AbExperimentV3760 {
  const joint = result.advancedMotorV3750?.jointOptions ?? [];
  const fallback = {
    buildId: result.buildName,
    buildTitle: result.buildName,
    boosterName: result.recommendedImpetos[0]?.name || 'Sem Booster confirmado'
  };
  const first = joint[0] ?? fallback;
  const second = joint.find((item) => item.buildId !== first.buildId || item.boosterName !== first.boosterName) ?? joint[1] ?? fallback;
  const arms = [
    summarizeArm(result, 'A', first, records),
    summarizeArm(result, 'B', second, records)
  ];
  const minimumMatchesPerArm = 3;
  const bothStarted = arms.every((item) => item.matches > 0);
  const comparable = arms.every((item) => item.matches >= minimumMatchesPerArm);
  const difference = Math.abs(arms[0].contextAdjustedScore - arms[1].contextAdjustedScore);
  const enoughDifference = difference >= 3;
  const winner = comparable && enoughDifference
    ? (arms[0].contextAdjustedScore > arms[1].contextAdjustedScore ? 'A' : 'B')
    : null;
  const total = arms.reduce((sum, item) => sum + item.matches, 0);
  const confidence: ValidationConfidenceV3760 = comparable && total >= 12 ? 'alta' : comparable ? 'moderada' : 'inicial';
  const status: AbExperimentV3760['status'] = winner && total >= 8 ? 'concluído' : comparable ? 'comparável' : bothStarted ? 'coletando' : 'não iniciado';
  const verdict = !bothStarted
    ? 'O laboratório precisa de partidas nos dois braços antes de comparar.'
    : !comparable
      ? `Colete pelo menos ${minimumMatchesPerArm} partidas em cada braço para reduzir decisões por acaso.`
      : winner
        ? `Braço ${winner} lidera por ${round(difference)} pontos após ajuste de contexto e delay.`
        : 'As duas opções estão tecnicamente próximas; mantenha a coleta antes de trocar a ficha principal.';
  return {
    experimentId: `${result.structuralPrecision?.canonical.canonicalId || result.parsed.playerName}:v3760`,
    minimumMatchesPerArm,
    arms,
    status,
    winner,
    confidence,
    verdict,
    nextAction: comparable ? (winner ? 'Confirme o vencedor em mais duas partidas de contexto diferente.' : 'Mantenha a alternância A/B e registre conexão e estilo de controle.') : 'Alterne os braços A e B sem mudar formação, posição ou instrução individual.'
  };
}

function metricStatus(score: number): PositionMetricV3760['status'] {
  return score >= 76 ? 'forte' : score >= 61 ? 'estável' : 'atenção';
}

function averageRating(records: MatchValidationRecord[], key: keyof Pick<MatchValidationRecord, 'passing' | 'movement' | 'finishing' | 'defending' | 'physical' | 'stamina'>) {
  return safeAverage(records.map((record) => Number(record[key] || 0))) ?? 0;
}

function positionMetricTemplates(position: PositionCode): Array<{ key: PositionMetricKey; label: string; score: (records: MatchValidationRecord[]) => number; evidence: (records: MatchValidationRecord[]) => string }> {
  const normalizedCount = (records: MatchValidationRecord[], key: keyof MatchPerformanceMetrics, factor: number) => clamp(50 + per90(records, key) * factor);
  const rating = (records: MatchValidationRecord[], key: keyof Pick<MatchValidationRecord, 'passing' | 'movement' | 'finishing' | 'defending' | 'physical' | 'stamina'>) => clamp(averageRating(records, key) * 20);
  if (position === 'GK') return [
    { key: 'goalkeeping', label: 'Defesas e reação', score: (r) => clamp(rating(r, 'defending') * .72 + normalizedCount(r, 'saves', 4) * .28), evidence: (r) => `${round(per90(r, 'saves'))} defesa(s)/90 e nota defensiva ${round(averageRating(r, 'defending'))}/5.` },
    { key: 'distribution', label: 'Distribuição', score: (r) => clamp(rating(r, 'passing') - per90(r, 'passErrors') * 3), evidence: (r) => `${round(per90(r, 'progressivePasses'))} passe(s) progressivo(s)/90 e ${round(per90(r, 'passErrors'))} erro(s)/90.` },
    { key: 'aerial', label: 'Domínio aéreo', score: (r) => clamp(rating(r, 'physical') * .7 + normalizedCount(r, 'aerialDuelsWon', 5) * .3), evidence: (r) => `${round(per90(r, 'aerialDuelsWon'))} ação(ões) aérea(s) vencida(s)/90.` },
    { key: 'stamina', label: 'Estabilidade até o fim', score: (r) => clamp(rating(r, 'stamina') - r.filter((item) => item.secondHalfDrop).length * 3), evidence: (r) => `${r.filter((item) => item.secondHalfDrop).length} queda(s) no segundo tempo.` }
  ];
  if (['CB', 'LB', 'RB'].includes(position)) return [
    { key: 'defending', label: 'Proteção defensiva', score: (r) => clamp(rating(r, 'defending') * .7 + normalizedCount(r, 'interceptions', 4) * .15 + normalizedCount(r, 'tackles', 4) * .15), evidence: (r) => `${round(per90(r, 'interceptions'))} interceptação(ões) e ${round(per90(r, 'tackles'))} desarme(s)/90.` },
    { key: 'pressure', label: 'Bloqueio e cobertura', score: (r) => clamp(normalizedCount(r, 'blocks', 7) * .5 + normalizedCount(r, 'clearances', 4) * .5), evidence: (r) => `${round(per90(r, 'blocks'))} bloqueio(s) e ${round(per90(r, 'clearances'))} corte(s)/90.` },
    { key: 'aerial', label: 'Disputa aérea', score: (r) => clamp(rating(r, 'physical') * .65 + normalizedCount(r, 'aerialDuelsWon', 5) * .35), evidence: (r) => `${round(per90(r, 'aerialDuelsWon'))} duelo(s) aéreo(s) vencido(s)/90.` },
    { key: 'ballSecurity', label: 'Saída segura', score: (r) => clamp(rating(r, 'passing') - per90(r, 'passErrors') * 4 - per90(r, 'ballLosses') * 2), evidence: (r) => `${round(per90(r, 'passErrors'))} erro(s) de passe e ${round(per90(r, 'ballLosses'))} perda(s)/90.` }
  ];
  if (['DMF', 'CMF', 'LMF', 'RMF', 'AMF'].includes(position)) return [
    { key: 'distribution', label: 'Qualidade de passe', score: (r) => clamp(rating(r, 'passing') - per90(r, 'passErrors') * 3), evidence: (r) => `${round(per90(r, 'progressivePasses'))} passe(s) progressivo(s) e ${round(per90(r, 'passErrors'))} erro(s)/90.` },
    { key: 'creation', label: 'Criação', score: (r) => clamp(50 + per90(r, 'assists') * 10 + per90(r, 'keyPasses') * 4), evidence: (r) => `${round(per90(r, 'keyPasses'))} passe(s)-chave e ${round(per90(r, 'assists'))} assistência(s)/90.` },
    { key: 'movement', label: 'Movimentação e apoio', score: (r) => rating(r, 'movement'), evidence: (r) => `Nota média ${round(averageRating(r, 'movement'))}/5 em movimentação.` },
    { key: 'defending', label: 'Recuperação', score: (r) => clamp(rating(r, 'defending') * .55 + normalizedCount(r, 'recoveries', 3) * .45), evidence: (r) => `${round(per90(r, 'recoveries'))} recuperação(ões)/90.` },
    { key: 'ballSecurity', label: 'Segurança sob pressão', score: (r) => clamp(78 - per90(r, 'ballLosses') * 4 - per90(r, 'passErrors') * 2), evidence: (r) => `${round(per90(r, 'ballLosses'))} perda(s) e ${round(per90(r, 'passErrors'))} erro(s) de passe/90.` }
  ];
  return [
    { key: 'finishing', label: 'Finalização', score: (r) => clamp(rating(r, 'finishing') * .6 + normalizedCount(r, 'shotsOnTarget', 7) * .2 + normalizedCount(r, 'goals', 12) * .2), evidence: (r) => `${round(per90(r, 'goals'))} gol(s) e ${round(per90(r, 'shotsOnTarget'))} chute(s) no alvo/90.` },
    { key: 'movement', label: 'Ataque ao espaço', score: (r) => clamp(rating(r, 'movement') * .72 + normalizedCount(r, 'runsBehind', 4) * .28), evidence: (r) => `${round(per90(r, 'runsBehind'))} desmarque(s) em profundidade/90.` },
    { key: 'creation', label: 'Participação ofensiva', score: (r) => clamp(50 + per90(r, 'assists') * 10 + per90(r, 'keyPasses') * 4), evidence: (r) => `${round(per90(r, 'assists'))} assistência(s) e ${round(per90(r, 'keyPasses'))} passe(s)-chave/90.` },
    { key: 'ballSecurity', label: 'Condução segura', score: (r) => clamp(55 + per90(r, 'dribblesCompleted') * 4 - per90(r, 'ballLosses') * 3), evidence: (r) => `${round(per90(r, 'dribblesCompleted'))} drible(s) e ${round(per90(r, 'ballLosses'))} perda(s)/90.` },
    { key: 'pressure', label: 'Pressão pós-perda', score: (r) => clamp(50 + per90(r, 'successfulPressures') * 4), evidence: (r) => `${round(per90(r, 'successfulPressures'))} pressão(ões) bem-sucedida(s)/90.` }
  ];
}

function buildDelayAnalysis(result: AnalysisResult, records: MatchValidationRecord[]): DelayAnalysisV3760 {
  const stable = records.filter((record) => record.connection === 'stable');
  const variable = records.filter((record) => record.connection === 'variable');
  const delayed = records.filter((record) => record.connection === 'high_delay');
  const stableScore = stable.length ? round(safeAverage(stable.map((record) => recordBaseScore(record, result.bestPosition.code))) ?? 0) : null;
  const delayedScore = delayed.length ? round(safeAverage(delayed.map((record) => recordBaseScore(record, result.bestPosition.code))) ?? 0) : null;
  const sensitivity = stableScore != null && delayedScore != null ? Math.max(0, round(stableScore - delayedScore)) : 0;
  const level: DelayAnalysisV3760['level'] = sensitivity >= 12 ? 'alta' : sensitivity >= 6 ? 'moderada' : 'baixa';
  return {
    stableMatches: stable.length,
    variableMatches: variable.length,
    delayedMatches: delayed.length,
    stableScore,
    delayedScore,
    sensitivity,
    level,
    evidence: [
      stableScore == null ? 'Ainda não há amostra estável suficiente.' : `Desempenho estável: ${stableScore}/100.`,
      delayedScore == null ? 'Ainda não há amostra com delay alto suficiente.' : `Desempenho com delay alto: ${delayedScore}/100.`,
      `Erros de passe com delay: ${round(per90(delayed, 'passErrors'))}/90; em conexão estável: ${round(per90(stable, 'passErrors'))}/90.`
    ]
  };
}

function inferControlStyle(records: MatchValidationRecord[]): ControlStyleV3760 {
  const explicit = new Map<ControlStyleV3760, number>();
  records.forEach((record) => {
    if (record.controlStyle) explicit.set(record.controlStyle, (explicit.get(record.controlStyle) ?? 0) + 1);
  });
  if (explicit.size) return [...explicit.entries()].sort((a, b) => b[1] - a[1])[0][0];
  const dribbles = records.reduce((sum, record) => sum + metric(record, 'dribblesCompleted'), 0);
  const passes = records.reduce((sum, record) => sum + Number(record.passing || 0), 0);
  const defense = records.reduce((sum, record) => sum + metric(record, 'tackles') + metric(record, 'interceptions'), 0);
  if (dribbles > records.length * 3) return 'carry-dribble';
  if (defense > records.length * 4) return 'manual-defense';
  if (passes >= records.length * 4) return 'quick-pass';
  return 'mixed';
}

function buildUserLearning(allRecords: MatchValidationRecord[], delay: DelayAnalysisV3760): UserLearningV3760 {
  const relevant = allRecords.filter((record) => record.playerName && record.minutes > 0);
  const style = inferControlStyle(relevant);
  const n = relevant.length;
  const confidence: ValidationConfidenceV3760 = n >= 12 ? 'alta' : n >= 5 ? 'moderada' : 'inicial';
  const tendencies = [
    { label: 'Passe rápido', score: clamp(averageRating(relevant, 'passing') * 18 + per90(relevant, 'assists') * 4 - per90(relevant, 'passErrors') * 2), evidence: `${round(per90(relevant, 'passErrors'))} erro(s) de passe/90.` },
    { label: 'Condução e drible', score: clamp(averageRating(relevant, 'movement') * 16 + per90(relevant, 'dribblesCompleted') * 4 - per90(relevant, 'ballLosses') * 2), evidence: `${round(per90(relevant, 'dribblesCompleted'))} drible(s) e ${round(per90(relevant, 'ballLosses'))} perda(s)/90.` },
    { label: 'Finalização', score: clamp(averageRating(relevant, 'finishing') * 16 + per90(relevant, 'goals') * 8 + per90(relevant, 'shotsOnTarget') * 2), evidence: `${round(per90(relevant, 'goals'))} gol(s)/90.` },
    { label: 'Defesa manual', score: clamp(averageRating(relevant, 'defending') * 16 + per90(relevant, 'tackles') * 3 + per90(relevant, 'interceptions') * 3), evidence: `${round(per90(relevant, 'tackles') + per90(relevant, 'interceptions'))} ação(ões) defensiva(s)/90.` }
  ].sort((left, right) => right.score - left.score);
  const tagCounts = new Map<string, number>();
  relevant.flatMap((record) => record.tags).forEach((tag) => tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1));
  const recurringProblems = [...tagCounts.entries()].map(([label, count]) => ({ label, count })).filter((item) => item.count >= 2).sort((a, b) => b.count - a.count).slice(0, 6);
  const learnedWeights: Partial<Record<TrainingKey, number>> = {};
  if (style === 'quick-pass') { learnedWeights.passing = 3; learnedWeights.dexterity = 2; }
  if (style === 'carry-dribble') { learnedWeights.dribbling = 3; learnedWeights.dexterity = 3; learnedWeights.lowerBodyStrength = 1; }
  if (style === 'manual-defense') { learnedWeights.defending = 3; learnedWeights.lowerBodyStrength = 2; learnedWeights.dexterity = 1; }
  if (style === 'mixed') { learnedWeights.passing = 1; learnedWeights.dexterity = 2; learnedWeights.lowerBodyStrength = 1; }
  if (delay.level === 'alta') { learnedWeights.passing = Math.max(learnedWeights.passing ?? 0, 2); learnedWeights.dexterity = Math.max(learnedWeights.dexterity ?? 0, 3); learnedWeights.lowerBodyStrength = Math.max(learnedWeights.lowerBodyStrength ?? 0, 2); }
  if (per90(relevant, 'ballLosses') > 5) learnedWeights.dribbling = Math.max(learnedWeights.dribbling ?? 0, 2);
  return {
    engineVersion: REAL_VALIDATION_V3760_VERSION,
    sampleCount: n,
    confidence,
    dominantControlStyle: style,
    controlStyleLabel: CONTROL_STYLE_LABELS[style],
    learnedWeights,
    tendencies,
    recurringProblems,
    delaySensitivity: delay.sensitivity,
    summary: n ? `${n} partida(s) da conta formam um perfil ${confidence}: ${CONTROL_STYLE_LABELS[style].toLowerCase()}. O aprendizado apenas ajusta desempates e nunca substitui a posição escolhida.` : 'Ainda não há partidas suficientes para aprender o estilo de controle desta conta.'
  };
}

function buildMatchAnalysis(result: AnalysisResult, records: MatchValidationRecord[]): MatchAnalysisV3760 {
  const delay = buildDelayAnalysis(result, records);
  const templates = positionMetricTemplates(result.bestPosition.code);
  const positionMetrics = templates.map((template) => {
    const score = records.length ? template.score(records) : 0;
    return { key: template.key, label: template.label, score, sampleCount: records.length, evidence: template.evidence(records), status: metricStatus(score) };
  });
  const scores = records.map((record) => recordBaseScore(record, result.bestPosition.code));
  const score = round(safeAverage(scores) ?? 0);
  const confidence: ValidationConfidenceV3760 = records.length >= 8 ? 'alta' : records.length >= 3 ? 'moderada' : 'inicial';
  const sorted = [...positionMetrics].sort((a, b) => b.score - a.score);
  const tagCounts = new Map<string, number>();
  records.flatMap((record) => record.tags).forEach((tag) => tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1));
  const repeatedPatterns = [...tagCounts.entries()].filter(([, count]) => count >= 2).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([tag, count]) => `${tag} • ${count} vezes`);
  return {
    samples: records.length,
    score,
    confidence,
    positionMetrics,
    delay,
    repeatedPatterns,
    strengths: sorted.filter((item) => item.score >= 70).slice(0, 3).map((item) => `${item.label}: ${item.score}/100.`),
    weaknesses: [...sorted].reverse().filter((item) => item.score < 67).slice(0, 3).map((item) => `${item.label}: ${item.score}/100.`),
    verdict: !records.length ? 'Registre partidas para iniciar a validação por posição.' : score >= 76 ? 'A ficha está confirmando bom desempenho real nesta posição.' : score >= 62 ? 'A ficha está funcional, mas ainda possui áreas de ajuste.' : 'A amostra indica fragilidades; teste uma mudança por vez antes de substituir a ficha.'
  };
}

function buildAdjustment(result: AnalysisResult, matchAnalysis: MatchAnalysisV3760, learning: UserLearningV3760, experiment: AbExperimentV3760): AdaptiveAdjustmentV3760 {
  const alternatives = result.advancedMotorV3750?.alternatives ?? [];
  let preferredStrategy: AdaptiveAdjustmentV3760['preferredStrategy'] = 'recomendada';
  if (matchAnalysis.delay.level === 'alta') preferredStrategy = 'robustez';
  else if (learning.dominantControlStyle === 'carry-dribble') preferredStrategy = 'identidade';
  else if (learning.dominantControlStyle === 'manual-defense') preferredStrategy = 'função';
  else if (learning.dominantControlStyle === 'mixed') preferredStrategy = 'equilíbrio';
  const preferred = alternatives.find((item) => item.strategy === preferredStrategy) ?? alternatives[0];
  const winningArm = experiment.winner ? experiment.arms.find((arm) => arm.arm === experiment.winner) : null;
  const jointWinner = winningArm ?? result.advancedMotorV3750?.winner;
  const reasons = [
    `Estilo aprendido: ${learning.controlStyleLabel}.`,
    `Sensibilidade ao delay: ${matchAnalysis.delay.level}${matchAnalysis.delay.sensitivity ? ` (${matchAnalysis.delay.sensitivity} pontos)` : ''}.`,
    experiment.winner ? `O braço ${experiment.winner} lidera no laboratório A/B.` : 'O laboratório A/B ainda não confirmou vencedor.',
    matchAnalysis.weaknesses[0] ? `Principal atenção: ${matchAnalysis.weaknesses[0]}` : 'Nenhuma fragilidade forte foi confirmada.'
  ];
  return {
    recommendedBuildId: winningArm?.buildId ?? preferred?.id ?? null,
    recommendedBuildTitle: winningArm?.buildTitle ?? preferred?.title ?? result.buildName,
    recommendedBooster: winningArm?.boosterName ?? jointWinner?.boosterName ?? result.recommendedImpetos[0]?.name ?? 'Sem Booster confirmado',
    preferredStrategy,
    trainingWeightAdjustments: learning.learnedWeights,
    reasons,
    safeguards: [
      'Nenhuma ficha é substituída automaticamente com menos de três partidas por braço.',
      'Delay e conexão são separados do desempenho técnico para evitar diagnóstico incorreto.',
      'A posição escolhida, as habilidades oficiais e o orçamento exato permanecem protegidos.',
      'O aprendizado é vinculado à conta e atua somente como ajuste de desempate.'
    ]
  };
}

export function buildRealValidationV3760(result: AnalysisResult, allRecords: MatchValidationRecord[]): RealValidationV3760Analysis {
  const fingerprint = result.structuralPrecision?.canonical.canonicalId || result.parsed.playerName;
  const exactFingerprint = cardFingerprint(result);
  const exactRecords = allRecords.filter((record) => record.cardFingerprint === exactFingerprint);
  const legacyRecords = allRecords.filter((record) => record.playerName.toLowerCase() === result.parsed.playerName.toLowerCase() && record.targetPosition === result.bestPosition.code);
  const currentRecords = exactRecords.length ? exactRecords : legacyRecords;
  const experiment = buildExperiment(result, currentRecords);
  const matchAnalysis = buildMatchAnalysis(result, currentRecords);
  const userLearning = buildUserLearning(allRecords, matchAnalysis.delay);
  const adjustment = buildAdjustment(result, matchAnalysis, userLearning, experiment);
  return { engineVersion: REAL_VALIDATION_V3760_VERSION, cardFingerprint: fingerprint, experiment, matchAnalysis, userLearning, adjustment };
}

export function formatLearnedWeights(weights: Partial<Record<TrainingKey, number>>) {
  return Object.entries(weights)
    .filter((entry): entry is [TrainingKey, number] => Number(entry[1]) > 0)
    .sort((left, right) => right[1] - left[1])
    .map(([key, value]) => `${TRAINING_LABELS[key]} +${value}`);
}
