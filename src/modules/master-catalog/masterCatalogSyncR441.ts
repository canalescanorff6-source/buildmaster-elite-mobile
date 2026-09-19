import {
  createMasterCardCatalogEntryR438,
  mergeMasterCardCatalogEntryR438,
  type MasterCardCatalogEntryR438,
} from '@/modules/card-catalog/masterCardCatalogR438';
import { sanitizeMasterCatalogManifestR441, type MasterCatalogManifestR441 } from './masterCatalogManifestR441';

export { sanitizeMasterCatalogManifestR441 } from './masterCatalogManifestR441';
export type { MasterCatalogManifestR441 } from './masterCatalogManifestR441';
export const MASTER_CATALOG_SYNC_R441_VERSION = '40.80-r441-master-catalog-sync-v1' as const;

export type MasterCatalogChunkR441 = {
  schemaVersion: 1;
  id: string;
  fromVersion: string | null;
  toVersion: string;
  upsert: MasterCardCatalogEntryR438[];
  remove: string[];
};

export type MasterCatalogSyncInputR441 = {
  appVersion: string;
  activeVersion: string;
  manifest: MasterCatalogManifestR441;
  chunks: MasterCatalogChunkR441[];
  localCatalog: MasterCardCatalogEntryR438[];
  ownedCatalogIds: Set<string>;
};

export type MasterCatalogSyncPlanR441 = {
  input: MasterCatalogSyncInputR441;
  changed: boolean;
  nextCatalog: MasterCardCatalogEntryR438[];
  added: number;
  updated: number;
  removed: number;
  retainedOwned: string[];
  targetVersion: string;
};

export type MasterCatalogAppliedStateR441 = {
  activeVersion: string;
  previousVersion: string | null;
  catalog: MasterCardCatalogEntryR438[];
  previousCatalog: MasterCardCatalogEntryR438[];
  appliedAt: string;
};

function versionParts(value: string) {
  const matches = String(value ?? '').match(/\d+/g) ?? [];
  return matches.slice(0, 4).map(Number);
}
function compareVersion(a: string, b: string) {
  const left = versionParts(a);
  const right = versionParts(b);
  for (let i = 0; i < Math.max(left.length, right.length); i += 1) {
    const delta = (left[i] ?? 0) - (right[i] ?? 0);
    if (delta) return delta;
  }
  return 0;
}


export function selectCatalogChunkDescriptorsR441(activeVersion: string, manifestInput: MasterCatalogManifestR441) {
  const manifest = sanitizeMasterCatalogManifestR441(manifestInput);
  if (String(activeVersion ?? '').trim() === manifest.catalogVersion) return [];
  const selected: MasterCatalogManifestR441['chunks'] = [];
  let current = String(activeVersion ?? '').trim();
  const seen = new Set<string>();
  while (current && current !== manifest.catalogVersion) {
    const next = manifest.chunks.find((item) => item.mode === 'delta' && item.fromVersion === current && !seen.has(item.id));
    if (!next) break;
    selected.push(next);
    seen.add(next.id);
    current = next.toVersion;
  }
  if (selected.length && current === manifest.catalogVersion) return selected;
  const base = manifest.chunks.find((item) => item.mode === 'base' && item.toVersion === manifest.catalogVersion);
  if (base) return [base];
  throw new Error('R441: não existe cadeia de atualização compatível com a versão local.');
}

export function validateCatalogChunkChecksumR441(expected: string, actual: string) {
  const left = String(expected ?? '').trim().toLowerCase();
  const right = String(actual ?? '').trim().toLowerCase();
  if (!left || !right || left !== right) throw new Error('R441: checksum do chunk do catálogo não confere.');
  return true;
}

function normalizeChunkR441(input: MasterCatalogChunkR441): MasterCatalogChunkR441 {
  if (!input || input.schemaVersion !== 1) throw new Error('R441: chunk com schema incompatível.');
  const id = String(input.id ?? '').trim();
  const toVersion = String(input.toVersion ?? '').trim();
  if (!id || !toVersion) throw new Error('R441: chunk sem identidade/versão.');
  return {
    schemaVersion: 1,
    id,
    fromVersion: String(input.fromVersion ?? '').trim() || null,
    toVersion,
    upsert: (Array.isArray(input.upsert) ? input.upsert : []).map((card) => createMasterCardCatalogEntryR438({
      ...card,
      sources: Array.from(new Set([...(card.sources ?? []), 'CATALOG_PATCH'])),
    })),
    remove: Array.from(new Set((Array.isArray(input.remove) ? input.remove : []).map((value) => String(value).trim()).filter(Boolean))),
  };
}

