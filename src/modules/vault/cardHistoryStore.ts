// R418_UNBOUNDED_PERSISTENT_COLLECTIONS: conteúdo do usuário não é descartado por teto artificial de quantidade.
import {
  ATTRIBUTE_PT,
  type AnalysisResult,
  type AttributeKey,
  type PositionCode
} from '@/lib/analyzer';
import { createProductionAnalysisR138 } from '@/modules/analysis/productionOrchestratorR138';
import { cardIdentityAliasesR457, cardIdentityFingerprintR126 } from '@/lib/cardIdentityFingerprintR126';
import { analysisUsageFunctionR457, analysisUsageIdentityKeyR138, analysisUsagePositionR138, optionalAnalysisUsagePositionR138 } from '@/lib/analysisUsagePositionR138';
import { buildVaultIdentitySealR134 } from './vaultIdentitySealR134';
import {
  accountDatabaseName,
  getActiveAccountIdentity,
  readAccountStorage,
  removeAccountStorage,
  writeAccountStorage
} from '@/lib/accountStorage';
import {
  isNativeVaultStorageAvailable,
  nativeVaultInfo,
  nativeVaultRead,
  nativeVaultRemove,
  nativeVaultWrite
} from '@/lib/nativeVaultStorage';

export type ManualFields = {
  playerName: string;
  level: string;
  trainingPointsTotal: string;
  attributes: Partial<Record<AttributeKey, string>>;
  nativeSkills: string[];
};

export type SavedSkillProgress = Record<string, boolean>;

export type SavedHistoryEvent = { at: string; action: string; note: string };

export function emptyManualFields(): ManualFields {
  return { playerName: '', level: '', trainingPointsTotal: '', attributes: {}, nativeSkills: [] };
}

export type SavedAnalysis = {
  id: string;
  saveKey: string;
  savedAt: string;
  updatedAt: string;
  rawText: string;
  playerImage: string | null;
  fullPreview: string | null;
  result: AnalysisResult;
  skillProgress: SavedSkillProgress;
  notes?: string;
  favorite?: boolean;
  statusTag?: 'completo' | 'pendente' | 'revisar';
  personalTags?: string[];
  tacticalRoleNote?: string;
  changeLog?: SavedHistoryEvent[];
  lastOpenedAt?: string;
  folderId?: string;
  /** Selo de migração lazy do registro; não participa da identidade da carta. */
  productionRecordVersion?: string;
  /** R134: identidades persistidas e auditáveis. Não substituem o resultado, apenas selam o que foi salvo. */
  cardIdentity?: string;
  playerIdentity?: string;
  evidenceFingerprint?: string;
  identitySealVersion?: string;
};

export const HISTORY_KEY = 'buildmaster_history_v24_6_cofre_persistente';

export const OLD_HISTORY_KEYS = ['buildmaster_history_v24_5_fichario_elite', 'buildmaster_history_v24_3_goleiro_stable', 'buildmaster_history_v24_4_habilidades_oficiais_stable'];

export const HISTORY_DB_NAME = 'buildmaster_cofre_fichas_db_v1';

export const HISTORY_STORE_NAME = 'fichas';

export const LEARNING_KEY = 'buildmaster_local_learning_v24_3';

export const HISTORY_LIMIT = Infinity;
export const STARTUP_NATIVE_HISTORY_MAX_BYTES = 0;

const NATIVE_HISTORY_STORAGE_KEY = () => accountDatabaseName(`${HISTORY_DB_NAME}_internal_file_v1`);

export const NATIVE_HISTORY_BUCKET_COUNT_R409 = 64;
export const NATIVE_HISTORY_SHARD_VERSION_R409 = 2;
export const NATIVE_HISTORY_READ_CONCURRENCY_R410 = 8;
export const NATIVE_HISTORY_MAX_INFLIGHT_ITEMS_R412 = 2048;

const NATIVE_HISTORY_MANIFEST_KEY_R409 = () => `${NATIVE_HISTORY_STORAGE_KEY()}__r409_manifest_v2`;
const NATIVE_HISTORY_BACKUP_MANIFEST_KEY_R409 = () => `${NATIVE_HISTORY_STORAGE_KEY()}__r409_manifest_backup_v2`;
const NATIVE_HISTORY_BUCKET_KEY_R409 = (index: number, fingerprint: string) => `${NATIVE_HISTORY_STORAGE_KEY()}__r409_b${index}_${fingerprint}`;

type NativeHistoryBucketManifestR409 = { index: number; key: string; fingerprint: string; count: number };
type NativeHistoryManifestR409 = {
  version: typeof NATIVE_HISTORY_SHARD_VERSION_R409;
  count: number;
  bucketCount: number;
  buckets: NativeHistoryBucketManifestR409[];
  order: string[];
  savedAt: string;
};

function fnv1a32R409(value: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function djb2R409(value: string): number {
  let hash = 5381;
  for (let index = 0; index < value.length; index += 1) hash = Math.imul(hash, 33) ^ value.charCodeAt(index);
  return hash >>> 0;
}

function contentFingerprintR409(value: string): string {
  return `${fnv1a32R409(value).toString(36)}-${djb2R409(value).toString(36)}-${value.length.toString(36)}`;
}

function bucketIndexR409(saveKey: string): number {
  return fnv1a32R409(saveKey) % NATIVE_HISTORY_BUCKET_COUNT_R409;
}

export const NATIVE_HISTORY_TRANSACTION_VERSION_R411 = 1;
const NATIVE_HISTORY_TRANSACTION_KEY_R411 = () => `${NATIVE_HISTORY_STORAGE_KEY()}__r411_transaction_v1`;
const NATIVE_HISTORY_FALLBACK_AUTHORITY_KEY_R411 = `${HISTORY_KEY}_native_fallback_authority_r411`;

type NativeHistoryTransactionJournalR411 = {
  version: typeof NATIVE_HISTORY_TRANSACTION_VERSION_R411;
  targetManifestFingerprint: string;
  cleanupKeys: string[];
  startedAt: string;
};

type NativeHistorySecondaryAuthorityR411 = {
  version: typeof NATIVE_HISTORY_TRANSACTION_VERSION_R411;
  backend: 'indexeddb' | 'local-fallback';
  count: number;
  savedAt: string;
};

let nativeHistoryTransactionActiveR411 = false;

function parseNativeHistoryTransactionJournalR411(raw: string | null): NativeHistoryTransactionJournalR411 | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<NativeHistoryTransactionJournalR411>;
    if (value.version !== NATIVE_HISTORY_TRANSACTION_VERSION_R411) return null;
    if (typeof value.targetManifestFingerprint !== 'string' || !value.targetManifestFingerprint) return null;
    if (!Array.isArray(value.cleanupKeys) || value.cleanupKeys.length > NATIVE_HISTORY_BUCKET_COUNT_R409 * 2) return null;
    if (!value.cleanupKeys.every((key) => typeof key === 'string' && Boolean(key))) return null;
    if (new Set(value.cleanupKeys).size !== value.cleanupKeys.length) return null;
    if (typeof value.startedAt !== 'string' || !value.startedAt) return null;
    return value as NativeHistoryTransactionJournalR411;
  } catch {
    return null;
  }
}

