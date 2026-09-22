import { readAccountStorage, writeAccountStorage } from '@/lib/accountStorage';
import type { AnalysisResult } from '@/lib/analyzerDomain';
import { cardIdentityAliasesR457, cardIdentityFingerprintR126 } from '@/lib/cardIdentityFingerprintR126';
import {
  CURRENT_EFOOTBALL_GAME_VERSION_R457,
  GAMEPLAY_SCOUTING_STORAGE_KEY_R454,
  GAMEPLAY_SCOUTING_R454_VERSION,
  createPendingGameplayScoutingR454,
  type GameplayScoutingRecordR454,
  type GameplayScoutingSourceR454,
  type UserGameplayFeedbackR454
} from './gameplayScoutingR454';

type ScoutingStoreR454 = Record<string, GameplayScoutingRecordR454>;

function readStore(): ScoutingStoreR454 {
  try {
    const parsed = JSON.parse(readAccountStorage(GAMEPLAY_SCOUTING_STORAGE_KEY_R454) || '{}') as unknown;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as ScoutingStoreR454 : {};
  } catch {
    return {};
  }
}

function writeStore(store: ScoutingStoreR454) {
  writeAccountStorage(GAMEPLAY_SCOUTING_STORAGE_KEY_R454, JSON.stringify(store));
}

function normalizeRecord(record: GameplayScoutingRecordR454): GameplayScoutingRecordR454 {
  const sourceTypes = [...new Set((record.sources ?? []).map((source) => source.type))];
  const sourceLinks = [...new Set((record.sources ?? []).map((source) => source.url).filter((value): value is string => Boolean(value)))];
  const status = (record.conflicts ?? []).length ? 'SOURCE_CONFLICT' : (record.sources ?? []).length ? 'READY' : 'SCOUTING_PENDENTE';
  return {
    ...record,
    version: GAMEPLAY_SCOUTING_R454_VERSION,
    status,
    sourceTypes,
    sourceLinks,
    testedByUser: (record.userFeedback ?? []).length > 0 || record.testedByUser
  };
}

export function readGameplayScoutingR454(cardId: string): GameplayScoutingRecordR454 | null {
  return readStore()[cardId] ?? null;
}

export function readGameplayScoutingForResultR454(
  result: AnalysisResult,
  gameVersion = CURRENT_EFOOTBALL_GAME_VERSION_R457
): GameplayScoutingRecordR454 {
  const canonical = cardIdentityFingerprintR126(result.parsed);
  const store = readStore();
  for (const alias of cardIdentityAliasesR457(result.parsed)) {
    const found = store[alias];
    if (!found || found.gameVersion !== gameVersion) continue;
    if (alias !== canonical || found.cardId !== canonical) {
      const migrated = normalizeRecord({ ...found, cardId: canonical, gameVersion });
      store[canonical] = migrated;
      delete store[alias];
      writeStore(store);
      return migrated;
    }
    return normalizeRecord(found);
  }
  return createPendingGameplayScoutingR454(result, gameVersion);
}

export function upsertGameplayScoutingR454(record: GameplayScoutingRecordR454) {
  const store = readStore();
  const normalized = normalizeRecord(record);
  store[normalized.cardId] = normalized;
  writeStore(store);
  return normalized;
}

export function addGameplayScoutingSourceR454(result: AnalysisResult, source: GameplayScoutingSourceR454) {
  const current = readGameplayScoutingForResultR454(result);
  const sources = [...current.sources.filter((item) => item.id !== source.id), source];
  return upsertGameplayScoutingR454({
    ...current,
    sources,
    lastReviewed: new Date().toISOString()
  });
}

export function addUserGameplayFeedbackR454(result: AnalysisResult, feedback: UserGameplayFeedbackR454) {
  const current = readGameplayScoutingForResultR454(result);
  const userFeedback = [...current.userFeedback.filter((item) => item.id !== feedback.id), feedback];
  return upsertGameplayScoutingR454({
    ...current,
    userFeedback,
    testedByUser: true,
    lastReviewed: new Date().toISOString()
  });
}

export function deleteGameplayScoutingR454(cardId: string) {
  const store = readStore();
  if (!store[cardId]) return false;
  delete store[cardId];
  writeStore(store);
  return true;
}

export function exportGameplayScoutingR454() {
  return Object.values(readStore());
}
