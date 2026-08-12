import type { AnalysisResult, PositionCode, TrainingPlan } from './analyzerDomain';
import type { MatchValidationMode, MatchValidationRecord } from './appEvolution';
import { cardFingerprint, MATCH_VALIDATION_STORAGE_KEY } from './appEvolution';
import { readAccountStorage, writeAccountStorage } from './accountStorage';
import { trainingPlanTotalCost } from './trainingPlanCore';
import { buildRealGameplayValidationV4050 } from './realGameplayValidationV4050';

export const LONGITUDINAL_GAMEPLAY_V4060_VERSION = '40.60.0' as const;
export const LONGITUDINAL_GAMEPLAY_V4060_MIN_SESSIONS = 3;
export const LONGITUDINAL_GAMEPLAY_V4060_MIN_PAIRED_SESSIONS = 2;
export const LONGITUDINAL_GAMEPLAY_V4060_STORAGE_KEY = 'buildmaster_longitudinal_gameplay_v4060';

type LongitudinalAction = 'COLETAR_SESSOES' | 'MANTER_CAMPEA' | 'VALIDAR_LONGITUDINAL' | 'PROMOVER_LONGITUDINAL' | 'SUSPENDER_POR_DRIFT';
type LongitudinalConfidence = 'INICIAL' | 'MODERADA' | 'ALTA';

export type LongitudinalSessionV4060 = {
  sessionKey: string;
  label: string;
  matches: number;
  effectiveMatches: number;
  modes: MatchValidationMode[];
  stableMatches: number;
  delayedMatches: number;
  armScores: Array<{ id: string; label: string; score: number; observedScore: number | null; effectiveMatches: number }>;
};

export type LongitudinalArmV4060 = {
  id: string;
  label: string;
  rank: number;
  sessionCount: number;
  rawMatches: number;
  effectiveMatches: number;
  longitudinalScore: number;
  consistencyScore: number;
  recentScore: number | null;
  historicalScore: number | null;
  drift: number;
  modeCoverage: number;
  stableSessionRate: number;
  pairedWins: number;
  pairedLosses: number;
  pairedDraws: number;
  pairedWinRate: number;
  medianPairedMargin: number;
  training?: TrainingPlan;
};

export type LongitudinalGameplayV4060Analysis = {
  engineVersion: typeof LONGITUDINAL_GAMEPLAY_V4060_VERSION;
  cardFingerprint: string;
  position: PositionCode;
  mode: 'APRENDIZADO_COMPETITIVO_LONGITUDINAL';
  totalMatches: number;
  distinctSessions: number;
  pairedSessions: number;
  contextsCovered: number;
  currentChampionId: string;
  currentChampionLabel: string;
  leaderId: string | null;
  leaderLabel: string;
  action: LongitudinalAction;
  verifiedWinnerId: string | null;
  verifiedWinnerLabel: string | null;
  confidence: { score: number; level: LongitudinalConfidence; reasons: string[] };
  driftDetected: boolean;
  driftReason: string | null;
  arms: LongitudinalArmV4060[];
  sessions: LongitudinalSessionV4060[];
  verdict: string;
  nextAction: string;
  safeguards: string[];
  guarantees: {
    distinctSessionsRequired: true;
    sameCardAndPositionRequired: true;
    pairedEvidencePreferred: true;
    driftCanSuspendPromotion: true;
    v4050WinnerIsProvisionalUntilLongitudinal: true;
    exactTrainingPlanRequiredForMemory: true;
  };
};

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));
const round = (value: number, digits = 1) => Number(value.toFixed(digits));
const average = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;

function median(values: number[]) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function sessionKey(record: MatchValidationRecord) {
  const parsed = new Date(record.playedAt);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return String(record.playedAt || 'sem-data').slice(0, 10) || 'sem-data';
}