function parseNativeHistorySecondaryAuthorityR411(raw: string | null): NativeHistorySecondaryAuthorityR411 | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<NativeHistorySecondaryAuthorityR411>;
    if (value.version !== NATIVE_HISTORY_TRANSACTION_VERSION_R411) return null;
    if (value.backend !== 'indexeddb' && value.backend !== 'local-fallback') return null;
    if (!Number.isInteger(value.count) || Number(value.count) < 0) return null;
    if (typeof value.savedAt !== 'string' || !value.savedAt) return null;
    return value as NativeHistorySecondaryAuthorityR411;
  } catch {
    return null;
  }
}

function writeNativeHistorySecondaryAuthorityR411(
  backend: NativeHistorySecondaryAuthorityR411['backend'],
  count: number
): boolean {
  const marker: NativeHistorySecondaryAuthorityR411 = {
    version: NATIVE_HISTORY_TRANSACTION_VERSION_R411,
    backend,
    count,
    savedAt: new Date().toISOString(),
  };
  return writeAccountStorage(NATIVE_HISTORY_FALLBACK_AUTHORITY_KEY_R411, JSON.stringify(marker));
}

function manifestProtectedBucketKeysR411(...manifests: Array<NativeHistoryManifestR409 | null>): Set<string> {
  return new Set(manifests.flatMap((manifest) => (manifest?.buckets ?? []).map((bucket) => bucket.key)));
}

async function verifyNativePayloadR411(key: string, expected: string, label: string): Promise<void> {
  const stored = await nativeVaultRead(key);
  if (stored !== expected) throw new Error(`R411: confirmação de escrita falhou em ${label}.`);
}

async function cleanupInterruptedNativeTransactionR411(): Promise<void> {
  if (nativeHistoryTransactionActiveR411) return;
  let journalRaw: string | null;
  try {
    journalRaw = await nativeVaultRead(NATIVE_HISTORY_TRANSACTION_KEY_R411());
  } catch {
    return;
  }
  if (!journalRaw) return;

  const journal = parseNativeHistoryTransactionJournalR411(journalRaw);
  if (!journal) {
    await nativeVaultRemove(NATIVE_HISTORY_TRANSACTION_KEY_R411()).catch(() => undefined);
    return;
  }

  let currentRaw: string | null;
  let backupRaw: string | null;
  try {
    [currentRaw, backupRaw] = await Promise.all([
      nativeVaultRead(NATIVE_HISTORY_MANIFEST_KEY_R409()),
      nativeVaultRead(NATIVE_HISTORY_BACKUP_MANIFEST_KEY_R409()),
    ]);
  } catch {
    // Sem saber quais shards ainda estão protegidos por um manifesto, não removemos nada.
    return;
  }

  const protectedKeys = manifestProtectedBucketKeysR411(
    parseNativeHistoryManifestR409(currentRaw),
    parseNativeHistoryManifestR409(backupRaw)
  );
  let cleanupFailed = false;
  for (const key of journal.cleanupKeys) {
    if (protectedKeys.has(key)) continue;
    try {
      await nativeVaultRemove(key);
    } catch {
      cleanupFailed = true;
    }
  }
  if (!cleanupFailed) await nativeVaultRemove(NATIVE_HISTORY_TRANSACTION_KEY_R411()).catch(() => undefined);
}

function parseNativeHistoryManifestR409(raw: string | null): NativeHistoryManifestR409 | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<NativeHistoryManifestR409>;
    if (value.version !== NATIVE_HISTORY_SHARD_VERSION_R409) return null;
    if (!Number.isInteger(value.count) || Number(value.count) < 0) return null;
    if (value.bucketCount !== NATIVE_HISTORY_BUCKET_COUNT_R409) return null;
    if (!Array.isArray(value.order) || value.order.length !== value.count || !value.order.every((key) => typeof key === 'string' && Boolean(key))) return null;
    if (new Set(value.order).size !== value.count) return null;
    if (!Array.isArray(value.buckets)) return null;
    const seenIndexes = new Set<number>();
    const seenKeys = new Set<string>();
    let declaredCountR410 = 0;
    for (const bucket of value.buckets) {
      if (!bucket || !Number.isInteger(bucket.index) || bucket.index < 0 || bucket.index >= NATIVE_HISTORY_BUCKET_COUNT_R409) return null;
      if (typeof bucket.key !== 'string' || !bucket.key || typeof bucket.fingerprint !== 'string' || !bucket.fingerprint) return null;
      if (!Number.isInteger(bucket.count) || bucket.count <= 0 || seenIndexes.has(bucket.index) || seenKeys.has(bucket.key)) return null;
      seenIndexes.add(bucket.index);
      seenKeys.add(bucket.key);
      declaredCountR410 += bucket.count;
    }
    if (declaredCountR410 !== value.count) return null;
    return value as NativeHistoryManifestR409;
  } catch {
    return null;
  }
}

async function mapWithConcurrencyR410<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  if (!items.length) return [];
  const output = new Array<R>(items.length);
  let cursor = 0;
  const runner = async () => {
    while (true) {
      const index = cursor;
      cursor += 1;
      if (index >= items.length) return;
      output[index] = await worker(items[index], index);
    }
  };
  const workers = Math.min(Math.max(1, concurrency), items.length);
  await Promise.all(Array.from({ length: workers }, () => runner()));
  return output;
}

function nativeHistoryReadConcurrencyR412(manifest: NativeHistoryManifestR409): number {
  if (!manifest.buckets.length) return 1;
  const largestBucket = manifest.buckets.reduce((largest, bucket) => Math.max(largest, bucket.count), 1);
  return Math.max(
    1,
    Math.min(
      NATIVE_HISTORY_READ_CONCURRENCY_R410,
      Math.floor(NATIVE_HISTORY_MAX_INFLIGHT_ITEMS_R412 / largestBucket) || 1
    )
  );
}

