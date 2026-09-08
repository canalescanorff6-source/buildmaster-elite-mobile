import type { AnalysisResult } from '@/lib/analyzerDomain';
import { MATCH_VALIDATION_STORAGE_KEY, cardFingerprint, type MatchValidationRecord } from '@/lib/appEvolution';
import { readAccountStorage, writeAccountStorage } from '@/lib/accountStorage';
import { analysisUsagePositionR138 } from '@/lib/analysisUsagePositionR138';

export const MATCH_VALIDATION_REPOSITORY_R137_VERSION = '40.80-r137-account-scoped-match-repository-v1' as const;
export const MATCH_VALIDATION_UPDATED_EVENT_R137 = 'buildmaster:match-validation-updated' as const;
export const MATCH_VALIDATION_MAX_RECORDS_R137 = 1000;

export type MatchValidationWriteResultR137 = {
  version: typeof MATCH_VALIDATION_REPOSITORY_R137_VERSION;
  records: MatchValidationRecord[];
  persisted: boolean;
  revision: string;
};

const clampLimit = (limit: number) => Math.max(1, Math.min(MATCH_VALIDATION_MAX_RECORDS_R137, Math.floor(Number(limit) || MATCH_VALIDATION_MAX_RECORDS_R137)));

function stableHash(input: string) {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function recordTimestamp(record: MatchValidationRecord) {
  const value = Date.parse(String(record.playedAt || ''));
  return Number.isFinite(value) ? value : 0;
}

function isUsableRecord(value: unknown): value is MatchValidationRecord {
  if (!value || typeof value !== 'object') return false;
  const record = value as Partial<MatchValidationRecord>;
  return Boolean(
    String(record.id || '').trim()
    && String(record.cardFingerprint || '').trim()
    && String(record.targetPosition || '').trim()
    && String(record.playedAt || '').trim()
  );
}

export function normalizeMatchValidationRecordsR137(input: unknown, limit = MATCH_VALIDATION_MAX_RECORDS_R137): MatchValidationRecord[] {
  if (!Array.isArray(input)) return [];
  const deduped = new Map<string, { record: MatchValidationRecord; index: number }>();
  input.forEach((value, index) => {
    if (!isUsableRecord(value)) return;
    const id = String(value.id).trim();
    const current = deduped.get(id);
    if (!current || recordTimestamp(value) >= recordTimestamp(current.record)) deduped.set(id, { record: value, index });
  });
  return [...deduped.values()]
    .sort((left, right) => recordTimestamp(right.record) - recordTimestamp(left.record) || left.index - right.index || left.record.id.localeCompare(right.record.id, 'en'))
    .slice(0, clampLimit(limit))
    .map(({ record }) => record);
}

export function matchValidationRevisionR137(records: MatchValidationRecord[]) {
  const signature = records.map((record) => [
    record.id, record.cardFingerprint, record.targetPosition, record.playedAt, record.buildSignature,
    record.minutes, record.overallRating, record.passing, record.movement, record.finishing, record.defending, record.physical, record.stamina,
    record.connection ?? '', record.inputDelayRating ?? '', record.secondHalfDrop ? 1 : 0, ...(record.tags ?? []), record.note ?? '',
    record.metrics?.goals ?? '', record.metrics?.assists ?? '', record.metrics?.passErrors ?? '', record.metrics?.tackles ?? '',
    record.metrics?.interceptions ?? '', record.metrics?.ballLosses ?? '', record.metrics?.shots ?? '', record.metrics?.shotsOnTarget ?? '',
    record.gameVersion ?? '', record.gameplayEpoch ?? ''
  ].join(':')).join('|');
  return `matches-r137-${stableHash(signature)}`;
}

export function readMatchValidationRepositoryR137(limit = MATCH_VALIDATION_MAX_RECORDS_R137): MatchValidationRecord[] {
  try {
    // R137: partidas são estritamente escopadas por conta. Leitura analítica nunca migra storage legado implicitamente.
    const raw = readAccountStorage(MATCH_VALIDATION_STORAGE_KEY, { migrateLegacy: false });
    return normalizeMatchValidationRecordsR137(JSON.parse(raw || '[]'), limit);
  } catch {
    return [];
  }
}

export function persistMatchValidationRepositoryR137(records: MatchValidationRecord[], detail: Record<string, unknown> = {}): MatchValidationWriteResultR137 {
  const safe = normalizeMatchValidationRecordsR137(records);
  const revision = matchValidationRevisionR137(safe);
  const persisted = writeAccountStorage(MATCH_VALIDATION_STORAGE_KEY, JSON.stringify(safe));
  if (persisted && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(MATCH_VALIDATION_UPDATED_EVENT_R137, {
      detail: {
        total: safe.length,
        engineVersion: '40.80-r137',
        repositoryVersion: MATCH_VALIDATION_REPOSITORY_R137_VERSION,
        revision,
        ...detail
      }
    }));
  }
  return { version: MATCH_VALIDATION_REPOSITORY_R137_VERSION, records: safe, persisted, revision };
}

export function replaceMatchValidationRepositoryR137(input: unknown, detail: Record<string, unknown> = {}): MatchValidationWriteResultR137 {
  return persistMatchValidationRepositoryR137(normalizeMatchValidationRecordsR137(input), { source: 'replace', ...detail });
}

export function exactUsageMatchValidationRecordsR137(result: AnalysisResult, records: MatchValidationRecord[] = readMatchValidationRepositoryR137()) {
  const fingerprint = cardFingerprint(result);
  const position = analysisUsagePositionR138(result);
  return records.filter((record) => record.cardFingerprint === fingerprint && record.targetPosition === position);
}

export function removeUsageMatchValidationRecordsR137(result: AnalysisResult, records: MatchValidationRecord[]) {
  const fingerprint = cardFingerprint(result);
  const position = analysisUsagePositionR138(result);
  return records.filter((record) => record.cardFingerprint !== fingerprint || record.targetPosition !== position);
}

export function subscribeMatchValidationRepositoryR137(listener: () => void) {
  if (typeof window === 'undefined') return () => undefined;
  window.addEventListener(MATCH_VALIDATION_UPDATED_EVENT_R137, listener);
  return () => window.removeEventListener(MATCH_VALIDATION_UPDATED_EVENT_R137, listener);
}
