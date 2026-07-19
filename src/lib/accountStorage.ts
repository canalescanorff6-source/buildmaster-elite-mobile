import { safeStorageGet, safeStorageGetJson, safeStorageRemove, safeStorageSet, safeStorageSetJson } from './safeLocalStorage';

export const ACTIVE_ACCOUNT_IDENTITY_KEY = 'buildmaster_account_identity_v1';

export type AccountIdentity = {
  id: string;
  username: string;
  role: 'admin' | 'user';
  expiresAt?: string | null;
  mode: 'cloud' | 'local';
};

const SAFE_ID = /[^a-zA-Z0-9_-]+/g;

export function getActiveAccountIdentity(): AccountIdentity | null {
  const value = safeStorageGetJson<Partial<AccountIdentity> | null>(ACTIVE_ACCOUNT_IDENTITY_KEY, null);
  if (!value?.id || !value.username || (value.role !== 'admin' && value.role !== 'user')) return null;
  return {
    id: String(value.id).slice(0, 160),
    username: String(value.username).slice(0, 120),
    role: value.role,
    expiresAt: value.expiresAt ? String(value.expiresAt) : null,
    mode: value.mode === 'cloud' ? 'cloud' : 'local'
  };
}

export function setActiveAccountIdentity(identity: AccountIdentity) {
  safeStorageSetJson(ACTIVE_ACCOUNT_IDENTITY_KEY, identity);
}

export function clearActiveAccountIdentity() {
  safeStorageRemove(ACTIVE_ACCOUNT_IDENTITY_KEY);
}

export function activeAccountNamespace(): string {
  const identity = getActiveAccountIdentity();
  const id = identity?.id || 'legacy-local';
  return id.replace(SAFE_ID, '_').slice(0, 80) || 'legacy-local';
}

export function accountStorageKey(baseKey: string): string {
  return `buildmaster_account_${activeAccountNamespace()}__${baseKey}`;
}

export function accountDatabaseName(baseName: string): string {
  return `${baseName}__${activeAccountNamespace()}`;
}

export function readAccountStorage(baseKey: string, options?: { migrateLegacy?: boolean }): string | null {
  const scoped = accountStorageKey(baseKey);
  const current = safeStorageGet(scoped);
  if (current != null) return current;
  const identity = getActiveAccountIdentity();
  const mayMigrateLegacy = options?.migrateLegacy ?? (identity?.role === 'admin');
  if (!mayMigrateLegacy) return null;
  const legacy = safeStorageGet(baseKey);
  if (legacy != null) safeStorageSet(scoped, legacy);
  return legacy;
}

export function writeAccountStorage(baseKey: string, value: string): boolean {
  return safeStorageSet(accountStorageKey(baseKey), value);
}

export function removeAccountStorage(baseKey: string): boolean {
  return safeStorageRemove(accountStorageKey(baseKey));
}
