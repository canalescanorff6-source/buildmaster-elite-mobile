import type { AnalysisResult, CompetitiveFusionSummary, PositionCode, TrainingKey, TrainingPlan } from './analyzerDomain';
import { readAccountStorage } from './accountStorage';
import {
  CREATOR_TRAINING_KEYS,
  buildCreatorBuildConsensus,
  creatorTrainingCost,
  loadCreatorBuildSources,
  type CreatorBuildSource
} from './creatorBuildResearch';
import { CALIBRATION_STORAGE_KEY } from '@/modules/matches/calibrationStorage';
import type { MatchFeedback } from './realMatchCalibration';

export const COMPETITIVE_FUSION_EVENT = 'buildmaster:competitive-fusion-updated';

const LINE_KEYS: TrainingKey[] = ['shooting', 'passing', 'dribbling', 'dexterity', 'lowerBodyStrength', 'aerialStrength', 'defending'];
const GK_KEYS: TrainingKey[] = ['gk1', 'gk2', 'gk3', 'aerialStrength', 'lowerBodyStrength'];

function clone(plan: TrainingPlan): TrainingPlan { return { ...plan }; }
function clamp(value: number, min = 0, max = 16): number { return Math.max(min, Math.min(max, Math.round(value))); }

function rolePriority(position: PositionCode): Record<TrainingKey, number> {
  const common: Record<TrainingKey, number> = {
    shooting: 3, passing: 4, dribbling: 4, dexterity: 5, lowerBodyStrength: 5,
    aerialStrength: 3, defending: 2, gk1: 0, gk2: 0, gk3: 0
  };
  if (position === 'GK') return { ...common, shooting: 0, passing: 0, dribbling: 0, dexterity: 1, lowerBodyStrength: 4, aerialStrength: 5, defending: 0, gk1: 8, gk2: 9, gk3: 8 };
  if (['CB', 'LB', 'RB', 'DMF'].includes(position)) return { ...common, shooting: 1, passing: 5, dribbling: 2, dexterity: 5, lowerBodyStrength: 6, aerialStrength: position === 'CB' ? 7 : 4, defending: 9 };
  if (['CMF', 'AMF', 'LMF', 'RMF'].includes(position)) return { ...common, shooting: 4, passing: 8, dribbling: 6, dexterity: 7, lowerBodyStrength: 5, aerialStrength: 2, defending: position === 'CMF' ? 4 : 2 };
  if (['LWF', 'RWF', 'SS'].includes(position)) return { ...common, shooting: 7, passing: 6, dribbling: 8, dexterity: 9, lowerBodyStrength: 6, aerialStrength: 2, defending: 1 };
  return { ...common, shooting: 9, passing: 4, dribbling: 5, dexterity: 8, lowerBodyStrength: 7, aerialStrength: 6, defending: 1 };
}

function loadFeedbacks(result: AnalysisResult): MatchFeedback[] {
  try {
    const raw = readAccountStorage(CALIBRATION_STORAGE_KEY);
    const all = raw ? JSON.parse(raw) as Record<string, MatchFeedback[]> : {};
    const key = `${result.parsed.internalId}:${result.bestPosition.code}`;
    return Array.isArray(all[key]) ? all[key].slice(0, 20) : [];
  } catch { return []; }
}

function signalRate(feedbacks: MatchFeedback[], key: keyof MatchFeedback): number {
  if (!feedbacks.length) return 0;
  return feedbacks.filter((item) => Boolean(item[key])).length / feedbacks.length;
}

function personalAdjustments(result: AnalysisResult, feedbacks: MatchFeedback[]): Array<{ key: TrainingKey; delta: number; reason: string }> {
  if (feedbacks.length < 3) return [];
  const adjustments: Array<{ key: TrainingKey; delta: number; reason: string }> = [];
  const add = (key: TrainingKey, reason: string, threshold: number, signal: keyof MatchFeedback) => {
    const rate = signalRate(feedbacks, signal);
    if (rate >= threshold) adjustments.push({ key, delta: 1, reason: `${reason} (${Math.round(rate * 100)}% dos registros)` });
  };
  add('passing', 'Erros de passe repetidos pedem mais segurança na circulação', 0.4, 'missedPasses');
  add('dexterity', 'Sensação de lentidão pede resposta mais rápida no giro e arranque', 0.4, 'feltSlow');
  add('shooting', 'Finalizações abaixo do esperado pedem correção controlada', 0.4, 'finishedPoorly');
  add('lowerBodyStrength', 'Queda física recorrente pede mais sustentação e resistência', 0.4, 'tiredEarly');
  if (signalRate(feedbacks, 'lackedPhysical') >= 0.4) {
    adjustments.push({ key: ['CB', 'CF', 'DMF'].includes(result.bestPosition.code) ? 'aerialStrength' : 'lowerBodyStrength', delta: 1, reason: 'Perda frequente de duelos físicos detectada no histórico' });
  }
  if (signalRate(feedbacks, 'outOfPosition') >= 0.4) {
    adjustments.push({ key: ['CB', 'LB', 'RB', 'DMF'].includes(result.bestPosition.code) ? 'defending' : 'dexterity', delta: 1, reason: 'Posicionamento inconsistente apareceu em várias partidas' });
  }
  return adjustments.slice(0, 3);
}

