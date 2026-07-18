export type UpdateAuditOutcome = 'info' | 'success' | 'warning' | 'error';

export type UpdateAuditEntry = {
  id: string;
  at: string;
  phase: 'auto-check' | 'manual-check' | 'diagnostic' | 'backup' | 'download' | 'install' | 'cache';
  outcome: UpdateAuditOutcome;
  message: string;
  detail?: string;
};

const UPDATE_AUDIT_KEY = 'buildmaster_update_audit_v2723';
const MAX_AUDIT_ENTRIES = 30;

function canUseStorage() {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

export function readUpdateAudit(): UpdateAuditEntry[] {
  if (!canUseStorage()) return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(UPDATE_AUDIT_KEY) || '[]') as UpdateAuditEntry[];
    return Array.isArray(parsed) ? parsed.filter((entry) => entry && typeof entry.message === 'string').slice(0, MAX_AUDIT_ENTRIES) : [];
  } catch {
    return [];
  }
}

export function appendUpdateAudit(entry: Omit<UpdateAuditEntry, 'id' | 'at'> & { at?: string }): UpdateAuditEntry[] {
  if (!canUseStorage()) return [];
  const nextEntry: UpdateAuditEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    at: entry.at || new Date().toISOString(),
    phase: entry.phase,
    outcome: entry.outcome,
    message: entry.message,
    detail: entry.detail
  };
  const next = [nextEntry, ...readUpdateAudit()].slice(0, MAX_AUDIT_ENTRIES);
  localStorage.setItem(UPDATE_AUDIT_KEY, JSON.stringify(next));
  return next;
}

export function clearUpdateAudit(): void {
  if (canUseStorage()) localStorage.removeItem(UPDATE_AUDIT_KEY);
}

export function formatUpdateAudit(entries: UpdateAuditEntry[]): string {
  return entries.map((entry) => {
    const detail = entry.detail ? `\n  ${entry.detail}` : '';
    return `[${new Date(entry.at).toLocaleString('pt-BR')}] ${entry.phase.toUpperCase()} • ${entry.outcome.toUpperCase()}\n${entry.message}${detail}`;
  }).join('\n\n');
}
