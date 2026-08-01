import { readAccountStorage, writeAccountStorage } from './accountStorage';

export const REMOTE_CATALOG_V3770_VERSION = '37.70.0' as const;
export const REMOTE_CATALOG_V3770_STORAGE_KEY = 'buildmaster_remote_catalog_v3770';

export type RemoteCatalogStatusV3770 = 'active' | 'deprecated' | 'preview';

export type RemoteSkillCatalogEntryV3770 = {
  name: string;
  kind: 'additional' | 'special';
  status: RemoteCatalogStatusV3770;
  aliases: string[];
  mappedProfile?: string;
  introducedIn?: string;
  note?: string;
};

export type RemoteBoosterCatalogEntryV3770 = {
  name: string;
  status: RemoteCatalogStatusV3770;
  aliases: string[];
  attributes: string[];
  positions: string[];
  introducedIn?: string;
  note?: string;
};

export type RemoteCatalogPatchV3770 = {
  version: string;
  updatedAt: string;
  additionalSkills: RemoteSkillCatalogEntryV3770[];
  specialSkills: RemoteSkillCatalogEntryV3770[];
  boosters: RemoteBoosterCatalogEntryV3770[];
};

export const EMPTY_REMOTE_CATALOG_V3770: RemoteCatalogPatchV3770 = {
  version: REMOTE_CATALOG_V3770_VERSION,
  updatedAt: '2026-08-01T00:00:00.000Z',
  additionalSkills: [],
  specialSkills: [],
  boosters: []
};

export function normalizeRemoteCatalogIdentity(value: string | null | undefined) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback;
}

function cleanStringList(value: unknown, limit = 80) {
  return Array.isArray(value)
    ? Array.from(new Set(value.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean))).slice(0, limit)
    : [];
}

function cleanStatus(value: unknown): RemoteCatalogStatusV3770 {
  return value === 'deprecated' || value === 'preview' ? value : 'active';
}

function sanitizeSkill(value: unknown, kind: RemoteSkillCatalogEntryV3770['kind']): RemoteSkillCatalogEntryV3770 | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Partial<RemoteSkillCatalogEntryV3770>;
  const name = cleanString(raw.name);
  if (!name) return null;
  return {
    name,
    kind,
    status: cleanStatus(raw.status),
    aliases: cleanStringList(raw.aliases),
    mappedProfile: cleanString(raw.mappedProfile) || undefined,
    introducedIn: cleanString(raw.introducedIn) || undefined,
    note: cleanString(raw.note) || undefined
  };
}

function sanitizeBooster(value: unknown): RemoteBoosterCatalogEntryV3770 | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Partial<RemoteBoosterCatalogEntryV3770>;
  const name = cleanString(raw.name);
  if (!name) return null;
  return {
    name,
    status: cleanStatus(raw.status),
    aliases: cleanStringList(raw.aliases),
    attributes: cleanStringList(raw.attributes, 20),
    positions: cleanStringList(raw.positions, 20),
    introducedIn: cleanString(raw.introducedIn) || undefined,
    note: cleanString(raw.note) || undefined
  };
}

