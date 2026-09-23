import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const R438_MASTER_CARD_CATALOG_VERSION = '40.80-r438-master-card-catalog-v1';

const FILES = {
  center: 'src/modules/squad-mapping/SquadMappingCenter.tsx',
  app: 'src/components/CardVisionApp.tsx',
  package: 'package.json',
  catalog: 'src/modules/card-catalog/masterCardCatalogR438.ts',
  search: 'src/modules/card-catalog/masterCardSearchIndexR438.ts',
  storage: 'src/modules/card-catalog/masterCardCatalogStorageR438.ts',
  owned: 'src/modules/card-catalog/ownedCardCollectionR438.ts',
  migration: 'src/modules/card-catalog/masterCardMigrationR438.ts',
  projection: 'src/modules/card-catalog/masterCardToSquadMappingR438.ts',
  analysis: 'src/modules/card-catalog/masterCardAnalysisRequestR438.ts',
  runtimeTest: 'tests/v40-80-r438-master-card-catalog-runtime-regression.ts',
  storageTest: 'tests/v40-80-r438-master-card-storage-regression.mjs',
  migrationTest: 'tests/v40-80-r438-master-card-migration-regression.ts',
  analysisTest: 'tests/v40-80-r438-master-card-analysis-regression.mjs',
  integrationTest: 'tests/v40-80-r438-master-card-integration-regression.mjs'
};

function readRequired(root, relative) {
  const file = path.resolve(root, relative);
  if (!fs.existsSync(file)) throw new Error(`R438: arquivo obrigatório ausente: ${relative}`);
  return { file, source: fs.readFileSync(file, 'utf8') };
}
function replaceOnceRequired(source, from, to, label) {
  if (source.includes(to)) return { source, changed: false };
  const count = source.split(from).length - 1;
  if (count !== 1) throw new Error(`R438: contrato inesperado em ${label}; ocorrências=${count}`);
  return { source: source.replace(from, to), changed: true };
}
function writeIfChanged(file, before, after) {
  if (before === after) return false;
  fs.writeFileSync(file, after, 'utf8');
  return true;
}

