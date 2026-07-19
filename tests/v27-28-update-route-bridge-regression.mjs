import assert from 'node:assert/strict';
import fs from 'node:fs';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const workflow = fs.readFileSync('.github/workflows/build-apk.yml', 'utf8');
const plugin = fs.readFileSync('scripts/install-android-security-plugin.mjs', 'utf8');
const channel = fs.readFileSync('src/lib/updateChannel.ts', 'utf8');
const panel = fs.readFileSync('src/components/UpdateCenterPanel.tsx', 'utf8');

assert.equal(pkg.version, '27.28.0');
assert.match(workflow, /primary\['releaseTag'\] = 'buildmaster-latest'/);
assert.match(workflow, /releases\/download\/buildmaster-latest\/\{asset_name\}/);
assert.match(workflow, /Publicar APK versionado na ponte fixa/);
assert.match(workflow, /Publicar canal principal somente após o APK versionado/);
assert.ok(
  workflow.indexOf('Publicar APK versionado na ponte fixa') < workflow.indexOf('Publicar canal principal somente após o APK versionado'),
  'O APK versionado precisa existir e ser validado antes do manifesto principal.'
);
assert.match(workflow, /BuildMaster-Elite-Tatico-Updater\/27\.26 Android/);
assert.match(workflow, /O nome é único por execução\. Nunca usamos --clobber/);
assert.match(plugin, /if \(!isMutableLatestUrl\(source\)\) return source;/);
assert.match(plugin, /openAutomaticDownloadConnection/);
assert.match(plugin, /openManualDownloadConnection/);
assert.match(plugin, /recebido=" \+ actualChecksum\.substring\(0, 12\)/);
assert.match(channel, /alternatives: UpdateManifestCandidate\[\]/);
assert.match(channel, /uniqueAlternatives/);
assert.match(panel, /fetched\.alternatives/);
assert.match(panel, /Tentando a origem oficial/);
assert.match(panel, /Detalhe técnico:/);

console.log('✓ v27.28: ponte versionada, validação com cliente Android, rotas reais e diagnóstico de hash aprovados.');
