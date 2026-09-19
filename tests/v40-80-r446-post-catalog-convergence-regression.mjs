import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  auditPostCatalogConvergenceR446,
  assertPostCatalogConvergenceR446,
  hasPostCatalogFootprintR446,
  applyPostCatalogForwardIdempotenceR446,
} from '../scripts/apply-r446-post-catalog-convergence.mjs';

const root=fs.mkdtempSync(path.join(os.tmpdir(),'r446-postcatalog-'));
const w=(p,c)=>{const f=path.join(root,p);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,c,'utf8');};

const center=[
'const selected = Array.from(files);',
'Gerar ficha sem OCR masterRosterSearchTextR436',
'preflightSourceHashR437 findImportedRosterCardBySourceHashR437 readMappingImage(file, nextPlayers, sourceHash)',
'Pausar após esta carta batchRosterImportSummaryR437(stats)',
"label: 'Catálogo Geral' label: 'Revisar'",
'migrateSquadMappingToMasterCatalogR438 masterCardToSquadMappingPlayerR438 upsertOwnedMasterCardFromSquadMappingR438 onGenerateMasterCard',
'readQuickCardIdentityR439 saveCardResolutionQueueItemR439 Selecionar esta versão intelligentImportSummaryR439 saveResolvedFullOcrCardR439',
'resolveMasterCardObservationR440 saveCardVisualFingerprintR440',
'storeCardSourceImageR441 Refazer ficha com este print Exportar ZIP Atualizar catálogo',
'knownCatalogCardActionR442 addKnownCatalogCardToMappingR442 async function addKnownCatalogCardR442',
'Adicionar ao Meu Elenco actionR442.canGenerate knownCatalogEditionLabelR442'
].join('\n');
w('src/modules/squad-mapping/SquadMappingCenter.tsx',center);
w('src/modules/squad-mapping/squadMappingEngine.ts','shouldMergeMasterRosterCardsR436 offensivePlaystyle?: string | null');
w('src/modules/squad-mapping/squadMappingStorage.ts','trainingPointsTotal: finiteNumber(raw.trainingPointsTotal, 20, 140)');
w('src/components/CardVisionApp.tsx',"generateFichaFromMasterRosterR436 openMainSection('resultado') generateFichaFromMasterCardR438 createMasterCardProductionAnalysisR438 loadCardSourceFileR441 analyzeSelectedImage(file)");
w('src/lib/appNavigationR127.ts',"id: 'mapeamento', label: 'Meu Elenco'");
w('src/lib/localDatabase.ts',"'card-source-images' runtimeBatchMutate");
w('src/modules/card-catalog/quickCardIdentityReaderR439.ts','createSmartCardPreview extractCardVisualFingerprintR440');
w('src/modules/card-catalog/masterCardCatalogR438.ts','visualHashVariants');
w('src/modules/card-catalog/knownCatalogAcquisitionR442.ts','R442');
w('package.json',[
'v40-80-r436-master-roster-catalog-runtime-regression.ts',
'v40-80-r437-resumable-roster-import-runtime-regression.ts',
'v40-80-r438-master-card-catalog-runtime-regression.ts',
'v40-80-r439-intelligent-card-resolver-runtime-regression.ts',
'v40-80-r440-visual-card-identity-runtime-regression.ts',
'v40-80-r441-master-catalog-sync-regression.ts',
'v40-80-r442-known-catalog-acquisition-runtime-regression.ts'
].join(' '));

assert.equal(hasPostCatalogFootprintR446(root),true);
let audit=auditPostCatalogConvergenceR446(root);
assert.equal(audit.ok,true,JSON.stringify(audit.missing));
assert.doesNotThrow(()=>assertPostCatalogConvergenceR446(root));

fs.writeFileSync(path.join(root,'src/modules/squad-mapping/SquadMappingCenter.tsx'),center
  .replace('Pausar após esta carta','')
  .replace('Selecionar esta versão','')
  .replace('Atualizar catálogo','')
  .replace('actionR442.canGenerate',''),'utf8');