function sessionLabel(key: string) {
  const parsed = new Date(`${key}T12:00:00Z`);
  return Number.isNaN(parsed.getTime()) ? key : parsed.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

function exactRecords(result: AnalysisResult, records: MatchValidationRecord[]) {
  const fingerprint = cardFingerprint(result);
  return records.filter((record) => record.cardFingerprint === fingerprint && record.targetPosition === result.bestPosition.code);
}

function groupSessions(result: AnalysisResult, records: MatchValidationRecord[]): LongitudinalSessionV4060[] {
  const grouped = new Map<string, MatchValidationRecord[]>();
  exactRecords(result, records).forEach((record) => {
    const key = sessionKey(record);
    grouped.set(key, [...(grouped.get(key) ?? []), record]);
  });
  return [...grouped.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, sessionRecords]) => {
      const analysis = buildRealGameplayValidationV4050(result, sessionRecords);
      const modes = [...new Set(sessionRecords.map((record) => record.mode ?? 'ranked'))] as MatchValidationMode[];
      return {
        sessionKey: key,
        label: sessionLabel(key),
        matches: sessionRecords.length,
        effectiveMatches: analysis.effectiveMatches,
        modes,
        stableMatches: sessionRecords.filter((record) => record.connection === 'stable').length,
        delayedMatches: sessionRecords.filter((record) => record.connection === 'high_delay').length,
        armScores: analysis.arms
          .filter((arm) => arm.rawMatches > 0)
          .map((arm) => ({ id: arm.id, label: arm.label, score: arm.posteriorScore, observedScore: arm.observedScore, effectiveMatches: arm.effectiveMatches }))
      };
    });
}

function currentChampion(result: AnalysisResult) {
  const rememberedId = result.longitudinalGameplayMemoryV4060?.applied ? result.longitudinalGameplayMemoryV4060.winnerId : null;
  const alternative = result.maximumPerformanceV4040?.alternatives.find((item) => item.id === rememberedId)
    ?? result.maximumPerformanceV4040?.alternatives?.[0];
  return {
    id: alternative?.id ?? 'CURRENT',
    label: alternative?.label ?? 'Ficha principal',
    training: alternative?.training ?? result.maximumPerformanceV4040?.finalTraining ?? result.training
  };
}

