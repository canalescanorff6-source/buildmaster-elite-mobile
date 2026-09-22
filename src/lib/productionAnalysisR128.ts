import { analyzeCardProductionBaseR142 } from './analyzer';
import type { AnalysisResult, CardEditionIdentityR457, Objective, PositionCode, TacticalProfile } from './analyzerDomain';
import { applyCompleteCardIntelligence } from './cardIntelligencePipeline';
import { isCurrentProductionAnalysisR128 } from './productionAuthorityR128';
import { matchEvidenceCalibrationCurrentR136 } from '../modules/matches/matchEvidenceCalibrationR136';
import { buildOutcomeCalibrationCurrentR460 } from '../modules/matches/buildOutcomeCalibrationR460';
import { isFinalBuildDiagnosticsCurrentR142, synchronizeFinalBuildDiagnosticsR142 } from '../modules/analysis/finalBuildDiagnosticsR142';
import { readGameplayScoutingForResultR454 } from '../modules/scouting/gameplayScoutingRepositoryR454';
import { syncMatchEvidenceIntoScoutingR457 } from '../modules/scouting/matchScoutingBridgeR457';

/** Entrada R128: devolve somente uma ficha selada pela autoridade final + integridade dos outputs. */
export function analyzeCardForProductionR128(
  rawText: string,
  objective: Objective = 'COMPETITIVE',
  targetPosition: PositionCode | 'AUTO' = 'AUTO',
  imageFileName?: string | null,
  tacticalProfile: TacticalProfile = { formation: 'AUTO', style: 'AUTO' },
  editionIdentity?: CardEditionIdentityR457 | null,
  usageFunction?: string | null
) {
  const base = analyzeCardProductionBaseR142(rawText, objective, targetPosition, imageFileName, tacticalProfile);
  const identified = editionIdentity ? { ...base, parsed: { ...base.parsed, editionIdentity } } : base;
  const selectedFunction=String(usageFunction ?? '').trim();
  const functionScoped = selectedFunction && selectedFunction.toUpperCase()!=='AUTO'
    ? { ...identified, usageFunctionR457:selectedFunction }
    : identified;
  // R457 Stage 10: scouting persistido entra como evidência read-only antes do único escritor final.
  const withScouting = { ...functionScoped, gameplayScoutingR454: readGameplayScoutingForResultR454(functionScoped) } as AnalysisResult;
  const analyzed = synchronizeFinalBuildDiagnosticsR142(applyCompleteCardIntelligence(withScouting));
  return syncMatchEvidenceIntoScoutingR457(analyzed);
}

/**
 * Recalcula quando o selo é antigo OU quando algum código alterou ficha/Top 5/Ímpeto
 * depois do único escritor final.
 */
export function ensureCurrentProductionAnalysisR128(result: AnalysisResult) {
  const outputsCurrent = isCurrentProductionAnalysisR128(result);
  const matchEvidenceCurrent = matchEvidenceCalibrationCurrentR136(result);
  const buildOutcomeCurrent = buildOutcomeCalibrationCurrentR460(result);
  const diagnosticsCurrent = isFinalBuildDiagnosticsCurrentR142(result);
  if (outputsCurrent && matchEvidenceCurrent && buildOutcomeCurrent && diagnosticsCurrent) return result;
  if (outputsCurrent && matchEvidenceCurrent && buildOutcomeCurrent) return synchronizeFinalBuildDiagnosticsR142(result);
  const refreshed = synchronizeFinalBuildDiagnosticsR142(applyCompleteCardIntelligence(result));
  return syncMatchEvidenceIntoScoutingR457(refreshed);
}
