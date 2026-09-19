import fs from 'node:fs';
import path from 'node:path';

export const R446_POST_CATALOG_CONVERGENCE_VERSION = '40.80-r446-post-catalog-convergence-v1';

const FILES = Object.freeze({
  center: 'src/modules/squad-mapping/SquadMappingCenter.tsx',
  engine: 'src/modules/squad-mapping/squadMappingEngine.ts',
  storage: 'src/modules/squad-mapping/squadMappingStorage.ts',
  app: 'src/components/CardVisionApp.tsx',
  nav: 'src/lib/appNavigationR127.ts',
  localDb: 'src/lib/localDatabase.ts',
  quickReader: 'src/modules/card-catalog/quickCardIdentityReaderR439.ts',
  catalog: 'src/modules/card-catalog/masterCardCatalogR438.ts',
  package: 'package.json',
  r442Helper: 'src/modules/card-catalog/knownCatalogAcquisitionR442.ts',
});

function read(root, relative) {
  const file = path.resolve(root, relative);
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
}

function check(missing, ok, label) {
  if (!ok) missing.push(label);
}

export function hasPostCatalogFootprintR446(rootDirectory = process.cwd()) {
  const root = path.resolve(rootDirectory);
  return fs.existsSync(path.resolve(root, FILES.r442Helper))
    || fs.existsSync(path.resolve(root, 'src/modules/master-catalog/cardSourceVaultR441.ts'))
    || fs.existsSync(path.resolve(root, 'src/modules/card-catalog/cardIdentityResolverR440.ts'));
}

export function auditPostCatalogConvergenceR446(rootDirectory = process.cwd()) {
  const root = path.resolve(rootDirectory);
  const center = read(root, FILES.center) || '';
  const engine = read(root, FILES.engine) || '';
  const storage = read(root, FILES.storage) || '';
  const app = read(root, FILES.app) || '';
  const nav = read(root, FILES.nav) || '';
  const db = read(root, FILES.localDb) || '';
  const quick = read(root, FILES.quickReader) || '';
  const catalog = read(root, FILES.catalog) || '';
  const pkg = read(root, FILES.package) || '';
  const missing = [];

  // R436 — Meu Elenco / Banco Mestre
  check(missing, engine.includes('shouldMergeMasterRosterCardsR436'), 'R436 política de variantes');
  check(missing, engine.includes('offensivePlaystyle?: string | null'), 'R436 estilos persistentes');
  check(missing, center.includes('const selected = Array.from(files);') && !center.includes('Array.from(files).slice(0, 120)'), 'R436 lote sem teto 120');
  check(missing, center.includes('Gerar ficha sem OCR') && center.includes('masterRosterSearchTextR436'), 'R436 busca/ficha direta');
  check(missing, storage.includes('trainingPointsTotal: finiteNumber(raw.trainingPointsTotal, 20, 140)'), 'R436 PP persistente');
  check(missing, app.includes('generateFichaFromMasterRosterR436') && app.includes("openMainSection('resultado')"), 'R436 ponte Motor Mestre');
  check(missing, nav.includes("id: 'mapeamento', label: 'Meu Elenco'"), 'R436 navegação Meu Elenco');

  // R437 — lote retomável
  check(missing, center.includes('preflightSourceHashR437'), 'R437 preflight hash');
  check(missing, center.includes('findImportedRosterCardBySourceHashR437'), 'R437 skip pré-OCR');
  check(missing, center.includes('readMappingImage(file, nextPlayers, sourceHash)'), 'R437 reuso de hash');
  check(missing, center.includes('Pausar após esta carta'), 'R437 pausa segura');
  check(missing, center.includes('batchRosterImportSummaryR437(stats)'), 'R437 resumo retomável');

  // R438 — Catálogo Mestre
  check(missing, center.includes("label: 'Catálogo Geral'") && center.includes("label: 'Revisar'"), 'R438 abas catálogo/revisão');
  check(missing, center.includes('migrateSquadMappingToMasterCatalogR438'), 'R438 migração');
  check(missing, center.includes('masterCardToSquadMappingPlayerR438'), 'R438 projeção');
  check(missing, center.includes('upsertOwnedMasterCardFromSquadMappingR438'), 'R438 OCR alimenta catálogo');
  check(missing, center.includes('onGenerateMasterCard'), 'R438 geração direta');
  check(missing, app.includes('generateFichaFromMasterCardR438') && app.includes('createMasterCardProductionAnalysisR438'), 'R438 ponte Motor Mestre');

  // R439 — resolvedor inteligente
  check(missing, center.includes('readQuickCardIdentityR439'), 'R439 leitura rápida');
  check(missing, center.includes('saveCardResolutionQueueItemR439'), 'R439 fila persistente');
  check(missing, center.includes('Selecionar esta versão'), 'R439 seleção manual');
  check(missing, center.includes('intelligentImportSummaryR439'), 'R439 resumo inteligente');
  check(missing, center.includes('saveResolvedFullOcrCardR439'), 'R439 reconciliação OCR');

  // R440 — identidade visual
  check(missing, center.includes('resolveMasterCardObservationR440'), 'R440 resolvedor visual');
  check(missing, center.includes('saveCardVisualFingerprintR440'), 'R440 aprendizado visual');
  check(missing, quick.includes('createSmartCardPreview') && quick.includes('extractCardVisualFingerprintR440'), 'R440 fingerprint visual');
  check(missing, catalog.includes('visualHashVariants'), 'R440 schema visual');

  // R441 — Cofre de Prints + sync
  check(missing, db.includes("'card-source-images'"), 'R441 store de originais');
  check(missing, db.includes('runtimeBatchMutate'), 'R441 promoção atômica');
  check(missing, center.includes('storeCardSourceImageR441'), 'R441 original preservado');
  check(missing, center.includes('Refazer ficha com este print'), 'R441 releitura original');
  check(missing, center.includes('Exportar ZIP'), 'R441 backup ZIP');
  check(missing, center.includes('Atualizar catálogo'), 'R441 sync catálogo');
  check(missing, app.includes('loadCardSourceFileR441') && app.includes('analyzeSelectedImage(file)'), 'R441 releitura pelo motor atual');

  // R442 — aquisição sem novo print
  check(missing, center.includes('knownCatalogCardActionR442'), 'R442 gate de ação');
  check(missing, center.includes('addKnownCatalogCardToMappingR442'), 'R442 projeção zero-print');
  check(missing, center.includes('async function addKnownCatalogCardR442'), 'R442 aquisição direta');
  check(missing, center.includes('Adicionar ao Meu Elenco'), 'R442 CTA adicionar');
  check(missing, center.includes('actionR442.canGenerate'), 'R442 geração após posse');
  check(missing, center.includes('knownCatalogEditionLabelR442'), 'R442 identificação da edição');

  // A cadeia de regressão precisa continuar registrada.
  for (const marker of [
    'v40-80-r436-master-roster-catalog-runtime-regression.ts',
    'v40-80-r437-resumable-roster-import-runtime-regression.ts',
    'v40-80-r438-master-card-catalog-runtime-regression.ts',
    'v40-80-r439-intelligent-card-resolver-runtime-regression.ts',
    'v40-80-r440-visual-card-identity-runtime-regression.ts',
    'v40-80-r441-master-catalog-sync-regression.ts',
    'v40-80-r442-known-catalog-acquisition-runtime-regression.ts',
  ]) check(missing, pkg.includes(marker), `CI ${marker}`);

  return {
    version: R446_POST_CATALOG_CONVERGENCE_VERSION,
    ok: missing.length === 0,
    missing,
    footprint: hasPostCatalogFootprintR446(root),
  };
}


