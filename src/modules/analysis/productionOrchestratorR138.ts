import type { AnalysisResult, Objective, PositionCode, TacticalProfile } from '@/lib/analyzerDomain';
import { analyzeCardForProductionR128, ensureCurrentProductionAnalysisR128 } from '@/lib/productionAnalysisR128';
import { applyCompleteCardIntelligence } from '@/lib/cardIntelligencePipeline';
import { analysisUsagePositionR138 } from '@/lib/analysisUsagePositionR138';

export const PRODUCTION_ORCHESTRATOR_R138_VERSION = '40.80-r138-production-orchestrator-v1' as const;

export type ProductionAnalysisRequestR138 = {
  rawText: string;
  objective?: Objective;
  targetPosition?: PositionCode | 'AUTO';
  imageFileName?: string | null;
  tacticalProfile?: TacticalProfile;
};

/** Nova análise: sempre entra pelo parser e sai selada pela autoridade de produção. */
export function createProductionAnalysisR138(request: ProductionAnalysisRequestR138): AnalysisResult {
  return analyzeCardForProductionR128(
    request.rawText,
    request.objective ?? 'COMPETITIVE',
    request.targetPosition ?? 'AUTO',
    request.imageFileName ?? null,
    request.tacticalProfile ?? { formation: 'AUTO', style: 'AUTO' }
  );
}

/** Refresh forçado de regras/correções/evidência. A UI não conhece mais o pipeline interno. */
export function rebuildProductionAnalysisR138(result: AnalysisResult): AnalysisResult {
  return applyCompleteCardIntelligence(result);
}

/** Guardião barato: só reconstrói quando o selo/evidência deixou de ser atual. */
export function ensureProductionAnalysisR138(result: AnalysisResult): AnalysisResult {
  return ensureCurrentProductionAnalysisR128(result);
}

export function productionUsagePositionR138(result: AnalysisResult) {
  return analysisUsagePositionR138(result);
}
