import assert from 'node:assert/strict';
import fs from 'node:fs';

const workflow = fs.readFileSync('.github/workflows/build-apk.yml', 'utf8');
const updates = fs.readFileSync('src/lib/appUpdates.ts', 'utf8');
const panel = fs.readFileSync('src/components/UpdateCenterPanel.tsx', 'utf8');
const nativePlugin = fs.readFileSync('scripts/install-android-security-plugin.mjs', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8')) as { version: string };

assert.equal(pkg.version, '27.25.0');
assert.match(workflow, /RUN_ATTEMPT: \$\{\{ github\.run_attempt \}\}/);
assert.match(workflow, /asset_token = f'\{version_code\}\{attempt:02d\}'/);
assert.match(workflow, /APK_PUBLICATION_ID=/);
assert.match(workflow, /release_tag = f'buildmaster-v\{version\}-\{version_code\}-\{attempt:02d\}'/);
assert.match(workflow, /manifest_asset = f'update-manifest-v\{version\}-\{version_code\}\.json'/);
assert.match(workflow, /legacy\['apkUrl'\] = \([\s\S]*releases\/download\/\{release_tag\}\/\{asset_name\}[\s\S]*bridge=/);
assert.match(workflow, /Criar release imutável em espera/);
assert.match(workflow, /Validar release imutável publicamente/);
assert.match(workflow, /Ativar release nova como Latest/);
assert.match(workflow, /Preparar endereço fixo do canal automático/);
assert.match(workflow, /Accept-Encoding: identity/);
assert.match(workflow, /cancel-in-progress: false/);

assert.match(updates, /DEFAULT_UPDATE_RELEASE_API_URL/);
assert.match(updates, /buildmaster-v\\d\+\\\.\\d\+\\\.\\d\+-\\d\+/i);
assert.match(panel, /const fetched = await fetchUpdateManifest\(\)/);
assert.match(panel, /evaluateUpdateManifest\(fetched\.payload, current, CURRENT_BUILD_ID/);
assert.match(panel, /Nunca instala usando apenas o manifesto guardado/);
assert.match(nativePlugin, /bmDownloadAttempt=/);
assert.match(nativePlugin, /connection\.setUseCaches\(false\)/);
assert.match(nativePlugin, /connection\.setRequestProperty\("Accept-Encoding", "identity"\)/);
assert.match(nativePlugin, /MAX_DOWNLOAD_ATTEMPTS = 4/);

console.log('✓ compatibilidade v27.20: ativo único, sem cache e canal antigo preservado na arquitetura v27.25.');
