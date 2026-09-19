import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const R439_INTELLIGENT_CARD_RESOLVER_VERSION = '40.80-r439-intelligent-card-resolver-v1';

const FILES = {
  center: 'src/modules/squad-mapping/SquadMappingCenter.tsx',
  package: 'package.json',
  resolver: 'src/modules/card-catalog/cardIdentityResolverR439.ts',
  queue: 'src/modules/card-catalog/cardResolutionQueueR439.ts',
  queueStorage: 'src/modules/card-catalog/cardResolutionQueueStorageR439.ts',
  quickReader: 'src/modules/card-catalog/quickCardIdentityReaderR439.ts',
  bridge: 'src/modules/card-catalog/masterCardResolutionBridgeR439.ts',
  stats: 'src/modules/card-catalog/intelligentImportStatsR439.ts',
  runtimeTest: 'tests/v40-80-r439-intelligent-card-resolver-runtime-regression.ts',
  queueTest: 'tests/v40-80-r439-resolution-queue-runtime-regression.ts',
  statsTest: 'tests/v40-80-r439-intelligent-import-stats-regression.ts',
  integrationTest: 'tests/v40-80-r439-intelligent-card-resolver-integration-regression.mjs'
};

function readRequired(root, relative) {
  const file = path.resolve(root, relative);
  if (!fs.existsSync(file)) throw new Error(`R439: arquivo obrigatório ausente: ${relative}`);
  return { file, source: fs.readFileSync(file, 'utf8') };
}
function replaceOnceRequired(source, from, to, label) {
  if (source.includes(to)) return { source, changed: false };
  const count = source.split(from).length - 1;
  if (count !== 1) throw new Error(`R439: contrato inesperado em ${label}; ocorrências=${count}`);
  return { source: source.replace(from, to), changed: true };
}
function writeIfChanged(file, before, after) {
  if (before === after) return false;
  fs.writeFileSync(file, after, 'utf8');
  return true;
}

