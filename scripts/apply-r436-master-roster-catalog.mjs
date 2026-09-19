import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const R436_MASTER_ROSTER_CATALOG_VERSION = '40.80-r436-master-roster-catalog-v1+r445-forward-idempotence';

const FILES = {
  engine: 'src/modules/squad-mapping/squadMappingEngine.ts',
  center: 'src/modules/squad-mapping/SquadMappingCenter.tsx',
  storage: 'src/modules/squad-mapping/squadMappingStorage.ts',
  app: 'src/components/CardVisionApp.tsx',
  nav: 'src/lib/appNavigationR127.ts',
  helper: 'src/modules/squad-mapping/masterRosterCatalogR436.ts',
  runtimeTest: 'tests/v40-80-r436-master-roster-catalog-runtime-regression.ts',
  integrationTest: 'tests/v40-80-r436-master-roster-catalog-integration-regression.mjs',
  forwardRegressionTest: 'tests/v40-80-r445-r436-forward-idempotence-regression.mjs',
  package: 'package.json'
};

function readRequired(root, relative) {
  const file = path.resolve(root, relative);
  if (!fs.existsSync(file)) throw new Error(`R436: arquivo obrigatório ausente: ${relative}`);
  return { file, source: fs.readFileSync(file, 'utf8') };
}

function replaceOnceRequired(source, from, to, label) {
  if (source.includes(to)) return { source, changed: false };
  const count = source.split(from).length - 1;
  if (count !== 1) throw new Error(`R436: contrato inesperado em ${label}; ocorrências=${count}`);
  return { source: source.replace(from, to), changed: true };
}

function writeIfChanged(file, before, after) {
  if (before === after) return false;
  fs.writeFileSync(file, after, 'utf8');
  return true;
}

function hasForwardCompatibleCenterR445(source) {
  return Boolean(
    source.includes("masterRosterCardReadinessR436") &&
    source.includes("masterRosterSearchTextR436") &&
    source.includes("onGenerateFicha?: (player: SquadMappingPlayer) => void;") &&
    /export function SquadMappingCenter\(\{[^}]*\bonGenerateFicha\b[^}]*\}: Props\)/s.test(source) &&
    source.includes("const selected = Array.from(files);") &&
    !source.includes("Array.from(files).slice(0, 120)") &&
    source.includes("offensivePlaystyle:") &&
    source.includes("defensivePlaystyle:") &&
    source.includes("trainingPointsTotal:") &&
    source.includes("Gerar ficha sem OCR")
  );
}

function hasForwardCompatibleAppR445(source) {
  return Boolean(
    source.includes("generateFichaFromMasterRosterR436") &&
    source.includes("onGenerateFicha={(player) => void generateFichaFromMasterRosterR436(player)}") &&
    source.includes("openMainSection('resultado')") &&
    source.includes("SquadMappingPlayer")
  );
}

function patchEngine(source) {
  let next = source;
  let r = replaceOnceRequired(
    next,
    "import { cardIdentityFingerprintR126, playerIdentityKeyFromNameR126 } from '@/lib/cardIdentityFingerprintR126';",
    "import { cardIdentityFingerprintR126, playerIdentityKeyFromNameR126 } from '@/lib/cardIdentityFingerprintR126';\nimport { shouldMergeMasterRosterCardsR436 } from './masterRosterCatalogR436';",
    'import de identidade do catálogo mestre'
  ); next = r.source;
  r = replaceOnceRequired(
    next,
    "  playstyle: string;\n  overall: number | null;",
    "  playstyle: string;\n  offensivePlaystyle?: string | null;\n  defensivePlaystyle?: string | null;\n  trainingPointsTotal?: number | null;\n  overall: number | null;",
    'campos persistentes de estilo/PP'
  ); next = r.source;
  const oldMerge = `  const duplicate = existing.find((player) => {\n    if (incoming.sourceHash && player.sourceHash && player.sourceHash === incoming.sourceHash) return true;\n    if (incoming.identityStatus === 'canonical' && player.identityStatus === 'canonical' && incoming.cardFingerprint === player.cardFingerprint) return true;\n    if (incoming.cardFingerprint && player.cardFingerprint && incoming.cardFingerprint === player.cardFingerprint) return true;\n    return false;\n  });`;
  r = replaceOnceRequired(
    next,
    oldMerge,
    "  const duplicate = existing.find((player) => shouldMergeMasterRosterCardsR436(player, incoming));",
    'merge de variantes do mesmo atleta'
  ); next = r.source;
  return next;
}

