import assert from 'node:assert/strict';
import fs from 'node:fs';

const workflow = fs.readFileSync('.github/workflows/build-apk.yml', 'utf8');
const updates = fs.readFileSync('src/lib/appUpdates.ts', 'utf8');
const panel = fs.readFileSync('src/components/UpdateCenterPanel.tsx', 'utf8');
const nativePlugin = fs.readFileSync('scripts/install-android-security-plugin.mjs', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8')) as { version: string };

assert.equal(pkg.version, '27.20.0');
assert.match(workflow, /RUN_ATTEMPT: \$\{\{ github\.run_attempt \}\}/);
assert.match(workflow, /asset_token = f'\{version_code\}\{attempt:02d\}'/);
assert.match(workflow, /APK_PUBLICATION_ID=/);
assert.match(workflow, /apkUrl': f'https:\/\/github\.com\/\{repo\}\/releases\/download\/buildmaster-latest\/\{asset_name\}\?publication=/);
assert.doesNotMatch(workflow, /'apkUrl': f'.*BuildMaster-Elite-Tatico-latest\.apk/);
assert.match(workflow, /gh release upload buildmaster-latest "dist-apk\/\$APK_ASSET_NAME"\n/);
assert.doesNotMatch(workflow, /gh release upload buildmaster-latest "dist-apk\/\$APK_ASSET_NAME" --clobber/);
assert.match(workflow, /Validar propagação pública antes do manifesto/);
assert.match(workflow, /Publicar atalhos e manifesto por último/);
assert.ok(workflow.indexOf('Validar propagação pública antes do manifesto') < workflow.indexOf('Publicar atalhos e manifesto por último'));
assert.match(workflow, /Accept-Encoding: identity/);
assert.match(workflow, /cancel-in-progress: false/);

assert.match(updates, /BuildMaster-Elite-Tatico-v\\d\+\\\.\\d\+\\\.\\d\+-\\d\+-\[a-f0-9\]/i);
assert.match(panel, /evaluateUpdateManifest\(await fetchManifestJson\(\), current, CURRENT_BUILD_ID, ''\)/);
assert.match(panel, /Nunca instala usando apenas o manifesto guardado/);
assert.match(nativePlugin, /bmDownloadAttempt=/);
assert.match(nativePlugin, /connection\.setUseCaches\(false\)/);
assert.match(nativePlugin, /connection\.setRequestProperty\("Accept-Encoding", "identity"\)/);
assert.match(nativePlugin, /downloadAttempt <= 3/);

console.log('✓ v27.20: APK único por tentativa, pré-validação pública, manifesto por último e download sem cache aprovados.');
