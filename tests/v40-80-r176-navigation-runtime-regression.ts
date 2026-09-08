import assert from 'node:assert/strict';
import {
  NAVIGATION_STATE_KEY,
  buildMainNavigationR127,
  parseInternalDeepLink,
  readNavigationSnapshot,
  writeNavigationSnapshot,
} from '../src/lib/appNavigationR127';

class MemoryStorage {
  private data = new Map<string, string>();
  get length() { return this.data.size; }
  key(index: number) { return [...this.data.keys()][index] ?? null; }
  getItem(key: string) { return this.data.get(key) ?? null; }
  setItem(key: string, value: string) { this.data.set(key, String(value)); }
  removeItem(key: string) { this.data.delete(key); }
  clear() { this.data.clear(); }
}

const storage = new MemoryStorage();
(globalThis as any).window = { localStorage: storage, dispatchEvent: () => true };

assert.deepEqual(parseInternalDeepLink('#/inicio'), { group: 'inicio' });
assert.deepEqual(parseInternalDeepLink('#/jogadores/cofre'), { group: 'jogadores', workspace: 'cofre' });
assert.deepEqual(parseInternalDeepLink('#/jogadores/qualquer'), { group: 'jogadores', workspace: 'visao-geral' });
assert.equal(parseInternalDeepLink('#/invalido'), null);

writeNavigationSnapshot({ group: 'jogadores', playerWorkspace: 'resultado', scrollY: 144 });
const stored = JSON.parse(storage.getItem(NAVIGATION_STATE_KEY) || '{}');
assert.equal(stored.version, 2);
assert.equal(stored.group, 'jogadores');
assert.equal(stored.playerWorkspace, 'resultado');
assert.equal(stored.scrollY, 144);
assert.equal(typeof stored.updatedAt, 'string');
assert.deepEqual(readNavigationSnapshot(), stored);

storage.removeItem(NAVIGATION_STATE_KEY);
storage.setItem('buildmaster_navigation_state_v2739', JSON.stringify({ version: 1, group: 'time', scrollY: 21, updatedAt: '2026-01-01T00:00:00.000Z' }));
const migrated = readNavigationSnapshot();
assert.equal(migrated?.version, 2);
assert.equal(migrated?.group, 'time');
assert.equal(migrated?.scrollY, 21);
assert.equal(JSON.parse(storage.getItem(NAVIGATION_STATE_KEY) || '{}').version, 2);

const nav = buildMainNavigationR127({ historyCount: 7, matchCount: 3, hasResult: true });
assert.equal(nav.find((item) => item.id === 'jogadores')?.hint, '7 salvos');
assert.equal(nav.find((item) => item.id === 'partidas')?.hint, '3 análises');
assert.equal(nav.find((item) => item.id === 'resultado')?.disabled, false);

console.log('R176 runtime: deep link, snapshot v2, migração v1 e navegação principal permanecem equivalentes.');
