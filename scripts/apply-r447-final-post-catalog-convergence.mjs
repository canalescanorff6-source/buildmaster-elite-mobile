import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const R447_FINAL_POST_CATALOG_CONVERGENCE_VERSION = '40.80-r447-final-post-catalog-convergence-v1';

const FILES = Object.freeze({
  repairRoot: 'scripts/repair-root-tsconfig.mjs',
  repairRoutes: 'scripts/repair-critical-routes.mjs',
  package: 'package.json',
  center: 'src/modules/squad-mapping/SquadMappingCenter.tsx',
  app: 'src/components/CardVisionApp.tsx',
  engine: 'src/modules/squad-mapping/squadMappingEngine.ts',
  storage: 'src/modules/squad-mapping/squadMappingStorage.ts',
  nav: 'src/lib/appNavigationR127.ts',
  db: 'src/lib/localDatabase.ts',
  quick: 'src/modules/card-catalog/quickCardIdentityReaderR439.ts',
  catalog: 'src/modules/card-catalog/masterCardCatalogR438.ts',
});

function readOptional(root, relative) {
  const file = path.resolve(root, relative);
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
}

function readRequired(root, relative) {
  const source = readOptional(root, relative);
  if (source === null) throw new Error(`R447: arquivo obrigatório ausente: ${relative}`);
  return source;
}

function writeIfChanged(root, relative, before, after, patched) {
  if (before === after) return false;
  const file = path.resolve(root, relative);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, after, 'utf8');
  if (!patched.includes(relative)) patched.push(relative);
  return true;
}

function requireFragments(issues, label, source, fragments) {
  if (source === null) {
    issues.push(`${label}: arquivo ausente`);
    return;
  }
  for (const fragment of fragments) {
    if (!source.includes(fragment)) issues.push(`${label}: contrato ausente (${fragment})`);
  }
}

export function auditPostCatalogFinalConvergenceR447(rootDirectory = process.cwd()) {
  const root = path.resolve(rootDirectory);
  const issues = [];
  const center = readOptional(root, FILES.center);
  const app = readOptional(root, FILES.app);
  const engine = readOptional(root, FILES.engine);
  const storage = readOptional(root, FILES.storage);
  const nav = readOptional(root, FILES.nav);
  const db = readOptional(root, FILES.db);
  const quick = readOptional(root, FILES.quick);
  const catalog = readOptional(root, FILES.catalog);

  requireFragments(issues, 'R436', engine, ['shouldMergeMasterRosterCardsR436', 'offensivePlaystyle?: string | null']);
  requireFragments(issues, 'R436', storage, ['trainingPointsTotal: finiteNumber(raw.trainingPointsTotal, 20, 140)']);
  requireFragments(issues, 'R436', nav, ["id: 'mapeamento', label: 'Meu Elenco'"]);
  requireFragments(issues, 'R436', center, ['masterRosterSearchTextR436', 'Gerar ficha sem OCR', 'const selected = Array.from(files);']);
  if (center?.includes('Array.from(files).slice(0, 120)')) issues.push('R436/R437: teto artificial de 120 voltou ao Meu Elenco');

  requireFragments(issues, 'R437', center, [
    'preflightSourceHashR437',
    'importCancelRequestedRef',
    'recordBatchRosterImportOutcomeR437',
    'pauseBatchRosterImportR437',
    'Pausar após esta carta',
  ]);
  // R439 substitui legitimamente o leitor direto e o resumo textual R437.
  if (center && !center.includes('resolveMasterCardObservationR439') && !center.includes('resolveMasterCardObservationR440')) {
    issues.push('R437/R439: fluxo pré-OCR/resolvedor final ausente');
  }
  if (center && !center.includes('intelligentImportSummaryR439')) {
    issues.push('R437/R439: resumo final do lote inteligente ausente');
  }

  requireFragments(issues, 'R438', center, [
    "label: 'Catálogo Geral'",
    "label: 'Revisar'",
    'migrateSquadMappingToMasterCatalogR438',
    'masterCardToSquadMappingPlayerR438',
    'upsertOwnedMasterCardFromSquadMappingR438',
    'onGenerateMasterCard',
  ]);

  requireFragments(issues, 'R439', center, [
    'readQuickCardIdentityR439',
    'saveCardResolutionQueueItemR439',
    'Selecionar esta versão',
    'intelligentImportSummaryR439',
    'saveResolvedFullOcrCardR439',
  ]);

  requireFragments(issues, 'R440', center, ['resolveMasterCardObservationR440', 'saveCardVisualFingerprintR440']);
  requireFragments(issues, 'R440', quick, ['createSmartCardPreview', 'extractCardVisualFingerprintR440']);
  requireFragments(issues, 'R440', catalog, ['visualHashVariants']);

  requireFragments(issues, 'R441', db, ["'card-source-images'", 'runtimeBatchMutate']);
  requireFragments(issues, 'R441', center, ['storeCardSourceImageR441', 'Refazer ficha com este print', 'Exportar ZIP', 'Atualizar catálogo']);

  requireFragments(issues, 'R442', center, [
    'knownCatalogCardActionR442',
    'addKnownCatalogCardToMappingR442',
    'async function addKnownCatalogCardR442',
    'Adicionar ao Meu Elenco',
    'actionR442.canGenerate',
    'knownCatalogEditionLabelR442',
  ]);

  requireFragments(issues, 'APP', app, [
    'generateFichaFromMasterRosterR436',
    "openMainSection('resultado')",
    'generateFichaFromMasterCardR438',
    'createMasterCardProductionAnalysisR438',
    'loadCardSourceFileR441',
    'analyzeSelectedImage(file)',
  ]);

  return { version: R447_FINAL_POST_CATALOG_CONVERGENCE_VERSION, ok: issues.length === 0, issues };
}