async function readAndNormalizeNativeHistoryBucketR412(
  bucket: NativeHistoryBucketManifestR409,
  fallbackOffset: number
): Promise<SavedAnalysis[]> {
  const raw = await nativeVaultRead(bucket.key);
  if (!raw || contentFingerprintR409(raw) !== bucket.fingerprint) {
    throw new Error(`R412: shard ${bucket.index} ausente ou corrompido.`);
  }
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed) || parsed.length !== bucket.count) {
    throw new Error(`R412: shard ${bucket.index} com contagem inválida.`);
  }
  return normalizeHistoryList(parsed, fallbackOffset);
}

async function readNativeHistoryManifestPayloadR409(manifest: NativeHistoryManifestR409): Promise<SavedAnalysis[]> {
  if (!manifest.count) return [];

  // R412: a saída nasce diretamente na ordem final. Não retemos os arrays JSON
  // de todos os shards até o fim da leitura, reduzindo muito o pico de memória.
  const ordered = new Array<SavedAnalysis | undefined>(manifest.count);
  const orderIndex = new Map<string, number>();
  for (let index = 0; index < manifest.order.length; index += 1) {
    orderIndex.set(manifest.order[index], index);
  }

  // Mantém o fallbackIndex compatível com a ordem de buckets usada pelo R410,
  // mesmo que o agendamento abaixo priorize shards maiores para reduzir o tail.
  const fallbackOffsetByKey = new Map<string, number>();
  let fallbackOffset = 0;
  for (const bucket of manifest.buckets) {
    fallbackOffsetByKey.set(bucket.key, fallbackOffset);
    fallbackOffset += bucket.count;
  }
  if (fallbackOffset !== manifest.count) throw new Error('R412: contagem do manifesto divergiu antes da hidratação.');

  const scheduledBuckets = [...manifest.buckets].sort((left, right) => (
    right.count - left.count || left.index - right.index
  ));
  const concurrency = nativeHistoryReadConcurrencyR412(manifest);

  await mapWithConcurrencyR410(
    scheduledBuckets,
    concurrency,
    async (bucket) => {
      const normalized = await readAndNormalizeNativeHistoryBucketR412(
        bucket,
        fallbackOffsetByKey.get(bucket.key) ?? 0
      );
      for (const item of normalized) {
        const targetIndex = orderIndex.get(item.saveKey);
        if (targetIndex === undefined) {
          throw new Error(`R412: shard contém ficha ausente da ordem ou duplicada: ${item.saveKey}.`);
        }
        ordered[targetIndex] = item;
        orderIndex.delete(item.saveKey);
      }
      return undefined;
    }
  );

  if (orderIndex.size !== 0 || ordered.some((item) => item === undefined)) {
    throw new Error('R412: manifesto e shards divergiram durante a hidratação incremental.');
  }
  return ordered as SavedAnalysis[];
}

async function promoteRecoveredNativeManifestR410(raw: string): Promise<void> {
  try {
    await nativeVaultWrite(NATIVE_HISTORY_MANIFEST_KEY_R409(), raw);
  } catch (error) {
    console.warn('R410: snapshot anterior foi recuperado, mas a promoção automática falhou.', error);
  }
}

async function readNativeHistoryShardedR409(): Promise<SavedAnalysis[] | null> {
  const manifestRaw = await nativeVaultRead(NATIVE_HISTORY_MANIFEST_KEY_R409()).catch(() => null);
  const manifest = parseNativeHistoryManifestR409(manifestRaw);
  if (manifest && manifestRaw) {
    try {
      return await readNativeHistoryManifestPayloadR409(manifest);
    } catch (error) {
      console.warn('R410: snapshot nativo atual inválido; tentando snapshot anterior.', error);
    }
  }

  // O backup não participa do caminho saudável. Só há I/O extra quando o atual
  // está ausente, inválido ou algum shard falhou na validação.
  const backupRaw = await nativeVaultRead(NATIVE_HISTORY_BACKUP_MANIFEST_KEY_R409()).catch(() => null);
  if (!manifestRaw && !backupRaw) return null;
  const backup = parseNativeHistoryManifestR409(backupRaw);
  if (backup && backupRaw) {
    const recovered = await readNativeHistoryManifestPayloadR409(backup);
    await promoteRecoveredNativeManifestR410(backupRaw);
    return recovered;
  }
  throw new Error('R410: nenhum snapshot nativo íntegro disponível.');
}

