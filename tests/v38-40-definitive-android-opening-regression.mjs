import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

const cacheRecovery = read('src/lib/nativeWebCacheRecoveryV3840.ts');
assert.match(cacheRecovery, /CURRENT_BUILD_ID/);
assert.match(cacheRecovery, /native-web-cache-v2/);
assert.match(cacheRecovery, /getRegistrations/);
assert.match(cacheRecovery, /registration\.unregister/);
assert.match(cacheRecovery, /caches\.keys/);
assert.match(cacheRecovery, /caches\.delete/);
assert.match(cacheRecovery, /sessionStorage\.getItem/);
assert.match(cacheRecovery, /location\.replace/);

const register = read('src/components/RegisterServiceWorker.tsx');
assert.match(register, /nativeCacheSchemaIsCurrentV3840/);
assert.match(register, /refreshNativeWebRuntimeOnceV3840\('new-build'\)/);
assert.doesNotMatch(register, /const NATIVE_CACHE_SCHEMA = '38\.40\.0-background/);

const routeError = read('src/app/error.tsx');
const globalError = read('src/app/global-error.tsx');
assert.match(routeError, /refreshNativeWebRuntimeOnceV3840\('route-error'\)/);
assert.match(routeError, /clearNativeWebCachesV3840/);
assert.match(globalError, /refreshNativeWebRuntimeOnceV3840\('global-error'\)/);
assert.match(globalError, /clearNativeWebCachesV3840/);

const layout = read('src/app/layout.tsx');
assert.match(layout, /OptionalRuntimeBoundary/);
assert.ok((layout.match(/<OptionalRuntimeBoundary/g) ?? []).length >= 8);

const history = read('src/modules/vault/cardHistoryStore.ts');
assert.match(history, /Uma ficha incompatível foi isolada/);
assert.match(history, /typeof parsed\.playerName !== 'string'/);
assert.match(history, /isStringArray\(item\.recommendedSkills\)/);
assert.match(history, /Entrada defeituosa do Cofre ignorada/);

const installer = read('scripts/install-android-security-plugin.mjs');
const mainStart = installer.indexOf('const mainActivity = `');
const mainEnd = installer.indexOf('`;\n\nconst plugin', mainStart);
assert.ok(mainStart >= 0 && mainEnd > mainStart);
const mainTemplate = installer.slice(mainStart, mainEnd);
assert.match(mainTemplate, /currentVersionCode/);
assert.match(mainTemplate, /WEB_CACHE_VERSION/);
assert.match(mainTemplate, /clearCache\(true\)/);
assert.match(mainTemplate, /clearHistory\(\)/);
assert.match(mainTemplate, /WebSettings\.LOAD_NO_CACHE/);
assert.match(mainTemplate, /webView\.reload\(\)/);
assert.match(mainTemplate, /registerPlugin\(BuildMasterSecurityPlugin\.class\)/);
assert.doesNotMatch(mainTemplate, /WebStorage\.getInstance\(\)\.deleteAllData/);
assert.doesNotMatch(mainTemplate, /clearFormData/);
assert.doesNotMatch(mainTemplate, /CookieManager/);

const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'buildmaster-native-cache-'));
try {
  const manifest = path.join(temporaryRoot, 'android/app/src/main/AndroidManifest.xml');
  fs.mkdirSync(path.dirname(manifest), { recursive: true });
  fs.writeFileSync(
    manifest,
    '<manifest xmlns:android="http://schemas.android.com/apk/res/android"><application android:allowBackup="true"></application></manifest>',
    'utf8'
  );

  const result = spawnSync(process.execPath, [path.join(root, 'scripts/install-android-security-plugin.mjs')], {
    cwd: temporaryRoot,
    encoding: 'utf8'
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);

  for (const followUpInstaller of [
    'scripts/install-match-recorder-plugin.mjs',
    'scripts/install-native-vault-storage-plugin.mjs'
  ]) {
    const followUp = spawnSync(process.execPath, [path.join(root, followUpInstaller)], {
      cwd: temporaryRoot,
      encoding: 'utf8'
    });
    assert.equal(followUp.status, 0, followUp.stderr || followUp.stdout);
  }

  const generatedMain = fs.readFileSync(
    path.join(temporaryRoot, 'android/app/src/main/java/com/buildmaster/elitetatico/MainActivity.java'),
    'utf8'
  );
  assert.match(generatedMain, /clearCache\(true\)/);
  assert.match(generatedMain, /LOAD_NO_CACHE/);
  assert.match(generatedMain, /shouldRefreshWebCache/);
  assert.match(generatedMain, /registerPlugin\(BuildMasterSecurityPlugin\.class\)/);
  assert.match(generatedMain, /registerPlugin\(BuildMasterMatchRecorderPlugin\.class\)/);
  assert.match(generatedMain, /registerPlugin\(BuildMasterVaultStoragePlugin\.class\)/);
  assert.match(generatedMain, /super\.onCreate\(savedInstanceState\)/);
} finally {
  fs.rmSync(temporaryRoot, { recursive: true, force: true });
}

console.log('v38.40 abertura Android definitiva: cache por build, recuperação automática, isolamento opcional e Cofre defensivo aprovados.');
