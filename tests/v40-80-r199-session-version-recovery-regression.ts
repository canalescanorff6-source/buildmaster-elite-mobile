import assert from 'node:assert/strict';
import { accountStorageKey } from '../src/lib/accountStorage';
import { ACTIVE_SESSION_REPOSITORY_R157_VERSION, readActiveSessionSnapshotR157 } from '../src/modules/session/activeSessionRepositoryR137';

class MemoryStorage {
  private data = new Map<string, string>();
  get length() { return this.data.size; }
  clear() { this.data.clear(); }
  getItem(key: string) { return this.data.get(key) ?? null; }
  key(index: number) { return [...this.data.keys()][index] ?? null; }
  removeItem(key: string) { this.data.delete(key); }
  setItem(key: string, value: string) { this.data.set(key, String(value)); }
}

const storage = new MemoryStorage();
(globalThis as any).window = { localStorage: storage };

const baseKey = 'r199-active-session';
const now = 1_800_000_000_000;
const scoped = accountStorageKey(baseKey);
const previewKey = accountStorageKey(`${baseKey}__r157_preview`);
const playerKey = accountStorageKey(`${baseKey}__r157_player_image`);

storage.setItem(scoped, JSON.stringify({
  repositoryVersion: '40.80-r999-future-session',
  savedAt: now,
  rawText: 'NÃO PODE SER RESTAURADO COMO LEGADO'
}));
storage.setItem(previewKey, 'data:image/png;base64,AAAA');
storage.setItem(playerKey, 'data:image/png;base64,BBBB');

const incompatible = readActiveSessionSnapshotR157(baseKey, now);
assert.equal(incompatible.status, 'INVALID', 'R199: versão split desconhecida deve ser rejeitada, não reinterpretada como R137.');
assert.equal(incompatible.snapshot, null);
assert.equal(storage.getItem(scoped), null, 'R199: metadado incompatível deve ser limpo.');
assert.equal(storage.getItem(previewKey), null, 'R199: preview órfão deve ser limpo junto com a sessão inválida.');
assert.equal(storage.getItem(playerKey), null, 'R199: imagem órfã deve ser limpa junto com a sessão inválida.');

storage.setItem(scoped, JSON.stringify({ savedAt: now, rawText: 'LEGADO R137 VÁLIDO', preview: null, playerCardImage: null }));
const legacy = readActiveSessionSnapshotR157(baseKey, now);
assert.equal(legacy.status, 'RESTORED', 'R199: snapshot R137 verdadeiro deve continuar restaurável.');
assert.equal(legacy.snapshot?.rawText, 'LEGADO R137 VÁLIDO');
assert.notEqual((legacy.snapshot as any)?.repositoryVersion, ACTIVE_SESSION_REPOSITORY_R157_VERSION);

console.log('R199 sessão aprovada: versão split incompatível é descartada; legado R137 verdadeiro continua recuperável.');
