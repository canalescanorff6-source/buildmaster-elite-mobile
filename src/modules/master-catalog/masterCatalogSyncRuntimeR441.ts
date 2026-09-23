import {
  buildMasterCatalogSyncPlanR441,
  selectCatalogChunkDescriptorsR441,
  validateCatalogChunkChecksumR441,
  type MasterCatalogChunkR441,
  type MasterCatalogSyncPlanR441,
} from './masterCatalogSyncR441';
import { sanitizeMasterCatalogManifestR441 } from './masterCatalogManifestR441';
import { sha256BytesR441 } from './cardSourceVaultR441';
import type { RuntimeBatchOperation } from '@/lib/localDatabase';

export const MASTER_CATALOG_SYNC_RUNTIME_R441_VERSION = '40.80-r441-master-catalog-sync-runtime-v1' as const;
export const MASTER_CATALOG_MANIFEST_URL_KEY_R441 = 'buildmaster_master_catalog_manifest_url_r441';
export const CATALOG_SYNC_STATE_KEY_R441 = 'catalog-sync:v1:state';
export const CATALOG_SYNC_PREVIOUS_KEY_R441 = 'catalog-sync:v1:previous';

export type MasterCatalogSyncStateR441 = {
  schemaVersion: 1;
  activeVersion: string;
  previousVersion: string | null;
  lastCheckedAt: string | null;
  lastUpdatedAt: string | null;
  manifestUrl: string;
};

export type PreparedMasterCatalogUpdateR441 = {
  manifestUrl: string;
  manifest: ReturnType<typeof sanitizeMasterCatalogManifestR441>;
  plan: MasterCatalogSyncPlanR441;
  checkedAt: string;
};

function defaultStateR441(): MasterCatalogSyncStateR441 {
  return { schemaVersion: 1, activeVersion: 'local-r438', previousVersion: null, lastCheckedAt: null, lastUpdatedAt: null, manifestUrl: '' };
}

export async function readMasterCatalogSyncStateR441() {
  const [{ runtimeGet }, account] = await Promise.all([import('@/lib/localDatabase'), import('@/lib/accountStorage')]);
  const stored = await runtimeGet<MasterCatalogSyncStateR441>('cards', CATALOG_SYNC_STATE_KEY_R441).catch(() => null);
  const url = account.readAccountStorage(MASTER_CATALOG_MANIFEST_URL_KEY_R441) ?? '';
  return { ...defaultStateR441(), ...(stored ?? {}), manifestUrl: String(url || stored?.manifestUrl || '') };
}