function patchCenter(source) {
  let next = source;
  let r = replaceOnceRequired(
    next,
    "import { masterCardToSquadMappingPlayerR438 } from '@/modules/card-catalog/masterCardToSquadMappingR438';",
    "import { masterCardToSquadMappingPlayerR438 } from '@/modules/card-catalog/masterCardToSquadMappingR438';\nimport { resolveMasterCardObservationR439 } from '@/modules/card-catalog/cardIdentityResolverR439';\nimport { readQuickCardIdentityR439 } from '@/modules/card-catalog/quickCardIdentityReaderR439';\nimport { createResolutionQueueItemR439, resolveQueueCandidateR439, type CardResolutionQueueItemR439 } from '@/modules/card-catalog/cardResolutionQueueR439';\nimport { loadCardResolutionQueueR439, saveCardResolutionQueueItemR439, removeCardResolutionQueueItemR439 } from '@/modules/card-catalog/cardResolutionQueueStorageR439';\nimport { saveResolvedFullOcrCardR439 } from '@/modules/card-catalog/masterCardResolutionBridgeR439';\nimport { createIntelligentImportStatsR439, recordIntelligentImportR439, intelligentImportSummaryR439 } from '@/modules/card-catalog/intelligentImportStatsR439';\nimport { setOwnedCardR438 } from '@/modules/card-catalog/ownedCardCollectionR438';",
    'imports do resolvedor inteligente'
  ); next = r.source;

  r = replaceOnceRequired(
    next,
    "  const [masterCatalogR438, setMasterCatalogR438] = useState<MasterCardCatalogEntryR438[]>([]);\n  const [ownedCatalogIdsR438, setOwnedCatalogIdsR438] = useState<Set<string>>(() => new Set());",
    "  const [masterCatalogR438, setMasterCatalogR438] = useState<MasterCardCatalogEntryR438[]>([]);\n  const [ownedCatalogIdsR438, setOwnedCatalogIdsR438] = useState<Set<string>>(() => new Set());\n  const [resolutionQueueR439, setResolutionQueueR439] = useState<CardResolutionQueueItemR439[]>([]);",
    'estado da fila R439'
  ); next = r.source;

  r = replaceOnceRequired(
    next,
    "      void migrateSquadMappingToMasterCatalogR438(loaded.players).then((migration) => {",
    "      void Promise.all([migrateSquadMappingToMasterCatalogR438(loaded.players), loadCardResolutionQueueR439()]).then(([migration, resolutionQueue]) => {",
    'hidratação conjunta do catálogo e fila'
  ); next = r.source;

  r = replaceOnceRequired(
    next,
    "        setMasterCatalogR438(migration.catalog);\n        setOwnedCatalogIdsR438(ownedIds);",
    "        setMasterCatalogR438(migration.catalog);\n        setOwnedCatalogIdsR438(ownedIds);\n        setResolutionQueueR439(resolutionQueue);",
    'hidratação da fila R439'
  ); next = r.source;

  r = replaceOnceRequired(
    next,
    "  const reviewCatalogEntriesR438 = useMemo(() => catalogSearchResultsR438.filter((card) => card.completeness !== 'COMPLETE'), [catalogSearchResultsR438]);",
    "  const reviewCatalogEntriesR438 = useMemo(() => catalogSearchResultsR438.filter((card) => card.completeness !== 'COMPLETE'), [catalogSearchResultsR438]);\n  const pendingResolutionQueueR439 = useMemo(() => resolutionQueueR439.filter((item) => item.status === 'PENDING'), [resolutionQueueR439]);",
    'fila pendente derivada'
  ); next = r.source;

  r = replaceOnceRequired(
    next,
    "    let nextPlayers = [...state.players];\n    let stats = createBatchRosterImportStatsR437(selected.length);",
    "    let nextPlayers = [...state.players];\n    let nextCatalogR439 = [...masterCatalogR438];\n    let stats = createBatchRosterImportStatsR437(selected.length);\n    let intelligentStatsR439 = createIntelligentImportStatsR439(selected.length);",
    'estado local do lote R439'
  ); next = r.source;

  const oldPreOcr = `        const incoming = await readMappingImage(file, nextPlayers, sourceHash);`;
  const newPreOcr = `        let resolutionR439 = resolveMasterCardObservationR439({ sourceHash }, nextCatalogR439);
        let quickReadR439: Awaited<ReturnType<typeof readQuickCardIdentityR439>> | null = null;
        if (!(resolutionR439.status === 'RESOLVED' && resolutionR439.action === 'USE_CATALOG')) {
          const knownNamesR439 = Array.from(new Set([...nextCatalogR439.map((card) => card.playerName), ...nextPlayers.map((player) => player.name), ...history.map((item) => item.result.parsed.playerName)])).filter(Boolean);
          quickReadR439 = await readQuickCardIdentityR439(file, { sourceHash, knownPlayerNames: knownNamesR439 });
          resolutionR439 = resolveMasterCardObservationR439(quickReadR439.observation, nextCatalogR439);
        }
        if (resolutionR439.status === 'RESOLVED' && resolutionR439.action === 'USE_CATALOG' && resolutionR439.selectedCatalogCardId) {
          const selectedCardR439 = nextCatalogR439.find((card) => card.catalogCardId === resolutionR439.selectedCatalogCardId);
          if (selectedCardR439) {
            await setOwnedCardR438(selectedCardR439.catalogCardId);
            const projectedR439 = masterCardToSquadMappingPlayerR438(selectedCardR439);
            projectedR439.sourceHash = sourceHash;
            projectedR439.sourceFileName = file.name;
            if (quickReadR439?.sanitizedBlob) {
              const storedR439 = await storeSquadMappingImage(sourceHash, quickReadR439.sanitizedBlob).catch(() => null);
              if (storedR439) { projectedR439.imageRef = storedR439.ref; projectedR439.imageBytes = storedR439.bytes; projectedR439.imageStored = true; }
            }
            const mergedR439 = mergeMappingPlayer(nextPlayers, projectedR439);
            nextPlayers = mergedR439.players;
            setOwnedCatalogIdsR438((current) => new Set([...current, selectedCardR439.catalogCardId]));
            setState((current) => ({ ...current, players: nextPlayers, updatedAt: new Date().toISOString() }));
            await removeCardResolutionQueueItemR439(sourceHash).catch(() => undefined);
            setResolutionQueueR439((current) => current.filter((item) => item.sourceHash !== sourceHash));
            stats = recordBatchRosterImportOutcomeR437(stats, mergedR439.action);
            intelligentStatsR439 = recordIntelligentImportR439(intelligentStatsR439, 'catalog');
            continue;
          }
        }
        if (resolutionR439.status === 'AMBIGUOUS') {
          const queuedR439 = await saveCardResolutionQueueItemR439(createResolutionQueueItemR439({ sourceHash, sourceFileName: file.name, observation: quickReadR439?.observation ?? { sourceHash }, resolution: resolutionR439 }));
          setResolutionQueueR439((current) => [queuedR439, ...current.filter((item) => item.sourceHash !== sourceHash)]);
          if (quickReadR439?.sanitizedBlob) await storeSquadMappingImage(sourceHash, quickReadR439.sanitizedBlob).catch(() => null);
          stats = recordBatchRosterImportOutcomeR437(stats, 'skipped');
          intelligentStatsR439 = recordIntelligentImportR439(intelligentStatsR439, 'ambiguous');
          continue;
        }
        const selectedCatalogCardR439 = resolutionR439.selectedCatalogCardId ? nextCatalogR439.find((card) => card.catalogCardId === resolutionR439.selectedCatalogCardId) ?? null : null;
        const incoming = await readMappingImage(file, nextPlayers, sourceHash);`;
  r = replaceOnceRequired(next, oldPreOcr, newPreOcr, 'resolução antes do OCR completo'); next = r.source;

  r = replaceOnceRequired(
    next,
    "        const catalogEntryR438 = await upsertOwnedMasterCardFromSquadMappingR438(merged.player);\n        setMasterCatalogR438((current) => [catalogEntryR438, ...current.filter((item) => item.catalogCardId !== catalogEntryR438.catalogCardId)]);",
    "        const catalogEntryR438 = await saveResolvedFullOcrCardR439(merged.player, selectedCatalogCardR439);\n        nextCatalogR439 = [catalogEntryR438, ...nextCatalogR439.filter((item) => item.catalogCardId !== catalogEntryR438.catalogCardId)];\n        setMasterCatalogR438(nextCatalogR439);",
    'reconciliação OCR -> edição resolvida'
  ); next = r.source;

  r = replaceOnceRequired(
    next,
    "        stats = recordBatchRosterImportOutcomeR437(stats, merged.action);\n      } catch {",
    "        stats = recordBatchRosterImportOutcomeR437(stats, merged.action);\n        intelligentStatsR439 = recordIntelligentImportR439(intelligentStatsR439, merged.player.status === 'revisar' ? 'review' : 'full-ocr');\n      } catch {",
    'estatística do fallback OCR'
  ); next = r.source;

  r = replaceOnceRequired(
    next,
    "    setMessage(batchRosterImportSummaryR437(stats));",
    "    setMessage(`${intelligentImportSummaryR439(intelligentStatsR439)}${stats.paused ? ' • Importação pausada com segurança; selecione o mesmo lote para continuar.' : ''}`);",
    'resumo inteligente do lote'
  ); next = r.source;

  const functionAnchor = "  const tabs: Array<{ id: MappingTab; label: string; count?: number }> = [";
  const chooseFunction = `  async function chooseResolutionCandidateR439(item: CardResolutionQueueItemR439, catalogCardId: string) {
    const card = masterCatalogR438.find((candidate) => candidate.catalogCardId === catalogCardId);
    if (!card) { setMessage('A versão escolhida não está mais no Catálogo Mestre.'); return; }
    const resolvedItem = resolveQueueCandidateR439(item, catalogCardId);
    await saveCardResolutionQueueItemR439(resolvedItem);
    await setOwnedCardR438(catalogCardId);
    const projected = masterCardToSquadMappingPlayerR438(card);
    projected.sourceHash = item.sourceHash;
    projected.sourceFileName = item.sourceFileName;
    const stored = await loadSquadMappingImage(item.sourceHash).catch(() => null);
    if (stored) { projected.imageRef = stored.ref; projected.imageBytes = stored.bytes; projected.imageStored = true; }
    setState((current) => {
      const merged = mergeMappingPlayer(current.players, projected);
      return { ...current, players: merged.players, updatedAt: new Date().toISOString() };
    });
    setOwnedCatalogIdsR438((current) => new Set([...current, catalogCardId]));
    setResolutionQueueR439((current) => current.map((candidate) => candidate.sourceHash === item.sourceHash ? resolvedItem : candidate));
    setMessage(card.playerName + ' • ' + (card.cardLabel || card.catalogCardId) + ': versão confirmada no Meu Elenco.');
  }

` + functionAnchor;
  r = replaceOnceRequired(next, functionAnchor, chooseFunction, 'seleção manual de versão'); next = r.source;

  r = replaceOnceRequired(
    next,
    "    { id: 'revisar', label: 'Revisar', count: reviewCatalogEntriesR438.length },",
    "    { id: 'revisar', label: 'Revisar', count: reviewCatalogEntriesR438.length + pendingResolutionQueueR439.length },",
    'contador de revisão R439'
  ); next = r.source;

  const reviewAnchor = `{tab === 'revisar' && <section className="mapping-players-layout">\n        <article className="mapping-player-library luxury-panel"><header className="mapping-section-heading"><div><p className="kicker">Pendências do catálogo</p><h2>Revisar • {reviewCatalogEntriesR438.length} carta(s)</h2></div></header><div className="mapping-player-grid">`;
  const reviewReplacement = `{tab === 'revisar' && <section className="mapping-players-layout">\n        <article className="mapping-player-library luxury-panel"><header className="mapping-section-heading"><div><p className="kicker">Pendências do catálogo</p><h2>Revisar • {reviewCatalogEntriesR438.length + pendingResolutionQueueR439.length} item(ns)</h2></div></header><div className="mapping-player-grid">\n          {pendingResolutionQueueR439.map((item) => <article key={item.id} className="mapping-player-card"><div className="mapping-player-art"><span>?</span><b>{item.observation.mainPosition || '?'}</b></div><div className="mapping-player-copy"><header><strong>{item.observation.playerName || item.sourceFileName}</strong><span className="revisar"><AlertTriangle size={13}/> Escolher versão</span></header><p>{item.sourceFileName}</p><small>{item.resolution.candidates.length ? item.resolution.candidates.length + ' versões possíveis' : 'Identidade insuficiente'}</small><footer><span>Leitura rápida {item.resolution.confidence}%</span></footer></div><div className="mapping-player-actions">{item.resolution.candidates.map((candidate) => { const card = masterCatalogR438.find((entry) => entry.catalogCardId === candidate.catalogCardId); return card ? <button type="button" key={candidate.catalogCardId} onClick={() => void chooseResolutionCandidateR439(item, candidate.catalogCardId)} title={(card.cardLabel || card.cardType) + ' • ' + candidate.score + '%'}>Selecionar esta versão</button> : null; })}</div></article>)}`;
  r = replaceOnceRequired(next, reviewAnchor, reviewReplacement, 'UI de resolução ambígua'); next = r.source;

  r = replaceOnceRequired(
    next,
    "<small>Se pausar, selecione o mesmo lote depois: cartas já concluídas serão puladas antes do OCR.</small>",
    "<small>R439 identifica primeiro pelo Catálogo Mestre. Identificada sem OCR completo quando houver correspondência; OCR completo necessário só para carta nova ou incompleta.</small>",
    'mensagem de progresso R439'
  ); next = r.source;

  return next;
}

