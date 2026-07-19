import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  APP_NATIVE_VERSION,
  APP_RELEASE_VERSION,
  DEFAULT_UPDATE_MANIFEST_URL,
  DEFAULT_UPDATE_RELEASE_API_URL,
  isTrustedApkUrl,
  isTrustedManifestUrl,
  isTrustedReleaseApiUrl,
  selectManifestAssetFromRelease,
  validateUpdateManifest
} from '../src/lib/appUpdates';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8')) as { version: string };
const workflow = fs.readFileSync('.github/workflows/build-apk.yml', 'utf8');
const panel = fs.readFileSync('src/components/UpdateCenterPanel.tsx', 'utf8');
const channel = fs.readFileSync('src/lib/updateChannel.ts', 'utf8');
const nativePlugin = fs.readFileSync('scripts/install-android-security-plugin.mjs', 'utf8');
const staticBuilder = fs.readFileSync('scripts/build-static.mjs', 'utf8');

assert.equal(pkg.version, '27.27.0');
assert.equal(APP_RELEASE_VERSION, '27.27.0');
assert.equal(APP_NATIVE_VERSION, '27.27.0');
assert.equal(isTrustedReleaseApiUrl(DEFAULT_UPDATE_RELEASE_API_URL), true);
assert.equal(isTrustedManifestUrl(DEFAULT_UPDATE_MANIFEST_URL), true);

const releaseTag = 'buildmaster-v27.27.0-1352300043-01';
const apkName = 'BuildMaster-Elite-Tatico-v27.27.0-135230004301-acde1234.apk';
const manifestName = 'update-manifest-v27.27.0-1352300043.json';
const apkUrl = `https://github.com/canalescanorff6-source/buildmaster-elite-mobile/releases/download/${releaseTag}/${apkName}`;
const manifestUrl = `https://github.com/canalescanorff6-source/buildmaster-elite-mobile/releases/download/${releaseTag}/${manifestName}`;

assert.equal(isTrustedApkUrl(apkUrl), true);
assert.equal(isTrustedManifestUrl(manifestUrl), true);
assert.equal(isTrustedApkUrl(apkUrl.replace(releaseTag, 'buildmaster-v27.27.0-malicioso')), false);
assert.equal(isTrustedManifestUrl(manifestUrl.replace('update-manifest-', 'manifesto-')), false);
assert.equal(isTrustedReleaseApiUrl('https://api.github.com/repos/outro/projeto/releases/latest'), false);

const selected = selectManifestAssetFromRelease({
  tag_name: releaseTag,
  draft: false,
  prerelease: false,
  assets: [
    { name: apkName, browser_download_url: apkUrl },
    { name: manifestName, browser_download_url: manifestUrl }
  ]
});
assert.deepEqual(selected, { url: manifestUrl, tag: releaseTag, assetName: manifestName });
assert.equal(selectManifestAssetFromRelease({ tag_name: releaseTag, draft: true, assets: [] }), null);

const manifest = {
  schemaVersion: 2,
  appId: 'com.buildmaster.elitetatico' as const,
  version: '27.27.0',
  versionCode: 1352300043,
  buildId: 'acde1234acde1234',
  publishedAt: new Date().toISOString(),
  channel: 'stable' as const,
  updateType: 'apk' as const,
  apkUrl,
  notes: ['Atualizador definitivo'],
  mandatory: true,
  minNativeVersion: '27.27.0',
  checksum: 'a'.repeat(64),
  sizeBytes: 4_000_000,
  releaseTag,
  assetName: apkName
};
assert.ok(validateUpdateManifest(manifest));
assert.equal(validateUpdateManifest({ ...manifest, releaseTag: 'buildmaster-latest' }), null);
assert.equal(validateUpdateManifest({ ...manifest, assetName: 'outro.apk' }), null);
assert.equal(validateUpdateManifest({ ...manifest, schemaVersion: 3 }), null);

assert.match(workflow, /RELEASE_TAG=/);
assert.match(workflow, /MANIFEST_ASSET_NAME=/);
assert.match(workflow, /gh release create "\$RELEASE_TAG"[\s\S]*--prerelease/);
assert.match(workflow, /gh release edit "\$RELEASE_TAG" --prerelease=false --latest/);
assert.match(workflow, /api\.github\.com\/repos\/\$GITHUB_REPOSITORY\/releases\/latest/);
assert.match(workflow, /dist-apk\/legacy\/update-manifest\.json/);
assert.match(workflow, /Ponte antiga aprovada|Validar canal independente publicamente/);
assert.match(workflow, /NEXT_PUBLIC_BUILDMASTER_UPDATE_RELEASE_API_URL/);

assert.match(channel, /responseType: 'text'/);
assert.match(channel, /parseJsonPayload/);
assert.match(channel, /selectManifestAssetFromRelease/);
assert.match(channel, /raw\.githubusercontent|três rotas independentes|chooseBestUpdateCandidate/i);
assert.match(panel, /round <= 3/);
assert.match(panel, /Rota atualizada/);

assert.match(nativePlugin, /MAX_DOWNLOAD_ATTEMPTS = 4/);
assert.match(nativePlugin, /assertApkZipHeader/);
assert.match(nativePlugin, /Accept-Encoding", "identity"/);
assert.match(nativePlugin, /FLAG_GRANT_READ_URI_PERMISSION/);
assert.match(nativePlugin, /ACTION_INSTALL_PACKAGE/);
assert.match(nativePlugin, /downloadAttempt <= MAX_DOWNLOAD_ATTEMPTS/);
assert.ok(nativePlugin.includes(String.raw`buildmaster-v\\\\d+`));
assert.match(staticBuilder, /restoreInterruptedBuild/);
assert.doesNotMatch(staticBuilder, /--webpack/);

console.log('✓ v27.27: canal direto, release imutável, API reserva, quatro tentativas e instalador reforçado aprovados.');
