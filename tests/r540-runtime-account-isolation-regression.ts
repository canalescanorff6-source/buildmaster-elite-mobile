import assert from 'node:assert/strict';

class MemoryStorage {
  private data = new Map<string, string>();
  get length() { return this.data.size; }
  key(index: number) { return Array.from(this.data.keys())[index] ?? null; }
  getItem(key: string) { return this.data.get(key) ?? null; }
  setItem(key: string, value: string) { this.data.set(key, String(value)); }
  removeItem(key: string) { this.data.delete(key); }
  clear() { this.data.clear(); }
}

async function main() {
  const localStorage = new MemoryStorage();
  (globalThis as any).window = {
    localStorage,
    dispatchEvent: () => true,
    setTimeout,
    clearTimeout,
  };
  (globalThis as any).CustomEvent = class CustomEvent {
    detail: unknown;
    constructor(_name: string, init?: { detail?: unknown }) { this.detail = init?.detail; }
  };

  const accountStorage = require('../src/lib/accountStorage') as typeof import('../src/lib/accountStorage');
  const localDatabase = require('../src/lib/localDatabase') as typeof import('../src/lib/localDatabase');

  localStorage.setItem('buildmaster_ocr_scan_history_v27', JSON.stringify([{ id: 'legacy-owner-data' }]));
  accountStorage.setActiveAccountIdentity({
    id: 'regular-user-1',
    username: 'regular',
    role: 'user',
    mode: 'cloud',
  });

  const result = await localDatabase.migrateLegacyRuntimeData();
  assert.deepEqual(result, { migrated: 0, skipped: 0 });
  assert.ok(localStorage.getItem('buildmaster_ocr_scan_history_v27'), 'conta comum não pode consumir/apagar legado global');

  console.log('R540 migração: dados globais legados permanecem isolados de contas comuns.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
