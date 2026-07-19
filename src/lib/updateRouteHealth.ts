import type { AppUpdateManifest } from './appUpdates';
import type { UpdateManifestCandidate } from './updateChannel';
import { safeStorageGetJson, safeStorageSetJson } from './safeLocalStorage';

const STORAGE_KEY = 'buildmaster_update_route_health_v1';
const MAX_RECORDS = 24;
const INTEGRITY_COOLDOWN_MS = 12 * 60 * 60 * 1000;
const TRANSIENT_COOLDOWN_MS = 15 * 60 * 1000;

export type UpdateRouteHealthRecord = {
  key: string;
  failures: number;
  lastFailureAt?: number;
  lastSuccessAt?: number;
  blockedUntil?: number;
  lastReason?: string;
};

type Store = Record<string, UpdateRouteHealthRecord>;

function routeKey(manifest: AppUpdateManifest): string {
  try {
    const url = new URL(manifest.apkUrl);
    return `${url.hostname}${url.pathname}`.toLowerCase();
  } catch {
    return manifest.apkUrl.toLowerCase();
  }
}

function readStore(): Store {
  return safeStorageGetJson<Store>(STORAGE_KEY, {});
}

function writeStore(store: Store) {
  const records = Object.values(store)
    .sort((a, b) => Math.max(b.lastFailureAt || 0, b.lastSuccessAt || 0) - Math.max(a.lastFailureAt || 0, a.lastSuccessAt || 0))
    .slice(0, MAX_RECORDS);
  safeStorageSetJson(STORAGE_KEY, Object.fromEntries(records.map((record) => [record.key, record])));
}

export function recordUpdateRouteFailure(manifest: AppUpdateManifest, reason: string, integrityFailure: boolean) {
  const store = readStore();
  const key = routeKey(manifest);
  const now = Date.now();
  const current = store[key] || { key, failures: 0 };
  store[key] = {
    ...current,
    failures: Math.min(20, current.failures + 1),
    lastFailureAt: now,
    blockedUntil: now + (integrityFailure ? INTEGRITY_COOLDOWN_MS : TRANSIENT_COOLDOWN_MS),
    lastReason: reason.slice(0, 320)
  };
  writeStore(store);
}

export function recordUpdateRouteSuccess(manifest: AppUpdateManifest) {
  const store = readStore();
  const key = routeKey(manifest);
  store[key] = {
    key,
    failures: 0,
    lastSuccessAt: Date.now(),
    blockedUntil: 0,
    lastReason: undefined
  };
  writeStore(store);
}

export function routeHealthFor(manifest: AppUpdateManifest): UpdateRouteHealthRecord | null {
  return readStore()[routeKey(manifest)] || null;
}

function routePenalty(candidate: UpdateManifestCandidate): number {
  const health = routeHealthFor(candidate.manifest);
  if (!health) return 0;
  const blocked = Number(health.blockedUntil || 0) > Date.now();
  return (blocked ? 10_000 : 0) + health.failures * 100 - (health.lastSuccessAt ? 10 : 0);
}

export function rankUpdateCandidatesByHealth(candidates: UpdateManifestCandidate[]): UpdateManifestCandidate[] {
  return [...candidates].sort((left, right) => {
    const penaltyDelta = routePenalty(left) - routePenalty(right);
    if (penaltyDelta !== 0) return penaltyDelta;
    return 0;
  });
}

export function describeUpdateRouteHealth(manifest: AppUpdateManifest): string {
  const health = routeHealthFor(manifest);
  if (!health) return 'rota ainda sem histórico neste aparelho';
  if (health.blockedUntil && health.blockedUntil > Date.now()) {
    return `rota em espera até ${new Date(health.blockedUntil).toLocaleString('pt-BR')} após ${health.failures} falha(s)`;
  }
  if (health.lastSuccessAt) return `último sucesso em ${new Date(health.lastSuccessAt).toLocaleString('pt-BR')}`;
  return `${health.failures} falha(s) registrada(s)`;
}

export function clearUpdateRouteHealth() {
  safeStorageSetJson(STORAGE_KEY, {});
}
