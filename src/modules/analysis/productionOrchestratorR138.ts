import type { AnalysisResult, CardEditionIdentityR457, Objective, PositionCode, TacticalProfile } from '@/lib/analyzerDomain';
import { analyzeCardForProductionR128, ensureCurrentProductionAnalysisR128 } from '@/lib/productionAnalysisR128';
import { applyCompleteCardIntelligence } from '@/lib/cardIntelligencePipeline';
import { analysisUsagePositionR138 } from '@/lib/analysisUsagePositionR138';
import { attachPendingGameplayScoutingR454 } from '@/modules/scouting/gameplayScoutingR454';

export const PRODUCTION_ORCHESTRATOR_R138_VERSION = '40.80-r138-production-orchestrator-v1' as const;

export type ProductionAnalysisRequestR138 = {
  rawText: string;
  objective?: Objective;
  targetPosition?: PositionCode | 'AUTO';
  imageFileName?: string | null;
  tacticalProfile?: TacticalProfile;
  editionIdentity?: CardEditionIdentityR457 | null;
  usageFunction?: string | null;
};

/** Nova análise: sempre entra pelo parser e sai selada pela autoridade de produção. */
export function createProductionAnalysisR138(request: ProductionAnalysisRequestR138): AnalysisResult {
  return attachPendingGameplayScoutingR454(analyzeCardForProductionR128(
    request.rawText,
    request.objective ?? 'COMPETITIVE',
    request.targetPosition ?? 'AUTO',
    request.imageFileName ?? null,
    request.tacticalProfile ?? { formation: 'AUTO', style: 'AUTO' },
    request.editionIdentity ?? null,
    request.usageFunction ?? null
  ));
}

/** Refresh forçado de regras/correções/evidência. A UI não conhece mais o pipeline interno. */
export function rebuildProductionAnalysisR138(result: AnalysisResult): AnalysisResult {
  return attachPendingGameplayScoutingR454(applyCompleteCardIntelligence(result));
}

/** Guardião barato: só reconstrói quando o selo/evidência deixou de ser atual. */
export function ensureProductionAnalysisR138(result: AnalysisResult): AnalysisResult {
  return attachPendingGameplayScoutingR454(ensureCurrentProductionAnalysisR128(result));
}

export function productionUsagePositionR138(result: AnalysisResult) {
  return analysisUsagePositionR138(result);
}
