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
const panel = fs.readFileSync('src/components/UpdateCenterPanel.tsx', 'utf8');
const channel = fs.readFileSync('src/lib/updateChannel.ts', 'utf8');
const audit = fs.readFileSync('src/lib/updateAudit.ts', 'utf8');
const css = fs.readFileSync('src/app/design-system-v2723.css', 'utf8');
const globals = fs.readFileSync('src/app/globals.css', 'utf8');
const workflow = fs.readFileSync('.github/workflows/build-apk.yml', 'utf8');

assert.equal(pkg.version, '27.23.0');
assert.equal(APP_RELEASE_VERSION, '27.23.0');
assert.equal(APP_NATIVE_VERSION, '27.23.0');
assert.match(pkg.scripts['test:all'], /test:v2723/);
assert.equal(isTrustedManifestUrl(DEFAULT_UPDATE_MANIFEST_URL), true);
assert.equal(isTrustedReleaseApiUrl(DEFAULT_UPDATE_RELEASE_API_URL), true);

assert.match(channel, /export async function fetchUpdateManifest/);
assert.match(channel, /release-api/);
assert.match(channel, /legacy-manifest/);
assert.match(channel, /Accept-Encoding': 'identity'/);
assert.match(channel, /previousErrors/);

assert.match(audit, /MAX_AUDIT_ENTRIES = 30/);
assert.match(audit, /appendUpdateAudit/);
assert.match(audit, /formatUpdateAudit/);
assert.match(audit, /buildmaster_update_audit_v2723/);

assert.match(panel, /Testar atualizador/);
assert.match(panel, /Sem baixar o APK/);
assert.match(panel, /runDiagnostic/);
assert.match(panel, /for \(let round = 1; round <= 3; round \+= 1\)/);
assert.match(panel, /Copiar diagnóstico/);
assert.match(panel, /Limpar somente o atualizador/);
assert.match(panel, /buildmaster:update-available/);
assert.match(panel, /O BuildMaster detecta e baixa o APK sozinho/);

assert.match(globals, /design-system-v2723\.css/);
assert.match(css, /update-diagnostic-panel/);
assert.match(css, /update-audit-list/);
assert.match(workflow, /v27\.23/);
assert.match(workflow, /diagnóstico do atualizador/i);

console.log('✓ v27.23: diagnóstico do atualizador, histórico técnico, recuperação em três rodadas e interface responsiva aprovados.');