function patchPackage(source) {
  const pkg = JSON.parse(source);
  const commands = [
    'node -r ./tests/_ts-require.cjs tests/v40-80-r439-intelligent-card-resolver-runtime-regression.ts',
    'node -r ./tests/_ts-require.cjs tests/v40-80-r439-resolution-queue-runtime-regression.ts',
    'node -r ./tests/_ts-require.cjs tests/v40-80-r439-intelligent-import-stats-regression.ts',
    'node tests/v40-80-r439-intelligent-card-resolver-integration-regression.mjs'
  ];
  let current = String(pkg.scripts?.['test:r200'] ?? '');
  if (!current) throw new Error('R439: script test:r200 ausente.');
  for (const command of commands) if (!current.includes(command)) current += ` && ${command}`;
  pkg.scripts['test:r200'] = current;
  return JSON.stringify(pkg, null, 2) + '\n';
}

function validate(root) {
  for (const relative of Object.values(FILES)) if (!fs.existsSync(path.resolve(root, relative))) throw new Error(`R439: validação encontrou arquivo ausente: ${relative}`);
  const center = fs.readFileSync(path.resolve(root, FILES.center), 'utf8');
  const pkg = fs.readFileSync(path.resolve(root, FILES.package), 'utf8');
  const checks = [
    [center.includes('readQuickCardIdentityR439'), 'leitura rápida'],
    [center.includes('resolveMasterCardObservationR439'), 'resolvedor'],
    [center.includes('saveCardResolutionQueueItemR439'), 'fila persistente'],
    [center.includes('Selecionar esta versão'), 'seleção de edição'],
    [center.includes('intelligentImportSummaryR439'), 'resumo inteligente'],
    [center.includes("recordIntelligentImportR439(intelligentStatsR439, 'catalog')"), 'identificação sem OCR completo'],
    [center.includes('saveResolvedFullOcrCardR439'), 'reconciliação fallback OCR'],
    [pkg.includes('v40-80-r439-intelligent-card-resolver-runtime-regression.ts'), 'runtime R439 no CI'],
    [pkg.includes('v40-80-r439-intelligent-card-resolver-integration-regression.mjs'), 'integração R439 no CI']
  ];
  const missing = checks.filter(([ok]) => !ok).map(([, label]) => label);
  if (missing.length) throw new Error(`R439: validação final incompleta: ${missing.join(', ')}`);
}

export function applyR439IntelligentCardResolver(rootDirectory = process.cwd()) {
  const root = path.resolve(rootDirectory);
  const patchers = [[FILES.center, patchCenter], [FILES.package, patchPackage]];
  const patched = [];
  for (const [relative, patcher] of patchers) {
    const { file, source } = readRequired(root, relative);
    const next = patcher(source);
    if (writeIfChanged(file, source, next)) patched.push(relative);
  }
  validate(root);
  return { changed: patched.length > 0, patched, version: R439_INTELLIGENT_CARD_RESOLVER_VERSION };
}

const invoked = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : '';
if (invoked === import.meta.url) {
  const result = applyR439IntelligentCardResolver(process.cwd());
  console.log(result.changed ? `R439: resolvedor inteligente convergiu ${result.patched.length} arquivo(s).` : 'R439: resolvedor inteligente já estava convergido.');
}