async function writeNativeHistoryShardedR409(items: SavedAnalysis[]): Promise<void> {
  await cleanupInterruptedNativeTransactionR411();
  nativeHistoryTransactionActiveR411 = true;
  let committed = false;
  try {
    const currentManifestRaw = await nativeVaultRead(NATIVE_HISTORY_MANIFEST_KEY_R409()).catch(() => null);
    const currentManifest = parseNativeHistoryManifestR409(currentManifestRaw);
    const oldBackupRaw = await nativeVaultRead(NATIVE_HISTORY_BACKUP_MANIFEST_KEY_R409()).catch(() => null);
    const oldBackup = parseNativeHistoryManifestR409(oldBackupRaw);
    const currentByIndex = new Map((currentManifest?.buckets ?? []).map((bucket) => [bucket.index, bucket]));
    const buckets = Array.from({ length: NATIVE_HISTORY_BUCKET_COUNT_R409 }, () => [] as SavedAnalysis[]);
    for (const item of items) buckets[bucketIndexR409(item.saveKey)].push(item);

    const nextBuckets: NativeHistoryBucketManifestR409[] = [];
    const staged: Array<{ key: string; payload: string; fingerprint: string; index: number; count: number }> = [];
    for (let index = 0; index < buckets.length; index += 1) {
      const bucketItems = buckets[index];
      if (!bucketItems.length) continue;
      const payload = JSON.stringify(bucketItems);
      const fingerprint = contentFingerprintR409(payload);
      const previous = currentByIndex.get(index);
      if (previous && previous.fingerprint === fingerprint && previous.count === bucketItems.length) {
        nextBuckets.push(previous);
        continue;
      }
      const key = NATIVE_HISTORY_BUCKET_KEY_R409(index, fingerprint);
      staged.push({ key, payload, fingerprint, index, count: bucketItems.length });
      nextBuckets.push({ index, key, fingerprint, count: bucketItems.length });
    }

    const manifest: NativeHistoryManifestR409 = {
      version: NATIVE_HISTORY_SHARD_VERSION_R409,
      count: items.length,
      bucketCount: NATIVE_HISTORY_BUCKET_COUNT_R409,
      buckets: nextBuckets,
      order: items.map((item) => item.saveKey),
      savedAt: new Date().toISOString(),
    };
    const manifestRaw = JSON.stringify(manifest);
    const cleanupKeys = Array.from(new Set<string>([
      ...staged.map((entry) => entry.key),
      ...(oldBackup?.buckets ?? []).map((bucket) => bucket.key),
    ]));
    const journal: NativeHistoryTransactionJournalR411 = {
      version: NATIVE_HISTORY_TRANSACTION_VERSION_R411,
      targetManifestFingerprint: contentFingerprintR409(manifestRaw),
      cleanupKeys,
      startedAt: new Date().toISOString(),
    };
    const journalRaw = JSON.stringify(journal);

    // O journal é persistido e confirmado antes de qualquer shard novo. Se o APK for
    // interrompido, a próxima abertura sabe exatamente quais arquivos podem ter ficado órfãos.
    await nativeVaultWrite(NATIVE_HISTORY_TRANSACTION_KEY_R411(), journalRaw);
    await verifyNativePayloadR411(NATIVE_HISTORY_TRANSACTION_KEY_R411(), journalRaw, 'journal transacional');

    for (const entry of staged) {
      await nativeVaultWrite(entry.key, entry.payload);
      await verifyNativePayloadR411(entry.key, entry.payload, `shard ${entry.index}`);
    }

    // Snapshot anterior vira recuperação e é confirmado antes do ponteiro atual. Portanto, uma interrupção durante
    // a troca do manifesto nunca exige misturar uma geração antiga com shards novos.
    if (currentManifest && currentManifestRaw) {
      await nativeVaultWrite(NATIVE_HISTORY_BACKUP_MANIFEST_KEY_R409(), currentManifestRaw);
      await verifyNativePayloadR411(NATIVE_HISTORY_BACKUP_MANIFEST_KEY_R409(), currentManifestRaw, 'manifesto de recuperação');
    }

    await nativeVaultWrite(NATIVE_HISTORY_MANIFEST_KEY_R409(), manifestRaw);
    await verifyNativePayloadR411(NATIVE_HISTORY_MANIFEST_KEY_R409(), manifestRaw, 'manifesto atual');
    committed = true;

    // O monólito legado só deixa de existir depois de o commit atual ter sido lido de volta.
    await nativeVaultRemove(NATIVE_HISTORY_STORAGE_KEY()).catch(() => undefined);
  } finally {
    nativeHistoryTransactionActiveR411 = false;
  }

  // Depois do commit, o coletor preserva automaticamente todos os shards referenciados pelo
  // atual e pelo backup e remove somente staging/gerações antigas realmente órfãs.
  if (committed) await cleanupInterruptedNativeTransactionR411();
}

export type LearnedCardMemory = {
  playerName: string;
  mainPosition: PositionCode;
  playstyle?: string | null;
  targetPosition: PositionCode | 'AUTO';
  trainingPointsTotal?: string;
  updatedAt: string;
};

