import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  APP_NATIVE_VERSION,
  APP_RELEASE_VERSION,
  DEFAULT_UPDATE_MANIFEST_URL,
  DEFAULT_UPDATE_RELEASE_API_URL,
  isTrustedManifestUrl,
  isTrustedReleaseApiUrl
} from '../src/lib/appUpdates';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8')) as { version: string; scripts: Record<string, string> };
const channel = fs.readFileSync('src/lib/updateChannel.ts', 'utf8');
const workflow = fs.readFileSync('.github/workflows/build-apk.yml', 'utf8');
const panel = fs.readFileSync('src/components/UpdateCenterPanel.tsx', 'utf8');

assert.equal(pkg.version, '27.27.0');
assert.equal(APP_RELEASE_VERSION, '27.27.0');
assert.equal(APP_NATIVE_VERSION, '27.27.0');
assert.match(pkg.scripts['test:all'], /test:v2725/);
assert.equal(isTrustedManifestUrl(DEFAULT_UPDATE_MANIFEST_URL), true);
assert.equal(isTrustedReleaseApiUrl(DEFAULT_UPDATE_RELEASE_API_URL), true);

assert.match(channel, /primary-channel/);
assert.match(channel, /legacy-manifest/);
assert.match(channel, /release-api/);
assert.match(channel, /chooseBestUpdateCandidate/);
assert.match(panel, /Canal principal independente/);
assert.match(panel, /Ponte para versões antigas/);

assert.match(workflow, /Gerar APK v27\.27 e publicar atualização automática em três canais/);
assert.match(workflow, /legacy\['releaseTag'\] = 'buildmaster-latest'/);
assert.match(workflow, /legacy\['assetName'\] = 'BuildMaster-Elite-Tatico-latest\.apk'/);
assert.match(workflow, /releases\/download\/buildmaster-latest\//);
assert.match(workflow, /Publicar BuildMaster-Elite-Tatico-latest\.apk na ponte antiga/);
assert.match(workflow, /Validar publicamente o APK latest antes do manifesto/);
assert.match(workflow, /Validar canal independente publicamente/);
assert.match(workflow, /Validar a ponte automática da v27\.00/);
assert.match(workflow, /API releases\/latest/);

console.log('✓ v27.27: canal imutável moderno e ponte latest compatível com o APK v27.00 aprovados.');
