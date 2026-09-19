import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const R441_CATALOG_SYNC_PRINT_VAULT_VERSION = '40.80-r441-catalog-sync-print-vault-v1';

const FILES = {
  center: 'src/modules/squad-mapping/SquadMappingCenter.tsx',
  app: 'src/components/CardVisionApp.tsx',
  localDb: 'src/lib/localDatabase.ts',
  package: 'package.json',
  sourceVault: 'src/modules/master-catalog/cardSourceVaultR441.ts',
  zip: 'src/modules/master-catalog/printBackupZipR441.ts',
  zipRuntime: 'src/modules/master-catalog/printBackupRuntimeR441.ts',
  manifest: 'src/modules/master-catalog/masterCatalogManifestR441.ts',
  sync: 'src/modules/master-catalog/masterCatalogSyncR441.ts',
  syncRuntime: 'src/modules/master-catalog/masterCatalogSyncRuntimeR441.ts',
  ui: 'src/modules/master-catalog/masterCatalogUiModelR441.ts',
  sourceTest: 'tests/v40-80-r441-card-source-vault-runtime-regression.ts',
  zipTest: 'tests/v40-80-r441-print-backup-zip-regression.ts',
  syncTest: 'tests/v40-80-r441-master-catalog-sync-regression.ts',
  integrationTest: 'tests/v40-80-r441-master-catalog-integration-regression.mjs',
};

function readRequired(root, relative) {
  const file = path.resolve(root, relative);
  if (!fs.existsSync(file)) throw new Error(`R441: arquivo obrigatório ausente: ${relative}`);
  return { file, source: fs.readFileSync(file, 'utf8') };
}
function replaceOnceRequired(source, from, to, label) {
  if (source.includes(to)) return { source, changed: false };
  const count = source.split(from).length - 1;
  if (count !== 1) throw new Error(`R441: contrato inesperado em ${label}; ocorrências=${count}`);
  return { source: source.replace(from, to), changed: true };
}
function writeIfChanged(file, before, after) {
  if (before === after) return false;
  fs.writeFileSync(file, after, 'utf8');
  return true;
}

function patchLocalDatabase(source) {
  let next = source;
  let r = replaceOnceRequired(next, "const DB_VERSION = 6;", "const DB_VERSION = 7;", 'versão do IndexedDB'); next = r.source;
  r = replaceOnceRequired(
    next,
    "export type RuntimeStoreName = 'ocr-cache' | 'ocr-corrections' | 'ocr-lexicon' | 'ocr-calibrations' | 'scan-history' | 'diagnostics' | 'image-thumbnails' | 'ocr-queue' | 'cards' | 'builds' | 'formations' | 'matches' | 'backup-snapshots';",
    "export type RuntimeStoreName = 'ocr-cache' | 'ocr-corrections' | 'ocr-lexicon' | 'ocr-calibrations' | 'scan-history' | 'diagnostics' | 'image-thumbnails' | 'card-source-images' | 'ocr-queue' | 'cards' | 'builds' | 'formations' | 'matches' | 'backup-snapshots';",
    'store card-source-images'
  ); next = r.source;
  r = replaceOnceRequired(
    next,
    "const STORE_NAMES: RuntimeStoreName[] = ['ocr-cache', 'ocr-corrections', 'ocr-lexicon', 'ocr-calibrations', 'scan-history', 'diagnostics', 'image-thumbnails', 'ocr-queue', 'cards', 'builds', 'formations', 'matches', 'backup-snapshots'];",
    "const STORE_NAMES: RuntimeStoreName[] = ['ocr-cache', 'ocr-corrections', 'ocr-lexicon', 'ocr-calibrations', 'scan-history', 'diagnostics', 'image-thumbnails', 'card-source-images', 'ocr-queue', 'cards', 'builds', 'formations', 'matches', 'backup-snapshots'];",
    'lista de stores R441'
  ); next = r.source;
  const deleteAnchor = `export function runtimeDelete(storeName: RuntimeStoreName, key: IDBValidKey): Promise<void> {\n  return runtimeMutate(storeName, \`Exclusão de \${storeName}\`, (store) => { store.delete(key); });\n}`;
  const batchBlock = `${deleteAnchor}\n\nexport type RuntimeBatchOperation =\n  | { type: 'put'; key: IDBValidKey; value: unknown }\n  | { type: 'delete'; key: IDBValidKey };\n\nexport function runtimeBatchMutate(storeName: RuntimeStoreName, operations: readonly RuntimeBatchOperation[]): Promise<void> {\n  return runtimeMutate(storeName, \`Lote atômico de \${storeName}\`, (store) => {\n    for (const operation of operations) {\n      if (operation.type === 'delete') store.delete(operation.key);\n      else store.put(operation.value, operation.key);\n    }\n  });\n}`;
  r = replaceOnceRequired(next, deleteAnchor, batchBlock, 'mutação atômica do catálogo'); next = r.source;
  return next;
}

