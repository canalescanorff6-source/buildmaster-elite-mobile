import { safeStorageGetJson, safeStorageRemove, safeStorageSetJson } from './safeLocalStorage';
import { createStableId } from './stableId';

export type UpdateAuditOutcome = 'info' | 'success' | 'warning' | 'error';

export type UpdateAuditEntry = {
  id: string;
  at: string;
  phase: 'auto-check' | 'manual-check' | 'diagnostic' | 'backup' | 'download' | 'install' | 'cache';
  outcome: UpdateAuditOutcome;
  message: string;
  detail?: string;
};

const UPDATE_AUDIT_KEY = 'buildmaster_update_audit_v2729';
const LEGACY_AUDIT_KEY = 'buildmaster_update_audit_v2723';
const MAX_AUDIT_ENTRIES = 40;

function sanitizeEntries(value: unknown): UpdateAuditEntry[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((entry): entry is UpdateAuditEntry => Boolean(entry && typeof entry === 'object' && typeof (entry as UpdateAuditEntry).message === 'string'))
    .map((entry) => ({
      id: String(entry.id || createStableId('update-audit')),
      at: Number.isNaN(Date.parse(entry.at)) ? new Date().toISOString() : entry.at,
      phase: entry.phase,
      outcome: entry.outcome,
      message: String(entry.message).slice(0, 500),
      detail: entry.detail ? String(entry.detail).slice(0, 1200) : undefined
    }))
    .slice(0, MAX_AUDIT_ENTRIES);
}

export function readUpdateAudit(): UpdateAuditEntry[] {
  const current = sanitizeEntries(safeStorageGetJson<unknown>(UPDATE_AUDIT_KEY, []));
  if (current.length) return current;
  const legacy = sanitizeEntries(safeStorageGetJson<unknown>(LEGACY_AUDIT_KEY, []));
  if (legacy.length) {
    safeStorageSetJson(UPDATE_AUDIT_KEY, legacy);
    safeStorageRemove(LEGACY_AUDIT_KEY);
  }
  return legacy;
}

export function appendUpdateAudit(entry: Omit<UpdateAuditEntry, 'id' | 'at'> & { at?: string }): UpdateAuditEntry[] {
  const nextEntry: UpdateAuditEntry = {
    id: createStableId('update-audit'),
    at: entry.at || new Date().toISOString(),
    phase: entry.phase,
    outcome: entry.outcome,
    message: entry.message.slice(0, 500),
    detail: entry.detail?.slice(0, 1200)
  };
  const next = [nextEntry, ...readUpdateAudit()].slice(0, MAX_AUDIT_ENTRIES);
  safeStorageSetJson(UPDATE_AUDIT_KEY, next);
  return next;
}

export function clearUpdateAudit(): void {
  safeStorageRemove(UPDATE_AUDIT_KEY);
  safeStorageRemove(LEGACY_AUDIT_KEY);
}

export function formatUpdateAudit(entries: UpdateAuditEntry[]): string {
  return entries.map((entry) => {
    const detail = entry.detail ? `\n  ${entry.detail}` : '';
    return `[${new Date(entry.at).toLocaleString('pt-BR')}] ${entry.phase.toUpperCase()} • ${entry.outcome.toUpperCase()}\n${entry.message}${detail}`;
  }).join('\n\n');
}
