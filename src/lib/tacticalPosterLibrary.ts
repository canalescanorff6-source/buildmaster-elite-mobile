import { readAccountStorage, writeAccountStorage } from './accountStorage';
import { createStableId } from './stableId';
import type {
  TacticalPosterArrow,
  TacticalPosterCustomColors,
  TacticalPosterDisplayOptions,
  TacticalPosterOrientation,
  TacticalPosterPalette,
  TacticalPosterPlayerOverride
} from './tacticalPoster';

const STORAGE_KEY = 'buildmaster_tactical_poster_library_v2736';
const LEGACY_STORAGE_KEYS = ['buildmaster_tactical_poster_library_v2734', 'buildmaster_tactical_poster_library_v2733', 'buildmaster_tactical_poster_library_v2732'];
const MAX_PROJECTS = 60;
const MAX_ARROWS = 24;
const PALETTES: TacticalPosterPalette[] = ['ouro', 'ciano', 'rubi', 'esmeralda', 'grafite'];
const ARROW_KINDS = ['support', 'recycle', 'defend', 'movement'] as const;

export type TacticalPosterEditableState = {
  title: string;
  subtitle: string;
  focus: string;
  palette: TacticalPosterPalette;
  orientation: TacticalPosterOrientation;
  options: TacticalPosterDisplayOptions;
  playerOverrides: Record<string, TacticalPosterPlayerOverride>;
  backgroundImageId?: string;
  backgroundImageOpacity: number;
  customColors: TacticalPosterCustomColors;
  useAutomaticArrows: boolean;
  manualArrows: TacticalPosterArrow[];
  passing: string;
  recycle: string;
  attack: string;
  defend: string;
  offensive: string;
  defensive: string;
  avoid: string;
  whyItWorks: string;
};

export type SavedTacticalPosterProject = TacticalPosterEditableState & {
  id: string;
  name: string;
  formationId: string;
  formationName: string;
  createdAt: string;
  updatedAt: string;
  schema: 2736;
};

function cleanText(value: unknown, max: number): string {
  return String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);
}

function cleanHex(value: unknown): string | undefined {
  const text = String(value ?? '').trim();
  return /^#[0-9a-f]{6}$/i.test(text) ? text.toLowerCase() : undefined;
}

function normalizeCustomColors(value: unknown): TacticalPosterCustomColors {
  if (!value || typeof value !== 'object') return {};
  const raw = value as TacticalPosterCustomColors;
  return {
    accent: cleanHex(raw.accent),
    secondary: cleanHex(raw.secondary),
    danger: cleanHex(raw.danger),
    field: cleanHex(raw.field)
  };
}

function normalizeOverrides(value: unknown): Record<string, TacticalPosterPlayerOverride> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const entries = Object.entries(value as Record<string, unknown>).slice(0, 24).flatMap(([slotId, raw]) => {
    if (!raw || typeof raw !== 'object') return [];
    const item = raw as TacticalPosterPlayerOverride;
    const safeId = cleanText(slotId, 100);
    if (!safeId) return [];
    return [[safeId, { name: cleanText(item.name, 90), role: cleanText(item.role, 90), x: Number.isFinite(Number(item.x)) ? Math.max(2, Math.min(98, Number(item.x))) : undefined, y: Number.isFinite(Number(item.y)) ? Math.max(2, Math.min(98, Number(item.y))) : undefined }] as const];
  });
  return Object.fromEntries(entries);
}

function normalizeArrows(value: unknown): TacticalPosterArrow[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, MAX_ARROWS).flatMap((raw, index) => {
    if (!raw || typeof raw !== 'object') return [];
    const item = raw as Partial<TacticalPosterArrow>;
    const fromSlotId = cleanText(item.fromSlotId, 100);
    const toSlotId = cleanText(item.toSlotId, 100);
    if (!fromSlotId || !toSlotId || fromSlotId === toSlotId) return [];
    const kind = ARROW_KINDS.includes(item.kind as typeof ARROW_KINDS[number]) ? item.kind as TacticalPosterArrow['kind'] : 'support';
    return [{
      id: cleanText(item.id, 150) || `arrow-${index + 1}`,
      fromSlotId,
      toSlotId,
      kind,
      bend: Math.max(-90, Math.min(90, Number(item.bend) || 0)),
      label: cleanText(item.label, 40),
      enabled: item.enabled !== false
    }];
  });
}

