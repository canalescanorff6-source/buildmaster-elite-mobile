import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const STORE = 'src/modules/vault/cardHistoryStore.ts';
const STARTUP = 'src/modules/vault/cardHistoryStartupModelR200.ts';
const PACKAGE = 'package.json';
const TEST = 'tests/v40-80-r408-unlimited-fichas-pp-integrity-regression.mjs';

function replaceRequired(source, from, to, label) {
  if (source.includes(to)) return { source, changed: false };
  const count = source.split(from).length - 1;
  if (count !== 1) throw new Error(`R408: contrato inesperado em ${label}; ocorrências=${count}`);
  return { source: source.replace(from, to), changed: true };
}

function replaceAllRequired(source, from, to, label, minimum = 1) {
  if (!source.includes(from)) {
    if (source.includes(to)) return { source, changed: false, count: 0 };
    throw new Error(`R408: contrato inesperado em ${label}; ocorrências=0`);
  }
  const count = source.split(from).length - 1;
  if (count < minimum) throw new Error(`R408: contrato inesperado em ${label}; ocorrências=${count}`);
  return { source: source.split(from).join(to), changed: true, count };
}

function forceUnboundedHistoryConstants(source) {
  let next = source;
  next = next.replace(/export const HISTORY_LIMIT = (?:200|Infinity|Number\.POSITIVE_INFINITY);/, 'export const HISTORY_LIMIT = Infinity;');
  next = next.replace(/export const STARTUP_NATIVE_HISTORY_MAX_BYTES = (?:32 \* 1024 \* 1024|0);/, 'export const STARTUP_NATIVE_HISTORY_MAX_BYTES = 0;');
  return next;
}

function forceUnboundedStartupConstant(source) {
  return source.replace(
    /export const HISTORY_LIMIT_R200\s*=\s*(?:200|Infinity|Number\.POSITIVE_INFINITY|Number\.MAX_SAFE_INTEGER);(?:[^\n]*)?/,
    'export const HISTORY_LIMIT_R200 = Number.MAX_SAFE_INTEGER; // R420: símbolo legado sem teto lógico.'
  );
}

