import type { TrainingPlan } from './analyzerDomain';
import { auditCardBuildR564, type BaseProvenanceR564 } from './cardPerformanceAuditR564';

/**
 * R565 integrates candidate plans from existing optimizers; it does not invent
 * game-performance measurements or silently manufacture an overall-based winner.
 */
export type PerformanceObjectiveR565 = 'EQUILIBRADA' | 'ESPECIALISTA' | 'COMPETITIVA';
export type PerformanceCandidateR565 = {
  id: string;
  objective: PerformanceObjectiveR565;
  training: TrainingPlan;
  /** Only compare scores produced by the SAME named metric and context. */
  modelScore?: number | null;
  metricId?: string;
  calibration: 'UNVERIFIED' | 'MATCH_CALIBRATED';
};
export type CandidateDecisionR565 = {
  id: string;
  objective: PerformanceObjectiveR565;
  status: 'VALIDO' | 'REVISAR' | 'REJEITADO';
  spent: number | null;
  remaining: number | null;
  issues: string[];
  modelScore: number | null;
};
export type BuildComparisonR565 = {
  version: 'R565';
  verdict: 'COMPARAVEL' | 'INCONCLUSIVO';
  /** A model-score leader, not proof of superiority on the pitch. */
  leaderId: string | null;
  reason: string;
  candidates: CandidateDecisionR565[];
};
type CardForComparisonR565 = Parameters<typeof auditCardBuildR564>[0]['card'];

/**
 * Pure read-only comparison. Any valid difference is shown as a trade-off.
 * A numerical leader requires matching externally calibrated metrics.
 */
export function comparePerformanceBuildsR565(input: {
  card: CardForComparisonR565;
  budget: number | null;
  baseProvenance: BaseProvenanceR564;
  confirmedBaseAttributeKeys?: Parameters<typeof auditCardBuildR564>[0]['confirmedBaseAttributeKeys'];
  candidates: readonly PerformanceCandidateR565[];
}): BuildComparisonR565 {
  const seen = new Set<string>();
  const candidates: CandidateDecisionR565[] = input.candidates.map(candidate => {
    const audit = auditCardBuildR564({
      card: input.card,
      plan: candidate.training,
      budget: input.budget,
      budgetProvenance: 'MANUAL_CONFIRMED',
      baseProvenance: input.baseProvenance,
      confirmedBaseAttributeKeys: input.confirmedBaseAttributeKeys,
    });
    const issues = audit.issues.map(issue => issue.code);
    if (!candidate.id.trim() || seen.has(candidate.id)) issues.push('CANDIDATO_ID_REPETIDO');
    seen.add(candidate.id);
    if (candidate.modelScore != null && !Number.isFinite(candidate.modelScore)) issues.push('SCORE_INVALIDO');
    const hardFail = !audit.exactBudget || audit.status === 'BLOQUEADO' || issues.includes('CANDIDATO_ID_REPETIDO') || issues.includes('SCORE_INVALIDO');
    return {
      id: candidate.id,
      objective: candidate.objective,
      status: hardFail ? 'REJEITADO' : audit.optimizationAllowed ? 'VALIDO' : 'REVISAR',
      spent: audit.pointsUsed,
      remaining: audit.pointsRemaining,
      issues,
      modelScore: candidate.modelScore != null && Number.isFinite(candidate.modelScore) ? candidate.modelScore : null,
    };
  });
  const valid = candidates.filter(candidate => candidate.status === 'VALIDO');
  if (valid.length < 2) {
    return {
      version: 'R565',
      verdict: 'INCONCLUSIVO',
      leaderId: null,
      reason: 'São necessárias pelo menos duas fichas válidas, com atributos-base e orçamento confirmados.',
      candidates,
    };
  }
  const originals = valid.map(value => input.candidates.find(item => item.id === value.id)!);
  const metric = originals[0].metricId;
  const comparable = Boolean(metric) && originals.every(item =>
    item.calibration === 'MATCH_CALIBRATED'
    && item.metricId === metric
    && typeof item.modelScore === 'number'
    && Number.isFinite(item.modelScore));
  if (!comparable) {
    return {
      version: 'R565',
      verdict: 'INCONCLUSIVO',
      leaderId: null,
      reason: 'As fichas podem ser comparadas, mas não há pontuações calibradas na mesma métrica e contexto.',
      candidates,
    };
  }
  const ranked = [...originals].sort((a, b) => (b.modelScore ?? -Infinity) - (a.modelScore ?? -Infinity));
  const leaderId = ranked[0].modelScore! > ranked[1].modelScore! ? ranked[0].id : null;
  return {
    version: 'R565',
    verdict: leaderId ? 'COMPARAVEL' : 'INCONCLUSIVO',
    leaderId,
    reason: leaderId
      ? 'Liderança apenas na métrica de desempenho calibrada informada; não é garantia de melhor resultado em todas as partidas.'
      : 'As maiores pontuações empataram; não há vencedor demonstrável.',
    candidates,
  };
}
