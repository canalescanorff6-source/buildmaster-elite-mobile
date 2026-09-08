import type { AnalysisResult, PositionCode } from './analyzerDomain';
import { cardUsageIdentityKeyR126 } from './cardIdentityFingerprintR126';

export const ANALYSIS_USAGE_POSITION_R138_VERSION = '40.80-r138-canonical-usage-position-v1' as const;

const VALID_POSITIONS = new Set<PositionCode>(['CF', 'SS', 'LWF', 'RWF', 'LMF', 'RMF', 'AMF', 'CMF', 'DMF', 'CB', 'LB', 'RB', 'GK']);

export type UsagePositionCarrierR138 = {
  cleanSlate2027R119?: { usagePosition?: string };
  productionAuthorityR128?: { usagePosition?: string };
  productionAuthorityR126?: { usagePosition?: string };
  bestPosition?: { code?: unknown };
  parsed?: { mainPosition?: unknown };
};

function asPosition(value: unknown): PositionCode | null {
  const normalized = String(value ?? '').trim().toUpperCase() as PositionCode;
  return VALID_POSITIONS.has(normalized) ? normalized : null;
}

/**
 * R138: fonte única da posição REAL de uso da ficha.
 * Nunca confundir bestPosition (diagnóstico do analisador) com a função escolhida pelo usuário.
 */
export function optionalAnalysisUsagePositionR138(result: UsagePositionCarrierR138): PositionCode | null {
  const current = result;
  return asPosition(current.cleanSlate2027R119?.usagePosition)
    ?? asPosition(current.productionAuthorityR128?.usagePosition)
    ?? asPosition(current.productionAuthorityR126?.usagePosition)
    ?? asPosition(result.bestPosition?.code)
    ?? asPosition(result.parsed?.mainPosition);
}

export function analysisUsagePositionR138(result: UsagePositionCarrierR138): PositionCode {
  return optionalAnalysisUsagePositionR138(result) ?? 'CMF';
}

export function analysisUsageIdentityKeyR138(result: AnalysisResult) {
  return cardUsageIdentityKeyR126(result.parsed, analysisUsagePositionR138(result));
}

export function analysisUsageChangedR138(result: AnalysisResult) {
  return analysisUsagePositionR138(result) !== result.parsed.mainPosition;
}
