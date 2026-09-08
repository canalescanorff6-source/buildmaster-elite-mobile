import type { AnalysisResult, TrainingKey } from './analyzerDomain';
import { TRAINING_KEYS } from './trainingPlanCore';
import { cardEvidenceFingerprintR126, cardIdentityFingerprintR126 } from './cardIdentityFingerprintR126';
import { isCurrentProductionAnalysisR126 } from './productionAuthorityR126';

export const PRODUCTION_AUTHORITY_R128_VERSION = '40.80-r128-output-integrity-v1' as const;

export type ProductionAuthorityR128 = {
  version: typeof PRODUCTION_AUTHORITY_R128_VERSION;
  authority: 'PRODUCTION_OUTPUT_INTEGRITY';
  cardIdentity: string;
  cardEvidence: string;
  usagePosition: string;
  outputFingerprint: string;
  protects: {
    training: true;
    top5: true;
    impeto: true;
    budget: true;
  };
  diagnostics: {
    postWriterMutationRejected: true;
    gameplayDnaReadOnly: true;
  };
};

type WithProductionAuthorityR128 = AnalysisResult & {
  productionAuthorityR128?: ProductionAuthorityR128;
  cleanSlate2027R119?: { usagePosition?: string };
};

function normalizeText(value: unknown) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function fnv1a(value: string) {
  let output = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    output ^= value.charCodeAt(index);
    output = Math.imul(output, 16777619);
  }
  return (output >>> 0).toString(36);
}

function trainingFingerprint(result: AnalysisResult) {
  return TRAINING_KEYS
    .map((key: TrainingKey) => `${key}:${Number(result.training?.[key] ?? 0)}:${Number(result.trainingCost?.[key] ?? 0)}`)
    .join(',');
}

function impetoFingerprint(result: AnalysisResult) {
  return (result.recommendedImpetos ?? [])
    .map((item) => `${normalizeText(item?.name)}:${normalizeText(item?.tier)}:${Number(item?.score ?? 0)}:${(item?.attributes ?? []).map(normalizeText).sort().join(',')}`)
    .join(',');
}

/**
 * Assinatura dos ÚNICOS outputs que podem decidir a ficha em produção.
 * Qualquer transformação posterior que mexa nesses campos torna o selo inválido.
 */
export function productionOutputFingerprintR128(result: AnalysisResult) {
  const source = [
    PRODUCTION_AUTHORITY_R128_VERSION,
    cardIdentityFingerprintR126(result.parsed),
    cardEvidenceFingerprintR126(result.parsed),
    String(result.bestPosition?.code ?? ''),
    String((result as WithProductionAuthorityR128).cleanSlate2027R119?.usagePosition ?? result.bestPosition?.code ?? ''),
    trainingFingerprint(result),
    result.trainingPointsTotal,
    result.trainingPointsUsed,
    result.trainingPointsRemaining,
    (result.recommendedSkills ?? []).map(normalizeText).join('>'),
    impetoFingerprint(result)
  ].join('|');
  return `output-r128-${fnv1a(source)}`;
}

export function sealProductionAuthorityR128(input: AnalysisResult): AnalysisResult {
  const result = input as WithProductionAuthorityR128;
  const usagePosition = String(result.cleanSlate2027R119?.usagePosition ?? result.bestPosition?.code ?? '');
  const authority: ProductionAuthorityR128 = {
    version: PRODUCTION_AUTHORITY_R128_VERSION,
    authority: 'PRODUCTION_OUTPUT_INTEGRITY',
    cardIdentity: cardIdentityFingerprintR126(result.parsed),
    cardEvidence: cardEvidenceFingerprintR126(result.parsed),
    usagePosition,
    outputFingerprint: productionOutputFingerprintR128(result),
    protects: { training: true, top5: true, impeto: true, budget: true },
    diagnostics: { postWriterMutationRejected: true, gameplayDnaReadOnly: true }
  };
  return { ...result, productionAuthorityR128: authority } as AnalysisResult;
}

export function isCurrentProductionAnalysisR128(input: AnalysisResult) {
  const result = input as WithProductionAuthorityR128;
  const authority = result.productionAuthorityR128;
  return Boolean(
    isCurrentProductionAnalysisR126(input)
    && authority?.version === PRODUCTION_AUTHORITY_R128_VERSION
    && authority.cardIdentity === cardIdentityFingerprintR126(result.parsed)
    && authority.cardEvidence === cardEvidenceFingerprintR126(result.parsed)
    && authority.usagePosition === String(result.cleanSlate2027R119?.usagePosition ?? result.bestPosition?.code ?? '')
    && authority.outputFingerprint === productionOutputFingerprintR128(result)
  );
}
