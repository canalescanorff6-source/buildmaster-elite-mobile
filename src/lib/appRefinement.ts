import { safeStorageGetJson, safeStorageSetJson } from './safeLocalStorage';

export const APP_REFINEMENT_VERSION = 2810;
export const NAVIGATION_STATE_KEY = 'buildmaster_navigation_state_v2810';
const LEGACY_NAVIGATION_STATE_KEY = 'buildmaster_navigation_state_v2739';
export const SHORTCUTS_KEY = 'buildmaster_home_shortcuts_v2739';
export const FEATURE_FLAGS_KEY = 'buildmaster_feature_flags_v2739';
export const DECISION_HISTORY_KEY = 'buildmaster_decision_history_v2739';
export const PRESETS_KEY = 'buildmaster_personal_presets_v2739';
export const DEMO_MODE_KEY = 'buildmaster_demo_mode_v2739';
export const PERFORMANCE_LOG_KEY = 'buildmaster_performance_log_v2739';

export type MainNavigationGroup = 'inicio' | 'jogadores' | 'time' | 'partidas' | 'ajustes';
export type PlayerWorkspace = 'visao-geral' | 'leitor' | 'manual' | 'resultado' | 'cofre';
export type RefinementFeatureFlag =
  | 'guidedReader'
  | 'unifiedPlayers'
  | 'smartHome'
  | 'accessibleDialogs'
  | 'performanceMonitor'
  | 'demoMode'
  | 'universalCompare'
  | 'contextHelp';

export type NavigationSnapshot = {
  version: 2;
  group: MainNavigationGroup;
  playerWorkspace?: PlayerWorkspace;
  scrollY: number;
  updatedAt: string;
};

export type HomeShortcutId = 'continue' | 'new-card' | 'team' | 'match' | 'backup' | 'updates';

export type DecisionHistoryItem = {
  id: string;
  at: string;
  subject: string;
  decision: string;
  reason: string;
};