function patchCenter(source) {
  if (source.includes("label: 'Catálogo Geral'") && source.includes('knownCatalogCardActionR442') && source.includes('resolveMasterCardObservationR440')) return source;
  let next = source;
  let r = replaceOnceRequired(
    next,
    "import { batchRosterImportSummaryR437, createBatchRosterImportStatsR437, findImportedRosterCardBySourceHashR437, pauseBatchRosterImportR437, recordBatchRosterImportOutcomeR437 } from './batchRosterImportR437';",
    "import { batchRosterImportSummaryR437, createBatchRosterImportStatsR437, findImportedRosterCardBySourceHashR437, pauseBatchRosterImportR437, recordBatchRosterImportOutcomeR437 } from './batchRosterImportR437';\nimport type { MasterCardCatalogEntryR438 } from '@/modules/card-catalog/masterCardCatalogR438';\nimport { searchMasterCardsR438 } from '@/modules/card-catalog/masterCardSearchIndexR438';\nimport { migrateSquadMappingToMasterCatalogR438, upsertOwnedMasterCardFromSquadMappingR438 } from '@/modules/card-catalog/masterCardMigrationR438';\nimport { masterCardToSquadMappingPlayerR438 } from '@/modules/card-catalog/masterCardToSquadMappingR438';",
    'imports do Catálogo Mestre'
  ); next = r.source;

  r = replaceOnceRequired(
    next,
    "type MappingTab = 'visao' | 'jogadores' | 'formacoes' | 'escalacao' | 'testes' | 'backup';",
    "type MappingTab = 'visao' | 'jogadores' | 'catalogo' | 'revisar' | 'formacoes' | 'escalacao' | 'testes' | 'backup';",
    'abas do Catálogo Mestre'
  ); next = r.source;

  r = replaceOnceRequired(
    next,
    "  onOpenFicha?: (historyId: string) => void;\n  onGenerateFicha?: (player: SquadMappingPlayer) => void;",
    "  onOpenFicha?: (historyId: string) => void;\n  onGenerateFicha?: (player: SquadMappingPlayer) => void;\n  onGenerateMasterCard?: (card: MasterCardCatalogEntryR438) => void;",
    'callback de geração R438'
  ); next = r.source;

  r = replaceOnceRequired(
    next,
    "export function SquadMappingCenter({ history, onOpenFicha, onGenerateFicha }: Props) {",
    "export function SquadMappingCenter({ history, onOpenFicha, onGenerateFicha, onGenerateMasterCard }: Props) {",
    'assinatura R438'
  ); next = r.source;

  r = replaceOnceRequired(
    next,
    "  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, fileName: '' });\n  const importCancelRequestedRef = useRef(false);\n  const [search, setSearch] = useState('');",
    "  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, fileName: '' });\n  const importCancelRequestedRef = useRef(false);\n  const [masterCatalogR438, setMasterCatalogR438] = useState<MasterCardCatalogEntryR438[]>([]);\n  const [ownedCatalogIdsR438, setOwnedCatalogIdsR438] = useState<Set<string>>(() => new Set());\n  const [search, setSearch] = useState('');",
    'estado local do Catálogo Mestre'
  ); next = r.source;

  const oldHydrate = `    void loadSquadMappingState().then((loaded) => {\n      if (!active) return;\n      setState(loaded);\n      setHydrated(true);\n      setMessage(loaded.players.length ? \`${'${loaded.players.length}'} jogador(es) recuperado(s) da memória do app.\` : 'Mapeamento novo. Adicione os prints dos jogadores.');\n    }).catch(() => {`;
  const newHydrate = `    void loadSquadMappingState().then((loaded) => {
      if (!active) return;
      setState(loaded);
      setHydrated(true);
      setMessage(loaded.players.length ? \`${'${loaded.players.length}'} jogador(es) recuperado(s). Catálogo Mestre sincronizando em segundo plano.\` : 'Catálogo Mestre iniciado. Adicione seus jogadores.');
      void migrateSquadMappingToMasterCatalogR438(loaded.players).then((migration) => {
        if (!active) return;
        const ownedIds = new Set(migration.owned.map((item) => item.catalogCardId));
        const projectedPlayers = loaded.players.map((player) => {
          const card = migration.catalog.find((item) => (item.sourceHash && item.sourceHash === player.sourceHash) || (item.cardFingerprint.startsWith('card-r126-') && item.cardFingerprint === player.cardFingerprint));
          return card ? masterCardToSquadMappingPlayerR438(card, player) : player;
        });
        setMasterCatalogR438(migration.catalog);
        setOwnedCatalogIdsR438(ownedIds);
        setState({ ...loaded, players: projectedPlayers });
        setMessage(\`${'${migration.catalog.length}'} carta(s) disponíveis no Catálogo Mestre • ${'${ownedIds.size}'} no Meu Elenco.\`);
      }).catch(() => {
        if (active) setMessage('Meu Elenco carregado. O Catálogo Mestre será sincronizado novamente sem bloquear o uso do app.');
      });
    }).catch(() => {`;
  r = replaceOnceRequired(next, oldHydrate, newHydrate, 'migração inicial do catálogo'); next = r.source;

  r = replaceOnceRequired(
    next,
    "  const trainingSuggestions = useMemo(() => editingPlayer ? suggestedTrainingPositions(editingPlayer, ranking) : [], [editingPlayer, ranking]);\n  const editingReadiness = useMemo(() => editingPlayer ? masterRosterCardReadinessR436(editingPlayer) : null, [editingPlayer]);",
    "  const trainingSuggestions = useMemo(() => editingPlayer ? suggestedTrainingPositions(editingPlayer, ranking) : [], [editingPlayer, ranking]);\n  const editingReadiness = useMemo(() => editingPlayer ? masterRosterCardReadinessR436(editingPlayer) : null, [editingPlayer]);\n  const catalogSearchResultsR438 = useMemo(() => searchMasterCardsR438(masterCatalogR438, search), [masterCatalogR438, search]);\n  const ownedCatalogEntriesR438 = useMemo(() => catalogSearchResultsR438.filter((card) => ownedCatalogIdsR438.has(card.catalogCardId)), [catalogSearchResultsR438, ownedCatalogIdsR438]);\n  const reviewCatalogEntriesR438 = useMemo(() => catalogSearchResultsR438.filter((card) => card.completeness !== 'COMPLETE'), [catalogSearchResultsR438]);",
    'visões derivadas do catálogo'
  ); next = r.source;

  r = replaceOnceRequired(
    next,
    "        const merged = mergeMappingPlayer(nextPlayers, incoming);\n        nextPlayers = merged.players;\n        setState((current) => ({ ...current, players: nextPlayers, updatedAt: new Date().toISOString() }));\n        stats = recordBatchRosterImportOutcomeR437(stats, merged.action);",
    "        const merged = mergeMappingPlayer(nextPlayers, incoming);\n        nextPlayers = merged.players;\n        const catalogEntryR438 = await upsertOwnedMasterCardFromSquadMappingR438(merged.player);\n        setMasterCatalogR438((current) => [catalogEntryR438, ...current.filter((item) => item.catalogCardId !== catalogEntryR438.catalogCardId)]);\n        setOwnedCatalogIdsR438((current) => new Set([...current, catalogEntryR438.catalogCardId]));\n        setState((current) => ({ ...current, players: nextPlayers, updatedAt: new Date().toISOString() }));\n        stats = recordBatchRosterImportOutcomeR437(stats, merged.action);",
    'OCR em lote alimenta Catálogo Mestre'
  ); next = r.source;

  const oldTabs = `  const tabs: Array<{ id: MappingTab; label: string; count?: number }> = [\n    { id: 'visao', label: 'Visão geral' }, { id: 'jogadores', label: 'Jogadores', count: metrics.players }, { id: 'formacoes', label: 'Formações', count: metrics.formations }, { id: 'escalacao', label: 'Escalação' }, { id: 'testes', label: 'Testes', count: metrics.activeTrials }, { id: 'backup', label: 'Backup' }\n  ];`;
  const newTabs = `  const tabs: Array<{ id: MappingTab; label: string; count?: number }> = [\n    { id: 'visao', label: 'Visão geral' },\n    { id: 'jogadores', label: 'Meu Elenco', count: ownedCatalogEntriesR438.length || metrics.players },\n    { id: 'catalogo', label: 'Catálogo Geral', count: masterCatalogR438.length },\n    { id: 'revisar', label: 'Revisar', count: reviewCatalogEntriesR438.length },\n    { id: 'formacoes', label: 'Formações', count: metrics.formations }, { id: 'escalacao', label: 'Escalação' }, { id: 'testes', label: 'Testes', count: metrics.activeTrials }, { id: 'backup', label: 'Backup' }\n  ];`;
  r = replaceOnceRequired(next, oldTabs, newTabs, 'abas visuais R438'); next = r.source;

  const playerAnchor = `      {tab === 'jogadores' && <section className="mapping-players-layout">`;
  const catalogBlocks = `      {tab === 'catalogo' && <section className="mapping-players-layout">\n        <article className="mapping-player-library luxury-panel"><header className="mapping-section-heading"><div><p className="kicker">Catálogo Mestre</p><h2>Catálogo Geral • {catalogSearchResultsR438.length} carta(s)</h2></div></header><div className="mapping-filter-row"><label><Search size={16}/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pesquisar jogador, versão, estilo ou habilidade"/></label></div><div className="mapping-player-grid">\n          {catalogSearchResultsR438.map((card) => <article key={card.catalogCardId} className={\`mapping-player-card ${'${card.completeness === \'COMPLETE\' ? \'full-profile\' : \'\'}'}\`}><div className="mapping-player-art"><span>{initials(card.playerName)}</span><b>{card.mainPosition}</b></div><div className="mapping-player-copy"><header><strong>{card.playerName}</strong><span className={card.completeness === 'COMPLETE' ? 'pronto' : 'revisar'}>{card.completeness === 'COMPLETE' ? <BadgeCheck size={13}/> : <AlertTriangle size={13}/>} {card.completeness === 'COMPLETE' ? 'Completa' : card.completeness === 'PARTIAL' ? 'Parcial' : 'Identidade'}</span></header><p>{card.cardLabel || card.cardType || 'Edição sem rótulo'}</p><small>{card.offensivePlaystyle || card.playstyle || 'Estilo não confirmado'} • nível {card.level ?? '?' } • {card.trainingPointsTotal ?? '?'} PP</small><footer><span>{card.positions.join(' • ')}</span>{ownedCatalogIdsR438.has(card.catalogCardId) && <span className="stored">No Meu Elenco</span>}</footer></div><div className="mapping-player-actions">{onGenerateMasterCard && <button type="button" disabled={card.completeness !== 'COMPLETE'} aria-label={\`Gerar ficha de ${'${card.playerName}'}\`} onClick={() => onGenerateMasterCard(card)}><Sparkles size={16}/></button>}</div></article>)}\n        </div></article>\n      </section>}\n\n      {tab === 'revisar' && <section className="mapping-players-layout">\n        <article className="mapping-player-library luxury-panel"><header className="mapping-section-heading"><div><p className="kicker">Pendências do catálogo</p><h2>Revisar • {reviewCatalogEntriesR438.length} carta(s)</h2></div></header><div className="mapping-player-grid">\n          {reviewCatalogEntriesR438.map((card) => <article key={card.catalogCardId} className="mapping-player-card"><div className="mapping-player-art"><span>{initials(card.playerName)}</span><b>{card.mainPosition}</b></div><div className="mapping-player-copy"><header><strong>{card.playerName}</strong><span className="revisar"><AlertTriangle size={13}/> {card.completeness === 'PARTIAL' ? 'Parcial' : 'Identidade'}</span></header><p>{card.cardLabel || 'Carta para revisar'}</p><small>Falta: {card.missingFields.join(', ') || 'evidência canônica'}</small></div></article>)}\n          {!reviewCatalogEntriesR438.length && <div className="mapping-empty"><BadgeCheck size={34}/><strong>Nenhuma pendência</strong><span>Todas as cartas pesquisadas estão completas.</span></div>}\n        </div></article>\n      </section>}\n\n` + playerAnchor;
  r = replaceOnceRequired(next, playerAnchor, catalogBlocks, 'superfícies Catálogo Geral/Revisar'); next = r.source;

  return next;
}

