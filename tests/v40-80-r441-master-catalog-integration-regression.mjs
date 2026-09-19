import assert from 'node:assert/strict';
import fs from 'node:fs';

const patcherPath = new URL('../scripts/apply-r441-catalog-sync-print-vault.mjs', import.meta.url);
assert.ok(fs.existsSync(patcherPath), 'patcher R441 deve existir');
const patcher = fs.readFileSync(patcherPath, 'utf8');
const sourceVault = fs.readFileSync(new URL('../src/modules/master-catalog/cardSourceVaultR441.ts', import.meta.url), 'utf8');
const zip = fs.readFileSync(new URL('../src/modules/master-catalog/printBackupZipR441.ts', import.meta.url), 'utf8');
const sync = fs.readFileSync(new URL('../src/modules/master-catalog/masterCatalogSyncRuntimeR441.ts', import.meta.url), 'utf8');

assert.match(sourceVault, /card-source-images/);
assert.match(sourceVault, /sanitizedBlob/);
assert.match(zip, /manifest\.json/);
assert.match(zip, /CRC/);
assert.match(sync, /runtimeBatchMutate/);
assert.match(sync, /CATALOG_SYNC_PREVIOUS_KEY_R441/);

assert.match(patcher, /storeCardSourceImageR441/);
assert.match(patcher, /findImportedRosterCardBySourceHashR437/);
assert.ok(patcher.indexOf('storeCardSourceImageR441') < patcher.lastIndexOf('findImportedRosterCardBySourceHashR437'), 'original precisa ser salvo antes do skip pré-OCR');
assert.match(patcher, /Refazer ficha com este print/);
assert.match(patcher, /Exportar ZIP/);
assert.match(patcher, /Restaurar ZIP/);
assert.match(patcher, /Verificar atualiza/);
assert.match(patcher, /Atualizar catálogo/);
assert.match(patcher, /Restaurar versão anterior/);
assert.match(patcher, /loadCardSourceFileR441/);
assert.match(patcher, /analyzeSelectedImage\(file\)/);
assert.match(patcher, /card-source-images/);
assert.match(patcher, /runtimeBatchMutate/);
assert.match(patcher, /v40-80-r441-card-source-vault-runtime-regression\.ts/);
assert.match(patcher, /v40-80-r441-print-backup-zip-regression\.ts/);
assert.match(patcher, /v40-80-r441-master-catalog-sync-regression\.ts/);

console.log('R441 integração aprovada: original permanente, ZIP, releitura e sync/rollback ligados ao fluxo cumulativo.');