function uniqueByName<T extends { name: string }>(items: T[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = normalizeRemoteCatalogIdentity(item.name);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function sanitizeRemoteCatalogV3770(input: unknown, version: string = REMOTE_CATALOG_V3770_VERSION, updatedAt: string = new Date().toISOString()): RemoteCatalogPatchV3770 {
  const raw = input && typeof input === 'object' ? input as Partial<RemoteCatalogPatchV3770> : {};
  const additionalSkills = Array.isArray(raw.additionalSkills)
    ? raw.additionalSkills.map((item) => sanitizeSkill(item, 'additional')).filter((item): item is RemoteSkillCatalogEntryV3770 => Boolean(item))
    : [];
  const specialSkills = Array.isArray(raw.specialSkills)
    ? raw.specialSkills.map((item) => sanitizeSkill(item, 'special')).filter((item): item is RemoteSkillCatalogEntryV3770 => Boolean(item))
    : [];
  const boosters = Array.isArray(raw.boosters)
    ? raw.boosters.map(sanitizeBooster).filter((item): item is RemoteBoosterCatalogEntryV3770 => Boolean(item))
    : [];
  return {
    version: cleanString(raw.version, version) || version,
    updatedAt: cleanString(raw.updatedAt, updatedAt) || updatedAt,
    additionalSkills: uniqueByName(additionalSkills),
    specialSkills: uniqueByName(specialSkills),
    boosters: uniqueByName(boosters)
  };
}

export function readRemoteCatalogV3770(): RemoteCatalogPatchV3770 {
  try {
    const raw = readAccountStorage(REMOTE_CATALOG_V3770_STORAGE_KEY);
    return raw ? sanitizeRemoteCatalogV3770(JSON.parse(raw)) : EMPTY_REMOTE_CATALOG_V3770;
  } catch {
    return EMPTY_REMOTE_CATALOG_V3770;
  }
}

export function writeRemoteCatalogV3770(catalog: RemoteCatalogPatchV3770) {
  writeAccountStorage(REMOTE_CATALOG_V3770_STORAGE_KEY, JSON.stringify(sanitizeRemoteCatalogV3770(catalog)));
}

function findSkillEntry(value: string, catalog = readRemoteCatalogV3770()) {
  const key = normalizeRemoteCatalogIdentity(value);
  return [...catalog.additionalSkills, ...catalog.specialSkills].find((item) => {
    if (normalizeRemoteCatalogIdentity(item.name) === key) return true;
    return item.aliases.some((alias) => normalizeRemoteCatalogIdentity(alias) === key);
  }) ?? null;
}

export function resolveRemoteSkillNameV3770(value: string | null | undefined, catalog = readRemoteCatalogV3770()) {
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  const entry = findSkillEntry(raw, catalog);
  return entry?.status === 'active' ? entry.name : null;
}

export function remoteSkillIdentityKeyV3770(value: string | null | undefined, catalog = readRemoteCatalogV3770()) {
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  const entry = findSkillEntry(raw, catalog);
  return entry ? normalizeRemoteCatalogIdentity(entry.name).replace(/\s+/g, '') : null;
}

export function isRemoteAdditionalSkillActiveV3770(value: string, catalog = readRemoteCatalogV3770()) {
  const key = normalizeRemoteCatalogIdentity(value);
  return catalog.additionalSkills.some((item) => item.status === 'active' && [item.name, ...item.aliases].some((name) => normalizeRemoteCatalogIdentity(name) === key));
}

export function isRemoteSpecialSkillActiveV3770(value: string, catalog = readRemoteCatalogV3770()) {
  const key = normalizeRemoteCatalogIdentity(value);
  return catalog.specialSkills.some((item) => item.status === 'active' && [item.name, ...item.aliases].some((name) => normalizeRemoteCatalogIdentity(name) === key));
}

export function effectiveAdditionalSkillNamesV3770(localNames: readonly string[], catalog = readRemoteCatalogV3770()) {
  const deprecated = new Set(catalog.additionalSkills.filter((item) => item.status === 'deprecated').map((item) => normalizeRemoteCatalogIdentity(item.name)));
  return Array.from(new Set([
    ...localNames.filter((name) => !deprecated.has(normalizeRemoteCatalogIdentity(name))),
    ...catalog.additionalSkills.filter((item) => item.status === 'active').map((item) => item.name)
  ]));
}

export function effectiveSpecialSkillNamesV3770(localNames: readonly string[], catalog = readRemoteCatalogV3770()) {
  const deprecated = new Set(catalog.specialSkills.filter((item) => item.status === 'deprecated').map((item) => normalizeRemoteCatalogIdentity(item.name)));
  return Array.from(new Set([
    ...localNames.filter((name) => !deprecated.has(normalizeRemoteCatalogIdentity(name))),
    ...catalog.specialSkills.filter((item) => item.status === 'active').map((item) => item.name)
  ]));
}

export function effectiveBoosterNamesV3770(localNames: readonly string[], catalog = readRemoteCatalogV3770()) {
  const deprecated = new Set(catalog.boosters.filter((item) => item.status === 'deprecated').map((item) => normalizeRemoteCatalogIdentity(item.name)));
  return Array.from(new Set([
    ...localNames.filter((name) => !deprecated.has(normalizeRemoteCatalogIdentity(name))),
    ...catalog.boosters.filter((item) => item.status === 'active').map((item) => item.name)
  ]));
}
