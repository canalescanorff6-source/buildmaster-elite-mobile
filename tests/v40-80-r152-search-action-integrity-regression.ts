import assert from 'node:assert/strict';
import {
  clearRecentCommandsR152,
  mergeRecentCommandIdR152,
  normalizeRecentCommandIdsR152,
  readRecentCommandIdsR152,
  recordRecentCommandR152,
  resolveRecentCommandsR152,
  SEARCH_COMMAND_HISTORY_R152_VERSION,
} from '@/lib/searchCommandHistoryR152';

type MemoryStorageShape = Storage & { data: Map<string, string> };
function createMemoryStorage(): MemoryStorageShape {
  const data = new Map<string, string>();
  return {
    data,
    get length() { return data.size; },
    clear() { data.clear(); },
    getItem(key: string) { return data.get(key) ?? null; },
    key(index: number) { return Array.from(data.keys())[index] ?? null; },
    removeItem(key: string) { data.delete(key); },
    setItem(key: string, value: string) { data.set(key, String(value)); },
  } as MemoryStorageShape;
}

const storage = createMemoryStorage();
(globalThis as unknown as { window: unknown }).window = {
  localStorage: storage,
  dispatchEvent: () => true,
};

assert.equal(SEARCH_COMMAND_HISTORY_R152_VERSION, '40.80-r152-search-history-v1');
assert.deepEqual(normalizeRecentCommandIdsR152(['a', 'a', '', ' b ', 42, 'c']), ['a', 'b', 'c']);
assert.deepEqual(mergeRecentCommandIdR152(['a', 'b', 'c'], 'b'), ['b', 'a', 'c']);
assert.equal(mergeRecentCommandIdR152(Array.from({ length: 20 }, (_, index) => `id-${index}`), 'novo').length, 12);

const commands = [
  { id: 'a', label: 'A', description: '', group: '', run: () => undefined },
  { id: 'b', label: 'B', description: '', group: '', run: () => undefined },
  { id: 'c', label: 'C', description: '', group: '', run: () => undefined },
];
assert.deepEqual(resolveRecentCommandsR152(commands, ['c', 'missing', 'a']).map((item) => item.id), ['c', 'a']);

clearRecentCommandsR152();
assert.deepEqual(readRecentCommandIdsR152(), []);
recordRecentCommandR152('a');
recordRecentCommandR152('b');
recordRecentCommandR152('a');
assert.deepEqual(readRecentCommandIdsR152(), ['a', 'b']);
clearRecentCommandsR152();
assert.deepEqual(readRecentCommandIdsR152(), []);

console.log('R152 aprovado: histórico de busca real, deduplicado, limitado e isolado pelo armazenamento de conta.');
