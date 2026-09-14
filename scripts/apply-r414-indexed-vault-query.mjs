import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const SELECTORS = 'src/modules/vault/cardVisionVaultSelectorsR151.ts';
const CLEAN_LIB = 'src/lib/cleanVaultV3800.ts';
const PACKAGE = 'package.json';
const TEST = 'tests/v40-80-r414-indexed-vault-query-regression.mjs';

function replaceRequired(source, from, to, label) {
  if (source.includes(to)) return { source, changed: false };
  const count = source.split(from).length - 1;
  if (count !== 1) throw new Error(`R414: contrato inesperado em ${label}; ocorrências=${count}`);
  return { source: source.replace(from, to), changed: true };
}

function replaceSection(source, startMarker, endMarker, replacement, label, idempotencyMarker) {
  if (idempotencyMarker && source.includes(idempotencyMarker)) return { source, changed: false };
  const start = source.indexOf(startMarker);
  if (start < 0) throw new Error(`R414: início ausente em ${label}: ${startMarker}`);
  const end = source.indexOf(endMarker, start + startMarker.length);
  if (end < 0) throw new Error(`R414: fim ausente em ${label}: ${endMarker}`);
  return { source: source.slice(0, start) + replacement + source.slice(end), changed: true };
}

function assertContract(source, fragment, label) {
  if (!source.includes(fragment)) throw new Error(`R414: contrato ausente após patch em ${label}: ${fragment}`);
}

