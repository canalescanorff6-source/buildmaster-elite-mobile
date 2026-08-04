import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');

const bridge = read('src/lib/nativeVaultStorage.ts');
const history = read('src/modules/vault/cardHistoryStore.ts');
const resultUi = read('src/components/result/ResultWorkspace.tsx');
const runtime = read('src/components/AppRuntimeStatus.tsx');
const installer = read('scripts/install-native-vault-storage-plugin.mjs');
const directWorkflow = read('.github/workflows/build-apk.yml');
const playWorkflow = read('.github/workflows/build-play-store.yml');

for (const marker of ['BuildMasterVaultStorage', 'nativeVaultWrite', 'nativeVaultRead', 'Capacitor.isNativePlatform']) {
  assert.ok(bridge.includes(marker), `ponte nativa sem ${marker}`);
}
for (const marker of ['getContext().getFilesDir()', 'BufferedOutputStream', 'getFD().sync()', 'MAX_VALUE_BYTES', 'RESERVED_FREE_BYTES']) {
  assert.ok(installer.includes(marker), `plugin de memória interna sem ${marker}`);
}
assert.ok(directWorkflow.includes('install-native-vault-storage-plugin.mjs'));
assert.ok(playWorkflow.includes('install-native-vault-storage-plugin.mjs'));
assert.ok(history.includes("backend: 'native-internal'"));
assert.ok(history.includes('compactHistoryForNativeStorage'));
assert.ok(history.includes('historyPersistenceQueue'), 'gravações sucessivas precisam ser serializadas para evitar sobrescrita fora de ordem');
assert.ok(history.includes('fullPreview: null'));
assert.ok(history.indexOf('nativeVaultWrite') < history.indexOf('writeIndexedHistory(compactHistoryForNativeStorage(next))'), 'Cofre nativo deve ser a rota principal no APK');
assert.ok(resultUi.includes('Salvar para revisar'));
assert.ok(!resultUi.includes("disabled={!result.validation.canGenerate}"), 'alertas de OCR não podem impedir o salvamento para revisão');
assert.ok(runtime.includes("detail.operation !== 'write'"));
assert.ok(!runtime.includes('O aparelho bloqueou ou ficou sem espaço para salvar uma preferência.'));

const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'buildmaster-native-vault-'));
try {
  const javaDir = path.join(temporary, 'android/app/src/main/java/com/buildmaster/elitetatico');
  fs.mkdirSync(javaDir, { recursive: true });
  fs.writeFileSync(path.join(javaDir, 'MainActivity.java'), `package com.buildmaster.elitetatico;\nimport android.os.Bundle;\nimport com.getcapacitor.BridgeActivity;\npublic class MainActivity extends BridgeActivity { @Override public void onCreate(Bundle savedInstanceState) { registerPlugin(BuildMasterSecurityPlugin.class); super.onCreate(savedInstanceState); } }\n`);
  execFileSync(process.execPath, [path.join(root, 'scripts/install-native-vault-storage-plugin.mjs')], { cwd: temporary, stdio: 'pipe' });
  execFileSync(process.execPath, [path.join(root, 'scripts/install-native-vault-storage-plugin.mjs')], { cwd: temporary, stdio: 'pipe' });
  const main = fs.readFileSync(path.join(javaDir, 'MainActivity.java'), 'utf8');
  const plugin = fs.readFileSync(path.join(javaDir, 'BuildMasterVaultStoragePlugin.java'), 'utf8');
  assert.equal((main.match(/registerPlugin\(BuildMasterVaultStoragePlugin\.class\)/g) || []).length, 1, 'registro nativo deve ser idempotente');
  assert.ok(plugin.includes('getContext().getFilesDir()'));
  assert.ok(plugin.includes('temporary.renameTo(target)'));
} finally {
  fs.rmSync(temporary, { recursive: true, force: true });
}

console.log('Hotfix de armazenamento aprovado: fichas salvam para revisão e o Cofre usa a memória interna privada do APK.');