export function memoryKey(value: string) {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function sameHistoryUsageIdentityR457(left: SavedAnalysis, right: SavedAnalysis) {
  if (/-variante-/i.test(left.saveKey) || /-variante-/i.test(right.saveKey)) return left.saveKey === right.saveKey;
  if (analysisUsagePositionR138(left.result) !== analysisUsagePositionR138(right.result)) return false;
  if (analysisUsageFunctionR457(left.result) !== analysisUsageFunctionR457(right.result)) return false;
  const rightAliases = new Set(cardIdentityAliasesR457(right.result.parsed));
  return cardIdentityAliasesR457(left.result.parsed).some((alias) => rightAliases.has(alias));
}

function historyUsageIdentityTokensR457(item: SavedAnalysis): string[] {
  const tokens = [`save:${item.saveKey}`];
  if (/-variante-/i.test(item.saveKey)) return tokens;
  const position = analysisUsagePositionR138(item.result);
  const usageFunction = analysisUsageFunctionR457(item.result);
  for (const alias of cardIdentityAliasesR457(item.result.parsed)) tokens.push(`usage:${alias}|${position}|${usageFunction}`);
  return tokens;
}

export function resultHistoryKey(result: AnalysisResult) {
  // R457 Stage 3: a carta é estável; a build é identificada por posição + função real de uso.
  // GER, orçamento, ficha aplicada, skill adicional e Ímpeto nunca criam outra carta.
  return analysisUsageIdentityKeyR138(result);
}

export function buildLegacyRecoveryText(result: Partial<AnalysisResult> | null | undefined, rawText = '') {
  const parsed = result?.parsed as Partial<AnalysisResult['parsed']> | undefined;
  const lines: string[] = [];
  if (rawText.trim()) lines.push(rawText.trim());
  if (parsed?.playerName) lines.push(`NOME DO JOGADOR: ${parsed.playerName}`);
  if (parsed?.mainPosition) lines.push(`POSIÇÃO PRINCIPAL: ${parsed.mainPosition}`);
  if (parsed?.playstyle) lines.push(`ESTILO DE JOGO: ${parsed.playstyle}`);
  if (Number.isFinite(Number(parsed?.overall))) lines.push(`GER: ${Number(parsed?.overall)}`);
  if (Number.isFinite(Number(parsed?.maxOverall))) lines.push(`GER MÁXIMO: ${Number(parsed?.maxOverall)}`);
  if (Number.isFinite(Number(parsed?.level))) lines.push(`NÍVEL: ${Number(parsed?.level)}`);
  const total = Number(result?.trainingPointsTotal ?? parsed?.trainingPointsTotal);
  if (Number.isFinite(total) && total >= 0) lines.push(`PONTOS TOTAIS: ${Math.round(total)}`);
  const positions = Array.isArray(parsed?.positions) ? parsed.positions.filter(Boolean) : [];
  if (positions.length) lines.push(`POSIÇÕES: ${positions.join(', ')}`);
  const skills = Array.isArray(parsed?.nativeSkills) ? parsed.nativeSkills.filter(Boolean) : [];
  if (skills.length) lines.push(`HABILIDADES: ${skills.join(', ')}`);
  const attrs = parsed?.attributes && typeof parsed.attributes === 'object' ? parsed.attributes : {};
  for (const [key, value] of Object.entries(attrs)) {
    const num = Number(value);
    if (Number.isFinite(num)) lines.push(`${ATTRIBUTE_PT[key as AttributeKey] ?? key}: ${num}`);
  }
  return lines.join('\n');
}

export function migrateAnalysisResult(value: unknown, rawText = '', imageFileName?: string | null): AnalysisResult | null {
  // Fichas renderizáveis são carregadas sem recalcular o Cofre inteiro no startup.
  // A atualização para a autoridade atual acontece sob demanda quando a ficha é aberta.
  if (isRenderableAnalysisResult(value)) return value;
  if (!value || typeof value !== 'object') return null;
  const legacy = value as Partial<AnalysisResult>;
  const target = optionalAnalysisUsagePositionR138(legacy as Parameters<typeof optionalAnalysisUsagePositionR138>[0]) ?? 'AUTO';
  const source = buildLegacyRecoveryText(legacy, rawText);
  if (!source.trim()) return null;
  try {
    return createProductionAnalysisR138({ rawText: source, objective: 'COMPETITIVE', targetPosition: target, imageFileName: imageFileName ?? null, tacticalProfile: { formation: 'AUTO', style: 'AUTO' } });
  } catch (error) {
    console.error('Não foi possível migrar uma ficha antiga do Cofre:', error);
    return null;
  }
}

export function normalizeSavedAnalysis(entry: unknown, fallbackIndex = 0): SavedAnalysis | null {
  try {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return null;
    const candidate = entry as Partial<SavedAnalysis>;
    const rawText = typeof candidate.rawText === 'string' ? candidate.rawText : '';
    const playerImage = typeof candidate.playerImage === 'string' ? candidate.playerImage : null;
    const migratedResult = migrateAnalysisResult(candidate.result, rawText, playerImage);
    if (!migratedResult?.parsed?.playerName) return null;

    const generatedKey = resultHistoryKey(migratedResult);
    const previousSaveKey = typeof candidate.saveKey === 'string' ? candidate.saveKey.trim() : '';
    // Cópias/variantes criadas deliberadamente continuam independentes.
    // Entradas normais são migradas para a chave canônica para evitar duplicata entre versões do motor.
    const saveKey = /-variante-/i.test(previousSaveKey) ? previousSaveKey : generatedKey;
    const savedAt = typeof candidate.savedAt === 'string' && candidate.savedAt.trim()
      ? candidate.savedAt
      : new Date().toLocaleString('pt-BR');
    const recommended = migratedResult.recommendedSkills.filter((skill): skill is string => typeof skill === 'string' && Boolean(skill.trim()));
    const rawProgress = candidate.skillProgress && typeof candidate.skillProgress === 'object' && !Array.isArray(candidate.skillProgress)
      ? candidate.skillProgress
      : {};
    const progress: SavedSkillProgress = { ...rawProgress };
    for (const skill of recommended) {
      if (progress[skill] === undefined) progress[skill] = false;
    }

    const changeLog = Array.isArray(candidate.changeLog)
      ? candidate.changeLog.filter((item): item is SavedHistoryEvent => (
          Boolean(item)
          && typeof item === 'object'
          && typeof item.at === 'string'
          && typeof item.action === 'string'
          && typeof item.note === 'string'
        )).slice(0, 20)
      : [{ at: savedAt, action: 'criado', note: 'Ficha adicionada ao Cofre.' }];

    const identitySeal = buildVaultIdentitySealR134(migratedResult);
    return {
      id: typeof candidate.id === 'string' && candidate.id.trim()
        ? candidate.id
        : `${saveKey || 'ficha'}-${fallbackIndex}`,
      saveKey,
      savedAt,
      updatedAt: typeof candidate.updatedAt === 'string' && candidate.updatedAt.trim() ? candidate.updatedAt : savedAt,
      rawText,
      playerImage,
      fullPreview: typeof candidate.fullPreview === 'string' ? candidate.fullPreview : null,
      result: migratedResult,
      skillProgress: progress,
      notes: typeof candidate.notes === 'string' ? candidate.notes : '',
      favorite: Boolean(candidate.favorite),
      statusTag: candidate.statusTag === 'completo' || candidate.statusTag === 'pendente' || candidate.statusTag === 'revisar'
        ? candidate.statusTag
        : undefined,
      personalTags: Array.isArray(candidate.personalTags)
        ? candidate.personalTags.filter((tag): tag is string => typeof tag === 'string')
        : [],
      tacticalRoleNote: typeof candidate.tacticalRoleNote === 'string' ? candidate.tacticalRoleNote : '',
      changeLog: changeLog.length ? changeLog : [{ at: savedAt, action: 'recuperado', note: 'Ficha antiga reparada automaticamente.' }],
      lastOpenedAt: typeof candidate.lastOpenedAt === 'string' ? candidate.lastOpenedAt : undefined,
      folderId: typeof candidate.folderId === 'string' ? candidate.folderId : undefined,
      productionRecordVersion: typeof candidate.productionRecordVersion === 'string' ? candidate.productionRecordVersion : undefined,
      ...identitySeal
    };
  } catch (error) {
    console.error('Uma ficha incompatível foi isolada sem interromper o aplicativo:', error);
    return null;
  }
}

export function ensureSkillProgress(current: SavedSkillProgress | undefined, skills: string[]) {
  const next: SavedSkillProgress = { ...(current ?? {}) };
  for (const skill of skills) {
    if (next[skill] === undefined) next[skill] = false;
  }
  return next;
}

export function skillProgressInfo(skills: string[], progress: SavedSkillProgress | undefined) {
  const unique = Array.from(new Set(skills));
  const done = unique.filter((skill) => progress?.[skill]).length;
  return { done, total: unique.length, percent: unique.length ? Math.round((done / unique.length) * 100) : 0 };
}

export function savedStatusLabel(item: SavedAnalysis) {
  const info = skillProgressInfo(item.result.recommendedSkills, item.skillProgress);
  if (item.statusTag) return item.statusTag;
  if (!info.total) return 'revisar';
  return info.done >= info.total ? 'completo' : 'pendente';
}

export function appendSavedEvent(item: SavedAnalysis, action: string, note: string): SavedAnalysis {
  const at = new Date().toLocaleString('pt-BR');
  const changeLog = [{ at, action, note }, ...(item.changeLog ?? [])].slice(0, 20);
  return { ...item, updatedAt: at, changeLog };
}

export function savedStatusText(item: SavedAnalysis) {
  const status = savedStatusLabel(item);
  if (status === 'completo') return 'Completo';
  if (status === 'revisar') return 'Revisar ficha';
  const info = skillProgressInfo(item.result.recommendedSkills, item.skillProgress);
  return `Faltam ${Math.max(0, info.total - info.done)} habilidade(s)`;
}

export function savedPositionGroup(item: SavedAnalysis) {
  return analysisUsagePositionR138(item.result);
}

export function buildDashboardStats(history: SavedAnalysis[]) {
  const total = history.length;
  const pending = history.filter((item) => savedStatusLabel(item) === 'pendente').length;
  const complete = history.filter((item) => savedStatusLabel(item) === 'completo').length;
  const favorites = history.filter((item) => item.favorite).length;
  const positions = new Set(history.map((item) => analysisUsagePositionR138(item.result)));
  const review = history.filter((item) => savedStatusLabel(item) === 'revisar').length;
  const skillsTotal = history.reduce((sum, item) => sum + skillProgressInfo(item.result.recommendedSkills, item.skillProgress).total, 0);
  const skillsDone = history.reduce((sum, item) => sum + skillProgressInfo(item.result.recommendedSkills, item.skillProgress).done, 0);
  const completion = skillsTotal ? Math.round((skillsDone / skillsTotal) * 100) : 0;
  return { total, pending, complete, favorites, positions: positions.size, review, skillsTotal, skillsDone, completion };
}

export function openHistoryDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      reject(new Error('IndexedDB indisponível'));
      return;
    }

    const request = window.indexedDB.open(accountDatabaseName(HISTORY_DB_NAME), 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(HISTORY_STORE_NAME)) {
        db.createObjectStore(HISTORY_STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Falha ao abrir o cofre local'));
  });
}

