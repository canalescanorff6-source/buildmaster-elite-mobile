import type { CardTruthCertificationR501 } from '../analysis/cardTruthLayerR501';

export const SINGLE_READER_FINALIZATION_R503_VERSION = '40.80-r503-single-reader-finalization-v1' as const;

export type SingleReaderFinalizationDecisionR503 = {
  version: typeof SINGLE_READER_FINALIZATION_R503_VERSION;
  state: 'FINALIZE' | 'REVIEW_REQUIRED' | 'BLOCKED';
  canPersistConfirmed: boolean;
  canPromoteResult: boolean;
  reason: string;
};

export function deriveSingleReaderFinalizationR503(
  certification: CardTruthCertificationR501 | null | undefined,
): SingleReaderFinalizationDecisionR503 {
  if (!certification) {
    return {
      version: SINGLE_READER_FINALIZATION_R503_VERSION,
      state: 'BLOCKED',
      canPersistConfirmed: false,
      canPromoteResult: false,
      reason: 'A ficha ainda não possui certificação Card Truth. Revise os dados críticos antes de finalizar.',
    };
  }

  if (certification.state === 'FINAL_CERTIFIED') {
    if (!certification.canFinalize) {
      return {
        version: SINGLE_READER_FINALIZATION_R503_VERSION,
        state: 'BLOCKED',
        canPersistConfirmed: false,
        canPromoteResult: false,
        reason: 'A certificação final está inconsistente e foi bloqueada por segurança.',
      };
    }
    return {
      version: SINGLE_READER_FINALIZATION_R503_VERSION,
      state: 'FINALIZE',
      canPersistConfirmed: true,
      canPromoteResult: true,
      reason: 'Card Truth FINAL_CERTIFIED: a ficha pode ser persistida e promovida como resultado final.',
    };
  }

  if (certification.state === 'BLOCKED_INSUFFICIENT_DATA') {
    return {
      version: SINGLE_READER_FINALIZATION_R503_VERSION,
      state: 'BLOCKED',
      canPersistConfirmed: false,
      canPromoteResult: false,
      reason: `A ficha está bloqueada por evidência insuficiente. ${certification.reasons.join(' ')}`.trim(),
    };
  }

  return {
    version: SINGLE_READER_FINALIZATION_R503_VERSION,
    state: 'REVIEW_REQUIRED',
    canPersistConfirmed: false,
    canPromoteResult: false,
    reason: `A ficha continua provisória (${certification.state}). Revise e confirme os campos críticos antes de finalizar.`,
  };
}
