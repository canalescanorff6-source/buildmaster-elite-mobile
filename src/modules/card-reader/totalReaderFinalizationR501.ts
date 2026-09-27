import type { TotalReadingSession } from '@/lib/totalCardReader';

export const TOTAL_READER_FINALIZATION_R501_VERSION = '40.80-r501-total-reader-finalization-v1' as const;

export type TotalReadingFinalizationStateR501 = 'FINAL_READY' | 'REVIEW_REQUIRED' | 'BLOCKED';

export type TotalReadingFinalizationR501 = {
  state: TotalReadingFinalizationStateR501;
  canFinalize: boolean;
  reasons: string[];
};

export function deriveTotalReadingFinalizationR501(session: TotalReadingSession): TotalReadingFinalizationR501 {
  const reasons: string[] = [];
  const missingFields = session.criticalFields.filter((field) => field.status === 'missing');
  const reviewFields = session.criticalFields.filter((field) => field.status === 'review');

  if (session.mismatchRisk === 'block') {
    reasons.push(...session.mismatchReasons, 'Divergência crítica entre os prints bloqueia a promoção para resultado final.');
  }
  if (session.missingCriticalScreens.length) {
    reasons.push(`Telas obrigatórias ausentes: ${session.missingCriticalScreens.join(', ')}.`);
  }
  if (missingFields.length) {
    reasons.push(`Campos críticos ausentes: ${missingFields.map((field) => field.label).join(', ')}.`);
  }
  if (reasons.length) return { state: 'BLOCKED', canFinalize: false, reasons: [...new Set(reasons)] };

  if (session.mismatchRisk === 'review') {
    reasons.push(...session.mismatchReasons, 'Há divergência que precisa de revisão antes da ficha final.');
  }
  if (reviewFields.length) {
    reasons.push(`Campos ainda em revisão: ${reviewFields.map((field) => field.label).join(', ')}.`);
  }
  if (session.mergedConfidence < 90) {
    reasons.push(`Confiança combinada ${session.mergedConfidence}% abaixo do limiar final R501 de 90%.`);
  }
  if (reasons.length) return { state: 'REVIEW_REQUIRED', canFinalize: false, reasons: [...new Set(reasons)] };

  return {
    state: 'FINAL_READY',
    canFinalize: true,
    reasons: ['Leitura Total completa, consistente e com confiança suficiente para promoção automática.'],
  };
}
