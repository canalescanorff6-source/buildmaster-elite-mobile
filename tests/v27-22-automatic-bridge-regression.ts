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

assert.equal(pkg.version, '27.22.0');
assert.equal(
  DEFAULT_UPDATE_MANIFEST_URL,
  'https://github.com/canalescanorff6-source/buildmaster-elite-mobile/releases/download/buildmaster-latest/update-manifest.json'
);
assert.equal(isTrustedManifestUrl(DEFAULT_UPDATE_MANIFEST_URL), true);

// Contrato real aceito pelo APK v27.00 já instalado.
const version = '27.22.0';
const versionCode = 1352200048;
const attempt = 2;
const token = `${versionCode}${String(attempt).padStart(2, '0')}`;
const apkName = `BuildMaster-Elite-Tatico-v${version}-${token}-abcde123.apk`;
const apkUrl = `https://github.com/canalescanorff6-source/buildmaster-elite-mobile/releases/download/buildmaster-latest/${apkName}?publication=123-2-abcde123&code=${versionCode}`;
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
  notes: ['Ponte automática'],
  mandatory: true,
  minNativeVersion: '27.0.0',
  checksum: 'a'.repeat(64),
  sizeBytes: 4_000_000,
  releaseTag: 'buildmaster-latest',
  assetName: apkName
};
assert.ok(validateUpdateManifest(manifest));

const uploadApkIndex = workflow.indexOf('gh release upload buildmaster-latest "dist-apk/$APK_ASSET_NAME"');
const verifyBeforeManifestIndex = workflow.indexOf('Validar APK do canal antigo antes de trocar o manifesto');
const uploadManifestIndex = workflow.indexOf('gh release upload buildmaster-latest dist-apk/legacy/update-manifest.json --clobber');
const finalVerifyIndex = workflow.indexOf('Validar a ponte automática da v27.00');

assert.ok(uploadApkIndex > 0, 'O APK único precisa ser enviado ao canal antigo.');
assert.ok(verifyBeforeManifestIndex > uploadApkIndex, 'O APK público precisa ser validado depois do upload.');
assert.ok(uploadManifestIndex > verifyBeforeManifestIndex, 'O manifesto só pode ser ativado depois de validar o APK público.');
assert.ok(finalVerifyIndex > uploadManifestIndex, 'O conjunto final precisa ser testado depois da ativação.');

assert.doesNotMatch(
  workflow,
  /gh release upload buildmaster-latest[^\n]*\$APK_ASSET_NAME[^\n]*--clobber/,
  'O APK versionado nunca pode ser sobrescrito.'
);
assert.doesNotMatch(
  workflow,
  /gh release delete|gh api[^\n]+-X DELETE[^\n]+assets/,
  'APKs históricos não podem ser apagados porque manifestos em cache dependem deles.'
);
assert.doesNotMatch(
  workflow,
  /legacy\['apkUrl'\][\s\S]{0,250}BuildMaster-Elite-Tatico-latest\.apk/,
  'O manifesto antigo não pode apontar para o alias mutável latest.apk.'
);
assert.match(workflow, /O APK do canal antigo não foi validado; o manifesto antigo foi mantido/);
assert.match(workflow, /Mesma regra usada pelo APK v27\.00 já instalado/);
assert.match(workflow, /Ponte automática aprovada/);

console.log('✓ v27.22: ponte automática da v27.00, publicação atômica e APK histórico imutável aprovados.');