function patchRepairRoot(source) {
  if (source.includes('R447_FINAL_POST_CATALOG_REPAIR_ROOT')) return source;

  const importAnchor = "import { applyR442KnownCatalogAcquisition } from './apply-r442-known-catalog-acquisition.mjs';";
  if (!source.includes(importAnchor)) throw new Error('R447: import R442 ausente em repair-root-tsconfig.');
  let next = source.replace(importAnchor, `${importAnchor}\nimport { auditPostCatalogFinalConvergenceR447 } from './apply-r447-final-post-catalog-convergence.mjs';`);
  next = next.replace("const SCRIPT_VERSION = '38.39-root-config-self-healing-1+r442';", "const SCRIPT_VERSION = '38.39-root-config-self-healing-1+r447';");

  const startMarker = '  const r436 = applyR436MasterRosterCatalog(projectRoot);';
  const endMarker = '} else if (!checkOnly) {';
  const start = next.indexOf(startMarker);
  const end = next.indexOf(endMarker, start);
  if (start < 0 || end < 0) throw new Error('R447: bloco R436-R442 não encontrado em repair-root-tsconfig.');
  const legacyBlock = next.slice(start, end);
  const wrapped = `  // R447_FINAL_POST_CATALOG_REPAIR_ROOT\n  const postCatalogR447Before = auditPostCatalogFinalConvergenceR447(projectRoot);\n  if (postCatalogR447Before.ok) {\n    console.log('R447 pré-CI: pilha R436-R442 já está no contrato final; patchers históricos não serão reaplicados.');\n  } else {\n${legacyBlock.split('\n').map((line) => `  ${line}`).join('\n')}\n    const postCatalogR447After = auditPostCatalogFinalConvergenceR447(projectRoot);\n    if (!postCatalogR447After.ok) {\n      throw new Error(\`R447: convergência pós-catálogo incompleta — \${postCatalogR447After.issues.join(' | ')}\`);\n    }\n  }\n`;
  next = next.slice(0, start) + wrapped + next.slice(end);
  return next;
}

function patchRepairRoutes(source) {
  if (source.includes('R447_FINAL_POST_CATALOG_ROUTES')) return source;
  const importAnchor = "import { assertR424CodeClosure } from './audit-r424-final-requirements-closure.mjs';";
  if (!source.includes(importAnchor)) throw new Error('R447: import R424 ausente em repair-critical-routes.');
  let next = source.replace(importAnchor, `${importAnchor}\nimport { auditPostCatalogFinalConvergenceR447 } from './apply-r447-final-post-catalog-convergence.mjs';`);
  const old = "    if (hasConvergedR417(options.projectRoot)) {\n      console.log('R417 já convergida: reparo de contratos históricos não será reaplicado.');";
  const replacement = "    // R447_FINAL_POST_CATALOG_ROUTES\n    const postCatalogR447 = auditPostCatalogFinalConvergenceR447(options.projectRoot);\n    if (postCatalogR447.ok) {\n      console.log('R447: árvore pós-catálogo detectada; R414 histórico não será reaplicado.');\n    } else if (hasConvergedR417(options.projectRoot)) {\n      console.log('R417 já convergida: reparo de contratos históricos não será reaplicado.');";
  if (!next.includes(old)) throw new Error('R447: gate R417/R414 não encontrado em repair-critical-routes.');
  next = next.replace(old, replacement);
  return next;
}

function patchPackage(source) {
  const pkg = JSON.parse(source);
  const command = 'node tests/v40-80-r447-final-post-catalog-convergence-regression.mjs';
  const current = String(pkg.scripts?.['test:r200'] ?? '');
  if (!current) throw new Error('R447: script test:r200 ausente.');
  if (!current.includes(command)) pkg.scripts['test:r200'] = `${current} && ${command}`;
  return JSON.stringify(pkg, null, 2) + '\n';
}

export function applyR447FinalPostCatalogConvergence(rootDirectory = process.cwd()) {
  const root = path.resolve(rootDirectory);
  const patched = [];
  let changed = false;
  const targets = [
    [FILES.repairRoot, patchRepairRoot],
    [FILES.repairRoutes, patchRepairRoutes],
    [FILES.package, patchPackage],
  ];
  for (const [relative, patcher] of targets) {
    const before = readRequired(root, relative);
    const after = patcher(before);
    changed = writeIfChanged(root, relative, before, after, patched) || changed;
  }
  return { changed, patched, version: R447_FINAL_POST_CATALOG_CONVERGENCE_VERSION };
}

const invoked = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : '';
if (invoked === import.meta.url) {
  const result = applyR447FinalPostCatalogConvergence(process.cwd());
  console.log(result.changed
    ? `R447: convergência final pós-catálogo aplicada em ${result.patched.length} arquivo(s).`
    : 'R447: convergência final pós-catálogo já estava aplicada.');
}