function patchCenter(source) {
  if (source.includes('storeCardSourceImageR441') && source.includes('Refazer ficha com este print') && source.includes('Exportar ZIP') && source.includes('Atualizar catálogo')) return source;
  let next = source;
  let r = replaceOnceRequired(
    next,
    "import { saveCardVisualFingerprintR440 } from '@/modules/card-catalog/masterCardVisualLearningR440';",
    "import { saveCardVisualFingerprintR440 } from '@/modules/card-catalog/masterCardVisualLearningR440';\nimport { linkCardSourceToCatalogR441, listCardSourceMetadataR441, sourceVaultSummaryR441, storeCardSourceImageR441 } from '@/modules/master-catalog/cardSourceVaultR441';\nimport { catalogUpdateLabelR441, printVaultLabelR441 } from '@/modules/master-catalog/masterCatalogUiModelR441';",
    'imports R441 no Meu Elenco'
  ); next = r.source;
  r = replaceOnceRequired(
    next,
    "  onGenerateMasterCard?: (card: MasterCardCatalogEntryR438) => void;",
    "  onGenerateMasterCard?: (card: MasterCardCatalogEntryR438) => void;\n  onRereadOriginal?: (sourceHash: string) => void;",
    'callback de releitura do original'
  ); next = r.source;
  r = replaceOnceRequired(
    next,
    "export function SquadMappingCenter({ history, onOpenFicha, onGenerateFicha, onGenerateMasterCard }: Props) {",
    "export function SquadMappingCenter({ history, onOpenFicha, onGenerateFicha, onGenerateMasterCard, onRereadOriginal }: Props) {",
    'assinatura R441'
  ); next = r.source;
  r = replaceOnceRequired(
    next,
    "  const backupInputRef = useRef<HTMLInputElement | null>(null);",
    "  const backupInputRef = useRef<HTMLInputElement | null>(null);\n  const printBackupInputRefR441 = useRef<HTMLInputElement | null>(null);\n  const catalogPreparedUpdateR441Ref = useRef<import('@/modules/master-catalog/masterCatalogSyncRuntimeR441').PreparedMasterCatalogUpdateR441 | null>(null);\n  const [printVaultSummaryStateR441, setPrintVaultSummaryStateR441] = useState(() => sourceVaultSummaryR441([]));\n  const [catalogManifestUrlR441, setCatalogManifestUrlR441] = useState('');\n  const [catalogSyncStatusR441, setCatalogSyncStatusR441] = useState('Catálogo Mestre local ativo. Configure uma URL HTTPS para receber novas cartas sem reinstalar o APK.');\n  const [catalogSyncBusyR441, setCatalogSyncBusyR441] = useState(false);",
    'estado R441'
  ); next = r.source;

  const hydrateAnchor = `  }, []);\n\n  useEffect(() => {\n    if (!hydrated) return;\n    const timer = window.setTimeout(() => {`;
  const hydrateBlock = `  }, []);\n\n  useEffect(() => {\n    if (!hydrated) return;\n    void listCardSourceMetadataR441().then((items) => setPrintVaultSummaryStateR441(sourceVaultSummaryR441(items))).catch(() => undefined);\n    void import('@/modules/master-catalog/masterCatalogSyncRuntimeR441').then((runtime) => runtime.readMasterCatalogSyncStateR441()).then((sync) => {\n      setCatalogManifestUrlR441(sync.manifestUrl);\n      if (sync.activeVersion !== 'local-r438') setCatalogSyncStatusR441(\`Catálogo Mestre \${sync.activeVersion} ativo offline.\`);\n    }).catch(() => undefined);\n  }, [hydrated]);\n\n  useEffect(() => {\n    if (!hydrated) return;\n    const timer = window.setTimeout(() => {`;
  r = replaceOnceRequired(next, hydrateAnchor, hydrateBlock, 'hidratação R441'); next = r.source;

  r = replaceOnceRequired(
    next,
    "    let intelligentStatsR439 = createIntelligentImportStatsR439(selected.length);",
    "    let intelligentStatsR439 = createIntelligentImportStatsR439(selected.length);\n    let originalFailuresR441 = 0;",
    'contador de originais'
  ); next = r.source;
  r = replaceOnceRequired(
    next,
    "        const sourceHash = await preflightSourceHashR437(file);\n        if (findImportedRosterCardBySourceHashR437(nextPlayers, sourceHash)) {",
    "        const sourceHash = await preflightSourceHashR437(file);\n        const originalR441 = await storeCardSourceImageR441({ sourceHash, file }).catch(() => null);\n        if (!originalR441) originalFailuresR441 += 1;\n        if (findImportedRosterCardBySourceHashR437(nextPlayers, sourceHash)) {",
    'original antes do skip pré-OCR'
  ); next = r.source;
  r = replaceOnceRequired(
    next,
    "            await setOwnedCardR438(learnedCardR440.catalogCardId);\n            const projectedR439 = masterCardToSquadMappingPlayerR438(learnedCardR440);",
    "            await setOwnedCardR438(learnedCardR440.catalogCardId);\n            await linkCardSourceToCatalogR441(sourceHash, learnedCardR440.catalogCardId).catch(() => undefined);\n            const projectedR439 = masterCardToSquadMappingPlayerR438(learnedCardR440);",
    'vínculo visual automático'
  ); next = r.source;
  r = replaceOnceRequired(
    next,
    "        nextCatalogR439 = [learnedCatalogEntryR440, ...nextCatalogR439.filter((item) => item.catalogCardId !== learnedCatalogEntryR440.catalogCardId)];\n        setMasterCatalogR438(nextCatalogR439);",
    "        nextCatalogR439 = [learnedCatalogEntryR440, ...nextCatalogR439.filter((item) => item.catalogCardId !== learnedCatalogEntryR440.catalogCardId)];\n        await linkCardSourceToCatalogR441(sourceHash, learnedCatalogEntryR440.catalogCardId, learnedCatalogEntryR440.imageRef).catch(() => undefined);\n        setMasterCatalogR438(nextCatalogR439);",
    'vínculo após OCR completo'
  ); next = r.source;
  r = replaceOnceRequired(
    next,
    "    await setOwnedCardR438(learnedCardR440.catalogCardId);\n    const projected = masterCardToSquadMappingPlayerR438(learnedCardR440);",
    "    await setOwnedCardR438(learnedCardR440.catalogCardId);\n    await linkCardSourceToCatalogR441(item.sourceHash, learnedCardR440.catalogCardId).catch(() => undefined);\n    const projected = masterCardToSquadMappingPlayerR438(learnedCardR440);",
    'vínculo após escolha manual'
  ); next = r.source;
  r = replaceOnceRequired(
    next,
    "    setMessage(`${intelligentImportSummaryR439(intelligentStatsR439)}${stats.paused ? ' • Importação pausada com segurança; selecione o mesmo lote para continuar.' : ''}`);",
    "    setMessage(`${intelligentImportSummaryR439(intelligentStatsR439)}${stats.paused ? ' • Importação pausada com segurança; selecione o mesmo lote para continuar.' : ''}${originalFailuresR441 ? ` • ${originalFailuresR441} print(s) original(is) não puderam ser preservados por falta de armazenamento/permissão.` : ''}`);\n    void listCardSourceMetadataR441().then((items) => setPrintVaultSummaryStateR441(sourceVaultSummaryR441(items))).catch(() => undefined);",
    'feedback do cofre de originais'
  ); next = r.source;

  const editorButton = "{onGenerateFicha && <button type=\"button\" className=\"elite-button\" disabled={!editingReadiness?.canGenerate} onClick={() => onGenerateFicha(editingPlayer)}><Sparkles size={17}/> Gerar ficha sem OCR</button>}<label><span>Nome</span>";
  const editorR441 = "{onGenerateFicha && <button type=\"button\" className=\"elite-button\" disabled={!editingReadiness?.canGenerate} onClick={() => onGenerateFicha(editingPlayer)}><Sparkles size={17}/> Gerar ficha sem OCR</button>}{onRereadOriginal && editingPlayer.sourceHash && <button type=\"button\" onClick={() => onRereadOriginal(editingPlayer.sourceHash)}><ScanText size={17}/> Refazer ficha com este print</button>}<label><span>Nome</span>";
  r = replaceOnceRequired(next, editorButton, editorR441, 'ação Refazer ficha com este print'); next = r.source;

  const functionAnchor = "  const tabs: Array<{ id: MappingTab; label: string; count?: number }> = [";
  const functionBlock = `  async function exportPrintsZipR441() {\n    setBackupBusy(true);\n    try {\n      const runtime = await import('@/modules/master-catalog/printBackupRuntimeR441');\n      const backup = await runtime.downloadPrintBackupR441();\n      setMessage(\`Backup ZIP criado com \${backup.count} print(s) original(is).\`);\n    } catch (cause) { setMessage(cause instanceof Error ? cause.message : 'Não foi possível exportar os prints originais.'); }\n    finally { setBackupBusy(false); }\n  }\n\n  async function restorePrintsZipR441(file: File | undefined) {\n    if (!file) return;\n    setBackupBusy(true);\n    try {\n      const runtime = await import('@/modules/master-catalog/printBackupRuntimeR441');\n      const summary = await runtime.restorePrintBackupBlobR441(file);\n      const items = await listCardSourceMetadataR441();\n      setPrintVaultSummaryStateR441(sourceVaultSummaryR441(items));\n      setMessage(\`ZIP restaurado: \${summary.restored} novo(s), \${summary.skipped} já existente(s), \${summary.conflicts} conflito(s), \${summary.unlinked} sem vínculo.\`);\n    } catch (cause) { setMessage(cause instanceof Error ? cause.message : 'Não foi possível restaurar o ZIP de prints.'); }\n    finally { setBackupBusy(false); if (printBackupInputRefR441.current) printBackupInputRefR441.current.value = ''; }\n  }\n\n  async function checkCatalogUpdateR441() {\n    setCatalogSyncBusyR441(true);\n    try {\n      const runtime = await import('@/modules/master-catalog/masterCatalogSyncRuntimeR441');\n      await runtime.writeMasterCatalogManifestUrlR441(catalogManifestUrlR441);\n      const prepared = await runtime.prepareMasterCatalogUpdateR441({ manifestUrl: catalogManifestUrlR441, appVersion: '40.80.0' });\n      catalogPreparedUpdateR441Ref.current = prepared;\n      setCatalogSyncStatusR441(catalogUpdateLabelR441({ added: prepared.plan.added, updated: prepared.plan.updated, removed: prepared.plan.removed, targetVersion: prepared.plan.targetVersion }));\n    } catch (cause) { catalogPreparedUpdateR441Ref.current = null; setCatalogSyncStatusR441(cause instanceof Error ? cause.message : 'Falha ao verificar o Catálogo Mestre.'); }\n    finally { setCatalogSyncBusyR441(false); }\n  }\n\n  async function applyCatalogUpdateR441() {\n    setCatalogSyncBusyR441(true);\n    try {\n      const runtime = await import('@/modules/master-catalog/masterCatalogSyncRuntimeR441');\n      const prepared = catalogPreparedUpdateR441Ref.current ?? await runtime.prepareMasterCatalogUpdateR441({ manifestUrl: catalogManifestUrlR441, appVersion: '40.80.0' });\n      const result = await runtime.promotePreparedMasterCatalogUpdateR441(prepared);\n      const storage = await import('@/modules/card-catalog/masterCardCatalogStorageR438');\n      setMasterCatalogR438(await storage.loadMasterCardCatalogR438());\n      catalogPreparedUpdateR441Ref.current = null;\n      setCatalogSyncStatusR441(result.changed ? \`Catálogo atualizado para \${prepared.manifest.catalogVersion} • +\${prepared.plan.added} nova(s) • \${prepared.plan.updated} atualizada(s).\` : \`Catálogo \${prepared.manifest.catalogVersion} já estava atualizado.\`);\n    } catch (cause) { setCatalogSyncStatusR441(cause instanceof Error ? cause.message : 'Falha ao atualizar catálogo. A versão anterior continua ativa.'); }\n    finally { setCatalogSyncBusyR441(false); }\n  }\n\n  async function rollbackCatalogR441() {\n    setCatalogSyncBusyR441(true);\n    try {\n      const runtime = await import('@/modules/master-catalog/masterCatalogSyncRuntimeR441');\n      const restored = await runtime.rollbackMasterCatalogRuntimeR441();\n      const storage = await import('@/modules/card-catalog/masterCardCatalogStorageR438');\n      setMasterCatalogR438(await storage.loadMasterCardCatalogR438());\n      setCatalogSyncStatusR441(\`Catálogo \${restored.restoredVersion} restaurado • \${restored.count} carta(s).\`);\n    } catch (cause) { setCatalogSyncStatusR441(cause instanceof Error ? cause.message : 'Não foi possível restaurar a versão anterior.'); }\n    finally { setCatalogSyncBusyR441(false); }\n  }\n\n${functionAnchor}`;
  r = replaceOnceRequired(next, functionAnchor, functionBlock, 'operações do Arquivo de Prints e sync'); next = r.source;

  const backupPrefix = `{tab === 'backup' && <section className="mapping-backup-grid"><article className="mapping-backup-card luxury-panel"><Download size={28}/>`;
  const backupR441 = `{tab === 'backup' && <section className="mapping-backup-grid"><article className="mapping-backup-card luxury-panel"><HardDrive size={28}/><div><p className="kicker">Arquivo de Prints</p><h2>Originais permanentes</h2><p>{printVaultLabelR441(printVaultSummaryStateR441)}</p><small>Os originais ficam separados das miniaturas e podem ser relidos por versões futuras do motor.</small></div><div className="mapping-backup-actions"><button type="button" className="elite-button" disabled={backupBusy} onClick={() => void exportPrintsZipR441()}><Download size={17}/> Exportar ZIP</button><button type="button" disabled={backupBusy} onClick={() => printBackupInputRefR441.current?.click()}><FileUp size={17}/> Restaurar ZIP</button><input ref={printBackupInputRefR441} className="sr-only" type="file" accept="application/zip,.zip" onChange={(event: ChangeEvent<HTMLInputElement>) => void restorePrintsZipR441(event.target.files?.[0])}/></div></article><article className="mapping-backup-card luxury-panel"><UploadCloud size={28}/><div><p className="kicker">Catálogo Mestre</p><h2>Atualizar sem novo APK</h2><p>{catalogSyncStatusR441}</p><input value={catalogManifestUrlR441} onChange={(event) => setCatalogManifestUrlR441(event.target.value)} placeholder="https://.../catalog-manifest.json"/></div><div className="mapping-backup-actions"><button type="button" disabled={catalogSyncBusyR441 || !catalogManifestUrlR441.trim()} onClick={() => void checkCatalogUpdateR441()}>Verificar atualizações</button><button type="button" className="elite-button" disabled={catalogSyncBusyR441 || !catalogPreparedUpdateR441Ref.current?.plan.changed} onClick={() => void applyCatalogUpdateR441()}>Atualizar catálogo</button><button type="button" disabled={catalogSyncBusyR441} onClick={() => void rollbackCatalogR441()}>Restaurar versão anterior</button></div></article><article className="mapping-backup-card luxury-panel"><Download size={28}/>`;
  r = replaceOnceRequired(next, backupPrefix, backupR441, 'cards de backup/sync R441'); next = r.source;
  return next;
}