export async function writeMasterCatalogManifestUrlR441(url: string) {
  const account = await import('@/lib/accountStorage');
  const clean = String(url ?? '').trim();
  if (clean && !/^https:\/\//i.test(clean)) throw new Error('R441: use uma URL HTTPS para o catálogo.');
  if (clean) account.writeAccountStorage(MASTER_CATALOG_MANIFEST_URL_KEY_R441, clean);
  else account.removeAccountStorage(MASTER_CATALOG_MANIFEST_URL_KEY_R441);
  return clean;
}

async function fetchBytesR441(url: string) {
  const { fetchWithTimeout } = await import('@/lib/fetchWithTimeout');
  const response = await fetchWithTimeout(url, { cache: 'no-store' }, 20_000);
  if (!response.ok) throw new Error(`R441: falha HTTP ${response.status} ao baixar catálogo.`);
  return new Uint8Array(await response.arrayBuffer());
}

function parseJsonR441(bytes: Uint8Array, label: string) {
  try { return JSON.parse(new TextDecoder().decode(bytes)) as unknown; }
  catch { throw new Error(`R441: ${label} não contém JSON válido.`); }
}

export async function prepareMasterCatalogUpdateR441(input: { manifestUrl?: string; appVersion: string }): Promise<PreparedMasterCatalogUpdateR441> {
  const [state, catalogModule, ownedModule] = await Promise.all([
    readMasterCatalogSyncStateR441(),
    import('@/modules/card-catalog/masterCardCatalogStorageR438'),
    import('@/modules/card-catalog/ownedCardCollectionR438'),
  ]);
  const manifestUrl = String(input.manifestUrl ?? state.manifestUrl).trim();
  if (!manifestUrl) throw new Error('R441: nenhuma URL de Catálogo Mestre configurada.');
  if (!/^https:\/\//i.test(manifestUrl)) throw new Error('R441: URL do Catálogo Mestre deve usar HTTPS.');
  const manifest = sanitizeMasterCatalogManifestR441(parseJsonR441(await fetchBytesR441(manifestUrl), 'manifesto'));
  const [localCatalog, ownedRecords] = await Promise.all([
    catalogModule.loadMasterCardCatalogR438(),
    ownedModule.loadOwnedCardCollectionR438(),
  ]);
  const ownedCatalogIds = new Set(ownedRecords.map((item) => item.catalogCardId));
  if (state.activeVersion === manifest.catalogVersion) {
    return {
      manifestUrl,
      manifest,
      plan: buildMasterCatalogSyncPlanR441({ appVersion: input.appVersion, activeVersion: state.activeVersion, manifest, chunks: [], localCatalog, ownedCatalogIds }),
      checkedAt: new Date().toISOString(),
    };
  }
  const descriptors = selectCatalogChunkDescriptorsR441(state.activeVersion, manifest);
  const chunks: MasterCatalogChunkR441[] = [];
  for (const descriptor of descriptors) {
    const bytes = await fetchBytesR441(descriptor.url);
    const digest = await sha256BytesR441(bytes);
    validateCatalogChunkChecksumR441(descriptor.sha256, digest);
    const raw = parseJsonR441(bytes, `chunk ${descriptor.id}`) as Partial<MasterCatalogChunkR441>;
    chunks.push({
      schemaVersion: 1,
      id: String(raw.id || descriptor.id),
      fromVersion: descriptor.mode === 'base' ? null : String(raw.fromVersion ?? descriptor.fromVersion ?? '') || null,
      toVersion: String(raw.toVersion || descriptor.toVersion),
      upsert: Array.isArray(raw.upsert) ? raw.upsert : [],
      remove: Array.isArray(raw.remove) ? raw.remove.map(String) : [],
    });
  }
  const catalogForPlan = descriptors[0]?.mode === 'base'
    ? localCatalog.filter((card) => ownedCatalogIds.has(card.catalogCardId))
    : localCatalog;
  const plan = buildMasterCatalogSyncPlanR441({
    appVersion: input.appVersion,
    activeVersion: state.activeVersion,
    manifest,
    chunks,
    localCatalog: catalogForPlan,
    ownedCatalogIds,
  });
  return { manifestUrl, manifest, plan, checkedAt: new Date().toISOString() };
}

function indexItemR441(card: MasterCatalogSyncPlanR441['nextCatalog'][number]) {
  return { catalogCardId: card.catalogCardId, playerName: card.playerName, cardLabel: card.cardLabel, completeness: card.completeness, updatedAt: card.updatedAt };
}

export async function promotePreparedMasterCatalogUpdateR441(prepared: PreparedMasterCatalogUpdateR441) {
  if (!prepared.plan.changed) return { ...prepared.plan, changed: false };
  const local = await import('@/lib/localDatabase');
  const storage = await import('@/modules/card-catalog/masterCardCatalogStorageR438');
  const currentCatalog = prepared.plan.input.localCatalog;
  const nextIds = new Set(prepared.plan.nextCatalog.map((card) => card.catalogCardId));
  const operations: RuntimeBatchOperation[] = [];
  for (const card of currentCatalog) {
    if (!nextIds.has(card.catalogCardId)) operations.push({ type: 'delete', key: `${storage.MASTER_CARD_PREFIX_R438}${card.catalogCardId}` });
  }
  for (const card of prepared.plan.nextCatalog) operations.push({ type: 'put', key: `${storage.MASTER_CARD_PREFIX_R438}${card.catalogCardId}`, value: card });
  operations.push({ type: 'put', key: storage.MASTER_CARD_INDEX_KEY_R438, value: prepared.plan.nextCatalog.map(indexItemR441) });
  operations.push({ type: 'put', key: storage.MASTER_CARD_META_KEY_R438, value: { schemaVersion: 1, version: prepared.manifest.catalogVersion, count: prepared.plan.nextCatalog.length, updatedAt: new Date().toISOString() } });
  const state = await readMasterCatalogSyncStateR441();
  operations.push({ type: 'put', key: CATALOG_SYNC_PREVIOUS_KEY_R441, value: { version: state.activeVersion, catalog: currentCatalog, storedAt: new Date().toISOString() } });
  operations.push({ type: 'put', key: CATALOG_SYNC_STATE_KEY_R441, value: { schemaVersion: 1, activeVersion: prepared.manifest.catalogVersion, previousVersion: state.activeVersion, lastCheckedAt: prepared.checkedAt, lastUpdatedAt: new Date().toISOString(), manifestUrl: prepared.manifestUrl } satisfies MasterCatalogSyncStateR441 });
  await local.runtimeBatchMutate('cards', operations);
  await writeMasterCatalogManifestUrlR441(prepared.manifestUrl);
  return { ...prepared.plan, changed: true };
}

export async function rollbackMasterCatalogRuntimeR441() {
  const [local, storage] = await Promise.all([import('@/lib/localDatabase'), import('@/modules/card-catalog/masterCardCatalogStorageR438')]);
  const previous = await local.runtimeGet<{ version: string; catalog: MasterCatalogSyncPlanR441['nextCatalog']; storedAt: string }>('cards', CATALOG_SYNC_PREVIOUS_KEY_R441).catch(() => null);
  if (!previous?.version || !Array.isArray(previous.catalog)) throw new Error('R441: não existe versão anterior do catálogo para restaurar.');
  const current = await storage.loadMasterCardCatalogR438();
  const previousIds = new Set(previous.catalog.map((card) => card.catalogCardId));
  const state = await readMasterCatalogSyncStateR441();
  const operations: RuntimeBatchOperation[] = [];
  for (const card of current) if (!previousIds.has(card.catalogCardId)) operations.push({ type: 'delete', key: `${storage.MASTER_CARD_PREFIX_R438}${card.catalogCardId}` });
  for (const card of previous.catalog) operations.push({ type: 'put', key: `${storage.MASTER_CARD_PREFIX_R438}${card.catalogCardId}`, value: card });
  operations.push({ type: 'put', key: storage.MASTER_CARD_INDEX_KEY_R438, value: previous.catalog.map(indexItemR441) });
  operations.push({ type: 'put', key: storage.MASTER_CARD_META_KEY_R438, value: { schemaVersion: 1, version: previous.version, count: previous.catalog.length, updatedAt: new Date().toISOString() } });
  operations.push({ type: 'put', key: CATALOG_SYNC_PREVIOUS_KEY_R441, value: { version: state.activeVersion, catalog: current, storedAt: new Date().toISOString() } });
  operations.push({ type: 'put', key: CATALOG_SYNC_STATE_KEY_R441, value: { ...state, activeVersion: previous.version, previousVersion: state.activeVersion, lastUpdatedAt: new Date().toISOString() } });
  await local.runtimeBatchMutate('cards', operations);
  return { restoredVersion: previous.version, count: previous.catalog.length };
}
