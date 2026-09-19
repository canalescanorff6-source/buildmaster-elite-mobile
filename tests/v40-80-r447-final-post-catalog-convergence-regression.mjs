import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const target = path.resolve('scripts/apply-r447-final-post-catalog-convergence.mjs');
const mod = await import(pathToFileURL(target).href);
const { auditPostCatalogFinalConvergenceR447, applyR447FinalPostCatalogConvergence } = mod;

function write(root, relative, content) {
  const file = path.join(root, relative);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, 'utf8');
}

function finalTree(root) {
  write(root, 'src/modules/squad-mapping/SquadMappingCenter.tsx', `
masterRosterSearchTextR436 Gerar ficha sem OCR
const selected = Array.from(files);
preflightSourceHashR437 importCancelRequestedRef recordBatchRosterImportOutcomeR437 pauseBatchRosterImportR437 Pausar após esta carta
readQuickCardIdentityR439 saveCardResolutionQueueItemR439 Selecionar esta versão intelligentImportSummaryR439 saveResolvedFullOcrCardR439
label: 'Catálogo Geral' label: 'Revisar' migrateSquadMappingToMasterCatalogR438 masterCardToSquadMappingPlayerR438 upsertOwnedMasterCardFromSquadMappingR438 onGenerateMasterCard
resolveMasterCardObservationR440 saveCardVisualFingerprintR440
storeCardSourceImageR441 Refazer ficha com este print Exportar ZIP Atualizar catálogo
knownCatalogCardActionR442 addKnownCatalogCardToMappingR442 async function addKnownCatalogCardR442(){} Adicionar ao Meu Elenco actionR442.canGenerate knownCatalogEditionLabelR442
`);
  write(root, 'src/components/CardVisionApp.tsx', `generateFichaFromMasterRosterR436 openMainSection('resultado') generateFichaFromMasterCardR438 createMasterCardProductionAnalysisR438 loadCardSourceFileR441 analyzeSelectedImage(file)`);
  write(root, 'src/modules/squad-mapping/squadMappingEngine.ts', `shouldMergeMasterRosterCardsR436 offensivePlaystyle?: string | null`);
  write(root, 'src/modules/squad-mapping/squadMappingStorage.ts', `trainingPointsTotal: finiteNumber(raw.trainingPointsTotal, 20, 140)`);
  write(root, 'src/lib/appNavigationR127.ts', `id: 'mapeamento', label: 'Meu Elenco'`);
  write(root, 'src/lib/localDatabase.ts', `'card-source-images' runtimeBatchMutate`);
  write(root, 'src/modules/card-catalog/quickCardIdentityReaderR439.ts', `createSmartCardPreview extractCardVisualFingerprintR440`);
  write(root, 'src/modules/card-catalog/masterCardCatalogR438.ts', `visualHashVariants`);
}

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'r447-'));
finalTree(root);

write(root, 'scripts/repair-root-tsconfig.mjs', `
import { applyR442KnownCatalogAcquisition } from './apply-r442-known-catalog-acquisition.mjs';
const SCRIPT_VERSION = '38.39-root-config-self-healing-1+r442';
if (!checkOnly && fullBuildMasterProject) {
  const r436 = applyR436MasterRosterCatalog(projectRoot);
  console.log(r436.changed ? 'R436 changed' : 'R436 ok');
  const r437 = applyR437ResumableRosterImport(projectRoot);
  console.log(r437.changed ? 'R437 changed' : 'R437 ok');
  const r438 = applyR438MasterCardCatalog(projectRoot);
  console.log(r438.changed ? 'R438 changed' : 'R438 ok');
  const r439 = applyR439IntelligentCardResolver(projectRoot);
  console.log(r439.changed ? 'R439 changed' : 'R439 ok');
  const r440 = applyR440VisualCardIdentity(projectRoot);
  console.log(r440.changed ? 'R440 changed' : 'R440 ok');
  const r441 = applyR441CatalogSyncPrintVault(projectRoot);
  console.log(r441.changed ? 'R441 changed' : 'R441 ok');
  const r442 = applyR442KnownCatalogAcquisition(projectRoot);
  console.log(r442.changed ? 'R442 changed' : 'R442 ok');
} else if (!checkOnly) {
  console.log('fixture');
}
`);

write(root, 'scripts/repair-critical-routes.mjs', `
import { assertR424CodeClosure } from './audit-r424-final-requirements-closure.mjs';
if (invokedAsCli) {
  try {
    if (hasConvergedR417(options.projectRoot)) {
      console.log('R417 já convergida: reparo de contratos históricos não será reaplicado.');
    } else {
      const contracts = applyR414CiContractConvergence(options.projectRoot);
      console.log(contracts.changed ? 'legacy changed' : 'legacy ok');
    }
    const capacity = applyR418UnboundedCapacity(options.projectRoot);
  } catch (error) { process.exit(1); }
}
`);

write(root, 'package.json', JSON.stringify({ scripts: { 'test:r200': 'node base-test.mjs' } }, null, 2));

const before = auditPostCatalogFinalConvergenceR447(root);
assert.equal(before.ok, true, before.issues.join(' | '));

const first = applyR447FinalPostCatalogConvergence(root);
assert.equal(first.changed, true);
const second = applyR447FinalPostCatalogConvergence(root);
assert.equal(second.changed, false, 'R447 deve ser idempotente');

const repairedRoot = fs.readFileSync(path.join(root, 'scripts/repair-root-tsconfig.mjs'), 'utf8');
const repairedRoutes = fs.readFileSync(path.join(root, 'scripts/repair-critical-routes.mjs'), 'utf8');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
assert.match(repairedRoot, /auditPostCatalogFinalConvergenceR447/);
assert.match(repairedRoot, /R447 pré-CI: pilha R436-R442 já está no contrato final/);
assert.match(repairedRoot, /R447: convergência pós-catálogo incompleta/);
assert.match(repairedRoutes, /R447: árvore pós-catálogo detectada; R414 histórico não será reaplicado/);
assert.match(pkg.scripts['test:r200'], /v40-80-r447-final-post-catalog-convergence-regression\.mjs/);

let center = fs.readFileSync(path.join(root, 'src/modules/squad-mapping/SquadMappingCenter.tsx'), 'utf8');
center = center.replace('Pausar após esta carta', '').replace('Selecionar esta versão', '').replace('Atualizar catálogo', '').replace('actionR442.canGenerate', '');
fs.writeFileSync(path.join(root, 'src/modules/squad-mapping/SquadMappingCenter.tsx'), center, 'utf8');
const broken = auditPostCatalogFinalConvergenceR447(root);
assert.equal(broken.ok, false);
assert.ok(broken.issues.length >= 4, `esperava múltiplas falhas, recebi ${broken.issues.join(' | ')}`);
assert.ok(broken.issues.some((item) => item.includes('R437')));
assert.ok(broken.issues.some((item) => item.includes('R439')));
assert.ok(broken.issues.some((item) => item.includes('R441')));
assert.ok(broken.issues.some((item) => item.includes('R442')));

console.log('R447 aprovada: auditoria final R436-R442, skip seguro no types:repair/routes:repair, múltiplas falhas reportadas de uma vez e idempotência preservada.');
