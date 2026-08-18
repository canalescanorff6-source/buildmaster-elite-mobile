import { canonicalizePlayerPlaystyle } from './efootball2026Playstyles';
import { canonicalizeV600DefensivePlaystyle } from './efootballV600Playstyles';

export const DUAL_PLAYSTYLE_REGISTRY_V4080_R47 = '40.80-r47-dual-playstyle-registry' as const;
const STORAGE_KEY = 'buildmaster.dual-playstyle-registry.v4080-r47';

export type DualPlaystylePhase = 'OFFENSIVE' | 'DEFENSIVE';
export type LearnedPlaystyleEntry = {
  key: string;
  label: string;
  phase: DualPlaystylePhase;
  observations: number;
  firstSeenAt: string;
  lastSeenAt: string;
  confirmed: boolean;
  learned: boolean;
};
export type DualPlaystylePairEntry = {
  playerKey: string;
  playerName: string;
  offensive: string | null;
  defensive: string | null;
  observations: number;
  firstSeenAt: string;
  lastSeenAt: string;
};
export type DualPlaystyleRegistry = {
  version: string;
  styles: LearnedPlaystyleEntry[];
  pairs: DualPlaystylePairEntry[];
};

function normalize(value: unknown) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}
function clean(value: unknown) {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();
  return text.length >= 3 && text.length <= 64 ? text : null;
}
function emptyRegistry(): DualPlaystyleRegistry {
  return { version: DUAL_PLAYSTYLE_REGISTRY_V4080_R47, styles: [], pairs: [] };
}
export function readDualPlaystyleRegistry(): DualPlaystyleRegistry {
  if (typeof window === 'undefined') return emptyRegistry();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (!parsed || !Array.isArray(parsed.styles) || !Array.isArray(parsed.pairs)) return emptyRegistry();
    return { version: DUAL_PLAYSTYLE_REGISTRY_V4080_R47, styles: parsed.styles, pairs: parsed.pairs };
  } catch {
    return emptyRegistry();
  }
}
function writeRegistry(registry: DualPlaystyleRegistry) {
  if (typeof window === 'undefined') return;
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(registry)); } catch { /* armazenamento cheio/privado não bloqueia OCR */ }
}
function upsertStyle(registry: DualPlaystyleRegistry, phase: DualPlaystylePhase, raw: unknown, now: string) {
  const label = clean(raw);
  if (!label) return;
  const canonical = phase === 'OFFENSIVE' ? canonicalizePlayerPlaystyle(label) : canonicalizeV600DefensivePlaystyle(label);
  const display = canonical ?? label;
  const key = `${phase}:${normalize(display)}`;
  const existing = registry.styles.find((item) => item.key === key);
  if (existing) {
    existing.observations += 1;
    existing.lastSeenAt = now;
    existing.confirmed = existing.confirmed || Boolean(canonical);
    existing.learned = existing.confirmed || existing.observations >= 3;
    if (canonical) existing.label = canonical;
    return;
  }
  registry.styles.push({ key, label: display, phase, observations: 1, firstSeenAt: now, lastSeenAt: now, confirmed: Boolean(canonical), learned: Boolean(canonical) });
}

export function recordDualPlaystyleObservation(input: {
  playerName?: string | null;
  offensive?: string | null;
  defensive?: string | null;
}) {
  if (typeof window === 'undefined') return;
  const offensive = clean(input.offensive);
  const defensive = clean(input.defensive);
  if (!offensive && !defensive) return;
  const now = new Date().toISOString();
  const registry = readDualPlaystyleRegistry();
  upsertStyle(registry, 'OFFENSIVE', offensive, now);
  upsertStyle(registry, 'DEFENSIVE', defensive, now);

  const playerName = clean(input.playerName) ?? 'Jogador não identificado';
  const playerKey = normalize(playerName);
  const existing = registry.pairs.find((item) => item.playerKey === playerKey && normalize(item.offensive) === normalize(offensive) && normalize(item.defensive) === normalize(defensive));
  if (existing) {
    existing.observations += 1;
    existing.lastSeenAt = now;
  } else {
    registry.pairs.push({ playerKey, playerName, offensive, defensive, observations: 1, firstSeenAt: now, lastSeenAt: now });
  }
  registry.styles = registry.styles.sort((a,b) => b.observations - a.observations).slice(0, 160);
  registry.pairs = registry.pairs.sort((a,b) => b.observations - a.observations).slice(0, 320);
  writeRegistry(registry);
}
