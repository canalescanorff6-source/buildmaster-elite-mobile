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

assert.equal(pkg.version, '27.24.0');
assert.equal(APP_RELEASE_VERSION, '27.24.0');
assert.equal(APP_NATIVE_VERSION, '27.24.0');
assert.match(pkg.scripts['test:all'], /test:v2724/);
assert.equal(isTrustedManifestUrl(DEFAULT_UPDATE_MANIFEST_URL), true);
assert.equal(isTrustedReleaseApiUrl(DEFAULT_UPDATE_RELEASE_API_URL), true);

const directPosition = channel.indexOf('if (isTrustedManifestUrl())');
const apiPosition = channel.indexOf('if (isTrustedReleaseApiUrl())');
assert.ok(directPosition >= 0 && apiPosition > directPosition, 'O manifesto fixo deve ser consultado antes da API Latest.');
assert.match(channel, /A rota principal é o manifesto fixo/);
assert.match(channel, /Release reserva:/);
assert.match(channel, /Canal direto:/);
assert.match(panel, /Canal automático direto/);
assert.match(panel, /Release imutável de reserva/);

assert.match(workflow, /Gerar APK v27\.24 e publicar atualização automática direta/);
assert.match(workflow, /legacy\['releaseTag'\] = release_tag/);
assert.match(workflow, /releases\/download\/\{release_tag\}\/\{asset_name\}/);
assert.doesNotMatch(workflow, /gh release upload buildmaster-latest "dist-apk\/\$APK_ASSET_NAME"/);
assert.match(workflow, /A release fixa guarda somente o manifesto ativo/);
assert.match(workflow, /Ponte antiga aprovada|Validar canal independente publicamente/);
assert.match(workflow, /Reserva: API releases\/latest|API Latest permanece como terceira rota/);

console.log('✓ v27.24: canal fixo direto como rota principal, APK imutável único e API Latest como reserva aprovados.');