function patchApp(source) {
  if (source.includes('async function generateFichaFromMasterCardR438(') && source.includes('onGenerateMasterCard={(card) => void generateFichaFromMasterCardR438(card)}')) return source;
  let next = source;
  let r = replaceOnceRequired(
    next,
    "import type { SquadMappingPlayer } from '@/modules/squad-mapping/squadMappingEngine';",
    "import type { SquadMappingPlayer } from '@/modules/squad-mapping/squadMappingEngine';\nimport type { MasterCardCatalogEntryR438 } from '@/modules/card-catalog/masterCardCatalogR438';",
    'tipo MasterCard na aplicação'
  ); next = r.source;

  const anchor = "  async function generateFichaFromMasterRosterR436(player: SquadMappingPlayer) {";
  const block = `  async function generateFichaFromMasterCardR438(card: MasterCardCatalogEntryR438) {\n    if (card.completeness !== 'COMPLETE') {\n      setStatus(\`Esta carta ainda não pode gerar ficha. Falta: ${'${card.missingFields.join(\', \') || \'dados confirmados\'}'}.\`);\n      return;\n    }\n    const { buildMasterCardAnalysisRawTextR438, createMasterCardProductionAnalysisR438 } = await import('@/modules/card-catalog/masterCardAnalysisRequestR438');\n    const source = buildMasterCardAnalysisRawTextR438(card);\n    const nextResult = createMasterCardProductionAnalysisR438(card, { objective: 'COMPETITIVE', targetPosition: card.mainPosition, tacticalProfile });\n    setSelectedFile(null);\n    setPreview(null);\n    setPlayerCardImage(null);\n    setCardCropResult(null);\n    setCardCropAdjustOpen(false);\n    setFileName(\`catalogo-r438-${'${card.catalogCardId}'}\`);\n    setRawText(source);\n    setOcrDone(true);\n    setPremiumReadings([]);\n    setTotalReadingSession(null);\n    setSinglePrintSession(null);\n    setPreFinalConfirmation(null);\n    setPreFinalGenerateRequested(false);\n    setManualMode(true);\n    setManualFields({\n      playerName: card.playerName,\n      level: card.level ? String(card.level) : '',\n      trainingPointsTotal: card.trainingPointsTotal ? String(card.trainingPointsTotal) : '',\n      attributes: Object.fromEntries(Object.entries(card.attributes).map(([key, value]) => [key, String(value)])) as ManualFields['attributes'],\n      nativeSkills: Array.from(new Set([...card.nativeSkills, ...card.additionalSkills, ...card.specialSkills]))\n    });\n    setCardPositionOverride(card.mainPosition);\n    setPlaystyleOverride(card.offensivePlaystyle || card.playstyle || 'AUTO');\n    setDefensivePlaystyleOverride(card.defensivePlaystyle || 'AUTO');\n    setResult(nextResult);\n    setDraftResult(nextResult);\n    setStatus(\`Ficha de ${'${card.playerName}'} gerada pelo Catálogo Mestre, sem OCR.\`);\n    openMainSection('resultado');\n  }\n\n` + anchor;
  r = replaceOnceRequired(next, anchor, block, 'ponte Catálogo Mestre -> Motor Mestre'); next = r.source;

  r = replaceOnceRequired(
    next,
    "            onGenerateFicha={(player) => void generateFichaFromMasterRosterR436(player)}\n          />",
    "            onGenerateFicha={(player) => void generateFichaFromMasterRosterR436(player)}\n            onGenerateMasterCard={(card) => void generateFichaFromMasterCardR438(card)}\n          />",
    'callback de geração do catálogo'
  ); next = r.source;
  return next;
}