function activeKeys(position: PositionCode): TrainingKey[] { return position === 'GK' ? GK_KEYS : LINE_KEYS; }

function normalizeToBudget(plan: TrainingPlan, base: TrainingPlan, budget: number, position: PositionCode, protectedKeys: Set<TrainingKey>): TrainingPlan {
  const next = clone(plan);
  const priorities = rolePriority(position);
  const keys = activeKeys(position);
  let guard = 0;
  while (creatorTrainingCost(next).totalCost > budget && guard < 300) {
    guard += 1;
    const candidates = keys
      .filter((key) => next[key] > 0)
      .sort((a, b) => {
        const aProtection = protectedKeys.has(a) ? 100 : 0;
        const bProtection = protectedKeys.has(b) ? 100 : 0;
        const aAboveBase = next[a] > base[a] ? -20 : 0;
        const bAboveBase = next[b] > base[b] ? -20 : 0;
        return (priorities[a] + aProtection + aAboveBase) - (priorities[b] + bProtection + bAboveBase);
      });
    const key = candidates[0];
    if (!key) break;
    next[key] = Math.max(0, next[key] - 1);
  }
  return next;
}

function fillSafeRemainder(plan: TrainingPlan, base: TrainingPlan, target: TrainingPlan, budget: number, position: PositionCode): TrainingPlan {
  const next = clone(plan);
  const priorities = rolePriority(position);
  const keys = activeKeys(position).sort((a, b) => priorities[b] - priorities[a]);
  let guard = 0;
  while (guard < 100) {
    guard += 1;
    let changed = false;
    for (const key of keys) {
      const desired = Math.max(base[key], target[key]);
      if (next[key] >= desired || next[key] >= 16) continue;
      const candidate = clone(next); candidate[key] += 1;
      if (creatorTrainingCost(candidate).totalCost <= budget) { Object.assign(next, candidate); changed = true; break; }
    }
    if (!changed) break;
  }
  return next;
}

function sourceNames(sources: CreatorBuildSource[]): string[] {
  return [...new Set(sources.map((source) => source.channel).filter(Boolean))].slice(0, 6);
}

