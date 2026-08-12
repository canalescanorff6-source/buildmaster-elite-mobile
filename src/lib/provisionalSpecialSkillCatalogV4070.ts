import { readAccountStorage, writeAccountStorage } from './accountStorage';

export const PROVISIONAL_SPECIAL_SKILL_CATALOG_V4070_VERSION = '40.70.0' as const;
export const PROVISIONAL_SPECIAL_SKILL_STORAGE_KEY_V4070 = 'buildmaster_provisional_special_skills_v4070';

export type ProvisionalSpecialSkillStatusV4070 = 'provisional' | 'confirmed' | 'rejected';

export type ProvisionalSpecialSkillV4070 = {
  name: string;
  aliases: string[];
  status: ProvisionalSpecialSkillStatusV4070;
  firstSeenAt: string;
  lastSeenAt: string;
  observations: number;
  independentPasses: number;
  bestConfidence: number;
  source: 'ocr' | 'manual' | 'official-patch';
  note?: string;
};

function normalize(value: string | null | undefined) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function sanitizeName(value: string) {
  return value.replace(/[|•·]/g, ' ').replace(/\s+/g, ' ').replace(/^[+\-–—\s]+|[+\-–—\s]+$/g, '').trim().slice(0, 64);
}

function readEntries(): ProvisionalSpecialSkillV4070[] {
  try {
    const raw = readAccountStorage(PROVISIONAL_SPECIAL_SKILL_STORAGE_KEY_V4070);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((item): item is ProvisionalSpecialSkillV4070 => Boolean(item && typeof item.name === 'string')) : [];
  } catch {
    return [];
  }
}

function writeEntries(entries: ProvisionalSpecialSkillV4070[]) {
  writeAccountStorage(PROVISIONAL_SPECIAL_SKILL_STORAGE_KEY_V4070, JSON.stringify(entries.slice(0, 120)));
}

export function listProvisionalSpecialSkillsV4070(includeRejected = false) {
  return readEntries().filter((entry) => includeRejected || entry.status !== 'rejected');
}

export function resolveProvisionalSpecialSkillNameV4070(value: string | null | undefined) {
  const key = normalize(value);
  if (!key) return null;
  const entry = readEntries().find((candidate) => candidate.status !== 'rejected' && [candidate.name, ...candidate.aliases].some((alias) => normalize(alias) === key));
  return entry?.name ?? null;
}

export function isProvisionalSpecialSkillV4070(value: string | null | undefined) {
  return Boolean(resolveProvisionalSpecialSkillNameV4070(value));
}

export function recordProvisionalSpecialSkillV4070(input: {
  name: string;
  confidence?: number;
  independentPasses?: number;
  source?: ProvisionalSpecialSkillV4070['source'];
  alias?: string;
  note?: string;
}) {
  const name = sanitizeName(input.name);
  const key = normalize(name);
  if (!key) return null;
  const now = new Date().toISOString();
  const entries = readEntries();
  const index = entries.findIndex((entry) => [entry.name, ...entry.aliases].some((alias) => normalize(alias) === key));
  const confidence = Math.max(0, Math.min(100, Math.round(input.confidence ?? 75)));
  const passes = Math.max(1, Math.min(12, Math.round(input.independentPasses ?? 1)));
  if (index >= 0) {
    const current = entries[index];
    const aliases = Array.from(new Set([...current.aliases, ...(input.alias ? [sanitizeName(input.alias)] : [])].filter(Boolean)));
    entries[index] = {
      ...current,
      aliases,
      lastSeenAt: now,
      observations: current.observations + 1,
      independentPasses: Math.max(current.independentPasses, passes),
      bestConfidence: Math.max(current.bestConfidence, confidence),
      note: input.note ?? current.note
    };
    writeEntries(entries);
    return entries[index];
  }
  const entry: ProvisionalSpecialSkillV4070 = {
    name,
    aliases: input.alias ? [sanitizeName(input.alias)].filter(Boolean) : [],
    status: input.source === 'official-patch' ? 'confirmed' : 'provisional',
    firstSeenAt: now,
    lastSeenAt: now,
    observations: 1,
    independentPasses: passes,
    bestConfidence: confidence,
    source: input.source ?? 'ocr',
    note: input.note
  };
  entries.unshift(entry);
  writeEntries(entries);
  return entry;
}

export function setProvisionalSpecialSkillStatusV4070(name: string, status: ProvisionalSpecialSkillStatusV4070) {
  const key = normalize(name);
  const entries = readEntries();
  const index = entries.findIndex((entry) => normalize(entry.name) === key || entry.aliases.some((alias) => normalize(alias) === key));
  if (index < 0) return false;
  entries[index] = { ...entries[index], status, lastSeenAt: new Date().toISOString() };
  writeEntries(entries);
  return true;
}
