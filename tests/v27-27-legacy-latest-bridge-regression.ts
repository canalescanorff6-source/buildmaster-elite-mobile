import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  APP_RELEASE_VERSION,
  DEFAULT_UPDATE_MANIFEST_URL,
  isTrustedApkUrl,
  validateUpdateManifest
} from '../src/lib/appUpdates';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8')) as { version: string; scripts: Record<string, string> };
const workflow = fs.readFileSync('.github/workflows/build-apk.yml', 'utf8');

assert.equal(pkg.version, '27.33.0');
assert.equal(APP_RELEASE_VERSION, '27.33.0');
assert.match(pkg.scripts['test:all'], /^npm run test:v2733 && npm run test:v2729 && npm run quality:audit && npm run test:v2728 && npm run test:v2727 &&/);
assert.equal(
  DEFAULT_UPDATE_MANIFEST_URL,
  'https://github.com/canalescanorff6-source/buildmaster-elite-mobile/releases/download/buildmaster-latest/update-manifest.json'
);

const apkUrl = 'https://github.com/canalescanorff6-source/buildmaster-elite-mobile/releases/download/buildmaster-latest/BuildMaster-Elite-Tatico-latest.apk?publication=29650483736-1-02a4b2f&code=1377000001';
assert.equal(isTrustedApkUrl(apkUrl), true);
assert.equal(isTrustedApkUrl(apkUrl.replace('/buildmaster-latest/', '/buildmaster-v27.29.0-1377000001-01/')), true);

const oldCompatibleManifest = {
  schemaVersion: 2,
  appId: 'com.buildmaster.elitetatico',
  version: '27.33.0',
  versionCode: 1_377_000_001,
  buildId: '02a4b2f-1',
  publishedAt: new Date().toISOString(),
  channel: 'stable',
  updateType: 'apk',
  apkUrl,
  notes: [],
  mandatory: true,
  minNativeVersion: '27.0.0',
  checksum: 'a'.repeat(64),
  sizeBytes: 3_900_000,
  releaseTag: 'buildmaster-latest',
  assetName: 'BuildMaster-Elite-Tatico-latest.apk'
};
assert.ok(validateUpdateManifest(oldCompatibleManifest));

assert.match(workflow, /legacy\['releaseTag'\] = 'buildmaster-latest'/);
assert.match(workflow, /legacy\['assetName'\] = 'BuildMaster-Elite-Tatico-latest\.apk'/);
assert.match(workflow, /BuildMaster-Elite-Tatico-latest\.apk\?publication=/);
assert.match(workflow, /gh release delete-asset buildmaster-latest BuildMaster-Elite-Tatico-latest\.apk -y/);
assert.match(workflow, /gh release upload buildmaster-latest dist-apk\/BuildMaster-Elite-Tatico-latest\.apk/);
assert.match(workflow, /Validar cópia latest antes do manifesto legado/);
assert.match(workflow, /gh release upload buildmaster-latest dist-apk\/legacy\/update-manifest\.json --clobber/);

const publishApk = workflow.indexOf('Atualizar cópia latest para versões muito antigas');
const verifyApk = workflow.indexOf('Validar cópia latest antes do manifesto legado');
const publishManifest = workflow.indexOf('Ativar manifesto legado por último');
assert.ok(publishApk > 0 && verifyApk > publishApk && publishManifest > verifyApk);

console.log('✓ v27.29: BuildMaster-Elite-Tatico-latest.apk publicado, validado e ativado antes do manifesto da v27.00.');