export type PersonalPreset = {
  id: string;
  name: string;
  category: 'ficha' | 'time' | 'treino' | 'formacao';
  payload: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type PerformanceSample = {
  name: string;
  milliseconds: number;
  at: string;
  detail?: string;
};

const DEFAULT_FLAGS: Record<RefinementFeatureFlag, boolean> = {
  guidedReader: true,
  unifiedPlayers: true,
  smartHome: true,
  accessibleDialogs: true,
  performanceMonitor: true,
  demoMode: true,
  universalCompare: true,
  contextHelp: true
};

export function getRefinementFlags() {
  return { ...DEFAULT_FLAGS, ...safeStorageGetJson<Partial<Record<RefinementFeatureFlag, boolean>>>(FEATURE_FLAGS_KEY, {}) };
}

export function setRefinementFlag(flag: RefinementFeatureFlag, enabled: boolean) {
  const next = { ...getRefinementFlags(), [flag]: enabled };
  safeStorageSetJson(FEATURE_FLAGS_KEY, next);
  return next;
}

export function readNavigationSnapshot(): NavigationSnapshot | null {
  const value = safeStorageGetJson<NavigationSnapshot | null>(NAVIGATION_STATE_KEY, null);
  if (value?.version === 2) return value;
  const legacy = safeStorageGetJson<(Omit<NavigationSnapshot, 'version'> & { version: 1 }) | null>(LEGACY_NAVIGATION_STATE_KEY, null);
  if (!legacy || legacy.version !== 1) return null;
  const migrated: NavigationSnapshot = { ...legacy, version: 2 };
  safeStorageSetJson(NAVIGATION_STATE_KEY, migrated);
  return migrated;
}

export function writeNavigationSnapshot(snapshot: Omit<NavigationSnapshot, 'version' | 'updatedAt'>) {
  safeStorageSetJson(NAVIGATION_STATE_KEY, { version: 2, updatedAt: new Date().toISOString(), ...snapshot } satisfies NavigationSnapshot);
}

export function readHomeShortcuts(): HomeShortcutId[] {
  const allowed = new Set<HomeShortcutId>(['continue', 'new-card', 'team', 'match', 'backup', 'updates']);
  const stored = safeStorageGetJson<HomeShortcutId[]>(SHORTCUTS_KEY, ['continue', 'team', 'match', 'backup']);
  const clean = stored.filter((item, index) => allowed.has(item) && stored.indexOf(item) === index).slice(0, 4);
  return clean.length ? clean : ['continue', 'team', 'match', 'backup'];
}

export function saveHomeShortcuts(shortcuts: HomeShortcutId[]) {
  safeStorageSetJson(SHORTCUTS_KEY, shortcuts.slice(0, 4));
}

export function appendDecisionHistory(item: Omit<DecisionHistoryItem, 'id' | 'at'>) {
  const list = safeStorageGetJson<DecisionHistoryItem[]>(DECISION_HISTORY_KEY, []);
  const next: DecisionHistoryItem = {
    id: `decision-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    at: new Date().toISOString(),
    ...item
  };
  safeStorageSetJson(DECISION_HISTORY_KEY, [next, ...list].slice(0, 150));
  return next;
}

export function readDecisionHistory() {
  return safeStorageGetJson<DecisionHistoryItem[]>(DECISION_HISTORY_KEY, []);
}

export function readPersonalPresets() {
  return safeStorageGetJson<PersonalPreset[]>(PRESETS_KEY, []);
}

export function upsertPersonalPreset(input: Omit<PersonalPreset, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) {
  const now = new Date().toISOString();
  const list = readPersonalPresets();
  const existing = input.id ? list.find((item) => item.id === input.id) : null;
  const preset: PersonalPreset = {
    id: input.id || `preset-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: input.name.trim().slice(0, 80),
    category: input.category,
    payload: input.payload,
    createdAt: existing?.createdAt || now,
    updatedAt: now
  };
  safeStorageSetJson(PRESETS_KEY, [preset, ...list.filter((item) => item.id !== preset.id)].slice(0, 100));
  return preset;
}

export function deletePersonalPreset(id: string) {
  safeStorageSetJson(PRESETS_KEY, readPersonalPresets().filter((item) => item.id !== id));
}

export function isDemoModeEnabled() {
  return safeStorageGetJson<boolean>(DEMO_MODE_KEY, false);
}

export function setDemoMode(enabled: boolean) {
  safeStorageSetJson(DEMO_MODE_KEY, enabled);
  return enabled;
}

export function recordPerformanceSample(sample: Omit<PerformanceSample, 'at'>) {
  const list = safeStorageGetJson<PerformanceSample[]>(PERFORMANCE_LOG_KEY, []);
  const next = { ...sample, at: new Date().toISOString() };
  safeStorageSetJson(PERFORMANCE_LOG_KEY, [next, ...list].slice(0, 100));
  return next;
}

export function readPerformanceSamples() {
  return safeStorageGetJson<PerformanceSample[]>(PERFORMANCE_LOG_KEY, []);
}

export async function measureAsync<T>(name: string, task: () => Promise<T>, detail?: string): Promise<T> {
  const started = typeof performance !== 'undefined' ? performance.now() : Date.now();
  try {
    return await task();
  } finally {
    const ended = typeof performance !== 'undefined' ? performance.now() : Date.now();
    recordPerformanceSample({ name, milliseconds: Math.max(0, Math.round((ended - started) * 10) / 10), detail });
  }
}

export function parseInternalDeepLink(hash: string): { group: MainNavigationGroup; workspace?: PlayerWorkspace } | null {
  const clean = hash.replace(/^#\/?/, '').trim().toLowerCase();
  if (!clean) return null;
  const [group, workspace] = clean.split('/');
  if (!['inicio', 'jogadores', 'time', 'partidas', 'ajustes'].includes(group)) return null;
  if (group !== 'jogadores') return { group: group as MainNavigationGroup };
  const validWorkspace = ['visao-geral', 'leitor', 'manual', 'resultado', 'cofre'].includes(workspace || '') ? workspace as PlayerWorkspace : 'visao-geral';
  return { group: 'jogadores', workspace: validWorkspace };
}