function patchApp(source) {
  if (source.includes('async function rereadOriginalPrintR441(') && source.includes('onRereadOriginal={(sourceHash) => void rereadOriginalPrintR441(sourceHash)}')) return source;
  let next = source;
  const runAnchor = "  const runAnalysis = (confirmed = false) => invokeReaderActionR187('runAnalysis', confirmed);";
  const runBlock = `${runAnchor}\n\n  async function rereadOriginalPrintR441(sourceHash: string) {\n    try {\n      const { loadCardSourceFileR441 } = await import('@/modules/master-catalog/cardSourceVaultR441');\n      const restored = await loadCardSourceFileR441(sourceHash);\n      if (!restored) { setStatus('O print original não foi encontrado. Restaure o ZIP de prints ou importe a imagem novamente.'); return; }\n      const file = restored as File;\n      openMainSection('leitor');\n      await handleFile(file);\n      setStatus('Print original recuperado. Relendo com o motor atual do BuildMaster...');\n      await analyzeSelectedImage(file);\n    } catch (cause) {\n      setStatus(cause instanceof Error ? cause.message : 'Não foi possível reler o print original.');\n    }\n  }`;
  let r = replaceOnceRequired(next, runAnchor, runBlock, 'releitura pelo motor atual'); next = r.source;
  r = replaceOnceRequired(
    next,
    "            onGenerateMasterCard={(card) => void generateFichaFromMasterCardR438(card)}\n          />",
    "            onGenerateMasterCard={(card) => void generateFichaFromMasterCardR438(card)}\n            onRereadOriginal={(sourceHash) => void rereadOriginalPrintR441(sourceHash)}\n          />",
    'callback de releitura R441'
  ); next = r.source;
  return next;
}

