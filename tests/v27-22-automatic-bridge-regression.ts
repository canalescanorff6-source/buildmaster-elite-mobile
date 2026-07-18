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

assert.equal(pkg.version, '27.24.0');
assert.equal(
  DEFAULT_UPDATE_MANIFEST_URL,
  'https://github.com/canalescanorff6-source/buildmaster-elite-mobile/releases/download/buildmaster-latest/update-manifest.json'
);
assert.equal(isTrustedManifestUrl(DEFAULT_UPDATE_MANIFEST_URL), true);

// O APK v27.00 continua consultando o mesmo manifesto fixo e aceita o nome
// versionado. O manifesto agora pode apontar para a release imutável.
const version = '27.24.0';
const versionCode = 1352400048;
const attempt = 2;
const token = `${versionCode}${String(attempt).padStart(2, '0')}`;
const apkName = `BuildMaster-Elite-Tatico-v${version}-${token}-abcde123.apk`;
const releaseTag = `buildmaster-v${version}-${versionCode}-${String(attempt).padStart(2, '0')}`;
const apkUrl = `https://github.com/canalescanorff6-source/buildmaster-elite-mobile/releases/download/${releaseTag}/${apkName}?bridge=123-2-abcde123&code=${versionCode}`;
assert.match(apkName, /^BuildMaster-Elite-Tatico-v\d+\.\d+\.\d+-\d+-[a-f0-9]{7,12}\.apk$/i);
assert.equal(isTrustedApkUrl(apkUrl), true);
assert.match(oldUpdater, /buildmaster-latest\/update-manifest\.json/);
assert.match(oldUpdater, /BuildMaster-Elite-Tatico-v\\d\+\\\.\\d\+\\\.\\d\+-\\d\+-\[a-f0-9\]/);

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
  notes: ['Canal automático direto'],
  mandatory: true,
  minNativeVersion: '27.0.0',
  checksum: 'a'.repeat(64),
  sizeBytes: 4_000_000,
  releaseTag,
  assetName: apkName
};
assert.ok(validateUpdateManifest(manifest));

const immutableUploadIndex = workflow.indexOf('gh release upload "$RELEASE_TAG"');
const immutableVerifyIndex = workflow.indexOf('Validar release imutável publicamente');
const uploadManifestIndex = workflow.indexOf('gh release upload buildmaster-latest dist-apk/legacy/update-manifest.json --clobber');
const finalVerifyIndex = workflow.indexOf('Validar a ponte automática da v27.00');

assert.ok(immutableUploadIndex > 0, 'O APK precisa ser enviado à release imutável.');
assert.ok(immutableVerifyIndex > immutableUploadIndex, 'O APK imutável precisa ser validado publicamente.');
assert.ok(uploadManifestIndex > immutableVerifyIndex, 'O manifesto fixo só pode ser ativado depois da validação pública.');
assert.ok(finalVerifyIndex > uploadManifestIndex, 'A URL final do manifesto precisa ser testada depois da ativação.');
assert.doesNotMatch(workflow, /gh release upload buildmaster-latest "dist-apk\/\$APK_ASSET_NAME"/);
assert.doesNotMatch(workflow, /gh release delete|gh api[^\n]+-X DELETE[^\n]+assets/);
assert.match(workflow, /legacy\['releaseTag'\] = release_tag/);
assert.match(workflow, /Mesma regra usada pelo APK v27\.00 já instalado/);
assert.match(workflow, /Canal direto aprovado/);

console.log('✓ v27.24: URL fixa da v27.00, APK imutável único e ativação atômica do manifesto aprovados.');