function buildLongitudinalArm(result: AnalysisResult, records: MatchValidationRecord[], sessions: LongitudinalSessionV4060[], armId: string, armLabel: string, rank: number, championId: string): LongitudinalArmV4060 {
  const exact = exactRecords(result, records).filter((record) => {
    if (record.testedBuildId === armId) return true;
    if (!record.testedBuildId && rank === 1) return true;
    if (record.experimentArm === 'A' && rank === 1 && !String(record.testedBuildId ?? '').startsWith('MAXIMO_')) return true;
    if (record.experimentArm === 'B' && rank === 2 && !String(record.testedBuildId ?? '').startsWith('MAXIMO_')) return true;
    return false;
  });
  const scoreRows = sessions.flatMap((session, index) => {
    const arm = session.armScores.find((item) => item.id === armId);
    if (!arm || arm.observedScore == null) return [];
    const recencyWeight = Math.pow(.94, Math.max(0, sessions.length - 1 - index));
    const evidenceWeight = Math.max(.4, Math.min(2.5, Math.sqrt(Math.max(.15, arm.effectiveMatches))));
    return [{ session, value: arm.observedScore, weight: recencyWeight * evidenceWeight }];
  });
  const weight = scoreRows.reduce((sum, row) => sum + row.weight, 0);
  const longitudinalScore = weight > 0 ? scoreRows.reduce((sum, row) => sum + row.value * row.weight, 0) / weight : 0;
  const variance = weight > 0 ? scoreRows.reduce((sum, row) => sum + row.weight * Math.pow(row.value - longitudinalScore, 2), 0) / weight : 0;
  const stddev = Math.sqrt(variance);
  const consistencyScore = clamp(100 - stddev * 5.5);
  const recentRows = scoreRows.slice(-2);
  const historicalRows = scoreRows.slice(0, Math.max(0, scoreRows.length - 2));
  const recentScore = recentRows.length ? average(recentRows.map((row) => row.value)) : null;
  const historicalScore = historicalRows.length ? average(historicalRows.map((row) => row.value)) : null;
  const drift = recentScore != null && historicalScore != null ? round(recentScore - historicalScore) : 0;
  const modes = new Set(exact.map((record) => record.mode ?? 'ranked'));
  const armSessions = new Set(exact.map(sessionKey));
  const stableSessions = [...armSessions].filter((key) => exact.some((record) => sessionKey(record) === key && record.connection === 'stable')).length;
  const pairedMargins: number[] = [];
  let pairedWins = 0;
  let pairedLosses = 0;
  let pairedDraws = 0;
  sessions.forEach((session) => {
    const arm = session.armScores.find((item) => item.id === armId && item.observedScore != null);
    const champion = session.armScores.find((item) => item.id === championId && item.observedScore != null);
    if (!arm || !champion || arm.id === champion.id || arm.observedScore == null || champion.observedScore == null) return;
    const margin = arm.observedScore - champion.observedScore;
    pairedMargins.push(margin);
    if (margin >= 1.2) pairedWins += 1;
    else if (margin <= -1.2) pairedLosses += 1;
    else pairedDraws += 1;
  });
  const pairedTotal = pairedWins + pairedLosses + pairedDraws;
  const candidate = result.maximumPerformanceV4040?.alternatives.find((item) => item.id === armId);
  return {
    id: armId,
    label: armLabel,
    rank,
    sessionCount: armSessions.size,
    rawMatches: exact.length,
    effectiveMatches: round(scoreRows.reduce((sum, row) => sum + Math.min(1, row.session.effectiveMatches), 0), 2),
    longitudinalScore: round(longitudinalScore),
    consistencyScore: round(consistencyScore),
    recentScore: recentScore == null ? null : round(recentScore),
    historicalScore: historicalScore == null ? null : round(historicalScore),
    drift,
    modeCoverage: modes.size,
    stableSessionRate: armSessions.size ? round(stableSessions / armSessions.size * 100) : 0,
    pairedWins,
    pairedLosses,
    pairedDraws,
    pairedWinRate: pairedTotal ? round((pairedWins + pairedDraws * .5) / pairedTotal * 100) : 0,
    medianPairedMargin: round(median(pairedMargins)),
    training: candidate?.training
  };
}

