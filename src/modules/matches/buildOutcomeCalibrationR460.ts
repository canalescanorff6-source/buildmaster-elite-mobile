import type { AnalysisResult } from '@/lib/analyzerDomain';
import { analysisUsageFunctionR457, analysisUsagePositionR138 } from '@/lib/analysisUsagePositionR138';
import { buildGenerationSignatureR464, cardFingerprintAliasesR457, type MatchPerformanceMetrics, type MatchValidationRecord } from '@/lib/appEvolution';
import { matchReliabilityR135, matchSessionKeyR135 } from './matchEvidenceCalibrationR135';
import { gameVersionWeightR136, recencyWeightR136 } from './matchEvidenceCalibrationR136';
import { readMatchValidationRepositoryR137 } from './matchValidationRepositoryR137';

export const BUILD_OUTCOME_CALIBRATION_R460_VERSION = '40.80-r460-build-outcome-learning-v1' as const;

export type BuildOutcomeActionStatusR460 = 'INSUFFICIENT' | 'MIXED' | 'VALIDATED' | 'PERSISTENT_GAP';

export type BuildOutcomeActionR460 = {
  id: string;
  label: string;
  status: BuildOutcomeActionStatusR460;
  demand: number;
  projectedGain: number;
  projectedScore: number;
  observedScore: number;
  effectiveMatches: number;
  distinctSessions: number;
  confidence: number;
  learningMultiplier: number;
  reason: string;
};

export type BuildOutcomeCalibrationR460 = {
  version: typeof BUILD_OUTCOME_CALIBRATION_R460_VERSION;
  status: 'NO_EVIDENCE' | 'OBSERVE' | 'ACTIVE' | 'CONVERGED' | 'EXPERIMENTING' | 'CONFLICT';
  cardFingerprint: string;
  position: string;
  usageFunction: string;
  evidenceFingerprint: string;
  snapshotMatches: number;
  compatibleMatches: number;
  legacyMatches: number;
  mismatchedFunctionMatches: number;
  distinctSessions: number;
  stableShare: number;
  currentPatchShare: number;
  confidenceScore: number;
  directActionEvidenceRate: number;
  currentGenerationSignatureR464: string;
  generationMatchesR464: number;
  excludedOtherGenerationMatchesR464: number;
  actionLearningMultipliers: Record<string, number>;
  actions: BuildOutcomeActionR460[];
  reasons: string[];
  safeguards: string[];
};

const norm = (value: unknown) => String(value ?? '')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));
const round = (value: number, digits = 2) => Number(value.toFixed(digits));

