import { analyzeCardProductionBaseR142 } from './analyzer';
import type { AnalysisResult, Objective, PositionCode, TacticalProfile } from './analyzerDomain';
import { applyCompleteCardIntelligence } from './cardIntelligencePipeline';
import { isCurrentProductionAnalysisR128 } from './productionAuthorityR128';
import { matchEvidenceCalibrationCurrentR136 } from '../modules/matches/matchEvidenceCalibrationR136';
import { isFinalBuildDiagnosticsCurrentR142, synchronizeFinalBuildDiagnosticsR142 } from '../modules/analysis/finalBuildDiagnosticsR142';

/** Entrada R128: devolve somente uma ficha selada pela autoridade final + integridade dos outputs. */
export function analyzeCardForProductionR128(
  rawText: string,
  objective: Objective = 'COMPETITIVE',
  targetPosition: PositionCode | 'AUTO' = 'AUTO',
  imageFileName?: string | null,
  tacticalProfile: TacticalProfile = { formation: 'AUTO', style: 'AUTO' }
) {
  return synchronizeFinalBuildDiagnosticsR142(applyCompleteCardIntelligence(analyzeCardProductionBaseR142(rawText, objective, targetPosition, imageFileName, tacticalProfile)));
}

/**
 * Recalcula quando o selo é antigo OU quando algum código alterou ficha/Top 5/Ímpeto
 * depois do único escritor final.
 */
export function ensureCurrentProductionAnalysisR128(result: AnalysisResult) {
  const outputsCurrent = isCurrentProductionAnalysisR128(result);
  const matchEvidenceCurrent = matchEvidenceCalibrationCurrentR136(result);
  const diagnosticsCurrent = isFinalBuildDiagnosticsCurrentR142(result);
  if (outputsCurrent && matchEvidenceCurrent && diagnosticsCurrent) return result;
  if (outputsCurrent && matchEvidenceCurrent) return synchronizeFinalBuildDiagnosticsR142(result);
  return synchronizeFinalBuildDiagnosticsR142(applyCompleteCardIntelligence(result));
}
