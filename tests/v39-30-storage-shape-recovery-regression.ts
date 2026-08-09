import assert from 'node:assert/strict';
import { safeStorageGetJson } from '../src/lib/safeLocalStorage';
import { readVaultTrash } from '../src/lib/vaultTrash';

class MemoryStorage {
  private readonly values = new Map<string, string>();

  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return Array.from(this.values.keys())[index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) { this.values.set(key, String(value)); }
}

class TestCustomEvent<T = unknown> {
  readonly type: string;
  readonly detail: T | undefined;
  constructor(type: string, init?: { detail?: T }) {
    this.type = type;
    this.detail = init?.detail;
  }
}

const localStorage = new MemoryStorage();
Object.defineProperty(globalThis, 'CustomEvent', { value: TestCustomEvent, configurable: true });
Object.defineProperty(globalThis, 'window', {
  value: { localStorage, sessionStorage: new MemoryStorage(), dispatchEvent: () => true },
  configurable: true
});

localStorage.setItem('array-expected', JSON.stringify({ legacy: true }));
assert.deepEqual(safeStorageGetJson<unknown[]>('array-expected', []), []);
assert.equal(localStorage.getItem('array-expected'), JSON.stringify({ legacy: true }), 'o valor incompatível deve permanecer preservado');

localStorage.setItem('object-expected', JSON.stringify(['legacy']));
assert.deepEqual(safeStorageGetJson<Record<string, unknown>>('object-expected', {}), {});

localStorage.setItem('number-expected', JSON.stringify('3'));
assert.equal(safeStorageGetJson<number>('number-expected', 3), 3);

localStorage.setItem('nullable-migration', JSON.stringify({ schema: 1 }));
assert.deepEqual(safeStorageGetJson<unknown>('nullable-migration', null), { schema: 1 });

localStorage.setItem('broken-json', '{invalid');
assert.deepEqual(safeStorageGetJson<unknown[]>('broken-json', []), []);
assert.equal(localStorage.getItem('broken-json'), null, 'JSON sintaticamente inválido deve ser removido');

const trashKey = 'buildmaster_account_legacy-local__vault_trash_v2739';
localStorage.setItem(trashKey, JSON.stringify({ oldShape: true }));
assert.deepEqual(readVaultTrash(), [], 'lixeira em formato legado não pode derrubar o app');

const expiresAt = new Date(Date.now() + 60_000).toISOString();
localStorage.setItem(trashKey, JSON.stringify([
  null,
  'invalid',
  { id: 'restorable-1', expiresAt, label: '', payload: { player: 'preservado' } },
  { id: '', expiresAt, label: 'inválido', payload: {} }
]));
const recovered = readVaultTrash<{ player: string }>();
assert.equal(recovered.length, 1);
assert.equal(recovered[0]?.id, 'restorable-1');
assert.equal(recovered[0]?.label, 'Item removido');
assert.equal(recovered[0]?.payload.player, 'preservado');
assert.ok(Number.isFinite(Date.parse(recovered[0]?.deletedAt ?? '')));
assert.equal(JSON.parse(localStorage.getItem(trashKey) ?? '[]').length, 1, 'a lixeira deve ser regravada sem entradas inválidas');

console.log('v39.30 armazenamento defensivo aprovado: formatos incompatíveis não derrubam o app e a lixeira preserva itens recuperáveis.');