export function buildLongitudinalGameplayV4060(result: AnalysisResult, allRecords: MatchValidationRecord[]): LongitudinalGameplayV4060Analysis {
  const records = exactRecords(result, allRecords);
  const sessions = groupSessions(result, allRecords);
  const base = buildRealGameplayValidationV4050(result, allRecords);
  const champion = currentChampion(result);
  const alternatives = result.maximumPerformanceV4040?.alternatives?.length
    ? result.maximumPerformanceV4040.alternatives.map((item, index) => ({ id: item.id, label: item.label, rank: index + 1 }))
    : base.arms.map((arm) => ({ id: arm.id, label: arm.label, rank: arm.rank }));
  const arms = alternatives.map((item) => buildLongitudinalArm(result, allRecords, sessions, item.id, item.label, item.rank, champion.id))
    .sort((a, b) => b.longitudinalScore - a.longitudinalScore || b.consistencyScore - a.consistencyScore || a.rank - b.rank);
  const leader = arms[0] ?? null;
  const leaderIsChampion = leader?.id === champion.id;
  const pairedSessions = leader && !leaderIsChampion ? leader.pairedWins + leader.pairedLosses + leader.pairedDraws : 0;
  const contextsCovered = new Set(records.map((record) => record.mode ?? 'ranked')).size;
  const driftDetected = Boolean(leader && leader.sessionCount >= LONGITUDINAL_GAMEPLAY_V4060_MIN_SESSIONS && Math.abs(leader.drift) >= 7.5);
  const driftReason = driftDetected && leader
    ? `As duas sessões mais recentes diferem ${Math.abs(leader.drift).toFixed(1)} ponto(s) do histórico anterior da mesma ficha.`
    : null;
  const enoughSessions = Boolean(leader && leader.sessionCount >= LONGITUDINAL_GAMEPLAY_V4060_MIN_SESSIONS);
  const enoughPaired = leaderIsChampion || pairedSessions >= LONGITUDINAL_GAMEPLAY_V4060_MIN_PAIRED_SESSIONS;
  const longitudinalAdvantage = Boolean(leader && (leaderIsChampion || (leader.pairedWinRate >= 66 && leader.medianPairedMargin >= 2 && leader.consistencyScore >= 68)));
  const v4050SupportsLeader = base.verifiedWinnerId === leader?.id && base.confidence.level === 'ALTA';
  const promotionReady = Boolean(leader && !leaderIsChampion && enoughSessions && enoughPaired && longitudinalAdvantage && v4050SupportsLeader && !driftDetected);

  const sessionScore = clamp((sessions.length / 5) * 100);
  const pairedScore = leaderIsChampion ? 85 : clamp((pairedSessions / 3) * 100);
  const consistency = leader?.consistencyScore ?? 0;
  const contextScore = clamp(contextsCovered / 3 * 100);
  const evidenceScore = base.confidence.score;
  const confidenceScore = round(sessionScore * .28 + pairedScore * .22 + consistency * .2 + contextScore * .12 + evidenceScore * .18);
  const confidenceLevel: LongitudinalConfidence = confidenceScore >= 78 && enoughSessions && enoughPaired ? 'ALTA' : confidenceScore >= 50 ? 'MODERADA' : 'INICIAL';

  let action: LongitudinalAction = 'COLETAR_SESSOES';
  let verifiedWinnerId: string | null = null;
  if (driftDetected) action = 'SUSPENDER_POR_DRIFT';
  else if (promotionReady && leader) {
    action = 'PROMOVER_LONGITUDINAL';
    verifiedWinnerId = leader.id;
  } else if (leaderIsChampion && enoughSessions && base.verifiedWinnerId === champion.id) {
    action = 'MANTER_CAMPEA';
    verifiedWinnerId = champion.id;
  } else if (enoughSessions && leader && !leaderIsChampion) action = 'VALIDAR_LONGITUDINAL';

  const verdict = !records.length
    ? 'Ainda não há partidas desta carta nesta posição. A ficha Pareto permanece como campeã provisória.'
    : driftDetected
      ? `A promoção foi suspensa por mudança recente de comportamento. ${driftReason}`
      : promotionReady && leader
        ? `${leader.label} repetiu a vantagem em ${leader.sessionCount} sessão(ões), venceu ${leader.pairedWins} comparação(ões) pareada(s) e passou pela validação longitudinal.`
        : leaderIsChampion && enoughSessions
          ? `${champion.label} continua estável ao longo de ${leader?.sessionCount ?? 0} sessão(ões); não há evidência longitudinal suficiente para substituí-la.`
          : `${records.length} partida(s) foram distribuídas em ${sessions.length} sessão(ões). A v40.60 pode apontar um vencedor provisório, mas a v40.60 ainda exige repetição em dias/sessões diferentes.`;

  const nextAction = action === 'PROMOVER_LONGITUDINAL'
    ? `A vencedora ${leader?.label ?? ''} pode virar memória competitiva permanente desta carta/posição.`
    : action === 'SUSPENDER_POR_DRIFT'
      ? 'Não promova nem descarte a ficha agora. Faça novas sessões em conexão estável para confirmar se a mudança recente é real.'
      : action === 'VALIDAR_LONGITUDINAL'
        ? `Repita o A/B em pelo menos ${Math.max(0, LONGITUDINAL_GAMEPLAY_V4060_MIN_PAIRED_SESSIONS - pairedSessions)} sessão(ões) comparável(is), mantendo modo e condições semelhantes.`
        : `Colete partidas em pelo menos ${Math.max(0, LONGITUDINAL_GAMEPLAY_V4060_MIN_SESSIONS - (leader?.sessionCount ?? 0))} nova(s) sessão(ões)/dia(s), sem concentrar toda a evidência no mesmo momento.`;

  return {
    engineVersion: LONGITUDINAL_GAMEPLAY_V4060_VERSION,
    cardFingerprint: cardFingerprint(result),
    position: result.bestPosition.code,
    mode: 'APRENDIZADO_COMPETITIVO_LONGITUDINAL',
    totalMatches: records.length,
    distinctSessions: sessions.length,
    pairedSessions,
    contextsCovered,
    currentChampionId: champion.id,
    currentChampionLabel: champion.label,
    leaderId: leader?.id ?? null,
    leaderLabel: leader?.label ?? 'Sem líder longitudinal',
    action,
    verifiedWinnerId,
    verifiedWinnerLabel: verifiedWinnerId ? arms.find((arm) => arm.id === verifiedWinnerId)?.label ?? null : null,
    confidence: {
      score: confidenceScore,
      level: confidenceLevel,
      reasons: [
        `${sessions.length} sessão(ões) distintas e ${records.length} partida(s) da mesma carta/posição.`,
        `${pairedSessions} sessão(ões) com comparação pareada entre líder e campeã atual.`,
        `Consistência longitudinal do líder: ${Math.round(leader?.consistencyScore ?? 0)}/100.`,
        `${contextsCovered} contexto(s) coberto(s); a evidência v40.60 entra com peso, mas não decide sozinha.`
      ]
    },
    driftDetected,
    driftReason,
    arms,
    sessions,
    verdict,
    nextAction,
    safeguards: [
      `A vencedora da v40.60 é provisória até repetir vantagem em pelo menos ${LONGITUDINAL_GAMEPLAY_V4060_MIN_SESSIONS} sessões distintas.`,
      `Uma alternativa precisa de pelo menos ${LONGITUDINAL_GAMEPLAY_V4060_MIN_PAIRED_SESSIONS} sessões pareadas contra a campeã atual para promoção longitudinal.`,
      'A memória é exclusiva da carta exata e posição exata; outra versão da carta não herda o aprendizado.',
      'Mudança brusca entre histórico e sessões recentes suspende promoção para evitar memória obsoleta.',
      'A ficha salva só é reaplicada se a mesma alternativa e a mesma distribuição continuarem existindo no motor Pareto atual.'
    ],
    guarantees: {
      distinctSessionsRequired: true,
      sameCardAndPositionRequired: true,
      pairedEvidencePreferred: true,
      driftCanSuspendPromotion: true,
      v4050WinnerIsProvisionalUntilLongitudinal: true,
      exactTrainingPlanRequiredForMemory: true
    }
  };
}

