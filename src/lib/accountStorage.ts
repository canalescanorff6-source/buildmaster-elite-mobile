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
const SAFE_ID_TEST = /^[a-zA-Z0-9_-]+$/;

function legacyNamespaceForId(accountId: string | null | undefined): string {
  const normalized = String(accountId || '').trim();
  if (!normalized) return 'legacy-local';
  return normalized.replace(SAFE_ID, '_').slice(0, 80) || 'legacy-local';
}

function stableAccountIdHash(value: string): string {
  let left = 2166136261;
  let right = 2246822519;
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    left ^= code;
    left = Math.imul(left, 16777619);
    right ^= code + index;
    right = Math.imul(right, 3266489917);
  }
  return `${(left >>> 0).toString(36)}${(right >>> 0).toString(36)}`;
}

export function accountNamespaceForId(accountId: string | null | undefined): string {
  const normalized = String(accountId || '').trim();
  if (!normalized) return 'legacy-local';

  // UUIDs/IDs já seguros permanecem idênticos para não esconder dados existentes.
  if (normalized.length <= 80 && SAFE_ID_TEST.test(normalized)) return normalized;

  // IDs que antes colidiam por sanitização/truncamento ganham uma assinatura do ID completo.
  const legacy = legacyNamespaceForId(normalized);
  const suffix = `_h${stableAccountIdHash(normalized)}`;
  const prefix = legacy.slice(0, Math.max(1, 80 - suffix.length));
  return `${prefix}${suffix}`;
}

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
  return accountNamespaceForId(identity?.id || 'legacy-local');
}

export function legacyActiveAccountNamespace(): string {
  const identity = getActiveAccountIdentity();
  return legacyNamespaceForId(identity?.id || 'legacy-local');
}

export function accountStorageKey(baseKey: string): string {
  return `buildmaster_account_${activeAccountNamespace()}__${baseKey}`;
}

export function legacyAccountStorageKey(baseKey: string): string {
  return `buildmaster_account_${legacyActiveAccountNamespace()}__${baseKey}`;
}

export function accountDatabaseName(baseName: string): string {
  return `${baseName}__${activeAccountNamespace()}`;
}

export function legacyAccountDatabaseName(baseName: string): string {
  return `${baseName}__${legacyActiveAccountNamespace()}`;
}

export function readAccountStorage(baseKey: string, options?: { migrateLegacy?: boolean }): string | null {
  const scoped = accountStorageKey(baseKey);
  const current = safeStorageGet(scoped);
  if (current != null) return current;

  // Migra silenciosamente o namespace sanitizado antigo quando o ID passou a usar hash.
  const legacyScoped = legacyAccountStorageKey(baseKey);
  if (legacyScoped !== scoped) {
    const legacyScopedValue = safeStorageGet(legacyScoped);
    if (legacyScopedValue != null) {
      safeStorageSet(scoped, legacyScopedValue);
      return legacyScopedValue;
    }
  }

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
  const scoped = accountStorageKey(baseKey);
  const legacyScoped = legacyAccountStorageKey(baseKey);
  const removedCurrent = safeStorageRemove(scoped);
  if (legacyScoped !== scoped) safeStorageRemove(legacyScoped);
  return removedCurrent;
}
