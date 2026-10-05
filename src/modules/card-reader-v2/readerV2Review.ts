import type { ReaderV2Evidence, ReaderV2ReviewDraft, ReaderV2SessionSnapshot } from './readerV2Types';

const fieldValue = (evidence: ReaderV2Evidence, key: string) => evidence.fields.find((field) => field.key === key)?.value?.trim() ?? '';

export function buildReaderV2ReviewDraft(
  evidence: ReaderV2Evidence,
  preview: string | null,
  snapshot?: ReaderV2SessionSnapshot,
): ReaderV2ReviewDraft {
  if (snapshot && snapshot.stage !== 'ocrClosed') throw new Error('Reader V2 review requires ocrClosed');
  return {
    playerName: fieldValue(evidence, 'playerName'),
    level: fieldValue(evidence, 'level').replace(/[^0-9]/g, '').slice(0, 3),
    points: fieldValue(evidence, 'points').replace(/[^0-9]/g, '').slice(0, 4),
    mainPosition: fieldValue(evidence, 'mainPosition').toUpperCase(),
    rawText: evidence.rawText,
    fields: evidence.fields.map((field) => ({ ...field })),
    uncertainKeys: [...new Set(evidence.uncertainKeys)],
    preview,
  };
}
