export const BATCH_ROSTER_IMPORT_R437_VERSION = '40.80-r437-resumable-batch-roster-import-v1' as const;

export type BatchRosterImportOutcomeR437 = 'created' | 'updated' | 'skipped' | 'failed';

export type BatchRosterImportStatsR437 = {
  total: number;
  processed: number;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  paused: boolean;
};

type SourceHashRecordR437 = { sourceHash?: string | null };

function cleanHash(value: unknown) {
  return String(value ?? '').trim().toLowerCase();
}

export function findImportedRosterCardBySourceHashR437<T extends SourceHashRecordR437>(players: T[], sourceHash: string): T | null {
  const target = cleanHash(sourceHash);
  if (!target) return null;
  return players.find((player) => cleanHash(player.sourceHash) === target) ?? null;
}

export function createBatchRosterImportStatsR437(total: number): BatchRosterImportStatsR437 {
  return {
    total: Math.max(0, Math.round(Number(total) || 0)),
    processed: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    paused: false
  };
}

export function recordBatchRosterImportOutcomeR437(
  stats: BatchRosterImportStatsR437,
  outcome: BatchRosterImportOutcomeR437
): BatchRosterImportStatsR437 {
  return {
    ...stats,
    processed: Math.min(stats.total, stats.processed + 1),
    created: stats.created + (outcome === 'created' ? 1 : 0),
    updated: stats.updated + (outcome === 'updated' ? 1 : 0),
    skipped: stats.skipped + (outcome === 'skipped' ? 1 : 0),
    failed: stats.failed + (outcome === 'failed' ? 1 : 0)
  };
}

export function pauseBatchRosterImportR437(stats: BatchRosterImportStatsR437): BatchRosterImportStatsR437 {
  return { ...stats, paused: true };
}

export function batchRosterImportRemainingR437(stats: BatchRosterImportStatsR437) {
  return Math.max(0, stats.total - stats.processed);
}

export function batchRosterImportSummaryR437(stats: BatchRosterImportStatsR437) {
  const prefix = stats.paused ? 'Importação pausada com segurança.' : 'Importação concluída.';
  const remaining = batchRosterImportRemainingR437(stats);
  const parts = [
    `${stats.created} nova(s)`,
    `${stats.updated} atualizada(s)`,
    `${stats.skipped} já existente(s) pulada(s) sem OCR`,
    `${stats.failed} falha(s)`
  ];
  if (remaining) parts.push(`${remaining} restante(s)`);
  const suffix = stats.paused
    ? 'Selecione os mesmos arquivos novamente para continuar; os já concluídos serão reconhecidos pelo hash.'
    : 'Cartas já importadas não precisarão de nova leitura na próxima seleção.';
  return `${prefix} ${parts.join(' • ')}. ${suffix}`;
}