audit=auditPostCatalogConvergenceR446(root);
assert.equal(audit.ok,false);
assert.ok(audit.missing.includes('R437 pausa segura'));
assert.ok(audit.missing.includes('R439 seleção manual'));
assert.ok(audit.missing.includes('R441 sync catálogo'));
assert.ok(audit.missing.includes('R442 geração após posse'));
assert.throws(()=>assertPostCatalogConvergenceR446(root),/contratos pós-catálogo incompletos \(4\)/);



const patchRoot=fs.mkdtempSync(path.join(os.tmpdir(),'r446-patchers-'));
const patchTargets=[
  ['scripts/apply-r437-resumable-roster-import.mjs','applyR437ResumableRosterImport','R437_RESUMABLE_ROSTER_IMPORT_VERSION'],
  ['scripts/apply-r438-master-card-catalog.mjs','applyR438MasterCardCatalog','R438_MASTER_CARD_CATALOG_VERSION'],
  ['scripts/apply-r439-intelligent-card-resolver.mjs','applyR439IntelligentCardResolver','R439_INTELLIGENT_CARD_RESOLVER_VERSION'],
  ['scripts/apply-r440-visual-card-identity.mjs','applyR440VisualCardIdentity','R440_VISUAL_CARD_IDENTITY_VERSION'],
  ['scripts/apply-r441-catalog-sync-print-vault.mjs','applyR441CatalogSyncPrintVault','R441_CATALOG_SYNC_PRINT_VAULT_VERSION'],
  ['scripts/apply-r442-known-catalog-acquisition.mjs','applyR442KnownCatalogAcquisition','R442_KNOWN_CATALOG_ACQUISITION_VERSION'],
];
for(const [file,fn,version] of patchTargets){
  const target=path.join(patchRoot,file);fs.mkdirSync(path.dirname(target),{recursive:true});
  fs.writeFileSync(target,`const ${version}='v';\nfunction validate(root){if(!root)throw new Error('bad')}\nexport function ${fn}(rootDirectory = process.cwd()) {\n  const root = path.resolve(rootDirectory);\n  const patched=[];\n  validate(root);\n  return { changed: patched.length > 0, patched, version: ${version} };\n}\n`,'utf8');
}
fs.writeFileSync(path.join(patchRoot,'package.json'),JSON.stringify({scripts:{'test:r200':'npm run typecheck:r151'}},null,2)+'\n','utf8');
const patchedOnce=applyPostCatalogForwardIdempotenceR446(patchRoot);
assert.equal(patchedOnce.changed,true);
assert.equal(patchedOnce.patched.length,7);
for(const [file] of patchTargets){
  const source=fs.readFileSync(path.join(patchRoot,file),'utf8');
  assert.match(source,/R446_FORWARD_IDEMPOTENCE/);
  assert.match(source,/try \{ validate\(root\); return \{ changed: false, patched: \[\], version:/);
}
const patchedTwice=applyPostCatalogForwardIdempotenceR446(patchRoot);
assert.equal(patchedTwice.changed,false);
assert.equal(patchedTwice.patched.length,0);
const patchedPkg=JSON.parse(fs.readFileSync(path.join(patchRoot,'package.json'),'utf8'));
assert.match(patchedPkg.scripts['test:r200'],/v40-80-r446-post-catalog-convergence-regression\.mjs/);
assert.equal((patchedPkg.scripts['test:r200'].match(/v40-80-r446-post-catalog-convergence-regression\.mjs/g)||[]).length,1);


const sanitizeSource=fs.readFileSync(path.resolve(path.dirname(new URL(import.meta.url).pathname),'../scripts/sanitize-update-source.mjs'),'utf8');
assert.match(sanitizeSource,/applyPostCatalogForwardIdempotenceR446/);
assert.match(sanitizeSource,/const r446=applyPostCatalogForwardIdempotenceR446\(root\)/);

console.log('R446 aprovada: auditoria consolidada + patchers R437→R442 forward-idempotentes e sanitizer protegido.');
