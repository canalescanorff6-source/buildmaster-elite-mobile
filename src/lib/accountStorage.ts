export const ACTIVE_ACCOUNT_IDENTITY_KEY = 'buildmaster_account_identity_v1';

type AccountIdentity = {
  id: string;
  username: string;
  role: 'admin' | 'user';
  expiresAt?: string | null;
  mode: 'cloud' | 'local';
};

const SAFE_ID = /[^a-zA-Z0-9_-]+/g;

export function getActiveAccountIdentity(): AccountIdentity | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(ACTIVE_ACCOUNT_IDENTITY_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<AccountIdentity>;
    if (!value.id || !value.username || (value.role !== 'admin' && value.role !== 'user')) return null;
    return {
      id: String(value.id),
      username: String(value.username),
      role: value.role,
      expiresAt: value.expiresAt ? String(value.expiresAt) : null,
      mode: value.mode === 'cloud' ? 'cloud' : 'local'
    };
  } catch {
    return null;
  }
}

export function setActiveAccountIdentity(identity: AccountIdentity) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACTIVE_ACCOUNT_IDENTITY_KEY, JSON.stringify(identity));
}

export function clearActiveAccountIdentity() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ACTIVE_ACCOUNT_IDENTITY_KEY);
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
  if (typeof window === 'undefined') return null;
  const scoped = accountStorageKey(baseKey);
  const current = localStorage.getItem(scoped);
  if (current != null) return current;
  const identity = getActiveAccountIdentity();
  const mayMigrateLegacy = options?.migrateLegacy ?? (identity?.role === 'admin');
  if (!mayMigrateLegacy) return null;
  const legacy = localStorage.getItem(baseKey);
  if (legacy != null) {
    try {
      localStorage.setItem(scoped, legacy);
    } catch {
      // A migração é auxiliar; o dado legado continua disponível.
    }
  }
  return legacy;
}

export function writeAccountStorage(baseKey: string, value: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(accountStorageKey(baseKey), value);
}

export function removeAccountStorage(baseKey: string) {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(accountStorageKey(baseKey));
}
