export const INTELLIGENT_IMPORT_STATS_R439_VERSION = '40.80-r439-intelligent-import-stats-v1' as const;

export type IntelligentImportOutcomeR439 = 'catalog' | 'ambiguous' | 'full-ocr' | 'review';
export type IntelligentImportStatsR439 = {
  total: number;
  catalogResolved: number;
  ambiguous: number;
  fullOcr: number;
  review: number;
};

export function createIntelligentImportStatsR439(total: number): IntelligentImportStatsR439 {
  return { total: Math.max(0, Math.round(Number(total) || 0)), catalogResolved: 0, ambiguous: 0, fullOcr: 0, review: 0 };
}

export function recordIntelligentImportR439(stats: IntelligentImportStatsR439, outcome: IntelligentImportOutcomeR439): IntelligentImportStatsR439 {
  return {
    ...stats,
    catalogResolved: stats.catalogResolved + (outcome === 'catalog' ? 1 : 0),
    ambiguous: stats.ambiguous + (outcome === 'ambiguous' ? 1 : 0),
    fullOcr: stats.fullOcr + (outcome === 'full-ocr' ? 1 : 0),
    review: stats.review + (outcome === 'review' ? 1 : 0)
  };
}

export function intelligentImportSummaryR439(stats: IntelligentImportStatsR439) {
  return [
    `R439: ${stats.catalogResolved} identificada(s) sem OCR completo`,
    `${stats.ambiguous} aguardando escolha de versão`,
    `${stats.fullOcr} com OCR completo necessário`,
    `${stats.review} para revisar identidade`
  ].join(' • ');
}