export async function readIndexedHistory(): Promise<SavedAnalysis[]> {
  const db = await openHistoryDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(HISTORY_STORE_NAME, 'readonly');
    const store = tx.objectStore(HISTORY_STORE_NAME);
    const request = store.get(HISTORY_KEY);
    request.onsuccess = () => resolve(Array.isArray(request.result) ? request.result : []);
    request.onerror = () => reject(request.error ?? new Error('Falha ao ler fichário'));
    tx.oncomplete = () => db.close();
    tx.onerror = () => {
      db.close();
      reject(tx.error ?? new Error('Falha na leitura do fichário'));
    };
  });
}

export async function readLegacyIndexedHistoryForAdmin(): Promise<SavedAnalysis[]> {
  const identity = getActiveAccountIdentity();
  if (identity?.role !== 'admin' || typeof window === 'undefined' || !('indexedDB' in window)) return [];
  return new Promise((resolve) => {
    const request = window.indexedDB.open(HISTORY_DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(HISTORY_STORE_NAME)) db.createObjectStore(HISTORY_STORE_NAME);
    };
    request.onerror = () => resolve([]);
    request.onsuccess = () => {
      const db = request.result;
      try {
        const tx = db.transaction(HISTORY_STORE_NAME, 'readonly');
        const get = tx.objectStore(HISTORY_STORE_NAME).get(HISTORY_KEY);
        get.onsuccess = () => resolve(Array.isArray(get.result) ? get.result : []);
        get.onerror = () => resolve([]);
        tx.oncomplete = () => db.close();
        tx.onerror = () => { db.close(); resolve([]); };
      } catch {
        db.close(); resolve([]);
      }
    };
  });
}

export async function writeIndexedHistory(items: SavedAnalysis[]): Promise<void> {
  const db = await openHistoryDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(HISTORY_STORE_NAME, 'readwrite');
    const store = tx.objectStore(HISTORY_STORE_NAME);
    store.put(items, HISTORY_KEY);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error ?? new Error('Falha ao gravar fichário'));
    };
  });
}

export function normalizeHistoryList(entries: unknown[], offset = 0): SavedAnalysis[] {
  const loaded: SavedAnalysis[] = [];
  const seen = new Set<string>();
  for (const entry of entries) {
    try {
      const normalized = normalizeSavedAnalysis(entry, offset + loaded.length);
      if (!normalized) continue;
      const tokens = historyUsageIdentityTokensR457(normalized);
      if (tokens.some((token) => seen.has(token))) continue;
      for (const token of tokens) seen.add(token);
      loaded.push(normalized);
    } catch (error) {
      console.error('Entrada defeituosa do Cofre ignorada durante a recuperação:', error);
    }
  }
  return loaded;
}

export function mergeHistoryLists(primary: SavedAnalysis[], secondary: SavedAnalysis[]): SavedAnalysis[] {
  // R459: merge linear por tokens canônicos de identidade. Mantém exatamente a precedência histórica:
  // secondary entra primeiro e primary substitui a primeira identidade equivalente encontrada.
  const merged: SavedAnalysis[] = [];
  const tokensByIndex: string[][] = [];
  const tokenIndexes = new Map<string, Set<number>>();

  const addIndex = (index: number, tokens: string[]) => {
    tokensByIndex[index] = tokens;
    for (const token of tokens) {
      let indexes = tokenIndexes.get(token);
      if (!indexes) { indexes = new Set<number>(); tokenIndexes.set(token, indexes); }
      indexes.add(index);
    }
  };
  const removeIndex = (index: number) => {
    for (const token of tokensByIndex[index] ?? []) {
      const indexes = tokenIndexes.get(token);
      if (!indexes) continue;
      indexes.delete(index);
      if (!indexes.size) tokenIndexes.delete(token);
    }
  };
  const equivalentIndex = (tokens: string[]) => {
    let best = -1;
    for (const token of tokens) {
      for (const index of tokenIndexes.get(token) ?? []) {
        if (best < 0 || index < best) best = index;
      }
    }
    return best;
  };

  for (const item of [...secondary, ...primary]) {
    const tokens = historyUsageIdentityTokensR457(item);
    const index = equivalentIndex(tokens);
    if (index >= 0) {
      removeIndex(index);
      merged[index] = item;
      addIndex(index, tokens);
    } else {
      const nextIndex = merged.length;
      merged.push(item);
      addIndex(nextIndex, tokens);
    }
  }
  return merged;
}

export type HistoryLoadOptions = {
  maxNativeBytes?: number;
  skipNative?: boolean;
  onNativeDeferred?: (bytes: number) => void;
};

export type StartupHistoryLoadResult = {
  items: SavedAnalysis[];
  nativeDeferredBytes: number;
};