function patchPackage(source) {
  const pkg = JSON.parse(source);
  const commands = [
    'node -r ./tests/_ts-require.cjs tests/v40-80-r438-master-card-catalog-runtime-regression.ts',
    'node tests/v40-80-r438-master-card-storage-regression.mjs',
    'node -r ./tests/_ts-require.cjs tests/v40-80-r438-master-card-migration-regression.ts',
    'node tests/v40-80-r438-master-card-analysis-regression.mjs',
    'node tests/v40-80-r438-master-card-integration-regression.mjs'
  ];
  let current = String(pkg.scripts?.['test:r200'] ?? '');
  if (!current) throw new Error('R438: script test:r200 ausente.');
  for (const command of commands) if (!current.includes(command)) current += ` && ${command}`;
  pkg.scripts['test:r200'] = current;
  return JSON.stringify(pkg, null, 2) + '\n';
}

function validate(root) {
  for (const relative of Object.values(FILES)) {
    if (!fs.existsSync(path.resolve(root, relative))) throw new Error(`R438: validação encontrou arquivo ausente: ${relative}`);
  }
  const center = fs.readFileSync(path.resolve(root, FILES.center), 'utf8');
  const app = fs.readFileSync(path.resolve(root, FILES.app), 'utf8');
  const pkg = fs.readFileSync(path.resolve(root, FILES.package), 'utf8');
  const checks = [
    [center.includes("label: 'Catálogo Geral'"), 'aba Catálogo Geral'],
    [center.includes("label: 'Revisar'"), 'aba Revisar'],
    [center.includes('migrateSquadMappingToMasterCatalogR438'), 'migração do Mapeamento'],
    [center.includes('masterCardToSquadMappingPlayerR438'), 'projeção para Mapeamento'],
    [center.includes('upsertOwnedMasterCardFromSquadMappingR438'), 'OCR alimenta catálogo'],
    [center.includes('onGenerateMasterCard'), 'ação de geração direta'],
    [app.includes('generateFichaFromMasterCardR438'), 'ponte aplicação R438'],
    [app.includes('createMasterCardProductionAnalysisR438'), 'Motor Mestre preservado'],
    [pkg.includes('v40-80-r438-master-card-catalog-runtime-regression.ts'), 'runtime R438 no CI'],
    [pkg.includes('v40-80-r438-master-card-integration-regression.mjs'), 'integração R438 no CI']
  ];
  const missing = checks.filter(([ok]) => !ok).map(([, label]) => label);
  if (missing.length) throw new Error(`R438: validação final incompleta: ${missing.join(', ')}`);
}

export function applyR438MasterCardCatalog(rootDirectory = process.cwd()) {
  const root = path.resolve(rootDirectory);
  // R446_FORWARD_IDEMPOTENCE:applyR438MasterCardCatalog
  try { validate(root); return { changed: false, patched: [], version: R438_MASTER_CARD_CATALOG_VERSION }; } catch {}
  const patchers = [[FILES.center, patchCenter], [FILES.app, patchApp], [FILES.package, patchPackage]];
  const patched = [];
  for (const [relative, patcher] of patchers) {
    const { file, source } = readRequired(root, relative);
    const next = patcher(source);
    if (writeIfChanged(file, source, next)) patched.push(relative);
  }
  validate(root);
  return { changed: patched.length > 0, patched, version: R438_MASTER_CARD_CATALOG_VERSION };
}

const invoked = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : '';
if (invoked === import.meta.url) {
  const result = applyR438MasterCardCatalog(process.cwd());
  console.log(result.changed
    ? `R438: Catálogo Mestre convergiu ${result.patched.length} arquivo(s).`
    : 'R438: Catálogo Mestre já estava convergido.');
}
