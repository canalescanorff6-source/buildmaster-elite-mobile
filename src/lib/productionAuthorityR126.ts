import type { AnalysisResult } from './analyzerDomain';
import { CLEAN_SLATE_2027_R119_VERSION, type CleanSlate2027R119 } from './cleanSlatePerformance2027V4080R119';
import { cardEvidenceFingerprintR126, cardIdentityFingerprintR126 } from './cardIdentityFingerprintR126';

export const PRODUCTION_AUTHORITY_R126_VERSION = '40.80-r126-production-contract-v2' as const;

export type ProductionAuthorityR126 = {
  version: typeof PRODUCTION_AUTHORITY_R126_VERSION;
  authority: 'PRODUCTION_SINGLE_WRITER';
  decisionEngine: typeof CLEAN_SLATE_2027_R119_VERSION;
  cardIdentity: string;
  cardEvidence: string;
  usagePosition: string;
  status: 'READY' | 'BLOCKED_INSUFFICIENT_DATA';
  owns: {
    training: true;
    top5: true;
    impeto: true;
  };
  diagnostics: {
    legacyEnginesReadOnly: true;
    overallExcludedFromDecision: true;
    staleDecisionRejected: true;
  };
};

type WithProductionAuthorityR126 = AnalysisResult & {
  cleanSlate2027R119?: CleanSlate2027R119;
  productionAuthorityR126?: ProductionAuthorityR126;
};

export function sealProductionAuthorityR126(input: AnalysisResult): AnalysisResult {
  const result = input as WithProductionAuthorityR126;
  const cleanSlate = result.cleanSlate2027R119;
  if (!cleanSlate) return input;

  const cardIdentity = cardIdentityFingerprintR126(result.parsed);
  const cardEvidence = cardEvidenceFingerprintR126(result.parsed);
  const authority: ProductionAuthorityR126 = {
    version: PRODUCTION_AUTHORITY_R126_VERSION,
    authority: 'PRODUCTION_SINGLE_WRITER',
    decisionEngine: CLEAN_SLATE_2027_R119_VERSION,
    cardIdentity,
    cardEvidence,
    usagePosition: cleanSlate.usagePosition,
    status: cleanSlate.status,
    owns: { training: true, top5: true, impeto: true },
    diagnostics: {
      legacyEnginesReadOnly: true,
      overallExcludedFromDecision: true,
      staleDecisionRejected: true
    }
  };

  return {
    ...result,
    productionAuthorityR126: authority
  } as AnalysisResult;
}

export function isCurrentProductionAnalysisR126(input: AnalysisResult) {
  const result = input as WithProductionAuthorityR126;
  return Boolean(
    result.cleanSlate2027R119?.version === CLEAN_SLATE_2027_R119_VERSION &&
    result.productionAuthorityR126?.version === PRODUCTION_AUTHORITY_R126_VERSION &&
    result.productionAuthorityR126?.cardIdentity === cardIdentityFingerprintR126(result.parsed) &&
    result.productionAuthorityR126?.cardEvidence === cardEvidenceFingerprintR126(result.parsed) &&
    result.productionAuthorityR126?.usagePosition === result.cleanSlate2027R119?.usagePosition
  );
}
