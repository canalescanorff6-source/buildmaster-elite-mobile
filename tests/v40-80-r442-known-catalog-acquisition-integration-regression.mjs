import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const patcherPath = path.join(root, 'scripts/apply-r442-known-catalog-acquisition.mjs');
assert.ok(fs.existsSync(patcherPath), 'patcher R442 deve existir');
const patcher = fs.readFileSync(patcherPath, 'utf8');
const moduleSource = fs.readFileSync(path.join(root, 'src/modules/card-catalog/knownCatalogAcquisitionR442.ts'), 'utf8');

assert.match(moduleSource, /knownCatalogCardActionR442/);
assert.match(moduleSource, /addKnownCatalogCardToMappingR442/);
assert.match(moduleSource, /knownCatalogEditionLabelR442/);
assert.match(patcher, /await setOwnedCardR438\(card\.catalogCardId\)/, 'posse deve ser persistida antes de liberar geração');
assert.match(patcher, /Adicionar ao Meu Elenco/, 'carta não possuída deve expor CTA de aquisição');
assert.match(patcher, /actionR442\.canAdd/, 'CTA adicionar deve respeitar gate');
assert.match(patcher, /actionR442\.canGenerate/, 'CTA gerar deve respeitar posse + completude');
assert.match(patcher, /actionR442\.needsReview/, 'carta incompleta deve continuar bloqueada para geração');
assert.match(patcher, /knownCatalogEditionLabelR442/, 'UI deve mostrar metadados da edição');
assert.match(patcher, /v40-80-r442-known-catalog-acquisition-runtime-regression\.ts/);
assert.match(patcher, /v40-80-r442-known-catalog-acquisition-integration-regression\.mjs/);

const centerPath = path.join(root, 'src/modules/squad-mapping/SquadMappingCenter.tsx');
if (fs.existsSync(centerPath)) {
  const center = fs.readFileSync(centerPath, 'utf8');
  assert.match(center, /knownCatalogCardActionR442/);
  assert.match(center, /async function addKnownCatalogCardR442\(/);
  assert.match(center, /Adicionar ao Meu Elenco/);
  assert.match(center, /actionR442\.canGenerate/);
  assert.doesNotMatch(center, /disabled=\{card\.completeness !== 'COMPLETE'\}[^\n]*onClick=\{\(\) => onGenerateMasterCard\(card\)\}/, 'R438 antigo não pode permanecer como regra final');
}

console.log('R442 integração aprovada: Catálogo Geral exige adicionar ao Meu Elenco antes de liberar ficha sem OCR.');