export function buildMasterCatalogSyncPlanR441(input: MasterCatalogSyncInputR441): MasterCatalogSyncPlanR441 {
  const manifest = sanitizeMasterCatalogManifestR441(input.manifest);
  if (compareVersion(input.appVersion, manifest.minimumAppVersion) < 0) {
    throw new Error(`R441: versão mínima do app é ${manifest.minimumAppVersion}.`);
  }
  const normalizedInput: MasterCatalogSyncInputR441 = { ...input, manifest };
  if (String(input.activeVersion) === manifest.catalogVersion) {
    return {
      input: normalizedInput,
      changed: false,
      nextCatalog: input.localCatalog.map((card) => createMasterCardCatalogEntryR438(card)),
      added: 0,
      updated: 0,
      removed: 0,
      retainedOwned: [],
      targetVersion: manifest.catalogVersion,
    };
  }

  const map = new Map(input.localCatalog.map((card) => {
    const clean = createMasterCardCatalogEntryR438(card);
    return [clean.catalogCardId, clean] as const;
  }));
  let currentVersion = String(input.activeVersion ?? '').trim();
  let added = 0;
  let updated = 0;
  let removed = 0;
  const retainedOwned = new Set<string>();
  const chunks = input.chunks.map(normalizeChunkR441);
  if (!chunks.length) throw new Error('R441: atualização sem chunks.');

  for (const chunk of chunks) {
    if (chunk.fromVersion && chunk.fromVersion !== currentVersion) throw new Error(`R441: cadeia de chunks inválida em ${chunk.id}.`);
    for (const id of chunk.remove) {
      if (!map.has(id)) continue;
      if (input.ownedCatalogIds.has(id)) { retainedOwned.add(id); continue; }
      map.delete(id);
      removed += 1;
    }
    for (const incoming of chunk.upsert) {
      const existing = map.get(incoming.catalogCardId);
      if (existing) {
        map.set(incoming.catalogCardId, mergeMasterCardCatalogEntryR438(existing, incoming));
        updated += 1;
      } else {
        map.set(incoming.catalogCardId, incoming);
        added += 1;
      }
    }
    currentVersion = chunk.toVersion;
  }
  if (currentVersion !== manifest.catalogVersion) throw new Error('R441: chunks não chegam à versão publicada no manifesto.');

  const nextCatalog = [...map.values()].sort((a, b) => a.playerName.localeCompare(b.playerName, 'pt-BR') || a.cardLabel.localeCompare(b.cardLabel, 'pt-BR'));
  return {
    input: normalizedInput,
    changed: true,
    nextCatalog,
    added,
    updated,
    removed,
    retainedOwned: [...retainedOwned].sort(),
    targetVersion: manifest.catalogVersion,
  };
}

export function applyMasterCatalogPlanR441(plan: MasterCatalogSyncPlanR441): MasterCatalogAppliedStateR441 {
  if (!plan.changed) {
    return {
      activeVersion: plan.input.activeVersion,
      previousVersion: null,
      catalog: plan.nextCatalog,
      previousCatalog: [],
      appliedAt: new Date().toISOString(),
    };
  }
  return {
    activeVersion: plan.targetVersion,
    previousVersion: plan.input.activeVersion || null,
    catalog: plan.nextCatalog,
    previousCatalog: plan.input.localCatalog.map((card) => createMasterCardCatalogEntryR438(card)),
    appliedAt: new Date().toISOString(),
  };
}

export function rollbackMasterCatalogR441(state: MasterCatalogAppliedStateR441): MasterCatalogAppliedStateR441 {
  if (!state.previousVersion || !state.previousCatalog.length) throw new Error('R441: não existe catálogo anterior para restaurar.');
  return {
    activeVersion: state.previousVersion,
    previousVersion: state.activeVersion,
    catalog: state.previousCatalog.map((card) => createMasterCardCatalogEntryR438(card)),
    previousCatalog: state.catalog.map((card) => createMasterCardCatalogEntryR438(card)),
    appliedAt: new Date().toISOString(),
  };
}
