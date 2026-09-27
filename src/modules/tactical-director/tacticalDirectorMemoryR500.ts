import type { TacticalStyle } from '../../lib/analyzer';
import type { MatchValidationRecord } from '../../lib/appStartupContractsR200';
import type { MatchVisionSnapshotR482 } from '../matches/matchVisionEngineR482';
import type { TacticalDirectorMemoryR500 } from './tacticalDirectorTypesR500';

export type TacticalMemoryContextR500 = {
  formation: string;
  teamStyle: TacticalStyle;
  cardFingerprints?: string[];
};

export type TacticalMemoryMatchVisionR500 = {
  sessionId: string | null;
  snapshot: MatchVisionSnapshotR482;
};

type SessionBucketR500 = {
  id: string;
  canonical: boolean;
  patterns: Set<string>;
};

function normalizePatternR500(value: unknown): string {
  return String(value ?? '').trim();
}

function compatibleRecordR500(record: MatchValidationRecord, context: TacticalMemoryContextR500): boolean {
  if (String(record.formation) !== String(context.formation)) return false;
  if (record.teamStyle !== context.teamStyle) return false;
  const allowedCards = context.cardFingerprints?.filter(Boolean) ?? [];
  if (allowedCards.length && !allowedCards.includes(record.cardFingerprint)) return false;
  return true;
}

function getOrCreateBucketR500(
  buckets: Map<string, SessionBucketR500>,
  id: string,
  canonical: boolean
): SessionBucketR500 {
  const existing = buckets.get(id);
  if (existing) return existing;
  const created: SessionBucketR500 = { id, canonical, patterns: new Set<string>() };
  buckets.set(id, created);
  return created;
}

function addRecordPatternsR500(bucket: SessionBucketR500, record: MatchValidationRecord): void {
  for (const tag of record.tags ?? []) {
    const normalized = normalizePatternR500(tag);
    if (normalized) bucket.patterns.add(normalized);
  }
}

function addMatchVisionR500(
  buckets: Map<string, SessionBucketR500>,
  matchVision: TacticalMemoryMatchVisionR500 | null | undefined,
  context: TacticalMemoryContextR500
): void {
  if (!matchVision?.snapshot) return;
  const snapshot = matchVision.snapshot;
  if (String(snapshot.configuredContext.formation) !== String(context.formation)) return;
  if (snapshot.configuredContext.teamStyle !== context.teamStyle) return;
  if (snapshot.evidence.confirmedMarkers <= 0) return;

  const canonical = Boolean(matchVision.sessionId);
  const key = canonical ? `session:${matchVision.sessionId}` : 'vision:sem-sessao';
  const bucket = getOrCreateBucketR500(buckets, key, canonical);
  for (const pattern of snapshot.recurringPatterns ?? []) {
    const normalized = normalizePatternR500(pattern.kind || pattern.label);
    if (normalized) bucket.patterns.add(normalized);
  }
}

function rankedPatternsR500(canonicalBuckets: SessionBucketR500[]): Array<{ label: string; count: number; coverage: number }> {
  if (!canonicalBuckets.length) return [];
  const counts = new Map<string, number>();
  for (const bucket of canonicalBuckets) {
    for (const pattern of bucket.patterns) {
      counts.set(pattern, (counts.get(pattern) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count, coverage: count / canonicalBuckets.length }))
    .sort((left, right) => right.coverage - left.coverage || right.count - left.count || left.label.localeCompare(right.label));
}

export function buildTacticalMemoryR500(
  records: MatchValidationRecord[],
  context: TacticalMemoryContextR500,
  matchVision?: TacticalMemoryMatchVisionR500 | null
): TacticalDirectorMemoryR500 {
  const buckets = new Map<string, SessionBucketR500>();

  for (const record of records) {
    if (!compatibleRecordR500(record, context)) continue;
    const canonical = Boolean(record.sessionIdR462);
    const key = canonical ? `session:${record.sessionIdR462}` : `orphan:${record.id}`;
    addRecordPatternsR500(getOrCreateBucketR500(buckets, key, canonical), record);
  }

  addMatchVisionR500(buckets, matchVision, context);

  const allBuckets = [...buckets.values()];
  const canonicalBuckets = allBuckets.filter((bucket) => bucket.canonical);
  const patterns = rankedPatternsR500(canonicalBuckets);
  const strongestCoverage = patterns[0]?.coverage ?? 0;
  const compatibleMatches = allBuckets.length;
  const confirmedSessions = canonicalBuckets.length;
  const limitations: string[] = [];

  if (compatibleMatches > confirmedSessions) {
    limitations.push('Há registros compatíveis sem sessão canônica; eles não promovem tendência forte nem confirmação.');
  }
  if (context.teamStyle === 'AUTO') {
    limitations.push('Estilo AUTO limita a memória a tendência; CONFIRMADO exige contexto tático específico.');
  }

  let state: TacticalDirectorMemoryR500['state'] = 'SEM_EVIDENCIA';
  if (compatibleMatches > 0) state = 'EM_OBSERVACAO';
  if (confirmedSessions >= 3 && strongestCoverage >= 0.6) state = 'TENDENCIA';
  if (confirmedSessions >= 6 && strongestCoverage >= 0.7 && context.teamStyle !== 'AUTO') state = 'CONFIRMADO';

  return {
    state,
    compatibleMatches,
    confirmedSessions,
    patterns: patterns
      .filter((pattern) => pattern.coverage >= 0.6)
      .slice(0, 5)
      .map((pattern) => `${pattern.label} • ${pattern.count}/${confirmedSessions} (${Math.round(pattern.coverage * 100)}%)`),
    limitations
  };
}