function patchStorage(source) {
  let next = source;
  const r = replaceOnceRequired(
    next,
    "    playstyle: String(raw.playstyle ?? '').trim().slice(0, 80),\n    overall: finiteNumber(raw.overall, 1, 120),",
    "    playstyle: String(raw.playstyle ?? '').trim().slice(0, 80),\n    offensivePlaystyle: raw.offensivePlaystyle ? String(raw.offensivePlaystyle).trim().slice(0, 80) : null,\n    defensivePlaystyle: raw.defensivePlaystyle ? String(raw.defensivePlaystyle).trim().slice(0, 80) : null,\n    trainingPointsTotal: finiteNumber(raw.trainingPointsTotal, 20, 140),\n    overall: finiteNumber(raw.overall, 1, 120),",
    'persistência de estilos e PP'
  );
  return r.source;
}

function patchCenter(source) {
  if (hasForwardCompatibleCenterR445(source)) return source;
  let next = source;
  let r = replaceOnceRequired(
    next,
    "import { findBestHistoryLinkR127 } from './squadMappingHistoryLinkR127';",
    "import { findBestHistoryLinkR127 } from './squadMappingHistoryLinkR127';\nimport { masterRosterCardReadinessR436, masterRosterSearchTextR436 } from './masterRosterCatalogR436';",
    'helper do banco mestre'
  ); next = r.source;
  r = replaceOnceRequired(
    next,
    "type Props = {\n  history: Array<{ id: string; result: AnalysisResult }>;\n  onOpenFicha?: (historyId: string) => void;\n};",
    "type Props = {\n  history: Array<{ id: string; result: AnalysisResult }>;\n  onOpenFicha?: (historyId: string) => void;\n  onGenerateFicha?: (player: SquadMappingPlayer) => void;\n};",
    'callback de geração direta'
  ); next = r.source;
  r = replaceOnceRequired(
    next,
    "export function SquadMappingCenter({ history, onOpenFicha }: Props) {",
    "export function SquadMappingCenter({ history, onOpenFicha, onGenerateFicha }: Props) {",
    'assinatura do centro de elenco'
  ); next = r.source;
  r = replaceOnceRequired(
    next,
    "  const trainingSuggestions = useMemo(() => editingPlayer ? suggestedTrainingPositions(editingPlayer, ranking) : [], [editingPlayer, ranking]);\n  const filteredPlayers = useMemo(() => {\n    const term = search.trim().toLocaleLowerCase('pt-BR');\n    return state.players.filter((player) => {\n      if (positionFilter !== 'ALL' && ![player.mainPosition, ...player.positions, ...player.trainedPositions].includes(positionFilter)) return false;\n      if (!term) return true;\n      return `${player.name} ${player.playstyle} ${player.cardLabel}`.toLocaleLowerCase('pt-BR').includes(term);\n    });\n  }, [state.players, search, positionFilter]);",
    "  const trainingSuggestions = useMemo(() => editingPlayer ? suggestedTrainingPositions(editingPlayer, ranking) : [], [editingPlayer, ranking]);\n  const editingReadiness = useMemo(() => editingPlayer ? masterRosterCardReadinessR436(editingPlayer) : null, [editingPlayer]);\n  const filteredPlayers = useMemo(() => {\n    const term = normalizedLabel(search);\n    return state.players.filter((player) => {\n      if (positionFilter !== 'ALL' && ![player.mainPosition, ...player.positions, ...player.trainedPositions].includes(positionFilter)) return false;\n      if (!term) return true;\n      return masterRosterSearchTextR436(player).includes(term);\n    });\n  }, [state.players, search, positionFilter]);",
    'busca canônica e readiness'
  ); next = r.source;
  r = replaceOnceRequired(
    next,
    "    const selected = Array.from(files).slice(0, 120);",
    "    const selected = Array.from(files);",
    'importação sem teto artificial de 120 imagens'
  ); next = r.source;
  r = replaceOnceRequired(
    next,
    "      playstyle,\n      overall,",
    "      playstyle,\n      offensivePlaystyle: detailed.identity.offensivePlaystyle?.value?.trim() || parsed?.offensivePlaystyle || parsed?.playstyle || playstyle || null,\n      defensivePlaystyle: detailed.identity.defensivePlaystyle?.value?.trim() || parsed?.defensivePlaystyle || null,\n      trainingPointsTotal: typeof parsed?.trainingPointsTotal === 'number' ? parsed.trainingPointsTotal : null,\n      overall,",
    'enriquecimento de estilos/PP no OCR em lote'
  ); next = r.source;
  const editorAnchor = `{editingPlayer && <aside className="mapping-editor luxury-panel"><header><div><p className="kicker">Revisar jogador</p><h2>{editingPlayer.name}</h2></div><button type="button" onClick={() => setEditingId(null)} aria-label="Fechar"><X size={18}/></button></header><label><span>Nome</span>`;
  const editorReplacement = "{editingPlayer && <aside className=\"mapping-editor luxury-panel\"><header><div><p className=\"kicker\">Revisar jogador</p><h2>{editingPlayer.name}</h2></div><button type=\"button\" onClick={() => setEditingId(null)} aria-label=\"Fechar\"><X size={18}/></button></header>{editingReadiness && <div className=\"mapping-strengths\"><span className={editingReadiness.canGenerate ? 'linked' : ''}><Sparkles size={14}/>{editingReadiness.canGenerate ? 'Ficha direta pronta • ' + editingReadiness.trainingPointsTotal + ' PP' : 'Dados pendentes: ' + editingReadiness.missing.join(', ')}</span></div>}{onGenerateFicha && <button type=\"button\" className=\"elite-button\" disabled={!editingReadiness?.canGenerate} onClick={() => onGenerateFicha(editingPlayer)}><Sparkles size={17}/> Gerar ficha sem OCR</button>}<label><span>Nome</span>";
  r = replaceOnceRequired(next, editorAnchor, editorReplacement, 'ação Gerar ficha sem OCR'); next = r.source;
  return next;
}

