import {
  ATTRIBUTE_PT,
  analyzeCard,
  type AnalysisResult,
  type AttributeKey,
  type PositionCode
} from '@/lib/analyzer';
import {
  accountDatabaseName,
  getActiveAccountIdentity,
  readAccountStorage,
  removeAccountStorage,
  writeAccountStorage
} from '@/lib/accountStorage';
import {
  isNativeVaultStorageAvailable,
  nativeVaultRead,
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
};

export const HISTORY_KEY = 'buildmaster_history_v24_6_cofre_persistente';

export const OLD_HISTORY_KEYS = ['buildmaster_history_v24_5_fichario_elite', 'buildmaster_history_v24_3_goleiro_stable', 'buildmaster_history_v24_4_habilidades_oficiais_stable'];

export const HISTORY_DB_NAME = 'buildmaster_cofre_fichas_db_v1';

export const HISTORY_STORE_NAME = 'fichas';

export const LEARNING_KEY = 'buildmaster_local_learning_v24_3';

export const HISTORY_LIMIT = 200;

const NATIVE_HISTORY_STORAGE_KEY = () => accountDatabaseName(`${HISTORY_DB_NAME}_internal_file_v1`);

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

export function resultHistoryKey(result: AnalysisResult) {
  return memoryKey([
    result.parsed.playerName,
    result.parsed.mainPosition,
    result.bestPosition.code,
    result.buildName,
    result.trainingPointsTotal
  ].join(' '));
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
  if (isRenderableAnalysisResult(value)) return value;
  if (!value || typeof value !== 'object') return null;
  const legacy = value as Partial<AnalysisResult>;
  const target = typeof legacy.bestPosition?.code === 'string' ? legacy.bestPosition.code as PositionCode : 'AUTO';
  const source = buildLegacyRecoveryText(legacy, rawText);
  if (!source.trim()) return null;
  try {
    return analyzeCard(source, 'COMPETITIVE', target, imageFileName ?? null, { formation: 'AUTO', style: 'AUTO' });
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
    const saveKey = typeof candidate.saveKey === 'string' && candidate.saveKey.trim()
      ? candidate.saveKey
      : generatedKey;
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
      folderId: typeof candidate.folderId === 'string' ? candidate.folderId : undefined
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
  return item.result.bestPosition.code;
}

export function buildDashboardStats(history: SavedAnalysis[]) {
  const total = history.length;
  const pending = history.filter((item) => savedStatusLabel(item) === 'pendente').length;
  const complete = history.filter((item) => savedStatusLabel(item) === 'completo').length;
  const favorites = history.filter((item) => item.favorite).length;
  const positions = new Set(history.map((item) => item.result.bestPosition.code));
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
    store.put(items.slice(0, HISTORY_LIMIT), HISTORY_KEY);
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
  for (const entry of entries) {
    try {
      const normalized = normalizeSavedAnalysis(entry, offset + loaded.length);
      if (normalized && !loaded.some((item) => item.saveKey === normalized.saveKey)) loaded.push(normalized);
    } catch (error) {
      console.error('Entrada defeituosa do Cofre ignorada durante a recuperação:', error);
    }
  }
  return loaded;
}

export function mergeHistoryLists(primary: SavedAnalysis[], secondary: SavedAnalysis[]): SavedAnalysis[] {
  const map = new Map<string, SavedAnalysis>();
  for (const item of [...secondary, ...primary]) {
    map.set(item.saveKey, item);
  }
  return Array.from(map.values()).slice(0, HISTORY_LIMIT);
}

export async function loadHistoryStore(): Promise<SavedAnalysis[]> {
  const loaded: SavedAnalysis[] = [];

  if (isNativeVaultStorageAvailable()) {
    try {
      const raw = await nativeVaultRead(NATIVE_HISTORY_STORAGE_KEY());
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) {
        for (const item of normalizeHistoryList(parsed)) {
          if (!loaded.some((entry) => entry.saveKey === item.saveKey)) loaded.push(item);
        }
      }
    } catch {
      // Uma instalação antiga pode ainda não possuir o plugin. As rotas web abaixo recuperam o Cofre.
    }
  }

  try {
    for (const item of normalizeHistoryList(await readIndexedHistory(), loaded.length)) {
      if (!loaded.some((entry) => entry.saveKey === item.saveKey)) loaded.push(item);
    }
    if (!loaded.length) {
      const legacy = normalizeHistoryList(await readLegacyIndexedHistoryForAdmin());
      for (const item of legacy) if (!loaded.some((entry) => entry.saveKey === item.saveKey)) loaded.push(item);
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
      for (const item of normalizeHistoryList(parsed, loaded.length)) {
        if (!loaded.some((entry) => entry.saveKey === item.saveKey)) loaded.push(item);
      }
    }
  } catch {
    // O cofre antigo é opcional; falha de leitura não pode travar o app.
  }

  return loaded.slice(0, HISTORY_LIMIT);
}

