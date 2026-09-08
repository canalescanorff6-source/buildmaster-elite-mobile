import type { Objective, PositionCode } from './analyzerDomain';
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


export const DYNAMIC_RULE_CONTRACTS_R200_VERSION = '40.80-r200-dynamic-rule-contracts-v1' as const;
export const RULE_PACK_KEY = 'buildmaster_rule_pack_v24_29';

export type DynamicRuleMatch = {
  position?: PositionCode | 'ANY';
  playstyleIncludes?: string[];
  functionIncludes?: string[];
  objective?: Objective | 'ANY';
};

export type DynamicRule = {
  id: string;
  title: string;
  match: DynamicRuleMatch;
  promoteSkills?: string[];
  blockSkills?: string[];
  promoteImpetos?: string[];
  blockImpetos?: string[];
  note?: string;
};

export type DynamicRulePack = {
  version: string;
  updatedAt: string;
  source: string;
  rules: DynamicRule[];
  globalBlockedSkills?: string[];
  globalBlockedImpetos?: string[];
  schemaVersion?: number;
  gameVersion?: string;
  publishedAt?: string;
  expiresAt?: string;
  minimumAppVersion?: string;
  checksum?: string;
  releaseNotes?: string[];
  catalog?: RemoteCatalogPatchV3770;
};

export const DEFAULT_DYNAMIC_RULE_PACK: DynamicRulePack = {
  version: '37.70.0-local',
  updatedAt: '2026-08-01T00:00:00.000Z',
  publishedAt: '2026-08-01T00:00:00.000Z',
  gameVersion: 'eFootball 2026',
  minimumAppVersion: '40.70.0',
  schemaVersion: 3770,
  source: 'Pacote local embutido',
  releaseNotes: ['Base local compatível com histórico, catálogo remoto e auditoria v37.70.'],
  catalog: EMPTY_REMOTE_CATALOG_V3770,
  globalBlockedSkills: [],
  globalBlockedImpetos: [],
  rules: [
    {
      id: 'cf-finalizador-nao-marca',
      title: 'CA finalizador não vira marcador',
      match: { position: 'CF', playstyleIncludes: ['artilheiro', 'homem de área'] },
      blockSkills: ['Volta para marcar', 'Interceptação', 'Marcação individual', 'Carrinho', 'Bloqueador'],
      promoteSkills: ['Toque de calcanhar', 'Passe de primeira', 'Controle com a sola', 'Passe em profundidade', 'Super substituto'],
      promoteImpetos: ['Movimento sem a bola'],
      note: 'Regra atualizável: CA finalizador preserva o pacote de finalização nativo e prioriza habilidades que melhoram tabelas, domínio e movimentação.'
    },
    {
      id: 'goleiro-oficial',
      title: 'Goleiro usa habilidades oficiais de GOL',
      match: { position: 'GK' },
      blockSkills: ['Chute de primeira', 'Precisão à distância', 'Toque duplo', 'Cruzamento preciso', 'Marcação individual', 'Carrinho', 'Bloqueador'],
      promoteSkills: ['Pegador de pênalti', 'Arremesso longo do goleiro', 'Reposição alta do goleiro', 'Reposição baixa do goleiro', 'Liderança'],
      promoteImpetos: ['Goleiro', 'Defesaça'],
      note: 'Regra atualizável: GOL fica separado de jogadores de linha.'
    },
    {
      id: 'vol-destruidor',
      title: 'VOL/ZAG destruidor prioriza roubo e bloqueio',
      match: { position: 'ANY', playstyleIncludes: ['destruidor'] },
      promoteSkills: ['Interceptação', 'Bloqueador', 'Marcação individual', 'Carrinho', 'Passe de primeira'],
      promoteImpetos: ['Roubo de bola', 'Defesa', 'Duelo', 'Motor do time'],
      blockSkills: ['Controle da cavadinha', 'Finalização acrobática'],
      note: 'Regra atualizável: destruidor ganha prioridade defensiva sem virar atacante.'
    },
    {
      id: 'orquestrador-construtor',
      title: 'Orquestrador é construtor, não cão de guarda puro',
      match: { position: 'ANY', playstyleIncludes: ['orquestrador'] },
      promoteSkills: ['Passe de primeira', 'Passe em profundidade', 'Passe longo', 'Controle orientado', 'Interceptação'],
      promoteImpetos: ['Reconstrução', 'Passe', 'Proteção de Posse', 'Volante criativo'],
      blockSkills: ['Chute acrobático', 'Finalização acrobática', 'Controle da cavadinha'],
      note: 'Regra atualizável: orquestrador precisa saída de bola e passe antes de combate extremo.'
    },
    {
      id: 'lateral-cruzamento',
      title: 'Lateral perito em cruzamento prioriza corredor',
      match: { position: 'ANY', playstyleIncludes: ['perito em cruzamento', 'lateral ofensivo', 'lateral atacante'] },
      promoteSkills: ['Cruzamento preciso', 'Passe de primeira', 'Passe longo', 'Interceptação', 'Volta para marcar'],
      promoteImpetos: ['Cruzamento', 'Agilidade', 'Transição ofensiva', 'Fisicalidade'],
      note: 'Regra atualizável: lateral ofensivo precisa apoiar sem perder recomposição.'
    }
  ]
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