function patchApp(source) {
  if (hasForwardCompatibleAppR445(source)) return source;
  let next = source;
  let r = replaceOnceRequired(
    next,
    "import type { CardCropResult } from '@/modules/card-reader/cardArtCrop';",
    "import type { CardCropResult } from '@/modules/card-reader/cardArtCrop';\nimport type { SquadMappingPlayer } from '@/modules/squad-mapping/squadMappingEngine';",
    'tipo de jogador do banco mestre'
  ); next = r.source;
  const anchor = "  async function startManualPreciseMode() {";
  const block = `  async function generateFichaFromMasterRosterR436(player: SquadMappingPlayer) {\n    const { buildMasterRosterRawTextR436, masterRosterCardReadinessR436 } = await import('@/modules/squad-mapping/masterRosterCatalogR436');\n    const readiness = masterRosterCardReadinessR436(player);\n    if (!readiness.canGenerate || readiness.trainingPointsTotal === null) {\n      setStatus(\`Esta carta ainda não pode gerar ficha sem OCR. Falta: \${readiness.missing.join(', ')}.\`);\n      return;\n    }\n    const source = buildMasterRosterRawTextR436(player);\n    const { createProductionAnalysisR138 } = await import('@/modules/analysis/productionOrchestratorR138');\n    const nextResult = createProductionAnalysisR138({\n      rawText: source,\n      objective: 'COMPETITIVE',\n      targetPosition: player.mainPosition,\n      imageFileName: player.sourceFileName || \`catalogo-r436-\${player.id}\`,\n      tacticalProfile\n    });\n    const attributes = Object.fromEntries(Object.entries(player.attributes).flatMap(([key, value]) =>\n      typeof value === 'number' && Number.isFinite(value) ? [[key, String(value)]] : []\n    )) as ManualFields['attributes'];\n    setSelectedFile(null);\n    setPreview(player.portrait || null);\n    setPlayerCardImage(player.portrait || null);\n    setCardCropResult(null);\n    setCardCropAdjustOpen(false);\n    setFileName(player.sourceFileName || \`catalogo-r436-\${player.id}\`);\n    setRawText(source);\n    setOcrDone(true);\n    setPremiumReadings([]);\n    setTotalReadingSession(null);\n    setSinglePrintSession(null);\n    setPreFinalConfirmation(null);\n    setPreFinalGenerateRequested(false);\n    setManualMode(true);\n    setManualFields({\n      playerName: player.name,\n      level: player.level ? String(player.level) : '',\n      trainingPointsTotal: String(readiness.trainingPointsTotal),\n      attributes,\n      nativeSkills: [...player.skills]\n    });\n    setCardPositionOverride(player.mainPosition);\n    setPlaystyleOverride(player.offensivePlaystyle || player.playstyle || 'AUTO');\n    setDefensivePlaystyleOverride(player.defensivePlaystyle || 'AUTO');\n    setResult(nextResult);\n    setDraftResult(nextResult);\n    setStatus(\`Ficha de \${player.name} gerada diretamente do Meu Elenco, sem nova leitura OCR.\`);\n    openMainSection('resultado');\n  }\n\n` + anchor;
  r = replaceOnceRequired(next, anchor, block, 'geração direta pelo Motor Mestre'); next = r.source;
  r = replaceOnceRequired(
    next,
    "            onOpenFicha={(historyId) => openIntegratedPlayer(historyId, 'result')}\n          />",
    "            onOpenFicha={(historyId) => openIntegratedPlayer(historyId, 'result')}\n            onGenerateFicha={(player) => void generateFichaFromMasterRosterR436(player)}\n          />",
    'ligação Meu Elenco -> ficha'
  ); next = r.source;
  return next;
}

