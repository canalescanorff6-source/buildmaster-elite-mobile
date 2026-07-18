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

assert.equal(pkg.version, '27.26.0');
assert.equal(APP_RELEASE_VERSION, '27.26.0');
assert.equal(APP_NATIVE_VERSION, '27.26.0');
assert.match(pkg.scripts['test:all'], /test:v2725/);
assert.equal(isTrustedManifestUrl(DEFAULT_UPDATE_MANIFEST_URL), true);
assert.equal(isTrustedReleaseApiUrl(DEFAULT_UPDATE_RELEASE_API_URL), true);

assert.match(channel, /primary-channel/);
assert.match(channel, /legacy-manifest/);
assert.match(channel, /release-api/);
assert.match(channel, /chooseBestUpdateCandidate/);
assert.match(panel, /Canal principal independente/);
assert.match(panel, /Ponte para versões antigas/);

assert.match(workflow, /Gerar APK v27\.26 e publicar atualização automática em três canais/);
assert.match(workflow, /legacy\['releaseTag'\] = release_tag/);
assert.match(workflow, /releases\/download\/\{release_tag\}\/\{asset_name\}/);
assert.doesNotMatch(workflow, /gh release upload buildmaster-latest "dist-apk\/\$APK_ASSET_NAME"/);
assert.match(workflow, /A release fixa guarda somente o manifesto ativo/);
assert.match(workflow, /Validar canal independente publicamente/);
assert.match(workflow, /Validar a ponte automática da v27\.00/);
assert.match(workflow, /API releases\/latest/);

console.log('✓ v27.26: canal fixo direto como rota principal, APK imutável único e API Latest como reserva aprovados.');