function stableHash(input: string) {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function ratingScore(value: unknown) {
  const rating = Math.max(1, Math.min(5, Number(value) || 3));
  return (rating - 1) * 25;
}

function per90(record: MatchValidationRecord, key: keyof MatchPerformanceMetrics) {
  const minutes = Math.max(1, Number(record.minutes || 0));
  return Number(record.metrics?.[key] || 0) * 90 / minutes;
}

function metricWasObservedR468(record: MatchValidationRecord, key: keyof MatchPerformanceMetrics) {
  const explicit = record.observedMetricKeysR468;
  if (Array.isArray(explicit)) return explicit.includes(key);
  // legado: antes do R468, somente valor > 0 significava evidência objetiva.
  return Number(record.metrics?.[key] || 0) > 0;
}

function positiveMetricScore(record: MatchValidationRecord, key: keyof MatchPerformanceMetrics, targetPer90: number) {
  if (!metricWasObservedR468(record, key)) return null;
  const raw = Number(record.metrics?.[key] || 0);
  return clamp(per90(record, key) / Math.max(.1, targetPer90), 0, 1.15) * 100 / 1.15;
}

function negativeMetricScore(record: MatchValidationRecord, key: keyof MatchPerformanceMetrics, goodPer90: number, badPer90: number) {
  if (!metricWasObservedR468(record, key)) return null;
  const raw = Number(record.metrics?.[key] || 0);
  const value = per90(record, key);
  if (value <= goodPer90) return 100;
  return (1 - clamp((value - goodPer90) / Math.max(.1, badPer90 - goodPer90))) * 100;
}

const ACTION_OBSERVATION: Record<string, {
  ratings: Array<keyof Pick<MatchValidationRecord, 'passing'|'movement'|'finishing'|'defending'|'physical'|'stamina'>>;
  positive?: Array<[keyof MatchPerformanceMetrics, number]>;
  negative?: Array<[keyof MatchPerformanceMetrics, number, number]>;
}> = {
  attack_space:{ratings:['movement'],positive:[['runsBehind',4],['goals',1]]},
  finish_box:{ratings:['finishing'],positive:[['shotsOnTarget',3],['goals',1]]},
  turn_finish:{ratings:['finishing','movement'],positive:[['shotsOnTarget',2.5],['goals',1]]},
  long_finish:{ratings:['finishing'],positive:[['shotsOnTarget',2.4],['goals',.8]]},
  close_control:{ratings:['movement'],positive:[['dribblesCompleted',4]],negative:[['ballLosses',2,7]]},
  carry:{ratings:['movement','physical'],positive:[['dribblesCompleted',4]],negative:[['ballLosses',2,7]]},
  short_creation:{ratings:['passing'],positive:[['keyPasses',2],['progressivePasses',8]],negative:[['passErrors',1,5]]},
  through_creation:{ratings:['passing'],positive:[['keyPasses',2.2],['progressivePasses',7],['assists',.8]],negative:[['passErrors',1,5]]},
  hold_up:{ratings:['physical','movement'],positive:[['duelsWon',5]],negative:[['ballLosses',2,7]]},
  aerial_finish:{ratings:['finishing','physical'],positive:[['aerialDuelsWon',4],['goals',1]]},
  aerial_defend:{ratings:['defending','physical'],positive:[['aerialDuelsWon',4],['clearances',6],['blocks',2.5]]},
  press_recover:{ratings:['defending','stamina'],positive:[['recoveries',8],['successfulPressures',6],['tackles',3.5]]},
  intercept:{ratings:['defending'],positive:[['interceptions',4],['recoveries',8]]},
  defensive_duel:{ratings:['defending','physical'],positive:[['tackles',4],['duelsWon',5]]},
  cover_space:{ratings:['defending','movement'],positive:[['recoveries',8],['interceptions',3.5]]},
  build_out:{ratings:['passing'],positive:[['progressivePasses',8]],negative:[['passErrors',1,5],['ballLosses',2,7]]},
  cross_support:{ratings:['passing','movement'],positive:[['keyPasses',2],['assists',.8]],negative:[['passErrors',1,5]]},
  set_piece:{ratings:['passing','finishing'],positive:[['shotsOnTarget',2],['keyPasses',1.5]]},
  gk_position:{ratings:['defending','movement'],positive:[['saves',5]],negative:[['goalsConceded',.8,2.8]]},
  gk_reflex:{ratings:['defending'],positive:[['saves',5]],negative:[['goalsConceded',.8,2.8]]},
  gk_secure:{ratings:['defending','physical'],positive:[['saves',5]],negative:[['goalsConceded',.8,2.8]]}
};

function observedActionScore(record: MatchValidationRecord, actionId: string) {
  const directRating = Number(record.actionRatingsR461?.[actionId]);
  const hasDirect = Number.isFinite(directRating) && directRating >= 1 && directRating <= 5;
  const config = ACTION_OBSERVATION[actionId];
  const broadRating = !config
    ? ratingScore(record.overallRating)
    : (config.ratings.map((key) => ratingScore(record[key])).reduce((sum, value) => sum + value, 0) / Math.max(1, config.ratings.length));
  const objective = config ? [
    ...(config.positive ?? []).map(([key, target]) => positiveMetricScore(record, key, target)),
    ...(config.negative ?? []).map(([key, good, bad]) => negativeMetricScore(record, key, good, bad))
  ].filter((value): value is number => value != null && Number.isFinite(value)) : [];
  const objectiveScore = objective.length ? objective.reduce((sum, value) => sum + value, 0) / objective.length : null;
  if (hasDirect) {
    const direct = ratingScore(directRating);
    return {
      score: objectiveScore == null ? direct : direct * .82 + objectiveScore * .18,
      objectiveEvidence: objectiveScore != null,
      directActionEvidence: true
    };
  }
  return {
    score: objectiveScore == null ? broadRating : broadRating * .72 + objectiveScore * .28,
    objectiveEvidence: objectiveScore != null,
    directActionEvidence: false
  };
}

function sanitizeSnapshotActionR460(action: unknown): {id:string;label:string;demand:number;projectedGain:number;projectedScore:number;decisionConfidence:number} | null {
  if (!action || typeof action !== 'object') return null;
  const raw = action as Record<string, unknown>;
  const id = String(raw.id ?? '').trim().slice(0, 64);
  if (!id || !ACTION_OBSERVATION[id]) return null;
  return {
    id,
    label: String(raw.label ?? id).trim().slice(0, 96) || id,
    demand: clamp(Number(raw.demand), 0, 100),
    projectedGain: clamp(Number(raw.projectedGain), -20, 30),
    projectedScore: clamp(Number(raw.projectedScore), 0, 100),
    decisionConfidence: clamp(Number(raw.decisionConfidence), 0, 100)
  };
}

function functionCompatibilityWeight(currentFunction: string, record: MatchValidationRecord) {
  const observed = norm(record.usageFunction);
  if (!observed) return .58; // legado: útil como contexto, nunca como prova dominante.
  return observed === norm(currentFunction) ? 1 : 0;
}

function exactPositionRecords(result: AnalysisResult, records: MatchValidationRecord[]) {
  const aliases = new Set(cardFingerprintAliasesR457(result));
  const position = analysisUsagePositionR138(result);
  return records.filter((record) => aliases.has(record.cardFingerprint) && record.targetPosition === position);
}

function evidenceFingerprintR460(result: AnalysisResult, records: MatchValidationRecord[]) {
  const currentFunction = analysisUsageFunctionR457(result);
  const rows = [...records].sort((a,b)=>String(a.id).localeCompare(String(b.id))).map((record) => [
    record.id, record.playedAt, record.sessionIdR462 ?? '', record.targetPosition, record.usageFunction ?? '', record.buildSignature, record.buildGenerationSignatureR464 ?? '',
    record.connection ?? '', record.inputDelayRating ?? '', record.gameVersion ?? '',
    record.passing, record.movement, record.finishing, record.defending, record.physical, record.stamina,
    JSON.stringify(record.gameplayImpactSnapshotR460 ?? null), JSON.stringify(record.actionRatingsR461 ?? null), JSON.stringify(record.metrics ?? null), JSON.stringify(record.observedMetricKeysR468 ?? null)
  ].join(':')).join('|');
  return `outcome-r460-${stableHash(`${analysisUsagePositionR138(result)}|${norm(currentFunction)}|${rows}`)}`;
}

export function buildBuildOutcomeCalibrationR460(
  result: AnalysisResult,
  allRecords: MatchValidationRecord[] = readMatchValidationRepositoryR137()
): BuildOutcomeCalibrationR460 {
  const usageFunction = analysisUsageFunctionR457(result);
  const exact = exactPositionRecords(result, allRecords);
  const mismatchedFunctionMatches = exact.filter((record) => record.usageFunction && norm(record.usageFunction) !== norm(usageFunction)).length;
  const legacyMatches = exact.filter((record) => !record.usageFunction).length;
  const compatible = exact.filter((record) => functionCompatibilityWeight(usageFunction, record) > 0);
  const currentGenerationSignatureR464 = buildGenerationSignatureR464(result);
  const signedRecordsR464 = compatible.filter((record) => Boolean(record.buildGenerationSignatureR464));
  // Compatibilidade: enquanto só houver histórico legado, preserva R460. Depois da primeira geração assinada,
  // outras gerações deixam de ensinar esta ficha.
  const generationCompatibleR464 = signedRecordsR464.length
    ? compatible.filter((record) => record.buildGenerationSignatureR464 === currentGenerationSignatureR464)
    : compatible;
  const excludedOtherGenerationMatchesR464 = signedRecordsR464.filter((record) => record.buildGenerationSignatureR464 !== currentGenerationSignatureR464).length;
  const recentExperimentRowsR465 = exact.filter((record) => record.experimentArm === 'A' || record.experimentArm === 'B');
  const experimentArmsR465 = new Set(recentExperimentRowsR465.map((record) => record.experimentArm));
  const experimentingR465 = experimentArmsR465.has('A') && experimentArmsR465.has('B');
  const snapshotRecords = generationCompatibleR464.filter((record) => record.gameplayImpactSnapshotR460?.version === '40.80-r460-build-outcome-snapshot-v1');
  const sessions = new Set(snapshotRecords.map(matchSessionKeyR135));

  let totalWeight = 0;
  let stableWeight = 0;
  let currentPatchWeight = 0;
  let objectiveRows = 0;
  let directRows = 0;
  let totalRows = 0;
  const rows = new Map<string, Array<{label:string;demand:number;gain:number;projected:number;observed:number;weight:number;session:string;objective:boolean;direct:boolean}>>();

  for (const record of snapshotRecords) {
    const functionWeight = functionCompatibilityWeight(usageFunction, record);
    if (functionWeight <= 0) continue;
    const baseWeight = matchReliabilityR135(record) * recencyWeightR136(record) * gameVersionWeightR136(record) * functionWeight;
    totalWeight += baseWeight;
    if (record.connection === 'stable') stableWeight += baseWeight;
    if (gameVersionWeightR136(record) >= .88) currentPatchWeight += baseWeight;
    for (const rawAction of record.gameplayImpactSnapshotR460?.actions ?? []) {
      const action = sanitizeSnapshotActionR460(rawAction);
      if (!action || action.demand < 18 || action.decisionConfidence < 45) continue;
      const observed = observedActionScore(record, action.id);
      const demandWeight = .55 + clamp(action.demand / 100) * .45;
      const confidenceWeight = .55 + clamp(action.decisionConfidence / 100) * .45;
      const directWeight = observed.directActionEvidence ? 1.12 : 1;
      const weight = baseWeight * demandWeight * confidenceWeight * directWeight;
      const bucket = rows.get(action.id) ?? [];
      bucket.push({
        label: action.label,
        demand: action.demand,
        gain: action.projectedGain,
        projected: action.projectedScore,
        observed: observed.score,
        weight,
        session: matchSessionKeyR135(record),
        objective: observed.objectiveEvidence,
        direct: observed.directActionEvidence
      });
      rows.set(action.id, bucket);
      totalRows += 1;
      if (observed.objectiveEvidence) objectiveRows += 1;
      if (observed.directActionEvidence) directRows += 1;
    }
  }

  const actionLearningMultipliers: Record<string, number> = {};
  const actions: BuildOutcomeActionR460[] = [];
  for (const [id, actionRows] of rows.entries()) {
    const weight = actionRows.reduce((sum,row)=>sum+row.weight,0);
    if (weight <= 0) continue;
    const weighted = (getter:(row:typeof actionRows[number])=>number) => actionRows.reduce((sum,row)=>sum+getter(row)*row.weight,0)/weight;
    const observed = weighted((row)=>row.observed);
    const demand = weighted((row)=>row.demand);
    const projectedGain = weighted((row)=>row.gain);
    const projectedScore = weighted((row)=>row.projected);
    const distinctSessions = new Set(actionRows.map((row)=>row.session)).size;
    const effectiveMatches = weight;
    const sampleStrength = clamp((effectiveMatches - 1.3) / 3.2);
    const sessionStrength = distinctSessions >= 3 ? 1 : distinctSessions === 2 ? .72 : .25;
    const confidence = clamp(sampleStrength * .55 + sessionStrength * .45);
    const hasEnough = actionRows.length >= 3 && effectiveMatches >= 1.6 && distinctSessions >= 2;
    const persistentGap = hasEnough && projectedGain >= .8 && demand >= 35 && observed < 62;
    const validated = hasEnough && observed >= 72;
    const deficit = clamp((62 - observed) / 32);
    const promised = clamp(projectedGain / 5);
    const adjustment = persistentGap ? Math.min(.06, deficit * promised * confidence * .06) : 0;
    const multiplier = round(1 + adjustment, 4);
    if (multiplier > 1.008) actionLearningMultipliers[id] = multiplier;
    const status: BuildOutcomeActionStatusR460 = !hasEnough ? 'INSUFFICIENT' : persistentGap ? 'PERSISTENT_GAP' : validated ? 'VALIDATED' : 'MIXED';
    actions.push({
      id,
      label: actionRows[0]?.label ?? id,
      status,
      demand: round(demand,1),
      projectedGain: round(projectedGain,1),
      projectedScore: round(projectedScore,1),
      observedScore: round(observed,1),
      effectiveMatches: round(effectiveMatches,2),
      distinctSessions,
      confidence: round(confidence*100,1),
      learningMultiplier: multiplier,
      reason: status === 'PERSISTENT_GAP'
        ? `A ficha prometeu +${round(projectedGain,1)} em ${actionRows[0]?.label ?? id}, mas a execução observada ficou em ${round(observed,1)}/100 após ${distinctSessions} sessões; retorno marginal recebe reforço limitado.`
        : status === 'VALIDATED'
          ? `A ação ${actionRows[0]?.label ?? id} confirmou ${round(observed,1)}/100 em ${distinctSessions} sessões; nenhuma pressão extra é adicionada.`
          : status === 'MIXED'
            ? `A ação ainda não mostrou um padrão consistente entre promessa e resultado.`
            : `Ainda faltam partidas/sessões confiáveis para aprender com ${actionRows[0]?.label ?? id}.`
    });
  }
  actions.sort((a,b)=>b.learningMultiplier-a.learningMultiplier||b.demand-a.demand||a.id.localeCompare(b.id));

  const stableShare = totalWeight > 0 ? stableWeight / totalWeight : 0;
  const currentPatchShare = totalWeight > 0 ? currentPatchWeight / totalWeight : 0;
  const sampleStrength = clamp((totalWeight - 1.5) / 4.5);
  const sessionStrength = sessions.size >= 4 ? 1 : sessions.size === 3 ? .9 : sessions.size === 2 ? .68 : .22;
  const objectiveRate = totalRows ? objectiveRows / totalRows : 0;
  const directActionRate = totalRows ? directRows / totalRows : 0;
  const confidenceScore = Math.round(clamp(sampleStrength*.34 + sessionStrength*.24 + stableShare*.15 + currentPatchShare*.13 + objectiveRate*.05 + directActionRate*.09) * 100);
  const conflictingActionR465 = [...rows.values()].some((actionRows) => {
    const sessionsLow = new Set(actionRows.filter((row) => row.observed < 48).map((row) => row.session)).size;
    const sessionsHigh = new Set(actionRows.filter((row) => row.observed >= 72).map((row) => row.session)).size;
    return sessionsLow >= 1 && sessionsHigh >= 1 && actionRows.length >= 4;
  });
  const active = Object.keys(actionLearningMultipliers).length > 0 && confidenceScore >= 42 && sessions.size >= 2;
  const validatedActions = actions.filter((action) => action.status === 'VALIDATED').length;
  const persistentGaps = actions.filter((action) => action.status === 'PERSISTENT_GAP').length;
  const convergedR465 = sessions.size >= 3 && confidenceScore >= 52 && validatedActions > 0 && persistentGaps === 0;
  const status: BuildOutcomeCalibrationR460['status'] = experimentingR465
    ? 'EXPERIMENTING'
    : conflictingActionR465
      ? 'CONFLICT'
      : !snapshotRecords.length
        ? 'NO_EVIDENCE'
        : convergedR465
          ? 'CONVERGED'
          : active
            ? 'ACTIVE'
            : 'OBSERVE';
  if (status !== 'ACTIVE') Object.keys(actionLearningMultipliers).forEach((key) => delete actionLearningMultipliers[key]);
  const topGap = actions.find((action)=>action.status==='PERSISTENT_GAP');

  return {
    version: BUILD_OUTCOME_CALIBRATION_R460_VERSION,
    status,
    cardFingerprint: [...cardFingerprintAliasesR457(result)][0] ?? '',
    position: analysisUsagePositionR138(result),
    usageFunction,
    evidenceFingerprint: evidenceFingerprintR460(result, exact),
    snapshotMatches: snapshotRecords.length,
    compatibleMatches: compatible.length,
    legacyMatches,
    mismatchedFunctionMatches,
    distinctSessions: sessions.size,
    stableShare: Math.round(stableShare*100),
    currentPatchShare: Math.round(currentPatchShare*100),
    confidenceScore,
    directActionEvidenceRate: Math.round(directActionRate*100),
    currentGenerationSignatureR464,
    generationMatchesR464: generationCompatibleR464.length,
    excludedOtherGenerationMatchesR464,
    actionLearningMultipliers,
    actions,
    reasons: [
      snapshotRecords.length
        ? `${snapshotRecords.length} partida(s) possuem snapshot da promessa da ficha para ${usageFunction}; ${sessions.size} sessão(ões) independentes.`
        : `Ainda não há partidas R460 com snapshot da promessa da ficha para ${usageFunction}.`,
      status === 'EXPERIMENTING' ? 'R465 pausou o aprendizado adaptativo: há A/B ativo para esta carta/posição.'
        : status === 'CONFLICT' ? 'R465 detectou evidência contraditória; nenhuma pressão nova é aplicada até o padrão estabilizar.'
        : status === 'CONVERGED' ? 'R465 confirmou convergência da geração atual; a ficha fica estável e sem pressão extra.'
        : topGap ? topGap.reason : 'Nenhuma ação apresentou falha persistente suficiente para pressionar novamente a ficha.',
      excludedOtherGenerationMatchesR464 ? `${excludedOtherGenerationMatchesR464} partida(s) de outra geração R464 foram excluídas do aprendizado direto.` : 'A geração atual está isolada de fichas anteriores.',
      mismatchedFunctionMatches ? `${mismatchedFunctionMatches} partida(s) da mesma carta/posição foram separadas por terem outra função de uso.` : 'Nenhuma evidência de outra função foi misturada ao aprendizado direto.',
      legacyMatches ? `${legacyMatches} partida(s) antigas sem função explícita continuam disponíveis para histórico geral, mas não comandam o aprendizado promessa × resultado.` : 'Todo o histórico compatível já carrega função explícita.',
      `R461: ${Math.round(directActionRate*100)}% das observações de ação têm nota direta; quando disponível ela prevalece sobre a nota ampla do setor.`
    ],
    safeguards: [
      'R460 aprende apenas com a mesma edição da carta e a mesma posição de uso; função diferente não entra no aprendizado direto.',
      'A previsão usada na comparação é o snapshot salvo no momento da partida, nunca uma previsão recalculada posteriormente.',
      'Somente problemas persistentes após pelo menos três registros e duas sessões podem aumentar retorno marginal, limitado a +6% por ação.',
      'Uma ação validada não recebe bônus artificial nem reduz a demanda estrutural da função; ela apenas deixa de ser pressionada pelo R460.',
      'Delay, recência, versão do jogo e confiabilidade da partida reduzem o peso da evidência.',
      'R460 nunca escolhe PP, Top 5 ou Ímpeto diretamente; o Clean Slate continua sendo o único escritor final.',
      'Overall/GER não participa da calibração.',
      'R461: nota direta de ação é opcional e soberana sobre a nota ampla somente para aquela ação; ausência não é tratada como nota neutra.'
    ]
  };
}

export function attachBuildOutcomeCalibrationR460(result: AnalysisResult): AnalysisResult {
  return { ...result, buildOutcomeCalibrationR460: buildBuildOutcomeCalibrationR460(result) } as AnalysisResult;
}

export function buildOutcomeCalibrationCurrentR460(result: AnalysisResult): boolean {
  const saved = result.buildOutcomeCalibrationR460;
  if (!saved) return false;
  const current = buildBuildOutcomeCalibrationR460(result);
  return saved.version === BUILD_OUTCOME_CALIBRATION_R460_VERSION
    && saved.evidenceFingerprint === current.evidenceFingerprint
    && saved.position === current.position
    && norm(saved.usageFunction) === norm(current.usageFunction);
}
