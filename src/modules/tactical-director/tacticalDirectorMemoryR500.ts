import type { MatchValidationRecord } from '@/lib/appStartupContractsR200';
import type { TacticalDirectorMemoryR500 } from './tacticalDirectorTypesR500';

type TacticalMemoryContextR500 = {
  formation: string;
  teamStyle: string;
  cardFingerprints: string[];
  patternTag?: string | null;
};

function compatibleRecord(record: MatchValidationRecord, context: TacticalMemoryContextR500): boolean {
  if (record.formation !== context.formation) return false;
  if (context.teamStyle !== 'AUTO' && record.teamStyle !== context.teamStyle) return false;
  if (context.cardFingerprints.length && !context.cardFingerprints.includes(record.cardFingerprint)) return false;
  return true;
}

export function buildTacticalMemoryR500(
  records: MatchValidationRecord[],
  context: TacticalMemoryContextR500
): TacticalDirectorMemoryR500 {
  const compatible = records.filter((record) => compatibleRecord(record, context));
  const sessions = new Map<string, MatchValidationRecord[]>();
  for (const record of compatible) {
    const sessionKey = String(record.sessionIdR462 || '').trim();
    if (!sessionKey) continue;
    const bucket = sessions.get(sessionKey) ?? [];
    bucket.push(record);
    sessions.set(sessionKey, bucket);
  }

  const compatibleMatches = sessions.size;
  const patternTag = String(context.patternTag || '').trim();
  let confirmedPatternRate: number | null = null;
  if (compatibleMatches > 0 && patternTag) {
    let sessionsWithPattern = 0;
    for (const sessionRecords of sessions.values()) {
      if (sessionRecords.some((record) => record.tags.includes(patternTag))) sessionsWithPattern += 1;
    }
    confirmedPatternRate = Math.round((sessionsWithPattern / compatibleMatches) * 100);
  }

  let state: TacticalDirectorMemoryR500['state'] = 'SEM_EVIDENCIA';
  if (compatibleMatches >= 1 && compatibleMatches <= 2) {
    state = 'EM_OBSERVACAO';
  } else if (compatibleMatches >= 3 && compatibleMatches <= 5) {
    state = confirmedPatternRate != null && confirmedPatternRate >= 60 ? 'TENDENCIA' : 'EM_OBSERVACAO';
  } else if (compatibleMatches >= 6) {
    if (context.teamStyle !== 'AUTO' && confirmedPatternRate != null && confirmedPatternRate >= 70) state = 'CONFIRMADO';
    else if (confirmedPatternRate != null && confirmedPatternRate >= 60) state = 'TENDENCIA';
    else state = 'EM_OBSERVACAO';
  }

  return {
    state,
    compatibleMatches,
    confirmedPatternRate,
    notes: compatible.some((record) => !record.sessionIdR462)
      ? ['Registros sem sessionIdR462 não entram em agregação forte para evitar dupla contagem.']
      : []
  };
}
