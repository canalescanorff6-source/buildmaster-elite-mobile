import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  APP_NATIVE_VERSION,
  APP_RELEASE_VERSION,
  evaluateUpdateManifest,
  isTrustedApkUrl,
  validateUpdateManifest
} from '../src/lib/appUpdates';

assert.equal(APP_RELEASE_VERSION, '26.78.0');
assert.equal(APP_NATIVE_VERSION, '26.78.0');

const apkUrl = 'https://github.com/canalescanorff6-source/buildmaster-elite-mobile/releases/download/buildmaster-latest/BuildMaster-Elite-Tatico-v26.79.0-1307900042-abcdef12.apk';
assert.equal(isTrustedApkUrl(apkUrl), true);
const bridgeUrl = 'https://github.com/canalescanorff6-source/buildmaster-elite-mobile/releases/download/buildmaster-latest/BuildMaster-Elite-Tatico-latest.apk?build=abcdef12&code=1307900042';
assert.equal(isTrustedApkUrl(bridgeUrl), true);

assert.equal(isTrustedApkUrl('https://evil.example/BuildMaster.apk'), false);
assert.equal(isTrustedApkUrl('https://github.com/canalescanorff6-source/buildmaster-elite-mobile/releases/download/outra-tag/BuildMaster-Elite-Tatico-v26.79.0-1307900042-abcdef12.apk'), false);

const manifest = {
  appId: 'com.buildmaster.elitetatico' as const,
  version: '26.79.0',
  versionCode: 1307900042,
  buildId: 'abcdef123456',
  publishedAt: new Date().toISOString(),
  channel: 'stable' as const,
  updateType: 'apk' as const,
  apkUrl,
  notes: ['Atualização'],
  mandatory: true,
  minNativeVersion: '26.75.0',
  checksum: 'b'.repeat(64),
  sizeBytes: 31_000_000
};
assert.ok(validateUpdateManifest(manifest));
assert.equal(evaluateUpdateManifest(manifest, { versionName: '26.78.0', versionCode: 1307800010 }, 'old').available, true);
assert.equal(evaluateUpdateManifest({ ...manifest, version: '26.78.0', versionCode: 1307800010 }, { versionName: '26.78.0', versionCode: 1307800010 }, 'abcdef123456').available, false);
assert.equal(evaluateUpdateManifest({ ...manifest, versionCode: 1307709999 }, { versionName: '26.78.0', versionCode: 1307800010 }, 'old').available, false);

const panel = fs.readFileSync('src/components/UpdateCenterPanel.tsx', 'utf8');
const storage = fs.readFileSync('src/lib/secureStorage.ts', 'utf8');
const installer = fs.readFileSync('scripts/install-android-security-plugin.mjs', 'utf8');
const workflow = fs.readFileSync('.github/workflows/build-apk.yml', 'utf8');

assert.match(panel, /visibilitychange/);
assert.match(panel, /window\.addEventListener\('online'/);
assert.match(panel, /onApkDownloadProgress/);
assert.match(panel, /openInstallPermissionSettings/);
assert.match(panel, /expectedVersionCode/);
assert.match(storage, /getAppInstallInfo/);
assert.match(storage, /expectedPackageName/);
assert.match(installer, /canRequestPackageInstalls/);
assert.match(installer, /ACTION_MANAGE_UNKNOWN_APP_SOURCES/);
assert.match(installer, /getPackageArchiveInfo/);
assert.match(installer, /hasSigningCertificate/);
assert.match(installer, /versionCode do APK não confere/);
assert.match(installer, /release-assets\.githubusercontent\.com/);
assert.match(workflow, /APK_ASSET_NAME/);
assert.match(workflow, /BuildMaster-Elite-Tatico-latest\.apk/);
assert.match(workflow, /\?build=/);
assert.match(workflow, /sizeBytes/);
assert.match(workflow, /Verificar release publicada de ponta a ponta/);
assert.match(workflow, /ANDROID_SIGNING_BUNDLE é obrigatório/);
assert.doesNotMatch(workflow, /assembleDebug/);

console.log('✓ v26.78: detecção, versionCode, APK único, progresso, permissão, SHA-256, pacote e assinatura validados.');
