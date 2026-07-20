import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { APP_DATA_VERSION, CURRENT_DATA_SCHEMA, createBackupEnvelope, validateBackupEnvelope } from '../src/lib/dataSafety';
import { APP_NATIVE_VERSION, APP_RELEASE_VERSION } from '../src/lib/appUpdates';

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');
const pkg = JSON.parse(read('package.json')) as { version: string; scripts: Record<string, string> };

assert.equal(pkg.version, '27.34.0');
assert.equal(APP_RELEASE_VERSION, pkg.version);
assert.equal(APP_NATIVE_VERSION, pkg.version);
assert.equal(APP_DATA_VERSION, pkg.version);
assert.equal(CURRENT_DATA_SCHEMA, 2729);
assert.match(pkg.scripts['test:all'], /^npm run test:v2734 && npm run test:v2733 && npm run test:v2729/);
assert.equal(pkg.scripts['quality:audit'], 'node scripts/audit-project.mjs');

const native = read('scripts/install-android-security-plugin.mjs');
assert.match(native, /AtomicBoolean/);
assert.match(native, /Accept-Encoding", "identity/);
assert.match(native, /maxAttempts/);
assert.match(native, /downloadWithSystemManager/);
assert.match(native, /downloadWithHttpStream/);
assert.match(native, /responseHost/);
assert.match(native, /signaturesCompatible/);

const updateCenter = read('src/components/UpdateCenterPanel.tsx');
assert.match(updateCenter, /rankUpdateCandidatesByHealth/);
assert.match(updateCenter, /recordUpdateRouteFailure/);
assert.match(updateCenter, /recordUpdateRouteSuccess/);
assert.match(updateCenter, /maxAttempts: 4/);

const app = read('src/components/CardVisionApp.tsx');
assert.match(app, /SectionErrorBoundary/);
assert.match(app, /PanelLoadingFallback/);
assert.match(app, /APP_RELEASE_VERSION/);
assert.doesNotMatch(app, /localStorage\./);

const globals = read('src/app/globals.css');
assert.match(globals, /design-system-v2729\.css/);
const finalCss = read('src/app/design-system-v2729.css');
assert.match(finalCss, /safe-area-inset-bottom/);
assert.match(finalCss, /focus-visible/);
assert.match(finalCss, /prefers-reduced-motion/);
assert.match(finalCss, /content-visibility/);

const workflow = read('.github/workflows/build-apk.yml');
assert.match(workflow, /contents: write/);
assert.match(workflow, /npm run quality:audit/);
assert.match(workflow, /BuildMaster-Elite-Tatico-latest\.apk/);
assert.match(workflow, /Validar release imutável publicamente/);
assert.doesNotMatch(workflow, /\n\s+-f content="\$CONTENT"[^\n]+\n\s+-f content="\$CONTENT"/);

const backup = createBackupEnvelope({ history: [{ id: '1', result: {} }], settings: {} }, '2026-07-19T12:00:00.000Z');
assert.equal(validateBackupEnvelope(backup).valid, true);
const polluted = JSON.parse('{"app":"BuildMaster Elite Tático","version":"27.33.0","schema":2729,"exportedAt":"2026-07-19T12:00:00.000Z","checksum":"bad","sections":{"settings":{"__proto__":{"admin":true}}}}');
const checked = validateBackupEnvelope(polluted);
assert.equal(checked.valid, false);
assert.ok(checked.issues.some((issue) => issue.code === 'checksum'));

assert.equal(fs.existsSync(path.join(root, 'public/update-manifest.json')), false);
assert.equal(fs.existsSync(path.join(root, 'src/lib/safeLocalStorage.ts')), true);
assert.equal(fs.existsSync(path.join(root, 'src/lib/updateRouteHealth.ts')), true);
assert.equal(fs.existsSync(path.join(root, 'scripts/audit-project.mjs')), true);

console.log('✓ v27.29: auditoria total, atualização resiliente, dados protegidos, acessibilidade e isolamento de falhas aprovados.');
