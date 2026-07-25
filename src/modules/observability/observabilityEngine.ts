import { safeStorageGetJson, safeStorageSetJson } from '@/lib/safeLocalStorage';

export const OBSERVABILITY_VERSION = '29.70.0';
export const OBSERVABILITY_EVENTS_KEY = 'buildmaster_observability_events_v2970';
export const OBSERVABILITY_FLAGS_KEY = 'buildmaster_feature_flags_v2970';
export const OBSERVABILITY_SESSION_KEY = 'buildmaster_observability_session_v2970';
export const OBSERVABILITY_EVENT = 'buildmaster:observability-changed';

export type ObservabilityKind = 'navigation' | 'error' | 'performance' | 'ocr' | 'backup' | 'update' | 'storage' | 'support';
export type ObservabilityLevel = 'info' | 'warning' | 'critical';
export type FeatureFlagId = 'ocrVision2' | 'tacticalStudio2' | 'opponentAssistant' | 'antiDelay' | 'smartCoach' | 'community';

export type ObservabilityEventRecord = {
  id: string;
  at: string;
  kind: ObservabilityKind;
  level: ObservabilityLevel;
  area: string;
  code: string;
  message: string;
  durationMs: number | null;
};

export type FeatureFlagState = Record<FeatureFlagId, boolean>;

export type ObservabilitySnapshot = {
  score: number;
  status: 'healthy' | 'attention' | 'critical';
  total: number;
  errors: number;
  warnings: number;
  longTasks: number;
  slowestAreas: Array<{ area: string; averageMs: number; samples: number }>;
  recent: ObservabilityEventRecord[];
  flags: FeatureFlagState;
};

const DEFAULT_FLAGS: FeatureFlagState = {
  ocrVision2: true,
  tacticalStudio2: true,
  opponentAssistant: true,
  antiDelay: true,
  smartCoach: true,
  community: true
};

function text(value: unknown, limit: number): string {
  return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, limit);
}

function emit(detail: unknown) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(OBSERVABILITY_EVENT, { detail }));
}

export function readObservabilityEvents(): ObservabilityEventRecord[] {
  return safeStorageGetJson<ObservabilityEventRecord[]>(OBSERVABILITY_EVENTS_KEY, [])
    .filter((item) => Boolean(item?.id && item.kind && item.area))
    .slice(0, 300);
}