export function compactHistoryForNativeStorage(items: SavedAnalysis[]): SavedAnalysis[] {
  // O print inteiro não é duplicado no Cofre: ele costuma ser a maior parte do tamanho.
  // A ficha calculada, habilidades, Booster, observações e a imagem recortada continuam salvos.
  const maxPlayerImageChars = 900_000;
  const maxEntriesWithImage = 60;
  return items.slice(0, HISTORY_LIMIT).map((item, index) => ({
    ...item,
    playerImage: index < maxEntriesWithImage && item.playerImage && item.playerImage.length <= maxPlayerImageChars ? item.playerImage : null,
    fullPreview: null,
    rawText: String(item.rawText || '').slice(0, 50_000),
    changeLog: item.changeLog?.slice(0, 20)
  }));
}

export function compactHistoryForLocalFallback(items: SavedAnalysis[]): SavedAnalysis[] {
  // O localStorage é somente a última rota de emergência no navegador.
  return compactHistoryForNativeStorage(items).slice(0, 40).map((item) => ({
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
  const next = items.slice(0, HISTORY_LIMIT);
  let nativeError: unknown = null;
  let indexedError: unknown = null;

  if (isNativeVaultStorageAvailable()) {
    try {
      const payload = JSON.stringify(compactHistoryForNativeStorage(next));
      await nativeVaultWrite(NATIVE_HISTORY_STORAGE_KEY(), payload);
      // Elimina apenas a cópia web antiga. O arquivo principal fica em
      // getFilesDir(), memória privada do APK, e permanece após atualizações.
      removeAccountStorage(HISTORY_KEY);
      for (const key of OLD_HISTORY_KEYS) removeAccountStorage(key);
      return { saved: true, backend: 'native-internal', items: next.length };
    } catch (cause) {
      nativeError = cause;
    }
  }

  try {
    await writeIndexedHistory(compactHistoryForNativeStorage(next));
    removeAccountStorage(HISTORY_KEY);
    return { saved: true, backend: 'indexeddb', items: next.length };
  } catch (cause) {
    indexedError = cause;
  }

  const fallbackSaved = writeAccountStorage(HISTORY_KEY, JSON.stringify(compactHistoryForLocalFallback(next)));
  if (fallbackSaved) return { saved: true, backend: 'local-fallback', items: Math.min(next.length, 40) };

  const detail = nativeError instanceof Error
    ? nativeError.message
    : indexedError instanceof Error
      ? indexedError.message
      : 'O aparelho recusou todas as rotas locais.';
  return { saved: false, backend: 'none', items: 0, error: `Não foi possível salvar o Cofre na memória do aparelho. ${detail}` };
}

export function persistHistoryStore(items: SavedAnalysis[]): Promise<HistoryPersistenceResult> {
  const snapshot = items.slice(0, HISTORY_LIMIT);
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