function patchNavigation(source) {
  const r = replaceOnceRequired(
    source,
    "    { id: 'mapeamento', label: 'Mapeamento', hint: 'Melhor time e reservas', icon: 'team' },",
    "    { id: 'mapeamento', label: 'Meu Elenco', hint: 'Banco mestre, fichas e formações', icon: 'team' },",
    'nome da navegação Meu Elenco'
  );
  return r.source;
}

function patchPackage(source) {
  const pkg = JSON.parse(source);
  const runtime = 'node -r ./tests/_ts-require.cjs tests/v40-80-r436-master-roster-catalog-runtime-regression.ts';
  const integration = 'node tests/v40-80-r436-master-roster-catalog-integration-regression.mjs';
  const forwardRegression = 'node tests/v40-80-r445-r436-forward-idempotence-regression.mjs';
  const current = String(pkg.scripts?.['test:r200'] ?? '');
  if (!current) throw new Error('R436: script test:r200 ausente.');
  let next = current;
  if (!next.includes(runtime)) next += ` && ${runtime}`;
  if (!next.includes(integration)) next += ` && ${integration}`;
  if (!next.includes(forwardRegression)) next += ` && ${forwardRegression}`;
  pkg.scripts['test:r200'] = next;
  return JSON.stringify(pkg, null, 2) + '\n';
}

function validate(root) {
  for (const relative of Object.values(FILES)) {
    if (!fs.existsSync(path.resolve(root, relative))) throw new Error(`R436: validação encontrou arquivo ausente: ${relative}`);
  }
  const engine = fs.readFileSync(path.resolve(root, FILES.engine), 'utf8');
  const center = fs.readFileSync(path.resolve(root, FILES.center), 'utf8');
  const storage = fs.readFileSync(path.resolve(root, FILES.storage), 'utf8');
  const app = fs.readFileSync(path.resolve(root, FILES.app), 'utf8');
  const nav = fs.readFileSync(path.resolve(root, FILES.nav), 'utf8');
  const pkg = fs.readFileSync(path.resolve(root, FILES.package), 'utf8');
  const checks = [
    [engine.includes('shouldMergeMasterRosterCardsR436'), 'política de variantes'],
    [engine.includes('offensivePlaystyle?: string | null'), 'estilo ofensivo persistente'],
    [center.includes('const selected = Array.from(files);'), 'importação sem teto 120'],
    [!center.includes('Array.from(files).slice(0, 120)'), 'remoção do teto 120'],
    [center.includes('Gerar ficha sem OCR'), 'ação de ficha direta'],
    [center.includes('masterRosterSearchTextR436'), 'busca canônica'],
    [storage.includes('trainingPointsTotal: finiteNumber(raw.trainingPointsTotal, 20, 140)'), 'PP persistente'],
    [app.includes('generateFichaFromMasterRosterR436'), 'ponte catálogo -> Motor Mestre'],
    [app.includes("openMainSection('resultado')"), 'abertura do resultado'],
    [nav.includes("id: 'mapeamento', label: 'Meu Elenco'"), 'navegação Meu Elenco'],
    [pkg.includes('v40-80-r436-master-roster-catalog-runtime-regression.ts'), 'runtime regression no CI'],
    [pkg.includes('v40-80-r436-master-roster-catalog-integration-regression.mjs'), 'integration regression no CI'],
    [pkg.includes('v40-80-r445-r436-forward-idempotence-regression.mjs'), 'forward idempotence R445 no CI']
  ];
  const missing = checks.filter(([ok]) => !ok).map(([, label]) => label);
  if (missing.length) throw new Error(`R436: validação final incompleta: ${missing.join(', ')}`);
}

export function applyR436MasterRosterCatalog(rootDirectory = process.cwd()) {
  const root = path.resolve(rootDirectory);
  const patchers = [
    [FILES.engine, patchEngine],
    [FILES.center, patchCenter],
    [FILES.storage, patchStorage],
    [FILES.app, patchApp],
    [FILES.nav, patchNavigation],
    [FILES.package, patchPackage]
  ];
  const patched = [];
  for (const [relative, patcher] of patchers) {
    const { file, source } = readRequired(root, relative);
    const next = patcher(source);
    if (writeIfChanged(file, source, next)) patched.push(relative);
  }
  validate(root);
  return { changed: patched.length > 0, patched, version: R436_MASTER_ROSTER_CATALOG_VERSION };
}

const invoked = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : '';
if (invoked === import.meta.url) {
  const result = applyR436MasterRosterCatalog(process.cwd());
  console.log(result.changed
    ? `R436: Meu Elenco/Banco Mestre convergiu ${result.patched.length} arquivo(s).`
    : 'R436: Meu Elenco/Banco Mestre já estava convergido.');
}