export async function loadHistoryStore(options: HistoryLoadOptions = {}): Promise<SavedAnalysis[]> {
  const loaded: SavedAnalysis[] = [];
  const loadedKeys = new Set<string>();
  const pushUnique = (item: SavedAnalysis) => {
    if (loadedKeys.has(item.saveKey)) return;
    loadedKeys.add(item.saveKey);
    loaded.push(item);
  };
  let nativeAuthoritativeR409 = false;
  const secondaryAuthorityR411 = parseNativeHistorySecondaryAuthorityR411(
    readAccountStorage(NATIVE_HISTORY_FALLBACK_AUTHORITY_KEY_R411)
  );

  // A coleta do journal é independente de quem será a autoridade desta abertura. Se o plugin
  // nativo voltou a responder, aproveitamos para retirar staging órfão mesmo enquanto o fallback
  // mais novo continua sendo a fonte oficial dos dados.
  if (isNativeVaultStorageAvailable() && !options.skipNative) await cleanupInterruptedNativeTransactionR411();

  // Se uma gravação nativa falhou depois de o fallback ter sido salvo, o fallback é a versão
  // mais nova e explícita da verdade. Não permitimos que um snapshot nativo antigo ressuscite
  // fichas removidas ou descarte alterações mais recentes.
  if (secondaryAuthorityR411) {
    try {
      if (secondaryAuthorityR411.backend === 'indexeddb') {
        for (const item of normalizeHistoryList(await readIndexedHistory())) pushUnique(item);
      } else {
        const stored = readAccountStorage(HISTORY_KEY);
        const parsed = stored ? JSON.parse(stored) : [];
        if (!Array.isArray(parsed)) throw new Error('R411: fallback local autoritativo inválido.');
        for (const item of normalizeHistoryList(parsed)) pushUnique(item);
      }
      if (loaded.length !== secondaryAuthorityR411.count) {
        console.warn(`R411: fallback autoritativo declarou ${secondaryAuthorityR411.count} ficha(s), mas ${loaded.length} foram recuperadas.`);
      }
    } catch (error) {
      console.error('R411: não foi possível ler o fallback autoritativo mais recente.', error);
    }
    return loaded;
  }

  if (isNativeVaultStorageAvailable() && !options.skipNative) {
    try {
      const sharded = await readNativeHistoryShardedR409();
      if (sharded !== null) {
        for (const item of sharded) pushUnique(item);
        nativeAuthoritativeR409 = true;
      } else {
        // Migração transparente: instalações antigas ainda podem ter o snapshot monolítico.
        const storageKey = NATIVE_HISTORY_STORAGE_KEY();
        const info = await nativeVaultInfo(storageKey).catch(() => null);
        const maxNativeBytes = Number(options.maxNativeBytes || 0);
        if (maxNativeBytes > 0 && Number(info?.usedBytes || 0) > maxNativeBytes) {
          options.onNativeDeferred?.(Number(info?.usedBytes || 0));
        } else {
          const raw = await nativeVaultRead(storageKey, maxNativeBytes > 0 ? maxNativeBytes : undefined);
          if (raw !== null) {
            const parsed = raw ? JSON.parse(raw) : [];
            if (Array.isArray(parsed)) {
              for (const item of normalizeHistoryList(parsed)) pushUnique(item);
              nativeAuthoritativeR409 = true;
            }
          }
        }
      }
    } catch (error) {
      console.error('R411: snapshot nativo indisponível; recuperando pelas rotas secundárias.', error);
    }
  }

  if (!nativeAuthoritativeR409) {
    try {
      for (const item of normalizeHistoryList(await readIndexedHistory(), loaded.length)) pushUnique(item);
      if (!loaded.length) {
        const legacy = normalizeHistoryList(await readLegacyIndexedHistoryForAdmin());
        for (const item of legacy) pushUnique(item);
        if (legacy.length) await writeIndexedHistory(legacy);
      }
    } catch {
      // Se o IndexedDB falhar, o app tenta recuperar pelo armazenamento antigo.
    }

    try {
      const keys = [HISTORY_KEY, ...OLD_HISTORY_KEYS];
      for (const key of keys) {
        const stored = readAccountStorage(key);
        if (!stored) continue;
        const parsed = JSON.parse(stored);
        if (!Array.isArray(parsed)) continue;
        for (const item of normalizeHistoryList(parsed, loaded.length)) pushUnique(item);
      }
    } catch {
      // O cofre antigo é opcional; falha de leitura não pode travar o app.
    }
  }

  return loaded;
}

export async function loadHistoryStoreForStartup(): Promise<StartupHistoryLoadResult> {
  let nativeDeferredBytes = 0;
  const items = await loadHistoryStore({
    maxNativeBytes: STARTUP_NATIVE_HISTORY_MAX_BYTES,
    onNativeDeferred: (bytes) => { nativeDeferredBytes = bytes; }
  });
  return { items, nativeDeferredBytes };
}

export function compactHistoryForNativeStorage(items: SavedAnalysis[]): SavedAnalysis[] {
  // O print inteiro não é duplicado no Cofre: ele costuma ser a maior parte do tamanho.
  // A ficha calculada, habilidades, Booster, observações e a imagem recortada continuam salvos.
  const maxPlayerImageChars = 900_000;
  let retainedImageChars = 0;
  const maxRetainedImageChars = 6_000_000;
  return items.map((entry) => ({
    ...entry,
    folderId: entry.folderId,
    playerImage: entry.playerImage && entry.playerImage.length <= maxPlayerImageChars && retainedImageChars + entry.playerImage.length <= maxRetainedImageChars ? (retainedImageChars += entry.playerImage.length, entry.playerImage) : null,
    fullPreview: null,
    rawText: String(entry.rawText || '').slice(0, 50_000),
    changeLog: entry.changeLog?.slice(0, 20)
  }));
}

export function compactHistoryForLocalFallback(items: SavedAnalysis[]): SavedAnalysis[] {
  // O localStorage é somente a última rota de emergência no navegador.
  return compactHistoryForNativeStorage(items).map((item) => ({
    ...item,
    playerImage: null,
    rawText: String(item.rawText || '').slice(0, 12_000)
  }));
}

export type HistoryPersistenceResult =
  | { saved: true; backend: 'native-internal' | 'indexeddb' | 'local-fallback'; items: number }
  | { saved: false; backend: 'none'; items: 0; error: string };

let historyPersistenceQueue: Promise<HistoryPersistenceResult> = Promise.resolve({ saved: true, backend: 'indexeddb', items: 0 });