type LongitudinalMemoryEntryV4060 = {
  engineVersion: typeof LONGITUDINAL_GAMEPLAY_V4060_VERSION;
  cardFingerprint: string;
  position: PositionCode;
  winnerId: string;
  winnerLabel: string;
  training: TrainingPlan;
  confidenceScore: number;
  sessions: number;
  pairedSessions: number;
  rawMatches: number;
  consistencyScore: number;
  verifiedAt: string;
};

type LongitudinalMemoryEnvelopeV4060 = {
  version: typeof LONGITUDINAL_GAMEPLAY_V4060_VERSION;
  entries: LongitudinalMemoryEntryV4060[];
};

function readMemory(): LongitudinalMemoryEnvelopeV4060 {
  try {
    const raw = readAccountStorage(LONGITUDINAL_GAMEPLAY_V4060_STORAGE_KEY, { migrateLegacy: false });
    if (!raw) return { version: LONGITUDINAL_GAMEPLAY_V4060_VERSION, entries: [] };
    const parsed = JSON.parse(raw) as Partial<LongitudinalMemoryEnvelopeV4060>;
    const entries = Array.isArray(parsed.entries)
      ? parsed.entries.filter((entry): entry is LongitudinalMemoryEntryV4060 => Boolean(entry && entry.engineVersion === LONGITUDINAL_GAMEPLAY_V4060_VERSION && entry.cardFingerprint && entry.winnerId && entry.training))
      : [];
    return { version: LONGITUDINAL_GAMEPLAY_V4060_VERSION, entries: entries.slice(0, 240) };
  } catch {
    return { version: LONGITUDINAL_GAMEPLAY_V4060_VERSION, entries: [] };
  }
}


