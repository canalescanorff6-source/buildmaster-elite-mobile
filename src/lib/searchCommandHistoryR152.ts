import { readAccountStorage, writeAccountStorage } from '@/lib/accountStorage';
import type { AppCommand } from '@/components/AppCommandPalette';

export const SEARCH_COMMAND_HISTORY_R152_VERSION = '40.80-r152-search-history-v1' as const;
export const SEARCH_COMMAND_HISTORY_R152_KEY = 'buildmaster_search_command_history_r152';
const MAX_RECENT_COMMANDS = 12;

export function normalizeRecentCommandIdsR152(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of value) {
    const id = typeof item === 'string' ? item.trim() : '';
    if (!id || seen.has(id)) continue;
    seen.add(id);
    result.push(id.slice(0, 160));
    if (result.length >= MAX_RECENT_COMMANDS) break;
  }
  return result;
}

export function mergeRecentCommandIdR152(current: string[], commandId: string): string[] {
  const id = commandId.trim().slice(0, 160);
  if (!id) return normalizeRecentCommandIdsR152(current);
  return normalizeRecentCommandIdsR152([id, ...current.filter((item) => item !== id)]);
}

export function resolveRecentCommandsR152(commands: AppCommand[], recentIds: string[]): AppCommand[] {
  const byId = new Map(commands.map((command) => [command.id, command]));
  return normalizeRecentCommandIdsR152(recentIds)
    .map((id) => byId.get(id))
    .filter((command): command is AppCommand => Boolean(command));
}

export function readRecentCommandIdsR152(): string[] {
  try {
    const raw = readAccountStorage(SEARCH_COMMAND_HISTORY_R152_KEY, { migrateLegacy: false });
    return raw ? normalizeRecentCommandIdsR152(JSON.parse(raw)) : [];
  } catch {
    return [];
  }
}

export function writeRecentCommandIdsR152(ids: string[]): boolean {
  try {
    return writeAccountStorage(SEARCH_COMMAND_HISTORY_R152_KEY, JSON.stringify(normalizeRecentCommandIdsR152(ids)));
  } catch {
    return false;
  }
}

export function recordRecentCommandR152(commandId: string): string[] {
  const next = mergeRecentCommandIdR152(readRecentCommandIdsR152(), commandId);
  writeRecentCommandIdsR152(next);
  return next;
}

export function clearRecentCommandsR152(): void {
  writeRecentCommandIdsR152([]);
}