export function normalizeTacticalPosterState(value: unknown): TacticalPosterEditableState | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Partial<TacticalPosterEditableState>;
  if (typeof raw.title !== 'string' || typeof raw.subtitle !== 'string' || typeof raw.focus !== 'string') return null;
  const options: Partial<TacticalPosterDisplayOptions> = raw.options && typeof raw.options === 'object' ? raw.options : {};
  return {
    title: cleanText(raw.title, 80),
    subtitle: cleanText(raw.subtitle, 100),
    focus: cleanText(raw.focus, 180),
    palette: PALETTES.includes(raw.palette as TacticalPosterPalette) ? raw.palette as TacticalPosterPalette : 'ouro',
    orientation: raw.orientation === 'horizontal' ? 'horizontal' : 'vertical',
    options: {
      showArrows: options.showArrows !== false,
      showLegend: options.showLegend !== false,
      showInstructionPanels: options.showInstructionPanels !== false,
      showPrinciples: options.showPrinciples !== false,
      showPlayerNames: options.showPlayerNames !== false,
      showScores: options.showScores !== false,
      showFooter: options.showFooter !== false
    },
    playerOverrides: normalizeOverrides(raw.playerOverrides),
    backgroundImageId: cleanText(raw.backgroundImageId, 180) || undefined,
    backgroundImageOpacity: Math.max(0.05, Math.min(0.8, Number(raw.backgroundImageOpacity) || 0.2)),
    customColors: normalizeCustomColors(raw.customColors),
    useAutomaticArrows: raw.useAutomaticArrows !== false,
    manualArrows: normalizeArrows(raw.manualArrows),
    passing: cleanText(raw.passing, 1200),
    recycle: cleanText(raw.recycle, 1200),
    attack: cleanText(raw.attack, 1200),
    defend: cleanText(raw.defend, 1200),
    offensive: cleanText(raw.offensive, 1200),
    defensive: cleanText(raw.defensive, 1200),
    avoid: cleanText(raw.avoid, 1200),
    whyItWorks: cleanText(raw.whyItWorks, 1200)
  };
}

function normalizeProject(value: unknown): SavedTacticalPosterProject | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Partial<SavedTacticalPosterProject>;
  const state = normalizeTacticalPosterState(raw);
  if (!state || !raw.id || !raw.name || !raw.formationId) return null;
  return {
    ...state,
    id: cleanText(raw.id, 180),
    name: cleanText(raw.name, 90),
    formationId: cleanText(raw.formationId, 180),
    formationName: cleanText(raw.formationName, 120),
    createdAt: cleanText(raw.createdAt, 40) || new Date().toISOString(),
    updatedAt: cleanText(raw.updatedAt, 40) || new Date().toISOString(),
    schema: 2736
  };
}

function readRawLibrary(): unknown[] {
  const currentRaw = readAccountStorage(STORAGE_KEY);
  const legacyRaw = currentRaw ? '' : (LEGACY_STORAGE_KEYS.map((key) => readAccountStorage(key)).find(Boolean) || '');
  const source = currentRaw || legacyRaw || '[]';
  try {
    const parsed = JSON.parse(source) as unknown;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function readTacticalPosterLibrary(): SavedTacticalPosterProject[] {
  const normalized = readRawLibrary()
    .map(normalizeProject)
    .filter((item): item is SavedTacticalPosterProject => Boolean(item))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, MAX_PROJECTS);
  if (normalized.length && !readAccountStorage(STORAGE_KEY)) writeAccountStorage(STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

function persist(items: SavedTacticalPosterProject[]): SavedTacticalPosterProject[] {
  const normalized = items
    .map(normalizeProject)
    .filter((item): item is SavedTacticalPosterProject => Boolean(item))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, MAX_PROJECTS);
  writeAccountStorage(STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

export function saveTacticalPosterProject(input: {
  id?: string;
  name: string;
  formationId: string;
  formationName: string;
  state: TacticalPosterEditableState;
}): { project: SavedTacticalPosterProject; library: SavedTacticalPosterProject[] } {
  const current = readTacticalPosterLibrary();
  const existing = input.id ? current.find((item) => item.id === input.id) : undefined;
  const now = new Date().toISOString();
  const project = normalizeProject({
    ...input.state,
    id: existing?.id || createStableId('poster'),
    name: input.name || `${input.formationName} • arte tática`,
    formationId: input.formationId,
    formationName: input.formationName,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    schema: 2736
  });
  if (!project) throw new Error('Não foi possível preparar o projeto tático.');
  const library = persist([project, ...current.filter((item) => item.id !== project.id)]);
  return { project, library };
}

export function deleteTacticalPosterProject(id: string): SavedTacticalPosterProject[] {
  return persist(readTacticalPosterLibrary().filter((item) => item.id !== id));
}

export function duplicateTacticalPosterProject(id: string): { project: SavedTacticalPosterProject; library: SavedTacticalPosterProject[] } | null {
  const source = readTacticalPosterLibrary().find((item) => item.id === id);
  if (!source) return null;
  return saveTacticalPosterProject({
    name: `${source.name} cópia`,
    formationId: source.formationId,
    formationName: source.formationName,
    state: source
  });
}

export function exportTacticalPosterLibrary(): SavedTacticalPosterProject[] {
  return readTacticalPosterLibrary();
}

export function replaceTacticalPosterLibrary(value: unknown): SavedTacticalPosterProject[] {
  if (!Array.isArray(value)) throw new Error('A biblioteca do Estúdio Tático é inválida.');
  return persist(value.map(normalizeProject).filter((item): item is SavedTacticalPosterProject => Boolean(item)));
}
