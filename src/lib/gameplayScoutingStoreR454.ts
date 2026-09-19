import { readAccountStorage, writeAccountStorage } from './accountStorage';
import {
  GAMEPLAY_SCOUTING_R454_VERSION,
  buildGameplayScoutingRecordR454,
  type GameplayScoutingEvidenceR454,
  type GameplayScoutingRecordR454
} from './gameplayScoutingR454';
import type { AnalysisResult } from './analyzerDomain';

export const GAMEPLAY_SCOUTING_STORAGE_R454_KEY = 'gameplay_scouting_r454_v1';

type GameplayScoutingStorageR454 = {
  version: typeof GAMEPLAY_SCOUTING_R454_VERSION;
  records: Record<string, GameplayScoutingRecordR454>;
};

function emptyStorage(): GameplayScoutingStorageR454 {
  return { version: GAMEPLAY_SCOUTING_R454_VERSION, records: {} };
}

export function readGameplayScoutingStorageR454(): GameplayScoutingStorageR454 {
  const raw = readAccountStorage(GAMEPLAY_SCOUTING_STORAGE_R454_KEY, { migrateLegacy: true });
  if (!raw) return emptyStorage();
  try {
    const parsed = JSON.parse(raw) as Partial<GameplayScoutingStorageR454>;
    if (!parsed.records || typeof parsed.records !== 'object') return emptyStorage();
    return {
      version: GAMEPLAY_SCOUTING_R454_VERSION,
      records: parsed.records as Record<string, GameplayScoutingRecordR454>
    };
  } catch {
    return emptyStorage();
  }
}

export function getGameplayScoutingRecordR454(cardId: string): GameplayScoutingRecordR454 | null {
  return readGameplayScoutingStorageR454().records[cardId] ?? null;
}

export function saveGameplayScoutingRecordR454(record: GameplayScoutingRecordR454): boolean {
  const storage = readGameplayScoutingStorageR454();
  storage.records[record.cardId] = record;
  return writeAccountStorage(GAMEPLAY_SCOUTING_STORAGE_R454_KEY, JSON.stringify(storage));
}

export function mergeGameplayScoutingEvidenceR454(
  result: AnalysisResult,
  incoming: GameplayScoutingEvidenceR454[]
): GameplayScoutingRecordR454 {
  const preview = buildGameplayScoutingRecordR454(result);
  const current = getGameplayScoutingRecordR454(preview.cardId);
  const byId = new Map<string, GameplayScoutingEvidenceR454>();
  for (const item of current?.sources ?? []) if (item.type !== 'OFFICIAL') byId.set(item.id, item);
  for (const item of incoming) if (item.type !== 'OFFICIAL') byId.set(item.id, item);
  const next = buildGameplayScoutingRecordR454(result, [...byId.values()]);
  saveGameplayScoutingRecordR454(next);
  return next;
}

export function appendUserGameplayFeedbackR454(
  result: AnalysisResult,
  note: string,
  gameVersion = '6.0.0'
): GameplayScoutingRecordR454 {
  const clean = note.trim();
  if (!clean) return mergeGameplayScoutingEvidenceR454(result, []);
  const evidence: GameplayScoutingEvidenceR454 = {
    id: `user:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
    type: 'USER_GAMEPLAY',
    sourceName: 'Meus testes',
    gameVersion,
    observedAt: new Date().toISOString(),
    confidence: 'MEDIA',
    note: clean
  };
  return mergeGameplayScoutingEvidenceR454(result, [evidence]);
}