function readMatchHistoryForSelfHealV4060(): MatchValidationRecord[] {
  try {
    const raw = readAccountStorage(MATCH_VALIDATION_STORAGE_KEY, { migrateLegacy: false });
    if (!raw) return [];
    const parsed = JSON.parse(raw) as MatchValidationRecord[];
    return Array.isArray(parsed) ? parsed.slice(0, 1000) : [];
  } catch {
    return [];
  }
}

function writeMemory(envelope: LongitudinalMemoryEnvelopeV4060) {
  try {
    writeAccountStorage(LONGITUDINAL_GAMEPLAY_V4060_STORAGE_KEY, JSON.stringify({ ...envelope, entries: envelope.entries.slice(0, 240) }));
  } catch {
    // Aprendizado longitudinal nunca pode bloquear a geração da ficha.
  }
}

export function persistLongitudinalWinnerV4060(result: AnalysisResult, analysis: LongitudinalGameplayV4060Analysis) {
  if (!analysis.verifiedWinnerId || analysis.confidence.level !== 'ALTA' || analysis.driftDetected) return false;
  const candidate = result.maximumPerformanceV4040?.alternatives.find((item) => item.id === analysis.verifiedWinnerId);
  const arm = analysis.arms.find((item) => item.id === analysis.verifiedWinnerId);
  if (!candidate || !arm?.training) return false;
  if (JSON.stringify(candidate.training) !== JSON.stringify(arm.training)) return false;
  if (trainingPlanTotalCost(candidate.training) !== result.trainingPointsTotal) return false;
  const entry: LongitudinalMemoryEntryV4060 = {
    engineVersion: LONGITUDINAL_GAMEPLAY_V4060_VERSION,
    cardFingerprint: analysis.cardFingerprint,
    position: result.bestPosition.code,
    winnerId: candidate.id,
    winnerLabel: candidate.label,
    training: { ...candidate.training },
    confidenceScore: analysis.confidence.score,
    sessions: arm.sessionCount,
    pairedSessions: analysis.pairedSessions,
    rawMatches: arm.rawMatches,
    consistencyScore: arm.consistencyScore,
    verifiedAt: new Date().toISOString()
  };
  const memory = readMemory();
  const entries = [entry, ...memory.entries.filter((item) => !(item.cardFingerprint === entry.cardFingerprint && item.position === entry.position))];
  writeMemory({ version: LONGITUDINAL_GAMEPLAY_V4060_VERSION, entries });
  return true;
}

