import type { CardEvidenceStateR419, ParsedCard } from '../../lib/analyzerDomain';
import { inferPointsFromCardLevel } from '../builds/pointBudget';

export const CARD_EVIDENCE_AUTHORITY_R419_VERSION = '40.80-r419-critical-evidence-v1' as const;

export type TrainingBudgetEvidenceR419 = {
  state: CardEvidenceStateR419;
  budget: number;
  source: ParsedCard['trainingPointSource'] | 'UNSPECIFIED';
  reasons: string[];
};

function validBudget(value: unknown): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 && numeric <= 140 ? Math.round(numeric) : 0;
}

export function deriveTrainingBudgetEvidenceR419(parsed: ParsedCard): TrainingBudgetEvidenceR419 {
  const budget = validBudget(parsed.trainingPointsTotal);
  const source = parsed.trainingPointSource ?? 'UNSPECIFIED';
  if (!budget) return { state: 'MISSING', budget: 0, source, reasons: ['PP total ausente ou inválido.'] };

  const used = Number(parsed.trainingPointsUsed ?? 0);
  if (Number.isFinite(used) && used > budget) {
    return { state: 'CONFLICTING', budget, source, reasons: [`PP usado (${Math.round(used)}) excede PP total (${budget}).`] };
  }

  if (source === 'FALLBACK') {
    return { state: 'UNCERTAIN', budget, source, reasons: ['PP marcado como fallback não pode autorizar progressão.'] };
  }
  if (source === 'MANUAL' || source === 'TRAINING_READ') {
    return { state: 'TRUSTED', budget, source, reasons: ['PP confirmado por fonte explícita.'] };
  }
  if (source === 'OCR') {
    const trusted = parsed.manualConfirmed || Number(parsed.confidence ?? 0) >= 0.78;
    return { state: trusted ? 'TRUSTED' : 'UNCERTAIN', budget, source, reasons: [trusted ? 'OCR com confiança suficiente para PP.' : 'OCR de PP precisa de confirmação.'] };
  }
  if (source === 'LEVEL_INFERRED') {
    const inferred = inferPointsFromCardLevel(parsed.level);
    if (inferred !== budget) {
      return { state: 'CONFLICTING', budget, source, reasons: ['PP inferido não coincide com o nível lido.'] };
    }
    const trusted = parsed.manualConfirmed || Number(parsed.confidence ?? 0) >= 0.9;
    return { state: trusted ? 'TRUSTED' : 'UNCERTAIN', budget, source, reasons: [trusted ? 'Nível confiável confirma o PP inferido.' : 'Nível inferido ainda precisa de confirmação.'] };
  }

  if (parsed.manualConfirmed) {
    return { state: 'TRUSTED', budget, source, reasons: ['Carta confirmada manualmente com PP positivo.'] };
  }
  const inferred = inferPointsFromCardLevel(parsed.level);
  if (inferred === budget && Number(parsed.confidence ?? 0) >= 0.92) {
    return { state: 'TRUSTED', budget, source, reasons: ['PP e nível convergem com alta confiança.'] };
  }
  return { state: 'UNCERTAIN', budget, source, reasons: ['PP positivo sem proveniência suficiente para autorizar progressão.'] };
}

export function applyCriticalEvidenceR419(parsed: ParsedCard): ParsedCard {
  const budget = deriveTrainingBudgetEvidenceR419(parsed);
  const evidenceAttributeCount = Number(parsed.evidence?.attributeCount ?? 0);
  const actualAttributeCount = Object.values(parsed.attributes ?? {}).filter((value) => Number.isFinite(Number(value))).length;
  const attributeCount = Math.max(Number.isFinite(evidenceAttributeCount) ? evidenceAttributeCount : 0, actualAttributeCount);
  const criticalState: CardEvidenceStateR419 = budget.state !== 'TRUSTED'
    ? budget.state
    : attributeCount > 0
      ? 'TRUSTED'
      : 'MISSING';
  return {
    ...parsed,
    evidence: {
      ...parsed.evidence,
      criticalStateR419: criticalState,
      criticalReasonsR419: [...budget.reasons, ...(attributeCount > 0 ? [] : ['Atributos críticos ausentes.'])],
      trainingBudgetStateR419: budget.state,
      levelStateR419: parsed.level == null ? 'MISSING' : (parsed.manualConfirmed || Number(parsed.confidence ?? 0) >= 0.9 ? 'TRUSTED' : 'UNCERTAIN')
    }
  };
}
