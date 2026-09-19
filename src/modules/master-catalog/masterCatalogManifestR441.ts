export const MASTER_CATALOG_MANIFEST_R441_VERSION = '40.80-r441-master-catalog-manifest-v1' as const;

export type MasterCatalogChunkDescriptorR441 = {
  id: string;
  url: string;
  sha256: string;
  bytes: number;
  mode: 'base' | 'delta';
  fromVersion: string | null;
  toVersion: string;
};

export type MasterCatalogManifestR441 = {
  schemaVersion: 1;
  catalogVersion: string;
  gameVersion: string;
  publishedAt: string;
  minimumAppVersion: string;
  cardCount: number;
  previousCatalogVersion: string | null;
  chunks: MasterCatalogChunkDescriptorR441[];
  releaseNotes: string[];
};

function text(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}
function integer(value: unknown, min: number, max: number) {
  const n = Number(value);
  return Number.isFinite(n) && n >= min && n <= max ? Math.floor(n) : null;
}
function safeUrl(value: unknown) {
  const raw = text(value, 2048);
  if (!/^https:\/\//i.test(raw)) return '';
  return raw;
}

export function sanitizeMasterCatalogManifestR441(input: unknown): MasterCatalogManifestR441 {
  if (!input || typeof input !== 'object') throw new Error('R441: manifesto do catálogo inválido.');
  const raw = input as Record<string, unknown>;
  if (Number(raw.schemaVersion) !== 1) throw new Error('R441: schemaVersion do manifesto não suportado.');
  const catalogVersion = text(raw.catalogVersion, 80);
  const gameVersion = text(raw.gameVersion, 120);
  const publishedAt = text(raw.publishedAt, 80);
  const minimumAppVersion = text(raw.minimumAppVersion, 40);
  const cardCount = integer(raw.cardCount, 0, 1_000_000);
  if (!catalogVersion || !gameVersion || !publishedAt || !minimumAppVersion || cardCount === null) throw new Error('R441: manifesto incompleto.');
  const previousCatalogVersion = text(raw.previousCatalogVersion, 80) || null;
  const chunks = (Array.isArray(raw.chunks) ? raw.chunks : []).map((value, index) => {
    if (!value || typeof value !== 'object') throw new Error(`R441: chunk ${index + 1} inválido.`);
    const item = value as Record<string, unknown>;
    const id = text(item.id, 120);
    const url = safeUrl(item.url);
    const sha256 = text(item.sha256, 128).toLowerCase();
    const bytes = integer(item.bytes, 0, 1_000_000_000);
    const mode = item.mode === 'base' ? 'base' : item.mode === 'delta' ? 'delta' : null;
    const fromVersion = text(item.fromVersion, 80) || null;
    const toVersion = text(item.toVersion, 80);
    if (!id || !url || !sha256 || bytes === null || !mode || !toVersion) throw new Error(`R441: chunk ${index + 1} incompleto.`);
    return { id, url, sha256, bytes, mode, fromVersion, toVersion } satisfies MasterCatalogChunkDescriptorR441;
  });
  if (!chunks.length && cardCount > 0) throw new Error('R441: manifesto sem chunks.');
  const releaseNotes = (Array.isArray(raw.releaseNotes) ? raw.releaseNotes : []).map((value) => text(value, 240)).filter(Boolean).slice(0, 30);
  return { schemaVersion: 1, catalogVersion, gameVersion, publishedAt, minimumAppVersion, cardCount, previousCatalogVersion, chunks, releaseNotes };
}