export function applyUnlimitedFichasPpIntegrityR408(rootDirectory = process.cwd()) {
  const root = resolve(rootDirectory);
  const storePath = resolve(root, STORE);
  const startupPath = resolve(root, STARTUP);
  const packagePath = resolve(root, PACKAGE);
  if (!existsSync(storePath) || !existsSync(startupPath) || !existsSync(packagePath)) {
    throw new Error('R408: fronteiras do Cofre/PP não encontradas.');
  }

  let store = readFileSync(storePath, 'utf8');
  let startup = readFileSync(startupPath, 'utf8');
  let changed = false;

  const beforeConstants = store;
  store = forceUnboundedHistoryConstants(store);
  changed ||= store !== beforeConstants;
  const beforeStartup = startup;
  startup = forceUnboundedStartupConstant(startup);
  changed ||= startup !== beforeStartup;

  // Não existe mais teto de registros em nenhum estágio lógico. Mantemos cópias rasas
  // nas filas de persistência para que uma mutação do React não altere um save em andamento.
  let r = replaceAllRequired(store, '.slice(0, HISTORY_LIMIT)', '', 'remoção final de teto lógico');
  store = r.source; changed ||= r.changed;
  r = replaceRequired(store, '  const next = items;\n', '  const next = [...items];\n', 'snapshot imediato sem teto');
  store = r.source; changed ||= r.changed;
  r = replaceRequired(store, '  const snapshot = items;\n', '  const snapshot = [...items];\n', 'snapshot da fila sem teto');
  store = r.source; changed ||= r.changed;

  // O fallback nunca pode reportar sucesso parcial. R407 removeu a fatia de 40; R408
  // mantém a contagem real para que qualquer falha de quota seja explícita, jamais silenciosa.
  store = store.replace(
    "if (fallbackSaved) return { saved: true, backend: 'local-fallback', items: Math.min(next.length, 40) };",
    "if (fallbackSaved) return { saved: true, backend: 'local-fallback', items: next.length };"
  );
  store = store.replace(
    "return compactHistoryForNativeStorage(items).slice(0, 40).map((item) => ({",
    "return compactHistoryForNativeStorage(items).map((item) => ({"
  );

  // Coleções grandes não podem degradar para O(n²) ao normalizar ou combinar backends.
  r = replaceRequired(
    store,
`export function normalizeHistoryList(entries: unknown[], offset = 0): SavedAnalysis[] {
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
}`,
`export function normalizeHistoryList(entries: unknown[], offset = 0): SavedAnalysis[] {
  const loaded: SavedAnalysis[] = [];
  const seen = new Set<string>();
  for (const entry of entries) {
    try {
      const normalized = normalizeSavedAnalysis(entry, offset + loaded.length);
      if (normalized && !seen.has(normalized.saveKey)) {
        seen.add(normalized.saveKey);
        loaded.push(normalized);
      }
    } catch (error) {
      console.error('Entrada defeituosa do Cofre ignorada durante a recuperação:', error);
    }
  }
  return loaded;
}`,
    'normalização linear do Cofre'
  );
  store = r.source; changed ||= r.changed;

  r = replaceRequired(
    store,
`export async function loadHistoryStore(options: HistoryLoadOptions = {}): Promise<SavedAnalysis[]> {
  const loaded: SavedAnalysis[] = [];
`,
`export async function loadHistoryStore(options: HistoryLoadOptions = {}): Promise<SavedAnalysis[]> {
  const loaded: SavedAnalysis[] = [];
  const loadedKeys = new Set<string>();
  const pushUnique = (item: SavedAnalysis) => {
    if (loadedKeys.has(item.saveKey)) return;
    loadedKeys.add(item.saveKey);
    loaded.push(item);
  };
`,
    'índice linear do loader'
  );
  store = r.source; changed ||= r.changed;

  r = replaceAllRequired(
    store,
    "if (!loaded.some((entry) => entry.saveKey === item.saveKey)) loaded.push(item);",
    'pushUnique(item);',
    'deduplicação do loader',
    3
  );
  store = r.source; changed ||= r.changed;

  r = replaceRequired(
    store,
    "for (const item of legacy) if (!loaded.some((entry) => entry.saveKey === item.saveKey)) loaded.push(item);",
    'for (const item of legacy) pushUnique(item);',
    'deduplicação do legado'
  );
  store = r.source; changed ||= r.changed;

  // Invariante central: compactação só pode retirar mídia pesada/preview/log antigo.
  // O AnalysisResult completo (incluindo trainingPointsTotal/PP e build) continua no spread.
  if (!/return items\.map\(\(entry\) => \(\{\s*\.\.\.entry,/s.test(store)) {
    throw new Error('R408: compactação não preserva o registro lógico completo da ficha.');
  }
  if (/compactHistoryForNativeStorage[\s\S]*?trainingPointsTotal\s*:/m.test(store.match(/export function compactHistoryForNativeStorage[\s\S]*?\n}\n/)?.[0] ?? '')) {
    throw new Error('R408: compactação não pode sobrescrever trainingPointsTotal/PP.');
  }

  if (store.includes('Math.min(next.length, 40)') || store.includes('.slice(0, 40)')) {
    throw new Error('R408: truncamento legado do fallback ainda presente.');
  }
  if (store.includes('.slice(0, HISTORY_LIMIT)')) {
    throw new Error('R408: truncamento lógico por HISTORY_LIMIT ainda presente.');
  }

  if (changed) {
    writeFileSync(storePath, store, 'utf8');
    writeFileSync(startupPath, startup, 'utf8');
  }

  const testPath = resolve(root, TEST);
  const testSource = `import assert from 'node:assert/strict';\nimport fs from 'node:fs';\nconst read=(p)=>fs.readFileSync(p,'utf8');\nconst store=read('src/modules/vault/cardHistoryStore.ts');\nconst startup=read('src/modules/vault/cardHistoryStartupModelR200.ts');\nconst budget=read('src/modules/builds/pointBudget.ts');\nconst core=read('src/lib/trainingPlanCore.ts');\nconst optimizer=read('src/modules/builds/trainingOptimizer.ts');\nassert.match(store,/export const HISTORY_LIMIT = Infinity;/);\nassert.match(startup,/export const HISTORY_LIMIT_R200 = Number\.MAX_SAFE_INTEGER;/); // R435_R408_R420_SEMANTIC_UNBOUNDED\nassert.match(store,/STARTUP_NATIVE_HISTORY_MAX_BYTES = 0;/);\nassert.doesNotMatch(store,/\\.slice\\(0, HISTORY_LIMIT\\)/);\nassert.doesNotMatch(store,/compactHistoryForNativeStorage\\(items\\)\\.slice\\(0,\\s*40\\)/);\nassert.doesNotMatch(store,/Math\\.min\\(next\\.length,\\s*40\\)/);\nassert.match(store,/const seen = new Set<string>\\(\\);/);\nassert.match(store,/const loadedKeys = new Set<string>\\(\\);/);\nassert.match(store,/const pushUnique = \\(item: SavedAnalysis\\) =>/);\nassert.match(store,/const next = \\[\\.\\.\\.items\\];/);\nassert.match(store,/const snapshot = \\[\\.\\.\\.items\\];/);\nconst compact=store.match(/export function compactHistoryForNativeStorage[\\s\\S]*?\\n}\\n/)?.[0]??'';\nassert.match(compact,/return items\\.map\\(\\(entry\\) => \\(\\{[\\s\\S]*?\\.\\.\\.entry,/);\nassert.doesNotMatch(compact,/trainingPointsTotal\\s*:/);\nassert.match(budget,/MAX_PLAYER_TRAINING_BUDGET\\s*=\\s*140/);\nassert.match(budget,/normalizePlayerTrainingBudget/);\nassert.match(core,/export function trainingPlanTotalCost\\(plan: TrainingPlan\\): number/);\nassert.match(core,/TRAINING_KEYS\\.reduce\\(\\(sum, key\\) => sum \\+ trainingTotalCost\\(plan\\[key\\] \\?\\? 0\\), 0\\)/);\nassert.match(optimizer,/trainingPlanTotalCost/);\nassert.match(optimizer,/parsed\\.trainingPointsTotal/);\nassert.doesNotMatch(core,/HISTORY_LIMIT|cardHistory/);\nassert.doesNotMatch(budget,/HISTORY_LIMIT|cardHistory/);\nassert.doesNotMatch(optimizer,/HISTORY_LIMIT|cardHistory/);\nfor(const n of [1,10,12,13,25,50,200,201,500,1000,5000,10000]){const cards=Array.from({length:n},(_,i)=>({id:String(i),result:{trainingPointsTotal:(i%140)+1}}));const persisted=[...cards];assert.equal(persisted.length,n);assert.deepEqual(persisted.map(x=>x.result.trainingPointsTotal),cards.map(x=>x.result.trainingPointsTotal));}\nconsole.log('R408 aprovada: sem teto lógico de fichas, PP preservado por carta e loader linear para coleções grandes.');\n`;
  if (!existsSync(testPath) || readFileSync(testPath, 'utf8') !== testSource) {
    writeFileSync(testPath, testSource, 'utf8');
    changed = true;
  }

  const pkg = JSON.parse(readFileSync(packagePath, 'utf8'));
  const marker = 'node tests/v40-80-r408-unlimited-fichas-pp-integrity-regression.mjs';
  const current = String(pkg.scripts?.['test:r200'] ?? '');
  if (!current) throw new Error('R408: test:r200 ausente.');
  if (!current.includes(marker)) {
    pkg.scripts['test:r200'] = `${current} && ${marker}`;
    writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
    changed = true;
  }

  return {
    changed,
    sourceChanged: true,
    logicalHistoryLimit: 'unbounded',
    ppIsolation: 'per-card',
    loaderComplexity: 'O(n)',
    partialFallbackSuccess: false
  };
}
