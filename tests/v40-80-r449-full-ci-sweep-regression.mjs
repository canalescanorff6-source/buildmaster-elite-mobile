import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const sourceVault = read('src/modules/master-catalog/cardSourceVaultR441.ts');
const syncRuntime = read('src/modules/master-catalog/masterCatalogSyncRuntimeR441.ts');
const printRuntime = read('src/modules/master-catalog/printBackupRuntimeR441.ts');
const printZip = read('src/modules/master-catalog/printBackupZipR441.ts');
const r420 = read('scripts/apply-r420-persistence-recovery-closure.mjs');
const r441 = read('scripts/apply-r441-catalog-sync-print-vault.mjs');
const v3140 = read('tests/v31-40-rigid-adaptive-ocr-regression.ts');
const v3150 = read('tests/v31-50-forensic-scanner-regression.ts');
const v3840 = read('tests/v38-40-squad-mapping-regression.mjs');

assert.match(sourceVault, /arrayBufferForCryptoR449/);
assert.doesNotMatch(sourceVault, /value\.buffer\.slice\(value\.byteOffset/);
assert.match(syncRuntime, /RuntimeBatchOperation\[\]/);
assert.doesNotMatch(syncRuntime, /\{ changed: false, \.\.\.prepared\.plan \}/);
assert.doesNotMatch(syncRuntime, /\{ changed: true, \.\.\.prepared\.plan \}/);
assert.match(printRuntime, /ownedArrayBufferR449/);
assert.doesNotMatch(printRuntime, /new Blob\(\[bytes\]/);
assert.doesNotMatch(printRuntime, /new Blob\(\[data\]/);
assert.match(printZip, /sources: ReadonlyArray</);
assert.doesNotMatch(printZip, /sources: readonly Array</);
assert.match(r420, /\[\^}\]\*\\bLEARNING_KEY/);
assert.match(r441, /R449_FINAL_IMPORT_NORMALIZATION/);
assert.match(r441, /ScanText/);
assert.match(v3140, /databaseVersion >= 6/);
assert.doesNotMatch(v3140, /DB_VERSION = 6/);
assert.match(v3150, /databaseVersion >= 6/);
assert.doesNotMatch(v3150, /DB_VERSION = 6/);
assert.match(v3840, /Meu Elenco — Banco Mestre/);
assert.match(v3840, /teto artificial de 120 cartas não pode voltar/);
assert.doesNotMatch(v3840, /'Mapeamento Inteligente de Elenco'/);

console.log('R449 aprovada: TypeScript R441, backup R420 e regressões históricas v31.40/v31.50/v38.40 convergidos para a arquitetura atual.');