export function applyLongitudinalWinnerV4060(result: AnalysisResult): AnalysisResult {
  if (result.objective !== 'COMPETITIVE' || !result.maximumPerformanceV4040) return result;
  const fingerprint = cardFingerprint(result);
  let entry = readMemory().entries.find((item) => item.cardFingerprint === fingerprint && item.position === result.bestPosition.code);
  if (!entry) {
    const recovered = buildLongitudinalGameplayV4060(result, readMatchHistoryForSelfHealV4060());
    if (persistLongitudinalWinnerV4060(result, recovered)) {
      entry = readMemory().entries.find((item) => item.cardFingerprint === fingerprint && item.position === result.bestPosition.code);
    }
  }
  if (!entry) {
    if (!result.gameplayValidationMemoryV4050?.applied) return result;
    const fallback = result.maximumPerformanceV4040.finalTraining;
    const used = trainingPlanTotalCost(fallback);
    return {
      ...result,
      training: { ...fallback },
      trainingPointsUsed: used,
      trainingPointsRemaining: Math.max(0, result.trainingPointsTotal - used),
      buildName: `Ficha Automática v40.60 — Pareto até validação longitudinal — ${result.parsed.playerName}`,
      recommendationExplanation: [
        'A v40.60 encontrou um vencedor A/B provisório, mas a v40.60 exige repetição em sessões distintas antes de tornar a mudança permanente.',
        ...result.recommendationExplanation
      ].filter((item, index, all) => all.indexOf(item) === index).slice(0, 32),
      note: `${result.note} v40.60: promoção v40.60 mantida como evidência provisória; a ficha Pareto permanece aplicada até validação longitudinal.`,
      longitudinalGameplayMemoryV4060: {
        engineVersion: LONGITUDINAL_GAMEPLAY_V4060_VERSION,
        applied: false,
        provisionalV4050Blocked: true,
        winnerId: null,
        winnerLabel: null,
        confidenceScore: 0,
        sessions: 0,
        pairedSessions: 0,
        verifiedAt: null
      }
    };
  }
  const candidate = result.maximumPerformanceV4040.alternatives.find((item) => item.id === entry.winnerId);
  if (!candidate || JSON.stringify(candidate.training) !== JSON.stringify(entry.training) || trainingPlanTotalCost(entry.training) !== result.trainingPointsTotal) {
    const fallback = result.maximumPerformanceV4040.finalTraining;
    const used = trainingPlanTotalCost(fallback);
    return {
      ...result,
      training: { ...fallback },
      trainingPointsUsed: used,
      trainingPointsRemaining: Math.max(0, result.trainingPointsTotal - used),
      buildName: `Ficha Automática v40.60 — Memória longitudinal em revisão — ${result.parsed.playerName}`,
      recommendationExplanation: [
        'A memória longitudinal salva deixou de coincidir com o Pareto atual e foi suspensa. A ficha campeã atual voltou a ser a referência até nova validação.',
        ...result.recommendationExplanation
      ].filter((item, index, all) => all.indexOf(item) === index).slice(0, 32),
      longitudinalGameplayMemoryV4060: {
        engineVersion: LONGITUDINAL_GAMEPLAY_V4060_VERSION,
        applied: false,
        provisionalV4050Blocked: Boolean(result.gameplayValidationMemoryV4050?.applied),
        winnerId: null,
        winnerLabel: null,
        confidenceScore: 0,
        sessions: 0,
        pairedSessions: 0,
        verifiedAt: null
      }
    };
  }
  const used = trainingPlanTotalCost(entry.training);
  return {
    ...result,
    training: { ...entry.training },
    trainingPointsUsed: used,
    trainingPointsRemaining: Math.max(0, result.trainingPointsTotal - used),
    buildName: `Ficha Automática v40.60 — Aprendizado Competitivo — ${entry.winnerLabel} — ${result.parsed.playerName}`,
    recommendationExplanation: [
      `Aprendizado longitudinal v40.60 reaplicou ${entry.winnerLabel}: ${entry.sessions} sessões, ${entry.pairedSessions} sessões pareadas, consistência ${Math.round(entry.consistencyScore)}/100 e confiança ${Math.round(entry.confidenceScore)}/100.`,
      'A memória só continua válida porque a mesma alternativa e a mesma distribuição ainda existem no Pareto atual.',
      ...result.recommendationExplanation
    ].filter((item, index, all) => all.indexOf(item) === index).slice(0, 32),
    strengths: [
      'A ficha aplicada foi confirmada em várias sessões, reduzindo o risco de overfitting a um único dia ou condição de conexão.',
      ...result.strengths
    ].filter((item, index, all) => all.indexOf(item) === index).slice(0, 18),
    note: `${result.note} Aprendizado v40.60: ${entry.winnerLabel} validada longitudinalmente e reaplicada somente enquanto a receita Pareto permanecer idêntica.`,
    longitudinalGameplayMemoryV4060: {
      engineVersion: LONGITUDINAL_GAMEPLAY_V4060_VERSION,
      applied: true,
      provisionalV4050Blocked: false,
      winnerId: entry.winnerId,
      winnerLabel: entry.winnerLabel,
      confidenceScore: entry.confidenceScore,
      sessions: entry.sessions,
      pairedSessions: entry.pairedSessions,
      verifiedAt: entry.verifiedAt
    }
  };
}
