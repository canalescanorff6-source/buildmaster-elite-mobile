import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  DEFAULT_UPDATE_MANIFEST_URL,
  isTrustedApkUrl,
  isTrustedManifestUrl,
  validateUpdateManifest
} from '../src/lib/appUpdates';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8')) as { version: string };
const workflow = fs.readFileSync('.github/workflows/build-apk.yml', 'utf8');
const oldUpdater = fs.readFileSync('tests/fixtures/v27-00-updater-contract.txt', 'utf8');

assert.equal(pkg.version, '27.40.0');
assert.equal(
  DEFAULT_UPDATE_MANIFEST_URL,
  'https://github.com/canalescanorff6-source/buildmaster-elite-mobile/releases/download/buildmaster-latest/update-manifest.json'
);
assert.equal(isTrustedManifestUrl(DEFAULT_UPDATE_MANIFEST_URL), true);

const version = '27.40.0';
const versionCode = 1_377_000_001;
const apkName = 'BuildMaster-Elite-Tatico-latest.apk';
const releaseTag = 'buildmaster-latest';
const apkUrl = `https://github.com/canalescanorff6-source/buildmaster-elite-mobile/releases/download/${releaseTag}/${apkName}?publication=123-2-abcde123&code=${versionCode}`;

assert.equal(isTrustedApkUrl(apkUrl), true);
assert.match(oldUpdater, /buildmaster-latest\/update-manifest\.json/);
assert.match(oldUpdater, /BuildMaster-Elite-Tatico-latest\.apk/);
assert.match(oldUpdater, /APK também precisa estar na tag buildmaster-latest/);

const manifest = {
  schemaVersion: 2,
  appId: 'com.buildmaster.elitetatico' as const,
  version,
  versionCode,
  buildId: 'abcde123-2',
  publishedAt: new Date().toISOString(),
  channel: 'stable' as const,
  updateType: 'apk' as const,
  apkUrl,
  notes: ['Ponte automática compatível'],
  mandatory: true,
  minNativeVersion: '27.0.0',
  checksum: 'a'.repeat(64),
  sizeBytes: 4_000_000,
  releaseTag,
  assetName: apkName
};
assert.ok(validateUpdateManifest(manifest));

const immutableVerifyIndex = workflow.indexOf('Validar release imutável publicamente');
const publishLatestIndex = workflow.indexOf('Atualizar cópia latest para versões muito antigas');
const verifyLatestIndex = workflow.indexOf('Validar cópia latest antes do manifesto legado');
const uploadManifestIndex = workflow.indexOf('gh release upload buildmaster-latest dist-apk/legacy/update-manifest.json --clobber');
const finalVerifyIndex = workflow.indexOf('Validar ponte legacy completa');

assert.ok(immutableVerifyIndex > 0, 'O APK imutável precisa ser verificado primeiro.');
assert.ok(publishLatestIndex > immutableVerifyIndex, 'A cópia latest só pode ser publicada depois da validação imutável.');
assert.ok(verifyLatestIndex > publishLatestIndex, 'A cópia latest precisa ser baixada e conferida.');
assert.ok(uploadManifestIndex > verifyLatestIndex, 'O manifesto antigo só pode ser ativado após a cópia latest estar correta.');
assert.ok(finalVerifyIndex > uploadManifestIndex, 'A ponte final precisa ser testada após a ativação do manifesto.');
assert.match(workflow, /gh release delete-asset buildmaster-latest BuildMaster-Elite-Tatico-latest\.apk/);
assert.match(workflow, /legacy\['releaseTag'\] = 'buildmaster-latest'/);
assert.match(workflow, /legacy\['assetName'\] = 'BuildMaster-Elite-Tatico-latest\.apk'/);
assert.match(oldUpdater, /Contrato real do APK v27\.00/);

console.log('✓ v27.29: contrato da v27.00 restaurado com release e APK em buildmaster-latest.');