export function applyCompetitiveFusionToResult(result: AnalysisResult): AnalysisResult {
  const sourceBase = result.competitiveFusion?.baseTraining ?? result.training;
  const base = clone(sourceBase);
  const sources = loadCreatorBuildSources();
  const consensus = buildCreatorBuildConsensus({ ...result, training: base }, sources);
  const feedbacks = loadFeedbacks(result);
  const adjustments = personalAdjustments(result, feedbacks);
  const strongConsensus = consensus.exactCardCount >= 3 && consensus.proSourceCount >= 2 && consensus.confidence >= 82;
  const moderateConsensus = consensus.exactCardCount >= 2 && consensus.sourceCount >= 2 && consensus.confidence >= 62;
  const singleEliteReference = consensus.exactCardCount >= 1 && consensus.proSourceCount >= 1 && consensus.confidence >= 55;
  const creatorWeight = strongConsensus ? 0.34 : moderateConsensus ? 0.22 : singleEliteReference ? 0.10 : 0;
  const maxDelta = strongConsensus ? 2 : 1;
  const target = clone(base);
  const allowed = new Set(activeKeys(result.bestPosition.code));
  if (creatorWeight > 0) {
    for (const key of CREATOR_TRAINING_KEYS) {
      if (!allowed.has(key)) { target[key] = 0; continue; }
      const blended = Math.round(base[key] * (1 - creatorWeight) + consensus.training[key] * creatorWeight);
      target[key] = clamp(blended, Math.max(0, base[key] - maxDelta), Math.min(16, base[key] + maxDelta));
    }
  }
  const protectedKeys = new Set<TrainingKey>();
  for (const adjustment of adjustments) {
    if (!allowed.has(adjustment.key)) continue;
    target[adjustment.key] = clamp(target[adjustment.key] + adjustment.delta, 0, Math.min(16, base[adjustment.key] + 2));
    protectedKeys.add(adjustment.key);
  }
  let finalTraining = normalizeToBudget(target, base, result.trainingPointsTotal, result.bestPosition.code, protectedKeys);
  finalTraining = fillSafeRemainder(finalTraining, base, target, result.trainingPointsTotal, result.bestPosition.code);
  const cost = creatorTrainingCost(finalTraining);
  const differences = CREATOR_TRAINING_KEYS
    .filter((key) => finalTraining[key] !== base[key])
    .map((key) => ({ key, from: base[key], to: finalTraining[key] }));
  const reasons: string[] = [];
  if (creatorWeight > 0) reasons.push(`Consenso profissional aplicado com influência limitada de ${Math.round(creatorWeight * 100)}%.`);
  else if (consensus.sourceCount) reasons.push('Referências externas mantidas apenas como comparação porque faltou evidência exata suficiente.');
  else reasons.push('Motor próprio preservado: nenhuma ficha externa auditável da carta exata foi registrada.');
  if (adjustments.length) reasons.push(...adjustments.map((item) => item.reason));
  else reasons.push(feedbacks.length >= 3 ? 'O histórico não mostrou um problema repetido forte o bastante para alterar a ficha.' : 'A personalização por partidas será liberada após pelo menos três registros comparáveis.');
  reasons.push('Limite anti-descaracterização ativo: nenhuma área muda mais de um nível sem consenso profissional forte.');

  const evidenceScore = Math.min(100,
    42 + Math.round(consensus.confidence * 0.28) + Math.min(18, consensus.exactCardCount * 6) + Math.min(12, feedbacks.length * 2)
  );
  const confidenceLabel = evidenceScore >= 86 ? 'muito alta' : evidenceScore >= 72 ? 'alta' : evidenceScore >= 55 ? 'média' : 'controlada';
  const accepted = consensus.acceptedSources.map((match) => match.source);
  const summary: CompetitiveFusionSummary = {
    engineVersion: '30.10-world-fusion-1',
    baseTraining: base,
    finalTraining,
    professionalInfluence: Math.round(creatorWeight * 100),
    personalMatchSamples: feedbacks.length,
    sourceCount: consensus.sourceCount,
    exactCardCount: consensus.exactCardCount,
    proSourceCount: consensus.proSourceCount,
    confidence: evidenceScore,
    confidenceLabel,
    reasons: reasons.slice(0, 6),
    guardrails: [
      'Só usa referência externa com compatibilidade de carta auditada.',
      'Respeita o orçamento real de pontos.',
      'Não copia cegamente uma única ficha.',
      'Preserva posição escolhida, identidade e pontos fortes naturais.'
    ],
    sourceNames: sourceNames(accepted),
    differences
  };

  const qualityBase = Math.round(result.buildVariants[0]?.qualityScore ?? result.bestPosition.score ?? 0);
  const definitiveVariant = {
    kind: 'competitive' as const,
    title: 'Ficha Competitiva Definitiva — Motor Mundial',
    positionLabel: result.bestPosition.label,
    training: finalTraining,
    pointsUsed: cost.totalCost,
    note: reasons.slice(0, 3).join(' '),
    qualityScore: Math.min(100, qualityBase + (creatorWeight > 0 ? 2 : 0) + (adjustments.length ? 1 : 0)),
    adaptationLabel: confidenceLabel,
    highlights: reasons.slice(0, 3),
    risks: consensus.warnings.slice(0, 3),
    verdict: `Ficha única com confiança ${confidenceLabel}.`
  };

  return {
    ...result,
    training: finalTraining,
    trainingCost: cost.costByBlock,
    trainingPointsUsed: cost.totalCost,
    trainingPointsRemaining: Math.max(0, result.trainingPointsTotal - cost.totalCost),
    trainingComparison: result.trainingComparison.map((item) => ({ ...item, recommended: finalTraining[item.key], difference: finalTraining[item.key] - item.auto })),
    buildVariants: [definitiveVariant],
    buildName: 'Ficha Competitiva Definitiva — Motor Mundial',
    recommendationExplanation: [...reasons, ...result.recommendationExplanation].filter((value, index, all) => all.indexOf(value) === index).slice(0, 8),
    competitiveFusion: summary
  };
}
