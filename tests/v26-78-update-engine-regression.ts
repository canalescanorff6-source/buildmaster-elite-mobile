import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  APP_NATIVE_VERSION,
  APP_RELEASE_VERSION,
  evaluateUpdateManifest,
  isTrustedApkUrl,
  validateUpdateManifest
} from '../src/lib/appUpdates';

assert.equal(APP_RELEASE_VERSION, '27.33.0');
assert.equal(APP_NATIVE_VERSION, '27.33.0');

const apkUrl = 'https://github.com/canalescanorff6-source/buildmaster-elite-mobile/releases/download/buildmaster-latest/BuildMaster-Elite-Tatico-v27.29.0-1352300042-abcdef12.apk';
assert.equal(isTrustedApkUrl(apkUrl), true);
const immutableUrl = 'https://github.com/canalescanorff6-source/buildmaster-elite-mobile/releases/download/buildmaster-v27.29.0-1352300042-01/BuildMaster-Elite-Tatico-v27.29.0-135230004201-abcdef12.apk';
assert.equal(isTrustedApkUrl(immutableUrl), true);
const bridgeUrl = 'https://github.com/canalescanorff6-source/buildmaster-elite-mobile/releases/download/buildmaster-latest/BuildMaster-Elite-Tatico-latest.apk?build=abcdef12&code=1352300042';
assert.equal(isTrustedApkUrl(bridgeUrl), true);

assert.equal(isTrustedApkUrl('https://evil.example/BuildMaster.apk'), false);
assert.equal(isTrustedApkUrl('https://github.com/canalescanorff6-source/buildmaster-elite-mobile/releases/download/outra-tag/BuildMaster-Elite-Tatico-v27.29.0-1352300042-abcdef12.apk'), false);

const manifest = {
  appId: 'com.buildmaster.elitetatico' as const,
  version: '27.33.0',
  versionCode: 1352300042,
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
assert.equal(evaluateUpdateManifest(manifest, { versionName: '27.33.0', versionCode: 1350900010 }, 'old').available, true);
assert.equal(evaluateUpdateManifest({ ...manifest, version: '27.33.0', versionCode: 1350900010 }, { versionName: '27.33.0', versionCode: 1350900010 }, 'abcdef123456').available, false);
assert.equal(evaluateUpdateManifest({ ...manifest, versionCode: 1350809999 }, { versionName: '27.33.0', versionCode: 1350900010 }, 'old').available, false);

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
assert.match(workflow, /\?publication=/);
assert.match(workflow, /sizeBytes/);
assert.match(workflow, /Validar release imutável publicamente/);
assert.match(workflow, /Validar ponte legacy completa/);
assert.match(workflow, /ANDROID_SIGNING_BUNDLE é obrigatório/);
assert.doesNotMatch(workflow, /assembleDebug/);

console.log('✓ v27.29: detecção, versionCode, APK único, progresso, permissão, SHA-256, pacote e assinatura validados.');