function patchPackage(source) {
  const pkg = JSON.parse(source);
  const commands = [
    'node -r ./tests/_ts-require.cjs tests/v40-80-r441-card-source-vault-runtime-regression.ts',
    'node -r ./tests/_ts-require.cjs tests/v40-80-r441-print-backup-zip-regression.ts',
    'node -r ./tests/_ts-require.cjs tests/v40-80-r441-master-catalog-sync-regression.ts',
    'node tests/v40-80-r441-master-catalog-integration-regression.mjs'
  ];
  let current = String(pkg.scripts?.['test:r200'] ?? '');
  if (!current) throw new Error('R441: script test:r200 ausente.');
  for (const command of commands) if (!current.includes(command)) current += ` && ${command}`;
  pkg.scripts['test:r200'] = current;
  return JSON.stringify(pkg, null, 2) + '\n';
}

function validate(root) {
  for (const relative of Object.values(FILES)) if (!fs.existsSync(path.resolve(root, relative))) throw new Error(`R441: validação encontrou arquivo ausente: ${relative}`);
  const center = fs.readFileSync(path.resolve(root, FILES.center), 'utf8');
  const app = fs.readFileSync(path.resolve(root, FILES.app), 'utf8');
  const db = fs.readFileSync(path.resolve(root, FILES.localDb), 'utf8');
  const pkg = fs.readFileSync(path.resolve(root, FILES.package), 'utf8');
  const checks = [
    [db.includes("'card-source-images'"), 'store de originais'],
    [db.includes('runtimeBatchMutate'), 'promoção atômica'],
    [center.includes('storeCardSourceImageR441'), 'salvamento do original'],
    [center.includes('Refazer ficha com este print'), 'releitura do original'],
    [center.includes('Exportar ZIP'), 'exportação ZIP'],
    [center.includes('Atualizar catálogo'), 'sync do catálogo'],
    [app.includes('loadCardSourceFileR441'), 'ponte para leitor atual'],
    [app.includes('analyzeSelectedImage(file)'), 'releitura com motor atual'],
    [pkg.includes('v40-80-r441-master-catalog-sync-regression.ts'), 'R441 no CI'],
  ];
  const missing = checks.filter(([ok]) => !ok).map(([, label]) => label);
  if (missing.length) throw new Error(`R441: validação final incompleta: ${missing.join(', ')}`);
}

export function applyR441CatalogSyncPrintVault(rootDirectory = process.cwd()) {
  const root = path.resolve(rootDirectory);
  const patchers = [[FILES.localDb, patchLocalDatabase], [FILES.center, patchCenter], [FILES.app, patchApp], [FILES.package, patchPackage]];
  const patched = [];
  for (const [relative, patcher] of patchers) {
    const { file, source } = readRequired(root, relative);
    const next = patcher(source);
    if (writeIfChanged(file, source, next)) patched.push(relative);
  }
  validate(root);
  return { changed: patched.length > 0, patched, version: R441_CATALOG_SYNC_PRINT_VAULT_VERSION };
}

const invoked = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : '';
if (invoked === import.meta.url) {
  const result = applyR441CatalogSyncPrintVault(process.cwd());
  console.log(result.changed ? `R441: catálogo/prints convergiu ${result.patched.length} arquivo(s).` : 'R441: catálogo/prints já estava convergido.');
}