export function recordObservabilityEvent(input: Omit<ObservabilityEventRecord, 'id' | 'at' | 'message' | 'durationMs'> & { message: unknown; durationMs?: number | null }): ObservabilityEventRecord {
  const event: ObservabilityEventRecord = {
    id: `obs-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    at: new Date().toISOString(),
    kind: input.kind,
    level: input.level,
    area: text(input.area, 80) || 'app',
    code: text(input.code, 60) || 'event',
    message: text(input.message, 360) || 'Evento sem descrição.',
    durationMs: Number.isFinite(input.durationMs) ? Math.max(0, Math.round(Number(input.durationMs))) : null
  };
  const next = [event, ...readObservabilityEvents()].slice(0, 300);
  safeStorageSetJson(OBSERVABILITY_EVENTS_KEY, next);
  emit({ type: 'event', value: event });
  return event;
}

export function clearObservabilityEvents(): void {
  safeStorageSetJson(OBSERVABILITY_EVENTS_KEY, []);
  emit({ type: 'clear' });
}

export function readFeatureFlags(): FeatureFlagState {
  const raw = safeStorageGetJson<Partial<FeatureFlagState>>(OBSERVABILITY_FLAGS_KEY, DEFAULT_FLAGS);
  return { ...DEFAULT_FLAGS, ...raw };
}

export function saveFeatureFlags(value: FeatureFlagState): FeatureFlagState {
  const normalized: FeatureFlagState = {
    ocrVision2: value.ocrVision2 !== false,
    tacticalStudio2: value.tacticalStudio2 !== false,
    opponentAssistant: value.opponentAssistant !== false,
    antiDelay: value.antiDelay !== false,
    smartCoach: value.smartCoach !== false,
    community: value.community !== false
  };
  safeStorageSetJson(OBSERVABILITY_FLAGS_KEY, normalized);
  recordObservabilityEvent({ kind: 'support', level: 'warning', area: 'feature-flags', code: 'flags-updated', message: 'Módulos opcionais atualizados pelo painel local de emergência.' });
  emit({ type: 'flags', value: normalized });
  return normalized;
}

export function isFeatureEnabled(id: FeatureFlagId): boolean {
  return readFeatureFlags()[id];
}

export function buildObservabilitySnapshot(events = readObservabilityEvents(), flags = readFeatureFlags()): ObservabilitySnapshot {
  const errors = events.filter((item) => item.level === 'critical').length;
  const warnings = events.filter((item) => item.level === 'warning').length;
  const longTasks = events.filter((item) => item.kind === 'performance' && (item.durationMs ?? 0) >= 120).length;
  const areas = new Map<string, number[]>();
  for (const item of events) {
    if (item.durationMs === null) continue;
    const list = areas.get(item.area) ?? [];
    list.push(item.durationMs);
    areas.set(item.area, list);
  }
  const slowestAreas = Array.from(areas.entries()).map(([area, values]) => ({ area, averageMs: Math.round(values.reduce((sum, value) => sum + value, 0) / values.length), samples: values.length })).sort((a, b) => b.averageMs - a.averageMs).slice(0, 6);
  const score = Math.max(0, 100 - Math.min(55, errors * 12) - Math.min(25, warnings * 3) - Math.min(20, longTasks * 2));
  return {
    score,
    status: score >= 85 ? 'healthy' : score >= 60 ? 'attention' : 'critical',
    total: events.length,
    errors,
    warnings,
    longTasks,
    slowestAreas,
    recent: events.slice(0, 30),
    flags
  };
}

function checksum(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36).toUpperCase().padStart(7, '0');
}

export function createSupportCode(version: string, generatedAt = new Date().toISOString()): string {
  return `BM-${version.replace(/\./g, '')}-${checksum(`${version}|${generatedAt}`).slice(0, 7)}`;
}

export function createObservabilitySupportBundle(input: { version: string; snapshot?: ObservabilitySnapshot; health?: unknown; integrity?: unknown }): string {
  const generatedAt = new Date().toISOString();
  const snapshot = input.snapshot ?? buildObservabilitySnapshot();
  const payload = {
    schemaVersion: 1,
    app: 'BuildMaster Elite Tático',
    version: input.version,
    generatedAt,
    supportCode: createSupportCode(input.version, generatedAt),
    observability: snapshot,
    health: input.health ?? null,
    integrity: input.integrity ?? null,
    runtime: typeof navigator === 'undefined' ? null : {
      online: navigator.onLine,
      language: navigator.language,
      platform: navigator.platform,
      logicalCores: navigator.hardwareConcurrency || null,
      viewport: typeof window === 'undefined' ? null : `${window.innerWidth}x${window.innerHeight}`
    },
    privacy: {
      redacted: true,
      excluded: ['senha', 'token', 'sessão', 'e-mail', 'nome de usuário', 'imagem', 'texto integral do OCR', 'conteúdo das fichas']
    }
  };
  return JSON.stringify(payload, null, 2);
}

export function exportObservabilityState() {
  return { version: OBSERVABILITY_VERSION, events: readObservabilityEvents(), flags: readFeatureFlags() };
}

export function importObservabilityState(value: unknown): void {
  if (!value || typeof value !== 'object') return;
  const source = value as { events?: ObservabilityEventRecord[]; flags?: Partial<FeatureFlagState> };
  if (Array.isArray(source.events)) safeStorageSetJson(OBSERVABILITY_EVENTS_KEY, source.events.slice(0, 300));
  if (source.flags && typeof source.flags === 'object') saveFeatureFlags({ ...DEFAULT_FLAGS, ...source.flags });
  emit({ type: 'import' });
}