async function persistHistoryStoreImmediate(items: SavedAnalysis[]): Promise<HistoryPersistenceResult> {
  const next = [...items];
  const compacted = compactHistoryForNativeStorage(next);
  let nativeError: unknown = null;
  let indexedError: unknown = null;
  const nativeAvailableR411 = isNativeVaultStorageAvailable();

  if (nativeAvailableR411) {
    try {
      await writeNativeHistoryShardedR409(compacted);
      removeAccountStorage(NATIVE_HISTORY_FALLBACK_AUTHORITY_KEY_R411);
      removeAccountStorage(HISTORY_KEY);
      for (const key of OLD_HISTORY_KEYS) removeAccountStorage(key);
      return { saved: true, backend: 'native-internal', items: next.length };
    } catch (cause) {
      nativeError = cause;
    }
  }

  try {
    await writeIndexedHistory(compacted);
    removeAccountStorage(HISTORY_KEY);
    if (nativeAvailableR411 && nativeError) {
      const authoritySaved = writeNativeHistorySecondaryAuthorityR411('indexeddb', next.length);
      if (!authoritySaved) {
        return {
          saved: false,
          backend: 'none',
          items: 0,
          error: 'A ficha foi gravada no IndexedDB, mas o marcador de autoridade não pôde ser confirmado. Tente salvar novamente para evitar voltar ao snapshot nativo antigo.'
        };
      }
    }
    return { saved: true, backend: 'indexeddb', items: next.length };
  } catch (cause) {
    indexedError = cause;
  }

  const fallbackSaved = writeAccountStorage(HISTORY_KEY, JSON.stringify(compactHistoryForLocalFallback(next)));
  if (fallbackSaved) {
    if (nativeAvailableR411 && nativeError) {
      const authoritySaved = writeNativeHistorySecondaryAuthorityR411('local-fallback', next.length);
      if (!authoritySaved) {
        return {
          saved: false,
          backend: 'none',
          items: 0,
          error: 'O fallback local foi escrito, mas não pôde assumir autoridade com segurança. Tente salvar novamente.'
        };
      }
    }
    return { saved: true, backend: 'local-fallback', items: next.length };
  }

  const detail = nativeError instanceof Error
    ? nativeError.message
    : indexedError instanceof Error
      ? indexedError.message
      : 'O aparelho recusou todas as rotas locais.';
  return { saved: false, backend: 'none', items: 0, error: `Não foi possível salvar o Cofre na memória do aparelho. ${detail}` };
}

export function persistHistoryStore(items: SavedAnalysis[]): Promise<HistoryPersistenceResult> {
  const snapshot = [...items];
  historyPersistenceQueue = historyPersistenceQueue
    .catch(() => ({ saved: false, backend: 'none', items: 0, error: 'Falha anterior de salvamento ignorada.' } as HistoryPersistenceResult))
    .then(() => persistHistoryStoreImmediate(snapshot));
  return historyPersistenceQueue;
}

export function readLearningStore(): Record<string, LearnedCardMemory> {
  try {
    const raw = readAccountStorage(LEARNING_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function findLearnedCard(text: string, fileName?: string | null): LearnedCardMemory | null {
  if (typeof window === 'undefined') return null;
  const store = readLearningStore();
  const haystack = memoryKey(`${text}
${fileName ?? ''}`);
  return Object.entries(store).find(([key]) => key && haystack.includes(key))?.[1] ?? null;
}

export function saveLearnedCard(memory: LearnedCardMemory) {
  if (typeof window === 'undefined') return;
  const key = memoryKey(memory.playerName);
  if (!key) return;
  const store = readLearningStore();
  store[key] = memory;
  try {
    writeAccountStorage(LEARNING_KEY, JSON.stringify(store));
  } catch {
    // Aprendizado local é opcional e não pode travar a ficha.
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function isRenderableAnalysisResult(value: unknown): value is AnalysisResult {
  if (!isRecord(value)) return false;
  const item = value as Partial<AnalysisResult>;
  if (!isRecord(item.parsed)) return false;

  const parsed = item.parsed as Partial<AnalysisResult['parsed']>;
  if (typeof parsed.playerName !== 'string' || !parsed.playerName.trim()) return false;
  if (typeof parsed.mainPosition !== 'string' || typeof parsed.mainPositionPt !== 'string') return false;
  if (!isStringArray(parsed.positions) || !isStringArray(parsed.positionsPt)) return false;
  if (!isStringArray(parsed.nativeSkills) || !isStringArray(parsed.specialSkills)) return false;
  if (!isRecord(parsed.attributes) || !isRecord(parsed.positionRatings)) return false;
  if (!isRecord(parsed.condition) || !isRecord(parsed.physicalProfile) || !isRecord(parsed.evidence)) return false;
  if (!isStringArray(parsed.warnings)) return false;

  if (!isRecord(item.bestPosition)) return false;
  if (typeof item.bestPosition.code !== 'string' || typeof item.bestPosition.label !== 'string') return false;
  if (!isFiniteNumber(item.bestPosition.score)) return false;

  if (!Array.isArray(item.positionScores)
    || !item.positionScores.every((position) => (
      isRecord(position)
      && typeof position.code === 'string'
      && typeof position.label === 'string'
      && typeof position.role === 'string'
      && isFiniteNumber(position.score)
    ))) return false;

  if (!isRecord(item.training) || !isRecord(item.trainingCost)) return false;
  if (!isFiniteNumber(item.trainingPointsUsed)
    || !isFiniteNumber(item.trainingPointsTotal)
    || !isFiniteNumber(item.trainingPointsRemaining)) return false;
  if (typeof item.trainingCostRule !== 'string' || typeof item.buildName !== 'string') return false;

  if (!Array.isArray(item.buildVariants)
    || !isStringArray(item.recommendationExplanation)
    || !isStringArray(item.profileTips)
    || !Array.isArray(item.permittedPositions)
    || !Array.isArray(item.avoidPositions)
    || !isStringArray(item.recommendedSkills)
    || !Array.isArray(item.skillRecommendations)
    || !item.skillRecommendations.every((skill) => isRecord(skill) && typeof skill.name === 'string')
    || !isStringArray(item.avoidSkills)
    || !Array.isArray(item.recommendedImpetos)
    || !isStringArray(item.strengths)
    || !isStringArray(item.weaknesses)
    || !isStringArray(item.usageTips)
    || !Array.isArray(item.marginalReturn)) return false;

  if (!isRecord(item.tacticalProfile)
    || !isRecord(item.teamMap)
    || !isRecord(item.validation)
    || !isRecord(item.deepAnalysis)
    || !isRecord(item.advancedTacticalFunction)
    || !isRecord(item.specialSkillsAnalysis)
    || !isRecord(item.physicalEngine)
    || !isRecord(item.attributeGoals)
    || !isRecord(item.advancedOptimizer)
    || !isRecord(item.correctionLimit)
    || !isRecord(item.errorTolerance)
    || !isRecord(item.skillPriority)) return false;

  const special = item.specialSkillsAnalysis as AnalysisResult['specialSkillsAnalysis'];
  const priority = item.skillPriority as AnalysisResult['skillPriority'];
  const tolerance = item.errorTolerance as AnalysisResult['errorTolerance'];
  return Array.isArray(special.usefulOwned)
    && Array.isArray(priority.ordered)
    && Array.isArray(priority.context)
    && isRecord(tolerance.conservative)
    && isRecord(tolerance.probable)
    && isRecord(tolerance.optimistic);
}
