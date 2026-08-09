import { accountStorageKey } from './accountStorage';
import { safeStorageGetJson, safeStorageSetJson } from './safeLocalStorage';

const TRASH_KEY = 'vault_trash_v2739';
const TRASH_LIMIT = 80;
const RETENTION_DAYS = 30;

export type VaultTrashItem<T = unknown> = {
  id: string;
  deletedAt: string;
  expiresAt: string;
  label: string;
  payload: T;
};

function key() {
  return accountStorageKey(TRASH_KEY);
}

function normalizeVaultTrashItem<T>(value: unknown): VaultTrashItem<T> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const source = value as Partial<VaultTrashItem<T>> & Record<string, unknown>;
  const id = typeof source.id === 'string' ? source.id.trim().slice(0, 180) : '';
  const expiresAtMs = typeof source.expiresAt === 'string' ? Date.parse(source.expiresAt) : Number.NaN;
  if (!id || !Number.isFinite(expiresAtMs) || !Object.prototype.hasOwnProperty.call(source, 'payload')) return null;
  const deletedAtMs = typeof source.deletedAt === 'string' ? Date.parse(source.deletedAt) : Number.NaN;
  const deletedAt = Number.isFinite(deletedAtMs)
    ? new Date(deletedAtMs).toISOString()
    : new Date(Math.max(0, expiresAtMs - RETENTION_DAYS * 24 * 60 * 60 * 1000)).toISOString();
  return {
    id,
    deletedAt,
    expiresAt: new Date(expiresAtMs).toISOString(),
    label: typeof source.label === 'string' && source.label.trim() ? source.label.trim().slice(0, 120) : 'Item removido',
    payload: source.payload as T
  };
}

export function readVaultTrash<T = unknown>(): VaultTrashItem<T>[] {
  const now = Date.now();
  const stored = safeStorageGetJson<unknown[]>(key(), []);
  const valid = stored
    .map((item) => normalizeVaultTrashItem<T>(item))
    .filter((item): item is VaultTrashItem<T> => item !== null && Date.parse(item.expiresAt) > now)
    .slice(0, TRASH_LIMIT);
  if (valid.length !== stored.length) safeStorageSetJson(key(), valid);
  return valid;
}

export function moveToVaultTrash<T>(id: string, label: string, payload: T): VaultTrashItem<T> {
  const deletedAt = new Date();
  const expiresAt = new Date(deletedAt.getTime() + RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const item: VaultTrashItem<T> = { id, label: label.trim().slice(0, 120), payload, deletedAt: deletedAt.toISOString(), expiresAt: expiresAt.toISOString() };
  safeStorageSetJson(key(), [item, ...readVaultTrash<T>().filter((entry) => entry.id !== id)].slice(0, TRASH_LIMIT));
  return item;
}

export function removeFromVaultTrash(id: string) {
  const list = readVaultTrash().filter((item) => item.id !== id);
  safeStorageSetJson(key(), list);
}

export function clearVaultTrash() {
  safeStorageSetJson(key(), []);
}

export function restoreFromVaultTrash<T = unknown>(id: string): T | null {
  const list = readVaultTrash<T>();
  const item = list.find((entry) => entry.id === id);
  if (!item) return null;
  safeStorageSetJson(key(), list.filter((entry) => entry.id !== id));
  return item.payload;
}