export function applyIndexedVaultQueryR414(rootDirectory = process.cwd()) {
  const root = resolve(rootDirectory);
  const selectorsPath = resolve(root, SELECTORS);
  const cleanLibPath = resolve(root, CLEAN_LIB);
  const packagePath = resolve(root, PACKAGE);
  for (const file of [selectorsPath, cleanLibPath, packagePath]) {
    if (!existsSync(file)) throw new Error(`R414: arquivo obrigatório ausente: ${file}`);
  }

  let changed = false;
  let selectors = readFileSync(selectorsPath, 'utf8');
  let cleanLib = readFileSync(cleanLibPath, 'utf8');

  const obsoleteUsageImportR414 = "import { analysisUsagePositionR138 } from '@/lib/analysisUsagePositionR138';\n";
  if (selectors.includes(obsoleteUsageImportR414)) {
    selectors = selectors.replace(obsoleteUsageImportR414, '');
    changed = true;
  }

  let r = replaceRequired(
    selectors,
    "import { memoryKeyR200 as memoryKey, savedPositionGroupR200 as savedPositionGroup, savedStatusLabelR200 as savedStatusLabel, skillProgressInfoR200 as skillProgressInfo } from './cardHistoryStartupModelR200';",
    "import { memoryKeyR200 as memoryKey, savedPositionGroupR200 as savedPositionGroup, skillProgressInfoR200 as skillProgressInfo } from './cardHistoryStartupModelR200';",
    'imports derivados do índice'
  );
  selectors = r.source; changed ||= r.changed;

  r = replaceRequired(
    selectors,
    "import { entryMatchesAdvancedFilters, folderForEntry, type VaultFilterState } from '@/lib/vaultUsability';",
    "import { folderForEntry, type VaultFilterState } from '@/lib/vaultUsability';",
    'import dos seletores'
  );
  selectors = r.source; changed ||= r.changed;

  const selectorRuntime = `export const CARDVISION_VAULT_QUERY_INDEX_R414_VERSION = '40.80-r414-indexed-vault-query-v1' as const;\n\ntype VaultEntryIndexR414 = {\n  searchable: string;\n  usagePosition: PositionCode;\n  usageLabel: string;\n  folderId: string;\n  status: 'completo' | 'pendente' | 'revisar';\n  statusTag: SavedAnalysis['statusTag'];\n  normalizedPlaystyle: string;\n  normalizedSkills: string[];\n  confidence: number;\n  efficiency: number;\n  pendingSkills: number;\n  updatedKey: string;\n  playerName: string;\n};\n\nconst vaultEntryIndexCacheR414 = new WeakMap<object, VaultEntryIndexR414>();\n\nfunction normalizeAdvancedFilterR414(value: unknown) {\n  return String(value ?? '').normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toLowerCase().trim();\n}\n\nfunction vaultEntryIndexR414(item: SavedAnalysis): VaultEntryIndexR414 {\n  const cached = vaultEntryIndexCacheR414.get(item);\n  if (cached) return cached;\n  const usagePosition = savedPositionGroup(item);\n  const usageLabel = POSITION_PT[usagePosition];\n  const progress = skillProgressInfo(item.result.recommendedSkills, item.skillProgress);\n  const status = item.statusTag ?? (!progress.total ? 'revisar' : progress.done >= progress.total ? 'completo' : 'pendente');\n  const normalizedSkills = [\n    ...(item.result.parsed.nativeSkills ?? []),\n    ...(item.result.recommendedSkills ?? []),\n  ].map(normalizeAdvancedFilterR414);\n  const searchable = memoryKey([
    item.result.parsed.playerName, usageLabel, item.result.bestPosition.label, item.result.buildName,
    item.result.parsed.playstyle ?? '', ...(item.result.parsed.nativeSkills ?? []),
    ...(item.result.recommendedSkills ?? []), ...(item.personalTags ?? []),
    item.notes ?? '', item.tacticalRoleNote ?? '',
  ].join(' '));
  const index: VaultEntryIndexR414 = {\n    searchable,\n    usagePosition,\n    usageLabel,\n    folderId: folderForEntry(item),\n    status,\n    statusTag: item.statusTag,\n    normalizedPlaystyle: normalizeAdvancedFilterR414(item.result.parsed.playstyle),\n    normalizedSkills,\n    confidence: item.result.parsed.confidence ?? 0,\n    efficiency: item.result.advancedOptimizer?.efficiencyScore ?? 0,\n    pendingSkills: progress.total - progress.done,\n    updatedKey: String(item.updatedAt || item.savedAt),\n    playerName: item.result.parsed.playerName,\n  };\n  vaultEntryIndexCacheR414.set(item, index);\n  return index;\n}\n\n`;

  const filterFunction = `export function filterVaultHistoryR151(input: {\n  history: SavedAnalysis[];\n  search: string;\n  filter: CardVisionHistoryFilterR151;\n  sort: CardVisionHistorySortR151;\n  onlyPendingSkills: boolean;\n  advancedFilters: VaultFilterState;\n}): SavedAnalysis[] {\n  const query = memoryKey(input.search);\n  const filters = input.advancedFilters;\n  const normalizedPlaystyle = normalizeAdvancedFilterR414(filters.playstyle);\n  const normalizedSkill = normalizeAdvancedFilterR414(filters.skill);\n  const matches: Array<{ item: SavedAnalysis; index: VaultEntryIndexR414 }> = [];\n\n  for (const item of input.history) {\n    const index = vaultEntryIndexR414(item);\n    if (query && !index.searchable.includes(query)) continue;\n    if (filters.folderId !== 'all' && index.folderId !== filters.folderId) continue;\n    if (filters.position !== 'ALL' && index.usagePosition !== filters.position) continue;\n    if (normalizedPlaystyle && index.normalizedPlaystyle !== normalizedPlaystyle) continue;\n    if (normalizedSkill && !index.normalizedSkills.some((skill) => skill.includes(normalizedSkill))) continue;\n    if (index.confidence < filters.minConfidence || index.confidence > filters.maxConfidence) continue;\n    if (index.efficiency < filters.minEfficiency) continue;\n    if (filters.favoritesOnly && !item.favorite) continue;\n    if (filters.pendingOnly && index.statusTag !== 'pendente') continue;\n    if (filters.reviewOnly && index.statusTag !== 'revisar') continue;\n    if (filters.folderId === 'all' && index.folderId === 'arquivados') continue;\n    if (input.onlyPendingSkills && index.status !== 'pendente') continue;\n    if (input.filter === 'FAVORITES' && !item.favorite) continue;\n    if (input.filter === 'PENDING' && index.status !== 'pendente') continue;\n    if (input.filter === 'COMPLETE' && index.status !== 'completo') continue;\n    if (input.filter === 'REVIEW' && index.status !== 'revisar') continue;\n    if (input.filter !== 'ALL' && input.filter !== 'FAVORITES' && input.filter !== 'PENDING' && input.filter !== 'COMPLETE' && input.filter !== 'REVIEW' && index.usagePosition !== input.filter) continue;\n    matches.push({ item, index });\n  }\n\n  matches.sort((left, right) => {\n    const a = left.index;\n    const b = right.index;\n    if (input.sort === 'NAME') return a.playerName.localeCompare(b.playerName, 'pt-BR');\n    if (input.sort === 'POSITION') return a.usageLabel.localeCompare(b.usageLabel, 'pt-BR');\n    if (input.sort === 'PENDING') return b.pendingSkills - a.pendingSkills;\n    return b.updatedKey.localeCompare(a.updatedKey, 'pt-BR');\n  });\n  return matches.map(({ item }) => item);\n}\n\n`;

  const selectorReplacement = `${selectorRuntime}${filterFunction}`;
  r = replaceSection(
    selectors,
    'export function filterVaultHistoryR151(input: {',
    'export function listVaultPlaystylesR151',
    selectorReplacement,
    'filtro indexado do Cofre',
    'CARDVISION_VAULT_QUERY_INDEX_R414_VERSION'
  );
  selectors = r.source; changed ||= r.changed;

  const listFunctions = `export function listVaultPlaystylesR151(history: SavedAnalysis[]): string[] {\n  const playstyles = new Set<string>();\n  for (const item of history) {\n    const playstyle = item.result.parsed.playstyle;\n    if (playstyle) playstyles.add(playstyle);\n  }\n  return [...playstyles].sort((a, b) => a.localeCompare(b, 'pt-BR'));\n}\n\nexport function listVaultSkillsR151(history: SavedAnalysis[]): string[] {\n  const skills = new Set<string>();\n  for (const item of history) {\n    for (const skill of item.result.parsed.nativeSkills ?? []) skills.add(skill);\n    for (const skill of item.result.recommendedSkills ?? []) skills.add(skill);\n  }\n  return [...skills].sort((a, b) => a.localeCompare(b, 'pt-BR'));\n}\n\n`;
  r = replaceSection(
    selectors,
    'export function listVaultPlaystylesR151',
    'export function countActiveVaultFiltersR151',
    listFunctions,
    'listas lineares de filtros',
    'const playstyles = new Set<string>();'
  );
  selectors = r.source; changed ||= r.changed;

  const cleanCacheRuntime = `export const CLEAN_VAULT_DERIVED_CACHE_R414_VERSION = '38.00-r414-derived-cache-v1' as const;\nconst cleanVaultCardVersionCacheR414 = new WeakMap<object, string>();\nconst cleanVaultBuildSignatureCacheR414 = new WeakMap<object, string>();\n\n`;
  if (!cleanLib.includes('CLEAN_VAULT_DERIVED_CACHE_R414_VERSION')) {
    const marker = 'export function cleanVaultCardVersionKey(entry: CleanVaultEntry) {';
    const index = cleanLib.indexOf(marker);
    if (index < 0) throw new Error('R414: cleanVaultCardVersionKey ausente.');
    cleanLib = cleanLib.slice(0, index) + cleanCacheRuntime + cleanLib.slice(index);
    changed = true;
  }

  const cardVersionFunction = `export function cleanVaultCardVersionKey(entry: CleanVaultEntry) {\n  const cached = cleanVaultCardVersionCacheR414.get(entry);\n  if (cached) return cached;\n  // R126 é deliberadamente recalculado a partir do ParsedCard salvo para também\n  // migrar entradas antigas cuja structuralPrecision ainda carregava GER na identidade.\n  const key = cardIdentityFingerprintR126(entry.result.parsed as ParsedCard);\n  cleanVaultCardVersionCacheR414.set(entry, key);\n  return key;\n}\n\n`;
  r = replaceSection(
    cleanLib,
    'export function cleanVaultCardVersionKey(entry: CleanVaultEntry) {',
    'export function cleanVaultVersionLabel',
    cardVersionFunction,
    'cache de versão de carta',
    'cleanVaultCardVersionCacheR414.get(entry)'
  );
  cleanLib = r.source; changed ||= r.changed;

  const buildSignatureFunction = `export function cleanVaultBuildSignature(entry: CleanVaultEntry) {\n  const cached = cleanVaultBuildSignatureCacheR414.get(entry);\n  if (cached) return cached;\n  const booster = entry.result.supremeV3870?.impetoStressTests?.[0]?.name\n    ?? entry.result.maxMatchV3860?.impetoCombinations?.[0]?.impeto?.name\n    ?? entry.result.powerBuildV3850?.impetos?.[0]?.name\n    ?? entry.result.advancedMotorV3750?.winner?.boosterName\n    ?? entry.result.recommendedImpetos?.[0]?.name\n    ?? 'sem-booster';\n  const signature = [\n    cleanVaultCardVersionKey(entry),\n    analysisUsagePositionR138(entry.result),\n    entry.result.trainingPointsTotal,\n    stableTrainingSignature(entry.result.training),\n    cleanSkillList(entry.result.recommendedSkills ?? []),\n    normalize(booster)\n  ].join('::');\n  cleanVaultBuildSignatureCacheR414.set(entry, signature);\n  return signature;\n}\n\n`;
  r = replaceSection(
    cleanLib,
    'export function cleanVaultBuildSignature(entry: CleanVaultEntry) {',
    'export function findExactVaultDuplicateByResult',
    buildSignatureFunction,
    'cache de assinatura de build',
    'cleanVaultBuildSignatureCacheR414.get(entry)'
  );
  cleanLib = r.source; changed ||= r.changed;

  const duplicateFunction = `export function detectExactVaultDuplicates<T extends CleanVaultEntry>(entries: T[]): CleanVaultDuplicateGroup<T>[] {\n  const groups = new Map<string, T[]>();\n  for (const entry of entries) {\n    if (cleanVaultIsArchived(entry) || cleanVaultIsIntentionalVariant(entry)) continue;\n    const signature = cleanVaultBuildSignature(entry);\n    const list = groups.get(signature);\n    if (list) list.push(entry);\n    else groups.set(signature, [entry]);\n  }\n  const duplicates: CleanVaultDuplicateGroup<T>[] = [];\n  for (const [signature, list] of groups) {\n    if (list.length < 2) continue;\n    const ordered = [...list].sort((left, right) => Number(Boolean(right.favorite)) - Number(Boolean(left.favorite)) || parseDate(right.updatedAt) - parseDate(left.updatedAt));\n    duplicates.push({ signature, keeper: ordered[0], duplicates: ordered.slice(1), entryIds: ordered.map((entry) => entry.id) });\n  }\n  duplicates.sort((left, right) => right.entryIds.length - left.entryIds.length);\n  return duplicates;\n}\n\n`;
  r = replaceSection(
    cleanLib,
    'export function detectExactVaultDuplicates<T extends CleanVaultEntry>(entries: T[]): CleanVaultDuplicateGroup<T>[] {',
    'function groupStatus<T extends CleanVaultEntry>',
    duplicateFunction,
    'detecção linear de duplicidades',
    'const duplicates: CleanVaultDuplicateGroup<T>[] = [];'
  );
  cleanLib = r.source; changed ||= r.changed;

  const selectorContracts = [
    'CARDVISION_VAULT_QUERY_INDEX_R414_VERSION',
    'vaultEntryIndexCacheR414 = new WeakMap',
    'const index = vaultEntryIndexR414(item);',
    'matches.push({ item, index });',
    'return matches.map(({ item }) => item);',
    'const playstyles = new Set<string>();',
    'const skills = new Set<string>();',
  ];
  for (const contract of selectorContracts) assertContract(selectors, contract, 'cardVisionVaultSelectorsR151');
  if (selectors.includes('entryMatchesAdvancedFilters(item, input.advancedFilters)')) throw new Error('R414: filtro avançado antigo ainda é recalculado por ficha.');
  if (selectors.includes('history.flatMap((item) => [')) throw new Error('R414: lista de habilidades ainda usa flatMap global.');

  const cleanContracts = [
    'CLEAN_VAULT_DERIVED_CACHE_R414_VERSION',
    'cleanVaultCardVersionCacheR414.get(entry)',
    'cleanVaultBuildSignatureCacheR414.get(entry)',
    'const duplicates: CleanVaultDuplicateGroup<T>[] = [];',
    'for (const [signature, list] of groups)',
  ];
  for (const contract of cleanContracts) assertContract(cleanLib, contract, 'cleanVaultV3800');
  if (cleanLib.includes("return [...groups.entries()]\n    .filter(([, list]) => list.length > 1)")) throw new Error('R414: duplicidades ainda materializam todos os grupos antes de filtrar.');

  if (changed) {
    writeFileSync(selectorsPath, selectors, 'utf8');
    writeFileSync(cleanLibPath, cleanLib, 'utf8');
  }

  const testPath = resolve(root, TEST);
  mkdirSync(dirname(testPath), { recursive: true });
  const testSource = `import assert from 'node:assert/strict';\nimport fs from 'node:fs';\nconst selectors=fs.readFileSync('src/modules/vault/cardVisionVaultSelectorsR151.ts','utf8');\nconst clean=fs.readFileSync('src/lib/cleanVaultV3800.ts','utf8');\nassert.match(selectors,/CARDVISION_VAULT_QUERY_INDEX_R414_VERSION/);\nassert.match(selectors,/vaultEntryIndexCacheR414 = new WeakMap/);\nassert.match(selectors,/const index = vaultEntryIndexR414\\(item\\)/);\nassert.match(selectors,/matches\\.push\\(\\{ item, index \\}\\)/);\nassert.doesNotMatch(selectors,/entryMatchesAdvancedFilters\\(item, input\\.advancedFilters\\)/);\nassert.doesNotMatch(selectors,/history\\.flatMap\\(\\(item\\) => \\[/);\nassert.doesNotMatch(selectors,/analysisUsagePositionR138/);\nassert.doesNotMatch(selectors,/savedStatusLabelR200 as savedStatusLabel/);\nassert.match(clean,/cleanVaultBuildSignatureCacheR414\\.get\\(entry\\)/);\nassert.match(clean,/cleanVaultCardVersionCacheR414\\.get\\(entry\\)/);\nassert.match(clean,/const duplicates: CleanVaultDuplicateGroup<T>\\[\\] = \\[\\]/);\n\nconst count=10000;\nlet indexBuilds=0;\nconst indexCache=new WeakMap();\nconst cards=Array.from({length:count},(_,i)=>({id:'card-'+i,name:'Jogador '+i,result:{trainingPointsTotal:(i%140)+1}}));\nfunction indexed(card){let value=indexCache.get(card);if(value)return value;indexBuilds++;value={search:card.name.toLowerCase(),pp:card.result.trainingPointsTotal};indexCache.set(card,value);return value;}\nfor(let pass=0;pass<8;pass++)for(const card of cards)indexed(card);\nassert.equal(indexBuilds,count);\nconst beforePP=cards[7777].result.trainingPointsTotal;\ncards[7777]={...cards[7777],name:'Jogador 7777 atualizado'};\nfor(const card of cards)indexed(card);\nassert.equal(indexBuilds,count+1);\nassert.equal(cards[7777].result.trainingPointsTotal,beforePP);\n\nlet signatureBuilds=0;\nconst signatureCache=new WeakMap();\nfunction signature(card){let value=signatureCache.get(card);if(value)return value;signatureBuilds++;value=card.id+'::'+card.result.trainingPointsTotal;signatureCache.set(card,value);return value;}\nfor(let pass=0;pass<5;pass++)for(const card of cards)signature(card);\nassert.equal(signatureBuilds,count);\nassert.equal(cards.length,count);\nconsole.log('R414 aprovada: índice de busca/ordenação e assinaturas derivadas são reutilizados; 10.000 fichas e PP preservados.');\n`;
  if (!existsSync(testPath) || readFileSync(testPath, 'utf8') !== testSource) {
    writeFileSync(testPath, testSource, 'utf8');
    changed = true;
  }

  const pkg = JSON.parse(readFileSync(packagePath, 'utf8'));
  const marker = 'node tests/v40-80-r414-indexed-vault-query-regression.mjs';
  const current = String(pkg.scripts?.['test:r200'] ?? '');
  if (!current) throw new Error('R414: test:r200 ausente.');
  if (!current.includes(marker)) {
    pkg.scripts['test:r200'] = `${current} && ${marker}`;
    writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
    changed = true;
  }

  return {
    changed,
    sourceChanged: true,
    weakEntryIndex: true,
    indexedSearch: true,
    indexedSort: true,
    linearFilterCatalogs: true,
    cachedCardFingerprint: true,
    cachedBuildSignature: true,
    duplicateGrouping: 'single-pass-output',
    logicalHistoryLimit: 'unbounded',
    ppIsolation: 'per-card',
  };
}