const PATCHER_TARGETS_R446 = Object.freeze([
  ['scripts/apply-r437-resumable-roster-import.mjs','applyR437ResumableRosterImport','R437_RESUMABLE_ROSTER_IMPORT_VERSION'],
  ['scripts/apply-r438-master-card-catalog.mjs','applyR438MasterCardCatalog','R438_MASTER_CARD_CATALOG_VERSION'],
  ['scripts/apply-r439-intelligent-card-resolver.mjs','applyR439IntelligentCardResolver','R439_INTELLIGENT_CARD_RESOLVER_VERSION'],
  ['scripts/apply-r440-visual-card-identity.mjs','applyR440VisualCardIdentity','R440_VISUAL_CARD_IDENTITY_VERSION'],
  ['scripts/apply-r441-catalog-sync-print-vault.mjs','applyR441CatalogSyncPrintVault','R441_CATALOG_SYNC_PRINT_VAULT_VERSION'],
  ['scripts/apply-r442-known-catalog-acquisition.mjs','applyR442KnownCatalogAcquisition','R442_KNOWN_CATALOG_ACQUISITION_VERSION'],
]);

function patchForwardIdempotenceR446(source, functionName, versionConst) {
  if (source.includes(`R446_FORWARD_IDEMPOTENCE:${functionName}`)) return source;
  const anchor = `export function ${functionName}(rootDirectory = process.cwd()) {\n  const root = path.resolve(rootDirectory);`;
  if (!source.includes(anchor)) throw new Error(`R446: assinatura não encontrada em ${functionName}.`);
  const guard = `${anchor}
  // R446_FORWARD_IDEMPOTENCE:${functionName}
  try { validate(root); return { changed: false, patched: [], version: ${versionConst} }; } catch {}`;
  return source.replace(anchor, guard);
}

export function applyPostCatalogForwardIdempotenceR446(rootDirectory = process.cwd()) {
  const root = path.resolve(rootDirectory);
  const patched = [];
  for (const [relative, functionName, versionConst] of PATCHER_TARGETS_R446) {
    const file = path.resolve(root, relative);
    if (!fs.existsSync(file)) throw new Error(`R446: patcher obrigatório ausente: ${relative}`);
    const before = fs.readFileSync(file, 'utf8');
    const after = patchForwardIdempotenceR446(before, functionName, versionConst);
    if (after !== before) {
      fs.writeFileSync(file, after, 'utf8');
      patched.push(relative);
    }
  }
  const packagePath = path.resolve(root, 'package.json');
  if (!fs.existsSync(packagePath)) throw new Error('R446: package.json ausente.');
  const packageSource = fs.readFileSync(packagePath, 'utf8');
  const pkg = JSON.parse(packageSource);
  const regression = 'node tests/v40-80-r446-post-catalog-convergence-regression.mjs';
  const current = String(pkg.scripts?.['test:r200'] ?? '');
  if (!current) throw new Error('R446: test:r200 ausente.');
  if (!current.includes(regression)) {
    pkg.scripts['test:r200'] = `${current} && ${regression}`;
    const next = JSON.stringify(pkg, null, 2) + '\n';
    fs.writeFileSync(packagePath, next, 'utf8');
    patched.push('package.json');
  }
  return { changed: patched.length > 0, patched, version: R446_POST_CATALOG_CONVERGENCE_VERSION };
}

export function assertPostCatalogConvergenceR446(rootDirectory = process.cwd()) {
  const result = auditPostCatalogConvergenceR446(rootDirectory);
  if (!result.ok) {
    throw new Error(`R446: contratos pós-catálogo incompletos (${result.missing.length}) — ${result.missing.join(' | ')}`);
  }
  return result;
}
