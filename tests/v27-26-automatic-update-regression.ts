import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  APP_NATIVE_VERSION,
  APP_RELEASE_VERSION,
  DEFAULT_UPDATE_PRIMARY_URL,
  isTrustedManifestUrl,
  type AppUpdateManifest
} from '../src/lib/appUpdates';
import { chooseBestUpdateCandidate, type UpdateManifestCandidate } from '../src/lib/updateChannel';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8')) as { version: string; scripts: Record<string, string> };
const workflow = fs.readFileSync('.github/workflows/build-apk.yml', 'utf8');
const panel = fs.readFileSync('src/components/UpdateCenterPanel.tsx', 'utf8');
const app = fs.readFileSync('src/components/CardVisionApp.tsx', 'utf8');
const channel = fs.readFileSync('src/lib/updateChannel.ts', 'utf8');
const nativeInstaller = fs.readFileSync('scripts/install-android-security-plugin.mjs', 'utf8');

assert.equal(pkg.version, '27.27.0');
assert.equal(APP_RELEASE_VERSION, '27.27.0');
assert.equal(APP_NATIVE_VERSION, '27.27.0');
assert.match(pkg.scripts['test:all'], /^npm run test:v2727 && npm run test:v2726 &&/);

assert.equal(isTrustedManifestUrl(DEFAULT_UPDATE_PRIMARY_URL), true);
assert.equal(
  isTrustedManifestUrl('https://raw.githubusercontent.com/outro/repo/buildmaster-update/update-manifest.json'),
  false
);

function manifest(version: string, versionCode: number, releaseTag: string): AppUpdateManifest {
  const assetName = `BuildMaster-Elite-Tatico-v${version}-${versionCode}01-abcdef12.apk`;
  return {
    schemaVersion: 2,
    appId: 'com.buildmaster.elitetatico',
    version,
    versionCode,
    buildId: `${versionCode}-build`,
    publishedAt: new Date(versionCode * 1000).toISOString(),
    channel: 'stable',
    updateType: 'apk',
    apkUrl: `https://github.com/canalescanorff6-source/buildmaster-elite-mobile/releases/download/${releaseTag}/${assetName}`,
    notes: [],
    mandatory: true,
    checksum: 'a'.repeat(64),
    sizeBytes: 1_000_000,
    releaseTag,
    assetName
  };
}

const stale: UpdateManifestCandidate = {
  payload: {},
  manifest: manifest('27.25.0', 1_352_500_001, 'buildmaster-v27.25.0-1352500001-01'),
  source: 'legacy-manifest',
  endpoint: 'legacy'
};
const newest: UpdateManifestCandidate = {
  payload: {},
  manifest: manifest('27.27.0', 1_376_000_011, 'buildmaster-v27.27.0-1376000011-01'),
  source: 'primary-channel',
  endpoint: 'primary'
};
assert.equal(chooseBestUpdateCandidate([stale, newest])?.manifest.versionCode, newest.manifest.versionCode);
assert.equal(chooseBestUpdateCandidate([newest, stale])?.manifest.versionCode, newest.manifest.versionCode);

assert.match(channel, /Promise\.all\(jobs\)/);
assert.match(channel, /chooseBestUpdateCandidate/);
assert.match(channel, /candidate\.manifest\.versionCode < selected\.manifest\.versionCode/);

assert.match(panel, /AUTO_INSTALL_KEY/);
assert.match(panel, /downloadVerifyAndInstallApk/);
assert.match(panel, /Baixar e abrir o instalador automaticamente/);
assert.match(panel, /buildmaster:auto-update-status/);
assert.match(panel, /A cópia extra de recuperação falhou, mas a atualização continuará/);

assert.match(app, /<UpdateAutoChecker onPrepareBackup=\{prepareBackupForUpdate\} \/>/);
assert.match(app, /runtimePut\('builds', 'update-recovery'/);
assert.doesNotMatch(app, /prepareBackupForUpdate\(\)[\s\S]{0,160}exportPlayersBackup\('update'\)/);

assert.match(workflow, /buildmaster-update/);
assert.ok(workflow.includes('$LEGACY_FINAL_APK_URL&finalVerify='), 'a URL da ponte já possui publication e deve acrescentar finalVerify com &');
assert.ok(!workflow.includes('$LEGACY_FINAL_APK_URL?finalVerify='), 'não pode iniciar uma segunda query string no APK latest');
assert.match(workflow, /raw\.githubusercontent\.com/);
assert.match(workflow, /gh api --method PUT/);
assert.match(workflow, /Validar canal independente publicamente/);
assert.match(workflow, /Validar a ponte automática da v27\.00/);
assert.match(workflow, /releases\/latest/);
assert.match(workflow, /version_code = major \* 50_000_000 \+ minor \* 1_000_000/);
assert.equal(fs.existsSync('public/update-manifest.json'), false, 'Manifesto placeholder antigo não pode ser empacotado no APK.');

assert.match(nativeInstaller, /SHA-256 do APK não confere/);
assert.match(nativeInstaller, /getPackageArchiveInfo/);
assert.match(nativeInstaller, /hasSigningCertificate/);
assert.match(nativeInstaller, /BuildMaster-Elite-Tatico-Updater\/27\.27 Android/);
assert.doesNotMatch(nativeInstaller, /instalação manual única/i);
assert.match(nativeInstaller, /if \(apk != null\) apk\.delete\(\);/, 'APK rejeitado deve ser apagado inclusive quando a assinatura divergir.');

console.log('✓ v27.27: seleção do maior versionCode, três canais, cópia local e abertura automática do instalador aprovados.');
